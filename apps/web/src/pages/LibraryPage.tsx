import { Plus, ListMusic, Music2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import styles from './LibraryPage.module.css'

export function LibraryPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Library</h1>
        <Button size="sm" variant="secondary">
          <Plus size={14} />
          New Playlist
        </Button>
      </div>

      <div className={styles.emptyState}>
        <div className={styles.emptyIconWrap}>
          <ListMusic size={32} strokeWidth={1.25} />
        </div>
        <p className={styles.emptyTitle}>No playlists yet</p>
        <p className={styles.emptyText}>
          Create a playlist and add tracks by pasting YouTube URLs.
        </p>
        <Button size="md">
          <Plus size={15} />
          Create your first playlist
        </Button>
      </div>

      <div className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Recently added</h2>
        <div className={styles.recentEmpty}>
          <Music2 size={16} strokeWidth={1.5} />
          <span>Tracks you add will appear here</span>
        </div>
      </div>
    </div>
  )
}
