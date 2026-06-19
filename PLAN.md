# brain — Personal Life Control Pane

A plan to bootstrap `ashutoshpw/brain` (currently an empty git repo) using the same
architecture, conventions, skills, and pre-commit guarantees as `w3mirror/control-pane`,
re-targeted from **managing an organization & its products** to **managing a personal life**.

> Source of truth: this mirrors control-pane's design exactly — a Bun-based, **markdown-only**
> repo where every artifact is a committed `.md` file, external systems are **read-only**, and
> custom TypeScript validators run in a `husky` pre-commit hook. `--no-verify` is prohibited.

---

## 1. Core concept mapping (org → personal)

| control-pane (org) | brain (personal) | Notes |
|---|---|---|
| **Brand / product** (`workspace/projects/<domain>/`) | **Life area** (`workspace/areas/<area>/`) | The central entity. 6 areas instead of 15 brands. |
| 10 brand docs (ABOUT, ICP, COMPETITION, MARKETING, SEO, PRICING, ROADMAP, LAUNCH, KPI, POSITIONING) | **6 area docs** (OVERVIEW, GOALS, METRICS, ROADMAP, HABITS, PRINCIPLES) | Org marketing docs dropped; personal-strategy docs added. Same uniform set for every area. |
| `social-profiles/<slug>/profile.md` (org social accounts) | `people/<slug>/profile.md` (relationships registry) | Same frontmatter-validated registry pattern. |
| `references/` (distribution catalogs) | `references/` (reading list, tools, resources, idea pipeline) | Same YAML-frontmatter catalog schema. |
| `resources/expert-guide/youtube/` | `resources/expert-guide/youtube/` | **Unchanged** — learning distillation. |
| `tasks/YYYY/{MM, MM-Wn, MM-DD}/` | `tasks/YYYY/{MM, MM-Wn, MM-DD}/` | **Unchanged** — month/week/day planning cadence is already personal. |
| `scheduled/scheduled.md` | `scheduled/scheduled.md` | **Unchanged** — future-dated items graduate into tasks. |
| External systems read-only (Meta Ads, PostHog, deploy) | External systems read-only (Whoop, Brex, calendar) | Repo holds decisions; you execute. |

### The 6 life areas (`workspace/areas/`)

```
workspace/areas/
├── health/         # fitness, nutrition, sleep, medical  (Whoop = read-only source)
├── finance/        # budget, net worth, investments, expenses  (Brex = read-only source)
├── career/         # professional goals, skills, income streams, portfolio (high level)
├── relationships/  # relationship strategy; people themselves live in workspace/people/
├── learning/       # books, courses, skills to acquire (feeds from expert-guide)
└── home/           # household, errands, documents, recurring admin, possessions
```

---

## 2. Area doc model (the personal equivalent of the 10 brand docs)

Every `workspace/areas/<area>/` MUST contain these **6 docs** (non-empty), enforced by
`check-area-docs.ts`. Same uniformity rule as control-pane: identical doc set for every area;
anything area-specific lives under that area's `resources/`.

| Doc | Replaces | Content |
|---|---|---|
| `OVERVIEW.md` | ABOUT.md | What this area covers, current-state snapshot, what "good" looks like, key signal/metric. |
| `GOALS.md` | (new) | North-star for the area + active goals with target dates. |
| `METRICS.md` | KPI.md | Tracked metrics table: `\| Metric \| Definition/source \| Target \| Cadence \|`, decision rules, metrics blocked on data. |
| `ROADMAP.md` | ROADMAP.md | Confirmed changes (numbered) + `- **[proposed]**` candidates pending your sign-off. |
| `HABITS.md` | LAUNCH.md | Recurring systems/routines as `- [ ] item` checklists (carryover logic depends on exact syntax). |
| `PRINCIPLES.md` | POSITIONING.md | Values, decision rules, one-liner, and an **anti-** section (what I deliberately do NOT do). |

**Verbatim `METRICS.md` shape** (mirrors KPI.md):
```markdown
# Metrics — <area>
## North-star metric
## Tracked metrics
| Metric | Definition / source | Target / threshold | Cadence |
## Decision rules tied to metrics
## Metrics blocked on data
## Open questions
```

**Checklist syntax (critical — identical to control-pane):**
- Open `- [ ] item` · Done `- [x] item` · Dropped `- [x] ~~item~~ (dropped: reason)`

### People registry (`workspace/people/<slug>/profile.md`)

Mirrors `social-profiles`. Frontmatter validated by `check-people-data.ts`:
```yaml
---
type: person
name: <full name>
relation: family | friend | mentor | colleague | acquaintance
area: relationships
cadence_days: 30            # desired contact frequency
important_dates:
  - { label: birthday, date: MM-DD }
tags: [<topic>, ...]
updated: YYYY-MM-DD
---
```
Secret-scanning rule from `check-social-data.ts` is retained (blocks committed credentials).

### Family-member spec (`workspace/people/<slug>/profile.md`, `type: family-member`)

