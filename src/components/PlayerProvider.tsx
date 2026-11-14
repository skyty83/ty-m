'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { getArtwork, getLyric, getMediaUrl } from '@/lib/api';
import { parseLrc, type LrcLine } from '@/lib/lrc';
import { pushRecent, updateStoredSong } from '@/lib/storage';
import type { Song } from '@/lib/types';

export type RepeatMode = 'off' | 'all' | 'one';
export type Pane = 'cover' | 'lyrics' | 'queue';

interface PlayerState {
  queue: Song[];
  index: number;
  current: Song | null;
  playing: boolean;
  loading: boolean;
  error: string;
  repeat: RepeatMode;
  shuffle: boolean;
  volume: number;
  muted: boolean;
  lyrics: LrcLine[] | null; // null = 불러오는 중
  fullOpen: boolean;
  pane: Pane;
}

interface PlayerActions {
  playList: (songs: Song[], startIndex?: number) => void;
  playAt: (index: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  addNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeAt: (index: number) => void;
  setFullOpen: (open: boolean, pane?: Pane) => void;
  setPane: (p: Pane) => void;
  clearError: () => void;
}

interface Progress { time: number; duration: number; buffered: number }

const PlayerCtx = createContext<(PlayerState & PlayerActions) | null>(null);
const ProgressCtx = createContext<Progress>({ time: 0, duration: 0, buffered: 0 });

export const usePlayer = () => {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
};
export const useProgress = () => useContext(ProgressCtx);

const SESSION_KEY = 'tym:session';

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [repeat, setRepeat] = useState<RepeatMode>('all');
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [lyrics, setLyrics] = useState<LrcLine[] | null>([]);
  const [fullOpen, setFullOpenState] = useState(false);
  const [pane, setPane] = useState<Pane>('cover');
  const setFullOpen = useCallback((open: boolean, p?: Pane) => {
    setFullOpenState(open);
    if (p) setPane(p);
  }, []);
  const [progress, setProgress] = useState<Progress>({ time: 0, duration: 0, buffered: 0 });

  // 곡 전환 경쟁 상태 방지용 토큰
  const loadToken = useRef(0);
  // 세션 복원 후 첫 재생 시 이어 듣기 위치
  const resumeAt = useRef(0);
  // 복원된 곡은 사용자가 재생을 누를 때 src 를 로드한다
  const pendingLoad = useRef(false);

  const current = index >= 0 && index < queue.length ? queue[index] : null;

