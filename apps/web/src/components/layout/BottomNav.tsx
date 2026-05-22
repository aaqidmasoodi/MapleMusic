import { NavLink } from 'react-router'
import { Compass, Radio, Library, User } from 'lucide-react'
import styles from './BottomNav.module.css'

const tabs = [
  { to: '/explore', label: 'Explore', Icon: Compass },
  { to: '/radio', label: 'Radio', Icon: Radio },
  { to: '/library', label: 'Library', Icon: Library },
  { to: '/profile', label: 'Profile', Icon: User },
]

export function BottomNav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.items}>
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [styles.item, isActive ? styles.active : ''].filter(Boolean).join(' ')
            }
          >
            <Icon className={styles.icon} strokeWidth={1.75} />
            <span className={styles.label}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
