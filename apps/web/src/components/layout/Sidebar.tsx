import { NavLink } from 'react-router'
import { Compass, Radio, Library, Music2, Plus, Search } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import styles from './Sidebar.module.css'

const discoverItems = [
  { to: '/explore', label: 'Explore', Icon: Compass },
  { to: '/radio', label: 'Radio', Icon: Radio },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const initial = user?.email?.charAt(0).toUpperCase() ?? 'U'
  const displayEmail = user?.email ?? ''

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

          <div className={styles.libraryEmpty}>
            <span className={styles.libraryEmptyText}>
              Create playlists to organise your music.
            </span>
            <button className={styles.libraryCreateBtn}>
              <Plus size={11} />
              New playlist
            </button>
          </div>
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
