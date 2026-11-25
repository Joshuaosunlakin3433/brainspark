# Implementation prompt: Sanity content model, standalone Studio, server-side data layer

## Goal
Model the BrainSpark course content in Sanity (course, module, lesson, instructor, category), run it in a **standalone Studio workspace**, and give the Next.js app a **server-only read client and data layer** (typed GROQ queries + fetch helpers) that the catalog, course, lesson, and instructor pages will use next.

Out of scope (later tasks): video documents and ingestion, the agent context document, progress records, wiring pages to real data (the home page keeps `lib/placeholder-courses.ts`), Portable Text rendering, seed content, Live/Visual Editing.

## Skills / docs read
- `AGENTS.md` §5 (two workspaces, server-only data access), §6 (no embedded Studio, no public dataset, no client token), §7, §8 (fixed data shape), §12, §13.
- `sanity-best-practices`: `SKILL.md`, `references/project-structure.md`, `references/typegen.md`, `references/nextjs.md`, `references/schema.md`.
- `next-sanity` 13.5.1 type docs for `defineLive` + `cacheComponents` (`dist/live/conditions/next-js/index.d.ts`, `dist/live/cache-life.d.ts`).
- Next.js 16 docs: `01-directives/use-cache.md`, `04-functions/cacheLife.md`.

## Code inspected
- Uncommitted `sanity init` output: `sanity.config.ts`, `sanity.cli.ts`, `app/studio/[[...tool]]/page.tsx` (**embedded Studio**), `sanity/env.ts`, `sanity/lib/{client,image,live}.ts`, empty `sanity/schemaTypes/index.ts`, `sanity/structure.ts`. Root `package.json` gained `sanity`, `@sanity/vision`, `styled-components`, `next-sanity`, `@sanity/image-url`.
- `next.config.ts`: `cacheComponents: true` → data fetches go behind a `'use cache'` boundary.
- `.env.local` keys present (values not read): `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, Clerk keys. No Sanity read token yet.
- `tsconfig.json` includes `**/*.ts`; `eslint.config.mjs` ignores vendored skill dirs; `.gitignore` ignores `.env*` except `.env.example`.
- `lib/placeholder-courses.ts`: the shape the home page expects (slug, title, summary, level, duration, moduleCount, icon). Queries will be able to produce this.

## Decisions & assumptions
1. **Standalone Studio in `studio/`** (own `package.json`, `sanity.config.ts`, `sanity.cli.ts`, `tsconfig.json`, `schemaTypes/`). The Next.js app **stays at the repo root** as the web workspace; moving it into `web/` would churn Clerk/Tailwind/paths for no gain. Delete the embedded Studio: `app/studio/`, root `sanity.config.ts`, root `sanity.cli.ts`, `sanity/structure.ts`, `sanity/schemaTypes/`, `sanity/lib/live.ts`. Remove `sanity`, `@sanity/vision`, `styled-components` from root deps.
2. **Web data layer moves to `lib/sanity/`** (replacing root `sanity/`), all files `import "server-only"`:
   - `env.ts`: project id, dataset, api version from env; `SANITY_API_READ_TOKEN` (server-only, required).
   - `client.ts`: `createClient` with the read token, `useCdn: true`, `perspective: "published"`.
   - `fetch.ts`: `sanityFetch({ query, params, tags })` wrapped in `'use cache'` + `cacheLife("minutes")` + `cacheTag("sanity", ...tags)`. No `defineLive`/`<SanityLive />`: on a private dataset the browser would need a token for live events, which §12 forbids. Content refreshes within ~1 minute; a webhook revalidate route can come later.
   - `image.ts`: `urlFor()` via `@sanity/image-url` (no token needed; asset URLs are public CDN URLs).
   - `queries.ts`: `defineQuery` queries (below). `data.ts`: typed getters (`getCourses`, `getCourseBySlug`, `getCourseSlugs`, `getLessonBySlug`, `getLessonSlugs`, `getInstructorBySlug`, `getInstructorSlugs`, `getCategories`).
3. **Schema (Studio `schemaTypes/`)**, `defineType`/`defineField`/`defineArrayMember`, icons from `@sanity/icons/<Name>` subpaths:
   - `category` (doc): `title`*, `slug`*, `description` (text).
   - `instructor` (doc): `name`*, `slug`*, `photo` (image, hotspot, alt), `expertise` (array of strings, tags layout), `bio` (text).
   - `lesson` (doc): `title`*, `slug`* (unique across lessons), `videoUrl`* (url, validated to a YouTube / Vimeo / Bunny host), `poster` (image, hotspot, alt), `duration`* (number, **seconds**, integer ≥ 1), `freePreview` (boolean, default false), `studentCount` (number ≥ 0), `notes` (Portable Text: normal/h2/h3/blockquote, bullet/number lists, strong/em/code marks, link annotation, inline image with alt), `keyPoints` (array of strings), `proTip` (text), `resources` (array of `resource` objects).
   - `resource` (object): `type`* (radio list: article, documentation, repository, download, video), `title`*, `description` (text), `url`* (url).
   - `course` (doc): `title`*, `slug`*, `summary`* (text, ≤ 200), `coverImage` (image, hotspot, alt), `icon` (image, the small course logo the cards/search results show), `level`* (radio: beginner, intermediate, advanced), `price` (number ≥ 0, USD; 0 = free), `popular` (boolean), `studentCount` (number ≥ 0), `learningOutcomes` (array of `learningOutcome`, max 8), `instructor`* (ref), `category`* (ref), `modules` (array of `module`). Fieldsets/groups: Content, Marketing, Outcomes.
   - `learningOutcome` (object): `icon`* (string from a fixed list of icon keys, e.g. `rocket`, `layers`, `database`, `zap`, `shield`, `code`, `gauge`, `server`, `globe`, `sparkles`; the web maps keys to lucide icons), `title`*, `description` (text).
   - `module` (object, embedded, not a document): `title`*, `summary` (text), `lessons` (array of references to `lesson`, unique). Module/lesson numbers are **not stored**; derived from order.
   - Previews: course shows level + module count; module shows lesson count; lesson shows duration (`mm:ss`) and "Free preview".
   - Lesson does **not** store its course; queries derive it with `references(^._id)`.
4. **Derived values in GROQ, not stored:** `moduleCount`, `lessonCount`, course `durationSeconds = math::sum(modules[].lessons[]->duration)`. Lesson numbering comes from module/lesson array order.
5. **Queries** (unique names for TypeGen):
   - `COURSES_QUERY`: catalog cards incl. category, instructor (name/slug/photo), icon, cover, level, price, popular, studentCount, counts, duration.
   - `COURSE_BY_SLUG_QUERY`: full course incl. outcomes, instructor, category, `modules[]{_key, title, summary, lessons[]->{_id, title, slug, duration, freePreview, poster}}`.
   - `LESSON_BY_SLUG_QUERY`: all lesson fields + `course` via reverse reference with its outline (modules → lessons) and instructor, for the sidebar and breadcrumb.
   - `INSTRUCTOR_BY_SLUG_QUERY`: instructor + their courses (reverse reference) as cards.
   - `COURSE_SLUGS_QUERY`, `LESSON_SLUGS_QUERY` (lesson slug + parent course slug), `INSTRUCTOR_SLUGS_QUERY`, `CATEGORIES_QUERY`.
6. **TypeGen** configured in `studio/sanity.cli.ts`: scan `../{app,components,lib}/**/*.{ts,tsx}`, schema `studio/schema.json`, output `../sanity.types.ts` (committed, Option A), `overloadClientMethods: true`, extract with `--enforce-required-fields`. Root script `npm run typegen` proxies to the Studio.
7. **Studio env:** `studio/.env` with `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`, copied from the root `.env.local` values by a script that never prints them. `studio/.env.example` committed. Studio structure: Courses, Lessons, Instructors, Categories.
8. **Sanity project setup via CLI** (I'll run these if the CLI is logged in; otherwise they're on you): set dataset visibility to **private**; create a **Viewer** token `brainspark-web-read` and write it to `.env.local` as `SANITY_API_READ_TOKEN` without printing it; add CORS origin `http://localhost:3333 --credentials` for local Studio; `sanity schema deploy`; `sanity deploy` (needed later by the Context MCP; the hostname prompt is interactive, so you may need to run it).
9. Root `tsconfig.json` and `eslint.config.mjs` exclude `studio/`. `.gitignore` adds `node_modules` (unanchored), `studio/dist`, `studio/.sanity`.

