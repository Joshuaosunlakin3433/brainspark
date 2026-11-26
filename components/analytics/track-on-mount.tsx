"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent, type AnalyticsEvents } from "@/lib/analytics";

/** Fires one analytics event when it mounts, so server pages can record views. */
export function TrackOnMount<E extends AnalyticsEvent>({
  event,
  props,
}: {
  event: E;
  props: AnalyticsEvents[E];
}) {
  useEffect(() => {
    track(event, props);
    // Fire once per mount; props are static for a page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return null;
}
