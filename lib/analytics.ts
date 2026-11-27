import posthog from "posthog-js";

/**
 * Engagement events (AGENTS.md §7). One typed list so every surface sends
 * the same names and props. Browser only: uses the public PostHog key.
 */
export type AnalyticsEvents = {
  catalog_viewed: Record<string, never>;
  search_performed: { query: string; source: "home" | "search_page" };
  lesson_viewed: { lessonSlug: string; courseSlug: string };
  video_played: { lessonSlug: string; provider: "youtube" | "vimeo" | "bunny"; startSeconds: number };
  video_progress: { lessonSlug: string; percent: 25 | 50 | 75 | 100 };
  lesson_completed: { lessonSlug: string; courseSlug: string };
};

export type AnalyticsEvent = keyof AnalyticsEvents;

/** Captures an event. No-op when PostHog is not initialised (e.g. no key set). */
export function track<E extends AnalyticsEvent>(event: E, props: AnalyticsEvents[E]): void {
  if (!posthog.__loaded) return;
  posthog.capture(event, props);
}
