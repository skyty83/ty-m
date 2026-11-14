'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, Heart } from 'lucide-react';
import { usePlayer, type Pane } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { Cover, ICON_BTN, ICON_BTN_ON, Pills, safeImg } from './ui';
import { SeekBar, TransportRow, VolumeControl } from './Controls';
import { TrackMenu } from './TrackList';
import { Lyrics, Queue } from './NowParts';

const PANES: { id: Pane; label: string }[] = [
  { id: 'cover', label: '歌曲' },
  { id: 'lyrics', label: '歌词' },
  { id: 'queue', label: '队列' },
];

// 全屏播放器: 与 vod-site 音乐页同款 (封面模糊环境光 + 纸色蒙版)
export default function FullPlayer() {
  const { current, fullOpen, setFullOpen, error, pane, setPane } = usePlayer();
  const { isLiked, toggle } = useLiked();
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (!fullOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [fullOpen]);

  if (!current) return null;
  const liked = isLiked(current.id);
  const art = safeImg(current.artwork);

  const like = (
    <button onClick={() => toggle(current)} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
      className={`${liked ? ICON_BTN_ON : `${ICON_BTN} bg-card ring-1 ring-line`} h-11 w-11 shrink-0`}>
      <Heart size={20} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
    </button>
  );
  const err = error ? (
    <div role="alert" className="mb-3 flex items-center gap-3 rounded-card bg-card px-3 py-3 text-sm ring-1 ring-line">
      <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-ink px-2.5 text-xs font-bold text-paper">错误</span>
      <span className="min-w-0 break-words">{error}，换一首试试</span>
    </div>
  ) : null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`正在播放：${current.title}`} aria-hidden={!fullOpen} inert={!fullOpen}
      className={`fixed inset-0 z-[70] flex flex-col overflow-hidden bg-paper transition-[transform,visibility] duration-500 ease-out-expo ${fullOpen ? 'visible translate-y-0' : 'invisible translate-y-full'}`}>
      {art && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" aria-hidden="true" referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-3xl" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-paper/60" aria-hidden="true" />

      <div className="wrap relative flex min-h-0 flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex shrink-0 items-center justify-between gap-3"
          onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
          onTouchEnd={e => {
            if (touchY.current != null && e.changedTouches[0].clientY - touchY.current > 60) setFullOpen(false);
            touchY.current = null;
          }}>
          <button onClick={() => setFullOpen(false)} aria-label="收起播放器"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-card px-4 text-ink ring-1 ring-line transition-colors hover:bg-card-2">
            <ChevronDown size={20} strokeWidth={2} />
          </button>
          <div className="min-w-0 lg:hidden"><Pills label="视图" bleed={false} size="sm" value={pane} onChange={setPane} items={PANES} /></div>
          <div className="hidden lg:block"><Pills label="视图" bleed={false} value={pane === 'queue' ? 'queue' : 'lyrics'} onChange={setPane} items={PANES.slice(1)} /></div>
          <TrackMenu song={current} />
        </div>

        {/* 移动端 */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 pt-5 lg:hidden">
          <div className="min-h-0 flex-1">
            {pane === 'cover' && (
              <button onClick={() => setPane('lyrics')} aria-label="查看歌词" className="flex h-full w-full items-center justify-center py-2">
                <Cover src={current.artwork} priority rounded="rounded-panel" className="aspect-square w-full max-w-[min(100%,42vh)] shadow-lift" />
              </button>
            )}
            {pane === 'lyrics' && <Lyrics />}
            {pane === 'queue' && <Queue />}
          </div>
          <div className="shrink-0">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-3xl font-black tracking-[-0.035em]">{current.title}</h2>
                <p className="mt-1 truncate text-sm text-sub">{current.artist}</p>
              </div>
              {like}
            </div>
            {err}
            <SeekBar />
            <div className="mt-4"><TransportRow large /></div>
          </div>
        </div>

        {/* 桌面端 */}
        <div className="hidden min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-16 pt-8 lg:grid xl:gap-24">
          <div className="mx-auto flex w-full max-w-[min(100%,52vh)] flex-col gap-7">
            <Cover src={current.artwork} priority rounded="rounded-panel" className="aspect-square w-full shadow-lift" />
            <div>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-4xl font-black leading-[1.05] tracking-[-0.04em]">{current.title}</h2>
                  <p className="mt-2 truncate text-sub">{current.artist}{current.album ? ` · ${current.album}` : ''}</p>
                </div>
                {like}
              </div>
              {err}
              <SeekBar />
              <div className="mt-3"><TransportRow large /></div>
              <VolumeControl className="mt-4 w-full" />
            </div>
          </div>
          <div className="h-full min-h-0 py-6">{pane === 'queue' ? <Queue /> : <Lyrics size="lg" />}</div>
        </div>
      </div>
    </div>
  );
}
