# Communities and Coaching launch progress

Controlling plan: [Complete launch plan](traderlink-communities-coaching-launch-plan.md).

## 2026-10-10 — consolidated planning checkpoint

- Reconciled original product obligations, latest private-pilot QA, known lifecycle gaps and onboarding/activity source findings into one remaining-launch-work register.
- Preserved the complete community inventory and all thirteen coaching acceptance areas. Existing pilot successes are not relabeled as unfinished implementations, and fixture evidence is not relabeled as independent-server acceptance.
- Identified eight consolidated owner decisions. Recommendations are proposed, not approved.
- No runtime code, configuration, account data, permissions, application copy or deployment changed in this planning slice. No tests/builds run for documentation-only work.

| Work | State | Evidence / next gate |
| --- | --- | --- |
| L01 Independent onboarding | Open; confirmed pilot-specific source | Test guild/role/channel bootstrap and operator grant require replacement |
| L02 Access/lifecycle/isolation | Open; partial pilot proof | D1–D3 and independent second-server acceptance |
| L03 Coaching lifecycle | Open; existing core pilot passes retained | Extra-request rules and former-student history; D4–D5 |
| L04 Publishing/watchlists | Open; mixed existing proof and gaps | Archive recovery, item removal, placement loop, delivery/edit policy; D6 |
| L05 Activity/privacy | Open; named-retention gap identified | D5/D7; named daily storage included in retention |
| L06 Partner earnings | Conditional; not launch accepted | D8; finish enabled program or explicitly disable/defer |
| L07 Operations/integration | Launch verification open | Final candidate, current-production parity and recovery evidence |
| L08 Complete acceptance matrix | Not started for public/multi-server launch | Pilot QA retained separately; final integrated candidate required |
| L09 Owner acceptance/release | Not approved | Final verdict and explicit coordinated production authorization |

## Decision log

| Decision | State |
| --- | --- |
| D1 Admission and connecting authority | Approved |
| D2 Transfer/disconnect | Approved |
| D3 Discord outage/stale evidence | Approved |
| D4 Additional requests | Approved |
| D5 Former-student history/retention | Approved |
| D6 Publication edits/removals | Approved |
| D7 Named activity/disclosure | 90-day retention approved; disclosure and similar copy expressly rejected everywhere |
| D8 Tier 2 partner program | Referral earnings deferred. Separate incoming coaching-fee commission: dormant percentage/minimum/duration settings requested; provider/refund integration remains deferred |

## Implementation authorization

Owner clarification: both commission programs remain disabled. Incoming coaching-fee commissions receive dormant configuration; outgoing referral/affiliate earnings remain deferred. No production deployment is authorized. Continue the full L01–L08 implementation and QA inventory, not only the commission slice.

Owner authorized all remaining launch fixes and full QA, with no production deployment. The proposed disclosure text was removed from the controlling plan; no substitute is authorized. Commission activation, provider settlement and refund rules remain deferred. Configuration must stay dormant.

Workspace verification found canonical untracked community source predates the final coaching correction checkout. Coordinator has been contacted under the existing release/workspace coordination authorization before changing runtime source. Existing unrelated/staged work and any Git lock will be preserved.

## Launch foundation implementation slice

- Coordinator confirmed the existing `coaching-resume-20260926` checkout/branch as the implementation lane at parent `1a10c172a0b2e9daaf9c7b570bd67874cd200013`. Its preexisting dirty `traderlink-coaching-live-qa-20260928.md` is untouched and excluded from this slice.
- Onboarding now uses `TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS` (comma/space-separated guild IDs, empty means no admission), fresh bot-verified guild ownership and linked identity. It creates no operator grant, test mapping or test destination. Reentry preserves existing setup; conflicting ownership requires transfer verification.
- Onboarding form lists approved candidates and exposes bot installation before connecting. Removed the redundant explanatory panel; no rejected activity disclosure was added.
- Added bounded 90-day cleanup for both raw named events and named daily-member rollups. The existing one-minute maintenance worker runs this even for idle communities. No new retention migration or hosted deletion has been executed.
- Community activity recording now excludes coaching workspaces, student pages, administration and query-bearing paths; only community content routes qualify. Existing historical private-path rows still need reconciliation before launch; this is not silently marked complete.
- Focused `verify-community-launch-foundation.ts`: PASS using an in-memory real-schema database. Covers admission, fresh/future/stale evidence, ownership mismatch, no seeded grants/channels, reconnect preservation, transaction rollback, retention/idempotence and activity-route boundaries.
- Existing `verify-coaching-remediation.ts`: PASS including recurrence, limits, role pause/restore, archive preservation and maintenance. Used shared installed dependencies plus a test-only shim for Next's build-time `server-only` marker; actual service/authorization/database logic was not mocked.
- `git diff --check`: PASS. Browser QA, semantic hosted build and independent-guild acceptance remain open. Neither staging nor production has been changed by this slice.
- Before staging this slice, coordinator must configure the approved-guild allowlist explicitly (including the existing test guild), confirm dedicated bot credentials/client ID, and compose from current production while preserving approved staging work. No automatic admission fallback is built in.
- Help inventory reviewed: no dedicated Communities/Coaching guide exists in the inspected feature registry. Full workflow Help remains an L07 deliverable; no activity disclosure is to be introduced there.

## Dormant commission and administration correction slice

- Both commercial programs remain disabled server-side. Referral attribution and billing events cannot accrue earnings, including with old active configuration. Removed unavailable owner earnings cards and active partner configuration controls.
- Owner-only coaching commission settings preserve exact hundredths for percentage/minimum, USD/CAD currency and optional duration in days/weeks/months, scoped to a community or its coach. Saving always creates disabled terms; there is no collection, payout, refund or Whop integration.
- Reserved migration `0159_platform_coaching_commission_terms`, order172, predecessor0158: four additive nullable columns on existing coach-fee rules. No existing records rewritten, no hosted migration applied. Integration must append to the coordinator's current manifest after0158, not replace it with this older checkout's manifest. Rollback code may ignore these nullable columns; do not attempt destructive down-migration.
- Corrected community status audit writes and admin audit reads to the actual schema; administration staff inventory now includes Discord-mapped responsibilities instead of only historical manual assignments.
- Focused foundation fixture PASS: unauthorized admin/fee actions rejected, status audit succeeds, exact commission precision/limits/target/duration validated, activation rejected, referral events create no earnings. Actual admin staff/audit SQL compiles against the fixture schema.
- Existing Communities fixture PASS: 20 capabilities, community isolation, Discord role mapping, no foreign-key violations, Journal revocation, named activity and disabled Tier2 accrual.
- React checklist applied to server-action authority and direct UI imports; existing dashboard shell retained. No production or staging deployment. Full semantic/build/browser and launch matrix remain open.

Next: complete L01 role/channel validation and independent-server proof; L02 freshness/transfer/disconnect; remaining coaching/content lifecycle; final integrated full QA. These slices do not complete L01–L09 or authorize a deploy.
