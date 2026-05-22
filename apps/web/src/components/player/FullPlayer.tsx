import {
  ChevronDown,
  Heart,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { usePlayerStore } from '../../stores/player.store'
import { audioEngine } from '../../lib/audio-engine'
import styles from './FullPlayer.module.css'

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m.toString()}:${s.toString().padStart(2, '0')}`
}

export function FullPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    shuffle,
    repeatMode,
    volume,
    isMuted,
    isExpanded,
    setExpanded,
    togglePlay,
    skipNext,
    skipPrev,
    toggleShuffle,
    cycleRepeat,
    setVolume,
    toggleMute,
    setProgress,
  } = usePlayerStore()

  const elapsed = currentTrack ? progress * currentTrack.durationSeconds : 0
  const remaining = currentTrack ? currentTrack.durationSeconds * (1 - progress) : 0
  const progressPct = `${(progress * 100).toFixed(3)}%`
  const volumePct = `${((isMuted ? 0 : volume) * 100).toFixed(1)}%`

  return (
    <div className={`${styles.overlay} ${isExpanded ? styles.open : ''}`} aria-hidden={!isExpanded}>
      <div className={styles.glow} />

      <div className={styles.inner}>
        {/* Drag handle / close */}
        <button
          className={styles.handleWrap}
          onClick={() => {
            setExpanded(false)
          }}
          aria-label="Close player"
        >
          <div className={styles.handle} />
          <ChevronDown size={20} strokeWidth={2} className={styles.chevron} />
        </button>

        {/* Album art */}
        <div className={`${styles.artWrap} ${isPlaying ? styles.playing : ''}`}>
          {currentTrack?.thumbnailUrl ? (
            <img src={currentTrack.thumbnailUrl} alt={currentTrack.title} className={styles.art} />
          ) : (
            <div className={styles.artPlaceholder}>
              <Music2 size={72} strokeWidth={1} />
            </div>
          )}
          <div className={styles.artGlow} />
        </div>

        {/* Track info */}
        <div className={styles.trackInfo}>
          <div className={styles.trackText}>
            <span className={styles.trackTitle}>{currentTrack?.title ?? 'Nothing playing'}</span>
            <span className={styles.trackArtist}>
              {currentTrack?.artist ?? 'Add a track to get started'}
            </span>
          </div>
          <button className={styles.likeBtn} aria-label="Like track">
            <Heart size={22} strokeWidth={1.75} />
          </button>
        </div>

        {/* Progress bar */}
        <div className={styles.progressWrap}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              setProgress(v)
              audioEngine.seek(v)
            }}
            className={styles.progressRange}
            style={{ '--progress': progressPct } as React.CSSProperties}
            aria-label="Playback progress"
          />
          <div className={styles.progressTimes}>
            <span>{fmt(elapsed)}</span>
            <span>-{fmt(remaining)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className={styles.controls}>
          <button
            className={`${styles.ctrlBtn} ${shuffle ? styles.active : ''}`}
            onClick={() => {
              toggleShuffle()
            }}
            aria-label="Shuffle"
          >
            <Shuffle size={18} strokeWidth={1.75} />
            {shuffle && <span className={styles.activeDot} />}
          </button>

          <button className={styles.ctrlBtn} onClick={skipPrev} aria-label="Previous">
            <SkipBack size={26} strokeWidth={1.75} fill="currentColor" />
          </button>

          <button
            className={styles.playBtn}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={30} strokeWidth={0} fill="currentColor" />
            ) : (
              <Play size={30} strokeWidth={0} fill="currentColor" style={{ marginLeft: 3 }} />
            )}
          </button>

          <button className={styles.ctrlBtn} onClick={skipNext} aria-label="Next">
            <SkipForward size={26} strokeWidth={1.75} fill="currentColor" />
          </button>

          <button
            className={`${styles.ctrlBtn} ${repeatMode !== 'none' ? styles.active : ''}`}
            onClick={cycleRepeat}
            aria-label="Repeat"
          >
            {repeatMode === 'one' ? (
              <Repeat1 size={18} strokeWidth={1.75} />
            ) : (
              <Repeat size={18} strokeWidth={1.75} />
            )}
            {repeatMode !== 'none' && <span className={styles.activeDot} />}
          </button>
        </div>

        {/* Volume */}
        <div className={styles.volumeWrap}>
          <button className={styles.volBtn} onClick={toggleMute} aria-label="Toggle mute">
            {isMuted || volume === 0 ? (
              <VolumeX size={15} strokeWidth={1.75} />
            ) : (
              <Volume2 size={15} strokeWidth={1.75} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value))
            }}
            className={styles.volumeRange}
            style={{ '--progress': volumePct } as React.CSSProperties}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
