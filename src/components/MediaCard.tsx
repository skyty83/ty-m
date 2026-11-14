import Link from 'next/link';
import { Cover, fmtCount } from './ui';

export function MediaCard({ href, title, subtitle, artwork, count, round = false, index = 0, big = false }: {
  href: string; title: string; subtitle?: string; artwork?: string; count?: number | string; round?: boolean; index?: number; big?: boolean;
}) {
  const c = fmtCount(count);
  return (
    <Link href={href} className={`rise group flex min-w-0 flex-col gap-3 ${big ? 'md:col-span-2 md:row-span-2' : ''}`}
      style={{ '--i': index % 12 } as React.CSSProperties}>
      <div className="relative overflow-hidden">
        <Cover src={artwork} round={round}
          className="aspect-square w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]" />
        {c && (
          <span className="num absolute left-0 top-0 bg-ink px-2 py-1 text-[11px] font-medium text-bg">
            {c}
          </span>
        )}
      </div>
      <div className={`min-w-0 ${round ? 'text-center' : ''}`}>
        <p className={`line-clamp-2 font-semibold leading-snug ${big ? 'text-base md:text-xl' : 'text-sm'}`}>
          <span className="u-hover">{title}</span>
        </p>
        {subtitle && <p className="mt-1 truncate text-xs text-sub">{subtitle}</p>}
      </div>
    </Link>
  );
}

export function CardGrid({ children, dense = false }: { children: React.ReactNode; dense?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 ${dense ? 'xl:grid-cols-6' : 'xl:grid-cols-5'}`}>
      {children}
    </div>
  );
}

export function Shelf({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="list" aria-label={label}
      className="scrollbar-hide -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10">
      {children}
    </div>
  );
}
