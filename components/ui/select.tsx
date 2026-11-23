import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { fieldClasses } from "./input";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select {...props} className={cn(fieldClasses, "cursor-pointer appearance-none pr-10")}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-neutral-700"
        aria-hidden="true"
      />
    </div>
  );
}
