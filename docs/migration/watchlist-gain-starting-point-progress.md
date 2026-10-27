# Gain starting point progress

## October 27, 2026 — editable highest price

Current-source feature candidate based on production f9b33ce, with Runtime
label change based on deployed d398536. Existing dirty preservation lanes were
not changed. New field Highest after added price saves an optional high
correction in existing JSON tracking; no migration. It can raise or lower an
incorrect recorded high. Fresh later higher quotes still advance it; delayed
older quotes cannot undo it. A changed start time clears the old correction;
reset clears it too. The editor also retains an editable highest-price date/time
so the displayed High observed time is not silently replaced with the save time.
The correction time is tracked separately to exclude old delayed quotes.
Original publication, analysis,
notifications and recap observed-market evidence stay unchanged.

Actions are renamed Edit Gain Card and Post Gain. Help wording is aligned.
Focused synthetic tests cover high changes, gain math, serialized reload,
later prices, delayed prices, reset, start changes, identity/revision checks,
bad inputs, input immutability and preserved non-gain facts. No live data,
provider requests, notifications, service startup or deployment used.

Verification: 5 grouped node regression tests pass, focused semantic TypeScript
check passes, targeted ESLint passes, and diff whitespace check passes.
Browser visual acceptance and deployed testing have not been performed.

Runtime Post Gain label/action syntax regression: 1/1 passes. The older general
row-review suite reports 2 passing/4 failing; an independent in-memory replay of
the untouched deployed HEAD row source reproduces those same four failures
(obsolete DOM harness/expectations). The only Runtime application diff is the
button text. Existing general test failures were not changed or hidden here.

## Source checkpoint — October 15, 2026

**Latest status: the three independent QA findings below have been corrected at the owner's request.** Both focused scripts now pass. No deployment authorized or performed; see the correction checkpoint at the end. The earlier failed QA is retained as historical evidence.

Implemented in the exact-parent candidate, not deployed. Owner approved controls and behaviour. No live mutations, notifications, push, branch switching, local server or production build. Existing dirty checkout and Codespaces preserved; integration uses pinned Git source rather than overwriting shared files.

Base: `78bf4421b815e079a31b1135d771572a0e979a13` from the saved `origin/main` ref; not a freshly fetched remote or a production-version claim. Reconcile the explicit patch onto then-current main before any separately authorized release. Do not replace current Codespaces files wholesale.

### Implemented

- First member-publication price/time supplies the gain baseline, independently of earlier draft/analysis prices.
- More actions → Gain starting point: price, Eastern date/time, Save and Reset to Watchlist publication; repeated DST times are selectable.
- Owner correction is versioned, tied to the current listing, and survives concurrent quote updates, analysis refreshes and category moves. Genuine remove/re-add resets it.
- SQLite read/modify/write is atomic for affected card, quote and owner updates; Neon retains its existing optimistic concurrency path.
- Retained observed-price maxima recalculate highs after the selected start; no fabricated historical quotes or new provider calls. Prior listings retain only their known high initially, so the dialog discloses available coverage. An unknown original publication price requires owner input rather than substituting an AI price.
- Gain-only change: no published header/time, analysis, notification or Discord history changes. The shared gain card also supplies future gain-card images. Previously sent images remain unchanged.
- Help and controlling plan updated. Existing JSON storage carries the new fields; no migration.

### Verification

`node src/scripts/verify-watchlist-gain-start.cjs` passed: source syntax, actual store first-publication calculation, manual earlier/later start, reset, omitted earlier high, refresh/move/re-add, stale observations, missing original price, invalid input, bounded history, Eastern/DST, authorization/mutation boundary, body bounds and simultaneous owner/quote writes through real store methods with an isolated database stub. No external calls.

`node src/scripts/package-watchlist-gain-start.cjs --check-index` applies a read-only patch check against the pinned base using a disposable temporary index. The real index, branches and checkout remain unchanged. Initial sandbox restriction prevented temporary Git index writing; the authorized retry passed.

Strict scoped TypeScript check passed against the pinned source and installed dependencies (768 MB Node heap ceiling). It caught the current MUI input-slot API mismatch, corrected before the passing run. Final request QA also caught and corrected the required admin request header; the real mutation guard now passes in the focused offline route check and rejects missing headers. Syntax and focused regression checks passed again after that correction.

React checklist reviewed: lazy dialog, explicit labels, loading/error states, pending-save controls, no background refresh overwriting unsaved values, memoized population callback and abortable initial request. Hosted mobile/desktop visual acceptance remains pending; no hosted browser/delivery acceptance claimed. No local app build, broad suite or live data test performed.

Source slice is complete and ready for the separately authorized integration/release checkpoint. Shared tracked application files were not overwritten and no local branch/index commit was made in the mixed tree; the narrow patch is the preserved change record. No coordinator handoff or deployment performed in this request.

### Artifacts and allowlist

Patch: `docs/migration/watchlist-gain-starting-point.patch` (regenerate after updating this record).

Application files: `src/lib/live-watchlist/{live-watchlist-store.ts,live-watchlist-types.ts,gain-starting-point.ts,gain-start-time.ts}`; `app/api/admin/watchlist/gain-starting-point/route.ts`; `app/(dashboard)/admin/watchlist/{watchlist-runtime-admin-client.tsx,watchlist-gain-starting-point.tsx}`; `src/modules/watchlist/server/runtime/{watchlist-runtime-admin-document.ts,watchlist-gain-start-control.ts}`; `app/watchlist/live-watchlist-client.tsx`; `src/modules/help/watchlist-guides.ts`.

