import { z } from "zod";

// Shared between the search route and the (future) results page (app/search). No secrets, no server imports.

export const searchRequestSchema = z.object({
  q: z.string().trim().min(2).max(200),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const matchTiers = ["exact", "strong", "related"] as const;
export type MatchTier = (typeof matchTiers)[number];

/** Where in a lesson's video the query matched: a chapter first, else a transcript chunk. */
export type VideoMoment = {
  startSeconds: number;
  source: "chapter" | "transcript";
};

/** Ranked lesson ids from the search queries, best first. Callers must re-fetch the ids. */
export type AgentOutput = {
  matches: { lessonId: string; tier: MatchTier; moment: VideoMoment | null }[];
};

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

/** A lesson's video matched at a moment. */
export type VideoResult = {
  kind: "video";
  rank: number;
  tier: MatchTier;
  lesson: LessonResult["lesson"];
  course: ResultCourse;
  module: ResultModule;
  label: string;
  startSeconds: number;
  /** Whether the moment came from a chapter label or the transcript. */
  momentSource: VideoMoment["source"];
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
