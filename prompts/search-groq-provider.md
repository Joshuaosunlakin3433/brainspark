# Implementation prompt: Switch the search agent to Groq (free tier)

## Goal
OpenAI needs paid credits, and this is an unpaid portfolio project. Move the search agent (`lib/search/agent.ts`) to Groq's free tier. Everything else from `prompts/search-logic.md` stays the same: the route, the MCP connection, the endpoint Instructions, grounding by re-fetching ids, and the NDJSON stream.

## Skills / docs read
- `create-agent-with-sanity-context` (provider-agnostic: "any provider works"; take tools from the MCP client; inline the initial context).
- `AGENTS.md` §6 (stack names the OpenAI provider, which the user is changing).
- `@ai-sdk/groq@4.0.88` type definitions (model ids, `structuredOutputs`, `parallelToolCalls` options).

## Code inspected / measured
- `lib/search/agent.ts`: `generateText` with `Output.object` plus all MCP tools, using `openai(env.model)`.
- `lib/search/env.ts`: requires `OPENAI_API_KEY`, defaults the model to `gpt-5.4-mini`.
- Live endpoint payload sizes:
  - initial context: 2.9 KB
  - tool definitions: `groq_query` 9.0 KB, `array_field_reader` 5.5 KB, `initial_context` 2.0 KB, `schema_explorer` 1.3 KB
- Groq's free tier caps tokens per minute and per day for each model, and every agent step resends the instructions and tools.

## Decisions
1. **Provider**: `@ai-sdk/groq@^4`, with `GROQ_API_KEY` (server only). Remove `@ai-sdk/openai` and `OPENAI_API_KEY` from code and `.env.example`. One provider, no switch, so nothing is overbuilt.
2. **Model**: `SEARCH_MODEL` env, default `openai/gpt-oss-120b`. It is an open-weight model hosted by Groq for free and has solid tool use. If its free limits bite, `meta-llama/llama-4-scout-17b-16e-instruct` or `moonshotai/kimi-k2-instruct-0905` can be set without a code change.
3. **Smaller payload per step** (stays inside free limits and is also faster):
   - Pass only the `groq_query` MCP tool. The schema is already inlined through the initial context, so `schema_explorer` and `initial_context` aren't needed. `array_field_reader` is for large arrays, and search never reads them.
   - If the initial context fetch fails, keep `initial_context` as well (skill rule: the model must always have it).
   - Step cap drops from 10 to 6.
4. **Structured output through a tool**: replace `Output.object` with a local `submit_results` tool. Its input schema is the existing `agentOutputSchema`, and it has no `execute`.
   - Settings: `toolChoice: "required"` and `stopWhen: [hasToolCall("submit_results"), stepCountIs(6)]`.
   - The matches are read from that tool call's input and validated again with Zod.
   - This works with any provider and avoids combining JSON-schema response format with tools, which Groq models handle inconsistently.
   - If the model never submits, the search returns an error event, never made-up results.
5. **Rate limit errors**: a 429 from Groq is logged and sent to the client as a generic error, with the message "Search is busy, try again in a minute." Nothing is retried in a loop. `maxRetries: 1`.
6. **AGENTS.md §6**: change "the Vercel AI SDK with the OpenAI provider" to "the Vercel AI SDK with the Groq provider (free tier)". Nothing else in AGENTS.md changes.

## Files expected to touch
- `lib/search/agent.ts`, `lib/search/env.ts`, `app/api/search/route.ts` (busy message)
- `.env.example` (`GROQ_API_KEY` replaces `OPENAI_API_KEY`, and the `SEARCH_MODEL` default is updated)
- `package.json`, `package-lock.json` (+`@ai-sdk/groq`, −`@ai-sdk/openai`)
- `AGENTS.md` (§6 one line)
- `prompts/search-logic.md` (note pointing to this change)

## Security considerations
- `GROQ_API_KEY` is server only (no `NEXT_PUBLIC_`), read lazily, and never logged.
- The `submit_results` input is untrusted. It is Zod-validated, and the ids are still re-fetched from Sanity before anything is shown.
- Fewer tools means less surface: the model can only run read-only GROQ, scoped by the endpoint filter.

## Acceptance criteria
- With `GROQ_API_KEY` set, `"server components"` returns the Next.js server components lessons first. `"how do I cache data"` returns caching lessons across several courses. `"qwzx plmk"` returns `total: 0`.
- With no key, the route returns `500 "Search is not configured"`.
- Type check, lint, and build pass.

