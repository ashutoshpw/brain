# Metrics — health

> **Note:** Whoop is a **read-only** external data source. Values are pulled for situational awareness; targets and decision rules live in this file. Never write back to Whoop via this repo.

## North-star metric

**Whoop weekly recovery average** (%) — measures how well the body is absorbing cumulative training and life stress. Target: ≥ 70 % weekly average, sustained over any rolling 4-week period.

## Tracked metrics

| Metric | Definition / source | Target / threshold | Cadence |
|---|---|---|---|
| Recovery score | Whoop — daily HRV-based recovery % (0–100) | ≥ 70 % avg / week | Daily read, weekly review |
| Sleep performance | Whoop — actual sleep vs need (%) | ≥ 80 % avg / week | Daily read, weekly review |
| Sleep duration | Whoop — total sleep in hours | ≥ 7 h/night, 5+ nights/week | Weekly review |
| HRV (7-day avg) | Whoop — heart-rate variability (ms) | Upward trend over 30 days <!-- TODO: personalize — set baseline once data available --> | Weekly review |
| Resting HR | Whoop — resting heart rate (bpm) | ≤ 60 bpm (7-day avg) | Weekly review |
| Day strain | Whoop — daily exertion score (0–21) | 10–14 on training days, 6–10 on rest days | Weekly review |
| Body weight | Manual scale (morning, fasted) | <!-- TODO: personalize — set target weight in kg --> | Weekly (Sunday) |
| Training sessions | Manual log or calendar | ≥ 4 sessions/week | Weekly review |
| Steps | Phone health app / Whoop (if tracked) | ≥ 8 000 steps/day avg | Weekly review |
| Daily water intake | Manual tracking (app or log) | ≥ 2.5 L/day | Weekly review |
| Bloodwork panel | GP lab results (annual) | All markers in normal range | Annual |

## Decision rules tied to metrics

- **Recovery < 60 % for 2 consecutive days** → drop training intensity; prioritise sleep and nutrition that day.
- **Recovery < 50 % (red)** → rest day mandatory; investigate sleep debt or illness.
- **Weekly recovery avg < 60 % for 2 consecutive weeks** → schedule a deload week; review sleep hygiene and stress load.
- **Resting HR ≥ 65 bpm (7-day avg)** → flag as early illness/overtraining signal; reduce strain targets.
- **Weight deviation > ±3 kg from target for 4+ weeks** → review nutrition; adjust calorie targets.
- **Missing 2+ scheduled training sessions in a week** → carry them over only if recovery supports it; do not stack.
- **Bloodwork marker out of range** → schedule GP follow-up within 30 days.

## Metrics blocked on data

- **HRV baseline** — need 4+ weeks of consistent Whoop data to establish a personal baseline. Until then, use directional (up/down) trend only.
- **Body-weight target** — not yet set. <!-- TODO: personalize — set target weight -->
- **Caloric intake / macro breakdown** — not currently tracked. Consider adding if weight goal stalls.

## Open questions

- Should step count move from phone to Whoop as the canonical source?
- What is the right strain target on strength-training days vs. cardio days?
- Is a quarterly bloodwork cadence more appropriate than annual, given training load?
