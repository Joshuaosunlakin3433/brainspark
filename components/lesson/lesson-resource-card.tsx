import { CirclePlay, ExternalLink, FileText, FolderGit2, type LucideIcon } from "lucide-react";

type ResourceType = "article" | "documentation" | "download" | "repository" | "video";

const ICONS: Record<ResourceType, LucideIcon> = {
  article: FileText,
  documentation: FileText,
  download: FileText,
  repository: FolderGit2,
  video: CirclePlay,
};

/** Resource tile from the lesson design. The whole card is the external link. */
export function LessonResourceCard({
  type,
  title,
  description,
  url,
}: {
  type: ResourceType;
  title: string;
  description: string | null;
  url: string;
}) {
  const Icon = ICONS[type] ?? FileText;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full gap-3.5 rounded-sm border border-neutral-200 bg-white px-3.5 py-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
    >
      <span className="flex size-7.5 shrink-0 items-center justify-center rounded-xs border border-neutral-200 text-neutral-700">
        <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small leading-4 font-medium text-neutral-900 sm:text-[11.5px]">
          {title}
        </span>
        {description && (
          <span className="mt-3 line-clamp-2 block text-[10.5px] leading-4 text-neutral-500">
            {description}
          </span>
        )}
      </span>
      <ExternalLink
        className="mt-auto mb-2 size-3.5 shrink-0 text-neutral-500 transition-colors group-hover:text-primary-500"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
