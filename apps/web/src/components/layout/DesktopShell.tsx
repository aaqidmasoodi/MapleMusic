import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { PlayerBar } from './PlayerBar'
import styles from './DesktopShell.module.css'

export function DesktopShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <PlayerBar />
    </div>
  )
}
