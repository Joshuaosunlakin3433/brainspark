import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 28" className={cn("h-7 w-8", className)} aria-hidden="true">
      <path d="M0 0h32L16 28Z" className="fill-primary-500" />
      <path d="M9 4h14l-7 12.25Z" className="fill-white" />
    </svg>
  );
}

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={size === "lg" ? "h-7 w-8" : "h-5 w-6"} />
      <span
        className={cn(
          "font-semibold tracking-tight text-neutral-900",
          size === "lg" ? "text-h1" : "text-h3",
        )}
      >
        Vertex
      </span>
    </span>
  );
}
