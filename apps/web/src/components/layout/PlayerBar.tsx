import { useMemo } from 'react'
import {
  Heart,
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
  const visibleProgress = absoluteToWindow(progress, zoomWindow)
  const progressPct = `${(visibleProgress * 100).toFixed(3)}%`
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
          const v = parseFloat(e.target.value)
          setProgress(v)
          audioEngine.seek(v)
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

            <ABRepeatButton className={styles.abBtn} />
          </div>

          <div className={styles.progress}>
            <span className={styles.progressTime}>{fmt(elapsed)}</span>
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
            <ZoomControls />
            <span className={styles.progressTime}>{fmt(total)}</span>
          </div>
        </div>

        {/* Volume + expand */}
        <div className={styles.extra}>
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
