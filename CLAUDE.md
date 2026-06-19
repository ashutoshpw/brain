# brain

Personal life control pane for Ashutosh. Every artefact is a markdown file committed to `main`.
GitHub: ashutoshpw/brain.

## Folder convention

`workspace/tasks/YYYY/MM/` — **monthly goals** folder (bare two-digit month, e.g. `2026/06`). Holds `goals.md`: the month's north-star goals, carried-over goals, and an index of this month's learnings (referenced, not duplicated). Distinct from weekly `MM-Wn` and daily `MM-DD` folders under the same year — tools scanning for week/day folders must skip bare `MM` folders. Current month = latest bare `MM` folder by sort order.

`workspace/tasks/YYYY/MM-Wn/` — **weekly planning** folder. Wn = nth occurrence of that week within the month (W1–W5). Current week = latest `MM-Wn` folder by sort order under `workspace/tasks/` (bare `MM` monthly folders are skipped when scanning for the current week). Typical contents: `priorities.md`, any plan/checklist files, `retro.md`.

`workspace/tasks/YYYY/MM-DD/` — **daily work-report** folder (e.g. `2026/06-09` for 2026-06-09). Dated work reports live here, NOT in the week folder. When listing `workspace/tasks/YYYY/` to find the current day's folder, bare `MM` monthly folders are skipped (only `MM-DD` entries are considered). Typical contents: `focus-YYYY-MM-DD.md`, `life-status-YYYY-MM-DD.md`.

`workspace/scheduled/` — **forward-scheduling** folder. Items here are strictly FUTURE; `workspace/tasks/` is strictly NOW/PAST. Two content kinds: (1) date-tagged lines in the single living file `scheduled.md`, using `- [ ] (YYYY-MM-Wn) item` (week-targeted) or `- [ ] (YYYY-MM-DD) item` (day-targeted); (2) prepared multi-file artifacts in `YYYY/MM-Wn/` or `YYYY/MM-DD/` subfolders. `/week` and `/day` scan `scheduled/` at run time, graduate matching items into the appropriate `tasks/` folder (moving, not copying), and remove them from `scheduled/` so nothing lives in two places.

`workspace/people/` — **relationships registry**. One folder per person (`<slug>/profile.md`) with YAML frontmatter: `type`, `name`, `relation`, `area`, `cadence_days`, `important_dates`, `tags`, `updated`. Three accepted types: `person` (friends, mentors, colleagues), `family-member` (richer subtype with `dob`, `relationship`, physical stats, dietary/medical notes), and `notable-person` (global figures / role models tracked for learning — stores projects, achievements, and lessons). Validated by `scripts/check-people-data.ts`.

Per-person **call notes** live at `workspace/people/<slug>/calls/YYYY/MM-DD/notes.md` — one dated folder per conversation. Each is a frontmatter doc capturing the call's date, topics, and learnings (plus optional follow-ups). Reviewing "the last conversation" with someone means reading the most recent `calls/**/notes.md` under that person's folder. Validated by `scripts/check-people-data.ts`.

## The 6 life areas

| Area | Focus | Read-only data source |
|---|---|---|
| `health` | Fitness, nutrition, sleep, medical | Whoop |
| `finance` | Budget, net worth, investments, expenses | Brex |
| `career` | Professional goals, skills, income streams, portfolio | — |
| `relationships` | Relationship strategy; people registry in `workspace/people/` | — |
| `learning` | Books, courses, skills to acquire; feeds from expert-guide | — |
| `home` | Household, errands, documents, recurring admin, possessions | — |

## Area docs (workspace/areas/)

Each `workspace/areas/<area>/` MUST contain these **6 docs** (all non-empty), enforced by the pre-commit hook (`scripts/check-area-docs.ts`).

| Doc | Content |
|---|---|
| `OVERVIEW.md` | What this area covers, current-state snapshot, what "good" looks like, key signal/metric. |
| `GOALS.md` | North-star for the area + active goals with target dates. |
| `METRICS.md` | Tracked metrics table: `\| Metric \| Definition/source \| Target \| Cadence \|`, decision rules, metrics blocked on data. |
| `ROADMAP.md` | Confirmed changes (numbered) + `- **[proposed]**` candidates pending sign-off. |
| `HABITS.md` | Recurring systems/routines as `- [ ] item` checklists (carryover logic depends on exact syntax). |
| `PRINCIPLES.md` | Values, decision rules, one-liner, and an **anti-** section (what I deliberately do NOT do). |

