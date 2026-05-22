export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface MediaJob {
  id: string
  videoId: string
  youtubeId: string
  status: JobStatus
  attempts: number
  errorMessage: string | null
  claimedAt: string | null
  createdAt: string
}
