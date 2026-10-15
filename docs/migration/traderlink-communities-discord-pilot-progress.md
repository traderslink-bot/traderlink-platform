# TraderLink Communities Discord Pilot Progress

**Status:** Active — functional integration and private first-server testing

**Plan:** [TraderLink Communities Partner Platform Plan](traderlink-communities-partner-platform-plan.md)

**Started:** 2026-09-06

## Owner-approved product decisions

- Communities is part of the current TraderLink application. Real routes use
  the existing dashboard shell, top navigation, theme and responsive frame.
- A regular trader keeps the complete normal dashboard navigation. Community
  Watchlists remain available when applicable, while coaching navigation is
  added only when the trader has an eligible community coaching relationship.
- A server owner, coach or delegated staff member receives role-appropriate
  Communities navigation. These links may later become owner-configurable, but
  the first pilot derives them from explicit Communities capabilities.
- TraderLink owner administration belongs inside the existing
  `/admin/journal` administration experience. The owner must not maintain a
  second unrelated global administration dashboard.
- The first real Discord pilot uses only the owner's server. Every current
  member of that onboarded server (`@everyone` in product terms) receives the
  non-configurable TraderLink admission baseline: the regular dashboard,
  Journal and member-owned Community Watchlists. The four dedicated test roles
  control only server-owned features and responsibilities.
- Discord roles are the sole entitlement source for server-owned Community,
  alert and coaching access and responsibilities. TraderLink verifies current
  server membership and roles, then maps each existing Discord role to one or
  more TraderLink features and responsibility levels. TraderLink must not
  create a second member-access system, sell access, or let an operator bypass
  the server owner's Discord role assignments.
- If a production-only test is necessary, access is limited to the three owner
  test identities currently known by the display labels `This guys`,
  `traderslink` and `bullrun`. Enforcement must use resolved immutable
  Platform-user and Discord-user identifiers, never mutable display names.
- Current page composition is approved. Dark mode must remove light page gaps,
  and status labels/tags should use meaningful green, red, orange and other
  accent colors instead of defaulting to dark grey.
- The existing Live Watchlist used by TraderLink for its Discord server and
  exposed through the ordinary dashboard is not Community Watchlists and is
  not coaching content. Communities may use only deliberately shared
  member-created Community Watchlists; coaching must not read, publish or
  relabel the existing Live Watchlist.
- Watchlists inside Communities have two additional, distinct ownership modes:
  server watchlists and member Community Watchlists. A server watchlist is
  authored by the owner or authorized analysts on behalf of that Discord
  community, appears on a page under that private community, and is readable
  only by members whose current Discord roles grant that server's Watchlist
  feature. A member Community Watchlist remains owned by the individual member
  and may be deliberately shared into eligible communities for engagement.
- Server watchlists are private by default. The server owner may later opt a
  specific watchlist into public TraderLink discovery; neither creating a
  watchlist nor enabling future network participation makes all server
  watchlists public.
- The owner chooses the Discord destination for each content workflow. Server
  watchlists may go to a dedicated watchlist channel, a shared analyst channel,
  the alert channel or another channel the owner selected. TraderLink must not
  assume every Discord server uses the same channel structure.

## Functional pilot order

### Pilot 1 — shell, navigation and private visibility

- [ ] Mount every real Communities route inside the current TraderLink shell.
- [ ] Add capability-derived Communities navigation for owners, coaches and
  delegated staff.
- [ ] Add coaching navigation to the ordinary trader dashboard only for an
  eligible coaching member.
- [ ] Add Communities administration to the `/admin/journal` navigation and
  retire the separate global-admin entry point through a safe redirect.
- [ ] Add a server-side pilot gate supporting one configured Discord guild;
  verified membership in that guild admits the member to TraderLink without an
  owner-selected admission role.
- [ ] Replace custom-first TraderLink role construction with a simple mapping
  flow: select an existing Discord role, then select one or more Community,
  Alerts, Coaching or Community Admin responsibilities. Advanced custom
  capability editing remains deferred.
- [x] Keep navigation hiding and route authorization aligned; a hidden link is
  never the security boundary.

### Pilot 2 — real Discord connection

- [ ] Install the TraderLink Discord application in the owner's test server.
- [ ] Complete owner OAuth and record current guild ownership evidence.
- [ ] Import the server and its selectable roles/channels. Confirm every
  verified server member receives general TraderLink access while no server
  alert, server watchlist or coaching access is inferred from `@everyone` or
  Premium.
- [ ] Map the new dedicated pilot role and verify membership/role refresh with
  the owner's test Discord accounts.
- [ ] Verify removal of the pilot role removes access after the allowed
  freshness window.

### Pilot 3 — usable community content

- [ ] Create, publish, edit/archive and open a server alert.
- [ ] Publish a member-owned Community Watchlist into the private server space.
- [ ] Create a server-owned watchlist as the owner or an authorized analyst,
  display it on the server's private TraderLink community page, and keep its
  ownership distinct from member Community Watchlists and the official Live
  Watchlist.
- [ ] Let the owner select the Discord destination for a server-watchlist post
  and send a concise message linking to its exact TraderLink page.
- [ ] Prove server watchlists are private by default and that only an explicit
  owner-controlled public-share action can make one eligible for future public
  discovery.
- [ ] Deliver both objects to the owner-selected Discord channels with an
  `Open in TraderLink` link and idempotent retry handling.
