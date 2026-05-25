# TradersLink Codex Project Log

## 2026-05-25 Whole Site Audit

- Confirmed `C:\Users\jerac\Documents\TraderLink` is a parent workspace, not the website Git repo.
- Confirmed production Vercel project `vercel-landing` points at deployment `dpl_5kdq544VSxoobgEsy1ftv52VVYfD`.
- Confirmed production deployment commit is `81e175909c6f0ad68481fbfc800259c32485251d` with message `Move Trader Intelligence under intelligence namespace`.
- Confirmed live-aligned local worktree is `deploy-candidates/traderslink-news-on-live-academy-20260523` on branch `codex/news-on-live-academy`.
- Confirmed shared navigation lives in `src/components/site/site-shell.tsx`; Academy uses a thin wrapper and Intelligence/News use the shared shell.
- Confirmed Trader Intelligence canonical routes live under `app/intelligence`.
- Confirmed legacy workspace/intelligence routes redirect from `next.config.ts`.
- Added `/news` index route and News storage listing support.
- Replaced visible legacy "workspace" labels in the Intelligence app with "Intelligence" or "review hub" wording while preserving route compatibility and test ids.
- Removed the empty local `app/workspace` directory so it no longer looks like an active legacy route folder.
- Added source-of-truth docs: `docs/site-architecture.md`, `docs/routes.md`, `docs/deployment.md`, and `docs/auth.md`.

## Current Risks

- Multiple sibling worktrees remain present. Do not deploy from stale siblings without reconciling with production.
- Production deploy was not run during this audit.
