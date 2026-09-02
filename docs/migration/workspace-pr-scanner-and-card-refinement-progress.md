# Workspace PR Scanner and Card Refinement Progress

Related plan:
[workspace-pr-scanner-and-card-refinement-plan.md](./workspace-pr-scanner-and-card-refinement-plan.md).

## Current state

| Item | Status |
| --- | --- |
| Workspace card hierarchy | Implemented locally; focused static QA complete |
| PR Scanner card preference and on-demand panel | Implemented locally; focused static QA complete |
| Rules preset label colors | Implemented locally; focused static QA complete |
| Tracker helper contrast | Implemented locally; focused static QA complete |
| Demo Tracker/Workspace investigation | Source and release-service access checked; likely projection drift, confirmation blocked without an approved aggregate production diagnostic; no data changes |
| Owner visual review | Pending |

## Evidence captured

- Production `origin/main` contains the fixed Demo scope-clock commit, with
  the active Demo date set to 2026-08-21.
- Workspace reads its trade table through the derived Workspace projection;
  Tracker reads the day-session report directly. Production service access
  confirmed that an existing Workspace projection is not automatically
  refreshed, so stale projection drift is the likely cause. Exact account
  counts and symbols require an owner-approved server-side aggregate
  diagnostic; no production snapshot was exported.
- The compact scanner already fetches lazily only when rendered and its
  existing expanded panel already opens article drawers in Workspace.
- The PR Scanner preference migration is registered as 0114 but has not been
  run. It only stores the user/workspace/account display toggle and defaults
  existing users to the already-visible compact card.
- Help Center source review found no dedicated Workspace, PR Scanner, or Press
  Releases guide to amend. This small in-context control is self-explanatory,
  so no unrelated guide was changed.
- Focused static QA passed: `git diff --check` is clean, the new preference
  route/migration/manifest references resolve by source search, and the tracker
  helper explicitly uses white text in Navy Dark. No runtime or broad test
  process was started due to the low-resource working policy.
