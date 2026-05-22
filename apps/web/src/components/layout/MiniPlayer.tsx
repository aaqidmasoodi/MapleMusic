import { Play, Music2 } from 'lucide-react'
import styles from './MiniPlayer.module.css'

export function MiniPlayer() {
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.thumb}>
          <Music2 size={15} strokeWidth={1.5} />
        </div>
        <div className={styles.meta}>
          <span className={styles.title}>Nothing playing</span>
          <span className={styles.subtitle}>Add a track to get started</span>
        </div>
        <button className={styles.playBtn} aria-label="Play">
          <Play size={14} strokeWidth={2} style={{ marginLeft: 1 }} />
        </button>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </div>
    </div>
  )
}
