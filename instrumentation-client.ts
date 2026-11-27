import posthog from "posthog-js";

// PostHog product analytics (AGENTS.md §7). The project key is public by design.
// Events go through the /ingest rewrite in next.config.ts so ad blockers don't drop them.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

if (key) {
  try {
    posthog.init(key, {
      api_host: "/ingest",
      ui_host: host.replace(".i.posthog.com", ".posthog.com"),
      // Captures $pageview / $pageleave on App Router navigations.
      defaults: "2026-08-30",
    });
  } catch (error) {
    console.error("PostHog init failed", error);
  }
}
