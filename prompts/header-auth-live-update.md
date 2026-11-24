# Implementation prompt: header auth controls update without a refresh

## Goal
After signing in or signing up in the Clerk modal, or signing out from the avatar menu, the header must switch between "Sign in / Sign up" and "bell + avatar" immediately, with no page refresh.

## Cause
`components/site-header.tsx` is a Server Component. Its `<Show>` resolves to Clerk's **server** `Show`, which reads auth from the request once. With `cacheComponents: true`, the modal sign-in doesn't re-render that server output, so the header keeps the signed-out state until a full reload.

## Skills / docs read
- `clerk-nextjs-patterns` skill.
- `node_modules/@clerk/nextjs/dist/types`: in a client module, `Show`, `ClerkLoading`, and `ClerkLoaded` from `@clerk/nextjs` are the client versions (re-exported from `@clerk/react`). They react to session changes.

## Decisions
1. New client component `components/header-auth.tsx` (`"use client"`) holds the auth block: signed-out → `SignInButton mode="modal"` (text link) + `SignUpButton mode="modal"` (orange button); signed-in → bell (presentational) + `UserButton`. Markup and classes are copied unchanged from the current header, so it looks the same.
2. Inside it, `<ClerkLoading>` renders a fixed-height empty spacer (`h-10 sm:h-13`) while Clerk boots, and `<ClerkLoaded>` wraps the `Show` blocks, so there's no flash of the wrong state.
3. `site-header.tsx` stays a Server Component and renders `<HeaderAuth />` in the same slot. The `Suspense` wrapper and the server `Show` import are removed, since the client component doesn't read the request.
4. Nothing else changes: route protection stays in `proxy.ts`, and no keys move.

## Files expected to touch
- `components/header-auth.tsx` (new)
- `components/site-header.tsx`

## Security considerations
- UI-only change. Access control is still enforced server-side in `proxy.ts`. Only the publishable key is used client-side, as before.

## Acceptance criteria
- Sign up or sign in via the modal → the header shows bell + avatar as soon as the modal closes, with no refresh.
- Sign out from the avatar menu → the header shows Sign in / Sign up immediately.
- The signed-out and signed-in headers look identical to the current ones.
- `tsc`, lint, and build pass.

## Checks to run
- `npx tsc --noEmit`, `npm run lint`, `npm run build`
- Dev server: load `/` and confirm the header renders.

## Manual test steps
1. Open http://localhost:3000 signed out.
2. Click **Sign in**, sign in in the modal. The avatar and bell appear without a refresh.
3. Open the avatar menu → **Sign out**. Sign in / Sign up appear without a refresh.
4. Click **Sign up** and create a new account (8+ character password). The header switches straight away.
