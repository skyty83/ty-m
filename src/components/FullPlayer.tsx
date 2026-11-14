'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, Heart, ListMusic, MicVocal, X } from 'lucide-react';
import { usePlayer, useProgress, type Pane } from './PlayerProvider';
import { useLiked } from '@/lib/storage';
import { activeLine } from '@/lib/lrc';
import { Cover, EqBars, safeImg } from './ui';
import { SeekBar, TransportRow, VolumeControl } from './Controls';
import { TrackMenu } from './TrackList';

function Lyrics({ big = false }: { big?: boolean }) {
  const { lyrics, seek, current } = usePlayer();
  const { time } = useProgress();
  const boxRef = useRef<HTMLDivElement>(null);
  const idx = lyrics ? activeLine(lyrics, time) : -1;
  const userScroll = useRef(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || idx < 0 || Date.now() - userScroll.current < 3000) return;
    const el = box.querySelector<HTMLElement>(`[data-i="${idx}"]`);
    if (el) box.scrollTo({ top: el.offsetTop - box.clientHeight * 0.4 + el.clientHeight / 2, behavior: 'smooth' });
  }, [idx]);

  if (lyrics === null) {
    return (
      <div className="flex h-full flex-col justify-center gap-5" aria-label="歌词加载中">
        {[70, 50, 85, 60, 40].map((w, i) => <div key={i} className="skeleton h-5 rounded-md" style={{ width: `${w}%` }} />)}
      </div>
    );
  }
  if (!lyrics.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold text-ink-2">暂无歌词</p>
        <p className="text-sm text-sub">{current?.title} 还没有可显示的歌词</p>
      </div>
    );
  }

  return (
    <div
      ref={boxRef}
      onWheel={() => { userScroll.current = Date.now(); }}
      onTouchMove={() => { userScroll.current = Date.now(); }}
      className="scrollbar-hide relative h-full overflow-y-auto py-[40%] [mask-image:linear-gradient(transparent,#000_14%,#000_86%,transparent)]"
      aria-live="off"
    >
      {lyrics.map((l, i) => (
        <button
          key={i}
          data-i={i}
          onClick={() => seek(l.time)}
          className={`block w-full origin-left py-2.5 text-left font-bold leading-snug transition-all duration-500 ease-out-expo ${big ? 'text-[28px] xl:text-[32px]' : 'text-[22px]'} ${i === idx ? 'scale-100 text-ink' : 'scale-[0.97] text-white/35 hover:text-white/60'}`}
        >
          {l.text}
        </button>
      ))}
    </div>
  );
}

