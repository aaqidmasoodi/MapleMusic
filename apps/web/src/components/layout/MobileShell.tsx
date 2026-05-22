import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'
import { MiniPlayer } from './MiniPlayer'
import styles from './MobileShell.module.css'

export function MobileShell() {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
