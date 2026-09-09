# Additional red days and green-to-red Demo proposal

Status: owner approved all three no-profit-taking trades and the modeled fee correction. Source implementation is complete; production acceptance is pending. See [release handoff](demo-v10-release-handoff-20260909.md).

Owner clarification: every new green-to-red trade takes no profit. Each has exactly one buy and one sell closing the entire position at a loss. No partial exits, scaling out, or realized profit before the losing exit. The profitable peak is unrealized only.

Use three additional long trades, one each on August 5, 14 and 28. Existing executions remain unchanged. The proposed positions fit between existing trades of the same ticker, use whole shares, and each fill is below its saved candle volume.

All times are New York. Prices below preserve saved close precision. Peak P/L is unrealized whole-position gross P/L at a completed one-minute close, not an execution or intraminute high. Each position reached meaningful profit before falling below entry, and no later completed close recovered to entry before the proposed exit. This does not claim the stock never recovered after the position closed.

| Date / ticker | Shares | Entry | Profitable peak | First red after peak | Losing exit | Gross result | Net result |
|---|---:|---|---|---|---|---:|---:|
| 2026-08-05 YXT | 422 | 4:05 PM @ $21.4363 | 4:10 PM @ $25.19; +17.51%; $1,584.06 | 4:20 PM | 4:27 PM @ $17.17; -19.90% | -$1,800.38 | -$1,801.38 |
| 2026-08-14 WETO | 1241 | 8:28 AM @ $10.37 | 9:57 AM @ $12.95; +24.88%; $3,201.78 | 10:08 AM | 10:22 AM @ $8.92; -13.98% | -$1,799.45 | -$1,800.45 |
| 2026-08-28 FTFT | 4619 | 4:23 PM @ $1.93 | 4:31 PM @ $2.39; +23.83%; $2,124.74 | 4:37 PM | 4:55 PM @ $1.5403; -20.19% | -$1,800.02 | -$1,801.02 |

## Daily impact

| Date | Current intended net | Proposed intended net |
|---|---:|---:|
| 2026-08-05 | $1,292.09 | -$509.29 |
| 2026-08-14 | $1,290.77 | -$509.68 |
| 2026-08-28 | $1,369.69 | -$431.33 |

## Full August result

- 170 trades / 817 executions; 15 green days and 5 red days (August 5, 11, 14, 28, 31).
- Gross P/L $16,721.01; modeled fee cost $408.50; intended net P/L $16,312.51.
- 32.63% on the proposed $50,000 opening balance; ending balance $66,312.51 assuming no other cash flows. No balance has been written.
- This deliberately lowers the earlier $21,715.37 / 43.43% intended net result. Keeping roughly 42% would require additional profits elsewhere, which are not included in this proposal.

## Fee prerequisite

These net figures deduct $0.50 per execution as a cost. The live Demo fee-sign defect remains unresolved; current Calendar/Analyzer values incorrectly add those positive cash-effect fees. Before applying this proposal, the Demo fee correction needs an explicit version-preserving implementation and production verification; real accounts must remain untouched.

## Evidence

Saved normalized sessions embedded in `src/modules/journal/server/demo/packs/august-2026-additions.json`; existing execution intervals and per-day totals from `.local-logs/demo-august-final-execution-summary.json`. Local scripts performed proposal arithmetic and candle selection, not an application test/build or database materialization. No fresh Moomoo requests.
