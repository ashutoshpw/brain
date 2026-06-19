---
name: day
description: Daily morning sweep — check off what you finished, surface today's focus from the week's priorities and area HABITS.md, add follow-ups, and report weekly progress; write focus-YYYY-MM-DD.md to the daily folder and commit.
---

This is the daily layer between Monday's `/week` and Friday's `/review`. Run it each morning. It is interactive: it proposes, you confirm.

## Step 1 — Determine today's date and folders

1. **Establish the current Asia/Kolkata time first.** Run this with Bash before computing anything else:

   ```bash
   TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
   ```

   Treat its output as the authoritative "now" — date, 24-hour time, and weekday — in the owner's timezone (Asia/Kolkata). Use it for today's date, the weekday, the day-of-week position, and time-of-day context. The injected `currentDate` is a fallback only; if the two disagree (e.g. near midnight or across a timezone boundary), prefer the Asia/Kolkata shell output.

2. Today's date (confirmed from the shell output above, with `currentDate` as fallback) gives the date string (e.g. `2026-06-10`) and the weekday.
3. Compute the **current week folder** `workspace/tasks/YYYY/MM-Wn/` the same way `/week` does: list folders under `workspace/tasks/YYYY/`, infer the naming convention, and take the latest `MM-Wn` by sort order. **Skip bare `MM` monthly folders** (two digits, no dash suffix) — only `MM-Wn` entries qualify as week folders. `Wn` = nth occurrence of that week within the month (7-day bands from the 1st: days 1–7 = W1, 8–14 = W2, etc.). If ambiguous at a month boundary, propose the name and **ask the user to confirm**.
4. Compute today's **daily folder** `workspace/tasks/YYYY/MM-DD/` (e.g. `workspace/tasks/2026/06-10/`). This is where today's focus file goes — NOT the week folder. When listing `workspace/tasks/YYYY/` to find today's folder, bare `MM` monthly folders are skipped (only `MM-DD` entries are considered).

## Step 2 — Load the week's plan

1. Read `workspace/tasks/YYYY/MM-Wn/priorities.md`.
   - If it exists, extract the `## Top 3 this week` list and every open `- [ ]` item under `## Carried over`, `## Scheduled this week`, and `## Habits this week` (and anywhere else in the file).
   - **If it does not exist**, tell the user: *"No `priorities.md` for this week yet — run `/week` to set top-3 priorities. I'll build today's focus from open items in the week folder for now."* Then proceed.