A richer subtype of `person` for close family, carrying **stats**. Validated by the same
`check-people-data.ts` (family-member additionally requires `dob` + `relationship`). Repo is
private, so personal stats are allowed; the credential-pattern scan still applies.

```yaml
---
type: family-member
name: <full name>
relation: family
relationship: spouse | parent | child | sibling | grandparent | in-law | other
area: relationships
dob: YYYY-MM-DD              # age derived, never stored
blood_group: A+ | O- | ...  # optional
height_cm: <int>            # optional
weight_kg: <int>           # optional
sizes:
  clothing: <size>          # optional
  shoe: <size>             # optional
dietary: [vegetarian, no-nuts, ...]      # optional
medical_notes: <allergies, conditions>    # optional, free text
important_dates:
  - { label: birthday, date: MM-DD }
  - { label: anniversary, date: MM-DD }
contact: { phone: null, email: null }
tags: [<topic>, ...]
updated: YYYY-MM-DD
---

<prose: preferences, gift ideas, notes, history>
```

The relationships area also gets `workspace/areas/relationships/resources/family/ROSTER.md` — a
human-readable index of family members linking to each `people/<slug>/profile.md`.

---

## 3. Repository layout (mirrors control-pane structure)

```
brain/
├── CLAUDE.md                 # Personal ops bible (conventions, areas table, cadence, session rules)
├── AGENTS.md -> CLAUDE.md     # symlink (single source of truth)
├── README.md                  # short overview
├── package.json               # Bun + husky + lint-staged (mirror)
├── tsconfig.json              # Bun/ESNext strict (mirror)
├── lint-staged.config.mjs     # runs check-area-docs on staged area files
├── .gitignore
│
├── .husky/
│   └── pre-commit             # runs all check-*.ts then lint-staged
│
├── scripts/                   # custom TypeScript validators (run via Bun)
│   ├── check-area-docs.ts
│   ├── check-workspace-layout.ts
│   ├── check-staged-md.ts
│   ├── check-people-data.ts
│   ├── check-claude-skills-symlinks.ts
│   ├── check-expert-guide-summaries.ts
│   ├── check-references.ts
│   └── check-area-coverage.ts
│
├── .claude/
│   ├── settings.local.json    # allowed bash (bun scripts/*, git *) + web permissions
│   └── skills/                # symlinks → ../../.agents/skills/<name>
│
├── .agents/
│   ├── memory/YYYY-MM/         # personal learnings, one .md per fact
│   ├── ops/YYYY-MM-DD/         # daily journal / audit log (optional but kept)
│   └── skills/                # canonical SKILL.md per skill
│
└── workspace/                 # only these 6 top-level folders allowed
    ├── areas/                 # the 6 life areas (was projects/)
    ├── references/            # reading list, tools, resources, idea pipeline catalogs
    ├── resources/             # cross-area research, expert-guide/youtube, archive/
    ├── people/                # relationships registry (was social-profiles/)
    ├── scheduled/             # future-dated items (scheduled.md)
    └── tasks/                 # YYYY/{MM, MM-Wn, MM-DD}/ planning cadence
```

`check-workspace-layout.ts` enforces exactly: `areas, references, resources, people, scheduled, tasks`.

---

## 4. Skills (Lean core + personal advisors)

All skills authored under `.agents/skills/<kebab>/SKILL.md`, surfaced via symlink at
`.claude/skills/<name>` (enforced by `check-claude-skills-symlinks.ts`).

### Planning cadence — ported near-verbatim (already personal & area-agnostic)
| Skill | Behaviour |
|---|---|
| `month` | Scaffold month goals folder, carry over unfinished goals, roll up weekly learnings. |
| `week` | Scaffold week folder, carry over open checklist items, ask top-3, commit. |
| `day` | Morning sweep: check off finished, surface today's focus, write `focus.md`. |
| `review` | End-of-week walk of unchecked items, write `retro.md`, commit. |

### Personal-ops — adapted from control-pane
| Skill | Was | Behaviour |
|---|---|---|
| `life-status` | brand-status | Health-check across all 6 areas: pull metrics (Whoop/Brex read-only), flag what's off-target vs prior period. |
| `add-area` | add-project | Onboard a new life area: scaffold the 6 docs, register it in CLAUDE.md + skill tables + references README (atomic commit, passes all guards). |
| `go-deep` | go-deep | YC-style "pick one area and go deep" — depth audit + 30-day plan for one area. |
| `youtube` | youtube | Distill a video into `resources/expert-guide/`, apply learnings to relevant area docs + this week's learnings. |
| `create-skill` | create-skill | Author new skills with correct structure + symlinks. |

