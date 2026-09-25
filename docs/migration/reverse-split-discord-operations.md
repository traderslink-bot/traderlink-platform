# Reverse-split Discord operations

Implementation is in progress; do not activate or deploy from this document alone.
See [plan](reverse-split-discord-plan.md) and [progress](reverse-split-discord-progress.md).

## Owner-only production review

The owner has authorized the coordinator to release the restricted preview, not public availability or collection/delivery. Reuse existing `TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT` via `hasOwnerMarketDataAccess`; do not print, change or duplicate its configured identities. Coordinator must privately verify exactly two valid configured subjects and the intended active Platform identity links. Anonymous/non-owner/local-development requests fail closed. Premium, guild-admin and workspace-owner status are insufficient.

The page `/reverse-splits`, private guide `/reverse-splits/help`, and batch endpoint `/api/live-watchlist/reverse-splits` enforce the gate; navigation reuses its existing server-derived owner-access flag. The former public `/help/tools/reverse-splits` URL has no guide. Public Help collections/search contain no new reverse-split content. Batch responses are private/no-store with `Vary: Cookie`; denied requests return generic 404 without ticker validation or News reads.

The private preview requires online authentication. Its navigation is excluded from new PWA offline snapshots for every user, and the existing route contract already excludes both private routes from stored content projections. Existing PWA data is preserved; no cache deletion, subscription change or offline migration is part of review.

`REVERSE_SPLIT_OWNER_REVIEW_ONLY` is a server-only source lock, not an environment activation setting. It returns empty/unavailable preview data before opening reverse-split tables even if feature/data-use flags are present. No 0142 migration is needed. Keep that migration unregistered/unapplied and workers/delivery unhooked. No configuration change is needed for review. This preview cannot verify actual records, badge appearance, data freshness, collection or Discord/Push/email delivery. Removing the lock requires a later reviewed feature checkpoint; it is not part of this release authorization.

The visual release coordinator owns all hosted configuration, backup/migration, release and channel activation. Preserve the current halt implementation and the single-writer Railway volume. This feature does not replace or resume the paused private welcome feature.

Required pre-activation evidence: selected channel belongs to TradersLink, bot can view/send/read history, approved data redistribution, official-feed coverage and parser proof, verified calendar coverage, date-specific price provenance, narrow reviewed commit, schema-compatible fallback, deployment health and an actual Discord message receipt.

## Authored configuration, not activated

- `REVERSE_SPLIT_ENABLED=true` enables configuration for the ingestion feature; default is off. No runtime hook is registered yet.
- `REVERSE_SPLIT_SEC_USER_AGENT` must identify the actual application/contact with a valid contact email. Do not invent contact information.
- `EODHD_API_TOKEN` (existing `LEVEL_EODHD_API_TOKEN` fallback) supplies float and dated EOD prices server-side. API access alone is not commercial data-use permission.
- `REVERSE_SPLIT_DATA_USE_APPROVED=true` is the explicit data-use gate. Member-facing dashboard/Watchlist consumers must enforce this gate when implemented, not only Discord.
- `DISCORD_REVERSE_SPLIT_DELIVERY_ENABLED=true` requires the data-use gate, `DISCORD_REVERSE_SPLIT_CHANNEL_ID`, existing `DISCORD_BOT_TOKEN` and existing guild configuration. The reverse-split channel must differ from the halt channel. Collection does not require Discord delivery to be enabled.
- No Push/email variables, enrollment changes or subscription migrations have been introduced. Those must reuse the approved existing preference and delivery contracts.

Migration 0142 is source-only and unregistered. Do not run it independently of the final manifest, verifier, backup and release review. Do not include paused Welcome 0141. Parser rules, full history, freshness reporting, source correction handling and provider/filing acceptance remain incomplete. The source checkpoint is not release-ready.

The authored dashboard route is `/reverse-splits`. Its data reader and the authenticated Watchlist batch route enforce both feature enablement and data-use approval, and read saved records only. UI source exists but has not been rendered against a populated/migrated review environment. Market snapshots are stored in the reserved runtime table, not a new schema table. Until worker integration and data acquisition are verified, an empty/unavailable UI is not evidence that no reverse splits exist. No notification preferences are changed by this page or by opening/posting a Watchlist ticker.
