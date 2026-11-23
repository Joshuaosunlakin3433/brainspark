import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const fieldClasses =
  "h-11 w-full rounded-md border border-neutral-200 bg-white px-4 text-body text-neutral-900 placeholder:text-neutral-500 outline-none transition-colors focus:border-primary-400 disabled:bg-neutral-50 disabled:text-neutral-300";

export function Input({
  leadingIcon,
  trailing,
  className,
  ...props
}: ComponentProps<"input"> & { leadingIcon?: ReactNode; trailing?: ReactNode }) {
  return (
    <div className={cn("relative flex items-center", className)}>
      {leadingIcon && (
        <span className="pointer-events-none absolute left-4 flex text-neutral-700 [&_svg]:size-[18px]">
          {leadingIcon}
        </span>
      )}
      <input
        {...props}
        className={cn(fieldClasses, leadingIcon && "pl-11", trailing && "pr-14")}
      />
      {trailing && <span className="absolute right-4 flex">{trailing}</span>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="font-sans text-small font-semibold text-neutral-900">{children}</kbd>;
}
