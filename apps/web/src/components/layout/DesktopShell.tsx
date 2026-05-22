import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import styles from './DesktopShell.module.css'

export function DesktopShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
