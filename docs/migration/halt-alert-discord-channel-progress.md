# Discord halt alerts

Status: original Discord feature live with real delivery evidence. Owner-approved
WZRD shared resumption-update correction is locally implemented and type-checked;
Coordinator deployment remains pending.

Controlling plan: [Nasdaq and NYSE Halt Alerts Plan](nasdaq-nyse-halt-alerts-plan.md).

## Approved scope and implementation

- Owner requested channel `1552678787676774490` on 2026-09-24 and approved production
  release and immediate live halt posting. Channel currently private to the owner.
- Use the existing shared first-ticker/day lifecycle and exact initial/quote/trade
  copy. No personal subscription is required for the channel. Keep the existing
  four-character maximum, reason exclusions, timestamp suppression, two-minute
  initial-age limit, and silent end of the expected trading-time sequence.
- Add one server channel delivery per halt/stage/revision, atomically with lifecycle
  decisions. Repeat polls cannot enqueue duplicates. Do not backfill old alerts on activation.
- Queue claims serialize the channel, expire after two minutes, recover abandoned
  claims after 30 seconds, and compare attempt ownership before completion. All
  network work happens outside database transactions. Retry uses the same enforced
  Discord nonce, within the short freshness window. Save the returned message ID.
- Respect Discord 429 retry timing and successful-response bucket cooldowns across
  scheduler invocations. Retain cooldowns even when their original alert expires.
- Validate the channel belongs to the configured TradersLink guild and is a text
  or announcement channel before posting. Disable all mentions. Token and provider
  responses stay private; operational logs contain bounded failure codes only.
- Run the Discord and PWA delivery branches independently in the existing protected
  one-minute halt scheduler. Discord transport/configuration failure cannot suppress
  PWA delivery, and a PWA configuration failure does not prevent queued Discord delivery.

## Source and migration

- Coordinator assigned existing `cdb0` checkout, branch
  `codex/halt-discord-channel-20260924`, clean parent
  `a5f74b49076e82b2c9a7a45ef871df8f1574adbb`.
- Exclusive reservation: `0140_news_market_halt_discord_deliveries`, execution order
  140, after `0139_platform_premium_swing_idea_visit_events`. One additive table and
  two indexes; no user/Journal data or credential storage. Manifest registers the
  table. Previous 125 identities remain intact; expected new count is 126.
- Normalized SQL SHA-256:
  `0b439e613c7259749de8422b2e66f22fc53a8469b98d5913c97178fcb25d0c0a`.
- Coordinator owns backup, migration, integration, Railway configuration and release.
  Schema-compatible rollback retains the applied 0140 identity/table; disabling
  `DISCORD_HALT_ALERT_CHANNEL_ID` stops new channel deliveries without deleting receipts.

## Configuration and activation evidence

- New `DISCORD_HALT_ALERT_CHANNEL_ID`: owner-specified target channel.
- Reuse server-only `DISCORD_BOT_TOKEN` and existing `DISCORD_GUILD_ID` resolution.
  The bot must have View Channel and Send Messages in this private channel.
- Coordinator validates guild/channel/access, activates the target after the guarded
  migration, then checks deployment/source/schema/health and protected cron `discord`
  counters. Real message ID/channel evidence remains separate from a healthy deploy.
- No fake market halt or historical replay is needed to turn on the live stream.

## Verification

