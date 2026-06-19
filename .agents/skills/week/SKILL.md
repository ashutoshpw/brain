---
name: week
description: Scaffold the current week's planning folder, carry over unfinished checklist items from the previous week, surface monthly goals and area habits as context, ask for top-3 priorities, and commit.
---

## Step 1 — Determine the current week folder name

1. **Establish the current Asia/Kolkata time first.** Run this with Bash before computing anything else:

   ```bash
   TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
   ```

   Treat its output as the authoritative "now" — date, 24-hour time, and weekday — in the owner's timezone (Asia/Kolkata). Use it to determine today's date and weekday when computing the current `MM-Wn` week folder. The injected `currentDate` is a fallback only; if the two disagree (e.g. near midnight or across a timezone boundary), prefer the Asia/Kolkata shell output.

2. List all year/month-week folders under `workspace/tasks/` (e.g. `workspace/tasks/2026/06-W2/`). **Skip bare `MM` folders** (two digits, no dash suffix) — those are monthly goals folders, not week folders. Only consider entries matching the `MM-Wn` pattern.
3. Infer the naming convention from the most recent existing `MM-Wn` folder.
4. Compute the current week's folder name as `workspace/tasks/YYYY/MM-Wn/` where `Wn` = nth occurrence of that ISO week within the month (W1–W5).
5. If the date falls on a month boundary where Wn is ambiguous, propose the name and **ask the user to confirm** before proceeding.

## Step 2 — Detect existing vs new week

- If `workspace/tasks/YYYY/MM-Wn/` already exists, switch to **update mode**: skip folder creation, go directly to Step 3 to refresh carried-over items, and overwrite only the `## Carried over` and `## Notes` sections of the existing `priorities.md`. In update mode, skip the user-confirmation dialog in Step 3 and re-use the keep/drop decisions already reflected in the existing `## Carried over` section; only add newly discovered unchecked items that weren't previously listed (asking the user about those new items only).
- Otherwise proceed to create the folder.

## Step 3 — Find and extract unfinished work

1. Locate the **previous week's folder** (the most recent `MM-Wn` folder before the current one). **Skip bare `MM` monthly folders** when scanning — only `MM-Wn` entries qualify as week folders. If no previous week folder exists (first ever run), write `_None._` under `## Carried over` and skip the confirmation dialog.
2. Scan every `.md` file in that folder for unchecked checklist items matching the pattern `- [ ]`.
3. Collect each item, annotating it with its source file: `(from workspace/tasks/MM-Wn/filename.md)`.
4. Present the full carried-over list to the user and ask: **"Which of these should I keep, and which should I drop?"** Wait for the response before writing any files.

## Step 4 — Check backlog for candidates

Read `workspace/tasks/backlog.md` (skip silently if absent). Present any open `- [ ]` items there to the user as **candidates** — they were previously slipped from earlier weeks:

> *"These items are in your backlog — would you like to pull any into this week?"*

On confirmation, move confirmed items into the `## Carried over` section of `priorities.md` (annotated `(from backlog.md)`) and mark them `- [x]` in `backlog.md` so they don't appear as candidates again.

## Step 5 — Graduate scheduled items

Read `workspace/scheduled/scheduled.md` and `workspace/scheduled/YYYY/MM-Wn/` (if it exists) to surface anything due this week. Do this in three passes:

### 5a — Week-targeted lines (current week)

1. Read every line in `workspace/scheduled/scheduled.md`.
2. Pull all open `- [ ]` lines whose tag **exactly matches** the target week: `(YYYY-MM-Wn)`.
3. Present them to the user and ask: **"These scheduled items are tagged for this week — graduate them all, or drop any?"** Wait for the response.
4. For every confirmed item, strip the `(YYYY-MM-Wn)` tag and add the bare `- [ ] item` text to the **`## Scheduled this week`** section of `priorities.md`.
5. **Remove** those graduated lines from `scheduled.md` (they move, not copy — nothing lives in two places). If no week-targeted lines remain in a section, leave the section header intact but empty.
6. If there are no matching lines, note that to the user and write `_None._` under `## Scheduled this week`.

### 5b — Prepared artifact folder

1. Check whether `workspace/scheduled/YYYY/MM-Wn/` exists for the target week.
2. If it does, list its files to the user and confirm: **"These prepared files are ready for this week — move them into the tasks folder?"** Wait for confirmation.
3. On confirmation, move every file in that folder into `workspace/tasks/YYYY/MM-Wn/` using `git mv` (if the files are already git-tracked) or a plain `mv` (if not yet tracked). Then remove the now-empty `workspace/scheduled/YYYY/MM-Wn/` directory (and its parent year/month directories if they become empty).
4. If the folder does not exist, skip silently.

### 5c — Overdue sweep (past-week items never graduated)

