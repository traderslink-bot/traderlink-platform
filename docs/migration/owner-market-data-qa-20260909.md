# Owner Market Data QA — September 9

Reviewed immutable candidate `b592595decb7a9a6f78c6d2d9c561e7e27290b95` and the focused build child `a0ca6c779cf90f7038c90910e765630cd6a9fdd2`. This is source and focused semantic QA, not end-to-end runtime proof.

## Defects corrected

1. Project MUI types reject direct Stack layout props and Typography fontWeight. The one-file build child moves them into sx without changing behavior. Railway caught the first before activation; focused semantic compilation caught the second.
2. Owner pagination accepted absent termination metadata as complete. Only explicit has_more=false now proves exhaustion. Missing/invalid metadata retains validated partial candles and an explicit failure; ordinary Analyzer adapter behavior is unchanged.
3. Owner requests decoded error response bodies before checking HTTP status, mislabeling an HTML HTTP failure as JSON format failure. Owner mode checks HTTP first.
4. Out-of-order inventory reads could replace a newer filter result. Request generations discard stale responses, and batch refresh uses the current filter callback. Unreadable application responses use safe copy rather than raw parser output.
5. One-at-a-time processing existed only within one browser tab. The API now serializes owner requests within the existing single persistent Node process and rechecks authorization when each queued request begins. Failures cannot poison the queue. This does not serialize or change ordinary Analyzer jobs.
6. Shared inventory includes shorter Analyzer acquisition windows. The UI previously labeled every saved session 04:00–20:00; it now displays the actual stored requested start/end and coverage. Owner request form still requests the full extended session.

## Source checks

- Navigation, page, GET and POST require the active configured owner identity, not a display name; local-development bypass is denied. The two configured opaque subjects were checked by Coordinator, but active account label mapping remains unverified.
- POST keeps same-origin mutation protection and parsing. Queue execution rechecks authorization. GET is read-only and returns market facts/history without internal IDs, credentials or user/account facts.
- Canonical symbol/date/provider/session identity is reused. Existing schema columns and constraints support all writes. No migration is needed.
- Saves run in a short immediate transaction, retain immutable failure/partial versions, preserve current candles when the refresh has fewer timestamps or less coverage, and restore the exact worker lease atomically.
- Full-window requests retain only returned candles. Partial retrieval cannot advertise a complete coverage boundary. Current-day coverage uses request start time. No gap filling or price-jump rejection was added.
- Chart reads saved data through GET only, sorts implicitly through repository order, keeps UTC seconds, formats New York labels and removes its chart instance on cleanup.
- Exact-parent preparation excludes stale checkout contents and preserved unrelated shell changes.

## Normal Analyzer correction source audit

The already-live `b5817db2` path is preserved. The atomic editor stores row changes locally; one confirmation submits the full draft. The backend uses refreshAnalyzer=false for individual corrections and calls refreshLogicalTradesAfterRebuild after the full transaction's corrections. New requests persist fetched candles before mismatch validation. The selection service checks canonical saved coverage before reserving usage or claiming a correction opportunity. The worker skips provider acquisition and releases any reservation when stored coverage is sufficient. High/low copy refers to the selected candle minute and does not rewrite facts.

This confirms source control flow, not a live user's completed correction journey. No user executions, provider requests, database writes, or usage records were touched during QA. The legacy retention exception for jobs submitted before September 4 remains in existing worker code; new submissions retain the shared session regardless of trade date.

## Verification and release boundary

Focused React/MUI semantic compilation passes for the client/chart, using installed real typings and a verified isolated DashboardPanel/header type surface to avoid compiling unrelated dashboard code. The provider is also semantically checked against its real imported contracts. This is not full-app type checking. TypeScript syntax and exact-parent diff checks are performed for the QA child.

No Vitest, other test suite, local build/server, staging, production mutation or visual-approval workflow was run by this worker. The owner authorized direct production; Coordinator alone serializes publication, Railway build results and health confirmation. Initial candidate's build failed before activation; the previous live application remained healthy. Runtime/provider/browser behavior remains unverified by this QA pass.
