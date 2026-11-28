// Offline video ingestion (AGENTS.md §9). Builds one `video` document per unique lesson
// video URL: chapters (table of contents) + transcript as short timestamped chunks.
// Never runs in the request path.
//
// Usage (from studio/, with your Sanity CLI login; no token is stored):
//   npx sanity exec scripts/videos/ingest.mjs --with-user-token -- fetch [--limit N] [--only <docId>] [--force]
//       downloads captions + chapters with yt-dlp into scripts/videos/.cache/ (gitignored)
//   npx sanity exec scripts/videos/ingest.mjs --with-user-token -- build [--dry-run] [--only <docId>]
//       builds video docs from sources/ (authored) and .cache/ (fetched), then writes them
//       (--dry-run writes scripts/videos/out/videos.ndjson instead)

import {spawn} from 'node:child_process'
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {getCliClient} from 'sanity/cli'

import {captionsToChunks} from './lib/captions.mjs'
import {chaptersFromYtDlp, normalizeChapters} from './lib/chapters.mjs'
import {canonicalUrl, parseVideoUrl, videoDocId} from './lib/video-url.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const SOURCES = join(here, 'sources')
const CACHE = join(here, '.cache')
const OUT = join(here, 'out')
const BATCH = 10

// ---- args -------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {command: null, limit: Infinity, only: null, force: false, dryRun: false}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === 'fetch' || a === 'build') args.command = a
    else if (a === '--limit') args.limit = Number(argv[++i])
    else if (a === '--only') args.only = argv[++i]
    else if (a === '--force') args.force = true
    else if (a === '--dry-run') args.dryRun = true
  }
  if (!Number.isFinite(args.limit) && args.limit !== Infinity) throw new Error('--limit needs a number')
  return args
}

// ---- lessons → unique videos ------------------------------------------------------------

async function loadVideos(client, only) {
  const lessons = await client.fetch(
    '*[_type == "lesson" && defined(videoUrl)] | order(_id asc){ _id, title, videoUrl, duration }',
  )
  const videos = new Map()
  for (const lesson of lessons) {
    const parsed = parseVideoUrl(lesson.videoUrl)
    if (!parsed) {
      console.warn(`! ${lesson._id}: unsupported video URL, skipped`)
      continue
    }
    const id = videoDocId(parsed)
    const existing = videos.get(id)
    if (existing) {
      existing.lessons.push(lesson._id)
      existing.duration = Math.max(existing.duration ?? 0, lesson.duration ?? 0) || null
    } else {
      videos.set(id, {
        id,
        parsed,
        url: lesson.videoUrl,
        title: lesson.title,
        duration: lesson.duration ?? null,
        lessons: [lesson._id],
      })
    }
  }
  const list = [...videos.values()]
  return only ? list.filter((v) => v.id === only) : list
}

// ---- fetch (yt-dlp) ---------------------------------------------------------------------

// Preferred caption languages, best first. yt-dlp names subtitle files <docId>.<lang>.vtt.
const LANG_ORDER = ['en', 'en-US', 'en-GB', 'en-orig']

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    // Argument array, no shell: URLs and paths are never interpreted by a shell.
    const child = spawn('yt-dlp', args, {stdio: ['ignore', 'inherit', 'inherit']})
    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'yt-dlp was not found on PATH. Install it (winget install yt-dlp, brew install yt-dlp, ' +
              'or pip install yt-dlp), or put caption files in scripts/videos/sources/ instead.',
          ),
        )
      } else reject(err)
    })
    child.on('close', (code) => resolve(code))
  })
}

function pickCaptionFile(id) {
  const files = readdirSync(CACHE).filter((f) => f.startsWith(`${id}.`) && f.endsWith('.vtt'))
  const lang = (f) => f.slice(id.length + 1, -'.vtt'.length)
  const rank = (f) => {
    const i = LANG_ORDER.indexOf(lang(f))
    return i === -1 ? LANG_ORDER.length : i
  }
  return files.sort((a, b) => rank(a) - rank(b))
}

async function fetchVideo(video, force) {
  const {id, parsed} = video
  const target = join(CACHE, `${id}.vtt`)
  if (!force && existsSync(target)) return 'cached'

  const code = await runYtDlp([
    '--skip-download',
    '--no-playlist',
    '--write-subs',
    '--write-auto-subs',
    // Exact tracks only: a pattern like `en.*` also matches auto-translated tracks
    // (e.g. en-en-CA), multiplying requests and triggering HTTP 429s.
    '--sub-langs',
    LANG_ORDER.join(','),
    '--sub-format',
    'vtt',
    '--write-info-json',
    '--no-write-comments',
    '--sleep-requests',
    '1',
    '-o',
    join(CACHE, `${id}.%(ext)s`),
    canonicalUrl(parsed),
  ])

  const infoPath = join(CACHE, `${id}.info.json`)
  const info = existsSync(infoPath) ? JSON.parse(readFileSync(infoPath, 'utf8')) : null
  rmSync(infoPath, {force: true}) // large; keep only what we need

  const [best, ...rest] = pickCaptionFile(id)
  for (const f of rest) rmSync(join(CACHE, f), {force: true})
  if (best && best !== `${id}.vtt`) {
    writeFileSync(target, readFileSync(join(CACHE, best)))
    rmSync(join(CACHE, best), {force: true})
  }

  if (info) {
    const manual = Object.keys(info.subtitles ?? {}).some((k) => k.startsWith('en'))
    const chapters = chaptersFromYtDlp(info)
    writeFileSync(join(CACHE, `${id}.chapters.json`), `${JSON.stringify(chapters, null, 2)}\n`)
    writeFileSync(
      join(CACHE, `${id}.meta.json`),
      `${JSON.stringify({captionSource: best ? (manual ? 'manual' : 'auto') : 'none'})}\n`,
    )
  }
  if (code !== 0 && !best && !info) return `failed (yt-dlp exit ${code})`
  return best ? 'fetched' : 'no captions'
}

