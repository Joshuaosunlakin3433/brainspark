import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("rounded-sm border border-neutral-200 bg-white p-4 shadow-sm", className)}
    />
  );
}
