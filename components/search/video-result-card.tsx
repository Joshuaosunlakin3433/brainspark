import Image from "next/image";
import Link from "next/link";
import { ChevronRight, CirclePlay, FileText, Folder, Play } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatClock } from "@/lib/format";
import type { VideoResult } from "@/lib/search/types";
import { ResultCourse } from "./result-parts";

/** A lesson's video matched at a moment; the card plays it from that second. */
export function VideoResultCard({ result }: { result: VideoResult }) {
  const { lesson, module } = result;
  const at = formatClock(result.startSeconds);

  return (
    <article className="relative flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:gap-9">
      <div className="relative aspect-274/142 w-full shrink-0 overflow-hidden rounded-sm bg-neutral-900 sm:w-68.5">
        {lesson.posterUrl && (
          <Image
            src={lesson.posterUrl}
            alt=""
            fill
            sizes="(min-width: 640px) 274px, 100vw"
            className="object-cover"
          />
        )}
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 flex size-10 -translate-1/2 items-center justify-center rounded-full bg-white shadow-md"
        >
          <Play className="ml-0.5 size-4.5 fill-neutral-900 text-neutral-900" />
        </span>
        {lesson.durationSeconds ? (
          <span className="absolute right-2.5 bottom-2.5 rounded-xs bg-neutral-900/85 px-2 py-0.5 text-small font-medium text-white sm:text-[13px]">
            <span className="sr-only">Length </span>
            {formatClock(lesson.durationSeconds)}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-1">
        <div className="flex items-start justify-between gap-4">
          <ResultCourse course={result.course} />
          <Badge variant="video" className="shrink-0">
            Video
          </Badge>
        </div>
        <h3 className="mt-3 text-h3 font-medium text-neutral-900">
          <Link
            href={result.href}
            className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary-400"
          >
            {lesson.title}
          </Link>
        </h3>
        {lesson.description && (
          <p className="mt-1.5 line-clamp-2 max-w-105 text-small leading-5 text-neutral-700 sm:text-[13px]">
            {lesson.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4 text-small text-neutral-700">
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-neutral-500" strokeWidth={1.5} aria-hidden="true" />
              {result.label}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex min-w-0 items-center gap-2">
              <Folder className="size-4 text-neutral-500" strokeWidth={1.5} aria-hidden="true" />
              <span className="truncate">{module.title}</span>
            </span>
          </p>
          <span className="flex items-center gap-2 font-medium text-primary-500 sm:text-[13px]">
            <CirclePlay className="size-5" strokeWidth={1.5} aria-hidden="true" />
            Watch from {at}
            <ChevronRight className="ml-2 size-4 text-neutral-700" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