**Verbatim `METRICS.md` shape** (mirrors KPI.md from control-pane):
```markdown
# Metrics — <area>
## North-star metric
## Tracked metrics
| Metric | Definition / source | Target / threshold | Cadence |
## Decision rules tied to metrics
## Metrics blocked on data
## Open questions
```

A new area must be registered in every area-list location — the **Areas** table in this file, the `life-status` skill table, and `workspace/references/README.md` (area→archetype mapping). Enforced by `scripts/check-area-coverage.ts`: the commit is blocked until each location lists the new area.

Area-specific resources (data exports, research, notes) live under `workspace/areas/<area>/resources/`.

## People registry (`workspace/people/`)

Mirrors `social-profiles` from control-pane. Frontmatter validated by `scripts/check-people-data.ts`. The credential-pattern scan (secrets check) from control-pane is retained. **All people data is stored in YAML frontmatter** — the prose body is optional/supplementary context only.

Three accepted `type` values: `person`, `family-member`, `notable-person`.

**Person frontmatter** (friends, mentors, colleagues, acquaintances):
```yaml
---
type: person
name: <full name>
relation: family | friend | mentor | colleague | acquaintance
area: relationships
cadence_days: 30
location: <city, country>              # optional
how_we_met: <brief context>            # optional
interests: [<topic>, ...]              # optional
important_dates:
  - { label: birthday, date: MM-DD }
tags: [<topic>, ...]
notes: <free text>                     # optional
updated: YYYY-MM-DD
---
```

A friend can be added by name alone — `name` plus the auto-filled required fields (`type: person`, `relation: friend`, `area: relationships`, `updated`) is the minimum floor; every other field is optional frontmatter. All data is stored in frontmatter.

**Family-member frontmatter** (richer subtype — additionally requires `dob` + `relationship`):
```yaml
---
type: family-member
name: <full name>
relation: family
relationship: spouse | parent | child | sibling | grandparent | in-law | other
area: relationships
dob: YYYY-MM-DD
blood_group: A+ | O- | ...   # optional
height_cm: <int>             # optional
weight_kg: <int>             # optional
sizes:
  clothing: <size>           # optional
  shoe: <size>               # optional
dietary: [vegetarian, no-nuts, ...]    # optional
medical_notes: <allergies, conditions> # optional, free text
important_dates:
  - { label: birthday, date: MM-DD }
  - { label: anniversary, date: MM-DD }
contact: { phone: null, email: null }
tags: [<topic>, ...]
updated: YYYY-MM-DD
---

<prose: preferences, gift ideas, notes, history>
```

The relationships area also gets `workspace/areas/relationships/resources/family/ROSTER.md` — a human-readable index of family members linking to each `people/<slug>/profile.md`.

**Notable-person frontmatter** (global figures / role models tracked to learn from — feeds the learning/career improvement loop):
```yaml
---
type: notable-person
name: <full name>
area: learning                         # or career
field: <domain string>                 # e.g. "distributed systems", "growth marketing"
why_tracked: <one-line reason>
relation: role-model                   # optional; only allowed value if present
nationality: <country>                 # optional
links:                                 # optional
  - { label: website, url: https://... }
  - { label: twitter, url: https://... }
projects:                              # optional
  - name: <project name>              # required within each project entry
    role: <founder | contributor | ...>
    status: active | completed | archived
    achievements:
      - <notable outcome>
achievements:                          # optional — standalone (not project-scoped)
  - <lifetime achievement>
lessons:                               # optional — what I learn / how to apply
  - <actionable takeaway>
important_dates:                       # optional
  - { label: birthday, date: MM-DD }
tags: [<topic>, ...]
updated: YYYY-MM-DD
---
```

`notable-person` records live in `workspace/people/` alongside relationship people but are typed differently. They do NOT use the personal `relation` enum (friend/mentor/colleague/etc.) — `relation: role-model` is the only allowed value, and it is optional. Their `area` is `learning` or `career` (not `relationships`), making them first-class inputs to the learning and career area docs and this week's learnings file.

