# General Market News — two-account personal-test plan

Status: Owner explicitly authorized completing the personal dashboard feature;
current-source implementation allocation is active. Existing list/side-card UI
review is waived. First synthetic slice authored; final acceptance execution and
live activation/release gates remain. This is not a live-access completion claim.
Prepared 2026-10-28; owner clarification recorded the same day.
Feature owner: visible VPS research chat `01a183a9-6962-7a03-9616-5dea82ebc743`;
owner communication through PC relay `01a183a6-998f-7281-a03c-8a43e9156693`.
Coordinator controls source allocation, Git, preview and release operations.

## Authority and evidence boundary

Current allocation supersedes the historical planning-only restriction below:
work only in `/home/traderlink/projects/production-ci-audit`, branch
`codex/general-market-news-personal-test-20261028`, parent
`a5ead4e35a846ac0d82cd365688b831d36ece8ee`. Initial state was Coordinator AGENTS
prefix plus this carried plan only. Exact Coordinator allocation is
`/home/traderlink/projects/traderslink-coordinator/general-market-news-source-ownership-20261028.md`:
18 new source/test files, this plan, six narrow shared hunks. Every command uses
explicit workdir and every patch an absolute new-workspace path. Old lane is
read-only. Native sidebar association is unresolved; no retarget success claimed.
No source setup prefix may enter feature commits. Coordinator retains all Git.

Owner's current cadence: no tests, samples or feature-module demos while coding;
targeted static/lint/type checks permitted. Author fixtures now; Coordinator will
select final acceptance checks at frozen source handoff. No live identities,
credentials, providers, migration carrier/manifest, service/preview/install or
hosted change is authorized by source allocation. UI approval is not a blocker.

The following original checkout evidence is retained as planning history only.

Only this new document is writable for this checkpoint. No implementation,
credentials/database reads, provider calls, tests, builds, previews, configuration
changes or Git mutations are authorized. Do not implement on this mixed baseline.
Verified planning checkout: `/home/traderlink/projects/admin-watchlist`, branch
`migration/admin-watchlist-20261019`, HEAD
`e718689bfef3bcbd2c966567e913dfd0638437db`; worktree index SHA-256
`5d0fb8f49297126cd802800898e38f52175727f0a5db7c2c626c37495b0acf24`.
The index lives through a Git worktree pointer; it is not `.git/index` here.
Existing dirty work belongs to its existing owners. This is source inspection,
not a claim that this checkout matches current deployed Railway source.

Related governing documents: [Platform replacement plan](traderlink-platform-replacement-plan.md),
[Migration progress](migration-progress.md), [Migration register](migration-register.md),
[Import Integrity contract](import-integrity-and-data-decisions-contract.md).
This feature adds News data only and does not alter Journal facts or analytics.
The Coordinator must later authorize a reverse link from the appropriate progress
record; this checkpoint's one-file allowlist prohibits editing that record now.

## Owner-visible proposal

Owner clarification via PC relay: reuse the existing Under $30M / $30M–$50M /
$50M–$100M news lists and side cards without a separate UI approval round. Those
exact routes resolve through `resolveChannel` in the shared PR catch-all page and
render the same `PressReleaseFeed` list/drawer component inspected for this plan.
No new mockup, visual redesign or independent UI approval is needed for that reuse.
The subsequent PC relay clarification confirms personal-test authorization;
current-source allocation is still required before implementation, and service
activation/deployment remain subject to their operational/release boundaries.
The remaining general-feed organization choice below is made explicit rather
than creating another UI-approval prerequisite.

Add **General Market News** to the existing **Market News** left-navigation group,
immediately after The Week Ahead, pointing to `/market-news/general`.
Implement its page beneath `app/(dashboard)/market-news/general/page.tsx` so it
inherits the current dashboard frame, light Material styling and full navigation.
No generic subtitle below the title. No public page or public article publication.
Both owner logins, **This Guy** and **TradersLink**, must see the link and feed.
Other users must receive neither the navigation link nor article data.

```text
Market News                     General Market News          Updated 10:42 ET
  The Week Ahead                [All news] [Ticker filter...]
  General Market News           [Search saved headlines...] [Ticker...] [Date...]
  News Scanner
  Under $30M                    Time       Source       Tickers       Headline
  $30M-$50M                     10:41 ET   example.com               ...
  $50M-$100M                    10:40 ET   example.com  AAPL MSFT    ...
                                10:39 ET   example.com  NVDA         ...
                                [Load more]

Article selection opens the right drawer (full-screen on mobile):
  [Close] Publication time · Source domain · Related ticker chips
  Headline
  Article text supplied by EODHD, with readable paragraphs
  [Read original source]
```

