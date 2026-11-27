// Removes the "What this lesson covers" heading and its bullet list from lesson notes
// when those bullets repeat the lesson's keyPoints. Idempotent; touches only `notes`.
//
// Usage (from studio/):
//   node scripts/seed/dedupe-notes.mjs --file
//       rewrites scripts/seed/seed.ndjson
//   npx sanity exec scripts/seed/dedupe-notes.mjs --with-user-token
//       patches published lessons in the live dataset (your Sanity CLI login; no token stored)

import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HEADING = 'what this lesson covers'

const blockText = (block) => (block?.children ?? []).map((c) => c.text ?? '').join('').trim()

/** Returns the deduped notes, or null when this lesson does not match the pattern. */
export function dedupeNotes(notes, keyPoints) {
  if (!Array.isArray(notes) || !Array.isArray(keyPoints)) return null
  const h = notes.findIndex(
    (b) => b?._type === 'block' && /^h[23]$/.test(b.style ?? '') && blockText(b).toLowerCase() === HEADING,
  )
  if (h === -1) return null
  let end = h + 1
  while (end < notes.length && notes[end]?._type === 'block' && notes[end].listItem) end++
  const bullets = notes.slice(h + 1, end).map(blockText)
  const same =
    bullets.length === keyPoints.length && bullets.every((text, i) => text === String(keyPoints[i]).trim())
  if (!same) return null
  return [...notes.slice(0, h), ...notes.slice(end)]
}

async function fixSeedFile() {
  const seedPath = join(dirname(fileURLToPath(import.meta.url)), 'seed.ndjson')
  const docs = readFileSync(seedPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  let changed = 0
  for (const doc of docs) {
    if (doc._type !== 'lesson') continue
    const next = dedupeNotes(doc.notes, doc.keyPoints)
    if (next) {
      doc.notes = next
      changed++
    } else if (doc.notes?.some((b) => blockText(b).toLowerCase() === HEADING)) {
      console.warn(`Skipped ${doc._id}: bullets do not match keyPoints`)
    }
  }
  writeFileSync(seedPath, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n')
  console.log(`seed.ndjson: deduped notes on ${changed} lessons`)
}

async function patchLive() {
  const {getCliClient} = await import('sanity/cli')
  const client = getCliClient({apiVersion: '2026-11-25'}).withConfig({perspective: 'published'})
  const lessons = await client.fetch(
    `*[_type == "lesson" && !(_id in path("drafts.**")) && "What this lesson covers" in notes[].children[].text]{_id, notes, keyPoints}`,
  )
  const tx = client.transaction()
  let changed = 0
  for (const lesson of lessons) {
    const next = dedupeNotes(lesson.notes, lesson.keyPoints)
    if (!next) {
      console.warn(`Skipped ${lesson._id}: bullets do not match keyPoints`)
      continue
    }
    tx.patch(lesson._id, (p) => p.set({notes: next}))
    changed++
  }
  if (changed === 0) {
    console.log('Live dataset: nothing to change')
    return
  }
  await tx.commit({visibility: 'async'})
  console.log(`Live dataset: deduped notes on ${changed} lessons`)
}

if (process.argv.includes('--file')) await fixSeedFile()
else await patchLive()
