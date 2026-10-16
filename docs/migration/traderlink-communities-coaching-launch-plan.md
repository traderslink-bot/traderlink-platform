# Communities and Coaching — complete launch plan

## Latest QA — third usability pass, October 16 Toronto

Runtime40a1f2a34 retains the earlier pending/filter fixes. Three adjacent usability
issues were found: saved-lesson Status can change during a pending save (UX18), Work
session links omit the selected-session anchor (UX19), and reversed custom dates
have no validation (UX20). See [third QA](coaching-usability-third-qa-20261016.md)
for reproductions and proof boundaries. Owner-approved UX18–UX20 corrections
are now implemented locally, with the regression checkpoint in that same record.
Help is aligned; no hosted mutation, build or deployment in this correction slice.


## Latest usability QA — October 16, 2026 Toronto

Second QA of local runtime source6eba45c51 reproduces four additional issues:
editable lesson fields during submission, Reuse permitting overlapping publication
actions, image replacement/removal during send, and misleading filtered-work
empty guidance. Earlier corrected-flow regression passes in all four Light/Navy
desktop/mobile contexts. These are isolated component/action observations, not
hosted data-loss or duplicate-write proof. No application change or deployment.
See [second QA and proposed coherent correction batch](coaching-usability-second-qa-20261016.md).
UX14–UX17 are now corrected locally; pending-action and filtered-work regression
verification is recorded in the linked correction checkpoint. Signed-in staging
acceptance and deployment remain separate gates.


## Current launch position — October 16, 2026 UTC

Successful independent-server setup, mapping persistence, Discord delivery and
actual390×844 Light/Navy mapping/channel browser acceptance are PASS. Required
review work, lesson publication and the accepted notice/timezone fixes stay closed.
The earlier staging audit found no further defect; the later local usability QA above found four additional issues, now corrected locally.

The active engineering step is **production-compatible integration and migration
rehearsal**, not repeating the accepted successful browser paths. A source-only
integration dry run preserves current main82784f53c and staging0509afea5 without
Git conflicts, but the staging migration ordering is deliberately incompatible
with production's existing prefix. An isolated production manifest artifact now
preserves that prefix and appends the20 Coaching migrations. It must never be
applied to the existing staging ledger. [Production integration preparation](coaching-production-integration-preparation-20261016.md) records exact scope and checks.

Failure/race guidance has actual service and component regression proof; its
staging observation remains NOT TESTED. Safe failed-request capture remains
NOT TESTED. Test2 connection is outside current approval, not a new requirement
to repeat independent onboarding already passed on TradersLink Tests. No waiver
of required launch acceptance, hosted recovery or operating-envelope gates is
inferred. Production deployment remains unauthorized.


## Current implementation reconciliation — October15 completion audit

