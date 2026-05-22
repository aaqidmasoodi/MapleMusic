import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Link2, X } from 'lucide-react'
import { parseYoutubeId } from '../../lib/youtube'
import { useAddTrack } from '../../hooks/useAddTrack'
import { Button } from './Button'
import styles from './AddTrackModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AddTrackModal({ isOpen, onClose }: Props) {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { submit, status, error, reset } = useAddTrack()

  const youtubeId = parseYoutubeId(url)
  const isValid = youtubeId !== null
  const isLoading = status === 'loading'

  // Focus input when modal opens; reset form on open
  useEffect(() => {
    if (!isOpen) return
    setUrl('')
    reset()
    const t = setTimeout(() => {
      inputRef.current?.focus()
    }, 360)
    return () => {
      clearTimeout(t)
    }
  }, [isOpen, reset])

  // Auto-close after success
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    if (status !== 'success') return
    const t = setTimeout(() => {
      onCloseRef.current()
    }, 1800)
    return () => {
      clearTimeout(t)
    }
  }, [status])

  const handleSubmit = useCallback(() => {
    if (!isValid || isLoading) return
    void submit(url)
  }, [isValid, isLoading, submit, url])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
    } catch {
      // Clipboard access denied — silently ignore
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit()
      if (e.key === 'Escape') onClose()
    },
    [handleSubmit, onClose],
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`${styles.sheet} ${isOpen ? styles.open : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Add a track"
      >
        <div className={styles.handle} />

        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Add a track</h2>
            <p className={styles.subtitle}>Paste a YouTube link to stream it</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {status === 'success' ? (
          <div className={styles.successState}>
            <div className={styles.successIconWrap}>
              <CheckCircle2 size={40} strokeWidth={1.5} />
            </div>
            <p className={styles.successTitle}>Track added!</p>
            <p className={styles.successText}>
              It'll be ready to stream shortly — we'll process it in the background.
            </p>
          </div>
        ) : (
          <div className={styles.body}>
            {/* URL input */}
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

            {/* Validation hint */}
            {url.length > 0 && (
              <div className={`${styles.hint} ${isValid ? styles.hintValid : styles.hintInvalid}`}>
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

            {/* API error */}
            {status === 'error' && error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={13} strokeWidth={1.75} />
                {error}
              </div>
            )}

            <Button size="md" full disabled={!isValid} loading={isLoading} onClick={handleSubmit}>
              {isLoading ? 'Adding…' : 'Add to Library'}
            </Button>

            <p className={styles.footer}>
              Tracks are processed progressively — playback starts as the first segments arrive.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
