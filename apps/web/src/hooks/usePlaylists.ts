import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'

export interface Playlist {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export function usePlaylists() {
  const userId = useAuthStore((s) => s.user?.id)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const bootstrapped = useRef(false)

  const load = useCallback(async () => {
    if (!userId) return
    setIsLoading(true)

    const { data, error } = await supabase
      .from('playlists')
      .select('id, user_id, name, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[playlists] load error:', error.message)
      setIsLoading(false)
      return
    }

    let pls = data as Playlist[]

    // Auto-create "Favorites" for new users (runs once per session)
    if (pls.length === 0 && !bootstrapped.current) {
      bootstrapped.current = true
      const { data: fav } = (await supabase
        .from('playlists')
        .insert({ user_id: userId, name: 'Favorites' })
        .select()
        .single()) as { data: Playlist | null }
      if (fav) pls = [fav]
    } else {
      bootstrapped.current = true
    }

    setPlaylists(pls)
    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!userId) return
    const channelName = `playlists-changes-${userId}-${crypto.randomUUID()}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'playlists', filter: `user_id=eq.${userId}` },
        () => {
          void load()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const createPlaylist = useCallback(
    async (name: string): Promise<Playlist | null> => {
      if (!userId) return null
      const { data, error } = (await supabase
        .from('playlists')
        .insert({ user_id: userId, name })
        .select()
        .single()) as { data: Playlist | null; error: unknown }
      if (error) {
        console.error('[playlists] create error:', error)
        return null
      }
      if (!data) return null
      const pl = data
      setPlaylists((prev) => [pl, ...prev])
      return pl
    },
    [userId],
  )

  const renamePlaylist = useCallback(async (id: string, name: string) => {
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
    await supabase
      .from('playlists')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
  }, [])

  const deletePlaylist = useCallback(async (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id))
    await supabase.from('playlists').delete().eq('id', id)
  }, [])

  const addToPlaylist = useCallback(async (playlistId: string, videoId: string) => {
    const { data } = await supabase
      .from('playlist_videos')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1)
    const maxPos = (data?.[0] as { position: number } | undefined)?.position ?? -1
    await supabase
      .from('playlist_videos')
      .upsert(
        { playlist_id: playlistId, video_id: videoId, position: maxPos + 1 },
        { onConflict: 'playlist_id,video_id' },
      )
    await supabase
      .from('playlists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', playlistId)
  }, [])

  const removeFromPlaylist = useCallback(async (playlistId: string, videoId: string) => {
    await supabase
      .from('playlist_videos')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('video_id', videoId)
  }, [])

  return {
    playlists,
    isLoading,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  }
}
