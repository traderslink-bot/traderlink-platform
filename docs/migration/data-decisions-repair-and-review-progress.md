# Data Decisions Repair and Review Progress

**Status:** Technically complete. Owner visual/product review remains pending.

**Controlling plan:** [Data Decisions Repair and Review Plan](data-decisions-repair-and-review-plan.md)

## Current checkpoint

The prior Journal correction plan established progressive disclosure. Owner
review then clarified that the page must be repair-first and that unresolved
work should not repeat as banners or a count badge throughout the dashboard:
statement rows remain visible, row repair is the normal action, and unresolved
trades are grouped only for focused decision review.

The current platform already preserves immutable source evidence, versioned
execution corrections, account-scoped decisions, deterministic rebuilds and
contained analytics eligibility. This follow-up changes the trader-facing
information architecture and connects existing safe authority to clearer
workflows; it must not create a second ledger or weaken the integrity contract.

## Planned slices

- [x] Slice 0: contract and page inventory
- [x] Slice 1: repair-first information architecture
- [x] Slice 2: row correction workflow
- [x] Slice 3: scoped open-position workflow
- [x] Slice 4: duplicate, notice and history completion
- [x] Slice 5: technical acceptance
- [ ] Owner visual/product review

## Start boundary

The existing `TLDEMO` records remain temporary local visual-review examples and
are not part of the plan's accepted user data. No private statement, source
database, process or deployment is changed by this page work.

## Slice 0 inventory

- `/data-decisions` is a Server Component that reads an account-scoped
  `JournalDataDecisionsReadModel` and passes serializable data to one client
  component. Its API route already re-authorizes the selected account, requires
  an expected account-selection reference and resolves permitted decisions in
  the existing atomic Journal integrity runtime.
- The current read model returns pending/resolved decisions and trade-scoped
  execution/position evidence, but it does not return all rows for a selected
  import batch. Slice 1 needs a bounded, account-scoped statement read model
  and an import selector/deep-link boundary.
- Existing actions safely support execution correction, missing-execution
  entry, exclusion/restoration, overlap reconciliation, position correction,
  source limitation and open-position confirmation. Slice 2 must map the new
  plain-language row workflows only to actions that actually address the
  decision; it must not invent a separate writer.
- The current CISS-style open-position card uses a raw position-fact correction
  as its confirmation mutation. Slice 3 must instead use the existing
  `confirm_legitimate_open_position` authority where applicable, then hand off
  factual open positions to the established style/classification surface.
- `data-decisions-repair-preview.tsx` is an unreferenced legacy V3 import-repair
  component. It is not a replacement implementation source and must not be
  revived for this work.
- Current cards still expose several items the plan removes: raw decision IDs in
  DOM anchors, raw position-fact selectors, technical status labels, generic
  affected-surface links and a free-form decision-reason field. Slice 1 replaces
  the presentation without weakening the existing server authorization.

## Slice 1 implementation record

- The account-scoped Product Read Service now reads one selected statement's
  preserved rows and attached row issues. The browser receives no internal row,
  decision or import identifiers beyond the opaque values required for the
  already-authorized account interaction.
- `/data-decisions` now provides **Trades needing a decision**, **Statement
  issues** and **Statement details**. Statement issues links a flagged row back
  to the matching trade decision without exposing an internal identifier.
- Expanded trade cards now show **Executions used by this trade** and the
  original statement row needing attention. The old status column, raw DOM
  decision identifier, position-facts table, free-form reason field and generic
  affected-day/account links are removed from the default repair flow.
- A scoped supported-open-position confirmation now uses the existing
  `confirm_legitimate_open_position` authority instead of editing the opposing
  statement fact. Classification after factual confirmation remains Slice 3.
- Focused whitespace and lint checks passed for the page, API route, read model,
  client and Product Read Service. Broad tests remain deferred during active
  owner-facing development.

## Slices 2 and 3 implementation record

- Row-level repair stays tied to the preserved statement row and uses the
  existing versioned Journal correction authority. The page does not create a
  second execution ledger or silently replace source evidence.
- Confirming a factually supported open position now returns only an opaque
  position reference and current revision for that one account-scoped position.
  The trader can then classify it as an active swing, long-term hold or bag
  hold. Classification is intentionally separate from factual confirmation.
- The classification writer retains its established revision, idempotency and
  account-selection protections. It cannot classify an arbitrary position from
  a Data Decisions card.

## Slice 4 refinement record

- Data Decisions remains directly available in primary navigation without a
  repeated dashboard banner or unresolved-count badge.
- Duplicate reconciliation and resolved-history presentation remain within the
  dedicated account-scoped page.

## Slice 4 implementation record

- Later owner review simplified the notice behavior: Data Decisions remains a
  clear primary-navigation destination, while repeated Journal/Analytics
  banners and the unresolved-count navigation badge are removed. The queue and
  review history remain account-scoped and unchanged.
- Exact statement re-import is already idempotent at import commit: the Import
  page reports that the statement was already saved and creates no duplicate
  execution or new decision. Certain broker duplicates use the same safe
  import path instead of becoming a new trade.
- Possible manual/broker matches remain trader-controlled. The existing
  overlap decision exposes both entries; a trader can match the broker entry,
  keep them separate, or correct the manual entry. Until then, the accepted
  manual execution remains active once and the provisional broker candidate is
  withheld.
- Exceptional exclusion now requires a concise trader-selected category:
  non-trade row, duplicate execution, broker correction/reversal or corporate
  action. It remains a reversible, evidence-preserving decision rather than a
  source-row deletion.
- Review history is now a separate page view, not part of the pending queue.
  Each item records the trader's plain-language action and can reveal the
  original statement row and execution evidence without restoring an editable
  decision card.
- Focused one-worker verification passed for exact re-import, trader-controlled
  manual/broker duplicate choice and later-open-position scoping. The scoped
  position test now explicitly asserts the approved confirmation-first action,
  rather than the superseded raw position-fact correction flow.

## Slice 5 acceptance record

- The focused resolver test covers each permitted typed correction and now
  verifies that an execution exclusion carries one of the approved reason
  categories. It passed with one Vitest worker.
- Focused Journal integrity checks passed for exact statement re-import,
  manual/broker duplicate choice, scoped later-open-position evidence, missing
  execution entry, fact correction and factual open confirmation. No broad test
  suite was run.
- The protected browser check was the last technical item. Port 3010 remains
  off outside a local visual-review checkpoint.

## Browser verification record

- The protected loopback dashboard was started only for this check and stopped
  afterward; port 3010 is clear again.
- Desktop and mobile `/data-decisions` checks rendered the three statement and
  trade views plus review history, the unresolved-count badge, compact pending
  cards, the actual flagged statement row, and its trade-scoped repair form.
  There was no framework error overlay, browser console error or mobile
  horizontal overflow.
- The available local review examples contain no previously resolved decision,
  so review history's empty state was rendered. The server read-model and
  focused decision tests cover populated resolved-history records.
- This browser verification is technical evidence only. The owner remains the
  final product/visual reviewer for the page.
