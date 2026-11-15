import type { Album, Artist, CollectionKind, Paged, Sheet, Song, TopListGroup } from './types';

// 브라우저는 HTTP/1.1 에서 같은 호스트에 최대 6개 연결만 연다. 느린 외부 API 요청이 이 슬롯을 다 차지하면
// 메뉴 이동(페이지 RSC 요청)·이미지·오디오가 뒤에서 대기해 클릭이 먹통처럼 느껴지므로 동시 요청 수를 제한한다.
// 앨범아트 보완 같은 부가 요청은 low 우선순위로 가장 나중에, 최대 1개씩만 처리한다.
const MAX_ACTIVE = 3;
const MAX_LOW = 1;
let active = 0;
let activeLow = 0;
const queue: { low: boolean; run: () => void }[] = [];

function pump() {
  for (let i = 0; i < queue.length && active < MAX_ACTIVE; ) {
    const job = queue[i];
    if (job.low && activeLow >= MAX_LOW) { i++; continue; }
    queue.splice(i, 1);
    job.run();
  }
}

function schedule<T>(task: () => Promise<T>, low: boolean): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const job = {
      low,
      run: () => {
        active++;
        if (low) activeLow++;
        task().then(resolve, reject).finally(() => {
          active--;
          if (low) activeLow--;
          pump();
        });
      },
    };
    if (low) queue.push(job);
    else {
      // 일반 요청은 대기 중인 low 요청보다 앞에 둔다
      const firstLow = queue.findIndex(j => j.low);
      if (firstLow < 0) queue.push(job); else queue.splice(firstLow, 0, job);
    }
    pump();
  });
}

export function apiCall<T>(action: string, args: unknown[] = [], opts: { low?: boolean } = {}): Promise<T> {
  // 재생 주소는 사용자가 기다리는 요청이므로 대기열을 건너뛴다
  if (action === 'getMediaSource') return rawApiCall<T>(action, args);
  return schedule(() => rawApiCall<T>(action, args), !!opts.low);
}

async function rawApiCall<T>(action: string, args: unknown[]): Promise<T> {
  const res = await fetch('/api/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as T;
}

// 플러그인이 넘겨주는 추가 필드(formats 등)를 버리고 필요한 것만 남긴다
export function toSong(raw: Partial<Song> & { id: string | number }): Song {
  return {
    id: String(raw.id),
    title: raw.title || '未知歌曲',
    artist: raw.artist || '未知歌手',
    album: raw.album || undefined,
    artwork: raw.artwork || undefined,
    albumId: raw.albumId ? String(raw.albumId) : undefined,
    artistId: raw.artistId ? String(raw.artistId) : undefined,
  };
}

export type SearchType = 'music' | 'album' | 'artist' | 'sheet';
type SearchResult = { music: Song; album: Album; artist: Artist; sheet: Sheet };

export async function search<K extends SearchType>(query: string, page: number, type: K, low = false): Promise<Paged<SearchResult[K]>> {
  const r = await apiCall<Paged<SearchResult[K]>>('search', [query, page, type], { low });
  const data = (r.data || []) as SearchResult[K][];
  return { isEnd: r.isEnd ?? data.length === 0, data: type === 'music' ? (data as Song[]).map(toSong) as SearchResult[K][] : data };
}

export async function getTopLists(): Promise<TopListGroup[]> {
  const r = await apiCall<TopListGroup[] | { data?: TopListGroup[] }>('getTopLists');
  return Array.isArray(r) ? r : r.data || [];
}

export async function getRecommendSheets(page = 1, tag: { id?: string; digest?: string } = { id: '' }): Promise<Paged<Sheet>> {
  const r = await apiCall<Paged<Sheet>>('getRecommendSheetsByTag', [tag, page]);
  return { isEnd: r.isEnd, data: r.data || [] };
}

export interface SheetTag { id: string; title: string; digest?: string }

export async function getSheetTags(): Promise<SheetTag[]> {
  const r = await apiCall<{ pinned?: SheetTag[]; data?: { title: string; data: SheetTag[] }[] }>('getRecommendSheetTags');
  return r.pinned || [];
}

export async function getMediaUrl(song: Song): Promise<string> {
  const r = await apiCall<{ url?: string }>('getMediaSource', [song, 'standard']);
  if (!r.url) throw new Error('无法获取播放地址');
  return r.url;
}

export async function getLyric(song: Song): Promise<string> {
  try {
    const r = await apiCall<{ rawLrc?: string; lrc?: string }>('getLyric', [song]);
    return r.rawLrc || r.lrc || '';
  } catch {
    return '';
  }
}

const artCache = new Map<string, Promise<string | undefined>>();

// 검색 API 로 같은 곡을 찾아 앨범아트를 가져오고, 없으면 곡 정보 API(m.kuwo.cn, 자주 실패)로 대체
export function getArtwork(song: Song): Promise<string | undefined> {
  if (!artCache.has(song.id)) {
    const p = (async () => {
      try {
        const r = await search(`${song.title} ${song.artist}`, 1, 'music', true);
        const hit = r.data.find(x => x.id === song.id && x.artwork) || r.data.find(x => x.title === song.title && x.artwork);
        if (hit?.artwork) return hit.artwork;
      } catch { /* 곡 정보 API 로 대체 */ }
      try {
        const r = await apiCall<{ artwork?: string }>('getMusicInfo', [song], { low: true });
        return r.artwork;
      } catch {
        return undefined;
      }
    })();
    artCache.set(song.id, p);
  }
  return artCache.get(song.id)!;
}

// 상세 페이지(차트/앨범/아티스트/플레이리스트)의 곡 목록
export async function getCollection(
  kind: CollectionKind,
  item: { id: string; artwork?: string; title?: string },
  page: number,
): Promise<{ songs: Song[]; isEnd: boolean }> {
  type ML = { musicList?: Song[]; data?: Song[]; isEnd?: boolean };
  let r: ML;
  switch (kind) {
    case 'chart':
      r = await apiCall<ML>('getTopListDetail', [item, page]);
      return { songs: (r.musicList || []).map(toSong), isEnd: true };
    case 'album':
      r = await apiCall<ML>('getAlbumInfo', [item, page]);
      return { songs: (r.musicList || []).map(s => toSong({ ...s, artwork: s.artwork || item.artwork })), isEnd: true };
    case 'artist':
      r = await apiCall<ML>('getArtistWorks', [item, page, 'music']);
      return { songs: (r.data || []).map(toSong), isEnd: r.isEnd ?? true };
    case 'playlist':
      r = await apiCall<ML>('getMusicSheetInfo', [item, page]);
      return { songs: (r.musicList || []).map(toSong), isEnd: r.isEnd ?? true };
  }
}

export function collectionHref(kind: CollectionKind, item: { id: string | number; title?: string; name?: string; artwork?: string; coverImg?: string; avatar?: string; artist?: string }) {
  const p = new URLSearchParams();
  const title = item.title || item.name;
  const art = item.artwork || item.coverImg || item.avatar;
  if (title) p.set('t', title);
  if (art) p.set('a', art);
  if (item.artist) p.set('s', item.artist);
  return `/list/${kind}/${encodeURIComponent(String(item.id))}?${p.toString()}`;
}
