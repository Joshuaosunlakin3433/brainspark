import {UserIcon} from '@sanity/icons/User'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const instructor = defineType({
  name: 'instructor',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photo',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineField({
      name: 'expertise',
      type: 'array',
      description: 'Areas of expertise, e.g. "React", "Distributed systems".',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({name: 'bio', type: 'text', rows: 5}),
  ],
  preview: {
    select: {title: 'name', media: 'photo', expertise: 'expertise'},
    prepare: ({title, media, expertise}) => ({
      title,
      media,
      subtitle: Array.isArray(expertise) ? expertise.join(', ') : undefined,
    }),
  },
})
