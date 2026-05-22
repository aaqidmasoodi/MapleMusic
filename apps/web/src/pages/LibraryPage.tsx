import { Plus, ListMusic, Music2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import styles from './LibraryPage.module.css'

export function LibraryPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>Your Library</h1>
          <p className={styles.subtitle}>All your playlists and saved tracks in one place.</p>
        </div>
        <Button size="sm" variant="secondary">
          <Plus size={14} />
          New Playlist
        </Button>
      </div>

      <div className={styles.empty}>
        <div className={styles.emptyIconWrap}>
          <ListMusic size={36} strokeWidth={1.25} />
        </div>
        <p className={styles.emptyTitle}>No playlists yet</p>
        <p className={styles.emptyText}>
          Create a playlist and add tracks by pasting YouTube URLs. Your music, your way.
        </p>
        <Button size="md">
          <Plus size={15} />
          Create your first playlist
        </Button>
      </div>

      <div className={styles.recentSection}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Recently added</h2>
        </div>
        <div className={styles.emptyRow}>
          <Music2 size={16} strokeWidth={1.5} />
          <span>Tracks you add will appear here</span>
        </div>
      </div>
    </div>
  )
}
