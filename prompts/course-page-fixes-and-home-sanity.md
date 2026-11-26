# Implementation prompt: Course page fixes + home courses from Sanity

## Goal
1. Clear the dev overlay insight "Next.js encountered URL data outside of Suspense" on `/courses/[slug]`.
2. Resolve the "jumbled" course page seen in the dev browser.
3. Replace the home page's placeholder course list with the seeded Sanity courses.

## Skills / docs read
- `AGENTS.md` (§3, §5, §12, §13).
- `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md` (await `params` inside a component under `<Suspense>`; the page shell stays instant).
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md` (Cache Components + params).
- `sanity-best-practices` patterns already in place (`getCourses()` / `COURSES_QUERY`, `urlFor`).

## Code inspected / findings
- `app/courses/[slug]/page.tsx` awaits `params` at the top of the page component, outside any Suspense boundary. That is what the insight flags.
- **Jumbled layout:** the production CSS and the running dev server's CSS now both contain every class the page uses (`md:flex-row`, `aspect-324/377`, `bottom-0`, `gap-x-9`, ...). A headless Chrome screenshot of `localhost:3000/courses/nextjs-app-router-in-depth` renders correctly. The screenshot showed the page before Tailwind had picked up the newly created files: no tile height, stacked hero, and bars at the top because `bottom-0` was missing. A hard reload fixes it. No code change is needed for this, but I re-verify after the changes below.
- `app/page.tsx` maps `placeholderCourses` (`lib/placeholder-courses.ts`) with local SVG icons in `public/courses/`. Nothing else uses them.
- `getCourses()` returns `COURSES_QUERY` cards: title, slug, summary, level, icon, moduleCount, durationSeconds, ordered `popular desc, title asc`.

## Decisions
1. **Suspense fix (the "Stream" option from the overlay):** the page component renders the static frame and `SiteHeader` immediately, and a `<Suspense>` boundary wraps a new `CourseDetail` server component that awaits `params` and fetches the course. Fallback: a lightweight skeleton with the same layout (tile, title and meta bars, content blocks) so nothing shifts. `generateStaticParams` and `generateMetadata` stay. I'm not using `instant = false` because it would make the route blocking.
2. Unknown slugs still call `notFound()` inside the boundary. I verify the status code after the change and report it as is.
3. **Home from Sanity:** `app/page.tsx` becomes an async server component calling `getCourses()` (server-only, cached `'use cache'` fetch). Card fields: `formatDuration(durationSeconds)`, `capitalize(level)`, `moduleCount`, icon via `urlFor(icon)` in `next/image`. It shows the **first 3** courses (popular first), as in the home design, with "View all courses" for the rest. Cards link to `/courses/<slug>`, which now resolve.
4. Delete `lib/placeholder-courses.ts` and the now-unused `public/courses/*.svg`. The seed has its own copies in `studio/scripts/seed/icons/`.
5. Empty state: if Sanity returns no courses, the grid is not rendered and the rest of the page still shows.

## Files expected to touch
- `app/courses/[slug]/page.tsx`
- `app/page.tsx`
- `lib/placeholder-courses.ts` (delete), `public/courses/{nextjs,docker,typescript}.svg` (delete)

## Security considerations
- All reads stay on the server through the existing server-only client and read token. No client component receives the token or the client.
- Images come from the public Sanity CDN, already allowed in `next.config.ts`.

## Acceptance criteria
- No "URL data outside of Suspense" insight on `/courses/nextjs-app-router-in-depth` in dev.
- The course page renders as in the earlier verified screenshot.
- Home shows 3 Sanity courses (popular first) with their Sanity icons, and each card opens its course page.
- Type check, lint and production build pass.

## Checks to run
- `npx tsc --noEmit`, `npm run lint`, `npm run build`
- Dev server: load `/` and `/courses/nextjs-app-router-in-depth`, check the overlay, and take a headless Chrome screenshot of both.

## Manual test steps
1. With `npm run dev` running, hard-reload http://localhost:3000/courses/nextjs-app-router-in-depth (Ctrl+Shift+R): the layout is correct and the bottom-left Next.js badge shows no insight.
2. Open http://localhost:3000: three courses from Sanity appear with their icons.
3. Click a home course card: its course page opens.
4. Open http://localhost:3000/courses/does-not-exist: the not-found page shows.
