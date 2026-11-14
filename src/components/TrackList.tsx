'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Disc3, Heart, ListEnd, ListPlus, Loader2, Mic2, MoreHorizontal } from 'lucide-react';
import { usePlayer } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { collectionHref } from '@/lib/api';
import type { Song } from '@/lib/types';
import { Cover, EqBars, pad2 } from './ui';

export default function TrackList({ songs, showCover = true, ranked = false, showAlbum = true }: {
  songs: Song[]; showCover?: boolean; ranked?: boolean; showAlbum?: boolean;
}) {
  const { current, playing, loading, playList } = usePlayer();
  const { isLiked, toggle } = useLiked();

  return (
    <ol className="border-t border-line" aria-label="歌曲列表">
      {songs.map((song, i) => {
        const active = current?.id === song.id;
        const liked = isLiked(song.id);
        const top = ranked && i < 3;
        return (
          <li key={`${song.id}-${i}`}
            className={`group relative flex items-center gap-1 border-b border-line transition-colors ${active ? 'bg-surface' : 'hover:bg-surface'}`}>
            {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-pop" aria-hidden="true" />}
            <button
              onClick={() => playList(songs, i)}
              aria-current={active ? 'true' : undefined}
              aria-label={`播放 ${song.title} - ${song.artist}`}
              className="flex min-w-0 flex-1 items-center gap-4 py-3 pl-3 text-left outline-none sm:pl-4"
            >
              <span className={`flex w-8 shrink-0 justify-start ${top ? 'rank-solid text-2xl leading-none' : 'num text-sm text-sub'}`}>
                {active
                  ? (loading ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" /> : <EqBars on={playing} />)
                  : pad2(i + 1)}
              </span>
              {showCover && <Cover src={song.artwork} className="h-11 w-11" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold leading-tight">
                  <span className={active ? 'mark' : ''}>{song.title}</span>
                </span>
                <span className="mt-1 block truncate text-xs text-sub">
                  {song.artist}
                  {song.album && showAlbum && <span className="lg:hidden"> / {song.album}</span>}
                </span>
              </span>
              {showAlbum && <span className="hidden w-[32%] shrink-0 truncate pr-3 text-sm text-sub lg:block">{song.album}</span>}
            </button>
            <button
              onClick={() => toggle(song)}
              aria-label={liked ? '取消收藏' : '收藏'}
              aria-pressed={liked}
              className={`press flex h-10 w-10 shrink-0 items-center justify-center ${liked ? 'text-ink' : 'text-sub sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'}`}
            >
              <Heart className="h-[18px] w-[18px]" fill={liked ? 'currentColor' : 'none'} />
            </button>
            <TrackMenu song={song} className="mr-1" />
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
    if (!open && ref.current) setUp(window.innerHeight - ref.current.getBoundingClientRect().bottom < 280);
    setOpen(o => !o);
  };

  const item = 'flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink hover:bg-pop hover:text-onpop';
  const go = () => { setOpen(false); setFullOpen(false); };
  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button onClick={toggleMenu} aria-label="更多操作" aria-haspopup="menu" aria-expanded={open}
        className="press flex h-10 w-10 items-center justify-center text-sub hover:text-ink">
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div role="menu"
          className={`absolute right-0 z-30 w-56 border border-line-strong bg-bg py-1 shadow-[6px_6px_0_var(--line)] [.scope-dark_&]:bg-[#141414] ${up ? 'bottom-11' : 'top-11'}`}>
          <p className="truncate border-b border-line px-4 pb-2 pt-2 text-xs text-sub">{song.title}</p>
          <button role="menuitem" className={item} onClick={() => { addNext(song); setOpen(false); }}>
            <ListPlus className="h-4 w-4" />下一首播放
          </button>
          <button role="menuitem" className={item} onClick={() => { addToQueue(song); setOpen(false); }}>
            <ListEnd className="h-4 w-4" />加入播放列表
          </button>
          {song.artistId && (
            <Link role="menuitem" className={item} onClick={go} href={collectionHref('artist', { id: song.artistId, title: song.artist })}>
              <Mic2 className="h-4 w-4" /><span className="truncate">歌手：{song.artist}</span>
            </Link>
          )}
          {song.albumId && song.album && (
            <Link role="menuitem" className={item} onClick={go}
              href={collectionHref('album', { id: song.albumId, title: song.album, artist: song.artist })}>
              <Disc3 className="h-4 w-4" /><span className="truncate">专辑：{song.album}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