**Call-note frontmatter** (`workspace/people/<slug>/calls/YYYY/MM-DD/notes.md` — one per conversation):
```yaml
---
type: call-note
person: <slug>             # must equal the person's folder slug
date: YYYY-MM-DD           # must equal the YYYY/MM-DD from the path
channel: call              # optional: call | video | in-person | text
duration_min: 35           # optional
topics: [<topic>, ...]     # optional
learnings:                 # required — the takeaways from the conversation
  - <what I learned / what matters>
follow_ups:                # optional — actions / things for next time
  - <action item>
mood: <vibe>               # optional
updated: YYYY-MM-DD        # optional
---

<prose: full notes from the call>
```

The `date` field and the `YYYY/MM-DD` path folder must agree, and `person` must equal the folder slug — both enforced by the validator. `learnings` is required.

## Workspace layout (enforced)

Only these 6 top-level folders are allowed under `workspace/` (enforced by `scripts/check-workspace-layout.ts`):

| Folder | Purpose |
|---|---|
| `areas/` | The 6 life areas (was `projects/` in control-pane) |
| `references/` | Reading list, tools, resources, idea-pipeline catalogs |
| `resources/` | Cross-area research, expert-guide/youtube, archive |
| `people/` | Relationships registry (was `social-profiles/`) |
| `scheduled/` | Future-dated items (scheduled.md) |
| `tasks/` | YYYY/{MM, MM-Wn, MM-DD}/ planning cadence |

Pre-commit (`scripts/check-staged-md.ts`) enforces: within an area folder, ONLY the 6 required docs at the area root and `resources/**` are stageable; outside area folders, `.md` files are allowed only at root (`README.md`, `CLAUDE.md`, `AGENTS.md`), `.claude/`, `.agents/`, `workspace/references/**`, `workspace/resources/**`, `workspace/people/**`, and `workspace/tasks/**`. `AGENTS.md` is a symlink to `CLAUDE.md` (single source of truth — edit `CLAUDE.md`).

## Agent memory

After any session, persist learnings that will help future sessions — non-obvious decisions, gotchas, discovered conventions, preferences, or context not derivable from the code/git history. Save each as its own markdown file under `.agents/memory/<YYYY-MM>/<short-kebab-slug>.md` (one fact per file), using the current month for the `<YYYY-MM>` folder, in this frontmatter format:

```markdown
---
title: <one-line summary>
date: <YYYY-MM-DD>
type: decision | gotcha | preference | reference | context
tags: [<topic>, ...]
---

<the learning in prose: what it is, why it matters, and how to apply it next time.>
```

Don't duplicate what the repo already records (code, git history, this file) or what only mattered to a single conversation. `.agents/` is allowlisted by the pre-commit hook, so memory files commit freely — commit them like any other artefact.

## Ops audit log

Every session that performs operations (writes files, commits, runs skills) must append them to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent). One bullet per operation: what was done, which files/areas were touched, and the resulting commit hash. Commit the log alongside the work. Read-only exploration needs no entry.

## Parking, backlog & archive

| Kind of parked work | Home | Mechanism |
|---|---|---|
| **Area-specific** plans/research you still intend to mine | `workspace/areas/<area>/resources/<topic>/` | Surfaced by the "read that area's 6 docs first" rule |
| **Strategic** "someday" items | each area's `ROADMAP.md` → `[proposed]` section | Promote to *Confirmed Roadmap* when you commit to it |
| **Tactical** weekly items that keep slipping | `workspace/tasks/backlog.md` (single living file) | `/review` pushes slipped items here; `/week` pulls candidates from it |
| **Tactical** committed future work (dated) | `workspace/scheduled/scheduled.md` or `workspace/scheduled/YYYY/...` subfolders | `/week` and `/day` graduate matching items into `tasks/` |
| **Dead / superseded** material worth remembering | `workspace/resources/archive/<YYYY-MM-DD>-<slug>/` | Frozen, read-only by convention, dated; a top `README.md` records provenance |

## Skills

All skills authored under `.agents/skills/<kebab>/SKILL.md`, surfaced via symlink at `.claude/skills/<name>` (enforced by `scripts/check-claude-skills-symlinks.ts`).

### Planning cadence

