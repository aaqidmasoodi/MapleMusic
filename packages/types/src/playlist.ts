import type { Video } from './video'

export interface Playlist {
  id: string
  ownerId: string
  name: string
  coverPath: string | null
  createdAt: string
}

export interface PlaylistItem {
  id: string
  playlistId: string
  videoId: string
  position: number
  addedAt: string
}

export interface PlaylistWithItems extends Playlist {
  items: (PlaylistItem & { video: Video })[]
}
