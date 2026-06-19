# Roadmap — relationships

## Confirmed

1. Seed `workspace/people/` with profiles for all close family members (type: family-member) including dob, important dates, and physical stats.
2. Seed `workspace/people/` with profiles for top 10 friends and mentors (type: person) with cadence_days set.
3. Create `workspace/areas/relationships/resources/family/ROSTER.md` — human-readable index of all family profiles (Phase 6 / later).
4. Build a weekly Sunday relationship-check habit (see HABITS.md) and track adherence for 4 weeks.
5. Add `scheduled/scheduled.md` reminders for all important dates found in the people registry (3-day lead time).

## Proposed candidates

- **[proposed]** Automate cadence-overdue report: a script that reads all `workspace/people/*/profile.md` and outputs contacts past their `cadence_days` window, run by `/life-status`.
- **[proposed]** "Gift ideas" registry: each family-member profile already has a prose section for gift ideas — add a structured `resources/gift-ideas.md` with links to those profiles.
- **[proposed]** Quarterly relationship retro: a dedicated `retro-relationships-YYYY-Qn.md` that reviews cadence scores, depth, and which relationships need more investment.
- **[proposed]** "Conversation topics" sub-note per person: a lightweight `workspace/people/<slug>/topics.md` file to log conversation starters/shared interests before a call.
- **[proposed]** Mentor value-exchange log: track what you gave (intro, resource, advice) vs. what you received to ensure the relationship is reciprocal.
