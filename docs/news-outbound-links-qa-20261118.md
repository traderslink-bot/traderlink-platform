# News outbound links — source review and handoff

Assigned workspace: `/home/traderlink/projects/news-outbound-links-20261118`, branch `codex/news-outbound-links-20261118`, base `1806d747028b77e6f50f9dad0903f83555eb6233`. LOCAL/PREPARED, not LIVE.

## Consolidated findings and correction

- Shared press-release drawer opened unfiltered stored URLs. It now uses one presentation-only URL guard and hides unavailable-summary actions without a valid source.
- Both screener article views exposed stored source URLs and always offered an article page. They now guard source buttons and select a publisher only for unavailable summaries.
- Public full/free article pages exposed SEC source URLs directly and displayed old fallback messages. Both share the corrected view: guarded publisher action and exact `Summary could not be generated.` copy, including metadata descriptions. SEC action remains `Open SEC Filing`. Company website links also use the guard.
- General Market News original-source action now uses the same guard. Watchlist news/research anchors and older stock-screener headline links also use the guard; blocked targets remain readable without an href. Existing local reader paths stay local.
- Scanner-recent previously always returned a TradersLink article URL. It now returns a valid publisher for an unavailable summary, or null when no allowed source exists; successful summaries retain TradersLink URLs. Local scanner `ScannerNewsItem.url` already permits null and both declines-card views check for null before rendering links. External Discord consumer compatibility still needs confirmation.
- Shared summary classification preserves the dashboard fallback modes/event rules and recognizes historical unavailable prefixes; no write-side changes.

## Source QA matrix

Read-only source tracing, not executed tests:

| Case | Selected behavior | Status |
| --- | --- | --- |
| `https://nuntiobot.com/story` or `https://news.nuntiobot.com/story`, unavailable summary | null source/action; exact unavailable message | Source reviewed |
| Uppercase or terminal-dot NuntioBot hostname | parsed, normalized, blocked | Source reviewed |
| `https://notnuntiobot.com/`, `https://nuntiobot.com.example.org/`, legitimate host with NuntioBot in path | hostname is outside blocked domain, allowed | Source reviewed |
| BusinessWire, Newsfilter or SEC with unavailable summary | original HTTP(S) publisher action | Source reviewed |
| Successful AI summary with NuntioBot internal identity | normal TradersLink article URL; no NuntioBot source action | Source reviewed |
| Invalid/non-HTTP URL or credentials | no original-source action | Source reviewed |
| SEC source-only public full/free view | exact `Open SEC Filing` action | Source reviewed |

Public `/news` and ticker indexes render the existing dashboard invitation; they expose fixed TradersLink links only. Free article route delegates to the same public article view. Press-release feeds share the corrected drawer. Push repository uses dashboard channel/article paths, never the source URL. Week Ahead enforces its BigTimePennyStocks host allowlist. Reverse splits enforce Nasdaq/SEC source allowlists, and market-halt source writers supply fixed exchange endpoints; these paths need no storage changes. Article publication returns canonical TradersLink full/free paths.

Reviewed changed React components for unconditional hook order, existing MUI/theme tokens, conditional link rendering, accessible existing controls and mobile sizing. No new state, effects, layout or CSS were introduced. Help Center notification guides reviewed: no guide update required for this source-link correction. Installed Next guides are absent in this source-only worktree; no Next API/convention changes were made.

## Verification limits

`git diff --check` passed. No tests, typecheck, lint, builds, dependency install, new server, preview update, replay, notifications or data writes performed, per assignment. Active Charts preview was not changed and cannot establish postpatch browser acceptance. Corrected read-only record projections received from Coordinator; evidence below. Runtime/browser verification and external Discord null-link behavior remain unverified. Source review does not establish production readiness.

Stored URLs, identity/dedup keys, original content, collector, schema, auth and provider configuration are untouched. All source changes remain uncommitted. Coordinator retains integration/release authority; current instruction prohibits commit/push/deploy without fresh explicit owner approval.

## Existing-record evidence, 2026-11-18

