# Plan-controlled generation allowances

Status: owner authorized implementation; current-production integration audit underway.

## Complete requested addition

- Independent Trade Analyzer analyzed-trade allowance per plan.
- Independent Levels Generator generation allowance per plan.
- Owner-selected quantities, free plans, higher/lower tiers, and unlimited.
- Configurable reset periods rather than a hard-coded monthly-only restriction.
- Member-facing balance/reset information and matching public upgrade offers;
  do not advertise unlisted/private offers.
- Preserve saved-result reads, account isolation, owner controls, retry handling,
  and provider resource protections; avoid duplicate usage ledgers.

## Integration evidence

The canonical mixed checkout lacks the current-production shared analyzer
allowance implementation. Production parent
`3e40070f577e3b43c3279dd97809006878729f67` contains
`src/modules/level-analysis/server/shared-analyzer-allowance-repository.ts`,
its contracts, owner exemption and manual retry repositories, and the allowance
API. Do not patch the older daily analyzer job path as a substitute.

Production analyzer counts distinct charged reservations plus active
reservations. Acquisition begins the existing charge; provider failure does
not automatically erase that charge. Retry/correction waivers and provider
spacing/global ceilings are separate. Plan integration must preserve or
explicitly reconcile these semantics, not silently claim success-only charging.

Levels Generator currently uses `platform_stock_levels_usage` and fixed 5/hour,
15/New York day ceilings for limited members. Cached maps do not consume fresh
generation quota; fresh successful map persistence and usage recording share a
transaction. The custom-plan path must replace the commercial ceilings when
configured, without creating a second counter or blocking saved-map reads.

## Remaining work

1. Reconcile with the assigned current-production release worktree without
   importing unrelated Communities/Coaching staging code.
2. Implement versioned allowance/reset configuration, effective entitlement
   resolution, and owner controls; preserve immutable published plan behavior.
3. Connect admission/reservation and persisted usage for both generation paths.
4. Connect balance/reset/upgrade UI and Help; verify concurrent admission,
   upgrades/downgrades, expiry, zero, unlimited, retries and period boundaries.
5. Low-resource targeted verification and coordinator handoff; no hosted
   migration, provider call, server or deployment from this task.

This is not completed functionality and is not covered by the earlier
membership QA acceptance.
