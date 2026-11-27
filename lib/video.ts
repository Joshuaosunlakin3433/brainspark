// Turns a stored lesson video URL into a provider embed (AGENTS.md §7, §9).
// Only allowlisted hosts are embedded, and the embed URL is rebuilt from the parsed id.

export type VideoProvider = "youtube" | "vimeo" | "bunny";

export type ParsedVideo = {
  provider: VideoProvider;
  id: string;
  embedUrl: (startSeconds?: number) => string;
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const NUMERIC = /^\d+$/;
const BUNNY_ID = /^[A-Za-z0-9-]+$/;

export function parseVideoUrl(raw: string | null | undefined): ParsedVideo | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\.|^m\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    const id =
      host === "youtu.be"
        ? parts[0]
        : parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live"
          ? parts[1]
          : url.searchParams.get("v");
    if (!id || !YOUTUBE_ID.test(id)) return null;
    return {
      provider: "youtube",
      id,
      embedUrl: (start = 0) =>
        `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${start > 0 ? `&start=${start}` : ""}`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parts.find((p) => NUMERIC.test(p));
    if (!id) return null;
    return {
      provider: "vimeo",
      id,
      embedUrl: (start = 0) =>
        `https://player.vimeo.com/video/${id}?dnt=1${start > 0 ? `#t=${start}s` : ""}`,
    };
  }

  // Bunny Stream: iframe.mediadelivery.net/{embed|play}/{libraryId}/{videoId}
  if (host === "iframe.mediadelivery.net" || host === "player.mediadelivery.net") {
    const [kind, library, video] = parts;
    if ((kind !== "embed" && kind !== "play") || !library || !video) return null;
    if (!NUMERIC.test(library) || !BUNNY_ID.test(video)) return null;
    return {
      provider: "bunny",
      id: `${library}/${video}`,
      embedUrl: (start = 0) =>
        `https://iframe.mediadelivery.net/embed/${library}/${video}?preload=true${start > 0 ? `&t=${start}` : ""}`,
    };
  }

  return null;
}

/** Parses a `?t=` value into whole, non-negative seconds. Anything else is 0. */
export function parseStartSeconds(value: string | string[] | undefined): number {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !/^\d{1,6}$/.test(v)) return 0;
  return Number(v);
}
