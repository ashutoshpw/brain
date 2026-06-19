---
type: reference
kind: directory-catalog
category: tools
title: Personal Tools & Apps
updated: 2026-06-19
maintainer: ashutosh
sites:
  - name: Notion
    url: https://www.notion.so
    dr: 91
    cost: freemium
    effort: low
    brand_fit: [B2C-prosumer, B2B-SMB]
    notes: "All-in-one notes, docs, and wikis. Use for ad hoc notes and external collaboration; repo is the source of truth for structured plans."
  - name: Obsidian
    url: https://obsidian.md
    dr: 76
    cost: free
    effort: medium
    brand_fit: [B2C-prosumer]
    notes: "Local-first Markdown knowledge base with bidirectional links. Complements this repo for private journaling and idea capture."
  - name: Whoop
    url: https://www.whoop.com
    dr: 74
    cost: paid
    effort: low
    brand_fit: [B2C]
    notes: "Wearable health tracker (recovery, HRV, sleep, strain). Primary read-only data source for the health area."
  - name: Linear
    url: https://linear.app
    dr: 79
    cost: freemium
    effort: low
    brand_fit: [B2C-prosumer, B2B-SMB]
    notes: "Fast issue tracker and roadmap tool. For software projects; task cadence in this repo handles personal ops."
  - name: Readwise
    url: https://readwise.io
    dr: 61
    cost: paid
    effort: low
    brand_fit: [B2C-prosumer]
    notes: "Spaced-repetition review of Kindle highlights, articles, and notes. Feeds the learning area's habits."
  - name: Brex
    url: https://www.brex.com
    dr: 76
    cost: free
    effort: low
    brand_fit: [B2B-SMB, B2B-services]
    notes: "Business banking and spend management. Primary read-only data source for the finance area."
---

# Personal Tools & Apps

A catalog of personal productivity tools, wearables, and platforms in active use. Entries here are tools I rely on — not a wishlist.

## How to use

- **Tracking integrations** (Whoop, Brex) → read-only data sources wired to area `METRICS.md` reports.
- **New tool to evaluate** → add a note under `workspace/areas/<relevant-area>/ROADMAP.md` → `[proposed]` section. Promote here only after committing to it.
- **Deprecated tool** → remove from `sites:` array; note the reason in a commit message.

## Principle

Fewer tools used deeply beats many tools used shallowly. Every tool here should answer: "Does it save meaningful time or surface signal I couldn't easily get otherwise?"
