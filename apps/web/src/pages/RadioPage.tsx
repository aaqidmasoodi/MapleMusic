import { Radio, Zap } from 'lucide-react'
import styles from './RadioPage.module.css'

const stations = [
  { name: 'Chill Vibes', desc: 'Lo-fi beats to relax and focus', gradient: 'from-blue' },
  { name: 'Energy Boost', desc: 'High-tempo tracks for your workout', gradient: 'from-red' },
  { name: 'Deep Focus', desc: 'Ambient soundscapes for concentration', gradient: 'from-green' },
  { name: 'Late Night', desc: 'Moody R&B and soul for the late hours', gradient: 'from-purple' },
]

export function RadioPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Radio</h1>
        <p className={styles.subtitle}>AI-generated stations based on your taste.</p>
      </div>

      <section className={styles.section}>
        <div className={styles.stationGrid}>
          {stations.map((s) => (
            <div key={s.name} className={`${styles.stationCard} ${styles[s.gradient]}`}>
              <div className={styles.stationIcon}>
                <Radio size={20} />
              </div>
              <div className={styles.stationInfo}>
                <span className={styles.stationName}>{s.name}</span>
                <span className={styles.stationDesc}>{s.desc}</span>
              </div>
              <div className={styles.comingSoon}>
                <Zap size={11} />
                Soon
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
