# Watchlist Setup Results

Date: 2026-10-18

Owner-approved addition to the [setup detection plan](watchlist-trade-setup-detection-plan.md). All three aggregation findings are corrected locally and pass the latest regression QA below. Production, native live data and owner visual acceptance remain separate. No deployment, notifications, provider requests or settings changes performed.

## Correction and final QA

Outcome rules are now `setup-follow-through-v2`. Exact price comparisons use four machine-epsilon units at the price's own scale to eliminate arithmetic noise only; they do not round source prices to cents, invent ticks or create percentage tolerances. A decimal 0.11 high now reaches the benchmark calculated from a 0.10 close and 0.09 tested low. Real sub-cent differences remain meaningful, and exact low touches remain distinct from losses.

Recorded stages are now accumulated independently of candle-series compatibility. Outcome calculation uses only the earliest retained confirming record's series and adjustment, never a mix of incompatible prices. Later series changes retain their stages, references/revision trail and an explicit audit diagnostic. Missing compatible candles produce incomplete data, not an erased confirmation. Equal-time confirming records use a deterministic identity tie-break; reverse scan order produces the same result.

Every record is cloned and fully validated for the fields consumed by aggregation before any counter, bar, episode, stage or revision changes. Validation covers nested instances, references, transitions/reasons, candle values/times/volume, calendar shape/session calculations and settings identity. Rejected records leave existing state unchanged. Owning the snapshot also prevents later caller mutations from changing the retained calculation.

Passing regression receipt: `data/watchlist-setup-validation/results-edge-qa-1792362223170-c58739f6/results.json`. It preserves the three original reproduction scenarios and adds 130 assertions covering five price scales, true near misses/losses, reverse record order, timestamp ties, compatible versus incompatible histories, missing confirming-series candles, twelve malformed nested-field cases both before and after valid input, and snapshot ownership. The earlier failing receipt remains unchanged.

The existing 1,706 focused assertions pass again (1,264 recorded-engine/stat reconciliation, 48 outcome, 34 component, 65 actual-handler/storage, 27 shared-runtime and 268 existing Indicator assertions). Together with the additional 130 assertions, this is 1,836 counted assertions, plus the original-finding and recovery/concurrency probes. Nine-ticker recorded receipt: `data/watchlist-setup-validation/1792362230357-e741b12c/results.json`. Recovery and spacing/cooldown receipts: `recovery-qa-1792362250340-b51144bf/results.json` and `concurrency-qa-1792362250608-21ca6a0c/results.json` under the same validation directory. No duplicate transport was observed in the exercised scenarios.

Focused TypeScript over the pure results module, recorded verifier and admin component graph reports zero diagnostics. Scoped whitespace checks pass. Final source review found no new actionable issue in this correction slice. Only the results accumulator, its two focused test scripts and documentation changed; the detector engine, feed/admission/transport, routes, UI markup, owner approval and delivery behavior were not modified. Existing Help remains accurate and needs no wording change. Actual browser rendering and native live capacity remain unverified; no application build was run.

## Earlier QA findings

The earlier owner-requested follow-up QA on October 18 reproduced these issues against the actual results accumulator. All three are now resolved above. Original immutable failure receipt: `data/watchlist-setup-validation/results-edge-qa-1792362073007-4a8e43e5/results.json`; the script now asserts corrected behavior instead of expecting the defects.

1. **Exact decimal benchmark hits can be missed.** With confirmation close 0.10 and tested low 0.09, ordinary binary arithmetic computes the objective as 0.11000000000000001. A real candle high of 0.11 is then classified as neither rather than followed through. The outcome comparison needs decimal-safe arithmetic or a machine-precision comparison, not a trader-sized percentage tolerance or ticker-specific rule. Both upside and downside boundary comparisons need regression coverage.
2. **A changed candle-series identity can discard recorded stages.** A forming instance in one accepted series followed by confirmation of the same instance in a changed series reports zero confirmations and not confirmed. The accumulator skips the whole subsequent record for that episode. Keep stage history independent of price-series compatibility; explicitly separate or qualify outcome evidence rather than erase a recorded confirmation. Add an order-independent replay test and keep incompatible candle prices isolated.
3. **Rejected malformed records can partly contaminate totals.** `add()` mutates its series and episode maps before validating all nested fields. A missing diagnostics array throws after creating a confirmed episode; the route catches it as unreadable, yet results still contain one followed-through occurrence with zero recorded confirmations. Validate the entire record before mutation or make ingestion atomic, so skipped records contribute no bars, stages, instances or outcome denominator. Test malformed records before and after valid evidence.

