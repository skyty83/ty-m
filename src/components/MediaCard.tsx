import Link from 'next/link';
import { Headphones, Play } from 'lucide-react';
import { Cover, fmtCount } from './ui';

// 与 vod-site PosterCard 同一交互: 悬停上浮 + 青柠描边 + 播放胶囊 (方形封面)
export function MediaCard({ href, title, subtitle, artwork, count, round = false, className = '' }: {
  href: string; title: string; subtitle?: string; artwork?: string; count?: number | string; round?: boolean; className?: string;
}) {
  const c = fmtCount(count);
  return (
    <Link href={href} className={`group block min-w-0 ${className}`}>
      <div className={`relative aspect-square overflow-hidden bg-card-2 ring-1 ring-line transition duration-500 ease-out-expo group-hover:-translate-y-2 group-hover:shadow-lift group-hover:ring-2 group-hover:ring-accent group-focus-visible:-translate-y-2 ${round ? 'rounded-full' : 'rounded-card'}`}>
        <Cover src={artwork} round={round} className="h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.07]" />
        {!round && (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex h-9 translate-y-2 items-center gap-1.5 rounded-full bg-accent pl-3 pr-4 text-[13px] font-bold text-onaccent opacity-0 transition duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden">
            <Play size={13} fill="currentColor" aria-hidden="true" />播放
          </span>
        )}
      </div>
      <div className={`px-0.5 pt-3 ${round ? 'text-center' : ''}`}>
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em] text-ink">{title}</h3>
        {(subtitle || c) && (
          <p className="mt-1 flex items-baseline justify-between gap-2 text-[13px] text-sub">
            <span className="truncate">{subtitle || ' '}</span>
            {c && <span className="inline-flex shrink-0 items-center gap-1 font-bold tabular-nums text-pop"><Headphones size={12} strokeWidth={2.5} />{c}</span>}
          </p>
        )}
      </div>
    </Link>
  );
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {children}
    </div>
  );
}
