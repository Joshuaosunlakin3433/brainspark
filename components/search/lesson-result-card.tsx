import Link from "next/link";
import { ChevronRight, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui";
import type { LessonResult } from "@/lib/search/types";
import { ResultCourse } from "./result-parts";

/** A lesson matched on its own topic; the card opens the lesson page. */
export function LessonResultCard({ result }: { result: LessonResult }) {
  const { lesson } = result;
  const points = lesson.keyPoints.slice(0, 3);

  return (
    <article className="relative flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:gap-9">
      <div className="flex w-full shrink-0 gap-4 rounded-sm bg-neutral-50 px-3 py-3.5 sm:w-68.5">
        <FileText className="mt-0.5 size-5 shrink-0 text-neutral-700" strokeWidth={1.5} aria-hidden="true" />
        {points.length > 0 && (
          <ul className="min-w-0 space-y-1.5 pt-0.5 text-small leading-4.5 text-neutral-700 sm:text-[13px]">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span aria-hidden="true">•</span>
                <span className="line-clamp-1">{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <ResultCourse course={result.course} />
          <Badge variant="lesson" className="shrink-0">
            Lesson
          </Badge>
        </div>
        <h3 className="mt-1.5 text-h3 font-medium text-neutral-900">
          <Link
            href={result.href}
            className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary-400"
          >
            {lesson.title}
          </Link>
        </h3>
        {lesson.description && (
          <p className="mt-1 line-clamp-2 max-w-90 text-small leading-4.5 text-neutral-700 sm:text-[13px]">
            {lesson.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pt-1.5 text-small text-neutral-700">
          <span>Module {result.module.number}</span>
          <span className="flex items-center gap-2 font-medium text-primary-500 sm:text-[13px]">
            View lesson
            <ExternalLink className="ml-2 size-4 text-neutral-700" strokeWidth={1.5} aria-hidden="true" />
            <ChevronRight className="ml-2 size-4 text-neutral-700" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
