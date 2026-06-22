# Role Models

People I track for learning and inspiration. Full profiles — including projects, achievements, and actionable lessons — live in `workspace/people/`.

> Source of truth: `workspace/people/<slug>/profile.md` for each entry.
> This index is for navigation only — do not duplicate frontmatter data here.
> To add a new entry, run `/add-person` and choose `type: notable-person`.

---

## Index

| Name | Field | Why tracked | Profile |
|---|---|---|---|
| Notable Person One | angel investing | Pioneered frameworks for early-stage evaluation that I study to improve my own investment thinking | [profile](../../../../people/notable-person-1/profile.md) |
| The Kumar Method | Instagram growth / short-form video | Reportedly reached 1.2M Instagram followers from just 6 videos — study how concentrated, high-quality content drives outsized growth. | [profile](../../../../people/thekumarmethod/profile.md) |
| Shivangi Narula | Instagram lifestyle / content (~330k followers) | ~330k-follower Instagram profile managed by the content strategist Manoj Bora works with — reference for content quality, topic selection, and editing. | [profile](../../../../people/shivanginarula/profile.md) |
| Prithal Bharadwaj | LinkedIn content & growth / content automation | Runs an automated LinkedIn content pipeline (Reddit-sourced -> Antigravity -> AI-generated posts + images -> scheduled). Tracking as a model for systematized content growth. | [profile](../../../../people/prithal-bharadwaj/profile.md) |
| Manthan Patel ("Lead Gen Man") | AI lead generation & automation; indie SaaS | Built a 100K+ student base into a $49/mo community + solo SaaS ladder — a model for monetizing AI/creator expertise. | [profile](../../../../people/manthaan-lead-gen/profile.md) |

---

## Adding a role model

1. Run `/add-person <name>` and select `type: notable-person`.
2. The skill writes `workspace/people/<slug>/profile.md` and upserts a row here automatically.
3. Commit — `check-people-data.ts` validates the frontmatter.

## Removing / archiving a role model

Move the profile to `workspace/resources/archive/YYYY-MM-DD-<slug>/` with a provenance README. Remove the row from the index above.
