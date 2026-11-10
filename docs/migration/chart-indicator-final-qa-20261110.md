# Shared chart final QA — November 10, 2026

The owner clarified that the goal is familiar standard indicators with practical configuration, not exhaustive TradingView parity. This review covers the six indicators and every control currently offered. Indicator linking and Earnings VWAP are outside this pass. No production deployment is authorized.

Each complete inventory includes independent numerical/reference tests, preference parsing/storage/API isolation, native shared-chart desktop/mobile controls and saved setup, all six chart timeframes, and the existing VWAP bands, calculation timeframe/close, visibility, events, offset/calendar and history checks. Shared price-only scaling and main/scanner date/crosshair checks include actual mobile touch. See the adjacent JSON for exact immutable source, commands' case names, outcomes and generated logs. The Python runner records each case even if another fails; it does not call a failed inventory green.

| Inventory | Source | Result |
| --- | --- | --- |
| 1 | c0da72694352817d83ce37beb360fd6c291f0b49 | Complete with findings: 11 cases passed; unit case had 414 passing tests and 3 obsolete expectations |
| 2 | 7b9cbb5cdbc0a18ae51048bb3d892f2cbf68e9ed | All 12 cases passed; 417 tests passed |
| 3 | 7b9cbb5cdbc0a18ae51048bb3d892f2cbf68e9ed | All 12 cases passed; 417 tests passed |

Inventory 1 findings were limited to tests retaining earlier SMA-seeded EMA, flat RSI 50, and delayed MACD warm-up assumptions. Independent finite-weight and native-source references support the corrected implementation. The correction batch updates those three expectations without changing chart calculations. A direct native current-candle event assertion is also added for the standard plots, complementing the existing VWAP live-update checks.

These are isolated synthetic HTTP/EventSource and disposable database checks. They do not claim a new production provider, OAuth or live-account acceptance check. Owner visual acceptance and deployment remain separate.

## Final outcome

Three complete inventories were executed for each indicator: 18 indicator QA passes in total. The first inventory's three obsolete expectations were corrected; both follow-up inventories passed completely. No runtime fixes were required during these final inventories. This does not mean the first inventory was green.

| Indicator | Inventory 1 | Inventory 2 | Inventory 3 |
| --- | --- | --- | --- |
| VWAP | Passed | Passed | Passed |
| EMA | Obsolete seed expectation corrected | Passed | Passed |
| SMA | Passed | Passed | Passed |
| RSI | Obsolete flat-market expectation corrected | Passed | Passed |
| MACD | Obsolete warm-up expectation corrected | Passed | Passed |
| Bollinger Bands | Passed | Passed | Passed |

The final source graph has 52 selected TypeScript roots, 1,490 source/declaration files and zero diagnostics. Focused lint on the updated indicator math, editor and tests passed with zero warnings. Every invoked verifier matches the saved source. The older unused basic VWAP verifier differs in the shared working tree and was neither invoked nor absorbed.

Measured shared-chart checks confirm that price-only scaling preserves candle height and the exact logical viewport while VWAP values remain unchanged. Native desktop and mobile-touch checks confirm readable moving bottom captions, pinned-date collision handling, and restored labels after pointer/tracking exit in both main and compact chart surfaces. Current screenshots were visually inspected. Both consumers import the same chart component.

Numerical coverage includes all eight price sources across all six timeframes, independent EMA/SMA/RSI/MACD/Bollinger references, exact rational weighted VWAP/bands, and all offered smoothing choices. Current-candle events update the standard native plots immediately in the isolated fixture. Saved custom periods/styles survive reload and symbol changes; preference API checks cover identity isolation, stale revisions, malformed bodies and denied requests.

The source allowlist in JSON is relative to the ordinary chart baseline, not an instruction to publish against a stale release parent. The Coordinator must refresh integration/release state before any later owner-authorized release. Use the saved branch source rather than the mixed working-tree renderer/gateway/client, which also contain separate parked work. No production build was run against that mixed checkout. No push, deployment, migration, service restart or preview switch occurred.

Technical indicator work is complete and ready for owner review. This is not owner visual acceptance or production readiness certification for unrelated chart features.