## Checks to run
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- The three live queries against the dev server, with the real output reported.

## Manual test steps
1. Create a free key at https://console.groq.com/keys. No card is needed.
2. Add `GROQ_API_KEY=<key>` to `.env.local`. You can delete `OPENAI_API_KEY`.
3. With `npm run dev` running:
   `curl.exe -N -X POST http://localhost:3000/api/search -H "Content-Type: application/json" -d '{\"q\":\"server components\"}'`
4. Expect status lines, then a `results` line led by the server components lessons.

## Revision (approved by the user): single model call instead of an agent loop
Found during implementation:
- Groq's free tier allows **8,000 tokens per minute** for `openai/gpt-oss-120b` and `openai/gpt-oss-20b` (read from the `x-ratelimit-limit-tokens` header). Each agent step resends instructions, schema and history (~2–2.8k tokens), so a 3–4 step search exceeds the limit.
- Through the AI SDK, gpt-oss on Groq sometimes calls a phantom `commentary` tool on step 2, and the request fails.
- `groq_query` takes no parameters (its input schema is `{ query }` only).

New flow (`lib/search/agent.ts`):
1. **One** `generateText` call, no tools. Inputs: system prompt + initial context + query. Structured output (`Output.object`, Zod): `{ groq: string, keywords: string[] }`. The model writes the ranked GROQ query following the Instructions pattern and lists the wildcarded keywords it used.
2. The server runs `groq` through the Context MCP (`mcp.callTool({ name: "groq_query" })`). The endpoint filter and read-only access still apply.
3. If the query errors, returns no `_id`s, or the model output is invalid, the server builds the Instructions ranking query from `keywords` (or from the query's own words when the model failed) and runs it through the MCP. Keywords are sanitised to `[a-z0-9]` plus a trailing `*` before they go into the GROQ string, so the query text is never interpolated raw.
4. Tiers come from the result's `_score`, compared to the top score: exact ≥ 75%, strong ≥ 35%, otherwise related. Then the ids are hydrated as before.

Effects:
- One search costs about 2k tokens and one model round trip.
- The step status lines become: "Understanding your query…", "Searching lessons…", "Ranking results…".
- The `submit_results` tool, `toolChoice`, and the step cap are removed.

## Revision 2 (found while testing live): the server builds the query
- An array on the right of GROQ `match` means **AND** (`title match ["cach*", "data*"]` returned 0; the OR form returned 13). The earlier Instructions saying "array = OR" were wrong, and they are now corrected on the endpoint.
- Match is by word prefix, so `"cache*"` misses "caching". Stems are needed.
- Model-written OR queries (one clause per keyword) were long and unreliable. With an empty keyword list, `match []` matched every lesson.

Final flow:
1. One Groq call returns `{ keywords: string[] }`. These are word stems plus synonyms, or an empty list for gibberish.
2. The server sanitises the keywords to `[a-z0-9]`, trims common suffixes, adds `*`, and keeps at most 8. It then builds the ranking query: one OR'd clause set per keyword, with `score(boost(title,3), boost(keyPoints,2), notes)`. The query runs through the Context MCP `groq_query`.
3. If the model call fails (not rate limits), the query's own words are used. No keywords means no results.

Verified live: "server components" (4s), "how do I cache data" (2s, 4 caching lessons in 4 courses on top), "keep my passwords safe" (password storage first), "qwzx plmk" (0).

## Revision 3 (user approved): main concept first
Problem: with every keyword weighted equally, a generic term like "data" pulled in about 30 unrelated lessons ("how do I cache data" → 40 results across 10 courses), and the count changed from run to run.

Fix (`lib/search/agent.ts`, system prompt, endpoint Instructions):
- The model returns `primary` (main concept plus synonyms, 1–4 stems) and `secondary` (supporting context, 0–4 stems).
- A lesson must match a primary term. Secondary terms only add score.
- Weights: primary title 6 / keyPoints 4 / notes 2; secondary title 2 / keyPoints 1 / notes 1.
- Generic single words (data, code, app, build, work, learn…) are dropped on the server.
- Multi-word terms become `"server* component*"`, which needs both words.

Verified live:
- "how do I cache data": 10 results across 5 courses, the same on 3 runs, with the 4 caching lessons first.
- "server components": 5.
- "keep my passwords safe": 2.
- "kubernetes deployments": 12, all from the Kubernetes course, with Deployments first.
- "qwzx plmk": 0.
