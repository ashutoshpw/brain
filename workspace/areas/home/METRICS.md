# Metrics — home

## North-star metric

**Admin tasks cleared on time** — % of recurring home admin items (bills, renewals, errands) completed by their due date in a given month. Target: ≥ 90 %.

## Tracked metrics

| Metric | Definition / source | Target / threshold | Cadence |
|---|---|---|---|
| Admin tasks on-time rate | % of home admin items in weekly plan completed by due date | ≥ 90 % | Weekly |
| Document renewals missed | Count of passports / insurance / vehicle documents that lapsed before renewal action was taken | 0 | Monthly |
| Subscription cost (total) | Sum of all active recurring subscriptions in `resources/subscriptions.md` | Reviewed for cuts | Monthly |
| Zombie subscriptions | Count of active subscriptions not used in the past 60 days | 0 | Monthly |
| Maintenance tasks overdue | Count of items in `resources/maintenance-schedule.md` past their service date | 0 | Monthly |
| Declutter sessions completed | Count of time-boxed declutter sessions (≥ 45 min) completed in the month | ≥ 1 / quarter | Quarterly |
| Weekly admin block adherence | # of weeks where the admin block was completed / total weeks in month | ≥ 4 / 4 per month | Monthly |

## Decision rules tied to metrics

- If any document renewal is missed (lapsed), immediately add a +30-day lead reminder in `scheduled/scheduled.md` for all remaining tracked documents and never rely on memory again.
- If subscription cost is up > 20 % month-over-month, run an audit before next monthly cycle.
- If maintenance task is > 30 days overdue, escalate to that week's priorities immediately — don't carry it into the next weekly review.
- If admin block adherence falls below 3/4 weeks in any month, re-examine the time slot (wrong time?) or chunking (too many items?).

## Metrics blocked on data

- **Household energy / utility costs** — would require pulling from provider portals. Not tracked here yet; could be a read-only `home-pulse` integration. <!-- TODO: decide if worth tracking -->
- **Possessions inventory** — a structured count of items by category. Useful for insurance and declutter decisions but requires initial effort to enumerate.

## Open questions

- Should grocery / household shopping be tracked as a metric, or is that too granular for this level?
- Should a single `workspace/areas/home/resources/subscriptions.md` file also track annual vs. monthly and auto-calculate monthly equivalent cost?
