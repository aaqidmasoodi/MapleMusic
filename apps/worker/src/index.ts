// MapleMusic worker — always-on HTTP service.
//   GET /healthz            → liveness (keep-alive ping target)
//   GET /stream/:id?token=  → live MP3 proxy for instant playback, or 302 to CDN
// Plus a background poller that transcodes pending jobs into durable HLS.

import { createServer } from 'node:http'
import { config } from './config.ts'
import { handleStream } from './stream.ts'
import { startQueue } from './queue.ts'
import { warmStream } from './stream-cache.ts'
import { getUserIdFromToken } from './supabase.ts'

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    })
    res.end()
    return
  }

  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('ok')
    return
  }

  // POST /warm/:youtubeId?token=  — kick off URL pre-resolution immediately.
  const warmMatch = /^\/warm\/([^/]+)$/.exec(url.pathname)
  if (warmMatch && req.method === 'POST') {
    const youtubeId = decodeURIComponent(warmMatch[1] ?? '')
    const token = url.searchParams.get('token') ?? bearerToken(req.headers.authorization)
    void (async () => {
      const userId = await getUserIdFromToken(token)
      if (!userId) {
        res.writeHead(401, corsJson)
        res.end(JSON.stringify({ error: 'Unauthorized' }))
        return
      }
      if (/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) warmStream(youtubeId)
      res.writeHead(202, corsJson)
      res.end(JSON.stringify({ ok: true }))
    })()
    return
  }

  const streamMatch = /^\/stream\/([^/]+)$/.exec(url.pathname)
  if (streamMatch && req.method === 'GET') {
    const youtubeId = decodeURIComponent(streamMatch[1] ?? '')
    const token = url.searchParams.get('token') ?? bearerToken(req.headers.authorization)
    void handleStream(res, youtubeId, token).catch((err: unknown) => {
      console.error('[stream] unhandled error:', err)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      } else {
        res.end()
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

const corsJson = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

function bearerToken(header: string | undefined): string {
  if (!header) return ''
  return header.startsWith('Bearer ') ? header.slice(7) : header
}

server.listen(config.port, () => {
  console.log(`[worker] listening on :${String(config.port)}`)
  startQueue()
})
