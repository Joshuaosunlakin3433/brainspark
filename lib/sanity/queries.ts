import { defineQuery } from "next-sanity";

// Shared field lists. Module and lesson numbers are not stored: derive them from array order.

const IMAGE = /* groq */ `{ asset, hotspot, crop, alt }`;

const INSTRUCTOR_FIELDS = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  photo ${IMAGE},
  expertise
`;

const CATEGORY_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current
`;

// Everything a course card needs, minus the instructor and category projections.
const COURSE_BASE_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  summary,
  level,
  price,
  popular,
  studentCount,
  icon ${IMAGE},
  coverImage ${IMAGE},
  "moduleCount": count(modules),
  "lessonCount": count(modules[].lessons[]),
  "durationSeconds": math::sum(modules[].lessons[]->duration)
`;

const COURSE_CARD_FIELDS = /* groq */ `
  ${COURSE_BASE_FIELDS},
  category->{ ${CATEGORY_FIELDS} },
  instructor->{ ${INSTRUCTOR_FIELDS} }
`;

const COURSE_OUTLINE = /* groq */ `
  modules[]{
    _key,
    title,
    summary,
    "lessons": lessons[]->{
      _id,
      title,
      "slug": slug.current,
      duration,
      freePreview,
      poster ${IMAGE}
    }
  }
`;

export const COURSES_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)] | order(popular desc, title asc){
    ${COURSE_CARD_FIELDS}
  }
`);

export const COURSE_SLUGS_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)]{ "slug": slug.current }
`);

export const COURSE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "course" && slug.current == $slug][0]{
    ${COURSE_BASE_FIELDS},
    category->{ ${CATEGORY_FIELDS}, description },
    instructor->{ ${INSTRUCTOR_FIELDS}, bio },
    learningOutcomes[]{ _key, icon, title, description },
    ${COURSE_OUTLINE}
  }
`);

export const LESSON_SLUGS_QUERY = defineQuery(`
  *[_type == "lesson" && defined(slug.current)]{
    "slug": slug.current,
    "courseSlug": *[_type == "course" && references(^._id)][0].slug.current
  }
`);

export const LESSON_BY_SLUG_QUERY = defineQuery(`
  *[_type == "lesson" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    videoUrl,
    poster ${IMAGE},
    duration,
    freePreview,
    studentCount,
    notes,
    keyPoints,
    proTip,
    resources[]{ _key, type, title, description, url },
    "course": *[_type == "course" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current,
      level,
      icon ${IMAGE},
      instructor->{ ${INSTRUCTOR_FIELDS} },
      ${COURSE_OUTLINE}
    }
  }
`);

export const INSTRUCTOR_SLUGS_QUERY = defineQuery(`
  *[_type == "instructor" && defined(slug.current)]{ "slug": slug.current }
`);

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(`
  *[_type == "instructor" && slug.current == $slug][0]{
    ${INSTRUCTOR_FIELDS},
    bio,
    "courses": *[_type == "course" && references(^._id) && defined(slug.current)]
      | order(title asc){ ${COURSE_CARD_FIELDS} }
  }
`);

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current)] | order(title asc){
    ${CATEGORY_FIELDS},
    description
  }
`);
