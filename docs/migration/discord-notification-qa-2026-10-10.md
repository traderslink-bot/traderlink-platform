# Discord notification QA - 2026-10-10

Source review and focused static checks pass. Live acceptance remains incomplete. Owner confirmed opt-in subscriptions; no automatic assignment is included.

## Reviewed

- Complete seven-role catalog, public panel, private selector, current-role defaults, Save, clear/save, expiry, overlap and replay handling.
- Signed raw-body authentication, timestamp/body bounds, application/guild/channel/panel checks and signed member identity.
- Default-off gate and checks before writes; dedicated per-role updates preserve unrelated paid/staff roles. Permission/hierarchy/overwrite safety checks precede updates. Partial failures never claim success.
- Owner-authorized directory: full cursor scan until exhaustion, no arbitrary total cap, 20-row pagination, any/all role filters, page clamping, stable ordering and Premium Members role column. Failed scans discard partial lists. Role assignment does not prove selector usage or payment.
- Help guide covers Save, clear/save, privacy and Discord notification suppression. Panel CLI defaults to offline preview and requires explicit approved publishing arguments.

## Verification

- Focused ESLint passes for selector modules, interaction route, directory page and panel CLI.
- Scoped TypeScript no-emit passes for the complete source slice and imports, including Help. Scoped tracked whitespace check passes; untracked source reviewed directly.
- Read-only hosted check: bot token exists; application/key/guild/channel/role/panel configuration remains absent and enable flag remains off.
- Member-list request after intent enablement still returns HTTP 403, Discord code 40333 (Cloudflare request block). No token/member data logged.
- Previous Portal save proof confirms Server Members Intent on; other privileged intents remain off.

## Pending launch acceptance

- Restore API availability and verify full member scan and Premium Members role identity.
- Hosted configuration and interaction endpoint, panel publication/message ID and activation require separate approval.
- Earlier UI audit found all seven roles unmentionable for ordinary members. Member entry/exit/watching pings need an approved mention policy; subscribing does not require mentionability.
- Owner approval to expose #notifications and live Discord rendering/privacy/save/clear/role-preservation and directory/pagination browser acceptance.

No tests, production build, server start, role assignments, permissions/hosted variables/endpoint changes, deployment, commit or push in this QA pass. #notifications remains private; Whop continues controlling paid access.

## Follow-up: request identification corrected

Owner-approved User-Agent fix adds `http-client.ts` and updates the two REST callers. Documented DiscordBot identification resolves the local verification block: complete 659-member scan and seven zero-permission notification roles verified, zero members currently subscribed, one Premium Members role identified. Earlier Cloudflare blocker above is historical. Live selector/browser QA and hosted setup remain pending. No server or hosted mutations.
