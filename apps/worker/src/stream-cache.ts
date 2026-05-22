// Pre-resolves YouTube direct audio URLs so the /stream proxy can start ffmpeg
// immediately instead of waiting for yt-dlp to run at request time.
//
// Flow: queue claims job → warmStream() → URL resolved in ~2-5s in background.
//       User hits play → getDirectUrl() returns the already-resolved URL → ffmpeg
//       starts in <1s instead of 5-15s.

import { spawn } from 'node:child_process'
import { config, youtubeUrl } from './config.ts'

const cache = new Map<string, Promise<string | null>>()

/** Start resolving the direct audio URL in the background. Call when a job is claimed. */
export function warmStream(youtubeId: string): void {
  if (cache.has(youtubeId)) return
  cache.set(youtubeId, resolve(youtubeId))
}

/** Returns the resolved direct audio URL, or null if resolution failed/timed out. */
export async function getDirectUrl(youtubeId: string): Promise<string | null> {
  const p = cache.get(youtubeId)
  if (!p) return null
  return p
}

export function evictStream(youtubeId: string): void {
  cache.delete(youtubeId)
}

async function resolve(youtubeId: string): Promise<string | null> {
  return new Promise((res) => {
    const child = spawn(config.ytDlpBin, [
      '-f',
      'bestaudio/best',
      '--no-playlist',
      '--no-warnings',
      '--get-url',
      youtubeUrl(youtubeId),
    ])

    let url = ''
    child.stdout.on('data', (c: Buffer) => {
      url += c.toString()
    })
    child.stderr.on('data', (c: Buffer) => {
      const t = c.toString().trim()
      if (t) console.error(`[warm] ${youtubeId}:`, t)
    })
    child.on('error', (err) => {
      console.error(`[warm] spawn error for ${youtubeId}:`, err.message)
      res(null)
    })
    child.on('close', (code) => {
      const direct = url.trim().split('\n')[0]?.trim() ?? ''
      if (code === 0 && direct.startsWith('http')) {
        console.log(`[warm] ${youtubeId} URL resolved`)
        res(direct)
      } else {
        console.error(`[warm] ${youtubeId} resolution failed (exit ${String(code)})`)
        res(null)
      }
    })
  })
}
