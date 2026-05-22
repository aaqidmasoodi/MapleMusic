import { Music2, Pause, Play, SkipForward } from 'lucide-react'
import { usePlayerStore } from '../../stores/player.store'
import styles from './MiniPlayer.module.css'

export function MiniPlayer() {
  const { currentTrack, isPlaying, progress, togglePlay, skipNext, setExpanded } = usePlayerStore()

  return (
    <div className={styles.wrap}>
      <div
        className={styles.bar}
        onClick={() => {
          setExpanded(true)
        }}
        role="button"
        tabIndex={0}
        aria-label="Open player"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(true)
        }}
      >
        {/* Thumbnail */}
        <div className={styles.thumb}>
          {currentTrack?.thumbnailUrl ? (
            <img
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className={styles.thumbImg}
            />
          ) : (
            <Music2 size={15} strokeWidth={1.5} />
          )}
        </div>

        {/* Track meta */}
        <div className={styles.meta}>
          <span className={`${styles.title} ${!currentTrack ? styles.empty : ''}`}>
            {currentTrack?.title ?? 'Nothing playing'}
          </span>
          <span className={styles.subtitle}>
            {currentTrack?.artist ?? 'Add a track to get started'}
          </span>
        </div>

        {/* Play/pause */}
        <button
          className={styles.playBtn}
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={14} strokeWidth={0} fill="currentColor" />
          ) : (
            <Play size={14} strokeWidth={0} fill="currentColor" style={{ marginLeft: 1 }} />
          )}
        </button>

        {/* Skip next */}
        <button
          className={styles.skipBtn}
          onClick={(e) => {
            e.stopPropagation()
            skipNext()
          }}
          aria-label="Next track"
        >
          <SkipForward size={14} strokeWidth={1.75} />
        </button>

        {/* Progress line at bottom */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(progress * 100).toFixed(3)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
