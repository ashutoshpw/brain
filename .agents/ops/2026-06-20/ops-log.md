# Ops Log — 2026-06-20

## Session: people-registry tracking feature

- Extended `scripts/check-people-data.ts` to validate a new `notable-person` type, enriched optional `person`/friend fields (`location`, `how_we_met`, `interests`, `notes`), and a new per-person `call-note` file kind at `workspace/people/<slug>/calls/YYYY/MM-DD/notes.md`. (c266ac0)
- Updated `CLAUDE.md` to document `notable-person` frontmatter spec, enriched friend fields, the call-note block + folder convention, and new `/add-person` and `/log-call` skill rows in the skills tables. (c266ac0)
- Created template/example profiles: `workspace/people/notable-person-1/profile.md` (notable-person type) and `workspace/people/friend-1/profile.md` (person type with enriched fields); added sample call note at `workspace/people/friend-1/calls/2026/06-20/notes.md`. (c266ac0)
- Authored `/add-person` skill at `.agents/skills/add-person/SKILL.md` with symlink `.claude/skills/add-person` → `../../.agents/skills/add-person`. (c266ac0)
- Authored `/log-call` skill at `.agents/skills/log-call/SKILL.md` with symlink `.claude/skills/log-call` → `../../.agents/skills/log-call`. (c266ac0)
- Created role-models index at `workspace/areas/learning/resources/role-models/README.md`. (c266ac0)
- All 8 pre-commit validators passed (exit 0) before and during commit; pushed to `origin/main` at commit `c266ac0`.

## Session: add Manoj Bora to people registry

- `/add-person` — added `Manoj Bora` (`type: person`, slug: `manoj-bora`) to `workspace/people/manoj-bora/profile.md`; Instagram stored as `links[0]` (`{ label: instagram, url: https://www.instagram.com/mavericks_92 }`); validators exit 0; commit `9325c4e`.

## Session: update Manoj Bora profile — Travysys brand

- Updated `workspace/people/manoj-bora/profile.md`: added `projects` list (`Travysys`, role: founder, status: active) and second link entry (`{ label: travysys, url: https://travysys.com }`); bumped `updated` to 2026-06-20; both validators exit 0; commit `0f2b5b5`.

## Session: log call with Manoj Bora (2026-06-19)

- `/log-call` — wrote `workspace/people/manoj-bora/calls/2026/06-19/notes.md`; topics: instagram-growth, paid-ads, content-strategy, travysys; key learnings: media marketer (FB+Google, INR 12k/mo fee + INR 30k/mo ad budget for Travysys), content strategist + video editor (INR 6k/mo, @shivanginarula.in ~330k followers), @thekumarmethod 1.2M followers from 6 videos; both validators exit 0; commit `2353487`.

## Session: reference profiles + ad-economics playbook

- Added `workspace/people/thekumarmethod/profile.md` (`type: notable-person`, field: Instagram growth / short-form video) and `workspace/people/shivanginarula/profile.md` (`type: notable-person`, field: Instagram lifestyle / content); added both as new rows to `workspace/areas/learning/resources/role-models/README.md`; all 8 validators exit 0; commit `3cdb516`.
- Added `workspace/areas/career/resources/ad-economics/README.md` — paid Instagram growth cost model (INR 48k/month total: marketer + ad spend + content strategist) sourced from Manoj Bora call 2026-06-19; added `[proposed]` career ROADMAP item for Instagram-led software funnel; all 8 validators exit 0; commit `3cdb516`.

## Session: agent-task subsystem + Prithal Bharadwaj tracking

- Created `.agents/tasks/README.md` — spec for the agent-task subsystem: capability-gated deferred AI tasks, one frontmatter file per task, fields: `id`, `title`, `type`, `status`, `capability`, `area`, `created`, `due`, `owner`, `blocked_reason`, `links`. Distinct from `workspace/scheduled/` (human planning) and `workspace/tasks/backlog.md`. (4a9ed08)
- Wrote `scripts/check-agent-tasks.ts` — validator that enforces agent-task frontmatter schema; wired into `.husky/pre-commit` as `bun scripts/check-agent-tasks.ts` (line 9, same style as all other validators); all 9 validators exit 0. (4a9ed08)
- Authored `/agent-task` skill at `.agents/skills/agent-task/SKILL.md` with symlink `.claude/skills/agent-task`; skill supports `add|list|run|done|cancel` subcommands. (4a9ed08)
- Added `workspace/people/prithal-bharadwaj/profile.md` (`type: notable-person`, slug: `prithal-bharadwaj`, field: YouTube growth / subscriber acquisition, LinkedIn slug: `prithal-bhardwaj`); registered as new row in `workspace/areas/learning/resources/role-models/README.md`. (4a9ed08)
- Created `.agents/tasks/2026-06-20-prithal-youtube.md` — pending agent task to fetch Prithal Bharadwaj's YouTube channel data and distil learnings into `resources/expert-guide/`; `capability: youtube`. (4a9ed08)
- Created `.agents/tasks/2026-06-20-prithal-linkedin.md` — pending agent task to fetch Prithal's LinkedIn profile and reconcile canonical name spelling (folder: `prithal-bharadwaj`, LinkedIn slug: `prithal-bhardwaj`); `capability: browser`. (4a9ed08)
