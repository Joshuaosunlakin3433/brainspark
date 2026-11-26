import Image from "next/image";
import { CourseCard } from "@/components/ui";
import { capitalize, formatDuration } from "@/lib/format";
import type { getCourses } from "@/lib/sanity/data";
import { urlFor } from "@/lib/sanity/image";

export type CourseListItem = Awaited<ReturnType<typeof getCourses>>[number];

/** Grid of stacked course cards (home "All Courses" and the catalog). Server only. */
export function CourseGrid({ courses }: { courses: CourseListItem[] }) {
  return (
    <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) =>
        course.slug ? (
          <li key={course._id} className="min-h-93">
            <CourseCard
              layout="stacked"
              href={`/courses/${course.slug}`}
              icon={
                course.icon?.asset ? (
                  <Image
                    src={urlFor(course.icon).width(144).height(144).url()}
                    alt={course.icon.alt ?? ""}
                    width={72}
                    height={72}
                    className="size-18 object-contain"
                  />
                ) : null
              }
              title={course.title ?? ""}
              summary={course.summary ?? ""}
              level={capitalize(course.level)}
              duration={formatDuration(course.durationSeconds)}
              moduleCount={course.moduleCount ?? 0}
            />
          </li>
        ) : null,
      )}
    </ul>
  );
}
