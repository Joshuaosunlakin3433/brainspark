// Replace one course's icon in the live dataset without touching any other field.
//
// Usage (from studio/):
//   npx sanity exec scripts/seed/update-course-icon.mjs --with-user-token -- <courseId> <svgOrImagePath>
//
// Uploads the file as an image asset, then patches only `icon.asset` on the course.
// Uses your Sanity CLI login; no token is read from env or written anywhere.

import {createReadStream} from 'node:fs'
import {basename, resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

const [courseId, filePath] = process.argv.slice(2).filter((a) => a !== '--')
if (!courseId || !filePath) {
  console.error('Usage: ... -- <courseId> <imagePath>')
  process.exit(1)
}

const client = getCliClient({apiVersion: '2026-11-25'})

const course = await client.getDocument(courseId)
if (!course || course._type !== 'course') {
  console.error(`No course document with id "${courseId}".`)
  process.exit(1)
}

const absolute = resolve(filePath)
const asset = await client.assets.upload('image', createReadStream(absolute), {
  filename: basename(absolute),
})

await client
  .patch(courseId)
  .set({'icon.asset': {_type: 'reference', _ref: asset._id}})
  .commit()

console.log(`Course:    ${courseId}`)
console.log(`Old asset: ${course.icon?.asset?._ref ?? '(none)'}`)
console.log(`New asset: ${asset._id}`)
console.log(`Alt kept:  ${course.icon?.alt ?? '(none)'}`)
