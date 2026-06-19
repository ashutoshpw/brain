---
title: links field is allowed on type:person profiles (validator ignores unknown fields)
date: 2026-06-20
type: gotcha
tags: [people, manoj-bora, person]
---

The `check-people-data.ts` validator only validates `links` when `type: notable-person`. For `type: person` profiles, the validator only checks `type`, `name`, `relation`, `area`, `updated`, and optionally `interests`. All other fields (including `links`) are silently ignored — they do not cause a failure.

This means the `links:` list representation (e.g. `- { label: instagram, url: https://... }`) can safely be used on friend/colleague profiles for storing social handles. No fallback to a flat field (e.g. `instagram: handle`) is needed.
