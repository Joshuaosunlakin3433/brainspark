import Link from "next/link";
import { Bell, User } from "lucide-react";
import { Logo, NavLink } from "@/components/ui";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:h-24 sm:flex-nowrap sm:px-10 sm:py-0">
        <Link
          href="/"
          aria-label="Vertex home"
          className="shrink-0 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-400"
        >
          <Logo size="lg" className="[&>span:last-child]:text-2xl" />
        </Link>
        <nav
          aria-label="Main"
          className="order-last flex w-full items-center gap-6 sm:order-none sm:ml-9 sm:w-auto sm:gap-10.5"
        >
          <NavLink href="/courses" className="text-body sm:text-body-lg">
            Courses
          </NavLink>
          <NavLink href="/my-learning" className="text-body whitespace-nowrap sm:text-body-lg">
            My Learning
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          {/* Presentational only (AGENTS.md §7). */}
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-400"
          >
            <Bell className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </button>
          {/* Placeholder avatar — replaced by Clerk's UserButton in the auth task. */}
          <span
            role="img"
            aria-label="Account"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500 sm:size-13"
          >
            <User className="size-5 sm:size-6" aria-hidden="true" />
          </span>
        </div>
      </div>
    </header>
  );
}
