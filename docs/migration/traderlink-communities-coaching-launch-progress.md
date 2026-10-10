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
- Initial Help lookup missed the Communities section in `src/modules/help/traderslink-app-guides.ts`; corrected in the later Help audit below. Full workflow Help remains an L07 deliverable; no activity disclosure is to be introduced there.

## Dormant commission and administration correction slice

- Both commercial programs remain disabled server-side. Referral attribution and billing events cannot accrue earnings, including with old active configuration. Removed unavailable owner earnings cards and active partner configuration controls.
- Owner-only coaching commission settings preserve exact hundredths for percentage/minimum, USD/CAD currency and optional duration in days/weeks/months, scoped to a community or its coach. Saving always creates disabled terms; there is no collection, payout, refund or Whop integration.
- Reserved migration `0159_platform_coaching_commission_terms`, order172, predecessor0158: four additive nullable columns on existing coach-fee rules. No existing records rewritten, no hosted migration applied. Integration must append to the coordinator's current manifest after0158, not replace it with this older checkout's manifest. Rollback code may ignore these nullable columns; do not attempt destructive down-migration.
- Corrected community status audit writes and admin audit reads to the actual schema; administration staff inventory now includes Discord-mapped responsibilities instead of only historical manual assignments.
- Focused foundation fixture PASS: unauthorized admin/fee actions rejected, status audit succeeds, exact commission precision/limits/target/duration validated, activation rejected, referral events create no earnings. Actual admin staff/audit SQL compiles against the fixture schema.
- Existing Communities fixture PASS: 20 capabilities, community isolation, Discord role mapping, no foreign-key violations, Journal revocation, named activity and disabled Tier2 accrual.
- React checklist applied to server-action authority and direct UI imports; existing dashboard shell retained. No production or staging deployment. Full semantic/build/browser and launch matrix remain open.

## Discord selections and activity reconciliation slice

