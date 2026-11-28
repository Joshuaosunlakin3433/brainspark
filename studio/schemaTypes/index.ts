import type {SchemaTypeDefinition} from 'sanity'

import {category} from './documents/category'
import {course} from './documents/course'
import {instructor} from './documents/instructor'
import {lesson} from './documents/lesson'
import {video} from './documents/video'
import {learningOutcome} from './objects/learning-outcome'
import {lessonNotes} from './objects/lesson-notes'
import {courseModule} from './objects/module'
import {resource} from './objects/resource'
import {transcriptChunk} from './objects/transcript-chunk'
import {videoChapter} from './objects/video-chapter'

export const schemaTypes: SchemaTypeDefinition[] = [
  course,
  lesson,
  instructor,
  category,
  courseModule,
  learningOutcome,
  resource,
  lessonNotes,
  video,
  videoChapter,
  transcriptChunk,
]
