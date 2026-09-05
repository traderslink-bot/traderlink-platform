# TraderLink Communities Partner Platform Plan

**Status:** Planning contract and route family approved for the foundation;
four visual contracts remain open for detailed owner review. Communities 1
foundation code is assembled under its separate progress record. No live
Discord installation, payment operation, deployment or production change is
authorized by this document.

**Progress record:** [TraderLink Communities Partner Platform Progress](traderlink-communities-partner-platform-progress.md)

**Active implementation record:** [Communities 1 Identity And Permissions Progress](traderlink-communities-1-identity-permissions-progress.md)

**Current visuals:** [TraderLink Communities Administration Mockup](traderlink-communities-administration-mockup.html),
[TraderLink Server Owner Dashboard Mockup](traderlink-server-owner-dashboard-mockup.html),
[TraderLink Community Staff Workspace Mockup](traderlink-community-staff-workspace-mockup.html),
and [TraderLink Member Community Dashboard Mockup](traderlink-member-community-dashboard-mockup.html)

**Parent plan:** [TraderLink Platform Replacement Plan](traderlink-platform-replacement-plan.md)

**Related existing products:** [Community Watchlists Plan](community-watchlists-plan.md),
[Public Identity and Hosted Transfer Plan](phase-5-slice-f6-public-identity-and-hosted-transfer-plan.md),
[Public Legal Pages and Regional Analytics Consent Plan](public-legal-pages-and-regional-analytics-consent-plan.md),
and [Product Inventory](product-inventory.md)

**Owner:** Project owner and Codex

**Prepared:** 2026-09-05

## 1. Product promise

> Bring your Discord trading community into TraderLink, give your team better
> tools, offer your own coaching, understand how members use the community,
> and earn when those members upgrade to TraderLink Tier 2.

TraderLink Communities is a partner-distribution product first. It gives
Discord trading-server owners a useful private workspace for their existing
members and gives TraderLink a lower-cost path to awareness, adoption and paid
Tier 2 conversion than relying only on search rankings or social advertising.
Every active member of an onboarded Discord server may join TraderLink through
that community. The server owner controls access to the server's own alerts,
watchlists and coaching offers, but does not choose which server members are
allowed to create a TraderLink account or use ordinary TraderLink features.

The first release does not attempt to replace Discord. Discord remains the
community's live conversation and notification surface. TraderLink provides
the durable pages, permissions, coaching workspace, member activity and
conversion reporting that Discord does not provide as one integrated trading
platform.

The longer-term direction uses singular `/community` as TraderLink's own
network where users can discover people, follow shared watchlists and, if the
product earns enough participation, mingle through ticker or stock discussion
boards and other native community features. Private Discord-backed server
spaces remain under plural `/communities`. Content moves between those layers
only through an explicit share; server-private content never becomes public by
default. The broader network is not part of the first Communities release.

## 2. Approved business model

### TraderLink Tier 2 partner revenue

- Each onboarded Discord community receives an attributable TraderLink join
  path.
- When an eligible community member becomes a paying Tier 2 member, the
  community owner may receive the partner share defined by TraderLink.
- This partner share comes from TraderLink's Tier 2 subscription relationship.
  It is separate from coaching payments.
- Exact commission percentage, qualifying payment period, refund treatment,
  multi-community attribution and payout operations must be approved before
  the Tier 2 earnings slice is implemented.

### Discord-managed paid-service access

- Coaches decide what coaching they provide, what they charge, how many
  students they accept and which available delivery units they include.
- TraderLink supplies basic offer-building choices such as weekly, monthly or
  a defined number of trade reviews. These choices organize the offer; they do
  not make TraderLink the coach or dictate the coaching method.
- Server owners and coaches sell and collect payment through the systems they
  already use at the Discord-server level. They assign the Discord roles that
  represent access to their paid services.
- TraderLink does not select a coaching payment provider for the first release,
  process coaching payments, store payment credentials, reconcile coaching
  revenue or decide refunds and disputes.
- A Discord role is the access entitlement inside TraderLink. TraderLink does
  not need to know whether the server assigned that role because of a payment,
  promotion, complimentary access or another server-controlled reason.
- The owner maps one or more verified Discord roles to each restricted alert
  area, watchlist area or coaching offer. Role names remain entirely under the
  server's control.
- TraderLink Administration may inspect mappings and role-sync health for
  support, but the TraderLink operator cannot choose or change which members or
  server roles can open a community's private content.
- When a member signs in, TraderLink verifies current server membership and
  Discord roles. The member can open only the server content and coaching areas
  allowed by those roles.
- Server owners remain free to arrange their own share of a staff coach's
  revenue outside TraderLink. TraderLink does not calculate, display or enforce
  that agreement in the first release.
- Because TraderLink is not involved in these transactions, an automatic
  percentage of coaching payments cannot be collected truthfully at launch. A
  future optional payment integration or separate commercial agreement may be
  considered later without changing the Discord-role access model.
- TraderLink does not judge whether a coach delivered the service and does not
  require a coaching-service evidence ledger.

