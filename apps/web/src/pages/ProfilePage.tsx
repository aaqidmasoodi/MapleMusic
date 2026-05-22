import { Music2, ListMusic, Clock, LogOut, Settings, ChevronRight, Bell } from 'lucide-react'
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
  const displayName = (user?.user_metadata.display_name as string | undefined) ?? 'Music Lover'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
      </div>

      <div className={styles.hero}>
        <div className={styles.avatar}>{initial}</div>
        <div className={styles.heroInfo}>
          <div className={styles.heroName}>{displayName}</div>
          <div className={styles.heroEmail}>{email}</div>
          <div className={styles.heroMeta}>
            <div className={styles.heroMetaItem}>
              <span className={styles.heroMetaValue}>0</span>
              <span className={styles.heroMetaLabel}>Following</span>
            </div>
            <div className={styles.heroMetaItem}>
              <span className={styles.heroMetaValue}>0</span>
              <span className={styles.heroMetaLabel}>Followers</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statHeader}>
              <Icon size={16} strokeWidth={1.5} className={styles.statIcon} />
            </div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div className={styles.actionsSection}>
        <span className={styles.sectionTitle}>Settings</span>
        <div className={styles.actionsList}>
          <button className={styles.actionRow}>
            <Bell size={16} strokeWidth={1.5} />
            <span className={styles.actionLabel}>Notifications</span>
            <ChevronRight size={14} className={styles.actionArrow} />
          </button>
          <button className={styles.actionRow}>
            <Settings size={16} strokeWidth={1.5} />
            <span className={styles.actionLabel}>Preferences</span>
            <ChevronRight size={14} className={styles.actionArrow} />
          </button>
          <button
            className={`${styles.actionRow} ${styles.danger}`}
            onClick={() => {
              void signOut()
            }}
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span className={styles.actionLabel}>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
