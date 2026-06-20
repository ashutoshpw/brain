---
title: agent-task subsystem — deferred AI tasks distinct from human planning
date: 2026-06-20
type: decision
tags: [agent-task, .agents, validator]
---

The `.agents/tasks/` directory is a new subsystem for capability-gated deferred AI tasks. Each task is a single frontmatter-only `.md` file validated by `scripts/check-agent-tasks.ts`, which is wired into `.husky/pre-commit` as `bun scripts/check-agent-tasks.ts`.

**Frontmatter schema** (enforced by validator):
- `id`: must exactly equal the filename stem (e.g. `2026-06-20-prithal-youtube`)
- `title`: non-empty string
- `type`: enum — `fetch | analysis | write | scaffold | other`
- `status`: enum — `pending | blocked | in-progress | done | cancelled`
- `capability`: the AI capability required (e.g. `youtube`, `browser`, `whoop`)
- `area`: one of the 6 life areas
- `created`: ISO date (`YYYY-MM-DD`)
- `due`: optional ISO date
- `owner`: optional string (defaults to `agent`)
- `blocked_reason`: **required** when `status: blocked`; omitted otherwise
- `links`: optional list of `{ label, url }` objects

**Managed by** `/agent-task` skill (subcommands: `add | list | run | done | cancel`).

**Distinct from human planning artifacts**:
- `workspace/scheduled/scheduled.md` — human-authored future work items (dated checklists)
- `workspace/tasks/backlog.md` — tactical weekly items that have slipped
- `.agents/tasks/` — AI-executable tasks gated on a capability not yet available or deferred intentionally

**README.md skip rule**: `scripts/check-agent-tasks.ts` skips `README.md` in `.agents/tasks/` — only files matching `YYYY-MM-DD-*.md` are validated.

**Prithal Bharadwaj name gotcha**: folder slug is `prithal-bharadwaj` (as given); LinkedIn profile slug is `prithal-bhardwaj` (different spelling — missing 'a' in Bharadwaj). The linkedin-fetch agent task (`2026-06-20-prithal-linkedin.md`) will reconcile the canonical spelling when executed.
