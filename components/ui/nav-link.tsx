import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function NavLink({
  href,
  active = false,
  children,
  className,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "font-medium transition-colors",
        className ?? "text-body",
        active ? "text-primary-500" : "text-neutral-900 hover:text-primary-500",
      )}
    >
      {children}
    </Link>
  );
}
