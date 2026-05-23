import { spawn } from 'node:child_process'
import { config, youtubeUrl } from './config.ts'

const cache = new Map<string, Promise<string | null>>()

/** Start resolving the direct audio URL in the background. Call when a job is claimed. */
export function warmStream(youtubeId: string): void {
  if (cache.has(youtubeId)) return
  cache.set(youtubeId, resolveWithRetry(youtubeId, 3))
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

async function resolveWithRetry(youtubeId: string, maxRetries: number): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await resolve(youtubeId)
    if (result !== null) return result
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * 2 ** attempt, 15000)
      console.log(
        `[warm] ${youtubeId} retry ${String(attempt)}/${String(maxRetries)} in ${String(delay)}ms`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  console.error(`[warm] ${youtubeId} all ${String(maxRetries)} attempts failed`)
  return null
}

async function resolve(youtubeId: string): Promise<string | null> {
  return new Promise((res) => {
    const child = spawn(config.ytDlpBin, [
      '-f',
      'bestaudio/best',
      '--no-playlist',
      '--no-warnings',
      '--geo-bypass',
      '--retries',
      '3',
      '--extractor-retries',
      '3',
      '--extractor-args',
      'youtube:player_client=android,web',
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
