---
name: youtube
description: Distill a YouTube video (paste its transcript/summary) into a reference archive under workspace/resources/expert-guide/youtube/<id>/SUMMARY.md, apply the learnings to relevant life area docs + this week's learnings file, and log ops. The archive folder name is the video ID (validated by check-expert-guide-summaries.ts).
---

This skill codifies the flow for ingesting a YouTube video into the brain knowledge base: archive the source verbatim, distill a playbook, figure out which life areas benefit, apply tailored learnings to those areas' docs, record a lightweight entry in the current week's learnings file, and log ops. It is interactive: it proposes, you confirm.

## Step 1 — Establish now

Run this with Bash before computing anything else:

```bash
TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
```

Treat the output as the authoritative "now" — date, 24-hour time, and weekday — in the owner's timezone (Asia/Kolkata). The injected `currentDate` is a fallback only; if the two disagree (e.g. near midnight), prefer the shell output. All filenames, folder names, and date stamps in this skill use the Asia/Kolkata date.

## Step 2 — Capture the input

The user invokes `/youtube <youtube-url>` and pastes the video's transcript and/or summary directly into the prompt.

1. Record the YouTube URL exactly as provided.
2. Extract the **video ID** from the URL (the `v=<id>` parameter, or the last path segment for youtu.be short URLs). This is the archive folder name — `check-expert-guide-summaries.ts` validates that the `videoId` frontmatter field matches the directory name.
3. If **no transcript or summary was pasted**, stop and ask the user: *"Please paste the video transcript or a summary so I can distill it accurately. I cannot auto-fetch transcripts in this environment and will not fabricate content from the URL alone."* Wait for the pasted content before proceeding.
4. From the URL + pasted content, derive a **short kebab slug** for the video (e.g. `huberman-sleep-protocol`, `clear-habits-identity`). The slug is used only in the learnings file and ops log for human readability — the folder name is the raw video ID.
5. Confirm to the user: *"Archiving as `workspace/resources/expert-guide/youtube/<videoId>/`. Proceeding to distill."*

## Step 3 — Archive the source verbatim

Create files under `workspace/resources/expert-guide/youtube/<videoId>/` (the video ID from Step 2 — NOT a date-slug; `check-expert-guide-summaries.ts` requires the folder name to equal the `videoId` frontmatter field). These files are the permanent canonical record.

### `SUMMARY.md`

This is the primary file validated by `check-expert-guide-summaries.ts`. It MUST open with YAML frontmatter containing **all four** required fields:

```markdown
---
title: <Full Video Title>
date: <YYYY-MM-DD>
tags: [<topic1>, <topic2>, ...]
videoId: <videoId>
---
```

Where:
- `title` — the full video title
- `date` — today's Asia/Kolkata date (YYYY-MM-DD)
- `tags` — 2–5 relevant topic tags (e.g. `[health, sleep, habits]`)
- `videoId` — the raw video ID extracted from the URL (must match the folder name exactly)

After the frontmatter, write the full distilled playbook. Structure it into numbered sections with H2 headers. Capture **every substantive tactic, concrete number, named framework, and specific rate or threshold** from the source — do not lose specifics to save space. If the user provides both a transcript and a pre-existing summary, synthesize them (the transcript is authoritative; the pre-existing summary can fill gaps). This is the file future agents read when they want the full content.

### `transcript.md`

Open with a header block:

```markdown
# Transcript — <Full Video Title>

**Source:** <URL>
**Captured:** <YYYY-MM-DD>

---
```

Then paste the raw transcript verbatim, unedited. If the user provided only a summary and not a raw transcript, write instead:

```markdown
_(No raw transcript was available — only a summary was provided. See `SUMMARY.md` for the distilled playbook.)_
```

### `README.md`

The index file for the archive folder:

```markdown
# <Full Video Title>

**Source:** <one-line description — e.g. "YouTube talk by Andrew Huberman on sleep protocols">
**Video URL:** <exact URL from user>
**Video ID:** <videoId>
**Captured:** <YYYY-MM-DD>

---

## What this is

<One paragraph: who is speaking, what they cover, and the most important concrete numbers/claims from the video. Specific enough that a future reader can decide in 30 seconds whether to read the full summary.>

## Why we saved it

<One paragraph: why this video is tactically relevant to the owner's life areas — which frameworks, metrics, or techniques it provides, and which life areas it speaks to.>

---

## Where these learnings were applied

| Area | Applied in | Notes |
|---|---|---|
| **<area>** | `workspace/areas/<area>/resources/<topic>/<file>.md` | <one-line note on what was applied> |
| **<area>** | Not yet applied | <reason, e.g. partial fit — revisit when X> |

_(Filled after Step 5.)_

---

## Files in this folder

- [`SUMMARY.md`](./SUMMARY.md) — Full distilled playbook with every substantive tactic and concrete detail.
- [`transcript.md`](./transcript.md) — Raw transcript preserved verbatim (or note if only a summary was provided).
```

