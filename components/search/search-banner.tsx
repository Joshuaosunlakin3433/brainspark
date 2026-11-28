import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

/** "Can't find it?" call-out that points to the full catalog. Also the empty state's action. */
export function SearchBanner({
  title = "Can’t find what you’re looking for?",
  body = "Try different keywords or browse our full course catalog.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-primary-100 bg-primary-100/45 px-5 py-4 sm:flex-row sm:items-center sm:gap-7 sm:px-7">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-100"
      >
        <Search className="size-6 text-primary-500" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-lg font-medium text-neutral-900">{title}</p>
        <p className="mt-0.5 text-body text-neutral-500">{body}</p>
      </div>
      <Link
        href="/courses"
        className="inline-flex h-11 items-center gap-6 self-start rounded-md border border-neutral-200 bg-white px-5 text-body font-medium whitespace-nowrap text-primary-500 transition-colors hover:bg-neutral-50 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 sm:self-auto"
      >
        Browse all courses
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
