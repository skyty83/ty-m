'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Compass, Heart, History, Library, Search } from 'lucide-react';
import { useLiked, useRecent } from '@/lib/storage';

const ITEMS = [
  { href: '/', label: '发现', icon: Compass },
  { href: '/search', label: '搜索', icon: Search },
  { href: '/library', label: '我的', icon: Library },
];

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path.startsWith(href);
}

export function Brand({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label="听域 首页">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon" alt="" className="h-8 w-8" />
      <span className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold tracking-tight">听域</span>
        <span className="text-[11px] font-semibold text-sub">TY Music</span>
      </span>
    </Link>
  );
}

function LibraryLinks() {
  const path = usePathname();
  const tab = useSearchParams().get('tab');
  const { liked } = useLiked();
  const recent = useRecent();
  const rows = [
    { key: 'liked', label: '我喜欢的音乐', n: liked.length, icon: Heart, tone: 'bg-accent text-onaccent' },
    { key: 'recent', label: '最近播放', n: recent.length, icon: History, tone: 'bg-surface-2 text-ink' },
  ];
  return (
    <>
      {rows.map(r => {
        const on = path === '/library' && (tab || 'liked') === r.key;
        return (
          <Link key={r.key} href={`/library?tab=${r.key}`} aria-current={on ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${on ? 'bg-surface shadow-card' : 'hover:bg-surface'}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${r.tone}`}>
              <r.icon className="h-4 w-4" fill={r.key === 'liked' ? 'currentColor' : 'none'} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{r.label}</span>
              <span className="block text-xs tabular-nums text-sub">{r.n} 首</span>
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col gap-7 px-4 pb-[calc(var(--player-h)+32px)] pt-6 lg:flex">
      <Brand className="px-2" />
      <nav className="flex flex-col gap-1" aria-label="主导航">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const on = isActive(path, href);
          return (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined}
              className={`flex h-11 items-center gap-3 rounded-full px-4 text-[15px] transition-colors ${on ? 'bg-ink font-semibold text-bg' : 'font-medium text-ink-2 hover:bg-surface'}`}>
              <Icon className="h-[19px] w-[19px]" strokeWidth={on ? 2.3 : 1.9} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-1">
        <p className="px-2.5 pb-1 text-xs font-medium text-sub">我的音乐</p>
        <Suspense><LibraryLinks /></Suspense>
      </div>
    </aside>
  );
}

export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="主导航"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-md">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const on = isActive(path, href);
          return (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined}
              className={`press flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${on ? 'font-semibold text-accent' : 'font-medium text-sub'}`}>
              <Icon className="h-[22px] w-[22px]" strokeWidth={on ? 2.3 : 1.8} />{label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
