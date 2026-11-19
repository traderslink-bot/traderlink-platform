# Scanner interruption continuity — owner queued fix

Owner authorized investigating and fixing the twice-in-two-minutes Temporarily unavailable flashes after real-provider/Analyzer QA. That QA is now complete for the active Alpaca connection; alternate Moomoo remains unexercised without changing the shared live selection. Do not deploy.

## Baseline and ownership

Use immutable published93f14371ef2afde7f132c3b2e6e0528053f794ba and Root hosted c3e90ce1 metadata. Exact current assigned bytes MATCH that baseline for both scanner clients, member-status.ts, display-continuity.ts and live-feed.ts. backend-http.ts DIFF is held provider-neutral work; do not overwrite it or absorb its delta into this fix. All15QA3 hashes remain frozen. No competing Scanner worker; Screeners chat stopped before edits.

## Full discovery and acceptance inventory

Review fresh/old/invalid-timestamp populated and valid empty snapshots; initial no-data; first/repeated native EventSource errors; malformed events; short/sustained failures; unavailable publications with/without retained sections; refreshAfterMs1000; visibility close/reopen; graceful recovery; context/date/session/provider/auth boundaries; payload size/backpressure/read failures. Reproduce before editing. Actual live browser observation is bounded120s and read-only, no provider or worker changes. Root bounded HTTP samples do not establish absence of SSE failures.

Consolidated candidate paths from read-only handoff: current grace uses snapshot updatedAt, not first interruption time, and requires rows; onerror immediately marks loadError. One event-driven unavailable response bypasses continuity; an unavailable response with some rows is accepted before status is considered. These are reproduced-path hypotheses, not a confirmed cause of the owner's exact incidents. Verify actual stream sizes/statuses/timing and both clients, not just /scanners.

Correction must preserve terminal/auth/context boundaries and promptly accept recovery. Keep visible last received results during short faults without inventing fresh timestamps or silently treating sustained stale data as live. Use at most one page-level fault timer while disconnected; no per-row timers, new provider requests or forced reconnect loops. Preserve valid empty results, genuine closed/disabled/universe states, all ranking/eligibility/price math and normal update cadence. Decide the final narrow correction after discovery, then one coherent batch, one preview update and full applicable retest.

Source correction is now implemented below. No deployment, source branch/index changes, feed/worker/provider changes or migration. Root owns local preservation and release coordination.

## Consolidated discovery and correction batch

Live120.7s observation:140events,0transport errors,0unavailable publications/notices; largestframe200,364bytes, max snapshotage2,767ms,0page errors. This does not identify the owner's exact incidents. Pure before-fix reproduction confirms three bad transitions: a60s-old valid snapshot immediately becomes unavailable on a new fault; a valid empty snapshot does likewise; one1s unavailable publication immediately replaces populated results. Serverframe size hypothesis unconfirmed and comfortably below1MB during the sample. Keep backend/gateway/feed unchanged.

One coherent correction: shared connection-state reducer and useLiveScannerModel hook for both clients; first failure time is stable across retries/transport-to-unavailable transitions; one page-level expiry timeout, cleared on recovery/unmount. Retain valid empty/populated same-day snapshots for30s, show a compact amber reconnect indicator in the existing top-nav controls, and expire to the existing notice for sustained failure. Healthy recovery (including genuinely empty) is accepted immediately. Closed/disabled/universe/source/date/session boundaries and permanently closed/auth-failed EventSource clear/bypass retention. Hidden/reopened connections ignore old callbacks. No financial timestamp fabrication or per-row timers/new polls.

Separate HELD integration correction: neutral Scanner member projection needs a source boundary after provider names are removed. Add opaque server HMAC sourceContext, stable for a selected supplier and changed when it changes; both raw legacy provider and opaque context are compared. Server projection hunk stays separate from the production-safe scanner packet. QA3's15 pinned files stay unchanged. No deployment.

Focused tests include state transitions, repeated faults, malformed envelopes, true-empty recovery, scheduled expiry without events, cleanup and visibility/permanent close; then private actual Next desktop/mobile/landscape fault injection on both page clients. Type/lint and12client graphs, existing feed/backend/halts/mobile layout regressions. Original fault reproduction and actual live observation retained externally. Focused source qualification passed; browser acceptance is recorded below separately.

## Source qualification and browser discovery

PASS149tests/11files; targeted TypeScript14changed/support paths; lint0errors/0warnings; twelve minified ordinary client graphs have zero supplier-name matches; git diff --check clean. All15QA3 pinned file hashes unchanged. Exact seven existing Scanner-path baselines match both8d99 and immutable published93f; the correction can be preserved as a separate production-source delta without absorbing held provider-neutral transport code. No full Next production build claimed.

Private browser fault injection uses isolated synthetic Scanner rows and loopback-only local SSE, no actual provider connections or hosted data. First browser batch found a test-selector error (the inline chart's SHFS ticker was counted as a Scanner row); corrected by scoping to the Gainers card. Second batch passed all four /scanners groups and brief-fault /trading-workspace, but a subsequent Workspace sustained-fault case failed after sharing a simulated clock across navigations. This remains a browser-test finding, not a confirmed product cause. Preserve both failed reports. Final retest uses fresh pages and real30-second waits, without source edits or clock mocking, before making any further correction.

## Final applicable browser retest — passed

All8groups PASS on fresh pages with genuine wall-clock30second waits: brief transport failures and unavailable publications retain the old valid full snapshot; sustained faults expire to the real notice; valid-empty recovery is accepted immediately; source/session/closed/auth boundaries clear rows and recover; portrait390×844/landscape844×390 preserve results through brief faults; green chart actions still open the shared chart drawer and close correctly. Both /trading-workspace and /scanners exercised. Zero page errors. The earlier Workspace discrepancy did not reproduce without the cross-navigation simulated clock; it was a harness timing artifact, and no additional source edit was made. The first scoped-selector and clock-cohort failures remain retained as evidence.

Visual checks: the compact status icon fits the existing top nav on mobile/landscape, without an extra toolbar row; no new link-styled action. Source correction adds no provider requests or per-row timer. This browser run is functional fault/recovery QA with synthetic isolated data, not a live concurrency/phone-hardware performance benchmark. Existing source checks remain valid because only the QA harness and these records changed after their pass.

Private dev cohort peak preview 4210MiB and browser 957MiB; zero cgroup high/max/OOM events and zero measured pressure in the final sample. This is development memory, not a production RAM projection. All owned browser/SSE/preview units stopped normally; MainPID0, marker absent and common-heavy flock independently confirmed free. Core resource chat received the confirmed-free handoff.

Reproduction limitation: the owner's exact live flashes were not seen during the120s read-only observation, so their initiating backend/network cause is not established. The three premature display paths were deterministically reproduced and corrected. Genuine sustained failure remains visible after30s; upstream feed, provider selection, ranking and qualification math are untouched.

Source-only preservation: Scanner continuity delta is parented to immutable93f; separate held-only source-context/projection delta is parented to8d99 and depends on the Scanner contract/comparison change. Frozen QA3's15files remain unchanged. Root retains Git/index/ref authority. No deployment, push, migration, hosted configuration, provider/feed/worker change or full production-build claim. All changes remain held.
