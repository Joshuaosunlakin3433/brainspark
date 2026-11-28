import Link from "next/link";
import { HeaderAuth } from "@/components/header-auth";
import { Logo, NavLink } from "@/components/ui";

/** `active` highlights a nav item; pages without one leave both neutral. */
export function SiteHeader({ active }: { active?: "courses" | "my-learning" } = {}) {
  return (
    <header className="border-b border-neutral-200">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:h-24 sm:flex-nowrap sm:px-10 sm:py-0">
        <Link
          href="/"
          aria-label="BrainSpark home"
          className="shrink-0 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-400"
        >
          <Logo size="lg" className="[&>span:last-child]:text-2xl" />
        </Link>
        <nav
          aria-label="Main"
          className="order-last flex w-full items-center gap-6 sm:order-none sm:ml-9 sm:w-auto sm:gap-10.5"
        >
          <NavLink href="/courses" active={active === "courses"} className="text-body sm:text-body-lg">
            Courses
          </NavLink>
          <NavLink href="/my-learning" active={active === "my-learning"} className="text-body whitespace-nowrap sm:text-body-lg">
            My Learning
          </NavLink>
        </nav>
        <HeaderAuth />
      </div>
    </header>
  );
}
