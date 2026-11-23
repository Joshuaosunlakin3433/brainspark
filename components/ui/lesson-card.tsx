import Link from "next/link";
import { CirclePlay, ExternalLink } from "lucide-react";
import { Badge } from "./badge";
import { Card } from "./card";

type Common = { href: string; title: string; description: string };

export type LessonCardProps =
  | (Common & { kind: "video"; lessonLabel: string; timestamp: string })
  | (Common & { kind: "lesson"; moduleLabel: string });

const action =
  "flex items-center gap-1.5 font-medium text-primary-500 hover:text-primary-600";

export function LessonCard(props: LessonCardProps) {
  return (
    <Card className="flex flex-col">
      <Badge variant={props.kind} className="self-start">
        {props.kind === "video" ? "Video" : "Lesson"}
      </Badge>
      <h3 className="mt-3 text-body font-semibold text-neutral-900">{props.title}</h3>
      <p className="mt-2 text-small text-neutral-500">{props.description}</p>
      <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-[11px] leading-4 text-neutral-700">
        {props.kind === "video" ? (
          <>
            <span>
              {props.lessonLabel}
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              {props.timestamp}
            </span>
            <Link href={props.href} className={action}>
              <CirclePlay className="size-3.5" aria-hidden="true" />
              Watch from {props.timestamp}
            </Link>
          </>
        ) : (
          <>
            <span>{props.moduleLabel}</span>
            <Link href={props.href} className={action}>
              View lesson
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
