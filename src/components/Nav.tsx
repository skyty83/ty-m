'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AudioLines, Search } from 'lucide-react';

export const NAV = [
  { href: '/', label: '首页' },
  { href: '/charts', label: '榜单' },
  { href: '/playlists', label: '歌单' },
  { href: '/library', label: '我的音乐' },
];

export function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href);
}

// 品牌标志: 与 vod-site 同形 (圆角青柠方块), 中间为声波图标
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span className={`inline-grid place-items-center rounded-[27%] bg-accent text-onaccent ${className}`} aria-hidden="true">
      <AudioLines className="h-[62%] w-[62%]" strokeWidth={2.6} />
    </span>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[21px] font-black leading-none tracking-[-0.04em] text-ink">听域音乐</span>
    </span>
  );
}

function NavLinks() {
  const path = usePathname();
  return (
    <ul className="flex items-center gap-1 py-2 lg:py-0">
      {NAV.map(item => {
        const on = isActive(path, item.href);
        return (
          <li key={item.href} className="shrink-0">
            <Link href={item.href} aria-current={on ? 'page' : undefined}
              className={`inline-flex h-9 items-center rounded-full px-4 text-[15px] font-bold transition-colors duration-200 ${on ? 'bg-accent text-onaccent' : 'text-ink/70 hover:bg-card-2 hover:text-ink'}`}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const q = useSearchParams().get('q') ?? '';
  return (
    <form role="search" className="relative col-start-2 row-start-1 min-w-0 justify-self-end lg:col-start-3"
      onSubmit={e => {
        e.preventDefault();
        const v = String(new FormData(e.currentTarget).get('q') || '').trim();
        if (v) router.push(`/search?q=${encodeURIComponent(v)}`);
      }}>
      <label htmlFor="header-search" className="sr-only">搜索歌曲、歌手</label>
      <Search size={17} strokeWidth={2.25} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sub" />
      <input id="header-search" key={q} name="q" type="search" defaultValue={q} placeholder="搜索歌曲、歌手" autoComplete="off" enterKeyHint="search"
        className="h-10 w-full min-w-0 rounded-full bg-card-2/70 pl-11 pr-4 text-sm text-ink ring-1 ring-line transition-[width,box-shadow] duration-300 ease-out placeholder:text-sub focus:bg-card focus:outline-none focus:ring-2 focus:ring-[var(--pop)] sm:w-56 sm:focus:w-72 lg:w-64 lg:focus:w-80 [&::-webkit-search-cancel-button]:hidden" />
      <button type="submit" className="sr-only">搜索</button>
    </form>
  );
}

export default function Header() {
  return (
    <header className="header-glass sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="wrap grid grid-cols-[auto_1fr] items-center gap-x-6 lg:grid-cols-[auto_1fr_auto] lg:gap-x-8">
        <Link href="/" aria-label="听域音乐 首页" className="row-start-1 flex h-16 items-center"><Logo /></Link>
        <nav aria-label="主导航"
          className="scrollbar-hide col-span-2 row-start-2 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:px-0">
          <NavLinks />
        </nav>
        <Suspense fallback={<div className="col-start-2 row-start-1 h-10 lg:col-start-3" />}>
          <HeaderSearch />
        </Suspense>
      </div>
    </header>
  );
}
