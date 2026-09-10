# Press release summary fallback correction

Status: implementation updated locally; release coordination pending.

Owner-directed scope:
- Do not show fallback summary copy when no AI summary is available.
- In the shared /press-releases/ drawer, omit the AI summary, positives, and negatives and open the original HTTP(S) source URL for those records, including Newsfilter.
- Summarized articles retain their TradersLink article destination.
- Normalize historical fallback copy to a null summary on read; no production database rewrite is needed for the dashboard.
- Enrich missing market cap through the existing Finnhub company-profile service without rejecting the article when Finnhub is unavailable.

Existing staged UI work is preserved. No tests, server launch, runtime reload, publication, commit, push or deployment was performed for this correction.

Release handoff:
- Include `app/api/news/articles/route.ts`, `app/(dashboard)/press-releases/press-release-feed.tsx`, `src/modules/news/server/press-release-dashboard-repository.ts`, and this progress record in the narrow Platform release allowlist.
- Confirm the Railway service has `FINNHUB_API_KEY`; the key is configured locally in ignored `.env.local`.
- Deploy the Platform changes for forward-only handling. Do not recover or publish the historical omissions identified during diagnosis.

## Production integration

The approved source-link and article-type edits are applied to the current shared press-release-article-drawer.tsx, not the older inline drawer. Existing Dark theme, shared drawer, scanner broadcasts, and unrelated staged work are preserved. The read contract adds an optional summaryUnavailable flag; no schema migration. Forward-only runner activation; historical omissions remain untouched.