Rows are compact list rows, not a grid of cards. Default newest publication first,
stable ID tie-break. On mobile each row stacks time/source, ticker chips and title.
Opening an item preserves list position; Escape/close/back restores focus and the
list. An authorized `?article=` deep link opens the same private drawer. New rows
appear behind an “N new articles” control rather than moving the row being read.
Show a small Personal test badge near controls, not an explanatory title subtitle.

No synthetic summary or analysis: the EODHD contract supplies article content,
not our scanner's AI-summary/positives/risks/levels model. Show body when available;
if absent, say “Article text is unavailable. Read the original source.” Never
invent a summary. Render sanitized text/paragraphs, not untrusted provider HTML.
Use validated HTTP(S) original links; display source hostname rather than inventing
a publisher name. Missing/unsafe source links get no clickable source button.
No publisher scraping, remote-image downloads or automatic image embeds.

Organization is based on supplied metadata, not guessed market importance:

- **All news:** every article from the unfiltered EODHD general feed, once per
  article, whether it has zero, one or multiple ticker symbols. No tickerless
  bucket and no Market-wide label: absence of symbols does not establish broader
  market importance.
- **Ticker filter:** indexed symbol search/filter within this private collection.
  Multi-ticker stories appear under every supplied ticker but once in All news;
  show up to three chips with a +N expansion. Keep original exchange-qualified
  symbols; do not confuse forex/crypto with US equities or guess missing symbols.
- Optional provider topic chips can filter stored tags. No invented macro/sector
  classification, sentiment-based ranking or many empty category tabs initially.

Selected general-feed organization: one reverse-chronological All news list,
with ticker chips where available and no placeholder category where absent.
Ticker filtering narrows that same collection. Any separately collected ticker
supplement stays in ticker-filter results unless that story also appeared in the
unfiltered general feed; retain collection provenance so the default general feed
does not become an arbitrary selected-company feed. A dedicated ticker-news page is unnecessary for this
test: a ticker filter in this feed avoids changing public `/news/[ticker]`.

## Verified source relationships and reuse

| Source inspected in assigned checkout | Finding / intended reuse |
| --- | --- |
| `app/news/page.tsx`, `app/news/[ticker]/page.tsx` | Public site header/footer, Small Cap News Context, saved single-ticker articles. Preserve these routes. |
| `src/lib/news/news-article-store.ts` | Existing `NewsArticle` requires one ticker and owns public slug/article data; unsuitable for zero/multi-ticker private ingestion. Do not shoehorn general news here. |
| `app/api/news/articles/route.ts` | Existing publisher path revalidates public routes and enqueues/runs PR push delivery. Never use it for this test. |
| `app/(dashboard)/press-releases/[[...channel]]/page.tsx` | Authenticated, PR-entitlement-gated repository reads; reference its page pattern, not its broad Premium/Discord access rule. |
| `app/(dashboard)/press-releases/press-release-feed.tsx` | Compact rows, ET time, right drawer 620px desktop/full width mobile, deep-link selection. Reuse these interaction/design conventions without changing PR behavior. Current drawer emphasizes AI summary/analysis and links to the public article; it is not already a generic full-body reader. |
| `src/modules/news/contracts/press-release-dashboard-contracts.ts` | Single ticker, scanner route tags, AI details/public path; create a separate general-news contract rather than widening existing PR data implicitly. |
| `app/dashboard-navigation.ts` | Existing Market News group, Week Ahead and scanner/market-cap links. Own label/route here. |
| `app/(dashboard)/layout.tsx`, `app/dashboard-layout-frame.tsx`, `app/dashboard-template.tsx`, `app/dashboard-shell.tsx` | Reuse actual shared frame/template/panel/actions. Add a server-computed general-news visibility flag passed through template to shell; navigation hiding alone is not authorization. Coordinate shared-file ownership. |
| `require-platform-request-scope.ts`, `WorkspaceAccessScope` | Existing authenticated identity exposes stable `scope.userId`; use it for two-user authorization. |

Avoid extracting/refactoring PressReleaseFeed in the initial slice: it combines
scanner state/actions and a different detail model. A small new list/detail
component can use shared dashboard primitives and the same Drawer interaction.
Before implementation, reconcile current architecture guard and
`src/docs/trade-execution-analytics/v3-dashboard-template-contract.md`: that
contract requires explicit review/allowlisting for a new feature Drawer.
No local shell, navigation arrays or competing theme tokens.

