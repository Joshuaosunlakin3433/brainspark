# Implementation prompt: PostHog product analytics

## Goal
Add PostHog product analytics to the web app, following AGENTS.md §5, §7 and §12:
- the browser uses only the public project key
- learners are identified by their Clerk user id
- there is one typed place to fire the engagement events, so later features (lesson page, video, progress, search page) send them with one line each

Wire the events for the surfaces that exist today, and define the rest so they're ready.

This replaces the PostHog wizard. The wizard's `self-driving` mode is a separate paid product (an agent with GitHub access) and is out of scope.

## Skills / docs read
- `AGENTS.md`: §5 (analytics boundary), §7 (events to instrument), §12 (public vs private PostHog keys), §14.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md`. This file runs before hydration and is the Next 16 place for client analytics init. Only synchronous top-level code is guaranteed to run first, and it should stay under ~16ms.
- `node_modules/next/dist/docs/.../next-config-js/rewrites.md`, for the ingest proxy.
- PostHog's Next.js package docs (`posthog-js`).

## Code inspected
- `app/layout.tsx`: `ClerkProvider` wraps the body. There's no analytics yet.
- `proxy.ts`: Clerk middleware. Only `/my-learning` is protected, and everything else is public.
- `next.config.ts`: has `cacheComponents` and `partialPrefetching`, and no rewrites.
- `.env.example`: Clerk and Sanity keys. There are no PostHog keys.
- `components/home-search.tsx`: a client form that pushes `/search?q=`. This is the only search trigger today, since there is no search page yet.
- `app/courses/page.tsx`: the catalog, a server component.
- These don't exist yet: the lesson page, video embed, progress route and search results page.

## Decisions
1. **Package**: only `posthog-js`. There's no server-side capture yet, so no `posthog-node` and no private key. Add those when a server route needs them, per §12.
2. **Init in `instrumentation-client.ts`** (project root), the Next 16 convention.
   - Call `posthog.init(NEXT_PUBLIC_POSTHOG_KEY, { api_host: "/ingest", ui_host, defaults: "<current posthog-js defaults date>" })`.
   - With `defaults`, pageviews and pageleaves are captured on App Router navigation, so there's no manual pageview code.
   - If the key is missing, init is skipped and every capture does nothing. Dev without a key must not crash.
3. **Ingest proxy**: add rewrites in `next.config.ts` from `/ingest/static/:path*` and `/ingest/:path*` to the PostHog host, plus `skipTrailingSlashRedirect: true`, as PostHog recommends. This stops ad blockers from dropping events. The host region (US or EU) comes from env, not hardcoded.
4. **Identify with Clerk**: a small client component, `components/analytics/posthog-identify.tsx`, inside `ClerkProvider`.
   - It calls `posthog.identify(userId)` on sign-in and `posthog.reset()` on sign-out.
   - It sends only the Clerk user id: no email or name. Anonymous browsing stays anonymous.
5. **One typed event helper**: `lib/analytics.ts` exports `track(event, props)`, with a union of event names and their props:
   - `catalog_viewed`: no props.
   - `search_performed`: `{ query, source: "home" | "search_page" }`.
   - `lesson_viewed`: `{ lessonSlug, courseSlug }`. Defined, wired later.
   - `video_played`: `{ lessonSlug, provider, startSeconds }`. Defined, wired later.
   - `video_progress`: `{ lessonSlug, percent: 25 | 50 | 75 | 100 }`. Defined, wired later.
   - `lesson_completed`: `{ lessonSlug, courseSlug }`. Defined, wired later.
6. **Wired now**:
   - `catalog_viewed` on `/courses`, through a tiny client `<TrackOnMount event="catalog_viewed" />`, so the page stays a server component.
   - `search_performed` (`source: "home"`) on the home search submit.
7. **Search query text is captured** because it's the core product signal. Flag: if you'd rather not store raw queries, I'll send only the query length.
8. Session replay, surveys, feature flags and autocapture tuning are left at PostHog defaults and not configured. Nothing beyond §7.

## Files expected to touch
- `package.json` / `package-lock.json` (add `posthog-js`)
- `instrumentation-client.ts` (new)
- `lib/analytics.ts` (new)
- `components/analytics/posthog-identify.tsx` (new, client)
- `components/analytics/track-on-mount.tsx` (new, client)
- `app/layout.tsx` (mount `PostHogIdentify` inside `ClerkProvider`)
- `app/courses/page.tsx` (mount `TrackOnMount`)
- `components/home-search.tsx` (fire `search_performed`)
- `next.config.ts` (ingest rewrites, `skipTrailingSlashRedirect`)
- `.env.example` (PostHog vars)

## Env
```
# PostHog (https://posthog.com). The project key is public by design.
NEXT_PUBLIC_POSTHOG_KEY=
# https://us.i.posthog.com or https://eu.i.posthog.com, matching your project's region
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```
You add your `phc_...` key to `.env.local`. I don't read or print it.

## Security considerations
- Only `NEXT_PUBLIC_POSTHOG_KEY` (public by design) reaches the browser. No private PostHog API key is added.
- The identify call sends only the opaque Clerk user id, with no email, name or other PII.
- No Sanity token, Clerk secret or content data passes through analytics.
- The `/ingest` rewrite only forwards to PostHog's host. It's public and not gated by Clerk, which is correct: anonymous visitors are tracked too.

## Acceptance criteria
- With a key set, PostHog Live Events shows `$pageview` on home, `/courses` and a course page, `catalog_viewed` on `/courses`, and `search_performed` with the query after a home search.
- After you sign in, later events carry the Clerk user id as `distinct_id`. After you sign out, the identity resets.
- Requests go to `localhost:3000/ingest/...`, not directly to posthog.com.
- With no key set, the app runs with no errors and sends no analytics requests.
- Type check, lint and build pass.

## Checks to run
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (config and routes change)
- `npm run dev`, then smoke test the pages above

## Manual test steps
1. Put your PostHog project key and host in `.env.local` and restart `npm run dev`.
2. Open http://localhost:3000. DevTools Network should show requests to `/ingest/...`.
3. Go to `/courses`. Then open a course.
4. Back on home, type a query in the search and press Enter.
5. In PostHog, open Activity → Live events. You should see `$pageview`s, `catalog_viewed` and `search_performed` (with `query`).
6. Sign in, then trigger another pageview. The person's distinct id is now your Clerk user id (`user_...`).
7. Sign out. The next events are anonymous again.
