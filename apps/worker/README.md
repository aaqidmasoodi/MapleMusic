# @maplemusic/worker

Always-on media service. Two jobs in one process:

1. **Live stream proxy** — `GET /stream/:youtubeId?token=<jwt>`. Validates the
   Supabase user token, then either `302`s to the cached HLS manifest (if the
   track is `ready`) or live-pipes `yt-dlp | ffmpeg → mp3` straight to the
   browser. This is what makes a brand-new track playable in ~1–3s with no
   queue wait.
2. **Queue poller** — claims `pending` jobs, pulls metadata + thumbnail, and
   transcodes to durable HLS in Supabase Storage, then flips the video to
   `ready`. After that, every play (any user) is served by the CDN (<500ms).

`GET /healthz` returns `ok` (keep-alive target).

## Run locally

Requires `ffmpeg` and `yt-dlp` on PATH (`brew install ffmpeg yt-dlp`).

```bash
cp apps/worker/.env.example apps/worker/.env.local   # fill in Supabase values
pnpm --filter @maplemusic/worker dev
```

The web app talks to it via `VITE_WORKER_URL` (defaults to `http://localhost:8080`).

## Deploy (Render free tier)

1. Apply the migrations in `supabase/migrations/` (incl. `*_audio_public.sql`).
2. Push the repo; in Render: **New → Blueprint**, select it (`render.yaml`).
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the dashboard.
4. Set `VITE_WORKER_URL` in the web app's env to the Render URL.
5. Set the GitHub repo variable `WORKER_URL` so the keep-alive workflow stops
   Render from spinning the service down.

> Render free sleeps after ~15 min idle (~50s cold start). The keep-alive ping
> in `.github/workflows/keepalive.yml` holds it warm within the 750h/mo budget.
