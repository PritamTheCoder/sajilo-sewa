# Code of Conduct — Sajilo Sewa

> "Sajilo" = Simple. Keep the code simple, keep the process simple, keep the team simple.
> This is a single-page reference. Read it once a week. If something here is being violated, raise it.

---

## Ownership

- **Person A** owns everything inside `/client/src/` — no one else touches it without asking
- **Backend person / B ** owns everything inside `/server/` — models, services, routes, migrations as well as `dev` & `main` branches.
- **Person C** has access to `main` and `dev` branches, all deployments, and QA — only they merge PRs
- Cross-domain help is welcome; cross-domain decisions are not made alone

---

## Repository Rules

- No direct pushes to `main` or `dev` — everything goes through a pull request
- Branch naming: `frontend/name`, `backend/name`, `db/name`, `fix/name`
- Commit format: `feat(scope): description` / `fix(scope): description` / `docs(scope): description`
- PRs target `dev`, never `main`
- `main` → only before evaluation demos, only by Person C or B
- Never commit `.env` — if it happens, rotate all secrets immediately
- Only the Backend person runs `alembic revision` — never two people simultaneously

---

## Definition of Done

A feature is **done** only when:
- It works locally AND has been manually tested
- Backend routes are tested in Swagger UI (happy path + error cases)
- Frontend has loading state and error state handled
- The PR is open, reviewed, and merged to `dev`
- "Works on my machine" is not done

---

## Communication

- **Monday sync (30 min):** last week / this week / blockers — mandatory for all three
- **Wednesday check (15 min):** on track or cut scope — not a demo day surprise
- Raise blockers the day you hit them — not at the end of the week
- Any breaking API change? Notify Person A **before** the PR is merged
- Any Alembic migration merged? Notify Person C to verify it runs clean
- Decisions made in a one-on-one must be shared with the whole team

---

## Code Review Standards

- Every PR gets reviewed before merge — no self-merges, no skipping review to "save time"
- Reviewer checks: does it follow `Architecture-and-Concept.md` conventions? Is business logic in `/services/`? Are there loading/error states?
- Small PR (< 100 lines) → reviewed same day
- If a PR sits unreviewed for 2+ days → ping Person C directly
- Review comments are technical, not personal — "this belongs in the service layer" not "this is wrong"

---

## Hard Rules — No Exceptions

- No new technology added mid-project without team vote (all three must agree)
- No features outside MVP scope without team vote
- No direct Supabase table editor edits for tracked schema changes — Alembic only
- No `password_hash` in any Pydantic response schema — ever
- No stack traces exposed in API responses
- No `TODO: fix later` on critical logic (auth, booking status, payment-adjacent paths)
- No `console.log` or `print()` debug statements in committed code

---

## When Things Go Wrong

- **Bug found:** open a GitHub Issue, assign it, fix it on a `fix/name` branch, PR to `dev`
- **`dev` is broken:** the person who broke it fixes it the same day — not Person C's job
- **API mismatch discovered during integration:** Backend person updates Swagger and the schema; Person A updates the integration call — fix it together, do not point fingers
- **Migration conflict:** `alembic merge heads`, commit the merge file, notify Person C
- **Production down before demo:** open the URL 60 seconds early (Render free tier cold start) — this is a known risk, not a crisis

---

## Team Standards

- Help when asked — someone being blocked for a day costs the whole team
- Credit contributions in PR descriptions — "built on Person A's component structure"
- Disagreements on technical approach → write it down, bring to Monday sync, team votes, move on
- No silent rewrites of another person's domain — discuss first
- Every team member can read code outside their domain — curiosity is welcome, unilateral changes are not

---

*This document is the behavioral contract for Sajilo Sewa.*
*It changes only when all three members agree. Last reviewed: May 2026.*
