import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { config } from './config.ts'
import { admin } from './supabase.ts'
import { fetchMetadata, transcodeToHls } from './media.ts'
import { warmStream, getDirectUrl, evictStream } from './stream-cache.ts'

interface JobRow {
  id: string
  video_id: string
  youtube_id: string
  attempts: number
  max_attempts: number
}

let running = false

/** Start the polling loop. Processes one job per tick (single-instance safe). */
export function startQueue(): void {
  console.log(`[queue] polling every ${String(config.pollIntervalMs)}ms`)
  const tick = (): void => {
    void pollOnce().finally(() => {
      setTimeout(tick, config.pollIntervalMs)
    })
  }
  tick()
}

async function pollOnce(): Promise<void> {
  if (running) return
  const job = await claimNextJob()
  if (!job) return

  running = true
  // Pre-warm the direct stream URL immediately so /stream can use it right away.
  warmStream(job.youtube_id)
  console.log(`[queue] processing job ${job.id} (${job.youtube_id})`)
  try {
    await processJob(job)
    await admin.from('jobs').update({ status: 'done' }).eq('id', job.id)
    evictStream(job.youtube_id) // cached; future plays use CDN
    console.log(`[queue] done ${job.youtube_id}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[queue] job ${job.id} failed:`, message)
    await handleFailure(job, message)
  } finally {
    running = false
  }
}

async function claimNextJob(): Promise<JobRow | null> {
  const { data: pending } = await admin
    .from('jobs')
    .select('id, video_id, youtube_id, attempts, max_attempts')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)

  const candidate = pending?.[0] as JobRow | undefined
  if (!candidate) return null

  // Optimistic claim — only wins if still pending.
  const { data: claimed } = await admin
    .from('jobs')
    .update({
      status: 'processing',
      claimed_at: new Date().toISOString(),
      attempts: candidate.attempts + 1,
    })
    .eq('id', candidate.id)
    .eq('status', 'pending')
    .select('id, video_id, youtube_id, attempts, max_attempts')
    .maybeSingle<JobRow>()

  return claimed ?? null
}

async function processJob(job: JobRow): Promise<void> {
  await admin.from('videos').update({ status: 'processing' }).eq('id', job.video_id)

  // 1. Metadata (title / artist / duration) + thumbnail.
  console.log(`[queue] ${job.youtube_id} — fetching metadata`)
  const meta = await fetchMetadata(job.youtube_id)
  console.log(`[queue] ${job.youtube_id} — "${meta.title}" (${String(meta.durationSeconds)}s)`)

  const thumbnailPath = await cacheThumbnail(job.youtube_id, meta.thumbnailUrl)
  console.log(`[queue] ${job.youtube_id} — thumbnail ${thumbnailPath ? 'uploaded' : 'skipped'}`)

  await admin
    .from('videos')
    .update({
      title: meta.title,
      artist: meta.uploader,
      duration_seconds: meta.durationSeconds,
      thumbnail_path: thumbnailPath,
    })
    .eq('id', job.video_id)

  // 2. Transcode to HLS using the pre-resolved URL (no second yt-dlp run).
  console.log(`[queue] ${job.youtube_id} — transcoding to HLS`)
  const directUrl = await getDirectUrl(job.youtube_id)
  const { audioPath, durationSeconds } = await transcodeAndUpload(job.youtube_id, directUrl)
  console.log(`[queue] ${job.youtube_id} — HLS cached (${String(durationSeconds)}s)`)

  // 3. Atomic flip to ready only after the full upload succeeds.
  await admin
    .from('videos')
    .update({
      status: 'ready',
      audio_path: audioPath,
      duration_seconds: durationSeconds,
      ready_at: new Date().toISOString(),
    })
    .eq('id', job.video_id)
}

async function transcodeAndUpload(
  youtubeId: string,
  directUrl: string | null,
): Promise<{ audioPath: string; durationSeconds: number | null }> {
  const workDir = await mkdtemp(join(tmpdir(), `mm-${youtubeId}-`))
  try {
    const { durationSeconds } = await transcodeToHls(youtubeId, workDir, directUrl)

    const files = await readdir(workDir)
    const prefix = `hls/${youtubeId}`
    for (const file of files) {
      const body = await readFile(join(workDir, file))
      const { error } = await admin.storage
        .from(config.audioBucket)
        .upload(`${prefix}/${file}`, body, {
          contentType: contentTypeFor(file),
          upsert: true,
        })
      if (error) throw new Error(`upload ${file}: ${error.message}`)
    }
    return { audioPath: `${prefix}/playlist.m3u8`, durationSeconds }
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function cacheThumbnail(youtubeId: string, sourceUrl: string | null): Promise<string | null> {
  const url = sourceUrl ?? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const bytes = new Uint8Array(await resp.arrayBuffer())
    const path = `thumb/${youtubeId}.jpg`
    const { error } = await admin.storage
      .from(config.thumbnailBucket)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
    if (error) {
      console.error(`[queue] thumbnail upload failed for ${youtubeId}:`, error.message)
      return null
    }
    return path
  } catch (err) {
    console.error(`[queue] thumbnail fetch failed for ${youtubeId}:`, err)
    return null
  }
}

async function handleFailure(job: JobRow, message: string): Promise<void> {
  const exhausted = job.attempts >= job.max_attempts
  await admin
    .from('jobs')
    .update({ status: exhausted ? 'failed' : 'pending', error_message: message })
    .eq('id', job.id)

  if (exhausted) {
    await admin
      .from('videos')
      .update({ status: 'failed', error_message: message })
      .eq('id', job.video_id)
  }
}

function contentTypeFor(file: string): string {
  if (file.endsWith('.m3u8')) return 'application/x-mpegurl'
  if (file.endsWith('.aac')) return 'audio/aac'
  if (file.endsWith('.ts')) return 'video/mp2t'
  return 'application/octet-stream'
}
