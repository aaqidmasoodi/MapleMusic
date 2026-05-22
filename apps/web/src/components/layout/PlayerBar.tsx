import { Play, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Music2 } from 'lucide-react'
import styles from './PlayerBar.module.css'

export function PlayerBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        <div className={styles.thumb}>
          <Music2 size={16} strokeWidth={1.5} />
        </div>
        <div className={styles.trackMeta}>
          <span className={styles.trackTitle}>Nothing playing</span>
          <span className={styles.trackArtist}>Add a track to get started</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlBtns}>
          <button className={styles.ctrlBtn} aria-label="Shuffle">
            <Shuffle size={14} />
          </button>
          <button className={styles.ctrlBtn} aria-label="Previous">
            <SkipBack size={17} strokeWidth={1.75} />
          </button>
          <button className={styles.playBtn} aria-label="Play">
            <Play size={15} strokeWidth={2} style={{ marginLeft: 1 }} />
          </button>
          <button className={styles.ctrlBtn} aria-label="Next">
            <SkipForward size={17} strokeWidth={1.75} />
          </button>
          <button className={styles.ctrlBtn} aria-label="Repeat">
            <Repeat size={14} />
          </button>
        </div>
        <div className={styles.progress}>
          <span className={styles.progressTime}>0:00</span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} />
          </div>
          <span className={styles.progressTime}>0:00</span>
        </div>
      </div>

      <div className={styles.extra}>
        <div className={styles.volumeWrap}>
          <Volume2 size={14} />
          <div className={styles.volumeTrack}>
            <div className={styles.volumeFill} />
          </div>
        </div>
      </div>
    </div>
  )
}
