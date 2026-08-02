# Phase 5 Slice F Remaining Modules Plan

**Status:** F1-F6 are locally accepted through Phase 6. Focused sequential verification, production build and integrated browser/API/privacy checks passed; production transfer/deployment remain external.

**Scope:** Phase 5 Slice F only

**Completed F2 contract:** [Academy Identity And Progress Plan](phase-5-slice-f2-academy-identity-and-progress-plan.md)

**Completed F3 contract:** [Watchlist Storage And Access Plan](phase-5-slice-f3-watchlist-storage-and-access-plan.md)
**Completed F4 contract:** [News Content And Affiliate Ownership Plan](phase-5-slice-f4-news-content-and-affiliate-plan.md)
**Completed F5 contract:** [Platform Peers And Legacy Route Disposition Plan](phase-5-slice-f5-platform-peers-and-legacy-route-disposition-plan.md)

## Outcome

Finish the replacement application outside the already accepted Journal,
Journal Analytics and Level Analysis slices. Every remaining route and
operation receives an implemented replacement, an explicit compatibility
boundary, a deliberate pre-go-live deferral or an owner-approved rejection.
Nothing is bulk-copied merely because it is recent, and no module may fall back
to a Journal- or V3-named database.

The approved light Material dashboard remains the visible baseline. Technical
completion continues before the next combined visual checkpoint.

## Current verified boundary

- The replacement checkout is
  `C:\Users\jerac\Documents\TraderLink\traderlink-platform` on
  `codex/traderlink-platform-replacement`.
- Phase 5 Slices A-E and F1-F6 are locally implemented. The replacement
  database has 18 migrations, 61 domain tables and the accepted Journal facts.
  Production owner linking/source transfer/deployment and Phase 6 verification
  remain pending.
- Legacy trades, tags, rules, notes and reviews are disposable test data. They
  are not recovery inputs. New annotations remain bound to Platform user,
  selected Journal account and stable round-trip/trading-day identities.
- The preserved local mixed database contains the one News article now copied
  and reconciled under News ownership; it contains no Academy progress,
  affiliate, Journal, coaching or account rows. The
  separate legacy Watchlist database has zero symbol, health and archive rows.
  Both pass `quick_check`; the Watchlist file is preservation evidence only and
  its zero rows were deliberately not copied.
- Production Academy progress is protected external user data even though no
  local progress rows were observed. Existing slugs and aliases remain
  immutable unless the Academy preservation contract is updated first.
- Ports 3000, 3010 and 3011 remain off. No push or deployment is authorized.

## Complete Slice F target list

This list is controlling; checkpoint boundaries limit timing, not inventory.

1. Platform shell, preferences and readiness state.
2. Platform identity/account activation: stable user/workspace/membership
   identities, user-defined multiple Journal accounts, account selection and
   creation, loopback local review, account UI, Discord-first public login
   before go-live and optional email/password only if still wanted.
3. Coach/Review/Reflection: reflection periods, queues, plans, trader-authored
   reviews, factual explanation provenance and all related compatibility APIs.
4. Academy: index, course, path and lesson routes, lesson completion API,
   session behavior, production progress and slug-baseline/alias preservation.
5. Watchlist: current list, symbol page, archives, archive detail,
   how-it-works, ingestion, authenticated stream, recap, symbol API, health and
   authorized archive reset.
6. News/content: index, ticker, article and free article routes, article ingest,
   Week Ahead content, scanner access, market-plan content and preserved
   low-priority Big Time automation.
7. Account/Affiliate: profile/preferences, module access, invite/referral facts
   and account-facing relationships.
8. Platform peers: Market Charts, platform readiness, scanner access, landing
   and shared site routes.
9. All required compatibility handlers and redirects.
10. Every one of the 52 legacy `/intelligence` pages, mapped by unique
    capability to Platform, Journal, Journal Analytics, Coach, Level Analysis,
    operations, explicit deferral or owner rejection.
11. Module-specific environment, database, process, scheduled-task,
    verification, CI and deployment ownership.

## Verified problems to correct

1. `/reflection-loop` is a static placeholder rather than a factual workflow.
2. `/api/coach/latest` and `/api/review/latest` still use V3 authorization,
   legacy saved-report repositories and sample fallbacks.
3. Academy, News, Watchlist and Affiliate local storage may fall back to
   `TRADER_INTELLIGENCE_DB_PATH` or repository-local databases.
4. Academy/Watchlist access is coupled to the older Discord session store even
   though the stable Platform identity must own login before go-live.
