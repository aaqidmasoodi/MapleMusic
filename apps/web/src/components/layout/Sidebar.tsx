import { useState } from 'react'
import { NavLink } from 'react-router'
import { Compass, Heart, Radio, Library, Music2, Plus, Search, ListMusic } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { usePlaylists } from '../../hooks/usePlaylists'
import styles from './Sidebar.module.css'

const discoverItems = [
  { to: '/explore', label: 'Explore', Icon: Compass },
  { to: '/radio', label: 'Radio', Icon: Radio },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const initial = user?.email?.charAt(0).toUpperCase() ?? 'U'
  const displayEmail = user?.email ?? ''
  const { playlists, createPlaylist } = usePlaylists()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreatePlaylist = async () => {
    const name = newName.trim() || 'New Playlist'
    setCreating(false)
    setNewName('')
    await createPlaylist(name)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <Music2 size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <span className={styles.logoText}>MapleMusic</span>
      </div>

      <button className={styles.searchBtn}>
        <Search size={13} />
        Search
        <span className={styles.searchKbd}>⌘K</span>
      </button>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Discover</span>
          {discoverItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
              }
            >
              <Icon className={styles.icon} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Your Library</span>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
            }
          >
            <Library className={styles.icon} strokeWidth={1.75} />
            Library
          </NavLink>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Playlists</span>
            <button
              className={styles.newPlaylistBtn}
              onClick={() => {
                setCreating(true)
                setNewName('')
              }}
              aria-label="New playlist"
            >
              <Plus size={12} strokeWidth={2.5} />
            </button>
          </div>

          {creating && (
            <div className={styles.playlistInput}>
              <input
                autoFocus
                className={styles.playlistNameInput}
                placeholder="Playlist name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreatePlaylist()
                  if (e.key === 'Escape') {
                    setCreating(false)
                    setNewName('')
                  }
                }}
                onBlur={() => {
                  void handleCreatePlaylist()
                }}
              />
            </div>
          )}

          {playlists.map((pl) => (
            <NavLink
              key={pl.id}
              to={`/playlist/${pl.id}`}
              className={({ isActive }) =>
                [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
              }
            >
              {pl.name === 'Favorites' ? (
                <Heart
                  className={`${styles.icon} ${styles.favIcon}`}
                  strokeWidth={1.75}
                  fill="currentColor"
                />
              ) : (
                <ListMusic className={styles.icon} strokeWidth={1.75} />
              )}
              <span className={styles.playlistName}>{pl.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className={styles.footer}>
        <NavLink to="/profile" className={styles.userRow}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {(user?.user_metadata.display_name as string | undefined) ?? 'You'}
            </div>
            <div className={styles.userEmail}>{displayEmail}</div>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
