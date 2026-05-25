# TradersLink Deployment

Last audited: 2026-05-25.

## Vercel Project

- Project name: `vercel-landing`
- Project id: `prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`
- Team id: `team_D1yNeyNl1qTvK0pAWMu5nTWY`
- Framework: Next.js
- Node version: `24.x`
- Production aliases: `traderslink.pro`, `www.traderslink.pro`
- Current production deployment at audit time: `dpl_5kdq544VSxoobgEsy1ftv52VVYfD`
- Current production commit at audit time: `81e175909c6f0ad68481fbfc800259c32485251d`

## Build

Vercel uses:

- install: `npm ci`
- build: `npm run build:webpack`

Local verification:

```bash
npm run validate:academy-registry
npm run lint
npm test
npm run build:webpack
```

## Safety Checklist

Before production deployment:

1. Confirm `git status --short --branch` is clean except for intentional changes.
2. Confirm `.vercel/project.json` points to `vercel-landing`.
3. Confirm local HEAD is based on the intended production commit.
4. Confirm no stale top-level legacy Intelligence pages were recreated.
5. Confirm Academy progress slug validation passes.
6. Confirm required production env vars exist in Vercel without printing secret values.
7. Do not deploy from a dirty or ambiguous worktree.

## Environment Dependencies

Production needs storage and auth configuration:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_GUILD_ID` if overriding the default guild id
- `DISCORD_REDIRECT_URI` if overriding the origin-derived callback
- `ACADEMY_DATABASE_URL` or `DATABASE_URL` for Academy progress
- `NEWS_DATABASE_URL`, `ACADEMY_DATABASE_URL`, or `DATABASE_URL` for News storage
- `NEWS_PUBLISH_TOKEN` for production News publishing
- `NEWS_PUBLIC_BASE_URL` when publish responses need a fixed public origin

Never paste secret values into docs or chat transcripts.
