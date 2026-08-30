# Railway Public Site Cutover Plan

**Status:** Production front door and three-page static expansion live; Trade Analytics final QA complete and production publication authorized

**Progress record:** [Railway Public Site Cutover Progress](railway-public-site-cutover-progress.md)

**Static SEO landing-page work:**

- [Trading Journal Static Landing Page Plan](trading-journal-static-landing-page-plan.md)
- [Trade Analyzer Static Landing Page Plan](trade-analyzer-static-landing-page-plan.md)
- [Trade Analytics Static Landing Page Plan](trade-analytics-static-landing-page-plan.md)

## Complete target inventory

The production Vercel project `vercel-landing` currently owns only the minimal
public landing page and the `traderslink.pro` and `www.traderslink.pro` aliases.
The following public Platform routes must work from Railway on the root domain:

1. `/` public TradersLink landing page
2. `/help` and all public Help guides
3. `/academy`, courses, paths, and lessons
4. `/watchlist`, its symbol and archive routes, and its existing Discord/Premium
   entitlement gate
5. `/news` and public ticker/article routes
6. `/privacy` and `/terms`

`app.traderslink.pro` remains the private dashboard host. Its root continues to
start Discord login and return to `/workspace`.

## Implementation order

1. Deploy the reviewed static root as a small Railway front-door service. It
   serves `/` and `landing-assets/` directly, so later landing-page edits do
   not rebuild the private Platform application.
2. Configure the front-door service's `PLATFORM_UPSTREAM` only to the existing
   Railway Platform service over Railway private networking. It proxies every
   non-static request unchanged, including Help, Academy, Watchlist, News,
   legal routes, APIs, and Server-Sent Events.
3. Verify the Platform service accepts the public root host for its existing
   public routes without changing the private `app.traderslink.pro` Discord
   login origin.
4. Verify Academy is served from Railway without changing lesson slugs,
   progress ownership, or the existing Discord callback origin.
5. Verify Watchlist is served from Railway using its existing persistent
   Platform storage and entitlement checks; do not expose it publicly without
   its Discord/Premium gate.
6. Verify the full public route inventory, root/www redirects, Help canonical
   URLs, TLS, Discord return paths, and `/api/platform/health` after DNS
   propagation.
7. Remove Vercel production aliases only after the Railway public surface has
   passed the complete live verification. Preserve the separate Vercel preview
   project until the owner has accepted the final Vercel account audit.

## Static front-door contract

The Railway service uses `static-landing-site/Dockerfile` and
`static-landing-site/nginx/default.conf.template`.

- It serves only the approved static marketing root and its local assets.
- `PLATFORM_UPSTREAM` is a Railway private-network origin with no trailing
  slash. It must point at the existing `traderlink-platform-web` service; do
  not use a Vercel URL or public dashboard address as an upstream.
- It proxies all remaining paths to Platform and disables buffering for that
  path. This preserves the Watchlist `EventSource` endpoint
  `/api/live-watchlist/stream` and avoids breaking its continuous event feed.
- Railway's service health check is `/healthz`; the Platform health check
  remains `/api/platform/health` on the Platform service.
- The static root presents a first-visit analytics-choice banner. It reuses the
  Platform consent storage format (`traderslink_analytics_consent_v1`) for 180
  days and offers **Accept analytics** or **Essential only**. It contains no
  analytics tag or tracking call; optional analytics stay off until a visitor
  chooses acceptance, and the existing Platform pages may consume that stored
  choice under their existing consent contract.
- The root footer and banner link to proxied `/privacy` and `/terms`. Their
  Platform-rendered page bodies remain unchanged.
- The approved footer visually continues the final navy signup section. Its
  left copy is `TradersLink, living the small cap trading life!`; Privacy Policy
  and Terms & Conditions remain the right-side links.

## Watchlist EODHD transport audit

The EODHD live-price integration is independent of Vercel:

1. `vendor/levels-system-v2/dist/lib/monitoring/eodhd-live-price-provider.js`
   owns the outbound EODHD WebSocket and reconnect loop.
2. The Levels runtime publishes its updates by authenticated HTTPS POST to the
   configured `TRADERSLINK_WATCHLIST_INGEST_URL`, as implemented in
   `vendor/levels-system-v2/dist/lib/live-watchlist/live-watchlist-publisher.js`.
3. Platform validates and persists the EODHD quote payload in
   `app/api/live-watchlist/ingest/route.ts`, then fans updates out in-process.
4. The Watchlist browser uses same-origin Server-Sent Events, not a browser
   websocket, through `app/api/live-watchlist/stream/route.ts` and
   `src/lib/live-watchlist/live-watchlist-events.ts`.

At release, update only the publisher's configured ingest origin to the final
Railway public root if it is not already there. Do not alter the EODHD token,
provider settings, or market-data runtime as part of the Vercel retirement.

## Safety boundaries

- Do not migrate, reset, or replace Academy progress or Watchlist storage.
- Do not alter the public `app.traderslink.pro` Discord callback.
- Do not delete Vercel aliases or unrelated DNS/email records before Railway
  hosts and certificates are live.
- Make Railway releases as narrow, coordinated commits with no overlapping
  deployment.
