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
`traderslink.pro` and `www.traderslink.pro` records remain unchanged and its
existing public Press Release article pages stay accessible as history. New
canonical Press Release articles move to Railway: the computer-run publisher
posts to `app.traderslink.pro`, and its returned Railway article URL becomes
the Discord destination. Existing Discord delivery and current Press Release
access rules are not loosened by this launch.

## Complete beta target list

1. Preserve the current Vercel/Neon public site and existing public Press
   Release URLs as historical pages.
2. Deploy the complete dashboard only to Railway as one long-running Next.js
   service with one replica and one persistent `/data` volume.
3. Use `app.traderslink.pro` for owner testing and the later Discord beta.
4. Admit any current member of the configured TradersLink Discord server; do
   not require a Whop product, monthly plan or Premium role for ordinary
   Trade Tracker dashboard access.
5. Open Press Releases to every authenticated TradersLink Discord member for
   this beta. Preserve the existing Watchlist Premium rule.
6. Show Links AI Chat and AI Reviews in navigation with a **Coming soon** badge.
7. Replace their hosted pages, top-bar drawer and Account billing controls with
   plain Coming soon presentation.
8. Fail closed for AI Chat APIs, AI Review generation routes, AI Review
   schedules, Whop AI billing routes and stale AI Server Action requests.
9. Do not configure Railway-hosted OpenAI, Whop, AI Review scheduler or
   customer-generation credentials for this release. The separate computer-run
   Press Release publisher retains its local OpenAI configuration.
10. Keep local development AI enabled by default so the separate Links task can
    continue toward a later owner-approved activation.
11. Create the Railway project only from the official TraderLink Platform
    repository and an explicit clean release commit.
12. Prepare `/data/traderlink-platform.sqlite`, evidence, upload staging and
    backup directories without placing private data in the image or Git.
13. Complete database integrity, one-writer, backup/restore, authentication,
    account-isolation, desktop/mobile and PWA checks before owner acceptance.
14. Invite no Discord users until the owner accepts the exact Railway release.

## Press Release publication cutover

After `app.traderslink.pro` has passed its HTTPS, health and owner review
checks, configure the computer-run Press Release publisher with:

```text
NEWS_ARTICLE_API_URL=https://app.traderslink.pro/api/news/articles
NEWS_PUBLISH_TOKEN=<matching Railway protected value>
```

Railway sets `NEWS_PUBLIC_BASE_URL=https://app.traderslink.pro`. The publisher
uses its existing local OpenAI key to create an article, posts that completed
canonical article to Railway, then uses the `articleUrl` returned by Railway in
the appropriate Discord channel. It must not construct, retain, or substitute
a Vercel article URL after the cutover.

Before enabling ordinary Discord delivery, run one controlled publication that
verifies the accepted article, returned Railway public URL, dashboard channel
appearance and exact intended Discord-link payload without sending an
unapproved public channel message. Keep the existing Vercel pages available
for historical URLs; they no longer receive new published articles after this
cutover.

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
TRADERLINK_PLATFORM_PRESS_RELEASE_ACCESS=all_discord_members
```

`enabled` is the only value that exposes AI behavior. Production defaults to
`coming_soon` when the value is absent or invalid. Development defaults to
`enabled` so the concurrent Links implementation is not blocked. Activating AI
later requires a separate owner-approved release, provider/security acceptance
and an explicit Railway variable change.

The Press Release access value is explicit and fail-closed: any value other
than `all_discord_members` retains the existing Premium gate. It does not
change Watchlist access.

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
11. Configure the Press Release publisher endpoint, matching publisher token
    and Railway public-base URL; complete the controlled publication proof.
12. Verify Coming soon UI and blocked AI/Whop routes on desktop and mobile.
13. Prove backup/restore, monitoring and rollback.
14. Obtain final owner acceptance on the exact hosted release.
15. Announce the free beta to the TradersLink Discord only after acceptance.

## Stop conditions

Stop before traffic if Railway would run more than one writer, `/data` is
missing or ephemeral, startup would initialize or adopt an unknown database,
the release commit is dirty or ambiguous, Discord membership is not verified,
ordinary users can reach owner data, any AI/Whop route remains active, the
historical Vercel/Neon Press Release pages become unavailable, the Railway
publisher response does not supply the exact Discord article URL, backup/restore
cannot be proven, or private values appear in Git, logs, build output or chat.

## Acceptance evidence

- exact release commit and changed-file inventory;
- Railway project/environment/service identity without secret values;
- one replica, one `/data` volume and no overlapping writer;
- healthy startup with current migration count and database integrity;
- Discord owner sign-in plus separate normal-member account isolation;
- desktop and mobile Coming soon presentation;
- AI Chat, AI Review, AI cron and Whop route denial;
- root/`www` and historical Vercel/Neon Press Release pages remain available;
- a controlled local publisher run stores one canonical article on Railway and
  returns the exact `app.traderslink.pro` URL intended for Discord;
- `app.traderslink.pro` TLS, cookies, redirects and PWA behavior;
- current backup plus independent restore proof;
- final owner approval before the Discord announcement.
