import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  showLabel = true,
  label = "Progress",
  className,
}: {
  value: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200"
      >
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="shrink-0 text-small text-neutral-900">
          <span className="font-semibold">{pct}%</span> complete
        </span>
      )}
    </div>
  );
}
