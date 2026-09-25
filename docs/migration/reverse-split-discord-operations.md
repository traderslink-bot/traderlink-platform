# Reverse-split Discord operations

Implementation is in progress; do not activate or deploy from this document alone.
See [plan](reverse-split-discord-plan.md) and [progress](reverse-split-discord-progress.md).

## Current private activation contract — September 25, 2026

The owner approved the full private preview and both notification settings locations. The coordinator owns release, configuration, backups/migration, health and activation. This task has changed source plus the authorized Discord channel permission overwrite only. No production configuration, SQL or notifications were changed/sent by this task.

- Enablement requires BOTH `REVERSE_SPLIT_ENABLED=true` and `REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED=true`; absent flags mean no new worker timer/import/DB/provider activity. Existing exact two-subject owner page/API/navigation authorization remains required; there is no public rollout mode.
- Reuse existing EODHD token, Discord bot/guild and owner-subject configuration. `REVERSE_SPLIT_SEC_USER_AGENT` must identify the actual contact. `REVERSE_SPLIT_DATA_USE_APPROVED` is retained for future commercial review, not treated as proof of entitlement and not a replacement for private identity gates. Public/member redistribution remains blocked pending separate approval.
- Discord additionally requires `DISCORD_REVERSE_SPLIT_DELIVERY_ENABLED=true`, `DISCORD_REVERSE_SPLIT_CHANNEL_ID=1552850262966669352` and `DISCORD_REVERSE_SPLIT_PRIVATE_CHANNEL_CONFIRMED=true`. Never reuse the halt channel. Bot View/Send/ReadHistory are verified; text-only posts need no EmbedLinks permission. @everyone is denied; existing administrator roles bypass overwrites, and their membership was not audited.
- Push/email additionally require `REVERSE_SPLIT_NOTIFICATIONS_ENABLED=true`, existing Platform transport configuration, owner identity and individual default-off opt-ins. Settings on both pages use the same News row. Enabling consent does not retroactively enqueue earlier digests. Active subscriptions/confirmed email are required, and recipient ownership/consent/targets are rechecked at delivery.
- Canonical evening digests are independent of channel configuration, with immutable parts and one date/revision signature shared across channels. Only material split changes create corrections; float/price refresh alone does not. Nightly preparation starts at 19:00 Eastern after fresh source discovery. Delivery can follow later; no exact clock-time or exhaustive coverage guarantee. Unsent digests expire at Eastern midnight.
- The page preview prepares content from saved data without writes/providers/sends. After that evening's digest exists it displays the latest prepared content. Missing source readiness shows unavailable, not fake examples or an exhaustive no-splits assertion.
- Migration 0142 is seven tables, canonical SQL SHA256 `4d88aa953849d78e82b1d8d26c700da0b128f80678f3721b1e942dbd221f3f7d`. Coordinator approved local manifest registration after immutable source review; paused 0141 remains excluded. The real manifest runner/verifier and real user-erasure service passed the owned in-memory two-user integration check, preserving the other user and shared records. Production backup/rehearsal/application remain separate release gates.
- Discord uncertain POSTs reconcile exact bot/content/reference against latest100 channel messages rather than resend. Earlier unresolved parts block that evening's later parts. Push retries have a stable tag; network ambiguity can still produce a repeated provider request. Email uses a stable Resend idempotency key. Provider success is not phone receipt.
- Recovery/rollback must preserve new tables and historical receipts. Disable feature/delivery flags through the coordinator, then use only a schema-compatible application release; never drop tables or reset queues to force a resend. Coordinator must verify backups, manifest identity, single writer, deployment SHA/health and actual permitted destinations before live acceptance.

Required remaining proof: collection/current-and-backfill source coverage, representative shareholder-approval corrections, live calendar/dated-close behavior, populated UI with Light/Navy/mobile review, real private Discord receipt, opted-in Push/email delivery and actual owner-device receipt. Keep existing halt/PR delivery and paused Welcome untouched.

## Historical empty-preview operations (superseded by current contract above)

The owner has authorized the coordinator to release the restricted preview, not public availability or collection/delivery. Reuse existing `TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT` via `hasOwnerMarketDataAccess`; do not print, change or duplicate its configured identities. Coordinator must privately verify exactly two valid configured subjects and the intended active Platform identity links. Anonymous/non-owner/local-development requests fail closed. Premium, guild-admin and workspace-owner status are insufficient.

The page `/reverse-splits`, private guide `/reverse-splits/help`, and batch endpoint `/api/live-watchlist/reverse-splits` enforce the gate; navigation reuses its existing server-derived owner-access flag. The former public `/help/tools/reverse-splits` URL has no guide. Public Help collections/search contain no new reverse-split content. Batch responses are private/no-store with `Vary: Cookie`; denied requests return generic 404 without ticker validation or News reads.

The private preview requires online authentication. Its navigation is excluded from new PWA offline snapshots for every user, and the existing route contract already excludes both private routes from stored content projections. Existing PWA data is preserved; no cache deletion, subscription change or offline migration is part of review.

