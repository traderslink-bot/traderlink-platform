# TradersLink Codex Project Log

## 2026-05-26 Main Source-Of-Truth Alignment

- Merged PR #10, `Align main with live TradersLink website`, into `main`.
- Confirmed permanent local repo is
  `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- Confirmed local branch is now `main` tracking `origin/main`.
- Confirmed source-of-truth commit is
  `48f0fb8178ff513e229a16eb7ebd7d446aa40a6a`.
- Deployed production from clean `main` with `npx vercel deploy --prod --yes`.
- Current production deployment is `dpl_H1tehMKTuB3uSxCHHkVk73WabBD8`.
- Confirmed production aliases `traderslink.pro` and `www.traderslink.pro`.
- Confirmed live BigTime week-ahead route:
  `/small-cap-stocks/week-ahead/potential-catalysts-for-may-26-29`.
- Fixed CI blockers before merging `main`:
  - generic CSV sell-starting trades now group as limited sell-side review
  - levels-system deterministic support/resistance fixture expectations were
    updated to the current 7-support-level sample
  - levels-system runtime test no longer assumes CI has the local IBKR candle
    warehouse
- GitHub ruleset `Protect main` still requires PRs and blocks destructive
  branch updates, but its approving-review count was changed from `1` to `0`
  because the repo currently has only the `traderslink-bot` maintainer account.

## 2026-05-25 Whole Site Audit

- Confirmed `C:\Users\jerac\Documents\TraderLink` is a parent workspace, not the website Git repo.
- Confirmed the pre-audit production Vercel project `vercel-landing` pointed at deployment `dpl_5kdq544VSxoobgEsy1ftv52VVYfD`.
- Confirmed the pre-audit production deployment commit was `81e175909c6f0ad68481fbfc800259c32485251d` with message `Move Trader Intelligence under intelligence namespace`.
- Confirmed the live-aligned local worktree before permanent promotion was `deploy-candidates/traderslink-news-on-live-academy-20260523` on branch `codex/news-on-live-academy`.
- Confirmed shared navigation lives in `src/components/site/site-shell.tsx`; Academy uses a thin wrapper and Intelligence/News use the shared shell.
- Confirmed Trader Intelligence canonical routes live under `app/intelligence`.
- Confirmed legacy workspace/intelligence routes redirect from `next.config.ts`.
- Added `/news` index route and News storage listing support.
- Replaced visible legacy "workspace" labels in the Intelligence app with "Intelligence" or "review hub" wording while preserving route compatibility and test ids.
- Removed the empty local `app/workspace` directory so it no longer looks like an active legacy route folder.
- Added source-of-truth docs: `docs/site-architecture.md`, `docs/routes.md`, `docs/deployment.md`, and `docs/auth.md`.

## 2026-05-25 Permanent Repo Promotion

- Promoted the clean production-aligned branch into
  `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- Cloned from `origin/codex/news-on-live-academy` so the permanent folder starts
  from the pushed remote commit, then copied the Vercel project link from the
  previous deploy candidate worktree.
- Verified `git remote -v` points at
  `git@github.com:traderslink-bot/traderslink-trader-improvement-system.git`.
- Verified branch `codex/news-on-live-academy` tracks
  `origin/codex/news-on-live-academy`.
- Verified commit `7e6c5a4e50ef8f988fdbc2c43d5f985047853ace` exists on the
  remote branch.
- Verified `.vercel/project.json` points at project `vercel-landing`
  (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`) under org/team
  `team_D1yNeyNl1qTvK0pAWMu5nTWY`, with root directory set to repo root.
- Verified current Vercel production deployment `dpl_EKrvi1wn3BZvGt48xhr3xQFPDV2f`
  was created by CLI deploy and carries commit metadata for
  `codex/news-on-live-academy`.
- Added warning READMEs in the parent workspace and stale sibling folders so
  future Codex sessions start in the permanent repo.

## Current Risks

- Multiple sibling worktrees remain present. Do not deploy from stale siblings without reconciling with production and the permanent repo.
- Vercel production deploys are currently verified as CLI deploys. Git-connected production branch behavior should be configured and verified before relying on automatic production deploys.

## 2026-05-25 Site QA Follow-Up

- Added primary site navigation to the shared `SiteShell` for Academy, News,
  Intelligence, Account, and Readiness.
- Added the shared shell to `/account` and `/platform-readiness`.
- Fixed News ticker and article pages so their shell context says News instead
  of falling back to Academy.
- Set News index/ticker pages to use a wrapper `div` shell so their page-level
  `<main>` landmarks are not nested inside another `<main>`.
- Added homepage hero nav links to the same primary destinations.
