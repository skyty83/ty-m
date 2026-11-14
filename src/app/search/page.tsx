'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchX, Search as SearchIcon, X } from 'lucide-react';
import { collectionHref, search, type SearchType } from '@/lib/api';
import { useSearchHistory } from '@/lib/storage';
import type { Album, Artist, Sheet, Song } from '@/lib/types';
import { Page, PageTitle } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { CardGrid, MediaCard } from '@/components/MediaCard';
import { CardSkeleton, Empty, ErrorBox, Sentinel, Tabs, TrackSkeleton, pad2 } from '@/components/ui';

const TABS: { id: SearchType; label: string }[] = [
  { id: 'music', label: '单曲' },
  { id: 'artist', label: '歌手' },
  { id: 'album', label: '专辑' },
  { id: 'sheet', label: '歌单' },
];

const HOT = ['周杰伦', '邓紫棋', '林俊杰', '薛之谦', '陈奕迅', '王菲', '五月天', '毛不易', '孙燕姿', 'Taylor Swift'];

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

  return (
    <Page>
      {!q && <PageTitle>搜索</PageTitle>}

      <div className="glass sticky top-0 z-20 -mx-4 bg-bg/92 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-16 lg:-mx-10 lg:px-10 lg:pt-3">
        <form role="search" onSubmit={e => { e.preventDefault(); go(input); }}>
          <label htmlFor="q" className="sr-only">搜索歌曲、歌手、专辑或歌单</label>
          <div className="relative flex items-center border-b-2 border-line-strong">
            <SearchIcon className="pointer-events-none absolute left-0 h-6 w-6" />
            <input id="q" ref={inputRef} type="search" enterKeyHint="search" autoComplete="off"
              value={input} onChange={e => setInput(e.target.value)} placeholder="想听什么？" autoFocus={!q}
              className="h-14 w-full bg-transparent pl-9 pr-10 text-xl font-bold text-ink outline-none placeholder:font-medium placeholder:text-sub sm:text-2xl [&::-webkit-search-cancel-button]:hidden" />
            {input && (
              <button type="button" onClick={() => { setInput(''); inputRef.current?.focus(); }} aria-label="清空输入"
                className="press absolute right-0 flex h-9 w-9 items-center justify-center text-sub hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>
        {q && <div className="mt-4"><Tabs label="结果类型" value={type} items={TABS} onChange={t => go(q, t)} /></div>}
      </div>

      {!q && (
        <div className="mt-10 grid gap-12 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <h2 className="mb-2 text-sm font-bold">热门搜索</h2>
            <ol className="border-t border-line">
              {HOT.map((h, i) => (
                <li key={h} className="border-b border-line">
                  <button onClick={() => go(h)} className="group flex w-full items-center gap-5 py-3 text-left">
                    <span className={`w-11 text-[28px] leading-none ${i < 3 ? 'rank-solid' : 'rank-outline'}`}>{pad2(i + 1)}</span>
                    <span className="text-lg font-bold"><span className="u-hover">{h}</span></span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          {history.list.length > 0 && (
            <section className="lg:col-span-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold">最近搜索</h2>
                <button onClick={history.clear} className="u-hover text-sm text-sub hover:text-ink">清空</button>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                {history.list.map(h => (
                  <button key={h} onClick={() => go(h)} className="press h-10 border border-line px-4 text-sm hover:border-line-strong">{h}</button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {q && (
        <div className="mt-6" role="tabpanel">
          {!firstLoad && page > 0 && items.length > 0 && (
            <p className="mb-4 text-sm text-sub">“<span className="font-bold text-ink">{q}</span>”的{TABS.find(t => t.id === type)?.label}结果</p>
          )}
          {error && page === 0 && <ErrorBox message={error} onRetry={() => fetchPage(1)} />}
          {firstLoad && (type === 'music' ? <TrackSkeleton /> : <CardGrid><CardSkeleton /></CardGrid>)}
          {!loading && !error && page > 0 && items.length === 0 && (
            <Empty icon={SearchX} title={`没有找到“${q}”`} hint="检查一下关键词，或切换到其他分类试试。" />
          )}
          {items.length > 0 && (type === 'music' ? <TrackList songs={items as Song[]} /> : (
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
