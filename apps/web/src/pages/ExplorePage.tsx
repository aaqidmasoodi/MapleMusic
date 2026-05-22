import {
  AudioLines,
  BookMarked,
  Coffee,
  Compass,
  Cpu,
  Flame,
  Guitar,
  Heart,
  Mic2,
  Music2,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import styles from './ExplorePage.module.css'

const categories: { label: string; color: string; Icon: LucideIcon }[] = [
  { label: 'Hip-Hop', color: '#7c3aed', Icon: Mic2 },
  { label: 'Electronic', color: '#0891b2', Icon: Cpu },
  { label: 'Rock', color: '#dc2626', Icon: Guitar },
  { label: 'Jazz', color: '#d97706', Icon: AudioLines },
  { label: 'Classical', color: '#059669', Icon: BookMarked },
  { label: 'Pop', color: '#db2777', Icon: Star },
  { label: 'R&B', color: '#9333ea', Icon: Heart },
  { label: 'Lo-Fi', color: '#2563eb', Icon: Coffee },
  { label: 'Metal', color: '#64748b', Icon: Flame },
  { label: 'Indie', color: '#b45309', Icon: Compass },
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
          {categories.map(({ label, color, Icon }) => (
            <button
              key={label}
              className={styles.catCard}
              style={{ '--cat-color': color } as React.CSSProperties}
            >
              <div className={styles.catIcon}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <span className={styles.catLabel}>{label}</span>
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
