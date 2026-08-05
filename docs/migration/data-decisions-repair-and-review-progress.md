# Data Decisions Repair and Review Progress

**Status:** Active. Slices 0 through 3 are complete; Slice 4 is in progress.

**Controlling plan:** [Data Decisions Repair and Review Plan](data-decisions-repair-and-review-plan.md)

## Current checkpoint

The prior Journal correction plan established progressive disclosure and
dismissible notices. Owner review then clarified that the remaining page work
must be repair-first: statement rows remain visible, row repair is the normal
action, and unresolved trades are grouped only for focused decision review.

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
- [ ] Slice 4: duplicate, notice and history completion (in progress)
- [ ] Slice 5: acceptance

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

## Slice 4 in-progress record

- A dismissal now follows the selected account and current pending-decision
  evidence across dashboard pages instead of returning once per page. The
  dashboard navigation displays the account-scoped pending count beside Data
  Decisions. Resolving or changing pending evidence naturally creates a new
  notice state.
- Duplicate reconciliation and resolved-history presentation remain in scope
  for Slice 4 and are not marked complete by this checkpoint.

## Slice 4 implementation record

- Exact statement re-import is already idempotent at import commit: the Import
  page reports that the statement was already saved and creates no duplicate
  execution or new decision. Certain broker duplicates use the same safe
  import path instead of becoming a new trade.
- Possible manual/broker matches remain trader-controlled. The existing
  overlap decision exposes both entries; a trader can match the broker entry,
  keep them separate, or correct the manual entry. Until then, the accepted
  manual execution remains active once and the provisional broker candidate is
  withheld.
- Review history is now a separate page view, not part of the pending queue.
  Each item records the trader's plain-language action and can reveal the
  original statement row and execution evidence without restoring an editable
  decision card.
