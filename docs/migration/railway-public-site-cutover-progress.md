# Railway Public Site Cutover Progress

**Status:** In progress

**Controlling plan:** [Railway Public Site Cutover Plan](railway-public-site-cutover-plan.md)

- [x] Identified the Vercel production project and root/www aliases.
- [x] Confirmed Academy and Watchlist live in the Platform source, not the
  Vercel landing project.
- [x] Prepared the reviewed static root and Railway front-door Docker/Nginx
  source candidate; no hosted service, domain, DNS, deployment, or Vercel
  setting has changed.
- [x] Audited the Watchlist EODHD live-price transport: EODHD runs in the
  Levels runtime, publishes by authenticated HTTPS to Platform, and browsers
  receive Platform Server-Sent Events. It has no Vercel websocket dependency.
- [x] Added the static root's first-visit analytics choice banner and clear
  Privacy Policy and Terms & Conditions links. It stores only the existing
  consent choice locally, loads no analytics itself, and leaves proxied legal
  page bodies unchanged.
- [x] Applied the owner-finalized static footer: final-section navy background,
  approved TradersLink text at left, and legal links at right.
- [ ] Create the Railway static front-door service and set its private
  `PLATFORM_UPSTREAM` only after the release lane is claimed.
- [ ] Verify Academy and Watchlist public-host behavior from Railway.
- [ ] Complete DNS/TLS, route, redirect, and health verification.
- [ ] Retire Vercel production aliases after the complete Railway cutover is
  accepted, then complete the owner-approved Vercel account audit before
  disabling billing.
