# Journal Corporate Actions and Share Adjustments Plan

**Status:** Planned future Journal-integrity slice. Recorded from owner product
review on 2026-08-04. No implementation, migration, database mutation or
analytics change is authorized by this document in the current review session.

**Progress:** [Journal Corporate Actions and Share Adjustments Progress](journal-corporate-actions-progress.md)

## 1. Objective

Make stock splits and reverse splits correct, evidence-led Journal events without
rewriting historical executions, inventing profit, or creating review noise for
ordinary trades. A confirmed share adjustment must rebuild every affected
open-lot/round-trip projection across imported and manual executions, regardless
of statement upload order.

The initial scope is common-stock forward and reverse splits, including their
cash-in-lieu outcome where a broker records one. Mergers, spinoffs, ticker/
identifier changes, option-contract adjustments, stock dividends, rights and
other corporate actions are intentionally outside the first implementation; they
must remain preserved evidence and never be guessed as a split.

## 2. Product decisions

### 2.1 A share adjustment is not a trade

- A trader's buy or sell remains an immutable execution exactly as reported.
- A split/reverse split is a separate, dated corporate-action fact. It never
  becomes a synthetic buy, sell, close, or new round trip.
- The original execution is never rewritten. A confirmed adjustment transforms
  only the derived quantity and per-share basis of lots that were open when the
  action took effect; aggregate cost basis remains exact.
- Example: 100 shares bought at $1 become 10 shares at an adjusted $10 basis
  after a confirmed 1-for-10 reverse split. A later sale of 10 at $10 therefore
  closes the same trade at $0 realized P/L before fees, rather than producing a
  false 90-share remainder or a false $90 gain.
- Trader-facing trade detail may say "Adjusted for a 1-for-10 reverse split."
  Original executions remain available in details. Internal projection/action
  names never appear in ordinary UI.

### 2.2 Evidence and confirmation boundary

- Broker source rows remain immutable and traceable. A recognized corporate
  action is preserved as source evidence with its broker/statement provenance,
  effective date/time, description, affected instrument, quantity, currency and
  any reported proceeds.
- The future source-row model adds an explicit corporate-action mapping outcome;
  it must not misclassify an action row as a normal execution or silently drop
  it as an irrelevant non-trading row.
- A broker row that explicitly identifies a stock split/reverse split and its
  ratio creates a **pending share-adjustment decision**, not an automatic
  analytics change.
- The trader confirms the action's effective ordering and ratio before it
  affects positions, realized P/L, Analytics, Calendar, Open Positions or
  round-trip detail. Confirmation is append-only, versioned and attributable.
- If a trader has no import for the action, an intentional "Record share
  adjustment" flow may create the same pending evidence/confirmation record.
  It lives in Data Decisions or account activity, not Day or Swing Trade
  Tracker. Completing that explicit confirmation is the trader's confirmation;
  it is not inferred from a manual buy/sell.

### 2.3 No heuristic reverse-split claims

- The system must never infer a split solely because a later execution has a
  one-tenth quantity and ten-times price, or because a position quantity changes
  by a plausible ratio. Those patterns can be ordinary legitimate trades.
- A split candidate requires direct action evidence: an adapter-supported
  corporate-action section/type/code/description with a parsable ratio, or an
  intentional trader-recorded share adjustment.
- If no direct action evidence exists but accepted executions and a statement
  position fact disagree, retain the existing factual position Data Decision.
  Do not label it a split, offer an implied ratio, or ask the trader to set
  opening inventory merely to force the numbers to match.
- If a corporate-action row is present but its type, ratio, instrument identity
  or effective ordering cannot be determined, preserve it and create a focused
  Data Decision asking only for the missing corporate-action fact.

### 2.4 Manual executions that cross an adjustment

- Manual and broker executions continue to use the one canonical owner/account
  execution ledger. Their actual execution date/time, not submission time or
  import order, controls reconstruction.
- Once a share adjustment is confirmed, the full affected
  owner/account/instrument/currency chronology is rebuilt. A manual trade opened
  before the adjustment and closed after it is one continuous round trip with
  adjusted open inventory and correct P/L.
- A manual buy/sell alone never triggers a split warning. It participates only
  after a confirmed adjustment event applies to its then-open lot.
- When an execution and an adjustment share a date but their order cannot be
  established from statement time/evidence, the affected chain stays contained
  in Data Decisions until the trader supplies the ordering. It must not guess.
- Existing manual/broker duplicate reconciliation continues unchanged; a share
  adjustment is not a broker execution candidate and cannot replace a manual
  execution.

### 2.5 Analytics and visibility before confirmation

- An unconfirmed action is visible only as a focused Data Decision and its
  preserved evidence. It does not appear as a completed trade, an open position,
  a realized result, a calendar result, an Analytics metric, or a normal
  execution activity item.
- The affected chain is withheld from dependent financial metrics with a clear
  coverage reason such as "Awaiting confirmation of a share adjustment." The
  system does not display a guessed adjusted value, zero P/L, or a synthetic
  remaining position.
- Valid unrelated trades, tickers and metrics remain visible. One pending
  adjustment never hides the rest of the account.
- After confirmation, affected pages read the rebuilt projection consistently.
  A later correction, rejection or superseding action version rebuilds only the
  affected chronological chain and updates metric eligibility.

### 2.6 Exact accounting rules

