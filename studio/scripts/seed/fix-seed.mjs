// One-off, idempotent transform that brings seed.ndjson in line with the Studio schema.
// Usage (from studio/): node scripts/seed/fix-seed.mjs
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const seedPath = join(here, 'seed.ndjson')
const iconsDir = join(here, 'icons')
const webCourseIcons = join(here, '..', '..', '..', 'public', 'courses')

// Outcome icon keys that are not in studio/schemaTypes/objects/learning-outcome.ts.
const OUTCOME_ICON_FIXES = {workflow: 'layers', puzzle: 'code'}

// Course slug -> icon. `file` reuses a web icon; `mono` generates a neutral monogram tile.
const COURSE_ICONS = {
  'nextjs-app-router-in-depth': {file: 'nextjs.svg', alt: 'Next.js'},
  'devops-with-docker-and-kubernetes': {file: 'docker.svg', alt: 'Docker'},
  'typescript-for-application-developers': {file: 'typescript.svg', alt: 'TypeScript'},
  'react-performance-engineering': {mono: 'Re', bg: '#0E7490', alt: 'React Performance Engineering'},
  'building-ai-apps-with-llms': {mono: 'AI', bg: '#7C3AED', alt: 'Building AI Apps with LLMs'},
  'retrieval-augmented-generation-from-scratch': {mono: 'RAG', bg: '#4F46E5', alt: 'Retrieval-Augmented Generation'},
  'python-for-data-work': {mono: 'Py', bg: '#2563EB', alt: 'Python for Data Work'},
  'system-design-foundations': {mono: 'SD', bg: '#0F766E', alt: 'System Design Foundations'},
  'postgresql-for-developers': {mono: 'PG', bg: '#1D4ED8', alt: 'PostgreSQL for Developers'},
  'practical-web-security': {mono: 'Sec', bg: '#B91C1C', alt: 'Practical Web Security'},
}

function monogramSvg(text, bg) {
  const size = text.length > 2 ? 22 : 28
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${bg}"/>
  <text x="32" y="32" dy="0.35em" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="700" fill="#FFFFFF">${text}</text>
</svg>
`
}

function ensureIcon(slug) {
  const spec = COURSE_ICONS[slug]
  if (!spec) throw new Error(`No icon mapping for course "${slug}"`)
  mkdirSync(iconsDir, {recursive: true})
  const name = spec.file ?? `${slug}.svg`
  const target = join(iconsDir, name)
  if (spec.file) copyFileSync(join(webCourseIcons, spec.file), target)
  else if (!existsSync(target)) writeFileSync(target, monogramSvg(spec.mono, spec.bg))
  return {_type: 'image', _sanityAsset: `image@file://./icons/${name}`, alt: spec.alt}
}

// "link" is not a resource type in studio/schemaTypes/objects/resource.ts.
function resourceTypeFor(url) {
  const host = new URL(url).hostname
  if (host === 'github.com') return 'repository'
  if (host.endsWith('owasp.org') || host.endsWith('aws.amazon.com')) return 'article'
  return 'documentation'
}

function portableTextToPlain(value) {
  if (!Array.isArray(value)) return value
  return value
    .filter((block) => block?._type === 'block')
    .map((block) => (block.children ?? []).map((child) => child.text ?? '').join(''))
    .filter(Boolean)
    .join('\n\n')
}

const docs = readFileSync(seedPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line))

for (const doc of docs) {
  if (doc._type === 'lesson' && doc.thumbnail) {
    doc.poster ??= doc.thumbnail
    delete doc.thumbnail
  }
  if (doc._type === 'lesson') {
    for (const resource of doc.resources ?? []) {
      if (resource.type === 'link') resource.type = resourceTypeFor(resource.url)
    }
  }
  if (doc._type === 'instructor') doc.bio = portableTextToPlain(doc.bio)
  if (doc._type === 'course') {
    for (const outcome of doc.learningOutcomes ?? []) {
      outcome.icon = OUTCOME_ICON_FIXES[outcome.icon] ?? outcome.icon
    }
    doc.icon = ensureIcon(doc.slug.current)
  }
}

writeFileSync(seedPath, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n')
console.log(`Rewrote ${docs.length} documents in seed.ndjson`)
