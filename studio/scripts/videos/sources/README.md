# Authored video sources

Files here override what `fetch` downloads into `../.cache/`. Use them for Vimeo and
Bunny videos (export WebVTT from the provider dashboard), or to replace YouTube
auto-captions and chapters with better ones.

Name every file after the video document id: `video-<provider>-<id>`, where any
character other than `A-Z a-z 0-9 _ -` becomes `-`.

| Lesson video URL | Document id |
| --- | --- |
| `https://www.youtube.com/watch?v=9602Yzvd7ik` | `video-youtube-9602Yzvd7ik` |
| `https://vimeo.com/76979871` | `video-vimeo-76979871` |
| `https://iframe.mediadelivery.net/embed/12345/abc-def` | `video-bunny-12345-abc-def` |

- Captions: `<id>.vtt` or `<id>.srt`.
- Chapters: `<id>.chapters.json`, an array of `{ "startSeconds": 0, "label": "Intro" }`.

Captions and chapters are picked independently: an authored chapters file still uses
fetched captions, and the other way round. Rebuild with `npm run videos:build`.