5. News and Watchlist have useful existing module code, but storage migration
   currently runs as an access-time side effect.
6. `/platform-readiness` is inventoried but no active page exists in the
   replacement checkout.
7. The 52-page `/intelligence` tree remains reachable preservation code and
   imports V3 heavily; it cannot be deleted until every unique capability has a
   disposition.

## F1 - Reflection Loop, Coach and Review

F1 is first because it is a visible dashboard feature and its two compatibility
APIs still substitute V3/sample state. F1 is read-only and requires no database
migration.

### Factual input boundary

The new Coach module consumes only published replacement services:

- Journal Analytics trading-day and round-trip facts;
- Journal Data Decisions state;
- Journal rules and trader-authored rule reviews;
- Journal daily and stable-round-trip notes; and
- Journal tag definitions and stable-round-trip assignments.

It does not query V3 tables, legacy saved reports, legacy review queues,
fixture/sample data or private module tables directly. It sends no Journal fact
to an external AI/provider.

### Period and money contract

- Supported periods are `daily`, `weekly` and `monthly`.
- The anchor defaults to the latest selected-account trading date. A supplied
  anchor must be an exact calendar date.
- Weekly means Monday through Sunday in the selected Journal account's trading
  timezone. Monthly means the first through last calendar day containing the
  anchor.
- Money remains partitioned by currency. The service never sums unlike
  currencies. The selected or first available currency is explicit.
- Source decimal strings remain exact. Visible numbers use at most two decimal
  places through the accepted Journal Analytics formatter.

### Read model

One immutable plain-object response includes:

- period, anchor/range, timezone, currency and available currencies;
- ready-closed trade/day/net-P&L/win-rate facts with coverage;
- legitimate-open and needs-decision counts kept separate;
- account-wide pending Data Decisions as an explicit factual attention item;
- each in-period trading day and its ready-closed stable round trips;
- whether each day/trade has a trader-authored note;
- the trade's currently assigned tag names;
- followed/broken/not-reviewed rule-review counts;
- active focus rules; and
- factual next-action prompts that link to Data Decisions, Trade Tracker,
  Round Trips or Rules.

Missing notes, tags or rule reviews are reported only as incomplete
trader-authored reflection. They never become an automated mistake, strategy,
intent or behavior classification. Trades needing a Data Decision remain out
of dependent P/L while unrelated ready trades remain visible.

### Page and compatibility routes

- `/reflection-loop` reads the service directly as a Server Component and uses
  query-string links for daily/weekly/monthly selection. It does not fetch its
  own API.
- `GET /api/coach/latest` returns the same authoritative read model under a new
  replacement contract and never emits sample data.
- `GET /api/review/latest` returns the same authoritative read model under a new
  replacement contract and never emits a legacy queue.
- All three derive the loopback Platform request scope and active Journal
  account on the server. Request content cannot supply a user, workspace or
  database path.
- F1 has no mutation. Existing Journal pages remain the authoring surfaces for
  notes, tags, rules and reviews.

### F1 verification gate

1. Static active-file proof rejects V3/sample/legacy-database imports.
2. Focused service tests prove daily/weekly/monthly boundaries, account and
   currency isolation, exact coverage, stable-round-trip annotation binding,
   empty-annotation behavior and Data Decision containment.
3. Route tests prove local scope, no sample fallback and privacy-safe output.
4. Dependency-scoped TypeScript and targeted lint pass.
5. Focused Vitest runs with one worker and no file parallelism.
6. A read-only real-database verifier proves the 331/0/2 fact boundary,
   replacement annotation counts and unchanged database size/hash.
7. Port 3010 remains off until the combined visual checkpoint.

### F1 implementation checkpoint

`/reflection-loop`, `GET /api/coach/latest` and `GET /api/review/latest` now
derive the loopback Platform scope and selected Journal account and read the
same replacement Coach service. The service composes published Journal
Analytics, Data Decisions and Journal annotation services. It contains no V3
authentication, legacy saved-report repository or sample fallback, and it
writes nothing.

Dependency-scoped TypeScript, targeted lint and the 85-file active no-V3/no-
sample verifier pass. The privacy-safe real-database verifier proves 18 trading
days and all 331 ready-closed round trips in the current monthly period, zero
legitimate-open positions, two contained Data Decisions, and zero replacement
daily notes, round-trip notes, tagged trades or active rules. The database
remained 11,087,872 bytes with SHA-256
`7c81fabba5fa4eac106cd7c4238011ac49ea8170f197bb9ad5408ac9fbdb00d0`.

