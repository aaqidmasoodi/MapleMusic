-- ── Favorites ──────────────────────────────────────────────────────────────
ALTER TABLE public.user_videos
  ADD COLUMN IF NOT EXISTS liked_at TIMESTAMPTZ;

-- ── Playlists ───────────────────────────────────────────────────────────────
-- Drop and recreate to ensure correct schema (idempotent)
DROP TABLE IF EXISTS public.playlist_videos CASCADE;
DROP TABLE IF EXISTS public.playlist_items CASCADE;
DROP TABLE IF EXISTS public.playlists CASCADE;

CREATE TABLE public.playlists (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own playlists"
  ON public.playlists
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Playlist ↔ Video join ───────────────────────────────────────────────────
CREATE TABLE public.playlist_videos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID        NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  video_id    UUID        NOT NULL REFERENCES public.videos(id)    ON DELETE CASCADE,
  position    INTEGER     NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, video_id)
);

ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own playlist videos"
  ON public.playlist_videos
  USING  (playlist_id IN (SELECT id FROM public.playlists WHERE user_id = auth.uid()))
  WITH CHECK (playlist_id IN (SELECT id FROM public.playlists WHERE user_id = auth.uid()));

-- Realtime for playlists
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlists;
