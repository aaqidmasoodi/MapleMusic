import { useEffect, useState } from 'react'
import {
  AudioLines,
  BookMarked,
  Coffee,
  Compass,
  Cpu,
  Flame,
  Guitar,
  Heart,
  Loader2,
  Mic2,
  Music2,
  Search,
  Star,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePlayerStore } from '../stores/player.store'
import { youtubeThumbnailUrl } from '../lib/youtube'
import type { Track } from '../stores/player.store'
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

interface ExploreVideo {
  id: string
  youtube_id: string
  title: string | null
  artist: string | null
  thumbnail_path: string | null
  status: string
  created_at: string
}

function displayTitle(v: ExploreVideo): string {
  return v.title ?? v.youtube_id
}

export function ExplorePage() {
  const [recentVideos, setRecentVideos] = useState<ExploreVideo[]>([])
  const [videosLoading, setVideosLoading] = useState(true)
  const setTrack = usePlayerStore((s) => s.setTrack)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('videos')
        .select('id, youtube_id, title, artist, thumbnail_path, status, created_at')
        .order('created_at', { ascending: false })
        .limit(30)
      if (data) setRecentVideos(data)
      setVideosLoading(false)
    }
    void load()
  }, [])

  function handlePlay(v: ExploreVideo) {
    const track: Track = {
      id: v.id,
      youtubeId: v.youtube_id,
      title: displayTitle(v),
      artist: v.artist ?? 'Unknown artist',
      thumbnailUrl: v.thumbnail_path
        ? supabase.storage.from('thumbnails').getPublicUrl(v.thumbnail_path).data.publicUrl
        : youtubeThumbnailUrl(v.youtube_id),
      durationSeconds: 0,
      status: v.status as Track['status'],
      audioPath: null,
    }
    setTrack(track)
  }

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
        {videosLoading ? (
          <div className={styles.loading}>
            <Loader2 size={22} strokeWidth={1.75} className={styles.spin} />
          </div>
        ) : recentVideos.length === 0 ? (
          <div className={styles.emptyState}>
            <Music2 size={32} strokeWidth={1} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Nothing added yet</p>
            <p className={styles.emptyText}>
              Paste a YouTube URL above to add your first track to MapleMusic.
            </p>
          </div>
        ) : (
          <div className={styles.videoGrid}>
            {recentVideos.map((v) => {
              const thumb = v.thumbnail_path
                ? supabase.storage.from('thumbnails').getPublicUrl(v.thumbnail_path).data.publicUrl
                : youtubeThumbnailUrl(v.youtube_id)
              const isFailed = v.status === 'failed'
              return (
                <button
                  key={v.id}
                  className={styles.videoCard}
                  onClick={() => {
                    handlePlay(v)
                  }}
                  type="button"
                  aria-label={`Play ${displayTitle(v)}`}
                >
                  <div className={styles.thumbWrap}>
                    <img src={thumb} alt="" className={styles.thumb} loading="lazy" />
                    {isFailed && <div className={styles.thumbOverlay} />}
                    <div className={styles.playOverlay}>
                      <div className={styles.playIcon} />
                    </div>
                  </div>
                  <div className={styles.videoMeta}>
                    <span className={styles.videoTitle}>{displayTitle(v)}</span>
                    {v.artist && <span className={styles.videoArtist}>{v.artist}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
