# Community publishing permissions and Community stats

Owner direction: start checkpoints A and B; retain complete stats roadmap, then return to completing existing app work. Members list unchanged. My coaching redesign remains separate. No production deployment or new hosted action authorized.

## Complete target and sequence
A: destination contract, current-source audit, owner-reviewed UI design.
B: analyst channel assignments, publisher selection, server and worker enforcement, legacy transition and acceptance.
C: stats event collection, storage, definitions, coverage and freshness.
D: Discord reporting.
E: TraderLink and trading-community reporting.
F: integrated reconciliation, operating limits, owner acceptance and separately authorized staging/release.
Latest owner instruction explicitly reauthorizes B local implementation; Members/My coaching unchanged, no deployment. C–F remain deferred. No narrowed checkpoint hides the full inventory below.

## A — source findings
Current destinations are keyed by community/channel/content type. Channel discovery checks the bot's permissions, not the publisher's personal Discord channel permissions. queueDestinations selects ALL active destinations of a content type; it has no author/destination assignment filter. Existing retries require community.discord.manage, retain the destination, and create attempt history. Queue rows do not persist the initiating publisher. Current alert/watchlist editors protect author ownership separately; preserve those checks. Shared community watchlists and independently authored member-watchlist placements use queue paths too: audit each; member sharing must not accidentally acquire staff publishing rights. Coaching destination behavior remains unchanged.

## A — owner-approved contract
1. A Discord responsibility mapping grants the ability to publish alerts or staff watchlists. It does not grant every destination.
2. Owner or delegated Discord-channel administrator assigns an active destination to specific connected team members and/or Discord roles. Role assignment matches current verified Discord role IDs; arbitrary role names supported.
3. Effective allowed destinations are the union of individual and current role assignments, restricted to the same community, correct content type, active mapping, current publishing permission, and a usable bot destination. Assignment alone cannot grant publishing capability.
4. Verified owner can explicitly select any configured destination in their community; delegated administrators need ordinary publishing capability and assignments to publish, but may administer mappings when granted community.discord.manage. No implicit manage-all destination bypass.
5. Multiple permitted destinations: publisher explicitly chooses one or more; sole permitted destination can be preselected. No send-to-all default. Website-only publishing remains possible without a Discord destination; UI clearly distinguishes it from Discord delivery.
6. Record the actual initiating publisher, selected destination IDs, timestamp and assignment context for every new publication/delivery intent. Persist those selections for safe draft reopening and audit; validate again at publish time.
7. Server rejects tampered, inactive, foreign-community, wrong-content-type or unauthorized destinations transactionally before publication/delivery changes. Never fall back or partially publish to the authorized subset silently.
8. Worker rechecks initiating publisher's current membership, verified roles, publishing capability and assignment immediately before send. Provider verification failure pauses delivery without inventing confirmed role loss. Removal blocks subsequent attempts; retain history and explain why. Preserve existing overlap/nonce/idempotence/backoff behavior and ensure revocation semantics cover retry/resend.
9. Admin retry/resend records acting administrator and original initiating publisher separately; no retargeting or destination bypass. If original authorization is gone, blocked until an authorized explicit new publication workflow, not an automatic attribution rewrite.
10. Already delivered messages and receipts remain immutable. Legacy pending/failed rows lacking publisher/selection evidence must not be guessed or broadcast: hold for owner review with an explicit resolution workflow. No automatic resend.
11. Existing destination configurations remain preserved. Upgrade has a deliberate activation/checkpoint boundary, so incomplete assignments cannot silently alter current hosted routing. Existing pending rows require counts and disposition before activation.
12. No analyst gets permission to edit another analyst's content from a channel assignment. No Discord role/channel/overwrite mutation is needed to create app destination assignments.

## A — proposed screens (hierarchy, not final mobile layout)
Manage / Discord channels:
- Publishing destinations: Content | Discord channel | Assigned publishers | Status | Edit.
- Add/edit destination: existing channel selector and content type, then Allowed publishers: Team members / Discord roles; selected chips and removal. Show bot availability separately from publisher assignment.
- An unassigned destination says No publishers assigned; owner exception explained. No sensitive/publication side effect on assignment save.
Alert/watchlist editor:
- Discord destinations: permitted channels only; sole option preselected, multiple unchecked until selected.
- No destinations: explain access; retain draft and permit explicit website-only publishing where supported.
- Review summary lists exact selected destinations before publish; no misleading claims of sending until a receipt is confirmed.
Delivery history:
- Show publisher, destination and actual result; distinguish assignment revoked, verification unavailable and bot access failure. Existing uncertain-send confirmation remains required.
Owner approved the assignment design. [Final Checkpoint A contract and acceptance inventory](community-channel-checkpoint-a-contract-20261016.md) completes A; B now has explicit local implementation approval; acceptance and deployment remain separate.

