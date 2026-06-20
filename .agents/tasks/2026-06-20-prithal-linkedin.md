---
id: 2026-06-20-prithal-linkedin
title: Fetch LinkedIn profile info for Prithal Bharadwaj
status: pending
capability: linkedin-fetch
created: 2026-06-20
updated: 2026-06-20
source: https://www.linkedin.com/in/prithal-bhardwaj-058a56187/
target: workspace/people/prithal-bharadwaj/profile.md
tags: [people, prithal-bharadwaj, enrichment]
priority: normal
---

Fetch the LinkedIn profile at the `source` URL: reconcile the real name spelling (LinkedIn slug reads "prithal-bhardwaj"), headline, current role + company, work experience, and listed skills.

**Note:** LinkedIn often blocks unauthenticated fetch. If the capability is unavailable at run time, set this task's `status: blocked` and `blocked_reason` (e.g. "LinkedIn requires authenticated fetch") rather than fabricating data.

**Acceptance criteria:** `workspace/people/prithal-bharadwaj/profile.md` frontmatter updated with verified name/role/company and relevant `projects`/`achievements`. Record a `result` summary and set status `done` (or `blocked` with reason).