Help review: `src/modules/help/notifications-and-imports-guides.ts` describes
existing PR drawer and notification behavior. Those behaviors stay unchanged.
A restricted personal-test help panel should explain freshness, filters, missing
body and original links. If a Help Center guide is added later, it must be gated
to the same test audience and added with its registry through a separately
allocated file list; no broad/public guide implying general availability.

## Exact two-account authorization model

Use existing valid Platform-session/dashboard admission first, then a dedicated
server-side allowlist of exactly two verified, active stable Platform user IDs.
“This Guy” and “TradersLink” are owner labels only: never authorize by display
name, browser parameter, email text, workspace role or generic Premium status.
Coordinator/owner must verify which two identities the labels mean and whether
they are two logins rather than Journal accounts under one login. Store the
verified references only in protected runtime configuration, not this document.
Do not broaden ordinary dashboard admission to make the test work; validate both
accounts' existing access and report a mismatch before implementation changes.

Apply the same function to page, feed JSON, detail JSON, any refresh request,
and navigation flag. Fail closed for missing/malformed allowlist, anonymous,
revoked/expired identity and any third user, even by direct URL. Retain private
no-store responses and exclude general-news data from PWA/offline/service-worker
caches. Recheck auth on each read; logout cannot retain an accessible body cache.
Article data is one shared private collection for both authorized users, not tied
to selected Journal account or duplicated per login. Defer persistent read/unread
tracking; initial selection and filters are local UI state. Never borrow PR read
marks or unread badge totals for this feed.

## Provider/key concurrency and hosted evidence

Earlier source-backed comparison and quota calculations are in the research chat
and PC relay. Owner dashboard evidence supplied by relay on 2026-10-28: active
**EOD (Historical Data) Extended + Intraday**, News API Data category,
100,000 daily units; latest reported total 3,735 (earlier 3,574). This is a
same-day observation, not a measured multi-day peak or endpoint smoke test.

Source inspection here finds EODHD-capable Levels configuration in
`src/lib/support-resistance/levels-system-runtime-options.ts`, EODHD hydration
selection and raw-timeline fallback paths. A legacy live-watchlist type accepts
`eodhd_live_v2` provenance. However current unfinished indicators runtime explicitly
uses Moomoo/Yahoo and overnight-quote route calls a Moomoo adapter. These findings
do not establish which provider paths the current Railway deployment runs.

**Coordinator hosted evidence received:** read-only checkpoint
2026-10-28T18:38:32Z, receipt `operations/eodhd-hosted-readonly-20261028.json`
in the Coordinator's operations lane (not a file this chat opened or created).
Platform service `traderlink-platform-web-restore-0909` serves successful
deployment `f237a352-512d-4da5-a492-3e69c635f819`, source
`a5ead4e35a846ac0d82cd365688b831d36ece8ee`, branch `main`, one running instance.
The separate production Runtime has the misleading legacy name
`traderlink-watchlist-runtime-staging`; it is NOT safe staging. It serves
successful deployment `96f09b04-e46b-4711-b98e-8dddea62ad86`, source
`c2892b45e4e3f2003ef1118a9ab93a558b83eed2`, one running instance. Neither changed.

Verified deployed-source facts, reported by Coordinator:

- Platform's current committed source directly supports EODHD in News-owned
  reverse-split configuration/collection/market data: delayed US quote/float and
  daily EOD close. It requires a token and both `REVERSE_SPLIT_ENABLED` and
  `REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED` true. Actual flags were not observed.
  Live-watchlist ingest has EODHD provenance references only. Current indicators
  use Moomoo/Yahoo. Do not describe this lane's older Levels/hydration references
  as verified current Platform execution.
- Runtime's deployed `manual-watchlist-server.ts` constructs an explicit EODHD
  historical service for dashboard/private levels generation in addition to a
  selectable historical provider; persisted configuration can override env
  selection. Its EODHD extended-quote provider requires a token and not disabled;
  AutoWatchlist security-master is EODHD-capable when a key exists. These are
  deployed source paths, not proof every path is enabled/invoked.
- Bounded existing-log review (24-hour/200-line scope, EODHD-filtered) found zero
  Platform matches and two Runtime matches at 16:29:13.599Z, including a
  historical/candle mention. No extended-quote failure matched. This does not
  establish success counts, absence of calls, quota consumption or future load.
- The sanitized remote credential/config-presence probe failed on network/SSH
  key-path access. No credential-presence or actual setting proof was obtained;
  no secrets exported, provider calls, DB/SQL or configuration changes occurred.

