import "server-only";

import { sanityFetch } from "./fetch";
import {
  CATEGORIES_QUERY,
  COURSE_BY_SLUG_QUERY,
  COURSE_SLUGS_QUERY,
  COURSES_QUERY,
  INSTRUCTOR_BY_SLUG_QUERY,
  INSTRUCTOR_SLUGS_QUERY,
  LESSON_BY_SLUG_QUERY,
  LESSON_SLUGS_QUERY,
} from "./queries";

// Read-only content access for pages. Tags let a future webhook purge by type.

export function getCourses() {
  return sanityFetch({ query: COURSES_QUERY, tags: ["course", "instructor", "category", "lesson"] });
}

export function getCourseSlugs() {
  return sanityFetch({ query: COURSE_SLUGS_QUERY, tags: ["course"] });
}

export function getCourseBySlug(slug: string) {
  return sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: ["course", "instructor", "category", "lesson"],
  });
}

export function getLessonSlugs() {
  return sanityFetch({ query: LESSON_SLUGS_QUERY, tags: ["lesson", "course"] });
}

export function getLessonBySlug(slug: string) {
  return sanityFetch({
    query: LESSON_BY_SLUG_QUERY,
    params: { slug },
    tags: ["lesson", "course", "instructor"],
  });
}

export function getInstructorSlugs() {
  return sanityFetch({ query: INSTRUCTOR_SLUGS_QUERY, tags: ["instructor"] });
}

export function getInstructorBySlug(slug: string) {
  return sanityFetch({
    query: INSTRUCTOR_BY_SLUG_QUERY,
    params: { slug },
    tags: ["instructor", "course", "category", "lesson"],
  });
}

export function getCategories() {
  return sanityFetch({ query: CATEGORIES_QUERY, tags: ["category"] });
}
