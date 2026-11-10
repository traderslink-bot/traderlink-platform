# Top Gainers eligibility repair — November 10, 2026

Owner requests: stop excluding gainers solely for missing spread; increase Gainers market-cap ceiling to $200 million. Coordinator already verified the live cap update, revision 13; Momentum unchanged.

Production evidence: PXLW repeatedly lost its adjusted prior-close reference despite valid historical bars. A failed overlapping cache batch can overwrite a successful reference. Five-minute expiry also lacked proactive refresh. Exact production-source reproduction confirmed no proactive refresh and a null baseline at expiry. The precise upstream live request failure is not established.

Repair: refresh verified split-adjusted references one minute before expiry, publish freshness at successful completion, preserve a still-valid reference when refresh fails, and retry after ten seconds. Original expiry, Eastern date, split-adjustment and corruption checks remain. No raw-price fallback.

Top Gainers ignores only spread_unavailable in qualification and audit for all sessions. Known excessive spread, price, cap, gain, volume and dollar-volume filters remain. Momentum unchanged. Parked halt exceptions are excluded from the release candidate.

Verification: focused previous-close, Gainer views and audit suites pass 42 tests in the feature workspace. Includes overlapping failure preservation, delayed completion freshness, proactive refresh and all-session missing-versus-wide spreads. Candidate engine and Gainer test are projected from exact live parent to exclude parked halt work; Coordinator must qualify that exact candidate before release. No deployment performed. Help guides require no update for this correctness repair; no controls or layout changed.

## Entry and membership stability follow-up

Owner clarified both new-entry omissions and incumbent flicker must be fixed. The repaired entry path was exercised with synthetic OMH/PEPG/SMX/PXLW observations: absent baselines reject, recovered adjusted references admit all four immediately without bid/ask and sort by gain, including PEPG at a $171M collection cap under $200M. This is a source regression, not a live market replay.

Already-qualified stocks now receive a 60-second grace interval from the first continuous spread/volume/dollar-volume failure. Only current eligible observations are used, with current prices and ranking; no cached rows or invalid gain references are displayed. Missing/stale observations, missing gain or gain/cap/price failures remove immediately. Persistent liquidity failures expire; recovery resets the timer and permits immediate reentry. New entrants still satisfy the entry filters. Session/date/config changes and disable/clear reset membership. Separate books preserve day and post-market comparisons. Audit retains actual filter failures even during grace. Momentum is unchanged.

Feature verification: 54 tests passed across four suites before adding the explicit four-symbol entry regression; updated Gainer suite then passed 23 tests. Coordinator must qualify the final immutable projection and integrated engine behavior before any release. No deployment authorized by this follow-up.

## Owner superseding data-outage policy

Owner rejects data-unavailable exclusions altogether, for entry and established members. Supersedes the 60-second rule above. Missing spread, volume and dollar-volume values do not fail Gainer entry. Actual measured liquidity failures receive 15 minutes for existing members. Missing observations preserve their last available row without an outage expiry within the session/config context. Fresh observations merge previously known liquidity/reference values when missing; a known comparison recalculates gain at the observed price. No invented initial price or initial gain: an unseen stock still requires enough provider evidence to calculate its gain, and the reference refresh repair restores that evidence.

Date/session/config reset, disable/clear and removal from the daily universe clear retained membership. Known gain/price/cap failures remove immediately. These changes affect only Top Gainers; Momentum remains unchanged. Existing observation timestamps are preserved for missing rows. Audit observation failures remain available even when membership is retained; final QA must explicitly cover this distinction. Persistence across process restarts is not introduced.

Focused four-suite verification passes 53 tests with long-outage retention, current-price gain recalculation, universe pruning, context reset, measured-liquidity expiry and initial four-symbol recovered entry. Prior frozen candidates are superseded; no deployment performed.

## Final retained-data audit qualification correction

Coordinator identified two real audit inconsistencies: fresh recalculated Gainer gain was absent from the recorded decision, and retained members missing a current observation had no decision. Audit now takes effective Gainer gain/comparison/rank from selected output, preserves raw provider observations and timestamps, emits decisions for retained missing/stale observations using their original evidence, and adds optional gainerDataIssues/gainerRetained fields. These are additive evidence fields; no migration or schema identity change. Missing/stale evidence never receives a Momentum rank, score or active state. The momentum replay script skips retained missing/stale evidence before observing prices/outcomes. Gainer focus excludes missing/stale observations, preventing old activity from being highlighted as fresh.

Live-feed serializes evaluated rows and audit decisions without rebuilding references or timestamps; current received/missing counts continue to report actual delivery. Audit store persists compressed JSON and counts decisions, including explicitly flagged retained decisions; counts must not be interpreted as new provider messages. Existing entered/left events continue following effective ranks. Unknown future replay consumers should check data issues before treating retained evidence as fresh.

Four multi-cycle engine regressions cover: one-hour missing observation, stale observation and JSON timestamp preservation; missing reference with changed fresh price and recalculated gain; NEW entry with unavailable quotes/volume/dollars; actual wide-spread retention through fifteen minutes, exact expiry and immediate recovery. Focused Gainer/retention/audit suites passed 47 tests before the final replay skip and JSON assertion. Complete candidate exact qualification remains Coordinator responsibility before the authorized release.

## Bounded outer-stage feed failure correction

A failed float/budget/universe-read stage could previously erase all Gainers before engine evaluation. The feed now preserves only published Gainers/day-Gainers when this pass has independently verified enabled configuration, official calendar session and the exact previous successful settings/date/session context. If the current universe is known, removed symbols are pruned even on the failure path. Known disabled/closed/missing-universe/config/session/date boundaries still clear normally. Unknown configuration/calendar failures cannot establish a safe current context and do not qualify for this fallback. No synthetic audit cycle is emitted when evaluation never ran; unavailable status and zero received count disclose the outage, preserved rows keep original timestamps, focus clears, and Momentum retains its existing empty-on-outer-error behavior.

Seven feed regressions exercise a real float-stage exception, serialized retained rows, no extra audit cycle/Momentum, and six known boundary resets. Combined feature feed/Gainer/retention/audit verification passes 81 tests. Final immutable candidate and canonical dependency checks remain with Coordinator; worker has not pushed, deployed or changed hosted state.

## Canonical pinned-toolchain gate corrections

Coordinator final QA found two stale eviction assertions explicitly superseded by approved retention: event-gap and stale-snapshot Gainers now remain, while tests continue requiring empty Momentum/no stale focus and warming rolling metrics after reconnect. No product code changes in this correction. Replay local Decision type now includes additive gainerDataIssues; manual-ticker snapshot mock has an explicit argument tuple.

Exchange-conflict investigation: foundation.test.ts and universe.ts are byte-identical between exact production parent 2aba52e3 and scanner candidate 8a1d3f9 (empty Git diff). The baseline importer strictly throws scanner_universe_exchange_conflict; the baseline test incorrectly expected quarantine. The corrected test asserts the existing exact error and that accepted universe facts are not mutated, and retains cross-day rejection. No universe guard was changed or waived; parked quarantine implementation is excluded.

Canonical pinned Vitest 4.1.4 immutable predecessor 79b243e8 passes seven suites /139 tests. Targeted strict type verification of the newly included foundation test revealed an existing nullable-baseline assertion; it now explicitly asserts a present baseline before calculating the expected gain. No production code change. Final successor retest/type/lint outcomes are reported with the Coordinator handoff.
