'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { usePlayer, useProgress } from './PlayerProvider';
import { activeLine } from '@/lib/lrc';
import { Cover, EqBars, pad2 } from './ui';

export function Lyrics({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { lyrics, seek, current } = usePlayer();
  const { time } = useProgress();
  const boxRef = useRef<HTMLDivElement>(null);
  const idx = lyrics ? activeLine(lyrics, time) : -1;
  const userScroll = useRef(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || idx < 0 || Date.now() - userScroll.current < 3000) return;
    const el = box.querySelector<HTMLElement>(`[data-i="${idx}"]`);
    if (el) box.scrollTo({ top: el.offsetTop - box.clientHeight * 0.4 + el.clientHeight / 2, behavior: 'smooth' });
  }, [idx]);

  if (lyrics === null) {
    return (
      <div className="flex h-full flex-col justify-center gap-5" aria-label="歌词加载中">
        {[70, 50, 85, 60, 40].map((w, i) => <div key={i} className="skeleton h-5" style={{ width: `${w}%` }} />)}
      </div>
    );
  }
  if (!lyrics.length) {
    return (
      <div className="flex h-full flex-col justify-center gap-2">
        <p className="text-lg font-bold text-ink-2">暂无歌词</p>
        <p className="text-sm text-sub">《{current?.title}》还没有可显示的歌词</p>
      </div>
    );
  }
  const text = size === 'lg' ? 'text-[28px] xl:text-[34px]' : size === 'md' ? 'text-[22px]' : 'text-base';
  return (
    <div ref={boxRef}
      onWheel={() => { userScroll.current = Date.now(); }}
      onTouchMove={() => { userScroll.current = Date.now(); }}
      className="scrollbar-hide relative h-full overflow-y-auto py-[40%] [mask-image:linear-gradient(transparent,#000_14%,#000_86%,transparent)]">
      {lyrics.map((l, i) => (
        <button key={i} data-i={i} onClick={() => seek(l.time)}
          className={`block w-full py-2 text-left font-black leading-snug tracking-tight transition-colors duration-500 ${text} ${i === idx ? 'text-ink' : 'text-ink/25 hover:text-ink/55'}`}>
          {i === idx ? <span className="mark">{l.text}</span> : l.text}
        </button>
      ))}
    </div>
  );
}

export function Queue() {
  const { queue, index, playAt, playing, removeAt } = usePlayer();
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'center' });
  }, []);
  if (!queue.length) return <p className="text-sm text-sub">播放列表是空的</p>;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="num mb-2 shrink-0 text-xs text-sub">共 {queue.length} 首 / 接下来 {Math.max(0, queue.length - index - 1)} 首</p>
      <ol ref={listRef} className="thin-scroll min-h-0 flex-1 overflow-y-auto border-t border-line">
        {queue.map((s, i) => {
          const on = i === index;
          return (
            <li key={`${s.id}-${i}`} aria-current={on ? 'true' : undefined}
              className={`group flex items-center gap-2 border-b border-line ${i < index ? 'opacity-45' : ''}`}>
              <button onClick={() => playAt(i)} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left">
                <span className="num w-6 shrink-0 text-xs text-sub">{on ? <EqBars on={playing} className="bg-pop" /> : pad2(i + 1)}</span>
                <Cover src={s.artwork} className="h-9 w-9" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{on ? <span className="mark">{s.title}</span> : s.title}</span>
                  <span className="block truncate text-xs text-sub">{s.artist}</span>
                </span>
              </button>
              {!on && (
                <button onClick={() => removeAt(i)} aria-label={`移除 ${s.title}`}
                  className="press flex h-8 w-8 shrink-0 items-center justify-center text-sub hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// 黑胶唱片: 封面作为中心标签, 播放时旋转 (减少动态效果时静止)
export function Vinyl({ src, playing, className = '' }: { src?: string; playing: boolean; className?: string }) {
  return (
    <div className={`vinyl relative aspect-square rounded-full ${className}`}>
      <div className={`spin-slow absolute inset-0 flex items-center justify-center ${playing ? 'on' : ''}`}>
        <Cover src={src} round priority className="h-[44%] w-[44%] ring-4 ring-black/60" />
        <span className="absolute h-[3.5%] w-[3.5%] rounded-full bg-[#0b0b0b] ring-1 ring-white/20" aria-hidden="true" />
      </div>
    </div>
  );
}
