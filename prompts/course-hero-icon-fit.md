# Implementation prompt: Course hero icon fit

## Goal
Fix the course page hero tile. The course icon looks like it does not fit: dark corners show behind it, and it is cropped.

## Code inspected / cause
- `app/courses/[slug]/page.tsx`: the hero tile is `aspect-324/377` (taller than wide) with `bg-neutral-900` and `rounded-md` (12px), and the icon is `object-cover`.
- The seeded course icons are square SVGs with their own rounded background (e.g. `rx=14` of 64, about 70px at hero size). Sanity serves SVGs unchanged, so the crop params are ignored. `object-cover` scales the square up to fill the taller box, which cuts its sides, and the icon's rounded corners expose the dark tile background.

## Decisions
1. Make the tile **square** (`aspect-square`, same 324px desktop width, 240px max on mobile) to match the icon's real shape. Nothing is cropped.
2. Remove the tile's dark background and its clipping radius so the icon's own rounded corners show cleanly on the page canvas, the way the home and catalog cards show icons.
3. Request the image as a square (`width(648).height(648)`) and keep `object-cover`. A square box fits a square image exactly, and non-square raster icons added later still fill neatly.
4. **Found while verifying:** in the desktop row layout, the tile stretched to the height of the text column, which overrode its aspect ratio. Added `self-start` so the aspect ratio holds.
5. Update the loading skeleton tile to `aspect-square` too, so nothing shifts when the content streams in.

## Files expected to touch
- `app/courses/[slug]/page.tsx`

## Security considerations
- None. A styling-only change.

## Acceptance criteria
- On `/courses/building-ai-apps-with-llms` and `/courses/practical-web-security`, the icon fills its tile with no dark corners and no cropped edges.
- Type check and lint pass.

## Checks to run
- `npx tsc --noEmit`, `npm run lint`, headless screenshot of both course pages.

## Manual test steps
1. Open http://localhost:3000/courses/practical-web-security: the "Sec" tile is a clean rounded square with no dark corners.
2. Open http://localhost:3000/courses/nextjs-app-router-in-depth: the black N tile is fully visible.
