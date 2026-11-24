# Implementation prompt: rename brand "Vertex" → "BrainSpark"

## Goal
The product name is **BrainSpark**, not Vertex. Replace every user-facing "Vertex" with "BrainSpark" in the implemented UI, and treat "Vertex" in current and future design references as a placeholder for BrainSpark.

## Code inspected (grep for "vertex", excluding node_modules/.next/skills)
- `components/ui/logo.tsx` — wordmark text.
- `components/site-header.tsx` — `aria-label="Vertex home"`.
- `app/layout.tsx` — metadata title and description.
- `app/page.tsx` — hero subcopy "Vertex understands…".
- `app/design-system/page.tsx` — metadata title and intro copy.
- `app/globals.css` — comment.
- `prompts/vertex-*.md` — historical plans (left as they are, they record what was approved).

## Decisions
1. Spelling: **BrainSpark** (capital B and S) in all UI copy and metadata.
2. Design PNGs are raster images and stay unchanged; filenames (`design/vertex-*.png`) are kept so existing references don't break. "Vertex" in any design reference is read as BrainSpark from now on (saved as a standing preference).
3. Logo mark (orange chevron) stays; only the wordmark text changes. The longer word may shift header nav slightly; the nav gap stays as in the reference.
4. Hero subcopy becomes "BrainSpark understands what you want to learn and finds the exact lessons across all your courses." Check that it still wraps to two lines on desktop; widen the max-width slightly if not.
5. Old `prompts/vertex-*.md` are not rewritten.

## Files expected to touch
`components/ui/logo.tsx`, `components/site-header.tsx`, `app/layout.tsx`, `app/page.tsx`, `app/design-system/page.tsx`, `app/globals.css` (comment).

## Security considerations
None — copy-only change.

## Acceptance criteria
- No user-facing "Vertex" remains (`grep -ri vertex app components lib` returns only design filename references, if any).
- Header shows "BrainSpark"; browser tab title is "BrainSpark".
- Hero subcopy wraps to two lines at desktop width.

## Checks to run
`npx tsc --noEmit`, `npm run lint`, `npm run build`, screenshot `/` at desktop and mobile widths.

## Manual test steps
1. `npm run dev`, open http://localhost:3000.
2. The header and tab title read "BrainSpark"; the hero line starts with "BrainSpark understands…".
3. Open `/design-system`: the title and intro say BrainSpark.
4. Narrow to ~375px: the header still fits (logo + bell + avatar on row 1, nav on row 2).
