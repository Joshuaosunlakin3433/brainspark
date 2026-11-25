import "server-only";

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-11-25";

export const projectId = required(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const dataset = required(process.env.NEXT_PUBLIC_SANITY_DATASET, "NEXT_PUBLIC_SANITY_DATASET");

// Server-only. The dataset is private, so every read needs this Viewer token.
export const readToken = required(process.env.SANITY_API_READ_TOKEN, "SANITY_API_READ_TOKEN");

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
