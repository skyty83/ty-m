'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MusicIcon } from 'lucide-react';

export function fmtTime(t: number) {
  if (!t || !Number.isFinite(t)) return '0:00';
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
}

export function fmtCount(n?: number | string) {
  const v = Number(n);
  if (!v) return '';
  if (v >= 1e8) return `${(v / 1e8).toFixed(1)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(1)}万`;
  return String(v);
}

// kuwo 图片均支持 https, 统一升级避免混合内容
export function safeImg(src?: string) {
  if (!src) return undefined;
  return src.replace(/^http:\/\//, 'https://');
}

export function Cover({ src, alt = '', className = '', rounded = 'rounded-[10px]', priority = false }: {
  src?: string; alt?: string; className?: string; rounded?: string; priority?: boolean;
}) {
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  const url = safeImg(src);
  return (
    <div className={`relative shrink-0 overflow-hidden bg-surface-2 ${rounded} ${className}`}>
      {url && state !== 'fail' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setState('ok')}
          onError={() => setState('fail')}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {(!url || state === 'fail') && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-2 to-surface-3 text-sub">
          <MusicIcon className="h-[38%] max-h-12 w-[38%] max-w-12" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}

export function EqBars({ on, className = 'bg-accent' }: { on: boolean; className?: string }) {
  return (
    <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0.55, 1, 0.7, 0.45].map((h, i) => (
        <span
          key={i}
          className={`eq-bar w-[3px] rounded-full ${className} ${on ? 'on' : ''}`}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.13}s` }}
        />
      ))}
    </span>
  );
}

// ── 骨架屏: 与最终布局同形 ────────────────────────────
export function Sk({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />;
}

export function TrackSkeleton({ rows = 8, cover = true }: { rows?: number; cover?: boolean }) {
  return (
    <div className="flex flex-col gap-1" role="status" aria-label="加载中">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2 sm:px-3">
          <Sk className="h-4 w-6" />
          {cover && <Sk className="h-11 w-11 !rounded-[6px]" />}
          <div className="flex flex-1 flex-col gap-2">
            <Sk className="h-3.5" />
            <Sk className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 10, round = false }: { count?: number; round?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5" aria-hidden="true">
          <Sk className={`aspect-square w-full ${round ? '!rounded-full' : '!rounded-[10px]'}`} />
          <Sk className="h-3.5 w-4/5" />
          <Sk className="h-3 w-1/2" />
        </div>
      ))}
    </>
  );
}

export function Empty({ icon: Icon, title, hint, action }: {
  icon: React.ElementType; title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface px-6 py-16 text-center shadow-card">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-base font-semibold">{title}</p>
      {hint && <p className="max-w-xs text-sm leading-relaxed text-sub">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4 shadow-card">
      <div className="min-w-0">
        <p className="text-sm font-semibold">内容加载失败</p>
        <p className="mt-0.5 break-words text-xs text-sub">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="press h-9 shrink-0 rounded-full bg-ink px-4 text-sm font-semibold text-bg">
          重试
        </button>
      )}
    </div>
  );
}

// 无限滚动哨兵
export function Sentinel({ onHit, done, loading }: { onHit: () => void; done: boolean; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onHit);
  useEffect(() => { cb.current = onHit; });
  useEffect(() => {
    const el = ref.current;
    if (!el || done) return;
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) cb.current(); }, { rootMargin: '480px' });
    io.observe(el);
    return () => io.disconnect();
  }, [done, loading]);
  return (
    <div ref={ref} className="flex h-16 items-center justify-center text-xs text-sub">
      {loading && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-label="加载更多" />}
      {done && !loading && <span>已经到底了</span>}
    </div>
  );
}

export function SectionHead({ title, action, sub }: { title: string; action?: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[22px] font-bold tracking-tight sm:text-2xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`press h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${on ? 'bg-ink text-bg' : 'bg-surface text-ink-2 shadow-card hover:text-ink'}`}
    >
      {children}
    </button>
  );
}
