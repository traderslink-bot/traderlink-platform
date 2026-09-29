# Swings Watchlist

Owner approved: a `Swings` choice beside the existing Watchlist types, available when adding tickers and moving existing tickers, with its own Admin/member list section. This is grouping only, not a new analysis model, trading plan, entitlement or notification policy.

Complete scope: Runtime group types, add/move/clear validation, store normalization, persistence reload, session-group resolution, published payload and audit retention; Platform stored group normalization, member grouping and rendering; Admin add/move options, list container/count/empty state and existing clear-list behavior; Help.

Preserve ticker notes, approval history, analysis, initial tracking values and existing notification behavior during moves. Do not infer group from holding duration. No schema migration, paid request or hosted ticker changes needed.

QA review: explicit Swings must survive session fallback and persistence; must not appear in Main/Post-Market merely because of add time; movement remains bidirectional through the existing action; existing lists retain their labels and behavior. Reuse current responsive layout, no new navigation/page.

Progress: [watchlist-swings-progress.md](watchlist-swings-progress.md).


Owner-approved General/Swings tooltip follow-up: [progress](watchlist-group-tooltips-progress.md). Implemented locally; deployment and visual acceptance pending.


Dated Top Watches is a separate owner-approved grouping: [plan](watchlist-top-watches-plan.md) and [progress](watchlist-top-watches-progress.md). Swings behavior remains unchanged.


Related approved Main Session tooltip: [progress](watchlist-main-session-tooltip-progress.md).
