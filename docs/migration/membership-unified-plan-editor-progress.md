# Unified membership plan editor

Owner approved the complete redesign and combined QA on October 10, 2026.
Status: implementation in progress; NOT release-ready. No deployment until the
complete slice passes QA. No paid AI calls, payments or real notifications.

## Controlling inventory

- Compact searchable/filterable collapsed plan list; edit, duplicate, draft delete,
  stop new signups/archive actions distinct from existing-member revocation.
- One populated editor: details/descriptions, feature selections, allowances/reset
  periods, news delays, prices/access, payment providers, trials, Discord rules,
  public/private placement. Internal plan keys and version history stay hidden.
- Atomic current-form save/publish, validation preserving entries, unsaved-change
  warning, stale-edit protection, retry protection, success then collapse.
- Exact configuration duplication into a separate unpublished plan; never duplicate
  members, subscriptions, usage, invitation tokens or activate checkouts implicitly.
- Bulk existing-member access update with impact summary; preserve unrelated grants,
  usage, trial history and provider billing terms. Price changes do not silently
  change existing subscriptions. Preserve future-renewal behavior deliberately.
- Edit existing price/trial configuration without overwriting historical purchases.
- Public publish includes configured public purchase options; provider readiness
  checks distinguish configured, test and verified. Display-only is explicit.
- Trials include duration, price, repeat eligibility, capacity, dates, payment method
  and end behavior. Whole-app selection belongs in the plan rather than a second flow.
- Plan-scoped Discord eligibility/free/special pricing; readable server/role selection
  where existing verified integration supports discovery. Preserve independent access.
- Private-page placement in plan plus separate multi-plan page management; stable
  secret URLs, noindex and audience boundaries preserved.
- Notifications derive from included features; eligible preferences default ON,
  explicit OFF survives edits/upgrades. Locked settings name qualifying plans.
  Device permission/address verification remain delivery prerequisites, not defaults.
- Shared feature descriptions versus plan overrides clearly distinguished; effective
  enforcement displayed. No invented tiers or commercial restrictions.
- Compact desktop feature grid/mobile stacking, no repeated unrelated cards,
  retired/test records outside normal selectors, usable preview and readiness summary.
- Align Help and stale status documents. Members, subscriptions, global provider
  connections, billing health and audit remain separate operational screens.

## Design checkpoint

Approved workflow: Create -> configure everything -> Save/Publish -> collapse;
Edit restores all settings; Duplicate opens a complete unpublished copy.
Editor sections: Details, Features, Prices and access (nested provider/trials/Discord),
Private pages, Preview and publish. Feature-specific allowances sit beside features.
Desktop uses the existing admin frame and a dense responsive grid; mobile one column.
Owner visual acceptance remains a checkpoint, not permission to deploy unfinished work.

Owner clarification: New plan opens a blank editor above the list (or the main
content when no plans exist). It does not require or create a placeholder row.
Save creates the collapsed row. Edit opens beneath its saved row; Duplicate opens
a populated new-plan editor above the list. Only one editor is open at a time.

## Source boundary

Canonical checkout is shared and extensively dirty/staged. Do not alter that index,
switch branch, or include other work. October10 recorded production ba5e4a3b is the
comparison baseline, not necessarily latest remote. Editor/action source matches that
baseline; local repository implementation is stale for reset_days and must be
reconciled explicitly. Coordinator notified for schema reservation/remote QA.
Coaching/Communities changes are handed off and excluded from this scope.

## QA gates

1. Pure contract/round-trip validation and incomplete-draft preservation.
2. Disposable database: exact copy, atomic rollback, stale/retry handling, draft
   deletion, publish/availability, bulk migration, renewal and usage preservation.
3. Mocked provider readiness and notification defaults/explicit opt-out/locked plans.
4. UI hydration/edit/save/reopen, failed-save retention, publish submitted values,
   duplicate, compact list, preview, desktop/mobile keyboard accessibility.
