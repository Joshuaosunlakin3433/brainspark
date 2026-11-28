# Implementation prompt: Search results page (design/vertex-search.png)

## Goal
Build `/search?q=…`, the full search results page from `design/vertex-search.png`, wired to live Sanity content through the existing `POST /api/search` route. Extend search so it returns both result kinds from the design (AGENTS.md §11):
- **Video results**: a lesson's video matched at a moment. They now come from the 110 ingested `video` docs.
- **Lesson results**: a lesson matched on its own topic.

The home search already routes to `/search?q=`, so this page completes that flow.

## Skills / docs read
- `AGENTS.md` §3, §5, §7, §8, §11, §12, §13.
- `dial-your-context` (Instructions = short deltas, verified claims, applied with `sanity context mcp update`).
- `prompts/search-logic.md`, `prompts/search-groq-provider.md`, `prompts/video-ingestion.md` (prior decisions).
- Next docs in `node_modules/next/dist/docs/` for `useSearchParams` + Suspense under `cacheComponents`.

## Code / data inspected
- `lib/search/agent.ts`: one Groq call plans the primary/secondary stems. The server builds a weighted lesson GROQ and runs it through the Context MCP `groq_query`. `hydrate.ts` re-fetches ids and builds `LessonResult`s. `types.ts` already defines `VideoResult` (not produced yet).
- `app/api/search/route.ts`: NDJSON stream of `status` → `results` | `error`.
- `components/home-search.tsx`: pushes `/search?q=` and tracks `search_performed { source: "home" }`.
- `components/ui/*` (Badge video/lesson variants, Card, Button, Select, Input, NavLink), `site-header.tsx`, `app/courses/page.tsx` (page frame pattern), `lib/format.ts`, `lib/video.ts` (`?t=` start seconds already works on the lesson page for all three providers).
- **Live dataset** (verified by query): 10 courses, 120 lessons (all with poster), 110 `video` docs (all with chunks, 87 with chapters). Every video maps to a lesson by `videoUrl`. This query works live:
  `*[_type=="video" && (chapters[].label match "fetch*" || chunks[].text match "fetch*")] | score(boost(chapters[].label match "fetch*",5), chunks[].text match "fetch*") {_id, "ch": chapters[label match "fetch*"][0]{startSeconds,label}, "ck": chunks[text match "fetch*"][0]{startSeconds}, "lessons": *[_type=="lesson" && videoUrl==^.url]._id}`
  It returns e.g. chapter "Static: fetch()" @ 370s. Transcript-only hits are noisy (e.g. a tsconfig lesson for "fetch").
- The Context endpoint GROQ filter is currently `_type in ["course","lesson","instructor","category"]`, so **video is not visible to the MCP yet**.

## Decisions
1. **Two queries, one plan.** After the existing planning call, the server runs two GROQ queries through the MCP in parallel. Both are server-built from sanitised stems, as today. The model writes no GROQ.
   - The lesson topic query, unchanged.
   - A video moment query: match `chapters[].label` (weight 5 primary / 2 secondary) and `chunks[].text` (weight 1 / 0.5). It projects **only** the first matching chapter `{startSeconds,label}` (primary terms before secondary) and the first matching chunk `{startSeconds}`, plus the lesson ids using that video. It never projects `chunks` or `chapters` wholesale (§12).
2. **Merge per lesson** (each lesson appears once):
   - The lesson is included if it matched on topic **or** its video matched a **chapter**. A transcript-only hit on a lesson with no topic match is dropped, because that is the noise seen in live data.
   - The moment is the chapter if one matched, else the transcript chunk (§7, two-stage).
   - Kind is `video` when a moment exists, otherwise `lesson`.
   - Score = topic score + video score. Ranking and tiers are relative to the top score, as today.
