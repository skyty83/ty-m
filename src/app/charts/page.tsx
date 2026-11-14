'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { collectionHref } from '@/lib/api';
import { loadTopLists, useChartSongs } from '@/lib/charts';
import type { TopListGroup, TopListItem } from '@/lib/types';
import { Page, PageTitle } from '@/components/Page';
import { BTN_PRIMARY, Cover, ErrorBox, SectionHead, Sk } from '@/components/ui';
import { usePlayer } from '@/components/PlayerProvider';

// 榜单卡: 封面 + 前三首 (进入视口才请求详情)
function ChartCard({ item }: { item: TopListItem }) {
  const { songs, ref } = useChartSongs(item, true);
  const { playList } = usePlayer();
  return (
    <div ref={ref} className="group flex min-w-0 gap-4 rounded-panel bg-card p-3 ring-1 ring-line transition-colors hover:ring-2 hover:ring-accent sm:p-4">
      <Link href={collectionHref('chart', item)} aria-label={item.title} className="shrink-0">
        <Cover src={item.coverImg} className="h-24 w-24 ring-1 ring-line sm:h-28 sm:w-28" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <Link href={collectionHref('chart', item)} className="min-w-0 truncate text-lg font-black tracking-[-0.03em] hover:text-pop">{item.title}</Link>
          <button onClick={() => songs?.length && playList(songs, 0)} disabled={!songs?.length} aria-label={`播放 ${item.title}`}
            className={`${BTN_PRIMARY} h-9 w-9 shrink-0`}>
            <Play size={15} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
        <ol className="mt-2 flex min-w-0 flex-col gap-1.5">
          {(songs?.slice(0, 3) ?? [null, null, null]).map((s, i) => (
            <li key={i} className="flex min-w-0 items-baseline gap-2.5 text-sm">
              <span className={`font-wide w-3 shrink-0 text-xs font-extrabold ${i === 0 ? 'text-pop' : 'text-sub'}`}>{i + 1}</span>
              {s ? <span className="min-w-0 truncate font-bold">{s.title}<span className="font-normal text-sub"> · {s.artist}</span></span> : <Sk className="h-3.5 flex-1 rounded-full" />}
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
    <Page className="flex flex-col gap-12 sm:gap-20">
      <PageTitle title="排行榜" kicker="CHARTS" sub={total ? <span className="tabular-nums">共 {total} 个榜单, 每日更新</span> : undefined} />
      {err && <ErrorBox message={err} onRetry={load} />}
      {!groups && !err && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-32 rounded-panel" />)}</div>
      )}
      {groups?.map(g => (
        <section key={g.title} className="reveal min-w-0">
          <SectionHead title={g.title} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {g.data.map(it => <ChartCard key={it.id} item={it} />)}
          </div>
        </section>
      ))}
    </Page>
  );
}
