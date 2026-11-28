# Implementation prompt: Prefer a later matching chapter for video moments

## Goal
Many video results say "Watch from 0:00". The first chapter of these YouTube videos is often a title or intro that names the topic ("Introduction to Next.js Routing"), so it wins the match. Prefer the first matching chapter **after 0:00**, so the moment lands where the topic is actually taught. Fall back to the 0:00 chapter only when it is the only match.

Lesson cards stay as designed (key-points panel, no poster). The user asked for my recommendation and I recommended keeping the design.

## Skills / docs read
- `AGENTS.md` §7 (chapters first, then transcript), §11, §12.
- `prompts/search-results-page.md` (the moment query and merge rules).

## Code / data inspected
- `lib/search/agent.ts` `videoMomentQuery()`: `first()` picks `chapters[match][0]` (primary terms, then secondary) and the same for `chunks`.
- Live check: video `9602Yzvd7ik` has "rout*" chapters at 0, 43, 86, 182, 296. The new pick returns **43** ("Understanding File-Based Routing"). The `VBlSe8tvg4U` match at 1000 is unchanged.

## Decision
In `first()`, the order becomes: a primary match after 0s, then a primary match at any time, then a secondary match after 0s, then a secondary match at any time (`coalesce`). This applies to both chapters and transcript chunks, because the transcript's first chunk has the same intro problem. Primary terms still beat secondary ones, so a later chapter on a supporting term never displaces the main concept. Scoring, inclusion, and the merge are unchanged. It is still one item per array, never the whole array.

## Files expected to touch
- `lib/search/agent.ts` (`videoMomentQuery` only)

## Security considerations
None new. Terms are still sanitised stems that the server inlines, and the arrays are never returned whole.

## Acceptance criteria
- `routing in nextjs`: "File-system routing and the app directory" shows "Watch from 0:43", not 0:00.
- A video whose only match is at 0:00 still shows "Watch from 0:00".
- Results, count, and order are otherwise unchanged.

## Checks to run
`npx tsc --noEmit`, `npm run lint`, then a live `POST /api/search` for "routing in nextjs" and "data fetching", comparing the timestamps. No build is needed: no routes or config change, and it is server logic only. A build would only re-verify the same module.

## Manual test steps
1. With `npm run dev` running, open `/search?q=routing+in+nextjs`.
2. The first card shows "Watch from 0:43". Click it and the video starts at 0:43.
3. Scan the list. Fewer cards show 0:00, and those that do had no later match.