Documentation: this progress record, its plan, and an appended link in `watchlist-runtime-dashboard-admin-plan.md`. Local reproducibility tools: `src/scripts/{compose,verify,typecheck,package}-watchlist-gain-start.cjs`. Exclude all unrelated work, especially the separate simplified-breakout experiment.

## Independent pre-release QA — October 15, 2026

Command: `node src/scripts/qa-watchlist-gain-start.cjs`. Four checks passed, five failed (three distinct findings). The previous focused regression script also passed again; it did not cover these failing cases. All fixtures in memory; no provider calls, production data, Codespaces edits, notifications, builds or deployment.

1. **Gain can be understated after a manual edit.** Publication at $10 followed by $9, owner sets $5 at or before publication: expected 100% from observed $10 high, actual 80% from $9. The publication quote is used as the default starting value but never inserted into the retained observed-price history. Three failing assertions cover this same cause. Required correction: retain the real publication quote as evidence, without treating arbitrary owner-entered prices as market observations.
2. **Custom gain baseline can leak into daily recaps.** The actual daily-recap recorder reads `potentialGain.startingPrice` for a new candidate. If its first successful capture occurs after the override, a $10 publication with $5 gain override is recorded as a $5 publication. Existing recap candidates do not rewrite their baseline, but new/delayed capture is affected. Required correction: recap publication facts must come from publication evidence, not custom gain controls; review high-evidence consumption too.
3. **Older gain cards can disappear on read.** `prepareGain` nulls an existing valid gain when an older listing lacks `publication.price`; the composed `parseState` invokes it on reads. This is documented as unknown-price behavior in the candidate, but it is a regression against keeping existing cards untouched. Required correction: preserve the legacy recorded baseline until reliable publication evidence or an explicit owner correction is available, with appropriate provenance; never invent a replacement price.

Passing independent cases: later start excludes earlier highs; a start after all observations begins at zero and tracks later prices; save/reset leave all non-gain state fields unchanged; saving does not mutate its input object. Existing focused suite additionally covers reset, moves, re-adds, concurrent owner/quote writes, authorization and Eastern/DST handling.

Hosted visual and end-to-end acceptance remain unperformed. Packaged patch has not been regenerated to include this QA note and must not be released unchanged. Next step is a separately authorized correction of the three findings followed by both focused scripts.

## Owner-authorized correction checkpoint — October 15, 2026

- Publication quote is now retained as genuine observed-price evidence independently of the editable baseline. Publication $10 → next quote $9 → owner start $5 correctly gives $10 high and 100%, including an earlier Discord start. Moving the start after that quote still excludes it.
- New `gainPublicationEvidence` separates publication/recorded legacy baseline and observed market highs from owner gain overrides. Daily-recap baseline and high evidence now consume that projection. A custom $100 baseline cannot become a $100 observed market high in recaps; a $5 baseline cannot replace a known $10 publication price. No existing recap records are rewritten.
- Older cards missing publication metadata preserve their original recorded baseline, kept separately through save/reload and further ticks. Explicit owner corrections remain available; unknown publication prices are not fabricated.
- No analysis, header publication, group, live-price or visibility changes; no notifications. Gain history is changed only within its existing feature scope.

Verification: original focused regression suite passed; independent QA now **11/11 checks passed, zero failures**, including full non-gain state equality, input immutability, actual recap recorder against an isolated DB stub, arbitrary owner-price exclusion and legacy serialization. Strict scoped TypeScript passed for the corrected application candidate. The two existing recap suites also passed **7/7** using SQLite `:memory:` and stubbed delivery via `node src/scripts/verify-gain-recap-compatibility.cjs`. No production database or providers contacted.

Additional source allowlist entries: `src/modules/watchlist/server/daily-recaps/watchlist-daily-recap-evidence-recorder.ts`, `daily-recap-recorder.node-test.ts`, and `daily-recap-owner-qa.node-test.ts` in the same directory. The existing test harnesses load the real new helper and use complete legacy gain fixtures. QA reproduction: `src/scripts/qa-watchlist-gain-start.cjs` and `src/scripts/verify-gain-recap-compatibility.cjs`. The regenerated narrow patch supersedes the earlier failing candidate. Codespaces and shared dirty application files remain untouched. No push, deploy, restart or full build. Hosted visual/integrated acceptance remains a separate checkpoint, not claimed by these offline checks.

## Additional owner-requested QA — October 15, 2026

No new defects found in this pass; no application changes made.

- Original focused store/route regression passed again, including stale identity/revision protection, reset, reactivation and concurrent owner/quote writes.
- Independent QA: **12/12 passed**, including all three previous findings. Added 1,000 repeated edits across 40 deterministic price histories, with serialized reloads between edits; each high and gain matches an independently calculated result. All non-gain state fields remain identical and recap publication price remains original.
- Existing recap compatibility suites: **7/7 passed** with SQLite in-memory storage and stubbed delivery.
- New `node src/scripts/qa-watchlist-gain-controls.cjs` executes actual dialog handlers with in-memory hook/transport fixtures: changing price, changing ET minute, preserving original seconds when time is unchanged, reset, invalid-input handling, Close without saving and required admin header all passed.
- No notification transport, production database, live market/provider request, local app server/build, Codespaces write or deployment. The control checks exercise behavior, not browser visual layout. Hosted visual/end-to-end acceptance remains separate.

Only QA scripts and this progress record changed during this pass. The source patch is regenerated solely to include this updated record; application changes remain the corrected candidate from the preceding checkpoint.
