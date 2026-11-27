## BrainSpark search

Search returns lesson `_id`s, ranked best first. Never return an id that did not come from a query result.

### Structure the schema does not spell out
- A lesson has no course field. Find its course with `*[_type == "course" && references(^._id)][0]`. Every lesson is in exactly one course.
- A course's `modules` is an embedded array; each module's `lessons` holds references to lessons. Module and lesson numbers are array positions, not stored fields.

### Matching
- Embeddings are not enabled on this dataset: `text::semanticSimilarity()` errors. Use `match` only.
- `notes` is Portable Text. `notes match ...` never matches; use `pt::text(notes) match ...`.
- Match is token and prefix based: `"cache*"` does not match "caching". Use stems (`"cach*"`). Never match a whole phrase as one pattern.
- An array on the right of `match` means AND: `title match ["cach*", "data*"]` needs both. For OR, give each keyword its own `match` clause.
- Match `title`, `keyPoints[]`, and `pt::text(notes)`.

### Ranking pattern
`groq_query` takes no parameters, so write keywords inline (never `$t`). One clause set per keyword, OR'd, with matching score terms:
```groq
*[_type == "lesson" && (title match "cach*" || keyPoints[] match "cach*" || pt::text(notes) match "cach*"
                     || title match "revalidat*" || keyPoints[] match "revalidat*" || pt::text(notes) match "revalidat*")]
  | score(boost(title match "cach*", 3), boost(keyPoints[] match "cach*", 2), pt::text(notes) match "cach*",
          boost(title match "revalidat*", 3), boost(keyPoints[] match "revalidat*", 2), pt::text(notes) match "revalidat*")
  | order(_score desc){ _id, title, _score }
```
A title that names the exact concept beats a broad keyword hit.

### Main concept first
- Require a match on the main concept (and its synonyms). Supporting terms only add score; they never qualify a lesson on their own.
- Weight the main concept higher (title 6, keyPoints 4, notes 2) than supporting terms (title 2, keyPoints 1, notes 1).
- Generic words (data, code, app, use, build, work, learn) flood results in this catalog. Leave them out unless they are the whole topic.
- A two-word concept is one string: `title match "server* component*"` requires both words.