- [ ] Verify unauthorized roles and other communities cannot open either page.
- [ ] Verify owner analytics record the named test-account visits correctly.

### Pilot 4 — coaching workspace

- [ ] Create a coach profile, coach-created plan, capacity and Discord-role
  audience.
- [ ] Request, accept, decline and end a coaching relationship.
- [ ] Give coached traders a normal-dashboard Coaching entry containing plan,
  coach, relationship status, shared-data controls and coaching activity.
- [ ] Give coaches a capability-derived workspace containing roster, capacity,
  requests, student status and only explicitly granted Journal views.
- [ ] Verify no Journal access before consent, exact selected-account scope,
  immediate revocation and no cross-student/account leakage.
- [ ] Keep coaching payment, refunds and paid-role assignment outside
  TraderLink during this pilot.

### Pilot 5 — visual and operational completion

- [ ] Remove all Light-background gaps in Dark mode across Communities routes.
- [ ] Apply semantic accent colors to statuses, tags and important labels in
  both themes without reducing contrast.
- [ ] Verify desktop and mobile Light/Dark states in the real shared shell.
- [ ] Record Discord install scopes, permissions, role/channel evidence,
  delivery receipts and cleanup/revocation steps without exposing secrets.
- [ ] Obtain owner acceptance before expanding beyond the pilot identities or
  publishing Communities to ordinary server members.

## External inputs needed at activation

The code and staging configuration can be prepared before these values exist.
Activation requires the owner-selected Discord server, the newly created pilot
role and the test accounts to appear through Discord OAuth. TraderLink will
capture their immutable IDs; the owner does not need to paste secrets or bot
tokens into chat.

### Owner-provided pilot mapping — 2026-09-06

| Purpose | Discord role |
| --- | --- |
| General access test marker (not mapped; `@everyone` is automatic) | `test-community` |
| Coaching access | `test-coach-community` |
| Alerts access | `test-alerts-community` |
| Server watchlist access | `test-watchlist-community` |

| Delivery type | Discord channel ID |
| --- | --- |
| Coaching | `1546033844468187156` |
| Alerts | `1546033958448529508` |
| Watchlists | `1546034056725008385` |

The coaching channel remains part of the pilot so coaching-plan delivery can
be tested; it can be disabled later without changing coaching access. Role IDs
will be resolved from Discord by the authenticated setup flow. The supplied
long numeric values are channel IDs and must not be mistaken for role IDs.

The owner reports that Railway already contains configuration for the
TradersLink Discord server, at least one owner/admin Discord identity (believed
to be the account displayed as `Traderslink`), and an installed Discord
application created in the Discord Developer Portal. Presence, environment,
callback origin and required bot permissions must be verified without exposing
secret values before reuse.

### Read-only Railway inventory — 2026-09-06

- [x] Staging has the Discord OAuth client ID, client secret and a staging-only
  redirect URI.
- [x] Production and staging use the same Discord application credentials but
  distinct callback origins.
- [x] Staging OAuth login generates
  `https://traderlink-platform-staging-staging.up.railway.app/api/auth/discord/callback`.
- [ ] Confirm that exact staging URI is registered in the Discord Developer
  Portal OAuth redirect list.
- [ ] Staging still needs the Communities bot-token variable, a staging public
  origin and its own cron authorization secret before Discord delivery can run.
- [ ] The existing production bot token uses a legacy variable name; it must
  not be silently assumed to configure the Communities delivery worker.
- [x] Resolve the immutable guild ID and the four Discord role IDs. Role names
  alone are not sufficient for authorization mappings.
- [x] Both Railway environments were healthy during the inventory and neither
  had an in-flight deployment. No setting, database or deployment was changed.

## Current safety boundary

- Staging is the default pilot environment.
- Production is not a fallback for ordinary debugging.
- No display-name authorization is permitted.
- Verified membership in the pilot server activates general TraderLink access;
  neither `@everyone` nor the existing Premium role automatically activates
  server alerts, server watchlists, coaching or staff responsibilities.
- No live coaching payment or partner percentage is activated.
- Production expansion requires a separate owner decision after test-account
  acceptance.

## Implementation checkpoint — Discord authority and server watchlists

Source implementation now establishes these pilot contracts:

- verified guild membership grants the non-configurable `community.view` and
  member-owned Community Watchlist sharing baseline, in addition to admission
  to the regular TraderLink dashboard and Journal;
- the membership baseline grants no server-owned Alerts, Server Watchlists,
  Coaching or staff capability;
- current Discord-role evidence is the sole authority for Community,
  Alerts, Server Watchlists and Coaching access/responsibilities;
- owners map an existing Discord role to fixed TraderLink responsibilities,
  and remapping replaces its prior feature set rather than adding a parallel
  member grant;
- removing a mapped Discord role immediately removes the derived server-feature
  capabilities on the next verified membership read without removing the
  member's general TraderLink baseline;
- direct feature routes enforce the same permissions used to hide navigation;
- onboarding is limited to pilot guild `1433570740430573642`;
- server-owned watchlists use dedicated private-by-default storage and remain
  distinct from member-owned Community Watchlists and the official Live
  Watchlist; and
- the schema contains a dormant owner-controlled network opt-in setting for
  the later cross-community phase without publishing pilot content.

The focused disposable-database verifier passes with 20 capability catalog
entries, 17 Communities tables, Discord-role revocation, community isolation,
server-watchlist privacy, Journal-grant revocation, named activity isolation,
foreign-key integrity and Tier 2 event idempotency.
