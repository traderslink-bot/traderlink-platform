# Data Decisions Repair and Review Plan

**Status:** Owner-approved and active. Work proceeds in the implementation
slices below; the integrity contract remains controlling.

**Progress:** [Data Decisions Repair and Review Progress](data-decisions-repair-and-review-progress.md)

**Technical foundation:** [Import Integrity and Data Decisions Contract](import-integrity-and-data-decisions-contract.md)

**Prior product direction:** [Journal Review Workflow Corrections Plan](journal-review-workflow-corrections-plan.md),
Corrections 8 and 9. This document consolidates and supersedes those two
corrections for future Data Decisions page work; it does not weaken the
technical integrity contract.

## 1. Objective

Make Data Decisions a clear trader-facing place to review an imported broker
statement, repair importer mistakes, and resolve the small number of trades
whose factual result cannot be determined automatically.

The page must help the trader make TraderLink match the broker statement. It
must not ask the trader to understand reconstruction, raw position facts,
internal identifiers, or system status labels.

One unresolved trade must never make unrelated accepted activity disappear from
Trades, Calendar, Analytics, or the rest of the Journal.

## 2. Fixed product decisions

### 2.1 Three connected views

For the selected Journal account and statement, Data Decisions provides:

| View | Purpose |
| --- | --- |
| **Statement details** | Shows every preserved statement row detected by the importer, including executions and relevant non-trade rows such as fees. The trader can compare this view to the broker statement. |
| **Statement issues** | Shows only rows the importer could not use correctly or that need factual repair. Each issue exposes the actual row that caused it and direct row-level repair. |
| **Trades needing a decision** | Groups affected rows by the one reconstructed trade they affect. The default queue shows only unresolved work; resolved items live in separate history. |

Statement details and Statement issues are row-first repair tools. Trades
needing a decision is a trade-first review tool. They use the same immutable
source evidence and edits made in one view are visible in the others.

### 2.2 Plain trade cards

Each unresolved card is collapsed by default and shows:

- a short issue title;
- **Needs your decision**;
- ticker and currency;
- one direct question in ordinary trading language; and
- one concise consequence of the choice.

Opening the card shows **Executions used by this trade**, including every
accepted execution in that trade and every relevant flagged statement row, even
when a flagged row is not currently used in reconstruction. A card never loads
unrelated historical trades in the same ticker merely because the ticker is the
same.

The page does not show raw IDs, `accepted`, position-fact controls, technical
status codes, mandatory explanation fields, generic affected-day links, generic
account-analytics links, or implementation paragraphs.

### 2.3 Repairing statement rows

The normal action is **Fix this row**. It opens field-specific editing for the
preserved row so the trader can make TraderLink match the broker statement.

- Editing appends a versioned correction; it never overwrites or deletes the
  original broker evidence.
- A missing execution may be added only when the statement actually contains
  an execution that the importer failed to detect.
- The user may remove an importer-created false execution from derived trading
  data through **Do not use this as a trade execution**. This is an exceptional
  action for a false, duplicate or non-trade row, broker correction/reversal,
  or a corporate-action case that cannot yet be represented safely.
- Exclusion always preserves the row and decision history and can later be
  revised. The trader selects a concise reason category; no free-form system
  explanation is required.
- An invalid zero-quantity or missing-price row appears beside the relevant
  trade's executions and can be repaired directly in that row.
- Same valid execution times use preserved statement-row order. They do not
  create a decision just because they share a time. Missing or unreadable time
  is repairable only when it changes the factual trade result.

### 2.4 Legitimate open trades

When accepted executions establish a trade that remains open, Data Decisions
asks a direct question about that trade, not about generic opening inventory.

The trader can:

1. confirm that the position is still open and classify it as **Active Swing**,
   **Long-term hold**, or **Bag hold**;
2. add the actual missing closing execution or executions when the trade is in
   fact closed; or
3. fix the imported row that is wrong.

A normal zero opening balance is background statement context when the accepted
trade begins later from zero. A completed zero-to-zero CISS-like trade remains
available even if a later same-ticker position is open and needs a decision.

The open-position classification is trader-authored intent. It follows factual
confirmation; it is not an importer diagnosis and it does not change the
underlying broker evidence.

### 2.5 Duplicate and overlap handling

- Re-uploading the exact same broker statement is idempotent. TraderLink tells
  the trader that its executions are already imported and does not duplicate
  ledger activity or create another decision.
