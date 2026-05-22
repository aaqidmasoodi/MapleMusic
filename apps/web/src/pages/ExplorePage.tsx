import { Search, Music2, TrendingUp } from 'lucide-react'
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
]

export function ExplorePage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Explore</h1>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={16} />
          <span className={styles.searchPlaceholder}>Search or paste a YouTube URL…</span>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <TrendingUp size={16} />
          <h2 className={styles.sectionTitle}>Browse categories</h2>
        </div>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={styles.catCard}
              style={{ '--cat-color': cat.color } as React.CSSProperties}
            >
              <Music2 size={20} />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.emptyState}>
          <Music2 size={40} strokeWidth={1} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Nothing here yet</p>
          <p className={styles.emptyText}>Paste a YouTube URL above to add your first track.</p>
        </div>
      </section>
    </div>
  )
}
