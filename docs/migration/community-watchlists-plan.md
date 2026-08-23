# Community Watchlists Plan

**Status:** Owner-authorized private-beta implementation in progress

**Progress record:** [Community Watchlists Progress](community-watchlists-progress.md)

**Scope:** Dashboard-native, opt-in user watchlists and Discord sharing. This
is a new Community feature, separate from the existing TradersLink Watchlist.

## Outcome

Give small-cap, micro-cap and nano-cap traders a simple way to prepare a
watchlist, optionally share it with the TradersLink Discord community, and
bring readers back to the exact watchlist and trader profile inside the
TradersLink Platform dashboard.

The first release establishes one dependable loop:

```text
Create in dashboard -> publish -> Discord announcement -> signed-in reader
opens the exact in-dashboard watchlist -> sees its author and research
```

It does not attempt to create a general social network, performance
leaderboard, chat service or group system.

## Product boundary

### Community Watchlists

Community Watchlists are trader-created, optional public research. They belong
to a stable Platform user, never to a selected Journal account, and never
expose Journal, broker, execution, account or performance data.

### Official TradersLink Watchlist

The existing `/watchlist` product remains separately branded and unchanged:
Premium, publisher-owned market content with its existing access and ingestion
contracts. Community Watchlists must not be presented as TradersLink research
or merge with the official Watchlist's data, feed, storage or publisher
authority.

## Approved dashboard-native routes

All routes below render inside the ordinary signed-in Platform dashboard shell
(navigation, header and responsive dashboard behavior). A direct Discord link
is a shareable address to an in-dashboard page, not a separate website.

| Route | Purpose | First-release status |
| --- | --- | --- |
| `/community/watchlists` | Community Watchlists hub, with **My Watchlists** and **Shared Watchlists** | Build |
| `/community/watchlists/new` | Create a personal watchlist | Build |
| `/community/<user-name>` | Trader's opt-in public profile | Build, minimal profile |
| `/community/<user-name>/watchlists/<watchlist-name>` | One published watchlist | Build |
| `/community` | People and connections discovery | Later |

A direct published-list link requires the normal Platform sign-in boundary. On
successful Discord sign-in, the app returns the visitor to the exact requested
watchlist. Anonymous public browsing is deliberately deferred until its
privacy, moderation and indexing policy is approved.

## First-release experience

### Dashboard hub

`/community/watchlists` is the first community surface in the dashboard. It
has two tabs:

- **My Watchlists** for the user's drafts and published lists, with `Create
  watchlist` as the clear primary action.
- **Shared Watchlists** for published trader lists that the signed-in user may
  open. It is a small, current list of shared research rather than a
  recommendation or performance ranking.

The Community hub is intentionally the engagement home. The user does not
leave the dashboard to create, publish, visit or return to a watchlist.

On desktop, each shared item is one compact **watchlist card**, next to a
small author card rather than stretched across the whole page. Its closed
state shows the author image, watchlist title, list tags, a short ticker strip
and the total symbol count. Opening the watchlist reveals a compact two-column
ticker board inside the same card. Selecting a ticker in that board shows only
that ticker's research preview; it never expands every ticker's long-form
notes at once. The canonical direct route remains the comfortable full-list
and share view.

### Create and publish

A watchlist starts as a private draft. A title is enough to save an early
empty draft; publishing requires one or more manually entered ticker symbols.
The author may then provide:

- a clear title;
- optional short description;
- selected searchable profile/list tags; and
- one or more manually entered ticker symbols.

The author can publish it to Community and can choose whether publishing also
sends the one Discord announcement. Publishing creates the canonical public
route. Discord delivery is an asynchronous, retry-safe follow-up: a temporary
delivery failure never unpublishes the list and retries must never duplicate an
announcement.

### Ticker research card

Each ticker is a compact, expandable rectangle card. The collapsed state is
scannable and makes extra research discoverable; the expanded state reveals
the author-provided detail.

Collapsed card:

```text
ABCD                                             chevron
Posted reference: $3.82 · Aug 22, 2026, 9:14 AM ET
#SmallCap  #Earnings  #Premarket
Watching for continued volume after today's news.
3 details · Catalyst Aug 29 · Personal target added
```

Optional expanded fields:

- **Why I am watching**;
- **My plan**;
- **Personal target**;
- upcoming catalyst and date;
- posted reference price and timestamp; and
- later, key level, invalidation, update and removal reason.

`My plan` and `Personal target` are author context, not investment advice or
TradersLink recommendations. A reference price is either captured from an
approved market-data source at publish time or visibly marked as
trader-entered. The application must never infer, backfill or guess it.

### Discord announcement

The initial announcement remains deliberately compact:

```text
@TraderName shared a watchlist

