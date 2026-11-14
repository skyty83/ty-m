'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, Search } from 'lucide-react';
import { collectionHref, getCollection, getRecommendSheets, getSheetTags, getTopLists, type SheetTag } from '@/lib/api';
import { useRecent } from '@/lib/storage';
import type { Sheet, Song, TopListGroup, TopListItem } from '@/lib/types';
import { Page } from '@/components/Page';
import { Brand } from '@/components/Nav';
import { CardGrid, MediaCard, Shelf } from '@/components/MediaCard';
import { CardSkeleton, Chip, Cover, ErrorBox, SectionHead, Sentinel, Sk, safeImg } from '@/components/ui';
import { usePlayer } from '@/components/PlayerProvider';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function greeting(h: number) {
  if (h < 5) return '夜深了，听首歌再睡';
  if (h < 11) return '早上好';
  if (h < 13) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

// 榜单歌曲没有封面, 统一缓存一次详情, 首页多个模块共用
const chartCache = new Map<string, Promise<Song[]>>();
function loadChart(item: TopListItem) {
  if (!chartCache.has(item.id)) {
    const p = getCollection('chart', item, 1).then(r => r.songs).catch(e => { chartCache.delete(item.id); throw e; });
    chartCache.set(item.id, p);
  }
  return chartCache.get(item.id)!;
}

function useChartSongs(item?: TopListItem) {
  const [songs, setSongs] = useState<Song[] | null>(null);
  useEffect(() => {
    if (!item) return;
    let alive = true;
    loadChart(item).then(s => { if (alive) setSongs(s); }).catch(() => { if (alive) setSongs([]); });
    return () => { alive = false; };
  }, [item]);
  return songs;
}

/* ── 首屏: 今日热歌 ─────────────────────────────────────── */
function HeroChart({ item }: { item?: TopListItem }) {
  const songs = useChartSongs(item);
  const { playList, current, playing } = usePlayer();
  const top = songs?.slice(0, 5) ?? [];
  const art = safeImg(item?.coverImg);

  return (
    <section aria-label="今日热歌" className="relative overflow-hidden rounded-[20px] bg-surface shadow-card">
      {art && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" aria-hidden="true" referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-3xl saturate-150 dark:opacity-30" />
      )}
      <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10">
        <div className="flex items-center gap-5 md:flex-col md:items-start md:justify-between">
          <Cover src={item?.coverImg} priority className="h-28 w-28 shadow-float sm:h-36 sm:w-36 md:h-44 md:w-44" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-accent">今日热歌</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{item?.title ?? <Sk className="h-8 w-40" />}</h1>
            {item?.description && <p className="mt-2 line-clamp-2 max-w-[40ch] text-sm leading-relaxed text-sub">{item.description.replace(/^榜单规则[：:]/, '')}</p>}
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => songs && playList(songs, 0)}
                disabled={!songs?.length}
                className="press inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-onaccent shadow-card disabled:opacity-50"
              >
                <Play className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />播放全部
              </button>
              {item && (
                <Link href={collectionHref('chart', item)} className="press inline-flex h-11 items-center rounded-full bg-surface-2 px-5 text-[15px] font-medium">
                  完整榜单
                </Link>
              )}
            </div>
          </div>
        </div>

        <ol className="flex flex-col justify-center" aria-label="榜单前五">
          {!songs && Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 py-2.5"><Sk className="h-5 w-5" /><Sk className="h-4 flex-1" /></li>
          ))}
          {top.map((s, i) => {
            const on = current?.id === s.id;
            return (
              <li key={s.id}>
                <button onClick={() => playList(songs!, i)}
                  className="group flex w-full items-center gap-4 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2/70">
                  <span className={`w-5 text-center text-lg font-bold italic tabular-nums ${i < 3 ? 'text-accent' : 'text-sub'}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[15px] font-medium ${on ? 'text-accent' : ''}`}>{s.title}</span>
                    <span className="block truncate text-xs text-sub">{s.artist}</span>
                  </span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-ink text-bg transition-opacity ${on && playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <Play className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ── 官方榜: 封面 + 前三首预览 ─────────────────────────── */
function ChartCard({ item, index }: { item: TopListItem; index: number }) {
  const songs = useChartSongs(item);
  const { playList } = usePlayer();
  return (
    <div className="rise flex w-[82vw] max-w-[360px] shrink-0 snap-start items-stretch gap-4 rounded-2xl bg-surface p-3 shadow-card sm:w-[340px]"
      style={{ '--i': index } as React.CSSProperties} role="listitem">
      <Link href={collectionHref('chart', item)} className="group relative shrink-0" aria-label={`查看 ${item.title}`}>
        <Cover src={item.coverImg} className="h-[108px] w-[108px]" />
        <span
          role="button"
          tabIndex={0}
          aria-label={`播放 ${item.title}`}
          onClick={e => { e.preventDefault(); if (songs?.length) playList(songs, 0); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (songs?.length) playList(songs, 0); } }}
          className="press absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#17171a] shadow-card"
        >
          <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
        </span>
      </Link>
      <Link href={collectionHref('chart', item)} className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <span className="flex items-center gap-0.5 font-semibold">
          <span className="truncate">{item.title}</span><ChevronRight className="h-4 w-4 shrink-0 text-sub" />
        </span>
        <ol className="flex flex-col gap-1.5">
          {(songs?.slice(0, 3) ?? [null, null, null]).map((s, i) => (
            <li key={i} className="flex min-w-0 items-baseline gap-2 text-[13px]">
              <span className={`font-bold italic ${i === 0 ? 'text-accent' : 'text-sub'}`}>{i + 1}</span>
              {s ? (
                <span className="min-w-0 truncate"><span className="text-ink">{s.title}</span><span className="text-sub"> - {s.artist}</span></span>
              ) : <Sk className="h-3 flex-1" />}
            </li>
          ))}
        </ol>
      </Link>
    </div>
  );
}

/* ── 推荐歌单 (标签筛选 + 无限滚动) ─────────────────────── */
const ALL_TAG: SheetTag = { id: '', title: '精选' };

function Playlists() {
  const [tags, setTags] = useState<SheetTag[]>([ALL_TAG]);
  const [tag, setTag] = useState<SheetTag>(ALL_TAG);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const req = useRef(0);

  useEffect(() => { getSheetTags().then(t => setTags([ALL_TAG, ...t])).catch(() => {}); }, []);

  const load = useCallback(async (t: SheetTag, p: number) => {
    const id = ++req.current;
    setLoading(true);
    setError('');
    try {
      const r = await getRecommendSheets(p, t);
      if (id !== req.current) return;
      setSheets(prev => {
        const base = p === 1 ? [] : prev;
        const ids = new Set(base.map(s => String(s.id)));
        return [...base, ...r.data.filter(s => !ids.has(String(s.id)))];
      });
      setPage(p);
      setDone(!!r.isEnd || r.data.length === 0);
    } catch (e) {
      if (id === req.current) setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      if (id === req.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 切换标签时重新加载
    load(tag, 1);
  }, [tag, load]);

  return (
    <section>
      <SectionHead title="推荐歌单" />
      <div className="scrollbar-hide -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {tags.map(t => (
          <Chip key={t.id || 'all'} on={t.id === tag.id} onClick={() => { if (t.id !== tag.id) { setSheets([]); setPage(0); setDone(false); setTag(t); } }}>
            {t.title}
          </Chip>
        ))}
      </div>
      {error && page === 0 ? (
        <ErrorBox message={error} onRetry={() => load(tag, 1)} />
      ) : (
        <CardGrid>
          {sheets.map((s, i) => (
            <MediaCard key={s.id} index={i} href={collectionHref('playlist', s)} title={s.title} artwork={s.artwork} count={s.playCount} />
          ))}
          {page === 0 && <CardSkeleton count={10} />}
        </CardGrid>
      )}
      {page > 0 && <Sentinel onHit={() => { if (!loading && !done) load(tag, page + 1); }} done={done} loading={loading} />}
    </section>
  );
}

/* ── 页面 ─────────────────────────────────────────────── */
export default function Home() {
  const recent = useRecent();
  const { playList, current } = usePlayer();
  const [charts, setCharts] = useState<TopListGroup[] | null>(null);
  const [chartErr, setChartErr] = useState('');
  const [today, setToday] = useState({ hello: '你好', date: '' });

  const loadCharts = useCallback(() => {
    setChartErr('');
    getTopLists().then(setCharts).catch(e => setChartErr(e.message));
  }, []);

  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 日期依赖客户端时区
    setToday({ hello: greeting(d.getHours()), date: `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEK[d.getDay()]}` });
    loadCharts();
  }, [loadCharts]);

  const official = charts?.[0];
  const hero = official?.data[0];
  const others = official?.data.slice(1, 7) ?? [];
  const moreGroups = charts?.slice(1) ?? [];

  return (
    <Page className="flex flex-col gap-11">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Brand className="mb-4 lg:hidden" />
          <p className="text-sm text-sub">{today.date}</p>
          <p className="mt-0.5 text-[28px] font-bold tracking-tight sm:text-[32px]">{today.hello}</p>
        </div>
        <Link href="/search" aria-label="搜索"
          className="press flex h-11 shrink-0 items-center gap-2 rounded-full bg-surface px-4 text-sm text-sub shadow-card sm:w-64 lg:hidden">
          <Search className="h-[18px] w-[18px]" /><span className="hidden sm:inline">搜索歌曲、歌手</span>
        </Link>
      </header>

      {recent.length > 0 && (
        <section aria-label="最近播放" className="-mt-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
            {recent.slice(0, 6).map((s, i) => (
              <button key={s.id} onClick={() => playList(recent, i)}
                className={`press group flex min-w-0 items-center gap-3 overflow-hidden rounded-xl bg-surface pr-3 text-left shadow-card transition-colors hover:bg-surface-2 ${i >= 4 ? 'hidden sm:flex' : ''}`}>
                <Cover src={s.artwork} className="h-14 w-14" rounded="rounded-none" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-semibold ${current?.id === s.id ? 'text-accent' : ''}`}>{s.title}</span>
                  <span className="block truncate text-xs text-sub">{s.artist}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {chartErr ? <ErrorBox message={chartErr} onRetry={loadCharts} /> : <HeroChart item={hero} />}

      <section>
        <SectionHead title="官方榜" />
        <Shelf label="官方榜">
          {others.length
            ? others.map((it, i) => <ChartCard key={it.id} item={it} index={i} />)
            : Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-[132px] w-[82vw] max-w-[360px] shrink-0 !rounded-2xl sm:w-[340px]" />)}
        </Shelf>
      </section>

      {moreGroups.map(group => (
        <section key={group.title}>
          <SectionHead title={group.title} />
          <Shelf label={group.title}>
            {group.data.map((item, i) => (
              <div key={item.id} role="listitem" className="w-[36vw] max-w-[168px] shrink-0 snap-start sm:w-[152px]">
                <MediaCard index={i} href={collectionHref('chart', item)} title={item.title} artwork={item.coverImg} />
              </div>
            ))}
          </Shelf>
        </section>
      ))}

      <Playlists />
    </Page>
  );
}
