---
name: add-person
description: Add someone to the people registry — a friend/mentor/colleague by name (minimal frontmatter), a family member (richer subtype with dob and physical/medical data), or a notable global role-model (projects, achievements, lessons that feed the learning/career area docs and this week's learnings file). All data goes in YAML frontmatter; prose body is optional. Guards against overwriting existing profiles. Usage: /add-person [name]
---

A single entry point for adding or updating anyone in `workspace/people/`. The skill branches by person type: minimal-frontmatter `person` (friend/mentor/colleague/acquaintance), richer `family-member`, or `notable-person` (role model that feeds the learning/career improvement loop). All data lives in YAML frontmatter — the prose body is supplementary only. Work on the **current branch**; never auto-branch.

## Step 0 — Establish now

Run before touching any file:

```bash
TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
```

Treat this output as the authoritative date, time, and weekday in Asia/Kolkata. Use the resulting `YYYY-MM-DD` for all `updated:` fields and dated paths. Do not trust the injected `currentDate` alone — it can be a day off near midnight.

## Step 1 — Collect who is being added

Gather the following. Accept whatever the user supplied in the invocation; **ask once** for anything missing — do not proceed with blanks on required fields.

### 1a — Common inputs (all types)

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Full name as the person is commonly known. |
| Person type | Yes | One of: **friend / mentor / colleague / acquaintance** → `type: person`; **family member** → `type: family-member`; **notable / role model** → `type: notable-person`. If unclear, ask. |

### 1b — Additional inputs by type

**type: person** (friend, mentor, colleague, acquaintance)

| Field | Required | Notes |
|---|---|---|
| `relation` | Yes | One of: `friend` \| `mentor` \| `colleague` \| `acquaintance`. Default: `friend` if omitted. |
| `cadence_days` | No | How often to reach out, in days (e.g. `30`, `60`, `90`). |
| `location` | No | City, country. |
| `how_we_met` | No | Brief context (e.g. "Met at a startup event in 2023"). |
| `interests` | No | YAML list of topics (e.g. `[tech, hiking]`). |
| `important_dates` | No | List of `{ label: birthday, date: MM-DD }` entries. |
| `tags` | No | YAML list of topic tags. |
| `notes` | No | Free text. |

Offer to capture optional fields but do not require them. A name alone is sufficient to create a valid `person` profile.

**type: family-member**

| Field | Required | Notes |
|---|---|---|
| `relationship` | Yes | One of: `spouse` \| `parent` \| `child` \| `sibling` \| `grandparent` \| `in-law` \| `other`. |
| `dob` | Yes | `YYYY-MM-DD`. |
| `blood_group` | No | e.g. `O+`. |
| `height_cm` | No | Integer. |
| `weight_kg` | No | Integer. |
| `sizes` | No | Object with optional `clothing` and `shoe` sub-fields. |
| `dietary` | No | List: `[vegetarian, no-nuts, ...]`. |
| `medical_notes` | No | Free text: allergies, conditions. |
| `important_dates` | No | List of `{ label, date: MM-DD }` entries. |
| `contact` | No | `{ phone: null, email: null }` — fill real values only if safe. |
| `tags` | No | YAML list of tags (e.g. `[family, parent]`). |

See the **family-member frontmatter** block in CLAUDE.md `## People registry` for the full canonical schema.

**type: notable-person**

| Field | Required | Notes |
|---|---|---|
| `field` | Yes | Domain string (e.g. `"distributed systems"`, `"growth marketing"`). |
| `why_tracked` | Yes | One-line reason: what I learn from them. |
| `area` | Yes | Ask: `learning` or `career`? Default: `learning`. Determines which area docs receive lessons. |
| `nationality` | No | Country string. |
| `links` | No | List of `{ label, url }` entries (website, Twitter/X, etc.). |
| `projects` | No | List of project objects — each requires `name`; optional `role`, `status`, `achievements` (list). |
| `achievements` | No | Standalone lifetime achievements (not project-scoped). |
| `lessons` | No | Actionable takeaways — **what I learn / how to apply**. Feeds the learning loop in Step 5. |
| `important_dates` | No | `{ label: birthday, date: MM-DD }` entries. |
| `tags` | No | YAML list of topic tags. |

See the **notable-person frontmatter** block in CLAUDE.md `## People registry` for the full canonical schema. `relation: role-model` is the only allowed value if present.

## Step 2 — Resolve the slug and guard against overwriting

1. Derive the slug: lowercase the name, replace spaces and non-alphanumeric characters with hyphens, collapse consecutive hyphens, strip leading/trailing hyphens.
   - Example: `"John von Neumann"` → `john-von-neumann`
2. Check whether `workspace/people/<slug>/` already exists:
   ```bash
   ls workspace/people/<slug>/ 2>/dev/null
   ```
3. If the folder exists, read `workspace/people/<slug>/profile.md` and present it to the user:
   > "A profile for `<name>` already exists at `workspace/people/<slug>/profile.md`. Do you want to update it (I will merge new fields into the existing frontmatter) or abort?"
   Wait for the response. **Do not overwrite without explicit confirmation.**
4. If the user confirms an update, read the existing file fully and carry forward any fields not provided in the current invocation (merge, not replace).
5. If the folder does not exist, proceed to Step 3.

## Step 3 — Draft the frontmatter

Write the frontmatter for the chosen type, following the schemas below. Use the `updated:` date from Step 0. Every field must be valid YAML — quote strings that contain special characters.

### For `type: person`

Minimum valid profile:

```yaml
---
type: person
name: <full name>
relation: friend              # or mentor | colleague | acquaintance
area: relationships
updated: YYYY-MM-DD           # today's Asia/Kolkata date
---
```

Extend with any optional fields the user supplied (see Step 1b). The pre-commit validator (`check-people-data.ts`) requires `type`, `name`, `relation`, `area`, and `updated` — all others are optional.

### For `type: family-member`

```yaml
---
type: family-member
name: <full name>
relation: family
relationship: <spouse|parent|child|sibling|grandparent|in-law|other>
area: relationships
dob: YYYY-MM-DD
blood_group: <value>          # optional
height_cm: <int>              # optional
weight_kg: <int>              # optional
sizes:
  clothing: <size>            # optional
  shoe: <size>                # optional
dietary: [...]                # optional
medical_notes: <text>         # optional
important_dates:
  - { label: birthday, date: MM-DD }
contact: { phone: null, email: null }
tags: [family, <relationship>]
updated: YYYY-MM-DD
---
```

After writing the profile, add a row to `workspace/areas/relationships/resources/family/ROSTER.md` (see Step 4a). Mirror the existing row format: `| <Name> | <relationship> | [profile](../../../../people/<slug>/profile.md) | <tags> |`.

### For `type: notable-person`

```yaml
---
type: notable-person
name: <full name>
area: learning                # or career — chosen in Step 1
field: <domain string>
why_tracked: <one-line reason>
relation: role-model          # optional; only allowed value
nationality: <country>        # optional
links:
  - { label: <label>, url: <url> }
projects:
  - name: <project name>
    role: <role>
    status: active|completed|archived
    achievements:
      - <outcome>
achievements:
  - <lifetime achievement>
lessons:
  - <actionable takeaway>
important_dates:
  - { label: birthday, date: MM-DD }
tags: [<topic>, ...]
updated: YYYY-MM-DD
---
```

Omit optional sections (`links`, `projects`, `achievements`, `important_dates`) entirely rather than leaving them empty. Proceed to Step 4 and Step 5 for the learning/career feed.

## Step 4 — Write the profile

Create or update `workspace/people/<slug>/profile.md` with the drafted frontmatter and any optional prose body the user provided. If the prose body is empty, leave the file with frontmatter only — no placeholder comments.

### 4a — Family-member roster update

If `type: family-member`, also update `workspace/areas/relationships/resources/family/ROSTER.md`: add a row to the `## Members` table in this exact format:

```markdown
| <Name> | <relationship> | [profile](../../../../people/<slug>/profile.md) | family, <relationship> |
```

The relative link `../../../../people/<slug>/profile.md` resolves correctly from `workspace/areas/relationships/resources/family/ROSTER.md` to `workspace/people/<slug>/profile.md`. Check the existing rows in ROSTER.md for the current format before appending.

### 4b — Notable-person role-models index update

If `type: notable-person`, also upsert a row in `workspace/areas/learning/resources/role-models/README.md`:

```markdown
| <Name> | <field> | <why_tracked> | [profile](../../../../people/<slug>/profile.md) |
```

The relative link `../../../../people/<slug>/profile.md` resolves correctly from that README's location (`workspace/areas/learning/resources/role-models/`) to `workspace/people/<slug>/profile.md`. If the file does not exist, create it with this structure:

```markdown
# Role Models

People I track for learning and inspiration. Profiles with full projects, achievements, and lessons live in `workspace/people/`.

> Source of truth: `workspace/people/<slug>/profile.md` for each entry.
> This index is for navigation only — do not duplicate frontmatter data here.

---

## Index

| Name | Field | Why tracked | Profile |
|---|---|---|---|
| <Name> | <field> | <why_tracked> | [profile](../../../../people/<slug>/profile.md) |
```

## Step 5 — Feed the learning/career loop (notable-person only)

Perform these two sub-steps only when `type: notable-person`. Skip entirely for `type: person` and `type: family-member`.

### 5a — Surface lessons into this week's learnings file

1. **Determine the current week folder.** List `workspace/tasks/YYYY/` (use the `YYYY` from Step 0). Take the latest `MM-Wn` entry by sort order, skipping bare `MM` monthly folders and `MM-DD` daily folders. This is the current week's folder.
   ```bash
   ls workspace/tasks/<YYYY>/ | grep -E '^[0-9]{2}-W[0-9]+$' | sort | tail -1
   ```
   Full path: `workspace/tasks/<YYYY>/<MM-Wn>/`.

2. **Create or append** `workspace/tasks/<YYYY>/<MM-Wn>/learnings.md`. If the file exists, append a new `## <date> — <name>` block (never overwrite). Use exactly this format:

   ```markdown
   ## <YYYY-MM-DD> — <name> (role model added)

   **Profile:** `workspace/people/<slug>/profile.md`
   **Area:** <learning|career>
   **Field:** <field>

   Key lessons (full detail in profile `lessons:` frontmatter):
   - <lesson 1 — stated in personal application context>
   - <lesson 2>

   ### Proposed actions
   - [ ] Review `workspace/people/<slug>/profile.md` and add any missing projects/achievements
   - [ ] <specific action from lessons — e.g. "Read <name>'s essay on X">
   ```

   Only include the top 1–2 lessons from the `lessons:` frontmatter as bullets. If `area: career` was chosen, add a note: *"Lessons may also apply to career area docs — consider reviewing `workspace/areas/career/ROADMAP.md`."*

3. If the week folder does not exist yet, create it and write `learnings.md` as a new file. Do NOT scaffold `priorities.md` or any other file — `/week` owns that.

### 5b — Note fit to area docs (informational, no auto-edit)

Report to the user which area docs might benefit from the `lessons:` content:
- If `area: learning`: suggest reviewing `workspace/areas/learning/ROADMAP.md` (add a `[proposed]` item referencing the person) and `workspace/areas/learning/HABITS.md`.
- If `area: career`: suggest reviewing `workspace/areas/career/ROADMAP.md` and `workspace/areas/career/HABITS.md`.

Do **not** auto-edit area docs — propose the changes and let the user confirm (or invoke `/go-deep <area>` to do a thorough area update).

## Step 6 — Run validators

Before committing, run the guards directly to catch problems before the hook fires:

```bash
bun scripts/check-people-data.ts
bun scripts/check-staged-md.ts
bun scripts/check-claude-skills-symlinks.ts
```

Fix any errors they report and re-run until all exit 0. Common failure modes:
- `check-people-data.ts`: missing required frontmatter field (`type`, `name`, `relation`, `area`, `updated` for `person`; `dob`, `relationship` for `family-member`; `field`, `why_tracked` for `notable-person`); slug mismatch (folder name differs from what the validator derives from `name`).
- `check-staged-md.ts`: a file outside the allowed paths was staged. Make sure new files land only under `workspace/people/<slug>/`, `workspace/areas/relationships/resources/family/ROSTER.md`, `workspace/areas/learning/resources/role-models/README.md`, and `workspace/tasks/YYYY/MM-Wn/learnings.md`.

## Step 7 — Commit

Stage only the files touched by this invocation:

```bash
# Always:
git add workspace/people/<slug>/profile.md

# family-member only:
git add workspace/areas/relationships/resources/family/ROSTER.md

# notable-person only:
git add workspace/areas/learning/resources/role-models/README.md
git add workspace/tasks/<YYYY>/<MM-Wn>/learnings.md   # if created/appended

# ops log + optional memory (see Step 8):
git add .agents/ops/<YYYY-MM-DD>/ops-log.md
git add .agents/memory/<YYYY-MM>/<slug>.md            # if written
```

Commit with a short imperative message on the **current branch**. Never `--no-verify`. Never auto-branch.

```bash
git commit -m "Add <name> to people registry"
# or for an update:
git commit -m "Update <name> profile"
git push
```

If the hook fails, read its output, fix the real cause, and re-commit. If the push fails, report the error and stop — do not force-push.

## Step 8 — Ops log and memory

### Ops log

Append a bullet to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's Asia/Kolkata date; create the dated folder if absent):

```markdown
- `/add-person` — added `<name>` (`type: <type>`, slug: `<slug>`) to `workspace/people/<slug>/profile.md`; [family: updated ROSTER.md | notable: updated role-models README + appended to `workspace/tasks/<YYYY>/<MM-Wn>/learnings.md`]; validators exit 0; commit <hash>.
```

### Memory file (optional but recommended)

If the session surfaced a non-obvious decision — a slug that differs from what naive kebab-casing would produce, a deferred field that should be filled later, an `area: career` choice for a notable person, or a conflict between the user's intent and the schema — write a `decision` or `gotcha`-type memory file at `.agents/memory/<YYYY-MM>/<slug>.md`:

```markdown
---
title: <one-line summary of the decision>
date: <YYYY-MM-DD>
type: decision | gotcha | preference | context
tags: [people, <slug>, <type>]
---

<The decision in prose: what it was, why it mattered, and how to apply it next time.>
```

Include the memory file in the same commit.

## Constraints

- **All people data in frontmatter.** The prose body is supplementary context only — never put structured data (dates, links, metrics) in prose that should be in frontmatter.
- **Current branch only.** Never auto-branch. If the user is on `main`, work on `main`.
- **Date stamps via shell.** Always use `TZ='Asia/Kolkata' date '+%Y-%m-%d'` for `updated:` and dated paths — do not hardcode or trust the injected `currentDate`.
- **Never overwrite without confirmation.** If the slug folder already exists, read the current profile and ask the user whether to merge or abort.
- **Validator exit 0 before commit.** `bun scripts/check-people-data.ts` must pass. Fix errors; never `--no-verify`.
- **Checklist syntax is exact** if any `- [ ]` items are written to the learnings file: open = `- [ ] item`, done = `- [x] item`, dropped = `- [x] ~~item~~ (dropped: reason)`.
- **External systems are read-only.** No API calls to Whoop, Brex, or any external service.
- **Do not scaffold beyond the task.** Writing `workspace/tasks/<YYYY>/<MM-Wn>/learnings.md` (for notable-person) creates only that file — do not create `priorities.md` or other week scaffold files.
- **One commit at the end** (Step 7). Stage everything together so the commit is coherent and all guards pass in one pass.
