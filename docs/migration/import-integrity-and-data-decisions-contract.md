# Import Integrity and Data Decisions Contract

**Status:** Accepted governing contract; Phase 3 implementation and focused verification are in progress.
**Owner module:** Journal
**Controls:** imports, source rows, executions, round trips, Data Decisions, and analytics eligibility.

## Purpose

TraderLink must retain the factual broker statement, identify deterministic quality problems, let the trader resolve factual ambiguity, and make metric eligibility visible. A strict problem in one round trip must not suppress unrelated valid round trips.

## Source-to-dashboard path

```text
Broker statement or manual Trade Tracker entry
  -> preserved source rows or manual provenance
  -> import preview and deterministic validation
  -> accepted executions or explicit row issues
  -> deterministic candidate round trips
  -> trader Data Decisions where facts are unresolved
  -> rebuilt eligible round trips
  -> shared analytics and dashboard coverage
```

## Authority rules

1. Broker source rows are retained unchanged alongside any normalized or corrected values.
2. The importer may determine technical facts: mapping validity, parsing, deterministic duplicates, required field absence, and arithmetic/grouping diagnostics.
3. The engine may flag a candidate execution or round trip as needing a decision. It may not guess a date, price, quantity, fee, symbol, side, intended grouping, or trader intent.
4. The trader decides factual corrections, exclusions, and intentional classifications from the evidence shown in Data Decisions.
   This includes supplying a reviewed statement coverage interval when the
   preserved source period is missing/conflicting, confirming whether each
   manually entered trading day is complete, or accepting the limitation
   without inventing complete coverage. A coverage action is bound to that
   source issue, exact manual trading date when applicable, and the Journal
   account's trading timezone.
   The available actions are issue-specific: an action that does not address the
   recorded problem cannot resolve it. An explicit accepted source limitation
   remains available when the source fact cannot be recovered.
5. Every user decision records the affected object, prior state, chosen action, reason, timestamp, and resulting rebuild version.
6. Dashboard inclusion is derived from resolved state and metric requirements, never from a hidden fallback.
7. Trader decisions control the factual record. Deterministic position arithmetic and metric prerequisites remain visible system rules; closing a non-zero position requires a supported execution or opening-inventory correction.

## Source-account assignment boundary

An unscoped parse preview may inspect a broker source account only inside the
server operation and may return privacy-safe aggregate evidence. It never returns,
logs, documents, or persists the raw account identifier. A workspace-scoped
preview requires an already confirmed source-account link and fails closed when
that identity is unmatched, conflicting, or ambiguous.

Normal product preview/import paths never auto-link a broker identity to a
Journal account. The initial one-owner private migration has one explicit
preparation exception: after verified backup and migrations, a narrow server-only
command may link the statement identity to the seeded account only when the
workspace contains exactly one active Journal account, zero non-superseded
identities for that source system, and no fingerprint conflict. The command
rechecks those facts and the exactly-one postcondition in one transaction. If a
prior run completed the link and then stopped, exactly one existing identity is
an idempotent no-write resume only when the in-process statement fingerprint
resolves unambiguously under complete configured retained HMAC authority to that
identity and the same sole active account. Another account, multiple identities, missing/unsupported
authority, mismatch, conflict, or ambiguity stops for factual trader review or
recovery. The command records only privacy-safe evidence. The scoped read-only
preview runs only after exactly one link is verified.

This Journal source-account assignment is distinct from login authentication.
The local `development_local` owner remains authoritative during development;
Discord-first public login and optional email/password remain deferred until
go-live preparation.

## Canonical ledger and upload-order independence

All broker-imported and manually entered executions belong to one canonical ledger. Each record keeps its source type and evidence, but source type does not create a separate trade or analytics population.

Statement upload order is irrelevant. Reconstruction uses the full accepted execution history for the affected owner, account, instrument, and currency in chronological order. A statement uploaded today may close an open position created by a statement uploaded later, or supply earlier history that changes subsequent round trips.

Every import is previewed against existing statement coverage and execution identities:

- an exact reimport is idempotent;
- overlapping statements link identical broker-identified executions instead of counting them twice;
- conflicting versions are contained in Data Decisions;
- similar rows without sufficient identity are not automatically collapsed; and
- an accepted replacement supersedes prior normalized facts while preserving the original evidence and decision history.

CSV header/data field-count disagreement is a blocking structural error because
the adapter cannot faithfully assign values to columns. The exact row remains
available in the preview evidence, but no authoritative import is committed.

When broker data later matches a manual execution, Data Decisions shows both sources. The trader decides whether the broker record supersedes the manual record, the manual record corrects the broker fact, or both are genuinely distinct.

## Deterministic round trips

