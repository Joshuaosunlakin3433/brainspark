# Implementation prompt: Vertex home page

## Goal
Replace the create-next-app starter at `/` with the Vertex home page from `design/vertex-home.png`: site header, hero (eyebrow badge, headline, subcopy, Explore Courses CTA, search bar), "All Courses" grid of three course cards, the "New courses and lessons added every week." footer line, and the decorative orange bars at the bottom. Desktop matches the reference exactly; mobile adapts sensibly.

This is a UI task. No Sanity, Clerk, PostHog, or search backend is wired here — those arrive in their own tasks.

## Skills / docs read
- `AGENTS.md` (§2, §3, §5, §7, §14).
- `prompts/vertex-design-system.md` (tokens, primitives, conventions already in place).
- `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (SVGs are served unoptimized automatically when `src` ends in `.svg`; no `dangerouslyAllowSVG`).
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (keep the page a Server Component; only the search bar is a client island).
- No Sanity / Clerk / PostHog skills needed for this step.

## Code inspected
- `app/page.tsx`: create-next-app starter, to be replaced.
- `app/layout.tsx`: Inter + Playfair Display via `next/font`, metadata "Vertex". Body is `bg-white`.
- `app/globals.css`: Tailwind v4 `@theme` tokens (primary, neutral, type scale, radius, shadows). No warm canvas colour yet.
- `components/ui/*`: `Logo`, `NavLink`, `Button`/`buttonClasses`, `Input`/`Kbd`, `Card`, `CourseCard` (compact horizontal layout from the design system), `Badge`, etc. All server components.
- `next.config.ts`: `cacheComponents: true`, Turbopack Tailwind loader.
- No `web/`/`studio/` split yet; app lives at repo root (same as the design system task).

## Decisions & assumptions
1. **Course data is static placeholder data for now** in `lib/placeholder-courses.ts` (title, slug, summary, level, duration, module count, icon path) — exactly the three courses in the reference. It is typed so the catalog/Sanity task can swap it for a GROQ fetch without touching the UI. Clearly commented as temporary.
2. **Course icons** are SVG files in `public/courses/` (`nextjs.svg`, `docker.svg`, `typescript.svg`), rendered with `next/image` (auto-unoptimized for SVG). In Sanity these become the course cover/icon image, so brand colours stay out of components.
3. **CourseCard gets a `layout` prop**: existing compact layout stays the default (`"compact"`, used by `/design-system`); new `"stacked"` layout matches the home cards — 72px icon tile on top, Playfair title (~22px), summary, a divider, then the level / duration / modules meta row pinned to the bottom. Cards in a row share equal height. Whole card is the link (existing `after:inset-0` pattern). Meta icons: bar-chart, clock, file (the reference shows a page icon here, not the folder used in the design system card).
4. **Site header** as `components/site-header.tsx` (server component): `Logo`, `NavLink`s "Courses" (`/courses`) and "My Learning" (`/my-learning`), bell icon button (presentational, per AGENTS §7), and a 52px round avatar. Clerk is not set up yet, so the avatar is a **placeholder** (neutral circle with a user icon, `aria-label="Account"`); the auth task replaces it with Clerk's `UserButton`. No nav item is active on the home page, as in the reference.
5. **Page frame**: warm off-white canvas with a subtle diagonal hatch in the side gutters, and a centred content frame (~964px, as in the reference) with thin vertical border lines; a horizontal rule under the header and between hero and courses. New token `--color-canvas` (warm off-white) added to `@theme`; the hatch is a CSS `repeating-linear-gradient` using neutral tokens. Root `body` background is left as is; the home page sets its own canvas so other pages are unaffected.
6. **Hero** (centred): eyebrow `Badge`-style pill "INTELLIGENT LEARNING" (primary-100 bg, primary-200 border, primary text, wide tracking); headline "Search your learning / in plain English." in Playfair at the reference size (~64px/72px desktop, scaling down on mobile); subcopy in neutral-700 ~20px; primary CTA "Explore Courses →" linking to `/courses` using `buttonClasses` with the larger height/text from the reference (~60px tall, 18px) and a soft shadow.
7. **Search bar** `components/home-search.tsx` (`"use client"`): large field (~84px tall, 12px radius, neutral-200 border, white, shadow-sm), search icon, placeholder "Ask anything about your learning…", `⌘ K` key hint in a bordered box. Submitting navigates to `/search?q=<query>` (the results page is a later task). `⌘K` / `Ctrl+K` focuses the field. It is a `<form role="search">` with a visually hidden label. No fetches, no tokens, nothing sent anywhere else.
8. **All Courses section**: Playfair heading "All Courses" (~28px) with a text link "View all courses →" (`/courses`) on the right; three-column grid on desktop, two on tablet, one on mobile.
9. **Footer line**: "New courses and lessons added every week." with an outline star icon in primary, flanked by thin horizontal rules.
10. **Decorative bars**: two clusters of vertical bars (left and right) fading from primary-300/400 at the bottom to transparent at the top, varying heights as in the reference. Pure CSS divs, `aria-hidden`, `pointer-events-none`, hidden or reduced on small screens if they crowd content.
11. **Links to routes that don't exist yet** (`/courses`, `/my-learning`, `/search`) will 404 until those tasks land. This is expected.
12. `/design-system` stays unchanged except it keeps using `CourseCard` with the default layout.

## Files expected to touch
- `app/page.tsx` (replace)
- `app/globals.css` (add `--color-canvas`)
- `components/site-header.tsx` (new)
- `components/home-search.tsx` (new, client)
- `components/ui/course-card.tsx` (add `layout="stacked"`)
- `lib/placeholder-courses.ts` (new)
- `public/courses/nextjs.svg`, `docker.svg`, `typescript.svg` (new)

## Requirements
- Match the reference on desktop: layout, spacing, type, colour, states. No restyling.
- Responsive to ~375px: header keeps logo + avatar and the nav still fits (smaller gap); headline scales down; cards stack; no horizontal overflow.
- Reuse existing primitives and tokens; no hex in components (except via tokens / SVG assets).
- Only the search bar is a client component.
- Accessible: landmarks (`header`, `main`, `nav`), labelled icon buttons, visible focus rings, decorative elements `aria-hidden`.

## Security considerations
- No data fetching, env vars, tokens, or third-party calls.
- Search input is only put into a same-origin URL via `URLSearchParams` (encoded); nothing is rendered as HTML.
- SVG icons are static local files I author, served unoptimized by Next (no `dangerouslyAllowSVG`).

## Acceptance criteria
- `/` renders the home page and matches `design/vertex-home.png` side by side on a ~1024px+ desktop window.
- Typing a query and pressing Enter goes to `/search?q=...`; `⌘K`/`Ctrl+K` focuses the search field.
- Course cards link to `/courses/<slug>`; hover shows the card hover shadow.
- `/design-system` still renders the compact course card unchanged.
- Type check, lint, and production build pass.

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` and load `/` and `/design-system`

## Manual test steps
1. `npm run dev`
2. Open http://localhost:3000 and compare with `design/vertex-home.png`.
3. Press `Ctrl+K` (or `⌘K`): the search field focuses. Type "caching" and press Enter: URL becomes `/search?q=caching` (404 for now is expected).
4. Hover the course cards and the "Explore Courses" button; tab through header, CTA, search, and cards to check focus rings.
5. Narrow the window to ~375px: cards stack, headline wraps cleanly, nothing scrolls horizontally.
6. Open http://localhost:3000/design-system and confirm the compact course card is unchanged.
