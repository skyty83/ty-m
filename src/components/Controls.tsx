'use client';

import { Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayer, useProgress } from './PlayerProvider';
import { BTN_PRIMARY, ICON_BTN, ICON_BTN_ON, fmtTime } from './ui';

export function PlayButton({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { playing, loading, toggle, current } = usePlayer();
  const box = size === 'lg' ? 'h-20 w-20 shadow-lift' : size === 'md' ? 'h-12 w-12' : 'h-11 w-11';
  const ic = size === 'lg' ? 30 : 20;
  return (
    <button onClick={e => { e.stopPropagation(); toggle(); }} disabled={!current}
      aria-label={playing ? '暂停' : '播放'} className={`${BTN_PRIMARY} shrink-0 ${box} ${className}`}>
      {loading && !playing && current ? <Loader2 size={ic} className="motion-safe:animate-spin" />
        : playing ? <Pause size={ic} fill="currentColor" />
        : <Play size={ic} fill="currentColor" className={size === 'lg' ? 'ml-1' : 'ml-0.5'} />}
    </button>
  );
}

export function TransportRow({ large = false }: { large?: boolean }) {
  const { prev, next, repeat, cycleRepeat, shuffle, toggleShuffle } = usePlayer();
  const side = large ? 'h-11 w-11' : 'h-9 w-9';
  const skip = large ? 'h-12 w-12' : 'h-10 w-10';
  const repeatLabel = repeat === 'one' ? '单曲循环' : repeat === 'all' ? '列表循环' : '顺序播放';
  return (
    <div className={`flex items-center ${large ? 'justify-between gap-2' : 'gap-2'}`}>
      <button onClick={toggleShuffle} aria-label="随机播放" aria-pressed={shuffle} title="随机播放"
        className={`${shuffle ? ICON_BTN_ON : ICON_BTN} ${side}`}>
        <Shuffle size={large ? 20 : 16} strokeWidth={2} />
      </button>
      <button onClick={prev} aria-label="上一首" className={`${ICON_BTN} ${skip}`}>
        <SkipBack size={large ? 24 : 18} strokeWidth={2} fill="currentColor" />
      </button>
      <PlayButton size={large ? 'lg' : 'md'} className={large ? '' : 'mx-1'} />
      <button onClick={next} aria-label="下一首" className={`${ICON_BTN} ${skip}`}>
        <SkipForward size={large ? 24 : 18} strokeWidth={2} fill="currentColor" />
      </button>
      <button onClick={cycleRepeat} aria-label={repeatLabel} title={repeatLabel}
        className={`${repeat !== 'off' ? ICON_BTN_ON : ICON_BTN} ${side}`}>
        {repeat === 'one' ? <Repeat1 size={large ? 20 : 16} strokeWidth={2} /> : <Repeat size={large ? 20 : 16} strokeWidth={2} />}
      </button>
    </div>
  );
}

export function SeekBar({ compact = false }: { compact?: boolean }) {
  const { time, duration } = useProgress();
  const { seek } = usePlayer();
  const pct = duration ? (time / duration) * 100 : 0;
  const slider = (
    <input type="range" className={`range ${compact ? '' : 'thumb'}`} min={0} max={duration || 0} step={0.1}
      value={Math.min(time, duration || 0)} onChange={e => seek(Number(e.target.value))}
      aria-label="播放进度" aria-valuetext={`${fmtTime(time)} / ${fmtTime(duration)}`} disabled={!duration}
      style={{ '--pct': `${pct}%` } as React.CSSProperties} />
  );
  if (compact) {
    return (
      <div className="flex w-full items-center gap-3 text-xs tabular-nums text-sub">
        <span className="w-10 shrink-0 text-right">{fmtTime(time)}</span>{slider}<span className="w-10 shrink-0">{fmtTime(duration)}</span>
      </div>
    );
  }
  return (
    <div className="w-full space-y-1">
      {slider}
      <div className="flex justify-between text-xs tabular-nums text-sub"><span>{fmtTime(time)}</span><span>{fmtTime(duration)}</span></div>
    </div>
  );
}

export function VolumeControl({ className = 'w-40' }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const v = muted ? 0 : volume;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button onClick={toggleMute} aria-label={v === 0 ? '取消静音' : '静音'} className={`${ICON_BTN} h-9 w-9 shrink-0`}>
        {v === 0 ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
      </button>
      <input type="range" className="range vol" min={0} max={1} step={0.01} value={v}
        onChange={e => setVolume(Number(e.target.value))} aria-label="音量"
        style={{ '--pct': `${v * 100}%`, '--fill': 'var(--ink)' } as React.CSSProperties} />
    </div>
  );
}
