"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type FormEvent } from "react";
import { Search } from "lucide-react";
import { track } from "@/lib/analytics";

/** Search field on the results page. Submitting updates `?q=`; ⌘/Ctrl+K focuses it. */
export function SearchBox({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q || q === defaultValue) return;
    track("search_performed", { query: q, source: "search_page" });
    router.push(`/search?${new URLSearchParams({ q })}`);
  }

  return (
    <form role="search" onSubmit={onSubmit} className="w-full">
      <label htmlFor="search-page-input" className="sr-only">
        Search lessons and videos
      </label>
      <div className="flex h-13 items-center gap-3 rounded-md border border-neutral-200 bg-white pr-2.5 pl-4 shadow-sm transition-colors focus-within:border-primary-400 sm:pl-4.5">
        <Search className="size-5.5 shrink-0 text-neutral-700" strokeWidth={1.75} aria-hidden="true" />
        <input
          ref={inputRef}
          id="search-page-input"
          name="q"
          type="search"
          autoComplete="off"
          defaultValue={defaultValue}
          placeholder="Ask anything about your learning..."
          className="min-w-0 flex-1 bg-transparent text-body-lg text-neutral-900 outline-none placeholder:text-neutral-500"
        />
        <kbd
          aria-hidden="true"
          className="hidden h-8 shrink-0 items-center gap-1.5 rounded-sm border border-neutral-200 bg-white px-2 font-sans text-body text-neutral-700 sm:flex"
        >
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </div>
    </form>
  );
}
