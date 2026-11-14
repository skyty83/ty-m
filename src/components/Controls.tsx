'use client';

import { Loader2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayer, useProgress } from './PlayerProvider';
import { fmtTime } from './ui';

export function PlayButton({ size = 'md', tone = 'ink', className = '' }: {
  size?: 'sm' | 'md' | 'lg'; tone?: 'ink' | 'accent' | 'bare'; className?: string;
}) {
  const { playing, loading, toggle, current } = usePlayer();
  const box = size === 'lg' ? 'h-[72px] w-[72px]' : size === 'md' ? 'h-10 w-10' : 'h-10 w-10';
  const ic = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  const color = tone === 'accent' ? 'bg-accent text-onaccent' : tone === 'ink' ? 'bg-ink text-bg' : 'text-ink';
  return (
    <button
      onClick={e => { e.stopPropagation(); toggle(); }}
      disabled={!current}
      aria-label={playing ? '暂停' : '播放'}
      className={`press flex shrink-0 items-center justify-center rounded-full disabled:opacity-40 ${box} ${color} ${className}`}
    >
      {loading && !playing && current
        ? <Loader2 className={`${ic} motion-safe:animate-spin`} />
        : playing
          ? <Pause className={ic} fill="currentColor" strokeWidth={0} />
          : <Play className={`${ic} translate-x-[2px]`} fill="currentColor" strokeWidth={0} />}
    </button>
  );
}

export function TransportRow({ large = false }: { large?: boolean }) {
  const { prev, next, repeat, cycleRepeat, shuffle, toggleShuffle } = usePlayer();
  const side = large ? 'h-11 w-11' : 'h-8 w-8';
  const skipBox = large ? 'h-14 w-14' : 'h-9 w-9';
  const ic = large ? 'h-[22px] w-[22px]' : 'h-[17px] w-[17px]';
  const skip = large ? 'h-8 w-8' : 'h-5 w-5';
  const repeatLabel = repeat === 'one' ? '单曲循环' : repeat === 'all' ? '列表循环' : '顺序播放';
  return (
    <div className={`flex items-center ${large ? 'justify-between' : 'gap-4'}`}>
      <button onClick={toggleShuffle} aria-label={shuffle ? '关闭随机播放' : '随机播放'} aria-pressed={shuffle} title="随机播放"
        className={`press flex items-center justify-center rounded-full ${side} ${shuffle ? 'text-accent' : 'text-sub hover:text-ink'}`}>
        <Shuffle className={ic} />
      </button>
      <button onClick={prev} aria-label="上一首" className={`press flex items-center justify-center rounded-full text-ink ${skipBox}`}>
        <SkipBack className={skip} fill="currentColor" strokeWidth={1.5} />
      </button>
      <PlayButton size={large ? 'lg' : 'md'} tone="ink" />
      <button onClick={next} aria-label="下一首" className={`press flex items-center justify-center rounded-full text-ink ${skipBox}`}>
        <SkipForward className={skip} fill="currentColor" strokeWidth={1.5} />
      </button>
      <button onClick={cycleRepeat} aria-label={repeatLabel} title={repeatLabel}
        className={`press flex items-center justify-center rounded-full ${side} ${repeat !== 'off' ? 'text-accent' : 'text-sub hover:text-ink'}`}>
        {repeat === 'one' ? <Repeat1 className={ic} /> : <Repeat className={ic} />}
      </button>
    </div>
  );
}

export function SeekBar({ compact = false }: { compact?: boolean }) {
  const { time, duration } = useProgress();
  const { seek } = usePlayer();
  const pct = duration ? (time / duration) * 100 : 0;
  const slider = (
    <input
      type="range"
      className={`range ${compact ? '' : 'thumb'}`}
      min={0}
      max={duration || 0}
      step={0.1}
      value={Math.min(time, duration || 0)}
      onChange={e => seek(Number(e.target.value))}
      aria-label="播放进度"
      aria-valuetext={`${fmtTime(time)} / ${fmtTime(duration)}`}
      disabled={!duration}
      style={{ '--pct': `${pct}%` } as React.CSSProperties}
    />
  );
  if (compact) {
    return (
      <div className="flex w-full items-center gap-2.5 text-[11px] tabular-nums text-sub">
        <span className="w-9 text-right">{fmtTime(time)}</span>{slider}<span className="w-9">{fmtTime(duration)}</span>
      </div>
    );
  }
  return (
    <div className="w-full text-xs tabular-nums text-sub">
      {slider}
      <div className="flex justify-between"><span>{fmtTime(time)}</span><span>{fmtTime(duration)}</span></div>
    </div>
  );
}

export function VolumeControl({ className = 'w-32' }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer();
  const v = muted ? 0 : volume;
  const Icon = v === 0 ? VolumeX : v < 0.5 ? Volume1 : Volume2;
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button onClick={toggleMute} aria-label={v === 0 ? '取消静音' : '静音'} className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sub hover:text-ink">
        <Icon className="h-[18px] w-[18px]" />
      </button>
      <input
        type="range" className="range" min={0} max={1} step={0.01} value={v}
        onChange={e => setVolume(Number(e.target.value))}
        aria-label="音量"
        style={{ '--pct': `${v * 100}%` } as React.CSSProperties}
      />
    </div>
  );
}
