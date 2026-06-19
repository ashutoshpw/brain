# Metrics — learning

## North-star metric

**Books finished per month** — count of books marked complete in `workspace/references/books.md` with a distillation note. Target: ≥ 1/month, aiming for 2.

## Tracked metrics

| Metric | Definition / source | Target / threshold | Cadence |
|---|---|---|---|
| Books finished | Count of entries in `workspace/references/books.md` with status: complete in the calendar month | ≥ 1 / month | Monthly |
| Videos distilled | Count of `workspace/resources/expert-guide/youtube/<id>/SUMMARY.md` files created in the period | ≥ 2 / month | Monthly |
| Courses completed | Count of course entries in references catalog marked complete | ≥ 1 / quarter | Quarterly |
| Daily reading streak | Consecutive days with ≥ 20 min reading (manual log in weekly plan) | ≥ 20 days/month | Weekly |
| Deliberate practice hours | Hours of focused skill practice (not passive reading) — logged in weekly priorities | ≥ 4 hrs / week | Weekly |
| Distillation lag | Days between finishing a book/video and writing the summary note | ≤ 3 days | Per item |
| Learning queue depth | Count of items in the learning queue (references with status: queued) | 3–10 items (not zero, not bloated) | Monthly |

## Decision rules tied to metrics

- If books finished = 0 in a month, diagnose: is the current book too long / wrong format / wrong topic? Switch or split into shorter chunks.
- If deliberate practice hours < 2 in any week, the following week must include a 2-hour blocked practice session — no exceptions.
- If the learning queue exceeds 15 items, do a cull: archive anything not touched in 60 days with a note on why it was deprioritised.
- If distillation lag > 7 days consistently, simplify the distillation template — the bar is too high if nothing is getting written.

## Metrics blocked on data

- **Retention score** — a periodic quiz to test recall of key concepts from books/videos read. No system in place yet; would require a spaced-repetition tool or manual review file. <!-- TODO: consider Anki or a custom `resources/reviews/` folder -->
- **Skill proficiency level** — self-assessed rating (1–5) per active skill, updated monthly. Not yet formally tracked.

## Open questions

- Should audio books count as "books finished"? If yes, how to handle — a separate category or merged?
- Where should course notes live — `references/` catalog entry or a `resources/courses/<name>/` folder?
- Is there a better proxy for learning depth than "books finished" (e.g. average concepts-extracted-per-book)?
