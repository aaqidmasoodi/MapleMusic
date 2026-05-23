import Hls from 'hls.js'
import { supabase } from './supabase'
import { usePlayerStore } from '../stores/player.store'
import type { Track } from '../stores/player.store'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined
const AUDIO_BUCKET = 'audio'

async function preWarmWorker(youtubeId: string): Promise<void> {
  if (!WORKER_URL) return
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    await fetch(
      `${WORKER_URL}/warm/${encodeURIComponent(youtubeId)}?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
      },
    )
  } catch {
    // Fire-and-forget
  }
}

/**
 * Single global audio engine. Drives one <audio> element from the player store:
 *   - ready tracks  → HLS from the CDN (hls.js), instant <500ms playback
 *   - cold tracks   → live MP3 proxy via the worker (~1-3s, no queue wait)
 *
 * Instantiated once and wired to the store via subscribe(); UI components never
 * touch the element directly except through seek().
 */
class AudioEngine {
  private audio: HTMLAudioElement | null = null
  private hls: Hls | null = null
  private loadedTrackId: string | null = null
  private started = false

  start(): void {
    if (this.started) return
    this.started = true

    const audio = new Audio()
    audio.preload = 'auto'
    this.audio = audio

    audio.addEventListener('timeupdate', () => {
      this.syncProgress()
    })
    audio.addEventListener('ended', () => {
      this.onEnded()
    })
    audio.addEventListener('error', () => {
      console.error('[audio] element error', audio.error?.message)
    })

    const { volume, isMuted } = usePlayerStore.getState()
    audio.volume = isMuted ? 0 : volume

    usePlayerStore.subscribe((state, prev) => {
      void this.react(state, prev)
    })
  }

  /** Seek to a fraction (0..1) of the current track. */
  seek(fraction: number): void {
    const audio = this.audio
    if (!audio) return
    const dur = this.effectiveDuration()
    if (dur > 0) audio.currentTime = Math.max(0, Math.min(1, fraction)) * dur
  }

  private async react(
    state: ReturnType<typeof usePlayerStore.getState>,
    prev: ReturnType<typeof usePlayerStore.getState>,
  ): Promise<void> {
    const audio = this.audio
    if (!audio) return

    // New track loaded
    if (state.currentTrack && state.currentTrack.id !== this.loadedTrackId) {
      try {
        await this.loadTrack(state.currentTrack)
      } catch (err) {
        console.error('[audio] loadTrack error:', err)
      }
    }

    // Play / pause
    if (state.isPlaying !== prev.isPlaying || state.currentTrack?.id !== prev.currentTrack?.id) {
      if (state.isPlaying) {
        try {
          await audio.play()
        } catch (err) {
          console.error('[audio] play() rejected', err)
        }
      } else {
        audio.pause()
      }
    }

    // Volume / mute
    if (state.volume !== prev.volume || state.isMuted !== prev.isMuted) {
      audio.volume = state.isMuted ? 0 : state.volume
    }
  }

  private async loadTrack(track: Track): Promise<void> {
    const audio = this.audio
    if (!audio) return
    this.loadedTrackId = track.id
    this.teardownHls()

    const src = await this.resolveSource(track)
    if (!src) {
      console.error('[audio] could not resolve a source for', track.youtubeId)
      return
    }

    if (src.kind === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false })
        this.hls = hls
        hls.loadSource(src.url)
        hls.attachMedia(audio)
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal) return
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad()
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError()
          } else {
            console.error('[audio] hls fatal unrecoverable', data.type, data.details)
          }
        })
      } else {
        // Safari plays HLS natively.
        audio.src = src.url
      }
    } else {
      audio.src = src.url
    }

    this.setMediaSession(track)
    this.preWarmNext()
  }

  private preWarmNext(): void {
    const { queue, queueIndex } = usePlayerStore.getState()
    if (queueIndex + 1 < queue.length) {
      const next = queue[queueIndex + 1]
      if (next.status !== 'ready') {
        void preWarmWorker(next.youtubeId)
      }
    }
  }

  private async resolveSource(track: Track): Promise<{ kind: 'hls' | 'file'; url: string } | null> {
    if (track.status === 'ready' && track.audioPath) {
      const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(track.audioPath)
      return { kind: 'hls', url: data.publicUrl }
    }

    // Cold track → live proxy. Needs the user's access token in the URL because
    // <audio> can't set Authorization headers.
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token || !WORKER_URL) return null
    const url = `${WORKER_URL}/stream/${encodeURIComponent(track.youtubeId)}?token=${encodeURIComponent(token)}`
    return { kind: 'file', url }
  }

  private onEnded(): void {
    const { repeatMode, skipNext } = usePlayerStore.getState()
    const audio = this.audio
    if (repeatMode === 'one' && audio) {
      audio.currentTime = 0
      void audio.play()
      return
    }
    skipNext()
  }

  private syncProgress(): void {
    const audio = this.audio
    if (!audio) return
    const dur = this.effectiveDuration()
    usePlayerStore.getState().setProgress(dur > 0 ? audio.currentTime / dur : 0)
  }

  private effectiveDuration(): number {
    const audio = this.audio
    if (!audio) return 0
    if (Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration
    // Live proxy streams often report Infinity — fall back to known metadata.
    return usePlayerStore.getState().currentTrack?.durationSeconds ?? 0
  }

  private setMediaSession(track: Track): void {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: track.thumbnailUrl ? [{ src: track.thumbnailUrl, sizes: '512x512' }] : [],
    })
    const store = usePlayerStore.getState()
    navigator.mediaSession.setActionHandler('play', () => {
      store.togglePlay()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      store.togglePlay()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      store.skipNext()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      store.skipPrev()
    })
  }

  private teardownHls(): void {
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }
  }
}

export const audioEngine = new AudioEngine()
