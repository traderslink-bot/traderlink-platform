# Railway Free Discord Beta Launch Progress

**Status:** implementation active

**Controlling plan:** [Railway Free Discord Beta Launch Plan](railway-free-discord-beta-launch-plan.md)

## Approved decisions — 2026-08-21

- [x] Keep the current Vercel/Neon site and Press Release pages online.
- [x] Use Railway only for the complete dashboard beta.
- [x] Use `app.traderslink.pro` during owner testing.
- [x] Launch without a monthly dashboard plan or paid dashboard entitlement.
- [x] Open the accepted beta to all current TradersLink Discord members.
- [x] Keep Links AI Chat and AI Reviews visible as Coming soon.
- [x] Preserve the separate AI Chat task for later activation.
- [x] Preserve existing Press Release and Watchlist product access rules.

## Access and provider setup

- [x] Owner activated Railway Pro.
- [x] Official Railway CLI installed on the owner computer.
- [x] Railway browser authorization completed and correct account verified.
- [x] Railway project inventory confirmed empty before launch work.
- [x] Empty `TraderLink Platform` Railway project created in the `TradersLink`
  workspace with its default `production` environment.
- [x] One empty `traderlink-platform-web` application service created. It has
  no source repository and no deployment yet.
- [x] One ready 50 GB `traderlink-platform-web-volume` attached at `/data`.
- [x] Non-secret production storage, production mode, AI Coming soon, and
  Discord callback values entered without triggering a deployment.
- [ ] Discord production callback and protected values configured.
- [ ] DNS record for only `app.traderslink.pro` configured.

## Release implementation

- [x] Owner approved the Coming soon layout and behavior.
- [x] Add a production-fail-closed AI launch-state contract.
- [x] Add Coming soon status to AI navigation and pages.
- [x] Prevent the top-bar AI drawer from opening in the hosted beta.
- [x] Replace hosted Account AI/Whop controls with Coming soon copy.
- [x] Add centralized denial for AI, AI schedule and Whop routes.
- [x] Align AI and paid-plan Help destinations with Coming soon.
- [x] Complete focused static verification.
- [ ] Complete desktop and mobile owner visual review.
- [ ] Create a narrow local commit without concurrent Links work.

## Railway and acceptance

- [ ] Publish the exact accepted release commit.
- [ ] Provision and prepare the persistent `/data` volume.
- [ ] Configure beta-required variables and protected secrets.
- [ ] Create or transfer the production database and verify migrations.
- [ ] Prove one writer, health, backup and independent restore.
- [ ] Complete Discord owner link and ordinary-member isolation checks.
- [ ] Verify Vercel/Neon public pages remain unchanged.
- [ ] Verify `app.traderslink.pro` desktop, mobile and installed PWA behavior.
- [ ] Obtain final owner approval.
- [ ] Open and announce the free Discord beta.

## Concurrent-work boundary

Task `01a01e25-3e06-7762-a13d-10eb9e0c6c90` owns the Links language-engine
work for later activation. This launch slice does not edit its performance
language, question-bank, evaluator or progress files. Shared navigation and AI
route availability are coordinated through the explicit launch-state contract.

## Verification evidence — 2026-08-21

- Scoped ESLint passed for the launch-state contract, proxy, navigation,
  dashboard shell, AI pages, Account AI page, and offline route surface.
- Scoped TypeScript compilation passed with no diagnostics under a capped
  768 MB Node heap.
- A focused runtime assertion verified the fail-closed production default,
  development default, explicit Coming soon mode, 503 API denial, permitted
  Coming soon page roots, nested-page redirects, paid-plan Help redirect, and
  later explicit re-enablement.
- `git diff --check` passed for the release slice.
- The AI Chat, AI Reviews, and paid-plan Help guides were reviewed. Their
  existing later-feature content remains valid, so it was preserved; hosted
  beta requests are redirected to the appropriate Coming soon page while the
  launch gate is active.
- No Vitest, broad test suite, provider call, database migration, or production
  deployment was run during this implementation checkpoint.
