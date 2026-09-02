# Workspace News Scanner Card Plan

## Purpose

Add a compact, read-only **News Scanner** card to Workspace for traders who
already have News Scanner access. It complements Workspace without turning the
Workspace load into a full news-feed request.

Progress is tracked in
[workspace-news-scanner-card-progress.md](./workspace-news-scanner-card-progress.md).

## Owner-approved experience

1. The card shares the compact Workspace-card grid with Current Focuses and
   Rules Broken.
2. It shows six recent News Scanner articles. Each row contains a ticker and a
   one-line headline that truncates rather than increasing the card height.
3. Selecting an article opens the same article reader drawer already used by
   News Scanner. It does not navigate away from Workspace.
4. **View more** opens a larger, embedded Workspace News Scanner list. Closing
   that list returns the trader to the existing Workspace state.

## Data and performance boundary

- Workspace's server render does not load card articles.
- The visible card makes one client request for at most six current
  `news_filtered` articles after it is rendered.
- **View more** is an on-demand request for a bounded larger list only.
- All reads use the existing News Scanner entitlement and the server-owned
  identity scope. There is no browser-side article filtering or cross-user
  read.
- The article reader is extracted for reuse; the full existing News Scanner
  page and Workspace do not maintain separate reader implementations.

## Implementation steps

1. Extract the existing article reader drawer into a reusable News component.
2. Add an entitlement-gated, bounded Workspace scanner endpoint.
3. Add the compact Workspace card and on-demand embedded list, both using the
   shared reader.
4. Wire the card into the existing compact Workspace-card grid and preserve
   Calendar/Workspace return behavior.
5. Review light/dark tokens, text truncation, access gating, lazy data reads,
   and source-level integration safeguards before visual review.

## Out of scope

- New article ingestion, scanner criteria, entitlement rules, notification
  behavior, or a general Workspace-card preference system.
- Changes to the full News Scanner route, other than extracting its existing
  reader for reuse.
- Production release; that remains a separate owner and Release Coordinator
  decision after visual approval.
