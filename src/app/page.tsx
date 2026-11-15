'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Play, Sparkle } from 'lucide-react';
import { collectionHref, getArtwork, getCollection, getRecommendSheets } from '@/lib/api';
import { loadTopLists, useChartSongs } from '@/lib/charts';
import { useRecent } from '@/lib/storage';
import type { Sheet, Song, TopListGroup, TopListItem } from '@/lib/types';
import { CardGrid, MediaCard } from '@/components/MediaCard';
import { CardSkeleton, Cover, ErrorBox, Row, SectionHead, Sk, fmtCount, pad2, safeImg } from '@/components/ui';
import { usePlayer } from '@/components/PlayerProvider';

function subscribeVisibility(cb: () => void) {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}

/* ── 首屏: 本周主推歌单 (与 vod-site HeroStage 相同的卡组 + 进度轨道) ─────────── */
const DECK = [
  'translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100 z-30',
  'translate-x-[22%] translate-y-[3%] rotate-[7deg] scale-[0.86] opacity-80 z-20',
  'translate-x-[40%] translate-y-[6%] rotate-[13deg] scale-[0.74] opacity-45 z-10',
];
const HIDDEN = 'translate-x-[48%] translate-y-[8%] rotate-[16deg] scale-[0.7] opacity-0 z-0 pointer-events-none';

