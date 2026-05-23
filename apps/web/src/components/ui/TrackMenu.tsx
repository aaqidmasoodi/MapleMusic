import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, Library, ListMusic, MoreVertical, Trash2, X } from 'lucide-react'
import type { Playlist } from '../../hooks/usePlaylists'
import styles from './TrackMenu.module.css'

interface TrackMenuProps {
  playlists: Playlist[]
  /** Current playlist ID when viewing a specific playlist */
  playlistId?: string
  /** Whether to show "Remove from this playlist" */
  showRemoveFromPlaylist?: boolean
  /** Whether to show "Delete from library" */
  showDeleteFromLibrary?: boolean
  isLiked: boolean
  onToggleLike: () => void
  onAddToPlaylist: (playlistId: string) => void
  onRemoveFromPlaylist?: () => void
  onDeleteFromLibrary?: () => void
}

export function TrackMenu({
  playlists,
  playlistId,
  showRemoveFromPlaylist,
  showDeleteFromLibrary,
  isLiked,
  onToggleLike,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeleteFromLibrary,
}: TrackMenuProps) {
  const [open, setOpen] = useState(false)
  const [submenu, setSubmenu] = useState<'root' | 'playlists'>('root')
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleToggle = useCallback(() => {
    setOpen((v) => !v)
    setSubmenu('root')
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setSubmenu('root')
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, close])

  const handleLike = useCallback(() => {
    onToggleLike()
    close()
  }, [onToggleLike, close])

  const handleRemoveFromPlaylist = useCallback(() => {
    onRemoveFromPlaylist?.()
    close()
  }, [onRemoveFromPlaylist, close])

  const handleDeleteFromLibrary = useCallback(() => {
    onDeleteFromLibrary?.()
    close()
  }, [onDeleteFromLibrary, close])

  const handleSelectPlaylist = useCallback(
    (plId: string) => {
      onAddToPlaylist(plId)
      close()
    },
    [onAddToPlaylist, close],
  )

  return (
    <div className={styles.anchor}>
      <button
        ref={btnRef}
        className={`${styles.trigger} ${open ? styles.triggerVisible : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        aria-label="More actions"
        type="button"
      >
        {open ? <X size={14} strokeWidth={1.75} /> : <MoreVertical size={14} strokeWidth={1.75} />}
      </button>

      {open && (
        <div
          ref={menuRef}
          className={styles.menu}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {submenu === 'root' ? (
            <>
              <button className={styles.menuItem} onClick={handleLike} type="button">
                <span className={styles.menuItemIcon}>
                  <Heart size={14} strokeWidth={1.75} fill={isLiked ? 'currentColor' : 'none'} />
                </span>
                {isLiked ? 'Remove from favorites' : 'Add to favorites'}
              </button>

              <button
                className={styles.menuItem}
                onClick={() => {
                  setSubmenu('playlists')
                }}
                type="button"
              >
                <span className={styles.menuItemIcon}>
                  <Library size={14} strokeWidth={1.75} />
                </span>
                Add to playlist
              </button>

              {showRemoveFromPlaylist && onRemoveFromPlaylist && (
                <button
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                  onClick={handleRemoveFromPlaylist}
                  type="button"
                >
                  <span className={styles.menuItemIcon}>
                    <X size={14} strokeWidth={1.75} />
                  </span>
                  Remove from this playlist
                </button>
              )}

              {showDeleteFromLibrary && onDeleteFromLibrary && (
                <>
                  <div className={styles.menuDivider} />
                  <button
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={handleDeleteFromLibrary}
                    type="button"
                  >
                    <span className={styles.menuItemIcon}>
                      <Trash2 size={14} strokeWidth={1.75} />
                    </span>
                    Delete from library
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                className={styles.backBtn}
                onClick={() => {
                  setSubmenu('root')
                }}
                type="button"
              >
                ← Back
              </button>
              <div className={styles.submenuTitle}>Choose a playlist</div>
              {playlists
                .filter((p) => p.id !== playlistId)
                .map((pl) => (
                  <button
                    key={pl.id}
                    className={styles.playlistItem}
                    onClick={() => {
                      handleSelectPlaylist(pl.id)
                    }}
                    type="button"
                  >
                    <span className={styles.menuItemIcon}>
                      <ListMusic size={14} strokeWidth={1.75} />
                    </span>
                    {pl.name}
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
