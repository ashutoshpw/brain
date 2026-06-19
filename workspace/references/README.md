---
type: reference
kind: index
title: References — Personal Resource Catalogs
updated: 2026-06-19
maintainer: ashutosh
---

# References — Personal Resource Catalogs

Shared, **area-agnostic** catalogs of personal resources: reading lists, tools, communities, and learning platforms. Each catalog's **data lives in the YAML frontmatter** (a `sites:` array); the markdown body is human guidance. A pre-commit hook (`scripts/check-references.ts`) validates every file against the schema — a malformed catalog blocks the commit.

> Scope: this folder is the **shared catalog**. What you're actively pursuing (and status) lives in the relevant area's docs, not here. Keep these files area-agnostic.

---

## Area → Archetype mapping

Each life area maps to an audience archetype used in catalog `brand_fit` tags. This mapping is required by `scripts/check-area-coverage.ts`.

| Area | Focus | Archetype |
|---|---|---|
| `health` | Fitness, nutrition, sleep, medical | `B2C` |
| `finance` | Budget, net worth, investments, expenses | `B2C-prosumer` |
| `career` | Professional goals, skills, income streams, portfolio | `B2B-services` |
| `relationships` | Relationship strategy; people registry | `B2C` |
| `learning` | Books, courses, skills to acquire | `B2C-prosumer` |
| `home` | Household, errands, documents, recurring admin | `B2C` |

---

## Catalogs

| File | Kind | Covers |
|---|---|---|
| `reading-list.md` | directory-catalog | Books, newsletters, and blogs worth reading |
| `tools.md` | directory-catalog | Personal productivity tools and apps |

---

## Schema

Every `workspace/references/*.md` file **must begin** with a YAML frontmatter block.

**File-level keys**

| key | required | rule |
|---|---|---|
| `type` | yes | must equal `reference` |
| `kind` | yes | one of `directory-catalog`, `community-catalog`, `index` |
| `category` | yes (catalog kinds) | slug; should match the filename stem |
| `title` | yes | human title |
| `updated` | yes | `YYYY-MM-DD` |
| `maintainer` | no | string |
| `sites` | yes (catalog kinds) | non-empty array; omitted for `kind: index` |

**Per-site keys — `directory-catalog`**

| key | required | rule |
|---|---|---|
| `name` | yes | string |
| `url` | yes | starts with `http(s)://` |
| `cost` | yes | one of `free`, `freemium`, `paid` |
| `effort` | yes | one of `low`, `medium`, `high` |
| `brand_fit` | yes | non-empty array; each value ∈ archetype vocab |
| `dr` | no | integer 0–100; **omit if unknown — never guess** |
| `notes` | no | string |

**Per-site keys — `community-catalog`**

Same as above, except `audience` (string) and `posture` (string) are **required** in place of `cost`/`effort`; `cost`/`effort` are optional.

**`brand_fit` archetype vocabulary** (the only allowed values):

`B2C` · `B2C-prosumer` · `B2B-SMB` · `B2B-high-ticket` · `B2B-services`

---

## Adding to the catalogs

- **New entry:** add to the `sites:` array of the matching catalog. Provide all required keys; omit `dr` if unknown. Bump the file's `updated`.
- **New category:** create `workspace/references/<slug>.md` with the correct `kind`, fill frontmatter, add at least one site, and add a row to the Catalogs table above.
- **YAML tips:** 2-space indentation; `brand_fit` as an inline array `[B2C, B2C-prosumer]`; wrap any `notes` or `audience` value containing a colon in double quotes.

## Validation

`scripts/check-references.ts` runs on every commit (via `.husky/pre-commit`) and validates **all** files here. Run it manually:

```
bun scripts/check-references.ts
```
