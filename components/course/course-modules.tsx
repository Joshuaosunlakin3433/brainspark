"use client";

import Link from "next/link";
import { ChevronDown, CirclePlay } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui";

export type CourseModuleItem = {
  key: string;
  title: string;
  summary: string | null;
  duration: string;
  lessons: {
    key: string;
    label: string;
    title: string;
    href: string | null;
    duration: string;
    freePreview: boolean;
  }[];
};

const VISIBLE = 6;

export function CourseModules({ modules }: { modules: CourseModuleItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const collapsible = modules.length > VISIBLE;
  const shown = collapsible && !showAll ? modules.slice(0, VISIBLE) : modules;

  return (
    <div className="relative">
      <ol
        id="course-modules"
        className="overflow-hidden rounded-md border border-neutral-200 bg-white"
      >
        {shown.map((module, i) => (
          <li key={module.key} className="border-neutral-200 not-first:border-t">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-400 sm:gap-6 sm:px-5 [&::-webkit-details-marker]:hidden">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-body-lg text-neutral-900">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body-lg text-neutral-900">{module.title}</span>
                  {module.summary && (
                    <span className="mt-0.5 block text-small text-neutral-700 sm:text-[13px] sm:leading-5">
                      {module.summary}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-body text-neutral-700">{module.duration}</span>
                <ChevronDown
                  className="size-5 shrink-0 text-neutral-700 transition-transform group-open:rotate-180 sm:ml-3"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </summary>
              {module.lessons.length > 0 && (
                <ul className="border-t border-neutral-200 bg-neutral-50 py-2">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.key}
                      className="flex items-center gap-4 py-2 pr-4 pl-4 sm:gap-6 sm:pr-14 sm:pl-20"
                    >
                      <CirclePlay
                        className="size-4.5 shrink-0 text-primary-500"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 text-body text-neutral-900">
                        <span className="mr-2 text-neutral-500">Lesson {lesson.label}</span>
                        {lesson.href ? (
                          <Link
                            href={lesson.href}
                            className="hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-primary-400"
                          >
                            {lesson.title}
                          </Link>
                        ) : (
                          lesson.title
                        )}
                      </span>
                      {lesson.freePreview && <Badge variant="video">Free preview</Badge>}
                      <span className="shrink-0 text-small text-neutral-700">
                        {lesson.duration}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </li>
        ))}
      </ol>

      {collapsible && (
        <div className="-mt-4 flex justify-center">
          <button
            type="button"
            aria-expanded={showAll}
            aria-controls="course-modules"
            onClick={() => setShowAll((v) => !v)}
            className="relative inline-flex h-11 items-center gap-5 rounded-sm border border-neutral-200 bg-white px-6 text-body text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
          >
            {showAll ? "Show fewer modules" : `Show all ${modules.length} modules`}
            <ChevronDown
              className={showAll ? "size-4.5 rotate-180" : "size-4.5"}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  );
}