Two focused files with seven service/route cases are written. Their one-worker
Vitest execution was refused by the active repository test-policy approval
layer, so that execution remains explicitly deferred rather than reported as a
pass. No workaround runner was used. This is a verification timing exception,
not removal of the tests from Phase 6 acceptance.

## Later Slice F boundaries

### F2 - Academy identity and progress preservation

Inventory production storage without printing credentials or user identities;
preserve every protected slug/alias; remove Journal-named local fallback; and
bridge existing Academy/Discord identities to stable Platform users before any
public login activation. No production progress reset, recreation or key
change is allowed.

The accepted detailed boundary is recorded in the
[F2 Academy Identity And Progress Plan](phase-5-slice-f2-academy-identity-and-progress-plan.md).

### F3 - Watchlist named storage and access

Keep useful pages, stream/ingest/recap behavior and provenance. Replace
cross-module fallback and access-time migration with explicit Watchlist-owned
storage lifecycle. Preserve any production rows even though the observed local
fallback is empty.

The accepted detailed boundary is recorded in the
[F3 Watchlist Storage And Access Plan](phase-5-slice-f3-watchlist-storage-and-access-plan.md).

F3 is technically complete. Migration 0014 adds three empty Watchlist-owned
tables to the replacement database. Local and accepted single-node hosted
runtime use the explicit Platform database; ordinary requests execute no
schema DDL. Pages/read APIs use a Platform-owned access service with guarded
local identity or public Platform sessions/current Discord membership.
Publisher-token mutation routes remain separate. Exact hosted row adoption is
implemented as F6 preview/authorized-transfer/reconciliation tooling and has
not run against production.

### F4 - News/content and Affiliate ownership

Move the one observed local News record only after exact backup/restore and
reconciliation. Preserve hosted content and affiliate relationships under
named owners. Big Time remains preserved low-priority automation, not a
Journal dependency. The exact accepted implementation contract is
[Phase 5 Slice F4 - News Content And Affiliate Ownership](phase-5-slice-f4-news-content-and-affiliate-plan.md).

F4 is technically complete. Migrations 0015-0016 add versioned News content
and stable-Platform-user affiliate attribution. The one verified local News
article was copied once with one immutable version after source and replacement
backup/restore gates; an immediate rerun proved idempotency. Affiliate starts
empty because no local affiliate rows exist. Runtime stores no longer create
schema or fall back to Academy, generic, V3/Journal-named or repository-local
databases. The publisher requires its token in every environment. F6 exact
hosted preview/authorized-transfer/reconciliation is implemented, including
pending-not-guessed Affiliate identities, but has not run against production.

### F5 - Platform peers and legacy-route disposition

Implement missing Platform readiness and accepted peer surfaces, then map all
52 `/intelligence` pages by unique capability. Prefer compatibility redirects
to complete replacement pages; keep an explicit unavailable/deferred state
when a capability is not accepted. Delete nothing in Phase 5.

The exact 52-route capability map and implementation gate are recorded in the
[F5 Platform Peers And Legacy Route Disposition Plan](phase-5-slice-f5-platform-peers-and-legacy-route-disposition-plan.md).

F5 is technically complete. `/workspace/readiness` now reports privacy-safe
replacement database, ownership, module and launch-gate state inside the
approved dashboard. A typed registry matches all 52 preserved legacy pages and
temporary redirects intercept them before the V3 filesystem layout. No legacy
source was deleted.

### F6 - Public identity activation

Immediately before go-live, connect Discord-first public authentication to the
existing stable Platform user/workspace/account identities. Preserve Academy,
Watchlist and affiliate relationships. Email/password remains optional and is
not required for local technical completion.

The exact public identity, single-node hosted SQLite, transfer and launch
boundary is recorded in the
[F6 Public Identity And Hosted Transfer Plan](phase-5-slice-f6-public-identity-and-hosted-transfer-plan.md).

## Stop conditions

Stop the affected slice if production data ownership cannot be proven, an
identity cannot be mapped without guessing, an Academy slug/progress change is
unprotected, unlike currencies would be combined, a Coach result would assert
subjective behavior without trader evidence, another task starts overlapping
writes, or database/process/Git state changes outside the authorized slice.

## Phase boundary

Broad regression, full TypeScript/lint, production build, browser/E2E,
deployment rehearsal and final restore rehearsal remain Phase 6 work. Slice F
does not stage, commit, push, deploy, retire legacy assets or start port 3010
unless a later coherent checkpoint explicitly requires it.
