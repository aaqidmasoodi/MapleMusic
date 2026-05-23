import { spawn } from 'node:child_process'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { Readable } from 'node:stream'
import { config, youtubeUrl } from './config.ts'

export interface YoutubeMetadata {
  title: string
  uploader: string | null
  durationSeconds: number | null
  thumbnailUrl: string | null
}

// Common yt-dlp args: pull bestaudio, never expand playlists, quiet logs.
function ytDlpAudioArgs(youtubeId: string): string[] {
  return [
    '-f',
    'bestaudio/best',
    '--no-playlist',
    '--no-warnings',
    '--quiet',
    '-o',
    '-', // write the downloaded stream to stdout
    youtubeUrl(youtubeId),
  ]
}

function ffmpegMp3Args(): string[] {
  return [
    '-loglevel',
    'error',
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    config.audioBitrate,
    '-f',
    'mp3',
    'pipe:1',
  ]
}

/**
 * Fast path: stream MP3 from a pre-resolved direct URL (no yt-dlp at request
 * time — URL was resolved in the background when the job was claimed).
 */
export function streamMp3FromUrl(directUrl: string): {
  stream: Readable
  kill: () => void
} {
  const ffmpeg = spawn(config.ffmpegBin, [
    '-loglevel',
    'error',
    '-i',
    directUrl,
    ...ffmpegMp3Args(),
  ])
  logChildErrors('ffmpeg(direct)', ffmpeg)
  return {
    stream: ffmpeg.stdout,
    kill: () => {
      ffmpeg.kill('SIGKILL')
    },
  }
}

/**
 * Slow fallback: yt-dlp downloads bestaudio to stdout, piped into ffmpeg.
 * Used only when the pre-resolved URL isn't available yet.
 */
export function streamLiveMp3(youtubeId: string): {
  stream: Readable
  kill: () => void
} {
  const ytdlp = spawn(config.ytDlpBin, ytDlpAudioArgs(youtubeId))
  const ffmpeg = spawn(config.ffmpegBin, ['-loglevel', 'error', '-i', 'pipe:0', ...ffmpegMp3Args()])

  ytdlp.stdout.pipe(ffmpeg.stdin)
  logChildErrors('yt-dlp(live)', ytdlp)
  logChildErrors('ffmpeg(live)', ffmpeg)
  ytdlp.on('close', () => {
    ffmpeg.stdin.end()
  })

  return {
    stream: ffmpeg.stdout,
    kill: () => {
      ytdlp.kill('SIGKILL')
      ffmpeg.kill('SIGKILL')
    },
  }
}

/**
 * Fetch track metadata via YouTube's oEmbed API (~200ms, no yt-dlp).
 * Returns title, author, and thumbnail. Duration is filled in after transcode.
 */
