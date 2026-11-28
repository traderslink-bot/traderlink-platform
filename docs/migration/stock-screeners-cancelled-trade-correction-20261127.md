# Stock Screeners cancelled-trade repair

Status: source qualification in the assigned correction lane; DO NOT DEPLOY.

The owner-directed POM repair must replace an old cancelled-trade peak in prepared Screeners results, including already closed sessions. The old collector revisited only a rolling 15-minute tail and could indefinitely reuse a closed window. This record owns the downstream Screeners work, not the shared gateway, shared manifest, Company implementation or installed services.

## Source custody

Assigned checkout: `/home/traderlink/projects/stock-screeners-corrected-sip-20261127`.
The Coordinator materialized `1a422118d26cf0105d31856c3dcdd3d45ad7015d` to retain the installed calendar fix over `b95d9d80d1b9db8b8345f61fa1c101295407e773`, then `785eb5aff8d8bd2e6cedcfb447dcf9e209f8f5ab` for the reviewed shared revision transport. Shared transport author ref: `4b8d6f74ff6720ebd421d745a7ac24547d7f9738`. These refs are source identities, not deployment assertions. The feature author leaves commits/integration with the Release Coordinator.

## Implemented behavior

- Both collector entries can use the configured private gateway's shared legacy/neutral revision vocabulary. The worker-safe adapter uses the shared validator and wire codec without importing Platform's `server-only` client into the executable worker. Existing private publication/source-selection guards are unchanged.
- Each existing 100-symbol collection batch checks known gateway revisions before reusing its prepared intraday bars. A complete repair reads only affected five-minute buckets from corrected, complete, SIP, split-adjusted one-minute history. It checks symbol, basis date, pagination completion, ordering, OHLCV and an unchanged revision after the read.
- Verified sparse histories remain valid. A complete empty corrected bucket removes that bucket. Missing/malformed coverage is never converted to a zero-volume complete history. Malformed optional VWAP does not reject otherwise valid OHLCV.
- Repairs survive later raw-tail refreshes, empty metadata and metadata outages. A known pending, raced or failed repair withholds affected intraday metrics and retries; valid peer tickers remain usable. A successful empty revision reply means no known gateway revisions, not proof of upstream coverage.
- All existing session calculations run over repaired bars, including high/low/range, opening ranges, premarket-high references, volume, recent volume and VWAP where actual weighted inputs exist. There is no fabricated weighted VWAP, HLC3 substitution or new publication schema.
- Live VWAP bootstrap/reconnect checks revisions before accepting cached seeds and checks again afterward. Known corrections bypass the old seed cache and require corrected history. Pending/raced histories stay partial for that ticker. A socket cancellation/correction clears both the cached last price and live VWAP; later frames cannot resend the locally retained cancelled price.
- Moomoo observations stay supplier-owned. A newer broker snapshot that reduces a range/volume invalidates only that ticker's own history caches. Older snapshots cannot restore it. If broker history still contradicts its newer snapshot, the affected session's history metrics stay unavailable until the broker read catches up. Alpaca prices never become broker quotes.
- The earlier original-calendar-range fix remains in both entries and the collector. No UTC rollover fetch, stock-universe change, interval change, service restart or database migration is introduced.

## Verification and limits

The finite guarded checks and exact logs are in `data/screeners-pom-corrections-20261127/`. The saved POM fixture came from the existing owner-authorized replay at `/home/traderlink/preview-runtime/pom-chart-correction-j8wbobtf/pom-bars.json`; it is stock candle data, not account data. The publication check runs the real isolated collector, atomic pack publisher, store and ordinary Run screen service for two fixture identities. No hosted accounts were created or used.

The first cohort passed 50 tests/lint but found four test-fixture TypeScript errors. Those errors were fixed; original attempt-1 logs remain. A second cohort passed 52 tests, lint, types and both offline entry bundles. A final coherent cohort covers the additional broker-history lag and seed revision-race cases; its actual result is recorded below after settlement. No bundle is executed against an installed worker. Borrowed dependencies remain read-only; test caches stay in the case directory.

Exact runtime acceptance is separate:

- Full snapshot correction follows the existing collector cycle (five minutes while active); this patch does not add an instant full-pack publication trigger. Socket cancellation invalidates local live price/VWAP at the existing live flush cadence. No claim of two-second correction publication, all-stock capacity, live provider acceptance or Scanner/Chart performance acceptance follows from source tests.
- The current shared history overlay qualifies revisions on its current basis day. A known older-day revision is withheld rather than silently relabelled onto another split basis. Older-basis repair needs verified archive/basis evidence from the shared owner.
- The current shared corrected candles carry OHLCV and may omit true weighted values. In that case affected live VWAP remains unavailable, including after reconnect. It can recover when a complete corrected weighted history is actually supplied; otherwise the next unaffected session is the ordinary recovery boundary.
- A gateway that forgets a correction across a restart before this process has observed it cannot be diagnosed from an empty revision manifest alone. Durable shared revision/archive coverage is a shared-owner boundary.
- Future installation must coordinate the gateway route first and preserve both existing neutral contract flags, provider selection/revision, stored packs and the calendar provenance fix. No installation, deployment, provider request, configuration mutation or live publication is performed by this work.

Final guarded cohort settled at `2026-11-27T18:55:25.505439Z`: **53 tests in nine files passed**, lint zero warnings/errors, reachable TypeScript over four roots / 458 source files zero diagnostics. Both worker entries bundled offline; the live entry has 37 inputs and only Node built-in externals. Source checks introduced no npm/native runtime dependency. All three child processes settled, the owned QA marker was removed, and the common guard was released. The earlier failed fixture-type result and the earlier passing cohort remain in `attempt1-*` and `attempt2-*` records. The final exact source-only handoff patch/manifest are recorded alongside these receipts; neither is a deployment artifact.
