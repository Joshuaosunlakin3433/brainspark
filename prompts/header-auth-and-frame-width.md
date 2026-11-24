# Implementation prompt: header auth controls, sign-in options, page frame width

## Goal
Match the reference screenshots the user supplied after the Clerk setup:
1. Signed out, the header shows a **"Sign in"** text link and a **"Sign up"** orange button. Both open Clerk in a **modal** over the current page instead of navigating to `/sign-in`.
2. The **bell only shows when signed in**. Signed in: bell + profile avatar (UserButton).
3. Clerk offers **Apple, Facebook, Google, plus email or username with a password** (user amendment: keep Apple, Facebook and username).
4. The **side margins (hatched gutters) are narrower**: the content frame is wider.
5. The hero subcopy wraps to two lines, as designed.

## Skills / docs read
- `AGENTS.md` (§3, §5, §7, §12).
- `clerk-nextjs-patterns`, `clerk-cli` skills (modal mode, `config pull` / `config patch --dry-run`).

## Code inspected
- `components/site-header.tsx`: signed-out shows one "Sign in" button (redirect mode); bell is always rendered.
- `app/page.tsx`: frame is `max-w-241` (964px), so on wide screens the gutters grow large. The reference screenshot has the frame at ~1080px on a ~1264px viewport.
- The running dev server (PID 6720, started before Clerk) serves CSS that's **missing `max-w-128`**. That's why the subcopy runs across one wide line. The production build does include it. The fix is a dev server restart, not a code change.
- `design/vertex-home.png`: frame fills ~94% of the 1024px mockup, which also supports narrower gutters.

## Decisions & assumptions
1. **Header, signed out:** `<SignInButton mode="modal">` wrapping a text-style link (`buttonClasses({ variant: "text" })`, primary-500, body-lg), then `<SignUpButton mode="modal">` wrapping the primary `Button` (md). Gap is ~24px, as in the reference.
2. **Header, signed in:** bell (existing markup) + `<UserButton />` sized 40/52px. The bell moves inside `<Show when="signed-in">`.
3. **Suspense fallback** is an empty, fixed-height spacer so the header doesn't jump. It no longer uses the avatar placeholder, since signed-out users now see buttons.
4. **Frame width:** `max-w-241` → `max-w-270` (1080px), with the border breakpoint updated to `min-[1080px]`. Inner paddings and the search bar max width stay as they are, and the course grid widens naturally. This only changes the home page; the design-system page is untouched.
5. **Clerk sign-in methods** (account setting, not code). This uses the `brainspark` development instance only:
   - Pull the current config: `npx -y clerk@latest config pull`.
   - Only if something is missing: patch with a `--dry-run` preview first, then apply. Keep Apple, Facebook, Google and username enabled, and make sure email + password are enabled. If everything is already on, make no config change.
   - Show you the dry-run diff before applying.
6. **Restart the dev server:** stop PID 6720 (your existing `next dev` on port 3000), then start `npm run dev` again so it reloads env vars and regenerates the CSS.
7. The `/sign-in` and `/sign-up` pages stay as fallbacks for the `/my-learning` redirect.
8. Out of scope: the reference shows a white badge and grey subcopy, but `design/vertex-home.png` (the source of truth) shows the peach badge we have, so I'm leaving those.

## Files expected to touch
- `components/site-header.tsx`
- `app/page.tsx` (frame width class only)
- Clerk development instance config (via CLI, no repo file)

## Security considerations
- No keys are read or printed. The config change touches the development instance only.
- Modal mode is still Clerk-hosted UI. No credentials touch our code.

## Acceptance criteria
- Signed out: "Sign in" (text) and "Sign up" (orange button) appear top right, with no bell. Each opens a modal over the home page.
- The modal shows Apple, Facebook and Google buttons, then email/username and password.
- Signed in: bell + avatar appear, and sign-out returns the header to the signed-out state.
- The frame is 1080px max on desktop, so the gutters are visibly narrower. Below 1080px the frame is full width with no borders.
- The subcopy wraps into two lines (~512px).
- `/my-learning` signed out still redirects to `/sign-in`.

## Checks to run
- `npx tsc --noEmit`, `npm run lint`, `npm run build`
- Restart `npm run dev`, then curl `/` and `/my-learning`.

## Manual test steps
1. Open http://localhost:3000 signed out and check the header shows Sign in + Sign up with no bell.
2. Click **Sign up**: a modal opens with Google + email/password. Create an account.
3. After sign-up, the header shows bell + avatar. Sign out from the avatar menu.
4. Click **Sign in**: a modal opens. Sign in.
5. Compare the side margins against your reference screenshot.
