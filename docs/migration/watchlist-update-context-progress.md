# Analysis update notification progress

Implementation underway. Approved scope: [plan](watchlist-update-context-plan.md).

Parents: Platform a8a0a2e43ab014e578ae9d4ea0bd9841983b04c9; Runtime 6e08f2a313513830e6f00a1769abfe38b74a52e6. Preserve all unrelated working files.

Reserved migration: 0152_platform_watchlist_notification_update_context, order 152, predecessor 0151_platform_watchlist_x_publications. Adds nullable analysis_update_context_json to platform_watchlist_notification_events. No backfill, recipients or sends. Existing immutable trigger remains active.

Source implementation complete. Focused offline checkpoint passes: owner and automatic titles; positive/negative/unchanged/micro-price comparisons; first acknowledged analysis selection; trimmed automatic-history context; missing-price fallback; unchanged initial Discord post and link/audience suffix; additive SQLite migration in memory; immutable persisted context on duplicate events. Core copy/contract strict TypeScript and all changed TypeScript syntax checked. No broad builds or local servers.

Runtime freezes context with each new approved publication. Platform persists it once with the event and uses it for email/push retries. Previously frozen publications and accepted notifications are not rewritten. No new approval blockers or provider calls.

Release order: queued CNTB preview and posted-price header first, then Platform with guarded migration 0152, then Runtime against the coordinator-confirmed current parent. Platform understands new metadata before Runtime starts emitting it. Existing records have null context and remain deliverable. Coordinator must verify hosted migration/health and a permitted future notification before claiming end-to-end acceptance.

Nothing deployed or applied. No live notifications sent. Help guide updated within the narrow package. Exact-parent package/verification scripts preserve unrelated work and do not switch the working branch/index.

September 30 follow-up complete locally: exact owner-selected follow-up wording replaces the previous explanation; automatic boundary approvals freeze no image version and use a link-only caption. Initial/manual image behavior is unchanged. Focused offline renderer, manager-condition and TypeScript syntax checks pass. No live sends or deploy.
