# Discord Notification Members

Owner approved the layout, complete member inventory, 20-row pagination, any/all multi-role filtering and Premium Member column on 2026-10-10.

## Scope and implementation

- Local route: `/admin/journal/discord-notifications`, linked from the existing admin sidebar and protected by its owner authorization plus `read_user_details`.
- Display every Discord member holding any of the seven exact configured role IDs, including members without a Platform account. Discord username, server display name, selected roles and current Premium Members role presence are shown. A current role does not establish how it was assigned or prove payment.
- Traverse List Guild Members with 1,000-member API pages until exhaustion; then filter and paginate 20 rows. No arbitrary total cap. A timeout, permission error, malformed response or stalled cursor discards the entire partial result and shows unavailable, never an empty or complete-looking partial list.
- Fetch on each request/refresh with no persistent member storage or public cache. Stable username/ID ordering; page clamping; filters preserved in Previous/Next/Refresh links. Discord membership may change between reads; this is a current read, not an atomic historical snapshot.
- Premium Members resolves by an explicitly configured `TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID`, or by a unique exact Premium Members role name. Ambiguous/missing evidence blocks the list. No Whop entitlement or paid-channel mutation.
- UI shows real data only. Missing configuration and no matches have distinct states. No sample rows are represented as members.

## Configuration audit

Read-only Railway metadata identified `app.traderslink.pro` on production service `traderlink-platform-web-restore-0909` in TraderLink Platform. Presence-only inspection confirms DISCORD_BOT_TOKEN exists; application/key/guild/channel/role/panel selector variables are absent and the selector enable gate is absent/off. No variables were saved or changed.

Authenticated GET `/users/@me` succeeds and identifies the expected bot/application `1540380904705495090`. GET roles for guild `1433570740430573642` returns HTTP 403. Actual guild access must be resolved before claiming the directory can load. No credential, member data or provider error body was logged. Premium role ID remains unconfirmed.

Discord's official List Guild Members contract requires GUILD_MEMBERS privileged intent. Last Portal audit has Server Members Intent off. Enabling it is a separate owner-controlled permission change; no Portal change was made. The selector's role-update flow and the directory are separate; reading the directory does not enable the selector.

## Acceptance boundary

- Local implementation complete; owner browser review and live member/pagination acceptance pending.
- Focused ESLint and scoped TypeScript no-emit checks pass for the page/service and their imports. Scoped whitespace check passes. No test suite or production build was run, per owner instructions.
- No tests, production build, server start, Git commit/push, deployment, panel post, activation, role assignment or channel-permission change.
- Help guide reviewed; member privacy wording updated to explain owner visibility of Discord role subscriptions.
- Explicit files: new page and member-directory service, one sidebar link, one Help paragraph, this progress file and controlling plan/progress links. Shared unrelated edits preserved.

Reference: [Discord List Guild Members](https://github.com/discord/discord-api-docs/blob/main/developers/resources/guild.mdx).

## Access diagnosis correction

Read-only GET `/users/@me/guilds` confirms the configured Platform bot belongs to TradersLink (`1433570740430573642`). The roles and own-member requests return HTTP 403 with Discord code 40333, officially a Cloudflare request block, not missing guild permissions. The earlier HTTP-status-only diagnosis was insufficient; do not reinstall the bot or widen permissions to address this result. Network/API read verification remains blocked. Server Members Intent is still off in the Portal. The exact setting was prepared for browser action-time confirmation; no permission change has been saved.

## Server Members Intent saved

On 2026-10-10, after the owner's explicit action-time confirmation, enabled Server Members Intent for TradersLink Platform application `1540380904705495090` and clicked Save Changes. The Portal confirmed “Bot successfully updated!” and the saved switch is on. Presence Intent and Message Content Intent remain off. This supersedes the earlier off-state audit above. No channel permissions, Whop access, hosted configuration, deployment, panel post or selector activation changed. Live member-list verification remains pending after the earlier Cloudflare request block.

## User-Agent correction and complete read verification

Owner authorized the request-header correction on 2026-10-10. Both local Discord REST clients now send the shared documented identity `DiscordBot (https://traderslink.pro, 1.0.0)`; the directory also explicitly sends JSON Content-Type. An authenticated read-only PowerShell request with that identity succeeded for roles and members, superseding the earlier Cloudflare blocker: 659 members returned in the first 1,000-limit page, proving exhaustion for this scan; all seven configured notification IDs exist with zero role permissions; zero members currently hold those notification roles. Exactly one Premium Members role exists, ID `1433600517463871773`. No names/member IDs or token logged. This verifies live API retrieval, not browser acceptance or deployed source behavior. No hosted configuration, role assignment, channel access, selector activation or deployment changed.

## Requested real-data page review: local runtime blocker

Owner requested live-data page QA and display, without deployment/activation. Canonical main checkout has no listener on 3010. Attempted the existing loopback-only dev:review runner on 3010 with no background workers; selector disabled and token injected only into process memory. Startup failed with platform_local_configuration_invalid because the configured sibling private-data root does not exist (including the development database and journal authority files). No replacement database was created and admin authentication was not bypassed. Requested the current local file location from owner. No page screenshot/browser QA can be claimed.

Independent fresh read-only Discord scan confirms 659 members, exhaustion, unique Premium Members role, and zero members holding each of the seven notification roles. The real page should therefore show its empty state; populated rows, premium display, filtering and pagination runtime acceptance remain pending. No preview process survived the failed startup. #notifications privacy, Whop access, hosted configuration and selector activation remain unchanged.

## Development file discovery

After owner reported not knowing where the files moved, filename-only search located the development database and authority document under `C:\Users\jerac\Documents\backups\private-data`. The database is 114,667,520 bytes with filesystem modification time 2026-08-23; authority document is present, along with evidence/config/staging folders. This is a backup location, not proof of a current active database or a complete validated restore. Search excluded directories marked DO NOT OPEN and did not inspect credential contents. No files restored, copied, modified or used for runtime. Preview acceptance remains pending safe recovery of local configuration; production and Discord state unchanged.

## Complete selector candidate — 2026-10-11

Owner approved the phone-alert post and twelve selectable roles. Complete signed interaction handler, request validation, REST mutation adapter and panel CLI are included; activation remains default-off. All thirteen configured/admin roles remain, including day trade; selection validation, Save, Clear and verification touch only the twelve selectable roles. Legacy seven-key mapping for this TradersLink guild is expanded using the six verified tool-role IDs; explicit thirteen-key maps remain authoritative. No hosted variables, migration, channel visibility, member roles, panel or test messages changed. Coordinator owns release and private-channel publication; owner alone opens the channel. Help is updated using only the new Discord-role guide, preserving existing production guidance.
