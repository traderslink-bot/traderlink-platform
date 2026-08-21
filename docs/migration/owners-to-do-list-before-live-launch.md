# owners to do list before live launch

**Owner checklist status:** free-beta setup underway

**Recommended app address:** `https://app.traderslink.pro`

**Last reviewed:** 2026-08-12

> **2026-08-21 free beta decision:** The owner approved
> [the Railway free Discord beta plan](railway-free-discord-beta-launch-plan.md).
> `app.traderslink.pro` is approved for owner testing and the later Discord
> beta. The dashboard has no monthly plan during this launch. Whop, Railway-
> hosted OpenAI, and AI Review scheduled-job sections below are deferred
> future-activation work, not launch blockers. The separate computer-run Press
> Release publisher continues to require its local OpenAI configuration to
> create article content. Existing Press Release and Watchlist product access
> rules remain unchanged.

## Current owner-only checklist for the free Discord beta

These are the only owner actions still required for the approved free beta.
The longer sections below remain the detailed reference for this launch and
later feature activation.

- [x] Activate Railway Pro and authorize Codex through Railway OAuth.
- [ ] Enable Railway multi-factor authentication and privately save the
  recovery codes.
- [ ] Enable multi-factor authentication on the Discord account that owns the
  TradersLink server and privately save the recovery codes.
- [ ] Create or select the TraderLink Platform Discord OAuth application and
  register `https://app.traderslink.pro/api/auth/discord/callback`.
- [ ] Enter the Discord Client ID and Client Secret directly in Railway when
  Codex identifies the protected variable fields. Never paste the secret in
  chat.
- [ ] Privately provide or enter the owner Discord User ID, TradersLink Server
  ID, permanent server invite, and Premium Role ID if the existing
  Press Release or Watchlist access rule needs it.
- [ ] Choose the support and deployment-alert recipient.
- [ ] Review the Privacy Policy, Terms of Service, data-retention statement,
  account-deletion instructions, and support contact before Discord members
  are invited.
- [ ] Add only the `app.traderslink.pro` DNS record Railway supplies. Do not
  change the `traderslink.pro` or `www.traderslink.pro` records.
- [ ] Sign in once after the Railway app is online so Codex can complete the
  one-time owner link and admin grant verification.
- [ ] Review the desktop and mobile Railway app, approve the beta opening, and
  then announce it to the TradersLink Discord.

Codex owns the code release, Railway project and service, one `/data` volume,
protected values it can generate, database preparation, migrations, health
checks, backups and restore proof, browser verification, and rollback record.
Whop, Railway-hosted OpenAI, AI Review schedules, and monthly dashboard-plan
setup are not part of this free-beta launch. The computer-run Press Release
publisher is separate: it retains its local OpenAI key and needs the matching
Railway `NEWS_PUBLISH_TOKEN` only when its article endpoint moves to Railway.

This is the single checklist for the account, billing, identity, provider, and
approval work that only the owner can complete before TraderLink Platform goes
live. Codex has Railway access and should perform every Railway task it can,
including project and service configuration, variables, volume, deployment,
backups, schedules, domain setup, database transfer, migrations, verification,
and release tests. Railway access does not replace owner approval for a
production deployment, data transfer, DNS cutover, or paid service purchase.

> **Never paste a password, API key, OAuth secret, webhook secret, recovery
> code, broker identifier, statement, or database into this file, GitHub, or
> chat.** Enter secrets directly in the provider's protected settings page.
> Codex may generate and enter production security values directly in Railway.
> If only you can retrieve a provider secret, paste it directly into Railway or
> use an agreed secure handoff; never place it in chat or project files.

## The important decisions

- [x] Approve `app.traderslink.pro` as the dashboard address. This keeps the
  current public website on `traderslink.pro` and `www.traderslink.pro` while
  the complete app runs on Railway.
- [x] Approve owner testing first, followed by a free beta for all authenticated
  members of the TradersLink Discord server.
