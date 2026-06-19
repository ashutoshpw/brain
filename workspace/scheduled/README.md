# workspace/scheduled/

**What it is.** A staging area for future-dated planning work. Items here are committed before they're actionable, then graduated automatically into `workspace/tasks/` when their date arrives.

**Principle.** `scheduled/` is strictly FUTURE. `tasks/` is strictly NOW/PAST. Nothing lives in both places — graduation moves (not copies) items.

---

## Two content kinds

**1. Date-tagged checklist lines** in `scheduled.md` (the everyday 90%)

A single living file. Each line carries a date tag in the item text; `/week` and `/day` scan it at runtime.

**2. Prepared multi-file artifacts** — briefs, kits, plans staged ahead of time in date-targeted subfolders:

- `YYYY/MM-Wn/` — week-targeted (e.g. `2026/06-W3/`)
- `YYYY/MM-DD/` — day-targeted (e.g. `2026/06-15/`)

Use subfolders when the work is more than a single checklist line — e.g. a pre-written brief or a multi-step plan.

---

## Tag syntax (for `scheduled.md` lines)

```
- [ ] (YYYY-MM-Wn) item text    ← week-targeted
- [ ] (YYYY-MM-DD) item text    ← day-targeted
```

Examples:

```
- [ ] (2026-07-W1) do monthly financial review
- [ ] (2026-07-01) annual bloodwork reminder
```

Checklist syntax follows the repo-wide convention: `- [ ]` open, `- [x]` done.

---

## Graduation contract

**`/week` (scaffolding week `MM-Wn`):**
- Pulls all `scheduled.md` lines whose week tag matches the new week into `priorities.md` under a `## Scheduled this week` section.
- Moves any `workspace/scheduled/YYYY/MM-Wn/` artifact folder into `workspace/tasks/YYYY/MM-Wn/`.
- Removes graduated items from `scheduled/` — nothing lives in two places.

**`/day` (date `MM-DD`):**
- Pulls all `scheduled.md` lines tagged with today's date into `focus.md`.
- Moves any `workspace/scheduled/YYYY/MM-DD/` artifact folder into today's daily folder under `workspace/tasks/`.
- Removes graduated items from `scheduled/`.

---

## Slip safety

Both `/week` and `/day` also sweep **past-due** items — scheduled lines or artifact folders whose date/week has already passed but were never graduated. These are surfaced as overdue so a missed run never silently loses anything.

---

## Distinction from backlog and ROADMAP

| Home | Kind | Dated? | Auto-graduates? |
|---|---|---|---|
| `workspace/scheduled/` | Tactical, committed future work | Yes — exact week or day | Yes — `/week` / `/day` move it into tasks/ |
| `workspace/tasks/backlog.md` | Tactical "someday" slipped items | No | No — `/week` pulls candidates manually |
| each area's `ROADMAP.md` `[proposed]` | Strategic candidates | No | No — promoted when owner commits |
