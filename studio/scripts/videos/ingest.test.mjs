// Run from studio/: npm run videos:test
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

import {captionsToChunks, chunkPhrases, dedupeCues, parseCaptions} from './lib/captions.mjs'
import {chaptersFromYtDlp, normalizeChapters} from './lib/chapters.mjs'
import {parseVideoUrl, videoDocId} from './lib/video-url.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => readFileSync(join(here, 'fixtures', name), 'utf8')

test('YouTube rolling auto-captions are deduped into clean text', () => {
  const phrases = dedupeCues(parseCaptions(fixture('rolling.vtt')))
  const text = phrases.map((p) => p.text).join(' ')
  assert.equal(
    text,
    'in this video we talk about caching and revalidation & tags next we look at streaming after a long gap',
  )
  assert.ok(!/<|\[music\]/i.test(text))
})

test('chunks are cut at pauses, invalid cues are skipped, starts ascend', () => {
  const chunks = captionsToChunks(fixture('rolling.vtt'))
  assert.deepEqual(
    chunks.map((c) => c.startSeconds),
    [0, 21, 65],
  )
  assert.equal(chunks[0].text, 'in this video we talk about caching and revalidation & tags')
  assert.equal(chunks[1].text, 'next we look at streaming')
  for (let i = 1; i < chunks.length; i++) assert.ok(chunks[i].startSeconds > chunks[i - 1].startSeconds)
})

test('SRT parses with tags stripped and multi-line cues joined', () => {
  const chunks = captionsToChunks(fixture('sample.srt'))
  assert.deepEqual(chunks, [
    {startSeconds: 1, text: 'Server components run on the server. They never ship their code to the browser.'},
    {startSeconds: 30, text: 'Client components hydrate.'},
  ])
})

test('a chunk never spans more than maxSeconds', () => {
  const phrases = Array.from({length: 30}, (_, i) => ({start: i * 3, text: 'word'}))
  const chunks = chunkPhrases(phrases, {minSeconds: 1000, maxWords: 1000})
  // Phrases every 3s: each chunk holds phrases starting < 40s after its own start.
  assert.deepEqual(
    chunks.map((c) => [c.startSeconds, c.text.split(" ").length]),
    [
      [0, 14],
      [42, 14],
      [84, 2],
    ],
  )
})

test('word limit cuts a chunk early', () => {
  const phrases = Array.from({length: 10}, (_, i) => ({start: i, text: 'one two three four five six seven eight'}))
  const chunks = chunkPhrases(phrases, {maxWords: 20})
  assert.ok(chunks.every((c) => c.text.split(' ').length <= 24))
  assert.ok(chunks.length >= 3)
})

test('chapters are normalized, sorted, deduped, and kept in range', () => {
  const raw = chaptersFromYtDlp({
    chapters: [
      {start_time: 120.7, title: '  Revalidation  '},
      {start_time: 0, title: 'Intro'},
      {start_time: 0, title: 'Duplicate start'},
      {start_time: 900, title: 'Past the end'},
      {start_time: 60, title: ''},
    ],
  })
  assert.deepEqual(normalizeChapters(raw, 600), [
    {startSeconds: 0, label: 'Intro'},
    {startSeconds: 120, label: 'Revalidation'},
  ])
  assert.deepEqual(chaptersFromYtDlp({}), [])
  assert.throws(() => normalizeChapters({}, 10))
})

test('video ids derive from the URL and contain only allowed characters', () => {
  const yt = parseVideoUrl('https://www.youtube.com/watch?v=9602Yzvd7ik')
  assert.equal(videoDocId(yt), 'video-youtube-9602Yzvd7ik')
  assert.equal(videoDocId(parseVideoUrl('https://youtu.be/9602Yzvd7ik')), 'video-youtube-9602Yzvd7ik')
  assert.equal(videoDocId(parseVideoUrl('https://vimeo.com/76979871')), 'video-vimeo-76979871')
  const bunny = parseVideoUrl('https://iframe.mediadelivery.net/embed/12345/abc-def-1')
  assert.equal(videoDocId(bunny), 'video-bunny-12345-abc-def-1')
  for (const bad of ['http://youtube.com/watch?v=9602Yzvd7ik', 'https://example.com/v/1', 'https://youtu.be/short', 'nope']) {
    assert.equal(parseVideoUrl(bad), null, bad)
  }
})