- Existing role/channel forms now select resources returned by the connected Discord guild. Save actions re-fetch and validate the selection after checking the actor's capability; names come from Discord, not client fields. No Discord resource is created or edited.
- Channel choices evaluate bot base permissions and everyone/role/member overrides; unsupported forum/thread destinations are excluded, unavailable posting destinations disabled. Failures do not fall back to another guild/channel. Permission behavior follows [Discord's permissions reference](https://docs.discord.com/developers/topics/permissions).
- Focused Discord-resource fixture PASS for guild isolation, private-channel overrides, missing permissions, unsupported channel types, malformed responses and 403/404/429/500. This is not a live second-guild installation test.
- Activity writes now independently enforce the content-only route allowlist. The maintenance worker removes historical private/invalid page paths from both named tables in bounded batches, in addition to 90-day expiry. Legacy per-community retention settings cannot extend retention; saves accept only the approved90 days. No hosted records were deleted in this local slice.
- Foundation fixture PASS includes matching JS/SQL path boundaries and retention idempotence. Existing Communities and coaching-remediation fixtures PASS; recurrence, role pause/restore, archive preservation and foreign-key checks remain intact.
- Browser presentation, semantic hosted checks, full backlog drain and independent server acceptance remain open. No staging/production changes.

## Official server watchlist recovery slice

- Added Published/Drafts/Archived workspace views. Only authors with publishing permission or authorized managers receive unpublished records; ordinary readers do not. Draft/archived pages are excluded from named content activity.
- Added save-draft, unpublish and restore-draft controls. First publication queues delivery; ordinary edits/archive/restore do not automatically resend Discord posts.
- Tickers can be removed completely, including an empty list without deleting the publication. Surviving ticker notes are preserved through edits/reordering. This does not touch TraderLink's separate premium watchlist or impose its AI analysis.
- Extended Communities fixture PASS for draft/archive reader isolation, author restore, reader write rejection, preserved analysis, full ticker removal and first-publication delivery/idempotence. UI browser verification and the broader alert/member-placement/delivery matrix remain open.

## Retained coaching history slice

- Student workspace includes ended relationships and archived records in its coach/plan selector. Retained reviews/messages/images remain readable; messaging/request/upload controls are not offered for inactive history. Agreements are read-only there.
- Image reads authorize the original relationship participants independently of active coaching eligibility, while preserving unpublished review-image and removed-trade checks. This grants no new Journal permission and no access to unrelated users.
- Archived relationships now fail new coaching mutations, new Journal grants, fresh Journal reads and agreement changes. Coach history/review/final pages use the same inactive state to disable editing and avoid attempting fresh Journal queries.
- Focused coaching-remediation fixture PASS, extended with archived/ended image reads, unrelated-user rejection, retained delivered reviews, blocked new images/requests and blocked fresh Journal reads. Existing recurrence, agreement, privacy, role restoration and foreign-key checks continue to pass. Syntax/transpilation and diff checks pass; not a semantic build or browser acceptance.
- Remaining D5 scope: verify navigation after actual Discord departure/ownership lifecycle, teaching history, deletion/export and final browser flows. This partial slice is not all of L03/L05.

## Help audit correction

- Found the existing Discord Communities guide in `src/modules/help/traderslink-app-guides.ts`. Removed its entire activity-disclosure section without replacement, per the owner's explicit instruction. It also contained a now-invalid claim that named daily totals could remain longer than90 days.
- Existing joining/publishing/coaching sections remain. Full workflow Help alignment is still open; do not treat the earlier incomplete inventory as proof that no guide existed.

Next: L02 freshness/transfer/disconnect; remaining coaching/content lifecycle and L01 independent-server proof; final integrated full QA. These slices do not complete L01–L09 or authorize a deploy.

## Extra review request acceptance slice

- New student review requests remain pending until their coach accepts an explicit scope and scheduled due date or unscheduled work. Student deadlines are ignored; accepting does not mark work started or consume a recurring agreement occurrence. Repeat acceptance preserves the accepted scope.
- Pending requests have a distinct searchable/filterable label and request action. They do not count as due work. Existing inline trade review tools remain; editing/delivery is guarded server-side until acceptance. Pending requests can be cancelled without accepting them.
- Reserved additive migration0160 follows0159 at order173. Existing rows default to accepted, without invented acceptance dates or changed review content. No hosted migration applied. Integrate only the new manifest entry into the current production manifest.
- In-memory coaching and Communities fixtures PASS after updating their student request flows to explicitly accept work. New checks cover coach authority, required scope/deadline, unscheduled work, duplicate acceptance, cancellation and preservation of historical rows. These are not browser or hosted proof.
- App shutdown recovery verified existing branch/path and checkpointd91a2f437. Default sandbox Git traversal failed; approved escalation succeeded without Git configuration/index repair. Preexisting live-QA report edits remain untouched.
- Full launch QA, access freshness/ownership lifecycle and integrated staging/browser verification remain open. Both commissions remain disabled; no deployment performed.

## Confirmed Discord departure correction

- Membership refresh validates the returned Discord identity and bounded role list, normalizes duplicate/unsorted roles to the existing database contract, and validates its timestamp.
- Confirmed unknown-member responses clear that guild's cached owner flag and mark only that community membership inactive. Successful member verification restores inactive membership but never overrides a suspended membership. Provider failure/rate limiting does not fabricate role removal.
- Coaching eligibility now requires an active community and membership even when the agreement requires no additional Discord role. This closes the no-role departure loophole without deleting retained coaching records.
- Coaching and Communities fixtures PASS for departure, mismatched provider identity, restoration, no-role plans, retained records and existing regressions. Request-time freshness, owner transfer and departed-member history navigation are still open L02 work, not implied complete by these checks.

## Request verification and retained-page access slice

- Protected community actions, review trade-details API and coaching analysis tools now refresh expired Discord evidence before operating. Individual coaching requests verify the original participants, not a client-supplied arbitrary user. Provider requests are bounded to the actor and relationship participants, with no database transaction held across network I/O.
- Verification checks guild identity, member identity and current owner evidence. Fresh five-minute evidence avoids repeated calls. Failure/rate limiting denies new protected work without deleting roles or claiming payment failure. Older responses cannot replace newer evidence.
- Journal revocation remains authenticated-owner-only and does not require continued Discord eligibility. Coach archive/end actions verify the actor without requiring the departed student to rejoin first.
- Dashboard loading uses explicit retained-history mode when current access is unavailable on history routes. It permits only original relationship participants and strips community content, directories, templates, channels, plans, new teaching and analytics. Live Journal/editor access is paused. Retained image routes authorize original participants without requiring a current Discord membership.
- Corrected @everyone mapping resolution: Discord omits the guild-wide role from the member roles array, so the resolver recognizes the verified guild ID without writing fabricated roles to membership storage.
- Focused fixtures PASS for refreshed/expired evidence, provider identity, normalized roles, changed owner evidence, rate-limit preservation, suspension, departed history and outsider denial. Syntax checks PASS. Browser navigation, full semantic/build verification, independent-guild acceptance and remaining lifecycle/delivery/operational inventory remain open.

## Delivery receipt and uncertain-send checkpoint

- Reserved additive migration0161 (order174, after0160) retains actual Discord message IDs, retry timestamps and confirmed/rejected/uncertain outcomes. Historical statuses and timestamps remain intact; old failed/sending rows are held as uncertain rather than replayed. No hosted migration applied.
- Worker validates the destination guild/channel and published content ownership. It rechecks publication/destination after asynchronous verification, suppresses mentions, rejects oversized posts without silently truncating them, and retains confirmed message receipts.
- Provider429 responses schedule bounded retries. Lost POST responses,5xx responses and invalid receipts are held for explicit reconciliation, not automatically reposted. Stable nonce protection is supplementary, not a durable exactly-once guarantee. Stale-send recovery is bounded to25 rows.
- In-memory delivery fixture PASS: exact links/channels, full-post mode, no replay, receipts, publication changes during verification, oversized content, rate-limit delay, uncertain send cases, safe preflight recovery and historical migration compatibility. All HTTP is mocked; no test messages were sent.
- Chrome reconnected; staging TradersLink account sign-in verified. Browser baseline does not contain these local corrections. Explicit resend/reconciliation UI, broader delivery integration, semantic checks and full launch QA remain open. Neither commission enabled; no deployment performed.

## Acceptance and history navigation follow-up

- Pending review requests no longer offer the review-and-send action; the final preview also labels pending acceptance and disables sending. Existing server-side acceptance guards remain authoritative. Accepted scope is visible in the review agreement.
- Coach student list adds an Ended view with a read-only history entry point. It does not offer restore/archive actions for ended relationships or count them as work due. Removed the misleading role-only failure paragraph; the status label remains.
- Lightweight syntax checks pass for the three UI files. Staging Chrome identifies TradersLink and Bullrun correctly and the existing coach workspace loads from normal navigation. These UI corrections require the eventual integrated staging/browser pass; they are not marked launch-complete.

## Alert lifecycle correction

- Added Published/Drafts/Archived views and save-draft/unpublish/restore controls. Unpublished alerts are returned only to authorized authors/managers; ordinary readers cannot open them. First publication queues delivery transactionally; edits and restoration do not silently resend.
- Multiline alert bodies now accept ordinary line breaks, including template-generated fields. Template submission checks active status and personal ownership/shared scope before reading its fields. Draft/archived detail pages do not generate named content activity.
- Focused Communities fixture PASS for multiline drafts, author recovery, reader isolation, unauthorized restoration, first-publication-only delivery and existing feature regressions. Changed-file syntax and diff checks PASS. Browser verification on the eventual integrated candidate remains open.
- Coordinator reserved source-only0162 (order175 after0161) for append-only delivery-attempt history and a current-attempt key. Not implemented/applied yet. Explicit retry/resend remains open and must preserve all previous receipts.

## Explicit delivery retry and resend slice

- Implemented reserved0162 after0161 at order175: new attempt-event history and nullable current-attempt key. Existing rows retain their keys/statuses; no implicit resend/backfill send occurs. Delivery/community deletion is restricted while history exists; actor deletion nulls the actor reference without removing receipts.
- Owner/authorized Discord managers can retry or explicitly send again from Discord deliveries. Uncertain results require the checked-Discord confirmation. Optimistic attempt-key validation rejects repeated form submission. Worker revalidates destination and publication before sending; a new explicit attempt uses a new nonce.
- Earlier receipts are preserved as history before the current row is reset; worker confirmation/failure appends its outcome transactionally. The unique logical object/destination delivery row is unchanged.
- Real-schema in-memory fixture PASS for authorization, preserved legacy receipt, duplicate submit rejection, uncertain confirmation and restricted deletion. Mocked delivery fixture PASS for fresh resend nonce and both retained confirmed receipts, plus prior failure cases. Syntax checks PASS for12 changed/new TypeScript files. No real retry, hosted migration or deployment performed.
- Browser presentation and final integrated semantic/migration/operations QA remain open. This is not a launch-readiness verdict. Both commission programs remain disabled.
