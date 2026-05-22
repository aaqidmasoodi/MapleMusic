export type VideoStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Video {
  id: string
  youtubeId: string
  title: string | null
  aiTitle: string | null
  artist: string | null
  durationSeconds: number | null
  thumbnailPath: string | null
  audioPath: string | null
  status: VideoStatus
  errorMessage: string | null
  addedBy: string | null
  createdAt: string
  readyAt: string | null
}

export interface VideoWithUrls extends Video {
  thumbnailUrl: string | null
  manifestUrl: string | null
}