export async function fetchMetadata(youtubeId: string): Promise<YoutubeMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl(youtubeId))}&format=json`
  try {
    const resp = await fetch(oembedUrl, { signal: AbortSignal.timeout(8000) })
    if (resp.ok) {
      const data = (await resp.json()) as {
        title?: string
        author_name?: string
        thumbnail_url?: string
      }
      return {
        title: data.title ?? youtubeId,
        uploader: data.author_name ?? null,
        durationSeconds: null, // filled in after transcode via ffprobe
        thumbnailUrl: data.thumbnail_url ?? null,
      }
    }
  } catch {
    // fall through to yt-dlp fallback
  }

  // Fallback: yt-dlp if oEmbed fails (private/unlisted videos, rate limits).
  console.warn(`[metadata] oEmbed failed for ${youtubeId}, falling back to yt-dlp`)
  const { stdout } = await runToCompletion(config.ytDlpBin, [
    '--print',
    '%(title)s\n%(uploader)s\n%(duration)s',
    '--no-playlist',
    '--no-warnings',
    youtubeUrl(youtubeId),
  ])
  const [title, uploader, duration] = stdout.trim().split('\n')
  return {
    title: title ?? youtubeId,
    uploader: uploader ?? null,
    durationSeconds: duration ? Math.round(Number(duration)) : null,
    thumbnailUrl: null,
  }
}

/**
 * Transcode the track into VOD HLS (AAC segments + playlist.m3u8) written to
 * `outDir`. Uses the pre-resolved direct URL when available (no yt-dlp spawn).
 * Returns the total duration in seconds extracted from the output manifest.
 */
export async function transcodeToHls(
  youtubeId: string,
  outDir: string,
  directUrl?: string | null,
): Promise<{ durationSeconds: number | null }> {
  const hlsArgs = [
    '-loglevel',
    'error',
    '-vn',
    '-c:a',
    'aac',
    '-b:a',
    config.audioBitrate,
    '-f',
    'hls',
    '-hls_time',
    String(config.hlsSegmentSeconds),
    '-hls_playlist_type',
    'vod',
    '-hls_segment_filename',
    `${outDir}/seg_%03d.ts`,
    `${outDir}/playlist.m3u8`,
  ]

  const ffmpegErr: string[] = []

  if (directUrl) {
    // Fast path: ffmpeg reads directly from the pre-resolved URL — no yt-dlp spawn.
    const ffmpeg = spawn(config.ffmpegBin, [
      '-loglevel',
      'error',
      '-i',
      directUrl,
      ...hlsArgs.slice(2),
    ])
    ffmpeg.stderr.on('data', (c: Buffer) => ffmpegErr.push(c.toString()))
    await new Promise<void>((resolve, reject) => {
      ffmpeg.on('error', reject)
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve()
        else
          reject(new Error(`ffmpeg(hls) exited ${String(code)}: ${ffmpegErr.join('').slice(-500)}`))
      })
    })
  } else {
    // Fallback: yt-dlp | ffmpeg pipe.
    const ytdlp = spawn(config.ytDlpBin, ytDlpAudioArgs(youtubeId))
    const ffmpeg = spawn(config.ffmpegBin, [
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      ...hlsArgs.slice(2),
    ])
    ytdlp.stdout.pipe(ffmpeg.stdin)
    logChildErrors('yt-dlp(hls)', ytdlp)
    ffmpeg.stderr.on('data', (c: Buffer) => ffmpegErr.push(c.toString()))
    ytdlp.on('close', () => {
      ffmpeg.stdin.end()
    })
    await new Promise<void>((resolve, reject) => {
      ffmpeg.on('error', reject)
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve()
        else
          reject(new Error(`ffmpeg(hls) exited ${String(code)}: ${ffmpegErr.join('').slice(-500)}`))
      })
    })
  }

  return { durationSeconds: await parseDurationFromPlaylist(`${outDir}/playlist.m3u8`) }
}

async function parseDurationFromPlaylist(manifestPath: string): Promise<number | null> {
  try {
    const { readFile } = await import('node:fs/promises')
    const m3u8 = await readFile(manifestPath, 'utf8')
    let total = 0
    for (const line of m3u8.split('\n')) {
      const m = /^#EXTINF:([0-9.]+)/.exec(line)
      if (m?.[1]) total += parseFloat(m[1])
    }
    return total > 0 ? Math.round(total) : null
  } catch {
    return null
  }
}

function logChildErrors(label: string, child: ChildProcessWithoutNullStreams): void {
  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    if (text) console.error(`[${label}] ${text}`)
  })
  child.on('error', (err) => {
    console.error(`[${label}] spawn error:`, err.message)
  })
}

function runToCompletion(bin: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args)
    const out: string[] = []
    const err: string[] = []
    child.stdout.on('data', (c: Buffer) => out.push(c.toString()))
    child.stderr.on('data', (c: Buffer) => err.push(c.toString()))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout: out.join(''), stderr: err.join('') })
      } else {
        reject(new Error(`${bin} exited ${String(code)}: ${err.join('').slice(-500)}`))
      }
    })
  })
}
