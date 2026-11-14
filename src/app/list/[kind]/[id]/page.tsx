'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Music, Play, Shuffle } from 'lucide-react';
import { getCollection } from '@/lib/api';
import type { CollectionKind, Song } from '@/lib/types';
import { Page } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { usePlayer } from '@/components/PlayerProvider';
import { Cover, Empty, ErrorBox, Sentinel, TrackSkeleton, safeImg } from '@/components/ui';

const KIND_LABEL: Record<CollectionKind, string> = {
  chart: '排行榜',
  album: '专辑',
  artist: '歌手',
  playlist: '歌单',
};

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
  const headRef = useRef<HTMLDivElement>(null);

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

  // 大标题滚出视口后显示紧凑顶栏 (IntersectionObserver, 不监听 scroll)
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cover = artwork || songs.find(s => s.artwork)?.artwork;
  const bg = safeImg(cover);
  const playingHere = !!current && songs.some(s => s.id === current.id);
  const onPlayAll = () => (playingHere ? toggle() : playList(songs, 0));
  const back = () => (window.history.length > 1 ? router.back() : router.push('/'));

  return (
    <div className="relative">
      {bg && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bg} alt="" referrerPolicy="no-referrer" className="h-full w-full scale-125 object-cover opacity-35 blur-[70px] saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg" />
        </div>
      )}

      {/* 紧凑顶栏 */}
      <div className={`glass sticky top-0 z-30 flex h-[calc(56px+env(safe-area-inset-top))] items-center gap-2 px-2 pt-[env(safe-area-inset-top)] transition-colors duration-300 sm:px-4 lg:px-6 ${compact ? 'border-b border-line bg-bg/85 backdrop-blur-2xl' : 'bg-transparent'}`}>
        <button onClick={back} aria-label="返回" className="press flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <p className={`min-w-0 flex-1 truncate font-semibold transition-opacity duration-300 ${compact ? 'opacity-100' : 'opacity-0'}`}>{title}</p>
        <button onClick={onPlayAll} disabled={!songs.length} aria-label={playingHere && playing ? '暂停' : '播放全部'}
          className={`press flex h-10 w-10 items-center justify-center rounded-full bg-accent text-onaccent transition-opacity duration-300 disabled:opacity-0 ${compact ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <Play className="h-[18px] w-[18px] translate-x-[1px]" fill="currentColor" strokeWidth={0} />
        </button>
      </div>

      <Page className="relative !pt-2">
        <header className="mb-7 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
          <Cover src={cover} priority rounded={kind === 'artist' ? 'rounded-full' : 'rounded-2xl'}
            className="h-52 w-52 shadow-float sm:h-60 sm:w-60" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-accent">{KIND_LABEL[kind]}</p>
            <h1 ref={headRef} className="mt-1 line-clamp-2 text-[28px] font-bold leading-tight tracking-tight sm:text-[40px] lg:text-5xl">{title}</h1>
            <p className="mt-2 text-sm text-sub">
              {sub && <span>{sub}</span>}
              {sub && songs.length > 0 && <span className="mx-1.5 opacity-50">/</span>}
              {songs.length > 0 && <span className="tabular-nums">{songs.length}{done ? '' : '+'} 首歌曲</span>}
            </p>
            <div className="mt-5 flex justify-center gap-3 sm:justify-start">
              <button onClick={onPlayAll} disabled={!songs.length}
                className="press inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-onaccent shadow-card disabled:opacity-40">
                <Play className="h-5 w-5" fill="currentColor" strokeWidth={0} />{playingHere ? (playing ? '暂停' : '继续播放') : '播放全部'}
              </button>
              <button onClick={() => playList(shuffled(songs), 0)} disabled={!songs.length}
                className="press inline-flex h-12 items-center gap-2 rounded-full bg-surface px-6 text-[15px] font-medium shadow-card hover:bg-surface-2 disabled:opacity-40">
                <Shuffle className="h-[18px] w-[18px]" />随机播放
              </button>
            </div>
          </div>
        </header>

        {error && page === 0 && <ErrorBox message={error} onRetry={() => load(1)} />}
        {loading && page === 0 && <TrackSkeleton rows={10} cover={kind !== 'album'} />}
        {!loading && !error && page > 0 && songs.length === 0 && <Empty icon={Music} title="这里还没有歌曲" hint="稍后再来看看" />}
        {songs.length > 0 && <TrackList songs={songs} showCover={kind !== 'album'} ranked={kind === 'chart'} showAlbum={kind !== 'album'} />}
        {page > 0 && songs.length > 0 && (kind === 'artist' || kind === 'playlist') && (
          <Sentinel onHit={() => { if (!done) load(page + 1); }} done={done} loading={loading} />
        )}
        {error && page > 0 && <ErrorBox message={error} onRetry={() => load(page + 1)} />}
      </Page>
    </div>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<Page><TrackSkeleton rows={10} /></Page>}>
      <ListInner />
    </Suspense>
  );
}
