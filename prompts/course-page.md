# Implementation prompt: Course detail page

## Goal
Add the course detail page at `/courses/[slug]`, reproducing `design/vertex-course.png` ("Vertex" = BrainSpark), wired to the seeded Sanity content through the existing server-only fetch helpers. Sections: site header, breadcrumbs, hero (course icon tile, Popular badge, title, summary, meta row, Continue Learning + Bookmark), "What you'll learn" grid, "Course Content" module accordion with a "Show all N modules" toggle, and the "Your Progress" bar with decorative bars at the bottom. Desktop matches the reference; mobile adapts.

## Skills / docs read
- `AGENTS.md` (§3, §5, §7, §8, §12, §14).
- `sanity-best-practices` patterns already in place: `defineQuery`, TypeGen result types, `urlFor` image builder, server-only client.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` ("With Cache Components": with `generateStaticParams`, `await params` at the top is fine; slugs not in the list render on first request).
- Prior prompts: `vertex-home.md`, `sanity-content-model.md`, `seed-sample-content.md`.

## Code inspected
- `lib/sanity/data.ts`: `getCourseBySlug(slug)` and `getCourseSlugs()` already exist. `COURSE_BY_SLUG_QUERY` returns title, summary, level, popular, studentCount, icon, moduleCount, durationSeconds, learningOutcomes, and modules → lessons (title, slug, duration, freePreview). `COURSE_BY_SLUG_QUERY_RESULT` is generated in `sanity.types.ts`.
- `lib/sanity/image.ts` (`urlFor`), `lib/sanity/fetch.ts` (`'use cache'`, tags).
- `app/page.tsx`: page frame (`bg-canvas bg-hatch`, `max-w-270` bordered frame), `SiteHeader`, inline `BarCluster` decorative bars.
- `components/ui`: `Breadcrumbs`, `Badge` (`popular` variant), `Button`/`buttonClasses`, `ProgressBar`, `Card`.
- `components/header-auth.tsx`: Clerk `<Show when="signed-in">` pattern on the client.
- `next.config.ts`: `cacheComponents: true`; no `images.remotePatterns` yet.
- Seed: 10 courses, each 4 modules × 3 lessons, `icon` set on every course (Next.js icon is the black "N" tile in the reference), outcome icon keys from the schema list.

## Decisions & assumptions
1. **Route** `app/courses/[slug]/page.tsx` (Server Component). `generateStaticParams` from `getCourseSlugs()`; `generateMetadata` uses the course title/summary; unknown slug → `notFound()`.
2. **Hero tile** shows the course `icon` image (matches the black N tile in the reference), not `coverImage` (seeded covers are random stock photos). Rendered with `next/image` from `cdn.sanity.io`; add `images.remotePatterns` for `cdn.sanity.io` in `next.config.ts`.
3. **Meta row**: level (capitalised), total duration (`18h 24m` format from `durationSeconds`), `N modules`, student count (`2.1k students`). Shared formatters in new `lib/format.ts` (`formatDuration`, `formatCount`).
4. **Popular badge** only when `popular` is true (existing `Badge variant="popular"`, sized to the reference).
5. **Continue Learning** links to the first lesson of the first module. Progress tracking does not exist yet, so there is no real "resume" lesson; the progress task will swap the target. **Lesson URL convention:** `/courses/[slug]/lessons/[lessonSlug]` (the lesson page is a later task; links 404 until then).
6. **Bookmark** has no backend and is not listed in AGENTS.md. It is a presentational client toggle (`aria-pressed`, filled icon when on), not persisted.
7. **What you'll learn**: 2-column grid of outcome cards; outcome `icon` key → lucide icon map (`rocket, layers, database, zap, shield, code, gauge, server, globe, sparkles`) in primary colour, thin stroke. Section hidden if a course has no outcomes.
8. **Course Content**: header shows `N modules • total duration`. Each module row: numbered circle (derived from order), title, summary, module duration (sum of its lessons), chevron. Rows are native `<details>/<summary>` (no JS) and expand to the module's lessons: `Lesson M.L` label, title link, duration, "Free preview" badge when set. Client component `CourseModules` shows the first 6 modules and a "Show all N modules" / "Show fewer" toggle only when there are more than 6 (seed courses have 4, so no toggle appears with seeded data).
9. **Your Progress bar**: progress records don't exist yet, so this renders only for signed-in learners (Clerk `<Show when="signed-in">`, same pattern as the header) at **0% complete** with "Continue Learning" → first lesson. The progress task replaces the 0 with real data. It sits at the bottom of the frame, sticky to the viewport bottom, over the decorative bars as in the reference.
10. **Decorative bars**: extract the home page's `BarCluster` + bar data into `components/decorative-bars.tsx` and reuse it on both pages (home renders unchanged).
11. **Breadcrumbs**: "All Courses" (`/courses`) › course title, using `Breadcrumbs` with a new optional `className` to match the reference size.
12. **Instructor** is not shown in the reference, so it is not added to this page (no invented UI). Flagged in the report.
13. Home page course cards still link to placeholder slugs (`nextjs-for-production`, ...) that do not exist in Sanity, so they 404. Wiring the home/catalog to Sanity is out of scope; flagged.

## Files expected to touch
- `app/courses/[slug]/page.tsx` (new)
- `components/course/course-modules.tsx` (new, client: show-all toggle; rows are `<details>`)
- `components/course/bookmark-button.tsx` (new, client)
- `components/course/course-progress-bar.tsx` (new, client: signed-in only)
- `components/course/outcome-icon.tsx` (new, icon key map)
- `components/decorative-bars.tsx` (new, extracted from home)
- `app/page.tsx` (use extracted bars)
- `components/ui/breadcrumbs.tsx` (optional `className`)
- `lib/format.ts` (new)
- `next.config.ts` (`images.remotePatterns` for `cdn.sanity.io`)

## Requirements
- Match the reference on desktop: layout, spacing, type, colour, states. Reuse the tokens and primitives.
- Responsive to ~375px: hero stacks (tile above text, smaller), outcome grid becomes 1 column, module rows wrap duration under text, progress bar stacks label/bar/CTA, no horizontal overflow.
- All content comes from Sanity; nothing about the course is hardcoded.
- Only the toggle, bookmark and progress bar are client components; data is passed to them as plain props.
- Accessible: `<main>`, heading order, `aria-expanded` on the show-all toggle, `aria-pressed` on bookmark, labelled progressbar, visible focus rings, decorative bits `aria-hidden`.

## Security considerations
- Content is fetched server side with the existing server-only client and read token; no token or Sanity client reaches the browser.
- Client components receive only already-public display data (strings, numbers, hrefs).
- Images load from Sanity's public CDN; `remotePatterns` is limited to `https://cdn.sanity.io/images/**`.
- No writes. Bookmark and progress are display only.

