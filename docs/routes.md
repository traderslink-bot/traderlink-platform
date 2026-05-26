# TradersLink Route Map

Last audited: 2026-05-25.

## Canonical Public Routes

- `/`: main homepage.
- `/academy`: Academy home.
- `/academy/...`: Academy courses, paths, and lessons.
- `/news`: News index.
- `/news/[ticker]`: ticker-specific stored article list.
- `/news/[ticker]/[slug]`: stored News article.
- `/intelligence`: Trader Intelligence home.
- `/intelligence/...`: imports, analytics, trades, review, coach, progress, admin, debug, and support routes.
- `/account`: account status.
- `/platform-readiness`: platform readiness.

## Intelligence Namespace

Trader Intelligence is canonical under `/intelligence`.

Important subroutes include:

- `/intelligence/upload-csv`
- `/intelligence/imports`
- `/intelligence/imports/[batchId]`
- `/intelligence/trades`
- `/intelligence/trades/[tradeId]`
- `/intelligence/trades/calendar`
- `/intelligence/trades/day-session/[sessionDate]`
- `/intelligence/review`
- `/intelligence/analytics`
- `/intelligence/coach`
- `/intelligence/progress`
- `/intelligence/admin`
- `/intelligence/debug/...`

## Legacy Redirects

Redirects live in `next.config.ts`. Keep old links redirecting rather than restoring duplicate top-level pages.

- `/workspace` -> `/intelligence`
- `/workspace/admin` -> `/intelligence/admin`
- `/analytics/:path*` -> `/intelligence/analytics/:path*`
- `/trades/:path*` -> `/intelligence/trades/:path*`
- `/imports/:path*` -> `/intelligence/imports/:path*`
- `/coach/:path*` -> `/intelligence/coach/:path*`
- `/review` -> `/intelligence/review`
- `/progress` -> `/intelligence/progress`
- `/upload-csv` -> `/intelligence/upload-csv`
- `/trader-intelligence` -> `/intelligence/trader-intelligence`
- `/import-dry-run` -> `/intelligence/import-dry-run`
- `/import-health` -> `/intelligence/import-health`
- `/import-trials` -> `/intelligence/import-trials`
- `/repair-wizard` -> `/intelligence/repair-wizard`
- `/review-cockpit` -> `/intelligence/review-cockpit`
- `/session-recap` -> `/intelligence/session-recap`
- `/compare-trades` -> `/intelligence/compare-trades`
- `/calibration` -> `/intelligence/calibration`
- `/onboarding` -> `/intelligence/onboarding`
- `/first-run` -> `/intelligence/first-run`
- `/debug/:path*` -> `/intelligence/debug/:path*`
- `/admin/broker-mappings` -> `/intelligence/admin/broker-mappings`
- `/coaching` -> `/intelligence/coach`

## Route Rules

- New Trader Intelligence pages go under `app/intelligence`.
- New News pages go under `app/news`.
- New Academy pages go under `app/academy`.
- Shared layout/navigation changes go through `src/components/site/site-shell.tsx`.
