import {VideoIcon} from '@sanity/icons/Video'
import {defineArrayMember, defineField, defineType} from 'sanity'

// Internal lookup built by the offline pipeline (scripts/videos/ingest.mjs), one per
// unique lesson video URL (AGENTS.md §8, §9). Never shown to learners as a result.
// The transcript lives only as short chunks; there is no whole-transcript field.
export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: VideoIcon,
  readOnly: true,
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      description: 'Matches lesson.videoUrl.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'provider',
      type: 'string',
      options: {list: ['youtube', 'vimeo', 'bunny']},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'providerId', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'title', type: 'string', description: 'Copied from the lesson.'}),
    defineField({
      name: 'chapters',
      type: 'array',
      description: 'Table of contents. Search matches these before the transcript.',
      of: [defineArrayMember({type: 'videoChapter'})],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      type: 'array',
      of: [defineArrayMember({type: 'transcriptChunk'})],
    }),
    defineField({
      name: 'captionSource',
      type: 'string',
      options: {list: ['authored', 'manual', 'auto', 'none']},
    }),
    defineField({name: 'ingestedAt', type: 'datetime'}),
  ],
  preview: {
    select: {title: 'title', provider: 'provider', chunks: 'chunks', chapters: 'chapters'},
    prepare: ({title, provider, chunks, chapters}) => ({
      title: title ?? 'Untitled video',
      subtitle: [
        provider,
        `${Array.isArray(chapters) ? chapters.length : 0} chapters`,
        `${Array.isArray(chunks) ? chunks.length : 0} chunks`,
      ].join(' · '),
    }),
  },
})
