import { ExternalLink, FileText } from "lucide-react";
import { Card } from "./card";

export function ResourceCard({
  href,
  title,
  description,
  fileType,
  size,
}: {
  href: string;
  title: string;
  description: string;
  fileType: string;
  size?: string;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex gap-4">
        <FileText className="size-5 shrink-0 text-neutral-700" aria-hidden="true" />
        <div>
          <h3 className="text-body font-medium text-neutral-900">{title}</h3>
          <p className="mt-1 text-[11px] leading-4 text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between pt-6 text-[11px] leading-4 text-neutral-700">
        <span>
          {fileType}
          {size && (
            <>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              {size}
            </>
          )}
        </span>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 hover:text-primary-600"
          aria-label={`Open ${title}`}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </Card>
  );
}
