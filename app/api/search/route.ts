import { findLessonMatches, SearchBusyError } from "@/lib/search/agent";
import { getSearchEnv, SearchConfigError } from "@/lib/search/env";
import { hydrateResults } from "@/lib/search/hydrate";
import { searchRequestSchema, type SearchStreamEvent } from "@/lib/search/types";

const TIMEOUT_MS = 60_000;

/**
 * POST { q } → NDJSON stream of SearchStreamEvent: status lines, then one
 * `results` (or `error`) line. POST so prefetchers and crawlers can't trigger LLM calls.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }
  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Query must be 2–200 characters" }, { status: 400 });
  }
  const query = parsed.data.q;

  let env;
  try {
    env = getSearchEnv();
  } catch (error) {
    if (error instanceof SearchConfigError) {
      console.error(`[search] ${error.message}`);
      return Response.json({ error: "Search is not configured" }, { status: 500 });
    }
    throw error;
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(TIMEOUT_MS)]);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SearchStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // Client went away; nothing to send to.
        }
      };

      try {
        const matches = await findLessonMatches({
          query,
          env,
          signal,
          onStatus: (message) => send({ type: "status", message }),
        });
        send({ type: "status", message: "Ranking results…" });
        const response = await hydrateResults(query, matches);
        send({ type: "results", ...response });
      } catch (error) {
        // Details stay in the server log; upstream bodies can include internals.
        console.error("[search] failed", error);
        send({
          type: "error",
          message:
            error instanceof SearchBusyError
              ? "Search is busy, try again in a minute."
              : "Search is unavailable right now.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
