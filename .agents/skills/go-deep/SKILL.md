---
name: go-deep
description: Single-area personal commitment analysis using the "pick one area and go deep" framework — runs a depth audit, personal-life rubric scorecard, 30-day go-deep plan, and action playbook, then writes a dossier to that area's resources folder. Usage: /go-deep <area> (e.g. /go-deep career).
---

This skill takes ONE life area as its argument and produces a "go-deep dossier" grounded in the "pick one area and go deep" personal-life framework — adapted from the YC startup framework for personal-life use. The canonical framework source is archived at `workspace/resources/expert-guide/youtube/` (check for a "go-deep" or "pick one idea" slug). Read that archive's `summary.md` at the start of every run to refresh the framework before applying it (if no such archive exists, proceed from the framework as written in this skill).

## Usage

```
/go-deep <area>
```

Examples:
- `/go-deep career`
- `/go-deep health`
- `/go-deep finance`

Valid areas: `health`, `finance`, `career`, `relationships`, `learning`, `home`.

If the user omits the area, ask: *"Which life area do you want to go deep on? Provide the area slug (e.g. `career`)."* Wait for confirmation before proceeding.

---

## Step 1 — Establish authoritative now

Before anything else, run:

```bash
TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
```

Treat its output as the authoritative "now" — date, 24-hour time, and weekday — in the owner's timezone (Asia/Kolkata). Use this date for the `YYYY-MM-DD` stamp in the output filename and the ops log.

---

## Step 2 — Load the framework source + area docs

Run both in parallel:

**a) Framework source (calling model):** Check `workspace/resources/expert-guide/youtube/` for any "go-deep" or "pick-one-idea" slug archive. If found, read that archive's `summary.md`. This is the canonical framework reference — internalize its tests and rubric before writing any section of the dossier. If no archive is found, proceed using the framework as written in this skill.

**b) Area docs (delegate to haiku subagent):** Resolve the argument to `workspace/areas/<area>/` and read all 6 required docs:

- `OVERVIEW.md` — what this area covers, current-state snapshot, key signal/metric
- `GOALS.md` — north-star goal + active goals with target dates
- `METRICS.md` — tracked metrics table, targets, decision rules, blocked metrics
- `ROADMAP.md` — confirmed changes + `[proposed]` candidates
- `HABITS.md` — recurring systems/routines as checklists
- `PRINCIPLES.md` — values, decision rules, one-liner, anti-section

Spawn a `model: "haiku"` subagent with the instruction: *"Read all 6 docs under `workspace/areas/<area>/` (OVERVIEW, GOALS, METRICS, ROADMAP, HABITS, PRINCIPLES). Return a structured JSON-like summary of each doc's key facts: north-star goal, active goals with dates, north-star metric, tracked metrics with targets, confirmed roadmap items, open habits, top 3 principles, and known gaps or placeholders."* Feed the returned summary into the calling model for synthesis — do not re-read the 6 docs on the calling model.

> **Model routing note:** Doc reads and data retrieval run on haiku. All synthesis, scoring, and writing runs on the calling model (Sonnet by default). Strategic analysis sections run on default or opus.

---

## Step 3 — Produce the dossier

Write a dossier with the following four sections. Every claim must be grounded in what the area docs actually say — do not fabricate operational depth the docs do not demonstrate. Explicit flagging of gaps is the point.

### Section A — DEPTH AUDIT

Run the "Could I meaningfully improve this area of my life tomorrow?" test. Answer each question from evidence in the docs — flag explicitly if the answer is "not established in docs":

1. **What do we provably know?** — list the specific facts, behaviors, and life realities the docs demonstrate genuine understanding of (e.g. exact metrics tracked, real habits with completion data, stated north-star goal, known constraints).

2. **Where are the gaps?** — for each of the following, state whether we have surface-level awareness ("we wrote it down once") or true operational depth ("we track it, iterate on it, and have evidence of change"):
   - The single biggest blocker in this area right now
   - Habits and their actual completion rate (tracked or estimated)
   - Whether north-star metric has a current baseline reading
   - Whether there are any decision rules already encoded in the docs

3. **The mastery test:** Could we explain this area of our life with enough depth to teach someone else how to run it? State what the teaching outline would cover and which modules we could not yet teach because we lack the depth.

4. **Depth verdict:** One of — `OPERATIONAL` (tracking, iterating, and have evidence of improvement), `INTENTIONAL` (have written goals and systems but incomplete feedback loops), or `ASPIRATIONAL` (we wrote it down but have not built the systems yet). Justify the verdict in one sentence.

### Section B — PERSONAL-LIFE RUBRIC SCORECARD

Score the area against three filters. For each, give a 1–5 score (1 = fails filter, 5 = passes strongly) and a one-paragraph justification grounded in the docs.

**(i) Leverage**
Does improving this area create compounding returns across other life areas? (e.g. better sleep [health] → better focus [career] → better learning [learning]). Identify the specific leverage chain. Score based on how much ripple effect improvement here would create across the 6 areas. If the area is isolated, score 1 and say why.

**(ii) Clarity of north-star**
Is the north-star goal specific, measurable, and time-bound enough to make daily decisions against it? A north-star of "be healthier" scores 1; "maintain weekly recovery score ≥ 70 by end of Q3" scores 5. Score based on the actionability of what is currently written in `GOALS.md`.

**(iii) Most ambitious version**
What is the specific bigger swing in this area that would genuinely change the owner's life quality? This is not a stretch goal — it is the version of this area that represents a step-function improvement, not incremental. Be concrete: name the specific life quality change, the mechanism (habit stack, accountability system, structural change, skill acquisition), and the critical path. Score based on how clearly the docs + roadmap point toward this version vs. staying at the current level.

