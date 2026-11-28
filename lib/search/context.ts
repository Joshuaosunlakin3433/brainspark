import "server-only";

import { createMCPClient } from "@ai-sdk/mcp";

import type { SearchEnv } from "./env";

// Initial context = schema + endpoint Instructions. Cached per server instance so
// Instruction edits arrive within the TTL (or on restart) without a redeploy.
const TTL_MS = 5 * 60 * 1000;
let cached: { value: string; expires: number } | null = null;

export async function getInitialContext({ mcpUrl, orgToken }: SearchEnv): Promise<string | null> {
  if (cached && cached.expires > Date.now()) return cached.value;

  const url = new URL(mcpUrl);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/initial-context`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${orgToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[search] initial context failed: HTTP ${res.status}`);
      return null;
    }
    const value = await res.text();
    cached = { value, expires: Date.now() + TTL_MS };
    return value;
  } catch (error) {
    console.error("[search] initial context failed", error);
    return null;
  }
}

export function connectContextMcp({ mcpUrl, orgToken }: SearchEnv) {
  return createMCPClient({
    transport: { type: "http", url: mcpUrl, headers: { Authorization: `Bearer ${orgToken}` } },
  });
}
