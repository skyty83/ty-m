'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Disc3, Heart, ListEnd, ListPlus, Loader2, Mic2, MoreHorizontal, Play } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { collectionHref } from '@/lib/api';
import type { Song } from '@/lib/types';
import { Cover, ICON_BTN, WaveformBars } from './ui';

// 歌曲列表: 与 vod-site 音乐页一致 (面板 + 行悬停 + 青柠强调)
export default function TrackList({ songs, showCover = true, ranked = false, showAlbum = true }: {
  songs: Song[]; showCover?: boolean; ranked?: boolean; showAlbum?: boolean;
}) {
  const { current, playing, loading, playList } = usePlayer();
  const { isLiked, toggle } = useLiked();

  return (
    <div className="rounded-panel bg-card p-2 ring-1 ring-line sm:p-3">
      <ol className="flex flex-col gap-0.5" aria-label="歌曲列表">
        {songs.map((song, i) => {
          const active = current?.id === song.id;
          const liked = isLiked(song.id);
          const top = ranked && i < 3;
          return (
            <li key={`${song.id}-${i}`}
              className={`group flex min-w-0 items-center gap-1 rounded-card transition-colors hover:bg-card-2 ${active ? 'bg-card-2' : ''}`}>
              <button onClick={() => playList(songs, i)} aria-current={active ? 'true' : undefined}
                aria-label={`播放 ${song.title} - ${song.artist}`}
                className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-2 text-left sm:pl-3">
                <span className="flex w-8 shrink-0 items-center justify-center">
                  {active && loading ? <Loader2 size={15} className="text-pop motion-safe:animate-spin" />
                    : active && playing ? <WaveformBars playing />
                    : (
                      <>
                        <span className={`tabular-nums group-hover:hidden ${top ? 'font-wide text-lg font-extrabold text-pop' : active ? 'text-sm font-black text-pop' : 'text-sm font-bold text-sub'}`}>{i + 1}</span>
                        <Play size={14} className="ml-0.5 hidden group-hover:block" fill="currentColor" />
                      </>
                    )}
                </span>
                {showCover && <Cover src={song.artwork} className="h-11 w-11 ring-1 ring-line" />}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${active ? 'text-pop' : 'text-ink'}`}>{song.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-sub">
                    {song.artist}{song.album && showAlbum && <span className="lg:hidden"> · {song.album}</span>}
                  </span>
                </span>
                {showAlbum && <span className="hidden w-[30%] shrink-0 truncate pr-2 text-xs text-sub lg:block">{song.album}</span>}
              </button>
              <button onClick={() => toggle(song)} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
                className={`${ICON_BTN} h-9 w-9 shrink-0 ${liked ? 'text-pop' : 'text-sub hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'}`}>
                <Heart size={16} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
              </button>
              <TrackMenu song={song} className="mr-1" />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function TrackMenu({ song, className = '' }: { song: Song; className?: string }) {
  const { addNext, addToQueue, setFullOpen } = usePlayer();
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const toggleMenu = () => {
    if (!open && ref.current) setUp(window.innerHeight - ref.current.getBoundingClientRect().bottom < 300);
    setOpen(o => !o);
  };

  const item = 'flex w-full items-center gap-3 rounded-card px-3 py-2.5 text-left text-sm font-bold text-ink hover:bg-card-2';
  const go = () => { setOpen(false); setFullOpen(false); };
  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button onClick={toggleMenu} aria-label="更多操作" aria-haspopup="menu" aria-expanded={open}
        className={`${ICON_BTN} h-9 w-9 text-sub hover:text-ink`}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div role="menu"
          className={`absolute right-0 z-30 w-56 rounded-panel bg-card p-2 shadow-lift ring-1 ring-line ${up ? 'bottom-11' : 'top-11'}`}>
          <p className="truncate px-3 pb-1.5 pt-1 text-xs text-sub">{song.title}</p>
          <button role="menuitem" className={item} onClick={() => { addNext(song); setOpen(false); }}><ListPlus size={16} className="text-sub" />下一首播放</button>
          <button role="menuitem" className={item} onClick={() => { addToQueue(song); setOpen(false); }}><ListEnd size={16} className="text-sub" />加入播放队列</button>
          {song.artistId && (
            <Link role="menuitem" className={item} onClick={go} href={collectionHref('artist', { id: song.artistId, title: song.artist })}>
              <Mic2 size={16} className="shrink-0 text-sub" /><span className="truncate">歌手 · {song.artist}</span>
            </Link>
          )}
          {song.albumId && song.album && (
            <Link role="menuitem" className={item} onClick={go} href={collectionHref('album', { id: song.albumId, title: song.album, artist: song.artist })}>
              <Disc3 size={16} className="shrink-0 text-sub" /><span className="truncate">专辑 · {song.album}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