Coordinator supplied a query-only UID1001 projection of the latest 1,000 insertions (`rowid DESC`, no full URL/body/identifier output), 27 grouped classifications, on verified production deployment `accdec37` / volume `5784`. The reader closed the database and reaped its child; no auth/provider/data writes. Receipt: `/home/traderlink/projects/traderslink-coordinator/operations/news-outbound-existing-records-readonly-v2-20261118.json`, SHA-256 `7c2f8cacb559fb07fdcb86d034b6991ec1cd9fe3eacc8423023e487b8df3f5fc`. Compact projection was read directly from `news-outbound-existing-record-examples-20261118.json` in that same directory.

- 74 unavailable-summary NuntioBot records: 45 press releases, 28 earnings, one financing; source hostname `news.nuntiobot.com`, `headline_only_fallback`. Under corrected selection these have no source link.
- 12 unavailable-summary Newsfilter records: 7 press releases and 5 earnings; hostname `newsfilter.io`. Their original publisher links remain allowed.
- 4 unavailable-summary BusinessWire records: 2 press releases and 2 earnings; hostname `www.businesswire.com`, `businesswire_headline_only`. Their original publisher links remain allowed.
- 354 summary-present, `fetched_direct` NuntioBot press releases: corrected selection retains TradersLink article links and hides the blocked source action.
- 39 summary-present SEC current-report records: hostname `www.sec.gov`, `fetched_direct`; SEC source action remains allowed. The sample does NOT prove a source-only SEC record exists; that scenario remains source-reviewed, not record/runtime-verified.

The initial prefix projection used 42 characters, shorter than the 43-character historical unavailable sentinel. It is not used for classification evidence; Coordinator corrected this to 96 characters. Implementation evaluates the full summary. These projections establish existing record shapes only, not execution of the patch.

External Discord release qualification: inspect the preserved consumer of `/api/news/scanner-recent`, `articles[].url: string | null`. A null URL must render plain headline/type/time, never `[title](None)`/`(null)` or a fabricated article destination. HTTP(S) strings retain normal links. No collector identity/storage or delivery changes are requested. External compatibility remains unverified and must not be silently assumed.

## Authorized QA continuation and owner deployment hold

The owner subsequently authorized finishing remaining QA and coordinating production after all checks pass; if any migration is required, wait until after 20:00 America/Toronto on November 18. The candidate changes no schema or migrations. The owner's later message, `before edploy i have another task`, places deployment on HOLD and supersedes the conditional release instruction. Coordinator acknowledged no news staging/commit/push/PR/deploy/restart/migration was started. Await the additional task and explicit clearance of this hold.

After QA authorization, `node --test src/modules/news/contracts/news-outbound-link.node-test.mjs` passed 5/5 focused tests. The tests import the actual TypeScript helper through Node 24; a resolver hook supplies only the existing extensionless dependency's `.ts` suffix. Cases cover domain boundaries, encoded/case/trailing-dot hostnames, publisher/lookalike preservation, summary routing, historical fallback modes, and local/backslash-escape paths. No implementation changes were needed. This is execution evidence for the helper only, not React/browser/full application acceptance.

Coordinator supplied recorded Windows consumer evidence: `/home/traderlink/projects/traderslink-coordinator/operations/news-outbound-windows-null-formatter-evidence-20261118.json`, SHA-256 `fddeb9fc3fa05e05a7e9aefe61dc5dc30ba4d798806b5d4db48c6f02551c6060`. Recorded `lib/scannerRecentNews.js` handles absent `article.url` by returning escaped plain text before URL parsing/Markdown; its response validator does not require a URL string. Source evidence from November 18 20:10:03–20:20:13 UTC resolves the nullable-link source-contract concern at that evidence tier. No fresh Windows filesystem hash or live Discord send is claimed. External native delivery remains intentionally untested.

Coordinator has linked a protected compatible dependency donor into this assigned worktree, with 612 canonical main installed-metadata records matched and 116 optional packages absent; no install/copy/dependency-source change. Runtime parity is not inferred. No browser harness, full build, new server or heavy suite was run. Browser/component QA remains pending resource coordination and the owner's additional task; no deployment may proceed while on hold.

## Superseding unified-feed candidate

The owner-approved unified feed and dashboard-only article behavior supersede this historical guard-only checkpoint. Current implementation, executed QA and release limits are recorded in [Unified Press Releases progress](press-releases-unified-feed-progress-20261118.md). Guard-only source/patch13c25 was preserved by Coordinator before the additional work; its old manifest is historical, not the current working-file hash list.