1. Re-scan `workspace/scheduled/scheduled.md` for any open `- [ ]` lines tagged with a `(YYYY-MM-Wn)` whose week is **earlier** than the target week (already elapsed).
2. Also check for any `workspace/scheduled/YYYY/MM-Wn/` folders whose week is in the past.
3. Present overdue items and artifact folders to the user: **"These scheduled items/files are overdue — graduate them now?"** Wait for the response.
4. Graduate confirmed overdue items into the **`## Overdue (from scheduled)`** section of `priorities.md`, and remove them from `scheduled.md` the same way as Step 5a.
5. Move confirmed overdue artifact folders into `workspace/tasks/YYYY/MM-Wn/` the same way as Step 5b.
6. If nothing is overdue, skip silently (do not add the section to `priorities.md`).

> **Day-targeted lines** `(YYYY-MM-DD)` in `scheduled.md` are **not** graduated by `/week` — they belong to `/day`. Leave them in place. You may list this week's upcoming day-targeted lines as a read-only heads-up to the user, but do not remove or move them.

## Step 6 — Surface monthly context and area habits, then ask for top priorities

Before asking the user for their top 3, surface relevant context from two sources so they can promote items directly into priorities:

1. **Monthly north-star goals.** Check whether `workspace/tasks/YYYY/MM/goals.md` exists (bare `MM` folder for the current month). If it does, read its `## North-star goals this month` list and present it to the user: *"This month's north-star goals (from `workspace/tasks/YYYY/MM/goals.md`): …"*

2. **Proposed actions from learnings.** Check whether `workspace/tasks/YYYY/MM-Wn/learnings.md` exists in the current week's folder, and the prior week's `workspace/tasks/YYYY/MM-(n-1)/learnings.md` (if applicable). For each that exists, read its `### Proposed actions` items and surface them: *"Proposed actions from learnings (`workspace/tasks/YYYY/MM-Wn/learnings.md`): …"*

3. **Area habits.** For each of the 6 life areas (`health`, `finance`, `career`, `relationships`, `learning`, `home`), read `workspace/areas/<area>/HABITS.md` and collect any open `- [ ]` items. Surface them as a read-only habits reminder — these are recurring commitments the owner has committed to in each area:

   > *"Recurring habits from your area HABITS.md files:*
   > - health: …
   > - finance: …
   > - career: …
   > - …"

   The habits list is read-only context — do not add them to `priorities.md` automatically. The user may promote specific habits to the top-3 or to the `## Habits this week` section (see Step 7 template) if they want to track them explicitly this week.

Present these as **read-only candidate priorities** (block-quoted or indented, clearly labelled with their source path). Do not add them automatically — let the user decide which, if any, to pull in.

Then ask: **"What are your top 3 priorities for this week?"** Accept free-form input; you will format them as a numbered list. If the user says "use the monthly goals" or similar, pull from the list you surfaced above.

## Step 7 — Write priorities.md

Create `workspace/tasks/YYYY/MM-Wn/priorities.md` with this exact structure:

```markdown
# Week YYYY/MM-Wn

## Top 3 this week

1. <priority 1>
2. <priority 2>
3. <priority 3>

## Carried over

- [ ] <item> (from workspace/tasks/MM-Wn/source.md)
...

## Scheduled this week

- [ ] <item>
...

## Overdue (from scheduled)

- [ ] <item>
...

## Habits this week

- [ ] <habit promoted from area HABITS.md>
...

## Notes

```

Use only the items the user confirmed in Steps 3 and 5. If a section has no items, write `_None._`. Omit the `## Overdue (from scheduled)` section entirely if Step 5c found nothing overdue. Omit `## Habits this week` if the user chose not to track any habits explicitly this week.

## Step 8 — Commit and push

First append this run's operations to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent) — one bullet per file created/edited/moved, per the CLAUDE.md ops audit log. Then stage and commit everything that changed:

```bash
git add workspace/tasks/YYYY/MM-Wn/
git add workspace/tasks/backlog.md
git add workspace/scheduled/scheduled.md
git add .agents/ops/YYYY-MM-DD/
# if artifact folders were moved, git add their destination paths and
# git rm their source paths (git mv handles this automatically when used)
git commit -m "Start week YYYY/MM-Wn"
git push
```

Use the actual folder name in the commit message. Include `workspace/scheduled/scheduled.md` in the staged files whenever any lines were removed from it. Include `workspace/tasks/backlog.md` whenever backlog items were confirmed into this week. Include moved artifact files in the same commit.

## Constraints

- **Never modify any file in a previous week's folder.** Carryover is copy-only.
- Do not create any files other than `priorities.md` in the new folder (unless the user explicitly requests additional files).
- **External systems are read-only.** Do not call Whoop or Brex MCP tools from this skill — read area `METRICS.md` and `HABITS.md` markdown files instead.
- If the push fails, report the error and stop — do not force-push.
