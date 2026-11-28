// Parses WebVTT / SRT captions into cues, then merges cues into short timestamped chunks.

const ENTITIES = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' '}
const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/

function toSeconds(stamp) {
  const m = TIME.exec(stamp)
  if (!m) return null
  const [, h = '0', mm, ss, frac] = m
  if (Number(ss) > 59 || (m[1] !== undefined && Number(mm) > 59)) return null
  return Number(h) * 3600 + Number(mm) * 60 + Number(ss) + Number(frac.padEnd(3, '0')) / 1000
}

function cleanLine(line) {
  return line
    .replace(/<[^>]*>/g, '') // <c>, <00:00:01.000>, <i>, <v Speaker>
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTITIES[e])
    .replace(/\[(music|applause|laughter|silence)\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parses VTT or SRT text into ordered cues `{start, end, lines}`.
 * Both formats are blocks separated by blank lines with a `start --> end` timing line.
 */
export function parseCaptions(raw) {
  const blocks = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split(/\n{2,}/)
  const cues = []
  for (const block of blocks) {
    const lines = block.split('\n')
    const t = lines.findIndex((l) => l.includes('-->'))
    if (t < 0) continue // WEBVTT header, NOTE, STYLE, REGION
    const [a, b] = lines[t].split('-->')
    const start = toSeconds(a)
    const end = toSeconds(b)
    if (start == null || end == null) continue
    const text = lines.slice(t + 1).map(cleanLine).filter(Boolean)
    if (text.length) cues.push({start, end, lines: text})
  }
  return cues.sort((x, y) => x.start - y.start)
}

/**
 * Flattens cues into timed phrases, dropping the rolling repeats in YouTube
 * auto-captions, where each cue repeats the previous cue's line before adding a new one.
 */
export function dedupeCues(cues) {
  const out = []
  let last = ''
  for (const cue of cues) {
    for (const line of cue.lines) {
      if (line === last) continue
      // A line that extends the previous one: keep only the new tail.
      const text = last && line.startsWith(`${last} `) ? line.slice(last.length + 1) : line
      last = line
      if (text) out.push({start: cue.start, text})
    }
  }
  return out
}

/**
 * Merges phrases into chunks: cut once a chunk is >= minSeconds long or >= maxWords,
 * before a pause of >= maxGapSeconds, and never let one span more than maxSeconds.
 */
export function chunkPhrases(
  phrases,
  {minSeconds = 20, maxSeconds = 40, maxWords = 70, maxGapSeconds = 10} = {},
) {
  const chunks = []
  let cur = null
  const flush = () => {
    if (cur && cur.words.length) {
      chunks.push({startSeconds: Math.floor(cur.start), text: cur.words.join(' ')})
    }
    cur = null
  }
  for (const p of phrases) {
    if (cur && (p.start - cur.start >= maxSeconds || p.start - cur.last >= maxGapSeconds)) flush()
    if (!cur) cur = {start: p.start, last: p.start, words: []}
    cur.last = p.start
    cur.words.push(...p.text.split(' '))
    if (p.start - cur.start >= minSeconds || cur.words.length >= maxWords) flush()
  }
  flush()
  return chunks
}

/** Caption text → transcript chunks. */
export function captionsToChunks(raw, options) {
  return chunkPhrases(dedupeCues(parseCaptions(raw)), options)
}
