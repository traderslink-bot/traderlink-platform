# Community Watchlists Progress

**Status:** Private-beta implementation in progress — visual refinement underway

**Controlling plan:** [Community Watchlists Plan](community-watchlists-plan.md)

**Follow slice:** [Community Watchlist Follows Plan](community-watchlist-follows-plan.md)

**Profile slice:** [Community Profile Plan](community-profile-plan.md)

**Company facts cache:** [Community Company Facts Cache Plan](community-company-facts-cache-plan.md)

## Current checkpoint

The owner approved the dashboard-native direction and then authorized the
private-beta implementation. The temporary sample-data preview has been
replaced in source with real signed-in routes: dashboard hub, create form,
minimal opt-in profile and direct published-list page.

The direct published-list page is being refined with the owner's live private
beta feedback. The current revision keeps the profile visually attached to the
watchlist card and uses a compact, selectable research board. Its company
facts are being refined into a card/table hybrid: desktop labels appear once
above a fixed aligned ticker grid, while each ticker remains an independently
expandable card. The latest refinement uses the same grid definition for
labels and values, tightens the first fact columns, and labels the expansion
control as Trader's take. The desktop grid now uses fixed fact columns and a
matching transparent header border so label and row coordinates cannot drift.
The desktop board deliberately becomes a compact two-column fact card on
mobile, keeping all four facts visible. It has not yet received owner visual
acceptance.

The direct-list header now uses title and description at left, followed by a
horizontal watchlist-tag row beginning at the left edge. The ticker fact
labels remain inside the collapsible ticker section, immediately above the
light-blue ticker rows. A widened minimal profile column is anchored at the
far top-right; it shows only avatar, handle and View profile, in that order,
and its blue left edge moves with the entire column. "Watchlist tags" is not
rendered as visible copy.

The direct card is a reusable client component. Its compact header toggles the
full light-blue ticker board while the direct route starts expanded; later
collection pages can use the same component with a collapsed default.

Watchlist follows are now an owner-authorized implementation slice. The compact
card will store a watcher relationship and offer Follow Watchlist / Unfollow
Watchlist beside the title, with a real last-updated status. The relationship
is deliberately separate from later profile following. Ticker-add/remove
notifications remain deferred until the owner ticker editor supplies those
real events.

The compact header shows watchlist tags followed by up to five actual ticker
symbols, then a compact `N more` chip when needed, and a `View watchlist
details` control. Per-ticker research tags remain inside the corresponding
expandable ticker card. The last-updated status is in the left column below the
symbol strip. Each ticker collects one 800-character Trader's take note
rather than separate reason and plan fields.

The Community Watchlists hub now uses that same compact expandable card for
My Watchlists, Shared Watchlists and a distinct Following tab. It no longer
uses a separate feed-card design. Hub cards stay closed initially; opening one
loads its company facts on demand so a collection page does not make a large
Finnhub request batch before the trader asks to view a list.

Company Facts are now cached as dated Community ticker records rather than
being treated as temporary page responses. The cache preserves Finnhub's
company name, country, industry, exchange, website, market capitalization and
shares outstanding; the current cards use the four approved visible facts.
Records are reused for seven days before later background refresh work, and
the same data will be available to later Community ticker and chat pages.

The published owner can enter a separate Edit watchlist mode from the compact
profile area. It adds a list-level ticker control below the ticker cards and
allows editing the watchlist description and each expanded Trader's take;
public viewers see none of these controls.

The next local slice adds a Community profile editor at `/account/profile`.
It uses the member's Discord username as the displayed identity while keeping
the stable Community handle as the route identifier. A trader can save an
optional 180-character description, select up to six profile tags, choose
whether their profile is visible, and follow other visible trader profiles.
Profile tags remain discovery data and do not appear on a watchlist card. The
description appears in the unused space of the compact watchlist profile area.
Profile follows are a distinct durable relationship from watchlist follows;
they record truthful follower/following counts and no notifications are sent.

Desktop ticker cards keep their fixed outer width. Their fact order is M/C,
O/S, Country, Industry; Industry has a hard 150px cell, giving room for about
20 characters without changing the card width. The remaining right-side space
belongs to Trader's take. Long source values are forced to a single-line
ellipsis rather than overflowing.
The desktop profile card is top-aligned and does not stretch with a taller
title or watchlist-tag column.

Watchlist titles are capped at 25 characters and descriptions at 180
characters. Watchlist and ticker tags are each capped at four, both in the
form and server-side validation. Ticker tags appear at the bottom of the
expanded Trader's take, wrapping only when needed. Trader-entered posted reference price is no longer collected or
shown; the existing stored column is retained solely for schema compatibility.
The list owner can now add, remove and create ticker tags inside a full-width
row below that expanded content, including for an already published watchlist.

Migration `0076_community_watchlists` was applied to the local Platform
database on 2026-08-22 after a verified pre-change backup/restore. It creates
Community-owned profiles, watchlists, ticker research cards and
publication-delivery records. Community records are owned by the stable
Platform user, never by a Journal account; they do not read or expose Journal,
broker, execution, account or performance data.

The shared migration runner also found and applied concurrently registered
`0077_platform_dashboard_member_access` immediately after 0076. The verified
post-run database has 77 migration rows; Community's four tables exist,
foreign-key check is empty and SQLite quick-check passes. No rollback was
attempted.

The server-only `DISCORD_COMMUNITY_WATCHLIST_WEBHOOK_URL` is read only when an
author presses Publish with Discord enabled. Delivery claims one pending
publication before posting, disables Discord mentions, and records either a
delivery or a safe failure. No webhook value was read, stored or sent during
implementation; no Discord message, Moomoo request, production, Git or
deployment state changed.

The first no-worker loopback review attempt used isolated port 3012 and was
stopped after the dashboard layout failed closed with
`TRADERLINK_MIGRATION_UNKNOWN_APPLIED`. That is an existing shared-database
concurrency boundary, not a Community Watchlists route failure. No migration
was run or bypassed, and browser visual acceptance remains pending a clean
dashboard review checkpoint.

The approved first release is:

- user-owned private drafts and opt-in published watchlists;
- manually entered ticker cards with optional author research;
- minimal public trader profile and direct published-watchlist route inside the
  normal signed-in dashboard;
- a compact, retry-safe Discord announcement that links to that exact route;
- a dashboard hub at `/community/watchlists` with My Watchlists and Shared
  Watchlists; and
- strict separation from the official Premium `/watchlist` product.

Connections, group membership, people discovery, comments, direct messages,
rankings, company pages and Moomoo enrichment remain deferred.

## Checkpoint status

| Checkpoint | Status | Notes |
| --- | --- | --- |
| Product boundary and routes | Complete | Owner-approved in the controlling plan |
| Dashboard visual preview | Complete in source | Approved visual language is retained in the real route components |
| Foundation contract | Applied locally | Migration 0076 and Community repository are present in the local 77-migration database |
| Dashboard creation | Ready for local review | Creates drafts with manual ticker research, curated selectable tags and author-created custom tags |
| Publish/direct pages | Implemented in source | Published lists and profiles remain inside the signed-in dashboard boundary |
| Discord announcement | Implemented in source | Server-only, mention-safe, one-publication delivery claim; no external message sent |
| Shared Watchlists hub | Implemented in source | Starts compact; each card opens and closes by clicking its non-interactive surface, while ticker controls remain independently usable |
| Owner visual review | Pending | Preview server was blocked by the shared migration boundary; no visual acceptance claimed |

## Next authorized step

Let the owner review the changed dashboard flow. A controlled private-channel
publish test is the next separate step and will not happen automatically.
