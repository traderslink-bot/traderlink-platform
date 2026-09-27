# Automatic refreshed analysis publication and owner review alerts

Owner approved September 27. Progress: [implementation record](watchlist-automatic-refresh-publication-progress.md).

Local source and focused offline checkpoint complete. Hosted integration, migration/configuration and visual/device acceptance remain pending; not deployed.

## Complete target inventory

1. Preserve generation master/session/boundary controls, budgets, manual refresh, initial approval and existing saved drafts. Master automatic updates remains OFF during rollout.
2. AI Controls adds `Automatically publish refreshed analyses` (default OFF), `Notify me when an analysis needs review` (default ON), and `Send review notifications to Discord` (default ON; separately configured server secret). Display effective automatic refresh status so boundary ON cannot conceal master OFF.
3. Auto-publication applies ONLY to newly completed automatic boundary replacements of an already-public ticker, with setting enabled before request and still enabled at completion. Manual refresh and first analysis retain owner approval. Switching ON never retrospectively publishes waiting drafts.
4. Review OFF/auto-publish ON uses the existing saved approval, website acknowledgement, Discord link/image and member email/push flow. Member copy remains `SYMBOL Analysis updated`; preferences and Notify users semantics remain unchanged for manual approval. Automatic publication implies Notify users ON.
5. Review-required replacement stays private while existing analysis remains public. Notify only configured owner via inbox/push and optional private Discord channel, not members. Copy: `SYMBOL analysis ready for review` / `A refreshed analysis is ready. Review, edit and approve it in Watchlist Admin.` Link to admin, not public draft content.
6. Owner recipient resolves stable singleton operator identity; verify it is the requested TradersLink account. No display-name-based dispatch. Push requires that account's subscribed device and notification preferences. Private channel secret is server-only `WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL`; never return it in UI/status, commit it or log its value.
7. Durable per-generation/revision deduplication, restart recovery, bounded retries and Discord retry-after. Never generate another AI request due to notification failure. No repeated member announcements or sending obsolete owner alerts after approval/cancellation.
8. Runtime exposes authenticated minimal automatic-event evidence to Platform background reconciliation. Do not expose private analysis or credentials. Reuse existing member delivery queues; distinguish owner webhook receipts from member delivery state. Preserve current auth and one-writer boundary.
9. Show owner controls in existing AI Controls and delivery status in existing admin review status; no new navigation. Keep Help aligned.
10. Focused offline fixture checks at completed slice boundary for modes, manual/initial exclusions, setting changes, failure/retry, restart dedupe, auth, matching member copy and secret redaction. No paid AI calls or real notifications during implementation. Hosted test and deployment are separate Coordinator gates.
11. Owner-approved addition: member notification titles retain existing wording and append `by "This Guy"` for authenticated owner-approved listing/analysis publication. Fully automatic publication omits the name. Use actual approval actor, not generation trigger; freeze attribution for retries. Existing Discord links/images/mentions, email/push preferences and suppression remain unchanged. No new member inbox delivery system is introduced by this wording-only addition.

Attribution QA: manual review of an automatic draft carries the name; runtime automatic approval does not. Listing without analysis also carries the name. Historical accepted events default unattributed and are not replayed. Reserved, unapplied migration0146 adds an owner_approved flag to existing notification events alongside its owner-review receipt table; Coordinator confirmed migration was not frozen or applied before this extension.

## Plan QA

- Automatic publication cannot depend on manually visiting owner proxy: Platform must discover and enqueue the runtime's persisted automatic approval evidence.
- Do not use the initial-admission Review before publishing flag to change existing cycles; add a distinct boundary-refresh policy.
- Successful draft save precedes auto-publication. Delivery failure must not mark a successful analysis as generation failure.
- Pending owner drafts suppress further automatic requests. Existing public analysis remains untouched until publication.
- Disabled owner channels do not block analysis publication. Unavailable webhook is reported without printing its URL.
- Owner webhook timeout is uncertain, not evidence of rejection; avoid uncontrolled duplicate sends.

## Source ownership

Runtime assigned existing lane starts f988d43. Platform patch must reconcile from current production a741710f53503339b7df1882b472b00f8c0f56cb, not copy mixed e70f files wholesale. Migration ID reserved by Coordinator only; never apply during implementation.
