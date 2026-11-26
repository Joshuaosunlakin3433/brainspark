"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const TABS = [
  { id: "content", label: "Lesson Content" },
  { id: "notes", label: "Notes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Lesson Content (server-rendered, passed in) and a presentational Notes tab (not saved). */
export function LessonTabs({ content }: { content: ReactNode }) {
  const [active, setActive] = useState<TabId>("content");
  const [draft, setDraft] = useState("");
  const base = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    setActive(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Lesson sections" className="flex gap-2 border-b border-neutral-200 sm:gap-4">
        {TABS.map((tab, i) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "-mb-px border-b-2 px-4.5 pt-1 pb-3.5 font-display text-[15px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-400",
                selected
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-neutral-700 hover:text-neutral-900",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${base}-panel-content`}
        aria-labelledby={`${base}-tab-content`}
        hidden={active !== "content"}
      >
        {content}
      </div>

      <div
        role="tabpanel"
        id={`${base}-panel-notes`}
        aria-labelledby={`${base}-tab-notes`}
        hidden={active !== "notes"}
        className="px-0 pt-8 sm:px-4.5"
      >
        <label htmlFor={`${base}-notes`} className="font-display text-lg font-medium text-neutral-900">
          Your notes
        </label>
        <textarea
          id={`${base}-notes`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          placeholder="Jot down what stood out in this lesson…"
          className="mt-4 block w-full resize-y rounded-sm border border-neutral-200 bg-white px-4 py-3 text-body leading-6 text-neutral-900 placeholder:text-neutral-500 focus-visible:border-primary-400 focus-visible:outline-2 focus-visible:outline-primary-200"
        />
        <p className="mt-2 text-small text-neutral-500">Notes are not saved yet.</p>
      </div>
    </div>
  );
}
