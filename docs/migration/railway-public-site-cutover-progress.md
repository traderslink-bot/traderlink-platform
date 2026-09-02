# Railway Public Site Cutover Progress

**Status:** Four-page static production surface live and verified

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
- [x] Published and verified staging-proven proxy checkpoint `90098edb` before the
  three-page static expansion. The live gate includes proxied pages, favicon,
  robots, Watchlist, and the SSE route after a Platform container replacement;
  the static root must remain available throughout.
- [x] Published the owner-approved three-page candidate parented to `90098edb`
  only after that production proxy gate passes, then verify both canonical
  landing routes and redirects live. The owner's combined final-QA instruction
  explicitly authorizes this serialized production sequence when checks pass.

## Final production evidence

- Proxy checkpoint `90098edb` published successfully before the page release;
  its startup hook launched cleanly and root, Platform proxy routes, discovery,
  health, and the Watchlist stream boundary passed.
- Landing checkpoint `4edf9303` published next. QA found the Trade Analyzer
  directory missing from the image, so one-file child `e0188bb2` added its
  Docker copy and restored `/trade-analyzer` to 200.
- Raw redirect QA then found Railway's internal listener scheme/port in
  absolute locations. One-file final child `f0e15a79` set server-level relative
  redirects without changing route ownership.
- Final production tip `f0e15a79` passed `/`, `/trading-journal`,
  `/trade-analyzer`, representative assets, robots, landing sitemap, Privacy,
  Terms, Help, News, Platform health, Watchlist auth, and unauthenticated SSE
  checks. Slash redirects now return only `/trading-journal`,
  `/trade-analyzer`, and `/landing-assets/` locations.

## Trade Analytics release candidate

- [x] Owner approved the complete desktop and mobile `/trade-analytics` page.
- [x] Final QA passed for all four static pages at desktop and 390-pixel mobile
  widths: one H1 and canonical per page, complete assets, valid structured data
  and JavaScript, exact beta/login destinations, shared four-link navigation,
  working mobile menus, and no horizontal page overflow or console errors.
- [x] Added only the exact `/trade-analytics` static route, relative
  trailing-slash redirect, Docker directory copy, and landing-sitemap entry;
  the dynamic Railway-DNS proxy and all Platform route ownership are retained.
- [x] Published candidate `0aa72808` through the Coordinator-owned static
  release lane from exact production parent `f0e15a79` as Railway deployment
  `5be665c3-e92c-4424-b5b1-82fc2bd81350`.
- [x] Live smoke verified `/`, `/trading-journal`, `/trade-analyzer`, and
  `/trade-analytics` as 200; the Analytics trailing-slash redirect is relative,
  the representative new asset and discovery files are 200, and Help, News,
  legal pages, Platform health, and the expected unauthenticated Watchlist SSE
  boundary all remain healthy.

## Homepage dark-mode showcase

- [x] Owner visually approved a new homepage section immediately before the
  final signup CTA. Checkpoint `3d4cd7a4` was published to the production static
  service as Railway deployment `ac61f533-5fc6-4bfb-a9ce-530763bb5a20`; the
  homepage and all five images passed live smoke. The section uses five real dark-mode
  dashboard screenshots in one illuminated screen, fast crossfades, a restrained
  scan-light transition, manual view selectors, viewport-aware autoplay,
  hover/focus pausing, and reduced-motion fallback.
- [x] Completed the focused performance correction after the owner's first-live
  report: responsive 720/1440 image sources, preload and decode the sequence before
  autoplay, remove the accidental whole-section pointer pause, and keep the
  scan/crossfade on compositor-friendly properties. Keyboard-focus pausing and
  manual view controls remain available. The visual sequence and approved
  section copy remain unchanged. Production publication and live verification
  remain pending.
