# Trading Workspace chart QA4 — November18

Owner requested another QA/fix pass after preservation7430d28. Deployment stays held. Root owns Git. Full scoped discovery before a correction batch: lifecycle cancellation/owner changes, blocked browser storage, no-op startup, malformed cache, geometry clipping and cleanup, layout save/restore, one/four-chart render and mobile rotation/drawer behavior. Source-only while News owns the private runtime/native slot; no competing server/browser or heavy checks. Preserve previous exact startup failure evidence; all new live diagnostic output must be outside the watched source tree.

Additional lifecycle tests prepared to exercise stale callback after owner transition/unmount, cancellation before hydration, blocked-storage session operation and no-op write avoidance. Runtime findings not yet asserted. No implementation changes yet.

Focused discovery ran with exclusive nonblocking normal guards and no server/browser: five lifecycle cases, two FAIL/three PASS. Reproduced savedalpha SMTK15m overwritten by delayedRAIN1m (a) after committing beta but before beta hydration RAF, (b) after unmount. Hydration cancellation, blocked-storage operation and no-op write avoidance pass. These are one missing lifecycle boundary, not provider or layout-schema changes.

Coherent correction: track the committed active owner in a layout effect, invalidate it on ownership change/unmount, and reject callbacks unless their captured owner is both current and committed. No render-time ref mutation, request, timer, storage format or UI change. Add Strict Mode effect-replay coverage. Planned focused retest includes existing restore/geometry tests, the new six lifecycle cases, mobile layout tests and targeted types/lint; then one private browser update/retest with external diagnostic output.

## Qualified first batch and actual browser retest

The lifecycle guard passes six new cases including Strict Mode setup replay. Existing restoration/geometry plus mobile layout/hook cases pass:30tests across5files. Targeted TypeScript and lint pass. Actual guarded private Next browser used normal isolated development identity, synthetic scanner/candles only, real preferences/layout routes. All live output outside the source tree; no generated JS feedback/rebuild loop and no script errors.

Actual browser PASS: normal chart startup, cold empty-config RAIN→OPTT selection with actual5m default, stale/queued/completely silent IO callbacks, zero-height clipping pause/restore, drawer coverage/return, navigating to /charts and back with SMTK15m retained, portrait named-layout Save and X/Cancel behavior, landscape named-layout Save and rotation with each orientation's settings unchanged, desktop saved bytes unchanged by phone work,50scroll→1geometry read/idle0. The four-pane setup itself painted before refresh. The following four-pane refresh/rotation checks did NOT pass: small requests stalled, preferences stayed pending and later API/provider responses took70s/29.9s/50s, with no script error. The card's desktop geometry eventually restored correctly, but child chart readiness was still waiting on preferences. Do not call these product passes or add chart polling/retry guesses.

All own runtime closed22:55UTC within agreed8min (browser's finite450s lifetime ended22:54:53; stream/preview/guard closed, ports absent, normal guards free). News notified and owns next build/native QA. News later reported its bounded buildOOM and requested keeping its recovery slot; no second Chart runtime or resource claim from a free guard.

## Follow-up source correction — browser acceptance OPEN

Source inspection identified a redundant readiness dependency: LiveScreenersClient has already loaded the owner's preferences before mounting/restoring the page chart, but each child renderer independently calls useChartPreferences again. Deduplication coalesces simultaneous child requests, but still introduces an avoidable second load after the parent. Under the measured slow preview request, that leaves restored charts at Loading candles. Reuse the established ChartPreferencesContext around the page chart, forwarding the actual parent state/change handler. No fabricated identity/preferences, timeout bypass or provider-selection shortcut; the provider check remains required. This also reduces account-preference listeners/reads. Per-chart indicator visibility/viewport state still belongs to ChartViewMemory and is unchanged. Existing controlled timeframes remain controlled.

A real-hook regression test mounts four consumers, checks one parent GET before readiness, verifies all consumers receive the actual owner's values, hides/reopens them without another GET, and verifies one global update POST propagates to all consumers. Combined final checks:31tests/6files PASS, targeted TypeScript10listed support/source/test paths PASS, targeted lint clean and diff check clean.

Final full four-pane browser retest for this follow-up correction remains OPEN until News's actual build/nativeQA closure. Do not state full QA complete, production-ready or deployed. Earlier source/runtime qualifications are retained separately from this pending acceptance. No migration, API contract or UI change; no push/deploy/index/ref operation by worker. Root owns narrow local preservation after7430d28.

Evidence: bounded data/workspace-chart-qa4-20261118 reports copied only after runtime closure. Raw active helper/capture path /tmp/traderlink-chart-qa4-20261118 remains required for the follow-up browser retest; do not confuse with ended oldQA3 capture. Own .next development cache also has the newly requested QA4 purpose. Shared frozen dependency donor untouched.

## Final QA5 — follow-up browser acceptance PASS

After News's actual24check/native-runtime closure23:38:40UTC, acquired both normal guards and ran one finite private preview batch. Source remained7430 plus this exact five-path slice, no feature edits during runtime. Live diagnostics stayed outside watched source. Actual normal local-development owner and preferences routes, synthetic market fixtures only.

All five actual browser cases PASS with0page/window JavaScript errors:
- Single chart paints with **one actual parent preference GET**.
- Four actual candle panes paint, adding timeframes triggers no extra preference GET, and full normal-compression reload restores all four panes and exact configuration with **one GET for the new page**. The previously open acceptance case is now passed, not waived.
- Turning EMA off on one pane leaves the sibling enabled; opening the drawer pauses the page, closing it restores the same four-pane setup and the local EMA switch.
- Portrait and landscape retain the same saved four-chart configuration, with desktop saved layout bytes unchanged. Existing compact internal chart tabs adapt to short/narrow cards; no false claim of four simultaneous canvases where the responsive card intentionally shows one selected pane.
- Empty-config cold startup with deliberately held parent preferences preserves the latest RAIN→OPTT selection asOPTT5m, again one actual preferences request and no child refetch.

Desktop/portrait screenshots visually inspected; all panes show candles, volume and expected EMA reads when enabled. Runtime sampling recorded0memory.high events and0OOM events; no live-market latency/load benchmark claimed. Initial development compile timing is not a production speed figure. Thirty-one focused tests, targeted10path types/lint and prior actual layout Save/Cancel/orientation and visibility event-coalescing checks remain qualified; no new source changes after them. No schema/API/provider or UI changes, no migration required.

Actual closure23:40:58UTC: own preview/browser/synthetic stream/guard inactive;3010/3097/3098 absent; feature marker absent and common flock acquired/released. News notified for its next source/test scope. Final scoped QA is COMPLETE; production deployment remains HELD pending owner instruction and Root integration/release authority. No push/merge/deploy or Git index/ref operation by worker. Hosted Discord-role and real-provider/performance tests were not performed in this synthetic isolated lane.

Final bounded proof: data/workspace-chart-qa5-20261118/{results.json,final-context.json,runtime-pressure.jsonl} and desktop/phone screenshots. Raw earlier QA4 failures and their follow-up disposition remain in the prior QA4 reports. Own .next dev cache and /tmp QA4/QA5 runtime outputs now have ENDED testing purposes; retain source/final proof/exact prior bad-script evidence, then storage owner may close only verified own disposable outputs under the existing cleanup gate. Shared dependency donor, other previews/compiled runtimes, source and isolated database/keys remain protected.
