import Image from "next/image";
import type { SearchResult } from "@/lib/search/types";

/** Course icon + name shown at the top of every result card. */
export function ResultCourse({ course }: { course: SearchResult["course"] }) {
  return (
    <p className="flex min-w-0 items-center gap-2.5 text-small text-neutral-700 sm:text-[13px]">
      {course.iconUrl ? (
        <Image
          src={course.iconUrl}
          alt=""
          width={22}
          height={22}
          className="size-5.5 shrink-0 rounded-xs object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-5.5 shrink-0 items-center justify-center rounded-xs bg-neutral-900 text-[11px] font-semibold text-white"
        >
          {course.title.charAt(0)}
        </span>
      )}
      <span className="truncate">{course.title}</span>
    </p>
  );
}
