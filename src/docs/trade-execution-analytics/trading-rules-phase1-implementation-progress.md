# Trading Rules Phase 1 Implementation Progress

## Status

Phase 1 template, owned-version-record, governed-evaluation, immutable
lifecycle, and client-safe packet checkpoints completed and locally verified
on 2026-07-28 on
`codex/trading-rules-phase1`.

This phase is deterministic and does not depend on OpenAI or the Analytics
Agent. It builds the first typed Trading Rules boundary over governed v3
execution-only simulation presets already merged into `origin/main`.

## Phase 1 Scope

- Audit the proposed automatic-rule catalog against current v3 capabilities.
- Select templates with an existing exact governed preset.
- Publish a typed, content-addressed template catalog.
- Compile template configuration only through registered v3 preset compilers.
- Fail closed for unknown templates, invalid parameters, and unavailable
  authority.

Durable database persistence, Day Session/trade check-ins, Rules UI, complete
Rule Analytics, natural-language parsing, and AI consumption remain later
checkpoints.

## First Implementation Group

| Template | Existing governed v3 preset |
| --- | --- |
| Maximum completed trades per day | `simulate_maximum_trades_per_day` |
| Maximum ticker attempts per day | `simulate_maximum_attempts_per_ticker` |
| Stop after consecutive losses | `simulate_stop_after_consecutive_losses` |
| Wait after a losing trade | `simulate_wait_after_loss` |
| Stop after a daily realized loss limit | `simulate_stop_after_daily_dollar_drawdown` |
| Stop after a realized profit giveback | `simulate_stop_after_profit_giveback` |
| Stop a ticker after losing attempts | `simulate_stop_after_losing_ticker_attempts` |
| No new trades after a selected time | `simulate_no_new_trades_after_time` |
| Trade only the selected direction | `simulate_direction_only` |
| Avoid an entry-price range | `simulate_exclude_price_range` |
| Skip the next trade after an outcome | `simulate_after_outcome_exclusion` |
| Reduce the next trade to half size after a loss | `simulate_reduce_size_after_loss` |

The fourth-and-later-trade and skip-repeat-attempt presets remain specializations
of configurable maximum-count templates rather than separate user-facing rule
families.

## Capability Audit Result

The selected group maps only to v3 capabilities currently marked:

- `available_with_exact_execution_authority`; or
- `available_when_optional_execution_facts_are_complete`.

The compiler retains the underlying preset's fail-closed behavior for optional
price, size, fee, direction, timezone, chronology, and sample authority.

Rules requiring add/reduction internals, concurrent open-position state,
opening inventory, swing intent, tags, setup quality, emotions, or chart/market
data are not included in this first group.

## Files

- `src/lib/trader-intelligence-v3/analytics/rules/execution-rule-template-catalog.ts`
- `src/lib/trader-intelligence-v3/analytics/rules/compile-execution-rule-template.ts`
- `src/lib/trader-intelligence-v3/analytics/rules/execution-rule-records.ts`
- `src/lib/trader-intelligence-v3/analytics/rules/execution-rule-evaluation.ts`
- `src/lib/trader-intelligence-v3/analytics/rules/execution-rule-dashboard-packet.ts`
- `src/lib/trader-intelligence-v3/analytics/rules/index.ts`
- `src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-template-catalog.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-records.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-evaluation.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-lifecycle.test.ts`
- `src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-dashboard-packet.test.ts`

## Owned Version Records

The second checkpoint adds:

- explicit `userId`, `workspaceId`, and optional `tradingAccountId` ownership;
- distinct workspace-wide and trading-account-specific scopes;
- immutable content-addressed rule versions;
- prospective-only revisions with a strictly later effective timestamp;
- optimistic concurrency through `expectedCurrentRuleVersionId`;
- preservation and ordered retrieval of every prior version;
- fail-closed cross-user access, duplicate identity, unknown template,
  unexpected parameter, non-canonical value, and stale revision behavior; and
- a persistence-neutral in-memory reference repository.

The reference repository proves behavior but is not the production storage
implementation. A durable repository must preserve the same contracts and
enforce ownership server-side.

## Governed Evaluation Records

The third checkpoint adds immutable, content-addressed evaluation records that
bind:

- the exact user/workspace/optional-account owner scope;
- rule instance, immutable rule version, and version digest;
- query plan, query result, simulation plan, and simulation result identities;
- snapshot, dataset, derivation, partition, currency, owner, and account
  authority;
- triggered, broken, and missing-authority trade identities;
- supporting execution and occurrence evidence;
- reason and limitation codes; and
- the evaluation timestamp and evaluation digest.

Status mapping is intentionally conservative:

- a governed rule-responsible excluded trade is `broken`;
- required missing authority is `insufficient_data`;
- an observed trigger with no violation or missing authority is `followed`;
- no observed trigger is `not_triggered`, not followed;
- an empty included population is `not_applicable`; and
- half-size-after-loss remains `unavailable` for adherence because the current
  simulation has no independently declared baseline size.

This first record is a historical query-population evaluation. Day Session,
ticker-day, and individual-trade projections will be built from narrower
governed evaluations instead of client-side status calculations.

Evaluation now also fails closed if any included trade entered before the
selected rule version became effective. The next client-safe/dashboard
checkpoint must supply lifecycle-active intervals so paused periods are
excluded as well.

## Immutable Lifecycle History

The fourth checkpoint adds:

- an automatic immutable activation event when a rule is created;
- prospective active-to-paused and paused-to-active transitions;
- retirement from active or paused, with retirement terminal;
- event sequence, previous-event identity, effective timestamp, owner scope,
  and content digest;
