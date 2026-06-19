---
name: log-call
description: Log a call/conversation with someone in the people registry (date, topics, learnings, follow-ups — all frontmatter) at workspace/people/<slug>/calls/YYYY/MM-DD/notes.md; also review recent calls when asked for the "last convo". Usage: /log-call <person>
---

Two modes: **Mode A — log a call** (default) and **Mode B — review recent calls** (triggered by "review last convo with …", "what did we last talk about", "recent calls with …"). This skill always works on the **current branch** — never auto-branches. Dates and times are always reckoned in **Asia/Kolkata**.

---

## Step 0 — Establish current date

Run this before any other step:

```bash
TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
```

Treat the output as the authoritative **now** — date, time, and weekday in the owner's timezone. Use it for today's date (`YYYY-MM-DD`), and to derive `YYYY` and `MM-DD` for the call note path. The injected `currentDate` is a fallback only; if the two disagree (e.g. near midnight or across a timezone boundary), prefer the shell output.

---

## Mode A — Log a call

### Step 1 — Resolve the person slug

1. Accept a person name or slug from the invocation argument. Kebab-case it: lowercase, spaces and punctuation → hyphens, e.g. `"Jane Smith"` → `jane-smith`.
2. Check that `workspace/people/<slug>/profile.md` exists.
   - **If it exists**: proceed.
   - **If it does not exist**: tell the user — *"No profile found for `<slug>`. Run `/add-person` first, or I can create a minimal friend profile now — which do you prefer?"* Wait for their answer before continuing.

### Step 2 — Gather call details (interactive)

Ask the user for the following. Accept whatever was supplied in the invocation; **ask once** for anything missing — never proceed without `learnings`.

| Field | Required | Notes |
|---|---|---|
| `learnings` | **Yes** | At least one takeaway. This is required by the validator — never skip. |
| `topics` | No | Key subjects discussed (list). |
| `follow_ups` | No | Actions or things to surface next time (list). |
| `channel` | No | `call` · `video` · `in-person` · `text` |
| `duration_min` | No | Integer number of minutes. |
| `mood` | No | Free-text vibe / energy level of the conversation. |
| Full notes prose | No | Freeform narrative to go in the file body below the frontmatter. |

### Step 3 — Compute the call note path

From the confirmed Asia/Kolkata date (`YYYY-MM-DD`):

- `YYYY` = the 4-digit year part
- `MM-DD` = the month-day part (e.g. `06-19`)
- Target file: `workspace/people/<slug>/calls/YYYY/MM-DD/notes.md`

**Same-day continuation:** if `notes.md` already exists for today's date, **merge/append** rather than overwrite — add new learnings to the `learnings` list, append follow-ups, and append new prose to the body with a `---` separator and a timestamp header. Do NOT clobber an existing file.

### Step 4 — Write the call note

Create `workspace/people/<slug>/calls/YYYY/MM-DD/notes.md` (creating any intermediate directories). Use **exactly** this frontmatter shape:

```yaml
---
type: call-note
person: <slug>
date: YYYY-MM-DD
channel: <channel>            # omit if not provided
duration_min: <int>           # omit if not provided
topics:                       # omit if not provided
  - <topic>
learnings:                    # REQUIRED — non-empty list
  - <learning>
follow_ups:                   # omit if not provided
  - <follow-up>
mood: <vibe>                  # omit if not provided
updated: YYYY-MM-DD           # set to today
---

<prose: full notes from the call>
```

Validation rules (enforced by `scripts/check-people-data.ts`):
- `type` must equal `"call-note"` exactly.
- `person` must equal the folder slug exactly (not the display name).
- `date` must be `YYYY-MM-DD` and must match the `YYYY/MM-DD` path folder.
- `learnings` must be a non-empty list of non-empty strings.
- `duration_min`, if present, must be a number (not a string).
- `topics` and `follow_ups`, if present, must be lists.
- `updated`, if present, must be `YYYY-MM-DD`.

