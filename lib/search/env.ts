import "server-only";

// Search secrets. Read lazily so a missing value fails the request, not the build.

export type SearchEnv = {
  mcpUrl: string;
  orgToken: string;
  model: string;
};

export class SearchConfigError extends Error {}

export function getSearchEnv(): SearchEnv {
  const mcpUrl = process.env.SANITY_CONTEXT_MCP_URL;
  const orgToken = process.env.SANITY_ORGANIZATION_TOKEN;
  const missing = [
    !mcpUrl && "SANITY_CONTEXT_MCP_URL",
    !orgToken && "SANITY_ORGANIZATION_TOKEN",
    !process.env.GROQ_API_KEY && "GROQ_API_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new SearchConfigError(`Missing environment variables: ${missing.join(", ")}`);
  }
  return {
    mcpUrl: mcpUrl!,
    orgToken: orgToken!,
    model: process.env.SEARCH_MODEL || "openai/gpt-oss-120b",
  };
}
