'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, History, Play, Shuffle, Trash2 } from 'lucide-react';
import { clearRecent, useLiked, useRecent } from '@/lib/storage';
import { Page, PageTitle } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { usePlayer } from '@/components/PlayerProvider';
import { BTN_PRIMARY, Empty, Pills, TrackSkeleton } from '@/components/ui';

function LibraryInner() {
  const router = useRouter();
  const tab = useSearchParams().get('tab') === 'recent' ? 'recent' : 'liked';
  const { liked } = useLiked();
  const recent = useRecent();
  const { playList } = usePlayer();
  const songs = tab === 'liked' ? liked : recent;

  const discover = (
    <Link href="/" className={`${BTN_PRIMARY} mt-2 h-11 px-6 text-sm font-black`}>去发现音乐</Link>
  );

  return (
    <Page>
      <PageTitle title="我的音乐" kicker="LIBRARY" sub={<span className="tabular-nums">已收藏 {liked.length} 首 · 最近播放 {recent.length} 首 · 仅保存在这台设备</span>} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Pills label="音乐库" value={tab} onChange={t => router.replace(`/library?tab=${t}`, { scroll: false })}
          items={[{ id: 'liked', label: `我喜欢 ${liked.length}`, icon: Heart }, { id: 'recent', label: `最近播放 ${recent.length}`, icon: History }]} />
        {songs.length > 0 && (
          <div className="flex items-center gap-2">
            {tab === 'recent' && (
              <button onClick={() => { if (confirm('确定清空最近播放记录吗？')) clearRecent(); }}
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-ink ring-1 ring-line transition-colors hover:bg-ink hover:text-paper">
                <Trash2 size={15} />清空
              </button>
            )}
            <button onClick={() => playList([...songs].sort(() => Math.random() - 0.5), 0)}
              className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-ink ring-1 ring-line transition-colors hover:bg-ink hover:text-paper">
              <Shuffle size={15} />随机
            </button>
            <button onClick={() => playList(songs, 0)} className={`${BTN_PRIMARY} h-11 gap-2 px-5 text-sm font-black`}>
              <Play size={15} fill="currentColor" />播放全部
            </button>
          </div>
        )}
      </div>

      {songs.length === 0
        ? (tab === 'liked'
          ? <Empty icon={Heart} title="还没有收藏的歌曲" hint="在歌曲旁点心形图标即可收藏, 收藏只保存在这台设备上。" action={discover} />
          : <Empty icon={History} title="还没有播放记录" hint="播放过的歌曲会出现在这里。" action={discover} />)
        : <TrackList songs={songs} />}
    </Page>
  );
}

export default function LibraryPage() {
  return <Suspense fallback={<Page><TrackSkeleton /></Page>}><LibraryInner /></Suspense>;
}
