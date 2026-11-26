"use client";

import { useAuth } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

/**
 * Ties PostHog's person to the Clerk user id on sign-in and resets on sign-out.
 * Sends only the opaque Clerk id: no email or name.
 */
export function PostHogIdentify() {
  const { isLoaded, userId } = useAuth();
  const identified = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !posthog.__loaded) return;
    if (userId && identified.current !== userId) {
      posthog.identify(userId);
      identified.current = userId;
    } else if (!userId && identified.current) {
      posthog.reset();
      identified.current = null;
    }
  }, [isLoaded, userId]);

  return null;
}