- [ ] Include direct Moomoo connection as a priority invited-beta feature for
  selected Moomoo users. The live beta is where provider behavior, corrections,
  larger histories, recovery, and the final sync cadence must be proven.
- [ ] Decide who receives launch alerts and support requests.
- [ ] Decide the beta launch date only after every **Launch blocker** below is
  checked.

## Discord admin login: no bot is required

The current app uses Discord OAuth to identify you and confirm that you still
own the TradersLink Discord server. It requests the user scopes `identify`,
`guilds`, and `guilds.members.read`.

- **Do not create or invite a Discord bot.**
- **Do not create a bot token.**
- A bot would only be needed later for proactive Discord commands or messages;
  that is not part of the current admin-login design.
- Email/password admin login is intentionally not part of this launch.

### Your Discord steps - Launch blocker

- [ ] Sign in to the exact Discord account that owns the TradersLink server.
- [ ] Turn on multi-factor authentication for that Discord account and save
  recovery codes somewhere private.
- [ ] Open [Discord Developer Applications](https://discord.com/developers/applications)
  and create or select the TraderLink Platform OAuth application.
- [ ] In **OAuth2**, add this exact redirect:
  `https://app.traderslink.pro/api/auth/discord/callback`
- [ ] Make the OAuth **Client ID** and **Client Secret** available through an
  agreed secure handoff, or paste them directly into Railway if only you can
  retrieve them. Codex will verify `DISCORD_CLIENT_ID` and
  `DISCORD_CLIENT_SECRET` in the deployed service without revealing them.
- [ ] Enable Discord Developer Mode and copy your **User ID**, the TradersLink
  **Server ID**, and, if Watchlist Premium uses a Discord role, the exact
  **Premium Role ID**. Use Discord's
  [ID instructions](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID).
- [ ] Make the Discord IDs available through the agreed private setup method,
  or enter them directly in Railway if preferred. Codex will configure and
  verify `TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT`,
  `DISCORD_GUILD_ID`, and `TRADERSLINK_PREMIUM_DISCORD_ROLE_ID` without
  exposing their values.
- [ ] Create or confirm a permanent TradersLink server invite. Codex will
  configure it as `DISCORD_INVITE_URL` through Railway access.
- [ ] After the Railway app is online, sign in once with Discord and approve
  the requested scopes.
- [ ] Tell Codex that the first Discord sign-in is complete. Codex will preview
  and perform the one-time seeded-owner identity link, then preview and create
  the single server-side `journal_owner_admin` grant.
- [ ] Re-authenticate and confirm that `/admin/journal` opens for you and stays
  unavailable to a normal invited-beta account.

Admin access requires all three facts at the same time: your linked Discord
identity, fresh proof that the same Discord account owns the configured server,
and the single active server-side admin grant. Discord Premium status,
workspace ownership, or the admin grant by itself is not enough.

Helpful Discord reference:
[OAuth2 and permissions](https://docs.discord.com/developers/platform/oauth2-and-permissions).

## Railway account and service - Launch blocker

### Your Railway owner-only tasks

- [ ] Open the [Railway dashboard](https://railway.com/dashboard), confirm the
  correct business workspace, and add or approve the valid payment method.
- [ ] Enable Railway
  [multi-factor authentication](https://docs.railway.com/access/multi-factor-authentication)
  and store recovery codes privately.
- [ ] Confirm Codex has access to the correct Railway workspace and permission
  to manage the TraderLink project, services, variables, volumes, deployments,
  backups, schedules, and domains.
- [ ] Do not share your Railway password, recovery codes, or a broad account
  token. Codex should use its authorized Railway access; if automation later
  needs a token, use only a narrow project-scoped token.

### Railway layout Codex will configure

- [x] Codex created one `TraderLink Platform` Railway project and one
  `production` environment.
- [ ] Codex connects only the official
  [TraderLink Platform repository](https://github.com/traderslink-bot/traderlink-platform).
- [x] Codex created one empty `traderlink-platform-web` application service;
  it will be connected to the approved clean
  `main` release commit.
- [ ] Codex sets the deployment to **exactly one replica**. Never enable horizontal
  scaling while SQLite is the database.
- [x] Codex attached exactly one ready persistent 50 GB volume at `/data`.
- [ ] Codex disables app sleeping.
- [ ] Codex keeps deployment overlap at zero and the drain window at 30 seconds.
- [ ] Codex confirms the health-check path is `/api/platform/health`.
- [ ] Codex verifies that no second service is attached to the volume.

Railway references:
[variables](https://docs.railway.com/variables),
[volumes](https://docs.railway.com/volumes/reference),
[health checks](https://docs.railway.com/deployments/healthchecks), and
[volume backups](https://docs.railway.com/volumes/backups).

### Values Codex will configure in Railway

Codex will use Railway's protected **Variables** page. The value column below
explains where the value comes from; it is not a place to record the value.
You remain responsible only for creating or retrieving provider-owned values
that Codex cannot obtain. Codex will enter or verify the complete set in
Railway through its authorized access.

| Railway variable | Where the value comes from |
|---|---|
| `NODE_ENV` | Enter `production`. |
| `TRADERLINK_PLATFORM_STORAGE_BACKEND` | Enter `sqlite_single_node`. |
| `TRADERLINK_PLATFORM_DB_PATH` | Enter `/data/traderlink-platform.sqlite`. |
| `TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT` | Enter `/data/evidence-vault`. |
| `TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT` | Enter `/data/upload-staging`. |
| `TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT` | Enter `/data/backups`. |
| `TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON` | Enter `["/data/backups"]`. |
| `RAILWAY_RUN_UID` | Enter `0`; this is required by the accepted Railway volume layout. |
| `DISCORD_CLIENT_ID` | Discord Developer Portal OAuth2 page. |
| `DISCORD_CLIENT_SECRET` | Discord Developer Portal OAuth2 page; secret. |
| `DISCORD_GUILD_ID` | TradersLink Discord Server ID. |
| `DISCORD_REDIRECT_URI` | Enter `https://app.traderslink.pro/api/auth/discord/callback`. |
| `DISCORD_INVITE_URL` | Permanent invite for the TradersLink server. |
| `TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT` | Your Discord User ID. |
| `TRADERSLINK_PREMIUM_DISCORD_ROLE_ID` | Premium Role ID, if this gate is enabled. |
| `TRADERSLINK_WHOP_PRODUCT_URL` | Public Whop product or checkout URL. |
| `NEWS_PUBLIC_BASE_URL` | Enter the accepted public News URL. |
| `OPENAI_API_KEY` | OpenAI project API key; secret. |
| `CRON_SECRET` | Codex generates; secret. |
| `WHOP_API_KEY` | Whop company API key; secret. |
| `WHOP_WEBHOOK_SECRET` | Whop webhook settings; secret. |
| `WHOP_COMPANY_ID` | Whop company identifier. |
| `WHOP_AI_REVIEWS_PRODUCT_IDS` | Exact comma-separated AI Reviews product allowlist. |
| `WHOP_AI_REVIEWS_CHECKOUT_URL` | Accepted AI Reviews checkout URL. |
| `WHOP_BILLING_PORTAL_URL` | Accepted customer billing-management URL. |
| `WHOP_OAUTH_CLIENT_ID` | Whop OAuth application client ID. |
| `WHOP_OAUTH_REDIRECT_URI` | Enter `https://app.traderslink.pro/api/billing/whop/callback`. |
| `WHOP_API_VERSION_DATE` | Exact version date shown by the accepted Whop webhook/API setup; Codex verifies it matches the app before launch. |
| `TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY` | Codex generates; secret. |
| `TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON` | Codex generates the versioned key map; secret. |
| `TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION` | Active version supplied by Codex. |
| `TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON` | Codex generates the versioned key map; secret. |
| `TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION` | Active version supplied by Codex. |
| `TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN` | Codex generates if the hosted Watchlist publisher is enabled; secret. |
| `NEWS_PUBLISH_TOKEN` | Codex generates if the hosted News publisher is enabled; secret. |
| `TRADERLINK_MOOMOO_OAUTH_CLIENT_ID` | Production Moomoo OAuth application client ID. |
| `TRADERLINK_MOOMOO_CREDENTIAL_ACTIVE_KEY_VERSION` | Active encryption-key version supplied by Codex. |
| `TRADERLINK_MOOMOO_CREDENTIAL_KEYS_BASE64` | Codex generates the versioned 32-byte credential-encryption key map; secret. |

Railway supplies `PORT` and `RAILWAY_VOLUME_MOUNT_PATH`; do not create or
override them.

Do **not** add `DATABASE_URL`, `POSTGRES_URL`, `ACADEMY_DATABASE_URL`,
`LIVE_WATCHLIST_DATABASE_URL`, `NEWS_DATABASE_URL`, or
`AFFILIATE_REFERRAL_DATABASE_URL` to the normal production service. Do not add
legacy V3 paths. Temporary source-transfer variables are maintenance-only and
must be removed before the service is reopened.

## Whop paid access and billing - Launch blocker for paid AI Reviews

- [ ] Open the [Whop dashboard](https://whop.com/dashboard) and confirm the
  correct business/company account, payout details, tax/KYC requirements, and
  support contact.
- [ ] Create or confirm the AI Reviews product, price, billing interval, trial
  terms, cancellation wording, refund policy, and checkout page.
- [ ] Give Codex the exact product ID so Codex can configure Railway's
  `WHOP_AI_REVIEWS_PRODUCT_IDS` allowlist. Do not use a broad company-wide
  entitlement rule.
- [ ] Create a company API key from the Whop developer area and make it
  available through the agreed secure handoff, or paste it directly into
  Railway if only you can retrieve it. Codex will verify `WHOP_API_KEY`. See the
  [Whop API quickstart](https://docs.whop.com/developer/api/quickstart).
- [ ] Create the TraderLink Whop OAuth application and register this exact
  redirect: `https://app.traderslink.pro/api/billing/whop/callback`. See
  [Whop OAuth](https://docs.whop.com/developer/guides/oauth).
- [ ] Create a webhook with this exact destination:
  `https://app.traderslink.pro/api/webhooks/whop`.
- [ ] Subscribe it to `membership.activated`, `membership.deactivated`,
  `membership.cancel_at_period_end_changed`, and `payment.failed`.
- [ ] Make the webhook secret available through the agreed secure handoff, or
  paste it directly into Railway if only you can retrieve it. Codex will verify
  `WHOP_WEBHOOK_SECRET`. See
  [Whop webhooks](https://docs.whop.com/developer/guides/webhooks).
- [ ] Create or confirm the checkout link and billing-management link, then
  give the URLs to Codex to configure in Railway. See
  [Whop checkout links](https://docs.whop.com/manage-your-business/payment-processing/create-checkout-link).
- [ ] Buy the product with one controlled test customer and let Codex verify
  activation, duplicate delivery, cancellation at period end, payment failure,
  deactivation, relinking, and reconciliation before accepting real customers.
- [ ] Confirm that the wording on the sales page exactly matches the product,
  price, trial, cancellation, refund, and AI Review limits configured in Whop.

If paid AI Reviews is not ready, leave its Admin master switch off and do not
advertise it as live. The rest of the Journal can launch without pretending
paid AI Reviews is active.

## OpenAI for AI Reviews - Launch blocker only if AI Reviews launches

- [ ] Open [OpenAI API keys](https://platform.openai.com/api-keys), use a
  dedicated TraderLink production project, and create a server-side key.
- [ ] Make the key available through the agreed secure handoff, or paste it
  directly into Railway if only you can retrieve it. Codex will verify
  `OPENAI_API_KEY`; never put it in browser code, Git, this checklist, or chat.
- [ ] Confirm API billing is active and set an owner-approved project budget
  and usage alert in the OpenAI platform.
- [ ] In TraderLink Admin, leave the AI Reviews master switch off until Codex
  verifies the selected model, all four price classes, per-subscriber limit,
  warning threshold, emergency stop, and one controlled hosted generation.

## Scheduled jobs - Launch blocker for each enabled feature

Railway cron jobs are separate short-lived services. The main web service must
remain the only database writer service attached to `/data`, so the accepted
schedule should call the protected HTTPS routes instead of mounting the
database volume in another process.

- [ ] Approve the final UTC schedule Codex proposes for each enabled route:
  `/api/cron/ai-review-calendar`, `/api/cron/ai-reviews`,
  `/api/cron/journal-ai-import-repair`, and
  `/api/cron/moomoo-execution-import`.
- [ ] Codex configures the endpoint caller with
  `Authorization: Bearer <CRON_SECRET>` without exposing the value.
- [ ] Confirm each job has failure alerts and that retries cannot overlap.
- [ ] Keep AI Reviews issuance disabled until its hosted acceptance gates pass.
- [ ] Enable the Moomoo import job for the selected invited-beta users after
  Codex verifies production OAuth, encrypted credential storage, read-only
  permissions, account mapping, bounded writes, alerts, and safe retry behavior.

Reference: [Railway cron jobs](https://docs.railway.com/cron-jobs).

## Domain and DNS - Launch blocker

- [ ] Codex first verifies the Railway-provided HTTPS address and health
  endpoint before changing DNS.
- [ ] Codex adds the custom domain `app.traderslink.pro` in Railway.
- [ ] Open the DNS manager for `traderslink.pro` and add the exact CNAME and
  verification record Railway displays. Do not change the root or `www`
  records during this step.
- [ ] Codex waits for Railway to show the domain and certificate as active.
- [ ] Codex rechecks every Discord and Whop callback/webhook URL against the
  final hostname before inviting users.
- [ ] Codex verifies secure cookies, redirects, sign-out, account isolation,
  and no secret or identity leakage on the final HTTPS address.

Reference: [Railway custom domains](https://docs.railway.com/networking/domains/working-with-domains).

## Backups, monitoring, and recovery - Launch blocker

- [ ] Codex enables Railway volume backups with daily, weekly, and monthly
  retention.
- [ ] Approve the off-host encrypted backup destination and retention period.
  Railway volume backups alone are not independent disaster recovery.
- [ ] Give Codex approval for a clean-environment restore drill using a backup
  that contains no unauthorized test data.
- [ ] Choose the email/phone destination for uptime and failure alerts.
- [ ] Approve an external uptime check for
  `https://app.traderslink.pro/api/platform/health`; Railway's deployment
  health check is not continuous monitoring.
- [ ] Record who can declare an incident, disable paid AI generation, restore
  a backup, and approve a rollback.

## Customer and business readiness - Launch blocker

- [ ] Review and publish the correct Privacy Policy, Terms of Service, refund
  policy, support contact, data-retention statement, and account-deletion
  instructions for the hosted product.
- [ ] Confirm the product explains that trading data is sensitive, what AI
  receives, when full-statement review is opt-in, and what is retained.
- [ ] Confirm all paid claims, included features, usage limits, pricing, and
  beta limitations match the actual live configuration.
- [ ] Prepare an invited-beta user list and a support response process.
- [ ] Decide whether News and Watchlist publishers are enabled at launch. If
  enabled, authorize their production tokens and verify their computer-run
  publishers target the final host.
- [ ] Review account deletion with one disposable account before real users
  are admitted. Do not use the production owner account for this test.

## Moomoo direct connection - priority invited-beta feature

Direct Moomoo connection is one of the most important invited-beta features.
Its local safety and workflow proofs are complete enough to prepare the hosted
beta, while its remaining live-provider, correction, high-volume history,
recovery, and cadence evidence must be collected from controlled beta use. Those
remaining evidence gates limit unrestricted public release; they are not a
reason to exclude Moomoo from the invited beta.

- [ ] Approve direct Moomoo connection for the invited beta.
- [ ] Choose a small first group of Moomoo beta users, including at least one
  representative high-fill or multi-year account when available.
- [ ] Create or approve the production Moomoo OAuth client and register this
  exact callback: `https://app.traderslink.pro/api/connections/moomoo/callback`.
- [ ] Give Codex the production OAuth client ID through the agreed private
  setup method so Codex can configure and verify it in Railway.
- [ ] Confirm the requested provider access is read-only. It must never request
  order placement, modification, cancellation, or other trading authority.
- [ ] Let each beta user deliberately select the destination Journal account
  and first execution date; never infer or silently change either choice.
- [ ] Test connection, account selection, initial history, incremental import,
  progress, disconnect, reconnect, retry, and failure recovery with beta users.
- [ ] Ask beta users to report missing fills, duplicates, provider corrections,
  delayed updates, unexplained Data Decisions, and misleading coverage.
- [ ] Include a controlled high-fill or multi-year pagination and recovery test.
- [ ] Review Codex's beta evidence and approve the final incremental-sync
  cadence. If representative history cannot be proven reliable, approve a
  clearly disclosed recent-history limit and keep statement import available
  for older records.
- [ ] Do not enter a Moomoo password or broker account identifier into Railway,
  Git, this file, or chat.

## What Codex must do after your account setup

Do not try to perform these data/security operations manually. Tell Codex when
the provider accounts and non-secret choices above are ready.

- [ ] Reconcile the repository into a clean, reviewed release commit and run
  the final acceptance checks.
- [ ] Generate the production HMAC/encryption key material and `CRON_SECRET`
  and enter them directly in Railway without exposing them in chat or project
  files.
- [ ] Stop the service, create the protected `/data` directories, transfer only
  approved production data/evidence, apply the current migration manifest, and
  verify integrity, foreign keys, ownership, account isolation, and one writer.
- [ ] Remove every temporary source-transfer credential before reopening the
  service.
- [ ] Create the first hosted backup and prove an independent restore.
- [ ] Preview and execute the one-time Discord owner link and the one active
  `journal_owner_admin` grant after your first successful sign-in.
- [ ] Configure and verify protected schedules without attaching another
  writer to the SQLite volume.
- [ ] Run final browser acceptance on user settings, account deletion, all
  Journal features, owner Admin features, Whop states, mobile layouts, error
  paths, and the final domain.
- [ ] Produce the launch evidence record and rollback instructions before you
  approve invitations.

## Final owner go-live approval

Only check these after Codex supplies the launch evidence.

- [ ] The Railway service is one replica with one `/data` volume and no second
  writer.
- [ ] The final domain, Discord login, owner Admin access, normal-user denial,
  Settings, Whop billing, enabled scheduled jobs, backups, restore, monitoring,
  and rollback all pass.
- [ ] AI Reviews is either fully accepted or visibly off. Moomoo is clearly
  labeled as an invited-beta feature until its provider, correction,
  high-volume history, recovery, and final cadence evidence passes.
- [ ] No secret, raw Discord identity, broker identifier, statement name,
  payment data, or database has been placed in Git, chat, browser bundles, or
  public logs.
- [ ] I approve opening the invited beta.

## Private launch record (non-secret values only)

- Railway project name: `TraderLink Platform`
- Railway production environment name: `production`
- Final app hostname: `app.traderslink.pro`
- Discord OAuth application name: ______________________________
- Whop product name: ______________________________
- Alert recipient: ______________________________
- Invited-beta target date: ______________________________
- Final owner approval date: ______________________________

Do not record IDs, tokens, keys, passwords, recovery codes, customer data, or
broker information in this section.

## Controlling technical references

- [TraderLink Platform live-launch readiness](traderlink-platform-live-launch-readiness.md)
- [Hosted beta runbook](traderlink-platform-hosted-beta-runbook.md)
- [Journal Administration plan](journal-admin-dashboard-plan.md)
- [AI Reviews beta handoff](ai-reviews-beta-handoff.md)
- [Moomoo direct-connection progress](moomoo-direct-connection-progress.md)
