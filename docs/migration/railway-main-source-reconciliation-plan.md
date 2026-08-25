# Railway Main Source Reconciliation Plan

**Status:** Active repair — no Railway source change has occurred.

**Progress:** [Railway Main Source Reconciliation Progress](railway-main-source-reconciliation-progress.md)

## Outcome

Make `main` the one complete, canonical TraderLink Platform source branch and
configure `traderlink-platform-web` on Railway to deploy only `main`.

## Verified starting point — 2026-08-24

- `main` is at `0b08eba9`, two commits beyond common ancestor `b688c011`.
- Railway deploys `codex/traderlink-platform-replacement`, currently at
  `96b6fa6c`, 157 commits beyond that ancestor.
- The Railway service is online with one persistent `/data` volume and reports
  `ready` with 84 migrations.
- The branches differ across 233 paths. `main` contains a unique Day/Swing
  Tracker and migration package that must not be silently discarded.

This means changing Railway to `main` now would deploy an incomplete snapshot.
Force-pushing either branch would lose recorded work and is prohibited.

## Main-only package assessment

The unique pre-existing `main` package was compared path-by-path with the live
source before reconciliation. Fourteen of its paths are byte-identical in the
live tree. Eight were subsequently improved there, including the Swing Tracker,
position-reference handling and the migration manifest. The two apparent
missing paths are obsolete market-halt migration filenames whose replacement
identities are already active on the live branch. The reconciliation tree keeps
the live versions in every one of those cases; it does not replay stale files
or applied migration identities merely to make history look similar.

## Controlled reconciliation

1. Freeze release publishing while this repair owns the Railway slot. New work
   may be committed locally, but no competing GitHub/Railway release is made.
2. Build a temporary-index reconciliation tree from the live source. Preserve
   every live-path file, then incorporate the unique `main` package after
   resolving its migration-numbering and source conflicts against the current
   manifest. Do not use a working-tree merge, reset, or force push.
3. Add the already committed Workspace first-time onboarding slice to that
   tree. It remains a narrow 12-file feature allowlist inside the larger
   reconciliation record.
4. Create one merge commit with `main` as first parent and the live Railway
   branch as second parent. Its tree is the exact reconciled application. A
   normal fast-forward then advances `main`; no historical branch is rewritten.
5. Verify the reconciliation tree with migration-specific checks, focused
   static checks for changed source, clean diff/allowlist review, and a
   production build only after the merge tree is complete.
6. Change Railway's GitHub source branch to `main` only after the verified
   merge commit is published. Railway must deploy that exact commit with one
   replica and the existing persistent volume.
7. Confirm Railway metadata reports `branch: main` and the reconciliation SHA,
   then confirm `/api/platform/health` reports `ready`. Retain the old branch
   as read-only history until the owner explicitly authorizes its retirement.

## Permanent release standard

Every production release must begin by verifying the Railway deployment
metadata, then use a clean temporary index parented to that exact remote tip.
The release handoff records the source branch, parent SHA, published SHA,
allowlist, deployment ID/status, and health result. A push is not treated as a
deployment unless Railway metadata identifies that same SHA.
