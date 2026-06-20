---
name: agent-task
description: Create, review, run, and close deferred capability-gated agent tasks under .agents/tasks/ (e.g. fetch a YouTube video's info or a LinkedIn profile later and enrich a target file). Subcommands: add | list | run | done | cancel. Usage: /agent-task <add|list|run|done|cancel> [args]
---

Durable, reviewable, capability-gated deferred tasks for an AI agent to run later. All task files live under `.agents/tasks/`. One markdown file per task: `.agents/tasks/<id>.md`. The folder's `README.md` is the spec (do not parse it as a task). Validated by `scripts/check-agent-tasks.ts` at pre-commit (when the script exists — skip silently if not yet created).

Work on the **current branch** — never auto-branch. Dates are always reckoned in **Asia/Kolkata**.

---

## Step 0 — Establish current date

Run this before any other step:

```bash
TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
```

Treat the output as the authoritative **now**. Use it for today's date (`YYYY-MM-DD`) and for all `created`/`updated` timestamps. The injected `currentDate` is a fallback only; prefer the shell output, especially near midnight.

---

## Dispatch — choose subcommand

Read the first argument the user supplied:

| Argument | Section |
|---|---|
| `add` (or no subcommand but a description given) | **Section A — add** |
| `list` | **Section B — list** |
| `run` | **Section C — run** |
| `done` | **Section D — done / cancel** |
| `cancel` | **Section D — done / cancel** |

If the argument is absent and no description was given, ask: *"Which subcommand? `add`, `list`, `run`, `done`, or `cancel`?"*

---

## Section A — add

Create a new deferred agent task.

### Step A-1 — Gather task fields

Accept whatever the user supplied; **ask once** for anything missing — do not proceed without `title` and `capability`.

| Field | Required | Notes |
|---|---|---|
| `title` | **Yes** | Short human-readable name. Used to derive the id slug. |
| `capability` | **Yes** | Kebab slug naming the required capability, e.g. `youtube-fetch`, `linkedin-fetch`, `web-fetch`, `manual`. Use `manual` when the task requires human action or a not-yet-integrated capability. |
| `source` | No | URL or path the task will read from. |
| `target` | No | Repo path the task will enrich (e.g. `workspace/people/john-doe/profile.md`). |
| `depends_on` | No | List of task ids that must be `done` before this one can run. |
| `priority` | No | `low` · `normal` · `high`. Default: `normal`. |
| `description + acceptance criteria` | Recommended | Full prose body: what the future agent must do and how to judge it complete. |

Set **`status: pending`** by default. If the `capability` is unavailable right now (e.g. LinkedIn requires authenticated fetch that isn't wired up), set `status: blocked` and ask the user for a `blocked_reason` string.

### Step A-2 — Derive the task id

1. Today's date from Step 0 → `YYYY-MM-DD`.
2. Convert `title` to a kebab slug: lowercase, strip punctuation, spaces → hyphens, collapse repeated hyphens, strip leading/trailing hyphens (e.g. `"Fetch John Doe's LinkedIn"` → `fetch-john-doe-s-linkedin`).
3. Id = `YYYY-MM-DD-<kebab-slug>`.
4. **Uniqueness check:** if `.agents/tasks/<id>.md` already exists, append `-2`, then `-3`, etc. until the path is free.

The `id` field in frontmatter **must equal the filename without `.md`**.

### Step A-3 — Write the task file

Create `.agents/tasks/<id>.md`. Use **exactly** this frontmatter shape (omit optional fields entirely rather than writing `null`):

```yaml
---
id: <YYYY-MM-DD-kebab-slug>
title: <title>
status: pending          # or: blocked
capability: <kebab-slug>
created: YYYY-MM-DD
updated: YYYY-MM-DD
source: <url-or-path>    # optional
target: <repo-path>      # optional
depends_on:              # optional — list of ids
  - <id>
blocked_reason: <text>   # required if status: blocked; omit otherwise
priority: normal         # optional: low | normal | high
result: ~                # omit — filled at run/done time
tags:                    # optional
  - <tag>
---

<Body: full description of what the future agent must do.>

## Acceptance criteria

- <criterion 1>
- <criterion 2>
```

Validation rules enforced by `scripts/check-agent-tasks.ts`:
- `id` must match filename (minus `.md`) exactly — format `YYYY-MM-DD-<kebab-slug>`.
- `status` must be one of `pending | blocked | in-progress | done | cancelled`.
- `capability` must be a non-empty kebab string.
- `created` and `updated` must be `YYYY-MM-DD`.
- `blocked_reason` must be present (non-empty string) when `status: blocked`; must be absent or `null` otherwise.
- `result` must be absent, `null`, or a string.
- `depends_on`, `tags` — if present, must be lists.
- `priority` — if present, must be `low | normal | high`.

Omit any optional field entirely rather than writing `null` or an empty list.

### Step A-4 — Validate and commit

1. Run the guard (skip silently if the script does not yet exist):
   ```bash
   bun scripts/check-agent-tasks.ts 2>/dev/null || true
   ```
2. Stage and commit:
   ```bash
   git add .agents/tasks/<id>.md
   git commit -m "Add agent task <id>"
   git push
   ```
3. Append to ops log (Step Z below).

---

## Section B — list

**Read-only.** Scan `.agents/tasks/*.md` (skip `README.md` and any non-`.md` file), parse YAML frontmatter, and display a summary table.

### Step B-1 — Determine filter

| Argument | Show |
|---|---|
| `list` or `list pending` | `pending` + `blocked` + `in-progress` |
| `list all` | all statuses |
| `list done` | `done` only |
| `list cancelled` | `cancelled` only |
| `list <capability>` | all tasks with that capability, all statuses |

### Step B-2 — Render table grouped by status

Print results in status-priority order: `in-progress` → `blocked` → `pending` → `done` → `cancelled`.

```
## Agent tasks — [filter]

### in-progress
| id | title | capability | target | priority |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

### blocked
| id | title | capability | blocked_reason | priority |
|---|---|---|---|---|
...

### pending
| id | title | capability | target | priority |
|---|---|---|---|---|
...
```

If no tasks match the filter, print: *"No agent tasks found (filter: `<filter>`)."*

No files are written. No commit.

---

## Section C — run

Execute a deferred task, write results into the target, and close the task.

### Step C-1 — Resolve which task(s) to run

Two forms:
- **`run <id>`** — run exactly that task.
- **`run --capability <cap>`** — run all `pending` tasks whose `capability` equals `<cap>`, in `created` ascending order.

Read the task file(s). For each task, check preconditions before executing:

1. **Status check:** only `pending` or `in-progress` tasks can be run. If `done` or `cancelled`, tell the user and stop.
2. **`depends_on` check:** if the task lists any `depends_on` ids, read each dependency's task file. If any dependency's `status` is not `done`, **do not run** — tell the user: *"Task `<id>` depends on `<dep-id>` which is `<status>`. Resolve that task first."* Set the current task to `blocked` with `blocked_reason: "depends on <dep-id>"` and update the file.

### Step C-2 — Load the capability

Check the task's `capability` field and load what's needed:

| Capability | How to load |
|---|---|
| `web-fetch` | Load `WebFetch` via ToolSearch: `select:WebFetch` |
| `web-search` | Load `WebSearch` via ToolSearch: `select:WebSearch` |
| `youtube-fetch` | Use the `youtube` MCP tools (already available as deferred tools with `mcp__claude_ai_youtube__` prefix); load via ToolSearch as needed |
| `linkedin-fetch` | Requires authenticated fetch — see below |
| `manual` | Cannot be auto-run; tell the user it requires manual action |
| any other | Attempt ToolSearch for matching tool; if not found, treat as `manual` |

**If the capability is unavailable or fails to load:** do NOT fabricate data. Set `status: blocked`, write `blocked_reason: "<reason why capability is unavailable>"`, bump `updated`, commit, and stop. Report clearly to the user.

**LinkedIn note:** LinkedIn does not offer a public API for profile scraping. An authenticated fetch may be possible via WebFetch with session cookies, but this depends on whether the user is logged in via a browser session accessible to the agent. Attempt WebFetch on the profile URL; if it returns a login wall or error, mark the task `blocked` with `blocked_reason: "LinkedIn fetch requires authenticated session; access denied"`.

### Step C-3 — Execute the task

Set `status: in-progress`, bump `updated`, write the file, and commit before starting work (so a crash leaves the task in a recoverable state):

```bash
# edit the task file: status → in-progress, updated → today
git add .agents/tasks/<id>.md
git commit -m "Start agent task <id>"
git push
```

Then perform the capability work:

- **web-fetch / web-search:** fetch the `source` URL or run searches. Extract the data described in the task body.
- **youtube-fetch:** use the YouTube MCP tools to fetch video metadata, transcript, or playlist info from the `source` URL/id.
- **linkedin-fetch:** fetch the LinkedIn profile URL via WebFetch. Parse name, headline, location, about, experience, education as available.
- **manual:** skip execution — this was caught in Step C-2.

Parse and validate the fetched data. **Never invent or interpolate data** — only write what was actually returned by the capability. If the response is empty or an error, go to Step C-error.

### Step C-4 — Write results into the target

If the task specifies a `target` file (a repo path), read it first, then enrich it with the fetched data. Common enrichment patterns:

- **Person profile** (`workspace/people/<slug>/profile.md`): update frontmatter fields like `name`, `location`, `tags`, `links`; append an `## About` or `## Achievements` section in the body. Only write fields that were actually fetched — never overwrite an existing non-null field with a null/missing value from the fetch.
- **Area resource file**: append a new section or update a table.
- **Any markdown file**: append a dated `## Fetched YYYY-MM-DD` section with the raw data summary.

If no `target` is set, write a summary of fetched data into the task file's body under `## Fetched result`.

### Step C-5 — Mark done

Update the task file:

```yaml
status: done
updated: YYYY-MM-DD
result: "<one-line summary of what was fetched/written, or a link>"
```

Remove `blocked_reason` if it was set. Stage, commit, push:

```bash
git add .agents/tasks/<id>.md
# + any target files written:
git add <target-file>
git commit -m "Run agent task <id>"
git push
```

### Step C-error — Mark blocked on failure

If execution fails (capability unavailable, network error, parsing error, empty result):

```yaml
status: blocked
updated: YYYY-MM-DD
blocked_reason: "<specific reason>"
```

Commit and report clearly. Do not mark `done` unless the work is actually done.

---

## Section D — done / cancel

Manually close out a task without running it (e.g. the work was done externally, or the task is no longer relevant).

### Step D-1 — Read the task

Read `.agents/tasks/<id>.md`. Confirm the id exists. If not, tell the user and stop.

### Step D-2 — Collect a result or reason

- **`done <id>`**: ask for a short `result` string (what was accomplished, or a link). Accept whatever the user supplies; use `"Manually marked done"` if they provide nothing.
- **`cancel <id>`**: ask for a cancellation reason. Use `"Cancelled by user"` if they provide nothing.

### Step D-3 — Update and commit

Update the task file:

- `done`: set `status: done`, `updated: YYYY-MM-DD`, `result: "<text>"`. Remove `blocked_reason` if set.
- `cancel`: set `status: cancelled`, `updated: YYYY-MM-DD`, `result: "<reason>"` (reuse the result field for the cancellation note). Remove `blocked_reason` if set.

```bash
git add .agents/tasks/<id>.md
git commit -m "<Done|Cancel> agent task <id>"
git push
```

---

## Step Z — Ops log

After any subcommand that writes files or commits, append to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent). One bullet per operation:

```markdown
- `/agent-task <subcommand>` — <what was done>; task id `<id>`; files touched: <list>; commit <hash>.
```

Example bullets:
- `/agent-task add` — created `.agents/tasks/2026-06-20-fetch-john-doe-linkedin.md` (`capability: linkedin-fetch`, `status: pending`); commit `abc1234`.
- `/agent-task run` — executed `web-fetch` on `https://example.com`; enriched `workspace/people/john-doe/profile.md` (added `location`, `links`); task marked `done`; commit `def5678`.
- `/agent-task cancel` — task `2026-06-15-fetch-youtube-video` marked `cancelled` (reason: "video deleted"); commit `ghi9012`.

Commit the ops log alongside the work (include in the same `git add` / `git commit`, or as a follow-up commit if the main commit was already pushed).

---

## Constraints

- **All task data in frontmatter** — body is for description and acceptance criteria only; structured fields (`status`, `result`, `blocked_reason`, etc.) always live in YAML frontmatter.
- **Never fabricate fetched data** — if a capability is unavailable or returns an error, mark `blocked` with a `blocked_reason`. Do not populate target files with invented content.
- **`list` is read-only** — no files written, no commits.
- **`id` must equal filename** — `2026-06-20-fetch-profile.md` must have `id: 2026-06-20-fetch-profile`. A mismatch will fail validation.
- **`blocked_reason` is required when `status: blocked`** — never leave a blocked task without an explanation.
- **Respect `depends_on`** — do not run a task whose dependencies are not `done`.
- **Work on the current branch; never auto-branch.**
- **Never `--no-verify`** — fix the validator error, do not bypass the hook.
- **Dates via `TZ='Asia/Kolkata' date`** — never compute dates from `currentDate` alone.
- **Push after every commit** — if push fails, report and stop; do not force-push.
- **Validate before commit** — run `bun scripts/check-agent-tasks.ts` (skip silently if the script does not yet exist); fix any errors before committing.
