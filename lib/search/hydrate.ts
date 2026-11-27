import "server-only";

import { sanityFetch } from "@/lib/sanity/fetch";
import { urlFor } from "@/lib/sanity/image";
import { SEARCH_LESSONS_BY_IDS_QUERY } from "@/lib/sanity/queries";

import type { AgentOutput, LessonResult, SearchResponse } from "./types";

const MAX_RESULTS = 60;

/**
 * Turns the model's ranked ids into result cards built only from stored content.
 * Unknown ids, and lessons not placed in a course module, are dropped.
 */
export async function hydrateLessonResults(
  query: string,
  matches: AgentOutput["matches"],
): Promise<SearchResponse> {
  // Keep the first (best) occurrence of each id, in the model's rank order.
  const ranked = new Map<string, AgentOutput["matches"][number]>();
  for (const m of matches) if (!ranked.has(m.lessonId)) ranked.set(m.lessonId, m);
  const ids = [...ranked.keys()].slice(0, MAX_RESULTS);

  const lessons =
    ids.length === 0
      ? []
      : await sanityFetch({
          query: SEARCH_LESSONS_BY_IDS_QUERY,
          params: { ids },
          tags: ["lesson", "course"],
        });
  const byId = new Map(lessons.map((l) => [l._id, l]));

  const results: LessonResult[] = [];
  for (const id of ids) {
    const lesson = byId.get(id);
    const course = lesson?.course;
    if (!lesson || !course) continue;

    const moduleIndex = course.modules?.findIndex((m) => m.lessonIds?.includes(id)) ?? -1;
    if (moduleIndex < 0) continue;
    const mod = course.modules![moduleIndex];
    const lessonNumber = mod.lessonIds!.indexOf(id) + 1;
    const moduleNumber = moduleIndex + 1;

    results.push({
      kind: "lesson",
      rank: results.length + 1,
      tier: ranked.get(id)!.tier,
      lesson: {
        id,
        title: lesson.title,
        slug: lesson.slug,
        durationSeconds: lesson.duration ?? null,
        posterUrl: lesson.poster?.asset ? urlFor(lesson.poster).width(640).height(360).url() : null,
        keyPoints: lesson.keyPoints ?? [],
        description: lesson.description || null,
      },
      course: {
        id: course._id,
        title: course.title,
        slug: course.slug,
        iconUrl: course.icon?.asset ? urlFor(course.icon).width(96).height(96).url() : null,
      },
      module: { title: mod.title, number: moduleNumber },
      label: `Lesson ${moduleNumber}.${lessonNumber}`,
      href: `/courses/${course.slug}/lessons/${lesson.slug}`,
    });
  }

  return {
    query,
    total: results.length,
    courseCount: new Set(results.map((r) => r.course.id)).size,
    results,
  };
}
