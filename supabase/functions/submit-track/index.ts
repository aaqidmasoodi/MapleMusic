import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    return await handle(req)
  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

async function handle(req: Request): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
    return json({ error: 'Server misconfiguration — service key missing' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: authData, error: authErr } = await userClient.auth.getUser()
  if (authErr || !authData.user) {
    console.error('Auth check failed:', authErr?.message)
    return json({ error: 'Unauthorized' }, 401)
  }
  const userId = authData.user.id

  let url = ''
  try {
    const body = (await req.json()) as { url?: string }
    url = body.url ?? ''
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  const youtubeId = parseYoutubeId(url)
  if (!youtubeId) return json({ error: 'Invalid YouTube URL' }, 400)

  // Service-role client — bypasses RLS for inserts.
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // Dedup: return the existing video if already ingested.
  const { data: existing, error: existErr } = await admin
    .from('videos')
    .select('id, status')
    .eq('youtube_id', youtubeId)
    .maybeSingle()

  if (existErr) {
    console.error('Dedup query failed:', existErr.message, existErr.code)
    return json({ error: `Database error: ${existErr.message}` }, 500)
  }

  if (existing) {
    // Track already ingested — just (re-)link it to this user's library.
    // Clears hidden_at so a previously-deleted track is instantly restored.
    await admin
      .from('user_videos')
      .upsert(
        { user_id: userId, video_id: existing.id, hidden_at: null },
        { onConflict: 'user_id,video_id' },
      )
    return json({ videoId: existing.id, status: existing.status, isNew: false })
  }

  const { data: video, error: videoErr } = await admin
    .from('videos')
    .insert({ youtube_id: youtubeId, status: 'pending', added_by: userId })
    .select('id')
    .single()

  if (videoErr || !video) {
    console.error('Video insert failed:', videoErr?.message, videoErr?.code)
    return json({ error: videoErr?.message ?? 'Failed to create video record' }, 500)
  }

  const { data: job, error: jobErr } = await admin
    .from('jobs')
    .insert({ video_id: video.id, youtube_id: youtubeId, status: 'pending' })
    .select('id')
    .single()

  if (jobErr || !job) {
    console.error('Job insert failed:', jobErr?.message, jobErr?.code)
    return json({ error: jobErr?.message ?? 'Failed to create job' }, 500)
  }

  // Link to user's personal library.
  await admin.from('user_videos').insert({ user_id: userId, video_id: video.id })

  return json({ videoId: video.id, jobId: job.id, status: 'pending', isNew: true })
}
