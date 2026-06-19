---
name: create-skill
description: Author new agent skills for the brain repo with correct structure, YAML frontmatter, and the canonical .agents/skills/<name>/SKILL.md → .claude/skills/<name> symlink convention. Use when creating any new reusable skill.
---

## What I do

- Guide you through creating a new agent skill for the brain repo
- Generate the proper directory structure at `.agents/skills/<skill-name>/`
- Create a valid `SKILL.md` with required YAML frontmatter
- Set up the symlink in `.claude/skills/<skill-name>` → `../../.agents/skills/<skill-name>` (relative path, for portability)
- Verify the symlink resolves and passes `check-claude-skills-symlinks.ts`

## When to use me

Use this skill when:
- Creating a new reusable planning, ops, or advisor skill for the brain repo
- Need guidance on SKILL.md frontmatter and section structure
- Want the symlink convention to be set up correctly the first time

## Skill Creation Process

### Step 1: Gather information

Before creating a skill, collect the following. Accept whatever the user supplied; **ask once** for anything missing:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase alphanumeric with single hyphens (e.g. `life-status`, `add-area`). Must match the directory name exactly. |
| `description` | Yes | 1–1024 characters explaining what the skill does and when to invoke it. Include "Usage: /skill-name" if the skill takes arguments. |
| Purpose | Yes | What problem does this skill solve? Is it a cadence skill (month/week/day/review pattern), a personal-ops skill (status/analysis/archive), or an advisor skill (persona-based guidance)? |
| Steps outline | Yes | High-level list of what the skill does — used to draft the SKILL.md body. |

### Step 2: Validate the name

The `name` field must follow these rules:

- **Length**: 1–64 characters
- **Characters**: Lowercase alphanumeric only (`a-z`, `0-9`)
- **Separators**: Single hyphens allowed (no consecutive `--`)
- **Edges**: Cannot start or end with `-`
- **Match**: Must match the directory name exactly

Valid regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

| Valid | Invalid |
|-------|---------|
| `life-status` | `Life-Status` (uppercase) |
| `add-area` | `add--area` (double hyphen) |
| `go-deep` | `-go-deep` (starts with hyphen) |
| `youtube` | `you_tube` (underscore) |

Also check that the name does not already exist under `.agents/skills/` — duplicate skill names cause ambiguity.

### Step 3: Create directory structure

```bash
mkdir -p .agents/skills/<skill-name>
```

The symlink is created in Step 5 after the SKILL.md is written and verified.

### Step 4: Draft the SKILL.md

Write `.agents/skills/<skill-name>/SKILL.md`. Open with **required** YAML frontmatter:

```yaml
---
name: <skill-name>
description: <1–1024 character description>
---
```

The frontmatter block is mandatory — `check-claude-skills-symlinks.ts` does not validate frontmatter content, but Claude Code uses `name` and `description` to surface the skill. Missing or malformed frontmatter means the skill will not load.

**Body structure (adapt to skill type):**

For a **personal-ops skill** (the brain pattern):
```markdown
## Step 0 — Establish current time
[Run TZ='Asia/Kolkata' date; use as authoritative now]

## Step 1 — <first action>
[...]

## Step N — Commit and push
[git add / git commit / git push]

## Step N+1 — Ops log
[Append bullet to .agents/ops/YYYY-MM-DD/ops-log.md]

## Constraints
- Never auto-branch.
- Never --no-verify.
- External systems are read-only.
- Timezone: Asia/Kolkata.
```

For a **cadence skill** (month/week/day/review pattern): open with the cadence trigger (when to run it), then steps for reading prior state, scaffolding the new file, carrying over items, and committing.

For an **advisor skill** (persona-based): open with a persona description, then sections for how the advisor approaches each life area or decision type, with explicit "read these docs first" instructions.

**Boilerplate to include in every skill body:**

1. **Establish current time** (Step 0): always the first step:
   ```bash
   TZ='Asia/Kolkata' date '+%Y-%m-%d %H:%M %A'
   ```
   Treat this as the authoritative now. Never trust `currentDate` alone — it can be a day off near midnight.

