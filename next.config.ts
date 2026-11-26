import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
