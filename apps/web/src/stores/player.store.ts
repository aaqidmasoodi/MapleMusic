import { create } from 'zustand'

export type RepeatMode = 'none' | 'all' | 'one'

export type TrackStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Track {
  id: string
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string | null
  durationSeconds: number
  /** When 'ready', stream cached HLS from the CDN; otherwise live-proxy via the worker. */
  status: TrackStatus
  /** HLS manifest path in the audio bucket, e.g. hls/{youtubeId}/playlist.m3u8 */
  audioPath: string | null
}

interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  shuffle: boolean
  repeatMode: RepeatMode
  volume: number
  isMuted: boolean
  progress: number
  isExpanded: boolean

  setTrack: (track: Track, queue?: Track[]) => void
  /** Patch metadata on the current track (and matching queue entry) when it arrives async. */
  updateCurrentTrack: (
    id: string,
    fields: Partial<
      Pick<Track, 'title' | 'artist' | 'thumbnailUrl' | 'durationSeconds' | 'status' | 'audioPath'>
    >,
  ) => void
  togglePlay: () => void
  skipNext: () => void
  skipPrev: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
  setProgress: (p: number) => void
  setExpanded: (v: boolean) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  shuffle: false,
  repeatMode: 'none',
  volume: 0.8,
  isMuted: false,
  progress: 0,
  isExpanded: false,

  setTrack: (track, queue) => {
    const q = queue ?? [track]
    const idx = q.findIndex((t) => t.id === track.id)
    set({
      currentTrack: track,
      queue: q,
      queueIndex: idx < 0 ? 0 : idx,
      isPlaying: true,
      progress: 0,
    })
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }))
  },

  skipNext: () => {
    const { queue, queueIndex, shuffle, repeatMode } = get()
    if (queue.length === 0) return
    let next: number
    if (repeatMode === 'one') {
      next = queueIndex
    } else if (shuffle) {
      next = Math.floor(Math.random() * queue.length)
    } else {
      next = (queueIndex + 1) % queue.length
    }
    // index is always valid: computed from modulo/random within queue.length
    set({ currentTrack: queue[next] ?? null, queueIndex: next, progress: 0, isPlaying: true })
  },

  skipPrev: () => {
    const { queue, queueIndex, progress } = get()
    if (progress > 0.05) {
      set({ progress: 0 })
      return
    }
    if (queue.length === 0) return
    const prev = (queueIndex - 1 + queue.length) % queue.length
    set({ currentTrack: queue[prev] ?? null, queueIndex: prev, progress: 0, isPlaying: true })
  },

  toggleShuffle: () => {
    set((s) => ({ shuffle: !s.shuffle }))
  },

  cycleRepeat: () => {
    set((s) => ({
      repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none',
    }))
  },

  setVolume: (v) => {
    set({ volume: Math.max(0, Math.min(1, v)), isMuted: v === 0 })
  },

  toggleMute: () => {
    set((s) => ({ isMuted: !s.isMuted }))
  },

  setProgress: (p) => {
    set({ progress: Math.max(0, Math.min(1, p)) })
  },

  setExpanded: (v) => {
    set({ isExpanded: v })
  },

  updateCurrentTrack: (id, fields) => {
    set((s) => ({
      currentTrack: s.currentTrack?.id === id ? { ...s.currentTrack, ...fields } : s.currentTrack,
      queue: s.queue.map((t) => (t.id === id ? { ...t, ...fields } : t)),
    }))
  },
}))
