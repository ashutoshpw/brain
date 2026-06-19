---
name: review
description: End-of-week review — walk unchecked checklist items with the user, update source files, reflect on each life area's progress, push slipped items to the backlog, write retro.md, and commit.
---

## Step 1 — Find the current week folder

1. **Establish the current Asia/Kolkata time first.** Run this with Bash before anything else:

   ```bash
   TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
   ```

   Treat its output as the authoritative "now" — date, 24-hour time, and weekday — in the owner's timezone (Asia/Kolkata). Use it to identify the current week folder and to date the review. The injected `currentDate` is a fallback only; if the two disagree (e.g. near midnight or across a timezone boundary), prefer the Asia/Kolkata shell output.

2. List all `workspace/tasks/YYYY/MM-Wn/` folders under `workspace/tasks/`; take the most recent one. **Skip bare `MM` monthly folders** — only `MM-Wn` entries qualify as week folders.
3. Read every `.md` file in that folder. For each file collect all checklist lines (`- [ ]` and `- [x]`), noting which are checked vs unchecked.

## Step 2 — Walk unchecked items interactively

For each source file that has unchecked items, call `AskUserQuestion` with a batch of those items and offer three options per item:

- **Done** — mark complete
- **Still open** — leave as-is (will appear in `## Slipped` and be pushed to backlog)
- **Drop** — remove from scope (record reason)

Never silently mark anything done. Batch related items from the same file into a single question where sensible.

## Step 3 — Apply answers in place

Edit the source `.md` files according to the user's answers:

- **Done** → change `- [ ]` to `- [x]`
- **Still open** → leave unchanged
- **Drop** → change `- [ ]` to `- [x] ~~<item text>~~ (dropped: <reason>)`

Do not move or delete lines — edit in place.

## Step 4 — Push slipped items to backlog

For each item the user marked **Still open** in Step 2, present it to the user and ask: *"Should this go to the backlog for a future week, or carry directly into next week's priorities?"*

- **Backlog** → append the item as an open `- [ ]` to `workspace/tasks/backlog.md` (create the file if absent, with a `# Backlog` heading). The item stays in the source file as-is (the carryover logic in `/week` will not re-surface it from the backlog until `/week` explicitly pulls it).
- **Carry into next week** → leave it in the source file as `- [ ]`; `/week` will pick it up via carryover.

This prevents the same slipped item from accumulating across weeks — it either gets a deliberate home (backlog) or an immediate home (next week's priorities).

## Step 5 — Reflect on area progress

Ask the user for a one-line status on each of the 6 life areas this week. Read the current `## North-star goals this month` from `workspace/tasks/YYYY/MM/goals.md` (if it exists) to give context. Then ask:

> *"Quick pulse on each life area this week — just one line each:*
> - **health**: …
> - **finance**: …
> - **career**: …
> - **relationships**: …
> - **learning**: …
> - **home**: …*"

Accept free-form one-line replies. These populate the `## Area pulse` section of `retro.md`. If the user says "skip" or leaves an area blank, write `_No update._` for that area.

## Step 6 — Ask for next-week focus

Call `AskUserQuestion`: **"What are your 1–3 focus points for next week?"** Accept free-form input.

Also ask: **"Any habit adjustments for next week?"** — habits the user wants to add, drop, or modify in any area's `HABITS.md`. If there are adjustments, note them in the retro's `## Habit adjustments` section (the actual HABITS.md edits are the user's manual action or a separate `/week` step — do not auto-edit HABITS.md from this skill).

## Step 7 — Write retro.md

Create `workspace/tasks/YYYY/MM-Wn/retro.md` with this structure:

```markdown
# Retro YYYY/MM-Wn

## Shipped

- <completed item> _(source.md)_
...

## Slipped

- <still-open item> _(source.md)_ — pushed to backlog / carries to next week
...

## Dropped

- ~~<item>~~ (dropped: <reason>) _(source.md)_
...

## Area pulse

- **health**: <one-line status>
- **finance**: <one-line status>
- **career**: <one-line status>
- **relationships**: <one-line status>
- **learning**: <one-line status>
- **home**: <one-line status>

## Habit adjustments

- <habit to add/drop/modify in area> _(area/HABITS.md)_
...

## Next week focus

1. <focus 1>
2. <focus 2>
3. <focus 3>
```

If any section is empty, write `_None._`.

## Step 8 — Show summary before committing

Print a concise list of every file that was edited or created, with a one-line description of what changed (including any backlog entries added). Ask the user: **"Commit and push these changes?"** Proceed only on confirmation.

## Step 9 — Commit and push

First append this run's operations to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent) — one bullet per file edited/created, per the CLAUDE.md ops audit log.

```bash
git add workspace/tasks/YYYY/MM-Wn/
git add workspace/tasks/backlog.md
git add .agents/ops/YYYY-MM-DD/
git commit -m "Close out week YYYY/MM-Wn"
git push
```

Use the actual folder name in the commit message. Include `workspace/tasks/backlog.md` whenever slipped items were pushed there.

## Constraints

- Only modify files inside the current week folder (plus `workspace/tasks/backlog.md` for slipped items). Never touch other week folders or `.claude/`.
- If the push fails, report the error and stop — do not force-push.
- Do not create any files other than `retro.md` (source file edits are in-place updates, not new files).
- **External systems are read-only.** Do not call Whoop or Brex MCP tools from this skill — area pulse comes from the user's own reflection, not from live data.
