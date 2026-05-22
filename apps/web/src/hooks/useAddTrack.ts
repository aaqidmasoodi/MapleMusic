import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

type AddTrackStatus = 'idle' | 'loading' | 'success' | 'error'

interface SubmitTrackResult {
  videoId: string
  status: string
  isNew: boolean
  jobId?: string
}

export function useAddTrack() {
  const [status, setStatus] = useState<AddTrackStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)

  const submit = useCallback(async (url: string) => {
    setStatus('loading')
    setError(null)

    try {
      const resp = await supabase.functions.invoke<SubmitTrackResult>('submit-track', {
        body: { url },
      })
      if (resp.error) throw new Error(String(resp.error))
      const data = resp.data
      if (!data) throw new Error('No response from server')
      setVideoId(data.videoId)
      setStatus('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setVideoId(null)
  }, [])

  return { submit, status, error, videoId, reset }
}