async function fetchAll(videos, {limit, force}) {
  mkdirSync(CACHE, {recursive: true})
  const todo = videos.filter((v) => v.parsed.provider === 'youtube')
  const skipped = videos.length - todo.length
  if (skipped) console.log(`${skipped} non-YouTube videos skipped: add their captions to sources/.`)
  let done = 0
  for (const video of todo) {
    if (done >= limit) break
    const result = await fetchVideo(video, force)
    if (result !== 'cached') done++
    console.log(`${video.id}: ${result}`)
  }
}

// ---- build ------------------------------------------------------------------------------

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
}

function findCaptions(id) {
  for (const ext of ['vtt', 'srt']) {
    const p = join(SOURCES, `${id}.${ext}`)
    if (existsSync(p)) return {raw: readFileSync(p, 'utf8'), source: 'authored'}
  }
  const cached = join(CACHE, `${id}.vtt`)
  if (existsSync(cached)) {
    const meta = readJson(join(CACHE, `${id}.meta.json`))
    return {raw: readFileSync(cached, 'utf8'), source: meta?.captionSource ?? 'auto'}
  }
  return null
}

function findChapters(id) {
  return readJson(join(SOURCES, `${id}.chapters.json`)) ?? readJson(join(CACHE, `${id}.chapters.json`)) ?? []
}

export function buildDoc(video, {captions, chapters}, now) {
  const chunks = captions ? captionsToChunks(captions.raw) : []
  const inRange = chunks.filter((c) => !video.duration || c.startSeconds < video.duration)
  const toc = normalizeChapters(chapters, video.duration)
  return {
    _id: video.id,
    _type: 'video',
    url: video.url,
    provider: video.parsed.provider,
    providerId: video.parsed.id,
    title: video.title,
    chapters: toc.map((c, i) => ({_key: `c${i}`, _type: 'videoChapter', ...c})),
    chunks: inRange.map((c, i) => ({_key: `c${i}`, _type: 'transcriptChunk', ...c})),
    captionSource: inRange.length ? captions.source : 'none',
    ingestedAt: now,
  }
}

async function buildAll(client, videos, {dryRun}) {
  const now = new Date().toISOString()
  const docs = []
  const skipped = []
  for (const video of videos) {
    let doc
    try {
      doc = buildDoc(video, {captions: findCaptions(video.id), chapters: findChapters(video.id)}, now)
    } catch (err) {
      skipped.push(`${video.id}: ${err.message}`)
      continue
    }
    if (!doc.chunks.length && !doc.chapters.length) {
      skipped.push(`${video.id}: no captions or chapters`)
      continue
    }
    docs.push(doc)
    console.log(
      `${doc._id}: ${doc.captionSource}, ${doc.chunks.length} chunks, ${doc.chapters.length} chapters`,
    )
  }

  console.log(`\n${docs.length} video docs built, ${skipped.length} skipped of ${videos.length}.`)
  if (skipped.length) console.log(`Skipped:\n  ${skipped.slice(0, 20).join('\n  ')}${skipped.length > 20 ? `\n  … ${skipped.length - 20} more` : ''}`)

  const known = new Set(videos.map((v) => v.id))
  const existing = await client.fetch('*[_type == "video"]._id')
  const orphans = existing.filter((id) => !known.has(id))
  if (orphans.length) console.log(`Orphaned video docs (no lesson uses them; not deleted):\n  ${orphans.join('\n  ')}`)

  if (dryRun) {
    mkdirSync(OUT, {recursive: true})
    const file = join(OUT, 'videos.ndjson')
    writeFileSync(file, docs.map((d) => JSON.stringify(d)).join('\n') + (docs.length ? '\n' : ''))
    console.log(`Dry run: wrote ${file}. Nothing written to the dataset.`)
    return
  }

  for (let i = 0; i < docs.length; i += BATCH) {
    const tx = client.transaction()
    for (const doc of docs.slice(i, i + BATCH)) tx.createOrReplace(doc)
    await tx.commit({visibility: 'async'})
  }
  console.log(`Wrote ${docs.length} video docs.`)
}

// ---- main -------------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.command) {
    console.error('Usage: ingest.mjs fetch|build [--limit N] [--only <docId>] [--force] [--dry-run]')
    process.exit(1)
  }
  const client = getCliClient({apiVersion: '2026-11-25'}).withConfig({perspective: 'published'})
  const videos = await loadVideos(client, args.only)
  console.log(`${videos.length} unique lesson videos.`)
  if (args.command === 'fetch') await fetchAll(videos, args)
  else await buildAll(client, videos, args)
}

// Run only when executed (sanity exec or node), not when imported by tests.
if (!process.env.VIDEOS_INGEST_NO_MAIN) {
  main().catch((err) => {
    console.error(err.message ?? err)
    process.exit(1)
  })
}
