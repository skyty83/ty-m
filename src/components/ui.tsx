'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Disc3, Loader2 } from 'lucide-react';

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

// 共享按钮样式 (与 vod-site 一致: 所有可交互控件为胶囊形)
export const ICON_BTN = 'inline-flex items-center justify-center rounded-full text-ink transition-colors hover:bg-card-2 disabled:opacity-40 disabled:hover:bg-transparent';
export const ICON_BTN_ON = 'inline-flex items-center justify-center rounded-full bg-ink text-paper transition-colors';
export const BTN_PRIMARY = 'inline-flex items-center justify-center rounded-full bg-accent text-onaccent transition-transform duration-300 ease-out-expo hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100';

export function Cover({ src, alt = '', className = '', priority = false, round = false, rounded = 'rounded-card' }: {
  src?: string; alt?: string; className?: string; priority?: boolean; round?: boolean; rounded?: string;
}) {
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  const url = safeImg(src);
  return (
    <div className={`relative shrink-0 overflow-hidden bg-card-2 ${round ? 'rounded-full' : rounded} ${className}`}>
      {url && state !== 'fail' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" referrerPolicy="no-referrer"
          onLoad={() => setState('ok')} onError={() => setState('fail')}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`} />
      )}
      {(!url || state === 'fail') && (
        <div className="absolute inset-0 flex items-center justify-center text-sub">
          <Disc3 className="h-[36%] max-h-14 w-[36%] max-w-14" strokeWidth={1.75} />
        </div>
      )}
    </div>
  );
}

// 均衡器动画条: 只在真正播放时跳动
export function WaveformBars({ playing, className = 'bg-pop' }: { playing: boolean; className?: string }) {
  return (
    <span className="inline-flex h-4 items-end gap-[2px]" aria-hidden="true">
      {[0.6, 1, 0.75, 0.5].map((h, i) => (
        <span key={i} className={`w-[3px] rounded-full ${className} ${playing ? 'musicbar' : ''}`}
          style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s`, transformOrigin: 'bottom' }} />
      ))}
    </span>
  );
}

export function Sk({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function TrackSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="加载中" className="flex flex-col gap-1 rounded-panel bg-card p-2 ring-1 ring-line sm:p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Sk className="h-4 w-6 rounded-full" />
          <Sk className="h-11 w-11 rounded-card" />
          <div className="flex flex-1 flex-col gap-2"><Sk className="h-3.5 w-2/3 rounded-full" /><Sk className="h-3 w-1/3 rounded-full" /></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3" aria-hidden="true">
          <Sk className="aspect-square w-full rounded-card" />
          <Sk className="h-3.5 w-4/5 rounded-full" />
          <Sk className="h-3 w-1/2 rounded-full" />
        </div>
      ))}
    </>
  );
}

export function Empty({ icon: Icon, title, hint, action }: {
  icon: React.ElementType; title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-panel bg-card px-6 py-20 text-center text-sub ring-1 ring-line">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-card-2">
        <Icon size={28} strokeWidth={2} />
      </span>
      <p className="text-lg font-black tracking-[-0.03em] text-ink">{title}</p>
      {hint && <p className="max-w-sm text-sm leading-relaxed">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const offline = /ETIMEDOUT|timeout|ECONN|fetch failed|Failed to fetch/i.test(message);
  return (
    <div role="alert" className="flex flex-col gap-4 rounded-panel bg-card p-5 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full bg-ink px-2.5 text-xs font-bold text-paper">错误</span>
        <div className="min-w-0">
          <p className="font-black tracking-[-0.02em]">{offline ? '音乐服务暂时连接不上' : '内容加载失败'}</p>
          <p className="mt-1 break-words text-sm text-sub">{offline ? '服务器无法访问曲库，请稍后重试。' : message}</p>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className={`${BTN_PRIMARY} h-11 shrink-0 self-start px-6 text-sm font-black sm:self-auto`}>重新加载</button>
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
    <div ref={ref} className="flex h-20 items-center justify-center gap-2 text-xs text-sub">
      {loading && <><Loader2 size={14} className="motion-safe:animate-spin" />加载更多...</>}
      {done && !loading && <span>已全部加载</span>}
    </div>
  );
}

// 栏目标题 (与 vod-site SectionHead 一致): 超大粗体, 可选拉丁字标
export function SectionHead({ title, kicker, href, linkLabel = '全部', action }: {
  title: string; kicker?: string; href?: string; linkLabel?: string; action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <h2 className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 text-4xl font-black leading-none tracking-[-0.045em] text-ink sm:text-6xl">
        {kicker && <span className="font-wide text-[0.6em] font-extrabold text-pop">{kicker}</span>}
        <span>{title}</span>
      </h2>
      {href ? <AllLink href={href} label={linkLabel} /> : action}
    </div>
  );
}

export function AllLink({ href, label = '全部' }: { href: string; label?: string }) {
  return (
    <Link href={href}
      className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-full pl-4 pr-1.5 text-sm font-bold text-ink ring-1 ring-line transition-colors duration-200 hover:bg-ink hover:text-paper">
      {label}
      <span className="grid size-7 place-items-center rounded-full bg-accent text-onaccent transition-transform duration-300 group-hover:rotate-45">
        <ArrowUpRight size={15} strokeWidth={2.5} aria-hidden="true" />
      </span>
    </Link>
  );
}

// 胶囊筛选条 (与 vod-site 导航/筛选一致)
export function Pills<T extends string>({ items, value, onChange, label, bleed = true, size = 'md' }: {
  items: { id: T; label: string; icon?: React.ElementType }[]; value: T; onChange: (v: T) => void; label: string; bleed?: boolean; size?: 'sm' | 'md';
}) {
  return (
    <div role="tablist" aria-label={label} className={`scrollbar-hide flex min-w-0 gap-2 overflow-x-auto ${bleed ? '-mx-4 px-4 sm:mx-0 sm:px-0' : ''}`}>
      {items.map(({ id, label: l, icon: Icon }) => {
        const on = id === value;
        return (
          <button key={id || 'all'} role="tab" aria-selected={on} onClick={() => onChange(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full text-sm font-bold transition-colors ${size === 'sm' ? 'h-9 px-3.5' : 'h-10 px-4 sm:px-5'} ${on ? 'bg-accent text-onaccent' : 'bg-card text-ink/70 ring-1 ring-line hover:bg-card-2 hover:text-ink'}`}>
            {Icon && <Icon size={15} strokeWidth={2.25} />}{l}
          </button>
        );
      })}
    </div>
  );
}

// 横向货架
export function Row({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <ul aria-label={label}
      className="shelf-scroll -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-6 pt-2 sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10">
      {children}
    </ul>
  );
}
