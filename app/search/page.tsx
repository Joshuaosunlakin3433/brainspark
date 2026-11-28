import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { SearchResultsView } from "@/components/search/search-results-view";

export const metadata: Metadata = {
  title: "Search | BrainSpark",
  description: "Search BrainSpark lessons and jump to the exact moment in a video.",
  robots: { index: false },
};

// The frame renders instantly; the results view reads `?q=` on the client, inside its
// own boundary, and talks only to POST /api/search (AGENTS.md §5).
export default function SearchPage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas bg-hatch">
      <div className="mx-auto flex w-full max-w-270 flex-1 flex-col bg-canvas min-[1080px]:border-x min-[1080px]:border-neutral-200">
        <SiteHeader active="courses" />
        <main className="flex flex-1 flex-col px-5 pt-7 pb-12 sm:px-19.5">
          <Suspense>
            <SearchResultsView />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
