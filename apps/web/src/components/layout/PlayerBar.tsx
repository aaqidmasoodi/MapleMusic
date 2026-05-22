import {
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
import styles from './PlayerBar.module.css'

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m.toString()}:${s.toString().padStart(2, '0')}`
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    progress,
    shuffle,
    repeatMode,
    volume,
    isMuted,
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
  const total = currentTrack?.durationSeconds ?? 0
  const progressPct = `${(progress * 100).toFixed(3)}%`
  const volumePct = `${((isMuted ? 0 : volume) * 100).toFixed(1)}%`

  return (
    <div className={styles.bar}>
      {/* Seekable progress at very top edge */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={progress}
        onChange={(e) => {
          setProgress(parseFloat(e.target.value))
        }}
        className={styles.seekBar}
        style={{ '--progress': progressPct } as React.CSSProperties}
        aria-label="Playback progress"
      />

      <div className={styles.inner}>
        {/* Track info */}
        <div className={styles.track}>
          <div className={styles.thumb}>
            {currentTrack?.thumbnailUrl ? (
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className={styles.thumbImg}
              />
            ) : (
              <Music2 size={16} strokeWidth={1.5} />
            )}
          </div>
          <div className={styles.trackMeta}>
            <span className={styles.trackTitle}>{currentTrack?.title ?? 'Nothing playing'}</span>
            <span className={styles.trackArtist}>
              {currentTrack?.artist ?? 'Add a track to get started'}
            </span>
          </div>
          <button className={styles.likeBtn} aria-label="Like">
            <Heart size={13} strokeWidth={1.75} />
          </button>
        </div>

        {/* Center controls */}
        <div className={styles.controls}>
          <div className={styles.controlBtns}>
            <button
              className={`${styles.ctrlBtn} ${shuffle ? styles.active : ''}`}
              onClick={toggleShuffle}
              aria-label="Shuffle"
            >
              <Shuffle size={13} strokeWidth={1.75} />
              {shuffle && <span className={styles.activeDot} />}
            </button>

            <button className={styles.ctrlBtn} onClick={skipPrev} aria-label="Previous">
              <SkipBack size={16} strokeWidth={1.75} fill="currentColor" />
            </button>

            <button
              className={styles.playBtn}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={15} strokeWidth={0} fill="currentColor" />
              ) : (
                <Play size={15} strokeWidth={0} fill="currentColor" style={{ marginLeft: 1 }} />
              )}
            </button>

            <button className={styles.ctrlBtn} onClick={skipNext} aria-label="Next">
              <SkipForward size={16} strokeWidth={1.75} fill="currentColor" />
            </button>

            <button
              className={`${styles.ctrlBtn} ${repeatMode !== 'none' ? styles.active : ''}`}
              onClick={cycleRepeat}
              aria-label="Repeat"
            >
              {repeatMode === 'one' ? (
                <Repeat1 size={13} strokeWidth={1.75} />
              ) : (
                <Repeat size={13} strokeWidth={1.75} />
              )}
              {repeatMode !== 'none' && <span className={styles.activeDot} />}
            </button>
          </div>

          <div className={styles.progress}>
            <span className={styles.progressTime}>{fmt(elapsed)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={progress}
              onChange={(e) => {
                setProgress(parseFloat(e.target.value))
              }}
              className={styles.progressRange}
              style={{ '--progress': progressPct } as React.CSSProperties}
              aria-label="Playback progress"
            />
            <span className={styles.progressTime}>{fmt(total)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className={styles.extra}>
          <div className={styles.volumeWrap}>
            <button className={styles.volBtn} onClick={toggleMute} aria-label="Toggle mute">
              {isMuted || volume === 0 ? (
                <VolumeX size={13} strokeWidth={1.75} />
              ) : (
                <Volume2 size={13} strokeWidth={1.75} />
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
    </div>
  )
}
