import { Search, TrendingUp, Music2 } from 'lucide-react'
import styles from './ExplorePage.module.css'

const categories = [
  { label: 'Hip-Hop', color: '#7c3aed' },
  { label: 'Electronic', color: '#0891b2' },
  { label: 'Rock', color: '#dc2626' },
  { label: 'Jazz', color: '#d97706' },
  { label: 'Classical', color: '#059669' },
  { label: 'Pop', color: '#db2777' },
  { label: 'R&B', color: '#7c3aed' },
  { label: 'Lo-Fi', color: '#2563eb' },
  { label: 'Metal', color: '#374151' },
  { label: 'Indie', color: '#b45309' },
]

export function ExplorePage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Discover your next <span>favourite</span> track.
        </h1>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={17} />
          <span className={styles.searchPlaceholder}>Search or paste a YouTube URL…</span>
          <span className={styles.searchHint}>⌘K</span>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <TrendingUp size={13} />
          <h2 className={styles.sectionTitle}>Browse by genre</h2>
        </div>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={styles.catCard}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Music2 size={13} />
          <h2 className={styles.sectionTitle}>Recently added</h2>
        </div>
        <div className={styles.emptyState}>
          <Music2 size={32} strokeWidth={1} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Nothing added yet</p>
          <p className={styles.emptyText}>
            Paste a YouTube URL above to add your first track to MapleMusic.
          </p>
        </div>
      </section>
    </div>
  )
}