function HeroStage({ items }: { items: Sheet[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [starting, setStarting] = useState(false);
  const visible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
  const { playList } = usePlayer();

  const n = items.length;
  const current = items[index];
  const running = !hovered && !focused && visible;
  const next = () => setIndex(i => (i + 1) % n);

  const playSheet = async () => {
    setStarting(true);
    try {
      const r = await getCollection('playlist', current, 1);
      if (r.songs.length) playList(r.songs, 0);
    } catch { /* 播放器 Toast 会显示错误 */ } finally { setStarting(false); }
  };

  return (
    <section aria-roledescription="carousel" aria-label="本周主推歌单"
      className="relative isolate -mt-[var(--header-h)] overflow-hidden pt-[var(--header-h)]"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}>
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* 큰 블러 레이어를 여러 장 겹쳐 크로스페이드하면 전환 1초 동안 매 프레임 전체를 다시 블러링해 화면이 멈춘다.
            현재 곡 한 장만, 자체 합성 레이어로 그려 8초에 한 번만 다시 그리게 한다. */}
        <div key={current.id} className="absolute inset-0 scale-125 bg-cover bg-center opacity-80 blur-[60px] saturate-150 transform-gpu motion-safe:animate-[fade-in_0.8s_ease-out] dark:opacity-60"
          style={{ backgroundImage: `url("${safeImg(current.artwork)}")` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/30 via-paper/70 to-paper" />
      </div>

      <div className="wrap grid min-h-[min(640px,calc(100svh-var(--header-h)-8rem))] items-center gap-10 pb-6 pt-8 lg:grid-cols-12 lg:gap-6 lg:pt-10">
        <div key={current.id} className="order-2 min-w-0 lg:order-1 lg:col-span-7" aria-live={running ? 'off' : 'polite'}>
          <p className="rise font-wide text-xs font-semibold uppercase tracking-[0.2em] text-pop">Top Picks</p>
          <h1 className="rise mt-5 line-clamp-2 pb-1 text-[clamp(2.5rem,7vw,6.5rem)] font-black leading-[1.02] tracking-[-0.05em] text-ink [text-wrap:balance]"
            style={{ '--d': '0.06s' } as React.CSSProperties}>
            {current.title}
          </h1>
          <div className="rise mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-base font-bold text-ink/80" style={{ '--d': '0.14s' } as React.CSSProperties}>
            {current.playCount && <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-sm text-onaccent">{fmtCount(current.playCount)} 次播放</span>}
            {current.artist && <span>{current.artist}</span>}
            <span>歌单</span>
          </div>
          <div className="rise mt-9 flex flex-wrap gap-3" style={{ '--d': '0.22s' } as React.CSSProperties}>
            <button onClick={playSheet} disabled={starting}
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-accent pl-2 pr-7 text-lg font-bold text-onaccent transition-transform duration-300 ease-out-expo hover:scale-[1.03] active:scale-[0.98] disabled:opacity-70">
              <span className="grid size-10 place-items-center rounded-full bg-onaccent text-accent transition-transform duration-300 group-hover:scale-110">
                <Play size={17} fill="currentColor" aria-hidden="true" />
              </span>
              {starting ? '加载中...' : '立即播放'}
            </button>
            <Link href={collectionHref('playlist', current)}
              className="inline-flex h-14 items-center rounded-full px-7 text-lg font-bold text-ink ring-1 ring-line transition-colors hover:bg-ink hover:text-paper">
              查看歌单
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5">
          <div className="relative mx-auto aspect-square w-[min(56vw,240px)] sm:w-[280px] lg:mr-[18%] lg:w-[min(100%,380px)]">
            {items.map((it, i) => {
              const pos = (i - index + n) % n;
              return (
                <div key={it.id} className={`absolute inset-0 origin-bottom-left transition-[transform,opacity] duration-700 ease-out-expo ${DECK[pos] ?? HIDDEN}`}>
                  {pos === 0 ? (
                    <Link href={collectionHref('playlist', it)} tabIndex={-1} aria-hidden="true"
                      className="block h-full overflow-hidden rounded-panel bg-card-2 shadow-lift ring-1 ring-line">
                      <Cover src={it.artwork} priority rounded="rounded-none" className="h-full w-full" />
                    </Link>
                  ) : (
                    <button type="button" tabIndex={-1} onClick={() => setIndex(i)} aria-label={`切换到 ${it.title}`}
                      className="block h-full w-full overflow-hidden rounded-panel bg-card-2 shadow-lift ring-1 ring-line">
                      <Cover src={it.artwork} rounded="rounded-none" className="h-full w-full" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="wrap pb-12">
        <div role="tablist" aria-label="选择主推歌单" className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 sm:mx-0 sm:gap-8 sm:px-0">
          {items.map((it, i) => {
            const active = i === index;
            return (
              <button key={it.id} type="button" role="tab" aria-selected={active} onClick={() => setIndex(i)} className="group min-w-[140px] flex-1 pt-2 text-left">
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-ink/15">
                  {active && (
                    <span key={`${it.id}-${index}`} onAnimationEnd={next} style={{ animationPlayState: running ? 'running' : 'paused' }}
                      className="block h-full origin-left rounded-full bg-[var(--pop)] motion-safe:animate-[progress_8s_linear_forwards]" />
                  )}
                </span>
                <span className="mt-3 flex items-baseline gap-2.5">
                  <span className="font-wide text-[11px] font-semibold tabular-nums text-sub">{pad2(i + 1)}</span>
                  <span className={`truncate text-sm font-bold transition-colors ${active ? 'text-ink' : 'text-sub group-hover:text-ink'}`}>{it.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div className="wrap grid min-h-[min(640px,calc(100svh-var(--header-h)-8rem))] items-center gap-10 pb-16 pt-8 lg:grid-cols-12">
      <div className="order-2 flex flex-col gap-5 lg:order-1 lg:col-span-7">
        <Sk className="h-3 w-24 rounded-full" /><Sk className="h-16 w-4/5 rounded-card" /><Sk className="h-7 w-1/2 rounded-full" /><Sk className="h-14 w-44 rounded-full" />
      </div>
      <Sk className="order-1 mx-auto aspect-square w-[min(56vw,240px)] rounded-panel sm:w-[280px] lg:order-2 lg:col-span-5 lg:w-[380px]" />
    </div>
  );
}

/* ── 今日新歌字幕带 (与 vod-site Ticker 相同) ─────────────────────────────── */
function Ticker({ item }: { item?: TopListItem }) {
  const { songs } = useChartSongs(item);
  const { playList } = usePlayer();
  const list = songs?.slice(0, 14) ?? [];
  if (!list.length) return <div className="h-[120px] sm:h-[140px]" aria-hidden="true" />;
  return (
    <section aria-label="今日新歌" className="relative py-10">
      <div aria-hidden="true" className="absolute inset-x-[-5%] top-1/2 h-16 -translate-y-1/2 rotate-[2.2deg] bg-ink/90 sm:h-20" />
      <div className="marquee relative -mx-[5%] flex -rotate-[1.8deg] items-stretch bg-accent text-onaccent shadow-lift">
        <span className="font-wide relative z-10 flex shrink-0 items-center bg-onaccent pl-[calc(5vw+1rem)] pr-4 text-xs font-extrabold uppercase tracking-[0.18em] text-accent sm:pl-[calc(5vw+2.5rem)] sm:pr-6 sm:text-sm">
          New Songs
        </span>
        <div className="min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto">
          <div className="marquee-track flex w-max">
            {[0, 1].map(copy => (
              <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center py-4 sm:py-5">
                {list.map((s, i) => (
                  <li key={`${copy}-${s.id}`} className="flex items-center">
                    <button tabIndex={copy === 1 ? -1 : undefined} onClick={() => playList(songs!, i)}
                      className="flex items-baseline gap-2.5 whitespace-nowrap px-5 text-xl font-black tracking-[-0.03em] decoration-2 underline-offset-4 hover:underline sm:text-3xl">
                      {s.title}<span className="text-xs font-bold opacity-70 sm:text-sm">{s.artist}</span>
                    </button>
                    <Sparkle size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" className="shrink-0" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 热歌 TOP 10: 序号压在封面后面 (与 vod-site 排行货架相同) ─────────────── */
function useArtworks(songs: Song[] | null) {
  const [arts, setArts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!songs) return;
    let alive = true;
    songs.filter(s => !s.artwork).forEach(s => {
      getArtwork(s).then(a => { if (alive && a) setArts(m => ({ ...m, [s.id]: a })); });
    });
    return () => { alive = false; };
  }, [songs]);
  return arts;
}

function TopTen({ item }: { item?: TopListItem }) {
  const { songs } = useChartSongs(item);
  const top = songs?.slice(0, 10) ?? null;
  const arts = useArtworks(top);
  const { playList, current } = usePlayer();
  if (!item) return null;
  return (
    <section className="reveal">
      <SectionHead title="热歌榜" kicker="Top 10" href={collectionHref('chart', item)} />
      <Row label="热歌榜前十">
        {(top ?? Array.from({ length: 6 }).map(() => null)).map((s, i) => (
          <li key={s?.id ?? i} className="group/rank relative flex w-[236px] shrink-0 snap-start items-end justify-end sm:w-[268px]">
            <span aria-hidden="true"
              className="font-wide text-outline absolute bottom-[3.4rem] left-0 select-none text-[120px] font-extrabold leading-[0.8] tracking-[-0.09em] transition-colors duration-300 group-hover/rank:text-[var(--accent)] group-hover/rank:[-webkit-text-stroke-color:var(--accent)] sm:text-[144px]">
              {i + 1}
            </span>
            {s ? (
              <button onClick={() => playList(songs!, i)} className="group relative block w-[146px] text-left sm:w-[168px]">
                <div className="relative aspect-square overflow-hidden rounded-card bg-card-2 ring-1 ring-line transition duration-500 ease-out-expo group-hover:-translate-y-2 group-hover:shadow-lift group-hover:ring-2 group-hover:ring-accent">
                  <Cover src={s.artwork || arts[s.id]} className="h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.07]" />
                  <span className="pointer-events-none absolute bottom-3 left-3 inline-flex h-9 translate-y-2 items-center gap-1.5 rounded-full bg-accent pl-3 pr-4 text-[13px] font-bold text-onaccent opacity-0 transition duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden">
                    <Play size={13} fill="currentColor" aria-hidden="true" />播放
                  </span>
                </div>
                <div className="px-0.5 pt-3">
                  <h3 className={`truncate text-[15px] font-bold tracking-[-0.01em] ${current?.id === s.id ? 'text-pop' : 'text-ink'}`}>{s.title}</h3>
                  <p className="mt-1 truncate text-[13px] text-sub">{s.artist}</p>
                </div>
              </button>
            ) : (
              <div className="relative w-[146px] sm:w-[168px]"><Sk className="aspect-square rounded-card" /><Sk className="mt-3 h-4 w-3/4 rounded-full" /></div>
            )}
          </li>
        ))}
      </Row>
    </section>
  );
}

/* ── 榜单 Mosaic: 1 个大面板 + 8 个榜单 (2/4/6 列刚好铺满) ─────────────────── */
function ChartMosaic({ items }: { items: TopListItem[] }) {
  const [lead, ...others] = items;
  const { songs } = useChartSongs(lead);
  const { playList } = usePlayer();
  const rest = others.slice(0, others.length >= 8 ? 8 : 4);
  if (!lead) return null;
  return (
    <section className="reveal">
      <SectionHead title="排行榜" href="/charts" />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 lg:grid-cols-6">
        <div className="group relative col-span-2 aspect-[4/3] overflow-hidden rounded-panel bg-card-2 ring-1 ring-line md:row-span-2 md:aspect-auto">
          <Cover src={lead.coverImg} rounded="rounded-none" className="absolute inset-0 h-full w-full transition-transform duration-1000 ease-out-expo group-hover:scale-[1.05]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-24 sm:p-7 sm:pt-32">
            <Link href={collectionHref('chart', lead)} className="block">
              <h3 className="line-clamp-2 text-3xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-4xl">{lead.title}</h3>
            </Link>
            <ol className="mt-3 space-y-1 text-sm text-white/80">
              {(songs?.slice(0, 3) ?? []).map((s, i) => (
                <li key={s.id} className="truncate"><span className="font-wide mr-2 font-extrabold text-accent">{i + 1}</span>{s.title} · {s.artist}</li>
              ))}
            </ol>
            <button onClick={() => songs?.length && playList(songs, 0)} disabled={!songs?.length}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent pl-4 pr-5 text-sm font-bold text-onaccent transition-transform duration-300 hover:scale-[1.04] disabled:opacity-60">
              <Play size={14} fill="currentColor" aria-hidden="true" />播放榜单
            </button>
          </div>
        </div>
        {rest.map(it => (
          <MediaCard key={it.id} href={collectionHref('chart', it)} title={it.title} artwork={it.coverImg} />
        ))}
      </div>
    </section>
  );
}

/* ── 页面 ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const recent = useRecent();
  const { playList, current } = usePlayer();
  const [charts, setCharts] = useState<TopListGroup[] | null>(null);
  const [sheets, setSheets] = useState<Sheet[] | null>(null);
  const [err, setErr] = useState('');
  const loaded = useRef(false);

  const load = useCallback(() => {
    setErr('');
    loadTopLists().then(setCharts).catch(e => setErr(e.message));
    getRecommendSheets(1).then(r => setSheets(r.data)).catch(e => { setSheets([]); setErr(e.message); });
  }, []);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    load();
  }, [load]);

  const official = charts?.[0]?.data ?? [];
  const hot = official[0];
  const fresh = official[1];
  const mosaic = (charts ?? []).flatMap(g => g.data).filter(x => x.id !== hot?.id && x.id !== fresh?.id).slice(0, 9);
  const heroItems = sheets ? [...sheets].sort((a, b) => Number(b.playCount || 0) - Number(a.playCount || 0)).slice(0, 5) : null;
  const heroIds = new Set(heroItems?.map(s => s.id));
  const gridSheets = sheets?.filter(s => !heroIds.has(s.id)).slice(0, 10) ?? null;

  return (
    <>
      {heroItems?.length ? <HeroStage items={heroItems} /> : sheets ? null : <HeroSkeleton />}

      {err && !charts && !sheets?.length ? (
        <div className="wrap pt-10"><ErrorBox message={err} onRetry={load} /></div>
      ) : (
        <>
          <Ticker item={fresh} />
          <div className="wrap flex flex-col gap-20 pt-6 sm:gap-28">
            {recent.length > 0 && (
              <section className="reveal">
                <SectionHead title="继续收听" href="/library?tab=recent" />
                <Row label="继续收听">
                  {recent.slice(0, 12).map((s, i) => (
                    <li key={s.id} className="w-[150px] shrink-0 snap-start sm:w-[180px]">
                      <button onClick={() => playList(recent, i)} className="group block w-full text-left">
                        <div className="relative aspect-square overflow-hidden rounded-card bg-card-2 ring-1 ring-line transition duration-500 ease-out-expo group-hover:-translate-y-2 group-hover:shadow-lift group-hover:ring-2 group-hover:ring-accent">
                          <Cover src={s.artwork} className="h-full w-full" />
                        </div>
                        <h3 className={`truncate px-0.5 pt-3 text-[15px] font-bold ${current?.id === s.id ? 'text-pop' : ''}`}>{s.title}</h3>
                        <p className="mt-1 truncate px-0.5 text-[13px] text-sub">{s.artist}</p>
                      </button>
                    </li>
                  ))}
                </Row>
              </section>
            )}

            <TopTen item={hot} />

            {charts ? <ChartMosaic items={mosaic} /> : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6"><CardSkeleton count={6} /></div>
            )}

            <section className="reveal">
              <SectionHead title="推荐歌单" href="/playlists" />
              <CardGrid>
                {gridSheets ? gridSheets.map(s => (
                  <MediaCard key={s.id} href={collectionHref('playlist', s)} title={s.title} subtitle={s.artist} artwork={s.artwork} count={s.playCount} />
                )) : <CardSkeleton count={10} />}
              </CardGrid>
            </section>
          </div>
        </>
      )}
    </>
  );
}