5. Integrated remote typecheck/build and authenticated browser acceptance with
   synthetic records only; no paid provider calls or real notification dispatch.
6. Narrow exact-parent release handoff only after all required gates pass.

## Progress

### Continued integration checkpoint — October 10

- Owner-authorized save/publish actions now call the atomic publication command;
  the admin Plans route uses the unified workspace. Old price/trial/Discord tabs
  route to Plans; global provider configuration stays separate. Overview metrics
  and private-page controls no longer repeat under every section.
- Publication writes immutable commercial terms, descriptions, private-page
  placement and associated notification permissions in one transaction. Free
  publishing automatically provisions the internal free provider when absent.
- Bulk updates preserve grant identity, expiry, billing and unrelated grants.
  Direct and currently eligible Discord members are counted once. Unchecked
  updates preserve eligible Discord cohorts under ongoing role/freshness checks.
  Usage anchors/carryovers prevent a changed reset interval from clearing usage.
- Archive stops enrollment while preserving direct and retained Discord access.
  Applied version-change history is kept; only pending transitions are superseded.
- Migration-gated default-ON preferences are connected to account reads and
  platform/news/halt delivery eligibility. Existing stored OFF remains OFF.
  Saving one delivery channel leaves others intact; locked categories are not
  silently recorded as opt-outs. Queued deliveries recheck opt-outs.
- Locked notification links now show qualifying public plan names. Help copy
  describes associated notification access and default-ON behavior.
- QA fixes: free-provider initialization, disabled nested trial/Discord settings
  retained on reopen, compatible MUI layout props, target-compatible BigInt usage,
  and preservation of already-applied version-change history.
- Focused compiler checkpoint expanded to 18 roots, zero diagnostics. Batch lint
  passed across the unified UI, actions, publication/member/default implementation,
  account settings, news/halt readers, Help and QA files.
- Expanded in-memory SQLite checks pass for current-form publication/reopen,
  idempotence, stale rejection, transaction rollback, bulk expiry/usage preservation,
  Discord cohort/role checks, trial-repeat lineage, private display-only catalog,
  and notification ON/OFF persistence. No network calls, real database changes,
  paid AI calls or real sends. Archive follow-up passed. Added actual Levels
  allowance read proof across the carryover/reset and queued remote-message
  opt-out suppression proof; both passed.
- Read-only Platform bot server/role discovery added, with paginated servers,
  refresh controls, readable choices and explicit advanced-ID fallback. Mocked
  discovery checks confirm GET-only paths, validation and safe errors. No real
  Discord request or role change was performed.
- Paid/card-required trials can use a configured processor even on a free access
  option; offline publication verifies exact trial amount and currency.
- Help now covers the unified owner workflow, archive, bulk access, per-plan copy,
  default-ON notifications and provider-independent enrollment.
- Coordinator reserved migration 0165 / execution order 178 after Communities
  0164 / order 177. Added the descriptor and narrow manifest registration/table
  inventory. No production schema changed. The canonical checkout's older
  migration inventory is NOT an integration parent: coordinator is reconciling
  current production with the accepted complete migration lineage.
- The private Watchlist period guard exposed a publication-order defect: insert
  the version as draft, write features/periods, then mark published inside the
  same transaction. Corrected and covered by actual private allowance/reset reads.

### Earlier implementation record

- Read-only audit completed. No implementation QA pass claimed.
- Full scope recorded; current source and framework form contracts inspected.
- Draft contract/store, editor fields, readiness checks and compact list components
  are local implementation in progress; not connected to the live route yet.
- List supports empty-state New plan, inline Edit, Duplicate, draft deletion,
  search/status filtering and visible success/error feedback. Server wiring pending.
- Reopen projection now retains saved trial end behavior, Discord display names and
  non-purchasable display-only/disabled price configuration.
