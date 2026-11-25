import "server-only";

import type { QueryParams } from "next-sanity";
import { cacheLife, cacheTag } from "next/cache";

import { client } from "./client";

/**
 * Cached read of published content. With `cacheComponents` on, this is the one
 * `'use cache'` boundary for Sanity reads. Entries revalidate after about a minute;
 * `revalidateTag("sanity")` (or a narrower tag) purges them on demand.
 */
export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  tags = [],
}: {
  query: QueryString;
  params?: QueryParams;
  tags?: string[];
}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("sanity", ...tags);

  return client.fetch(query, params);
}
