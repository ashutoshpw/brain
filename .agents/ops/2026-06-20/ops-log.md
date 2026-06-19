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