## Files expected to touch
- New: `studio/{package.json, sanity.config.ts, sanity.cli.ts, tsconfig.json, structure.ts, .env.example, schema.json}`, `studio/schemaTypes/{index.ts, documents/{course,lesson,instructor,category}.ts, objects/{module,learningOutcome,resource,lessonNotes}.ts}`, `lib/sanity/{env,client,fetch,image,queries,data}.ts`, `sanity.types.ts`.
- Edited: `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`, `.env.example` (add Sanity keys, empty values).
- Deleted: `app/studio/`, `sanity.config.ts`, `sanity.cli.ts`, `sanity/`.
- Not committed: `.env.local`, `studio/.env`.

## Requirements
- Fixed relationships from §8: module embedded in course; lessons referenced from modules in order; lesson has no course field; course → instructor/category references.
- Portable Text for notes; no markdown fields anywhere.
- Every array projection includes `_key`; images project `asset`, `hotspot`, `crop`, `alt`.
- Data layer importable only from server code (`server-only`); no Sanity token or client in any client component.

## Security considerations
- `SANITY_API_READ_TOKEN` is server-only (no `NEXT_PUBLIC_`), used only in `lib/sanity/client.ts`; `server-only` guards against client imports.
- Dataset set to private; Viewer role (read only) for the web token. No write token in this task.
- I never print env values or tokens.

## Acceptance criteria
- `npm run dev` in `studio/` serves the Studio at http://localhost:3333 with Courses, Lessons, Instructors, Categories; a course can hold modules that reference lessons in order.
- `/studio` no longer exists in the Next app; `next build` no longer bundles Sanity Studio.
- `sanity.types.ts` contains types for every query; getters return typed data.
- Each query runs against the dataset without GROQ errors (empty results are fine).
- Dataset is private, and the web app reads it only with the server token.

## Checks to run
- Studio: `npx tsc --noEmit`, `npx sanity schema validate`, `npm run typegen`, `npx sanity schema deploy`, run each query with `npx sanity documents query`, `npx sanity deploy` (or hand off).
- Web: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run dev` and load `/`.

## Manual test steps
1. `cd studio && npm run dev`, open http://localhost:3333, log in.
2. Create a Category, an Instructor, and two Lessons (YouTube URL, duration in seconds, notes, key points, a resource).
3. Create a Course: pick instructor + category, add a learning outcome, add a Module and attach both lessons; reorder them. Publish all.
4. In Vision run `*[_type == "lesson"]{title, "course": *[_type == "course" && references(^._id)][0].title}` and see the course title next to each lesson.
5. From the root, `npm run dev`, open http://localhost:3000: home still renders (placeholder data), `/studio` returns 404.
