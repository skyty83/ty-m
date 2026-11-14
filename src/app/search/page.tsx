'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, SearchX, Search as SearchIcon, Trash2, X } from 'lucide-react';
import { collectionHref, getTopLists, search, type SearchType } from '@/lib/api';
import { useSearchHistory } from '@/lib/storage';
import type { Album, Artist, Sheet, Song, TopListItem } from '@/lib/types';
import { Page } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { CardGrid, MediaCard } from '@/components/MediaCard';
import { CardSkeleton, Cover, Empty, ErrorBox, Sentinel, TrackSkeleton } from '@/components/ui';

const TABS: { id: SearchType; label: string }[] = [
  { id: 'music', label: '单曲' },
  { id: 'artist', label: '歌手' },
  { id: 'album', label: '专辑' },
  { id: 'sheet', label: '歌单' },
];

const HOT = ['周杰伦', '邓紫棋', '林俊杰', '薛之谦', '陈奕迅', '王菲', '五月天', '毛不易', '孙燕姿', 'Taylor Swift'];

type Item = Song | Album | Artist | Sheet;

function BrowseCharts() {
  const [items, setItems] = useState<TopListItem[]>([]);
  useEffect(() => { getTopLists().then(g => setItems(g.flatMap(x => x.data).slice(0, 8))).catch(() => {}); }, []);
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-base font-bold">按榜单浏览</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => (
          <Link key={it.id} href={collectionHref('chart', it)} style={{ '--i': i } as React.CSSProperties}
            className="rise press flex items-center gap-3 overflow-hidden rounded-2xl bg-surface p-2 pr-3 shadow-card hover:bg-surface-2">
            <Cover src={it.coverImg} className="h-14 w-14" />
            <span className="min-w-0 truncate text-sm font-semibold">{it.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') || '';
  const type = (params.get('type') as SearchType) || 'music';
  const [input, setInput] = useState(q);
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useSearchHistory();
  const reqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (query: string, t: SearchType = type) => {
    const v = query.trim();
    if (!v) return;
    history.add(v);
    setInput(v);
    inputRef.current?.blur();
    router.replace(`/search?${new URLSearchParams({ q: v, type: t })}`, { scroll: false });
  };

  const fetchPage = async (p: number) => {
    if (!q) return;
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const r = await search(q, p, type);
      if (id !== reqId.current) return;
      setItems(prev => {
        const base = p === 1 ? [] : prev;
        const ids = new Set(base.map(x => String(x.id)));
        return [...base, ...(r.data as Item[]).filter(x => !ids.has(String(x.id)))];
      });
      setPage(p);
      setDone(!!r.isEnd || r.data.length === 0);
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : '搜索失败');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- URL 变化时重置结果 */
    setInput(q);
    setItems([]);
    setPage(0);
    setDone(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (q) fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type]);

  const firstLoad = loading && page === 0;

  return (
    <Page>
      <h1 className="mb-4 text-[28px] font-bold tracking-tight sm:text-[32px]">搜索</h1>

      <div className="glass sticky top-0 z-20 -mx-4 bg-bg/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <form role="search" onSubmit={e => { e.preventDefault(); go(input); }}>
          <label htmlFor="q" className="sr-only">搜索歌曲、歌手、专辑或歌单</label>
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-4 h-5 w-5 text-sub" />
            <input
              id="q"
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="歌曲、歌手、专辑、歌单"
              autoFocus={!q}
              className="h-12 w-full rounded-full bg-surface pl-12 pr-12 text-base text-ink shadow-card outline-none ring-1 ring-line transition-shadow placeholder:text-sub focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
            />
            {input && (
              <button type="button" onClick={() => { setInput(''); inputRef.current?.focus(); }} aria-label="清空输入"
                className="press absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-sub hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
        {q && (
          <div role="tablist" aria-label="结果类型" className="mt-3 flex gap-6 border-b border-line">
            {TABS.map(t => {
              const on = type === t.id;
              return (
                <button key={t.id} role="tab" aria-selected={on} onClick={() => go(q, t.id)}
                  className={`relative pb-2.5 text-[15px] transition-colors ${on ? 'font-semibold text-ink' : 'text-sub hover:text-ink'}`}>
                  {t.label}
                  {on && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!q && (
        <div className="mt-4 flex flex-col gap-9">
          {history.list.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold">最近搜索</h2>
                <button onClick={history.clear} aria-label="清空搜索记录" className="press flex h-8 w-8 items-center justify-center rounded-full text-sub hover:text-ink">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.list.map(h => (
                  <button key={h} onClick={() => go(h)} className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm shadow-card hover:bg-surface-2">
                    <Clock className="h-3.5 w-3.5 text-sub" />{h}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2 text-base font-bold">热门搜索</h2>
            <ol className="grid grid-cols-2 gap-x-6">
              {HOT.map((h, i) => (
                <li key={h}>
                  <button onClick={() => go(h)} className="flex w-full items-center gap-3.5 rounded-xl py-2.5 text-left hover:text-accent">
                    <span className={`w-5 text-center font-bold italic tabular-nums ${i < 3 ? 'text-accent' : 'text-sub'}`}>{i + 1}</span>
                    <span className="truncate text-[15px]">{h}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <BrowseCharts />
        </div>
      )}

      {q && (
        <div className="mt-4" role="tabpanel">
          {error && page === 0 && <ErrorBox message={error} onRetry={() => fetchPage(1)} />}
          {firstLoad && (type === 'music' ? <TrackSkeleton /> : <CardGrid><CardSkeleton round={type === 'artist'} /></CardGrid>)}
          {!loading && !error && page > 0 && items.length === 0 && (
            <Empty icon={SearchX} title={`没有找到与“${q}”相关的${TABS.find(t => t.id === type)?.label}`} hint="检查一下关键词，或换个分类试试" />
          )}
          {items.length > 0 && (
            type === 'music' ? (
              <TrackList songs={items as Song[]} />
            ) : (
              <CardGrid>
                {type === 'album' && (items as Album[]).map((a, i) => (
                  <MediaCard key={a.id} index={i} href={collectionHref('album', a)} title={a.title} subtitle={[a.artist, a.date?.slice(0, 4)].filter(Boolean).join(' / ')} artwork={a.artwork} />
                ))}
                {type === 'artist' && (items as Artist[]).map((a, i) => (
                  <MediaCard key={a.id} index={i} round href={collectionHref('artist', { id: a.id, title: a.name, artwork: a.avatar })} title={a.name} subtitle={a.worksNum ? `${a.worksNum} 首歌曲` : undefined} artwork={a.avatar} />
                ))}
                {type === 'sheet' && (items as Sheet[]).map((s, i) => (
                  <MediaCard key={s.id} index={i} href={collectionHref('playlist', s)} title={s.title} subtitle={s.artist} artwork={s.artwork} count={s.playCount} />
                ))}
              </CardGrid>
            )
          )}
          {page > 0 && items.length > 0 && (
            <Sentinel onHit={() => { if (!loading && !done) fetchPage(page + 1); }} done={done} loading={loading} />
          )}
        </div>
      )}
    </Page>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Page><TrackSkeleton /></Page>}>
      <SearchInner />
    </Suspense>
  );
}
