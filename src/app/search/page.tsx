'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Library, Mic2, Music, Search as SearchIcon, SearchX, ListMusic, Trash2, X } from 'lucide-react';
import { collectionHref, search, type SearchType } from '@/lib/api';
import { useSearchHistory } from '@/lib/storage';
import type { Album, Artist, Sheet, Song } from '@/lib/types';
import { Page, PageTitle } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { CardGrid, MediaCard } from '@/components/MediaCard';
import { BTN_PRIMARY, CardSkeleton, Empty, ErrorBox, ICON_BTN, Pills, Sentinel, TrackSkeleton } from '@/components/ui';

const TABS: { id: SearchType; label: string; icon: React.ElementType }[] = [
  { id: 'music', label: '单曲', icon: Music },
  { id: 'artist', label: '歌手', icon: Mic2 },
  { id: 'album', label: '专辑', icon: Library },
  { id: 'sheet', label: '歌单', icon: ListMusic },
];

const HOT = ['周杰伦', '邓紫棋', '林俊杰', '薛之谦', '陈奕迅', '王菲', '五月天', '毛不易', '孙燕姿', '华晨宇'];

type Item = Song | Album | Artist | Sheet;

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
  const tabLabel = TABS.find(t => t.id === type)?.label;

  return (
    <Page>
      <PageTitle title={q ? `“${q}”` : '搜索'} kicker="SEARCH"
        sub={q && page > 0 && items.length > 0 ? <span className="tabular-nums">已加载 {items.length} 个{tabLabel}结果{done ? ' - 已全部加载' : ' - 向下滚动加载更多'}</span> : undefined} />

      <form role="search" onSubmit={e => { e.preventDefault(); go(input); }} className="mb-5 flex gap-2">
        <label htmlFor="q" className="sr-only">搜索歌曲、歌手、专辑或歌单</label>
        <div className="relative flex min-w-0 flex-1 items-center">
          <SearchIcon size={18} strokeWidth={2} className="pointer-events-none absolute left-4 text-sub" />
          <input id="q" ref={inputRef} type="search" enterKeyHint="search" autoComplete="off" value={input}
            onChange={e => setInput(e.target.value)} placeholder="搜索歌曲、歌手、专辑..." autoFocus={!q}
            className="h-12 w-full rounded-full bg-card pl-12 pr-11 text-base text-ink ring-1 ring-line outline-none transition-shadow placeholder:text-sub focus-visible:ring-2 focus-visible:ring-[var(--pop)] [&::-webkit-search-cancel-button]:hidden" />
          {input && (
            <button type="button" onClick={() => { setInput(''); inputRef.current?.focus(); }} aria-label="清空输入"
              className={`${ICON_BTN} absolute right-1.5 h-9 w-9 text-sub`}><X size={16} /></button>
          )}
        </div>
        <button type="submit" className={`${BTN_PRIMARY} h-12 shrink-0 px-6 text-sm font-black`}>搜索</button>
      </form>

      {q && <div className="mb-6"><Pills label="结果类型" value={type} items={TABS} onChange={t => go(q, t)} /></div>}

      {!q && (
        <div className="grid gap-12 pt-4 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <h2 className="mb-4 text-2xl font-black tracking-[-0.04em]">热门搜索</h2>
            <ol className="grid grid-cols-1 gap-x-6 rounded-panel bg-card p-2 ring-1 ring-line sm:grid-cols-2 sm:p-3">
              {HOT.map((h, i) => (
                <li key={h}>
                  <button onClick={() => go(h)} className="flex w-full items-center gap-4 rounded-card px-3 py-3 text-left transition-colors hover:bg-card-2">
                    <span className={`font-wide w-7 text-center text-lg font-extrabold tabular-nums ${i < 3 ? 'text-pop' : 'text-sub'}`}>{i + 1}</span>
                    <span className="truncate text-[15px] font-bold">{h}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <section className="lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-[-0.04em]">最近搜索</h2>
              {history.list.length > 0 && (
                <button onClick={history.clear} aria-label="清空搜索记录" className={`${ICON_BTN} h-9 w-9 text-sub`}><Trash2 size={16} /></button>
              )}
            </div>
            {history.list.length ? (
              <div className="flex flex-wrap gap-2">
                {history.list.map(h => (
                  <button key={h} onClick={() => go(h)} className="inline-flex h-9 items-center rounded-full bg-card px-4 text-sm font-bold ring-1 ring-line transition-colors hover:bg-card-2">{h}</button>
                ))}
              </div>
            ) : <p className="text-sm text-sub">还没有搜索记录</p>}
          </section>
        </div>
      )}

      {q && (
        <div role="tabpanel">
          {error && page === 0 && <ErrorBox message={error} onRetry={() => fetchPage(1)} />}
          {firstLoad && (type === 'music' ? <TrackSkeleton /> : <CardGrid><CardSkeleton /></CardGrid>)}
          {!loading && !error && page > 0 && items.length === 0 && (
            <Empty icon={SearchX} title={`没有找到相关${tabLabel}`} hint="检查一下关键词, 或切换到其他分类试试。" />
          )}
          {items.length > 0 && (type === 'music' ? <TrackList songs={items as Song[]} /> : (
            <CardGrid>
              {type === 'album' && (items as Album[]).map(a => (
                <MediaCard key={a.id} href={collectionHref('album', a)} title={a.title} subtitle={[a.artist, a.date?.slice(0, 4)].filter(Boolean).join(' · ')} artwork={a.artwork} />
              ))}
              {type === 'artist' && (items as Artist[]).map(a => (
                <MediaCard key={a.id} round href={collectionHref('artist', { id: a.id, title: a.name, artwork: a.avatar })} title={a.name} subtitle={a.worksNum ? `${a.worksNum} 首歌曲` : undefined} artwork={a.avatar} />
              ))}
              {type === 'sheet' && (items as Sheet[]).map(s => (
                <MediaCard key={s.id} href={collectionHref('playlist', s)} title={s.title} subtitle={s.artist} artwork={s.artwork} count={s.playCount} />
              ))}
            </CardGrid>
          ))}
          {page > 0 && items.length > 0 && <Sentinel onHit={() => { if (!loading && !done) fetchPage(page + 1); }} done={done} loading={loading} />}
        </div>
      )}
    </Page>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<Page><TrackSkeleton /></Page>}><SearchInner /></Suspense>;
}
