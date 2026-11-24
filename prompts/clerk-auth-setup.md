# Implementation prompt: Clerk authentication setup

## Goal
Add Clerk authentication to the BrainSpark Next.js app using the Clerk application already selected in the Clerk Dashboard (`app_3MZL2Xn8a4DQFIhNDygbKsrHTFM`). Browsing stays public. Replace the placeholder avatar in the site header with real auth controls. No progress tracking, no user records, no other features in this task.

## Skills / docs read
- `AGENTS.md` (§5, §6, §7, §12, §13).
- Clerk setup instructions pasted by the user (Dashboard-selected app branch).
- Clerk skills already installed in the project under `.agents/skills/` (`clerk`, `clerk-setup`, `clerk-cli`, `clerk-nextjs-patterns`, …), so `init` runs with `--no-skills`.

## Code inspected
- `package.json`: Next.js 16.4.6, React 19.3, npm (`package-lock.json`). No auth dependencies.
- `next.config.ts`: `cacheComponents: true` → any request-reading auth UI must sit inside `<Suspense>`.
- No `middleware.ts` / `proxy.ts`. No existing auth anywhere in `app/`, `components/`, `lib/`.
- `app/layout.tsx`: root layout, `<body className="flex min-h-full flex-col">`.
- `components/site-header.tsx`: placeholder round avatar marked "replaced by Clerk's UserButton in the auth task".
- `components/ui`: `Button` / `buttonClasses` available for a signed-out control.
- `.gitignore` ignores `.env*` (so `.env.example` needs an exception). Env files were not read.
- Node v22.21.1 (≥ 20.9.0 required).

## Decisions & assumptions
1. **Existing app, not accountless.** Run `npx -y clerk@latest init --app app_3MZL2Xn8a4DQFIhNDygbKsrHTFM --no-skills` from the repo root. The CLI must be signed in first: **you run `npx -y clerk@latest auth login` in your own terminal** (I can't do the browser login). `init` installs `@clerk/nextjs`, writes dev keys to the env file, and creates `proxy.ts` (Next 16 naming).
2. **`ClerkProvider` inside `<body>`** in `app/layout.tsx` (current SDK rule).
3. **`proxy.ts`** uses `clerkMiddleware()`. Everything is public by default. `/my-learning(.*)` is marked protected with `createRouteMatcher` + `auth.protect()`, since it shows per-learner progress (§7). More routes get protected only when their feature says so.
4. **Header controls** (no design reference exists for these, so keep them minimal and reuse what's there):
   - Signed in: Clerk `<UserButton />` in the avatar slot, sized to the existing 40px / 52px circle via `appearance`.
   - Signed out: a single "Sign in" control using `SignInButton` wrapping the existing `Button` (small size), in the same slot. Sign-up is reachable from Clerk's sign-in flow.
   - Wrapped in `<Suspense>` with the current placeholder avatar as the fallback, so `cacheComponents` builds pass and layout doesn't shift.
   - Bell button stays as is (presentational).
5. **Sign-in/sign-up pages:** if `init` creates catch-all `app/sign-in/[[...sign-in]]` / `app/sign-up/[[...sign-up]]` pages, keep them and wrap `<SignIn />` / `<SignUp />` in `<Suspense>`. If it doesn't, use Clerk's hosted pages (no extra files).
6. **`.env.example`** committed with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=` and `CLERK_SECRET_KEY=` (empty values), plus `!.env.example` in `.gitignore`.
7. No theming beyond sizing the UserButton; no Organizations; no sign-in method changes (asked about afterwards).

## Files expected to touch
- `package.json`, `package-lock.json` (via `init`)
- `proxy.ts` (new, via `init`, then edited for the protected matcher)
- `app/layout.tsx` (ClerkProvider)
- `components/site-header.tsx` (auth controls)
- `app/sign-in/...`, `app/sign-up/...` (only if `init` creates them)
- `.env.local` (written by `init`, not read or committed)
- `.env.example` (new), `.gitignore` (exception)

## Requirements
- Use `@clerk/nextjs` (current generation, `<Show>` control component).
- `await auth()` wherever it's used.
- All auth-dependent server-rendered UI inside `<Suspense>`.
- Browsing `/` and `/design-system` works signed out.

## Security considerations
- `CLERK_SECRET_KEY` stays server-only; only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` reaches the browser.
- Route protection lives in `proxy.ts`, not in client code.
- I never read, print, or commit env files or the claim/keys files.
- No new Clerk application is created; the Dashboard-selected app is used.

## Acceptance criteria
- `npx -y clerk@latest doctor` reports no blocking problems.
- Signed out: header shows "Sign in"; clicking it opens the Clerk sign-in flow.
- Signed in: header shows the Clerk avatar (UserButton) in the avatar slot, with sign-out working.
- Visiting `/my-learning` signed out redirects to sign-in.
- `.env.example` is tracked by git; `.env.local` is not.

## Checks to run
- `npx -y clerk@latest doctor`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build` (config + proxy changed)
- `npm run dev` and load `/`

## Manual test steps
1. In your own terminal: `npx -y clerk@latest auth login` (before I run `init`).
2. After implementation: `npm run dev`, open http://localhost:3000.
3. Header shows "Sign in". Click it, sign up with your email.
4. After sign-in, your profile avatar appears where the placeholder was. Open it and sign out.
5. Signed out, visit http://localhost:3000/my-learning → you're sent to sign-in.
