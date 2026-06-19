# Metrics — finance

> **Note:** Brex is a **read-only** external data source. Balances, transactions, and statements are pulled for situational awareness; budgets, targets, and decision rules live in this file. Never write back to Brex via this repo.

## North-star metric

**Monthly savings rate (%)** — `(net income − total expenses) / net income × 100`. Target: ≥ 30 % sustained over any rolling 3-month window.

## Tracked metrics

| Metric | Definition / source | Target / threshold | Cadence |
|---|---|---|---|
| Savings rate | (net income − expenses) / net income × 100 — calculated from Brex + bank | ≥ 30 % | Monthly |
| Monthly burn rate | Total outgoing spend in a calendar month — Brex statements + bank | <!-- TODO: personalize — set budget target in ₹ or $ --> | Monthly |
| Net worth | Total assets − total liabilities — manual spreadsheet or `resources/net-worth/` | Growing MoM (3-month rolling avg) | Monthly (last day of month) |
| Emergency fund (months) | Liquid savings / monthly burn rate | ≥ 6 months | Monthly |
| Investment portfolio value | Brokerage / exchange snapshot — manual | Upward trend (YoY) | Monthly |
| Brex cash balance | Brex cash account(s) — read-only via Brex MCP | ≥ 1 month burn at all times | Weekly review |
| Monthly income | Total net income from all sources | <!-- TODO: personalize — set income target --> | Monthly |
| High-interest debt balance | Credit card / consumer loan balances — Brex + bank | ₹ 0 / $ 0 (zero balance) | Monthly |
| Tax liability (estimated) | Quarterly estimated tax if self-employed | Filed on time; no penalties | Quarterly |

## Decision rules tied to metrics

- **Savings rate < 20 % for 2 consecutive months** → audit top 3 expense categories; identify one cut immediately.
- **Monthly burn > budget by ≥ 15 %** → freeze all discretionary spend for the rest of the month; investigate cause.
- **Brex cash balance < 2 weeks of burn** → do not take on new fixed costs; delay non-critical purchases.
- **Emergency fund < 3 months** → pause all non-retirement investments until fund is restored to 6 months.
- **Any high-interest debt balance at month end** → clear before investing additional discretionary capital.
- **Net worth declines for 3 consecutive months** → schedule a full financial review; escalate to `/financial-advisor`.
- **Tax filing deadline within 30 days** → ensure estimated tax is calculated and filed; block time in `/week`.

## Metrics blocked on data

- **Monthly burn rate baseline** — not yet established. Need 3 months of Brex statement data reviewed.
- **Net worth** — not yet documented. First snapshot required before trend is meaningful.
- **Investment portfolio breakdown** — allocation by asset class not yet recorded.
- **Income target** — personal income goal not yet set. <!-- TODO: personalize — define annual income target -->

## Open questions

- Should W3Mirror business equity be included in personal net worth, and at what valuation?
- What is the right investment allocation split (index / equity / crypto / real estate) given current stage?
- Should savings-rate calculation be pre-tax or post-tax?
- What is the target monthly burn rate? <!-- TODO: personalize -->
