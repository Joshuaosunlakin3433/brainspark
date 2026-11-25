import {StarIcon} from '@sanity/icons/Star'
import {defineField, defineType} from 'sanity'

// Keys the web app maps to its own icon set. Add a key here and in the web map together.
export const learningOutcomeIcons = [
  'rocket',
  'layers',
  'database',
  'zap',
  'shield',
  'code',
  'gauge',
  'server',
  'globe',
  'sparkles',
]

export const learningOutcome = defineType({
  name: 'learningOutcome',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'icon',
      type: 'string',
      options: {list: learningOutcomeIcons},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', type: 'text', rows: 2}),
  ],
  preview: {select: {title: 'title', subtitle: 'icon'}},
})
