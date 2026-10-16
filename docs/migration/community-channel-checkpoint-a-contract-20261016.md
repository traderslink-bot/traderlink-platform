# Checkpoint A — analyst destination contract and design

Status: complete planning/design record, October16. Owner approved the channel-assignment design. Owner subsequently reauthorized local B implementation; its progress is recorded in the linked plan. No application code or hosted changes in this checkpoint.

## Owner-facing design
Manage → Discord channels → Publishing destinations

| Content | Channel | Allowed publishers | Status | Action |
| --- | --- | --- | --- | --- |
| Alerts | #analyst-a-alerts | Analyst A | Available | Edit |
| Watchlists | #analyst-a-watchlists | Analyst A | Available | Edit |
| Alerts | #shared-alerts | Analyst Discord role | Available | Edit |

Edit destination fields:
- Discord channel: existing same-server text/announcement channel selector.
- Content: Alerts or Watchlists; existing Coaching/General records remain supported without applying these new analyst rules.
- Allowed publishers: individual connected team members and/or actual Discord roles; names shown, stable IDs saved. Both can be combined.
- Selected people/roles can be removed. No assignments means only verified owner can publish there.
- Bot availability is displayed separately; being assigned does not repair missing bot permissions.
- Save assignments does not post a test message or change Discord itself.

Alert/watchlist editor:
1. Content and audience retain their existing controls.
2. Distribution: Website only / Send to Discord. Tracked-page versus full Discord post remains a content-format choice; do not mistake tracked_page for website-only. Full Discord post requires a selected destination.
3. Send to Discord reveals only permitted destinations of the correct content type. One option may be preselected; multiple options require deliberate selection.
4. Publish review shows exact channel names and whether delivery is page-link or full-content.
5. Save draft retains content, distribution choice and selected channels. Permissions are rechecked on reopening/publishing; unavailable selections are explained, not silently replaced or dropped.
6. Website-only explicitly queues zero deliveries. No assigned destination does not prevent website-only publication where existing page/audience access permits it.

## Authorization decision table
| Case | Result |
| --- | --- |
| Verified community owner | May select any configured available destination in that community |
| Publisher capability + individual destination assignment | Allowed |
| Publisher capability + matching current Discord-role assignment | Allowed |
| Destination assignment without publisher capability | Denied |
| Delegated channel administrator without publishing capability | Can administer assignments, cannot publish |
| Publisher with no matching assignment | Denied except explicit website-only publication |
| Different community / wrong content type / inactive destination | Denied |
| Discord verification unavailable or stale | No new send until verification recovers |
| Confirmed role or membership loss | No new send; preserve content and receipts |

Assignment union is additive; no individual-deny override is proposed. If a shared role grants a destination, removing only an individual assignment will not remove that role-derived access. Show the grant source to the owner. App publishing assignments are explicit authority; publisher personal Discord channel permissions are not an additional automatic grant or denial in this approved model. The bot still needs its own View Channel/Send Messages permissions.

## Data contract for B (names provisional; no migration reserved/applied)
- Destination assignment: community ID, destination ID, subject kind(user/Discord role), subject ID, active status, assigning actor, created/updated time. Enforce uniqueness and same-community references. Individual subject must be an eligible connected team member; role must exist in discovered guild.
- Publication distribution intent: community, object kind/ID, initiating publisher, website-only/Discord choice, exact destination IDs, draft/version identity and timestamps. Destination selections persist independently of delivery attempts.
- Delivery: retain initiating publisher and destination identity, authorization contract version and selection context; historical attempt actor remains distinct. Do not overwrite original author when an authorized editor publishes.
- Assignment audit: who changed access, what changed, when; no secrets or private message content.
- Activation/legacy transition: explicit reviewed state, not inference from absence of assignments. Legacy uncertain/failed/pending rows lack new evidence and require reviewed disposition; preserve all existing receipts.

## Shared decision path
Resolve active community → verify current publisher identity/membership → verify content publishing capability → resolve individual and role assignments → intersect same-community active destinations/content type → validate entire requested selection → persist publication intent and queue atomically. Owner exception is explicit. Worker repeats current access checks before sending; a denied or unresolved selection cannot fall back elsewhere. Recheck mutable assignment state immediately before POST; document that an already accepted remote request cannot be retracted by later revocation.

Retries/resends keep original destination and publisher; record requesting admin separately. Recheck original publisher authority and current assignment. Existing uncertain-send acknowledgement, attempt identity, nonce/idempotence, backoff, rate-limit cooldown and single-writer guard remain intact. Never automatically resend after assignment edits.

## Complete affected-path inventory
- community-dashboard.tsx: channel assignment surface and edit controls.
- community-setup-feedback-actions.ts and community-actions.ts: both feedback and legacy destination-save paths; scoped validation.
- community-alert-composer.tsx and community-watchlist-composer.tsx: distribution/destination controls.
- community-publication-actions.ts: feedback save path through actual legacy publication handlers; retain draft/error/retry behavior.
- community-actions.ts: initial alert/watchlist creation and updates; draft republishing and member-watchlist placement actions.
- traderlink-community-platform-repository.ts: all queueDestinations callers, publication transaction, snapshot destinations and saved intent.
- traderlink-community-repository.ts: existing effective capability/role evidence; shared resolver must preserve access contract.
- community-discord-resources.ts: bot availability and role discovery; no live mutations.
- traderlink-community-discord-delivery-service.ts: publisher/assignment checks before send, truthful failures.
- community-delivery-retry-service.ts and community-delivery-history.ts: actor separation, retry/resend gates and historical receipts.
- contracts/traderlink-community-platform-contracts.ts: eligible destinations, assignments and draft selection types.
- additive migration and manifest: Coordinator reserves identity/order against latest combined lineage before implementation.
- Help and plan/progress: align controls, access sources and legacy transition.
Member-owned watchlist sharing must remain distinct from official staff publishing: sharing on the app cannot implicitly broadcast through staff destinations. Coaching plan delivery remains unchanged.

## B acceptance inventory (planned, NOT RUN)
1. Three analysts with same role, different individual channels; no cross-publishing.
2. Role/individual union, grant-source explanation and removal behavior.
3. Owner exception and delegated management versus publishing separation.
4. Cross-community/wrong-type/tampered/inactive selection rejects atomically.
5. Website-only queues none; one/multiple explicit selections queue only selected destinations.
6. Draft save/reopen and lost permission retain input with actionable correction.
7. Creation/update/first publication; author ownership preserved.
8. Queue revocation/provider failure/recovery and just-before-send checks.
9. Retry/resend/uncertain handling, duplicate prevention and unchanged receipts.
10. Legacy pending rows held without guessed attribution or fallback.
11. Member watchlist placements do not gain staff delivery; Coaching unchanged.
12. Light/Navy desktop/mobile accessibility, pending/error/success and owner visual review.
No test suite, local build or runtime is authorized by this record. Appropriate verification environment and release approval remain separate.

## Exit and next work
A is complete as a source audit, contract and design handoff. It does not mean channel restrictions exist or run on staging. B was subsequently reauthorized and implemented in source; runtime verification, UI acceptance and release remain separate. Full Community stats/market-data alert-performance inventory remains in the controlling plan. Members list, My coaching and both disabled commission boundaries are preserved.
