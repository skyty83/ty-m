'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Music, Pause, Play, Shuffle } from 'lucide-react';
import { getArtwork, getCollection } from '@/lib/api';
import type { CollectionKind, Song } from '@/lib/types';
import TrackList from '@/components/TrackList';
import { usePlayer } from '@/components/PlayerProvider';
import { Cover, Empty, ErrorBox, Sentinel, TrackSkeleton, safeImg } from '@/components/ui';

const KIND_LABEL: Record<CollectionKind, string> = { chart: '排行榜', album: '专辑', artist: '歌手', playlist: '歌单' };
const KIND_KICKER: Record<CollectionKind, string> = { chart: 'CHART', album: 'ALBUM', artist: 'ARTIST', playlist: 'PLAYLIST' };

function shuffled<T>(arr: T[]) {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s;
}

function ListInner() {
  const router = useRouter();
  const { kind, id } = useParams<{ kind: CollectionKind; id: string }>();
  const sp = useSearchParams();
  const title = sp.get('t') || KIND_LABEL[kind] || '';
  const artwork = sp.get('a') || undefined;
  const sub = sp.get('s') || undefined;
  const itemId = decodeURIComponent(id);

  const { playList, toggle, current, playing } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const load = useCallback(async (p: number) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      const r = await getCollection(kind, { id: itemId, artwork, title }, p);
      setSongs(prev => {
        const base = p === 1 ? [] : prev;
        const ids = new Set(base.map(s => s.id));
        return [...base, ...r.songs.filter(s => !ids.has(s.id))];
      });
      setPage(p);
      setDone(r.isEnd || r.songs.length === 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [kind, itemId, artwork, title]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 参数变化时加载第一页
    load(1);
  }, [load]);

  // 链接没带封面且歌曲也没有封面时 (榜单/歌单), 用第一首歌的专辑图代替
  const [fallbackArt, setFallbackArt] = useState<string>();
  const first = songs[0];
  useEffect(() => {
    if (artwork || !first || first.artwork) return;
    let alive = true;
    getArtwork(first).then(a => { if (alive && a) setFallbackArt(a); });
    return () => { alive = false; };
  }, [artwork, first]);
  const cover = artwork || songs.find(s => s.artwork)?.artwork || fallbackArt;
  const bg = safeImg(cover);
  const playingHere = !!current && songs.some(s => s.id === current.id);
  const onPlay = () => (playingHere ? toggle() : playList(songs, 0));
  const PlayIcon = playingHere && playing ? Pause : Play;

  return (
    <>
      {/* 与 vod-site 详情页同款: 封面放大模糊作为环境光 */}
      <section className="relative isolate -mt-[var(--header-h)] overflow-hidden pt-[var(--header-h)]">
        {bg && (
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="absolute inset-0 scale-125 bg-cover bg-center opacity-70 blur-[90px] saturate-150 dark:opacity-50" style={{ backgroundImage: `url("${bg}")` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-paper/30 via-paper/70 to-paper" />
          </div>
        )}
        <div className="wrap pb-10 pt-6 lg:pt-10">
          <button onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
            className="mb-8 inline-flex h-10 items-center gap-2 rounded-full bg-card/70 pl-3 pr-4 text-sm font-bold ring-1 ring-line backdrop-blur transition-colors hover:bg-ink hover:text-paper">
            <ArrowLeft size={16} strokeWidth={2.5} />返回
          </button>
          <div className="grid items-end gap-8 sm:grid-cols-[auto_minmax(0,1fr)] lg:gap-12">
            <Cover src={cover} priority round={kind === 'artist'} rounded="rounded-panel"
              className="rise aspect-square w-[min(64vw,260px)] shadow-lift ring-1 ring-line lg:w-[300px]" />
            <div className="min-w-0">
              <p className="rise font-wide text-xs font-semibold uppercase tracking-[0.2em] text-pop">{KIND_KICKER[kind]}</p>
              <h1 className="rise mt-4 line-clamp-3 pb-1 text-[clamp(2.25rem,6vw,5rem)] font-black leading-[1.02] tracking-[-0.05em] [text-wrap:balance]"
                style={{ '--d': '0.06s' } as React.CSSProperties}>{title}</h1>
              <div className="rise mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-base font-bold text-ink/80" style={{ '--d': '0.12s' } as React.CSSProperties}>
                <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-sm text-onaccent">{KIND_LABEL[kind]}</span>
                {sub && <span>{sub}</span>}
                {songs.length > 0 && <span className="tabular-nums">{songs.length}{done ? '' : '+'} 首歌曲</span>}
              </div>
              <div className="rise mt-8 flex flex-wrap gap-3" style={{ '--d': '0.18s' } as React.CSSProperties}>
                <button onClick={onPlay} disabled={!songs.length}
                  className="group inline-flex h-14 items-center gap-3 rounded-full bg-accent pl-2 pr-7 text-lg font-bold text-onaccent transition-transform duration-300 ease-out-expo hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50">
                  <span className="grid size-10 place-items-center rounded-full bg-onaccent text-accent"><PlayIcon size={17} fill="currentColor" aria-hidden="true" /></span>
                  {playingHere ? (playing ? '暂停' : '继续播放') : '播放全部'}
                </button>
                <button onClick={() => playList(shuffled(songs), 0)} disabled={!songs.length}
                  className="inline-flex h-14 items-center gap-2 rounded-full px-6 text-lg font-bold text-ink ring-1 ring-line transition-colors hover:bg-ink hover:text-paper disabled:opacity-50">
                  <Shuffle size={18} strokeWidth={2.25} />随机
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        {error && page === 0 && <ErrorBox message={error} onRetry={() => load(1)} />}
        {loading && page === 0 && <TrackSkeleton rows={10} />}
        {!loading && !error && page > 0 && songs.length === 0 && <Empty icon={Music} title="这里还没有歌曲" hint="稍后再来看看。" />}
        {songs.length > 0 && <TrackList songs={songs} showCover={kind !== 'album' && kind !== 'chart'} ranked={kind === 'chart'} showAlbum={kind !== 'album'} />}
        {page > 0 && songs.length > 0 && (kind === 'artist' || kind === 'playlist') && (
          <Sentinel onHit={() => { if (!done) load(page + 1); }} done={done} loading={loading} />
        )}
        {error && page > 0 && <ErrorBox message={error} onRetry={() => load(page + 1)} />}
      </div>
    </>
  );
}

export default function ListPage() {
  return <Suspense fallback={<div className="wrap pt-10"><TrackSkeleton rows={10} /></div>}><ListInner /></Suspense>;
}
