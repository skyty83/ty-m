'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, Heart } from 'lucide-react';
import { usePlayer, type Pane } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { Cover, safeImg } from './ui';
import { SeekBar, TransportRow, VolumeControl } from './Controls';
import { TrackMenu } from './TrackList';
import { Lyrics, Queue, Vinyl } from './NowParts';

const PANES: { id: Pane; label: string }[] = [
  { id: 'cover', label: '唱片' },
  { id: 'lyrics', label: '歌词' },
  { id: 'queue', label: '播放列表' },
];

export default function FullPlayer() {
  const { current, fullOpen, setFullOpen, playing, error, pane, setPane } = usePlayer();
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
      className={`press flex h-11 w-11 shrink-0 items-center justify-center ${liked ? 'text-pop' : 'text-ink'}`}>
      <Heart className="h-6 w-6" fill={liked ? 'currentColor' : 'none'} />
    </button>
  );

  const err = error ? (
    <p role="alert" className="mb-3 border-l-[3px] border-pop pl-3 text-sm leading-relaxed text-ink-2">
      {error}。音源暂时不可用，请换一首试试。
    </p>
  ) : null;

  const paneSwitch = (desktop: boolean) => (
    <div role="tablist" aria-label="视图" className="flex gap-6">
      {PANES.filter(p => !desktop || p.id !== 'cover').map(p => {
        const on = desktop ? (pane === 'queue' ? p.id === 'queue' : p.id === 'lyrics') : pane === p.id;
        return (
          <button key={p.id} role="tab" aria-selected={on} onClick={() => setPane(p.id)}
            className={`relative pb-2 text-[15px] transition-colors ${on ? 'font-bold text-ink' : 'text-sub hover:text-ink'}`}>
            {p.label}
            {on && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-pop" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-label={`正在播放：${current.title}`} aria-hidden={!fullOpen} inert={!fullOpen}
      className={`scope-dark fixed inset-0 z-50 overflow-hidden bg-[#0b0b0b] transition-[transform,visibility] duration-500 ease-out-expo ${fullOpen ? 'visible translate-y-0' : 'invisible translate-y-full'}`}>
      {art && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" aria-hidden="true" referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover opacity-25 blur-[90px] saturate-125" />
      )}

      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+8px)] sm:px-8 lg:px-12">
        <header className="flex shrink-0 items-center justify-between border-b border-line pb-2"
          onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
          onTouchEnd={e => {
            if (touchY.current != null && e.changedTouches[0].clientY - touchY.current > 60) setFullOpen(false);
            touchY.current = null;
          }}>
          <button onClick={() => setFullOpen(false)} aria-label="收起" className="press -ml-2 flex h-11 w-11 items-center justify-center">
            <ChevronDown className="h-7 w-7" />
          </button>
          <p className="text-sm font-bold">{playing ? '正在播放' : '已暂停'}</p>
          <TrackMenu song={current} />
        </header>

        {/* 移动端 */}
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <div className="pt-4">{paneSwitch(false)}</div>
          <div className="min-h-0 flex-1 py-5">
            {pane === 'cover' && (
              <button onClick={() => setPane('lyrics')} aria-label="查看歌词" className="flex h-full w-full items-center justify-center">
                <Vinyl src={current.artwork} playing={playing} className="w-full max-w-[min(100%,46vh)]" />
              </button>
            )}
            {pane === 'lyrics' && <Lyrics />}
            {pane === 'queue' && <Queue />}
          </div>
          <div className="shrink-0">
            <div className="mb-3 flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[26px] font-black leading-tight tracking-tight">{current.title}</h2>
                <p className="mt-1 truncate text-[15px] text-sub">{current.artist}</p>
              </div>
              {like}
            </div>
            {err}
            <SeekBar />
            <div className="mt-2"><TransportRow large /></div>
          </div>
        </div>

        {/* 桌面端 */}
        <div className="hidden min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-16 py-8 lg:grid xl:gap-24">
          <div className="flex min-h-0 flex-col justify-center gap-8">
            <div className="flex items-center gap-8">
              <Vinyl src={current.artwork} playing={playing} className="w-[min(100%,48vh)]" />
            </div>
            <div className="max-w-[min(100%,56vh)]">
              <div className="mb-4 flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-4xl font-black leading-tight tracking-tight xl:text-5xl">{current.title}</h2>
                  <p className="mt-2 truncate text-lg text-sub">{current.artist}{current.album ? ` / ${current.album}` : ''}</p>
                </div>
                {like}
              </div>
              {err}
              <SeekBar />
              <div className="mt-1"><TransportRow large /></div>
              <VolumeControl className="mt-5 w-full" />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            {paneSwitch(true)}
            <div className="mt-4 min-h-0 flex-1">
              {pane === 'queue' ? <Queue /> : (
                <div className="flex h-full gap-6">
                  <Cover src={current.artwork} className="hidden h-16 w-16 xl:block" />
                  <div className="min-h-0 flex-1"><Lyrics size="lg" /></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
