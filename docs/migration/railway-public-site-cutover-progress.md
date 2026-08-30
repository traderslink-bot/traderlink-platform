# Railway Public Site Cutover Progress

**Status:** Proxy repair staging-proven; owner-authorized production sequence ready

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
- [x] Added the shared mobile navigation treatment across all three static
  documents: the logo remains visible, while Features, Help, Login, and a
  compact signup action collapse into an accessible hamburger menu.
- [x] Published the Railway static front-door service and completed the root,
  asset, TLS, proxied Help, Academy, News, legal, Watchlist, and Watchlist
  stream cutover checks.
- [x] Detached the retired Vercel root/www aliases, disabled Vercel Git
  deployments, deleted only the unused failed preview project, and completed
  the owner-directed Vercel plan downgrade separately from the Railway source.
- [x] Completed the combined desktop and 390-pixel mobile QA inventory for the
  homepage, Trading Journal, and Trade Analyzer release candidate.
- [x] Rejected and rolled back the first sourced-hook proxy repair after its
  Railway container restart gate failed; production returned to the exact
  known-good static parent before any landing-page publication.
- [x] Rebuilt the repair from that exact parent as isolated checkpoint
  `90098edb`, using an independently launched runtime hook plus an Alpine
  build-time execution proof. The candidate contains only Dockerfile, runtime
  hook, and Nginx template changes.
- [x] Completed the isolated Railway staging gate for `90098edb`: the container
  stays running; health and proxied pages pass; invalid upstream/listen values
  fail closed; and an unchanged static service continued proxying after a
  separate Platform container replacement. The Watchlist stream returned its
  expected unauthenticated response rather than 502/504.
- [ ] Publish and verify staging-proven proxy checkpoint `90098edb` before the
  three-page static expansion. The live gate includes proxied pages, favicon,
  robots, Watchlist, and the SSE route after a Platform container replacement;
  the static root must remain available throughout.
- [ ] Publish the owner-approved three-page candidate parented to `90098edb`
  only after that production proxy gate passes, then verify both canonical
  landing routes and redirects live. The owner's combined final-QA instruction
  explicitly authorizes this serialized production sequence when checks pass.
