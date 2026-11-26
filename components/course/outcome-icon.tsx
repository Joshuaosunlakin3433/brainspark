import {
  Code,
  Database,
  Gauge,
  Globe,
  Layers,
  Rocket,
  Server,
  Shield,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

// Keys mirror `learningOutcomeIcons` in studio/schemaTypes/objects/learning-outcome.ts.
const icons: Record<string, LucideIcon> = {
  rocket: Rocket,
  layers: Layers,
  database: Database,
  zap: Zap,
  shield: Shield,
  code: Code,
  gauge: Gauge,
  server: Server,
  globe: Globe,
  sparkles: Sparkles,
};

export function OutcomeIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && icons[name]) || Sparkles;
  return <Icon className={cn("text-primary-500", className)} strokeWidth={1.25} aria-hidden="true" />;
}
