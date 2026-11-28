# Implementation prompt: Offline video ingestion (transcript chunks + chapters)

## Goal
Build the offline pipeline that creates one `video` document per unique lesson video URL. Each holds the table of contents as `chapters[] { startSeconds, label }` and the transcript as short timestamped `chunks[] { startSeconds, text }` (AGENTS.md §8, §9). It runs from the Studio workspace on a developer machine and never runs in the request path.

Out of scope (next task): video-moment results in search, adding `video` to the Context GROQ filter and instructions, and lesson→video lookups in the web app.

## Skills / docs read
- `AGENTS.md` §5, §7, §8, §9, §12, §13.
- `sanity-best-practices` (global rules, video section, `schema`, `migration` refs). Its rule "let Sanity generate `_id`s" is overridden here by AGENTS.md §9, which requires an id derived from the video URL so that re-runs are idempotent and lessons map 1:1 by URL.
- `prompts/seed-sample-content.md`, `prompts/seed-notes-dedupe.md`, `prompts/search-logic.md` (prior decisions: `sanity exec --with-user-token` for live writes, and video was deferred to this task).

## Code / data inspected
- `studio/schemaTypes/*`: no `video` type yet. `lesson.videoUrl` is validated to YouTube / Vimeo / Bunny hosts.
- `lib/video.ts`: `parseVideoUrl()` gives `{ provider, id }` (Bunny id = `library/video`) and the embed/seek URL for each provider. Playback + seek already exist for all three providers.
- `studio/scripts/seed/seed.ndjson` + `videos.json`: 120 lessons, 120 unique YouTube URLs, no Vimeo/Bunny content yet.
- `studio/structure.ts`, `studio/sanity.cli.ts` (TypeGen writes `../sanity.types.ts`), `studio/package.json` scripts, `.gitignore`.
- `lib/search/agent.ts`: the server writes the GROQ itself, so nothing in search reads video docs yet.

## Decisions
1. **Caption source** (user choice): files first, plus an optional `yt-dlp` fetch.
   - Authored sources (committed): `studio/scripts/videos/sources/<docId>.vtt|.srt` and `<docId>.chapters.json` (`[{ "startSeconds": 0, "label": "Intro" }]`). These work for any provider. Vimeo and Bunny owners export WebVTT from their dashboards.
   - Fetched cache (gitignored): `studio/scripts/videos/.cache/`. `fetch` runs the user-installed `yt-dlp` with `--skip-download --write-subs --write-auto-subs --sub-langs en.* --sub-format vtt --write-info-json` and `--sleep-requests 1`. It keeps only the `.vtt` and a slim `<docId>.chapters.json` made from `info.chapters`, then deletes the info JSON. It skips cached videos unless `--force`. It never pretends to be a YouTube client or calls private endpoints itself. If `yt-dlp` is missing it exits with install hints. It does not install anything.
   - Precedence: authored over cached, for captions and chapters separately.
