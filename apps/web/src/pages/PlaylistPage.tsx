import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Clock, Heart, Loader2, Music2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'
import { usePlayerStore } from '../stores/player.store'
import { usePlaylists } from '../hooks/usePlaylists'
import { useLibrary } from '../hooks/useLibrary'
import { AddTrackModal } from '../components/ui/AddTrackModal'
import { TrackRow } from '../components/ui/TrackRow'
import { Button } from '../components/ui/Button'
import type { AddTrackResult } from '../hooks/useAddTrack'
import type { Track } from '../stores/player.store'
import type { VideoRow } from '../hooks/useLibrary'
import { youtubeThumbnailUrl } from '../lib/youtube'
import styles from './PlaylistPage.module.css'

function thumbnailUrl(row: VideoRow): string {
  if (row.thumbnail_path) {
    return supabase.storage.from('thumbnails').getPublicUrl(row.thumbnail_path).data.publicUrl
  }
  return youtubeThumbnailUrl(row.youtube_id)
}

function displayTitle(row: VideoRow): string {
  return row.ai_title ?? row.title ?? row.youtube_id
}

function toTrack(row: VideoRow): Track {
  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: displayTitle(row),
    artist: row.artist ?? 'Unknown artist',
    thumbnailUrl: thumbnailUrl(row),
    durationSeconds: row.duration_seconds ?? 0,
    status: row.status,
    audioPath: row.audio_path,
  }
}

