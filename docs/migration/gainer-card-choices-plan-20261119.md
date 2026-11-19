# Independent gainer card choices

Owner authorized implementation on November19: combined Top Gainers gains an automatic post-market switch setting; dedicated Day Gainers and Post-market Gainers become scanner-title dropdown choices for custom layouts. Default layout stays the same. Run QA and DO NOT DEPLOY.

## Design and data policy

Dropdown names: Top Gainers (Pre/Reg + Post), Day Gainers, Post-market Gainers. Reuse the existing title selector and card-options popover. The automatic switch is an accessible on/off control inside the existing popover, with no new toolbar row, blue action link or oversized field. It appears for the combined choice only. Day and Post-market are fixed views.

Combined cards default to existing behavior: daily basis through pre/regular; post-market basis after regular close. Turning automatic switching off keeps day-basis results updating through post-market. Day Gainers always uses the existing previous-regular-close result; Post-market uses the existing today-regular-close result only after regular close. Do not freeze the constituents or relabel one basis as another. Keep real price/percentage/flag/news/chart behavior and colors.

The existing engine already builds both results from one pass. This feature adds no scanner engine, market request, stream, subscription, poll or countdown. New choices replace content in existing custom-layout card slots, retaining geometry and per-card formats. Default widget positions/visibility are untouched.

Persist the switch per physical card slot in its saved layout, beside existing scanner assignment/view. Optional missing data defaults to current automatic behavior; no schema migration. Desktop normal mode saves immediately; edit mode Save/Cancel/Undo/Reset/named-layout selection preserve their existing meaning. Portrait and landscape use their separate existing layouts. Keep saved chart state unaffected. Dedicated choices and mobile tab labels reflect the actual selected scanner.

## Source boundary

Assigned provider-neutral worktree8d99 remains in use; no checkout, index/ref or release operation. Four existing UI supporting files match last verified93f exactly. Workspace client includes the prior held Scanner13 continuity postimage a7ef5bc12736bcaf2e757700cf64d28ee5b948b058cb7a6e2dbb88fd603c4829. All five preimages recorded externally before this separate owner-authorized UI overlay. Original Scanner13/QA3/Help/provider artifacts remain immutable. Root notified that the working client will intentionally gain this new feature overlay, not outage damage. No private publication/gateway/entry/config source changed by this UI task.

## Controlling QA inventory

- Independent Day/Post cards side by side, correct source rows/baselines, all three display formats, scanner-title selection and unchanged default widgets/geometry.
- Combined switch default, off and on; current result follows the shared session model, with no additional requests. Fixed Post view before its session has an explanatory empty state, not a connection failure.
- Separate card preferences; immediate persistence/remount; named layouts; edit Cancel/Save/Undo/Reset; missing/invalid preference parsing and existing older layouts.
- Desktop light/dark, mobile portrait/landscape and rotation. Verify menu width/scroll/tap access, title truncation/focus, close controls, chart/news actions and full view. Chart state unchanged.
- Relevant source tests, targeted types/lint, React hook/bundle/derived-state checklist. Resource-admitted isolated browser checkpoint after source batch passes; no real provider calls/production data in development.

Progress: implementation and first coherent source QA in progress. Acceptance/results will be added after actual receipts; source tests do not establish browser or live acceptance. No deployment or migration authorized.

## Discovery and correction batch

The default seven-card layout, dedicated side-by-side choices and per-slot format/switch persistence passed source and browser checks. Original82/83 source cases passed; the remaining named-layout expectation required a preference object to be absent, but normal hydration correctly normalized it to an empty optional map. Corrected the expectation to verify the previous layout has no changed switch value; all7 UI cases then passed. Added the actual Undo/Reset case; it also passed. Types9 paths and lint were clean. Both Light and Dark themes were exercised in actual-component tests.

Private isolated browser: default7cards/no new choices by default; desktop and390portrait side-by-side/custom formats/options/full-view/persistence passed.844landscape was initially blocked by a pending analytics-consent banner (ordinary response had not been completed). On a fresh isolated run, responded normally to Reject optional; landscape then passed with no forced clicks/hidden overlays. Both runs also passed simulated regular→after-hours model switching. Chart preferences deep-matched before/after and no page exceptions were observed. Browser wrappers and owned previews ended normally. View-popup action text was changed to inherit normal text color after visual discovery of old blue menu choices; relevant UI cases/lint and landscape visual check passed afterward.

Final data-edge discovery: the existing Day Gainers retention book used a session-scoped key, so established regular-session day leaders could disappear at close, especially because after-hours counters start low. The separate Post-market qualification must remain unchanged. New correction gives only Day Gainers a trading-day/rules-scoped retention context; after regular close, established day leaders survive solely spread/volume/dollar-volume failures. New candidates still meet the existing rules, and gain/price/universe/rules/day failures still remove/reset membership. Unknown/missing observations preserve the last actual reading rather than fabricate prices. No scanner thresholds, counters, requests or primary post-market rules changed. Six focused continuity scenarios cover event-driven and sampled mode, no new after-hours trade, insufficient new candidates, lost gains, universe/rules changes and next-day reset. These final backend checks are queued for the existing shared QA slot; do not mark them passed before actual receipt.

## Completed qualification

Final Day Gainers correction passes43tests/3files, including the6new continuity cases, existing retention and existing independent-baseline suites. Strengthened the new fixture so regular price2.00 becomes after-hours2.10; the6cases pass again and explicitly verify the new price/provider timestamp, proving continued updates rather than only retaining an old row. Targeted TypeScript12 changed/support paths and lint0errors/0warnings pass. Earlier source83-case batch had82passes plus one over-strict test expectation; the corrected7 actual-workspace cases pass, with an additional actual Undo/Reset case also passing. No product issue was hidden by relaxing a market-data validator.

Browser acceptance is local/synthetic and bounded: desktop1440×900, portrait390×844 and landscape844×390 passed card contents, independent formats, dropdown choices, switch persistence, full view, viewport fit and simulated regular-close switching. Default seven cards unchanged. No page exceptions; saved chart preferences unchanged. Earlier landscape consent obstruction is preserved as an initial failed harness receipt; the normal consent response cleared it and the final case passed. No production/live-provider acceptance is claimed. No preview is left running.

React checklist: extracted switch component, primitive derived view selection, reused result references, no new effects/timers/subscriptions/fetches, no duplicate scanner engines, direct MUI control imports, accessible named native dropdown/switch/X controls, per-slot state and optional backwards-compatible preferences. All original layout geometry/chart state and frozen packet artifacts preserved. Backend context hash computed once per evaluation.

Status: COMPLETE HELD SOURCE, QA PASSED; no deployment. No database migration needed (optional existing browser-layout preferences and in-memory retention only). Root retains Git/source preservation and any future integration/release. Preserve this separate allowlisted patch; do not publish the provider-neutral feature worktree wholesale.
