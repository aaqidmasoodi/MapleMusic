import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'
import { MiniPlayer } from './MiniPlayer'
import { FullPlayer } from '../player/FullPlayer'
import styles from './MobileShell.module.css'

export function MobileShell() {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <MiniPlayer />
      <BottomNav />
      <FullPlayer />
    </div>
  )
}
