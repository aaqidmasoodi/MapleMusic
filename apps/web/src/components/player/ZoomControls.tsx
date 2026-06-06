import { usePlayerStore } from '../../stores/player.store'
import styles from './ZoomControls.module.css'

export function ZoomControls() {
  const timelineZoom = usePlayerStore((s) => s.timelineZoom)
  const zoomIn = usePlayerStore((s) => s.zoomIn)
  const zoomOut = usePlayerStore((s) => s.zoomOut)

  return (
    <div className={styles.row}>
      <button
        className={`${styles.btn} ${styles.btnOut}`}
        onClick={zoomOut}
        disabled={timelineZoom <= 1}
        aria-label="Zoom out"
      >
        −
      </button>
      <span className={styles.label}>{timelineZoom}x</span>
      <button
        className={`${styles.btn} ${styles.btnIn}`}
        onClick={zoomIn}
        disabled={timelineZoom >= 16}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  )
}