Omit any optional field entirely rather than writing `null` or an empty list — the validator only checks fields that are present.

### Step 5 (optional nicety) — Bump the person profile

If the person's `workspace/people/<slug>/profile.md` has an `updated` field, offer to bump it to today's date. If the profile has a `cadence_days` field, compute and mention the next suggested touch date: today + `cadence_days` days (Asia/Kolkata calendar).

Present the suggestion and wait for confirmation before editing the profile.

### Step 6 — Validate, commit, push

1. Run the validator directly before staging:

   ```bash
   bun scripts/check-people-data.ts
   bun scripts/check-staged-md.ts
   ```

   Fix anything reported. Re-run until both exit 0.

2. Stage the new call note (and the profile if updated in Step 5):

   ```bash
   git add workspace/people/<slug>/calls/YYYY/MM-DD/notes.md
   # If profile was bumped:
   git add workspace/people/<slug>/profile.md
   ```

3. Commit and push on the **current branch**:

   ```bash
   git commit -m "Log call with <name> (YYYY-MM-DD)"
   git push
   ```

   Never `--no-verify`. Never force-push. If the push fails, report and stop.

### Step 7 — Ops log

Append a bullet to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent):

```markdown
- `/log-call` — wrote `workspace/people/<slug>/calls/YYYY/MM-DD/notes.md`; [bumped profile updated date;] commit <hash>.
```

Commit the ops log alongside the work (include it in the same `git add` / `git commit` as Step 6, or as a follow-up commit if the call note commit was already pushed).

---

## Mode B — Review recent calls

Triggered when the user says "review last convo with \<person\>", "what did we last talk about \<person\>", "recent calls with \<person\>", or similar phrasing. This is a **read/summarize action** — only write if the user then explicitly asks to log a new call.

### Step B-1 — Resolve slug (same as Step 1 above)

### Step B-2 — List and sort call notes

List all files matching `workspace/people/<slug>/calls/**/notes.md`. Sort by the `YYYY/MM-DD` folder path (most recent first, treating `YYYY` as the primary sort key and `MM-DD` as secondary).

If no call notes exist, tell the user: *"No call notes found for `<slug>`. Use `/log-call <person>` to log one."*

### Step B-3 — Read and summarize

Read the most recent one (or the last N if the user asks for multiple). For each, present:

- **Date** (from path / frontmatter)
- **Topics** (from `topics` frontmatter)
- **Key learnings** (from `learnings` frontmatter)
- **Open follow-ups** (from `follow_ups` frontmatter — items not yet struck through or resolved)
- One-line **mood/channel** note if present

### Step B-4 — Offer to carry over follow-ups

If the most recent call has unresolved `follow_ups`, ask: *"These follow-ups are still open from your last call — want me to include them in a new call note now?"* Proceed to Mode A only if the user says yes.

---

## Constraints

- Work on the **current branch**; **never auto-branch**.
- **Never `--no-verify`** — fix the validator error, do not bypass the hook.
- **`learnings` is required** — never write a call note with an empty or missing `learnings` list.
- **`date` must match the path folder** — `date: 2026-06-19` must live at `calls/2026/06-19/notes.md`.
- **`person` must equal the folder slug** — not a display name, not a partial slug.
- **Never modify a prior day's call note** when logging a new call. Each dated conversation is its own immutable file. Same-day continuation = merge into today's file only.
- **Date stamps via `TZ='Asia/Kolkata' date`** — never compute dates from the injected `currentDate` alone near midnight.
- **External systems (Whoop, Brex) are read-only** — not relevant to this skill but noted for consistency.
- **Only write during Mode A** — Mode B is read/summarize only; do not create or edit files unless the user explicitly transitions to logging a new call.
- All structured data (date, topics, learnings, follow-ups) belongs in frontmatter, not embedded in prose. Prose body is for narrative context only.
