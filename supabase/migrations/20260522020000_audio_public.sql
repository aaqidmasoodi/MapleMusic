-- ============================================================
-- Make the audio bucket public (v1 streaming)
-- ============================================================
-- HLS playback is far simpler with public CDN URLs: hls.js fetches the
-- manifest then each segment by relative path, and signing every segment
-- request adds latency + complexity. For v1 we serve audio from a public
-- bucket (URLs are unguessable per youtube_id but not access-controlled).
--
-- TODO(security): revisit if the library becomes non-personal — switch to
-- private bucket + signed manifest/segment URLs (PUBLIC_AUDIO=false in worker).

update storage.buckets set public = true where id = 'audio';
