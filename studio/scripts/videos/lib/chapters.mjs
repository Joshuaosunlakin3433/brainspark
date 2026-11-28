// Normalizes chapter lists from yt-dlp info JSON or authored files into `{startSeconds, label}`.

/** yt-dlp `info.chapters` (`{start_time, title}`) → chapters. */
export function chaptersFromYtDlp(info) {
  const list = Array.isArray(info?.chapters) ? info.chapters : []
  return list.map((c) => ({startSeconds: c.start_time, label: c.title}))
}

/** Sorts, trims, drops invalid or out-of-range entries, and dedupes by start second. */
export function normalizeChapters(list, durationSeconds) {
  if (!Array.isArray(list)) throw new Error('chapters must be an array')
  const seen = new Set()
  return list
    .map((c) => ({
      startSeconds: Math.floor(Number(c?.startSeconds)),
      label: typeof c?.label === 'string' ? c.label.replace(/\s+/g, ' ').trim() : '',
    }))
    .filter((c) => Number.isFinite(c.startSeconds) && c.startSeconds >= 0 && c.label)
    .filter((c) => !durationSeconds || c.startSeconds < durationSeconds)
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .filter((c) => (seen.has(c.startSeconds) ? false : seen.add(c.startSeconds)))
}
