# TradersLink Site Architecture

Last audited: 2026-05-25.

This repo is the permanent local source of truth for the full TradersLink
website/app:

`C:\Users\jerac\Documents\TraderLink\traderslink.pro`

As of 2026-05-25, production Vercel deployment
`dpl_EKrvi1wn3BZvGt48xhr3xQFPDV2f` uses commit
`7e6c5a4e50ef8f988fdbc2c43d5f985047853ace` from
`codex/news-on-live-academy`.

## Source Of Truth

- Production project: Vercel `vercel-landing`.
- Production aliases: `https://traderslink.pro` and `https://www.traderslink.pro`.
- Local permanent repo: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- Historical deploy candidate used before promotion: `deploy-candidates/traderslink-news-on-live-academy-20260523`.
- Do not deploy from `C:\Users\jerac\Documents\TraderLink` directly; it is a parent workspace, not a Git repo.
- Do not deploy from stale siblings such as `website`, `trader-intelligence-v2`, or detached QA worktrees unless they are explicitly reconciled with production first.

## App Shape

- `app/page.tsx`: public homepage.
- `app/academy`: Academy course, path, lesson, progress, and auth-aware pages.
- `app/news`: News index, ticker pages, and article pages.
- `app/intelligence`: Trader Intelligence app, including former workspace, analytics, imports, review, coach, progress, and trades surfaces.
- `app/account`: account/status page.
- `app/platform-readiness`: platform readiness page.
- `app/api`: public API routes for auth, Academy progress, News publishing, and Intelligence data.

## Shared Shell

The site-wide navigation shell is `src/components/site/site-shell.tsx`, re-exported by `app/site-shell.tsx`. It owns the shared TradersLink topbar, primary section links, auth status, mobile menu, active section state, and light/dark theme toggle.

- Academy uses `app/academy/academy-shell.tsx` only as a compatibility wrapper around `SiteShell`.
- Intelligence uses `app/intelligence/layout.tsx` and `SiteShell`.
- News pages import `SiteShell` directly.
- Account and Platform Readiness use `SiteShell` directly.
- The homepage keeps its immersive hero navigation, but it should mirror the same primary destinations.
- Future nav changes belong in `src/components/site/site-shell.tsx` and shared CSS, not feature-specific shells.

## Risks

- The parent folder contains multiple historical candidates and worktrees. Always verify `.vercel/project.json`, `git status`, and Vercel's latest production deployment metadata before deployment.
- Academy progress is production data; see `docs/academy-progress-preservation.md`.
- News and Academy storage depend on database env vars in production; local SQLite fallback is for development only.
