'use client';

import { useState } from 'react';
import { usePlayer } from './PlayerProvider';
import { Cover, Tabs } from './ui';
import { Lyrics, Queue } from './NowParts';

// 超宽屏 (2xl) 右侧固定 "正在播放" 面板
export default function NowPanel() {
  const { current, playing } = usePlayer();
  const [tab, setTab] = useState<'lyrics' | 'queue'>('lyrics');
  if (!current) return null;
  return (
    <aside aria-label="正在播放"
      className="sticky top-16 hidden h-[calc(100dvh-4rem-var(--player-h)-16px)] w-[340px] shrink-0 flex-col gap-5 border-l border-line px-6 py-7 2xl:flex">
      <p className="text-sm font-bold">{playing ? '正在播放' : '已暂停'}</p>
      <div className="flex items-center gap-4">
        <Cover src={current.artwork} className="h-20 w-20" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-lg font-black leading-tight">{current.title}</p>
          <p className="mt-1 truncate text-sm text-sub">{current.artist}</p>
        </div>
      </div>
      <Tabs label="正在播放" value={tab} onChange={setTab} items={[{ id: 'lyrics', label: '歌词' }, { id: 'queue', label: '播放列表' }]} />
      <div className="min-h-0 flex-1">{tab === 'lyrics' ? <Lyrics size="sm" /> : <Queue />}</div>
    </aside>
  );
}