Thus existing EODHD-capable deployed paths are verified and sparse Runtime log
evidence exists; actual enabled settings, key identity/shared-account relationship,
endpoint invocation counts and multi-day usage remain unknown. Do not claim no
existing usage. These unknowns do not block source planning/isolated implementation,
but must be reconciled before live collector activation. This chat accessed no
hosted settings/logs/credentials itself and relies on Coordinator's exact report.

Successor Coordinator running-deployment probe succeeded after a transient DNS
failure resolving `backboard.railway.com` (not established SSH/key rejection).
Receipt: `operations/eodhd-hosted-running-presence-20261028.json` in Coordinator
lane. Guards matched the same Platform/Runtime deployment IDs above. Sanitized
findings: `EODHD_API_TOKEN` PRESENT on both; Platform combined reverse-split
enable/private-preview condition false; Runtime env selects `eodhd` for historical
candles and live prices, with extended quotes not explicitly disabled. Persisted
Runtime configuration may override env. This still does not prove actual invoked
provider, request success/count, identical keys, News entitlement or quota.
No secrets exported, new provider call, SQL/DB access or runtime change. Do not
rerun credential diagnostics in this feature lane; provision/qualification stays
with Coordinator. Earlier failed-probe evidence above is historical, superseded
for presence only by this bounded successful retry.

Technical coexistence: VPS news and existing Railway consumers would share the
same EODHD account quota; a second host does not create another allowance. The
published REST limits do not establish a host-specific single-key session lock,
but neither explicitly confirm this exact simultaneous-host arrangement. Verify
any key-specific/IP settings through Coordinator and, if necessary, owner/provider
confirmation before activation. Never rotate/remove Railway's key or stop its
existing work for this feature. A dedicated VPS secret, provisioned later by
Coordinator, must remain server-side with secret-bearing URLs redacted entirely.