## Step 4 — Distill + scope life areas

1. From `SUMMARY.md`, extract the **core playbook** in 3–5 sentences: what technique/framework/insight does this video teach, and in what context does it apply best?

2. Assess all 6 life areas against the playbook. For each area, consider:
   - Does the video's core topic (e.g. sleep optimization, habit formation, financial planning, skill acquisition) map to this area's north-star metric and goals?
   - Would applying the tactics change the area's `HABITS.md`, `ROADMAP.md`, `METRICS.md`, or `PRINCIPLES.md` in a non-trivial way?
   - Is the audience / context match close enough that the examples translate?

3. Produce a **ranked shortlist** in three tiers:

   **Tier 1 — Full fit** (apply now; read that area's 6 docs and fold learnings in):
   - **<area>** — <one-sentence rationale>

   **Tier 2 — Partial fit** (park a reference playbook under `resources/`; skip doc edits for now):
   - **<area>** — <one-sentence rationale>

   **Not applicable** (skip entirely):
   - <area>, <area> — <shared reason>

4. Present the shortlist to the user and ask: **"I plan to apply learnings to Tier 1 areas and park a reference for Tier 2 areas. Does this scope look right, or should I add/remove any areas before I start editing?"** Wait for the response before writing any area files.

> Spawn read-only scout subagents (model: haiku) to skim an area's 6 docs when you need to check fit quickly. One scout per area, run in parallel.

## Step 5 — Apply tailored learnings to confirmed areas

For each area the user confirmed in Step 4, do the following. Delegate per-area reads to parallel haiku subagents; use the calling model (Sonnet) for the actual write/edit decisions that require adapting tactics to area context.

### Per-area flow

1. **Read that area's 6 docs first.** Read at minimum `HABITS.md`, `ROADMAP.md`, `METRICS.md`, and `GOALS.md` before touching anything. Understand the area's current state and what's already planned.

2. **Fold the relevant tactics into the natural docs**, matching each doc's existing section structure and voice. Adapt every tactic to the area's real context — never paste the video's examples as-is. Guidelines by doc:
   - **`HABITS.md`** — add new habits or refine existing ones based on techniques the video teaches. Note the source inline (e.g. `<!-- Source: workspace/resources/expert-guide/youtube/<videoId>/ -->`). Use exact checklist syntax (`- [ ] item`).
   - **`ROADMAP.md`** — add feature or initiative ideas as `[proposed]` items under the `[proposed]` section, clearly marked *pending owner sign-off*. Never add to the confirmed roadmap.
   - **`METRICS.md`** — add new metrics, thresholds, or decision rules if the video surfaces a measurement the area doesn't currently track.
   - **`PRINCIPLES.md`** — update only if the video surfaces a stronger principle or a sharper anti- rule.
   - **`GOALS.md`** — update only if the video surfaces a better north-star framing or a specific goal worth adding.

3. **Create a parked reference playbook** under `workspace/areas/<area>/resources/<topic>/<slug>-playbook.md` with this header block:

   ```markdown
   # <Topic> Playbook — <Area>

   **Sourced from:** [<Full Video Title>](<URL>) — <YYYY-MM-DD>
   **Archive:** `workspace/resources/expert-guide/youtube/<videoId>/`
   **Applied to docs:** <list the docs edited above, or "reference only — not yet applied to docs">

   ---
   ```

   Then write the area-specific adaptation of the playbook: how each tactic maps to this area's real context, what to do first, and what metrics to track. This is the executable version — the archive `SUMMARY.md` is the raw source, the area playbook is the translated action plan.

4. **For Tier 2 (partial fit) areas:** skip the doc edits; create only the resources playbook with a note at the top: *"Partial fit — reference only. Edit HABITS.md when [condition that would make it a full fit] is true."*

5. **Update the archive `README.md`** (the `## Where these learnings were applied` table) to record what was applied and where.

> Pre-commit guard reminder: inside `workspace/areas/<area>/`, ONLY the 6 root docs and `resources/` (any depth) are permitted. Any new area file MUST live under `workspace/areas/<area>/resources/`. The guard will block a commit if you write a file at the area root that isn't one of the 6 docs.

## Step 6 — Record in this week's learnings file

1. **Determine the current week folder** `workspace/tasks/YYYY/MM-Wn/` — list folders under `workspace/tasks/YYYY/`, take the latest `MM-Wn` by sort order (skip bare `MM` monthly folders and `MM-DD` daily folders when scanning for the current week).

2. **If the week folder does not exist yet**, create it now — but create **only** `learnings.md` inside it. Do NOT scaffold `priorities.md` or any other file — that is `/week`'s job.

3. **Create or append** `workspace/tasks/YYYY/MM-Wn/learnings.md` using EXACTLY this format. If the file already exists, append a new `## <date> — <title>` block (do not overwrite the file — one `##` block per source, ever):

```markdown
# Learnings — YYYY/MM-Wn

## <YYYY-MM-DD> — <Full Video Title> (YouTube)

**Source archive:** `workspace/resources/expert-guide/youtube/<videoId>/` (README, SUMMARY, transcript)
**Applied to:** <**area** → `workspace/areas/<area>/HABITS.md`, `ROADMAP.md`; **area2** → `workspace/areas/<area2>/resources/<topic>/<slug>-playbook.md` (reference only); or "reference only — not yet applied">

Key takeaways (full detail in the archive — do not duplicate here):
- <2–5 terse bullets: the most transferable insights, stated in personal-life context>

### Proposed actions
- [ ] <specific action item to weigh at the next /week planning — e.g. "Add Huberman sleep protocol to health HABITS.md">
- [ ] <another action — e.g. "Owner to review and sign off on new finance habit proposal">
```

This file is intentionally lightweight and reference-based. Its job is to surface proposed actions at `/week` (next-week planning) and `/month` (monthly goals) without forcing a re-read of the full archive. The full distilled content lives in the archive `SUMMARY.md`; `/week` pulls proposed-action items from `learnings.md` into the weekly priorities without duplicating the playbook.

## Step 7 — Log ops + memory

### Ops log

Append a bullet to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's Asia/Kolkata date; create the dated folder if absent). One bullet per significant operation:

```markdown
- `/youtube` — archived `<Full Video Title>` (videoId: <videoId>) to `workspace/resources/expert-guide/youtube/<videoId>/` (README, SUMMARY, transcript); applied learnings to <area list> (docs edited: <list>; playbooks created: <list>); recorded in `workspace/tasks/YYYY/MM-Wn/learnings.md`; commit <hash>.
```

### Memory file (optional but recommended)

If the video surfaces a non-obvious technique, framework, or number that will help future sessions make better decisions, write a `reference`-type memory file at `.agents/memory/<YYYY-MM>/<slug>.md`:

```markdown
---
title: <one-line summary of the key learning>
date: <YYYY-MM-DD>
type: reference
tags: [<topic>, youtube, <area-if-area-specific>]
---

<The learning in prose: what it is, why it matters, and how to apply it next time. Point at the archive folder for full detail rather than duplicating the playbook here.>

**Archive:** `workspace/resources/expert-guide/youtube/<videoId>/`
```

Only write this if it would genuinely help a future session — skip if the archive README already captures the key insight clearly.

## Step 8 — Commit & push

Stage the archive files, the edited area docs, the new area resources playbooks, the week `learnings.md`, the ops log, and any memory file. Commit with a short imperative message:

```bash
git add workspace/resources/expert-guide/youtube/<videoId>/
git add workspace/areas/           # area doc edits + new resources playbooks
git add workspace/tasks/YYYY/MM-Wn/learnings.md
git add .agents/ops/YYYY-MM-DD/
git add .agents/memory/YYYY-MM/      # if a memory file was written
git commit -m "Add <slug> learnings to <area list> + archive"
git push
```

Use the actual slug and area names in the commit message (e.g. `Add huberman-sleep-protocol learnings to health + archive`). If the push fails, report the error and stop — do not force-push.

## Constraints

- **Do not fabricate the video's content.** If the user did not paste a transcript or summary, ask for it and wait. Never infer or invent what the video says from the URL alone.
- **The archive folder name MUST be the raw video ID** (e.g. `dQw4w9WgXcQ`), not a date-slug. The `videoId` frontmatter field in `SUMMARY.md` must match the folder name exactly (enforced by `check-expert-guide-summaries.ts`).
- **External systems are read-only.** This skill writes only markdown recommendations to the repo. No API calls to Whoop, Brex, or any external service.
- **Never modify previous weeks' folders.** Only the current week's `learnings.md` is writable.
- **New area files must live under `resources/`.** Any file inside `workspace/areas/<area>/` that is not one of the 6 root docs must be placed under `workspace/areas/<area>/resources/`. The pre-commit guard will block the commit otherwise.
- **Adapt, never paste.** Every tactic applied to an area doc must be rewritten in the area's context. The video's examples should never appear verbatim as the subject of an area doc edit.
- **Commit once at the end** (Step 8), not after each intermediate file. Stage everything together so the commit is coherent.
