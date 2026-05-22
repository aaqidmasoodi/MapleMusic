import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'

export type VideoStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface VideoRow {
  id: string
  youtube_id: string
  title: string | null
  ai_title: string | null
  artist: string | null
  duration_seconds: number | null
  thumbnail_path: string | null
  status: VideoStatus
  created_at: string
}

export function useLibrary() {
  const userId = useAuthStore((s) => s.user?.id)
  const [tracks, setTracks] = useState<VideoRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('videos')
      .select(
        'id, youtube_id, title, ai_title, artist, duration_seconds, thumbnail_path, status, created_at',
      )
      .eq('added_by', userId)
      .order('created_at', { ascending: false })
    setTracks(data ?? [])
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  // Realtime: keep status in sync as the worker processes tracks
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('library-videos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos', filter: `added_by=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTracks((prev) => [payload.new as VideoRow, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTracks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as VideoRow).id ? (payload.new as VideoRow) : t,
              ),
            )
          } else {
            setTracks((prev) => prev.filter((t) => t.id !== (payload.old as { id: string }).id))
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  return { tracks, isLoading, refresh: load }
}