**Overall score:** average of the three scores, rounded to one decimal. One-line verdict: `STRONG` (≥ 4.0), `DEVELOPING` (3.0–3.9), `FRAGILE` (< 3.0) and the single change that would move it up one band.

### Section C — 30-DAY GO-DEEP PLAN

Concrete, weekly plan to close the single biggest depth gap identified in Section A. Structure as a tight build↔reflect loop — alternate between taking action and evaluating what the data tells you.

**North-star metric to move** (from `METRICS.md`): state the area's north-star metric and the current baseline if known.

**Biggest depth gap to close:** one sentence naming the specific gap from Section A that, if closed, would change decisions the most.

**Week-by-week plan:**

| Week | Primary mode | Concrete deliverable | Signal to look for |
|---|---|---|---|
| Week 1 | Measure | [Specific measurement target: what to track, how many data points, what tool/method] | [What reading would change the plan] |
| Week 2 | Act | [Specific habit or system change: what to do differently, how to structure it] | [What behavior or metric signal to check] |
| Week 3 | Reflect | [Review data and adjust: specific review question to answer] | [Confirmation or contradiction of Week 1 baseline] |
| Week 4 | Commit | [Lock in the system that showed the most signal + measure again] | [The metric movement that proves the depth gap is now closing] |

**Decision gate at day 30:** what measurable signal would confirm this area deserves a doubled-down commitment (dedicated time block, structural change, resource investment)? What signal would confirm the current approach is wrong and needs a different strategy?

### Section D — ACTION PLAYBOOK

Because the owner manages all 6 life areas simultaneously, this section defines what it would take to give this area the focused attention it deserves.

**The commitment test:** Would you dedicate a full-time focus sprint to this area this month? Answer `YES`, `NO`, or `CONDITIONAL (on X)`. Justify in two sentences. If `NO` or `CONDITIONAL`, this area is currently in maintenance mode — say so explicitly.

**What a focused month in this area looks like:**
- The three non-obvious things about this area that take consistent attention to get right (from Section A)
- The single most important change or action to prioritize first
- The one metric to check daily for the first 30 days

**Structural changes to consider:** write a three-bullet list of environmental or structural changes (not willpower-based) that would make the desired behavior easier. Be specific: what changes to schedule, environment, tools, or commitments would remove friction.

**Personal accountability template:**

```
Commitment: I will spend [X hours/week] actively working on [area] for the next 30 days.
Specific actions: [3 concrete actions — not "try to be healthier" but "do X thing at Y time on Z days"].
Week 1 deliverable: [The one thing I will know or have done by end of week 1 that I don't have today].
Depth signal: [How I will know I've genuinely moved from ASPIRATIONAL to INTENTIONAL in this area — a specific behavior change or metric shift, not a time gate].
```

---

## Step 4 — Write the dossier file

Write the complete dossier to:

```
workspace/areas/<area>/resources/go-deep/go-deep-<YYYY-MM-DD>.md
```

Use the date established in Step 1. Create the `go-deep/` directory under `resources/` if it does not exist.

Open the file with a header block:

```markdown
# Go-Deep Dossier — <Area Name>

**Date:** <YYYY-MM-DD>
**Depth verdict:** <OPERATIONAL | INTENTIONAL | ASPIRATIONAL>
**Overall score:** <X.X> (<STRONG | DEVELOPING | FRAGILE>)
**Commitment test:** <YES | NO | CONDITIONAL (on X)>

---
```

Then write Sections A through D in full.

> **Pre-commit guard reminder:** inside `workspace/areas/<area>/`, only the 6 required root docs and `resources/` (any depth) are permitted. The dossier MUST live under `workspace/areas/<area>/resources/go-deep/`. Any other location will be blocked by the pre-commit hook.

---

## Step 5 — Commit, push, and log ops

### Commit and push

```bash
git add workspace/areas/<area>/resources/go-deep/go-deep-<YYYY-MM-DD>.md
git add .agents/ops/<YYYY-MM-DD>/
git commit -m "Add go-deep dossier <area> <YYYY-MM-DD>"
git push
```

Use the actual area and date in the commit message (e.g. `Add go-deep dossier career 2026-06-19`). If push fails, report the error and stop — do not force-push.

### Ops log

Append a bullet to `.agents/ops/<YYYY-MM-DD>/ops-log.md` (today's Asia/Kolkata date; create the folder if absent):

```markdown
- `/go-deep` — produced go-deep dossier for <area>; depth verdict: <OPERATIONAL|INTENTIONAL|ASPIRATIONAL>; overall score: <X.X> (<STRONG|DEVELOPING|FRAGILE>); commitment test: <YES|NO|CONDITIONAL>; dossier at `workspace/areas/<area>/resources/go-deep/go-deep-<YYYY-MM-DD>.md`; commit <hash>.
```

---

## Constraints

- **Ground every claim in the docs.** Do not fabricate depth. If the docs do not establish a fact, flag it as a gap — that is the finding.
- **External systems are read-only.** This skill writes only the dossier markdown file and the ops log. No API calls to Whoop, Brex, or any external service.
- **Never modify previous weeks' folders.** The dossier lives in `resources/`, not in a week folder.
- **One area per run.** If the user names multiple areas, ask them to pick one and rerun for the others separately. Depth analysis done in parallel across multiple areas defeats the purpose of the framework.
- **Commit once at the end** (Step 5), not after each intermediate step. Stage the dossier and ops log together so the commit is coherent.
- **Valid area slugs only:** `health`, `finance`, `career`, `relationships`, `learning`, `home`. If the user provides an invalid slug, ask them to correct it before proceeding.
