'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Disc3, Heart, ListEnd, ListPlus, Loader2, Mic2, MoreHorizontal, Play } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { collectionHref } from '@/lib/api';
import type { Song } from '@/lib/types';
import { Cover, EqBars } from './ui';

export default function TrackList({ songs, showCover = true, ranked = false, showAlbum = true }: {
  songs: Song[]; showCover?: boolean; ranked?: boolean; showAlbum?: boolean;
}) {
  const { current, playing, loading, playList } = usePlayer();
  const { isLiked, toggle } = useLiked();

  return (
    <ol className="flex flex-col" aria-label="歌曲列表">
      {songs.map((song, i) => {
        const active = current?.id === song.id;
        const liked = isLiked(song.id);
        const top = ranked && i < 3;
        return (
          <li
            key={`${song.id}-${i}`}
            className={`group relative flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors sm:px-3 ${active ? 'bg-accent-soft' : 'hover:bg-surface'}`}
          >
            <button
              onClick={() => playList(songs, i)}
              aria-current={active ? 'true' : undefined}
              aria-label={`播放 ${song.title} - ${song.artist}`}
              className="flex min-w-0 flex-1 items-center gap-3 py-0.5 text-left outline-none"
            >
              <span className={`relative flex w-7 shrink-0 justify-center tabular-nums ${top ? 'text-lg font-bold italic text-accent' : 'text-sm text-sub'}`}>
                {active
                  ? (loading ? <Loader2 className="h-4 w-4 text-accent motion-safe:animate-spin" /> : <EqBars on={playing} />)
                  : (
                    <>
                      <span className="group-hover:opacity-0">{i + 1}</span>
                      <Play className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink opacity-0 group-hover:opacity-100" fill="currentColor" />
                    </>
                  )}
              </span>
              {showCover && <Cover src={song.artwork} className="h-11 w-11" rounded="rounded-[6px]" />}
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[15px] leading-tight ${active ? 'font-semibold text-accent' : 'font-medium text-ink'}`}>
                  {song.title}
                </span>
                <span className="mt-1 block truncate text-xs text-sub">
                  {song.artist}
                  {song.album && showAlbum && <span className="lg:hidden"> · {song.album}</span>}
                </span>
              </span>
              {showAlbum && (
                <span className="hidden w-[30%] shrink-0 truncate pr-2 text-sm text-sub lg:block">{song.album}</span>
              )}
            </button>
            <button
              onClick={() => toggle(song)}
              aria-label={liked ? '取消收藏' : '收藏'}
              aria-pressed={liked}
              className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-surface-2 ${liked ? 'text-accent' : 'text-sub sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'}`}
            >
              <Heart className="h-[18px] w-[18px]" fill={liked ? 'currentColor' : 'none'} />
            </button>
            <TrackMenu song={song} />
          </li>
        );
      })}
    </ol>
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
    if (!open && ref.current) {
      // 底部空间不足 (播放栏遮挡) 时向上展开
      const r = ref.current.getBoundingClientRect();
      setUp(window.innerHeight - r.bottom < 280);
    }
    setOpen(o => !o);
  };

  const item = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ink hover:bg-surface-2';
  const go = () => { setOpen(false); setFullOpen(false); };
  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        onClick={toggleMenu}
        aria-label="更多操作"
        aria-haspopup="menu"
        aria-expanded={open}
        className="press flex h-9 w-9 items-center justify-center rounded-full text-sub transition hover:bg-surface-2 hover:text-ink"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-30 w-52 rounded-2xl bg-surface p-1.5 shadow-float ring-1 ring-line [.scope-dark_&]:bg-[#26262b] ${up ? 'bottom-11' : 'top-11'}`}
        >
          <p className="truncate px-3 pb-1.5 pt-1 text-xs text-sub">{song.title}</p>
          <button role="menuitem" className={item} onClick={() => { addNext(song); setOpen(false); }}>
            <ListPlus className="h-4 w-4 text-sub" />下一首播放
          </button>
          <button role="menuitem" className={item} onClick={() => { addToQueue(song); setOpen(false); }}>
            <ListEnd className="h-4 w-4 text-sub" />加入播放列表
          </button>
          {song.artistId && (
            <Link role="menuitem" className={item} onClick={go} href={collectionHref('artist', { id: song.artistId, title: song.artist })}>
              <Mic2 className="h-4 w-4 text-sub" />歌手：<span className="truncate">{song.artist}</span>
            </Link>
          )}
          {song.albumId && song.album && (
            <Link role="menuitem" className={item} onClick={go}
              href={collectionHref('album', { id: song.albumId, title: song.album, artist: song.artist })}>
              <Disc3 className="h-4 w-4 text-sub" />专辑：<span className="truncate">{song.album}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
