# Discord halt alerts

Status: implementation and focused static verification complete; approved release
blocked on owner installing the existing bot in Discord and granting channel access.

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
