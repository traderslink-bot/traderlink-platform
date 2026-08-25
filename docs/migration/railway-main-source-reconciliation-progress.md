# Railway Main Source Reconciliation Progress

**Controlling plan:** [Railway Main Source Reconciliation Plan](railway-main-source-reconciliation-plan.md)

## Completed

- [x] Verified the live Railway source branch from deployment metadata instead
      of assuming `main`.
- [x] Recorded the current live commit, service topology, health state, common
      ancestor and branch divergence.
- [x] Confirmed that switching Railway directly to `main` would be unsafe.
- [x] Added the active branch-source invariant to `AGENTS.md`.

## In progress

- [ ] Reconcile the unique `main` Day/Swing Tracker and migration package onto
      the live source without losing live routes or altering applied migration
      identities.
- [ ] Integrate the committed Workspace first-time onboarding release into the
      reconciliation tree.
- [ ] Publish and verify the two-parent canonical `main` reconciliation commit.
- [ ] Reconfigure Railway to deploy `main`, then verify deployment metadata and
      health against the exact published SHA.

## Guard

No push to `main` is production deployment evidence until Railway reports
`branch: main` for the published reconciliation SHA. No force push, reset,
branch deletion, Railway restart, migration rerun, or source-branch change is
permitted before the reconciliation checks in the controlling plan pass.
