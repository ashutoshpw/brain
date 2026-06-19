---
name: add-area
description: Onboard a new life area end-to-end — scaffold the 6 required docs (OVERVIEW, GOALS, METRICS, ROADMAP, HABITS, PRINCIPLES), register the area in every required location (CLAUDE.md areas table, life-status SKILL.md area list, workspace/references/README.md mapping), pass all pre-commit guards, and commit. Use when adding a new life area to brain.
---

Adding a life area touches **9 files in one commit** (6 new docs + 3 area-list registrations) and must satisfy all pre-commit guards on the first try. This skill does the whole thing atomically. Work on the **current branch** — do not create a branch unless the user explicitly asks.

This skill produces real, useful content — not template stubs. The 6 docs are filled with thoughtful starter content for this specific area. Use **parallel haiku subagents** for reading existing areas as style templates, then draft all docs on the calling model.

## Step 1 — Collect area metadata

Gather the following. Accept whatever the user supplied in the invocation; **ask once** for anything missing — do not proceed with blanks.

| Field | Used for | Notes |
|---|---|---|
| `area` | folder name `workspace/areas/<area>/`, all registrations | must be one of the 6 standard area slugs: `health`, `finance`, `career`, `relationships`, `learning`, `home` — or a proposed new area slug if the user is extending beyond the core 6 |
| what it covers | CLAUDE.md areas table, OVERVIEW.md | one-line focus description |
| read-only data source | CLAUDE.md areas table | e.g. `Whoop`, `Brex`, or `—` if none |
| north-star goal | GOALS.md | the single most important outcome for this area right now |
| archetype / category | references README mapping | **must** be from this fixed vocabulary: `wellbeing` · `finances` · `growth` · `relationships` · `knowledge` · `operations`. Multiple allowed. |

Confirm the archetype maps to the vocabulary before continuing — an out-of-vocab value will not match the references mapping.

## Step 2 — Learn the house style

Before drafting, read the closest existing area's 6 docs as structural templates. Choose the most analogous area (e.g. a new wellbeing-adjacent area → read `health`; a new growth-adjacent area → read `career`). Also read, for exact current formats to append to:

- `CLAUDE.md` → the `## The 6 life areas` table.
- `.agents/skills/life-status/SKILL.md` → the life areas reference table.
- `workspace/references/README.md` → the area→archetype mapping (if the file exists).

Copy the **current** row/line shape from each file rather than hardcoding — formats may have drifted.

## Step 3 — Draft the 6 area docs

Write commit-ready content for `workspace/areas/<area>/`. The 6 required docs, **in order**, each must be **non-empty**:

1. **`OVERVIEW.md`** — what this area covers, current-state snapshot, what "good" looks like, and the key signal/metric. Be specific to the owner's actual life situation, not generic.

2. **`GOALS.md`** — north-star for the area + 3–5 active goals with target dates. Use this structure:
   ```markdown
   # Goals — <area>
   ## North-star
   <one-sentence north-star goal for this area>
   ## Active goals
   | Goal | Target date | Status | Notes |
   ```

3. **`METRICS.md`** — tracked metrics table following the **exact** verbatim shape from CLAUDE.md:
   ```markdown
   # Metrics — <area>
   ## North-star metric
   ## Tracked metrics
   | Metric | Definition / source | Target / threshold | Cadence |
   ## Decision rules tied to metrics
   ## Metrics blocked on data
   ## Open questions
   ```
   For health: note Whoop as the source for recovery/sleep/strain metrics. For finance: note Brex as the source for balance/transaction metrics. Be explicit about what is currently blocked on data (e.g. "Whoop pull not yet automated").

4. **`ROADMAP.md`** — confirmed changes (numbered) + `- **[proposed]**` candidates pending sign-off. For a new area, there are no confirmed items yet — write only `[proposed]` candidates clearly marked *pending owner sign-off*. Mirror the existing areas' ROADMAP.md structure.

5. **`HABITS.md`** — recurring systems/routines as `- [ ] item` checklists using **exact** checklist syntax:
   - Open: `- [ ] item`
   - Done: `- [x] item`
   - Dropped: `- [x] ~~item~~ (dropped: reason)`
   Start all habits as open (`- [ ]`). Group by frequency (Daily / Weekly / Monthly).

6. **`PRINCIPLES.md`** — values, decision rules, one-liner, and an **anti-** section (what the owner deliberately does NOT do in this area). Use this structure:
   ```markdown
   # Principles — <area>
   ## One-liner
   ## Core values
   ## Decision rules
   ## Anti- (what I do NOT do)
   ```

Each doc is area-specific — do not produce generic boilerplate. The pre-commit `check-area-docs.ts` scans the **working directory**, so all 6 must exist and be non-empty before any commit will succeed.

**Resources:** any data/exports/research/notes go under `workspace/areas/<area>/resources/` (any file type, any depth) — never at the area root.

## Step 4 — Register the area in all 3 required locations

`check-area-coverage.ts` requires the area name to appear in each location's text. Add a **proper, real-metadata** entry to each:

1. **`CLAUDE.md` → `## The 6 life areas` table** — append a row:
   `| \`<area>\` | <what it covers> | <read-only data source or —> |`
   matching the existing column shape exactly.

2. **`.agents/skills/life-status/SKILL.md`** — add the area to the life areas reference table:
   `| \`<area>\` | <focus> | <read-only data source> | <key signal> |`

3. **`workspace/references/README.md`** — if the file exists: append `, <area> = \`<archetype>\`` to the "area→archetype mapping" line, and bump the `updated:` frontmatter date to today (or `check-references.ts` may flag a stale date). If the file does not exist yet, note in the commit that it will be seeded in Phase 6.

## Step 5 — Verify guards, then commit

1. Run the guards directly first to catch problems before the hook fires:
   ```bash
   bun scripts/check-area-docs.ts
   bun scripts/check-area-coverage.ts
   bun scripts/check-staged-md.ts
   ```
   Fix anything they report. Re-run until all exit 0.

2. Stage all files (6 new docs + the 3 edited area-list files):
   ```bash
   git add workspace/areas/<area>/ CLAUDE.md \
     .agents/skills/life-status/SKILL.md
   # If references/README.md was edited:
   git add workspace/references/README.md
   ```

3. Commit + push in one commit (the husky hook re-runs every guard):
   ```bash
   git commit -m "Add <area> life area"
   git push
   ```

4. If the hook fails, read its output, fix the real cause, and re-commit. **Never** use `--no-verify` (CLAUDE.md prohibits it). If the push fails, report and stop — do not force-push.

## Step 6 — Persist learnings

If the process surfaced any non-obvious decisions (a coverage gap in the area's metrics, a habit cadence choice, a principles conflict), save it under `.agents/memory/<YYYY-MM>/<slug>.md` per the CLAUDE.md memory format, and include it in the commit.

## Constraints

- Work on the **current branch**; never auto-branch.
- All files go in **one** commit — `check-area-coverage.ts` reads from disk, so a partial commit that adds the area folder before the registrations blocks every subsequent commit until the set is complete.
- Archetype values are a **fixed vocabulary** — never invent a new one.
- Checklist syntax must be exact — `/week` carryover logic depends on `- [ ]` / `- [x]` literally.
- External systems (Whoop, Brex) are **read-only** — write what to track; the owner connects the data source separately.
- The relationships area additionally gets `workspace/areas/relationships/resources/family/ROSTER.md` — a human-readable index of family members. Create this file if the area being added is `relationships`.