`REVERSE_SPLIT_OWNER_REVIEW_ONLY` is a server-only source lock, not an environment activation setting. It returns empty/unavailable preview data before opening reverse-split tables even if feature/data-use flags are present. No 0142 migration is needed. Keep that migration unregistered/unapplied and workers/delivery unhooked. No configuration change is needed for review. This preview cannot verify actual records, badge appearance, data freshness, collection or Discord/Push/email delivery. Removing the lock requires a later reviewed feature checkpoint; it is not part of this release authorization.

The visual release coordinator owns all hosted configuration, backup/migration, release and channel activation. Preserve the current halt implementation and the single-writer Railway volume. This feature does not replace or resume the paused private welcome feature.

Required pre-activation evidence: selected channel belongs to TradersLink, bot can view/send/read history, approved data redistribution, official-feed coverage and parser proof, verified calendar coverage, date-specific price provenance, narrow reviewed commit, schema-compatible fallback, deployment health and an actual Discord message receipt.

## September 25 source checkpoint

The owner approved the live private UI. Standalone collection, nightly digest planning and durable Discord delivery modules now exist, but no worker invokes them. The attempted shared runtime hookup was rejected by the safety reviewer; direct owner approval was requested for the disabled hookup only. Do not infer approval to activate from source-path coordination. The shared worker and migration manifest remain unchanged.

Delivery parts have immutable content and a unique `RS-` reference, plus a stable Discord nonce. This feature does not rely on nonce retention across deployments. After a timeout, lost response or crash in the POST window, it searches the latest 100 messages for an exact reference/content match from the configured bot. A missing receipt remains uncertain; it is not permission to resend. After 24 hours an unresolved receipt is recorded failed. Higher parts/revisions for the affected evening remain blocked until earlier receipts are delivered; other dates are independent. A definitive Discord429 is retryable after its supplied delay. Wrong guild/channel/bot or definitive rejection fails closed. Bot needs View Channel, Send Messages and Read Message History; no administrator permission is needed.

This conservative policy can withhold a message after a crash before its HTTP request actually left the process, or if channel activity/deletion hides its receipt. That is an explicit unresolved-delivery condition, not successful delivery. Operator investigation must reconcile existing Discord messages and stored immutable parts before any recovery; do not reset the delivery table or delete receipts to force a resend.

Only material split terms trigger an evening revision. Updated schedules are explicitly labeled as updated information, including when a split moves outside the original nightly window. Float/price refresh alone does not generate duplicate alerts. Source discovery must be fresh, security classification verified and the regular close date correct; missing values remain unavailable. Still-unknown records do not become inferred cancellations. The preview lock, data-use gate, missing-channel gate and separate Push/email preference work remain unchanged.

## Authored configuration, not activated

Owner reconfirmed the reverse-split destination on September 25: `1552850262966669352`. At the coordinator-controlled activation checkpoint, use this value for `DISCORD_REVERSE_SPLIT_CHANNEL_ID`; do not ask the owner for it again. Recording the destination does not change hosted configuration or authorize a send. Guild membership and bot channel permissions still require verification.

- `REVERSE_SPLIT_ENABLED=true` enables configuration for the ingestion feature; default is off. No runtime hook is registered yet.
- `REVERSE_SPLIT_SEC_USER_AGENT` must identify the actual application/contact with a valid contact email. Do not invent contact information.
- `EODHD_API_TOKEN` (existing `LEVEL_EODHD_API_TOKEN` fallback) supplies float and dated EOD prices server-side. API access alone is not commercial data-use permission.
- `REVERSE_SPLIT_DATA_USE_APPROVED=true` is the explicit data-use gate. Member-facing dashboard/Watchlist consumers must enforce this gate when implemented, not only Discord.
- `DISCORD_REVERSE_SPLIT_DELIVERY_ENABLED=true` requires the data-use gate, `DISCORD_REVERSE_SPLIT_CHANNEL_ID`, existing `DISCORD_BOT_TOKEN` and existing guild configuration. The reverse-split channel must differ from the halt channel. Collection does not require Discord delivery to be enabled.
- No Push/email variables, enrollment changes or subscription migrations have been introduced. Those must reuse the approved existing preference and delivery contracts.

Migration 0142 is source-only and unregistered. Do not run it independently of the final manifest, verifier, backup and release review. Do not include paused Welcome 0141. Parser rules, full history, freshness reporting, source correction handling and provider/filing acceptance remain incomplete. The source checkpoint is not release-ready.

The authored dashboard route is `/reverse-splits`. Its data reader and the authenticated Watchlist batch route enforce both feature enablement and data-use approval, and read saved records only. UI source exists but has not been rendered against a populated/migrated review environment. Market snapshots are stored in the reserved runtime table, not a new schema table. Until worker integration and data acquisition are verified, an empty/unavailable UI is not evidence that no reverse splits exist. No notification preferences are changed by this page or by opening/posting a Watchlist ticker.
