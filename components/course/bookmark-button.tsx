"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

/** Presentational toggle. Not persisted: there is no bookmark backend. */
export function BookmarkButton({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const [saved, setSaved] = useState(false);

  if (iconOnly) {
    return (
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? "Remove bookmark" : "Bookmark lesson"}
        onClick={() => setSaved((v) => !v)}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-sm border border-neutral-200 bg-white text-primary-500 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400",
          className,
        )}
      >
        <Bookmark
          className={cn("size-5", saved && "fill-primary-500")}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => setSaved((v) => !v)}
      className={cn(
        "inline-flex h-13.5 items-center justify-center gap-3 rounded-sm border border-neutral-200 bg-white px-5.5 text-body-lg text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400",
        className,
      )}
    >
      <Bookmark
        className={cn("size-5", saved && "fill-neutral-900")}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {saved ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
