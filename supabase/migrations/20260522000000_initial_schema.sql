-- ============================================================
-- MapleMusic — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================

create type public.video_status as enum ('pending', 'processing', 'ready', 'failed');
create type public.job_status as enum ('pending', 'processing', 'done', 'failed');

-- ============================================================
-- Tables
-- ============================================================

-- User profiles (extends auth.users)
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_path  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Global video library — deduplicated by youtube_id
create table public.videos (
  id               uuid         primary key default gen_random_uuid(),
  youtube_id       text         not null unique,
  title            text,
  ai_title         text,
  artist           text,
  duration_seconds integer,
  thumbnail_path   text,
  audio_path       text,        -- path to HLS manifest: hls/{youtube_id}/playlist.m3u8
  status           public.video_status not null default 'pending',
  error_message    text,
  added_by         uuid         references auth.users(id) on delete set null,
  created_at       timestamptz  not null default now(),
  ready_at         timestamptz
);

-- Media ingestion job queue
create table public.jobs (
  id            uuid              primary key default gen_random_uuid(),
  video_id      uuid              not null references public.videos(id) on delete cascade,
  youtube_id    text              not null,
  status        public.job_status not null default 'pending',
  attempts      integer           not null default 0,
  max_attempts  integer           not null default 3,
  error_message text,
  claimed_at    timestamptz,
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now()
);

-- User playlists
create table public.playlists (
  id          uuid        primary key default gen_random_uuid(),
  owner_id    uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  description text,
  cover_path  text,
  is_public   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Playlist contents
create table public.playlist_items (
  id          uuid        primary key default gen_random_uuid(),
  playlist_id uuid        not null references public.playlists(id) on delete cascade,
  video_id    uuid        not null references public.videos(id) on delete cascade,
  position    integer     not null,
  added_at    timestamptz not null default now(),
  unique (playlist_id, video_id)
);

-- ============================================================
-- Indexes
-- ============================================================

create index idx_videos_status          on public.videos (status) where status != 'ready';
create index idx_jobs_status_pending    on public.jobs (created_at) where status = 'pending';
create index idx_jobs_video_id          on public.jobs (video_id);
create index idx_playlists_owner        on public.playlists (owner_id);
create index idx_playlist_items_list    on public.playlist_items (playlist_id, position);
create index idx_playlist_items_video   on public.playlist_items (video_id);

-- ============================================================
-- Triggers: updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_jobs
  before update on public.jobs
  for each row execute function public.set_updated_at();

create trigger set_updated_at_playlists
  before update on public.playlists
  for each row execute function public.set_updated_at();

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.videos         enable row level security;
alter table public.jobs           enable row level security;
alter table public.playlists      enable row level security;
alter table public.playlist_items enable row level security;

-- profiles
create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- videos: readable by any authenticated user; writable only by service role
create policy "authenticated users can read ready videos"
  on public.videos for select
  to authenticated
  using (status = 'ready');

create policy "authenticated users can read own pending videos"
  on public.videos for select
  to authenticated
  using (added_by = auth.uid());

-- jobs: no client access — service role only (no policies = blocked for all anon/authenticated)

-- playlists
create policy "users can read own playlists"
  on public.playlists for select
  using (owner_id = auth.uid());

create policy "users can read public playlists"
  on public.playlists for select
  using (is_public = true);

create policy "users can create playlists"
  on public.playlists for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "users can update own playlists"
  on public.playlists for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "users can delete own playlists"
  on public.playlists for delete
  using (owner_id = auth.uid());

-- playlist_items: access via playlist ownership
create policy "users can read own playlist items"
  on public.playlist_items for select
  using (
    exists (
      select 1 from public.playlists
      where id = playlist_id and owner_id = auth.uid()
    )
  );

create policy "users can read public playlist items"
  on public.playlist_items for select
  using (
    exists (
      select 1 from public.playlists
      where id = playlist_id and is_public = true
    )
  );

create policy "users can add items to own playlists"
  on public.playlist_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.playlists
      where id = playlist_id and owner_id = auth.uid()
    )
  );

create policy "users can update items in own playlists"
  on public.playlist_items for update
  using (
    exists (
      select 1 from public.playlists
      where id = playlist_id and owner_id = auth.uid()
    )
  );

create policy "users can remove items from own playlists"
  on public.playlist_items for delete
  using (
    exists (
      select 1 from public.playlists
      where id = playlist_id and owner_id = auth.uid()
    )
  );

-- ============================================================
-- Storage Buckets
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'thumbnails',
    'thumbnails',
    true,
    5242880,   -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'audio',
    'audio',
    false,
    524288000, -- 500 MB per object (HLS segments are tiny; manifest capped generously)
    array['application/x-mpegurl', 'audio/aac', 'audio/mpeg', 'video/mp2t', 'text/plain']
  )
on conflict (id) do nothing;

-- thumbnails: public read, service-role write (handled by worker)
create policy "thumbnails are publicly readable"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

-- audio: authenticated users can read (signed URLs for private streams)
create policy "authenticated users can read audio"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'audio');

-- ============================================================
-- Realtime
-- ============================================================

-- Enable realtime on videos so clients can subscribe to status changes
alter publication supabase_realtime add table public.videos;
