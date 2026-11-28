"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui";
import type { SearchResponse, SearchResult, SearchStreamEvent } from "@/lib/search/types";
import { LessonResultCard } from "./lesson-result-card";
import { SearchBanner } from "./search-banner";
import { SearchBox } from "./search-box";
import { VideoResultCard } from "./video-result-card";

type State =
  | { status: "idle" }
  | { status: "loading"; message: string }
  | { status: "done"; response: SearchResponse }
  | { status: "error"; message: string };

const sorts = {
  relevant: { label: "Most Relevant", compare: (a: SearchResult, b: SearchResult) => a.rank - b.rank },
  videos: { label: "Videos first", compare: byKind("video") },
  lessons: { label: "Lessons first", compare: byKind("lesson") },
  shortest: {
    label: "Shortest first",
    compare: (a: SearchResult, b: SearchResult) =>
      (a.lesson.durationSeconds ?? Infinity) - (b.lesson.durationSeconds ?? Infinity) || a.rank - b.rank,
  },
} as const;
type SortKey = keyof typeof sorts;

function byKind(first: SearchResult["kind"]) {
  return (a: SearchResult, b: SearchResult) =>
    Number(b.kind === first) - Number(a.kind === first) || a.rank - b.rank;
}

/** Reads `?q=`, streams `POST /api/search`, and renders the ranked results (AGENTS.md §11). */
export function SearchResultsView() {
  const q = (useSearchParams().get("q") ?? "").trim();
  const [attempt, setAttempt] = useState(0);
  // A new query or a retry remounts the run, so it starts fresh (loading, default sort).
  return <SearchRun key={`${attempt}:${q}`} q={q} onRetry={() => setAttempt((n) => n + 1)} />;
}

function SearchRun({ q, onRetry }: { q: string; onRetry: () => void }) {
  const runnable = q.length >= 2 && q.length <= 200;
  const [state, setState] = useState<State>(
    runnable ? { status: "loading", message: "Searching…" } : { status: "idle" },
  );
  const [sort, setSort] = useState<SortKey>("relevant");

  useEffect(() => {
    if (!runnable) return;
    const controller = new AbortController();
    runSearch(q, controller.signal, setState).catch(() => {
      if (!controller.signal.aborted) {
        setState({ status: "error", message: "Search is unavailable right now." });
      }
    });
    return () => controller.abort();
  }, [q, runnable]);

  const results = useMemo(
    () => (state.status === "done" ? [...state.response.results].sort(sorts[sort].compare) : []),
    [state, sort],
  );

  return (
    <>
      <section aria-labelledby="search-heading" className="flex flex-col items-center text-center">
        <span className="rounded-xs bg-primary-100 px-2.5 py-1 text-small font-medium tracking-wider text-primary-500 uppercase">
          Search results
        </span>
        <h1
          id="search-heading"
          className="mt-4 font-display text-h1 font-medium tracking-tight text-neutral-900 sm:text-[2.5rem] sm:leading-12"
        >
          {runnable ? (
            <>
              Results for <span className="text-primary-500">“{q}”</span>
            </>
          ) : (
            "Search your learning"
          )}
        </h1>
        <p aria-live="polite" className="mt-2.5 min-h-6 text-body-lg text-neutral-500">
          {!runnable && "Search lessons and the exact moments in their videos."}
          {state.status === "loading" && runnable && state.message}
          {state.status === "done" && runnable && summary(state.response)}
        </p>
        <div className="mt-6 w-full max-w-182">
          <SearchBox defaultValue={q} />
        </div>
      </section>

      {runnable && (
        <section aria-label="Results" className="mt-8 sm:mt-4.5">
          {state.status === "loading" && <ResultsSkeleton />}

          {state.status === "error" && (
            <div role="alert" className="rounded-md border border-neutral-200 bg-white p-6 text-center">
              <p className="text-body-lg text-neutral-900">{state.message}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 font-medium text-primary-500 hover:text-primary-600"
              >
                Try again
              </button>
            </div>
          )}

          {state.status === "done" && results.length === 0 && (
            <p className="py-6 text-center text-body-lg text-neutral-700">
              No lessons or videos matched “{q}”.
            </p>
          )}

          {state.status === "done" && results.length > 0 && (
            <>
              <div className="mb-2.5 flex items-center justify-between gap-4">
                <p className="text-body-lg font-medium text-neutral-900 sm:text-[15px]">
                  {plural(results.length, "result")}
                </p>
                <label className="sr-only" htmlFor="search-sort">
                  Sort results
                </label>
                <Select
                  id="search-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="w-41.5 [&_select]:h-9.5 [&_select]:text-body"
                >
                  {Object.entries(sorts).map(([key, s]) => (
                    <option key={key} value={key}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
              <ol className="flex flex-col gap-2.5">
                {results.map((r) => (
                  <li key={r.lesson.id}>
                    {r.kind === "video" ? (
                      <VideoResultCard result={r} />
                    ) : (
                      <LessonResultCard result={r} />
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}

      {(state.status === "done" || !runnable) && (
        <div className="mt-2.5">
          <SearchBanner />
        </div>
      )}
    </>
  );
}

/** Reads the NDJSON stream: status lines, then one results or error line. */
async function runSearch(q: string, signal: AbortSignal, setState: (s: State) => void) {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Search failed: HTTP ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let finished = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as SearchStreamEvent;
      if (event.type === "status") setState({ status: "loading", message: event.message });
      else if (event.type === "error") {
        finished = true;
        setState({ status: "error", message: event.message });
      } else {
        finished = true;
        const { query, total, courseCount, results } = event;
        setState({ status: "done", response: { query, total, courseCount, results } });
      }
    }
  }
  if (!finished) throw new Error("Search stream ended early");
}

function summary(r: SearchResponse) {
  if (r.total === 0) return "Found no results";
  return `Found ${plural(r.total, "result")} across ${plural(r.courseCount, "course")}`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function ResultsSkeleton() {
  return (
    <div aria-hidden="true" className="flex animate-pulse flex-col gap-2.5 pt-12">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-4 sm:flex-row sm:gap-9"
        >
          <div className="aspect-274/142 w-full rounded-sm bg-neutral-100 sm:w-68.5" />
          <div className="flex flex-1 flex-col gap-3 pt-1">
            <div className="h-4 w-40 rounded-xs bg-neutral-100" />
            <div className="h-5 w-3/4 rounded-xs bg-neutral-100" />
            <div className="h-4 w-full rounded-xs bg-neutral-100" />
            <div className="h-4 w-1/2 rounded-xs bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
