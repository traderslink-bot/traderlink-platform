# Workspace PR Scanner and Trade Table Refinement Progress

Related plan:
[workspace-pr-scanner-and-trade-table-refinement-plan.md](./workspace-pr-scanner-and-trade-table-refinement-plan.md).

## Current state

| Item | Status |
| --- | --- |
| PR Scanner Navy Dark and live compact refresh | Implemented locally; focused static QA complete |
| Workspace action tooltips | Implemented locally; focused static QA complete |
| Trade table results, Analyzer state and sort controls | Implemented locally; focused static QA complete |
| Owner visual review | Pending |

## Evidence captured

- The full panel's scanner endpoint is `/api/platform/news/workspace-scanner`;
  its archive action routes separately to `/press-releases`.
- Workspace table rows come from the bounded derived trade-library projection.
  Sort must remain server-side so pagination stays correct.
- Trade Tracker treats a ready analysis as valid only when it matches the
  current round-trip version and its projection fingerprint. The table will
  reuse that current-version truth rather than treating any historical analysis
  record as ready.
- Focused static QA passed: `git diff --check` is clean; source checks confirm
  the compact-card interval cleanup, panel Navy Dark contrast, all header sort
  contract values, cursor sort-key coverage, and the current-version Analyzer
  predicate. No app server, browser, broad test runner, build, or migration
  process was started under the low-resource policy.
- The owner approved replacing the initial 60-second compact-card refresh with
  an on-demand Server-Sent Events update signal. The existing live Watchlist
  stream is the project precedent; this remains separate from user-facing Push
  notifications and uses the canonical saved article feed after each signal.
- Focused static QA confirms the canonical article route saves and revalidates
  before it emits an empty update signal, the stream uses the same access gate
  as the scanner feed, and the compact card closes its live connection and
  removes its visibility listener when hidden. `git diff --check` passes. No
  app server, browser, test runner, typecheck, lint, build, or migration was
  started under the low-resource policy; owner visual review remains pending.
