'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, History, Play, Shuffle, Trash2 } from 'lucide-react';
import { clearRecent, useLiked, useRecent } from '@/lib/storage';
import { Page } from '@/components/Page';
import TrackList from '@/components/TrackList';
import { usePlayer } from '@/components/PlayerProvider';
import { Empty, TrackSkeleton } from '@/components/ui';

function LibraryInner() {
  const router = useRouter();
  const tab = useSearchParams().get('tab') === 'recent' ? 'recent' : 'liked';
  const { liked } = useLiked();
  const recent = useRecent();
  const { playList, toggleShuffle, shuffle } = usePlayer();
  const songs = tab === 'liked' ? liked : recent;

  const tabs = [
    { id: 'liked', label: '我喜欢', icon: Heart, n: liked.length },
    { id: 'recent', label: '最近播放', icon: History, n: recent.length },
  ] as const;

  return (
    <Page>
      <h1 className="mb-5 text-[28px] font-bold tracking-tight sm:text-[32px]">我的音乐</h1>

      <div role="tablist" aria-label="音乐库" className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        {tabs.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} role="tab" aria-selected={on} onClick={() => router.replace(`/library?tab=${t.id}`, { scroll: false })}
              className={`press flex items-center gap-3 rounded-2xl p-3 text-left shadow-card transition-colors ${on ? 'bg-ink text-bg' : 'bg-surface hover:bg-surface-2'}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${on ? 'bg-accent text-onaccent' : 'bg-accent-soft text-accent'}`}>
                <t.icon className="h-5 w-5" fill={t.id === 'liked' ? 'currentColor' : 'none'} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{t.label}</span>
                <span className={`block text-xs tabular-nums ${on ? 'opacity-70' : 'text-sub'}`}>{t.n} 首</span>
              </span>
            </button>
          );
        })}
      </div>

      {songs.length > 0 && (
        <div className="mb-3 flex items-center gap-2.5">
          <button onClick={() => playList(songs, 0)}
            className="press inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-onaccent shadow-card">
            <Play className="h-4 w-4" fill="currentColor" strokeWidth={0} />播放全部
          </button>
          <button onClick={() => { if (!shuffle) toggleShuffle(); playList(songs, Math.floor(Math.random() * songs.length)); }}
            aria-label="随机播放" className="press flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card hover:bg-surface-2">
            <Shuffle className="h-4 w-4" />
          </button>
          <span className="flex-1" />
          {tab === 'recent' && (
            <button onClick={() => { if (confirm('确定清空最近播放记录吗？')) clearRecent(); }}
              className="press inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-sub hover:text-ink">
              <Trash2 className="h-4 w-4" />清空
            </button>
          )}
        </div>
      )}

      {songs.length === 0
        ? (tab === 'liked'
          ? <Empty icon={Heart} title="还没有收藏的歌曲" hint="在任意歌曲旁点 ♡ 即可收藏，收藏仅保存在这台设备上"
              action={<Link href="/" className="press mt-2 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-bg">去发现音乐</Link>} />
          : <Empty icon={History} title="还没有播放记录" hint="播放过的歌曲会出现在这里"
              action={<Link href="/" className="press mt-2 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-bg">去发现音乐</Link>} />)
        : <TrackList songs={songs} />}
    </Page>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<Page><TrackSkeleton /></Page>}>
      <LibraryInner />
    </Suspense>
  );
}
