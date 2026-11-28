import {OlistIcon} from '@sanity/icons/Olist'
import {defineField, defineType} from 'sanity'

import {formatTimestamp} from './transcript-chunk'

// One table-of-contents entry. Built by scripts/videos/ingest.mjs.
export const videoChapter = defineType({
  name: 'videoChapter',
  type: 'object',
  icon: OlistIcon,
  fields: [
    defineField({
      name: 'startSeconds',
      type: 'number',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {label: 'label', startSeconds: 'startSeconds'},
    prepare: ({label, startSeconds}) => ({title: label, subtitle: formatTimestamp(startSeconds)}),
  },
})
