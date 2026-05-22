import { useCallback, useState } from 'react'
import { Clock, ListMusic, Loader2, Music2, Plus, TriangleAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { AddTrackModal } from '../components/ui/AddTrackModal'
import { type VideoRow, useLibrary } from '../hooks/useLibrary'
import { usePlayerStore } from '../stores/player.store'
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

interface TrackRowProps {
  row: VideoRow
  index: number
  onPlay: (row: VideoRow) => void
}

function TrackRow({ row, index, onPlay }: TrackRowProps) {
  const isReady = row.status === 'ready'
  const isFailed = row.status === 'failed'

  return (
    <button
      className={`${styles.trackRow} ${isReady ? styles.trackPlayable : ''}`}
      onClick={() => {
        if (isReady) onPlay(row)
      }}
      disabled={!isReady}
      aria-label={`Play ${displayTitle(row)}`}
    >
      <span className={styles.trackIndex}>{index + 1}</span>

      <div className={styles.trackThumb}>
        <img src={thumbnailUrl(row)} alt="" className={styles.trackThumbImg} loading="lazy" />
        {!isReady && !isFailed && (
          <div className={styles.trackThumbOverlay}>
            <Loader2 size={14} strokeWidth={2} className={styles.spin} />
          </div>
        )}
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
        {isReady && row.duration_seconds ? (
          <span className={styles.trackDuration}>{fmt(row.duration_seconds)}</span>
        ) : (
          <span className={`${styles.statusBadge} ${styles[`status_${row.status}`]}`}>
            {row.status === 'pending'
              ? 'Queued'
              : row.status === 'processing'
                ? 'Processing'
                : 'Failed'}
          </span>
        )}
      </div>
    </button>
  )
}

export function LibraryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { tracks, isLoading } = useLibrary()
  const setTrack = usePlayerStore((s) => s.setTrack)

  const openModal = useCallback(() => {
    setIsModalOpen(true)
  }, [])
  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const handlePlay = useCallback(
    (row: VideoRow) => {
      const queue = tracks
        .filter((t) => t.status === 'ready')
        .map((t) => ({
          id: t.id,
          title: displayTitle(t),
          artist: t.artist ?? 'Unknown artist',
          thumbnailUrl: thumbnailUrl(t),
          durationSeconds: t.duration_seconds ?? 0,
        }))
      setTrack(
        {
          id: row.id,
          title: displayTitle(row),
          artist: row.artist ?? 'Unknown artist',
          thumbnailUrl: thumbnailUrl(row),
          durationSeconds: row.duration_seconds ?? 0,
        },
        queue,
      )
    },
    [tracks, setTrack],
  )

  const readyCount = tracks.filter((t) => t.status === 'ready').length
  const processingCount = tracks.filter((t) => t.status !== 'ready' && t.status !== 'failed').length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>Your Library</h1>
          {!isLoading && tracks.length > 0 && (
            <p className={styles.subtitle}>
              {readyCount} track{readyCount !== 1 ? 's' : ''}
              {processingCount > 0 ? ` · ${processingCount.toString()} processing` : ''}
            </p>
          )}
        </div>
        <Button size="sm" onClick={openModal}>
          <Plus size={14} />
          Add track
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Loader2 size={24} strokeWidth={1.75} className={styles.spin} />
        </div>
      ) : tracks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIconWrap}>
            <ListMusic size={36} strokeWidth={1.25} />
          </div>
          <p className={styles.emptyTitle}>No tracks yet</p>
          <p className={styles.emptyText}>
            Add any YouTube link to stream it. We download it once and it's available to everyone.
          </p>
          <Button size="md" onClick={openModal}>
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
            <TrackRow key={row.id} row={row} index={i} onPlay={handlePlay} />
          ))}
        </div>
      )}

      {/* Floating add button when list is non-empty on mobile */}
      {tracks.length > 0 && (
        <button className={styles.fab} onClick={openModal} aria-label="Add track">
          <Music2 size={18} strokeWidth={1.75} />
          <Plus size={13} strokeWidth={2.5} className={styles.fabPlus} />
        </button>
      )}

      <AddTrackModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  )
}
