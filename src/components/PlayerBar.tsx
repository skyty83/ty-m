'use client';

import { useRef } from 'react';
import { Heart, ListMusic, Maximize2, MicVocal, SkipForward } from 'lucide-react';
import { usePlayer, useProgress } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { Cover } from './ui';
import { PlayButton, SeekBar, TransportRow, VolumeControl } from './Controls';

function TopLine() {
  const { time, duration } = useProgress();
  return (
    <div className="absolute inset-x-0 top-0 h-[2px] bg-line" aria-hidden="true">
      <div className="h-full bg-ink transition-[width] duration-300 ease-linear" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
    </div>
  );
}

export default function PlayerBar() {
  const { current, setFullOpen, next, prev, loading, error } = usePlayer();
  const { isLiked, toggle } = useLiked();
  const touch = useRef<{ x: number; y: number } | null>(null);
  if (!current) return null;
  const liked = isLiked(current.id);
  const status = error ? '播放失败' : loading ? '缓冲中…' : current.artist;

  return (
    <>
      {/* 移动端: 贴在标签栏上方, 左右滑动切歌, 上滑或点击展开 */}
      <div className="fixed inset-x-0 z-40 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom))] lg:hidden">
        <div role="button" tabIndex={0}
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
          className="glass relative flex h-[var(--player-h)] items-center gap-3 border-t border-line bg-bg/95 pl-3 pr-1 backdrop-blur-xl">
          <TopLine />
          <Cover src={current.artwork} className="h-11 w-11" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight">{current.title}</p>
            <p className={`mt-1 truncate text-xs ${error ? 'font-semibold text-ink' : 'text-sub'}`}>{status}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); toggle(current); }} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
            className={`press flex h-11 w-10 items-center justify-center ${liked ? 'text-ink' : 'text-sub'}`}>
            <Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
          </button>
          <PlayButton size="sm" tone="pop" />
          <button onClick={e => { e.stopPropagation(); next(); }} aria-label="下一首" className="press flex h-11 w-10 items-center justify-center text-ink">
            <SkipForward className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 桌面端: 底部通栏 */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 hidden border-t border-line bg-bg/95 backdrop-blur-xl lg:block">
        <div className="grid h-[calc(var(--player-h)+16px)] grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-8 px-10">
          <div className="flex min-w-0 items-center gap-4">
            <button onClick={() => setFullOpen(true)} aria-label="展开播放器" className="group relative shrink-0">
              <Cover src={current.artwork} className="h-14 w-14" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                <Maximize2 className="h-5 w-5 text-white" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="truncate font-bold">{current.title}</p>
              <p className={`mt-0.5 truncate text-sm ${error ? 'font-semibold text-ink' : 'text-sub'}`}>{error || current.artist}</p>
            </div>
            <button onClick={() => toggle(current)} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
              className={`press flex h-9 w-9 shrink-0 items-center justify-center ${liked ? 'text-ink' : 'text-sub hover:text-ink'}`}>
              <Heart className="h-[18px] w-[18px]" fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <TransportRow />
            <SeekBar compact />
          </div>
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setFullOpen(true, 'lyrics')} aria-label="歌词" title="歌词" className="press flex h-9 w-9 items-center justify-center text-sub hover:text-ink">
              <MicVocal className="h-[18px] w-[18px]" />
            </button>
            <button onClick={() => setFullOpen(true, 'queue')} aria-label="播放列表" title="播放列表" className="press flex h-9 w-9 items-center justify-center text-sub hover:text-ink">
              <ListMusic className="h-[18px] w-[18px]" />
            </button>
            <VolumeControl />
          </div>
        </div>
      </div>
    </>
  );
}
