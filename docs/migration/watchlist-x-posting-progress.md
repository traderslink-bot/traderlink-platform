# Watchlist X posting progress

## Deployment authorization and credential verification

Coordinator allocated `0151_platform_watchlist_x_publications`; corrected production executionOrder151 (not applied count133). Isolated manifest verification preserves every identity/order/checksum in the exact 132-migration production prefix, appends 0151 as entry133, and adds exactly two managed tables. SQLite quick_check and foreign_key_check pass for the new schema; worker SQL matches migration SQL. Migration checksum: `a541381f7e71d7638f42ab843d80453eb98f27ded1179f8789963aa61efb1345`. No hosted migration applied by this task. Compatibility order164 is staging-only.

Local implementation and focused verification are ready for coordinated release. Owner approved the images and Discord copy. Hosted UI/delivery acceptance remains outstanding; no public X test post authorized. Release Platform schema/source first, then Runtime controls/image publication.

Owner now authorizes deployment and reuse of existing press-release Buffer configuration. Read-only API probe returned HTTP 200, no GraphQL errors, exact configured channel match, Twitter service, connected and unlocked. No post created. Secure source is the press-release app's existing environment file; map BUFFER_API_KEY and BUFFER_X_CHANNEL_ID to WATCHLIST_BUFFER_API_KEY and WATCHLIST_BUFFER_X_CHANNEL_ID on the Platform service. Never copy values into source, chat or logs. Existing press-release configuration remains unchanged.

Coordinator notified of deployment approval and secure variable mapping. Still awaiting migration allocation/release coordination. This worktree has no Railway project link; no arbitrary service selection, variable mutation or deployment performed here. Historical no-authorization notes below are superseded by this owner approval. Public live test posting remains unapproved.

Implementation underway. Buffer integration and connection confirmed by press-release chat; existing flow is text-only and lacks durable delivery reconciliation. Dedicated Watchlist path will preserve it.

No X posts, deployments or credential changes made. Migration allocation requested from coordinator; not yet assigned. Do not register an invented migration number or release without the schema.

## Implemented candidate

- Separate row-level Post to X and Also post to X controls, editable caption, official weighted character count.
- Independent approval intent, frozen caption/images, Buffer connection validation and accepted/sent status reconciliation.
- Unguessable approved-image URLs, restart ambiguity protection and terminal image expiry.
- Exact-parent integration transforms preserve unrelated dirty work. Help update included in candidate.
- QA corrected a dialog refresh that could silently switch the selected approved revision and avoided unrelated lockfile reordering.

## Focused checkpoint

`node src/scripts/verify-watchlist-x.cjs` passes offline caption/Unicode/link checks, SQLite intent deduplication, immutable image/revision checks, crash recovery, media retention, mocked Buffer request/status/error contracts and candidate syntax. These are not full TypeScript, browser or hosted acceptance evidence.

Additional focused checks pass: strict scoped TypeScript and the complete offline delivery worker with four frozen images, approval/website acknowledgement, repeated and concurrent requests, accepted-to-sent polling, timeout uncertainty, explicit retry after known rejection, and cycle/revision changes. These use mocked Buffer delivery and are not hosted acceptance evidence.

Remaining: migration allocation/registration, UI acceptance, narrow commit packaging. Hosted configuration requires WATCHLIST_BUFFER_API_KEY and WATCHLIST_BUFFER_X_CHANNEL_ID. No credentials belong in source or chat. Live X post and deployment require separate owner authorization.

[Plan](watchlist-x-posting-plan.md)
