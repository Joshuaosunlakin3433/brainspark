// Validates seed.ndjson against the Studio schema contract and the content invariants.
// Exits non-zero on any error. Usage (from studio/): node scripts/seed/validate-seed.mjs
import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const docs = readFileSync(join(here, 'seed.ndjson'), 'utf8')
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line))
const videos = JSON.parse(readFileSync(join(here, 'videos.json'), 'utf8'))

// Mirrors studio/schemaTypes. Keep in sync when the schema changes.
const FIELDS = {
  course: {
    required: ['title', 'slug', 'instructor', 'category', 'summary', 'level'],
    optional: ['modules', 'coverImage', 'icon', 'price', 'popular', 'studentCount', 'learningOutcomes'],
  },
  lesson: {
    required: ['title', 'slug', 'videoUrl', 'duration'],
    optional: ['poster', 'freePreview', 'studentCount', 'notes', 'keyPoints', 'proTip', 'resources'],
  },
  instructor: {required: ['name', 'slug'], optional: ['photo', 'expertise', 'bio']},
  category: {required: ['title', 'slug'], optional: ['description']},
}
const LEVELS = ['beginner', 'intermediate', 'advanced']
const OUTCOME_ICONS = ['rocket', 'layers', 'database', 'zap', 'shield', 'code', 'gauge', 'server', 'globe', 'sparkles']
const RESOURCE_TYPES = ['article', 'documentation', 'repository', 'download', 'video']

const errors = []
const fail = (id, msg) => errors.push(`${id}: ${msg}`)
const byId = new Map(docs.map((d) => [d._id, d]))
const ofType = (t) => docs.filter((d) => d._type === t)

// Document shape
const slugs = {}
for (const doc of docs) {
  const spec = FIELDS[doc._type]
  if (!spec) {
    fail(doc._id, `unexpected type ${doc._type}`)
    continue
  }
  const known = new Set([...spec.required, ...spec.optional])
  for (const key of Object.keys(doc)) {
    if (!key.startsWith('_') && !known.has(key)) fail(doc._id, `unknown field "${key}"`)
  }
  for (const key of spec.required) {
    if (doc[key] === undefined || doc[key] === null || doc[key] === '') fail(doc._id, `missing "${key}"`)
  }
  const slug = doc.slug?.current
  slugs[doc._type] ??= new Set()
  if (slugs[doc._type].has(slug)) fail(doc._id, `duplicate slug "${slug}"`)
  slugs[doc._type].add(slug)
}

// Keys and references, walked through every array
function walk(id, value, path) {
  if (Array.isArray(value)) {
    const keys = new Set()
    value.forEach((item, i) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        if (!item._key) fail(id, `${path}[${i}] has no _key`)
        else if (keys.has(item._key)) fail(id, `${path}[${i}] duplicate _key "${item._key}"`)
        keys.add(item._key)
      }
      walk(id, item, `${path}[${i}]`)
    })
  } else if (value && typeof value === 'object') {
    if (value._ref && !byId.has(value._ref)) fail(id, `${path} references missing "${value._ref}"`)
    for (const [k, v] of Object.entries(value)) walk(id, v, path ? `${path}.${k}` : k)
  }
}
docs.forEach((doc) => walk(doc._id, doc, ''))

// Instructors and categories
for (const doc of ofType('instructor')) {
  if (doc.bio !== undefined && typeof doc.bio !== 'string') fail(doc._id, 'bio must be plain text')
}

// Lessons
const urls = new Set()
for (const lesson of ofType('lesson')) {
  const video = videos[lesson.slug.current]
  if (!video) fail(lesson._id, 'no entry in videos.json')
  else if (video.duration !== lesson.duration) fail(lesson._id, `duration ${lesson.duration} != video ${video.duration}`)
  if (!Number.isInteger(lesson.duration) || lesson.duration < 1) fail(lesson._id, 'duration must be a positive integer')
  if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(lesson.videoUrl)) fail(lesson._id, 'videoUrl is not YouTube')
  if (urls.has(lesson.videoUrl)) fail(lesson._id, `video URL reused: ${lesson.videoUrl}`)
  urls.add(lesson.videoUrl)
  if (!lesson.poster?._sanityAsset && !lesson.poster?.asset) fail(lesson._id, 'missing poster image')
  if (!lesson.keyPoints?.length) fail(lesson._id, 'missing keyPoints')
  for (const r of lesson.resources ?? []) {
    if (!RESOURCE_TYPES.includes(r.type)) fail(lesson._id, `bad resource type "${r.type}"`)
  }
}

// Courses, modules, and the "each lesson in exactly one module" invariant
const placements = new Map()
const rows = []
for (const course of ofType('course')) {
  if (!LEVELS.includes(course.level)) fail(course._id, `bad level "${course.level}"`)
  if (!course.icon) fail(course._id, 'missing icon')
  if (course.summary?.length > 200) fail(course._id, 'summary over 200 chars')
  if (byId.get(course.instructor?._ref)?._type !== 'instructor') fail(course._id, 'instructor ref is not an instructor')
  if (byId.get(course.category?._ref)?._type !== 'category') fail(course._id, 'category ref is not a category')
  for (const o of course.learningOutcomes ?? []) {
    if (!OUTCOME_ICONS.includes(o.icon)) fail(course._id, `bad outcome icon "${o.icon}"`)
  }
  if ((course.learningOutcomes?.length ?? 0) > 8) fail(course._id, 'more than 8 learning outcomes')
  if (!course.modules?.length) fail(course._id, 'no modules')

  let courseSeconds = 0
  let courseLessons = 0
  const moduleCells = []
  for (const mod of course.modules ?? []) {
    if (!mod.lessons?.length) fail(course._id, `module "${mod.title}" has no lessons`)
    let moduleSeconds = 0
    for (const ref of mod.lessons ?? []) {
      const lesson = byId.get(ref._ref)
      if (lesson?._type !== 'lesson') {
        fail(course._id, `module "${mod.title}" references non-lesson "${ref._ref}"`)
        continue
      }
      placements.set(ref._ref, [...(placements.get(ref._ref) ?? []), `${course._id} / ${mod.title}`])
      moduleSeconds += lesson.duration
    }
    courseSeconds += moduleSeconds
    courseLessons += mod.lessons?.length ?? 0
    moduleCells.push(`${mod.lessons?.length ?? 0}L/${Math.round(moduleSeconds / 60)}m`)
  }
  rows.push({
    course: course.slug.current,
    modules: course.modules?.length ?? 0,
    lessons: courseLessons,
    'per module': moduleCells.join('  '),
    'course min': Math.round(courseSeconds / 60),
  })
}
for (const lesson of ofType('lesson')) {
  const where = placements.get(lesson._id) ?? []
  if (where.length === 0) fail(lesson._id, 'not in any module')
  if (where.length > 1) fail(lesson._id, `in ${where.length} modules: ${where.join('; ')}`)
}

console.table(rows)
const counts = Object.fromEntries(Object.keys(FIELDS).map((t) => [t, ofType(t).length]))
console.log('Documents:', counts)
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('0 errors')
