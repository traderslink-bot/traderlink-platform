# Plan-controlled generation allowances

Status: implementation complete in the existing membership release worktree; source review and focused static checks complete. Runtime, browser/owner acceptance and publication remain pending.

## Complete requested inventory

- Independent Trade Analyzer analyses and Levels Generator generations per plan.
- Any nonnegative whole-number quantity (including zero), or unlimited.
- Any positive whole-number reset interval in days, or no reset.
- Existing free/paid/trial/Discord/owner-grant sources all participate.
- Admin create/edit/clone/publish controls preserve immutable published versions.
- Member balances/reset information and matching public upgrade links.
- Private/unlisted offers stay out of public upgrade results.
- Saved results, account isolation, Analyzer retry/correction waivers, owner exemption and provider protections preserved.

## Implementation contract

Feature keys: `trade_analyzer.analyses` and `levels.generations`.
The owner enables each feature independently in Memberships feature policies.
Off/shadow retains the existing commercial behavior; enforced uses plan allowances.
Neither policy is silently activated by this release.

Migration `0150_platform_membership_generation_allowances` adds nullable
`reset_days` to versioned plan features. Blank quantity is unlimited. Blank
reset is non-resetting. Intervals are fixed UTC days anchored at the version's
publication time, not calendar months or login/Discord refresh timestamps.
The form and Help disclose this convention.

Access combines sources by the greatest remaining allowance, not summed duplicate
grants. No active grant means zero when enforced. An unlimited grant wins.
Usage remains user-wide across accounts and is not erased by switching plans.
Non-resetting allowances include all recorded usage. Finite periods count usage
within the applicable interval; active Analyzer reservations count immediately.

Analyzer uses the existing reservation/acquisition ledger. Admission remains an
immediate transaction. Each distinct reservation charges once at its first
user-charged acquisition, even when continuation downloads cross reset boundaries.
Before a first acquisition, current membership is rechecked with the reservation
itself excluded. Saved-candle reuse and existing supported retries remain waived.
Provider failure does not automatically refund a started acquisition.
Existing owner exemption and global provider caps/spacing remain intact.

Levels uses `platform_stock_levels_usage`, not a second ledger. Under enforced
membership, the plan quantity replaces legacy 5/hour and 15/day commercial caps
(including the former Premium unlimited shortcut). Fresh successful persistence
and usage recording use an immediate transaction and completion-time quota
recheck. Unlimited plan usage is also recorded so a downgrade does not erase it.
Saved-map reads/deletes remain available. Cached maps do not add usage.
Concurrent provider calls may occur, but cannot commit beyond the allowance.

## Verification and boundaries

- Targeted TypeScript compiler: 39 changed/new roots, zero diagnostics after
  fixing a missing Button import.
- Source review covered zero, unlimited, additive sources, immutable cloning,
  expiry, reset boundaries, duplicate/continuation charging and account scope.
- Scoped ESLint: zero errors and three existing warnings. Final changed-file
  lint rerun and whitespace check passed. See [handoff](membership-additions-handoff.md).
- No test suite, provider call, local server, browser, production build, database
  migration or deployment was run, per owner resource/testing constraints.
- Static/source evidence is not runtime acceptance. Release acceptance must cover
  real admin form persistence, migration, concurrency, zero/unlimited, expiry,
  retries, period transitions, private-offer exclusion and Light/Navy Dark UI.

## Workspace / handoff

Implementation parent: `d5ec13293400a5849636a6049a4761e272eb7928`.
Existing branch: `codex/membership-production-20260928`.
Workspace: `C:\Users\jerac\Documents\TraderLink\worktrees\membership-production-20260928`.
No new worktree or branch was created. No production/authentication boundary was
changed. The canonical checkout is stale/mixed; do not overlay its older Analyzer
or Watchlist files on this work. Payment processor verification is separate.
