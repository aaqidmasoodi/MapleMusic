import type { ServerResponse } from 'node:http'
import { pipeline } from 'node:stream'
import { config } from './config.ts'
import { admin, getUserIdFromToken } from './supabase.ts'
import { streamLiveMp3, streamMp3FromUrl } from './media.ts'
import { getDirectUrl, warmStream } from './stream-cache.ts'

interface VideoRow {
  status: string
  audio_path: string | null
}

/**
 * GET /stream/:youtubeId?token=<supabase access token>
 *
 * If the track is already cached as HLS, redirect to the CDN manifest.
 * Otherwise live-transcode YouTube audio to MP3 and pipe it to the client for
 * instant playback (no queue wait).
 */
export async function handleStream(
  res: ServerResponse,
  youtubeId: string,
  token: string,
): Promise<void> {
  const userId = await getUserIdFromToken(token)
  if (!userId) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
    sendJson(res, 400, { error: 'Invalid YouTube ID' })
    return
  }

  // If already cached, hand the client the CDN manifest — far cheaper and faster
  // than proxying.
  const { data } = await admin
    .from('videos')
    .select('status, audio_path')
    .eq('youtube_id', youtubeId)
    .maybeSingle<VideoRow>()

  if (data?.status === 'ready' && data.audio_path) {
    const manifestUrl = await resolveManifestUrl(data.audio_path)
    if (manifestUrl) {
      res.writeHead(302, { Location: manifestUrl })
      res.end()
      return
    }
  }

  // Cold track → live proxy.
  // Always start warming so future plays are instant.
  warmStream(youtubeId)
  // Use the pre-resolved direct URL if already available (job was claimed before play).
  const directUrl = await getDirectUrl(youtubeId)
  const { stream, kill } = directUrl
    ? (console.log(`[stream] fast proxy (pre-resolved) for ${youtubeId}`),
      streamMp3FromUrl(directUrl))
    : (console.log(`[stream] cold proxy for ${youtubeId}`), streamLiveMp3(youtubeId))

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  })

  // Suppress EPIPE on the raw socket so a client disconnect doesn't crash Node.
  res.socket?.on('error', () => {
    /* intentional: client closed connection */
  })

  // pipeline() handles teardown on both sides; the callback fires on error or completion.
  pipeline(stream, res, (err) => {
    const ignoredCodes = new Set(['EPIPE', 'ECONNRESET', 'ERR_STREAM_PREMATURE_CLOSE'])
    if (err && !ignoredCodes.has(err.code ?? '')) {
      console.error(`[stream] pipeline error for ${youtubeId}:`, err.message)
    }
    kill()
  })
}

async function resolveManifestUrl(audioPath: string): Promise<string | null> {
  if (config.publicAudio) {
    const { data } = admin.storage.from(config.audioBucket).getPublicUrl(audioPath)
    return data.publicUrl
  }
  const { data, error } = await admin.storage
    .from(config.audioBucket)
    .createSignedUrl(audioPath, 60 * 60)
  if (error) return null
  return data.signedUrl
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(body))
}
