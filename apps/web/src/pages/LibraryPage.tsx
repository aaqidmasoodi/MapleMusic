import { useCallback, useState } from 'react'
import { NavLink } from 'react-router'
import { Clock, Heart, ListMusic, Loader2, Music2, Trash2, TriangleAlert } from 'lucide-react'
import { type VideoRow, useLibrary } from '../hooks/useLibrary'
import { usePlaylists, type Playlist } from '../hooks/usePlaylists'
import { usePlayerStore } from '../stores/player.store'
import type { Track } from '../stores/player.store'
import { supabase } from '../lib/supabase'
import { youtubeThumbnailUrl } from '../lib/youtube'
import styles from './LibraryPage.module.css'

function fmt(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m.toString()}:${s.toString().padStart(2, '0')}`
}

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

interface TrackRowProps {
  row: VideoRow
  index: number
  onPlay: (row: VideoRow) => void
  onDelete: (id: string) => Promise<void>
  onToggleLike: (id: string) => Promise<void>
}

function TrackRow({ row, index, onPlay, onDelete, onToggleLike }: TrackRowProps) {
  const isReady = row.status === 'ready'
  const isFailed = row.status === 'failed'
  const isPlayable = !isFailed
  const isLiked = row.liked_at !== null

  return (
    <div
      className={`${styles.trackRow} ${isPlayable ? styles.trackPlayable : ''}`}
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable ? 0 : undefined}
      aria-label={isPlayable ? `Play ${displayTitle(row)}` : undefined}
      onClick={() => {
        if (isPlayable) onPlay(row)
      }}
      onKeyDown={(e) => {
        if (isPlayable && (e.key === 'Enter' || e.key === ' ')) onPlay(row)
      }}
    >
      <span className={styles.trackIndex}>{index + 1}</span>

      <div className={styles.trackThumb}>
        <img src={thumbnailUrl(row)} alt="" className={styles.trackThumbImg} loading="lazy" />
        {isFailed && (
          <div className={styles.trackThumbOverlay}>
            <TriangleAlert size={14} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className={styles.trackMeta}>
        <span className={styles.trackTitle}>{displayTitle(row)}</span>
        <span className={styles.trackArtist}>{row.artist ?? 'Unknown artist'}</span>
      </div>

      <div className={styles.trackRight}>
        {isFailed ? (
          <span className={`${styles.statusBadge} ${styles.status_failed}`}>Failed</span>
        ) : isReady && row.duration_seconds ? (
          <span className={styles.trackDuration}>{fmt(row.duration_seconds)}</span>
        ) : null}

        <button
          className={`${styles.likeBtn} ${isLiked ? styles.likeBtnActive : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            void onToggleLike(row.id)
          }}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={13} strokeWidth={1.75} fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation()
            void onDelete(row.id)
          }}
          aria-label={`Remove ${displayTitle(row)} from library`}
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

interface PlaylistRowProps {
  playlist: Playlist
  onDelete: (id: string) => Promise<void>
}

function PlaylistRow({ playlist, onDelete }: PlaylistRowProps) {
  const isFavorites = playlist.name === 'Favorites'

  return (
    <div className={styles.playlistRow}>
      <NavLink to={`/playlist/${playlist.id}`} className={styles.playlistLink}>
        <div className={styles.playlistIcon}>
          {isFavorites ? (
            <Heart size={20} strokeWidth={1.75} fill="currentColor" />
          ) : (
            <Music2 size={20} strokeWidth={1.25} />
          )}
        </div>
        <div className={styles.playlistMeta}>
          <span className={styles.playlistName}>{playlist.name}</span>
          <span className={styles.playlistCount}>
            {new Date(playlist.updated_at).toLocaleDateString()}
          </span>
        </div>
      </NavLink>
      {!isFavorites && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.preventDefault()
            void onDelete(playlist.id)
          }}
          aria-label={`Delete ${playlist.name}`}
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

type ViewMode = 'playlists' | 'tracks'

export function LibraryPage() {
  const [view, setView] = useState<ViewMode>('playlists')
  const { tracks, isLoading: tracksLoading, deleteTrack, toggleLike } = useLibrary()
  const { playlists, isLoading: playlistsLoading, deletePlaylist } = usePlaylists()
  const setTrack = usePlayerStore((s) => s.setTrack)

  const handlePlay = useCallback(
    (row: VideoRow) => {
      const queue = tracks.filter((t) => t.status !== 'failed').map(toTrack)
      setTrack(toTrack(row), queue)
    },
    [tracks, setTrack],
  )

  const handleDeletePlaylist = useCallback(
    async (id: string) => {
      await deletePlaylist(id)
    },
    [deletePlaylist],
  )

  const readyCount = tracks.filter((t) => t.status === 'ready').length
  const processingCount = tracks.filter((t) => t.status !== 'ready' && t.status !== 'failed').length
  const isLoading = view === 'playlists' ? playlistsLoading : tracksLoading

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>Your Library</h1>
          {!isLoading && (
            <p className={styles.subtitle}>
              {view === 'playlists'
                ? `${String(playlists.length)} playlist${playlists.length !== 1 ? 's' : ''}`
                : `${String(readyCount)} track${readyCount !== 1 ? 's' : ''}${processingCount > 0 ? ` · ${String(processingCount)} processing` : ''}`}
            </p>
          )}
        </div>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === 'playlists' ? styles.viewBtnActive : ''}`}
            onClick={() => {
              setView('playlists')
            }}
          >
            Playlists
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'tracks' ? styles.viewBtnActive : ''}`}
            onClick={() => {
              setView('tracks')
            }}
          >
            Tracks
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Loader2 size={24} strokeWidth={1.75} className={styles.spin} />
        </div>
      ) : view === 'playlists' ? (
        playlists.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIconWrap}>
              <ListMusic size={36} strokeWidth={1.25} />
            </div>
            <p className={styles.emptyTitle}>No playlists yet</p>
            <p className={styles.emptyText}>Create a playlist from the sidebar to get started.</p>
          </div>
        ) : (
          <div className={styles.playlistList}>
            {playlists.map((pl) => (
              <PlaylistRow key={pl.id} playlist={pl} onDelete={handleDeletePlaylist} />
            ))}
          </div>
        )
      ) : tracks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIconWrap}>
            <ListMusic size={36} strokeWidth={1.25} />
          </div>
          <p className={styles.emptyTitle}>No tracks yet</p>
          <p className={styles.emptyText}>
            Add tracks through your playlists — open a playlist from the sidebar and add a YouTube
            link.
          </p>
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
              onPlay={handlePlay}
              onDelete={deleteTrack}
              onToggleLike={toggleLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}
