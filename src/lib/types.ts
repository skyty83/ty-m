export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  albumId?: string;
  artistId?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  date?: string;
  description?: string;
}

export interface Artist {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  worksNum?: number;
}

export interface Sheet {
  id: string;
  title: string;
  artist?: string;
  artwork?: string;
  playCount?: number;
  description?: string;
  worksNum?: number;
}

export interface TopListItem {
  id: string;
  title: string;
  coverImg?: string;
  description?: string;
}

export interface TopListGroup {
  title: string;
  data: TopListItem[];
}

export interface Paged<T> {
  isEnd?: boolean;
  data: T[];
}

export type CollectionKind = 'chart' | 'album' | 'artist' | 'playlist';
