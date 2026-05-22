import { Radio, Zap, Waves, Flame, Moon, Coffee } from 'lucide-react'
import styles from './RadioPage.module.css'

const stations = [
  { name: 'Chill Vibes', desc: 'Lo-fi beats to relax and focus', color: '#2563eb', Icon: Coffee },
  {
    name: 'Energy Boost',
    desc: 'High-tempo tracks for your workout',
    color: '#e8365d',
    Icon: Flame,
  },
  {
    name: 'Deep Focus',
    desc: 'Ambient soundscapes for concentration',
    color: '#059669',
    Icon: Waves,
  },
  {
    name: 'Late Night',
    desc: 'Moody R&B and soul for the late hours',
    color: '#7c3aed',
    Icon: Moon,
  },
  {
    name: 'New Releases',
    desc: 'Fresh drops from across every genre',
    color: '#d97706',
    Icon: Zap,
  },
  {
    name: 'Your Mix',
    desc: 'Personalised picks based on your history',
    color: '#0891b2',
    Icon: Radio,
  },
]

export function RadioPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Radio</h1>
        <p className={styles.subtitle}>AI-curated stations tailored to your taste.</p>
      </div>

      <p className={styles.sectionTitle}>Available stations</p>
      <div className={styles.grid}>
        {stations.map(({ name, desc, color, Icon }) => (
          <div
            key={name}
            className={styles.card}
            style={{ '--card-color': color } as React.CSSProperties}
          >
            <div
              className={styles.iconWrap}
              style={{ '--card-color': color } as React.CSSProperties}
            >
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <div className={styles.info}>
              <span className={styles.cardTitle}>{name}</span>
              <span className={styles.cardDesc}>{desc}</span>
            </div>
            <div className={styles.badge}>
              <Zap size={9} />
              Soon
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
