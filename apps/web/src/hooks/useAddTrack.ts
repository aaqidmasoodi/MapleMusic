import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { youtubeThumbnailUrl } from '../lib/youtube'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined

async function proactiveWarm(youtubeId: string): Promise<void> {
  if (!WORKER_URL) return
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    await fetch(
      `${WORKER_URL}/warm/${encodeURIComponent(youtubeId)}?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
      },
    )
  } catch {
    // Fire-and-forget — don't block the UI
  }
}

type AddTrackStatus = 'idle' | 'loading' | 'success' | 'error'

interface SubmitTrackResult {
  videoId: string
  status: string
  isNew: boolean
  jobId?: string
}

interface OembedData {
  title?: string
  author_name?: string
  thumbnail_url?: string
}

export interface AddTrackResult {
  videoId: string
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
}

export function useAddTrack() {
  const [status, setStatus] = useState<AddTrackStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AddTrackResult | null>(null)

  const submit = useCallback(async (url: string, youtubeId: string) => {
    setStatus('loading')
    setError(null)

    try {
      const resp = await supabase.functions.invoke<SubmitTrackResult>('submit-track', {
        body: { url },
      })

      if (resp.error) throw new Error(String(resp.error))
      const data = resp.data
      if (!data) throw new Error('No response from server')

      // Set result immediately — playback starts as soon as this state flips.
      setResult({
        videoId: data.videoId,
        youtubeId,
        title: youtubeId,
        artist: '',
        thumbnailUrl: youtubeThumbnailUrl(youtubeId),
      })
      setStatus('success')

      // Fetch oembed for real metadata + pre-warm the stream — both fire-and-forget.
      void (async () => {
        try {
          const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
          const oembedResp = await fetch(oembedUrl)
          if (oembedResp.ok) {
            const oembed = (await oembedResp.json()) as OembedData
            setResult((prev) =>
              prev
                ? {
                    ...prev,
                    title: oembed.title ?? prev.title,
                    artist: oembed.author_name ?? prev.artist,
                    thumbnailUrl: oembed.thumbnail_url ?? prev.thumbnailUrl,
                  }
                : prev,
            )
          }
        } catch {
          /* oembed failure is non-fatal */
        }
        void proactiveWarm(youtubeId)
      })()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setResult(null)
  }, [])

  return { submit, status, error, result, reset }
}
