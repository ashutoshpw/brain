---
name: life-status
description: One-page health check across all 6 life areas (or one named area): read each area's METRICS.md + HABITS.md, surface what's off-target vs prior period. Whoop and Brex are read-only external sources (noted in the report; not queried live).
---

## Life areas reference

| Area | Focus | Read-only data source | Key signal |
|---|---|---|---|
| `health` | Fitness, nutrition, sleep, medical | Whoop (recovery score, HRV, sleep quality) | Weekly recovery trend |
| `finance` | Budget, net worth, investments, expenses | Brex (account balances, transactions) | Budget variance vs plan |
| `career` | Professional goals, skills, income streams, portfolio | — | Active goal progress |
| `relationships` | Relationship strategy; people registry in `workspace/people/` | — | Cadence maintenance rate |
| `learning` | Books, courses, skills to acquire; feeds from expert-guide | — | Learning items completed |
| `home` | Household, errands, documents, recurring admin, possessions | — | Open task backlog size |

If the user names one area, run only that area. Otherwise run all six.

## Model routing

This skill reads 12 files (2 per area × 6 areas). Route by complexity to keep token cost lean.

- **Delegate to `haiku` subagent(s)** (Agent tool, `model: "haiku"`): Step 3 (reading each area's `METRICS.md` and `HABITS.md`). These are pure retrieval. Batch all area reads into one or a few haiku subagents that each return a compact JSON row per area (`metrics_status`, `habits_completion`, `off_target_items`, `notes`). Do not run these reads on the calling model.
- **Keep on the calling model** (Sonnet): Step 4 verdict logic, the "Needs attention" synthesis, and report writing. Feed it only the compact summaries, not raw file text.

## Step 0 — Establish current time

Before anything else, run this with Bash:

```bash
TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
```

Treat its output as the authoritative "now" — date, 24-hour time, and weekday — in the owner's timezone (Asia/Kolkata). Use it for the `YYYY-MM-DD` stamp in the report filename, the current daily folder, and the "this period vs prior period" comparison windows. The injected `currentDate` is a fallback only; if the two disagree (e.g. near midnight or across a timezone boundary), prefer the Asia/Kolkata shell output.

## Step 1 — Determine scope

If the user named a specific area (e.g. `/life-status health`), set `scope = [health]`. Otherwise `scope = [health, finance, career, relationships, learning, home]`.

## Step 2 — Determine current daily folder

1. List year/date directories under `workspace/tasks/`.
2. Identify the most recent `workspace/tasks/YYYY/MM-DD/` folder by sort order (skip bare `MM` monthly folders and `MM-Wn` weekly folders).
3. Use that as the output folder. If no daily folder exists yet for today, use the current week folder (`MM-Wn`).

## Step 3 — Gather per-area data (delegate to haiku subagent)

Spawn a `model: "haiku"` subagent with the instruction to read, for each area in scope:

**a) `workspace/areas/<area>/METRICS.md`**
- Extract: north-star metric, tracked metrics table rows, any explicit targets and cadences, decision rules tied to metrics, and any metrics currently "blocked on data."

**b) `workspace/areas/<area>/HABITS.md`**
- Extract: total checklist items (`- [ ]` + `- [x]`), completed (`- [x]`) count, open (`- [ ]`) count, and any dropped (`- [x] ~~item~~`) items.
- Compute habits completion % = completed / (completed + open) × 100.

Return a structured summary row per area:
```json
{
  "area": "<name>",
  "north_star": "<metric name and current value if stated>",
  "metrics_off_target": ["<metric: why off>"],
  "metrics_data_blocked": ["<metric: reason>"],
  "habits_total": 0,
  "habits_done": 0,
  "habits_pct": 0,
  "habits_open": ["<open item text>"],
  "notes": "<anything else notable>"
}
```

Feed only these compact summaries to the calling model for synthesis — do not forward raw file text.

**External data sources (read-only, note only):**
- **Whoop** (health area): note that live Whoop data (recovery score, HRV, sleep quality, strain) is available via the Whoop MCP but is not queried in this skill run. The health area's `METRICS.md` should reflect any Whoop data that was last pulled. If `METRICS.md` is silent on Whoop, surface that as a coverage gap.
- **Brex** (finance area): note that live Brex data (account balances, transactions) is available via Brex MCP but is not queried in this skill run. The finance area's `METRICS.md` should reflect any Brex data that was last pulled. If `METRICS.md` is silent on Brex, surface that as a coverage gap.

## Step 4 — Determine verdict per area

- 🟢 **green**: habits ≥ 80% complete, no metrics off-target.
- 🟡 **yellow**: habits 50–79% complete, OR 1–2 metrics off-target.
- 🔴 **red**: habits < 50% complete, OR 3+ metrics off-target, OR north-star metric explicitly off-target.
- ⚪ **grey**: `METRICS.md` and `HABITS.md` both have no data yet (new area or not yet populated).

## Step 5 — Write the report

Write to `<current-daily-folder>/life-status-YYYY-MM-DD.md` (use today's date from Step 0).

Report structure:

```markdown
# Life Status — YYYY-MM-DD

## Summary

| Area | Habits | Metrics off-target | External data | Verdict |
|---|---|---|---|---|
| health | X/Y (Z%) | <list or none> | Whoop: not pulled | 🟢/🟡/🔴/⚪ |
| finance | X/Y (Z%) | <list or none> | Brex: not pulled | 🟢/🟡/🔴/⚪ |
| career | X/Y (Z%) | <list or none> | — | 🟢/🟡/🔴/⚪ |
| relationships | X/Y (Z%) | <list or none> | — | 🟢/🟡/🔴/⚪ |
| learning | X/Y (Z%) | <list or none> | — | 🟢/🟡/🔴/⚪ |
| home | X/Y (Z%) | <list or none> | — | 🟢/🟡/🔴/⚪ |

## Needs attention

- **<area>**: <one-line reason> — <suggested action>

## Coverage gaps

- <area>: <which data source is missing, e.g. "METRICS.md has no Whoop data — run /whoop-pulse to pull">

## Open habits (carry into next /week)

- **<area>**: `- [ ] <item>` — <note if blocked or slipping>
```

If no areas need attention, write `_All areas nominal._` under that section.
If no coverage gaps, write `_All areas have data._`.
If no open habits to highlight, write `_No open habits flagged._`.

## Step 6 — Commit and push

First append this run's operations to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's date, Asia/Kolkata; create the folder if absent) — one bullet for the report written, per the CLAUDE.md ops audit log.

```bash
git add <current-daily-folder>/life-status-YYYY-MM-DD.md .agents/ops/YYYY-MM-DD/
git commit -m "Add life status YYYY-MM-DD"
git push
```

Use the actual date in the commit message.

## Constraints

- **Read-only** against all external systems: no writes to Whoop, Brex, or any other external service. Only the report file and ops log are written.
- Do not create any files other than the report and ops log.
- Whoop and Brex are noted as available but not queried by this skill. A future `/whoop-pulse` or `/finance-pulse` skill will pull live data into the area's `METRICS.md`.
- If an area's `METRICS.md` or `HABITS.md` is absent, mark that area ⚪ grey and note the gap.
- If push fails, report the error and stop — do not force-push.
