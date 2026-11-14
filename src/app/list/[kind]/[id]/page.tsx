'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Music, Pause, Play, Shuffle } from 'lucide-react';
import { getCollection } from '@/lib/api';
import type { CollectionKind, Song } from '@/lib/types';
import { Page } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { usePlayer } from '@/components/PlayerProvider';
import { Cover, Empty, ErrorBox, GhostButton, PopButton, Sentinel, TrackSkeleton } from '@/components/ui';

const KIND_LABEL: Record<CollectionKind, string> = { chart: '排行榜', album: '专辑', artist: '歌手', playlist: '歌单' };

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
  const [compact, setCompact] = useState(false);
  const busy = useRef(false);
  const headRef = useRef<HTMLHeadingElement>(null);

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

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-120px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cover = artwork || songs.find(s => s.artwork)?.artwork;
  const playingHere = !!current && songs.some(s => s.id === current.id);
  const onPlay = () => (playingHere ? toggle() : playList(songs, 0));
  const back = () => (window.history.length > 1 ? router.back() : router.push('/'));
  const PlayIcon = playingHere && playing ? Pause : Play;

  return (
    <>
      <div className={`glass sticky top-0 z-30 flex h-[calc(52px+env(safe-area-inset-top))] items-center gap-2 px-2 pt-[env(safe-area-inset-top)] transition-colors sm:px-4 lg:top-16 lg:px-8 ${compact ? 'border-b border-line bg-bg/92 backdrop-blur-xl' : ''}`}>
        <button onClick={back} aria-label="返回" className="press flex h-10 w-10 items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
        <p className={`min-w-0 flex-1 truncate font-bold transition-opacity ${compact ? 'opacity-100' : 'opacity-0'}`}>{title}</p>
        <button onClick={onPlay} disabled={!songs.length} aria-label={playingHere && playing ? '暂停' : '播放全部'}
          className={`press flex h-10 w-10 items-center justify-center bg-pop text-onpop transition-opacity ${compact ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <PlayIcon className="h-4 w-4" fill="currentColor" strokeWidth={0} />
        </button>
      </div>

      <Page className="!pt-2">
        <header className="mb-10 grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end sm:gap-8">
          <Cover src={cover} priority round={kind === 'artist'} className="aspect-square w-full max-w-[320px] sm:w-56 lg:w-64" />
          <div className="min-w-0">
            <p className="text-sm font-bold"><span className="mark">{KIND_LABEL[kind]}</span></p>
            <h1 ref={headRef} className="mt-3 line-clamp-3 text-4xl font-black leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-3 text-sm text-sub">
              {sub}{sub && songs.length > 0 && ' / '}
              {songs.length > 0 && <span className="num">{songs.length}{done ? '' : '+'} 首歌曲</span>}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PopButton onClick={onPlay} disabled={!songs.length}>
                <PlayIcon className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                {playingHere ? (playing ? '暂停' : '继续播放') : '播放全部'}
              </PopButton>
              <GhostButton onClick={() => playList(shuffled(songs), 0)} disabled={!songs.length}>
                <Shuffle className="h-[18px] w-[18px]" />随机播放
              </GhostButton>
            </div>
          </div>
        </header>

        {error && page === 0 && <ErrorBox message={error} onRetry={() => load(1)} />}
        {loading && page === 0 && <TrackSkeleton rows={10} />}
        {!loading && !error && page > 0 && songs.length === 0 && <Empty icon={Music} title="这里还没有歌曲" hint="稍后再来看看。" />}
        {songs.length > 0 && <TrackList songs={songs} showCover={kind !== 'album' && kind !== 'chart'} ranked={kind === 'chart'} showAlbum={kind !== 'album'} />}
        {page > 0 && songs.length > 0 && (kind === 'artist' || kind === 'playlist') && (
          <Sentinel onHit={() => { if (!done) load(page + 1); }} done={done} loading={loading} />
        )}
        {error && page > 0 && <ErrorBox message={error} onRetry={() => load(page + 1)} />}
      </Page>
    </>
  );
}

export default function ListPage() {
  return <Suspense fallback={<Page><TrackSkeleton rows={10} /></Page>}><ListInner /></Suspense>;
}
