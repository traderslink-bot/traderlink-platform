# Journal Import Simplification And Reliability Progress

**Status:** Owner-approved implementation in progress
**Controlling plan:** [Journal Import Simplification And Reliability Plan](journal-import-simplification-and-reliability-plan.md)

## 2026-08-21 approved scope

- In progress: statement selection and import progress are separated so a known
  statement is previewed first, then shown as importing only during the actual
  save request.
- Corrected: the unrequested browser timeout and follow-up attempt-status
  request were removed. Statement reads and saves now use the existing server
  request lifecycle without an arbitrary browser deadline.
- In progress: the hidden Links AI chat drawer no longer mounts or loads its
  conversations, memories, and drafts until the trader opens it. This keeps
  Imports from competing with unrelated dashboard work.
- Verification pending: focused lint and whitespace checks will cover the
  affected import client and dashboard shell. The owner will test the hosted
  page after deployment.

- [x] Owner approved a major `/imports` simplification: verified statements
      save into the active account and show a finished result; manual mapping
      appears only when genuinely needed.
- [x] Owner approved removal of technical mapping/outcome diagnostics,
      statement-format JSON/download UI, account-selection language and stale
      review state after a saved import.
- [x] Owner requested durable recovery from the observed Railway upstream
      response after a large October IBKR import, plus correct pending-decision
      counts and a diagnosis of the VEE decision.
- [x] Owner requested that the existing consented AI failed-import path be
      included. Source review confirmed the adapter, worker and signed cron
      route exist but Railway activation remains deliberately disabled.

## Implementation complete; owner review pending

- [x] Reworked the import flow: a verified format commits in the same
      server request that verifies it, avoiding a second browser commit request;
      a new broker profile gets one plain-language confirmation; manual mapping
      remains available only when needed; and success replaces the uploader
      with a finished card.
- [x] Removed non-actionable diagnostics and made mapping, duplicate and
      Data Decisions language trader-facing and singular.
- [x] Limited the Import history card to broker statements. Manual Trade
      Tracker entries remain part of the Journal but never appear as imports.
- [x] Removed the experimental attempt-status route and browser request
      timeout after they caused unreliable import behavior.
- [x] Confirmed the resolution service recomputes every affected import's
      pending count and transition after a decision is saved. The exact hosted
      VEE reason still needs a signed-in beta inspection; the displayed
      buy/sell rows alone are not enough to diagnose it safely.
- [x] Aligned the Import and Data Decisions Help Center guidance with automatic
      save, the manual fallback, exact reimport behavior and explicit OpenAI
      consent.
- [ ] Run focused ESLint and whitespace checks for the changed UI and Help
      files. No broad suite is planned.
- [x] Removed the experimental multi-account statement-import migration,
      confirmation path and account-identity changes. The import engine is
      restored to the last committed behavior.
- [x] Owner approved the new `/imports` design and required that it remain
      unchanged while import behavior is repaired.

## External activation boundary

No Railway secret, scheduler, OpenAI request, or real Journal mutation is
authorized by this progress record. The owner separately authorized publishing
this repaired page to the existing Railway beta for owner testing.
