# Railway Main Source Reconciliation Progress

**Controlling plan:** [Railway Main Source Reconciliation Plan](railway-main-source-reconciliation-plan.md)

## Completed

- [x] Verified the live Railway source branch from deployment metadata instead
      of assuming `main`.
- [x] Recorded the current live commit, service topology, health state, common
      ancestor and branch divergence.
- [x] Confirmed that switching Railway directly to `main` would be unsafe.
- [x] Added the branch-source invariant to `AGENTS.md`.
- [x] Reconciled the unique `main` Day/Swing Tracker and migration package by
      retaining the verified equal or later live-source versions.
- [x] Integrated the Workspace first-time onboarding release into the
      two-parent reconciliation tree.
- [x] Published canonical `main` reconciliation commit `941a9af3`.
- [x] Configured Railway to deploy `main`; deployment `cb5e0554` successfully
      deployed follow-up `fa03f604` and health reported `ready` with 84
      migrations on `sqlite_single_node`.
