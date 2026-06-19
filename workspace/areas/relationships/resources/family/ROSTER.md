# Family Roster

Human-readable index of all family members. Each entry links to the person's full profile in `workspace/people/`.

> Source of truth for per-person data: `workspace/people/<slug>/profile.md`
> This file is a navigation index only — do not duplicate data here.

---

## Members

| Name | Relationship | Profile | Tags |
|---|---|---|---|
| Family Member 1 <!-- TODO: real name --> | parent | [profile](../../../../people/family-member-1/profile.md) | family, parent |
| Family Member 2 <!-- TODO: real name --> | spouse | [profile](../../../../people/family-member-2/profile.md) | family, spouse |

---

## Adding a family member

1. Create `workspace/people/<slug>/profile.md` with `type: family-member` frontmatter.
2. Add a row to the table above.
3. Commit — `check-people-data.ts` will validate the frontmatter.

## Removing / archiving a family member

Move the profile to `workspace/resources/archive/YYYY-MM-DD-<slug>/` with a provenance README. Remove the row from this table.
