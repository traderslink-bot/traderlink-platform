# Trade Analyzer Evidence Drilldown Progress

**Plan:** [Trade Analyzer Evidence Drilldown Plan](trade-analyzer-evidence-drilldown-plan.md)

## Current checkpoint - 2026-08-16

- [x] Owner approved scalable Candle Pattern occurrence drilldown.
- [x] Owner approved lazy one-chart replay in a desktop drawer and mobile
  full-screen dialog.
- [x] Owner approved exact Daily Trade Tracker deep links.
- [x] Owner confirmed Analyzed Trades must be a neutral directory of all
  analyzed trades.
- [x] Confirmed the existing detailed table belongs under Green-to-Red.
- [x] Audited saved pattern facts, current analysis revisions, the Analyzer
  writer, the existing Daily Trade Analyzer chart and Trade Tracker focus state.
- [x] Locked the indexed projection, bounded query and responsive UI contract.
- [x] Implement occurrence projection migration 0059 with an immutable,
  account-indexed occurrence table and existing-snapshot backfill.
- [x] Register migration 0059 in the platform manifest and apply it through the
  controlled local migration checkpoint.
- [x] Persist new occurrence rows with Analyzer snapshots when the projection
  is present, in the same Analyzer transaction.
- [x] Implement bounded occurrence and analyzed-trade query services/routes,
  including the pre-migration immutable-snapshot compatibility read.
- [x] Implement the occurrence explorer and lazy replay drawer/dialog.
- [x] Implement exact Trade Tracker focus links for trade, execution and chart
  interval.
- [x] Replace the Analyzed Trades table with the neutral index while keeping
  the detailed opportunity/capture table under Green-to-Red.
- [x] Remove section-level Trade Analyzer question marks so each page retains
  only its top-right Help link.
- [x] Align Candle Patterns, Green-to-Red and Analyzed Trades Help content.
- [x] Complete focused desktop/mobile browser review.
- [ ] Receive owner visual approval.

## Coordination

- The concurrent Trade Explorer session released its files before responsive
  integration. Daily Trade Tracker files and routes remain reserved for chat
  `01a00bea-b754-7193-92ac-e3ae7a4a54a8`; this review did not edit them or
  follow a deep link into the Tracker.
- No migration number was assumed until the live manifest audit. The audit
  found 0058 as the current final migration; this slice may use 0059 if that
  remains true immediately before registration.
- The active port 3010 process will not be stopped or replaced.
- No automated test suite, commit, push or deployment ran in this active
  UI-approval checkpoint. The owner-authorized controlled migration 0059
  checkpoint is recorded below.
- Focused browser acceptance confirms the grouped pattern cards show one **View
  occurrences (N)** action per pattern and the bounded endpoint returns the
  seven current Rejection Upper occurrences with exact trade, execution,
  timeframe, result and Tracker-date facts. Desktop renders the bounded table
  and a 760-pixel lazy chart drawer. At 390 and 320 pixels, occurrences render
  as cards and chart review uses a full-screen dialog; the exact Tracker deep
  link is present but was not followed. The saved chart loaded successfully,
  mobile controls are at least 44 pixels high and the 320-pixel and 844 x 390
  presentations have no horizontal overflow, duplicate IDs, console errors or
  runtime error surface.
- The final source audit passed `git diff --check` for the complete bounded
  slice. It also moved the exact Trade Tracker scroll target to the whole trade
  wrapper so a deep-linked trade remains focusable when its compact mobile row
  is hidden by the automatically expanded review.
- The responsive pass now uses phone-native cards for grouped Candle Pattern
  rows, Green-to-Red supporting trades, MFE/MAE evidence and the neutral
  Analyzed Trades index. Green-to-Red and MFE/MAE actions now open the exact
  Tracker trade instead of only its date.
- The bounded occurrence service continues to read immutable Analyzer
  snapshots when migration 0059 is absent, so an older database does not lose
  the bounded evidence view. The protected local database now uses the indexed
  projection after the controlled checkpoint below.
- The protected pre-0059 online backup and independent restored copy are stored
  under checkpoint `trade-analyzer-0059-pre-20260816T191357Z`. The backup and
  restored main files match exactly, all registry/table/page evidence matched,
  and recovery authority was verified.
- Migration 0059 applied as the only new migration. The current database now
  has 59 registry rows and 70 occurrence rows from 17 Analyzer versions across
  8 patterns. The projection count exactly matches the qualifying immutable
  snapshot facts; both indexes and all three scope/immutability triggers are
  present. Schema digest, foreign keys, quick check and integrity check pass,
  and the WAL was checkpointed back to zero bytes.
