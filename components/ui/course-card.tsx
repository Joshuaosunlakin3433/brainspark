import Link from "next/link";
import type { ReactNode } from "react";
import { ChartNoAxesColumnIncreasing, Clock, Folder } from "lucide-react";
import { Card } from "./card";

export function CourseCard({
  href,
  icon,
  title,
  summary,
  level,
  duration,
  moduleCount,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  summary: string;
  level: string;
  duration: string;
  moduleCount: number;
}) {
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
