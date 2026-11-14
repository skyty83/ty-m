'use client';

import { useRef } from 'react';
import { Heart, ListMusic, MicVocal } from 'lucide-react';
import { usePlayer, useProgress } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { Cover, ICON_BTN, WaveformBars } from './ui';
import { PlayButton, SeekBar, TransportRow, VolumeControl } from './Controls';

function MiniProgress() {
  const { time, duration } = useProgress();
  return (
    <div className="absolute bottom-1.5 left-5 right-5 h-1 overflow-hidden rounded-full bg-card-2" aria-hidden="true">
      <div className="h-full rounded-full bg-accent" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
    </div>
  );
}

// 底部播放条: 与 vod-site 音乐页同款悬浮面板 (圆角 24px + 毛玻璃)
export default function PlayerBar() {
  const { current, setFullOpen, next, prev, loading, error, playing } = usePlayer();
  const { isLiked, toggle } = useLiked();
  const touch = useRef<{ x: number; y: number } | null>(null);
  if (!current) return null;
  const liked = isLiked(current.id);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[45] pb-[env(safe-area-inset-bottom)]">
      <div className="wrap">
        <div className="relative mb-3 rounded-panel bg-card/85 shadow-lift ring-1 ring-line backdrop-blur-xl">
          {/* 移动端迷你条: 左右滑动切歌, 上滑或点击展开 */}
          <div className="relative lg:hidden">
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
              className="flex h-[72px] cursor-pointer select-none items-center gap-3 px-2.5">
              <Cover src={current.artwork} className="h-12 w-12 ring-1 ring-line" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{current.title}</p>
                <p className={`mt-0.5 truncate text-xs ${error ? 'font-bold text-pop' : 'text-sub'}`}>{error ? '播放失败, 换一首试试' : loading ? '缓冲中...' : current.artist}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); toggle(current); }} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
                className={`${ICON_BTN} h-10 w-10 shrink-0 ${liked ? 'text-pop' : 'text-sub'}`}>
                <Heart size={19} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
              </button>
              <PlayButton size="sm" />
            </div>
            <MiniProgress />
          </div>

          {/* 桌面端 */}
          <div className="hidden h-[88px] grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-6 px-3 pr-5 lg:grid">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setFullOpen(true)} aria-label="展开播放器" className="shrink-0">
                <Cover src={current.artwork} className="h-16 w-16 ring-1 ring-line" />
              </button>
              <div className="min-w-0">
                <p className={`truncate text-sm font-bold ${playing ? 'text-pop' : 'text-ink'}`}>{current.title}</p>
                <p className={`mt-0.5 flex items-center gap-2 truncate text-xs ${error ? 'font-bold text-pop' : 'text-sub'}`}>
                  {playing && !error && <WaveformBars playing />}{error || current.artist}
                </p>
              </div>
              <button onClick={() => toggle(current)} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
                className={`${ICON_BTN} h-9 w-9 shrink-0 ${liked ? 'text-pop' : 'text-sub hover:text-ink'}`}>
                <Heart size={17} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1">
              <TransportRow />
              <SeekBar compact />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setFullOpen(true, 'lyrics')} aria-label="歌词" title="歌词" className={`${ICON_BTN} h-9 w-9`}><MicVocal size={17} strokeWidth={2} /></button>
              <button onClick={() => setFullOpen(true, 'queue')} aria-label="播放队列" title="播放队列" className={`${ICON_BTN} h-9 w-9`}><ListMusic size={17} strokeWidth={2} /></button>
              <VolumeControl />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
