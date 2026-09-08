# Halt Alert Lifecycle Reconciliation Progress

**Status:** Local duplicate-delivery safeguard in progress; production hold active

**Controlling plan:** [Nasdaq and NYSE Halt Alerts Plan](nasdaq-nyse-halt-alerts-plan.md)

## Scope

Prevent duplicate Halt Alert Push notifications when an official exchange feed revises the raw halt-time string or republishes a sparse lifecycle snapshot. This repair does not change visible wording, preferences, delivery configuration, scheduler frequency, or database schema.

## Required behavior

- [x] Reconcile snapshots only when source, ticker, trading date and halt reason match an existing lifecycle.
- [x] Keep the original event and Push delivery; a later snapshot must not enqueue a second device notification.
- [x] Retain published quote/trade resumption times when a later snapshot is sparse.
- [x] Keep a real later halt separate once it is after the prior published resumption boundary.
- [x] Add focused ATXG, NINI and WLYP-shaped lifecycle fixtures.
- [x] Complete static review and a narrow local commit for release-coordinator handoff.

## Local verification

- [x] `git diff --check` passed.
- [ ] Targeted ESLint could not run because this fresh isolated worktree has no installed project dependencies; no dependencies were installed.
- [ ] Focused Vitest was intentionally not run under the low-resource implementation policy.

## September 8 duplicate-delivery safeguard

Read-only production evidence found one stored FCUV halt with two successful Push delivery rows. The same evidence showed BUUU and YMAT each had two distinct stored halt events, so those separate alerts must remain visible. The scheduler aggregate cannot establish a device receipt, so the reported YMAT display gap remains a separate device/subscription observation issue.

- [x] Derive the browser notification tag from `halt_id`, rather than the individual delivery row, so same-halt retries and duplicate subscriptions share one browser tag.
- [x] Set the service-worker notification to `renotify: false`; matching tags replace silently without changing click or mute behavior.
- [x] Add focused fixtures for same-halt duplicate deliveries, a retry, distinct re-halts, no newly exposed halt field, and the service-worker contract.
- [ ] Run only the agreed light static checks; focused Vitest remains intentionally deferred under the owner resource policy.
- [ ] Hold local changes for release-coordinator review; no push, Railway action, migration, configuration change, or production verification is authorized during the owner hold.

## Release boundary

The release coordinator owns any push, Railway release, migration decision, and production verification. This repair is designed without a migration.
