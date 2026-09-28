# PWA speed audit — 2026-09-28

Status: sampled-route investigation complete; no application changes or release. Installed Android performance remains unverified.

Follow-up: the owner approved repairs. Implementation and verification status is tracked in [PWA speed repairs](pwa-speed-repair-progress-2026-09-28.md); the measurements below remain the pre-change baseline.

## Evidence boundary

Production source confirmed by the release coordinator: `705385767d45704320cedb02b967d6341027ecc6`, Railway deployment `c82e8007-19fc-4f0a-a814-29aad6b84936`, SUCCESS, main, one replica with persistent storage. Health HTTP 200, ready, sqlite_single_node, schema 129. Source inspection used that remote revision; the heavily mixed canonical checkout is not a production-equivalent candidate.

Browser measurements used signed-in desktop Chrome with the production service worker active, cached static assets and no throttling. Standalone was false. These are navigation measurements, not Android cold-start, interaction, chart-ready or push-delivery measurements. Brief service-worker bypass was restored. No storage clearing, subscription changes, tests, builds, database changes or deployment occurred.

## Measurements

| Route / sample | First byte | Load event |
| --- | ---: | ---: |
| Workspace, first | 982 ms | 1461 ms |
| Workspace, reload | 829 ms | 1131 ms |
| Watchlist, first | 446 ms | 775 ms |
| Watchlist, worker bypass | 337 ms | 810 ms |
| Watchlist, worker restored | 604 ms | 898 ms |
| Watchlist ticker detail | 375 ms | 782 ms |

This small unthrottled comparison does not establish a service-worker penalty or justify recommending the website instead of the installed PWA.

Coordinator-reported last-four-hour Railway HTTP aggregates:

| Route | Requests | Minimum / average / maximum |
| --- | ---: | --- |
| /workspace | 17 | 74 / 784 / 5105 ms |
| /watchlist | 8 | 46 / 233 / 435 ms |
| /api/live-watchlist | 11 | 1 / 38 / 77 ms |
| /sw.js | 32 | 2 / 122 / 2298 ms |

Workspace's outlier is real; these aggregate logs do not identify its server phase. Long-lived event-stream request durations are not page-load latency. No Watchlist server bottleneck appears in this window.

## Prioritized findings

1. **Duplicate Workspace news downloads — measured.** Two scanner responses transferred 74,678 bytes each for six headlines. The card loads on mount and again on the stream's immediate ready event. Its in-flight guard cannot prevent a second sequential download. The endpoint returns full articles and the client eagerly imports the article drawer. Deduplicate startup/resume loading, use a compact headline response, and fetch full content when opened. Preserve change refreshes and access controls.
2. **Intermittent Workspace server delay — measured, cause unresolved.** Correlate slow requests with existing server phase timing before changing database checks or caching. Earlier Rules batching is already in production ancestry. The 5.1-second outlier needs phase-level attribution.
3. **Watchlist JavaScript size — measured size, unmeasured mobile cost.** List and detail each loaded about 1.25 MB of decoded script resources, not network transfer bytes. The shared client module imports detailed analysis widgets. Confirm chunk ownership and separate detail-only code where useful; do not promise savings before measuring.
4. **Background capture and scanner refresh — source-supported candidates.** Offline projection capture observes the dashboard subtree, scans/clones content and writes IndexedDB snapshots. Profile changing mobile pages, then skip unchanged captures and hidden-page work where safe. Workspace scanner events can reload while hidden; suppress that page activity and refresh on resume. Web Push must remain independent and active.
5. **Weak-connection navigation wait — source-supported risk.** The service worker uses NetworkOnly for private navigation without an explicit deadline; offline fallback runs on failure. Evaluate a bounded deadline to the existing privacy-safe offline flow without caching private HTML. Android stalled-network behavior was not reproduced.

## Existing safeguards and limits

- Watchlist already coalesces refreshes, skips hidden/offline polling, uses a 12-second timeout, backs off failures, and closes its stream while hidden/offline.
- Offline projection context already has scoped 60-second reuse, request coalescing and deferred scheduling. Preserve these optimizations.
- An initial favicon request burst did not repeat at the same scale; its captured initiator was browser `other`. No application cause was established; this is not a validated fix target.
- The captured ticker-page logs contained no warning/error. This is not whole-app error coverage.
- Load events do not prove chart readiness or smooth taps. No installed-phone performance or notification receipt was tested.

Routes sampled: Workspace, Watchlist list and one ticker detail. This is not whole-app performance acceptance. No visible behavior changed, so no Help Center update is required. Fixes need focused verification and a real installed-Android checkpoint; release remains separately coordinated.
