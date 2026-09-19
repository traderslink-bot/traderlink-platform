# Watchlist Discord mentions

2026-09-18. Owner approved implementation and release through Visible release
coordinator. Separate PWA recovery is excluded.

## Accepted scope

- Main Watchlist Admin section link: **Discord notifications**.
- Independent **Mention @everyone** checkbox.
- Editable role label and Discord role ID, enabled checkbox, Add role, Remove
  role, Save mentions. Removing here never deletes a Discord server role.
- Applies to future Watchlist Discord announcements and analysis updates for
  which the owner chooses Notify users. Email/push, links/images and approval
  behavior remain unchanged.
- Missing settings use the previous everyone + configured Premium role audience.
  Explicit all-off and empty roles persist; no fallback reenables removed roles.
- Settings are owner-only behind existing Platform mutation and runtime bearer/
  owner-actor authorization. Store in canonical runtime durable directory as
  `watchlist-discord-mentions.json`; no database migration or new secret needed.
- Freeze audience alongside approved Discord content; retries preserve the
  original approved audience. Existing approved posts without audience metadata
  remain silent mentions. No replay or retroactive edit of old posts.
- Role labels render as text and never become message markup. Allowed mentions
  authorize only selected role IDs/everyone, not arbitrary user mentions.
- Unreadable configuration is visible in Admin; posting can proceed without
  mentions, rather than blocking the owner or enabling an unintended audience.

## Progress and QA

Implementation complete locally. Five focused mention tests passed, including
six bot/webhook payload combinations with images. Sixteen existing review API
and preview tests passed. No live message, provider call, server, hosted settings
change or deploy was performed. Final hosted build/visual check belongs to release.

The simulated browser check also passed load, section visibility, main/wrapper
navigation, everyone toggle, add/remove role and authenticated Save. One focused
manager activation/approval/repeated-approval integration passed, using the
existing links-only fallback when local image rendering is unavailable. Targeted
Platform ESLint passed. Runtime source parent for the slice is `190b921c`;
canonical checkout HEAD remains `c54c8cd1` with preserved unrelated dirty work.
Next.js guidance kept the main wrapper and runtime section routing aligned.

Discord delivery still respects role/channel permissions and member notification
preferences. Mock payload verification is not proof of a member receiving a ping.
Reference: https://docs.discord.com/developers/resources/message#allowed-mentions-object

Coordinator handoff must use narrow commits, preserve newer shared files and
report exact published SHA, Railway deployment and health results.