- Store a reduced exact rational ratio: `new shares / old shares`. A 1-for-10
  reverse split is `1 / 10`; a 3-for-2 forward split is `3 / 2`.
- For every open long or short lot immediately before the effective action:
  `new quantity = old quantity × new / old` and
  `new per-share basis = old per-share basis × old / new`.
  The total basis and the pre-action economic P/L remain unchanged.
- The reconstruction must preserve exact decimal/rational values internally and
  round only for the normal trader-facing display contract.
- A position action applies across every open lot for the same account and
  continuous instrument identity, including lots originating in earlier/later
  uploaded statements. It does not cross Journal accounts or currencies.
- Cash in lieu is a distinct broker-provided settlement for any fractional
  remainder. It must preserve the fractional adjusted quantity/basis and exact
  proceeds so realized P/L is correct. It must not be invented as an ordinary
  stock sale.
- A broker-reported symbol/identifier change accompanying the action requires a
  separately confirmed instrument-continuity fact. The first split slice must
  not assume two ticker symbols are the same instrument.

### 2.7 Broker-neutral mapper and support evidence

- The statement mapper gains an optional corporate-action-table mapping with
  broker name, section/table label, action type/code, description, effective
  date/time, instrument identifier/symbol, ratio fields, quantity, proceeds and
  currency when supplied by the broker.
- Mapping a successful statement still retains privacy-safe structural evidence
  for future broker templates. A failed or unsupported action row is preserved
  with its table/labels for the trader's optional mapping and later support
  review; it does not enter execution reconstruction.
- IBKR is an expected first fixture because its activity reporting documents a
  Corporate Actions section. Every adapter remains broker-specific and must be
  proven with exact fixtures before being marked supported.

## 3. Data Decisions experience

The decision should lead with a plain-language card, for example:

> **Possible reverse split**
> Your broker statement reports that ABC changed from 100 shares to 10 shares
> on Aug. 4. Is this a 1-for-10 reverse split?

- The collapsed card identifies the action, ticker, effective date and the
  exact impact after confirmation: the open share count and per-share basis
  will be adjusted while the original trade remains intact.
- `Confirm share adjustment` is available only when the action evidence is
  sufficient. `Review details` exposes source evidence, ratio, optional cash in
  lieu and the small affected position scope.
- `This is not a share adjustment` and `I need to correct the details` preserve
  the evidence and create the appropriate bounded correction path; neither can
  silently force a position fact or alter an unrelated trade.
- A normal zero opening balance is not displayed as a competing explanation
  where accepted executions demonstrably began the affected position at zero.

## 4. Implementation sequence for the next run

1. **Contract and migration design**
   - Finalize source-row/action/decision/projection contracts and account
     isolation rules.
   - Add append-only corporate-action and confirmation records with immutable
     source provenance, exact rational ratio, effective ordering and
     supersession support.
   - Extend migration/schema digest/verification ownership. No V3 table or
     runtime dependency may be used.
2. **Import and mapper handling**
   - Add broker-neutral optional action-table mapping and an adapter-specific
     IBKR fixture/recognizer only when the exact statement layout supports it.
   - Preserve unknown actions; never map them as trades or apply a numeric
     heuristic.
3. **Decision and confirmation service**
   - Implement owner/account-authorized, optimistic, append-only pending,
     confirm, correct and reject paths.
   - Build the compact trader-facing Data Decisions card and the intentional
     manual share-adjustment path outside the Trackers.
4. **Deterministic reconstruction and read models**
   - Rebuild complete affected chronologies around a confirmed action, including
     imported/manual lots, short lots, same-date ordering and cash in lieu.
   - Publish consistent eligibility to Trades, Open Positions, Calendar and
     Journal Analytics; no confirmation means no affected financial result.
5. **Verification and owner review**
   - Add focused fixtures for forward/reverse splits, a trade spanning the
     action, manual-before/imported-after and imported-before/manual-after,
     random statement upload order, ordinary look-alike trades, same-date
     ambiguity, cash in lieu, account isolation, reimport/idempotency,
     rejection and supersession.
   - Run only the agreed minimal checks during active visual review. Run the
     broader Journal/database/browser checkpoints after this complete slice,
     subject to available resources and the owner's testing preference.

## 5. Stop conditions

Stop the slice and correct the design before acceptance if it would:

- infer or automatically confirm a split from quantity/price patterns alone;
- rewrite or delete an original execution, source row or statement fact;
- create a synthetic buy/sell or split one trade into false round trips;
- show unconfirmed adjusted P/L, position quantity or analytics;
- let an adjustment affect another account, currency or unconfirmed symbol
  continuity;
- treat cash in lieu as a guessed ordinary sale;
- make the Day/Swing Trackers the corporate-action capture surface; or
- allow one pending adjustment to hide unrelated accepted activity.

## 6. Acceptance checklist

- [x] Owner-confirmed product rule: reverse splits require confirmation before
  affecting trader data or analytics.
- [x] Owner-confirmed product rule: no numeric-pattern-only split detection.
- [x] Owner-confirmed product rule: manual trades can span a confirmed action
  but cannot themselves prove one.
- [x] Owner-confirmed product rule: preserve original execution evidence and
  use a separate share-adjustment fact.
- [ ] Contracts and migration design approved for implementation.
- [ ] Import/mapping and Data Decisions behavior implemented.
- [ ] Exact reconstruction, metrics eligibility and cash-in-lieu behavior
  implemented.
- [ ] Focused verification and final visual review completed.
