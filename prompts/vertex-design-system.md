# Implementation prompt: Vertex design system

## Goal
Turn `design/vertex-designsystem.png` into the project's foundation layer: Tailwind v4 design tokens, fonts, and a small set of reusable, presentational UI primitives that later pages (catalog, course, lesson, search, My Learning) will compose. No pages, data, auth, or Sanity work in this task.

## Skills / docs read
- `AGENTS.md` (sections 2, 3, 5, 6, 14).
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md` and `11-css.md` (next/font/google with CSS variables; Tailwind via the Turbopack loader already configured in `next.config.ts`).
- No Sanity / Clerk / PostHog skill needed — pure UI foundation.

## Code inspected
- `package.json`: Next 16.4.6, React 19.3, Tailwind 4.3.3 via `@tailwindcss/turbopack` (no `tailwind.config`, no PostCSS file). No icon or class-merge library installed.
- `app/globals.css`: create-next-app defaults (Geist, dark-mode media query).
- `app/layout.tsx`: Geist fonts, placeholder metadata.
- `app/page.tsx`: create-next-app starter.
- `tsconfig.json`: `@/*` → repo root.
- Repo is currently a single Next.js app at the root; the `web/` + `studio/` split from AGENTS.md §5 does not exist yet.

## Decisions & assumptions
1. **Tokens live in `app/globals.css` under `@theme`** (Tailwind v4 CSS-first). Exact hex values from the reference:
   - Primary: 500 `#F97316`, 400 `#FB923C`, 300 `#FDBA74`, 200 `#FED7AA`, 100 `#FFEEE5`.
   - Neutral: 900 `#0F172A`, 700 `#334155`, 500 `#64748B`, 300 `#CBD5E1`, 200 `#E2E8F0`, 100 `#F1F5F9`, 50 `#FAFAFC`, white `#FFFFFF`.
   - These **replace** Tailwind's default `orange`/`slate` usage — exposed as `primary-*` and `neutral-*` (Tailwind's built-in `neutral` palette is overridden with these values so only the reference shades exist).
   - Radius: xs 4, sm 8, md 12, lg 16, xl 24, full.
   - Shadows: sm `0 1px 2px 0 rgba(15,23,42,.05)`, md `0 4px 12px -2px rgba(15,23,42,.08)`, lg `0 12px 24px -4px rgba(15,23,42,.10)`, xl `0 20px 40px -8px rgba(15,23,42,.12)`.
   - Spacing: Tailwind's default 4px base already matches (4/8/12/16/24/32/40/48/64 = 1/2/3/4/6/8/10/12/16). No change.
   - Type scale as utilities: `text-display-1` (48/56), `text-display-2` (36/44), `text-h1` (28/36), `text-h2` (22/30), `text-h3` (18/26), `text-body-lg` (16/24), `text-body` (14/20), `text-small` (12/16). Weights applied in components/classes per the table (Display bold serif; H1/H2 semibold; H3 medium; body regular).
2. **Fonts**: `Playfair_Display` (`--font-display`, `font-display`) and `Inter` (`--font-sans`, default body) via `next/font/google`, replacing Geist. Body defaults: Inter, `text-neutral-900`, white background.
3. **Light theme only** — remove the dark-mode media query (the reference has no dark mode).
4. **Icons**: add `lucide-react` — its defaults match the spec (24×24 grid, 2px stroke, round caps). "Filled" style = same icon with `fill="currentColor"` where the glyph supports it. No custom icon set.
5. **Class merging**: add `clsx` only (tiny); no `tailwind-merge` / cva — variants are simple maps.
6. **Primitives** (server-safe, presentational, props-only, in `components/ui/`):
   - `Button` — variants `primary` | `secondary` | `tertiary` | `text`; sizes `md` (padding 0 12px) | `lg` (0 16px); height 44px default; radius 12px; Inter medium 14–16px; hover and disabled states as shown. Optional leading/trailing icon. Polymorphic enough to render as `<a>`/`next/link` via an `href` prop.
   - `Badge` — `video` (primary tint), `lesson` (neutral/indigo tint as shown), `popular` (primary-100 bg); uppercase small tracking-wide.
   - `StatusIndicator` — `in-progress` | `completed` | `now-playing` | `locked` with the icons/colors shown.
   - `ProgressBar` — value 0–100, primary-500 fill on neutral-200 track, optional "35% complete" label; `role="progressbar"` with aria values.
   - `Input` (search/text) — 44px, 12px radius, 1px `#E2E8F0` border, padding 0 16px, focus border `#FB923C`, optional leading icon and trailing `⌘K` kbd hint.
   - `Select` — native `<select>` styled to match (chevron icon), same field specs. Native keeps it accessible and server-renderable.
   - `Card` — base surface (white, neutral-200 border, radius per reference, shadow-sm) used by:
     - `CourseCard` (icon tile, title, summary, level / duration / module count meta),
     - `LessonCard` with `kind: "video" | "lesson"` (badge, title, description, "Lesson 5.1 · 12:45 / Module 5" meta, "Watch from 12:45" or "View lesson" action),
     - `ResourceCard` (file icon, title, description, type · size, external-link action).
     These take plain props only; wiring to Sanity comes later.
   - `Logo` — Vertex mark (inline SVG chevron in primary-500) + wordmark.
   - `Breadcrumbs` — items with `>` separators, last item current (`aria-current`).
   - `Pagination` — prev/next chevrons, numbered pages, ellipsis, active page outlined in primary. Presentational; takes `currentPage`, `totalPages`, `hrefForPage`.
   - `NavLink` — top-nav link with active state (primary-500) as in "Courses / My Learning". The full header with Clerk comes with the auth task.
   - `components/ui/index.ts` barrel export.
7. **Preview route** `app/design-system/page.tsx`: a single page rendering every token and primitive in the same section order as the reference (01–14), so the user can compare it side by side with the PNG. It's the manual-test surface; flagged in the report so the user can delete or keep it.
8. **Placement**: files go in the current root app. When the repo is split into `web/` + `studio/`, these move to `web/` unchanged.
9. `app/page.tsx` and metadata: update metadata title to "Vertex" / description from the reference; leave the home page body for the catalog task (only remove Geist references so it still builds).

## Files expected to touch
- `package.json`, `package-lock.json` (add `lucide-react`, `clsx`)
- `app/globals.css`, `app/layout.tsx`, `app/page.tsx` (minimal)
- `app/design-system/page.tsx` (new)
- `components/ui/{button,badge,status-indicator,progress-bar,input,select,card,course-card,lesson-card,resource-card,logo,breadcrumbs,pagination,nav-link,index}.tsx|ts` (new)
- `lib/cn.ts` (new, clsx re-export)

## Requirements
- Exact values from the reference; no restyling or "improvements".
- Responsive: preview page and cards stack to one column on mobile; desktop matches the reference.
- All primitives are Server Components (no `"use client"`) — none need state. Accessible: focus-visible rings, disabled attrs, labels for inputs, aria on progress/breadcrumbs/pagination.
- No hardcoded hex in components — only token classes.

## Security considerations
- None material: no data, tokens, env, or network. New deps are well-known, widely used packages (`lucide-react`, `clsx`).
- External links in `ResourceCard` use `rel="noopener noreferrer"` with `target="_blank"`.

## Acceptance criteria
- `/design-system` renders all 14 sections and visually matches `design/vertex-designsystem.png` on desktop.
- Body text is Inter; display headings are Playfair Display.
- Tokens are usable as Tailwind utilities (`bg-primary-500`, `text-neutral-700`, `rounded-md`, `shadow-lg`, `text-h1`, `font-display`).
- Button hover/disabled, input focus, and select states behave as shown.
- Type check, lint, and production build pass.

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` and load `/design-system`

## Manual test steps
1. `npm run dev`
2. Open http://localhost:3000/design-system.
3. Compare each numbered section to `design/vertex-designsystem.png` side by side.
4. Hover each button variant; tab to the search input and confirm the orange focus border; tab through pagination/breadcrumbs to see focus rings.
5. Narrow the window to ~375px: sections and cards stack, nothing overflows horizontally.
