# Railway Free Discord Beta Launch Plan

**Status:** owner approved on 2026-08-21; implementation active

**Progress:** [Railway Free Discord Beta Launch Progress](railway-free-discord-beta-launch-progress.md)

**Controlling runtime:** [TraderLink Platform Hosted Beta Runbook](traderlink-platform-hosted-beta-runbook.md)

## Owner-approved outcome

Launch TraderLink Platform at `https://app.traderslink.pro` for owner testing,
then open the same release to every authenticated member of the configured
TradersLink Discord server. The dashboard beta has no monthly plan, checkout or
paid entitlement. Links AI Chat and AI Reviews remain visible as **Coming soon**
and cannot call a provider or accept AI mutations.

The current Vercel/Neon release remains online throughout this beta. The root
`traderslink.pro` and `www.traderslink.pro` records, public Press Release article
pages, existing Discord delivery and current Press Release access rules are not
cut over, replaced or loosened by this launch.

## Complete beta target list

1. Preserve the current Vercel/Neon public site and public Press Release URLs.
2. Deploy the complete dashboard only to Railway as one long-running Next.js
   service with one replica and one persistent `/data` volume.
3. Use `app.traderslink.pro` for owner testing and the later Discord beta.
4. Admit any current member of the configured TradersLink Discord server; do
   not require a Whop product, monthly plan or Premium role for ordinary
   Trade Tracker dashboard access.
5. Preserve existing feature-specific Premium rules for Press Releases and
   Watchlist. This beta decision does not make those existing products free.
6. Show Links AI Chat and AI Reviews in navigation with a **Coming soon** badge.
7. Replace their hosted pages, top-bar drawer and Account billing controls with
   plain Coming soon presentation.
8. Fail closed for AI Chat APIs, AI Review generation routes, AI Review
   schedules, Whop AI billing routes and stale AI Server Action requests.
9. Do not configure OpenAI, Whop, AI Review scheduler or customer-generation
   credentials for this release.
10. Keep local development AI enabled by default so the separate Links task can
    continue toward a later owner-approved activation.
11. Create the Railway project only from the official TraderLink Platform
    repository and an explicit clean release commit.
12. Prepare `/data/traderlink-platform.sqlite`, evidence, upload staging and
    backup directories without placing private data in the image or Git.
13. Complete database integrity, one-writer, backup/restore, authentication,
    account-isolation, desktop/mobile and PWA checks before owner acceptance.
14. Invite no Discord users until the owner accepts the exact Railway release.

## Visible Coming soon contract

- The AI group stays in the approved sidebar position.
- `Links AI Chat` and `AI Reviews` each show one small `Coming soon` status.
- The top-bar AI action opens the Links Coming soon page; it cannot open Chat.
- Each feature page keeps its clear feature title and gives one plain status
  explanation. It shows no chat composer, saved review controls, schedule,
  checkout, billing or subscription language.
- Account labels the section `AI`, explains that no AI subscription or setup is
  part of the free beta, and provides no Whop action.
- AI and paid-plan Help destinations return to the matching Coming soon page
  while the launch state is active.

The owner approved this presentation on 2026-08-21. Any materially different
layout, wording or feature visibility requires another visual approval.

## Hosted launch-state contract

Railway sets:

```text
NEXT_PUBLIC_TRADERLINK_PLATFORM_AI_LAUNCH_STATE=coming_soon
```

`enabled` is the only value that exposes AI behavior. Production defaults to
`coming_soon` when the value is absent or invalid. Development defaults to
`enabled` so the concurrent Links implementation is not blocked. Activating AI
later requires a separate owner-approved release, provider/security acceptance
and an explicit Railway variable change.

## Railway release order

1. Complete and visually approve the Coming soon implementation locally.
2. Reconcile concurrent working-tree changes and create a narrow local commit.
3. Publish the exact clean release commit to the official source repository.
4. Create one Railway project, one production environment and one service.
5. Attach one volume at `/data`; configure zero overlap, 30-second drain,
   no sleeping, one replica and `/api/platform/health`.
6. Configure only the beta-required non-secret variables and protected secrets.
7. Prepare the protected volume, database, migrations and exact owner link.
8. Verify the Railway-provided HTTPS URL and health response.
9. Attach `app.traderslink.pro`; add only its DNS records. Do not change root,
   `www` or public News records.
10. Configure the exact Discord callback for `app.traderslink.pro` and complete
    owner sign-in, Admin denial/allowance and account-isolation checks.
11. Verify Coming soon UI and blocked AI/Whop routes on desktop and mobile.
12. Prove backup/restore, monitoring and rollback.
13. Obtain final owner acceptance on the exact hosted release.
14. Announce the free beta to the TradersLink Discord only after acceptance.

## Stop conditions

Stop before traffic if Railway would run more than one writer, `/data` is
missing or ephemeral, startup would initialize or adopt an unknown database,
the release commit is dirty or ambiguous, Discord membership is not verified,
ordinary users can reach owner data, any AI/Whop route remains active, the
current Vercel/Neon Press Release site changes, backup/restore cannot be proven,
or private values appear in Git, logs, build output or chat.

## Acceptance evidence

- exact release commit and changed-file inventory;
- Railway project/environment/service identity without secret values;
- one replica, one `/data` volume and no overlapping writer;
- healthy startup with current migration count and database integrity;
- Discord owner sign-in plus separate normal-member account isolation;
- desktop and mobile Coming soon presentation;
- AI Chat, AI Review, AI cron and Whop route denial;
- root/`www`/public Press Release pages unchanged on Vercel/Neon;
- `app.traderslink.pro` TLS, cookies, redirects and PWA behavior;
- current backup plus independent restore proof;
- final owner approval before the Discord announcement.

