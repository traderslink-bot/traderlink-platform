# Watchlist candle preparation and status correction

## Scope

Owner requested diagnosing OLOX's missing price and correcting misleading private/review statuses. Preserve categories, approval and publication controls. No analysis-generation or notification action is authorized by this source repair.

## Evidence

Hosted OLOX logs show moomoo_candle_invalid on page 1, requested October 5 04:00–20:00 ET. Isolated read-only response inspection returned HTTP200/ret_code0, 960 rows, 959 valid. One candle at timestamp1791207060000 had open/high/low0.8465 but close0.8415, below its low. Existing non-complete-history provider mode rejected the entire response; Runtime converted the bridge failure into missing reference price. This was not a Private category selection or a market-closed prohibition.

## Fix

- Watchlist candle bridge uses the provider's existing completeHistory mode: retains valid rows, excludes malformed rows, marks partial coverage. Shared provider code and Analyzer consumers unchanged. This also uses existing bounded eight-page completion handling and per-request timeout.
- Failed no-draft status becomes Analysis failed — no analysis available. Preparation operations say preparing analysis / analysis preparation failed. Missing-price error references the requested trading session, not private analysis.
- No new publication block, retry, automatic AI call, invented candle or live write. Existing good draft review status unchanged.

## Verification

Real OLOX response replay with candidate provider mode retained959 and excluded the malformed timestamp. Last returned candle close1.62 at the session endpoint; this is provider output, not a claim about Runtime's final reference selection. Hosted installed mode still returned503, as no deployment occurred. Isolated hosted candidate-module loading lacked decimal.js; moved replay evaluation to local dependencies without installing or altering production.

Focused offline checks cover malformed+valid mix, all-invalid/empty unavailable, genuine zero volume, unchanged values, failure labels and TS syntax. No broad suites/server/build/OpenAI/notifications. Four read-only provider requests used during diagnosis; no historical record was rewritten.

Source complete; coordinated release and live generation verification pending. Help reviewed: no control/workflow change; no Help change required. Keep separate from pending checkbox placement commit.