- A certain broker duplicate is not shown as a new trade.
- A possible manual/broker duplicate is not silently merged. Data Decisions
  shows both factual sources and lets the trader confirm the same execution,
  confirm separate executions, correct the manual entry, or decide later.
- Until resolved, the accepted manual execution remains usable once and only
  the provisional imported candidate is withheld. Unrelated imported rows stay
  available.

### 2.6 Notice and navigation behavior

- Repeated Journal/Analytics notices can be closed without hiding the actual
  work queue.
- The dismissal follows the selected account and unchanged pending-decision set
  across relevant surfaces, not one individual page.
- A changed decision set appears again.
- The Data Decisions navigation item shows a colored unresolved-count badge
  after a notice has been dismissed.
- Resolved decisions leave the default queue but remain available in review
  history with their original evidence and correction history.

### 2.7 Boundaries

Data Decisions does not:

- make a factual decision for the trader;
- silently turn missing data into zero;
- hide every trade from a statement because one trade needs repair;
- treat intentional manual entry as an importer failure merely because it does
  not prove full account-day coverage;
- infer a reverse split, corporate action, trade intent, missing execution or
  missing fee from a pattern; or
- combine this trader-facing repair page with Journal Administration operations.

Reverse splits and other corporate actions remain separate planned factual
evidence. A row affected by one may be excluded temporarily only through the
exceptional, reversible path above until the dedicated corporate-action model
exists.

## 3. Implementation slices

### Slice 0: contract and page inventory

- Reconcile this plan with the import-integrity contract and existing decision
  action matrix.
- Inventory current Data Decisions routes, API actions, read models, statement
  row evidence and current card actions.
- Identify each current UI element as retained, renamed, moved, or removed.
- Confirm account isolation, immutable evidence, revision checks, rebuild
  behavior and existing action permissions remain intact.

### Slice 1: repair-first information architecture

- Add the three account/statement views.
- Make default cards compact and trade-scoped.
- Show the original flagged row together with the executions used by that trade.
- Move resolved decisions into history.
- Replace internal/system copy with direct trader questions.

### Slice 2: row correction workflow

- Implement field-specific source-row edit, add-missing-execution and
  exceptional exclusion journeys using existing append-only correction/rebuild
  authority.
- Show the actual result after save without guessing before the rebuild.
- Ensure a repair affects only the necessary chain and preserves unrelated
  closed trades.

### Slice 3: scoped open-position workflow

- Resolve affected current trade evidence without loading unrelated same-ticker
  history.
- Add factual open confirmation, real missing-close entry and repair choices.
- Hand off a confirmed open position to existing classification authority.
- Prove a closed trade followed by a later same-ticker open position remains
  visible and analytics-ready.

### Slice 4: duplicate, notice and history completion

- Verify exact statement reimports, certain broker duplicates and uncertain
  manual/broker overlaps use the correct path.
- Make notice dismissal account-wide and digest-bound.
- Add the unresolved-count navigation badge and resolved-history access.

### Slice 5: acceptance

- Run focused verification for changed server actions and rebuild paths.
- Run the agreed browser review with real and clearly labelled synthetic
  examples for invalid quantity, missing price, duplicate/overlap, same-time
  source order and later open position cases.
- Confirm plain-language UI, desktop/mobile progressive disclosure, no raw IDs,
  no V3 dependency, and no unrelated-trade suppression.

## 4. Acceptance criteria

- The trader can see every imported row for a statement and repair the actual
  row that is wrong.
- The trader can see only issues when they want a short repair queue.
- A trade card contains the relevant executions and flagged rows, not unrelated
  same-ticker history.
- Ordinary legitimate open positions receive a clear classification or
  correction path rather than confusing inventory controls.
- Repairs, additions and exclusions are reversible, versioned, account-scoped
  and rebuild affected facts without deleting evidence.
- Exact reimports never create duplicate activity; uncertain manual/broker
  matches never silently overwrite manual facts.
- Unresolved work is visible in Data Decisions and the navigation badge but can
  stop repeating as a banner elsewhere after dismissal.
- Valid unrelated trades remain available throughout the dashboard.

## 5. Explicitly deferred

- First-class corporate-action entry, confirmation and adjustment logic.
- Automated broker-format learning implementation beyond the existing mapper
  planning and retained format evidence.
- Administration operations, user support actions or silent administrator
  changes to a trader's data.
- Trade Explorer, market-data/analyzer interpretation, and V3 analytics.