## Acceptance criteria
- `/courses/nextjs-app-router-in-depth` renders the seeded course: icon tile, Popular badge, title, summary, Intermediate · duration · 4 modules · 18.2k students, 4 outcomes, 4 modules with correct summaries and durations.
- Expanding a module lists its 3 lessons with `Lesson M.L` labels and durations; lesson links go to `/courses/<slug>/lessons/<lessonSlug>`.
- A non-popular course (e.g. `react-performance-engineering`) has no Popular badge.
- `/courses/does-not-exist` returns the 404 page.
- Signed out: no progress bar. Signed in: progress bar at 0% with Continue Learning.
- Home page looks unchanged.
- Type check, lint and production build pass.

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev`, load the course URLs above

## Manual test steps
1. `npm run dev`
2. Open http://localhost:3000/courses/nextjs-app-router-in-depth and compare with `design/vertex-course.png`.
3. Click a module row: it expands to its lessons. Click it again: it collapses.
4. Click Bookmark: icon fills and the button toggles. Reload: it resets (not persisted, by design).
5. Sign in via the header: the "Your Progress" bar appears at the bottom at 0%. Sign out: it disappears.
6. Open http://localhost:3000/courses/react-performance-engineering: no Popular badge.
7. Open http://localhost:3000/courses/does-not-exist: 404.
8. Narrow the window to ~375px: hero stacks, outcomes stack, no horizontal scroll.
9. Open http://localhost:3000: home looks unchanged.
