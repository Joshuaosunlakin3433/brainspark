# Implementation prompt: TypeScript course icon fix

## Goal
The TypeScript course icon renders as "T  S" with a visible gap between the letters. Redraw it as a tight "TS" in the bottom-right of the blue square, close to the real TypeScript logo, and update the live Sanity course to use it.

## Skills / docs read
- `AGENTS.md` (§5: the Studio workspace owns content tooling, and writes never go through the browser).
- `sanity-best-practices` (asset upload, then patch the reference. Never replace the whole document for a one-field change).

## Code inspected / cause
- `studio/scripts/seed/icons/typescript.svg` (72×72): the T spans x≈14–33.6 and the S starts at x≈40, a ~6 unit gap. Both letters sit centred-left. The gap shows at the 324px hero size.
- The seed imports this file as `course.typescript-for-application-developers.icon` via `_sanityAsset: image@file://./icons/typescript.svg`.
- `studio/sanity.cli.ts` reads the project and dataset from `SANITY_STUDIO_*` env. Seed import uses the CLI login (`sanity dataset import`).

## Decisions
1. **Redraw the SVG:** keep the existing T and S glyph paths, move the S left so it sits about 1.5 units after the T, and shift the pair together towards the bottom-right (letters end about 10 units from the right edge and about 13 from the bottom). Same blue `#3178C6`, same `rx=8`. Check it visually with a headless Chrome render at hero size before uploading.
2. **Update the live dataset without touching anything else:** a one-off script, `studio/scripts/seed/update-course-icon.mjs`, run with `npx sanity exec ... --with-user-token` (your existing CLI login, no new token in env). It:
   - uploads the new SVG as an image asset,
   - patches only `icon.asset._ref` on `course.typescript-for-application-developers` (keeps `alt` and every other field),
   - prints the old and new asset ids.
   I am **not** re-running the full `seed:import --replace`, which would overwrite any Studio edits on all 141 documents.
3. The script takes the course id and the SVG path as arguments, so the same fix works for any other icon later. It refuses to run if the course does not exist.
4. The old asset is left in the dataset (harmless; it can be removed from the Media tab). The web app picks up the new icon within the existing cache window (`cacheLife("minutes")`), because the asset id, and so the image URL, changes.

## Files expected to touch
- `studio/scripts/seed/icons/typescript.svg` (redraw)
- `studio/scripts/seed/update-course-icon.mjs` (new)

## Security considerations
- Uses your Sanity CLI session through `sanity exec --with-user-token`. No token is written to disk or env, and nothing runs in the web app or the browser.
- Writes exactly one asset and one field patch.

## Acceptance criteria
- The rendered SVG shows a tight "TS" in the bottom-right of the blue square.
- In the live dataset, `*[_id=="course.typescript-for-application-developers"][0].icon.asset._ref` is the new asset id, and `icon.alt` is unchanged.
- `/courses/typescript-for-application-developers`, `/courses` and `/` show the new icon (after the cache window, or after a dev server restart).
- `node scripts/seed/validate-seed.mjs` still passes.

## Checks to run
- Headless render of the SVG.
- `npx sanity exec scripts/seed/update-course-icon.mjs --with-user-token -- course.typescript-for-application-developers scripts/seed/icons/typescript.svg` (from `studio/`).
- A GROQ query to confirm the new asset ref.
- `npm run seed:validate` in `studio/`.
- Headless screenshot of the course page.

## Manual test steps
1. Open http://localhost:3000/courses/typescript-for-application-developers: the tile shows a tight "TS" in the bottom-right. If the old icon still shows, wait a minute and reload.
2. Open http://localhost:3000/courses: the TypeScript card shows the new icon.
3. In Studio (http://localhost:3333), open the TypeScript course: its icon is the new one and alt text is still "TypeScript".
