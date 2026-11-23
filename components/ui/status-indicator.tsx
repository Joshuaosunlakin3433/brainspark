import { CircleCheck, Lock, Play } from "lucide-react";
import { cn } from "@/lib/cn";

export type Status = "in-progress" | "completed" | "now-playing" | "locked";

const labels: Record<Status, string> = {
  "in-progress": "In Progress",
  completed: "Completed",
  "now-playing": "Now Playing",
  locked: "Locked",
};

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case "in-progress":
      return (
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            strokeWidth="2"
            className="stroke-neutral-200"
          />
          <path
            d="M8 1.5 A6.5 6.5 0 1 1 1.5 8"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-primary-500"
          />
        </svg>
      );
    case "completed":
      return <CircleCheck className="size-4 text-success-500" aria-hidden="true" />;
    case "now-playing":
      return (
        <span
          className="flex size-4 items-center justify-center rounded-full bg-primary-500"
          aria-hidden="true"
        >
          <Play className="size-2 fill-white text-white" />
        </span>
      );
    case "locked":
      return <Lock className="size-4 text-neutral-700" aria-hidden="true" />;
  }
}

export function StatusIndicator({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 text-small text-neutral-900", className)}
    >
      <StatusIcon status={status} />
      {label ?? labels[status]}
    </span>
  );
}
