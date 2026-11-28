import { z } from "zod";

// Shared between the search route and the (future) results page. No secrets, no server imports.

export const searchRequestSchema = z.object({
  q: z.string().trim().min(2).max(200),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const matchTiers = ["exact", "strong", "related"] as const;
export type MatchTier = (typeof matchTiers)[number];

/** What the model must return: lesson ids from tool results, best first. Nothing it writes is shown. */
export const agentOutputSchema = z.object({
  matches: z
    .array(
      z.object({
        lessonId: z.string().min(1).max(128),
        tier: z.enum(matchTiers),
      }),
    )
    .max(100),
});

export type AgentOutput = z.infer<typeof agentOutputSchema>;

type ResultCourse = { id: string; title: string; slug: string; iconUrl: string | null };
type ResultModule = { title: string; number: number };

export type LessonResult = {
  kind: "lesson";
  rank: number;
  tier: MatchTier;
  lesson: {
    id: string;
    title: string;
    slug: string;
    durationSeconds: number | null;
    posterUrl: string | null;
    keyPoints: string[];
    description: string | null;
  };
  course: ResultCourse;
  module: ResultModule;
  /** "Lesson 5.1", derived from array order. */
  label: string;
  /** Lesson page URL. */
  href: string;
};

/** A lesson's video matched at a moment. Typed now, produced once video ingestion lands. */
export type VideoResult = {
  kind: "video";
  rank: number;
  tier: MatchTier;
  lesson: LessonResult["lesson"];
  course: ResultCourse;
  module: ResultModule;
  label: string;
  startSeconds: number;
  matchedText: string;
  /** Lesson page URL with `?t=<startSeconds>`. */
  href: string;
};

export type SearchResult = LessonResult | VideoResult;

export type SearchResponse = {
  query: string;
  total: number;
  courseCount: number;
  results: SearchResult[];
};

/** One NDJSON line from `POST /api/search`. */
export type SearchStreamEvent =
  | { type: "status"; message: string }
  | ({ type: "results" } & SearchResponse)
  | { type: "error"; message: string };