| Skill | When | What it does |
|---|---|---|
| `/month` | 1st of month | Scaffold `workspace/tasks/YYYY/MM/goals.md`, carry over unfinished goals, set north-star goals, roll up weekly learnings |
| `/week` | Monday | Scaffold `workspace/tasks/YYYY/MM-Wn/`, carry over unchecked items from prior week, set top-3 priorities |
| `/day` | Daily (morning) | Check off finished items, surface today's focus, write `focus-YYYY-MM-DD.md` to the daily folder |
| `/review` | Friday/EOW | Walk unchecked items, write `retro.md`, close out the week |

### Personal-ops skills

| Skill | Was (control-pane) | Behaviour |
|---|---|---|
| `/life-status` | brand-status | Health-check across all 6 areas: pull metrics (Whoop/Brex read-only), flag what's off-target vs prior period |
| `/add-area` | add-project | Onboard a new life area: scaffold the 6 docs, register in CLAUDE.md + skill tables + references README (atomic commit, passes all guards) |
| `/add-person` | (new) | Add someone to the people registry — a friend/mentor/colleague by name (minimal frontmatter), a family member (richer subtype), or a `notable-person` global role-model (projects, achievements, lessons) that feeds the learning/career area + this week's learnings. All data stored in frontmatter. |
| `/log-call` | (new) | Log a conversation/call with someone in the people registry — writes `workspace/people/<slug>/calls/YYYY/MM-DD/notes.md` with the call's date, topics, learnings, and follow-ups (all in frontmatter). Also surfaces recent calls when asked to "review last convo" with a person. |
| `/go-deep` | go-deep | YC-style "pick one area and go deep" — depth audit + 30-day plan for one area |
| `/youtube` | youtube | Distill a video into `resources/expert-guide/`, apply learnings to relevant area docs + this week's learnings |
| `/create-skill` | create-skill | Author new skills with correct structure + symlinks |

### Personal advisor personas

| Skill | Role |
|---|---|
| `/life-strategist` | Overall life vision, annual OKRs, big decisions |
| `/financial-advisor` | Budget, investment & pricing-of-time decisions (finance area) |
| `/health-coach` | Training, recovery, nutrition, sleep guidance (health area) |
| `/career-coach` | Skill roadmap, role/project prioritization, professional growth (career area) |
| `/learning-mentor` | Curriculum design, spaced-repetition, what-to-learn-next (learning area) |

## Planning cadence loop (run in order)

| Skill | When | What it does |
|---|---|---|
| `/month` | 1st of month | Scaffold month goals, carry over, set north-star, roll up learnings |
| `/week` | Monday | Scaffold week folder, carry over items, set top-3 priorities |
| `/day` | Daily (morning) | Focus sweep: check off finished, surface today's priorities, write `focus.md` |
| `/life-status` | Mid-week | Pull Whoop/Brex read-only, flag off-target metrics, write `life-status-YYYY-MM-DD.md` |
| `/review` | Friday/EOW | Walk unchecked items, write `retro.md`, close out the week |
| `/youtube` | Ad hoc | Distil a pasted transcript into `resources/expert-guide/youtube/`, apply learnings |

## Rules for every session

- **Commit + push** after writing or editing any file. Commit messages: short imperative (`Add health overview`).
- **Never modify previous weeks' folders.** Only the current week is writable.
- **External systems are read-only** (Whoop, Brex, calendar). Write recommendations; execute externally.
- **Never `--no-verify`** — all enforcement is at pre-commit. Fix the issue, don't bypass it.
- **Never auto-branch.** Work on `main` unless explicitly asked to branch.
- **Checklist syntax must be exact** — `/week` carryover depends on it:
  - Open: `- [ ] item`
  - Done: `- [x] item`
  - Dropped: `- [x] ~~item~~ (dropped: reason)`
- **Timezone is Asia/Kolkata (owner's local time).** All dates, weekdays, and date-stamped filenames are reckoned in Asia/Kolkata. Establish the authoritative "now" by running `TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'` rather than trusting the injected `currentDate`, which is date-only and can be a day off near midnight.

## Model routing

| Task type | Model tier |
|---|---|
| Data pulls (Whoop, Brex, external reads) | haiku |
| Life-status synthesis (report write-up, verdict) | default (sonnet) |
| Strategic analysis (advisor skills, go-deep, annual OKRs) | default / opus |
| File I/O, commits, memory writes | haiku |

When spawning subagents for per-area or per-API data fetches, pass `model: "haiku"` to the Agent tool call. Only the synthesis step (verdict logic, written report) runs on the calling model.
