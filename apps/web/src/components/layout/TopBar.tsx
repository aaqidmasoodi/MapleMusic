import { useLocation, useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import styles from './TopBar.module.css'

const titles: Record<string, string> = {
  '/explore': 'Explore',
  '/radio': 'Radio',
  '/library': 'Your Library',
  '/profile': 'Profile',
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const title = titles[location.pathname] ?? 'MapleMusic'

  return (
    <header className={styles.bar}>
      <div className={styles.navBtns}>
        <button
          className={styles.navBtn}
          onClick={() => {
            void navigate(-1)
          }}
          aria-label="Back"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          className={styles.navBtn}
          onClick={() => {
            void navigate(1)
          }}
          aria-label="Forward"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <span className={styles.title}>{title}</span>

      <div className={styles.actions}>
        <button className={styles.actionBtn} aria-label="Notifications">
          <Bell size={16} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
