# Separate Watchlist listing and analysis publication

Owner-approved follow-up, 2026-09-15. Preserve the existing working analysis,
editor, Discord links/images and indicators. Progress:
[implementation record](watchlist-separate-listing-analysis-progress.md).

Implementation and focused verification checkpoint complete; immutable source
handoff sent to Visible release coordinator. Integrated dependency-complete checks,
hosted migration/source cutover and live acceptance remain in the release lane.

## Complete product scope

1. Keep the current combined approval/publication path: if a ticker is not yet
   public, approving its analysis publishes both and sends one listing announcement.
2. Add an explicit `Publish ticker without analysis` action to a held ticker's
   main Admin Watchlist row. It is available without a successful AI draft.
   It publishes the ticker, existing Potential Path and Indicators, and sends the
   normal listing announcements: Discord links without analysis images, and
   opted-in push/email links. It does not publish any unapproved analysis, buy
   another AI request, or change current automatic generation/session settings.
3. Keep View / edit analysis. Generating, refreshing and saving a draft never
   publish that new analysis. The ticker and any previously approved analysis
   remain visible while a replacement is pending or fails.
4. For an already-public ticker, use `Approve and publish analysis` with a
   `Notify users` checkbox. The checkbox is initially unchecked for each new
   approval; selection is an explicit instruction for that saved revision.
   Apply this to the first analysis added after listing and every replacement.
5. Unchecked: publish the approved analysis to the ticker page, with no Discord,
   push or email update. Checked: publish the analysis, then send a distinct
   analysis-update announcement. Discord retains its links and attaches approved
   analysis images; push/email contain links only. No second listing announcement.
6. User channel preferences still apply. `Notify users` is not permission to
   override a member's push/email opt-out. Existing channel transport configuration,
   retry rules and uncertain-receipt handling remain in force.
7. Reflect the same action and checkbox meaning in AI Controls. Do not remove
   existing editing, preview, audit history or delivery recovery controls. Keep
   mobile/desktop styling and accessibility consistent with current buttons/labels.

## Visible copy

- Held row action: `Publish ticker without analysis`.
- Already-listed analysis action: `Approve and publish analysis`.
- Checkbox: `Notify users`.
- Initial combined action remains `Approve and publish`.
- Successful listing status: `Ticker published without analysis.`
- Successful silent analysis status: `Analysis published.`
- Analysis update notification: `TradersLink Analysis is now available for YFOR.`
  Substitute the actual ticker. Keep existing Watchlist and ticker-detail links.
- Initial listing announcements retain the existing ticker-added wording.

## Confirmed implementation boundaries

- Runtime owner row: `src/runtime/manual-watchlist-row-review.ts`.
- Existing AI Controls: `src/runtime/manual-watchlist-analysis-review-panel.ts`.
- Authenticated API dispatcher: `src/runtime/manual-watchlist-analysis-review-api.ts`.
- Runtime manager: `src/lib/monitoring/manual-watchlist-runtime-manager.ts`.
- Durable runtime evidence: `src/lib/ai/traderslink-ai-read-review-store.ts`,
  publication-preview/Discord renderer and publication authorization helper.
- Platform owner proxy: `app/api/admin/watchlist/runtime/[...path]/route.ts`.
- Platform notification follow-up changes belong on top of immutable candidate
  `49feda72d88b7a19dbbbc37e13ec61548c639b77`, not inside it. Coordinator confirmed
  production parent `65e74ea499fac4d848a27d60de9e17142d117ac1`; migration 0137 is
  not applied but is already immutable and must not be edited.
- Existing publication authorization treats analysis approval as listing approval.
  Split the evidence, not the market-data flow: listing permission authorizes
  approved ticker/levels/indicator patches, never an arbitrary analysis body.
- Existing approval calls website publication then Discord. Persist the checkbox
  choice with the approved revision and its frozen payload so retry/background
  recovery cannot send a deliberately silent analysis.
