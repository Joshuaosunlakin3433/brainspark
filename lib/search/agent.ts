import "server-only";

import { groq } from "@ai-sdk/groq";
import type { MCPClient } from "@ai-sdk/mcp";
import { APICallError, generateText, Output, RetryError } from "ai";
import { z } from "zod";

import { connectContextMcp, getInitialContext } from "./context";
import type { SearchEnv } from "./env";
import { SEARCH_SYSTEM_PROMPT } from "./system-prompt";
import type { AgentOutput, MatchTier, VideoMoment } from "./types";

/** The provider rejected the call for rate limits (Groq free tier). */
export class SearchBusyError extends Error {}

// One model call: the model picks the search terms (keywords, synonyms, stems); the
// server turns them into the ranking query. A multi-step agent loop overran Groq's free
// 8k tokens/minute, and model-written OR queries were unreliable
// (see prompts/search-groq-provider.md).
const planSchema = z.object({
  primary: z
    .array(z.string().max(40))
    .max(6)
    .describe('Stems for the main concept and its synonyms, e.g. ["cach"]. A lesson must match one of these. Empty when the text is not a learning search.'),
  secondary: z
    .array(z.string().max(40))
    .max(6)
    .describe('Stems for supporting context that refines ranking, e.g. ["revalidat", "invalidat"]. Never generic words.'),
});

const STOPWORDS = new Set(
  "a an and are as at be by can do does for from how i in into is it me my of on or should the to use using what when where which why with you your".split(
    " ",
  ),
);

// Too common in this catalog to say anything about a topic; they flood results.
const GENERIC = new Set(
  "data code app apps application build building work working thing things learn learning make way get set new basic basics intro introduction simple better best good".split(
    " ",
  ),
);

// Score weights per field. The main concept dominates; supporting terms only reorder.
const PRIMARY_WEIGHTS = { title: 6, keyPoints: 4, notes: 2 };
const SECONDARY_WEIGHTS = { title: 2, keyPoints: 1, notes: 1 };
// Chapter labels are clean, so a chapter hit counts like a title hit; transcript text is noisy.
const VIDEO_WEIGHTS = {
  primary: { chapter: 5, transcript: 1 },
  secondary: { chapter: 2, transcript: 0.5 },
};

/**
 * Finds lessons for a query and returns their ids ranked best first.
 * The ids are untrusted: callers must re-fetch them (see hydrate.ts).
 */
export async function findLessonMatches({
  query,
  env,
  signal,
  onStatus,
}: {
  query: string;
  env: SearchEnv;
  signal: AbortSignal;
  onStatus?: (message: string) => void;
}): Promise<AgentOutput["matches"]> {
  const [mcp, initialContext] = await Promise.all([connectContextMcp(env), getInitialContext(env)]);

  try {
    onStatus?.("Understanding your query…");
    const plan = await planQuery(query, env, initialContext, signal);

    // Model unavailable or unparseable: treat the query's own words as the main concept.
    let primary = cleanKeywords(plan ? plan.primary : query.split(/\s+/));
    let secondary = cleanKeywords(plan?.secondary ?? []).filter((k) => !primary.includes(k));
    if (primary.length === 0) [primary, secondary] = [secondary, []];
    if (primary.length === 0) return [];

    onStatus?.("Searching lessons and videos…");
    const [lessonRows, videoRows] = await Promise.all([
      runGroq<Row>(mcp, rankingQuery(primary, secondary), signal),
      runGroq<VideoRow>(mcp, videoMomentQuery(primary, secondary), signal),
    ]);
    if (!lessonRows) throw new Error("Context MCP rejected the ranking query");
    // Video moments refine results; if that query fails, lessons alone still answer.
    if (!videoRows) console.error("[search] video moment query failed, returning lessons only");
    return mergeMatches(lessonRows, videoRows ?? []);
  } catch (error) {
    if (isRateLimited(error)) throw new SearchBusyError("Search model rate limited", { cause: error });
    throw error;
  } finally {
    await mcp.close();
  }
}

