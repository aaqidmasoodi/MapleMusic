-- ============================================================
-- Allow authenticated users to read any video for explore/discover
-- ============================================================
-- The explore page shows a global feed of all tracks ever added to
-- MapleMusic, regardless of processing status. Users can see what
-- everyone else is adding and discover new music.
--
-- The existing policies were restrictive (ready-only or own-pending).
-- This policy adds blanket read access for authenticated users.
-- Deletion from a personal library (user_videos.hidden_at) does not
-- remove the global record from videos, so tracks persist on explore.

create policy "authenticated users can read any video"
  on public.videos for select
  to authenticated
  using (true);