### Personal advisor personas — repurposed C-suite (one per major area + a strategist)
| Skill | Was | Role |
|---|---|---|
| `life-strategist` | ceo | Overall life vision, annual OKRs, big decisions. |
| `financial-advisor` | cfo | Budget, unit economics of life, investment & pricing-of-time decisions (finance area). |
| `health-coach` | new (head-of-customer-success shape) | Training, recovery, nutrition, sleep guidance (health area). |
| `career-coach` | cpo | Skill roadmap, role/project prioritization, professional growth (career area). |
| `learning-mentor` | new | Curriculum design, spaced-repetition, what-to-learn-next (learning area). |

### Dropped (org/marketing-only, no personal analogue)
`ads-pulse`, `content-plan`, `content-review`, `add-competitor`, `content-writer`,
`email-sequence-generator`, `social-media-manager`, `revenue-assessment`, `cmo`, `cto`,
`head-of-engineering`.

### Optional integrations (nice-to-have, leverage already-connected MCP — flagged for later)
- `whoop-pulse` — pull Whoop recovery/sleep/strain into `health/METRICS.md` (read-only), like `ads-pulse`.
- `finance-pulse` — pull Brex balances/transactions into `finance/METRICS.md` (read-only).

---

## 5. Pre-commit hooks (mirror exactly, renamed for personal domains)

`.husky/pre-commit` runs in sequence, then `bunx lint-staged`:

| Script | Was | Enforces |
|---|---|---|
| `check-area-docs.ts` | check-project-docs | Every `areas/<area>/` has all 6 required docs, each non-empty. |
| `check-workspace-layout.ts` | (same) | `workspace/` contains only the 6 allowed folders; no stray files. |
| `check-staged-md.ts` | (same) | Inside area folders only the 6 docs + `resources/**` stageable; outside, `.md` only in allowed roots (`.claude/`, `.agents/`, `references/`, `resources/`, `people/`, `tasks/`, `scheduled/`, root README/CLAUDE/AGENTS). |
| `check-people-data.ts` | check-social-data | `people/<slug>/profile.md` frontmatter (`type, name, relation, area, updated`); secret-pattern scan retained. |
| `check-claude-skills-symlinks.ts` | (same) | Every `.claude/skills/` entry is a symlink into `.agents/skills/`. |
| `check-expert-guide-summaries.ts` | (same) | `resources/expert-guide/youtube/<id>/SUMMARY.md` frontmatter (`title, date, tags, videoId==dir`). |
| `check-references.ts` | (same) | `references/*.md` YAML schema (`type, kind, category, title, updated` + per-entry catalog fields). |
| `check-area-coverage.ts` | check-brand-coverage | Every area appears in CLAUDE.md areas table + `life-status` skill table + `references/README.md` mapping. |

Tooling parity: Bun runtime (`#!/usr/bin/env bun`), `husky ^9`, `lint-staged ^17`, strict
`tsconfig` with `noEmit`. No CI — all enforcement at pre-commit, same as control-pane.

---

## 6. Implementation phases (incremental, commit per phase, hooks must pass)

- **Phase 0 — Skeleton + tooling.** `package.json`, `tsconfig.json`, `.gitignore`, `README.md`,
  `CLAUDE.md` (+ `AGENTS.md` symlink), empty `workspace/{areas,references,resources,people,scheduled,tasks}/`
  with `.gitkeep`, `.husky/` init. First commit.
- **Phase 1 — Validators.** Port the 8 `scripts/check-*.ts`, adapted. Wire `.husky/pre-commit`
  + `lint-staged.config.mjs`. Verify each runs green on the empty skeleton. Commit.
- **Phase 2 — Area templates + scaffold.** Define the 6-doc template; scaffold all 6 areas with
  starter docs (real but minimal content so `check-area-docs` passes). Commit (one per area or grouped).
- **Phase 3 — Planning cadence skills.** Port `month`, `week`, `day`, `review`. Commit.
- **Phase 4 — Personal-ops skills.** `life-status`, `add-area`, `go-deep`, `youtube`, `create-skill`. Commit.
- **Phase 5 — Advisor skills.** `life-strategist`, `financial-advisor`, `health-coach`,
  `career-coach`, `learning-mentor`. Commit.
- **Phase 6 — references + people + scheduled seed.** Seed `references/README.md` + a couple of
  catalogs, the people-registry README/schema, and `scheduled/scheduled.md`. Commit.
- **Phase 7 — Optional integrations (later).** `whoop-pulse`, `finance-pulse` using connected MCP,
  read-only into the respective `METRICS.md`.

Conventions retained from control-pane: commit + (optionally) push after each file write;
short imperative commit messages; never modify prior week/day folders; timezone `Asia/Kolkata`;
model routing (data retrieval → haiku, synthesis → sonnet/opus); never auto-branch.

---

## 7. Decisions (confirmed)

1. **Remote** — `https://github.com/ashutoshpw/brain` (push there after each phase).
2. **Privacy** — repo is already private; secret-scan hook retained for tokens/account numbers.
3. **People registry** — seed a few people, including family members with the family-member stats spec.
4. **Integrations** — `whoop-pulse` / `finance-pulse` **deferred to Phase 7** (not built in this pass).
