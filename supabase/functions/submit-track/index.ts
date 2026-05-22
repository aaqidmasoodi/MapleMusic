import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  // Verify caller is authenticated
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser()
  if (authErr ?? !user) return json({ error: 'Unauthorized' }, 401)

  // Parse body
  let url = ''
  try {
    const body = (await req.json()) as { url?: string }
    url = body.url ?? ''
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  const youtubeId = parseYoutubeId(url)
  if (!youtubeId) return json({ error: 'Invalid YouTube URL' }, 400)

  // Service-role client — bypasses RLS for inserts
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  // Dedup: return existing video if already ingested
  const { data: existing } = await admin
    .from('videos')
    .select('id, status')
    .eq('youtube_id', youtubeId)
    .maybeSingle()

  if (existing) {
    return json({ videoId: existing.id, status: existing.status, isNew: false })
  }

  // Create video row (pending)
  const { data: video, error: videoErr } = await admin
    .from('videos')
    .insert({ youtube_id: youtubeId, status: 'pending', added_by: user.id })
    .select('id')
    .single()

  if (videoErr ?? !video) return json({ error: 'Failed to create video record' }, 500)

  // Create job (worker will pick this up in Phase 3)
  const { data: job, error: jobErr } = await admin
    .from('jobs')
    .insert({ video_id: video.id, youtube_id: youtubeId, status: 'pending' })
    .select('id')
    .single()

  if (jobErr ?? !job) return json({ error: 'Failed to create job' }, 500)

  return json({ videoId: video.id, jobId: job.id, status: 'pending', isNew: true })
})
