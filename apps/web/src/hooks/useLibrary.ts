import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { usePlayerStore } from '../stores/player.store'

export type VideoStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface VideoRow {
  id: string
  youtube_id: string
  title: string | null
  ai_title: string | null
  artist: string | null
  duration_seconds: number | null
  thumbnail_path: string | null
  audio_path: string | null
  status: VideoStatus
  created_at: string
  liked_at: string | null
}

function cacheKey(userId: string) {
  return `library_${userId}`
}

function readCache(userId: string): VideoRow[] {
  try {
    const raw = sessionStorage.getItem(cacheKey(userId))
    return raw ? (JSON.parse(raw) as VideoRow[]) : []
  } catch {
    return []
  }
}

function writeCache(userId: string, rows: VideoRow[]) {
  try {
    sessionStorage.setItem(cacheKey(userId), JSON.stringify(rows))
  } catch {
    /* sessionStorage can throw if full */
  }
}

export function useLibrary() {
  const userId = useAuthStore((s) => s.user?.id)
  const updateCurrentTrack = usePlayerStore((s) => s.updateCurrentTrack)
  const [tracks, setTracks] = useState<VideoRow[]>(() => (userId ? readCache(userId) : []))
  const [isLoading, setIsLoading] = useState(true)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const seen = new Set<string>()
    const all: VideoRow[] = []

    // 1) Tracks in the user's personal library (user_videos).
    const { data: uvData, error } = await supabase
      .from('user_videos')
      .select(
        'added_at, liked_at, videos(id, youtube_id, title, ai_title, artist, duration_seconds, thumbnail_path, audio_path, status, created_at)',
      )
      .is('hidden_at', null)
      .order('added_at', { ascending: false })

    if (error) {
      console.warn('[library] user_videos query failed:', error.message)
    } else {
      for (const r of uvData) {
        const v = r.videos as unknown as Omit<VideoRow, 'liked_at'> | null
        if (!v) continue
        seen.add(v.id)
        all.push({ ...v, liked_at: (r.liked_at as string | null) ?? null })
      }
    }

    // 2) Also pull tracks from every playlist the user owns.
    //    This catches tracks that somehow only exist in playlists.
    const { data: userPls } = await supabase.from('playlists').select('id').eq('user_id', userId)

    const plIds = ((userPls ?? []) as { id: string }[]).map((p) => p.id)
    if (plIds.length > 0) {
      const { data: pvData } = await supabase
        .from('playlist_videos')
        .select(
          'videos!inner(id, youtube_id, title, ai_title, artist, duration_seconds, thumbnail_path, audio_path, status, created_at)',
        )
        .in('playlist_id', plIds)

      if (pvData) {
        for (const r of pvData) {
          const v = r.videos as unknown as Omit<VideoRow, 'liked_at'> | null
          if (!v || seen.has(v.id)) continue
          seen.add(v.id)
          all.push({ ...v, liked_at: null })
        }
      }
    }

    // Fallback if nothing worked — query videos directly by added_by.
    if (all.length === 0) {
      const { data: fallback } = await supabase
        .from('videos')
        .select(
          'id, youtube_id, title, ai_title, artist, duration_seconds, thumbnail_path, audio_path, status, created_at',
        )
        .eq('added_by', userId)
        .order('created_at', { ascending: false })

      if (fallback) {
        for (const v of fallback as Omit<VideoRow, 'liked_at'>[]) {
          if (seen.has(v.id)) continue
          seen.add(v.id)
          all.push({ ...v, liked_at: null })
        }
      }
    }

    // Sort by created_at descending (latest first).
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setTracks(all)
    writeCache(userId, all)
    setIsLoading(false)
  }, [userId])

  // Show cached data on mount, then fetch fresh
  useEffect(() => {
    if (userId) {
      const cached = readCache(userId)
      if (cached.length > 0) setTracks(cached)
    }
    void load()
  }, [load, userId])

  // Keep status/metadata in sync as the worker processes tracks.
  useEffect(() => {
    if (!userId) return

    const videosChannel = supabase
      .channel(`library-videos-${userId}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'videos' }, (payload) => {
        const updated = payload.new as VideoRow
        setTracks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
        updateCurrentTrack(updated.id, {
          title: updated.ai_title ?? updated.title ?? updated.youtube_id,
          status: updated.status,
          audioPath: updated.audio_path,
          ...(updated.artist != null && { artist: updated.artist }),
          ...(updated.duration_seconds != null && { durationSeconds: updated.duration_seconds }),
        })
      })
      .subscribe()

    const uvChannel = supabase
      .channel(`library-user-videos-${userId}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_videos', filter: `user_id=eq.${userId}` },
        () => {
          // Debounce reloads — Realtime can fire multiple times for one logical change.
          if (reloadTimer.current) clearTimeout(reloadTimer.current)
          reloadTimer.current = setTimeout(() => {
            void load()
          }, 400)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(videosChannel)
      void supabase.removeChannel(uvChannel)
      if (reloadTimer.current) clearTimeout(reloadTimer.current)
    }
  }, [userId, load, updateCurrentTrack])

  const deleteTrack = useCallback(
    async (videoId: string) => {
      if (!userId) return
      setTracks((prev) => prev.filter((t) => t.id !== videoId))
      await supabase
        .from('user_videos')
        .update({ hidden_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('video_id', videoId)
    },
    [userId],
  )

  const toggleLike = useCallback(
    async (videoId: string) => {
      if (!userId) return
      const isLiked = tracks.some((t) => t.id === videoId && t.liked_at !== null)
      const liked_at = isLiked ? null : new Date().toISOString()
      setTracks((prev) => prev.map((t) => (t.id === videoId ? { ...t, liked_at } : t)))
      await supabase
        .from('user_videos')
        .update({ liked_at })
        .eq('user_id', userId)
        .eq('video_id', videoId)
    },
    [userId, tracks],
  )

  const optimisticPrepend = useCallback((row: VideoRow) => {
    setTracks((prev) => [row, ...prev.filter((t) => t.id !== row.id)])
  }, [])

  return { tracks, isLoading, deleteTrack, toggleLike, optimisticPrepend }
}
