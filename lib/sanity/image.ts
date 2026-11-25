import "server-only";

import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";

import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

// Asset URLs are public CDN URLs, so no token is involved. Build them on the server.
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format");
}
