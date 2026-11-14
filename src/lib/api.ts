import type { Album, Artist, CollectionKind, Paged, Sheet, Song, TopListGroup } from './types';

export async function apiCall<T>(action: string, args: unknown[] = []): Promise<T> {
  const res = await fetch('/api/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, args }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as T;
}

// 플러그인이 넘겨주는 추가 필드(formats 등)를 버리고 필요한 것만 남긴다
export function toSong(raw: Partial<Song> & { id: string | number }): Song {
  return {
    id: String(raw.id),
    title: raw.title || '未知歌曲',
    artist: raw.artist || '未知歌手',
    album: raw.album || undefined,
    artwork: raw.artwork || undefined,
    albumId: raw.albumId ? String(raw.albumId) : undefined,
    artistId: raw.artistId ? String(raw.artistId) : undefined,
  };
}

export type SearchType = 'music' | 'album' | 'artist' | 'sheet';
type SearchResult = { music: Song; album: Album; artist: Artist; sheet: Sheet };

export async function search<K extends SearchType>(query: string, page: number, type: K): Promise<Paged<SearchResult[K]>> {
  const r = await apiCall<Paged<SearchResult[K]>>('search', [query, page, type]);
  const data = (r.data || []) as SearchResult[K][];
  return { isEnd: r.isEnd ?? data.length === 0, data: type === 'music' ? (data as Song[]).map(toSong) as SearchResult[K][] : data };
}

export async function getTopLists(): Promise<TopListGroup[]> {
  const r = await apiCall<TopListGroup[] | { data?: TopListGroup[] }>('getTopLists');
  return Array.isArray(r) ? r : r.data || [];
}

export async function getRecommendSheets(page = 1, tag: { id?: string; digest?: string } = { id: '' }): Promise<Paged<Sheet>> {
  const r = await apiCall<Paged<Sheet>>('getRecommendSheetsByTag', [tag, page]);
  return { isEnd: r.isEnd, data: r.data || [] };
}

export interface SheetTag { id: string; title: string; digest?: string }

export async function getSheetTags(): Promise<SheetTag[]> {
  const r = await apiCall<{ pinned?: SheetTag[]; data?: { title: string; data: SheetTag[] }[] }>('getRecommendSheetTags');
  return r.pinned || [];
}

export async function getMediaUrl(song: Song): Promise<string> {
  const r = await apiCall<{ url?: string }>('getMediaSource', [song, 'standard']);
  if (!r.url) throw new Error('无法获取播放地址');
  return r.url;
}

export async function getLyric(song: Song): Promise<string> {
  try {
    const r = await apiCall<{ rawLrc?: string; lrc?: string }>('getLyric', [song]);
    return r.rawLrc || r.lrc || '';
  } catch {
    return '';
  }
}

export async function getArtwork(song: Song): Promise<string | undefined> {
  try {
    const r = await apiCall<{ artwork?: string }>('getMusicInfo', [song]);
    return r.artwork;
  } catch {
    return undefined;
  }
}

// 상세 페이지(차트/앨범/아티스트/플레이리스트)의 곡 목록
export async function getCollection(
  kind: CollectionKind,
  item: { id: string; artwork?: string; title?: string },
  page: number,
): Promise<{ songs: Song[]; isEnd: boolean }> {
  type ML = { musicList?: Song[]; data?: Song[]; isEnd?: boolean };
  let r: ML;
  switch (kind) {
    case 'chart':
      r = await apiCall<ML>('getTopListDetail', [item, page]);
      return { songs: (r.musicList || []).map(toSong), isEnd: true };
    case 'album':
      r = await apiCall<ML>('getAlbumInfo', [item, page]);
      return { songs: (r.musicList || []).map(s => toSong({ ...s, artwork: s.artwork || item.artwork })), isEnd: true };
    case 'artist':
      r = await apiCall<ML>('getArtistWorks', [item, page, 'music']);
      return { songs: (r.data || []).map(toSong), isEnd: r.isEnd ?? true };
    case 'playlist':
      r = await apiCall<ML>('getMusicSheetInfo', [item, page]);
      return { songs: (r.musicList || []).map(toSong), isEnd: r.isEnd ?? true };
  }
}

export function collectionHref(kind: CollectionKind, item: { id: string | number; title?: string; name?: string; artwork?: string; coverImg?: string; avatar?: string; artist?: string }) {
  const p = new URLSearchParams();
  const title = item.title || item.name;
  const art = item.artwork || item.coverImg || item.avatar;
  if (title) p.set('t', title);
  if (art) p.set('a', art);
  if (item.artist) p.set('s', item.artist);
  return `/list/${kind}/${encodeURIComponent(String(item.id))}?${p.toString()}`;
}
