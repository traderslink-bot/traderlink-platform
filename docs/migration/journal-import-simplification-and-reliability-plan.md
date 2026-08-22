# Journal Import Simplification And Reliability Plan

**Status:** Owner-approved implementation in progress

**Progress record:** [Journal Import Simplification And Reliability Progress](journal-import-simplification-and-reliability-progress.md)
**Parent contracts:** [Import Integrity And Data Decisions Contract](import-integrity-and-data-decisions-contract.md) and [Notifications And AI Import Repair Plan](notifications-and-ai-import-repair-plan.md)

## Outcome

Make `/imports` feel like one completed task rather than a technical import
console. A trader either uploads a verified statement and sees that it was
saved, or receives only the specific help needed to map an unknown statement.
Data Decisions remain factual safeguards, but completed decisions never remain
counted or presented as unfinished work.

## Approved product flow

1. **Upload a statement.** The primary action is **Upload**. The selected CSV
   filename remains visible after file selection and clears only after a
   completed import or an explicit replacement selection.
2. **Verified statement.** A known verified adapter saves automatically to the
   active Trade Tracker account. There is no mapping card, field table, account
   selector or second save button. The sole exception is a newly discovered
   broker identity, which asks for an explicit one-time link to the active
   account using plain language.
3. **Unknown statement.** The page explains that TraderLink needs help reading
   the columns and shows only the mapping controls needed to continue. A
   trader-reviewed mapping is saved before import.
4. **Finished state.** A completed import replaces the review state with a
   clear saved result, its successfully imported execution count, any currently
   pending Data Decisions, and actions to upload another statement or view
   trades. An exact reupload is presented as already saved, never as unfinished.
5. **Actionable follow-up only.** The page never exposes non-execution adapter
   diagnostics, raw mapping classifications, internal severities, idempotency
   terms, source package/JSON downloads, account identity internals, or
   non-actionable asset/equity-journal messages.

## Reliability and integrity requirements

- The active account remains server-resolved; an import never selects or
  silently switches a Journal account in the browser.
- Preserve the last committed account and statement identity behavior. This
  slice does not change whether an exact statement may be imported into more
  than one Trade Tracker account.
- A verified adapter can auto-save only after a valid preview. A new source
  identity still requires the existing explicit server-confirmed account link.
- Commit responses use plain trader-facing failures and always leave the page
  in an actionable state. The browser does not impose an arbitrary read or
  save timeout and does not add a separate recovery endpoint.
- Import history and the saved-result card count only decisions currently in
  `pending` state. A resolved decision is retained in review history but is not
  presented as current work. Any genuinely opened follow-up decision is named
  plainly.
- Suppressing non-actionable UI diagnostics does not discard immutable source
  rows, accepted executions, or a needed Data Decision.
- VEE and comparable reports are diagnosed from the exact decision target and
  account reconstruction, not inferred solely from a displayed execution list.

## AI failed-import path

- Preserve the explicit failed-import consent choice and manual-mapping
  alternative. No statement bytes are sent to OpenAI without that button press.
- The existing worker is a bounded, consented pipeline: it reads the protected
  source, requests a structured mapping with provider storage disabled, proves
  a private preview, and retries only the held import.
- Railway activation is not an ordinary UI deployment. It requires protected
  `OPENAI_API_KEY`, an explicit import-repair enablement acknowledgement, data
  controls acknowledgement, an approved model ID, a secret-protected scheduler
  for `/api/cron/journal-ai-import-repair`, a synthetic end-to-end rehearsal,
  and an owner-approved Railway release. No real statement is submitted while
  developing this slice.

## Implementation order

1. Add this plan and progress record; preserve concurrent working-tree changes.
2. Simplify the client state machine and all verified/manual/saved outcomes.
3. Preserve the last committed import engine and account-identity contracts;
   limit this slice to the approved client experience and existing contracts.
4. Make actionable mapping and Data Decisions wording singular and plain.
5. Align affected Import and Data Decisions Help Center pages.
6. Run only focused static/type checks during implementation; present the
   integrated UI for owner review before a local feature commit.
7. After owner review, prepare the separate Railway AI-activation checklist;
   do not set secrets, activate a scheduler, deploy, or call OpenAI without
   explicit release authorization.
