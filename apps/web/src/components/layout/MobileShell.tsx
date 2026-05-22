import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'
import styles from './MobileShell.module.css'

export function MobileShell() {
  return (
    <div className={styles.shell}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
