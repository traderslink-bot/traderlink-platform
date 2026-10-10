# Communities and Coaching — complete launch plan

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
- Verify account-deletion/export handling for coaching, attachments and activity against existing platform behavior. Define relationships between retained delivery records, deleted accounts and revoked Journal access.

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