2. **Document id**: `video-<provider>-<providerId>`, with any character outside `[A-Za-z0-9_-]` replaced by `-` (Bunny `123/abc` → `video-bunny-123-abc`). No dots, so ids are never path-namespaced. The URL parser is a small `.mjs` port of `lib/video.ts` (Studio can't import web code), with a comment to keep the two in sync.
3. **Schema `video`** (document, read-only in Studio, built by the pipeline): `url` (url, required), `provider` (string: youtube|vimeo|bunny), `providerId` (string), `title` (string, from the lesson, for the Studio preview), `chapters[]` (object `videoChapter { startSeconds int ≥0, label string }`), `chunks[]` (object `transcriptChunk { startSeconds int ≥0, text text }`), `captionSource` (string: authored|auto|manual|none), `ingestedAt` (datetime). Every array item gets a stable `_key` (`c<index>`). Shown in Studio structure under a divider as "Videos (pipeline)". There is no whole-transcript field.
4. **Chunking**: parse VTT/SRT cues. Strip tags (`<c>`, inline timestamps) and entities. Drop YouTube auto-caption "rolling" repeats (a line equal to the last emitted line, or a cue whose text is a prefix-repeat of the previous). Then merge cues into chunks of about 20–30 s, cut at cue boundaries once a chunk reaches ≥20 s or ~70 words, with a hard limit of 40 s. `startSeconds` = floor of the first cue's start. Collapse whitespace and drop empty chunks.
5. **Chapters**: sort by `startSeconds`, dedupe, drop ones past the lesson duration, trim labels. Empty is allowed, because search falls back to the transcript (§7).
6. **Which videos**: queried live from the dataset (`*[_type=="lesson" && defined(videoUrl)]{title, videoUrl, duration}`), grouped by derived id, so a URL shared by two lessons gives one doc.
7. **Writing**: `sanity exec scripts/videos/ingest.mjs --with-user-token -- build` uses the developer's CLI login (no new token in env). It `createOrReplace`s video docs in batched transactions. `--dry-run` writes `scripts/videos/out/videos.ndjson` (gitignored) and prints stats without writing. Videos with neither captions nor chapters are skipped and listed. Video docs whose URL no lesson uses any more are reported, not deleted.
   **Deviation during implementation:** chunks are also cut before a pause of 10 s or more, so a chunk never bridges silence and its start lines up with where speech resumes. Timestamps with seconds or minutes above 59 are rejected.
8. **npm scripts** (studio): `videos:fetch`, `videos:build`, `videos:build:dry`, `videos:test`.

## Files expected to touch
- `studio/schemaTypes/documents/video.ts`, `studio/schemaTypes/objects/video-chapter.ts`, `studio/schemaTypes/objects/transcript-chunk.ts` (new), `studio/schemaTypes/index.ts`
- `studio/structure.ts`
- `studio/scripts/videos/ingest.mjs` (CLI: `fetch` | `build [--dry-run]`)
- `studio/scripts/videos/lib/video-url.mjs`, `lib/captions.mjs` (parse + chunk), `lib/chapters.mjs`
- `studio/scripts/videos/ingest.test.mjs` + `fixtures/rolling.vtt`, `fixtures/sample.srt`
- `studio/scripts/videos/sources/README.md` (file formats and naming)
- `studio/package.json`, `.gitignore`, `studio/schema.json` + `sanity.types.ts` (TypeGen), `README.md` (short "Video ingestion" section)

## Requirements
- Idempotent: re-running `build` with the same inputs gives identical docs (apart from `ingestedAt`).
- Transcript text appears only as chunks. No field holds the whole transcript.
- Never runs from or is imported by the web workspace.
- Clear per-video log: id, caption source, chunk count, chapter count, or skip reason.

## Security considerations
- No tokens are added. Writes use `sanity exec --with-user-token` (the developer's own session), and nothing is printed or saved.
- The dataset stays private. No web or browser code changes.
- `yt-dlp` runs via `spawn` with an argument array (no shell), and only for URLs that parse as supported providers, with ids that pass the provider regex.
- Downloaded third-party captions stay in the gitignored cache and are not committed.

## Acceptance criteria
- `npm run videos:test` passes: rolling auto-captions dedupe, SRT parse, chunk sizes within bounds, ids sanitized, unsupported URLs rejected.
- `npm run typecheck` (studio) passes. Studio shows "Videos (pipeline)" with read-only docs.
- With captions available: live `count(*[_type=="video"])` equals the number of distinct lesson video ids that have sources. Every video has `chunks` with ascending `startSeconds` under the lesson duration, and `chapters` where the source had them.
- `--dry-run` writes nothing to the dataset.

## Checks to run
- studio: `npm run videos:test`, `npm run typecheck`, `npm run typegen`, `npx sanity schema deploy`, `npx sanity deploy` (the Context MCP requires a deployed Studio).
- web (root): `npx tsc --noEmit`, `npm run lint` (types regenerated). No build needed, since no routes or server code change.
- If `yt-dlp` is installed: `videos:fetch` for a few lessons, then `videos:build:dry`, then `videos:build`, and verify the counts with a GROQ query. If not, I report that and stop at dry-run against fixtures.

## Manual test steps
1. Install yt-dlp: `winget install yt-dlp` (or `pip install yt-dlp`).
2. `cd studio && npm run videos:fetch -- --limit 3` → `.cache/` holds 3 `.vtt` and `.chapters.json` files.
3. `npm run videos:build:dry` → read the stats, then open `scripts/videos/out/videos.ndjson`.
4. `npm run videos:build` → in Studio, open Videos (pipeline) and check chapters and chunks with timestamps.
5. Optional: drop `sources/video-youtube-<id>.chapters.json` with your own labels, rebuild, and see the authored chapters replace the fetched ones.
