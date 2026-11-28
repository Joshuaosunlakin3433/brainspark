// Port of parseVideoUrl() in lib/video.ts (web workspace). Studio tooling cannot import
// web code, so keep the provider rules here in sync with that file.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const NUMERIC = /^\d+$/
const BUNNY_ID = /^[A-Za-z0-9-]+$/

/** @returns {{provider: 'youtube'|'vimeo'|'bunny', id: string} | null} */
export function parseVideoUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  let url
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  const host = url.hostname.replace(/^www\.|^m\./, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be') {
    const id =
      host === 'youtu.be'
        ? parts[0]
        : parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live'
          ? parts[1]
          : url.searchParams.get('v')
    return id && YOUTUBE_ID.test(id) ? {provider: 'youtube', id} : null
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parts.find((p) => NUMERIC.test(p))
    return id ? {provider: 'vimeo', id} : null
  }

  if (host === 'iframe.mediadelivery.net' || host === 'player.mediadelivery.net') {
    const [kind, library, video] = parts
    if ((kind !== 'embed' && kind !== 'play') || !library || !video) return null
    if (!NUMERIC.test(library) || !BUNNY_ID.test(video)) return null
    return {provider: 'bunny', id: `${library}/${video}`}
  }

  return null
}

/** Document id for a video URL: `video-<provider>-<id>`, with characters Sanity rejects replaced. */
export function videoDocId(parsed) {
  return `video-${parsed.provider}-${parsed.id}`.replace(/[^A-Za-z0-9_-]/g, '-')
}

/** Canonical watch URL, used when handing a video to yt-dlp. */
export function canonicalUrl(parsed) {
  if (parsed.provider === 'youtube') return `https://www.youtube.com/watch?v=${parsed.id}`
  if (parsed.provider === 'vimeo') return `https://vimeo.com/${parsed.id}`
  return `https://iframe.mediadelivery.net/embed/${parsed.id}`
}
