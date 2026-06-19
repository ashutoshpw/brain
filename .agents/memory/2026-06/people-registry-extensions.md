---
title: People registry has three types with distinct validation rules; call notes live per-person under calls/
date: 2026-06-20
type: decision
tags: [people-registry, notable-person, call-notes, validator, learning]
---

The people registry (`workspace/people/`) now supports THREE distinct `type` values, each with its own validation branch in `scripts/check-people-data.ts`:

1. **`person`** — friends, mentors, colleagues, acquaintances. Required fields: `type`, `name`, `relation` (one of `friend | mentor | colleague | acquaintance`), `area: relationships`, `updated`. Optional enriched fields: `location`, `how_we_met`, `interests`, `notes`, `cadence_days`, `important_dates`, `tags`.

2. **`family-member`** — richer subtype. Requires additional `dob` (YYYY-MM-DD) and `relationship` (e.g. `spouse | parent | child | sibling | grandparent | in-law | other`). Also allows physical/dietary/medical fields and `contact`.

3. **`notable-person`** — role models (public figures, admired people). Key non-obvious rules:
   - `area` must be `learning` or `career` — NOT `relationships`. The validator rejects `area: relationships` for this type.
   - `relation` is restricted to only `role-model` (not the `friend | mentor | colleague | acquaintance` enum used by `person` type).
   - Carries structured arrays: `projects`, `achievements`, `lessons` (YAML lists).
   - When `/add-person` creates a notable-person, their `lessons` feed into `workspace/areas/learning/resources/role-models/README.md` AND the current week's learnings file.

**Call notes** (`type: call-note`) live at `workspace/people/<slug>/calls/YYYY/MM-DD/notes.md`. The validator enforces:
- `person` frontmatter field == the slug (folder name) of the parent people folder.
- `date` frontmatter field == the path segment `YYYY/MM-DD` (e.g. `2026/06-20`).
- `learnings` must be present and non-empty.

**`/log-call` Mode B** ("review last convo") reads the most recent call note for a person and resurfaces the `learnings` and `follow_ups` for a continuation conversation — this is the intended workflow for picking up where a previous interaction left off.

The symlinks for both `/add-person` and `/log-call` point as `../../.agents/skills/<name>` (relative, not absolute), which is the pattern enforced by `check-claude-skills-symlinks.ts`.
