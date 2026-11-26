import { cn } from "@/lib/cn";

type Bar = [width: number, height: number, tone: "soft" | "mid" | "strong"];

// Decorative bar clusters at the bottom of a page: [width px, height px, strength].
const leftBars: Bar[] = [
  [72, 90, "soft"],
  [60, 130, "mid"],
  [40, 152, "mid"],
  [58, 190, "strong"],
  [90, 132, "mid"],
  [50, 96, "soft"],
];
const rightBars: Bar[] = [
  [28, 60, "soft"],
  [86, 92, "mid"],
  [78, 114, "mid"],
  [50, 150, "strong"],
  [62, 186, "strong"],
  [50, 94, "mid"],
  [38, 132, "mid"],
  [98, 170, "strong"],
];

const barTone = {
  soft: "from-primary-300/60",
  mid: "from-primary-300/85",
  strong: "from-primary-400/90",
};

function BarCluster({ bars, className }: { bars: Bar[]; className?: string }) {
  return (
    <div className={cn("flex items-end", className)}>
      {bars.map(([w, h, tone], i) => (
        <div
          key={i}
          className={cn("bg-linear-to-t to-primary-100/0", barTone[tone])}
          style={{ width: w, height: h }}
        />
      ))}
    </div>
  );
}

export function DecorativeBars({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none flex h-48 items-end justify-between overflow-hidden",
        className,
      )}
    >
      <BarCluster bars={leftBars} className="max-sm:origin-left max-sm:scale-x-50" />
      <BarCluster bars={rightBars} className="max-sm:origin-right max-sm:scale-x-50" />
    </div>
  );
}