My Market Movers
6 symbols

View watchlist ->
```

It may include the author, list title, symbol count and canonical app link.
It does not publish personal Journal facts, prices, targets, performance,
claims of success or unaudited market facts.

### Public profile

The profile is minimal: opt-in handle, selected searchable traits and the
author's shared watchlists. It exists to give a list a recognizable human
owner, not to expose performance or create a follower competition.

Profile traits should be structured/selectable wherever practical so they can
support future search. Initial facets include trading style, markets, preferred
session, experience level, setup interests and optional time zone. Curated
selectable facets are the search contract. In this first release, an author may
also create a short custom tag while creating a profile, watchlist or ticker;
it is stored with that record and can become a future search facet without an
admin-dashboard step.

## Small-cap product direction

Community Watchlists are designed first for small-cap, micro-cap and nano-cap
research. The language, facets and future data surfaces should support the
workflow traders use in that niche: catalyst, liquidity, float, market-cap
context, filings, offerings/dilution risk, reverse splits, premarket and
after-hours activity.

Initial selectable list/ticker tags may include Small cap, Micro cap, Nano cap,
Low float, Premarket, After-hours, Earnings, News catalyst, SEC filing,
Offering/dilution risk, Reverse split, Biotech, Momentum and Swing idea.

Market-cap, float, price and company facts are not required to publish a
watchlist. Tickers are manually entered initially. Moomoo may later provide
optional symbol lookup and approved market-data enrichment, but TradersLink
owns every Community Watchlist record and Moomoo must never determine list
ownership, visibility, creation or sharing. Do not create stock/company pages
in this initial slice.

## Explicit deferrals and growth path

The following are intentionally outside the first release:

1. Following, mutual connections, direct messages, open comments and live
   chat.
2. Broad people discovery at `/community`.
3. Trading-group membership, group pages and group-created lists.
4. Reactions, saves/remixes, alerts and notification subscriptions.
5. Performance rankings, copy trading, broker actions and trade execution.
6. Company/stock-detail pages and automatic Moomoo market-data enrichment.
7. Anonymous public indexing and share previews beyond the approved Discord
   access flow.

Connections are the next community layer once watchlist publishing has an
active user base. Group membership should later be modeled from profile/list
tags or explicit verified membership, without changing the approved profile
and watchlist routes.

## Implementation checkpoints

1. **Foundation:** define Community-owned tables, ownership/privacy rules,
   profile handle uniqueness, watchlist and ticker-card contracts, and
   append-only publish/Discord delivery evidence.
2. **Dashboard creation:** build private drafts, manual ticker entry, selected
   tags and the expandable ticker card in the shared dashboard shell.
3. **Publish and direct pages:** add the public profile/list routes inside the
   dashboard, strict author authorization, audience rules and exact return
   after sign-in.
4. **Discord delivery:** add an idempotent, rate-limited announcement outbox,
   moderation/reporting controls appropriate to the publishing boundary, and
   the minimal approved message.
5. **Shared Watchlists hub:** expose the published-list view to signed-in
   users; verify it stays separate from the official Watchlist.
6. **Owner product review:** review real dashboard/mobile flows before the
   next engagement layer begins.

The owner authorized the private-beta implementation on 2026-08-22. It may add
the Community migration, storage and server-only Discord delivery code. It does
not authorize a production deployment, a live Discord test message, Moomoo
request or public launch. The first real Discord announcement remains under
owner-controlled testing in the private channel.
