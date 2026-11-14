'use client';

import { useRef } from 'react';
import { Heart, ListMusic, Maximize2, MicVocal, SkipForward } from 'lucide-react';
import { usePlayer, useProgress } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { Cover } from './ui';
import { PlayButton, SeekBar, TransportRow, VolumeControl } from './Controls';

function MiniProgress() {
  const { time, duration } = useProgress();
  return (
    <div className="absolute inset-x-4 bottom-0 h-[2px] overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
      <div className="h-full rounded-full bg-accent transition-[width] duration-300 ease-linear" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
    </div>
  );
}

export default function PlayerBar() {
  const { current, setFullOpen, next, prev, loading, error } = usePlayer();
  const { isLiked, toggle } = useLiked();
  const touch = useRef<{ x: number; y: number } | null>(null);
  if (!current) return null;
  const liked = isLiked(current.id);
  const status = error ? '播放失败，点击查看' : loading ? '正在缓冲…' : current.artist;

  return (
    <>
      {/* 移动端: 悬浮迷你播放器, 左右滑动切歌, 点击展开 */}
      <div className="fixed inset-x-2.5 z-40 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+8px)] lg:hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFullOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter') setFullOpen(true); }}
          onTouchStart={e => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchEnd={e => {
            const s = touch.current; touch.current = null;
            if (!s) return;
            const dx = e.changedTouches[0].clientX - s.x;
            const dy = e.changedTouches[0].clientY - s.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); }
            else if (dy < -40 && Math.abs(dy) > Math.abs(dx)) setFullOpen(true);
          }}
          aria-label={`正在播放 ${current.title}，打开播放器`}
          className="glass relative flex h-[var(--player-h)] items-center gap-3 rounded-2xl bg-surface/85 pl-2 pr-1.5 shadow-float ring-1 ring-line backdrop-blur-2xl backdrop-saturate-150"
        >
          <Cover src={current.artwork} className="h-[50px] w-[50px]" rounded="rounded-[8px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight">{current.title}</p>
            <p className={`mt-1 truncate text-xs ${error ? 'text-accent' : 'text-sub'}`}>{status}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); toggle(current); }}
            aria-label={liked ? '取消收藏' : '收藏'}
            aria-pressed={liked}
            className={`press flex h-10 w-10 items-center justify-center rounded-full ${liked ? 'text-accent' : 'text-sub'}`}
          >
            <Heart className="h-[21px] w-[21px]" fill={liked ? 'currentColor' : 'none'} />
          </button>
          <PlayButton size="sm" tone="bare" />
          <button onClick={e => { e.stopPropagation(); next(); }} aria-label="下一首" className="press flex h-10 w-10 items-center justify-center rounded-full text-ink">
            <SkipForward className="h-[22px] w-[22px]" fill="currentColor" strokeWidth={1.5} />
          </button>
          <MiniProgress />
        </div>
      </div>

      {/* 桌面端: 悬浮播放栏 */}
      <div className="fixed inset-x-0 bottom-0 z-40 hidden px-4 pb-4 lg:block">
        <div className="glass mx-auto grid h-[calc(var(--player-h)+12px)] max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-6 rounded-2xl bg-surface/85 px-3 pr-4 shadow-float ring-1 ring-line backdrop-blur-2xl backdrop-saturate-150">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setFullOpen(true)} aria-label="展开播放器" className="group relative shrink-0">
              <Cover src={current.artwork} className="h-14 w-14" rounded="rounded-[8px]" />
              <span className="absolute inset-0 flex items-center justify-center rounded-[8px] bg-black/45 opacity-0 transition group-hover:opacity-100">
                <Maximize2 className="h-5 w-5 text-white" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{current.title}</p>
              <p className={`mt-0.5 truncate text-xs ${error ? 'text-accent' : 'text-sub'}`}>{error || current.artist}</p>
            </div>
            <button onClick={() => toggle(current)} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
              className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${liked ? 'text-accent' : 'text-sub hover:text-ink'}`}>
              <Heart className="h-[18px] w-[18px]" fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <TransportRow />
            <SeekBar compact />
          </div>
          <div className="flex items-center justify-end gap-0.5">
            <button onClick={() => setFullOpen(true, 'lyrics')} aria-label="歌词" title="歌词" className="press flex h-9 w-9 items-center justify-center rounded-full text-sub hover:text-ink">
              <MicVocal className="h-[18px] w-[18px]" />
            </button>
            <button onClick={() => setFullOpen(true, 'queue')} aria-label="播放列表" title="播放列表" className="press flex h-9 w-9 items-center justify-center rounded-full text-sub hover:text-ink">
              <ListMusic className="h-[18px] w-[18px]" />
            </button>
            <VolumeControl />
          </div>
        </div>
      </div>
    </>
  );
}
