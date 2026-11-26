# Implementation prompt: All Courses page

## Goal
Add `/courses`, a simple catalog listing every seeded Sanity course. The header nav "Courses", "Explore Courses", "View all courses" and the course page breadcrumb already link here.

## Skills / docs read
- `AGENTS.md` (§3, §5, §14 "keep it small").
- Existing patterns: `app/page.tsx` (All Courses grid), `app/courses/[slug]/page.tsx` (frame, breadcrumbs).

## Code inspected
- `getCourses()` / `COURSES_QUERY`: all courses, `popular desc, title asc`, with icon, level, moduleCount, durationSeconds.
- `CourseCard layout="stacked"`, `SiteHeader`, `DecorativeBars`, `lib/format.ts`, `urlFor`.

## Decisions
1. **No reference image** exists for this page, so I invent no new visuals. It reuses the home page's "All Courses" section as is: same frame and canvas, same Playfair heading, same 3/2/1-column grid of stacked `CourseCard`s, and decorative bars at the bottom.
2. Header: breadcrumb "Home › All Courses", an `h1` "All Courses", and a count line ("10 courses").
3. Every course is shown, with no pagination, filters or sort (keep it simple; 10 seeded courses).
4. Empty state: "No courses yet." text if Sanity returns none.
5. Static route. Data comes from the existing cached server fetch. No params, so no Suspense needed.
6. Extract the card mapping (Sanity course → `CourseCard` props) into `components/course/course-grid.tsx` so home and catalog share it.

## Files expected to touch
- `app/courses/page.tsx` (new)
- `components/course/course-grid.tsx` (new, server component)
- `app/page.tsx` (use `CourseGrid`)

## Security considerations
- Server-only reads through the existing client and token. No client components, and nothing sent to the browser beyond rendered HTML.

## Acceptance criteria
- `/courses` lists all 10 seeded courses, popular first, and each card opens its course page.
- The home page looks unchanged.
- Type check, lint and build pass, and `/courses` prerenders as static.

## Checks to run
- `npx tsc --noEmit`, `npm run lint`, `npm run build`, headless screenshot of `/courses` and `/`.

## Manual test steps
1. Open http://localhost:3000/courses: 10 course cards, "10 courses" count.
2. Click a card: its course page opens. Click the "All Courses" breadcrumb: back here.
3. Click "Courses" in the header and "View all courses" on home: both land here.
4. Narrow to ~375px: one column, no horizontal scroll.
