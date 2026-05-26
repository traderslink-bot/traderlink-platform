# TradersLink Deployment

Last audited: 2026-05-25.

## Source Repo

- Permanent local repo: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`
- Git remote: `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`
- Current branch: `codex/news-on-live-academy`
- Upstream tracking branch: `origin/codex/news-on-live-academy`
- Current production commit at audit time: `7e6c5a4e50ef8f988fdbc2c43d5f985047853ace`
- Remote verification: that commit exists on `origin/codex/news-on-live-academy`.

Do not deploy from `C:\Users\jerac\Documents\TraderLink` directly. It is a
parent workspace. Sibling folders such as `website`, `trader-intelligence-v2`,
`trader-intelligence-v2-svg-qa`, and `deploy-candidates/*` are historical unless
they have been reconciled against the permanent repo and current production.

## Vercel Project

- Project name: `vercel-landing`
- Project id: `prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`
- Org/team id: `team_D1yNeyNl1qTvK0pAWMu5nTWY`
- Framework: Next.js
- Node version: `24.x`
- Root directory: project root (`.`). In `.vercel/project.json`, `settings.rootDirectory` is `null`, which maps to the repo root.
- Production aliases: `traderslink.pro`, `www.traderslink.pro`
- Current production deployment at audit time: `dpl_EKrvi1wn3BZvGt48xhr3xQFPDV2f`

The local `.vercel/project.json` link contains:

- `projectId`: `prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`
- `orgId`: `team_D1yNeyNl1qTvK0pAWMu5nTWY`
- `projectName`: `vercel-landing`
- `settings.rootDirectory`: `null`

## Deployment Mode

The latest production deployment was created by the Vercel CLI:

- Deployment source: `cli`
- Deployment command used: `npx vercel deploy --prod --yes`
- Deployment commit metadata:
  - ref: `codex/news-on-live-academy`
  - sha: `7e6c5a4e50ef8f988fdbc2c43d5f985047853ace`
  - message: `Establish TradersLink site source of truth`

The Vercel project API reports Git deployment creation as enabled, but no
production branch or Git repository binding was confirmed from the project
metadata. Treat production deploys as CLI-controlled until the Vercel dashboard
is explicitly configured and verified for Git-connected deploys.

Recommended branch policy:

- Short term: keep production deploys on `codex/news-on-live-academy` because
  that is the verified branch currently backing production.
- Longer term: promote this branch to `main` or merge it into `main`, configure
  Vercel production to track `main`, then update this document after one clean
  Git-connected production deployment is verified.

## Build

`vercel.json` sets:

- install: `npm ci`
- build: `npm run build:webpack`

Local verification before production-impacting changes:

```bash
npm run validate:academy-registry
npx tsc --noEmit
npm run lint
npm test
npm run build:webpack
```

## Safety Checklist

Before production deployment:

1. Work from `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
2. Confirm `git status --short --branch` is clean except for intentional changes.
3. Confirm `git remote -v` points at the expected GitHub repo.
4. Confirm the current branch and upstream are intended.
5. Confirm the intended commit exists on the remote with `git ls-remote`.
6. Confirm `.vercel/project.json` points to `vercel-landing`.
7. Confirm local HEAD is based on the intended production commit.
8. Confirm no stale top-level legacy Intelligence pages were recreated.
9. Confirm Academy progress slug validation passes.
10. Confirm required production env vars exist in Vercel without printing secret values.
11. Do not deploy from a dirty or ambiguous worktree.

## Environment Dependencies

Production currently has these env var keys configured in Vercel. Values were
not printed or copied:

- `ACADEMY_DATABASE_URL`
- `DATABASE_URL`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_INVITE_URL`
- `DISCORD_REDIRECT_URI`
- `NEWS_PUBLISH_TOKEN`

The app may also read these optional keys when present:

- `DISCORD_GUILD_ID`
- `NEWS_DATABASE_URL`
- `NEWS_PUBLIC_BASE_URL`

Never paste secret values into docs or chat transcripts.
