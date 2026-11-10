# Additional owner-requested indicator QA — November 9, 2026 (Eastern)

A fresh full QA inventory was run against saved source fc4ab49b4f01e7d152b229d8bc4be44423f63742. All 12 inventory cases passed. The 25-file unit suite passed all 417 tests; immutable TypeScript qualification reported zero diagnostics.

| Indicator | Result | Coverage |
| --- | --- | --- |
| VWAP | Passed | Weighted values/bands, sources, settings, visibility, anchors, offsets, history, live updates |
| EMA | Passed | Custom/multiple periods, sources, smoothing, styles, persistence, live updates |
| SMA | Passed | Custom/multiple periods, sources, smoothing, styles, persistence, live updates |
| RSI | Passed | Wilder calculation, length/levels, sources, smoothing, persistence, live updates |
| MACD | Passed | Fast/slow/signal settings, moving-average choices, plots, persistence, live updates |
| Bollinger Bands | Passed | Length/basis/deviation, sources, plotted bands, persistence, live updates |

The applicable matrix includes 1m, 5m, 15m, 1h, 4h and 1D; desktop 1200px and mobile 390px; save/reload/symbol changes; malformed settings and account-isolation checks. Shared price-only scaling, history loading, and main/compact date/crosshair checks also passed, including native mobile touch.

These are isolated synthetic HTTP/EventSource and disposable database checks, not a fresh production-market/account integration test. No indicator implementation changes were needed. No deployment, preview switch, migration or service restart occurred. Exact case outcomes and generated log paths are preserved under additional_owner_requested_runs in chart-indicator-final-qa-20261110.json.
