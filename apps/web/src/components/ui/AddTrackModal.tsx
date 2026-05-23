import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, CheckCircle2, Link2, Plus, X } from 'lucide-react'

import { parseYoutubeId } from '../../lib/youtube'
import { useAddTrack, type AddTrackResult } from '../../hooks/useAddTrack'
import { usePlayerStore } from '../../stores/player.store'
import { usePlaylists } from '../../hooks/usePlaylists'
import type { Track } from '../../stores/player.store'
import { Button } from './Button'
import styles from './AddTrackModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: AddTrackResult, playlistId: string) => void
  defaultPlaylistId?: string
}

export function AddTrackModal({ isOpen, onClose, onSuccess, defaultPlaylistId }: Props) {
  const [url, setUrl] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    defaultPlaylistId ?? null,
  )
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const playlistInputRef = useRef<HTMLInputElement>(null)
  const { submit, status, error, result, reset } = useAddTrack()
  const { playlists, createPlaylist } = usePlaylists()
  const setTrack = usePlayerStore((s) => s.setTrack)

  const youtubeId = parseYoutubeId(url)
  const isValid = youtubeId !== null
  const isLoading = status === 'loading'

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId)

  useEffect(() => {
    if (defaultPlaylistId) {
      setSelectedPlaylistId(defaultPlaylistId)
    }
  }, [defaultPlaylistId])

  useEffect(() => {
    if (!isOpen) return
    setUrl('')
    setIsCreatingPlaylist(false)
    setNewPlaylistName('')
    reset()
    const t = setTimeout(() => {
      inputRef.current?.focus()
    }, 360)
    return () => {
      clearTimeout(t)
    }
  }, [isOpen, reset])

  useEffect(() => {
    if (isCreatingPlaylist && playlistInputRef.current) {
      playlistInputRef.current.focus()
    }
  }, [isCreatingPlaylist])

  const onCloseRef = useRef(onClose)
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onCloseRef.current = onClose
    onSuccessRef.current = onSuccess
  })

  useEffect(() => {
    if (status !== 'success' || !result) return

    if (usePlayerStore.getState().currentTrack?.id === result.videoId) {
      // Already playing — metadata update from oembed arriving late.
      usePlayerStore.getState().updateCurrentTrack(result.videoId, {
        title: result.title,
        artist: result.artist,
        thumbnailUrl: result.thumbnailUrl,
      })
      return
    }

    const track: Track = {
      id: result.videoId,
      youtubeId: result.youtubeId,
      title: result.title,
      artist: result.artist,
      thumbnailUrl: result.thumbnailUrl,
      durationSeconds: 0,
      status: 'pending',
      audioPath: null,
    }
    setTrack(track)
    if (selectedPlaylistId) {
      onSuccessRef.current?.(result, selectedPlaylistId)
    }
    const t = setTimeout(() => {
      onCloseRef.current()
    }, 1500)
    return () => {
      clearTimeout(t)
    }
  }, [status, result, selectedPlaylistId, setTrack])

  const handleCreatePlaylist = useCallback(async () => {
    const name = newPlaylistName.trim() || 'New Playlist'
    const pl = await createPlaylist(name)
    if (pl) {
      setSelectedPlaylistId(pl.id)
      setIsCreatingPlaylist(false)
      setNewPlaylistName('')
    }
  }, [newPlaylistName, createPlaylist])

  const handleSubmit = useCallback(() => {
    if (!isValid || isLoading || !youtubeId || !selectedPlaylistId) return
    void submit(url, youtubeId)
  }, [isValid, isLoading, submit, url, youtubeId, selectedPlaylistId])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
    } catch {
      /* clipboard access denied */
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (isCreatingPlaylist) {
          void handleCreatePlaylist()
        } else if (isValid && selectedPlaylistId) {
          handleSubmit()
        }
      }
      if (e.key === 'Escape') {
        if (isCreatingPlaylist) {
          setIsCreatingPlaylist(false)
          setNewPlaylistName('')
        } else {
          onClose()
        }
      }
    },
    [handleSubmit, isCreatingPlaylist, isValid, selectedPlaylistId, handleCreatePlaylist, onClose],
  )

  return (
    <div className={`${styles.backdrop} ${isOpen ? styles.open : ''}`} onClick={onClose}>
      <div
        className={`${styles.modal} ${isOpen ? styles.open : ''}`}
        onClick={(e) => {
          e.stopPropagation()
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Add a track"
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Add a track</h2>
            <p className={styles.subtitle}>Paste a YouTube link to stream it</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {status === 'success' && result ? (
          <div className={styles.successState}>
            <img src={result.thumbnailUrl} alt={result.title} className={styles.successThumb} />
            <div className={styles.successIconWrap}>
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
            <p className={styles.successTitle}>{result.title}</p>
            {result.artist && <p className={styles.successText}>{result.artist} · Playing now</p>}
          </div>
        ) : (
          <div className={styles.body}>
            <div>
              <label className={styles.sectionLabel}>YouTube link</label>
              <div
                className={`${styles.inputRow} ${url && !isValid ? styles.inputError : ''} ${isValid ? styles.inputValid : ''}`}
              >
                <Link2 size={15} strokeWidth={1.75} className={styles.inputIcon} />
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="https://youtube.com/watch?v=..."
                  className={styles.input}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
                <button
                  className={styles.pasteBtn}
                  onClick={() => {
                    void handlePaste()
                  }}
                  type="button"
                >
                  Paste
                </button>
              </div>

              {url.length > 0 && (
                <div
                  className={`${styles.hint} ${isValid ? styles.hintValid : styles.hintInvalid}`}
                >
                  {isValid ? (
                    <>
                      <CheckCircle2 size={11} strokeWidth={2.5} />
                      <span>
                        ID: <code className={styles.ytId}>{youtubeId}</code>
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={11} strokeWidth={2.5} />
                      <span>Not a valid YouTube URL</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={styles.playlistSection}>
              <label className={styles.sectionLabel}>Add to playlist</label>
              {isCreatingPlaylist ? (
                <div className={styles.newPlaylistRow}>
                  <input
                    ref={playlistInputRef}
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => {
                      setNewPlaylistName(e.target.value)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Playlist name"
                    className={styles.input}
                    spellCheck={false}
                  />
                  <button
                    className={styles.createPlaylistBtn}
                    onClick={() => {
                      void handleCreatePlaylist()
                    }}
                    type="button"
                    aria-label="Create playlist"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className={styles.playlistList}>
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      className={`${styles.playlistItem} ${selectedPlaylistId === pl.id ? styles.playlistItemActive : ''}`}
                      onClick={() => {
                        setSelectedPlaylistId(pl.id)
                      }}
                      type="button"
                    >
                      <span className={styles.playlistName}>{pl.name}</span>
                      <Check
                        size={14}
                        strokeWidth={2.5}
                        className={`${styles.playlistCheck} ${selectedPlaylistId === pl.id ? styles.playlistCheckVisible : ''}`}
                      />
                    </button>
                  ))}
                  <div className={styles.playlistDivider} />
                  <button
                    className={styles.newPlaylistBtn}
                    onClick={() => {
                      setIsCreatingPlaylist(true)
                    }}
                    type="button"
                  >
                    <Plus size={14} strokeWidth={2} />
                    <span>New Playlist</span>
                  </button>
                </div>
              )}
            </div>

            {status === 'error' && error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={13} strokeWidth={1.75} />
                {error}
              </div>
            )}

            <Button
              size="md"
              full
              disabled={!isValid || !selectedPlaylistId}
              loading={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? 'Adding…' : `Add to ${selectedPlaylist?.name ?? 'Playlist'}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
