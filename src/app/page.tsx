'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Search } from 'lucide-react';
import { collectionHref, getRecommendSheets, getSheetTags, type SheetTag } from '@/lib/api';
import { loadTopLists, useChartSongs } from '@/lib/charts';
import { useRecent } from '@/lib/storage';
import type { Sheet, TopListGroup, TopListItem } from '@/lib/types';
import { Page, PageTitle } from '@/components/Page';
import { Brand } from '@/components/Nav';
import { CardGrid, MediaCard, Shelf } from '@/components/MediaCard';
import { CardSkeleton, Cover, ErrorBox, EqBars, PopButton, SectionHead, Sentinel, Sk, Tabs, pad2 } from '@/components/ui';
import { usePlayer } from '@/components/PlayerProvider';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

/* ── 今日热歌: 左封面 + 右侧 TOP10 大号排名 ───────────────── */
function TodayChart({ item }: { item?: TopListItem }) {
  const { songs } = useChartSongs(item);
  const { playList, current, playing } = usePlayer();
  const top = songs?.slice(0, 10) ?? [];

  return (
    <section aria-label="今日热歌" className="grid gap-8 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-5">
        <Link href={item ? collectionHref('chart', item) : '#'} className="group block">
          <Cover src={item?.coverImg} priority className="aspect-square w-full" />
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight">{item?.title ?? <Sk className="h-7 w-40" />}</h2>
            {item?.description && (
              <p className="mt-1.5 line-clamp-2 max-w-[44ch] text-sm leading-relaxed text-sub">{item.description.replace(/^榜单规则[：:]/, '')}</p>
            )}
          </div>
          {item && (
            <Link href={collectionHref('chart', item)} className="u-hover shrink-0 pt-1.5 text-sm font-semibold">完整榜单</Link>
          )}
        </div>
      </div>

      <ol className="grid content-start gap-x-8 md:col-span-7 xl:grid-cols-2" aria-label="榜单前十">
        {!songs && Array.from({ length: 10 }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 border-b border-line py-3.5"><Sk className="h-8 w-10" /><Sk className="h-4 flex-1" /></li>
        ))}
        {top.map((s, i) => {
          const on = current?.id === s.id;
          return (
            <li key={s.id} className="border-b border-line">
              <button onClick={() => playList(songs!, i)} className="group flex w-full items-center gap-4 py-3 text-left">
                <span className={`w-12 shrink-0 text-[34px] leading-none ${i < 3 ? 'rank-solid' : 'rank-outline'}`}>
                  {on && playing ? <EqBars on /> : pad2(i + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold">{on ? <span className="mark">{s.title}</span> : <span className="u-hover">{s.title}</span>}</span>
                  <span className="mt-0.5 block truncate text-xs text-sub">{s.artist}</span>
                </span>
                <Play className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" fill="currentColor" strokeWidth={0} />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ── 榜单票根: 封面 + 前三首 ────────────────────────────── */
function ChartTicket({ item, index }: { item: TopListItem; index: number }) {
  const { songs, ref } = useChartSongs(item, true);
  const { playList } = usePlayer();
  return (
    <div ref={ref} role="listitem" style={{ '--i': index } as React.CSSProperties}
      className="rise flex w-[78vw] max-w-[320px] shrink-0 snap-start flex-col border border-line-strong sm:w-[300px]">
      <div className="flex items-center justify-between gap-2 border-b border-line-strong px-4 py-3">
        <Link href={collectionHref('chart', item)} className="min-w-0 truncate font-black"><span className="u-hover">{item.title}</span></Link>
        <button onClick={() => songs?.length && playList(songs, 0)} disabled={!songs?.length} aria-label={`播放 ${item.title}`}
          className="press flex h-8 w-8 shrink-0 items-center justify-center bg-pop text-onpop disabled:opacity-40">
          <Play className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
        </button>
      </div>
      <Link href={collectionHref('chart', item)} className="flex gap-4 p-4">
        <Cover src={item.coverImg} className="h-20 w-20" />
        <ol className="flex min-w-0 flex-1 flex-col justify-between">
          {(songs?.slice(0, 3) ?? [null, null, null]).map((s, i) => (
            <li key={i} className="flex min-w-0 items-baseline gap-2 text-[13px]">
              <span className="num font-bold">{i + 1}</span>
              {s ? <span className="truncate">{s.title}<span className="text-sub"> / {s.artist}</span></span> : <Sk className="h-3 flex-1" />}
            </li>
          ))}
        </ol>
      </Link>
    </div>
  );
}

/* ── 推荐歌单 ─────────────────────────────────────────── */
const ALL: SheetTag = { id: '', title: '精选' };

function Playlists() {
  const [tags, setTags] = useState<SheetTag[]>([ALL]);
  const [tagId, setTagId] = useState('');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const req = useRef(0);

  useEffect(() => { getSheetTags().then(t => setTags([ALL, ...t])).catch(() => {}); }, []);

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

  const tag = tags.find(t => t.id === tagId) ?? ALL;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 切换标签时重新加载
    load(tag, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId, load]);

  return (
    <section>
      <SectionHead title="推荐歌单" />
      <div className="mb-6">
        <Tabs label="歌单分类" value={tagId} items={tags.map(t => ({ id: t.id, label: t.title }))}
          onChange={id => { setSheets([]); setPage(0); setDone(false); setTagId(id); }} />
      </div>
      {error && page === 0 ? <ErrorBox message={error} onRetry={() => load(tag, 1)} /> : (
        <CardGrid>
          {sheets.map((s, i) => (
            <MediaCard key={s.id} index={i} big={i === 0} href={collectionHref('playlist', s)} title={s.title} subtitle={s.artist} artwork={s.artwork} count={s.playCount} />
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
  const [err, setErr] = useState('');
  const [date, setDate] = useState('');

  const loadCharts = useCallback(() => {
    setErr('');
    loadTopLists().then(setCharts).catch(e => setErr(e.message));
  }, []);

  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 日期依赖客户端时区
    setDate(`${d.getMonth() + 1}月${d.getDate()}日 星期${WEEK[d.getDay()]}`);
    loadCharts();
  }, [loadCharts]);

  const official = charts?.[0];
  const hero = official?.data[0];
  const tickets = charts?.flatMap(g => g.data).filter(x => x.id !== hero?.id).slice(0, 8) ?? [];
  const { songs: heroSongs } = useChartSongs(hero);

  return (
    <Page className="flex flex-col gap-16">
      <div>
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <Brand />
          <Link href="/search" aria-label="搜索" className="press flex h-10 w-10 items-center justify-center"><Search className="h-5 w-5" /></Link>
        </div>
        <PageTitle aside={
          <PopButton onClick={() => heroSongs && playList(heroSongs, 0)} disabled={!heroSongs?.length} className="hidden sm:inline-flex">
            <Play className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />播放今日热歌
          </PopButton>
        }>
          今日
          <span className="num mt-2 block text-base font-medium tracking-normal text-sub">{date || ' '}</span>
        </PageTitle>
        <PopButton onClick={() => heroSongs && playList(heroSongs, 0)} disabled={!heroSongs?.length} className="-mt-3 mb-2 w-full justify-center sm:hidden">
          <Play className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />播放今日热歌
        </PopButton>
      </div>

      {recent.length > 0 && (
        <section aria-label="继续收听" className="-mt-8">
          <p className="mb-3 text-sm font-bold">继续收听</p>
          <Shelf label="继续收听">
            {recent.slice(0, 10).map((s, i) => (
              <button key={s.id} role="listitem" onClick={() => playList(recent, i)}
                className="press flex w-[60vw] max-w-[260px] shrink-0 snap-start items-center gap-3 border border-line pr-3 text-left hover:border-line-strong sm:w-[240px]">
                <Cover src={s.artwork} className="h-14 w-14" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{current?.id === s.id ? <span className="mark">{s.title}</span> : s.title}</span>
                  <span className="block truncate text-xs text-sub">{s.artist}</span>
                </span>
              </button>
            ))}
          </Shelf>
        </section>
      )}

      {err ? <ErrorBox message={err} onRetry={loadCharts} /> : <TodayChart item={hero} />}

      <section>
        <SectionHead title="榜单" action={
          <Link href="/charts" className="group inline-flex items-center gap-1 text-sm font-semibold">
            <span className="u-hover">全部榜单</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        } />
        <Shelf label="榜单">
          {tickets.length
            ? tickets.map((it, i) => <ChartTicket key={it.id} item={it} index={i} />)
            : Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-[170px] w-[78vw] max-w-[320px] shrink-0 sm:w-[300px]" />)}
        </Shelf>
      </section>

      <Playlists />
    </Page>
  );
}
