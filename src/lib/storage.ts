'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Song } from './types';

// localStorage 기반의 작은 스토어 (탭 간 동기화 포함)
function createStore<T>(key: string, fallback: T) {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== undefined) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  };
  const write = (value: T) => {
    cache = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 불가(프라이빗 모드 등) */ }
    listeners.forEach(l => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) { cache = undefined; l(); }
    };
    window.addEventListener('storage', onStorage);
    return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
  };
  return { read, write, subscribe, fallback };
}

const likedStore = createStore<Song[]>('tym:liked', []);
const recentStore = createStore<Song[]>('tym:recent', []);
const searchStore = createStore<string[]>('tym:searches', []);

function useStore<T>(store: ReturnType<typeof createStore<T>>) {
  return useSyncExternalStore(store.subscribe, store.read, () => store.fallback);
}

export function useLiked() {
  const liked = useStore(likedStore);
  const isLiked = useCallback((id: string) => liked.some(s => s.id === id), [liked]);
  const toggle = useCallback((song: Song) => {
    const cur = likedStore.read();
    likedStore.write(cur.some(s => s.id === song.id) ? cur.filter(s => s.id !== song.id) : [song, ...cur]);
  }, []);
  return { liked, isLiked, toggle };
}

export function useRecent() {
  return useStore(recentStore);
}

export function pushRecent(song: Song) {
  const cur = recentStore.read().filter(s => s.id !== song.id);
  recentStore.write([song, ...cur].slice(0, 100));
}

export function clearRecent() {
  recentStore.write([]);
}

export function useSearchHistory() {
  const list = useStore(searchStore);
  const add = useCallback((q: string) => {
    const cur = searchStore.read().filter(x => x !== q);
    searchStore.write([q, ...cur].slice(0, 12));
  }, []);
  const clear = useCallback(() => searchStore.write([]), []);
  return { list, add, clear };
}

export function updateStoredSong(song: Song) {
  // 나중에 받아온 앨범아트를 저장된 항목에도 반영
  for (const st of [likedStore, recentStore]) {
    const cur = st.read();
    if (cur.some(s => s.id === song.id && s.artwork !== song.artwork)) {
      st.write(cur.map(s => (s.id === song.id ? { ...s, artwork: song.artwork } : s)));
    }
  }
}
