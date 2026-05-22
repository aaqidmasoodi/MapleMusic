const patterns = [
  /[?&]v=([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /\/shorts\/([a-zA-Z0-9_-]{11})/,
  /\/embed\/([a-zA-Z0-9_-]{11})/,
]

export function parseYoutubeId(url: string): string | null {
  const trimmed = url.trim()
  for (const re of patterns) {
    const m = trimmed.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

export function youtubeThumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
}
