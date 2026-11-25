import {BookIcon} from '@sanity/icons/Book'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const courseLevels = [
  {title: 'Beginner', value: 'beginner'},
  {title: 'Intermediate', value: 'intermediate'},
  {title: 'Advanced', value: 'advanced'},
]

export const course = defineType({
  name: 'course',
  type: 'document',
  icon: BookIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'marketing', title: 'Marketing'},
    {name: 'outcomes', title: 'Outcomes'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: ['content', 'marketing'],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'instructor',
      type: 'reference',
      group: 'content',
      to: [{type: 'instructor'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'reference',
      group: 'content',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'modules',
      type: 'array',
      group: 'content',
      description: 'In teaching order.',
      of: [defineArrayMember({type: 'module'})],
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
      group: 'marketing',
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: 'level',
      type: 'string',
      group: 'marketing',
      options: {list: courseLevels, layout: 'radio', direction: 'horizontal'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      type: 'image',
      group: 'marketing',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineField({
      name: 'icon',
      type: 'image',
      group: 'marketing',
      description: 'Small course logo shown on cards and search results.',
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineField({
      name: 'price',
      type: 'number',
      group: 'marketing',
      description: 'USD. 0 means free.',
      validation: (rule) => rule.min(0).precision(2),
    }),
    defineField({name: 'popular', type: 'boolean', group: 'marketing', initialValue: false}),
    defineField({
      name: 'studentCount',
      type: 'number',
      group: 'marketing',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'learningOutcomes',
      title: "What you'll learn",
      type: 'array',
      group: 'outcomes',
      of: [defineArrayMember({type: 'learningOutcome'})],
      validation: (rule) => rule.max(8),
    }),
  ],
  preview: {
    select: {title: 'title', media: 'icon', level: 'level', modules: 'modules'},
    prepare: ({title, media, level, modules}) => {
      const count = Array.isArray(modules) ? modules.length : 0
      return {
        title,
        media,
        subtitle: [level, `${count} module${count === 1 ? '' : 's'}`].filter(Boolean).join(' · '),
      }
    },
  },
})
