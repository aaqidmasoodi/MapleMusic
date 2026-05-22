import { LogOut, Music2, ListMusic, Clock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/auth.store'
import styles from './ProfilePage.module.css'

const stats = [
  { label: 'Tracks', value: '0', Icon: Music2 },
  { label: 'Playlists', value: '0', Icon: ListMusic },
  { label: 'Hours', value: '0', Icon: Clock },
]

export function ProfilePage() {
  const { user, signOut } = useAuthStore()
  const email = user?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || 'U'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.avatar}>{initial}</div>
        <div className={styles.info}>
          <span className={styles.name}>
            {(user?.user_metadata.display_name as string | undefined) ?? 'Music Lover'}
          </span>
          <span className={styles.email}>{email}</span>
        </div>
      </div>

      <div className={styles.statsRow}>
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className={styles.statCard}>
            <Icon size={18} strokeWidth={1.5} className={styles.statIcon} />
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" full onClick={() => void signOut()}>
          <LogOut size={15} />
          Sign out
        </Button>
      </div>
    </div>
  )
}
