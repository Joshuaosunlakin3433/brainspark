import type { NextConfig } from "next";

// PostHog ingest host (US or EU, from env). Proxied through /ingest so ad blockers don't drop events.
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const posthogAssetsHost = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: `${posthogAssetsHost}/static/:path*` },
      { source: "/ingest/:path*", destination: `${posthogHost}/:path*` },
    ];
  },
  // PostHog API paths use trailing slashes.
  skipTrailingSlashRedirect: true,
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  images: {
    // Sanity image CDN (public asset URLs, no token).
    remotePatterns: [new URL("https://cdn.sanity.io/images/**")],
  },
  partialPrefetching: true,
};

export default nextConfig;
