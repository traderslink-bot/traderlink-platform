# Discord notification selector release

Parent: `929c45e84d55334affcdc4c02228fc862a75c43c`. Owner approved wording/post, twelve selectable roles and coordinator release. No migrations or dependencies.

All thirteen role keys remain in catalog/config/admin. The selector excludes day_trade; Save/Clear never mutate it. For guild 1433570740430573642 only, the existing complete seven-key configuration is supplemented with the six verified tool-role IDs. Invalid/partial maps fail closed; explicit thirteen-key maps are preserved. Other guilds require full mapping.

Deploy with TRADERLINK_DISCORD_NOTIFICATION_ROLES_ENABLED=false and keep #notifications private. After coordinator release and owner-approved publication, use the protected server environment with `tsx src/scripts/manage-discord-notification-role-panel.ts --publish --owner-approved-server-change` (or --update with an existing configured message ID). CLI does not load environment files; never pass secrets as arguments. Suppress all mentions. Verify no existing panel before retrying an uncertain publication. Record panel ID through approved configuration only.

Activation remains a separate owner boundary: the HTTP route returns 503 while disabled, including Discord portal PING. Do not set the Developer Portal interactions URL while disabled and expect validation. After explicit activation approval, verify transport compatibility, enable gate and validate signed PING at https://app.traderslink.pro/api/discord/interactions, with the correct public key. Member actions also require the exact configured panel ID. Owner opens channel independently. No test pings or role assignments are authorized by source release.

Static checks and immutable candidate evidence are stored in this handoff directory. Coordinator must prove exact release parent, allowlist, deployment and health. Static checks do not establish real member interaction acceptance.
