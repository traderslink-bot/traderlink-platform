# Membership local acceptance checkpoint

Status: Local membership acceptance complete, 2026-09-27. This record supersedes the
historical runtime/provider blocker in the [completion tracker](membership-full-qa-completion-progress.md).

## Scope

The owner's full configurable membership inventory remains in the
[acceptance matrix](membership-acceptance-matrix.md). Payment-processor integration
and live verification are a separate goal, to be done last. No deployment,
production migration, real charge, or real member change is part of this checkpoint.

## Rendered signed-member evidence

- Canonical `traderlink-platform` checkout, `main`, loopback 3018. Only the retained
  synthetic membership QA database was used. Normal session cookies and compiled
  production page authorization were used; no local-owner assertion or operator
  grant was provided.
- The isolated QA harness omits only Railway's `/data` startup readiness,
  migration maintenance and background workers in process memory. It does not
  modify application source/build artifacts or mock membership/session checks.
  This is not Railway deployment acceptance.
- A synthetic member without Discord guild membership could open Workspace with
  Dashboard/Journal grants. With Analytics denied, the performance cards were
  absent and the populated Journal review displayed QATEST, one completed trade,
  and +$10.00. Granting Analytics restored performance cards. Denied Analytics
  redirected to Plans. Revoking Dashboard access redirected Workspace to Plans.
- Plan & billing still rendered after all grants were revoked and showed no active
  plans, without requiring a Discord server or paid dashboard access.
- Browser IndexedDB inspection confirmed a newly captured Journal-only Workspace
  model with zero Analytics metrics and the QATEST review, not invented metrics.
- After the validator correction, the saved Workspace rendered that review with
  no Analytics cards and a saved-at timestamp. Reloading with browser networking
  disabled also passed; `navigator.onLine` was false. Browser warning/error logs
  were empty at the completed rendered checkpoint.

## Final QA corrections

- Discord refresh previously skipped a departed server when absent from the current
  guild list. It now resolves every active membership-rule server, including when
  the member belongs to none. Confirmed absence records an audited invalidation
  that supersedes the retained immutable snapshot for automatic grants and
  purchase eligibility. A later verified membership can restore access. A lookup
  failure does not write absence or prevent other servers from refreshing.
- The actual OAuth callback passes a disposable mocked-Discord check for role
  removal, leaving every selected server, rejoining and per-server failure
  isolation. No real OAuth exchange or Discord account was used.
- The offline Workspace validator previously rejected the legitimate empty
  Analytics list for a Journal-only plan. It now accepts that list while retaining
  the remaining schema validation. Added focused regression assertions.
- Help now describes independent Journal/Analytics offline behavior and separates
  app-owner plan control from Discord server-owner permissions.

## Build and verification boundary

- The installed Next.js Windows `--debug-build-paths` filter compared slash styles
  inconsistently and initially omitted requested routes. That empty build was
  rejected as evidence. The installed `NEXT_PRIVATE_APP_PATHS` route-selection
  test hook was used for bounded compilation with one worker and a 1 GiB heap.
- Next's split compile/generate flow renamed its generated proxy twice. Restoring
  the generated proxy input from the identical middleware artifact allowed the
  generate phase to finish. No dependency or application configuration was edited.
- These are selected-route builds plus the focused membership compiler, not a
  whole-repository production build or full regression suite. Generated tracked
  service-worker output was restored from its pre-build backup; `public/sw.js`,
  `next-env.d.ts` and `next.config.ts` have no task-generated changes.
- Final compile and generate both exited successfully for Plans, invitation,
  billing, Workspace, Analytics, trading account, offline, PWA context/scope,
  manifest and Discord callback routes. The final focused TypeScript graph passed
  115 entrypoints with zero diagnostics.
- Exact-file ESLint and scoped whitespace checks passed after the final code changes.
- The expanded signed-request verifier and foundation verifier passed after the
  final corrections. Foundation includes 19 membership tables, custom features,
  additive grants/limits, time/revocation boundaries and private-link protection.
  The previously recorded full 131-entry migration rehearsal and mocked provider
  checks remain valid; no migration or payment adapter changed in this final slice.
- Synthetic login cookie removed, network emulation restored, temporary browser
  tab closed, QA server stopped and no port 3018 listener remained. Disposable
  QA data and ignored harness scripts are retained for reproducibility. No commit,
  push, deployment or unrelated process change occurred.

## External acceptance

Real Stripe/Whop accounts, checkout, verified delivery and portals belong to the
separate final payment goal. A real multi-server Discord OAuth check is also not
claimed by mocked callback verification. Production publication and final hosted
release checks require their own authorized release checkpoint.
