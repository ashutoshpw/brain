# Metrics — relationships

## North-star metric

**Cadence adherence rate** — % of `workspace/people/` contacts reached within their `cadence_days` window, measured over a rolling 30-day look-back. Target: ≥ 85 %.

## Tracked metrics

| Metric | Definition / source | Target / threshold | Cadence |
|---|---|---|---|
| Cadence adherence rate | People with `cadence_days` set whose last contact ≤ cadence_days ago / total active people | ≥ 85 % | Weekly |
| Important dates missed | Count of birthdays / anniversaries in `important_dates` that passed without acknowledgement | 0 per month | Monthly |
| People registry freshness | Count of profiles where `updated` > 90 days ago | 0 | Monthly |
| Mentor touch-points | # meaningful updates sent to mentors (tagged `mentor`) | ≥ 1 per mentor per quarter | Quarterly |
| In-person social events | # scheduled in-person meet-ups with non-household contacts | ≥ 1 per month | Monthly |
| New meaningful connections | # new people added to registry (net new) | ≥ 1 per month | Monthly |

## Decision rules tied to metrics

- If cadence adherence drops below 70 %, immediately run a catch-up blitz: sort all overdue contacts by `cadence_days` ASC and message the top 5 that week.
- If any important date is missed two months in a row, add a recurring `scheduled/scheduled.md` reminder 3 days before every future date.
- If a mentor profile's `updated` field is > 120 days stale, queue a status-update message to them in next week's priorities.
- If no new people are added in any 60-day period, prompt the `life-strategist` skill to surface whether any life areas are becoming insular.

## Metrics blocked on data

- **Depth score** — a qualitative rating (1–5) of how meaningful the last interaction was. Currently no systematic source; would require a post-interaction log. <!-- TODO: decide if you want to track this -->
- **Reciprocity rate** — % of contacts who initiated last. Requires logging who reached out first; not tracked yet.

## Open questions

- Should acquaintances (low-cadence contacts, > 180 days) count in the adherence metric, or be placed in a separate "passive" bucket?
- Best way to surface upcoming important dates automatically — cron check on `workspace/people/*/profile.md`?
