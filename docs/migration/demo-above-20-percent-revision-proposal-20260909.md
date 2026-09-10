# All three Demo reversals above 20 percent

Status: owner approved and requested release. Implementation complete; production acceptance pending. See [version 11 handoff](demo-v11-release-handoff-20260909.md). Owner requested all three new no-profit-taking reversals above20%, with one closer to30%. Browser remains hands-off.

Saved one-minute close search, excluding existing same-symbol trade intervals, found the following pair while retaining approximately $1,800 losses and whole-position exits. Quantities stay below entry/exit candle volume and initial position cost below $18,000. No provider request made.

| Trade | Revised entry NY | Shares | Peak completed candle close | Peak stock gain | Full losing exit NY | Net loss |
|---|---|---:|---|---:|---|---:|
| YXT Aug5 | 2:48PM at21.43 |301|3:17PM at32.13|49.93%|4:57PM at15.45|1800.98|
| WETO Aug14 |8:06AM at10.17|1440|9:57AM at12.95|27.34%|10:22AM at8.92|1801.00|
| FTFT Aug28 |Unchanged|4619|2.39|23.83%|Unchanged|1801.02|

YXT entry1785955680/peak1785957420/first red after peak1785961200/exit1785963420. WETO entry1786709160/peak1786715820/first red after peak1786716480/exit1786717320. No completed close recovers to entry after that post-peak red point before exit. Earlier fluctuations before the eventual peak are not excluded. Times identify candle start; Analyzer can report completion one minute later.

Expected170trades/817executions/five red days remain. Monthly net16312.36 (prior16312.51); Aug5net-508.89; Aug14net-510.23. Fees remain one dollar per trade. Peak unrealized gross YXT3220.70 and WETO4003.20. These are synthetic executions derived from saved market closes, not real fills.

A YXT27.31% option was rejected because it recovered after the first post-peak red point. The proposed pair fulfills all three above20% and one nearer30% without that recovery. Owner approved YXT49.93% and WETO27.34%. Any implementation must append versioned corrections and update saved Analyzer, preserve prior pack manifests/notes/provenance, retain opt-outs, and release only through Coordinator. Do not edit immutable version10 JSON in place.