2. Scan every other `.md` file in the week folder for open `- [ ]` items. Collect each with its source file annotation `(from <filename>.md)`.
3. Each daily folder holds at most one `focus-YYYY-MM-DD.md`. Find the daily folders `MM-DD/` of the current week that contain a `focus-*.md`, take the **most recent prior one by folder date** (excluding today's), read its `focus-*.md`, and collect its unfinished `- [ ]` follow-ups so they roll forward into today.

## Step 2.5 — Surface area habits as context

For each of the 6 life areas (`health`, `finance`, `career`, `relationships`, `learning`, `home`), read `workspace/areas/<area>/HABITS.md` and collect open `- [ ]` habit items. Present them as a **read-only habits reminder** before the completion sweep:

> *"Your recurring habits across life areas:*
> - **health**: …
> - **finance**: …
> - **career**: …
> - **relationships**: …
> - **learning**: …
> - **home**: …*
>
> *I'll include a habits check-in block in today's focus.md."*

Do not auto-add habits to the focus — surface them for awareness. The user may request specific habits be added to `## Habits check-in` in Step 7.

## Step 2.6 — Scan `workspace/scheduled/` for today's items

Before presenting the completion sweep, check whether anything scheduled has come due.

1. **Day-targeted lines — today.** Read `workspace/scheduled/scheduled.md` (skip silently if the file does not exist). Pull every open `- [ ]` line whose tag matches today's date exactly: `(YYYY-MM-DD)`. Present the list to the user: *"The following items are scheduled for today — I'll graduate them into focus.md and remove them from scheduled.md. OK to proceed?"* Wait for confirmation before writing anything.

2. **Day-targeted lines — overdue.** Also pull every open `- [ ]` line tagged with a date **before today**. Present them as overdue: *"These scheduled items are overdue (their target date has already passed)."* Confirm with the user the same way, then graduate them alongside today's items.

3. **Prepared artifacts — today.** If `workspace/scheduled/YYYY/MM-DD/` exists for today's date, list its files to the user: *"There are prepared artifacts in workspace/scheduled/YYYY/MM-DD/ — I'll move them into today's task folder. OK?"* On confirmation, move them using `git mv` (or a plain `mv` if untracked) into `workspace/tasks/YYYY/MM-DD/`. Remove the now-empty `workspace/scheduled/YYYY/MM-DD/` directory.

4. **Prepared artifacts — overdue.** Check for any `workspace/scheduled/YYYY/MM-DD/` folders whose date is before today and that still contain files. Surface them the same way with an overdue label, confirm, and move them into today's task folder.

5. **Week-targeted lines** tagged `(YYYY-MM-Wn)` in `scheduled.md` are **not** graduated by `/day` — they belong to `/week`. Leave them untouched.

6. After confirmation, apply all graduating changes:
   - Remove each graduated line from `scheduled.md` (delete the line entirely — it has moved to `focus-YYYY-MM-DD.md`).
   - Carry the graduated items forward into Step 7 (`## Scheduled today` for on-time items, `## Overdue (from scheduled)` for late items).

## Step 3 — "What did you finish?" (interactive, marks done in place)

Before measuring progress, let the user close out what they've completed since the last run.

1. Present the full pool of open `- [ ]` items collected in Step 2 (week-folder items + rolled-over follow-ups), each labelled with its source file.
2. Call `AskUserQuestion`, batching items from the same source file into one question. Offer three choices per item:
   - **Done** — completed
   - **Still open** — leave as-is
   - **Drop** — out of scope (capture a short reason)
3. **Never silently mark anything done** — only act on the user's explicit answers. If the user has nothing to close out, skip the edits and move on.
4. Apply answers by editing the **source `.md` file in place** (same rules as `/review`):
   - **Done** → change `- [ ]` to `- [x]`
   - **Still open** → leave unchanged
   - **Drop** → change `- [ ]` to `- [x] ~~<item text>~~ (dropped: <reason>)`

   Edit in place only — never move or delete lines. For a rolled-over follow-up, the source file is the prior daily folder's `focus-*.md` it came from; mark it done there too so it stops rolling forward. **Only ever edit files in the current week's folders (the `MM-Wn` week folder and this week's `MM-DD` daily folders) — never a previous week's or previous day-outside-this-week's folder.**

## Step 4 — Compute weekly progress

After applying Step 3's completions, scan every `.md` file in the current week folder and count checklist lines:

- **Done** = `- [x]` lines that are NOT dropped.
- **Dropped** = `- [x] ~~...~~ (dropped: ...)` lines.
- **Open** = `- [ ]` lines.

Compute `done / (done + open)` as a percentage (exclude dropped from the denominator). Because Step 3 just ran, this number is live — it already reflects what you finished today. Also compute **days elapsed** = weekday position with Monday = 1 (e.g. Wednesday = 3). This gives a pace read: % complete vs days into the week.

## Step 5 — Propose today's focus (interactive)

1. Present a concise digest: the week's top-3, the pool of items **still open** after Step 3, and the weekly-progress line.
2. Call `AskUserQuestion` (or ask directly) to let the user pick / confirm **today's focus** — typically 1–3 items drawn from the top-3 and still-open pool, plus anything new they name. Accept free-form edits. Do not invent focus items the user didn't choose or confirm.
3. **Always surface the habits check-in.** Regardless of what build/priority work is chosen, ask the user: *"Which habits do you want to check in on today?"* Present the habit items collected from area `HABITS.md` files (Step 2.5) as candidates. The user may choose some, all, or none — the `## Habits check-in` block will only contain what they confirm.
4. **Link relevant resources.** For each chosen focus item, identify the source file(s) it draws on — the week-folder plan/checklist, the prior daily folder's focus file, or an area's doc — and capture their paths so Step 7 can link them. Use a **relative path from today's daily folder** (e.g. `../06-W2/priorities.md`, `../06-09/focus-2026-06-09.md`, `../../areas/career/GOALS.md`). A focus item with no concrete backing file gets no link. This keeps `focus-YYYY-MM-DD.md` connected to the work instead of describing it in prose only.

## Step 6 — Ask for follow-ups

Ask the user: **"Any follow-ups to add for today?"** Accept free-form input; format each as an open `- [ ]` item. Follow-ups are new actionable items surfaced today (not the same as the chosen focus). If none, write `_None._` under that section.

## Step 7 — Write focus-YYYY-MM-DD.md

Create (or, if it already exists from an earlier run today, update) `workspace/tasks/YYYY/MM-DD/focus-YYYY-MM-DD.md` with this exact structure:

```markdown
# Focus — YYYY-MM-DD (Ddd)

## Scheduled today

- [ ] <item graduated from scheduled.md for today's date>
...

## Overdue (from scheduled)

- [ ] <item graduated from scheduled.md whose target date was before today> _(was: YYYY-MM-DD)_
...

## Today's focus

1. <focus 1>. Resources: [<label>](<relative-path>), [<label>](<relative-path>)
2. <focus 2>. Resources: [<label>](<relative-path>)
3. <focus 3 — no backing file, so no Resources suffix>

## Habits check-in

- [ ] <habit confirmed by user from area HABITS.md>
...

## Closed out today

- <item marked done in Step 3> _(source.md)_
- ~~<item dropped in Step 3>~~ (dropped: <reason>) _(source.md)_
...

## Follow-ups

- [ ] <follow-up item>
...

## Rolled over

- [ ] <unfinished follow-up> (from <MM-DD>/focus-YYYY-MM-DD.md)
...

## Weekly progress

- <done>/<done+open> done (<pct>%) · day <n> of the week
- Top 3: <one-line status of each week priority — on track / open / done>
```

- `Ddd` is the three-letter weekday (e.g. `Wed`).
- The filename is `focus-YYYY-MM-DD.md` (date-stamped), not a bare `focus.md`.
- **`## Scheduled today`** lists items graduated from `scheduled.md` that were tagged with today's date (Step 2.6). Each is an open `- [ ]` actionable item; the user has already confirmed graduation. If none, write `_None._`.
- **`## Overdue (from scheduled)`** lists items graduated from `scheduled.md` whose target date was before today (Step 2.6). Annotate each with `_(was: YYYY-MM-DD)_` so the original due date is visible. If none, omit this section entirely (do not write `_None._` — absence means no overdue items).
- **`## Habits check-in`** lists only the habits the user confirmed in Step 5.3. Each is an open `- [ ]` item using the exact habit text from `HABITS.md`. If the user confirmed none, write `_None._`.
- **Resources links:** append `Resources: [label](relative-path), …` to each focus item that has a concrete backing file (Step 5.4). Paths are relative to today's daily folder. Omit the suffix for items with no backing file.
- `## Closed out today` is a log of what Step 3 marked done/dropped (so the daily file is a record of what happened). It is plain text, not a checklist — the live `- [ ]`/`- [x]` state lives in the source files.
- **Re-run same day = update mode:** overwrite the `## Closed out today`, `## Follow-ups`, `## Rolled over`, and `## Weekly progress` sections and re-confirm focus; preserve any follow-ups already checked off (`- [x]`) by editing in place, never deleting completed lines. The `## Habits check-in` section is also preserved (editing in place), so any habits the user checked off during the day are not reset.
- If a section is empty, write `_None._`.

## Step 8 — Show summary and commit

1. Print a summary: items closed out (done/dropped), today's focus, habits confirmed, follow-ups added, the weekly progress %, and — if Step 2.6 graduated anything — the list of scheduled items moved and any artifact files relocated. List every file edited, created, moved, or deleted.
2. Append this run's operations to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent) — one bullet per file edited/created/moved, per the CLAUDE.md ops audit log.
3. Stage the week folder (Step 3 may have edited source files there), today's daily folder, `workspace/scheduled/` (Step 2.6 may have modified `scheduled.md` and moved or removed files there), and the ops log, then commit and push:

```bash
git add workspace/tasks/YYYY/MM-Wn/ workspace/tasks/YYYY/MM-DD/ workspace/scheduled/ .agents/ops/YYYY-MM-DD/
git commit -m "Add daily focus YYYY-MM-DD"
git push
```

Use the actual folder names and date. On a same-day update, use `Update daily focus YYYY-MM-DD`.

## Constraints

- `/day` may edit checklist state (`- [ ]` → `- [x]` or dropped) **only in the current week's folders** — the `MM-Wn` week folder and this week's `MM-DD` daily folders. Never modify a previous week's folder or any folder outside the current week; surfacing open items from elsewhere is read-only.
- **Never silently mark anything done or dropped** — only apply the user's explicit Step 3 answers. Edit in place; never move or delete checklist lines.
- The only file `/day` *creates* is today's `focus-YYYY-MM-DD.md`. All other changes are in-place edits to existing checklist files — except for graduated lines deleted from `scheduled.md` and artifact files moved out of `workspace/scheduled/YYYY/MM-DD/`.
- `/day` only graduates day-targeted lines from `scheduled.md` (tagged `YYYY-MM-DD`). Week-targeted lines (tagged `YYYY-MM-Wn`) are left for `/week`.
- **External systems are read-only.** Do not call Whoop or Brex MCP tools from this skill — read area `METRICS.md` and `HABITS.md` markdown files instead.
- If `priorities.md` is missing, proceed but tell the user to run `/week`.
- If the push fails, report the error and stop — do not force-push.
