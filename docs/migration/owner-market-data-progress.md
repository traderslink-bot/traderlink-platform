# Owner Market Data

Owner-approved scope: a separate normal-dashboard Market Data page and request form for the two established owner identities. No trade entry is required. Request symbols and dates, save full extended-session 1-minute candles, list saved sessions and failures, and open saved candles in a chart.

## Implementation checklist

- [ ] Server authorization using established configured owner identities; no display-name authorization.
- [ ] Existing designated shared Moomoo connection and normal provider adapter; no changes to ordinary Analyzer connection or allowance behavior.
- [ ] One symbol/date request at a time, full 04:00–20:00 America/New_York window. No historical-age or ticker inventory gate. Preserve sparse candles and price moves.
- [ ] Existing immutable market-session versions/candles; failed refresh never replaces usable saved candles.
- [ ] Separate request form, persisted results, chart with New York labels and exact saved candle timestamps.
- [ ] Focused source/static checks and owner UI review before release acceptance.

No migration, provider request, hosted database mutation, or release has been executed for this feature. The normal Analyzer correction checkpoint remains separate.

Saved coverage means the window requested from the provider, not a promise that every minute traded. The chart must not fill missing minutes. Failures distinguish connection, transport/provider response, invalid returned data, and persistence. No credentials or account identities are returned.

## September 8 takeover checkpoint

Implementation source now includes `/market-data`, its request form, sequential ticker/date requests, inventory filters and pagination, recent persisted request history, saved-candle chart, owner-only navigation, and page/API authorization. Implementation is not runtime or visually accepted. No tests, build, server, database operation, provider request, commit, push, or deployment was run by this takeover task.

Production parent verified using read-only remote metadata: `b5817db2cc89e065d5780870036785d68e633fad`. Coordinator confirmed deployment `f3f90df1-8ded-491d-97f6-97043e650699`, health ready, migration 116; these describe the preceding Analyzer repair only.

Access fails closed unless exactly two distinct configured Discord subjects are present, and requires an active matching Platform identity. No display-name checks or local-development bypass. Coordinator must verify the existing configured subjects correspond to This Guy and TradersLink without exposing their values.

Owner requests opt into stricter provider response validation and complete cursor traversal. Ordinary Analyzer calls keep the default adapter behavior. Partial validated candles are retained with explicit failure evidence and no full-session coverage claim. Failed or poorer refreshes never replace the current saved set. The save transaction restores the worker lease value atomically. No migration, allowance reservation, execution, or Analyzer job is created.

Current-session coverage is capped at the request start time, not its completion time. Sparse minutes and price jumps remain valid; no history-age or approved-inventory restriction is applied. Inventory reads use the read-only database boundary. A failed database write cannot promise durable failure evidence, and the API says so.

Help review: this is an owner-only operations page; ordinary user Analyzer/Help behavior is unchanged. Page controls contain the necessary owner guidance. No public Help article or public navigation entry is added.

### Source verification and review surface

Twelve TypeScript/TSX files passed syntax transpilation; the exact-parent patch passed `git diff --check`. This is not a full type check, runtime test, or visual acceptance.

[Visual review preview](owner-market-data-preview.html) is a standalone, dependency-free composition preview with Light/Dark and empty/saved/failed/partial/loading states. It has no real account or candle data, and is not the running application.

Coordinator received the source handoff. The existing staging service is Communities-only and must remain untouched. No separate Market Data staging target is currently authorized. Coordinator confirmed two syntactically valid configured Discord subjects but could not verify active account mapping because Railway SSH failed before executing commands. No secrets or data were exposed. Continue source-only until the owner accepts this checkpoint and a clean production-parent candidate plus isolated staging target is arranged. Commit remains pending that acceptance.

### Superseding owner release instruction

The owner explicitly instructed: "you are not staging and you are not doing visual approvals just uplaod to production". This supersedes the earlier staging/visual-approval gate for this slice. Coordinator owns the direct serialized production release from the exact current production parent. No staging action or owner visual approval is required for this release. Source-only verification remains accurately labeled; production deployment and health evidence must be recorded separately.

The owner also reconfirmed corrected Analyzer executions must reuse saved candle data. The current parent `b5817db2` contains the separate grouped-correction and free saved-candle reanalysis repair. This candidate preserves those files and behavior; it does not reimplement or remove that repair.

### Release verification

- Focused syntax and production-parent diff checks passed; full type/runtime verification remains unperformed.
- Coordinator review of exact parent patch and identity configuration.
- Coordinator direct production deployment and health confirmation under the superseding owner instruction.
- Runtime and rendered behavior have not been verified in this worker. Do not claim otherwise. Do not release stale worktree contents.

### Complete remaining demo inventory (2026)

Candles first; propose complete candle-led days before materializing any executions. Preserve Aug 17–27.

| Date | Tickers |
| --- | --- |
| Aug 03 | RITR, HYFM |
| Aug 04 | AMIX, QNME |
| Aug 05 | YXT, INLF |
| Aug 06 | MBAI, PFSA |
| Aug 07 | YJ, MB |
| Aug 10 | SCKT, JWEL |
| Aug 11 | PFSA, WXM |
| Aug 12 | BOXL, RMCF |
| Aug 13 | XHG, FGI |
| Aug 14 | WETO, MDXH |
| Aug 28 | FTFT, FNGR |
| Aug 31 | AEHL, NCRA |

Download files/checksums still require verification. Long-only, varied trades/fills, realistic candle-supported momentum and losses, notes/tags/preset/custom rules and daily notes remain the controlling demo scope. Daily positive P/L guideline is roughly $1,000–$2,000, overall more green than red days. Honor prior intentional demo deletions; no announcement.
