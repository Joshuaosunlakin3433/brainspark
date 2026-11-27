import "server-only";

import { groq } from "@ai-sdk/groq";
import type { MCPClient } from "@ai-sdk/mcp";
import { APICallError, generateText, Output, RetryError } from "ai";
import { z } from "zod";

import { connectContextMcp, getInitialContext } from "./context";
import type { SearchEnv } from "./env";
import { SEARCH_SYSTEM_PROMPT } from "./system-prompt";
import type { AgentOutput, MatchTier } from "./types";

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

    onStatus?.("Searching lessons…");
    const rows = await runGroq(mcp, rankingQuery(primary, secondary), signal);
    if (!rows) throw new Error("Context MCP rejected the ranking query");
    return toMatches(rows);
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

/** Runs a GROQ query through the Context MCP. Returns null when the query errors. */
async function runGroq(mcp: MCPClient, groqQuery: string, signal: AbortSignal): Promise<Row[] | null> {
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
      (r): r is Row => typeof r === "object" && r !== null && typeof (r as Row)._id === "string",
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

/** Keeps result order; tiers are relative to the best score. */
function toMatches(rows: Row[]): AgentOutput["matches"] {
  const top = Math.max(0, ...rows.map((r) => r._score ?? 0));
  return rows.map((r) => ({ lessonId: r._id, tier: tierFor(r._score, top) }));
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
