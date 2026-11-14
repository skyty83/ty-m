'use client';

import { useEffect, useRef, useState } from 'react';
import { Disc3, Loader2 } from 'lucide-react';

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

export function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function Cover({ src, alt = '', className = '', priority = false, round = false }: {
  src?: string; alt?: string; className?: string; priority?: boolean; round?: boolean;
}) {
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  const url = safeImg(src);
  return (
    <div className={`relative shrink-0 overflow-hidden bg-surface-2 ${round ? 'rounded-full' : ''} ${className}`}>
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
        <div className="absolute inset-0 flex items-center justify-center text-sub">
          <Disc3 className="h-[36%] max-h-12 w-[36%] max-w-12" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

export function EqBars({ on, className = 'bg-ink' }: { on: boolean; className?: string }) {
  return (
    <span className="inline-flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0.55, 1, 0.7, 0.45].map((h, i) => (
        <span key={i} className={`eq-bar w-[3px] ${className} ${on ? 'on' : ''}`}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.13}s` }} />
      ))}
    </span>
  );
}

// ── 骨架屏 ───────────────────────────────────────────
export function Sk({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function TrackSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="加载中" className="border-t border-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line py-3.5">
          <Sk className="h-5 w-7" />
          <div className="flex flex-1 flex-col gap-2"><Sk className="h-3.5 w-2/3" /><Sk className="h-3 w-1/3" /></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5" aria-hidden="true">
          <Sk className="aspect-square w-full" />
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
    <div className="flex flex-col items-start gap-3 border-y border-line py-14">
      <Icon className="h-8 w-8 text-sub" strokeWidth={1.5} />
      <p className="text-xl font-bold">{title}</p>
      {hint && <p className="max-w-sm text-sm leading-relaxed text-sub">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const offline = /ETIMEDOUT|timeout|ECONN|fetch failed|Failed to fetch/i.test(message);
  return (
    <div role="alert" className="flex flex-col gap-4 border-y border-line py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-bold">{offline ? '音乐服务暂时连接不上' : '内容加载失败'}</p>
        <p className="mt-1 break-words text-sm text-sub">
          {offline ? '服务器无法访问曲库，请稍后重试。' : message}
        </p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="press h-10 shrink-0 self-start bg-ink px-5 text-sm font-semibold text-bg sm:self-auto">
          重新加载
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
    <div ref={ref} className="flex h-20 items-center justify-center text-xs text-sub">
      {loading && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-label="加载更多" />}
      {done && !loading && <span>已经到底了</span>}
    </div>
  );
}

// 栏目标题: 粗黑横线 + 标题, 不使用眉标
export function SectionHead({ title, action, count }: { title: string; action?: React.ReactNode; count?: number }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-t-2 border-line-strong pt-3">
      <h2 className="flex items-baseline gap-2 text-2xl font-black tracking-tight sm:text-[28px]">
        {title}
        {count != null && <span className="num text-base font-medium text-sub">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

// 下划线式标签页
export function Tabs<T extends string>({ items, value, onChange, label }: {
  items: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-hide flex gap-6 overflow-x-auto border-b border-line">
      {items.map(t => {
        const on = t.id === value;
        return (
          <button key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)}
            className={`relative shrink-0 pb-3 text-[15px] transition-colors ${on ? 'font-bold text-ink' : 'text-sub hover:text-ink'}`}>
            {t.label}
            {on && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-ink" />}
          </button>
        );
      })}
    </div>
  );
}

export function PopButton({ children, onClick, disabled, className = '', label }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label}
      className={`press inline-flex h-12 items-center gap-2 bg-pop px-6 text-[15px] font-bold text-onpop disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, disabled, className = '', label }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label}
      className={`press inline-flex h-12 items-center gap-2 border border-line-strong px-5 text-[15px] font-semibold text-ink hover:bg-ink hover:text-bg disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}