Within an owner/account/instrument/currency chain, a round trip begins when net position changes from zero to non-zero. All partial entries and exits remain in the same round trip until net position returns to zero. The next execution after zero begins a new round trip, even for the same ticker on the same day. An execution that crosses zero is apportioned between closing the existing position and opening the opposite position.

Missing opening inventory, execution ordering that can change the reconstructed
allocation, or missing required facts contain the issue to the affected chain.
Same-time mixed sides that cannot change opening/adding/reducing/closing/flip
allocation remain usable. Later historical uploads or trader corrections
trigger reconstruction and may resolve an issue without changing unrelated
trades.

Containment is dependency-specific rather than an all-history symbol switch. A
missing price affects its round trip and price-dependent metrics; a missing
optional fee affects fee/net metrics; a missing position-changing fact affects
only the interval whose position path cannot be proved. A supported position
checkpoint or convergent deterministic path may re-establish position so valid
later same-symbol round trips remain eligible.

## Blocking versus contained issues

| Condition | Import result | Data Decisions result | Analytics result |
| --- | --- | --- | --- |
| Source cannot be parsed or safely mapped | Blocked preview; no authoritative commit | Show mapping/row errors | No records from that pending import |
| Duplicate or overlap ambiguity | Accept independent records and contain affected candidates | Show all sources, provenance, and conflict reason | Exclude only the affected candidate until resolved |
| Source account is missing, conflicting, or cannot be safely assigned | Block before authoritative commit | Require account identity confirmation/correction | No records enter the wrong account |
| Missing execution fact | Preserve row and flag affected execution | Trader corrects, excludes, or classifies after evidence review | Exclude dependent round trip from affected metrics |
| Unmapped execution or position row with known instrument/currency | Preserve its chain scope and recoverable event/checkpoint time | Trader supplies a matching execution/position fact or accepts the limitation | Hold only projections in the affected chain/time segment; accepting the limitation does not make them complete |
| Round trip does not balance or cannot be grouped confidently | Accept independent valid records; flag the candidate | Trader resolves grouping or exclusion | Candidate is not realized-P/L eligible |
| Legitimate remaining position | Accepted as open | Visible but not a failure | Show as open; exclude from realized P/L |
| Position-only non-zero holding with its opening execution outside available evidence | Pending decision | Trader may confirm the current holding or supply/correct supporting history | After confirmation, include only in open-position populations with entry/P&L coverage unavailable |
| Valid, resolved closed round trip | Accepted | No action required | Include when it meets the metric scope |

## Required user-visible coverage

Every Journal dashboard response that reports trade-based metrics must expose enough coverage to explain the result:

- included closed round trips;
- open round trips;
- pending Data Decisions;
- excluded or unsupported records by reason;
- source account, selected date/timezone, and currency scope; and
- whether each metric has complete, partial, or unavailable coverage.

Data Decisions must deep-link from coverage issues to the source rows, executions, and affected round trip. It must also deep-link back to the resulting trade or analytics view once resolved.

## Rebuild rule

Any accepted correction, exclusion, restoration, added missing execution, duplicate resolution, opening-inventory decision, or open/closed classification invalidates the affected execution chain, derived round trips, and dependent summaries. The first implementation rebuilds the complete owner/account/instrument/currency chain in chronological order and records the summary version/freshness. Source evidence and prior decision history remain intact. A later earliest-change optimization is allowed only if it proves the same result.

## Trading-day and note identity

Execution date/time, interpreted under the account's documented timezone/session rule, determines its trading day. Submission date does not. When executions from multiple dates are entered, whether through one future workflow or separate day workflows, the accepted records are assigned to their actual trading days.

Manual submission order is not evidence of execution order. Same-time manual
rows remain deterministically repeatable but unverified until a trader supplies
an explicit sequence when allocation would otherwise change.

General fact correction cannot supply an arbitrary execution sort key. The
server retains the prior key when the instant is unchanged and derives an
unverified key when the corrected instant changes. Only the dedicated bounded
ordering action can record trader-confirmed same-time sequence.

A manual entry proves that the entered execution occurred; it does not prove
that every execution for the account and trading date was entered. Each manual
trading date therefore starts with point-only coverage and its own Data Decision.
Only the trader's date-bound confirmation may add complete or partial daily
coverage. Opening inventory remains a separate factual requirement, so complete
daily coverage never silently means that the account began the day flat.

Daily notes and daily rule reviews use owner/account/trading-date identity. Trade notes, tags, and trade-level reviews use stable round-trip identity plus aliases across deterministic rebuilds. A round trip may span days: executions remain visible on their actual days, carried position is visible, and realized P/L defaults to the closing trading day unless a metric contract states otherwise.

## Explicit exclusions

The system must not convert missing facts into zeroes, include unresolved round trips in realized P/L, discard source rows merely to make a dashboard appear complete, show an entire import as unusable because one contained round trip needs a decision, or let the analytics engine make a factual trader decision.
