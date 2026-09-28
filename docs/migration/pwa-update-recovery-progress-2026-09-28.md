# PWA update recovery — 2026-09-28

Status: correction prepared and focused checks complete; release and installed Android acceptance pending. Parent: 5004ed6a1701429b0a6c99c9c9a2f991e2e06840.

Owner reported Update app followed by The update could not finish. Please try again when connected. This exact production message is generated after any 15-second controller-change timeout or synchronous postMessage failure; no connectivity diagnosis is performed.

## Confirmed defects and correction

- Click used the worker captured by the banner, even if a newer waiting worker replaced it. Read the current registration at click time instead.
- Existing waiting workers were not watched for state changes. Inspect both installation and waiting transitions, and recognize activation by another tab without automatically reloading an editing page.
- Timeout assumed failure without rechecking activation, disabled automatic completion, and offered the same fragile retry. Recheck completed activation before timing out; if still delayed, show Reload app for explicit recovery. Later activation does not unexpectedly discard edits after the timeout.
- Use Serwist's supported SKIP_WAITING message, including workers older than the custom message handler. Keep the current worker implementation and push handlers unchanged.
- Preserve existing save-edits warning and saved offline entries. No unregister, cache deletion, IndexedDB change, subscription change, deployment or database operation is performed by this task.
- Visible fallback: The update is taking longer than expected. Save any edits, then reload the app. Button: Reload app. When another tab activates it: The update is ready to open. Save any edits, then reload the app. Offline entries already saved on this device will remain.
- Help Center update guidance is aligned.

## Verification and limits

- Candidate component passed focused TypeScript transpilation/syntax and ESLint without errors or warnings.
- Source-driven mocked browser/hook replay passed seven bounded cases: requested activation reloads once and clears timer; timeout offers explicit reload; late activation after timeout does not reload unexpectedly; current replacement worker is selected; another-tab activation offers reload; completed activation without controller event is recognized; unmount cancels pending work; paused banner remains hidden. The timeout and late-activation assertions share one case.
- Exact production baseline replay reproduced the stale-worker message and misleading connection error. This verifies code defects, not the exact cause on the owner's phone.
- No full build, broad suite or real Android update replay ran. Release Coordinator must reconcile source, validate integration and check deployed update behavior. Do not claim Android recovery or push receipt until observed.
- Canonical component and guide contain concurrent work and are left untouched. Immutable candidate uses exact production source with a temporary Git index, preserving real index and HEAD. Patch/commit metadata will be recorded in qa-evidence/pwa-update-recovery-20260928.json.

## Allowlist

- app/pwa/pwa-update-notice.tsx
- src/modules/help/traderslink-app-guides.ts
- docs/migration/pwa-update-recovery-progress-2026-09-28.md
- docs/migration/traderlink-platform-pwa-plan.md

## References

- Installed Serwist source supports SKIP_WAITING when skipWaiting is false.
- Service-worker activation and controller changes are distinct lifecycle signals: https://www.w3.org/TR/service-workers/ and https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event .

Existing Android push receipt/click-through and Workspace tail-latency findings remain open. This correction addresses update recovery only.
