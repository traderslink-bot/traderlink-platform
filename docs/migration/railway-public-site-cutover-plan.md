# Railway Public Site Cutover Plan

**Status:** Approved for implementation

**Progress record:** [Railway Public Site Cutover Progress](railway-public-site-cutover-progress.md)

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

1. Establish host-aware root routing so the public root does not inherit the
   dashboard-login redirect after DNS moves to Railway.
2. Port the current Vercel landing content into the Platform public-host root,
   retaining its canonical root-domain metadata and public calls to action.
3. Verify Academy is served from Railway without changing lesson slugs,
   progress ownership, or the existing Discord callback origin.
4. Verify Watchlist is served from Railway using its existing persistent
   Platform storage and entitlement checks; do not expose it publicly without
   its Discord/Premium gate.
5. Verify the full public route inventory, root/www redirects, Help canonical
   URLs, TLS, Discord return paths, and `/api/platform/health` after DNS
   propagation.
6. Remove Vercel production aliases only after the Railway public surface has
   passed the complete live verification. Preserve the separate Vercel preview
   project unless it is separately retired.

## Safety boundaries

- Do not migrate, reset, or replace Academy progress or Watchlist storage.
- Do not alter the public `app.traderslink.pro` Discord callback.
- Do not delete Vercel aliases or unrelated DNS/email records before Railway
  hosts and certificates are live.
- Make Railway releases as narrow, coordinated commits with no overlapping
  deployment.