function Queue() {
  const { queue, index, playAt, playing, removeAt } = usePlayer();
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'center' });
  }, []);
  const upcoming = Math.max(0, queue.length - index - 1);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-baseline justify-between">
        <h3 className="text-lg font-bold">播放列表</h3>
        <p className="text-xs tabular-nums text-sub">共 {queue.length} 首 / 接下来 {upcoming} 首</p>
      </div>
      <ol ref={listRef} className="thin-scroll -mx-2 min-h-0 flex-1 overflow-y-auto">
        {queue.map((s, i) => {
          const on = i === index;
          return (
            <li key={`${s.id}-${i}`} aria-current={on ? 'true' : undefined}
              className={`group flex items-center gap-3 rounded-xl px-2 py-1.5 ${on ? 'bg-white/12' : 'hover:bg-white/6'} ${i < index ? 'opacity-50' : ''}`}>
              <button onClick={() => playAt(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Cover src={s.artwork} className="h-10 w-10" rounded="rounded-[6px]" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${on ? 'text-accent' : ''}`}>{s.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-sub">{s.artist}</span>
                </span>
                {on && <EqBars on={playing} />}
              </button>
              {!on && (
                <button onClick={() => removeAt(i)} aria-label={`从播放列表移除 ${s.title}`}
                  className="press flex h-8 w-8 items-center justify-center rounded-full text-sub hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PaneTab({ id, label, icon: Icon, current, onSelect }: {
  id: Pane; label: string; icon: React.ElementType; current: Pane; onSelect: (p: Pane) => void;
}) {
  const on = current === id;
  return (
    <button onClick={() => onSelect(on ? 'cover' : id)} aria-pressed={on}
      className={`press flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${on ? 'bg-white/16 text-ink' : 'text-sub hover:text-ink'}`}>
      <Icon className="h-[18px] w-[18px]" />{label}
    </button>
  );
}

export default function FullPlayer() {
  const { current, fullOpen, setFullOpen, playing, error, pane, setPane } = usePlayer();
  const { isLiked, toggle } = useLiked();
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (!fullOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [fullOpen]);

  if (!current) return null;
  const liked = isLiked(current.id);
  const art = safeImg(current.artwork);

  const LikeBtn = (
    <button onClick={() => toggle(current)} aria-label={liked ? '取消收藏' : '收藏'} aria-pressed={liked}
      className={`press flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${liked ? 'text-accent' : 'text-ink'}`}>
      <Heart className="h-6 w-6" fill={liked ? 'currentColor' : 'none'} />
    </button>
  );

  const info = (size: 'm' | 'd') => (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <h2 className={`truncate font-bold tracking-tight ${size === 'd' ? 'text-[26px]' : 'text-[22px]'}`}>{current.title}</h2>
        <p className="mt-0.5 truncate text-[15px] text-sub">{current.artist}{size === 'd' && current.album ? ` / ${current.album}` : ''}</p>
      </div>
      {LikeBtn}
    </div>
  );

  const Err = error ? (
    <p role="alert" className="mb-2 rounded-xl bg-accent-soft px-3 py-2 text-xs leading-relaxed text-accent">
      {error}。音源暂时不可用，请稍后再试或换一首。
    </p>
  ) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`正在播放：${current.title}`}
      aria-hidden={!fullOpen}
      inert={!fullOpen}
      className={`scope-dark fixed inset-0 z-50 overflow-hidden bg-[#121214] transition-[transform,visibility] duration-500 ease-out-expo ${fullOpen ? 'visible translate-y-0' : 'invisible translate-y-full'}`}
    >
      {/* 沉浸式背景: 封面高斯模糊 */}
      {art && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={art} alt="" aria-hidden="true" referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full scale-150 object-cover opacity-60 blur-[80px] saturate-150" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/75" />

      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+10px)] lg:px-12">
        <header
          className="flex shrink-0 items-center justify-between"
          onTouchStart={e => { touchY.current = e.touches[0].clientY; }}
          onTouchEnd={e => {
            if (touchY.current != null && e.changedTouches[0].clientY - touchY.current > 60) setFullOpen(false);
            touchY.current = null;
          }}
        >
          <button onClick={() => setFullOpen(false)} aria-label="收起" className="press flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
            <ChevronDown className="h-7 w-7" />
          </button>
          <span className="h-1 w-9 rounded-full bg-white/30 lg:hidden" aria-hidden="true" />
          <TrackMenu song={current} />
        </header>

        {/* ── 移动端 ── */}
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <div className="min-h-0 flex-1 py-5">
            {pane === 'cover' && (
              <button onClick={() => setPane('lyrics')} aria-label="查看歌词" className="flex h-full w-full items-center justify-center">
                <Cover src={current.artwork} rounded="rounded-2xl" priority
                  className={`aspect-square w-full max-w-[min(100%,48vh)] shadow-[0_30px_80px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out-expo ${playing ? 'scale-100' : 'scale-[0.86]'}`} />
              </button>
            )}
            {pane !== 'cover' && (
              <div className="flex h-full flex-col">
                <div className="mb-3 flex shrink-0 items-center gap-3">
                  <Cover src={current.artwork} className="h-12 w-12" rounded="rounded-[8px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{current.title}</p>
                    <p className="truncate text-sm text-sub">{current.artist}</p>
                  </div>
                  {LikeBtn}
                </div>
                <div className="min-h-0 flex-1">{pane === 'lyrics' ? <Lyrics /> : <Queue />}</div>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {pane === 'cover' && <div className="mb-2">{info('m')}</div>}
            {Err}
            <SeekBar />
            <div className="mt-1"><TransportRow large /></div>
            <div className="mt-3 flex items-center justify-between">
              <PaneTab id="lyrics" label="歌词" icon={MicVocal} current={pane} onSelect={setPane} />
              <PaneTab id="queue" label="播放列表" icon={ListMusic} current={pane} onSelect={setPane} />
            </div>
          </div>
        </div>

        {/* ── 桌面端 ── */}
        <div className="hidden min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center gap-16 py-6 lg:grid xl:gap-24">
          <div className="mx-auto flex w-full max-w-[min(100%,56vh)] flex-col gap-7">
            <Cover src={current.artwork} rounded="rounded-2xl" priority
              className={`aspect-square w-full shadow-[0_40px_100px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out-expo ${playing ? 'scale-100' : 'scale-[0.92]'}`} />
            <div>
              {info('d')}
              <div className="mt-3">{Err}</div>
              <SeekBar />
              <div className="mt-1"><TransportRow large /></div>
              <VolumeControl className="mt-4 w-full" />
            </div>
          </div>
          <div className="flex h-full min-h-0 flex-col py-4">
            <div className="mb-4 flex shrink-0 gap-1">
              <PaneTab id="lyrics" label="歌词" icon={MicVocal} current={pane === 'queue' ? 'queue' : 'lyrics'} onSelect={p => setPane(p === 'cover' ? 'lyrics' : p)} />
              <PaneTab id="queue" label="播放列表" icon={ListMusic} current={pane === 'queue' ? 'queue' : 'lyrics'} onSelect={p => setPane(p === 'cover' ? 'lyrics' : p)} />
            </div>
            <div className="min-h-0 flex-1">{pane === 'queue' ? <Queue /> : <Lyrics big />}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