All three are reproduced fault scenarios, not claims that these states occurred on the hosted app. Normal duplicate-refresh and recorded-stage reconciliation tests still pass. All 1,706 existing focused assertions reran successfully, including 1,264 engine/stat reconciliation checks across nine recorded tickers; 48 outcome checks; 34 component checks; 65 handler/storage checks; 27 shared-runtime checks; and 268 existing Indicator checks. Recovery/concurrency probes also pass. Fresh recorded receipt: `data/watchlist-setup-validation/1792362079483-9a332d8f/results.json`.

No regression was found in the exercised detector/shared-feed/Indicator/member/admin/authorization behavior. The audit UI correctly distinguishes retained history, missing data, same-candle ambiguity and measured denominators in the tested normal cases, but the findings above mean those totals cannot yet be accepted as fully correct. This pass added only the offline reproduction and documentation. No provider requests, app data/settings writes, notifications, service changes, Git mutation or deployment occurred. Actual browser layout/native live capacity remain unverified. Earlier implementation receipts below are historical, not a waiver of these findings.

## Implementation contract

- Add an expandable Setup Results section inside Setup Detection, not ticker-row controls. Load only on demand. Include date, ticker, session, setup and observation-period filters, stage totals and paginated episode audit details.
- Count each publication, rules version and setup instance once per stage across repeated saved evaluations. Reclaimed is a separate VWAP stage. Confirmation and later failure remain separately counted. Never infer a stage that was not recorded.
- Reuse retained accepted Moomoo candle evidence. No new provider/AI calls, timer, detector changes or publication/approval changes. Scan bounded retained files serially, with limits and read failures disclosed. Results represent retained history, not lifetime totals; archived publications remain inspectable.
- Outcome benchmark version 1: confirmation candle close is the observation price, tested low is the lower boundary, and the upside benchmark is close plus the distance to that low. Evaluate only subsequent completed 1m candles in the same session over 5, 15, 30 or 60 minutes. A move to the upside benchmark before a low below the lower boundary is follow-through. The opposite order is low lost first. Both within one candle is unclear. Exact touch of the tested low is not a loss. This is an observation, not a trade fill or profit claim.
- No trigger, missing confirmation candle, invalid boundary, missing intervals, session end or unfinished periods are separate statuses. Do not count these as failed outcomes. Report observed highest/lowest movement and coverage separately, without inventing intrabar order or missing volume.
- Separate historical discoveries from readings first observed live. Include observed/recognized times, rules/config revisions, transitions/reasons, frozen confirmation references, input revisions, diagnostic evidence and replayable outcome candles in the audit. Preserve adjustments and publication identities.
- QA: deduplication, distinct activations/rules, stage transitions, corrected candles, all outcome orderings, gaps, partial/session-ended windows, filtering/pagination and owner-only access; existing setup/feed/UI checks remain required at the finished-slice checkpoint.

## Plan QA

Reviewed before coding. Resolved ambiguous success by naming an explicit distance-based price benchmark; confirmation is not success. Preserved retained-history limits, per-stage denominators, same-candle ambiguity, historical-discovery context, no extra Moomoo requests and independent owner approval.

## Completion

- [x] Pure retained-evidence aggregation and outcome calculations
- [x] Read-only owner API and serial bounded storage reader
- [x] Admin summary, filters, pagination and audit details
- [x] Help, focused checks and final QA

## Implemented source