## B — implementation slices after design acceptance
B1: reserve additive migration identities with Coordinator; destination-subject assignments and durable delivery/publisher selection metadata, indexes and scoped foreign keys. Do not select a migration number from this divergent worktree. No historical SQL rewrite, no live migration.
B2: one shared authorization resolver used by selectors, publication actions, queued delivery and retry/resend; cover all initial publish/update/shared-placement paths. Preserve private/history boundaries and coaching routing.
B3: owner assignment controls, alert/watchlist destination controls, retained draft state, inline errors and exact preview. Update Help.
B4: source review at coherent checkpoint. No Vitest/tests/build/server on this PC under current rules. Proposed verification matrix retained for separately authorized appropriate environment: same-role/different-person analysts; individual/role union; role removal/provider failure; cross-community tampering; owner/admin boundaries; initial publish/draft reopen/update; zero/one/multiple destinations; pending revocation; retry/resend/uncertain receipts; legacy hold; duplicate prevention; coach deliveries unchanged; Light/Navy and mobile/desktop. Owner UI acceptance precedes final acceptance.
B5: complete source-only allowlist/handoff including inherited Coaching baseline0e2b98a4a plus latest combined staging navigation0f7889b6/shared integration fixes. Deployment, migrations, notifications and real send tests need explicit authority and Coordinator slot.

## Complete Community stats inventory — retained, deferred after A/B
- Summary: size, growth, active participation, adoption and trends.
- Membership/growth: human/bot counts, joins/leaves, net growth.
- Retention: new-member return, cohorts, returning/inactive participants.
- Discord engagement: messages, distinct contributors, reactions and time series.
- Channels: participation, rankings, trends, busiest periods.
- Voice: participants, time and channel/time patterns.
- Roles/team: counts, engagement and designated staff contributions.
- Acquisition: invites/join sources when attribution is supported; unknown stays unknown.
- TraderLink adoption: connected participants, first use, returning/active users.
- Alerts: analyst publication counts, delivery outcomes, readership and repeat engagement.
- Watchlists: analyst publication/update counts, readership and watchlist engagement.
- Coaching: requests, acceptance, enrollments, active relationships and completion; no private student content.
- Lessons: assignment/access, participation/completion; purchases only after sales exist. Courses deferred.
- Content engagement: popular content, repeat readers and attributable coaching conversion.
- Trading alert market performance: owner requests market-data connection, stock price at alert time, subsequent movement and alert profitability/quality measures. Publication-time price is a reference, not proof of an executed entry or realized member P/L. Define actual publication event/time (app vs Discord receipt), price source and granularity, long/short direction, entry/target/stop conditions, observation horizons, regular/extended sessions, splits/halts/missing data, slippage/fees and immutable edit/version handling before implementation. Candle-level ambiguous target/stop sequence must be reported, not guessed. Keep measured price movement, simulated strategy outcomes, actual traded results and editorial quality separate. Market provider feasibility/licensing/cost must be researched at that checkpoint; no provider calls or paid data activation now.
- Reporting: date range, comparisons, channel/role/analyst filtering and scoped exports.
- Coverage: collection start, freshness, outages, excluded channels, permissions, unsupported metrics.

## Stats contracts and access
Audit collector feasibility before claiming historical backfill or complete Discord coverage. Event identity/deduplication, reconnects, voice-session boundaries, bot exclusions and time zone definitions required. Server members, app members, active contributors and readers are separate populations. Named versus aggregate access and retention need owner review; preserve current90-day named content-view policy until approved changes. No private Journal, coaching messages/private notes or sensitive cross-community data in owner analytics. Reference product: https://analytics.comcom.app/en/docs (reviewed October16); useful scope reference, not an integration commitment.

## Progress
[Checkpoint progress and acceptance](community-publishing-and-stats-progress-20261016.md).
