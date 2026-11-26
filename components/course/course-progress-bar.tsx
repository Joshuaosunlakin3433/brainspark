"use client";

import { Show } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Signed-in only. Progress records do not exist yet, so the page passes 0 until
 * the progress task supplies the learner's real completion and resume lesson.
 */
export function CourseProgressBar({
  percent,
  continueHref,
}: {
  percent: number;
  continueHref: string | null;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <Show when="signed-in">
      <div className="pointer-events-auto flex w-full flex-col gap-4 rounded-md border border-neutral-200 bg-canvas px-5 py-4 shadow-md sm:flex-row sm:items-center sm:gap-10 sm:pr-4 sm:pl-6">
          <div className="shrink-0">
            <p className="text-small text-neutral-700">Your Progress</p>
            <p className="mt-1.5 text-body text-neutral-900">
              <span className="font-semibold">{pct}%</span> complete
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 sm:max-w-70"
          >
            <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
          </div>
          {continueHref && (
            <Link
              href={continueHref}
              className="inline-flex h-13 shrink-0 items-center justify-center gap-5 rounded-sm bg-primary-500 px-7 text-body-lg font-medium text-white shadow-md transition-colors hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 sm:ml-auto"
            >
              Continue Learning
              <ArrowRight className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          )}
      </div>
    </Show>
  );
}
