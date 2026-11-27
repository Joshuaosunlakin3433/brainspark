import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type PagerLesson = { href: string; title: string; duration: string };

/** Previous / next lesson bar across the whole course, in teaching order. */
export function LessonPager({ prev, next }: { prev: PagerLesson | null; next: PagerLesson | null }) {
  if (!prev && !next) return null;
  return (
    <nav
      aria-label="Lesson navigation"
      className="flex flex-col gap-4 border-t border-neutral-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      {prev ? (
        <div className="flex items-center gap-7">
          <Link
            href={prev.href}
            className="inline-flex h-11 shrink-0 items-center gap-4 rounded-sm border border-neutral-200 bg-white px-5 text-body text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Previous Lesson
          </Link>
          <div className="min-w-0 text-small leading-5 text-neutral-700">
            <p className="truncate">{prev.title}</p>
            <p>{prev.duration}</p>
          </div>
        </div>
      ) : (
        <span aria-hidden="true" />
      )}

      {next && (
        <div className="flex items-center justify-end gap-7">
          <div className="min-w-0 text-right text-small leading-5 text-neutral-700">
            <p className="truncate">{next.title}</p>
            <p>{next.duration}</p>
          </div>
          <Link
            href={next.href}
            className="inline-flex h-11 shrink-0 items-center gap-4 rounded-sm bg-primary-500 px-5.5 text-body font-medium text-white shadow-md transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
          >
            Next Lesson
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      )}
    </nav>
  );
}
