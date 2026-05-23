import { useRef, useCallback } from 'react'
import { usePlayerStore } from '../../stores/player.store'
import type { ZoomWindow } from '../../lib/zoom-utils'
import { windowToAbsolute } from '../../lib/zoom-utils'
import styles from './AbRepeatMarkers.module.css'

interface Props {
  zoomWindow: ZoomWindow
}

export function AbRepeatMarkers({ zoomWindow }: Props) {
  const { markerA, markerB, abRepeat } = usePlayerStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const range = zoomWindow.end - zoomWindow.start
  const markerARel =
    markerA !== null && range > 0 ? String(((markerA - zoomWindow.start) / range) * 100) : null
  const markerBRel =
    markerB !== null && range > 0 ? String(((markerB - zoomWindow.start) / range) * 100) : null

  const startDrag = useCallback(
    (marker: 'A' | 'B') => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()

      const move = (clientX: number) => {
        const x = (clientX - rect.left) / rect.width
        const clamped = Math.max(0, Math.min(1, x))
        const absolute = windowToAbsolute(clamped, zoomWindow)
        if (marker === 'A') {
          const { markerB, setMarkerA } = usePlayerStore.getState()
          if (markerB !== null && absolute >= markerB) return
          setMarkerA(absolute)
        } else {
          const { markerA, setMarkerB } = usePlayerStore.getState()
          if (markerA !== null && absolute <= markerA) return
          setMarkerB(absolute)
        }
      }

      const onMouseMove = (e: MouseEvent) => {
        move(e.clientX)
      }
      const onTouchMove = (e: TouchEvent) => {
        move(e.touches[0].clientX)
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onUp)
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onUp)
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onUp)
    },
    [zoomWindow],
  )

  const showRegion = markerARel !== null && markerBRel !== null
  const regionStyle = showRegion
    ? {
        left: markerARel + '%',
        width: String(parseFloat(markerBRel) - parseFloat(markerARel)) + '%',
      }
    : undefined

  return (
    <div ref={containerRef} className={styles.container}>
      {showRegion && regionStyle && (
        <div
          className={`${styles.region} ${abRepeat ? styles.regionActive : ''}`}
          style={regionStyle}
        />
      )}
      {markerA !== null && markerARel !== null && (
        <div
          className={`${styles.marker} ${abRepeat ? styles.active : ''}`}
          style={{ left: `${markerARel}%` }}
          onMouseDown={startDrag('A')}
          onTouchStart={startDrag('A')}
        >
          <div className={styles.bar} />
          <div className={styles.dot} />
        </div>
      )}
      {markerB !== null && markerBRel !== null && (
        <div
          className={`${styles.marker} ${abRepeat ? styles.active : ''}`}
          style={{ left: `${markerBRel}%` }}
          onMouseDown={startDrag('B')}
          onTouchStart={startDrag('B')}
        >
          <div className={styles.bar} />
          <div className={styles.dot} />
        </div>
      )}
    </div>
  )
}
