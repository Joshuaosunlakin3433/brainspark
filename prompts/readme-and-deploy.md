# Implementation prompt: Portfolio README + Vercel deployment

## Goal
Make the repo portfolio-ready:
1. Replace the create-next-app README with a project README: what BrainSpark is, how search works, the architecture, the stack, real screenshots, local setup, and an honest feature status.
2. Deploy the web app to Vercel at `brainspark.vercel.app` (already set as the GitHub homepage). The Studio is already deployed by the user.

PostHog is documented as part of the stack. The extra events the user listed are **not** implemented in this task (user decision: portfolio scope). The README lists them as planned.

## Skills / docs read
- `AGENTS.md` §1, §5, §6, §7, §12 (what to describe, the boundaries, and which secrets are server-only).
- `node_modules/next/dist/docs/` deploying guide (Vercel needs no adapter; env vars are set per environment).

## Code / state inspected
- Routes: `/`, `/courses`, `/courses/[slug]`, `/courses/[slug]/lessons/[lessonSlug]` (`?t=` start), `/search`, `/api/search`, `/sign-in`, `/sign-up`, `/design-system`. **Not built:** `/my-learning` (nav link 404s), instructor pages, progress tracking.
- PostHog **live**: `catalog_viewed`, `lesson_viewed`, `search_performed { query, source }`, plus `identify(clerkUserId)`. **Typed, not sent**: `video_played`, `video_progress`, `lesson_completed`. Sent through the `/ingest` rewrite proxy.
- `.env.example` is complete (Clerk, Sanity, Context MCP, Groq, PostHog).
- Repo is public. Vercel CLI v68 is installed but **not logged in**, so I cannot deploy from here non-interactively.
- Current README: the create-next-app boilerplate plus a "Video ingestion" section (kept and moved).

## Decisions
1. **README structure** (concise, scannable for a recruiter in about 60 s, then the detail for an engineer):
   - Title, one-line pitch, live demo link, and Studio note
   - Screenshots (home, search results, lesson page)
   - "How search works": a numbered pipeline (Groq plans stems → server builds weighted GROQ → Context MCP runs lesson + video-moment queries → merge and rank → re-fetch from Sanity → cards), plus the grounding rules
   - An architecture diagram (Mermaid, rendered by GitHub) with the server/client boundary and token rules
   - Tech stack table (each item with why it was used)
   - Feature status: ✅ built / 🛠 planned (progress + resume, My Learning, instructor pages, the remaining PostHog events)
   - Analytics table: event, when it fires, properties, status (live / planned). Covers the user's list plus "search result opened `{ kind, rank }`" as planned.
   - Local setup: both workspaces, env vars (points to `.env.example`), seed, video ingestion, Context endpoint
   - Project structure, key decisions/trade-offs (private dataset, no embeddings → stemmed keyword match, Groq free tier, chapters before transcript)
   - Credits: built with Claude Code as a pair programmer (consistent with the commit attribution); course videos are YouTube embeds owned by their creators
2. **Screenshots**: real captures of the running app (headless Chrome against the local dev server), saved to `docs/screenshots/*.png` at 1280 px wide. Not the `design/` mockups, which show the old "Vertex" name.
3. **Deploy path (Vercel, Git integration)**. I prepare it and the user does the dashboard steps:
   - Import the GitHub repo, root directory `/` (the web app is at the root), framework Next.js, default build.
   - Add every var from `.env.example` for Production and Preview. Every var without `NEXT_PUBLIC_` stays server-only.
   - Clerk: keep the **development** instance keys for now. A Clerk production instance requires a custom domain you own, and `*.vercel.app` doesn't qualify. The dev instance works on vercel.app with a small "Development mode" badge. This is noted in the README and the report.
   - After the first deploy, I verify the live URL: home, `/courses`, a lesson with `?t=`, `/search?q=…`, and the `/api/search` stream.
   - Alternative if the user prefers the CLI: `npx vercel login` (interactive, done by the user), then I run `vercel link`, `vercel env add` and `vercel --prod`.
4. **Small honesty fix**: the My Learning nav link 404s. I leave the nav as designed and list the page as planned. I do not build it in this task.

## Files expected to touch
- `README.md` (rewrite), `docs/screenshots/{home,search,lesson}.png` (new)
- No app code changes.

## Security considerations
- The README and screenshots contain no keys, tokens, org ids, project ids, or emails. Screenshots are taken signed out (no avatar or account details).
- The env instructions repeat which vars are server-only. The Vercel steps never use `NEXT_PUBLIC_` for secrets.
- Public deploy risk: `/api/search` has **no rate limiting**, so anyone can spend the Groq free-tier quota (worst case: searches return "busy", with no bill). Flagged, not fixed here.

## Acceptance criteria
- The README renders on GitHub: the Mermaid diagram draws, screenshots show, and links work.
- Every "built" claim matches the code, and every unbuilt feature is marked planned.
- After the user's Vercel import, `https://brainspark.vercel.app` serves home, courses, a lesson, and working search.

## Checks to run
- `npm run lint` and `npx tsc --noEmit` (unchanged code, sanity only). Markdown preview check.
- Post-deploy: curl the live pages for 200 and run one live `POST /api/search`.

## Manual test steps
1. Open the README on the branch on GitHub. Check the diagram, screenshots, and tables.
2. Vercel → Add New → Project → import `brainspark` → paste the env vars → Deploy.
3. Open the live URL: search "data fetching", click "Watch from …", sign in.
4. Tell me the URL is up and I'll run the live checks.