- Existing Platform notifications use one event per cycle, intentionally adequate
  for listing only. Analysis updates require distinct revision-scoped event keys.
  A separate Coordinator-reserved additive migration is needed; do not overload
  the cycle identifier, reuse a listing key, change 0137, or erase its receipts.

## Durable action rules

0138 implementation: preserve the real cycle ID and rename the notification
event primary key to `event_id`. Existing listing event IDs and delivery receipts
stay unchanged. Analysis IDs use cycle + approved revision. Intents have a
separate `intent_id` and allow draft revision zero for explicit listing-only
actions. Runtime approval revision zero refers to no selected AI draft, never a
synthetic analysis. Runtime approval records freeze notification kind and choice;
the Platform stores that authenticated choice with each acknowledged event.
0138 preserves existing preference values and never backfills a new delivery.

- Initial listing key: activation cycle + listing, regardless of whether the
  initial listing has an analysis.
- Analysis-update key: activation cycle + approved analysis revision. Only enqueue
  if that revision's persisted Notify users value is true and website delivery
  is acknowledged. The first combined publication must consume listing only.
- Save a listing-only approval independently of an AI draft; retain the draft
  and generation failures/audit. A later analysis approval does not replace or
  erase the original listing acknowledgement.
- Snapshot eligible opted-in recipients at the explicit action; retry cannot
  enroll late opt-ins. Recheck preferences/access/device/email before sending.
- Discord retries operate on the corresponding frozen listing or analysis-update
  payload and receipts. Silent revisions have no Discord delivery to retry.
- Cancellation/removal prevents unfinished old work from reviving a ticker or
  posting a stale analysis. A new activation has a new listing key.
- Historical review events missing these new fields retain their original meaning.
  No history scan, retroactive notifications, synthetic old approvals or default
  opt-ins. Do not replay the expressly prohibited ADBT delivery.

## Implementation order and narrow scope

1. Complete source inventory and plan QA; confirm new migration allocation and
   runtime/Platform integration parents with Coordinator.
2. Add durable listing-only and per-revision notification-choice contracts, with
   backward-compatible replay of existing review history.
3. Add listing-only website/Discord publication using existing snapshot/link
   builders; preserve analysis-body authorization on every ingest/publisher path.
4. Wire analysis approval to silent/notified behavior, including delayed/retried
   delivery and the two owner UI surfaces. No AI prompt/model/candle changes.
5. Add separate notification action identity/storage without changing immutable
   0137; retain current preference and transport building blocks.
6. Update Help and progress, run focused tests at the complete slice checkpoint,
   create separate narrow commits and hand exact SHAs to Coordinator. No local
   servers, real user notifications, migrations or deployments in implementation.

## QA and acceptance inventory

- Failed/no analysis: list now; correct public levels/indicators; no private draft.
- Generation in progress during listing: completed draft stays private.
- Combined initial approval: exactly one listing announcement with approved images.
- First later analysis, Notify users off/on: silent publication / one analysis update.
- Replacement analysis, off/on: prior public analysis retained until approval;
  correct approved replacement; no repeat listing announcement.
- Manual refresh failure: public ticker and old analysis remain unchanged.
- Save without approve, preview, checkbox toggle without approve: zero sends.
- Double click, timeout, restart, website failure, Discord failure, push/email
  failure and retry: correct frozen payload and action identity; no duplicate event.
- Revoke preference/access; disable global visibility; remove/reactivate ticker;
  old review history; multiple devices; new opt-ins; all channel combinations.
- Silent analysis must never be sent by retry-Discord or automatic recovery.
- Both admin surfaces reflect authoritative listing state, saved revision and
  pending controls; keyboard labels and mobile layout remain usable.
- Existing analysis/AI settings, public paths, editor, images, indicators, accounts
  and unrelated notification categories remain unchanged.

## Initial QA findings incorporated

Cycle-only deduplication would suppress legitimate analysis updates; reusing the
listing flow would duplicate announcements. An unsaved checkbox could be ignored
by recovery. A draft-dependent listing button would fail the owner's main use
case. Granting generic publication permission could leak unapproved analysis.
All four are explicit contract tests above; none justify changing AI analysis.