2. **Model routing** (if the skill uses subagents): specify which steps run on haiku (pure data retrieval) vs. the calling model (synthesis and writing). See CLAUDE.md model routing table.

3. **Ops log** (every skill that writes files): append a bullet to `.agents/ops/YYYY-MM-DD/ops-log.md`.

4. **Commit and push**: stage specific files, commit with a short imperative message, push. **Never force-push. Never --no-verify.**

5. **Constraints block** at the end: summarize key invariants (read-only external systems, no auto-branching, exact syntax requirements, etc.).

### Step 5: Create the symlink

After the SKILL.md is written, create the symlink (relative path for portability):

```bash
ln -s ../../.agents/skills/<skill-name> .claude/skills/<skill-name>
```

Verify it resolves:
```bash
ls -la .claude/skills/<skill-name>
readlink .claude/skills/<skill-name>
```

Expected output: `../../.agents/skills/<skill-name>` (relative target pointing into `.agents/skills/`).

### Step 6: Verify the guards pass

```bash
bun scripts/check-claude-skills-symlinks.ts
```

This script checks **staged** entries only. If the new symlink is not yet staged, stage it first:
```bash
git add .agents/skills/<skill-name>/SKILL.md .claude/skills/<skill-name>
bun scripts/check-claude-skills-symlinks.ts
```

If the check passes, the symlink convention is correct. If it fails, re-read the error output and fix (most likely: symlink target does not contain `.agents/skills/`, or a plain file was accidentally created instead of a symlink).

### Step 7: Commit and push

```bash
git add .agents/skills/<skill-name>/SKILL.md
git add .claude/skills/<skill-name>
git commit -m "Add <skill-name> skill"
git push
```

### Step 8: Log ops

Append a bullet to `.agents/ops/YYYY-MM-DD/ops-log.md` (today's Asia/Kolkata date):

```markdown
- `/create-skill` — authored `.agents/skills/<skill-name>/SKILL.md`; created symlink `.claude/skills/<skill-name>` → `../../.agents/skills/<skill-name>`; skill passes check-claude-skills-symlinks; commit <hash>.
```

## Verification Checklist

After creating a skill, verify:

1. [ ] `SKILL.md` is spelled in ALL CAPS
2. [ ] Frontmatter includes both `name` and `description`
3. [ ] Skill `name` matches directory name exactly
4. [ ] Skill name follows naming rules (lowercase, hyphens only, no double-hyphen, no leading/trailing hyphen)
5. [ ] Description is between 1–1024 characters
6. [ ] Symlink exists at `.claude/skills/<name>` with target `../../.agents/skills/<name>`
7. [ ] `bun scripts/check-claude-skills-symlinks.ts` exits 0 (stage the symlink first)
8. [ ] Skill names are unique across `.agents/skills/`

## Frontmatter reference

### Required fields

```yaml
name: skill-name          # Must match directory name
description: |            # 1–1024 characters
  A clear description of what this skill does
  and when agents should invoke it.
```

### Optional fields (rarely needed in brain)

```yaml
license: MIT              # License identifier (for shared skills)
compatibility: opencode   # Tool compatibility hint
metadata:                 # Custom key-value pairs
  category: cadence | personal-ops | advisor
```

## Symlink convention (critical)

The `check-claude-skills-symlinks.ts` pre-commit hook validates that every entry under `.claude/skills/` is:
1. A symlink (git mode `120000`), not a plain file.
2. Points into `.agents/skills/` (target contains `.agents/skills/`).

**Never** commit a plain `SKILL.md` directly under `.claude/skills/<name>/`. The canonical location is `.agents/skills/<name>/SKILL.md`; `.claude/skills/<name>` is only the symlink directory entry pointing there.

## Constraints

- Work on the **current branch**; never auto-branch.
- **Never `--no-verify`** — all enforcement is at pre-commit. Fix the issue, don't bypass it.
- Skill names must be unique. If the user requests a skill that already exists (check `.agents/skills/`), ask them to choose a different name or confirm they want to overwrite.
- The `.opencode/skills/` symlink from control-pane is **not** used in brain — only `.claude/skills/` matters here.
