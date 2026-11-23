import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "video" | "lesson" | "popular";

const variants: Record<BadgeVariant, string> = {
  video: "border border-primary-200 bg-primary-100 text-primary-500",
  lesson: "bg-lesson-100 text-lesson-600",
  popular: "bg-primary-100 text-primary-500",
};

export function Badge({
  variant,
  children,
  className,
}: {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-0.5 text-[10px] leading-4 font-semibold tracking-wider uppercase",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
