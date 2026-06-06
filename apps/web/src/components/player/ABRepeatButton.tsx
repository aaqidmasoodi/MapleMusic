import { usePlayerStore } from '../../stores/player.store'
import styles from './ABRepeatButton.module.css'

interface Props {
  className?: string
}

export function ABRepeatButton({ className }: Props) {
  const abRepeat = usePlayerStore((s) => s.abRepeat)

  return (
    <button
      className={`${styles.btn} ${abRepeat ? styles.active : ''}${className ? ` ${className}` : ''}`}
      onClick={() => {
        const { abRepeat, markerA, markerB, setAbRepeat, setMarkerA, setMarkerB } =
          usePlayerStore.getState()
        if (abRepeat) {
          setAbRepeat(false)
        } else {
          if (markerA === null || markerB === null) {
            setMarkerA()
            setMarkerB(1)
          }
          setAbRepeat(true)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        usePlayerStore.getState().clearAbMarkers()
      }}
      aria-label={abRepeat ? 'Disable A-B repeat' : 'Enable A-B repeat'}
      title={abRepeat ? 'A-B repeat active — right-click to clear markers' : 'Enable A-B repeat'}
    >
      AB
    </button>
  )
}
