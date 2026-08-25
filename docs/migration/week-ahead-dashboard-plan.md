# Week Ahead Dashboard Plan

**Status:** Owner-approved implementation

**Progress:** [Week Ahead Dashboard Progress](week-ahead-dashboard-progress.md)

## Outcome

Keep the BigTime source scrape and AI structuring on the owner's Windows computer, but publish the completed weekly issue directly to Railway. GitHub, Vercel, pull requests and deploys are not part of the Sunday publishing path.

## Owner-approved product contract

- The dashboard navigation group is **Market News**.
- **The Week Ahead** is a dashboard-only page inside Market News.
- It shows one current weekly issue: the week range, concise overview, dated catalysts, conferences and market-schedule notes.
- A new issue replaces the visible prior issue. Older records remain private recovery history and are not shown as an archive.
- Every active dashboard member receives an in-app notification when a new issue is accepted. Device Push is optional and off unless the member enables **The Week Ahead** in Notification settings.
- The job remains local because the BigTime source is accessed from the owner's connection. Railway owns saved issue data and rendering.
- The page is not public or search-indexed.

## Implementation boundaries

- A dedicated protected Railway endpoint accepts one structured issue. It uses `WEEK_AHEAD_PUBLISH_TOKEN` when configured and otherwise the already-protected local/Railway `NEWS_PUBLISH_TOKEN`; it is not the general Press Release publisher.
- News owns the current/versioned issue records. Platform owns the user-scoped notification and device-push preference.
- The job's local state remains its duplicate guard. The scheduled runner no longer reads, changes, commits or pushes a Git checkout, and no longer deploys Vercel.
- News Scanner and existing market-cap Press Release channels remain unchanged.

## Release order

1. Apply the News table migration.
2. Apply the Platform notification-category migration.
3. Set the protected Railway and local publisher variables, update the Scheduled Task runner, then perform a non-publishing endpoint check.
4. The first real source issue is the final end-to-end proof; no synthetic issue will be inserted.
