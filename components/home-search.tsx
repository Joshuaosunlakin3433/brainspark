"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type FormEvent } from "react";
import { Search } from "lucide-react";
import { track } from "@/lib/analytics";

export function HomeSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q) return;
    track("search_performed", { query: q, source: "home" });
    router.push(`/search?${new URLSearchParams({ q })}`);
  }

  return (
    <form role="search" onSubmit={onSubmit} className="w-full">
      <label htmlFor="home-search" className="sr-only">
        Search your learning
      </label>
      <div className="flex h-16 items-center gap-3 rounded-md border border-neutral-200 bg-white pr-3 pl-4 shadow-sm transition-colors focus-within:border-primary-400 sm:h-21 sm:gap-4 sm:pr-5.5 sm:pl-6">
        <Search
          className="size-5 shrink-0 text-neutral-700 sm:size-6.5"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="home-search"
          name="q"
          type="search"
          autoComplete="off"
          placeholder="Ask anything about your learning..."
          className="min-w-0 flex-1 bg-transparent text-body-lg text-neutral-900 outline-none placeholder:text-neutral-500 sm:text-xl"
        />
        <kbd
          aria-hidden="true"
          className="hidden h-10.5 shrink-0 items-center gap-1.5 rounded-sm border border-neutral-200 bg-white px-3.5 font-sans text-lg text-neutral-700 sm:flex"
        >
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </div>
    </form>
  );
}
