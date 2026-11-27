import { VideoOff } from "lucide-react";
import { parseStartSeconds, parseVideoUrl } from "@/lib/video";

const frame =
  "relative aspect-video w-full overflow-hidden rounded-md bg-neutral-900 shadow-lg";

/** Provider embed with its own player and controls. Never a custom player (AGENTS.md §7). */
export async function LessonVideo({
  videoUrl,
  title,
  searchParams,
}: {
  videoUrl: string | null;
  title: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await searchParams;
  const video = parseVideoUrl(videoUrl);

  if (!video) {
    return (
      <div className={`${frame} flex flex-col items-center justify-center gap-3 text-neutral-300`}>
        <VideoOff className="size-8" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-body">Video unavailable</p>
      </div>
    );
  }

  const start = parseStartSeconds(t);
  return (
    <div className={frame}>
      <iframe
        // Remount when the start time changes so the provider seeks to it.
        key={`${video.id}-${start}`}
        src={video.embedUrl(start)}
        title={`Video: ${title}`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 size-full border-0"
      />
    </div>
  );
}

export function LessonVideoSkeleton() {
  return <div aria-hidden="true" className={`${frame} animate-pulse`} />;
}
