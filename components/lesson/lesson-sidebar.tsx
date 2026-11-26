"use client";

import { Show } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Play } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

export type SidebarLesson = {
  key: string;
  title: string;
  href: string | null;
  duration: string;
  current: boolean;
};

export type SidebarModule = {
  key: string;
  title: string;
  duration: string;
  lessons: SidebarLesson[];
};

const DESKTOP = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-400";

/**
 * Course outline beside the lesson. Open on desktop; collapsed behind the
 * "Module X of N" toggle below lg. Progress is 0% until progress records exist.
 */
export function LessonSidebar({
  courseHref,
  courseTitle,
  courseIcon,
  modules,
  currentModule,
}: {
  courseHref: string;
  courseTitle: string;
  courseIcon: { src: string; alt: string } | null;
  modules: SidebarModule[];
  currentModule: number;
}) {
  const isDesktop = useIsDesktop();
  // null = follow the breakpoint default (open on desktop, closed on mobile).
  const [listOpen, setListOpen] = useState<boolean | null>(null);
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(modules[currentModule] ? [modules[currentModule].key] : []),
  );
  const expanded = listOpen ?? isDesktop;

  function toggleModule(key: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <aside
      aria-label="Course outline"
      className="border-b border-neutral-200 lg:sticky lg:top-0 lg:ml-4 lg:max-h-dvh lg:w-75 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:border-x lg:border-b-0"
    >
      <div className="px-5 pt-6 sm:px-6 lg:pt-8.5">
        <Link
          href={courseHref}
          className={cn(
            "inline-flex items-center gap-3 rounded-xs text-body text-primary-500 transition-colors hover:text-primary-600",
            focusRing,
          )}
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Back to course
        </Link>

        <div className="mt-7 flex items-center gap-4 pb-5">
          {courseIcon && (
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xs">
              <Image src={courseIcon.src} alt={courseIcon.alt} fill sizes="56px" className="object-cover" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-body font-medium text-neutral-900">{courseTitle}</p>
            <Show when="signed-in">
              <p className="mt-1.5 text-small text-neutral-700">0% complete</p>
              <div
                role="progressbar"
                aria-label="Course progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={0}
                className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-neutral-200"
              >
                <div className="h-full w-0 rounded-full bg-primary-500" />
              </div>
            </Show>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="lesson-outline"
        onClick={() => setListOpen(!expanded)}
        className={cn(
          "flex w-full items-center justify-between border-y border-neutral-200 px-5 py-5 text-left text-body text-neutral-900 transition-colors hover:bg-neutral-50 sm:px-6",
          focusRing,
        )}
      >
        Module {currentModule + 1} of {modules.length}
        <ChevronDown
          className={cn("size-4.5 text-neutral-700 transition-transform", expanded && "rotate-180")}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      <ol
        id="lesson-outline"
        className={cn(listOpen === null ? "max-lg:hidden" : !listOpen && "hidden")}
      >
        {modules.map((module, i) => {
          const isCurrent = i === currentModule;
          const isOpen = openModules.has(module.key);
          const beforeCurrent = i < currentModule;
          return (
            <li
              key={module.key}
              className={cn(
                "relative",
                isCurrent && "bg-neutral-100/60",
                i > currentModule && "border-t border-neutral-200",
              )}
            >
              {/* Timeline joining the modules up to and including the current one. */}
              {beforeCurrent && (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 left-9 h-full w-px bg-neutral-200 sm:left-10"
                />
              )}
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleModule(module.key)}
                className={cn(
                  "relative flex w-full items-center gap-4 px-5 py-4.5 text-left transition-colors hover:bg-neutral-50 sm:px-6",
                  isCurrent && "hover:bg-neutral-100",
                  focusRing,
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-small",
                    isCurrent
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-neutral-200 bg-canvas text-neutral-900",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-5 font-medium text-neutral-900">
                    {module.title}
                  </span>
                  <span className="mt-1 block text-small text-neutral-500">{module.duration}</span>
                </span>
                <ChevronDown
                  className={cn("size-4.5 shrink-0 text-neutral-700 transition-transform", isOpen && "rotate-180")}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>

              {isOpen && module.lessons.length > 0 && (
                <ul className="relative pb-4">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 bottom-6 left-9 w-px bg-neutral-200 sm:left-10"
                  />
                  {module.lessons.map((lesson) => (
                    <SidebarLessonRow key={lesson.key} lesson={lesson} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function SidebarLessonRow({ lesson }: { lesson: SidebarLesson }) {
  const dot = (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 mt-1.5 size-1.5 shrink-0 rounded-full",
        lesson.current ? "bg-primary-500" : "border border-neutral-300 bg-canvas",
      )}
    />
  );

  const body = (
    <>
      <span className="flex w-8 shrink-0 justify-center">{dot}</span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-small leading-5", lesson.current ? "text-neutral-900" : "text-neutral-700")}>
          {lesson.title}
        </span>
        <span className={cn("mt-0.5 block text-small", lesson.current ? "text-primary-500" : "text-neutral-500")}>
          {lesson.current ? "Now playing" : lesson.duration}
        </span>
      </span>
      {lesson.current && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
          <Play className="size-3 fill-current" strokeWidth={0} aria-hidden="true" />
        </span>
      )}
    </>
  );

  const row = "relative flex items-start gap-4 px-5 py-2 sm:px-6";

  return (
    <li>
      {lesson.current || !lesson.href ? (
        <div className={row} aria-current={lesson.current ? "page" : undefined}>
          {body}
        </div>
      ) : (
        <Link href={lesson.href} className={cn(row, "transition-colors hover:bg-neutral-50 [&:hover_span]:text-neutral-900", focusRing)}>
          {body}
        </Link>
      )}
    </li>
  );
}
