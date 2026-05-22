import { NavLink } from 'react-router'
import { Compass, Radio, Library, User, Music2 } from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/explore', label: 'Explore', Icon: Compass },
  { to: '/radio', label: 'Radio', Icon: Radio },
  { to: '/library', label: 'Library', Icon: Library },
  { to: '/profile', label: 'Profile', Icon: User },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const initial = (user?.email?.[0] ?? 'U').toUpperCase()
  const displayEmail = user?.email ?? ''

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <Music2 size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span className={styles.logoText}>MapleMusic</span>
      </div>

      <div className={styles.divider} />

      <nav className={styles.nav}>
        {navItems.map(({ to, label, Icon }) => (
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
