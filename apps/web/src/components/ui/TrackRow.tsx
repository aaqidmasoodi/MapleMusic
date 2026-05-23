import { Heart, TriangleAlert } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { youtubeThumbnailUrl } from '../../lib/youtube'
import type { VideoRow } from '../../hooks/useLibrary'
import type { Playlist } from '../../hooks/usePlaylists'
import { TrackMenu } from './TrackMenu'
import styles from './TrackRow.module.css'

interface TrackRowProps {
  row: VideoRow
  index: number
  playlists: Playlist[]
  /** Current playlist ID when viewing a specific playlist */
  playlistId?: string
  showRemoveFromPlaylist?: boolean
  showDeleteFromLibrary?: boolean
  isLiked: boolean
  onPlay: (row: VideoRow) => void
  onToggleLike: (id: string) => void
  onAddToPlaylist: (playlistId: string, videoId: string) => void
  onRemoveFromPlaylist?: (videoId: string) => void
  onDeleteFromLibrary?: (id: string) => void
}

function fmt(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${String(m)}:${s.toString().padStart(2, '0')}`
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

export function TrackRow({
  row,
  index,
  playlists,
  playlistId,
  showRemoveFromPlaylist,
  showDeleteFromLibrary,
  isLiked,
  onPlay,
  onToggleLike,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeleteFromLibrary,
}: TrackRowProps) {
  const isReady = row.status === 'ready'
  const isFailed = row.status === 'failed'
  const isPlayable = !isFailed

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
          <span className={`${styles.statusBadge} ${styles.statusFailed}`}>Failed</span>
        ) : row.status === 'pending' ? (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending</span>
        ) : row.status === 'processing' ? (
          <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Processing</span>
        ) : isReady && row.duration_seconds ? (
          <span className={styles.trackDuration}>{fmt(row.duration_seconds)}</span>
        ) : null}

        <button
          className={`${styles.likeBtn} ${isLiked ? styles.likeBtnActive : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleLike(row.id)
          }}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          type="button"
        >
          <Heart size={13} strokeWidth={1.75} fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        <TrackMenu
          row={row}
          playlists={playlists}
          playlistId={playlistId}
          showRemoveFromPlaylist={showRemoveFromPlaylist}
          showDeleteFromLibrary={showDeleteFromLibrary}
          isLiked={isLiked}
          onToggleLike={() => {
            onToggleLike(row.id)
          }}
          onAddToPlaylist={(plId) => {
            onAddToPlaylist(plId, row.id)
          }}
          onRemoveFromPlaylist={
            onRemoveFromPlaylist
              ? () => {
                  onRemoveFromPlaylist(row.id)
                }
              : undefined
          }
          onDeleteFromLibrary={
            onDeleteFromLibrary
              ? () => {
                  onDeleteFromLibrary(row.id)
                }
              : undefined
          }
        />
      </div>
    </div>
  )
}
