import Link from "next/link";
import type { ReactNode } from "react";
import { ChartNoAxesColumnIncreasing, Clock, File, Folder } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./card";

type CourseCardProps = {
  href: string;
  icon: ReactNode;
  title: string;
  summary: string;
  level: string;
  duration: string;
  moduleCount: number;
  /** "compact" = design-system card; "stacked" = home/catalog grid card. */
  layout?: "compact" | "stacked";
};

export function CourseCard({ layout = "compact", ...props }: CourseCardProps) {
  return layout === "stacked" ? <StackedCourseCard {...props} /> : <CompactCourseCard {...props} />;
}

function CompactCourseCard({
  href,
  icon,
  title,
  summary,
  level,
  duration,
  moduleCount,
}: Omit<CourseCardProps, "layout">) {
  return (
    <Card className="relative flex flex-col gap-6 transition-shadow hover:shadow-md">
      <div className="flex gap-4">
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xs bg-neutral-900 text-white">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-body font-semibold text-neutral-900">
            <Link href={href} className="after:absolute after:inset-0">
              {title}
            </Link>
          </h3>
          <p className="mt-1 text-small text-neutral-500">{summary}</p>
        </div>
      </div>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] leading-4 text-neutral-700">
        <li className="flex items-center gap-1.5">
          <ChartNoAxesColumnIncreasing className="size-3.5" aria-hidden="true" />
          {level}
        </li>
        <li className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          {duration}
        </li>
        <li className="flex items-center gap-1.5">
          <Folder className="size-3.5" aria-hidden="true" />
          {moduleCount} modules
        </li>
      </ul>
    </Card>
  );
}

function StackedCourseCard({
  href,
  icon,
  title,
  summary,
  level,
  duration,
  moduleCount,
}: Omit<CourseCardProps, "layout">) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-md border border-neutral-200 bg-white px-6 pt-8 pb-6 shadow-sm",
        "transition-shadow focus-within:shadow-md hover:shadow-md",
      )}
    >
      <div className="flex size-18 items-center">{icon}</div>
      <h3 className="mt-7 font-display text-[22px] leading-8 text-neutral-900">
        <Link
          href={href}
          className="rounded-xs after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary-400"
        >
          {title}
        </Link>
      </h3>
      <p className="mt-5 text-body leading-6 text-neutral-700">{summary}</p>
      <ul className="mt-auto flex items-center justify-between gap-x-1 border-t border-neutral-200 pt-5.5 text-[10px] leading-4 whitespace-nowrap text-neutral-700 [&_svg]:size-3.5">
        <li className="flex items-center gap-1">
          <ChartNoAxesColumnIncreasing aria-hidden="true" />
          {level}
        </li>
        <li className="flex items-center gap-1">
          <Clock aria-hidden="true" />
          {duration}
        </li>
        <li className="flex items-center gap-1">
          <File aria-hidden="true" />
          {moduleCount} modules
        </li>
      </ul>
    </div>
  );
}
