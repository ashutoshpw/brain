---
name: month
description: Scaffold the current month's goals folder, carry over unfinished goals from last month, set the month's north-star goals across the 6 life areas, and roll up this month's weekly learnings so they feed planning.
---

## Step 1 — Establish now

Run this with Bash before computing anything else:

```bash
TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
```

Treat its output as the authoritative "now" — date, 24-hour time, and weekday — in the owner's timezone (Asia/Kolkata). The injected `currentDate` is a fallback only; if the two disagree (e.g. near midnight or across a timezone boundary), prefer the Asia/Kolkata shell output.

From the date, extract `YYYY` and `MM` (zero-padded two-digit month). The **current month folder** is `workspace/tasks/YYYY/MM/` — a bare two-digit month, e.g. `workspace/tasks/2026/06/`.

> **Important:** This bare `MM` folder is the MONTHLY folder. It is distinct from the weekly `MM-Wn` and daily `MM-DD` folders that live under the same `YYYY/` year directory. Skills and scripts that scan for week or day folders must skip bare `MM` folders.

## Step 2 — Detect existing vs new month

1. Check whether `workspace/tasks/YYYY/MM/goals.md` already exists.
   - **If it exists** → you are in **update mode**: refresh the `## Carried over from last month` and `## Learnings to apply this month` sections; preserve the `## North-star goals this month` the user already set; ask the user about any new carry-over or learnings items you find. Then jump to Step 6 to rewrite the file.
   - **If it does not exist** → proceed to scaffold it fresh.

2. List all entries under `workspace/tasks/YYYY/` to find the **previous month's `goals.md`**. The previous month is the latest bare `MM` folder (two digits, no dash suffix) that sorts before the current `MM`. Ignore `MM-Wn` and `MM-DD` folders — those are week and day folders, not monthly ones.

   For example: if today is `2026-06`, look for `workspace/tasks/2026/05/goals.md`, then `2026/04/goals.md`, etc. (first one found wins).

## Step 3 — Carry over unfinished goals

1. If a previous month's `goals.md` was found, scan it for every open `- [ ]` line in any section.
2. Present the full list to the user and ask: **"These goals were open at the end of last month — which should I carry into this month, and which should I drop?"** Wait for the response before writing anything.
3. Copy only the confirmed items into the new `goals.md` under `## Carried over from last month`, each annotated: `(from workspace/tasks/YYYY/MM/goals.md)`. **Never modify the previous month's folder** — carryover is copy-only.
4. If no previous month folder exists (first ever run), write `_None._` under `## Carried over from last month` and skip the confirmation dialog.

## Step 4 — Roll up this month's weekly learnings

Collect references to learning material produced this month. **Do not copy or duplicate content** — only link to the source files.

1. **Week learnings files:** list all `workspace/tasks/YYYY/MM-Wn/learnings.md` files where `MM` matches the current month (e.g. `workspace/tasks/2026/06-W1/learnings.md`, `06-W2/learnings.md`, etc.). For each that exists, note the `### Proposed actions` items and the file path.

2. **Expert-guide archives:** scan `workspace/resources/expert-guide/` for any sub-folders (or files within `youtube/` or other sub-directories) that were created or modified this month.

3. **Area HABITS.md check:** for each of the 6 life areas (`health`, `finance`, `career`, `relationships`, `learning`, `home`), note whether any `workspace/areas/<area>/HABITS.md` was updated this month — these are living documents and their recent edits signal habit-system improvements worth rolling up.

4. Compile a list of references — one line per source — formatted as:
   `- <**area or topic** → link to file or folder>`

   These populate the `## Learnings to apply this month` section as navigation pointers so the user can drill in without duplicating the content here.

5. If no learnings files or archives exist yet, write `_None._` under that section.

## Step 5 — Ask for north-star goals

Ask the user: **"What are your top 3 goals for this month?"**

To give context, surface the north-star metric for each of the 6 life areas by reading `workspace/areas/<area>/GOALS.md` for each area. Present them briefly as read-only context:

> *Current area north-stars:*
> - **health**: …
> - **finance**: …
> - **career**: …
> - **relationships**: …
> - **learning**: …
> - **home**: …

Accept free-form input for the goals; format the answers as a numbered list. Optionally present any `### Proposed actions` items collected in Step 4 and invite the user to promote them directly into a goal.

If in **update mode** (goals.md already exists), show the user the currently saved north-star goals and ask: **"Do you want to keep these goals as-is, or update them?"** Accept free-form edits.

## Step 6 — Write goals.md

Create (or overwrite in update mode) `workspace/tasks/YYYY/MM/goals.md` using **exactly** this template:

```markdown
# Goals — YYYY/MM (<Month Name YYYY>)

## North-star goals this month

1. <goal 1>
2. <goal 2>
3. <goal 3>

## Carried over from last month

- [ ] <item> (from workspace/tasks/YYYY/MM/goals.md)

## Learnings to apply this month

- <**area or topic** → `workspace/tasks/YYYY/MM-Wn/learnings.md` / `workspace/resources/expert-guide/.../`>

## Notes

```

- Replace `<Month Name YYYY>` with the full month name and year, e.g. `June 2026`.
- Empty sections use `_None._`.
- Omit no sections — all four headers must always be present.

## Step 7 — Commit and push

First append this run's operations to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent) — one bullet per file created or edited, per the CLAUDE.md ops audit log. Then stage and commit everything that changed:

```bash
git add workspace/tasks/YYYY/MM/
git add .agents/ops/YYYY-MM-DD/
git commit -m "Scaffold YYYY/MM monthly goals"
git push
```

Use the actual year and month in the commit message. On an update run, use `Update YYYY/MM monthly goals`.

## Constraints

- **Never modify any file in a previous month's folder.** Carryover from Step 3 is copy-only.
- Only `workspace/tasks/YYYY/MM/goals.md` is written or overwritten by this skill. No other files are created (unless the user explicitly requests it).
- **External systems are read-only.** Do not call Whoop or Brex MCP tools from this skill — the area `METRICS.md` and `HABITS.md` files are the source of truth; read those markdown files instead.
- The monthly folder is `workspace/tasks/YYYY/MM/` (bare two-digit month). Keep it distinct from the weekly `MM-Wn` and daily `MM-DD` folders — any tool listing `workspace/tasks/YYYY/` to find the current week or day folder must skip bare `MM` entries.
- If the push fails, report the error and stop — do not force-push.