  // ── 세션 복원/저장 ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.queue) && s.queue.length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 1회 복원
          setQueue(s.queue);
          setIndex(Math.min(Math.max(0, s.index ?? 0), s.queue.length - 1));
          resumeAt.current = Number(s.time) || 0;
          pendingLoad.current = true;
        }
        if (s.repeat) setRepeat(s.repeat);
        if (typeof s.shuffle === 'boolean') setShuffle(s.shuffle);
        if (typeof s.volume === 'number') setVolumeState(s.volume);
      }
    } catch { /* ignore */ }
  }, []);

  const timeRef = useRef(0);
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          queue: queue.slice(0, 300), index, time: timeRef.current, repeat, shuffle, volume,
        }));
      } catch { /* ignore */ }
    };
    save();
    const id = window.setInterval(save, 5000);
    window.addEventListener('pagehide', save);
    return () => { window.clearInterval(id); window.removeEventListener('pagehide', save); };
  }, [queue, index, repeat, shuffle, volume]);

  // ── 곡 로드 ───────────────────────────────────────────────────────
  const patchSong = useCallback((id: string, patch: Partial<Song>) => {
    setQueue(q => q.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const load = useCallback(async (song: Song, autoplay: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;
    const token = ++loadToken.current;
    pendingLoad.current = false;
    setError('');
    setLoading(true);
    setLyrics(null);
    setProgress({ time: 0, duration: 0, buffered: 0 });
    audio.pause();

    getLyric(song).then(raw => {
      if (token === loadToken.current) setLyrics(parseLrc(raw));
    });
    if (!song.artwork) {
      getArtwork(song).then(art => {
        if (art) {
          patchSong(song.id, { artwork: art });
          updateStoredSong({ ...song, artwork: art });
        }
      });
    }

    try {
      const url = await getMediaUrl(song);
      if (token !== loadToken.current) return;
      audio.src = url;
      const start = resumeAt.current;
      resumeAt.current = 0;
      if (start > 0) {
        audio.addEventListener('loadedmetadata', () => { audio.currentTime = start; }, { once: true });
      }
      pushRecent(song);
      if (autoplay) await audio.play();
    } catch (e) {
      if (token !== loadToken.current) return;
      // 사용자 제스처 없는 자동재생 차단은 오류로 보지 않는다
      if (e instanceof DOMException && e.name === 'NotAllowedError') return;
      setError(e instanceof Error ? e.message : '播放失败');
      setPlaying(false);
    } finally {
      if (token === loadToken.current) setLoading(false);
    }
  }, [patchSong]);

  // index 가 바뀌면 그 곡을 로드 (id 기준이라 artwork 패치로는 재로드되지 않음)
  const currentId = current?.id;
  const autoplayNext = useRef(false);
  useEffect(() => {
    if (!current || pendingLoad.current) return;
    load(current, autoplayNext.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, index]);

  const go = useCallback((i: number, autoplay = true) => {
    autoplayNext.current = autoplay;
    if (i === index && current) {
      // 같은 곡 다시 선택 → 처음부터
      load(current, autoplay);
    } else {
      setIndex(i);
    }
  }, [index, current, load]);

  // ── 액션 ─────────────────────────────────────────────────────────
  const playList = useCallback((songs: Song[], startIndex = 0) => {
    if (!songs.length) return;
    autoplayNext.current = true;
    pendingLoad.current = false;
    setQueue(songs);
    // 같은 곡이면 currentId/index 가 그대로라 effect 가 돌지 않으므로 직접 로드
    if (songs[startIndex]?.id === current?.id) load(songs[startIndex], true);
    setIndex(startIndex);
  }, [current, load]);

  const pickNext = useCallback((dir: 1 | -1, auto: boolean): number => {
    const n = queue.length;
    if (!n) return -1;
    if (auto && repeat === 'one') return index;
    if (shuffle && n > 1) {
      let r = index;
      while (r === index) r = Math.floor(Math.random() * n);
      return r;
    }
    const i = index + dir;
    if (i >= n) return repeat === 'off' && auto ? -1 : 0;
    if (i < 0) return n - 1;
    return i;
  }, [queue.length, index, repeat, shuffle]);

  const next = useCallback(() => {
    const i = pickNext(1, false);
    if (i >= 0) go(i);
  }, [pickNext, go]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    const i = pickNext(-1, false);
    if (i >= 0) go(i);
  }, [pickNext, go]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (pendingLoad.current) { load(current, true); return; }
    if (audio.paused) audio.play().catch(err => setError(String(err?.message || err)));
    else audio.pause();
  }, [current, load]);

  const seek = useCallback((sec: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(sec)) audio.currentTime = Math.max(0, sec);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (v > 0) setMuted(false);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const addNext = useCallback((song: Song) => {
    if (!queue.length) { playList([song]); return; }
    if (queue[index]?.id === song.id) return;
    const cur = queue[index];
    const out = queue.filter(s => s.id !== song.id);
    const curIdx = out.findIndex(s => s.id === cur?.id);
    out.splice(curIdx + 1, 0, song);
    setQueue(out);
    if (curIdx !== index) setIndex(curIdx);
  }, [queue, index, playList]);

  const addToQueue = useCallback((song: Song) => {
    if (!queue.length) { playList([song]); return; }
    setQueue(q => (q.some(s => s.id === song.id) ? q : [...q, song]));
  }, [queue.length, playList]);

  const removeAt = useCallback((i: number) => {
    if (i === index) return;
    setQueue(q => q.filter((_, k) => k !== i));
    if (i < index) setIndex(x => x - 1);
  }, [index]);

  // ── audio 이벤트 ─────────────────────────────────────────────────
  const onEnded = useCallback(() => {
    const i = pickNext(1, true);
    if (i < 0) { setPlaying(false); return; }
    if (i === index && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      go(i);
    }
  }, [pickNext, index, go]);

  const onTime = useCallback((a: HTMLAudioElement) => {
    timeRef.current = a.currentTime;
    let buffered = 0;
    if (a.buffered.length) buffered = a.buffered.end(a.buffered.length - 1);
    setProgress({ time: a.currentTime, duration: Number.isFinite(a.duration) ? a.duration : 0, buffered });
  }, []);

  // ── Media Session (잠금화면/블루투스 컨트롤) ──────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album || '',
      artwork: current.artwork
        ? [{ src: current.artwork, sizes: '512x512' }]
        : [{ src: '/pwa-icon/512', sizes: '512x512', type: 'image/png' }],
    });
  }, [current]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => toggle()],
      ['pause', () => audioRef.current?.pause()],
      ['previoustrack', () => prev()],
      ['nexttrack', () => next()],
      ['seekto', d => { if (d.seekTime != null) seek(d.seekTime); }],
      ['seekbackward', d => seek((audioRef.current?.currentTime || 0) - (d.seekOffset || 10))],
      ['seekforward', d => seek((audioRef.current?.currentTime || 0) + (d.seekOffset || 10))],
    ];
    for (const [a, h] of handlers) { try { ms.setActionHandler(a, h); } catch { /* 미지원 */ } }
    return () => { for (const [a] of handlers) { try { ms.setActionHandler(a, null); } catch { /* */ } } };
  }, [toggle, prev, next, seek]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !progress.duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: progress.duration,
        position: Math.min(progress.time, progress.duration),
        playbackRate: 1,
      });
    } catch { /* ignore */ }
    // 매 timeupdate 마다가 아니라 초 단위로만 갱신
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(progress.time), progress.duration]);

  // ── 키보드 단축키 ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.code === 'ArrowRight' && e.shiftKey) next();
      else if (e.code === 'ArrowLeft' && e.shiftKey) prev();
      else if (e.code === 'ArrowRight') seek((audioRef.current?.currentTime || 0) + 5);
      else if (e.code === 'ArrowLeft') seek((audioRef.current?.currentTime || 0) - 5);
      else if (e.code === 'KeyM') setMuted(m => !m);
      else if (e.code === 'Escape') setFullOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [toggle, next, prev, seek, setFullOpen]);

  const value = useMemo(() => ({
    queue, index, current, playing, loading, error, repeat, shuffle, volume, muted, lyrics, fullOpen, pane, setPane,
    playList, playAt: (i: number) => go(i), toggle, next, prev, seek, setVolume,
    toggleMute: () => setMuted(m => !m),
    cycleRepeat: () => setRepeat(r => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
    toggleShuffle: () => setShuffle(s => !s),
    addNext, addToQueue, removeAt, setFullOpen, clearError: () => setError(''),
  }), [queue, index, current, playing, loading, error, repeat, shuffle, volume, muted, lyrics, fullOpen, pane, setFullOpen,
    playList, go, toggle, next, prev, seek, setVolume, addNext, addToQueue, removeAt]);

  return (
    <PlayerCtx.Provider value={value}>
      <ProgressCtx.Provider value={progress}>
        {children}
        <audio
          ref={audioRef}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          onTimeUpdate={e => onTime(e.currentTarget)}
          onLoadedMetadata={e => onTime(e.currentTarget)}
          onProgress={e => onTime(e.currentTarget)}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={() => {
            if (audioRef.current?.src && !pendingLoad.current) {
              setError('音频加载失败');
              setLoading(false);
            }
          }}
        />
      </ProgressCtx.Provider>
    </PlayerCtx.Provider>
  );
}