Additional official evidence: the
[EODHD downloader](https://eodhd.com/financial-apis/windows-downloader-end-of-day-data)
supports simultaneous connections and recommends up to eight. Reviewed public
REST docs show no single-device/IP restriction or public IP-allowlist option.
Two hosts under shared account/key limits is the supported technical inference;
actual settings/access remain a guarded activation check, separate from WebSocket
limits. Owner favors VPS collection; no move of existing Railway work is selected.

Terms finding kept bounded: personal plans restrict business/group display; access
to News API Data is not proof of external-display rights. Confirm that this
owner-only two-login personal test and simultaneous-host use fit the applicable
account agreement before activation; no member/public rollout is in this plan.
No provider contact or purchase authorized now.

Official sources, checked 2026-10-28:

- [News contract](https://eodhd.com/financial-apis/stock-market-financial-news-api):
  general feed without s/t, ticker/topic filters, date windows and paging, article
  text/link/symbols/tags/sentiment. One-ticker news batching is the documented
  basis; comma-separated sentiment symbols are a separate endpoint. Provider
  describes real-time updates without a numerical latency/completeness promise.
- [Limits](https://eodhd.com/financial-apis/api-limits): news 5 units/request;
  account usage endpoint zero units; daily midnight GMT reset is lazy;
  requests/minute and daily call-units are distinct. Pages/retries count too.
- [Plan comparison](https://eodhd.com/pricing): paid catalogue 1,000 requests/minute,
  versus free 20. Actual key-specific rate not inspected.
- [Terms](https://eodhd.com/financial-apis/terms-conditions) and
  [personal/commercial distinction](https://eodhd.com/financial-apis/commercial-vs-personal-license-use).

Docs disagree: linked older OpenAPI still requires s/t and has a different offset
bound. Main news article now explicitly allows general feed and arrival-order
paging. Small separately authorized qualification must establish actual behavior.

## Proposed topology: VPS collection, Railway private reads

```text
EODHD REST <- outbound requests - one bounded VPS collector
                                      |
                            durable bounded outbox
                                      |
                           outbound signed HTTPS batch
                                      v
Railway dedicated private news ingest -> News-owned tables in Platform DB
                                                |
                                two-user authenticated list/detail API
                                                |
                                existing dashboard + article drawer
```

Use a small standalone Python-standard-library collector/user service, not a
second Next.js server, browser automation or a second Platform application.
Final runtime selection requires Coordinator allocation/operations approval.
VPS owns its separate recoverable cache/outbox only; it never mounts/writes the
Railway database. Railway remains the single database writer and validates batches
in its existing process using a small dedicated endpoint, not public PR ingest.
New News-owned tables/migration require exact current-source review/allocation;
no migrations are performed at this checkpoint.

Later batch contract: authenticated signed bytes with timestamp, unique delivery
ID and replay-safe bounded retention; fixed endpoint, TLS, ≤512 KiB decoded batch,
≤25 items, idempotent article identity/revision, bounded validation/transaction.
Authentication is a separate delivery secret, not the EODHD key or user cookies.
Reject oversized/invalid/replayed input safely, acknowledge only durable writes;
never enqueue push/email/Discord notifications or public sitemap/search items.
Prefer delta batches plus health heartbeat, no whole-feed rewrite every minute.

Alternative not selected: move existing EODHD work from Railway to VPS. It might
centralize quotas but expands scope, introduces new failure dependencies and
requires verifying all callers/caches first. Leave existing work in place.
Alternative pull-from-VPS requires protected connectivity and an availability
dependency; outbound delivery avoids a new inbound/public VPS port.

## Fetch cadence, quota and durability proposal

Initial broad feed every 60 seconds, one serialized collector. Optional selected
US ticker supplement: up to 75 owner-selected symbols every 10 minutes, evenly
spaced; the selected list is shared by both users and not automatically the
Watchlist or all NASDAQ/NYSE listings. Approval may start general-only and enable
the supplement after comparing its additional coverage.

Baseline arithmetic: general 1,440 requests/day = 7,200 units; 75 × 144 ticker
requests = 54,000; total 61,200. Proposed hard news cap 70,000/day leaves 8,800
for pages/retries/backfill. Optional later 80,000 cap supports 90 tickers/10min
plus general: 72,000 baseline. Neither cap is a spending target or an obligation
to poll empty tickers. At 3,735 existing usage, a full 70k addition leaves 26,265;
future other usage is unknown. No entire-universe sweeps: previously counted
8,495 non-test NASDAQ/NYSE securities cost 42,475 units per one-page pass;
two passes 84,950, three 127,425.

Before each provider request: reserve cost durably, reconcile fresh sanitized
account usage through documented zero-unit endpoint, and require both local
news-cap headroom and ≥10,000 remaining account units after reservation. Usage
requests also consume HTTP rate allowance. If usage cannot be established, pause
collection and keep last data. Count uncertain timeouts as potentially spent;
release reservations only with safe reconciliation, never assume a timeout free.
Shared-key consumers can race this check: maintain reserve, one local in-flight
request, bounded rate (≤60 combined provider/usage HTTP requests per minute),
and Coordinator-visible account monitoring. Absolute no-depletion guarantee
requires coordination of every consumer, not merely this local guard.

Use GMT-day budget records; confirm lazy reset on first after-midnight request,
without unlimited catch-up or trusting stale prior-day figures. Prioritize general
feed, then recent catch-up, then supplemental tickers. Every page consumes budget.
Proposal starts at limit=100 to bound bodies, at most three pages per polling
cycle and ten catch-up pages per hour shared across jobs; exhausted backlog remains
visible, no silent “complete” claim. Initial bootstrap covers recent 24 hours,
not a full historical download. Use documented arrival order in bounded dated
windows, persist durable continuation and overlap recent windows/deduplicate;
reconcile up to prior 48 hours within spare budget for late arrivals. Test cursor
stability under new arrivals before claiming gap-free capture. General feed is
not documented as an exhaustive union of ticker-specific feeds.

Dedup: provider + carefully normalized original URL where valid; preserve article
revisions/content hashes and symbol union across repeated queries. Strip only
known tracking parameters; never erase meaningful URL identity. With no safe URL,
fall back to normalized headline + publication time + provider, mark uncertain
identity; never merge different stories solely on a matching headline. Do not
invent missing publication times; retain fetch time separately and label missing
publication time. Preserve original metadata alongside normalized fields within
bounds; never save full secret-bearing request URLs or private account responses.

## Resource, retention and failure bounds

Planning targets, not measured performance: collector steady RSS ≤128 MiB,
configured hard memory limit 256 MiB, one CPU maximum, one HTTP request in flight,
15-second timeout. Limit decoded provider response to 4 MiB and ≤100 articles;
too-large payload triggers smaller page retry within budget, not unbounded parse.
Normalize body to ≤64 KiB/article and mark truncation visibly with original link.
No full-body feed payloads: list 50 rows (max 100), ≤256 KiB; fetch one body on
drawer opening. Hidden browser tab pauses lightweight cached UI refresh (60s
while visible); browser activity never starts duplicate provider polling.

Separate VPS SQLite cache/outbox is recoverable news only, not another Platform
database. Retain seven days or 20,000 articles, whichever bound reached first;
logical body+metadata cap 256 MiB, total disk target ≤512 MiB including bounded
outbox/WAL/logs. Enforce byte/count high-water marks and stop ingestion rather than
fill disk; incremental pruning/checkpointing, no heavy vacuum at runtime. Use
matching bounded retention in Railway's new tables without touching other News.
Outbox max 1,000 unsent items/32 MiB: pause collection if delivery backs up rather
than silently discard unsent items. On restart recover cursors/reservations/outbox,
do not download full history. Retention may shorten the visible history; show its
actual available range rather than promising all seven days.

Provider 402/429: stop/back off, obey Retry-After when supplied, no tight retry.
5xx/timeouts: exponential backoff with jitter, at most one retry/job, all attempts
budgeted. Auth failures pause until operator action. Delivery failure preserves
bounded outbox and cached dashboard data. UI distinguishes no news, stale data,
partial catch-up, expired/unavailable article and inaccessible personal test.
“Updated” reflects last successful delivery/collection separately from article
publication time. No new dependency can block unrelated dashboard routes.

## Checkpoints and acceptance

1. **Now:** communicate the chosen mixed general-feed organization through PC
   relay. Separate approval for the existing list/side-card UI reuse is explicitly
   waived by owner. Coordinator supplies hosted EODHD findings and later
   current-source allocation. Only this document changes at this checkpoint.
   Owner personal-test authorization is confirmed by PC relay; no UI-approval
   request remains. Hosted activation/release approval is still separate.
2. **After exact current-source allocation within the authorized personal test:** implement
   dedicated News contracts/storage/access/ingest/collector and page; shared nav,
   frame/template/shell and migration allowlists coordinated with their owners.
   Re-read current Next docs and actual source; no porting stale mixed files.
   Runtime secret provisioning, collector activation, live provider qualification
   and hosted migration each require their separate applicable authorization.
3. **Later verification/review:** focused access/budget/ingest/idempotency/parser
   tests, quota reset/restart/late-page tests, two authorized identities plus
   unauthorized third user and logged-out requests; keyboard/mobile drawer QA,
   full-body fallback, multi/no-ticker organization, cache/logout denial, stale and
   cap states. Verify existing PR/scanner/public News behavior unchanged and zero
   notifications. Follow one-heavy-operation VPS cadence, relevant type/lint and
   dashboard architecture guard; build/browser checks at meaningful checkpoint.
   Tests and previews use synthetic data, fake keys, disabled delivery/workers.
   Live provider test is a separate small authorization, never preview defaults.
4. Later preview/browser verification uses Coordinator's private unprivileged
   preview lane when authorized; no separate owner UI approval round is required
   for faithful reuse of the existing list/side-card pattern. Seek owner input if
   implementation materially departs from that pattern. Leave Coaching/Membership runtime and 52pins alone.
   Measured RSS/disk/request/body latency must meet bounds before activation.
   Final Railway staging, deployment, migrations and two-real-account QA remain
   Coordinator/owner gates with exact source SHA, file allowlist and health result.

Personal-test acceptance requires BOTH named owner logins to show the exact left
navigation label, load the same private feed and open bodies/source links; generic
Premium membership alone must not gain access. Zero public article leakage,
no EODHD key in browser/log/output, no PR/scanner changes, retained source evidence,
durable quota limits and bounded recovery are required. No completion claim until
these are measured; the owner's recorded UI-reuse waiver satisfies the separate
visual approval requirement for faithful reuse only.

## Outstanding decisions / progress

- [x] Assigned source relationship, shell, drawer, access and EODHD references read.
- [x] Concrete UI, topology, quota, retention and two-identity proposal prepared.
- [x] Coordinator deployed-source/log evidence received and recorded with limits;
  no claim of verified configuration, shared key identity or call volume.
- [ ] Current-source allocation/recheck and safe shared-quota/config qualification
  before later activation; do not defer all planning for unobserved live flags.
- [x] Owner waived separate list/side-card UI approval; exact market-cap route
  references rechecked. Unfiltered general feed in one chronological All news
  list with optional ticker chips/filter selected; no tickerless bucket or
  Market-wide label. No copy-choice approval blocker.
- [x] Owner personal-test authorization confirmed via PC relay. No existing
  Railway work moves and no release authorization inferred from the UI waiver.
- [ ] Two stable owner identities privately verified; dashboard access confirmed.
- [ ] Applicable account/concurrent-host agreement checked before activation.
- [ ] Current-source implementation ownership/file allowlist assigned.
- [ ] Checkpoints 2–3 separately authorized and completed.

### Implementation progress — 2026-10-28

All 18 reserved source/test files are authored. Six shared hunks add only the new
navigation item/title, a server-derived two-user access flag, prop passthrough,
new-item filtering, and the scoped Drawer allowance. Serving-a5 appearance,
deferred PR counts and owner-market-data props are preserved. Current extracted
PR article drawer was used as reference; PR/scanner/public News stay untouched.

Implemented in the synthetic slice:

- Exactly two UUID-configured Platform users, same check at page/list/detail/nav;
  no role/display-name/local-dev bypass. Real account references not provisioned.
- Signed timestamped bounded ingest, signature validation before DB open, atomic
  replay/idempotency guard, all-row validation, safe text/URL normalization,
  source revisions and symbol union, general-feed provenance distinct from ticker
  supplements. Default All news contains unfiltered general-feed stories only.
- ID-free additive DDL descriptor for five new private News tables; no migration
  registration or runtime initialization. Missing schema returns unavailable.
- Bounded keyset list without bodies, on-demand detail, source/missing/truncated
  body states, 200-row client ceiling, duplicate-free list continuation, stale/
  partial status, hidden-tab polling pause, no persistent/offline news cache.
- Inert-by-default stdlib collector, explicit activation switch, one-process file
  lock, one HTTP request at a time, redirect refusal, durable shared-usage/local
  budget guard and timeout reservations, lazy GMT reset handling, signed durable
  outbox, arrival-order offsets, page/backlog/storage bounds, general-first jobs
  with selected tickers spaced across ten minutes. No service installed or run.
- Authored synthetic fixtures for both/third-user access, signature/time/bytes,
  atomic rollback, replay conflict, revisions, symbol/provenance separation,
  pagination, retention, missing schema, fake HTTP feed/detail delivery, Python
  quota/reset/restart/paging/outbox/signing. These fixtures have NOT been run.

Static verification completed during implementation:

- Targeted ESLint of new TS/TSX and authored TypeScript fixtures: zero errors or
  warnings. Follow-up lint of shared hunks/new corrections: zero errors; three
  pre-existing shell warnings (unused Button and two workspace-drawer effect
  dependencies), outside this feature's hunk ownership.
- TypeScript transpile/syntax diagnostics for nine implementation roots: zero.
  This is not semantic typechecking or a build.
- Python AST syntax parses collector and fixture without importing/executing
  either. No Vitest, Python unittest, samples, feature modules, browser or build
  execution during coding. React Best Practices skill applied to hook, auth,
  payload, direct import and accessibility review; existing Material UI retained.

Checkpoint gaps: selected synthetic acceptance execution and semantic types,
architecture guard against current baseline, scheduled build/browser evidence,
Coordinator migration carrier/manifest and exact-source integration, protected
runtime configuration/two stable identities, guarded provider smoke check,
collector service activation/delivery, two real accounts' left-nav/list/drawer QA.
Source presence is not live acceptance. No further owner UI decision is needed.

### Frozen checkpoint acceptance and selected type successor

Coordinator preserved checkpoint `6a2aeb6837469c974c4c5912e33be3bd27bd4fcf`
(parent a5), source-set `c253873bf565811e0cfd3883ba6d586bb1fd1cedfced47469f0c05cbd13c979f`,
plan `000494c28c5d2a0b4cc9da9db82273ba124fcd0ae1525267b74592b1f4bf65e6`.
Working HEAD/index were not changed and nothing was pushed. At that exact input,
Coordinator-selected final synthetic acceptance ran in an empty-root bwrap
namespace: no network/credentials, read-only source/dependencies, private temp
SQLite/cache, one worker/process at a time, native config loader, cache disabled.
Initial command-path and dependency-alias loader failures ran no tests and were
corrected only inside namespace mounts with explicit Coordinator agreement.
The verified intermediate dependency alias is `admin-erasure-release/node_modules`,
read-only mapped to the same canonical dependency bytes; no other checkout exposed.

- Four new Vitest files: **14/14 passed**, 2.00 seconds.
- Python fake-transport collector fixtures: **7/7 passed**, 0.014 seconds.
- Existing architecture guard: **4 failures/3 passes**. A separately selected
  exact-parent read-domain overlay run reproduced the same failing assertions and
  pass count. New route was not a missing href. This is bounded baseline evidence,
  not complete parent-app execution or universal green CI; guard left unchanged.
- All frozen source hashes matched before/after; no source/dependency writes.

After owner-approved exact 14-file cache cleanup, Coordinator qualified resource
headroom (26.22 GiB disk, over 8.3 GiB RAM) and assigned one semantic type slot.
Readonly/no-network Node `--max-old-space-size=4096` ran TypeScript
`--noEmit --incremental false --pretty false`: exit 2, 40.61 seconds,
3,077,160 KiB peak child RSS. Complete output 17,540 bytes, SHA-256
`85b51c5964a89d77941dcbcef50a481da71c3c10347776832407dc66a5a6ec99`.
Correct count is **51 diagnostics: 10 feature and 41 outside this slice**. The
supervisor's initial overescaped counter printed zero; recounting complete output
corrected it. No shared navigation/frame/template/shell diagnostic was present.

The external Levels-system diagnostics are **environment-unresolved**, not proved
baseline debt: Coordinator verified `levels-system-v2` symlinks outside the
canonical node_modules mount to `vendor/levels-system-v2`. Assigned/canonical vendor
bytes independently match, and required declarations exist. Next selected type
pass may expose only that exact verified dependency read-only. No install, package
change or unrelated type repair is authorized.

Coordinator then selected a successor repair confined to three existing allocated
files, preserving behavior: six Stack layout prop sites use equivalent `sx`, two
TextField bounds use `slotProps.htmlInput`, empty-feed `unavailable` retains its
literal type, and the signed-fixture route test supplies a complete typed
synthetic Platform identity. No API/repository/collector/shared-hunk changes.
Targeted lint and syntax checks on these three files pass. Tests/types/build have
NOT been rerun on the successor; checkpoint1 results remain attributed to its
unchanged original bytes. Successor awaits freeze/preservation and a selected
qualification slot. Production build, real IDs/keys/schema/service activation and
both-account delivery/access remain unverified. No new owner UI approval needed.

## First implementation batch — exact allocation request

Coordinator is preparing reuse of the completed inactive `production-ci-audit`
checkout; it is not assigned yet. Do not access/edit it or create another copy.
Read-only object inspection of serving source `a5ead4e35a846ac0d82cd365688b831d36ece8ee`
confirmed its separate `press-release-article-drawer.tsx`, plus appearance,
deferred PR-count and owner-market-data props absent from this old lane. Preserve
all of these in integration. This supplements the earlier old-lane source table;
the current extracted drawer is the actual visual reference, not a port of the
stale inlined component. Its content model still differs from general news.

New files requested for one synthetic end-to-end slice with inert collector:

```text
src/modules/news/contracts/general-market-news-contracts.ts
src/modules/news/server/general-market-news-access.ts
src/modules/news/server/general-market-news-normalizer.ts
src/modules/news/server/database/general-market-news-schema.ts
src/modules/news/server/general-market-news-repository.ts
src/modules/news/server/general-market-news-ingest.ts
src/modules/news/server/general-market-news-http.ts
app/(dashboard)/market-news/general/page.tsx
app/(dashboard)/market-news/general/general-market-news-feed.tsx
app/api/market-news/general/route.ts
app/api/market-news/general/articles/[articleId]/route.ts
app/api/market-news/general/ingest/route.ts
src/scripts/general-market-news-collector.py
src/modules/news/server/__tests__/general-market-news-access.test.ts
src/modules/news/server/__tests__/general-market-news-ingest.test.ts
src/modules/news/server/__tests__/general-market-news-repository.test.ts
src/modules/news/server/__tests__/general-market-news-routes.test.ts
src/scripts/test_general_market_news_collector.py
```

Carry this plan into the newly assigned lane at the same relative path for
progress. Narrow existing-file hunks requested:

```text
app/dashboard-navigation.ts
app/dashboard-layout-frame.tsx
app/dashboard-template.tsx
app/dashboard-shell.tsx
src/lib/trader-intelligence-v3/__tests__/dashboard-template-enforcement.test.ts
src/docs/trade-execution-analytics/v3-dashboard-template-contract.md
```

Navigation adds only new href/title; frame computes one access boolean; template
and shell pass/filter that flag without changing other access/count/appearance
logic. The guard's `reviewedFeaturePanelFiles` set is directly in the existing
enforcement test on serving a5, not a separate testing contract file. Add only
the scoped feature Drawer allowance and relevant assertions/documentation.

Schema descriptor contains real additive private general-news DDL and indexes
but no numeric migration identity, no auto-apply and no Platform manifest edit.
Coordinator retains carrier ID/order/manifest allocation after exact source
review. Tests apply descriptor to isolated fixtures only. Runtime ingest never
initializes schema; uninstalled schema presents unavailable and writes fail closed.
Collector remains inactive/fake-transport verified until separate configuration,
identity, live provider and service-activation boundaries. No service unit,
dependency/package edits or deployment are in this first request. No PR/scanner,
public News or existing provider path is edited. Exact new-lane absence/ownership
must be checked after actual workspace/branch/visible-project assignment.
