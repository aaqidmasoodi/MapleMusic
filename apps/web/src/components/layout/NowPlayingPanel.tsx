import { useMemo } from 'react'
import {
  Maximize2,
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
import { ABRepeatButton } from '../player/ABRepeatButton'
import { AbRepeatMarkers } from '../player/AbRepeatMarkers'
import { ZoomControls } from '../player/ZoomControls'
import { getZoomWindow, absoluteToWindow } from '../../lib/zoom-utils'
import styles from './NowPlayingPanel.module.css'

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${String(m)}:${s.toString().padStart(2, '0')}`
}

export function NowPlayingPanel() {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    progress,
    shuffle,
    repeatMode,
    volume,
    isMuted,
    setExpanded,
    togglePlay,
    skipNext,
    skipPrev,
    toggleShuffle,
    cycleRepeat,
    setVolume,
    toggleMute,
    setProgress,
    markerA,
    markerB,
    timelineZoom,
  } = usePlayerStore()

  const zoomWindow = useMemo(
    () => getZoomWindow(timelineZoom, markerA, markerB, progress),
    [timelineZoom, markerA, markerB, progress],
  )

  const elapsed = currentTrack ? progress * currentTrack.durationSeconds : 0
  const total = currentTrack?.durationSeconds ?? 0
  const remaining = total - elapsed
  const visibleProgress = absoluteToWindow(progress, zoomWindow)
  const progressPct = `${(visibleProgress * 100).toFixed(3)}%`
  const volumePct = `${((isMuted ? 0 : volume) * 100).toFixed(1)}%`

  const upNext = useMemo(() => {
    if (queue.length <= 1) return []
    return queue.slice(queueIndex + 1, queueIndex + 6)
  }, [queue, queueIndex])

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Now Playing</span>
        {currentTrack && (
          <button
            className={styles.expandBtn}
            onClick={() => {
              setExpanded(true)
            }}
            aria-label="Full screen player"
          >
            <Maximize2 size={13} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {currentTrack ? (
        <div className={styles.body}>
          {/* Art */}
          <div className={`${styles.artWrap} ${isPlaying ? styles.playing : ''}`}>
            {currentTrack.thumbnailUrl ? (
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className={styles.art}
              />
            ) : (
              <div className={styles.artPlaceholder}>
                <Music2 size={48} strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Track info */}
          <div className={styles.trackInfo}>
            <span className={styles.trackTitle}>{currentTrack.title}</span>
            <span className={styles.trackArtist}>{currentTrack.artist || 'Unknown artist'}</span>
          </div>

          {/* Progress */}
          <div className={styles.progressWrap}>
            <div className={styles.progressZoomRow}>
              <ZoomControls />
            </div>
            <div className={styles.progressBarContainer}>
              <input
                type="range"
                min={zoomWindow.start}
                max={zoomWindow.end}
                step={timelineZoom > 1 ? 0.00001 : 0.001}
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
              <AbRepeatMarkers zoomWindow={zoomWindow} />
            </div>
            <div className={styles.progressTimes}>
              <span>{fmt(elapsed)}</span>
              <span>-{fmt(remaining)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <button
              className={`${styles.ctrlBtn} ${shuffle ? styles.active : ''}`}
              onClick={toggleShuffle}
              aria-label="Shuffle"
            >
              <Shuffle size={15} strokeWidth={1.75} />
              {shuffle && <span className={styles.activeDot} />}
            </button>

            <button className={styles.ctrlBtn} onClick={skipPrev} aria-label="Previous">
              <SkipBack size={20} strokeWidth={1.75} fill="currentColor" />
            </button>

            <button
              className={styles.playBtn}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={22} strokeWidth={0} fill="currentColor" />
              ) : (
                <Play size={22} strokeWidth={0} fill="currentColor" style={{ marginLeft: 2 }} />
              )}
            </button>

            <button className={styles.ctrlBtn} onClick={skipNext} aria-label="Next">
              <SkipForward size={20} strokeWidth={1.75} fill="currentColor" />
            </button>

            <button
              className={`${styles.ctrlBtn} ${repeatMode !== 'none' ? styles.active : ''}`}
              onClick={cycleRepeat}
              aria-label="Repeat"
            >
              {repeatMode === 'one' ? (
                <Repeat1 size={15} strokeWidth={1.75} />
              ) : (
                <Repeat size={15} strokeWidth={1.75} />
              )}
              {repeatMode !== 'none' && <span className={styles.activeDot} />}
            </button>

            <ABRepeatButton className={styles.abBtn} />
          </div>

          {/* Volume */}
          <div className={styles.volumeRow}>
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

          {/* Queue */}
          {upNext.length > 0 && (
            <div className={styles.queue}>
              <div className={styles.queueDivider} />
              <span className={styles.queueLabel}>Up next</span>
              {upNext.map((track) => (
                <div key={track.id} className={styles.queueItem}>
                  <div className={styles.queueThumb}>
                    {track.thumbnailUrl ? (
                      <img src={track.thumbnailUrl} alt="" className={styles.queueThumbImg} />
                    ) : (
                      <Music2 size={12} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className={styles.queueMeta}>
                    <span className={styles.queueTitle}>{track.title}</span>
                    <span className={styles.queueArtist}>{track.artist || 'Unknown artist'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyArt}>
            <Music2 size={40} strokeWidth={1} />
          </div>
          <span className={styles.emptyTitle}>Nothing playing</span>
          <span className={styles.emptyText}>Add a track to your library to get started</span>
        </div>
      )}
    </aside>
  )
}
