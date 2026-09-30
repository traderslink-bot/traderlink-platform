# Watchlist X posting progress

## Delivery defect investigation

See [rejection diagnosis](watchlist-x-rejection-diagnosis.md). SOAR/BKYI reached Buffer but were rejected; the old code discarded the provider reason. Diagnostic correction prepared; underlying cause and live acceptance remain open. No retry/public post performed.

## Production release and read-only acceptance

Coordinator confirmed Platform `d8aaeed9ee36bc502b128c65913ec725789d2835`, deployment `7c96786e-68ab-45e6-a133-3f93c1204c8b`, and Runtime `a83f897b307d4058e30af08ad14b7b46e19d4926`, deployment `ab4caade-57d4-4514-866b-f89f9edc79f3`, running healthy as single instances. Migration0151 applied once, exact checksum above, count133. Guarded backup/restore verification completed by coordinator; no public X post sent.

Independent live read-only check after release: Platform health HTTP200 ready, sqlite_single_node, migrationCount133. Anonymous /watchlist HTTP200 without redirect, contains dated BKYI preview, Join TradersLink Discord, sign-in and Not live data text. Invalid public image token returns404. Actual owner X dialog interaction, public image delivery and X post appearance are not proved by these checks; no live post authorized.

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
