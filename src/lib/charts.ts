'use client';

import { useEffect, useRef, useState } from 'react';
import { getCollection, getTopLists } from './api';
import type { Song, TopListGroup, TopListItem } from './types';

// 榜单详情在多个页面共用, 会话内缓存 (失败时移除以便重试)
const chartCache = new Map<string, Promise<Song[]>>();
export function loadChart(item: TopListItem) {
  if (!chartCache.has(item.id)) {
    const p = getCollection('chart', item, 1).then(r => r.songs).catch(e => { chartCache.delete(item.id); throw e; });
    chartCache.set(item.id, p);
  }
  return chartCache.get(item.id)!;
}

let listsPromise: Promise<TopListGroup[]> | null = null;
export function loadTopLists() {
  if (!listsPromise) listsPromise = getTopLists().catch(e => { listsPromise = null; throw e; });
  return listsPromise;
}

// lazy=true 时进入视口才请求, 避免榜单页一次发出几十个请求
export function useChartSongs(item?: TopListItem, lazy = false) {
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [visible, setVisible] = useState(!lazy);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy || visible || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { rootMargin: '200px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [lazy, visible]);

  useEffect(() => {
    if (!item || !visible) return;
    let alive = true;
    loadChart(item).then(s => { if (alive) setSongs(s); }).catch(() => { if (alive) setSongs([]); });
    return () => { alive = false; };
  }, [item, visible]);

  return { songs, ref };
}
