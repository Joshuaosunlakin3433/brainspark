import {TextIcon} from '@sanity/icons/Text'
import {defineField, defineType} from 'sanity'

export function formatTimestamp(seconds: unknown): string {
  if (typeof seconds !== 'number') return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

// A short timestamped piece of a transcript. Built by scripts/videos/ingest.mjs.
export const transcriptChunk = defineType({
  name: 'transcriptChunk',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'startSeconds',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({name: 'text', type: 'text', rows: 3, validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {text: 'text', startSeconds: 'startSeconds'},
    prepare: ({text, startSeconds}) => ({title: text, subtitle: formatTimestamp(startSeconds)}),
  },
})
