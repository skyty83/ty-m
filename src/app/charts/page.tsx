'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { collectionHref } from '@/lib/api';
import { loadTopLists, useChartSongs } from '@/lib/charts';
import type { TopListGroup, TopListItem } from '@/lib/types';
import { Page, PageTitle } from '@/components/Page';
import { Cover, ErrorBox, SectionHead, Sk } from '@/components/ui';
import { usePlayer } from '@/components/PlayerProvider';

function ChartRow({ item, index }: { item: TopListItem; index: number }) {
  const { songs, ref } = useChartSongs(item, true);
  const { playList } = usePlayer();
  return (
    <div ref={ref} style={{ '--i': index % 8 } as React.CSSProperties}
      className="rise group flex gap-4 border-b border-line py-4 sm:gap-5">
      <Link href={collectionHref('chart', item)} className="relative shrink-0" aria-label={item.title}>
        <Cover src={item.coverImg} className="h-24 w-24 sm:h-28 sm:w-28" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={collectionHref('chart', item)} className="min-w-0 truncate text-lg font-black"><span className="u-hover">{item.title}</span></Link>
          <button onClick={() => songs?.length && playList(songs, 0)} disabled={!songs?.length} aria-label={`播放 ${item.title}`}
            className="press flex h-9 w-9 shrink-0 items-center justify-center bg-pop text-onpop disabled:opacity-40">
            <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" strokeWidth={0} />
          </button>
        </div>
        <ol className="mt-2 flex flex-col gap-1.5">
          {(songs?.slice(0, 3) ?? [null, null, null]).map((s, i) => (
            <li key={i} className="flex min-w-0 items-baseline gap-2.5 text-sm">
              <span className="num w-3 font-bold">{i + 1}</span>
              {s ? <span className="truncate">{s.title}<span className="text-sub"> / {s.artist}</span></span> : <Sk className="h-3.5 flex-1" />}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function ChartsPage() {
  const [groups, setGroups] = useState<TopListGroup[] | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setErr('');
    loadTopLists().then(setGroups).catch(e => setErr(e.message));
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 首次加载
  useEffect(() => { load(); }, [load]);

  const total = groups?.reduce((n, g) => n + g.data.length, 0);

  return (
    <Page className="flex flex-col gap-14">
      <PageTitle aside={total ? <span className="num pb-2 text-sm text-sub">{total} 个榜单</span> : undefined}>榜单</PageTitle>
      {err && <ErrorBox message={err} onRetry={load} />}
      {!groups && !err && (
        <div className="grid gap-x-10 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="my-4 h-28" />)}
        </div>
      )}
      {groups?.map(g => (
        <section key={g.title}>
          <SectionHead title={g.title} count={g.data.length} />
          <div className="grid gap-x-10 lg:grid-cols-2">
            {g.data.map((it, i) => <ChartRow key={it.id} item={it} index={i} />)}
          </div>
        </section>
      ))}
    </Page>
  );
}