3. **Grounding**: lesson ids are re-fetched with the existing parameterised hydration query. `startSeconds` must be an integer ≥ 0 and below the lesson duration (when known), or the moment is dropped. Video card `href` = lesson URL + `?t=<s>`. Card text is lesson data only, never transcript text.
4. **Context endpoint**: add `"video"` to the GROQ filter, and add a short video delta to `studio/context/search-instructions.md`: videos are an internal lookup, map them to lessons by `videoUrl`, match `chapters[].label` first, then `chunks[].text`, and never return arrays wholesale. Mirror the critical rule in `system-prompt.ts` in one line. Apply with `npx sanity@latest context mcp update`.
5. **Page** `app/search/page.tsx`: same frame as `/courses` (canvas, hatch, bordered 1080 column, `SiteHeader`). A client `SearchResultsView` reads `q` via `useSearchParams` inside `<Suspense>`. It POSTs to `/api/search`, reads the NDJSON stream, and aborts on `q` change or unmount. Static metadata `Search | BrainSpark`.
   - States: no `q` (heading + search box + banner), loading (the live status line + 3 skeleton cards), results, error (the route's generic message + retry), empty (shown below).
6. **Layout per design**:
   - "SEARCH RESULTS" pill.
   - Playfair heading `Results for "<q>"` with the quote in primary orange.
   - "Found N results across M courses".
   - Search box with ⌘K. It focuses the input, and submitting pushes `/search?q=` and tracks `search_performed { source: "search_page" }`.
   - "N results" with a sort `Select`.
   - Stacked result cards.
   - The "Can't find what you're looking for?" banner with "Browse all courses →".
   - Empty state: "No results for …" plus the same banner, which points to `/courses`.
7. **Video card**:
   - Left: 16:9-ish poster (`next/image`, Sanity CDN) with a centred play button and a bottom-right clip length = lesson duration `m:ss`.
   - Right: course icon + name, a VIDEO badge top-right, title, description (2-line clamp), `[FileText] Lesson 5.1 · [Folder] <module title>`, and `[CirclePlay] Watch from mm:ss ›`.
   - The whole card is a link.
8. **Lesson card**:
   - Left: a neutral-50 panel with a `FileText` icon and up to 3 key points as bullets.
   - Right: course row, a LESSON badge, title, description, `Module N`, and `View lesson [ExternalLink] ›`.
   - **The grey check circle in the design is a completion mark. No progress backend exists yet, so I do not render it** (no fake state, §5). It can be added when progress lands.
9. **Sort** (client side, over the returned results): Most Relevant (default), Videos first, Lessons first, Shortest first. No cap beyond the existing 60. No pagination, because the design has none.
10. **Header**: add an optional `active` prop to `SiteHeader`. The search page passes `"courses"` because the design shows Courses highlighted. Other pages are unchanged.
11. Brand stays **BrainSpark** ("Vertex" in the design = BrainSpark).

## Files expected to touch
- `lib/search/agent.ts`: video moment query, merge, return lesson matches + moments.
- `lib/search/types.ts`: agent output carries an optional moment `{ startSeconds, source: "chapter"|"transcript" }`. `VideoResult.matchedText` is replaced by `matchedLabel` (chapter label, internal only).
- `lib/search/hydrate.ts`: build `VideoResult` or `LessonResult`.
- `lib/search/system-prompt.ts` (one line), `studio/context/search-instructions.md`.
- `lib/format.ts`: `formatClock(seconds)` → `12:45` / `1:02:03`.
- `app/search/page.tsx`, `components/search/search-results-view.tsx` (client), `components/search/search-box.tsx` (client), `components/search/video-result-card.tsx`, `components/search/lesson-result-card.tsx`, `components/search/search-banner.tsx`.
- `components/site-header.tsx` (`active` prop).

## Requirements
- Results only come from stored data. Counts are computed from the hydrated results.
- The browser only talks to `/api/search`. No token, MCP, or LLM call from the client.
- Responsive: cards stack (thumbnail on top) below `sm`, and the heading and search box scale down. Desktop matches the reference.
- Accessible: `role="search"` form with a label, `aria-live="polite"` for status and count, focus-visible rings, and decorative icons `aria-hidden`.

## Security considerations
- No new env vars or secrets. The org token, read token, and Groq key stay server-only (`server-only` imports).
- Stems are sanitised to `[a-z0-9 *]` before being inlined into GROQ (existing `cleanKeywords`). Ids are re-fetched via `$ids`.
- The Context filter widens only to `video`, which is read-only content. Transcript arrays are never returned to the model or the browser.
- The query is rendered as text (React escapes it) and is never put into HTML or the system prompt.
- Still no rate limiting on `/api/search` (pre-existing, flagged before).

## Acceptance criteria
- `/search?q=data%20fetching` shows the pill, the heading with the orange quoted query, "Found N results across M courses", and a mix of VIDEO and LESSON cards ranked best first.
- "Watch from mm:ss" opens the lesson page, and the embed starts at that second.
- "View lesson" opens the lesson page.
- Sorting reorders without refetching. A new query from the page box updates the URL and results.
- `/search?q=qwzx%20plmk` shows the empty state, which links to `/courses`.
- `/search` with no `q` shows the search box, not an error.
- Network tab: only `POST /api/search` from the browser.

## Checks to run
- Root: `npx tsc --noEmit`, `npm run lint`, `npm run build` (new route + server change).
- Live: apply the Context filter and Instructions, then `curl.exe -N -X POST localhost:3000/api/search -d '{"q":"data fetching"}'` and report that video and lesson results both appear, with real timestamps. Load the page in the dev server.

## Manual test steps
1. `npm run dev`, then open `http://localhost:3000`, type `data fetching` in the home search, and press Enter.
2. On `/search?q=data+fetching`, check the header, count, and cards against `design/vertex-search.png`.
3. Click a "Watch from …" card. The lesson video should start at that timestamp. Go back.
4. Change the sort to "Shortest first", then "Lessons first". Order changes instantly.
5. Press Ctrl/⌘+K, type `server components`, and press Enter. The URL and results update.
6. Open `/search?q=qwzx plmk` for the empty state, and click "Browse all courses".
7. Resize to mobile width. Cards stack and nothing overflows.

## Deviations during implementation
- **`next.config.ts` image pattern**: `remotePatterns: [new URL("https://cdn.sanity.io/images/**")]` implies an empty query string, so `/_next/image` returned 400 for any Sanity URL with transform params. Course icons hid this because they are SVGs, which skip the optimizer. The pattern is now the object form `{ protocol, hostname, pathname }` with no `search`.
- **Context endpoint update**: passing multiline `--instructions` through the `npx` `.cmd` shim from Git Bash cut the text to its first line. I reapplied it by spawning the CLI's JS entry with an argument array, then checked it with `context mcp get` (full text, Video moments section included).
- **Schema deployed** (`sanity schema deploy`). The **Studio app deploy was not run**: `sanity deploy -y` needs `--url <hostname>` because `sanity.cli.ts` has no `studioHost`/`appId`.
- The lesson card's left panel always uses the `FileText` icon. The design mixes a doc icon and a course icon, with no rule between them.
- Live results (`data fetching`): 4 video results across 2 courses with chapter timestamps (e.g. "Caching and revalidation" @ 6:10). `server components`: 3 video + 2 lesson. `qwzx plmk`: 0.
