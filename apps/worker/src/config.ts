// Worker configuration — read once at boot, fail fast on missing required vars.

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`[config] Missing required env var: ${name}`)
    process.exit(1)
  }
  return value
}

function optional(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.length > 0 ? value : fallback
}

export const config = {
  supabaseUrl: required('SUPABASE_URL'),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  port: Number.parseInt(optional('PORT', '8080'), 10),

  // Storage buckets
  audioBucket: optional('AUDIO_BUCKET', 'audio'),
  thumbnailBucket: optional('THUMBNAIL_BUCKET', 'thumbnails'),

  // Transcode settings
  audioBitrate: optional('AUDIO_BITRATE', '128k'),
  hlsSegmentSeconds: Number.parseInt(optional('HLS_TIME', '6'), 10),

  // Queue poller
  pollIntervalMs: Number.parseInt(optional('POLL_INTERVAL_MS', '1000'), 10),
  maxAttempts: Number.parseInt(optional('MAX_ATTEMPTS', '3'), 10),

  // Whether the audio bucket is public (v1 default) — controls how we build
  // the manifest URL we hand to the client.
  publicAudio: optional('PUBLIC_AUDIO', 'true') === 'true',

  // Binaries (overridable for non-PATH installs)
  ytDlpBin: optional('YTDLP_BIN', 'yt-dlp'),
  ffmpegBin: optional('FFMPEG_BIN', 'ffmpeg'),
} as const

export function youtubeUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`
}
