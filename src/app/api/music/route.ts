import { NextRequest, NextResponse } from 'next/server';
import vm from 'vm';
import axios from 'axios';
import * as CryptoJs from 'crypto-js';
import * as he from 'he';

// vod-site 의 /api/music 과 동일한 구조: 허용된 MusicFree 플러그인을 서버에서 샌드박스로 실행
export const runtime = 'nodejs';
// 플러그인 다운로드 + 외부 API 호출 시간을 고려 (Vercel 함수 제한)
export const maxDuration = 30;

type PluginApi = Record<string, (...args: unknown[]) => unknown>;
// 동시에 들어온 요청이 플러그인을 각자 내려받지 않도록 Promise 를 캐시 (실패 시 제거해 재시도)
const scriptCache: Record<string, Promise<PluginApi>> = {};

const DEFAULT_PLUGIN = 'https://raw.githubusercontent.com/Huibq/keep-alive/master/Music_Free/xiaowo.js';

// 임의 스크립트 실행 방지: 이 플러그인만 허용
const ALLOWED_PLUGINS = new Set([DEFAULT_PLUGIN]);

// 읽기 전용 메서드만 허용 (constructor 등 프로토타입 속성 호출 방지)
const ALLOWED_ACTIONS = new Set([
  'search',
  'getMediaSource',
  'getLyric',
  'getMusicInfo',
  'getTopLists',
  'getTopListDetail',
  'getAlbumInfo',
  'getArtistWorks',
  'getMusicSheetInfo',
  'getRecommendSheetTags',
  'getRecommendSheetsByTag',
]);

// 재생 URL 은 만료되므로 캐시하지 않는다. 나머지는 짧게 메모리 캐시
const CACHE_TTL: Record<string, number> = {
  getTopLists: 30 * 60_000,
  getRecommendSheetTags: 60 * 60_000,
  getRecommendSheetsByTag: 10 * 60_000,
  getTopListDetail: 10 * 60_000,
  getAlbumInfo: 30 * 60_000,
  getArtistWorks: 10 * 60_000,
  getMusicSheetInfo: 10 * 60_000,
  getLyric: 60 * 60_000,
  getMusicInfo: 60 * 60_000,
  search: 5 * 60_000,
};
const resultCache = new Map<string, { at: number; value: unknown }>();
const MAX_CACHE = 500;
// 같은 요청이 동시에 여러 번 오면 외부 API 는 한 번만 호출하고 결과를 공유
const inflight = new Map<string, Promise<Out>>();

function loadPlugin(pluginUrl: string): Promise<PluginApi> {
  if (!scriptCache[pluginUrl]) {
    scriptCache[pluginUrl] = fetchPlugin(pluginUrl).catch(e => { delete scriptCache[pluginUrl]; throw e; });
  }
  return scriptCache[pluginUrl];
}

async function fetchPlugin(pluginUrl: string): Promise<PluginApi> {
  const scriptRes = await fetch(pluginUrl);
  if (!scriptRes.ok) throw new Error(`Plugin download failed: ${scriptRes.status}`);
  const scriptText = await scriptRes.text();

  const sandbox = {
    require: (moduleName: string) => {
      if (moduleName === 'axios') return axios;
      if (moduleName === 'crypto-js') return CryptoJs;
      if (moduleName === 'he') return he;
      throw new Error(`Module ${moduleName} not allowed in sandbox`);
    },
    exports: {},
    module: { exports: {} },
    console,
    process: { env: {} },
    Buffer,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };

  vm.createContext(sandbox);
  vm.runInContext(scriptText, sandbox, { timeout: 5000 });
  return (Object.keys(sandbox.exports).length > 0 ? sandbox.exports : sandbox.module.exports) as PluginApi;
}

type Out = { status: number; json: unknown };

// 플러그인 실행. Response 는 한 번만 보낼 수 있으므로 동시 요청이 공유할 수 있게 일반 값으로 돌려준다
async function execute(pluginUrl: string, action: string, args: unknown[] | undefined, ttl: number | undefined, cacheKey: string): Promise<Out> {
  const plugin = await loadPlugin(pluginUrl);
  if (!Object.prototype.hasOwnProperty.call(plugin, action) || typeof plugin[action] !== 'function') {
    return { status: 400, json: { error: `Action ${action} not found in plugin` } };
  }

  let result: Record<string, unknown> | undefined;
  try {
    result = (await plugin[action](...(args || []))) as Record<string, unknown> | undefined;
  } catch (err) {
    // 가사가 없는 곡은 플러그인이 예외를 던진다 → 빈 가사로 응답
    if (action === 'getLyric') return { status: 200, json: { rawLrc: '' } };
    throw err;
  }

  if (result === undefined) {
    return { status: 200, json: { error: 'Plugin returned undefined', isEnd: true, data: [] } };
  }

  // 재생 주소는 대부분 http → https 사이트에서 혼합 콘텐츠로 차단되므로 자체 스트림 프록시 경유
  if (action === 'getMediaSource' && typeof result.url === 'string' && /^https?:\/\//.test(result.url)) {
    result.url = `/api/music/stream?u=${encodeURIComponent(result.url)}`;
  }

  const safeResult = JSON.parse(JSON.stringify(result, (_key, value) => {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'function') return undefined;
    return value;
  }));

  if (ttl) {
    if (resultCache.size >= MAX_CACHE) {
      const oldest = resultCache.keys().next().value;
      if (oldest) resultCache.delete(oldest);
    }
    resultCache.set(cacheKey, { at: Date.now(), value: safeResult });
  }

  return { status: 200, json: safeResult };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { pluginUrl = DEFAULT_PLUGIN, action, args } = body;

    if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Action not allowed' }, { status: 400 });
    }
    if (args !== undefined && !Array.isArray(args)) {
      return NextResponse.json({ error: 'args must be an array' }, { status: 400 });
    }
    if (!ALLOWED_PLUGINS.has(pluginUrl)) {
      return NextResponse.json({ error: 'Plugin not allowed' }, { status: 403 });
    }

    const ttl = CACHE_TTL[action];
    const cacheKey = ttl ? `${action}:${JSON.stringify(args ?? [])}` : '';
    if (ttl) {
      const hit = resultCache.get(cacheKey);
      if (hit && Date.now() - hit.at < ttl) return NextResponse.json(hit.value);
    }

    let run = cacheKey ? inflight.get(cacheKey) : undefined;
    if (!run) {
      run = execute(pluginUrl, action, args, ttl, cacheKey);
      if (cacheKey) {
        inflight.set(cacheKey, run);
        run.finally(() => inflight.delete(cacheKey)).catch(() => {});
      }
    }
    const out = await run;
    return NextResponse.json(out.json, { status: out.status });
  } catch (e: unknown) {
    console.error('Plugin execution error:', e);
    return NextResponse.json({ error: e instanceof Error && e.message ? e.message : 'Unknown error' }, { status: 500 });
  }
}
