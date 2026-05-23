-- ============================================================
-- user_videos — personal library join table
-- ============================================================
-- videos is the global dedup store (audio never deleted).
-- user_videos is each user's personal library view.
-- "Delete" = set hidden_at. Re-adding the same YouTube URL
-- restores the row (clears hidden_at) and reuses the cached audio.

create table public.user_videos (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  video_id   uuid        not null references public.videos(id) on delete cascade,
  added_at   timestamptz not null default now(),
  hidden_at  timestamptz,
  unique (user_id, video_id)
);

create index idx_user_videos_user on public.user_videos (user_id)
  where hidden_at is null;

alter table public.user_videos enable row level security;

create policy "users can read own library"
  on public.user_videos for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can insert into own library"
  on public.user_videos for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update own library"
  on public.user_videos for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Backfill existing videos into the join table.
insert into public.user_videos (user_id, video_id, added_at)
select added_by, id, created_at
from public.videos
where added_by is not null
on conflict (user_id, video_id) do nothing;

-- Realtime so the library updates instantly when tracks are added/restored.
alter publication supabase_realtime add table public.user_videos;