- `src/lib/live-watchlist/setups/setup-results.ts`: pure deduplication, stage counts, 5/15/30/60-minute outcome rules, continuity/session bounds, rate denominators, filters, audit projection and 25-occurrence pagination. Publication and rules versions remain distinct. Latest accepted corrected candles supersede older observations; confirmation references come from the earliest retained confirming evaluation. Input revision links are ordered by evidence receipt time, not filename or UUID order.
- `src/modules/watchlist/server/setups/setup-store.ts`: serial read-only iterator over retained evidence and latest records, including archived publications. No storage initialization, file pruning or mutation during reads; cancellation and corrupt records are handled explicitly.
- `app/api/admin/watchlist/setups/results/route.ts`: existing owner authorization before access, validated filters, private/no-store responses, one in-flight scan, sanitized errors and exact retained-input export. Missing exports return unavailable rather than substituting newer data.
- `app/(dashboard)/admin/watchlist/watchlist-setup-results-panel.tsx`: expandable Setup Results inside the existing Setup Detection panel. No automatic request on mount/open. Explicit load, date/ticker/setup/session/rules/period filters, stage/outcome tables, visible denominators and per-occurrence audit with candle evidence and full input links. Mobile horizontal table scrolling, labelled controls, click/tap column explanations and abort on unmount.
- Narrow integration in the existing admin panel and shared setup CSS. Help explains the measurement, exclusions, retained-history limit and no-provider behavior. Existing detector, shared feed, member card, approval and notification logic are unchanged.

The reader processes at most the existing 100 MB/5,000 managed files. Aggregation additionally caps 512 series, 100,000 unique minute bars, 12,000 bars per series and 5,000 occurrences; reaching an aggregation cap marks the report partial. Corrupt or concurrently rotated records are counted as unreadable. These are retained-history statistics, not a durable lifetime counter. No new migration, dependency or credential is required.

## Verification

All checks ran offline with bounded heaps and no application build or server:

- 48 pure results assertions: deduplicated refreshes, distinct publications/rules, multiple stages, corrected candles independent of scan order, exact low touch, both-boundary ambiguity, missing confirmation/reference/history, live versus historical discovery, all four horizons, early close and pagination/filtering.
- 1,264 recorded-engine assertions across BDAI, LOOP, WFF, WETO, DRMA, YYAI, SHFS, RCT and TCRT. The extra 153 reconcile each retained stage total to unique actual detector transitions across every ticker and ensure repeated identical snapshots do not inflate totals. Receipt: `data/watchlist-setup-validation/1792361907528-b42f3945/results.json`.
- 65 actual-handler/virtual-storage assertions, including owner-only results access, invalid date/range/kind/horizon/evidence parameters, exact-input retrieval/expiry, read failure recovery, no-store, serial evidence enumeration, corrupt-record reporting, cancellation and zero writes during reads. Existing settings/access/retention tests remain intact.
- 34 actual-TSX harness checks, including explicit-load-only results, duplicate-click suppression, loading/disabled controls, summary display, filter change clearing stale results, cancellation, and earlier member/admin checks. This uses React/browser/MUI doubles, not real browser painting or layout.
- 27 actual shared-runtime checks and 268 existing Indicator regressions passed again. Recovery and concurrency fault probes also pass: `data/watchlist-setup-validation/recovery-qa-1792361933099-a1025e8e/results.json` and `concurrency-qa-1792361935079-6609814e/results.json`. No duplicate transport observed in the tested cases.

Total: 1,706 counted assertions, plus the separate recovery/concurrency probes. Focused TypeScript reports zero diagnostics in the new/changed result, storage, route and component files. Including the route's wider imported application graph exposes the same 24 pre-existing missing migration imports in the unrelated manifest; this is not a whole-app typecheck or build pass. Scoped whitespace checks pass.

React checklist review kept on-demand data loading, one request per click sequence, disabled filters during loading, abortable requests, labelled form fields, table captions/row and column headings, mobile overflow, keyboard-operable explanations and independent error states. The existing dashboard shell and member card were not redesigned. Documentation skill kept outcome rules and retained-history limits beside their statistics; React guidance did not replace the app's approved styling.

## Final boundary

No provider/AI calls, live application storage/settings changes, notifications, migrations, service restarts, Git mutations or release actions. No Setup Results is yet available on production. Counts begin with whatever valid detection evidence the hosted system has retained; they cannot recover history that was never saved or was rotated away. Browser visual acceptance and native live performance remain unverified. The three deferred setup families remain deferred.
