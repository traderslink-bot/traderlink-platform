# Watchlist editor and category move progress

[Owner-approved plan](watchlist-editor-and-category-move-plan.md).

- Source traced: inline analysis editor, runtime category move handler, manager placement-only method.
- Existing editor already warns before discarding unsaved edits and browser navigation. Preserve it.
- Exact release parents confirmed by Coordinator: Platform `5867b4dc3e9f52a5f790ce34e5723262ff7d30b8`; runtime `e4f46105ed562c2459de9dc14c49f38060fcbbb3`.
- A implemented locally: standard/simple upside insert above/below, move up/down and explicit price sorting; existing unsaved-edit protection preserved. Generation-time breakout checkpoint uses the existing breakout price and rationale, reuses an existing matching row and leaves future owner edits alone. Separate breakout section remains.
- A focused offline checks passed: whole-row content preservation, non-mutating insert/sort/reorder, limits, GOW 3.24 / 3.47 / 7.15 sequence, duplicate reuse, missing/already-cleared breakout. Package syntax and scoped strict helper checks are included in the checkpoint verifier. No browser acceptance claimed.
- B implemented in the prepared release package: durable runtime ledger, owner endpoint, unchecked move-notification option, delivery-status/retry controls, destination-first Discord send and source-category cleanup, independent Platform push/email outbox, and combined move/analysis update copy preserving reference prices.
- Coordinator reserved `0153_platform_watchlist_category_move_notifications` at order 153, predecessor 0152. Authored and registered in the package; tested only in disposable in-memory SQLite, NOT applied to any hosted database.
- C source/integration checkpoint complete. Focused offline integration tests use mocked providers; strict checks use immutable release-parent sources. No deployment, real notification, hosted write or browser acceptance claimed.

## Cleanup retry checkpoint

- Implemented an independent Retry failed deletions control in Discord notifications settings. It requeues only saved failed deletion receipts, respects the deletion setting, and never invokes publication or notification delivery.
- Corrected the role-mention panel lock so saving/loading roles cannot unlock deletion controls owned by a separate request.
- Focused mock-filesystem checks pass for retry, disabled setting, receipt preservation and duplicate-job avoidance. Edited TypeScript and embedded panel JavaScript syntax checks pass. No real deletions or browser acceptance performed.
- Package: `src/scripts/package-watchlist-cleanup-retry.cjs`, parented to local editor checkpoint `81e79a05` / `e6607421`, exact allowlists emitted by the script.
- Move integration remains unfinished. Added source-category receipt selection, Overnight Watches move-only copy, and a per-ticker durable ledger candidate. Corrected the state machine to check stale/removal conditions before retrying placement, not just before sending. These move candidates are not yet wired into runtime routes or Platform push/email.

## Ticker action layout checkpoint

- Owner's subsequent Proceed authorizes the proposed arrangement. Prepared runtime page/row-review changes group actual existing controls without replacing handlers: visible review/publication choices; move dropdown/button together; More actions for refresh, visibility and separate social/gain posts; separate removal controls.
- Running analysis/cancel and review status remain visible. More actions expansion persists through polling independently per ticker. Mobile buttons wrap consistently with 40px minimum height.
- Focused checks cover group order, expansion persistence, every legacy control attached exactly once, and embedded JavaScript/TypeScript syntax. Browser visual acceptance still outstanding. This is not a claim that the entire feature is ready.
- Latest cleanup checkpoint is Platform `947636df065f25d9c4ed5386570d9496b01aefd7` / runtime `fc06d3d3645e9b0d7519dcfad32305fa16b4321d`; earlier provisional `dd5bac30` / `75f4fafc` omit the API body type correction and must not be released. Layout package parents the corrected pair.

## Completed implementation checkpoint — September 30

- All three source slices A/B/C are prepared. Package B parents Platform `e1adaf37e644099007563174850564c01359c313` and runtime `0a418a01488d52c2f1425fbaa7111dd679ed7b55`, preserving the editor, independent cleanup retry and layout checkpoints.
- Focused integration covers real in-memory additive migration, recipient snapshot/deduplication, both push/email sends with mocked transports, stale member-delivery suppression, silent moves, uncertain-send verification, retry without repost, source-category receipts, late receipt cleanup, inactive ticker, owner authorization, malformed requests, exact TNON price context, and generated admin JavaScript syntax.
- Strict TypeScript checks use prepared source plus exact parent Git contents, not the stale runtime working files. No broad suite, build, local server, OpenAI request, Discord post or deletion was run.
- Help updated in the same release package. Migration 0153 and runtime changes must be released together through the coordinator; verify migration predecessor/backup, service health and rendered controls before hosted acceptance. No historical sends are generated by migration.
- Remaining release acceptance is deployment-specific: real destination send, opted-in device/email receipt, original-message deletion and mobile/desktop control layout. These are not represented as completed by offline tests.

## Historical continuation notes (superseded by completion above)

Owner follow-up: actual analysis updates KEEP their saved original/update prices and percentage change (TNON example). The uncommitted concise-update-copy package is superseded and explicitly disabled; it must not be released. No prices were removed from production. Distinguish move-only from updated-analysis-plus-move wording in B. Expanded indirect-workflow audit and exact control-layout inventory are in progress; owner layout question sent asynchronously.

First [interaction audit](watchlist-admin-interaction-audit.md) records exact-source findings: independent move notification needed; old approvals retain original retry destination; failed Discord cleanup has no independent retry in its module; published-only fallback lacks receipts; two action builders cause accumulated layout clutter. Late receipts and remove/re-add are explicitly unverified follow-up cases, not reported as proven live bugs.

Package A with `src/scripts/package-watchlist-level-editor.cjs` against the exact parents above, not the mixed working tree. Editor diff against that parent contains only this slice. Runtime changes are constructed from the released parent without altering the old runtime working tree. Pending B candidate: `src/scripts/fixtures/watchlist-category-move-state.ts` and focused verifier. Add durable storage and exact source-category receipt filtering; never reuse the broad all-category removal helper. New migration must preserve all existing notification records/constraints while giving moves their own identity/copy. Keep ordinary category moves silent and preserve publication times, analysis and gain history.


## October 1 notified-move repair

See [repair evidence and focused verification](watchlist-move-notify-repair-progress.md). SDEV silent moves worked; notified moves exposed an obsolete notification access query. The narrow repair preserves opt-ins and active Discord checks and uses current membership feature policy. Move delivery details now uses the authenticated proxy with either JavaScript quote style.
