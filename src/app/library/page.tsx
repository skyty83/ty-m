'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, History, Play, Shuffle } from 'lucide-react';
import { clearRecent, useLiked, useRecent } from '@/lib/storage';
import { Page, PageTitle } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { usePlayer } from '@/components/PlayerProvider';
import { Empty, GhostButton, PopButton, TrackSkeleton } from '@/components/ui';

function LibraryInner() {
  const router = useRouter();
  const tab = useSearchParams().get('tab') === 'recent' ? 'recent' : 'liked';
  const { liked } = useLiked();
  const recent = useRecent();
  const { playList } = usePlayer();
  const songs = tab === 'liked' ? liked : recent;

  const tabs = [
    { id: 'liked', label: '我喜欢', n: liked.length },
    { id: 'recent', label: '最近播放', n: recent.length },
  ] as const;

  const discover = (
    <Link href="/" className="press mt-2 inline-flex h-11 items-center bg-ink px-5 text-sm font-bold text-bg">去发现音乐</Link>
  );

  return (
    <Page>
      <PageTitle>我的</PageTitle>

      <div role="tablist" aria-label="音乐库" className="mb-8 grid grid-cols-2 border-y border-line-strong sm:max-w-xl">
        {tabs.map((t, i) => {
          const on = tab === t.id;
          return (
            <button key={t.id} role="tab" aria-selected={on} onClick={() => router.replace(`/library?tab=${t.id}`, { scroll: false })}
              className={`press flex flex-col items-start gap-1 px-4 py-4 text-left ${i === 1 ? 'border-l border-line-strong' : ''} ${on ? 'bg-ink text-bg' : 'hover:bg-surface'}`}>
              <span className="num text-4xl font-bold leading-none">{t.n}</span>
              <span className="text-sm font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>

      {songs.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <PopButton onClick={() => playList(songs, 0)}><Play className="h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />播放全部</PopButton>
          <GhostButton onClick={() => playList([...songs].sort(() => Math.random() - 0.5), 0)}><Shuffle className="h-[18px] w-[18px]" />随机播放</GhostButton>
          {tab === 'recent' && (
            <button onClick={() => { if (confirm('确定清空最近播放记录吗？')) clearRecent(); }} className="u-hover ml-auto text-sm text-sub hover:text-ink">清空记录</button>
          )}
        </div>
      )}

      {songs.length === 0
        ? (tab === 'liked'
          ? <Empty icon={Heart} title="还没有收藏的歌曲" hint="在歌曲旁点心形图标即可收藏。收藏只保存在这台设备上。" action={discover} />
          : <Empty icon={History} title="还没有播放记录" hint="播放过的歌曲会按时间出现在这里。" action={discover} />)
        : <TrackList songs={songs} />}
    </Page>
  );
}

export default function LibraryPage() {
  return <Suspense fallback={<Page><TrackSkeleton /></Page>}><LibraryInner /></Suspense>;
}