export function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { playlists, deletePlaylist, removeFromPlaylist, addToPlaylist } = usePlaylists()
  const { optimisticPrepend } = useLibrary()
  const setTrack = usePlayerStore((s) => s.setTrack)

  const playlist = playlists.find((p) => p.id === id)
  const isFavorites = playlist?.name === 'Favorites'
  const [tracks, setTracks] = useState<(VideoRow & { position: number })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadTracks = useCallback(async () => {
    if (!id) return

    const found = playlists.find((p) => p.id === id)
    const favors = found?.name === 'Favorites'

    let rows: (VideoRow & { position: number })[] = []

    if (favors) {
      const { data } = await supabase
        .from('user_videos')
        .select(
          'added_at, liked_at, videos(id, youtube_id, title, ai_title, artist, duration_seconds, thumbnail_path, audio_path, status, created_at)',
        )
        .not('liked_at', 'is', null)
        .order('liked_at', { ascending: false })

      rows = (data ?? [])
        .map((r) => {
          const v = r.videos as unknown as VideoRow | null
          if (!v) return null
          return { ...v, liked_at: r.liked_at as string | null, position: 0 }
        })
        .filter((v): v is VideoRow & { position: number } => v !== null)
    } else {
      const { data } = await supabase
        .from('playlist_videos')
        .select(
          'position, videos(id, youtube_id, title, ai_title, artist, duration_seconds, thumbnail_path, audio_path, status, created_at)',
        )
        .eq('playlist_id', id)
        .order('position', { ascending: true })

      rows = (data ?? [])
        .map((r) => {
          const v = r.videos as unknown as VideoRow | null
          if (!v) return null
          return { ...v, liked_at: null as string | null, position: r.position as number }
        })
        .filter((v): v is VideoRow & { position: number } => v !== null)
    }

    setTracks(rows)
    setIsLoading(false)
  }, [id, playlists])

  useEffect(() => {
    void loadTracks()
  }, [loadTracks])

  const handlePlay = useCallback(
    (row: VideoRow) => {
      const queue = tracks.filter((t) => t.status !== 'failed').map(toTrack)
      setTrack(toTrack(row), queue)
    },
    [tracks, setTrack],
  )

  const handleAddSuccess = useCallback(
    async (result: AddTrackResult) => {
      if (!id) return
      const favors = playlist?.name === 'Favorites'
      const likedAt = favors ? new Date().toISOString() : null

      setTracks((prev) => [
        ...prev,
        {
          id: result.videoId,
          youtube_id: result.youtubeId,
          title: result.title,
          ai_title: null,
          artist: result.artist || null,
          duration_seconds: null,
          thumbnail_path: null,
          audio_path: null,
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          liked_at: likedAt,
          position: prev.length,
        },
      ])
      optimisticPrepend({
        id: result.videoId,
        youtube_id: result.youtubeId,
        title: result.title,
        ai_title: null,
        artist: result.artist || null,
        duration_seconds: null,
        thumbnail_path: null,
        audio_path: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        liked_at: likedAt,
      })

      if (favors) {
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          await supabase
            .from('user_videos')
            .upsert(
              { user_id: userId, video_id: result.videoId, liked_at: likedAt },
              { onConflict: 'user_id,video_id' },
            )
        }
      } else {
        await addToPlaylist(id, result.videoId)
      }
    },
    [id, playlist?.name, addToPlaylist, optimisticPrepend],
  )

  const handleRemove = useCallback(
    (videoId: string) => {
      if (!id) return
      setTracks((prev) => prev.filter((t) => t.id !== videoId))
      if (playlist?.name === 'Favorites') {
        const userId = useAuthStore.getState().user?.id
        if (userId) {
          void supabase
            .from('user_videos')
            .upsert(
              { user_id: userId, video_id: videoId, liked_at: null },
              { onConflict: 'user_id,video_id' },
            )
        }
      } else {
        void removeFromPlaylist(id, videoId)
      }
    },
    [id, playlist?.name, removeFromPlaylist],
  )

  const handleToggleLike = useCallback(
    (videoId: string) => {
      const userId = useAuthStore.getState().user?.id
      if (!userId) return
      const row = tracks.find((t) => t.id === videoId)
      const isLiked = row?.liked_at !== null
      const likedAt = isLiked ? null : new Date().toISOString()
      setTracks((prev) => prev.map((t) => (t.id === videoId ? { ...t, liked_at: likedAt } : t)))
      void supabase
        .from('user_videos')
        .upsert(
          { user_id: userId, video_id: videoId, liked_at: likedAt },
          { onConflict: 'user_id,video_id' },
        )
    },
    [tracks],
  )

  const handleAddToPlaylist = useCallback(
    (playlistId: string, videoId: string) => {
      void addToPlaylist(playlistId, videoId)
    },
    [addToPlaylist],
  )

  const handleDeletePlaylist = useCallback(async () => {
    if (!id) return
    await deletePlaylist(id)
    void navigate('/library')
  }, [id, deletePlaylist, navigate])

  if (!isLoading && !playlist) {
    return (
      <div className={styles.page}>
        <p className={styles.notFound}>Playlist not found.</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <div className={`${styles.playlistIcon} ${isFavorites ? styles.playlistIconFav : ''}`}>
            {isFavorites ? (
              <Heart size={32} strokeWidth={1.5} fill="currentColor" />
            ) : (
              <Music2 size={32} strokeWidth={1.25} />
            )}
          </div>
          <div>
            <h1 className={styles.title}>{playlist?.name ?? '…'}</h1>
            {!isLoading && (
              <p className={styles.subtitle}>
                {tracks.length} track{tracks.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button
            size="sm"
            onClick={() => {
              setIsModalOpen(true)
            }}
          >
            <Plus size={14} />
            Add track
          </Button>
          {!isFavorites && (
            <button
              className={styles.deletePlaylistBtn}
              onClick={() => {
                void handleDeletePlaylist()
              }}
              aria-label="Delete playlist"
            >
              <Trash2 size={14} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Loader2 size={24} strokeWidth={1.75} className={styles.spin} />
        </div>
      ) : tracks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIconWrap}>
            <Music2 size={36} strokeWidth={1.25} />
          </div>
          <p className={styles.emptyTitle}>No tracks yet</p>
          <p className={styles.emptyText}>Paste a YouTube link to add your first track.</p>
          <Button
            size="md"
            onClick={() => {
              setIsModalOpen(true)
            }}
          >
            <Plus size={15} />
            Add your first track
          </Button>
        </div>
      ) : (
        <div className={styles.trackList}>
          <div className={styles.listHeader}>
            <span className={styles.colNum}>#</span>
            <span />
            <span className={styles.colTitle}>Title</span>
            <span className={styles.colDuration}>
              <Clock size={12} strokeWidth={1.75} />
            </span>
          </div>
          <div className={styles.listDivider} />
          {tracks.map((row, i) => (
            <TrackRow
              key={row.id}
              row={row}
              index={i}
              playlists={playlists}
              playlistId={id}
              showRemoveFromPlaylist
              isLiked={row.liked_at !== null}
              onPlay={handlePlay}
              onToggleLike={handleToggleLike}
              onAddToPlaylist={handleAddToPlaylist}
              onRemoveFromPlaylist={handleRemove}
            />
          ))}
        </div>
      )}

      <AddTrackModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        onSuccess={(result) => {
          void handleAddSuccess(result)
        }}
      />
    </div>
  )
}
