# Implementation prompt: Seed sample content in Sanity

## Goal
Give the catalog and cross-course search real data: a handful of instructors and categories and at least 10 programming / dev / AI courses with modules and lessons, with consistent relations (module = sum of its lessons, course = sum of its modules).

## Skills / docs read
- `AGENTS.md` §5, §7, §8, §12, §13.
- `sanity-best-practices` (import via NDJSON, `_sanityAsset` image import, `_key` on array items).
- `prompts/sanity-content-model.md` (the schema contract this seed must satisfy).

## Code and data inspected
- `studio/schemaTypes/**`: course, lesson, instructor, category, module, learningOutcome, resource, lessonNotes.
- `lib/sanity/queries.ts`: course totals are **derived**, not stored: `lessonCount = count(modules[].lessons[])`, `durationSeconds = math::sum(modules[].lessons[]->duration)`. Module totals can be derived the same way. So "module = sum of lessons, course = sum of modules" holds by construction if lesson data is correct and each lesson sits in exactly one module.
- **Existing untracked seed** `studio/scripts/seed/seed.ndjson` (141 docs) + `videos.json` (YouTube id, title, duration per lesson), **already imported** in the live dataset:
  - 6 categories (Web Development, AI Engineering, Backend & Infrastructure, Data, Languages, Security), 5 instructors, 10 courses, 120 lessons (4 modules × 3 lessons per course), no drafts.
  - Checks pass: 0 dangling refs, every lesson in exactly one module, 0 orphans, 0 duplicate video URLs, lesson `duration` = real video length for all 120, all array items keyed, Portable Text notes, key points on all lessons, 10 free previews.
  - **Schema drift (must fix):**
    1. Lessons store `thumbnail`; schema/queries use `poster`, so 0 lessons have a poster in the app.
    2. Learning outcome icons `workflow` and `puzzle` are not in the allowed list → Studio validation errors, and the web icon map has no entry for them.
    3. Instructor `bio` is a Portable Text array; schema field is `text` → Studio shows invalid value, and the web gets an array where it expects a string.
    5. *(Found during implementation by the validator)* All 122 resources use type `link`, which is not an allowed resource type. Mapped by host: official docs → `documentation`, OWASP / AWS pages → `article`, GitHub → `repository`.
    4. No course has `icon` (cards and search results show a course icon). `public/courses/` has only `nextjs.svg`, `docker.svg`, `typescript.svg`.

## Decisions & assumptions
1. **Keep the existing content**: it already meets the brief (10 coherent courses, modules whose lessons genuinely cover the module topic). Don't regenerate it; fix the drift.
2. Add `studio/scripts/seed/fix-seed.mjs`, a one-off transform that rewrites `seed.ndjson` in place:
   - `thumbnail` → `poster` (same image + alt).
   - `workflow` → `layers`, `puzzle` → `code` (closest allowed keys).
   - Instructor `bio` → plain text (paragraphs joined with a blank line).
   - Add a course `icon` for every course: reuse `public/courses/{nextjs,docker,typescript}.svg` for those 3 courses; for the other 7, generate simple neutral monogram SVG tiles (e.g. "PY", "PG", "AI") into `studio/scripts/seed/icons/`. No third-party brand logos added. They're imported via `_sanityAsset: "image@file://…"`.
   - Idempotent (safe to re-run).
3. Add `studio/scripts/seed/validate-seed.mjs`, which checks the NDJSON against the schema contract and exits non-zero on failure:
   - Only known fields per type; required fields present; enum values (level, outcome icon, resource type) valid; slugs unique per type; every `_ref` resolves; every array object has a unique `_key`.
   - Each lesson is referenced by exactly one module in exactly one course (no orphans, no sharing), so derived totals add up.
   - Lesson `duration` matches `videos.json`; video URLs are YouTube and unique.
   - Prints a per-course table: modules, lessons, per-module duration, course duration = Σ modules.
4. npm scripts in `studio/package.json`: `seed:validate` and `seed:import` (= validate, then `sanity dataset import scripts/seed/seed.ndjson <dataset> --replace`). `--replace` overwrites whole documents, so the stale `thumbnail` field disappears. Unreferenced old image assets are left alone (harmless).
5. Commit the seed folder (content + scripts). No secrets in it.
6. Out of scope: video documents / transcripts (ingestion task), the Context document, progress records, wiring pages to data.

## Files expected to touch
- New: `studio/scripts/seed/fix-seed.mjs`, `studio/scripts/seed/validate-seed.mjs`, `studio/scripts/seed/icons/*.svg` (7).
- Edited: `studio/scripts/seed/seed.ndjson`, `studio/package.json`.
- Already present, now committed: `studio/scripts/seed/videos.json`.

## Security considerations
- The import uses the logged-in Sanity CLI session; no token is written or printed. Dataset stays private.
- Seed content contains no personal data; instructor names are fictional and photos are stock placeholders (randomuser.me).

## Acceptance criteria
- `npm run seed:validate` passes with 0 errors and prints 10 courses × 4 modules × 3 lessons, each course duration = Σ module durations.
- After import, live dataset: 6 categories, 5 instructors, 10 courses, 120 lessons; `count(*[_type=="lesson" && defined(poster)]) == 120`, `count(*[defined(thumbnail)]) == 0`, `count(*[_type=="course" && defined(icon)]) == 10`, `count(*[_type=="instructor" && bio match "*" ]) == 5` (string bios), and no outcome icon outside the allowed list.
- Studio shows no validation errors on courses, lessons, or instructors.
- GROQ check: for every course, `lessonCount == Σ count(module.lessons)` and `durationSeconds == Σ module durations`.

## Checks to run
- Studio: `node scripts/seed/fix-seed.mjs`, `npm run seed:validate`, `npm run seed:import`, the GROQ checks above via `npx sanity documents query`, `npx tsc --noEmit`, `npx sanity schema validate`.
- Web: `npx tsc --noEmit`, `npm run lint` (no web code changes expected; sanity check only).

## Manual test steps
1. `cd studio && npm run seed:validate` → see the per-course table and "0 errors".
2. `npm run dev`, open http://localhost:3333 → Courses lists 10 courses, each with an icon; open one → 4 modules, 3 lessons each; open a lesson → poster set, no validation warnings; open an instructor → plain text bio.
3. In Vision, run `*[_type=="course"]{title, "lessons": count(modules[].lessons[]), "mins": math::sum(modules[].lessons[]->duration)/60}`.
