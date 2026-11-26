# Implementation prompt: Lesson page

## Goal
Add the lesson page at `/courses/[slug]/lessons/[lessonSlug]`, reproducing `design/vertex-lesson.png` ("Vertex" = BrainSpark). Wire it to the seeded Sanity content through the existing server-only fetch helpers, and play the lesson's video on the page in the provider's own embedded player. Desktop matches the reference. Mobile adapts.

## Skills / docs read
- `AGENTS.md` (§3, §5, §7, §8, §9, §12, §13).
- `sanity-best-practices` patterns already in the repo: `defineQuery`, TypeGen result types, `urlFor`, server-only client and `'use cache'` fetch.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` (`searchParams` is a promise. With Cache Components, where it is read decides how much of the page prerenders) and `dynamic-routes.md`.
- Prior prompts: `course-page.md`, `posthog-analytics.md`.

## Code inspected
- `lib/sanity/queries.ts`: `LESSON_BY_SLUG_QUERY` already returns the lesson (videoUrl, poster, duration, studentCount, notes, keyPoints, proTip, resources) plus its parent course through a reverse reference (title, slug, level, icon, instructor, full module → lesson outline). `LESSON_SLUGS_QUERY` returns `{ slug, courseSlug }`. Both have generated types in `sanity.types.ts`.
- `lib/sanity/data.ts`: `getLessonBySlug`, `getLessonSlugs` exist.
- `app/courses/[slug]/page.tsx`: page frame (`bg-canvas bg-hatch`, `max-w-270` bordered frame), `SiteHeader`, Suspense + skeleton pattern, lesson URL convention `/courses/[slug]/lessons/[lessonSlug]`.
- `components/course/*`: `BookmarkButton` (presentational), `CourseProgressBar` (Clerk `<Show when="signed-in">`, 0% until progress exists).
- `components/ui`: `Breadcrumbs`, `Badge`, `ResourceCard` (its layout, with a file type and size footer, does not match the lesson design's resource tile).
- `components/analytics/track-on-mount.tsx`, `lib/analytics.ts`: `lesson_viewed` is defined and waiting to be wired. These files are uncommitted PostHog work in the tree. I build on them and do not change them.
- `studio/schemaTypes/documents/lesson.ts`: no summary field. `videoUrl` is validated to YouTube, Vimeo, or Bunny.
- Seed: 120 lessons, all YouTube `watch?v=` URLs. Notes start with one intro paragraph, then an h2 "What this lesson covers" with bullets that repeat `keyPoints`. Resource types are `documentation` and `article` only. 34 lessons have a pro tip. Courses have 4 modules × 3 lessons.
- `package.json`: `@portabletext/react` and `@tailwindcss/typography` are **not installed** (both are in the AGENTS.md stack).

## Decisions & assumptions
1. **Route** `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` (Server Component). `generateStaticParams` comes from `getLessonSlugs()`. `generateMetadata` uses the lesson and course titles. If the lesson is unknown, or its course slug ≠ `[slug]`, the page returns `notFound()`.
2. **Start time** comes from the `?t=<seconds>` query param (a non-negative integer, otherwise ignored). Search results will link here with it later. Only the video block reads `searchParams`, inside its own Suspense boundary, so the rest of the page stays in the static shell.
3. **Video embed** goes in new `lib/video.ts`, a pure function `parseVideoUrl(url)` that returns `{ provider, id, embedUrl(startSeconds) }` or `null`:
   - YouTube (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`): `https://www.youtube-nocookie.com/embed/<id>?rel=0&modestbranding=1&start=<t>`
   - Vimeo (`vimeo.com/<id>`): `https://player.vimeo.com/video/<id>#t=<t>s`
   - Bunny (`iframe.mediadelivery.net/embed|play/<lib>/<id>`): `https://iframe.mediadelivery.net/embed/<lib>/<id>?t=<t>`
   - The iframe sits in the design's rounded dark 16:9 frame and uses the provider's own controls. The design's play bar, CC, and settings icons are a mockup of a player. AGENTS.md §7 forbids building a custom player, so the provider's controls stand in for them. An unknown URL shows a "Video unavailable" state inside the frame. The learner never leaves the site.
4. **Lesson subtitle**: there is no summary field, so the first normal paragraph of `notes` is used as the subtitle under the title, and it is left out of the Overview so it does not appear twice. I am not adding a schema field.
5. **Lesson Content tab**: "Overview" renders the rest of `notes` with `@portabletext/react` and the typography plugin, then "In this lesson you will:" with `keyPoints` (circle-check icons), then the "Pro Tip" callout (only if set), then "Resources" (only if any). A section is hidden when its data is empty.
   - Seeded notes contain an h2 and bullets that repeat `keyPoints`, so seeded pages will show that list twice. That is a content issue and I flag it rather than filter it in code.
6. **Notes tab** is presentational only (AGENTS.md §7). It is a textarea for personal notes held in component state, not persisted, with a small "Notes are not saved yet" hint. The tabs are a small client component with `role="tablist"`, and arrow keys switch tabs.
7. **Header row**: the `Lesson M.L` badge (derived from order), the title (display font), and a bookmark icon button (a presentational toggle, the icon-only variant of the existing `BookmarkButton` pattern). The meta row shows lesson duration, course level, and lesson student count, using `formatDuration`, `capitalize`, and `formatCount`.
8. **Breadcrumbs**: All Courses › course title (→ course page) › module title › lesson title.
9. **Sidebar** (new client component `LessonSidebar`, props are plain data):
   - "← Back to course", then the course icon tile and title. The "N% complete" line and its mini bar show only when signed in, at **0%**, because progress records do not exist yet. Same rule as the course page.
   - "Module X of N" row with a chevron that collapses or expands the module list.
   - The module list is numbered circles with title and total duration. The current module is expanded with a primary-filled number, and each of its lessons shows title and duration. The current lesson shows a dot, "Now playing", and the primary play badge. Other lessons are links with a hollow dot. Every other module is collapsed with a chevron and expands to its lesson links. No completion checks are shown, because there is no progress yet. The progress task adds them.
   - On desktop (`lg+`) it is the left column at the reference width, sticky with its own scroll. Below `lg` it stacks above the content and the module list starts collapsed behind the "Module X of N" toggle, as AGENTS.md §3 asks ("collapse the lesson sidebar").
10. **Prev / Next footer**: the lessons are flattened across modules in course order. The bar holds a "← Previous Lesson" button with the previous lesson's title and duration, and the next lesson's title and duration with a "Next Lesson →" primary button. A side is omitted on the first or last lesson. It sits at the end of the frame, spanning both columns, as in the reference (not sticky).
11. **Resource tiles**: new `LessonResourceCard` matching the design (icon in a bordered square, title, two-line description, external-link icon, whole card is the link, `target="_blank" rel="noopener noreferrer"`). Icons: documentation/article/download → `FileText`. Repository → `FolderGit2`, because lucide v1 has no GitHub brand mark. Video → `CirclePlay`. I am not changing `ResourceCard`, because the design-system page uses it.
12. **Analytics**: `<TrackOnMount event="lesson_viewed" props={{ lessonSlug, courseSlug }} />`. `video_played` and `video_progress` need the provider player APIs and are left for the progress/analytics task.
13. **Install** `@portabletext/react` and `@tailwindcss/typography` (add `@plugin "@tailwindcss/typography";` to `globals.css`). Portable Text images in notes render through `urlFor` and `next/image`, and links open safely.

## Files expected to touch
- `app/courses/[slug]/lessons/[lessonSlug]/page.tsx` (new)
- `components/lesson/lesson-sidebar.tsx` (new, client)
- `components/lesson/lesson-video.tsx` (new, server: iframe frame + unavailable state)
- `components/lesson/lesson-tabs.tsx` (new, client: Lesson Content / Notes)
- `components/lesson/lesson-notes.tsx` (new, Portable Text renderer)
- `components/lesson/lesson-resource-card.tsx` (new)
- `components/lesson/lesson-pager.tsx` (new, prev/next bar)
- `components/course/bookmark-button.tsx` (add an `iconOnly` variant)
- `lib/video.ts` (new)
- `app/globals.css` (typography plugin)
- `package.json`, `package-lock.json` (two deps)

## Requirements
- Match the reference on desktop: two columns, sidebar width, spacing, type, colour, states (now playing, hover, focus). Reuse tokens and primitives.
- Responsive down to ~375px: the sidebar stacks and collapses, the meta row wraps, the video stays 16:9, resource tiles go from 3 columns to 1, the pager stacks its labels, and there is no horizontal overflow.
- All content comes from Sanity. Nothing about the lesson or course is hardcoded.
- Only the sidebar, tabs, bookmark, and analytics are client components, and they receive plain props.
- Accessible: `<main>`, heading order, an iframe `title`, `aria-current` on the now-playing lesson, `aria-expanded` on toggles, tab semantics, visible focus rings, decorative icons `aria-hidden`.

## Security considerations
- Content is fetched server side with the existing server-only client and token. No token or Sanity client reaches the browser.
- `?t=` is parsed as an integer and clamped (≥ 0). It is never interpolated raw into the iframe URL.
- The iframe `src` is built only from a parsed provider id on a fixed allowlist of hosts. Unknown hosts are not embedded. The iframe uses a strict `allow` list (`autoplay; encrypted-media; picture-in-picture; fullscreen`) and `referrerPolicy="strict-origin-when-cross-origin"`.
- Resource and Portable Text links open with `rel="noopener noreferrer"`. Only `http`, `https`, and `mailto` hrefs render as links.
- No writes. Bookmark, notes, and progress are display only.

## Acceptance criteria
- `/courses/nextjs-app-router-in-depth/lessons/nextjs-app-router-in-depth-file-system-routing` renders the lesson: Lesson 1.1 badge, title, subtitle, meta (5m · Intermediate · 18.2k students), the YouTube video playing inline, Overview, key points, pro tip, and the Next.js docs resource.
- Adding `?t=90` starts the video at 1:30.
- The sidebar shows the course, "Module 1 of 4", the current module expanded with this lesson "Now playing", and other modules expandable to lesson links.
- Previous is hidden on the first lesson. Next goes to lesson 1.2. The last lesson of the course has no Next.
- A lesson slug under the wrong course slug returns 404, and so does an unknown slug.
- At 375px the sidebar is collapsed above the content and nothing overflows.
- Type check, lint, and production build pass.

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run dev` and load the URLs above (HTTP 200 / 404 checks)

## Manual test steps
1. `npm run dev`
2. Open http://localhost:3000/courses/nextjs-app-router-in-depth, expand a module, and click a lesson.
3. Compare with `design/vertex-lesson.png`. Press play: the video plays on the page.
4. Add `?t=90` to the URL and reload: playback starts at 1:30.
5. Click Notes, then Lesson Content: the tabs switch. Click the bookmark: it toggles.
6. Use Next Lesson / Previous Lesson to step through, including across a module boundary.
7. Resize to ~375px: the sidebar collapses behind "Module X of N" and the toggle opens it.
