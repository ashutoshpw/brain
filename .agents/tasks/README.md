# Agent Tasks

## What is an agent task?

An **agent task** is a unit of deferred, AI-executable work that requires a specific
tool or capability to run. Agent tasks are authored now and executed later — when the
needed capability is available in a session.

### Agent tasks vs. human planning

| | Human planning | Agent tasks |
|---|---|---|
| **Home** | `workspace/tasks/` (now/past), `workspace/scheduled/` (future) | `.agents/tasks/` |
| **Actor** | You (human) | An AI agent |
| **Gate** | Date / week | Capability / tool availability |
| **Examples** | "Draft Q3 OKRs", "Pay rent" | "Fetch YouTube metadata", "Enrich LinkedIn profile" |

`workspace/tasks/backlog.md` is the human tactical backlog. `workspace/scheduled/scheduled.md`
is for forward-dated human commitments. Neither of those is the right place for AI-executable,
capability-gated work — that belongs here.

---

## File layout

```
.agents/tasks/
  README.md              ← this spec (not a task; skipped by the validator)
  YYYY-MM-DD-<slug>.md   ← one file per task
```

- Each task is its own markdown file.
- `id` format: `YYYY-MM-DD-<kebab-slug>` — the creation date followed by a short descriptor.
- The `id` value in frontmatter **must exactly equal** the filename without `.md`.

---

## Frontmatter schema

### Required fields

| Field | Type | Description |
|---|---|---|
| `id` | string | `YYYY-MM-DD-<kebab-slug>`, must equal filename |
| `title` | string | One-line description of the task |
| `status` | enum | See lifecycle below |
| `capability` | string | Kebab slug naming the tool/ability needed |
| `created` | YYYY-MM-DD | Date the task was created |
| `updated` | YYYY-MM-DD | Date of last edit |

### Optional fields (validated when present)

| Field | Type | Description |
|---|---|---|
| `source` | string | URL or path that prompted the task |
| `target` | string | Repo-relative path to write/update on completion |
| `depends_on` | list of strings | IDs of tasks that must complete first |
| `blocked_reason` | string | Why the task is blocked (required when `status: blocked`) |
| `result` | string | Output path or summary written on completion |
| `tags` | list of strings | Categorisation tags |
| `priority` | `low\|normal\|high` | Scheduling priority (default: normal) |

### Verbatim example

```yaml
---
id: 2026-06-20-fetch-youtube-lex-fridman-ep-400
title: Fetch metadata and transcript for Lex Fridman ep. 400
status: pending
capability: youtube-fetch
created: 2026-06-20
updated: 2026-06-20
source: https://www.youtube.com/watch?v=xxxxxxxx
target: workspace/people/lex-fridman/profile.md
tags: [youtube, learning, ai]
priority: normal
---

Fetch the episode's metadata, extract key ideas, and enrich
`workspace/people/lex-fridman/profile.md` with a new `projects` entry.
```

---

## Status lifecycle

```
pending ──► in-progress ──► done
   │              │
   ▼              ▼
blocked        cancelled
```

| Status | Meaning |
|---|---|
| `pending` | Ready to run as soon as the named `capability` is available |
| `blocked` | Cannot run yet — either a dependency is unfinished or a tool is missing; `blocked_reason` is required |
| `in-progress` | An agent has picked this up and is executing it |
| `done` | Task completed; `target` was updated and `result` records the output |
| `cancelled` | Task is no longer needed |

---

## The `capability` field

`capability` names the tool or ability an agent needs to execute the task. It is a
free-form kebab slug — there is no fixed registry, but consistency helps routing:

| Capability slug | Meaning |
|---|---|
| `youtube-fetch` | Fetch video metadata / transcript via YouTube MCP |
| `linkedin-fetch` | Fetch a LinkedIn profile via browser automation |
| `web-fetch` | General HTTP fetch / web scraping |
| `whoop-read` | Pull recovery/sleep/workout data from Whoop |
| `brex-read` | Pull transaction data from Brex |
| `manual` | Requires a human action before the agent can proceed |

An agent session announces which capabilities it has. A task stays `pending` or
`blocked` until a session with the matching capability picks it up.

---

## How to add, review, and run tasks

Use the `/agent-task` skill (`.agents/skills/agent-task/SKILL.md`) to manage tasks:

- **Add** — `/agent-task add` — prompts for title, capability, optional fields,
  writes the file, and commits it.
- **List/review** — `/agent-task list` — shows all tasks grouped by status.
- **Run** — `/agent-task run [id]` — picks up a specific task (or all `pending`
  tasks matching available capabilities) and executes it.

You can also author task files manually. The pre-commit hook validates every
`.agents/tasks/*.md` file (except `README.md`) on commit.

---

## Worked example

**Scenario:** You want to enrich a person profile with their YouTube channel's latest
content, but the current session does not have YouTube tool access.

**Task file:** `.agents/tasks/2026-06-20-enrich-lex-fridman-youtube.md`

```yaml
---
id: 2026-06-20-enrich-lex-fridman-youtube
title: Enrich Lex Fridman profile with latest YouTube episodes
status: pending
capability: youtube-fetch
created: 2026-06-20
updated: 2026-06-20
source: https://www.youtube.com/@lexfridman
target: workspace/people/lex-fridman/profile.md
tags: [youtube, relationships, learning]
priority: normal
---

Pull the five most recent Lex Fridman Podcast episodes from YouTube.
For each episode, add a `projects` entry to `workspace/people/lex-fridman/profile.md`
with: episode number, title, guest name, air date, and a one-sentence summary.
Commit the enriched profile.
```

**Later**, in a session where `youtube-fetch` is available, the agent runs:

```
/agent-task run 2026-06-20-enrich-lex-fridman-youtube
```

On completion the agent sets `status: done`, records `result`, updates `updated`,
and commits.

---

## Validator

`scripts/check-agent-tasks.ts` enforces this spec at pre-commit time. It validates
only STAGED `.agents/tasks/*.md` files, skipping `README.md`. Violations block the
commit with a descriptive error. Run directly with:

```
bun scripts/check-agent-tasks.ts
```

Exit 0 = clean. Exit 1 = one or more violations.
