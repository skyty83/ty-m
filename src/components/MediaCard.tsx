import Link from 'next/link';
import { Headphones } from 'lucide-react';
import { Cover, fmtCount } from './ui';

export function MediaCard({ href, title, subtitle, artwork, count, round = false, index = 0 }: {
  href: string; title: string; subtitle?: string; artwork?: string; count?: number | string; round?: boolean; index?: number;
}) {
  const c = fmtCount(count);
  return (
    <Link
      href={href}
      className="rise group flex min-w-0 flex-col gap-2.5 rounded-2xl"
      style={{ '--i': index % 12 } as React.CSSProperties}
    >
      <div className="relative">
        <Cover
          src={artwork}
          rounded={round ? 'rounded-full' : 'rounded-[10px]'}
          className="aspect-square w-full shadow-card transition duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:shadow-float"
        />
      </div>
      <div className={`min-w-0 px-0.5 ${round ? 'text-center' : ''}`}>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{title}</p>
        {(subtitle || c) && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-sub">
            {c && <><Headphones className="h-3 w-3 shrink-0" /><span className="tabular-nums">{c}</span></>}
            {c && subtitle && <span className="mx-0.5 opacity-50">/</span>}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {children}
    </div>
  );
}

export function Shelf({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      role="list"
      aria-label={label}
      className="scrollbar-hide -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3.5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8"
    >
      {children}
    </div>
  );
}
