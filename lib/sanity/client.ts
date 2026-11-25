import "server-only";

import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, readToken } from "./env";

// Server-only read client for the private dataset. Never import this from a client component.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: readToken,
  useCdn: true,
  perspective: "published",
});
