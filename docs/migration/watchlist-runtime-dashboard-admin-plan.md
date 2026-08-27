# Watchlist Runtime Dashboard Admin Plan

**Status:** Correction approved for implementation

**Scope:** An owner-only Dashboard page for the existing Railway Watchlist
runtime. This is separate from the member-facing official Watchlist route.

**Related record:** [Watchlist Dashboard Integration Progress](watchlist-dashboard-integration-progress.md)

**Usage-panel progress:** [Watchlist Usage Admin Progress](watchlist-usage-admin-progress.md)

## Owner-approved layout

The page is `/admin/watchlist`. For now it remains inside the established
signed-in Dashboard shell and is visible only to the protected two-owner
Discord-subject allowlist. The existing `/watchlist` routes, their content, CSS
and access contract remain unchanged.

The Admin body is the existing runtime-owned `Manual Watchlist` document, not a
new partial React recreation. Platform obtains that document server-side,
preserves its complete HTML, CSS and browser behavior, and relays its exact API
requests through the authenticated Platform origin. This carries the complete
runtime app, including all global controls, the Top Regular/Main/Post-Market
lists, every per-ticker action, the full Automatic Low-Float Selection form,
all AI Read controls and audit details, Live Website controls, Provider Health,
Runtime Config and Runtime Status.

The relayed document adds only an owner-approved injected section navigation.
It moves existing runtime DOM blocks without cloning, renaming or replacing
controls. The transformer matches the observed direct `MAIN` sections, their
exact `h2` text and existing grid IDs rather than inferring sections from broad
content text. Persistent summary content is limited to `#ai-read-cost-grid` and
`#ai-read-audit-grid`; the AI Read section, both consoles, their controls,
toolbars, tables and details stay in AI Controls. Only a direct audit-grid card
whose text begins `Skipped` is hidden, including after the runtime refreshes
that grid. Watchlist is the default; Runtime, Market Data, AI Controls, Live
Website Controls and Automatic Low-Float Selection are the remaining sections.
The three direct Runtime Config provider controls form Market Data, and only
the final Live Website provider control forms Automatic Low-Float Selection.
Existing runtime CSS, IDs, event listeners and API paths remain runtime-owned.

## Watchlist usage panel

This is a separate Platform-owned panel above the relayed runtime document. It
does not alter, inject into, or depend on the canonical Watchlist runtime.
The owner approved this layout and definitions on 2026-08-26.

### Panel layout

The existing Platform-owned section navigation adds **Usage**. Selecting it
opens this panel and hides the retained same-origin runtime iframe without
unmounting it. **Watchlist controls** returns to the existing runtime document.
The panel renders four compact factual cards:

1. **Today's distinct visitors** — the count of distinct authorized members
   with a confirmed Watchlist page view on the current America/New_York date.
2. **Today's visits** — the total confirmed Watchlist page-view events on that
   date; repeat real page loads are included.
3. **All recorded visits** — the total confirmed Watchlist page-view events
   since collection began.
4. **Data since** — the earliest recorded confirmed page-view timestamp,
   displayed in New York time. Show `No visits recorded yet` until the first
   event exists.

Below the cards, show:

- a **Daily Watchlist activity** table ordered newest New York date first,
  with date, distinct visitors, and visits; and
- a **Watchlist visitors** table ordered by most recent visit first, with
  established Platform display name, most recent visit in New York time,
  today's visits, and all recorded visits. Equal timestamps break by the
  established stable Platform user identity only in the query; that identity
  is never rendered.

The panel is owner-only because it is rendered inside the existing
two-owner `/admin/watchlist` boundary. It is not a new member-facing analytics
surface.

### Event definitions and collection boundary

- A **visit** is one client-confirmed rendered page view of `/watchlist` or an
  active `/watchlist/[symbol]` detail page by an already-authorized,
  authenticated TradersLink Discord-server member.
- Client code may send only a fixed page kind and a canonical ticker symbol
  where applicable. The server derives the Platform user identity from the
  authenticated request; it never accepts, stores, or exposes a Discord
  subject supplied by the browser.
- The receipt is an established same-origin Platform mutation request. It
  validates mutation security and the authenticated member identity before it
  reads a body. Missing or malformed owner-exclusion configuration fails
  closed with no stored event; an authentication/security rejection is kept
  distinct from an unavailable storage/configuration response.
- The two established owner accounts are recognized only by the existing
  server-side owner predicate and their supported-page views are discarded
  before any usage event is written. They therefore cannot affect the cards,
  daily table, visitor table, or `Data since` value. Their display names and
  stable identities are not embedded in browser code or documentation.
- One mounted page view is recorded at most once, preventing React rerenders
  from double-writing it. A real reload or a navigation that mounts a new
  supported Watchlist page is a new factual visit event.
- Exclude archive and how-it-works routes, unauthenticated/failed/redirected
  loads, the runtime iframe and Admin views, API polling, background requests,
  and server prefetches.
- Daily distinct visitors use the America/New_York calendar date derived from
  the event timestamp. Counts are page-view events, not inferred sessions.
- Collection begins at release. Earlier visitor history cannot be
  reconstructed and must not be displayed as though it were complete.

### Usage acceptance checks

- The existing owner-only Admin boundary is unchanged; ordinary members cannot
  read the panel or its display names.
- The runtime document's **Usage** control can select only the same-origin
  parent Usage panel. The parent accepts that message only from the current
  iframe and same Platform origin; it does not duplicate the panel or its data
  inside the runtime document.
- A successful active index/detail mount records one opaque event at most once
  despite rerenders or retry of the same event ID. A reload or supported-page
  navigation receives a new event ID and is a separate factual visit.
- Owner accounts, unsupported routes and failed/unauthenticated views produce
  no stored event. The durable table contains no Discord subject, IP, user
  agent, URL, path or ticker.
- The panel reports zero only when no qualifying events exist; an unavailable
  read is shown as unavailable rather than fabricated counts. Existing records
  begin at release and are not backfilled.

## Security and data boundary

- The browser talks only to owner-authorized Platform document and API routes.
- Platform uses server-only `TRADERLINK_WATCHLIST_RUNTIME_URL` and
  `TRADERLINK_WATCHLIST_RUNTIME_ACCESS_TOKEN` configuration to reach the
  Railway private service. Neither value is emitted to the browser, source,
  logs or documentation.
- The page and API reuse the existing exact active Discord identity allowlist;
  no mutable display name, role name or client-supplied identity grants access.
- Only the exact GET/POST paths used by the existing runtime documents are
  relayed. The existing confirmation-protected bulk clear and Discord clear
  controls are included because the owner explicitly required complete app
  parity. This includes the runtime-owned same-day Yahoo/Moomoo candle-provider
  selector endpoint; it does not widen access to any other runtime path.
  Service restart, deployment and migration controls are not invented.

## Acceptance boundary

- Both approved owners see `Watchlist Admin` under Dashboard Stock Tools.
- Other accounts do not see that link and receive no runtime data or mutation
  path.
- The served document contains the same control IDs, sections, sessions and
  API request paths as the current runtime-owned Manual Watchlist source.
- The existing runtime remains the sole Discord and website publisher.
- The hosted page must load the complete runtime document without `Failed to
  fetch` before it is accepted.
- The usage panel records only the defined Platform-owned client-confirmed
  visit events and does not send data to the Watchlist runtime or providers.
