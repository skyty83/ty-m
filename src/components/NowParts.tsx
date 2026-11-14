'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { usePlayer, useProgress } from './PlayerProvider';
import { activeLine } from '@/lib/lrc';
import { Cover, ICON_BTN, Sk, WaveformBars } from './ui';

export function Lyrics({ size = 'md' }: { size?: 'md' | 'lg' }) {
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
        {[70, 50, 85, 60, 40].map((w, i) => <div key={i} style={{ width: `${w}%` }}><Sk className="h-5 rounded-full" /></div>)}
      </div>
    );
  }
  if (!lyrics.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-xl font-black tracking-[-0.03em]">暂无歌词</p>
        <p className="text-sm text-sub">《{current?.title}》还没有可显示的歌词</p>
      </div>
    );
  }
  const text = size === 'lg' ? 'text-[26px] xl:text-[32px]' : 'text-xl';
  return (
    <div ref={boxRef}
      onWheel={() => { userScroll.current = Date.now(); }}
      onTouchMove={() => { userScroll.current = Date.now(); }}
      className="shelf-scroll relative h-full overflow-y-auto py-[40%] [mask-image:linear-gradient(transparent,#000_14%,#000_86%,transparent)]">
      {lyrics.map((l, i) => (
        <button key={i} data-i={i} onClick={() => seek(l.time)}
          className={`block w-full py-2 text-left font-black leading-snug tracking-[-0.03em] transition-colors duration-500 ${text} ${i === idx ? 'text-ink' : 'text-ink/25 hover:text-ink/55'}`}>
          {l.text}
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
  if (!queue.length) return <p className="text-sm text-sub">播放队列是空的</p>;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between px-1">
        <span className="text-sm font-black tracking-[-0.035em]">播放队列</span>
        <span className="text-xs tabular-nums text-sub">{queue.length} 首</span>
      </div>
      <ol ref={listRef} className="shelf-scroll flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {queue.map((s, i) => {
          const on = i === index;
          return (
            <li key={`${s.id}-${i}`} aria-current={on ? 'true' : undefined}
              className={`group flex items-center gap-1 rounded-card transition-colors hover:bg-card-2 ${on ? 'bg-card-2' : ''}`}>
              <button onClick={() => playAt(i)} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left">
                <span className="flex w-5 shrink-0 justify-center">
                  {on && playing ? <WaveformBars playing /> : <span className={`text-xs tabular-nums ${on ? 'font-bold text-pop' : 'text-sub'}`}>{i + 1}</span>}
                </span>
                <Cover src={s.artwork} className="h-10 w-10" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${on ? 'text-pop' : ''}`}>{s.title}</span>
                  <span className="block truncate text-xs text-sub">{s.artist}</span>
                </span>
              </button>
              {!on && (
                <button onClick={() => removeAt(i)} aria-label={`移除 ${s.title}`}
                  className={`${ICON_BTN} mr-1 h-8 w-8 shrink-0 text-sub sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100`}>
                  <X size={15} />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
