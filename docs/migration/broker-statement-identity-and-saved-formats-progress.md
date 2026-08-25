# Broker Statement Identity And Saved Formats Progress

**Status:** Beta hardening complete locally; coordinated release pending
**Controlling plan:** [Journal Import Simplification And Reliability Plan](journal-import-simplification-and-reliability-plan.md)

## Approved outcome

The trader names the broker before every CSV upload. That confirmed name is
attached to the import attempt and, after a successful manual or consented AI
mapping, to the saved mapping. A later upload can reuse a mapping only when
the Trade Tracker account, broker and statement layout all match.

If two brokers genuinely use the same layout, TraderLink keeps one saved
mapping for each broker. Matching columns alone never transfers a mapping from
one broker to another.

Import Trades does not list brokers publicly while early formats are being
collected. Saved mappings remain private implementation data and never claim
that a broker is globally supported.

## Checklist

- [x] Require broker name before statement preview and persist it on the
      existing import-attempt record.
- [x] Carry the confirmed broker into the consented AI worker and override any
      model-supplied broker label before private preview or import.
- [x] Restrict saved generic mapping lookup to the exact broker and layout.
- [x] Keep broker mapping discovery private; no early public broker-support
      list is shown in Import Trades.
- [x] Align Import Help Center guidance.
- [x] Run focused static checks and present the integrated UI for owner review.
- [x] Resume the separate live AI repair test with a new synthetic statement.
- [x] Re-run the repaired live AI import through completion, saved-format reuse
      and Journal Administration evidence. On 2026-08-22, an unused synthetic
      statement completed the consented AI path and committed with decisions:
      three preserved source rows and two executions. A separate four-row CSV
      using the exact same broker and layout then imported immediately without
      another AI request, adding all four executions. The owner verified the
      first import in Journal Administration; the required follow-up decisions
      remain visible rather than being silently treated as complete trade facts.

## Ten-statement live acceptance ledger

**Acceptance rule:** A row counts only after the correct account-scoped flow
reaches a committed import and its remaining Data Decisions are shown and
fact-minimal. A queued review, a preview, a retry, or an import in another
Journal account does not count.

| Candidate | Account and statement identity | Mapping | Import outcome | Required decisions | Final status |
| --- | --- | --- | --- | --- | --- |
| Test 01 | Primary Journal, Repair Test One | Completed by AI | Committed: 4 preserved rows, 2 executions | 1 statement-period decision | Complete |
| Test 02 | Primary Journal, Repair Test Two | Completed by AI | Committed: 4 preserved rows, 2 executions | 1 statement-period decision | Complete |
| Test 03 | Primary Journal, Repair Test Three | Completed by AI | Committed: 4 preserved rows, 2 executions | 1 statement-period decision | Complete |
| Test 04 | Primary Journal, Repair Test Four | Completed by AI | Committed: 4 preserved rows, 2 executions | 1 statement-period decision | Complete |
| Test 05 | Primary Journal, Repair Test Five | Completed by AI | Committed: 4 preserved rows, 2 executions | 1 statement-period decision | Complete |
| Test 06 | Primary Journal, Repair Test Seven | Completed by AI | Committed: 3 preserved rows, 2 executions | 1 statement-period decision | Complete |
| Test 07 | Primary Journal, monthly day-trader layout A | Completed by AI | Committed: 45 preserved rows, 44 executions | 1 statement-period decision | Complete |
| Test 08 | Primary Journal, Repair Test Nine | Rejected by preview | No import; AI omitted the observed long-side tokens | 0; validator correctly blocked import | Awaiting prompt correction release |
| Test 09 | Primary Journal, monthly day-trader layout B | Not started | Not started | Not started | Pending |
| Test 10 | Primary Journal, Test CSV 11 | Completed by AI | Committed: 3 preserved rows, 2 executions | 1 statement-period decision | Complete |

The local candidate inventory contains thirteen distinct synthetic CSV files.
The ten ledger candidates are Tests 01–05, 07–11. The Test CSV 11 same-layout
reuse import is separate evidence and does not count as an additional ledger
row. A fresh authenticated history read confirmed the primary account contains
the committed Test 01 and Test 11 batches; the Import Trades page itself had a
stale empty-history render after the Admin OAuth refresh.

## Beta format-learning hardening

- [x] Preserve broker/layout mappings privately by Trade Tracker account;
      no early public broker-support list is shown.
- [x] Keep unmapped or non-trade rows as source evidence and visible follow-up
      rather than silently creating executions or turning bad values into zero.
- [x] Accept explicit leading currency symbols, accounting negatives, standard
      thousands grouping and unambiguous decimal-comma amounts before decimal
      validation.
- [x] Teach the consented AI mapper to preserve observed long-side tokens such
      as `OPEN_LONG` and `CLOSE_LONG`, while independently rejecting anything
      it did not actually map from the statement.
- [ ] Extend timestamp handling only with an evidence-safe policy for date-only
      statements and offset/fractional timestamps; a missing execution time is
      not invented.
- [ ] Add verified broker adapters only after consented real-statement and
      repeat-import evidence. Synthetic layouts remain test fixtures, not a
      public support claim.