- Earlier focused offline draft/contract proof passed; this is NOT full feature QA.
  Publication, grandfathered access, trial lineage, notification defaults, migration
  registration and integrated browser acceptance remain open. No deploy performed.
- Continued implementation: opening an existing plan is now read-only until Save;
  duplication retains private-page placement selections but copies no URL secrets or
  member records. Owner-authenticated open/discard actions added. Legacy unpublished
  drafts have a recoverable, audit-preserving removal path; published history is kept.
- Preview now reuses the existing blue public-card stylesheet, including editable
  brief/expanded descriptions, formatted USD budgets, allowance periods and trial
  wording. Preview checkout buttons cannot start checkout. News delay input supports
  minutes or seconds instead of requiring conversion to seconds.
- Added publication preparation and immutable commercial-term insertion helpers.
  These are not yet the complete atomic publication command and are not wired live.
  Removed an incorrect Stripe price-reference requirement: the existing checkout
  already builds price data from the configured amounts and billing interval.
- Trial family tracking added so revisions share enrollment/repeat history; claims,
  catalog capacity and admin counts use that family when the new schema exists.
  Explicit trial end behavior now flows to checkout and public wording; end-access
  trials on recurring options must not silently create a recurring subscription.
  These runtime changes still need the final permitted verification checkpoint.
- Associated-notification derivation added to publication preparation. Parent
  features determine categories, with Market halts retained as a standalone feature.
  Default-ON preference persistence and locked-plan account links remain pending.
- Focused ESLint completed without errors on the continued 19-file slice and the
  final four-file follow-up. No test suites, dev server, production
  build, provider calls, notification dispatch or deployment were run in this
  continuation, following the current design-first/resource instructions.
- Help review: `src/modules/help/paid-plan-guides.ts` requires updates for unified
  plan descriptions, associated notifications, default-ON and trial behavior when
  route integration is complete. Existing guide copy has not yet been replaced.

## Current resume boundary

### Exact-parent reconciliation checkpoint

- Coordinator supplied integration parent `71e9aa2a05ba2b36406cb07d699f584557c54cda`.
  Migration reservation remains 0165 / order 178 after 0164 / order 177.
- Narrow file overlays preserve newer account Appearance, reverse-split and
  Watchlist settings, and the complete halt lifecycle/revision/expiry behavior.
  Do not stage those stale canonical files wholesale. The explicit candidate
  inventory and overlays are in `artifacts/membership-unified-editor/`.
- Corrected a newly found default-ON gap in the newer Watchlist preference and
  recipient paths. Explicit opt-outs, active accounts, verified delivery targets,
  membership checks and delivery-time checks remain required.
- Exact Git-tree offline proof passed for publication, complete editor readback,
  duplication, retry/stale protection, bulk grants/expiry/usage, Discord retained
  access, trial lineage, private display-only placement, notification defaults
  and opt-outs, and server-rendered empty/new/populated editors. Zero network
  calls. This proof used the real integrated 0148 membership migration, not the
  obsolete split migration files in the shared checkout.
- Exact-parent type checking is NOT passed: the first virtual-reader attempt
  exposed a harness dependency-directory lookup defect (corrected); the rerun was
  stopped after it noticeably slowed the shared machine. Do not rerun heavyweight
  local checks. Exact-parent type/lint/full-manifest/browser gates remain pending
  for the coordinated remote QA slot. Remote build and
  interactive browser acceptance remain open. Coaching owns the existing staging
  slot; coordinator was notified to queue membership QA, not deploy production.

This remains an uncommitted feature slice in the shared checkout, not a release
packet. Publication, bulk updates, defaults and route integration are now connected.
Remaining: coordinated integration-parent/provenance reconciliation and
integrated non-production build/browser acceptance. Preserve all other
tasks' staged work. No deployment authorized by this checkpoint.
Do not equate focused lint or the earlier draft-store proof with full QA acceptance.
