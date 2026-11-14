'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { collectionHref, getRecommendSheets, getSheetTags, type SheetTag } from '@/lib/api';
import type { Sheet } from '@/lib/types';
import { Page, PageTitle } from '@/components/Page';
import { CardGrid, MediaCard } from '@/components/MediaCard';
import { CardSkeleton, ErrorBox, Pills, Sentinel } from '@/components/ui';

const ALL: SheetTag = { id: '', title: '精选' };

export default function PlaylistsPage() {
  const [tags, setTags] = useState<SheetTag[]>([ALL]);
  const [tagId, setTagId] = useState('');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const req = useRef(0);

  useEffect(() => { getSheetTags().then(t => setTags([ALL, ...t])).catch(() => {}); }, []);

  const load = useCallback(async (t: SheetTag, p: number) => {
    const id = ++req.current;
    setLoading(true);
    setError('');
    try {
      const r = await getRecommendSheets(p, t);
      if (id !== req.current) return;
      setSheets(prev => {
        const base = p === 1 ? [] : prev;
        const ids = new Set(base.map(s => String(s.id)));
        return [...base, ...r.data.filter(s => !ids.has(String(s.id)))];
      });
      setPage(p);
      setDone(!!r.isEnd || r.data.length === 0);
    } catch (e) {
      if (id === req.current) setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      if (id === req.current) setLoading(false);
    }
  }, []);

  const tag = tags.find(t => t.id === tagId) ?? ALL;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 切换分类时重新加载
    load(tag, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId, load]);

  return (
    <Page>
      <PageTitle title="歌单" kicker="PLAYLISTS" sub={sheets.length > 0 && <span className="tabular-nums">已加载 {sheets.length} 个歌单{done ? ' - 已全部加载' : ' - 向下滚动加载更多'}</span>} />
      <div className="mb-8">
        <Pills label="歌单分类" value={tagId} items={tags.map(t => ({ id: t.id, label: t.title }))}
          onChange={id => { if (id === tagId) return; setSheets([]); setPage(0); setDone(false); setTagId(id); }} />
      </div>
      {error && page === 0 ? <ErrorBox message={error} onRetry={() => load(tag, 1)} /> : (
        <CardGrid>
          {sheets.map(s => (
            <MediaCard key={s.id} href={collectionHref('playlist', s)} title={s.title} subtitle={s.artist} artwork={s.artwork} count={s.playCount} />
          ))}
          {page === 0 && <CardSkeleton count={12} />}
        </CardGrid>
      )}
      {page > 0 && <Sentinel onHit={() => { if (!loading && !done) load(tag, page + 1); }} done={done} loading={loading} />}
      {error && page > 0 && <ErrorBox message={error} onRetry={() => load(tag, page + 1)} />}
    </Page>
  );
}
