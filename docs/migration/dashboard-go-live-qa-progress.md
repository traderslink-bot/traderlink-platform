# Dashboard Go-Live QA Progress

## Purpose

This record tracks the final product and operational readiness review for the
complete TradersLink Platform dashboard. The review uses the full accepted
product inventory as its target and separates launch blockers from serious
defects, minor defects, usability improvements and external hosting gates.

The controlling operational checklist remains
[TradersLink Platform Live Launch Readiness](traderlink-platform-live-launch-readiness.md).
This record does not authorize deployment, production data transfer, provider
activation, DNS changes or legacy deletion.

## Approved review scope

- Confirm the exact repository, branch, commit, runtime and selected release
  boundary while preserving unrelated tracked and untracked work.
- Audit every dashboard navigation route and critical deep link for complete,
  purposeful and understandable behavior.
- Review Account Settings, Daily and Swing Trade Tracker, Quick Trade Entry,
  imports, Data Decisions, Open Positions, Round Trips, Calendar, Analytics,
  Trade Analyzer, Rules, notes, tags, reviews, AI surfaces, Market Charts, Help
  Center and Journal Administration.
- Verify critical account isolation, exact financial facts, trading dates,
  timezones, unavailable states, privacy boundaries and destructive-action
  safeguards.
- Check desktop, narrow mobile, keyboard and basic accessibility behavior.
- Compare the implemented behavior with Help Center promises.
- Present visible UI corrections for owner approval before implementation.
- During implementation use focused, low-resource checks only. Run final
  regression, production build and browser acceptance at the explicit final
  release-candidate checkpoint.

## Current boundary — 2026-08-12

- Repository: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`.
- Branch: `codex/traderlink-platform-replacement`.
- Starting commit: `f2ccfd0ff8916efaf621476b9db69863b1c15b9a`.
- The branch is ahead of its remote tracking branch. It is not a clean,
  synchronized `main` release candidate.
- The working tree contains pre-existing launch-readiness and local tooling
  work. Those files remain outside this QA slice unless their ownership is
  explicitly reconciled.
- No dashboard listener was present on ports 3000, 3010 or 3011 at the start of
  this review.
- The normal local launcher starts the Daily Trade Analyzer and Moomoo import
  workers. It is not suitable for controlled read-only browser QA without a
  worker-disabled mode.
- No Vitest or broad test suite has been run during active review.

## Findings

### Launch blockers

1. The Workspace `Performance details` action links to
   `/analytics/performance`, but the route does not exist. The action currently
   leads to a 404 and must be repaired before launch acceptance.
2. `/account` redirects to `/account/preferences`, where the shared Account
   Settings layout crashed because a Next.js link function crossed the Server
   Component boundary into a Material UI client component. All five Settings
   sections were unusable. The intended layout is now isolated behind the
   required client boundary. Preferences, Trading, AI & plan, Profile & access
   and Privacy all render with their expected headings and no browser errors in
   the worker-disabled canonical runtime.

### Runtime blockers

1. A controlled worker-disabled local review runtime is not currently exposed
   by the canonical launcher. Add an explicit opt-in review mode before using
   the real local database for browser QA.

### External launch gates

1. Railway project, persistent volume, production database, secrets, Discord
   identity, hosted-source transfer, schedulers, monitoring, backup/restore,
   domain routing and rollback remain governed by the live-launch checklist.

## Checkpoints

- [x] Establish repository, branch, commit, working-tree and process boundary.
- [x] Preserve unrelated dirty and untracked work.
- [x] Add a worker-disabled review runtime through `npm run dev:review`.
- [x] Statically verify the worker-disabled review runtime with package JSON
  parsing, targeted ESLint and `git diff --check`.
- [ ] Complete source-level route, promise and Settings audit.
- [x] Repair and browser-verify the shared Account Settings runtime boundary.
- [ ] Complete controlled desktop and narrow-mobile browser audit.
- [ ] Present visible UI corrections for owner approval.
- [ ] Implement approved launch-blocker fixes in coherent slices.
- [ ] Complete focused verification for each accepted slice.
- [ ] Complete final release-candidate regression, build and browser acceptance.
- [ ] Produce the final go/no-go report.

## Commit record

No QA slice commit has been created yet.