- [x] Reviewed official Discord Create Message nonce semantics and rate limits:
  [message API](https://docs.discord.com/developers/resources/message#create-message),
  [rate limits](https://docs.discord.com/developers/topics/rate-limits).
- [x] Reviewed existing Help Center Halt Alerts guide. No public Help change for this
  owner-private channel trial; personal Push setup remains accurate. Revisit before
  advertising Discord channel access to members.
- [x] Focused TypeScript passed for delivery/configuration/repository, changed cron,
  migration manifest and authored regression cases, including imported dependencies.
  Used the existing canonical dependency installation through an ignored check-only
  configuration; no dependency installation or production configuration changes.
- [x] `git diff --check`, exact delta review and normalized migration checksum.
- [x] Authored regression cases for no-phone-subscriber channel delivery, repeated
  poll deduplication/later-halt suppression, ordered claim recovery, stale-claim
  completion, stale expiry, persisted cooldown, uncertain POST nonce reuse and wrong
  guild rejection. Cases are type-checked but unexecuted under the owner no-test-run rule.
- [ ] Coordinator deployment, migration, channel access and activation.
- [ ] Real qualifying halt message confirmed in the selected channel.

No test runner, broad suite, local build or local server is run by this feature task.

## Coordinator access preflight, 2026-09-24

- Implementation candidate: `255ed6b860a138bd70a573f7dcf3eeeb31522a96`, 13-file delta
  from the assigned `a5f74b49` parent. Production approval remains valid.
- At 14:08:39 UTC the production bot's channel read returned HTTP 403. At 14:09:32 UTC
  its identity authenticated with HTTP 200, but guild access returned Unknown Guild.
- At 14:11:03 UTC the Coordinator verified application/bot ID `1540380904705495090`,
  name **TradersLink Platform**, and a successful accessible-guilds response with
  zero entries. The configured bot is not installed in any server.
- Required owner action: install that existing bot in TradersLink, then explicitly
  allow View Channel and Send Messages on the selected private channel. No shared
  token replacement or guild change is required.
- Coordinator has not changed production settings, migrated, deployed or posted a
  test message. Resume the already-approved guarded release and activation when the
  bot is installed and access is verified. Healthy production remains unchanged.

## Channel access and schema-compatible fallback, 2026-09-24

- Coordinator verified installation after owner authorization. At 14:29:03 UTC,
  channel `1552678787676774490` (`halt-alerts`, text channel) passed View Channel
  and Send Messages for the exact existing TradersLink Platform bot. Administrator
  access is false; the channel remains private. No message was sent by this check.
- Coordinator took the serialized release slot and requested a schema-compatible
  fallback artifact before applying 0140. Local commit
  `23058580810ba79f6ef8f838a458473fc4f3bbe9` has exact parent
  `a5f74b49076e82b2c9a7a45ef871df8f1574adbb` and only two changed files:
  `src/modules/news/server/database/migrations/0140_news_market_halt_discord_deliveries.ts`
  and `src/modules/platform/server/database/platform-migration-manifest.ts`.
- Both blobs exactly match reviewed feature commit `255ed6b8`; every other file
  matches the production parent. The migration identity, SQL checksum and managed
  table registration remain available after 0140 while all application behavior
  stays at the prior release. Plain `a5f74b49` is not a valid schema rollback after
  0140: its strict migration manifest does not recognize the new identity/table.
- Artifact is retained at local ref `refs/codex/halt-discord-schema-fallback-20260924`.
  Built through an isolated index without changing the active branch, feature
  commits or checkout. Exact two-file allowlist, blob equality, SQL checksum and
  diff whitespace checks passed. No tests, build, database or hosted actions ran.
- This is static fallback packaging, not runtime startup proof or production
  deployment evidence. Coordinator must verify the deployed schema/health and use
  the current release parent for any published recovery; never force-push this
  old-parent artifact. Actual channel message evidence remains pending.

## Backup size prerequisite and revised carrier, 2026-09-24

- Before hosted mutation, the Coordinator identified a 2,349,572,096-byte database
  on Node 24.21.0. The existing whole-file `readFileSync` in the backup checksum
  helper exceeds Node's synchronous whole-file read limit, so the original carrier
  must not be used for this migration attempt.
- Requested strictly technical repair commit
  `21cde3f171829b81e32fd64ce9e3f67612ce86d1`, exact parent `a5f74b49`, changes only
  `src/modules/platform/server/database/platform-database-backup.ts`. SHA-256 now
  uses a single 1 MiB buffer, synchronous read-only open/read calls until EOF, only
  the bytes actually read, and descriptor closure in `finally`. No exported API,
  digest format, error wrapper, database, restore or evidence contract changes.
- Updated schema carrier `7b899383bd6510767abf71b40cdb4df575656e5d` is parented
  directly to that repair and adds only the exact reviewed 0140 migration and
  manifest blobs. Its cumulative delta from production is three files. The SQL
  checksum is unchanged. It supersedes `23058580` for this release sequence;
  the old artifact remains preserved, not deployed or deleted.
- Both new artifacts are retained at `refs/codex/halt-backup-chunked-sha256-20260924`
  and `refs/codex/halt-discord-schema-carrier-v2-20260924`. Feature `255ed6b8` and
  its documentation lineage remain intact. The local working-file edit used for
  focused checking was returned to that unchanged feature lineage after the repair
  was preserved in Git; the repair is delivered through its dedicated commit.
- Focused `tsc --noEmit` on the repaired backup file and transitive imports passed
  before packaging; exact parent/allowlist, diff and migration blob equality checks
  passed. No tests, full build, large-file runtime experiment or hosted action ran.
  Sequential reads, partial final chunks, empty files and guaranteed closure were
  source-reviewed, not claimed as executed runtime tests.
- Coordinator will release backup-only repair, then guarded carrier, then the
  unchanged halt feature. Preserve the backup repair when integrating that feature;
  never replace the new production tree with the feature's old whole-tree snapshot.
  Real large-file backup/restore, schema migration, carrier startup and feature
  activation evidence remain Coordinator-owned and outstanding.

## Original release closure, 2026-09-24

- Coordinator released feature `bf6de9e622fe693d934876de636bf5147a145777`, Railway
  `58e75503-6bba-452b-a633-f7801a4e6927` SUCCESS. Schema 126, original volume,
  absent maintenance controls and healthy application were independently verified.
- Real EZGO initial alert delivered on attempt one at 15:17:11.695 UTC, Discord
  message `1552700434865717280`. This proves that delivery, not every later stage.
- Owner confirmed the channel's later `@everyone` visibility was intentional;
  do not revert its permissions. Earlier private-trial references are historical.

## WZRD resumption-update correction, 2026-09-24

- Owner explicitly requested correction after read-only diagnosis. Production
  source was `8bea441d5b20fb6145ecde42521101ea56bfc5d2`, schema 126. Relevant
  lifecycle, parser and Discord transport blobs match the assigned feature checkout.
- Coordinator confirmed exact repair parent
  `acf7fc6166842dc3d4b86dac2d0d65c24f301dd8` after the separate scanner release
  completed. Package only this four-file correction on that parent through an
  isolated Git index; do not inherit the old feature branch's release ancestry.
- WZRD initial halt was 12:41:37.646 ET. Production stored both quote/trade times
  as 12:46:37 but ended the sequence at 12:48:12.781 ET with both last-notified
  times null and both revisions zero. Discord had one delivered initial alert;
  PWA had three delivered initial rows and no quote/trade rows. Those PWA rows are
  server-delivery evidence, not independent device-receipt proof.
- Natural polls remained successful with Nasdaq HTTP 200. Official RSS retrieved
  at 17:14:05.290 UTC showed accepted code M and the same times. Exact first feed
  publication time cannot be reconstructed from the stored row and is not claimed.
- Cause: the existing shared lifecycle closed on reached trade time before checking
  for previously unnotified times. This discarded the update before either queue.
- Correction: compute and enqueue factual quote/trade changes, update their
  stage/revision markers, then apply silent closure in the same reconciliation.
  Both transports retain their existing shared transaction and delivery behavior.
  No initial eligibility, parser, channel, notification copy, schema or transport
  changes. First-halt/day, deduplication, silent closure and two-minute delivery
  freshness remain intact; already-ended historical sequences are never reopened.
- Added regression source for the WZRD boundary at and after trade time, one
  combined update to both transports, repeated-poll/later-halt silence, a missing
  trade time after an earlier quote update, revised trade-time closure without
  historical replay, and a delay to a future time keeping the sequence open.
  Existing future-time and unchanged-time closure cases remain.
- Focused TypeScript for changed source, regression source and imports passed.
  No test runner, full build, local database, manual cron or hosted mutation ran.
  Runtime regression execution is not claimed under the owner's no-test-run rule.
- Reviewed Help Center Halt Alerts guide: existing factual timing descriptions
  remain accurate; no public copy or UI change is required for this correction.
- Coordinator owns final exact-parent packaging review, publication, Railway
  deployment, health and real subsequent resumption-stage verification. No migration
  is needed. WZRD's already-ended historical sequence is not replayed by this fix.