As of 2026-09-05, payment-provider selection is removed from the first release.
Whop was researched but will not be a launch dependency. Its connected-account
Platforms API is currently documented as invite-only and is unnecessary when
Discord roles are the server-service entitlement. Whop remains a research
reference only unless the owner deliberately reconsiders payment integration:
[connected-account overview](https://docs.whop.com/manage-your-business/manage-payouts/connected-accounts).

### Partner visibility ideas under review

TraderLink gives the server's entire active membership a direct join path,
community tools, coaching infrastructure and the opportunity for the owner to
earn from eligible Tier 2 upgrades. Any future coaching-related commercial
agreement is separate and does not settle the still-undecided Discord
visibility arrangement.

One possible first-server exchange is a dedicated Discord channel visible to
the entire server:

- the owner chooses the channel name, such as `#traderlink-tools`;
- the channel contains a permanent `Open TraderLink` access message;
- TraderLink may post concise dashboard, Journal and feature updates there;
- the recommended starting cadence is no more than one product update per week;
- the owner does not have to personally write or endorse promotional claims;
  and
- coaching purchase, payment and refund instructions stay in the community's
  Discord; TraderLink may post only the owner-authorized link or access
  instructions for an offer.

This is an idea under review, not an approved requirement or finalized partner
contract. Exact post cadence, pause behavior and minimum visibility remain
subject to owner approval.

Other lower-pressure visibility options remain in the plan:

1. **Natural content attribution:** every TraderLink-generated alert,
   watchlist or coaching-profile Discord post includes a small `Open in
   TraderLink` button and TraderLink attribution. This creates visibility only
   when the community is already using the tools.
2. **Pinned access post in an existing channel:** the owner chooses an existing
   resources or tools channel for one permanent access message; no separate
   TraderLink channel or recurring promotional post is required.
3. **Discord Server Guide resource:** when the server uses Discord Community
   Onboarding, the owner can add TraderLink as a resource page visible to all
   members. Discord documents Server Guide resources as read-only channel-based
   pages within Onboarding: [Server Guide FAQ](https://support.discord.com/hc/en-us/articles/13497665141655-Server-Guide-FAQ).
4. **Member-requested command:** a `/traderlink` command returns the community's
   access link and current feature shortcuts when a member asks for them.
   Discord supports native application commands and interactive response
   components: [Interactions and Commands](https://docs.discord.com/developers/platform/interactions).
5. **Value-first community recap:** an optional periodic Discord post summarizes
   new community watchlists, alerts or other public server activity and links
   back to TraderLink. It must never expose private Journal or coaching data.
6. **Dedicated TraderLink channel:** the original all-member channel idea stays
   available for owners who prefer a permanent product home.

The leanest pilot combination is natural attribution on content posts plus one
permanent access point in an existing channel or Server Guide. The dedicated
channel and recurring feature-update cadence can remain optional until real
server-owner feedback shows they provide enough value.

## 3. Platform architecture

TraderLink remains one modular Next.js application with one stable Platform
identity and shared dashboard shell. Communities becomes a peer product module;
it is not a separate application, database or deployment.

```text
TraderLink Communities Administration
  -> Discord communities
      -> verified server owner
          -> community roles and permissions
              -> admins, analysts, coaches and other assigned staff
          -> community content
              -> alerts and watchlists
          -> coaching offers and member-approved relationships
          -> members and named community activity
          -> Tier 2 attribution and partner earnings
```

The same person may belong to several communities and may hold several roles
inside one community. A person is still one stable `platform_users` identity;
community membership and responsibilities never create another Journal owner
or copy the person's trading data.

### Module ownership

| Concern | Owner |
| --- | --- |
| Login, Discord identity, sessions and global Platform user | Platform |
| Discord community, membership, team, roles and permissions | Communities |
| Server-owner and staff alert/watchlist pages | Communities |
| Official Premium TradersLink Watchlist | Existing Watchlist module; unchanged |
| Member-created Community Watchlists | Existing Community feature; the stable Platform user remains the author and may deliberately share one list into communities they belong to |
| Community placement, Discord delivery and engagement for a member-shared watchlist | Communities, referencing the existing Community Watchlist without copying its ownership |
| Human coach profiles, offers, relationships and feedback | Coach, scoped through Communities |
| Journal accounts, executions, trades, rules and Data Decisions | Journal; unchanged |
| Trader-to-coach Journal sharing grant | Platform authorization referencing one Journal account and Coach relationship |
| Tier 2 referral attribution and earnings facts | Platform/Affiliate, attributed to a community |
| Coaching payment, refunds and any owner/coach revenue arrangement | Server owner and coach through their existing Discord-level commerce; outside TraderLink |
| Paid-service access entitlement | Communities, derived from verified Discord role mappings |
| Possible future TraderLink coaching fee | Deferred commercial concept; no first-release transaction control |
| Discord channel delivery | Communities outbox plus the authorized Discord app/bot |

No Communities repository may query another module's private tables as its
public contract. It uses published Platform, Journal, Coach, Affiliate and
notification services.

## 4. User and authority hierarchy

### TraderLink owner/operator

TraderLink Communities Administration is the global control plane. It can see
and administer every onboarded community, its owner, assigned staff, community
pages, integration status and product activity. This authority is separate
from Journal Administration and must not inherit access to a member's Journal
facts merely because the operator can administer Communities.

### Discord server owner

The verified server owner controls their community, team, roles, permissions,
content destinations, coaching participation, activity reporting and community
settings. The server owner receives every community capability by default but
cannot cross into another community. Coaching-management authority shows the
coach roster, offers, relationship counts and access-role configuration; it
does not expose a student's Journal grant or coach feedback to the owner unless
that owner is also the selected coach and the student granted that access.

### Community staff

Admins, analysts, coaches, moderators and other contributors are not fixed
exclusive account types. They are community members with one or more roles and
an exact set of capabilities assigned by the server owner or an authorized
community administrator.

### Community member

`@everyone` in an onboarded server is eligible to join that server's
TraderLink community. The owner cannot restrict basic TraderLink admission to
selected Discord roles or selected server members. Whole-server eligibility
does not include paid Tier 2 features unless the member has that entitlement.
A member can view the server content made available to them, create a personal
Community Watchlist and deliberately share it into any TraderLink community
where they are an active member. This member publishing path is available by
default and does not require the owner to assign a staff title. Membership does
not grant anyone access to that member's Journal.

### Trader-to-coach sharing

Discord membership, server ownership, staff assignment, coach status and a
paid-service role are never permission to read a trader's Journal. The trader
must approve a separate grant to one coach, one Journal account and the
selected information scope. The trader can revoke it without deleting their
Journal or the community relationship.

## 5. Permission model

TraderLink provides capabilities, while each community owner may create and
name roles that combine them. Role names are not hard-coded to `Admin`,
`Analyst` or `Coach`.

### Complete initial capability catalog

| Capability | Allows |
| --- | --- |
| `community.view` | Baseline active-member access to the server community, filtered by each content item's audience; not an owner-selected TraderLink admission grant |
| `community.manage` | Manage community identity and ordinary settings |
| `community.team.manage` | Add, remove and change staff assignments |
| `community.roles.manage` | Create roles and assign allowed capabilities |
| `community.members.view` | View the community member directory |
| `community.member_activity.view` | View named member community activity |
| `community.analytics.view` | View aggregate content and usage reporting |
| `community.discord.manage` | Connect allowed channels and delivery settings |
| `community.alerts.create` | Create and publish the person's own alerts |
| `community.alerts.manage_all` | Edit, unpublish or manage any community alert |
| `community.watchlists.share_own` | Share or remove the person's own published Community Watchlist in this community; included in ordinary member access |
| `community.watchlists.publish_staff` | Create and publish staff/owner watchlist pages presented as community content |
| `community.watchlists.manage_all` | Manage community placement and delivery for any watchlist without taking ownership of a member's underlying list |
| `community.coaching.offer` | Publish coaching offers to community members |
| `community.coaching.students` | Open the person's approved coaching relationships |
| `community.coaching.manage_all` | Manage community coaching eligibility and access-role settings |
| `community.referrals.view` | View Tier 2 referral and earnings reporting |

An owner may create `Lead Analyst`, `Swing Coach`, `Moderator` or any other
role and select capabilities from this catalog. Discord roles may be mapped to
Community roles, but Discord role names are provider facts and never become
trusted server authorization without a verified mapping stored by TraderLink.

Capability changes are additive across a person's active roles. Explicit
community suspension and Platform suspension override all role capabilities.
Every grant, removal and role change records an audit event.

### Platform eligibility is separate from community-content audience

Every active server member is eligible to join and use TraderLink. Community
audience controls apply only to the server's own content and services:

- an alert, watchlist or coaching offer may be visible to all community
  members, selected mapped Discord roles or selected individual members;
- the owner may establish defaults and an authorized author or coach may choose
  from those allowed audiences when publishing;
- removing access to one community page does not suspend the member's
  TraderLink account, Journal or access to other communities;
- content-audience membership is checked on the server and never trusted from
  a client-submitted role or member ID; and
- a paid-service Discord role uses the same audience mechanism and is refreshed
  from Discord rather than from a TraderLink payment record; and
- staff capabilities determine who can create or manage content, while audience
  rules determine which ordinary members may view it.

## 6. One permission-driven dashboard system

TraderLink must not build a separate application for every staff combination.
The shared dashboard shell resolves the current community and renders only the
modules authorized by the person's capabilities.

Examples:

- a coach-only user sees Coaching;
- an analyst-only user sees Alerts and Watchlists;
- a coach/analyst sees Coaching, Alerts and Watchlists;
- an admin without coaching access sees the assigned administration modules
  and does not see the private Coaching workspace;
- the server owner sees every community-management module; and
- the TraderLink operator sees the separate cross-community administration
  surface.

The server enforces every capability independently of whether a navigation item
is visible. Hiding a link is never authorization.

## 7. Complete screen inventory

The approved foundation route family uses plural `/communities` for Discord-server
communities and preserves singular `/community` for the existing personal
Community Watchlists product. This keeps a person's canonical watchlist URL
stable when that same list is placed into one or several Discord communities.
The owner authorized this route separation for Communities 1 on 2026-09-05;
detailed navigation placement remains part of each affected UI review.

| Route | Surface |
| --- | --- |
| `/admin/communities` | TraderLink operator administration |
| `/communities` | The signed-in person's community switcher and entry page |
| `/communities/<community-slug>` | One server's Member Community home |
| `/communities/<community-slug>/alerts` | Server-private alert feed |
| `/communities/<community-slug>/alerts/<alert-slug>` | One server alert |
| `/communities/<community-slug>/watchlists` | Staff and member-shared watchlists placed in that server |
| `/community/<user-name>/watchlists/<watchlist-name>` | Existing user-owned canonical watchlist; unchanged |
| `/communities/<community-slug>/coaches` | Server-approved coaches and offers |
| `/communities/<community-slug>/coaches/<coach-slug>` | One coach profile and available offers |
| `/communities/<community-slug>/coaching` | The member's coaching relationships and Journal-sharing controls |
| `/communities/<community-slug>/workspace` | Permission-derived Staff Workspace |
| `/communities/<community-slug>/manage` | Server Owner Dashboard |
| `/communities/<community-slug>/manage/team` | Staff assignments |
| `/communities/<community-slug>/manage/roles` | Custom roles and exact capabilities |
| `/communities/<community-slug>/manage/members` | Named membership and activity |
| `/communities/<community-slug>/manage/activity` | Community content analytics |
| `/communities/<community-slug>/manage/channels` | Discord delivery destinations |
| `/communities/<community-slug>/manage/settings` | Community connection and defaults |

The sidebar shows only surfaces available to the current person. Direct route
authorization uses the same server-derived membership and capability checks;
the route or hidden navigation item is never itself permission evidence.

### TraderLink Communities Administration

Proposed root: `/admin/communities`

| Screen | Purpose |
| --- | --- |
| Overview | Total communities, onboarding state, members, activity and Tier 2 conversion |
| Communities | Search and inspect every Discord community |
| Community detail | Owner, team, members, pages, integrations, status and recent activity |
| Server owners | Review and manage verified owner relationships |
| Staff assignments | See every admin, analyst, coach and permission set by community |
| Content | Inspect each community's alerts, watchlists and publishing state |
| Coaching | See coaches, offers, mapped Discord access roles and relationship counts without opening private Journal data |
| Activity | Cross-community usage and community-scoped named activity |
| Tier 2 partners | Attribution, qualifying subscriptions and owner earnings status |
| Integrations | Discord membership, roles, channels and delivery health without exposing secrets |
| Audit | Owner, role, permission, status and configuration changes |

### Server Owner Dashboard

| Screen | Purpose |
| --- | --- |
| Overview | Community health, members, visits, content, coaching and Tier 2 summary |
| Team | Add and remove community staff and inspect their current responsibilities |
| Roles and permissions | Create custom roles and select exact capabilities |
| Members | Named community membership and recent activity |
| Alerts | Create, manage and inspect all community alert pages |
| Watchlists | Create staff/owner watchlists and inspect member-shared watchlists, delivery and engagement |
| Coaching | Approve coaches, view offers and configure coaching eligibility and Discord access roles |
| Activity and analytics | Named visits plus aggregate content engagement |
| Tier 2 earnings | Attributed upgrades, qualifying periods and partner earnings |
| Discord channels | Select alert, watchlist and other supported delivery destinations |
| Community settings | Name, image, join path, access state and server connection |

### Staff Workspace

This workspace is composed from permissions. Its complete possible modules are:

- staff home and assigned responsibilities;
- the person's alerts, create/edit/publish and view statistics;
- the person's watchlists, create/edit/publish and view statistics;
- coaching profile, offers, capacity, students and approved trader data;
- the verified Discord access roles assigned to the person's offers;
- allowed community member/activity analytics;
- allowed Discord delivery settings; and
- allowed team/community administration.

### Member Community

| Screen | Purpose |
| --- | --- |
| Community home | Current server content and contributors |
| Alerts | Server-private published alerts |
| Alert detail | One alert page and its author-supplied content |
| Watchlists | Staff/owner watchlists plus member-created watchlists deliberately shared into the server community |
| Watchlist detail | One list and its author-supplied ticker content |
| Coaches | Coaches and active offers approved by the server owner |
| Coach detail | Coach profile, capacity, offer, required Discord role and server-managed access instructions |
| My coaching | Active coaching relationships and approved shared-data scope |
| Contributors | Staff members the owner chooses to present to members |

## 8. Community onboarding

The first-server onboarding is one guided setup:

1. The server owner signs in through the existing Platform Discord identity.
2. TraderLink displays only servers the person is authorized to connect.
3. The owner selects the server and authorizes the TraderLink Discord app/bot
   with the minimum required server permissions.
4. TraderLink verifies the server and owner/management authority; members do
   not type or trust a raw server ID.
5. The owner confirms the community name and image.
6. The owner maps Discord roles or creates TraderLink-only community roles.
7. The owner appoints the first admins, analysts and coaches.
8. The owner selects audience defaults for server alerts, watchlists and
   coaching offers; these do not change whole-server TraderLink eligibility.
9. The owner selects Discord delivery channels for alerts and watchlists and,
   if one is approved, configures the chosen TraderLink visibility option.
10. The owner previews the member join experience and sends a test delivery to
   an explicitly chosen test destination.
11. TraderLink issues the community's join link and activates eligibility for
    every verified active server member.

Onboarding must be resumable. A community remains `setup` until required
identity, permission and channel checks pass. No incomplete community is
presented as live.

## 9. Membership and community isolation

- A Platform user may belong to zero, one or several Discord communities.
- Membership is keyed to the stable Platform user and verified Discord guild;
  it is never matched by email, display name or user-supplied server ID.
- Login and bounded refresh update current Discord membership and role facts.
- Discord-role changes update access to paid server content and coaching on the
  next successful bounded refresh. TraderLink does not independently keep paid
  access active after the required role is no longer verified.
- A former member loses future access to that community when current
  membership can no longer be verified, subject to a defined temporary provider
  failure policy.
- Leaving one community does not affect the person's TraderLink account,
  Journal, Tier 2 subscription or membership in another community.
- Every Community read and command requires a server-derived Platform user,
  community and capability scope.
- No owner, staff member or member can enumerate another community through
  identifiers, URLs, APIs, analytics or Discord destinations.

## 10. Alerts and watchlists

Community owners decide which staff can create server-owned alerts and
watchlists. Regular members do not need a staff role to create their existing
personal Community Watchlists or share them into a community where they have
active membership. Authors control their content. TraderLink supplies the
page, editing, publishing, community placement, Discord destination and
engagement reporting; it does not impose an investment thesis, target,
evidence or performance-scoring format.

### Member-created watchlist engagement loop

The nearly completed Community Watchlists product remains the creation and
editing surface. Communities adds a small placement layer instead of building
a second editor:

```text
Member creates or opens their Community Watchlist
  -> selects Share to community
  -> selects one active server community they belong to
  -> the watchlist appears in that community with the member named as author
  -> the assigned Discord channel receives the exact watchlist link
  -> community visits and engagement are attributed to that placement
```

- One published watchlist may be shared into several communities when the
  author belongs to each of them.
- The canonical watchlist and its ticker content remain owned by the stable
  Platform user; sharing never copies the list or transfers ownership to a
  server owner.
- The author can remove their list from a community. Unsharing it from one
  community does not remove it from other communities or delete the watchlist.
- A server owner can remove the placement from their community and stop future
  community delivery, but cannot edit the member's research or unpublish the
  member's canonical watchlist everywhere.
- There is no forced owner preapproval step in the first pilot. Member sharing
  is available to active members by default.
- The owner maps the Discord destination used for member-shared watchlists.
- The Discord message contains a compact preview—author, watchlist title,
  symbol count and optionally a short ticker strip—plus a `View watchlist in
  TraderLink` link. The full watchlist stays on its TraderLink page.
- The link opens the exact canonical watchlist page. A signed-out eligible
  member signs in and returns to that same page rather than the dashboard home.
- When one watchlist is shared into several communities, every Discord message
  opens the same canonical list while an opaque placement reference attributes
  delivery and visits to the correct community without exposing server IDs.
- The author sees list-level views, follows and community placements. The
  server owner sees the community-scoped named and aggregate activity already
  defined by this plan.

### Required shared content behavior

- Draft, published, unpublished and archived states.
- Stable community-scoped page identity and author attribution.
- Owner-authorized create and manage-all boundaries.
- Community-member visibility by default; no public indexing in the first
  release.
- Server-selected Discord channel delivery.
- Retry-safe delivery so one publish action cannot accidentally create several
  posts.
- Visible delivery status for authorized staff.
- Edit and unpublish behavior that does not silently claim a Discord message
  changed when Discord delivery did not succeed.
- Named and aggregate view reporting scoped to the community.

### Separation from existing Watchlist products

- The official `/watchlist` remains TradersLink-owned Premium market content.
- Existing personal Community Watchlists remain owned by their stable Platform
  authors and are never automatically assigned to a Discord community.
- Server Community Watchlists are owned by the community with a named author
  or contributor.
- A member may deliberately share their canonical personal Community Watchlist
  into an active community membership. This creates a community placement and
  engagement record, not a copied watchlist or a new ownership record.

## 11. Discord delivery

- Each community stores selected Discord destinations by content type.
- The owner can allow per-post destination choice from an approved channel
  list.
- If the dedicated-channel idea is approved, the partner exchange adds one
  TraderLink visibility destination readable by the entire server, with a
  permanent access message and the separately approved product-update cadence.
- The visibility channel is for TraderLink dashboard, Journal and feature
  awareness. It does not give TraderLink authority over the server's trading
  content or coaching commerce.
- The Discord app/bot receives only the permissions required for the supported
  deliveries and membership/role checks.
- Messages may link back to the exact private TraderLink page.
- Alerts, staff watchlists and member-shared watchlists use deep links to their
  exact TraderLink pages; Discord is the notification and discovery surface,
  while TraderLink holds the full content and engagement experience.
- Delivery uses a durable outbox with retry, terminal failure and duplicate
  protection.
- Community content never uses the existing global Community Watchlists
  webhook as a cross-server shortcut.
- Removing the bot, losing a required permission or deleting a channel creates
  a visible integration problem; it never reroutes content to another channel
  or server.
- No live Discord installation, channel message or production bot change occurs
  until a separately authorized pilot step.

## 12. Coaching

### Coach and offer setup

- The owner grants `community.coaching.offer` to an eligible community member.
- The coach creates a community-scoped profile and one or more offers.
- The offer may use weekly, monthly or numbered-review delivery units, along
  with coach-authored description, price display, availability and student
  limit.
- The owner or coach selects the verified Discord role or roles that may open
  each offer's coaching workspace.
- Any price shown in TraderLink is descriptive server-provided information. The
  purchase, refund and role-assignment instructions remain in the community's
  Discord and TraderLink does not present an in-app checkout.
- A member without the required role sees that access is managed through the
  community's Discord; TraderLink does not invent a payment status or provide
  a purchase button unless a later plan explicitly approves that integration.

### Student relationship

- Only a verified member of the same community can start that community's
  coaching flow.
- Current verified Discord roles determine whether the member can open the
  coaching workspace. The server remains responsible for assigning or removing
  those roles.
- A coaching-access role does not expose Journal data automatically.
- The trader chooses the coach, Journal account, date range and allowed data
  categories.
- Coach feedback, goals and focus items remain separate from canonical Journal
  facts.
- Coaches cannot edit executions, P/L, broker evidence, Data Decisions, rules
  or other trader-authored records.
- Removal of the required Discord role pauses the member's coaching workspace
  access while preserving the trader's Journal and prior coaching records.

## 13. Member activity and analytics

The server owner wants to understand how named members use the community and
which pages and posts receive attention. This is a first-class Communities
feature, not Google Analytics reporting.

### Initial activity events

- member joined TraderLink community;
- member opened the community home;
- member opened an alert list or alert detail;
- member opened a watchlist list or watchlist detail;
- member opened a coach profile or coaching offer;
- member opened server-managed coaching-access instructions;
- staff created, published, edited, unpublished or archived content;
- Discord delivery succeeded or failed; and
- member became eligible for an attributed Tier 2 conversion.

### Owner reporting

- named member, last active time and recent community-page activity;
- visits and unique viewers by page/content;
- most-viewed alerts and watchlists;
- activity by author, coach or analyst;
- coach-profile, offer and access-instruction interest;
- joined, active and inactive member counts;
- Discord-delivery click-through where the integration can prove it;
- Tier 2 conversion and retention facts; and
- date-filtered aggregate trends.

Community activity never includes a member's Journal trades, P/L, broker facts,
AI conversations or coach-only shared data. The production Privacy Policy,
Terms and community onboarding must describe the implemented named activity
behavior before the first external server is activated. Exact event retention
and member-facing visibility remain owner decisions required before the
activity-storage migration is approved.

## 14. Tier 2 community attribution

The Tier 2 partner loop requires one deterministic server-owned attribution
record rather than browser-only marketing data.

- A community join link carries an opaque community attribution token.
- The server resolves the token and binds it to the signed-in Platform user and
  verified Discord membership.
- No Discord server ID, owner ID or commission value is trusted from client
  content.
- Existing Affiliate first-touch rules are preserved unless the owner approves
  a separate community-attribution precedence contract.
- Existing paid Tier 2 members are not retroactively presented as newly
  referred revenue without an approved rule.
- Refund, cancellation, renewal and payout status must remain distinct.
- Owner reporting must distinguish estimated, qualifying, payable and paid
  amounts; TraderLink must not label an estimate as money already paid.

Before this slice begins, the owner must decide the partner percentage,
qualifying payments, attribution precedence for members of several servers,
attribution duration, refund window and payout method.

## 15. Data model domains

Exact table and migration names are assigned only after the schema design
checkpoint. The complete logical record set is:

### Community identity and membership

- community;
- Discord guild connection and current verification;
- community member and current access state;
- server owner relationship and ownership history;
- onboarding state; and
- community status history.

### Roles and authorization

- capability catalog version;
- community-created role;
- role capability;
- member role assignment;
- Discord-role mapping; and
- immutable authorization audit event.

### Content and delivery

- community alert and version/current state;
- staff/owner community watchlist, ticker content and version/current state;
- member-watchlist community placement referencing the existing canonical
  Community Watchlist and author;
- placement state, share/unshare actor and timestamps;
- community-content audience rule with all-member, mapped-role or selected-member
  scope;
- Discord channel destination;
- TraderLink visibility-channel agreement and current delivery settings;
- publication/delivery attempt; and
- stable community page reference.

### Coaching

- community coach eligibility;
- coach profile;
- coaching offer and current capacity;
- Discord-role audience mappings for each coaching offer;
- last verified role-entitlement state and refresh time;
- student relationship;
- trader-approved data grant and revocation; and
- coach-authored feedback/focus record.

### Activity and partner revenue

- retry-safe community activity event;
- bounded member/page activity projection;
- community referral attribution;
- Tier 2 earning period/status; and
- payout/reconciliation event.

Raw Discord OAuth tokens, raw session tokens, private bot credentials, payment
credentials/details, broker identifiers and Journal facts are not Community
records.

## 16. Implementation checkpoints

The complete scope remains visible throughout; checkpoints determine order,
not a smaller hidden target list.

### Communities 0 - plan and visual contracts

1. Perfect the complete plan and record owner authorization for the foundation.
2. Approve exact routes and working terminology; review detailed navigation
   placement with each affected UI.
3. Create and iteratively owner-review the lightweight
   [TraderLink Communities Administration mockup](traderlink-communities-administration-mockup.html).
4. Create and iteratively owner-review the
   [Server Owner Dashboard mockup](traderlink-server-owner-dashboard-mockup.html).
5. Create and iteratively owner-review the permission-derived
   [Staff Workspace mockup](traderlink-community-staff-workspace-mockup.html),
   including analyst, coach, combined and admin compositions.
6. Create and iteratively owner-review the
   [Member Community dashboard mockup](traderlink-member-community-dashboard-mockup.html).
7. Record detailed owner approval or corrections before implementing each
   corresponding customer-facing UI.

**Foundation exit:** The owner approves the plan, complete screen inventory,
first routes and role/capability behavior. This foundation exit was authorized
on 2026-09-05. Each visual composition keeps its own approval gate before that
customer-facing UI is implemented.

### Communities 1 - identity, community and permission foundation

1. Define the module contracts and additive migration.
2. Implement community, owner, member, role, capability, assignment and audit
   services.
3. Extend existing Discord identity with multi-guild community membership
   without rewriting Platform or Journal ownership.
4. Make every verified active server member eligible for ordinary TraderLink
   access; do not add owner-selected Platform admission roles.
5. Prove same-user/multi-community and cross-community isolation.
6. Add no customer-facing content mutation until the permission foundation is
   accepted.

**Exit:** One verified owner can administer one isolated community, assign
custom roles and grant exact capabilities without exposing another community
or Journal data.

### Communities 2 - TraderLink Administration and onboarding

1. Implement `/admin/communities` under a dedicated TraderLink operator grant.
2. Implement resumable Discord-server onboarding.
3. Add whole-server join activation and only the TraderLink visibility option
   separately approved for the pilot, if any.
4. Add global community, owner, staff, integration and audit reads.
5. Add controlled pause/suspend/reassign actions with audit history.
6. Render and verify every applicable Light and Dark, desktop and mobile state.

**Exit:** TraderLink can create, inspect and safely control the first community
and see its owner, assignments and pages.

### Communities 3 - Server Owner Dashboard and staff composition

1. Implement owner Overview, Team, Roles and Permissions, Members, Discord
   Channels and Settings.
2. Implement one permission-derived Staff Workspace.
3. Prove coach-only, analyst-only, coach/analyst, admin-without-coaching and
   owner states.
4. Verify server enforcement independently from navigation visibility.

**Exit:** The server owner can assemble their real team and every person sees
only the modules their capabilities allow.

### Communities 4 - alerts, watchlists and Discord publishing

1. Implement community-scoped alert and staff/owner watchlist creation and
   management.
2. Extend the existing Community Watchlists publish flow with `Share to
   community`, eligible-community selection, placement and unshare.
3. Implement member list/detail pages with the member clearly named as author.
4. Implement per-content audience selection for all members, allowed mapped
   roles or selected members without changing Platform eligibility.
5. Implement per-community Discord destinations and the retry-safe outbox.
6. Keep official, community-owned and member-owned Watchlist ownership
   separate.
7. Perform an owner-authorized private-channel Discord delivery test only after
   local and staging acceptance.

**Exit:** An authorized contributor can publish an alert or staff watchlist; a
regular member can deliberately share their own published Community Watchlist;
a member can open the exact TraderLink page; and one configured Discord channel
receives one correct message.

### Communities 5 - member activity and analytics

1. Approve retention and member-facing policy wording.
2. Implement retry-safe community events and bounded projections.
3. Implement named member activity and aggregate page/content reporting.
4. Prove events cannot cross communities or include Journal/coach-private data.

**Exit:** The owner can truthfully see who uses their community pages and which
content receives views.

### Communities 6 - coaching and Discord-role access

1. Implement coach eligibility, profiles, offers, capacity and student flow.
2. Map each coaching offer to one or more verified Discord access roles.
3. Show eligible members the coaching workspace and direct ineligible members
   back to the server's Discord instructions without an in-app checkout.
4. Recheck role access through the bounded Discord membership refresh.
5. Implement explicit member-to-coach Journal data grants and revocation.
6. Verify that non-coach staff cannot see Coaching and no coach can edit
   Journal facts.

**Exit:** One approved coach can offer coaching to members holding the selected
Discord role, a member without that role cannot open the coaching workspace,
and one eligible student can grant and revoke bounded read access.

### Communities 7 - Tier 2 partner attribution

1. Approve the complete commission and attribution contract.
2. Implement community join attribution and recurring Tier 2 qualification.
3. Implement owner and TraderLink reporting with exact earnings states.
4. Reconcile subscription/refund/payout facts without guessing.

**Exit:** A qualifying upgrade is attributed once to the correct community and
both TraderLink and the owner see the same truthful status.

### Communities 8 - first-server pilot

1. Select one owner-controlled Discord server.
2. Complete onboarding with real roles and private test channels.
3. Verify owner, staff and member experiences on desktop and mobile in Light
   and Dark modes.
4. Verify member activity, content delivery, coaching and Tier 2 attribution
   using explicitly approved test cases.
5. Record owner feedback and correct the integrated product before expanding.

**Exit:** One real server can operate the complete partner loop without manual
database repair, cross-community leakage or misleading payment/earnings state.

## 17. Verification and acceptance

Follow the repository's low-resource cadence. Do not run Vitest. During each
implementation checkpoint, use only the smallest source, contract and targeted
checks needed for the changed slice. Larger TypeScript, lint, architecture,
build, browser and end-to-end checks occur only at the checkpoint or final
acceptance boundary specified for that slice.

Every visible checkpoint requires an owner-approved lightweight mockup before
implementation and rendered verification of the integrated app afterward.
Inspect desktop and mobile in Light and Dark modes, including applicable empty,
loading, success, warning, error, selected, hover, focus and disabled states.

The complete product cannot be accepted unless:

- the TraderLink operator can see and manage every community without receiving
  unrelated Journal access;
- one server owner can manage their server, team, custom roles and permissions;
- one person with several roles receives the correct combined workspace;
- staff without coaching permission cannot see coaching records;
- every private read and command is community-scoped on the server;
- every verified active server member is eligible to join TraderLink without an
  owner-selected admission role;
- audience controls restrict only the server's own alerts, watchlists and
  coaching offers, never the member's TraderLink account or Journal;
- a member of several communities cannot leak content or activity between them;
- alerts and watchlists publish to only the configured Discord community and
  channel;
- named activity is truthful, community-scoped and excludes Journal/private
  coaching data;
- a coach can access only data explicitly granted by that trader;
- Discord remains the source of current role access for paid community
  services, while TraderLink makes no claim about the underlying payment;
- removing a required Discord role removes future access to the mapped alert,
  watchlist or coaching area after the next successful role refresh;
- Tier 2 attribution is deterministic and reconciles for owner and TraderLink;
  and
- the existing Journal, official Watchlist, personal Community Watchlists,
  Platform identity and Affiliate first-touch contracts remain intact.

## 18. Explicit first-release exclusions

The first-server pilot does not include:

- a public cross-server TraderLink social network;
- public people or server discovery;
- cross-server feeds;
- direct messages, open comments or live chat;
- coach ratings, public rankings or a coaching marketplace;
- challenges, competitions or leaderboards;
- copy trading, trade execution or managed accounts;
- TraderLink collection of coaching payments;
- TraderLink judgement of coaching-service delivery;
- automated investment recommendations;
- anonymous indexing of server-private pages; or
- automatic assignment of existing personal Community Watchlists into server
  content; sharing must be an explicit member action.

These remain visible future possibilities rather than implied first-release
requirements.

## 19. Checkpoint-gated owner decisions

The planning package is complete without pretending that later commercial and
operating choices have already been made. Each remaining decision blocks only
the checkpoint that needs it; it does not hold unrelated foundation work
hostage.

| Required before | Owner decision |
| --- | --- |
| Communities 2 | Decide whether onboarding is owner-only or may also be started by Discord members with `Manage Server` authority |
| Communities 2 | Decide whether mapped Discord-role changes apply automatically or wait for owner confirmation |
| Communities 2 | Define server-ownership transfer and recovery behavior |
| Communities 2 | Choose a visibility arrangement, choose no formal requirement, or deliberately defer it from the pilot |
| Communities 5 | Set the former-member and temporary Discord-outage access grace policy |
| Communities 5 | Set named activity retention and the exact member-facing tracking disclosure |
| Future payment integration only | Decide whether TraderLink will ever process coaching payments or charge a transaction-based coaching fee; this does not block the first-server pilot |
| Communities 7 | Set the Tier 2 partner percentage, qualifying payments, attribution duration and payout method |
| Communities 7 | Set attribution precedence for a member who belongs to several partner communities |
| Communities 8 | Select the first owner-controlled Discord server for the pilot |

Until its row is decided, the affected UI must label the setting unavailable
or undecided and the affected checkpoint must not begin. No default may be
silently converted into a product rule.

## 20. Stop conditions

Stop the affected work if:

- a Discord community, owner or membership cannot be verified without guessing;
- an owner-selected role or member list could prevent an otherwise active
  server member from joining TraderLink;
- a role or capability would trust client-supplied identity or server IDs;
- a change risks rewriting stable Platform or Journal ownership;
- community staff could reach Journal data without the trader's explicit grant;
- one community can see another community's content, members or activity;
- a Discord role or Tier 2 earning would be presented as verified without
  current provider evidence;
- TraderLink would claim a coaching payment, refund, owner share or platform
  fee that it did not process and cannot verify;
- an existing Watchlist product would be relabelled or merged without an
  approved ownership transition;
- TraderLink product messages could post outside the approved visibility
  channel or exceed the approved cadence without a deliberate owner action;
- a UI implementation begins before its required mockup is owner approved;
- the active mixed working tree would cause another task's files to be staged,
  overwritten or committed; or
- implementation would require a deployment, live Discord message, payment
  operation or production change without separate owner authorization.

## 21. Immediate next boundary

On 2026-09-05 the owner authorized the complete implementation and deliberately
deferred visual approval until the integrated staging review. Communities 1-7
are now assembled under the linked progress record. The immediate boundary is
final focused verification, integrated desktop/mobile Light/Dark QA and a safe
staging-only publication.

The staging review uses isolated example data and disabled mutations where live
Discord or billing evidence is unavailable. Real server activation, a private
Discord delivery test, actual commission terms and the Communities 8 pilot
remain owner-controlled acceptance actions after the staging UI review. No
production change is authorized by this boundary.
