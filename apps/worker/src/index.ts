// Worker entry point — media ingestion pipeline
// Polls job queue, runs yt-dlp + ffmpeg, uploads HLS segments to Supabase Storage

console.log('MapleMusic worker starting...')