async function planQuery(
  query: string,
  env: SearchEnv,
  initialContext: string | null,
  signal: AbortSignal,
) {
  try {
    const { output } = await generateText({
      model: groq(env.model),
      instructions: initialContext
        ? `${SEARCH_SYSTEM_PROMPT}\n\n# Data reference\n\n${initialContext}`
        : SEARCH_SYSTEM_PROMPT,
      prompt: query,
      output: Output.object({ schema: planSchema }),
      maxRetries: 1,
      abortSignal: signal,
      providerOptions: { groq: { reasoningEffort: "low" } },
    });
    return output;
  } catch (error) {
    if (isRateLimited(error) || signal.aborted) throw error;
    // Bad or missing structured output: fall back to the keyword query.
    console.error("[search] query planning failed, using keyword fallback", error);
    return null;
  }
}

type Row = { _id: string; _score?: number };

type VideoRow = Row & {
  /** True when a chapter label matches a primary term: enough to qualify the lesson. */
  primaryChapter?: boolean;
  chapter?: { startSeconds?: unknown } | null;
  chunk?: { startSeconds?: unknown } | null;
  lessonIds?: unknown;
};

/** Runs a GROQ query through the Context MCP. Returns null when the query errors. */
async function runGroq<T extends Row>(
  mcp: MCPClient,
  groqQuery: string,
  signal: AbortSignal,
): Promise<T[] | null> {
  const res = await mcp.callTool({
    name: "groq_query",
    arguments: { query: groqQuery },
    options: { signal },
  });
  const text = (res.content as { type: string; text?: string }[] | undefined)?.find(
    (c) => c.type === "text",
  )?.text;
  if (res.isError || !text) return null;
  try {
    const parsed = JSON.parse(text) as { result?: unknown };
    if (!Array.isArray(parsed.result)) return null;
    // Non-lesson ids are dropped later by hydration, which only fetches _type == "lesson".
    return parsed.result.filter(
      (r): r is T => typeof r === "object" && r !== null && typeof (r as Row)._id === "string",
    );
  } catch {
    // Not JSON: the MCP reports query errors as plain text.
    return null;
  }
}

/**
 * Turns terms into match patterns: lowercase [a-z0-9] stems with a trailing wildcard.
 * Match is prefix based ("cache*" misses "caching"), so common suffixes are trimmed.
 * A multi-word term ("server component") becomes "server* component*", which GROQ
 * matches only when both words appear. Anything else is dropped.
 */
function cleanKeywords(raw: string[]): string[] {
  const out = new Set<string>();
  for (const term of raw) {
    const words = term
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 2 && w.length <= 30 && !STOPWORDS.has(w))
      .slice(0, 3);
    // A single generic word says nothing; inside a phrase it still narrows.
    if (words.length === 0 || (words.length === 1 && GENERIC.has(words[0]))) continue;
    out.add(words.map((w) => `${stem(w)}*`).join(" "));
  }
  return [...out].slice(0, 6);
}

function stem(word: string): string {
  if (word.length <= 4) return word;
  const trimmed = word.replace(/(ing|ion|ions|ed|es|s|e)$/, "");
  return trimmed.length >= 3 ? trimmed : word;
}

/**
 * The Instructions' ranking pattern. An array on the right of `match` means AND, so each
 * term gets its own clause (OR). A lesson must match a primary term; secondary terms only
 * add score. Terms are pre-sanitised, so inlining them is safe.
 */
function rankingQuery(primary: string[], secondary: string[]): string {
  const anyField = (t: string) => `title match ${t} || keyPoints[] match ${t} || pt::text(notes) match ${t}`;
  const scoreTerms = (terms: string[], w: typeof PRIMARY_WEIGHTS) =>
    terms.map(
      (t) =>
        `boost(title match ${t}, ${w.title}), boost(keyPoints[] match ${t}, ${w.keyPoints}), boost(pt::text(notes) match ${t}, ${w.notes})`,
    );

  const p = primary.map((k) => JSON.stringify(k));
  const s = secondary.map((k) => JSON.stringify(k));
  const filter = p.map(anyField).join(" || ");
  const score = [...scoreTerms(p, PRIMARY_WEIGHTS), ...scoreTerms(s, SECONDARY_WEIGHTS)].join(", ");
  return `*[_type == "lesson" && (${filter})] | score(${score}) | order(_score desc)[0...60]{ _id, _score }`;
}

/**
 * Video moments (AGENTS.md §7, §11): chapters first, the transcript as the backstop.
 * Only a primary term qualifies a video; secondary terms add score. Projects just one
 * matching chapter and chunk start, never the chapters or chunks arrays (§12),
 * and the lessons that use the video (videos are an internal lookup, never results).
 */