The [consolidated13-area Coaching audit](coaching-completion-audit-20261015.md)
replaces the inaccessible canonical-report dependency and distinguishes recorded
live proof, isolated checks and actual remaining work. Historical pending
statements below must be read against that current matrix. Existing extra-request,
retained-history, recurrence, session and review implementations are not new TODOs.
Lesson-publication eligibility, refresh scheduling and onboarding presentation/
permission guidance are now deployed together to staging at
`e2da9c38c8c0be2efa968e7026db3e4f2d281e8f`, after successful combined full build,
TypeScript and focused checks (CI38821841169). Railway7c975e9e SUCCESS, one running
instance, health200, exact160-entry migration ledger unchanged and natural worker
startup/first pass verified. This closes the deferred combined-build gate.
[Release record](coaching-completion-audit-20261015.md#combined-staging-release-verified--october-15-evening-toronto)
and [PC retest prompt](coaching-combined-staging-retest-pc-20261015.md) distinguish
released-code/operations proof from pending signed-in acceptance. No production
release, new fixture or Discord role/channel change. Previously accepted browser
fixes and owner-deferred optional cases stay closed.

## Remaining acceptance corrections and fixtures — current boundary

The owner's subsequently approved synthetic lesson task produced guarded staging
action evidence for archived/ended and retained wrong-plan recipients, preserved
drafts/assignments and supported restoration/reuse. All new fixture IDs/content/
initial/final states are in the [acceptance ledger](coaching-completion-audit-20261015.md#remaining-acceptance--approved-synthetic-staging-fixtures-october-15-toronto).
No existing record or Journal grant was changed by fixture tools; no Discord or
notification delivery queued. Expanded acceptance reproduced missing lesson
feedback, missing cross-pass rate cooldown and cross-guild key-order starvation.
Corrections are deployed and verified on staging at7bf3906a7 after CI38829848863
passed the combined build/regressions. Supplied signed-in PC lesson functional
checks now PASS: archived/mismatch rejection, preservation, restoration, valid
publication and student visibility. Scoped post-browser backend audit also PASS:
0 attributable retained notifications/deliveries and expected final fixture state.
Navy desktop error visual and safe request capture remain open; see the latest
[PC reconciliation](coaching-completion-audit-20261015.md#signed-in-pc-lesson-acceptance-reconciled--october15-toronto). Existing passed
presentation/review/timezone/update checks stay closed. Independent first-install
consent/return/connection remains authorization-gated. No whole-feature completion.

## Test-server discovery — staging configuration prerequisite

Readonly deployed-source diagnosis confirms TradersLink Tests1559172784813514803
was refreshed/persisted for the correct owner; onboarding hides it because staging
approved only normal TradersLink at diagnosis. Owner subsequently authorized
staging activation; target ID now admitted, both servers pass backend discovery,
and normal connection metadata is unchanged. PC refresh/select-only retest pending;
no bot installation or new connection authorized. See the latest activation receipt. [Evidence and browser retest](coaching-completion-audit-20261015.md#traderslink-tests-discovery-omission--october15-toronto).

## First-install browser acceptance and remaining status correction

Supplied PC results PASS: TradersLink Communities installed into TradersLink Tests
with View Channels/Send Messages, manual return/Connect, persisted new community
/communities/traderslink-tests/manage, named channel/role discovery, normal community
preservation and connected onboarding Light/Navy desktop/mobile. No mapping/message.
Confirmed unconnected installation-status UX correction is now deployed to staging
at0509afea5 / f7bb64a3 SUCCESS. Focused tests, four theme-size cases, local and
Railway full build/TypeScript/281 pages pass; health/ledger/connections verified. New
installed-but-unconnected Test2 happy-path browser acceptance PASS: discovery/ID,
unverified/pending/missing, cancellation, owner-approved installation, manual
return/recheck, fresh-page repeatability, ordinary selection reset and desktop
Light/Navy. Test2 bot retained installed; Connect never clicked, no app community.
Remaining actual390x844 mobile, failure/race and safe network evidence are separate
from existing isolated tests. Test2 creation/mapping/delivery still need explicit
approval. Preserve installed Test2 and both existing community connections.
[Full proof boundaries](coaching-completion-audit-20261015.md#first-install-and-connection-pass-pre-connection-status-correction-local--october15-toronto).

## Delivery acceptance — closed

The approved existing alert is delivered/confirmed after one natural attempt.
Discord API and supplied signed-in browser checks passed; message1560490922507112531
and Delivered persisted after reload. Mapping/channel mobile390×844 Light/Navy
also passed. Retain original QA evidence; do not republish or repeat passed checks.
[Reconciled receipt](coaching-completion-audit-20261015.md#pc-delivery-and-mobile-browser-acceptance-reconciled--october-16-2026-utc).

## Current bounded acceptance — signed-in PC retest reconciled

Both reported UI fixes are **PASS / CLOSED**: notice-visible coaching workspace
and final preview in Light/Navy desktop/mobile, correct hit targets/Return,
normal Update app with saved draft preserved, and UTC/New York preview labels
for the same instant. PC did not independently verify the release SHA; build,
deployment and migration proof remains the separate Codespaces release record.
No protected review or Journal record was changed; previews were cancelled.

The owner declines further work on the optional winter, cross-date and nonempty
offline-queue staging browser cases. These are **deferred / untested in staging**,
not defects or blockers for these two fixes; isolated proof remains isolated.
No speculative code fix, repeated passed test or deployment is requested.
[Detailed PC evidence, owner disposition and remaining scope](coaching-ui-timezone-qa-20261015.md).
This is not whole-feature launch certification. Other launch inventory and owner
acceptance remain separate; already passed lifecycle cases stay passed.

## Acceptance continuation — 2026-10-15

PC-reported zero-trade draft/privacy/final-preview matrix passes are preserved. New actual action-handler and route-count regressions pass with isolated real services/schema; no runtime change or deployment. Remaining gates are the PC workspace theme/mobile matrix, actual Return navigation/toast occlusion and signed-in fulfilled/summary-only cases with authorized fixtures. [Acceptance proof and exact fixture approval proposal](coaching-required-trade-acceptance-handoff-20261015.md).


## Staging release checkpoint — 2026-10-15

Owner-authorized required-review-work fix `fdfca103c` is live in staging deployment `55bde668-caf3-4fc7-8565-69510eecabcf` SUCCESS. Verified source, one running instance/original volume, overlap0/drain30, health200, unchanged exact160-entry ledger and compiled validation/guidance. Full remote build/regressions passed. No production or protected business-data/role/grant changes. Coordinator slot handed back. Remaining gate: PC signed-in acceptance on unused agreement-generated synthetic review work; preserve completed evidence and existing agreements. [Complete release proof and acceptance scope](coaching-feature-findings-2026-10-14.md).


## Remote verification checkpoint — 2026-10-15

Required-review-work correction passed full remote production build/TypeScript, focused readiness/route/service regressions and disposable migration rehearsal in [Actions38793234549](https://github.com/traderslink-bot/traderlink-platform/actions/runs/38793234549). Build gate is satisfied for fix `fdfca103c`; tested candidate `58a91d60e` differs only by CI workflow changes. Staging/production refs unchanged. Separate Coordinator staging authorization and new signed-in synthetic browser acceptance remain required. Earlier local SIGTERM and baseline legacy test failures remain historical evidence, not a failed remote build.


## Current bounded correction — agreed review work (2026-10-15)

The PC staging acceptance uncovered a completion-integrity gap: an overall summary could satisfy an empty selection despite an accepted one-trade agreement. The local correction now shares original-agreement quantity/readiness across both coach pages and validates required work at delivery/completion on the server. It preserves zero-trade/custom work and student-controlled Journal access. Focused verification passes; full-build and hosted/browser gates remain open. This is a correction to existing agreed work, not a change to plan requirements or acceptance history. [Progress](traderlink-communities-coaching-launch-progress.md) and [evidence](coaching-feature-findings-2026-10-14.md). No release authorized.


Date: 2026-10-10. Status: implementation authorized. D1–D7 approved with the explicit D7 exception below. Partner earnings activation deferred. Production deployment prohibited.

## Owner approval and exceptions — controlling amendment

The owner approved proceeding through the remaining fixes and full QA without a production deployment. D1–D6 are accepted as proposed. D7's 90-day named-activity retention is accepted, but the proposed disclosure and any similar added copy are expressly rejected: do not add them to the feature, other pages, Help, onboarding, or notifications. This supersedes every disclosure/copy-approval requirement in the original proposal below; no replacement wording is authorized.

Partner referral earnings (TraderLink paying server owners from paid dashboard subscriptions) are deferred. Separately, the owner wants a future coaching-fee commission paid to TraderLink: prepare owner-only, dormant settings with an exact percentage, optional minimum dollar commission and custom duration, selectable per coach. Saving configuration must not activate accrual, charges, payouts, refunds or public earnings claims. The owner may later enable it deliberately once provider/business rules are settled. The proposed Whop partnership and automatic receipt are unverified; do not conflate this with the referral ledger or claim integration works. Refund/reversal rules remain undecided and must not be silently defaulted. These deferred commercial choices do not block the other approved launch work.

This is the controlling **remaining-launch-work** plan. The earlier partner-platform plan retains product history; the dated QA reports retain their evidence. Their scattered pending lists must not be interpreted as separate, hidden launch backlogs. All remaining known work is consolidated below. New defects found during completion must be added to this register, fixed and retested, not silently omitted or described as new product requirements.

Progress: [Launch progress and decision record](traderlink-communities-coaching-launch-progress.md).

Active L01/L04 correction slice: [Publish feedback, ticker research and bot setup](community-publishing-setup-corrections-20261010.md). Preserve this slice alongside concurrent coaching work; no real notifications or paid AI calls during its QA.

### Account deletion amendment — owner approved

Deleting a server owner's account without transferring ownership must keep other coaches' existing student relationships active. Do not close or archive those relationships solely because the owner deleted their account. Preserve their shared community dependencies without granting a replacement owner access to private coaching; ownership recovery remains separately verified. The deleting participant's own coaching records follow the retention policy below.

Owner-approved access boundary: while ownership awaits recovery, original coaches and students may continue only their existing coaching relationships. Retain Discord membership, role and Journal-permission checks. Do not grant general community access, new relationships or replacement ownership through this exception.

Ownership transfer is offered, not required before account deletion. Preserve relevant coaching evidence for exactly 60 days after deletion, accessible only through authenticated TraderLink platform administration. At expiry, deny reads and permanently purge the archive, including its attachments. Retain agreements, promised/outstanding work, delivered reviews, relevant communications and trade information already embedded in coaching records. Do not copy a student's private Journal, imported statements, credentials or live Journal grants into the archive. Ordinary role loss/inactivity remains distinct from account deletion and does not start this clock. Account deletion must not silently cascade away evidence before it is captured, or extend an existing archive's deadline when another participant later deletes their account. Transfer must preserve the continuing community's unrelated records.

Track implementation and exact evidence in [Account-deletion archive progress](traderlink-coaching-deletion-archive-progress.md). Account-closure wording accurately describing temporary retention was approved verbatim by the owner. Both commission programs remain disabled and production deployment remains prohibited.

## 1. Actual readiness

The existing single-server private-pilot checkpoint passed. The complete feature is **not yet accepted for multi-server launch**. Independent onboarding is not the only remaining item.

Recorded staging baseline: source `d4cc8b7ed6f60609b4fafbbfcb1fa82f8fb214d6`, Railway deployment `957306ce-052d-4ae9-bcd7-ee276da82c79`, healthy schema154. The October 10 QA record reports current-production parity, all coaching corrections, hosted build checks and final browser retests. This document carries that dated evidence; writing it does not constitute a new deployment or a fresh live test.

Evidence types must remain separate: implemented source; isolated/fixture checks; live pilot checks; independent-server checks; production configuration; owner acceptance. Passing one does not imply the others.

## 2. Settled scope — do not ask the owner to decide these again

- One existing TraderLink application shell, with capability-appropriate navigation. Normal members keep their regular dashboard and receive their community/student features there. Platform administration belongs in the owner's existing `/admin/journal` administration.
- Every current member of a connected server can join TraderLink. Discord role mappings govern that server's content, coaching and staff responsibilities, not basic TraderLink access. This does not grant paid TraderLink subscriptions for free.
- Owners map their existing Discord roles to supported features/responsibilities. A role can have multiple responsibilities. Discord remains the server's access authority; there is no competing manually maintained paid-member list.
- The server/coach handles coaching payment through its own provider. A Discord role demonstrates access eligibility, not proof of payment. Role removal pauses access with notices, rather than deleting the coaching record or asserting that payment failed.
- Coaches choose their services, methods, descriptions and prices. Custom coaching can omit schedules and counted tasks. Scheduling is useful but not compulsory. Journal access is agreed separately with the student; plan creation does not require a connected student.
- Trade and trading-day reviews can include their associated notes, rules and tags. Do not turn those into arbitrary mandatory item counts or force risk/strategy reviews into trade reviews.
- Preserve Find trades / To review / Saved reviews, inline per-trade editing, charts/details, progress, optional wider feedback, previous-review reminders and final preview/send. Optional empty sections never appear as blank student forms.
- Student Journal records remain read-only to the coach. Coach notes/reviews are separate records. Server owners and platform support do not acquire private Journal access simply by being administrators.
- Images can be exchanged during coaching. Live meetings and recorded lessons use coach-provided external links; native video hosting or conferencing is not required.
- Keep three products distinct: TraderLink's own existing premium watchlist; official server watchlists; member-authored Community Watchlists. Server/member authors are not forced to use TraderLink's AI analysis, indicators or support/resistance methodology.
- Server publishing can send the content directly to Discord or send a link to its TraderLink page. Named page-visit statistics concern TraderLink page visits, not purported Discord-message readers.
- Promotional/visibility arrangements are negotiated by the owner. No new compulsory promotional channel, posting cadence or self-service agreement is invented here.
- Broader public community discovery, inter-community participation and channel syndication remain later projects. The previously deferred Activity-page visual redesign remains deferred, but data correctness and retention are launch work.

## 3. Complete remaining work register

“Verify” means implementation may already exist, but the stated launch proof is still required. It does not mean rebuilding a working feature.

### L01 — independent server onboarding and platform authority

**Confirmed gap:** onboarding is restricted to the test guild, seeds test roles/channels, grants the onboarding user a platform-level community operator grant and activates the community through pilot bootstrap logic.

Required work:

1. Separate pilot fixtures from normal onboarding. Never rewrite applied historical migrations or reset the test server to achieve this.
2. Verify the connecting account's authority over its chosen guild. Install/connect the dedicated bot to that guild; inspect actual role/channel availability and permissions. Do not assume installation succeeded because the authorization browser returned.
3. Let owners select existing roles/channels and enabled features. Coaching-only servers must not be forced to configure alert/watchlist channels. No copied test IDs or inherited test permissions.
4. Restrict global operator grants to the platform owner's explicit administration mechanism. Server onboarding must never grant global operator authority.
5. Support unique community URLs, interrupted setup, reconnect/retry, already-connected servers and clear setup status without duplicate records or lost configuration.
6. Apply the chosen launch admission policy. Keep public entry closed until the independent flow and isolation proof pass.

Done when a separate guild with different IDs and an ordinary owner account completes setup without database edits, seeded staff grants or a developer bypass; repeat setup preserves its data. Depends on D1.

### L02 — role changes, isolation and community lifecycle

**Required verification and policy completion:** pilot role-loss/restoration has evidence; an independent second server and the full ownership/outage lifecycle do not.

- Verify membership refresh, multiple mapped roles, additive permissions, role rename/delete, member departure, staff removal, bot removal, deleted channels and missing bot permissions. Confirm both UI and server-side actions enforce the same boundary.
- Never revoke an unrelated TraderLink account, subscription, other community membership or other coach relationship because one server role was removed.
- Distinguish confirmed role loss from timeout/rate-limit/provider failure. Audit freshness at protected reads/writes, not merely the background refresh schedule. Existing refresh code targets five-minute-old evidence, but stored-role presence alone is not a complete freshness policy.
- Preserve data through pause/reconnect and show truthful status/notices to coach/student. Avoid repeated duplicate notices.
- Implement verified server ownership transfer/recovery and disconnect behavior. Neither a former owner nor a newly guessed owner may silently inherit platform privileges or private Journal grants.
- Test two guilds, two coaches, students with multiple memberships/relationships and direct URL/API attempts across all boundaries, including files, charts, reports, messages and analytics.

Done when lifecycle and cross-server checks pass without manual grants and without unintended access. Depends on D2 and D3.

### L03 — finish coaching agreement/work lifecycle

**Known product gaps:** extra student requests need an explicit quota/deadline rule; retained ended relationships need a usable former-student history path. These are not reasons to redesign the approved review workspace.

- Apply the agreed treatment of extra review requests, question allowances and follow-up periods. Show what is pending acceptance versus scheduled work; do not silently promise extra work or create duplicate recurring work.
- Resolve due dates/time zones from the accepted agreement or coach acceptance. Unscheduled custom work remains valid and visible without false overdue counts.
- Preserve immutable accepted terms when a coach edits a published plan; handle pause, capacity, plan retirement and resumption without silently changing existing student agreements.
- Add/readjust former-student access and archive/restore navigation according to D5. Separate delivered history from current permission to read fresh Journal data or send new work.
- Reconcile counts, review progress, recurrence, follow-up due dates and completion states across coach work, student view and history. “Viewed” is not proof of understanding; preserve the agreed read/acknowledgment distinction.
- Preserve every existing review, session, teaching and student capability in the full inventory below. Fix gaps demonstrated by that inventory, rather than replacing the workspace with a reduced version.

Done when extra requests, ended relationships and reactivation work end to end, and all existing coaching flows remain intact. Depends on D4 and D5.

### L04 — complete server publishing and watchlist lifecycle

**Known gap:** official watchlist archive recovery is not available in the current published-list view. Discord behavior after an edit needs an explicit policy.

- Complete draft, publish, edit, unpublish, archive and restore paths for supported server content; preserve stable links, authorship and role restrictions. Support ticker removal from an editable watchlist, not only archiving a ticker. Keep whole-publication/history deletion distinct from removing an item from a list.
- Preserve independent author analysis. Optional TraderLink analysis must be clearly optional, not required fields or automatic replacement of the author's work.
- Verify alert templates: personal templates remain personal; owner-authorized shared templates are available to the intended publishers; owners can control personal-template creation.
- Verify configured destinations, content/link modes, delivery status, retry, duplicate prevention and failures. An invalid destination must never fall back to another server/channel. Apply D6 to edits and removals of already-delivered posts.
- Verify the member-watchlist loop against the latest Watchlist implementation: author creates/edits; shares to eligible joined communities; correct viewers open the canonical content; author unshares; owner removes its community placement without deleting the author's underlying research. Preserve separation from official server publishing.
- Reconcile overlapping Watchlist work with its owning feature/coordinator before edits. Do not change TraderLink's existing premium watchlist or its AI pipeline as an incidental community fix.

Done when owner/staff/member publication lifecycles, placements and Discord delivery are proven for both test guilds. Depends on D6; broader cross-community discovery remains off.

### L05 — named activity, privacy and retention

**Confirmed source gap:** `recordView` prunes raw activity events but also writes a named daily-member table; that table's retained user IDs are not removed by the same pruning path. A 30-day display filter is not a retention policy.

- Enforce the chosen retention period across all named activity storage and derivatives, including idle communities. Keep any longer-lived aggregate genuinely de-identified; do not merely hide names while retaining a joinable user ID.
- Inventory which pages generate events. Keep private Journal data, coaching conversations, private drafts and private notes outside community-owner activity detail. Verify capability checks for named versus aggregate reports.
- Make counts, page identity, time range and unique-member semantics accurate. Do not claim complete Discord channel usage statistics.
- Do not add the rejected activity disclosure or similar copy anywhere. Keep technical retention/access behavior correct without reintroducing descriptive cards or the removed team-access banner.
- Verify account-deletion handling for coaching, attachments and activity against existing platform behavior. Define relationships between retained delivery records, deleted accounts and revoked Journal access.
- Owner decision (2026-10-15): Coaching stays in the app; this release does not add coach export or bulk download of student records. The Coaching analysis drawer renders authorized results in-app and exposes no CSV/export action. Shared attachments retain their existing scoped access; a future personal Platform export is separate scope.

Done when retention tests cover every named table and boundaries hold. D5 and D7 are approved subject to the no-disclosure exception. Activity visual redesign is not required for this checkpoint.

### L06 — two separate commission programs, both disabled for launch

Owner clarification confirmed: coaching commissions mean money paid **to TraderLink from a coach's coaching fees**. Referral/affiliate earnings mean money paid **by TraderLink to server owners for paid dashboard referrals**. These are separate programs, not two names for one ledger. Both remain disabled. Only the incoming coaching-fee program receives dormant owner-only percentage, optional minimum amount, duration and per-coach settings in this launch work. Neither saved settings, old active records nor incoming provider events may initiate accrual or money movement. Enabling either program later requires a separate owner decision and completed provider/financial QA.

**Partially implemented, not launch-proven:** attribution, a billing-event endpoint and estimated earnings ledger exist. A live billing-to-earnings-to-payout workflow and commercial terms are not accepted. This is separate from coaches collecting their own fees.

If included at launch:

- Record D8's terms and precedence against existing affiliate/membership attribution.
- Integrate verified actual Tier 2 billing events; test new subscriptions, eligible renewals, cancellation, refund/partial refund, disputes, duplicated/out-of-order events, currencies and existing subscribers. Do not treat a role as a payment event.
- Keep estimated, eligible, approved, paid and reversed amounts distinct; do not overwrite paid history with a later estimate. Provide an auditable adjustment and owner-controlled payout/reconciliation process.
- Verify server-owner earnings and platform-admin views against independent expected calculations. No automated money movement is authorized by this plan.

Approved launch disposition: disable partner accrual and hide unavailable earnings cards/promises. Preserve the implementation and original requirement as deferred, not “complete.” Build the dormant owner-configurable foundation described in the controlling amendment; activation and provider/refund integration remain deferred. Coaching and community tools are authorized to launch without this program, after acceptance and separate production approval.

Done when either the enabled program passes the full financial-event lifecycle or the explicitly deferred program cannot accrue or advertise unavailable earnings. Depends on D8.

### L07 — production integration and operating readiness

Required release work, not proof of new product features:

- Coordinate the exact release base with the coordinator; staging must contain current production plus the allowlisted feature, not a stale replacement snapshot. Record source SHA, changed files, migrations, deployment and health evidence.
- Inventory all pilot/review gates, synthetic fixtures and bootstrap entry points. Production must not expose test users, synthetic trades, sample relationships, test channels or review shortcuts. Preserve genuine existing records.
- Verify the dedicated bot's production credentials/configuration, required permissions/intents, OAuth return URLs and actual installation behavior. Check current Discord requirements before wider distribution; do not assume pilot installation proves unrestricted distribution readiness.
- Verify queue/worker execution, retry/backoff, role refresh, retention jobs, recurrence and notification delivery under the single-writer Railway runtime. Use bounded hosted/staging load checks, not a heavy local build on the owner's computer. Establish and document the tested operating envelope before accepting larger servers.
- Verify attachment type/size validation, authorization, storage persistence, cleanup, quotas, backup/restore and safe handling of failed/orphaned uploads. Use real student-to-coach and coach-to-student files, not just successful HTTP responses.
- Prepare migration/restart recovery, database/media backup and rollback instructions consistent with one persistent-volume writer. Never reset production data or use overlapping writers as a test shortcut.
- Align relevant Help Center guides and support/runbook coverage for onboarding, roles, coaching, publishing, activity and any enabled earnings program. Reconcile approved copy and remove internal status codes from user-facing pages.

Done when configuration, operations, recovery and release provenance are evidenced on the final integrated candidate. Secrets are never included in the plan or evidence logs.

### L08 — full launch acceptance, not another partial QA claim

Run the complete inventory in section 5 on the final integrated staging candidate as a new server owner, new coach and new student. Also exercise platform admin and ordinary/publishing staff. Use independent guild identities and no manual database assistance in the acceptance path.

Every failure gets a correction and targeted retest, followed by a final affected-flow regression and reconciliation of the entire matrix. Each row records build, identities/scopes, steps, expected/actual result, evidence and outcome. Fixture-only evidence must be labeled, not promoted to live proof.

No required row may be left “not tested” while declaring launch readiness. Optional unavailable external tools must have truthful empty/unavailable behavior verified, and the unsupported capability must not be advertised as tested.

### L09 — owner acceptance and controlled release

- Show the owner the final onboarding/setup and complete existing coach/student workspace, including desktop/mobile and light/dark. Preserve approved layouts; request approval for genuinely new UI/copy, not every technical fix.
- Reconcile the plan and progress record: required work complete, defects closed, deferred items explicitly accepted and disabled where appropriate, Help aligned, operating limits recorded.
- Deliver a precise verdict: ready for the approved invited-server cohort, ready for unrestricted onboarding, or not ready with exact remaining gates. Never equate the first two.
- Obtain explicit production-release authorization and use the coordinator's release slot. Verify health, migrations, routes and scoped production smoke checks without sending unsolicited Discord posts or using real customer data as synthetic fixtures.
- Keep launch feature controls and rollback available. Do not broaden availability beyond D1's approved policy.

## 4. Exact owner decisions — eight, consolidated

D1–D6 are approved recommendations. D7 retention is approved; disclosure is rejected. D8 activation is deferred with the dormant configuration amendment above. The table retains the decision context, not outstanding approval requests.

| ID | Decision needed | Recommended choice |
| --- | --- | --- |
| D1 | Who can onboard at first launch, and who can connect a guild? | Start with owner-approved servers, each using real independent onboarding. Require its verified Discord owner to connect; that owner can then delegate supported administration through role mappings. Do not open unrestricted signup yet. |
| D2 | What happens when guild ownership changes or a server disconnects? | Pause affected owner administration/publishing until verified transfer or reconnection; retain records. Use explicit handover/recovery through platform administration, not an automatic silent transfer of private coaching access. |
| D3 | During a Discord outage, may stale role evidence authorize protected work? | After the normal five-minute verification window expires, pause new protected coaching/content actions until verification returns. Preserve existing records and distinguish “verification unavailable” from confirmed role removal. If a grace period is preferred instead, its length must be chosen explicitly. |
| D4 | How should students request reviews beyond agreed scheduled work? | Treat additional requests as pending coach acceptance. The coach decides whether it is covered by the agreement and sets any extra scope/deadline; an extra request must not silently consume a recurring slot or create an unlimited promise. Preserve agreed question/follow-up limits and optional scheduling for custom coaching. |
| D5 | What can former students/coaches access, and when are records removed? | Retain read-only delivered reviews and shared history for the parties; retain the coach's private notes privately. Do not allow fresh Journal reads or new coaching while access is inactive. Keep resumable records without automatic inactivity deletion for initial launch, subject to existing account-deletion obligations; monitor storage, especially images. |
| D6 | What happens to content already posted in Discord when edited/removed on TraderLink? | Remove tickers normally from the editable list; archive/restore whole publications. Leave an already-sent Discord post unchanged unless the publisher explicitly updates/resends it. Make stale/removed linked-page behavior safe and clear. Do not silently repost or promise automatic Discord synchronization. |
| D7 | Named page-view retention | Approved: 90 days across all named tables, only genuinely de-identified aggregates beyond that. No disclosure or similar copy is to be added anywhere. This does not govern posting duration in a server. |
| D8 | Does Tier 2 partner commission launch now, or remain disabled initially? | This is the original acquisition incentive, so the owner must choose explicitly. If first-server launch speed is the priority, defer it and hide earnings claims until terms/integration pass. If included, supply the commercial terms listed below before implementation is finalized. |

The proposed D7 wording has been removed from this plan following the owner's explicit rejection. Do not recreate it elsewhere.

D8 requires these terms only if earnings launch now:

1. Commission percentage, including whether it can differ by partner.
2. First payment only or renewals too; how long eligibility lasts.
3. Calculation basis: eligible amount before/after discounts, taxes and provider fees; treatment of full/partial refunds and disputes.
4. Attribution rule when someone belongs to several communities, already has an affiliate attribution, or is already a paying Tier 2 user; attribution window.
5. Supported payout currency, payout method, cadence/minimum and who approves/records payouts. Manual owner-approved payouts are an option; automatic payouts are not assumed.

The owner approved implementation and QA, not production deployment. Do not ask again for the settled decisions. Future commercial/provider choices remain distinct from the current launch work.

## 5. Full acceptance inventory — no reduced checklist

The following is the complete controlling target, including already implemented work. Each line requires a recorded result or an explicit approved deferral, not an assumption based on source inspection.

### Community/platform inventory

1. Platform owner administration in the existing admin: communities, owners, staff/responsibilities, content/pages, status, support actions, named/aggregate statistics and enabled partner records; no unintended private Journal access.
2. New independent server connection, bot installation, owner verification, feature selection, URL, role/channel selection, interrupted setup, retry, reconnect, duplicate prevention, ownership transfer and disconnect.
3. Owner/admin/staff/coach/member navigation; multi-community switching; ordinary-member registration/dashboard; baseline access independent of premium content; all direct route/action checks.
4. Existing Discord role mappings, combined roles, changes/removal/restoration, bot/provider failures, notices and account/community isolation.
5. Alerts and personal/shared templates: creation, permissions, fields, draft, publish, edit, unpublish/archive/restore where supported; no template title unexpectedly posted as content.
6. Official server watchlists: independent analysis, item add/edit/remove, authoring, draft/publish, private/public policy, role-restricted viewing, archive recovery and channel/link behavior.
7. Member watchlists: create/edit, permitted placements, canonical links, role/visibility boundaries, unshare/owner removal and author ownership; no contamination of TraderLink's official premium product.
8. Discord full-content versus page-link delivery, configured destinations, status, retry/idempotence, permission/channel failures and edit/removal policy.
9. Activity page-level counts, named permissions, isolation, retention and absence of private-data leakage; verify no rejected disclosure copy was introduced.
10. Partner attribution/earnings/refunds/payout state if enabled; otherwise disabled accrual and hidden unavailable claims.

### Coaching inventory — preserve all thirteen areas

1. **Profile and plans:** all existing service editors, descriptions, scope, optional journal components, custom freedom, pricing/quote/currency/billing, capacity, eligibility roles and draft/edit/publish/pause/archive.
2. **Enrollment/agreement:** request, offer comparison, accepted version, quantities, cadence versus coverage period, start/due dates, recurrence/idempotence, student acceptance and later plan edits not rewriting accepted terms.
3. **Coaching Work:** next-N-days input, custom range, week/month views, search/filter/sort, plan-aware totals, overdue/due-today, unscheduled work, progress and truthful readable statuses.
4. **Students:** list/detail, actions, tasks, history, private/shared notes, messages/images, archive/restore, inactive access and retained delivered history.
5. **Review types:** trade, trading-day, performance, strategy, risk/custom as offered; correct data/context; comparisons, earlier reviews and next-focus reminders; optional sections omitted when blank.
6. **Trade workflow:** Find / To review / Saved; student selections; selection/removal controls; inline per-trade text/images; save/edit/advance; reviewed dates; final selected set; draft persistence without premature delivery.
7. **Shared Journal tools:** approved data scopes; trade details, executions, chart, notes/rules/tags, day/session context, analytics reports, Trade Explorer and Trade Analyzer when available; no student-ledger mutation; honest insufficient-data states.
8. **Final review lifecycle:** full preview, summary/actions/images, private-content omission, completion checks, delivery, student view/acknowledgment, follow-up request/acceptance/deadline, completion/cancellation and immutable history where required.
9. **Sessions:** scheduled time/time zone/duration, external location/link, per-student agenda/private notes, attendance/completion and history without native conferencing.
10. **Teaching:** live/recorded/resource/assignment, plan/all/selected audiences, lesson links, reuse/edit, availability/due dates, progress and archived-student exclusion.
11. **Student dashboard:** normal application shell, own relationships, agreements, Journal permissions, coaching requests, messages/images, delivered reviews, follow-up and lessons; no coach-only administration.
12. **Security/lifecycle:** two communities/coaches, wrong-user/object URLs/actions/files, grant revoke, role pause/restore, stale evidence, archived relationships and ownership transitions without cross-access.
13. **Presentation/reliability:** desktop/mobile, light/dark, aligned controls, readable labels, loading/empty/error states, keyboard controls, failed saves/retries and browser/runtime errors.

### Operational inventory

Current-production parity; exact migrations/configuration; synthetic-data isolation; persisted attachments; background workers/retention/recurrence; delivery and refresh rate limits; tested capacity envelope; backups/recovery; Help/support; release/rollback; owner acceptance. External billing proof is required only for an enabled partner program, not for the server's independently managed coaching payments.

## 6. Work order and stop conditions

1. **Checkpoint A — accepted:** record the owner's D1–D7 approval, D7 copy rejection and D8 deferred activation/configuration request. Proceed with implementation; production remains prohibited.
2. **Checkpoint B — onboarding and access:** complete L01/L02 with the independent second server. Retain the pilot gate until its safe replacement is ready.
3. **Checkpoint C — lifecycle gaps:** complete L03–L06; preserve approved UI and coordinate any Watchlist overlap. Validate coherent slices, not an expensive suite after each small edit.
4. **Checkpoint D — integrated launch candidate:** complete L07 and the full L08 inventory on staging based on current production. Fix and retest failures continuously within the approved scope.
5. **Checkpoint E — final acceptance:** owner reviews the complete candidate, L09 records the verdict, and a separately authorized coordinator release performs final production checks.

Technical work does not need repeated approval within an accepted plan. A new commercial policy, materially different UI, external action outside the approved test scope or broader product feature does require a decision. Log it in this one register; never quietly extend scope.

## 7. Explicitly later, not concealed launch work

- Public inter-community discovery, cross-server feeds, ranked/top-watchlist pages and syndicated paid channels.
- Native video hosting/conferencing, automatic coaching payment collection, coach-fee commissions and server-owner revenue splits collected by TraderLink.
- Coach default-template customization after the approved review template is complete.
- Broader Activity presentation redesign already deferred by the owner.
- Automatic synchronization of edited Discord posts if D6's explicit-action recommendation is accepted.
- Tier 2 partner earnings only if D8 explicitly defers it; otherwise it remains mandatory launch work.

These must not be advertised as delivered. Optional expansion ideas discovered in QA belong here unless a demonstrated defect makes them necessary for agreed scope.

## 8. Evidence and reconciliation sources

- [Original product plan](traderlink-communities-partner-platform-plan.md), including its original commercial, retention, ownership and provider-outage questions.
- [Partner platform progress](traderlink-communities-partner-platform-progress.md).
- [Discord pilot progress](traderlink-communities-discord-pilot-progress.md).
- [Complete dated QA record](traderlink-coaching-complete-qa-20261001.md) and its thirteen-area evidence boundaries.
- Existing feature checkout: `coaching-resume-20260926`, checkpoint `1a10c172a0b2e9daaf9c7b570bd67874cd200013`; final QA source correction `497aab8e174423ec56ce3db1d6a0aed1ac811a83`.
- Source inspected for this plan: `app/(dashboard)/communities/onboarding-actions.ts`; community platform/admin repositories and snapshots; coaching Discord refresh/access lifecycle; community dashboard and publishing views. Source inspection identifies work, not a claim of new browser acceptance.

Definition of done: all required register items pass; every inventory row is reconciled; conditional functionality is either accepted and proven or expressly deferred and unavailable; current-production integration, operational recovery and owner acceptance are recorded; production publication remains explicitly authorized. Until then, say **private-pilot checkpoint complete, launch work incomplete**.


## Owner direction — batch full-build verification

The owner explicitly directed that the small lesson-publication correction does
not need a standalone full build now. Its focused regression, lint and targeted
TypeScript checks are sufficient to continue development. Defer the full build
to the next combined implementation/release-verification checkpoint. Do not
retry it for this correction or treat it as a blocker to further Coaching work.
No build pass, push or deployment is implied. Next local work: reconcile worker/
recurrence and attachment operating-readiness evidence; implement only
demonstrated gaps, retaining existing accepted browser results and deferrals.


## Coaching worker/storage continuation — combined build deferred

Owner explicitly defers standalone full builds to the next combined checkpoint.
Continued local implementation found and reproduced refresh starvation: failing
or suspended oldest memberships monopolized bounded worker passes. An explicit
process-local cursor now rotates attempts across ticks/connections without
fabricating fresh evidence or bypassing roles. Provider/suspension/wrap regressions
pass. Populated synthetic image bytes also survive SQLite backup/restore/readonly
reopening with both participant reads and outsider denial. These are isolated
proofs, not hosted load/recovery certification. No full build, push, deployment or
hosted record/Discord change. See the [current consolidated audit](coaching-completion-audit-20261015.md).


## Queued QA delivery recovery verified — October 16, 2026 UTC

Owner authorized the staging-only cutoff correction with “proceed.” Immediately
before activation, the exact approved delivery was pending with zero attempts;
hypothetical eligibility was one target-community row and zero other-community
rows. Changed only `TRADERLINK_COMMUNITY_DELIVERY_NOT_BEFORE_UTC` from malformed
`2099-01-01T00:00:00Z` to `2026-10-16T02:50:57.315Z`. Older historical rows remain
excluded. This is a timestamp gate, not a per-delivery allowlist: later eligible
items may run normally. No manual job, retry, resend or new publication occurred.

Staging activation `a339f365-4d21-4920-9ee2-8849a7385d5a` SUCCESS. Source remains
`0509afea52b5a227cc48831c8c0352f8a8b7f0e0` on configured `staging`; image remains
`sha256:d254f53f7b666936f38987771fad32b553b5b6f337f27cfa3f34057ced471fa5`.
One RUNNING instance, predecessor removed from active deployments, original `/data`
volume, overlap 0 / drain 30; health HTTP200 ready/sqlite_single_node. All 160
migration IDs/orders/checksums match the prior ledger. No source publication or
local build was required for this configuration correction.

| Acceptance | Result and actual evidence |
| --- | --- |
| Existing delivery consumed | PASS — same `eccf1be3-582c-4a9f-bd73-5bd51097bc74`, delivered/confirmed, one attempt, one confirmed history entry, no error |
| Natural worker result | PASS — delivered `2026-10-16T03:13:48.707Z`; operator issued no delivery invocation |
| Real Discord receipt | PASS — read-only GET HTTP200 for message `1560490922507112531`; correct bot `1554300060483715162`, channel `1559172786176401410`, exact approved title/body |
| No mentions / duplicates | PASS — no user/role/everyone mentions; bounded latest100 read returned complete channel history and exactly one QA reference match |
| Persistence | PASS — repeated read at03:14:05Z still confirmed, one attempt and same message ID |
| Scoped isolation | PASS — normal community active, mappings5/destinations3; Tests active, mappings1/destinations1; QA mapping only community.view/community.alerts.view; Test2 has no community connection |
| Hosted health / production | PASS — staging health200; production remains deployment e7e482b5-7eb1-47d3-800a-816e229aad05 SUCCESS/source82784f53c; no production action |
| Signed-in delivery UI reload | NOT TESTED in Codespaces — PC browser confirmation remains |
| Actual mobile mapping/channel Light/Navy | NOT TESTED — prior viewport remained desktop |
| Safely filtered browser failed-request capture | NOT TESTED — unavailable browser listener, not zero failures |
| Permission/error/race staging cases | NOT TESTED where not previously observed; do not manufacture failures |

[Existing Discord message](https://discord.com/channels/1559172784813514803/1559172786176401410/1560490922507112531).
Alert `dd766fda-c5e2-47cd-bda0-1f74bb13f89d` and original QA fixtures retained.
No operator changes to protected Coaching, Journal, grants, Bullrun, moonmafia,
roles/channels, commissions or community connections. Isolation proof is scoped
metadata, not an exhaustive customer-record comparison. No Help Center change:
configuration recovery changes no product UI or documented workflow.

Sanitized evidence:
`/workspaces/traderslink-coordinator/preservation/discord-qa-delivery-recovery-20261015/`
contains before/after queue eligibility, exact QA row/history, Discord receipt,
scoped connection/mapping metadata, deployment/ledger and HTTP checks. Prior
diagnosis evidence retained separately. Real provider receipt is Codespaces API
proof; it does not replace signed-in browser acceptance or certify feature launch.


## PC delivery and mobile browser acceptance reconciled — October 16, 2026 UTC

Source: owner-supplied signed-in PC browser report; no new Codespaces browser
session, hosted read, code correction or deployment was performed for this update.
The approved mapping-persistence and successful delivery browser path is PASS.

| Acceptance item | Result and proof boundary |
| --- | --- |
| Visible delivery and reload persistence | PASS — manage/channels displays Delivered, message1560490922507112531, timestamp2026-10-16 03:13 UTC; reload preserves state and receipt |
| Visible Discord receipt | PASS — linked message from TradersLink Communities with APP badge, exact approved title/body/reference TLTESTS-20261015-QA01; one matching message visible in inspected channel view |
| Mobile role mapping | PASS — /communities/traderslink-tests/manage/roles in Light/Navy, measured390×844; QA test → Access alerts mapping visible |
| Mobile channel/delivery presentation | PASS — /communities/traderslink-tests/manage/channels in Light/Navy, measured390×844; Alerts → #general, Delivered and receipt readable; cards stack and controls/labels remain readable |
| Mobile horizontal overflow | PASS — document scroll/client widths match390px, or375px with15px scrollbar |
| Worker attempt count / exhaustive uniqueness | Separate Codespaces API evidence PASS; browser did not independently prove attempt count or exhaustive channel-wide uniqueness |
| Sanitized failed-request metadata | NOT TESTED — no safe filtered capture collected; not zero network failures |
| Mapping/channel errors and permission denial | NOT TESTED in successful-flow retest; no failures manufactured |
| Onboarding controlled late-response ordering | NOT TESTED on staging; earlier isolated regression proof remains separate |
| Onboarding verification/ownership-failure guidance | NOT TESTED on staging; earlier isolated guidance/access proof remains separate |
| Test2 connection/mapping/delivery | NOT TESTED — installed but unconnected; no connection action authorized by this retest |

Discord receipt:
https://discord.com/channels/1559172784813514803/1559172786176401410/1560490922507112531
Title: `QA ONLY — Staging delivery check`.
Body: `QA ONLY — TradersLink Tests staging delivery check. Synthetic acceptance test; no trading recommendation. Reference: TLTESTS-20261015-QA01.`

PC reports screenshots captured; no standalone screenshot paths were supplied in
this handoff. Screenshots remain supplied PC evidence, not newly inspected files.
Temporary tab-scoped emulation/viewport overrides cleared and original Navy
appearance restored. No Retry, Send again or Publish action. No records created or
modified apart from restored appearance. Reported preservation: normal TradersLink,
Test2, Bullrun, moonmafia, all Coaching/Journal records and commission settings.
These are browser-reported boundaries; no broad database invariance audit claimed.

Do not repeat these passed delivery/mobile checks without a new regression signal.
Remaining evidence gaps above stay separate; this is not whole-feature launch
certification. No code change, test/build, hosted mutation or deployment is needed
for recording this evidence. No Help Center update: behavior and guidance unchanged.


## Service-card editing navigation — October 15, 2026 Toronto

Owner requested Edit navigation for every selected service card and every service
in Plan preview. Implemented for all13 service types: separate non-submit Edit
buttons scroll to and focus the matching options region. Selection/removal keeps
its existing behavior; unsaved plan entries and live preview remain intact. Uses
shared theme/button tokens, scroll margin for the header, accessible service names
and keyboard focus. Help Center Coaching guidance now explains both entry points.

Verification PASS: actual React/MUI component in isolated Chromium at1440×844 and
390×844, Light/Navy. All13 services tested from BOTH Edit entry points using Space/
Enter: correct focused region and scroll position, no submissions or external
requests, unsaved name retained, Performance review Monthly change reflected in
hidden form value and preview, removed-service Edit links disappear, no horizontal
overflow. Screenshots/results retained in `/tmp/coaching-plan-edit-qa/`; inspected
Navy mobile editor and Light desktop preview. This is isolated UI proof, not a new
signed-in staging pass or complete app-shell visual review. Targeted ESLint,
changed-file semantic TypeScript (0 diagnostics), existing role-selection/save-
feedback regression and diff checks PASS. No production build needed for this
bounded navigation change. Owner visual acceptance and staging release remain
separate; no deployment or hosted record changes.

Production integration artifacts still refer to earlier staging0509afea5; this
local UI slice must be included explicitly when refreshing the combined candidate.
Do not overwrite the retained staging database or its migration history.


## First-time coach usability QA — October15 Toronto

[Full usability report](coaching-first-coach-usability-qa-20261015.md):80 isolated actual-component/route renders and desktop/mobile Light/Navy interaction checks.12 reproducible UX findings (10 primary screens,2 secondary routes): hidden profile/role prerequisites; unsaved plan/lesson loss; ambiguous lesson Save/publication/audience; secondary list navigation; private-note wording; Journal/paused recovery; selected-image feedback. Trade selection/queue/save/reopen, five review kinds, request controls and final required-work guidance pass bounded UI checks. Not a staging/session/backend acceptance replacement. No product edits/deploy/hosted writes. Recommendations grouped into coherent batches; Help updates required with implementation. Owner's My coaching question remains queued until this pass finishes.


Owner's My coaching follow-up completed AFTER the first-coach audit checkpoint.
It is the implemented student workspace, not unused legacy. Confirmed UX13:
menu/index admit pending/declined student relationships but workspace filters them
out, leaving No active coaching/Journal sharing and no request status.12 isolated
Light/Navy desktop/mobile renders and actual menu JSX checks reproduce it; no
claim about the owner's live relationship state. Total audit findings13. See
[UX13 evidence and correction proposal](coaching-first-coach-usability-qa-20261015.md#ux13--my-coaching-follow-up-performed-after-the-main-pass). No runtime/deployment changes.


## Usability correction batch — October16 Toronto (local verification)

Owner authorized proceeding with the next batch. UX01–UX13 now have local
corrections: draft-switch/reuse confirmation; explicit private draft/publication
actions and scoped recipients; actionable setup/role/Journal/pause guidance;
direct review/session links and UTC labels; private-note labels; selected-image
preview/validation; and visible pending/declined student requests with navigation.
No permissions, role assignments, grants, agreements, schema or hosted records
changed. Original observations above remain the before-state evidence.

[Implementation, checks and release boundaries](coaching-usability-corrections-20261016.md).
All13 are addressed locally, not closed as signed-in staging acceptance. Production
integration artifacts still need to include this batch; do not apply the production
manifest to the existing staging database.


## Owner-approved community navigation continuation — October 16

Follow [navigation progress](community-navigation-progress-20261016.md) for the complete approved hierarchy and local implementation checkpoint. My coaching layout is reserved for owner review last. No deployment authorized.


## Owner-directed publishing restrictions and stats — October16

Start A/B of the [complete publishing and stats plan](community-publishing-and-stats-plan-20261016.md). Its [progress](community-publishing-and-stats-progress-20261016.md) tracks design review and implementation. Stats inventory retained for later; Members and My coaching unchanged. No new deployment authorization.


## My coaching organization — owner-directed October16

Owner now requests the student-page organization work. Follow the [complete slice plan](my-coaching-organization-plan-20261016.md) and [progress](my-coaching-organization-progress-20261016.md). Show the concrete layout for review before runtime implementation; preserve existing student capabilities and protected records. No deployment.
