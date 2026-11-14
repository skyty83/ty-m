'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Compass, Library, ListOrdered, Search } from 'lucide-react';

export const NAV = [
  { href: '/', label: '发现', icon: Compass },
  { href: '/charts', label: '榜单', icon: ListOrdered },
  { href: '/search', label: '搜索', icon: Search },
  { href: '/library', label: '我的', icon: Library },
];

export function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href);
}

export function Brand({ className = '' }: { className?: string }) {
  return (
    <Link href="/" aria-label="听域 首页" className={`flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon" alt="" className="h-7 w-7" />
      <span className="text-xl font-black tracking-tight">听域</span>
    </Link>
  );
}

function InlineSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form role="search" onSubmit={e => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
      className="relative hidden w-64 items-center xl:flex">
      <label htmlFor="top-q" className="sr-only">搜索</label>
      <Search className="pointer-events-none absolute left-0 h-4 w-4 text-sub" />
      <input id="top-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="搜索歌曲、歌手"
        className="h-9 w-full border-b border-line bg-transparent pl-6 text-sm text-ink outline-none placeholder:text-sub focus:border-line-strong [&::-webkit-search-cancel-button]:hidden" />
    </form>
  );
}

export function TopNav() {
  const path = usePathname();
  return (
    <header className="glass sticky top-0 z-40 hidden border-b border-line bg-bg/90 backdrop-blur-xl lg:block">
      <div className="flex h-16 items-center gap-10 px-10">
        <Brand />
        <nav aria-label="主导航" className="flex h-full items-stretch gap-7">
          {NAV.map(({ href, label }) => {
            const on = isActive(path, href);
            return (
              <Link key={href} href={href} aria-current={on ? 'page' : undefined}
                className={`relative flex items-center text-[15px] transition-colors ${on ? 'font-bold text-ink' : 'text-sub hover:text-ink'}`}>
                {label}
                {on && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-ink" />}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        <InlineSearch />
      </div>
    </header>
  );
}

export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="主导航"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="flex h-[var(--nav-h)]">
        {NAV.map(({ href, label, icon: Icon }) => {
          const on = isActive(path, href);
          return (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined}
              className={`press relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${on ? 'font-bold text-ink' : 'text-sub'}`}>
              {on && <span className="absolute inset-x-6 top-0 h-[3px] bg-ink" />}
              <Icon className="h-[21px] w-[21px]" strokeWidth={on ? 2.4 : 1.8} />{label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
