# brain — Personal Life Control Pane

Personal ops repo for Ashutosh. Every artefact is a committed `.md` file on `main`.
GitHub: ashutoshpw/brain.

## What it is

`brain` is the personal analogue of `w3mirror/control-pane`: a markdown-only, Bun-based repo
where every decision, goal, habit, and plan lives as a committed file. External systems
(Whoop, Brex, calendar) are **read-only** — this repo holds the thinking and decisions; you
execute externally.

## The 6 life areas

| Area | Focus |
|---|---|
| `health` | Fitness, nutrition, sleep, medical (Whoop = read-only source) |
| `finance` | Budget, net worth, investments, expenses (Brex = read-only source) |
| `career` | Professional goals, skills, income streams, portfolio |
| `relationships` | Relationship strategy; people registry lives in `workspace/people/` |
| `learning` | Books, courses, skills to acquire (feeds from expert-guide) |
| `home` | Household, errands, documents, recurring admin, possessions |

Each area has 6 required docs: `OVERVIEW`, `GOALS`, `METRICS`, `ROADMAP`, `HABITS`, `PRINCIPLES`.

## Structure mirrors control-pane

- `workspace/` — 6 top-level folders only: `areas/`, `references/`, `resources/`, `people/`, `scheduled/`, `tasks/`
- `scripts/` — TypeScript validators run via Bun in the pre-commit hook
- `.agents/` — memory, ops audit log, skills (canonical)
- `.claude/` — settings + skill symlinks

## Conventions

- Commit + push after every file write
- Never `--no-verify`
- Timezone: Asia/Kolkata
- Checklist syntax: `- [ ] item` / `- [x] item` / `- [x] ~~item~~ (dropped: reason)`