- fail-closed duplicate IDs, stale expected status, cross-user transitions,
  invalid transitions, and retroactive events; and
- protection against creating a new rule version before a later resume event.

## Lifecycle-Active Evaluations

Rule instances now bind their latest lifecycle event. Evaluation requires the
complete verified lifecycle chain through the evaluation time. Every included
trade must:

- enter at or after the rule version became effective; and
- enter during an interval whose latest lifecycle status is `active`.

A population containing a pre-version, paused, pre-activation, or
post-retirement trade fails closed rather than being partially or silently
scored.

## Client-Safe Dashboard Packet

The fifth checkpoint adds a content-addressed packet for the future Rules page.
It exposes user-facing template/configuration/lifecycle/status/count/currency
fields only. It does not expose:

- user, workspace, or trading-account authority ids;
- trade keys;
- execution or occurrence identities;
- snapshot, dataset, partition, query, or simulation authority; or
- unrestricted evidence.

The packet verifies current rule version, complete lifecycle history, optional
latest evaluation, owner consistency, account display scope, time ordering, and
duplicate rule identities before projection.

## Verification

- `npx vitest run src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-template-catalog.test.ts --reporter=dot`
  - passed: 1 file, 4 tests
- `npx tsc --noEmit --pretty false`
  - passed
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-records.test.ts --reporter=dot`
  - passed: 1 file, 5 tests
- `npx tsc --noEmit --pretty false`
  - passed after the owned-version-record checkpoint
- `npx vitest run src/lib/trader-intelligence-v3/__tests__/trading-rules/execution-rule-evaluation.test.ts --reporter=dot`
  - passed: 1 file, 6 tests
- Targeted combined Rules/server-adapter/dashboard identity verification:
  - passed: 5 files, 21 tests
- `npx tsc --noEmit --pretty false`
  - passed after repairing the new rule timestamp type and four existing
    server/dashboard identity-integration errors exposed by this checkpoint
- Lifecycle and effective-window verification:
  - passed: 2 files, 12 tests
- `npx tsc --noEmit --pretty false`
  - passed after the lifecycle checkpoint
- Lifecycle-active evaluation and client-safe packet verification:
  - passed: 2 files, 12 tests
- `npx tsc --noEmit --pretty false`
  - passed after the client-safe packet checkpoint
- Final bounded Rules plus affected server/dashboard contract verification:
  - passed: 7 files, 32 tests

## Next Step

After this Phase 1 checkpoint:

1. Owner-review the integrated `/rules` page on the approved light Material
   dashboard.
2. Attach governed live evaluations to the existing client-safe packet after
   the eligible execution-analytics population is available.
3. Add narrower Day Session/ticker/trade evaluation projections.
4. Do not start AI-assisted rule creation.

## Material Dashboard And Durable Local Actions

The sixth checkpoint integrates the Rules system into the approved v3 dashboard
running locally on port 3010:

- `/rules` uses the existing TradersLink logo, collapsible navigation,
  full-width Material layout, and compact application header;
- the navigation exposes Trading Rules as a first-class dashboard destination;
- current active, paused, and retired rules render only from the client-safe
  Rules packet;
- the searchable 12-preset library creates configured rules without evaluating
  financial facts in the browser;
- adjusting a rule creates a prospective immutable version;
- pause, resume, and terminal retirement use the guarded lifecycle contract;
- the local SQLite adapter persists an append-only command log outside the
  repository and reconstructs the verified reference repository after restart;
- mutation routes derive owner/workspace scope on the server and use the
  existing owner, Origin, private-cache, and route-containment boundaries; and
- evaluation cards remain explicitly waiting until a governed eligible
  analytics run exists.

This local persistence adapter is not production authentication or managed
multi-tenant storage. Outside users still require the production identity and
storage foundation recorded in the main plan.

Verification for this checkpoint:

- targeted Rules, restart-persistence, and route-containment verification:
  7 files and 38 tests passed;
- `npx tsc --noEmit --pretty false` passed;
- the Next.js 16.2.6 optimized production build passed with the same eight
  existing non-fatal broad filesystem-tracing warnings; and
- the restarted `127.0.0.1:3010` runtime returned private 200 responses for
  `/workspace` and `/rules`, exposed Trading Rules in navigation, rendered the
  Rules heading and preset library, and reported no request errors.

### Rules Language And Saved-Rule Rendering Follow-up

- Replaced internal wording in the Rules library with trader-facing language:
  rules are described as checks against trade data, and dollar values display
  with `$` rather than internal data terminology.
- Added an explicit example for the fixed half-size-after-loss rule.
- Normalized the dashboard packet to plain JSON data before it crosses from
  the server page to the client page, preventing a saved rule from causing a
  React Server Component serialization error.
- Verification: 28 focused Rules tests and TypeScript passed; the optimized
  `3010` runtime returned a private 200 response for `/rules` with a saved
  rule, the new wording, dollar examples, and no user-facing `partition`
  wording.

### Manual Custom Rules Dashboard Checkpoint

- Added a separate, durable Manual Custom Rule path on `/rules` for
  trader-authored commitments that cannot truthfully be evaluated from trade
  executions.
- Each custom rule has a title, plain-language statement, category, future
  check-in scope, optional Focus Rule status, prospective immutable versions,
  and active/paused/retired lifecycle controls.
- Custom rules are explicitly presented as manual commitments. Day Session and
  trade check-ins, adherence results, P/L comparisons, AI interpretation, and
  automatic free-text evaluation remain deferred.
- Local persistence uses dedicated owner-scoped SQLite tables with immutable
  version and lifecycle rows; the client receives no owner identifiers.
