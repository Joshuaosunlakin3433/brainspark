import {PlayIcon} from '@sanity/icons/Play'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Video providers with an embed on the lesson page (AGENTS.md section 9).
const videoHosts = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'mediadelivery.net', // Bunny Stream embeds (iframe.mediadelivery.net)
  'bunnycdn.com',
]

function isSupportedVideoUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '')
    return videoHosts.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export const lesson = defineType({
  name: 'lesson',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'video', title: 'Video', default: true},
    {name: 'content', title: 'Content'},
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: ['video', 'content'],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'video',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      group: 'video',
      description: 'YouTube, Vimeo, or Bunny Stream URL.',
      validation: (rule) =>
        rule
          .required()
          .uri({scheme: ['https']})
          .custom((value) =>
            !value || isSupportedVideoUrl(value) ? true : 'Use a YouTube, Vimeo, or Bunny URL',
          ),
    }),
    defineField({
      name: 'poster',
      type: 'image',
      group: 'video',
      description: 'Thumbnail shown on lesson cards and search results.',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', title: 'Alternative text'})],
    }),
    defineField({
      name: 'duration',
      type: 'number',
      group: 'video',
      description: 'Video length in seconds.',
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'freePreview',
      type: 'boolean',
      group: 'video',
      description: 'Label only, not access control.',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      type: 'number',
      group: 'video',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({name: 'notes', type: 'lessonNotes', group: 'content'}),
    defineField({
      name: 'keyPoints',
      type: 'array',
      group: 'content',
      description: 'Shown as "In this lesson you will".',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.max(8),
    }),
    defineField({name: 'proTip', type: 'text', rows: 3, group: 'content'}),
    defineField({
      name: 'resources',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'resource'})],
    }),
  ],
  preview: {
    select: {title: 'title', media: 'poster', duration: 'duration', freePreview: 'freePreview'},
    prepare: ({title, media, duration, freePreview}) => ({
      title,
      media,
      subtitle: [
        typeof duration === 'number' ? formatDuration(duration) : null,
        freePreview ? 'Free preview' : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
