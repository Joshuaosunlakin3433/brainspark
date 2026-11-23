import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set(
    [1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total),
  );
  if (current <= 3) [2, 3].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const item =
  "flex size-7 items-center justify-center rounded-xs text-small text-neutral-900 focus-visible:outline-2 focus-visible:outline-primary-400";

export function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
}: {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  const prev = currentPage > 1 ? currentPage - 1 : null;
  const next = currentPage < totalPages ? currentPage + 1 : null;
  return (
    <nav aria-label="Pagination">
      <ul className="flex items-center gap-2">
        <li>
          {prev ? (
            <Link href={hrefForPage(prev)} className={item} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className={cn(item, "text-neutral-300")} aria-hidden="true">
              <ChevronLeft className="size-4" />
            </span>
          )}
        </li>
        {pageList(currentPage, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className={cn(item, "text-neutral-500")} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefForPage(p)}
                aria-current={p === currentPage ? "page" : undefined}
                className={cn(
                  item,
                  p === currentPage
                    ? "border border-primary-500 text-primary-500"
                    : "hover:bg-neutral-100",
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {next ? (
            <Link href={hrefForPage(next)} className={item} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className={cn(item, "text-neutral-300")} aria-hidden="true">
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