function videoMomentQuery(primary: string[], secondary: string[]): string {
  const p = primary.map((k) => JSON.stringify(k));
  const s = secondary.map((k) => JSON.stringify(k));
  const any = (terms: string[], field: string) => terms.map((t) => `${field} match ${t}`).join(" || ");
  // A match at 0:00 is usually the video's title/intro naming the topic, so prefer the
  // first match after it. Order: primary later, primary any, secondary later, secondary any.
  const first = (array: string, field: string) => {
    const pick = (terms: string[], later: boolean) =>
      `${array}[(${any(terms, field)})${later ? " && startSeconds > 0" : ""}][0]{ startSeconds }`;
    const picks = [pick(p, true), pick(p, false)];
    if (s.length) picks.push(pick(s, true), pick(s, false));
    return `coalesce(${picks.join(", ")})`;
  };
  const score = [
    ...p.flatMap((t) => [
      `boost(chapters[].label match ${t}, ${VIDEO_WEIGHTS.primary.chapter})`,
      `boost(chunks[].text match ${t}, ${VIDEO_WEIGHTS.primary.transcript})`,
    ]),
    ...s.flatMap((t) => [
      `boost(chapters[].label match ${t}, ${VIDEO_WEIGHTS.secondary.chapter})`,
      `boost(chunks[].text match ${t}, ${VIDEO_WEIGHTS.secondary.transcript})`,
    ]),
  ].join(", ");
  return `*[_type == "video" && (${any(p, "chapters[].label")} || ${any(p, "chunks[].text")})]
  | score(${score}) | order(_score desc)[0...80]{
    _id, _score,
    "primaryChapter": count(chapters[${any(p, "label")}]) > 0,
    "chapter": ${first("chapters", "label")},
    "chunk": ${first("chunks", "text")},
    "lessonIds": *[_type == "lesson" && videoUrl == ^.url]._id
  }`;
}

/**
 * One match per lesson. A lesson qualifies by its own topic or by a primary chapter
 * match; a transcript-only hit is too noisy to qualify a lesson alone, but still gives
 * a topic-matched lesson its moment. Score = topic score + video score.
 */
function mergeMatches(lessonRows: Row[], videoRows: VideoRow[]): AgentOutput["matches"] {
  const merged = new Map<string, { score: number; moment: VideoMoment | null }>();
  for (const r of lessonRows) merged.set(r._id, { score: r._score ?? 0, moment: null });

  for (const v of videoRows) {
    const moment = momentOf(v);
    const ids = Array.isArray(v.lessonIds) ? v.lessonIds.filter((id) => typeof id === "string") : [];
    for (const id of ids) {
      const entry = merged.get(id);
      if (!entry && !v.primaryChapter) continue;
      const base = entry?.score ?? 0;
      // A lesson has one video; keep the first (best scored) if ids ever repeat.
      if (entry?.moment) continue;
      merged.set(id, { score: base + (v._score ?? 0), moment });
    }
  }

  const ranked = [...merged].sort((a, b) => b[1].score - a[1].score);
  const top = Math.max(0, ...ranked.map(([, m]) => m.score));
  return ranked.map(([lessonId, m]) => ({
    lessonId,
    tier: tierFor(m.score, top),
    moment: m.moment,
  }));
}

function momentOf(v: VideoRow): VideoMoment | null {
  const seconds = (x: unknown) => (Number.isInteger(x) && (x as number) >= 0 ? (x as number) : null);
  const chapter = seconds(v.chapter?.startSeconds);
  if (chapter !== null) return { startSeconds: chapter, source: "chapter" };
  const chunk = seconds(v.chunk?.startSeconds);
  return chunk !== null ? { startSeconds: chunk, source: "transcript" } : null;
}

function tierFor(score: number | undefined, top: number): MatchTier {
  if (!score || top <= 0) return "related";
  const ratio = score / top;
  return ratio >= 0.75 ? "exact" : ratio >= 0.35 ? "strong" : "related";
}

function isRateLimited(error: unknown): boolean {
  const last = RetryError.isInstance(error) ? error.lastError : error;
  return APICallError.isInstance(last) && last.statusCode === 429;
}
