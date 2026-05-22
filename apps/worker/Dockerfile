# MapleMusic worker — Node + ffmpeg + yt-dlp.
# Build context is the repo root (see render.yaml dockerContext: .).
FROM node:22-bookworm-slim

# Media tooling: ffmpeg for transcode, python3 + the yt-dlp binary for download.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 ca-certificates wget \
  && wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy the whole workspace (the worker is part of a pnpm monorepo).
COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @maplemusic/worker build

ENV NODE_ENV=production
# Render injects PORT; default for local docker runs.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "apps/worker/dist/index.js"]
