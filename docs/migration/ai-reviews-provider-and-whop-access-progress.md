# AI Reviews Provider Acceptance and Whop Access Progress

## Status

Phase A provider acceptance and the Phase B paid-access implementation are
complete in source as of 2026-08-09 under the owner-approved
[plan](ai-reviews-provider-and-whop-access-plan.md). Migrations 0045, 0046,
0048 and 0049 are registered, disposable-copy verified and locally applied.
The local Luna model and four-rate pricing are configured. The accepted USD
2.00 per-subscriber paid-cycle safeguard, non-blocking global warning and
separate emergency-stop contract are implemented while customer generation
remains deliberately inactive. No
production deployment, hosted scheduler, customer
entitlement or provider activation has occurred.

## 2026-08-09 preparation

- The project-local environment already declares `OPENAI_API_KEY`; no credential
  was copied from another app and no secret value was displayed.
- The production adapters use AI SDK structured output for the approved v2
  weekly/two-week and monthly contracts.
- Official OpenAI documentation currently lists GPT-5.6 Sol, Terra and Luna with
  structured-output support. Terra is the initial balanced acceptance candidate;
  a lower-cost comparison is conditional on measured quality.
- Official Whop documentation confirms recurring subscriptions and trials are
  configured on Whop plans, cancellation-at-period-end retains a billing-period
  boundary, membership deactivation covers failed-payment/cancellation loss of
  access, payment failures may be retryable, and webhook delivery is unordered.
- Repository inspection found no Whop credential configured. Whop production
  connection therefore remains fail-closed until the owner creates the required
  company API key/webhook secret and supplies the accepted product identifier.
- The earlier social-account/Discord lookup idea was removed after checking the
  current Whop API. Identity linking will use Whop OAuth 2.1 with PKCE from an
  already authenticated TraderLink session. Only keyed Whop references will be
  stored; email, Discord identity, raw Whop IDs and OAuth tokens will not be
  persisted.

## Checklist

- [x] Guarded v2 acceptance runner implemented.
- [x] Controlled provider scenarios completed and reviewed.
- [x] Model/cost recommendation recorded.
- [x] Whop migration number coordinated as `0045_platform_whop_ai_review_entitlements`.
- [x] Entitlement projection implemented and disposable-copy verified.
- [x] Signed webhook and identity-link verification completed with synthetic events.
- [x] Account/Admin subscription presentation approved.
- [ ] Production limits completed; model, pricing and credential are ready but
  the owner will set abuse-protection limits in Admin.
- [x] One disposable end-to-end fixture issuance and no-call reopening proof.
- [x] Admin Whop reconciliation source, disposable-copy proof and locally
  applied migration 0048.
- [x] Shared trailing-30-day spend guard, disposable-copy proof and locally
  applied migration 0049.
- [x] Per-subscriber paid-cycle safeguards, exact cache-write accounting,
  disposable-copy/backup proof and locally applied migrations 0050 and 0051.

## 2026-08-09 zero-call preparation checkpoint

- Targeted ESLint, scoped TypeScript and `git diff --check` passed for the
  guarded acceptance runner.
- The read-only preparation completed five fixture-only scenarios using only
  `AIR..` evidence. It made zero provider calls and wrote no review.
- The context-free single-trade case was classified as insufficient and made
  zero provider calls, matching the accepted product gate.
- The first external run was stopped before transmission by the execution
  safety boundary. It now waits for the owner's explicit confirmation that the
  synthetic `AIR..` execution facts and fixture-authored notes may be sent to
  OpenAI for this acceptance run. No workaround was attempted.

## 2026-08-09 controlled provider acceptance

- The owner explicitly approved transmitting the synthetic fixture evidence to
  OpenAI. No real trader identity, account identifier, broker identifier,
  Journal note or financial value was transmitted.
- Three Terra batches exercised execution-only, completed-reflection,
  incomplete-saved-reflection, prior-review continuity, two-week and partial
  exact-calendar-month inputs. The 16 generated fixture reviews had measured
  estimated cost of $0.39615750. The context-free single-trade case continued
  to make zero provider calls.
- The initial prompts allowed too much model arithmetic and made optional
  reflection entry too prominent for low-participation traders. The accepted
  prompts now prohibit derived numeric values, forward trading commands and
  internal product language while requiring useful execution-only analysis.
- Final Terra outputs were useful and factually grounded. Execution-only
  reviews compared supplied day results, outcome concentration and repeated
  tickers without making Trade Tracker completion a requirement. One two-week
  response exposed an internal data-quality term and was therefore not safe to
  accept on prompt compliance alone.
- A deterministic provider-boundary guard now rejects internal implementation
  language and direct trading direction before persistence. Rejected work
  remains retryable from the frozen evidence snapshot. The safety error carries
  provider usage so the failed-attempt receipt and Admin cost totals still
  account for a charged but unsaved response.
- Luna replayed the same frozen synthetic inputs successfully for an
  execution-only week, a note-rich week, a two-week review after one safety
  retry, and an exact-calendar-month review. The four accepted outputs cost an
  estimated $0.04944400. One rejected Luna response occurred before rejected
  usage capture was added, so that acceptance-only charge is not included in
  the measured total.
- Luna's accepted outputs were comparably useful to Terra for these fixtures.
  The launch recommendation is `gpt-5.6-luna`, protected by the deterministic
  output guard and retry path, with `gpt-5.6-terra` retained as the Admin-selectable
  fallback if live quality or rejection monitoring warrants it. Current official
  per-million-token prices recorded for configuration are: Luna $1 input,
  $0.10 cached input and $6 output; Terra $2.50 input, $0.25 cached input and
  $15 output.
- Focused ESLint and `git diff --check` passed for the acceptance runners,
  provider prompt adapters, safety guard and issuance changes. A direct local
  check proved that the known unsafe phrase is rejected with complete usage
  attached. No acceptance output was saved as a customer review and no global
  provider or scheduler control was enabled.
- A follow-up provider-package audit found that internal unresolved-record
  counters and the internal limitation code were still serialized even though
  the prompt told the model not to repeat them. The provider boundary now omits
  those internal counters, translates coverage reasons into plain Trade Tracker
  language and refuses to serialize the internal product term. The immutable
  stored snapshot retains the exact coverage facts for audit and retry.

## 2026-08-09 Whop paid-access checkpoint

- Migration `0045_platform_whop_ai_review_entitlements` owns privacy-safe OAuth
  links, current membership projections and immutable webhook receipts. It
  stores keyed references only: no raw Whop IDs, email, payment/card data,
  review text or OAuth token.
- The signed webhook route validates Standard Webhooks signatures and freshness,
  the v1 dated payload contract, event/header identity, company and product
  allowlists before opening a write transaction. Delivery is replay-safe and
  unordered events are stale/conflict classified rather than blindly applied.
- `membership.activated` grants projected access; cancellation-at-period-end
  keeps it active; `membership.deactivated` removes new-generation access.
  `payment.failed` is an operational receipt only and never revokes access.
- Whop OAuth uses `openid` only with PKCE and an authenticated TraderLink
  session. The transient access token is used once for `userinfo.sub`, is not
  persisted, and is converted immediately into a keyed linkage reference.
- The generation coordinator now checks access per Platform user. Pending work
  for a user without access is retained and makes no provider call. Saved issued
  reviews remain readable because read paths are not entitlement-gated.
- The strengthened disposable coordinator proof now exercises the production
  Whop policy rather than relying only on source inspection: no OAuth link fails
  closed, a linked active membership becomes available, deactivation fails
  closed again, review/attempt/issued counts remain unchanged and no provider
  call is made.
- Account and Admin views present the subscription/access states without
  duplicating price/trial truth or exposing customer identity. The Admin master
  switch cannot be enabled unless OpenAI, Whop launch configuration and the
  protected scheduler secret are present in addition to existing prices/caps.
- Admin now separates Whop readiness into signed access updates, Whop account
  connection, accepted company/product scope, membership backup checking and
  customer subscription/management links. It shows only ready/unavailable
  states; secret values and raw Whop/customer identifiers remain hidden.
- The focused disposable-copy verifier passed the complete signed activation,
  duplicate, cancellation, stale-event, deactivation and failed-payment flow;
  found no raw identifier leakage, preserved unrelated Journal/AI Review table
  counts and returned zero foreign-key failures. It was rerun after local
  application against an already-current disposable copy and passed the same
  lifecycle, isolation and foreign-key checks without attempting to recreate
  the 0045 tables.

## 2026-08-09 cached pricing and automatic-review QA checkpoint

- Migration `0045_platform_whop_ai_review_entitlements` was applied locally
  from the frozen disposable-verified source. It remains inactive because no
  real Whop launch configuration or entitlement is present.
- Migration `0046_coach_ai_review_cached_input_pricing` adds cached-input price
  and usage to settings, reservations and immutable attempt receipts. The
  strengthened disposable-copy verification calculated 100 input tokens with
  40 cache-read tokens and 20 output tokens at Luna rates as exactly
  `$0.000184`, rejected incomplete usage, preserved unrelated counts and found
  zero foreign-key failures. It was then applied locally; the database and
  manifest are current through 46.
- Local Admin configuration selects `gpt-5.6-luna` with $1 input, $0.10 cached
  input and $6 output per million tokens. The briefly proposed $500-per-day
  limit was rejected by the owner and cleared. Weekly and monthly controls and
  limits remain disabled/unset until the owner chooses the acceptable abuse
  ceiling in Admin; the master switch cannot be enabled while they are blank.
- Account choices remain intentionally limited to On/Off, cadence and weekly
  timing. Execution facts, non-empty saved notes, saved tags and recorded rule
  results are eligible regardless of Daily Trade Tracker review completion.
  Completion only permits the extra-time mode to start sooner.
- A context-free single closed trade defers once and combines with the next
  trading week; it is not discarded. Visible no-generation states are: AI
  Reviews off, period still open, evidence too thin, one-trade combination,
  selected timing window, paid access unavailable, or an Admin safety pause.
  Pending/generating/retry states preserve already-frozen evidence.
- Focused ESLint passed. Whole-project TypeScript still exits nonzero on active
  unrelated Analytics, AI Chat, Tracker and Moomoo work; cached-pricing and
  Whop errors introduced by this slice were cleared.
- One guarded disposable end-to-end fixture ran the real Luna adapter through
  reservation, provider issuance, immutable usage/cost receipt and saved-review
  reopening. It made one provider call, saved and reopened the review, made no
  second call, returned zero foreign-key failures and left the live database
  unchanged. The measured fixture cost was `$0.0066288`.

## 2026-08-09 Whop reconciliation checkpoint

- Migration `0048_platform_whop_ai_review_reconciliation` and its owner-only
  Admin service are implemented. The migration is registered, disposable-copy
  verified and locally applied in narrow commit `d2414d6d`.
- The disposable-copy verifier passed two-page Whop membership retrieval,
  replay, stale-safe projection reuse, durable failure audit, immutable run
  history, unrelated-count preservation and zero foreign-key failures. It found
  no raw Whop/customer identifier in stored projections, receipts or run data.
- A missing membership is intentionally not treated as deactivation. Only a
  returned accepted-company/product membership may update projected access;
  signed `membership.deactivated` remains the authoritative webhook path.
- The Admin action is disabled until API key, company/product allowlist, dated
  API contract and identity-protection key are configured. It never displays or
  stores those values.
- The existing daily Admin caps remain unset. They protect against burst abuse
  but do not guarantee the owner's monthly budget, so one trailing-30-day
  platform spend ceiling shared by weekly and monthly AI Reviews is now a
  pre-launch requirement. This adds one Admin setting rather than separate
  cadence-specific monthly fields and does not imply that a `$500` default is
  acceptable.

## 2026-08-09 rolling-spend safeguard checkpoint

- Migration `0049_coach_ai_review_rolling_spend_guard` is implemented,
  registered, disposable-copy verified and locally applied in narrow commit
  `02957d0c`.
- Admin receives exactly one trailing-30-day estimated-spend limit shared by
  weekly, two-week and monthly AI Reviews. The master switch cannot enable while
  it is blank, and an enabled platform cannot silently clear it.
- Reservation enforcement combines both cadences before provider transmission.
  Every reserved/started call counts its conservative maximum until finalized,
  even when it was reserved more than 30 days ago; finalized work counts exact
  immutable receipt cost by receipt time inside the rolling window. This closes
  the outstanding-liability age-out edge case without permanently overstating
  completed usage.
- The standalone in-memory verifier proved a weekly reservation consumes shared
  room, a following monthly reservation is blocked with
  `TRADERLINK_COACH_REVIEW_ROLLING_SPEND_CAP_REACHED`, exact completion cost
  releases conservative room for a later review, an outstanding 31-day-old
  reservation still blocks new spend, blank-cap enablement is rejected and
  foreign-key check returns zero.
- No default amount was inserted. The owner will choose the limit in Admin;
  `$500` is not an accepted daily or 30-day default.
- A final no-op migration-runner check after both applications returned no
  pending migrations. Port 3010 was not started, stopped or restarted.

## 2026-08-09 subscriber safeguard and cache-write completion

- Migrations `0050_coach_ai_review_subscriber_budget_safeguards` and
  `0051_coach_ai_review_cache_write_accounting` are registered,
  disposable-copy verified, backed up, locally applied and frozen. The local
  database and manifest are current at 51/51.
- The superseded shared hard ceiling is now a non-blocking Admin warning. The
  normal blocking safeguard is USD 2.00 per subscriber per stored Whop paid
  cycle across every owned Trade Tracker account. Only a separately configured
  emergency global stop may pause all subscribers. AI Chat is excluded.
- Reservations and immutable receipts distinguish ordinary input, cache read,
  cache write and output. The controlled Luna cache-write proof returned an
  exact four-rate estimate of USD 0.00835275 without persisting a review.
- Customer provider calls, real Whop entitlement, hosted scheduling and
  deployment remain inactive. The QA-first resume point and production launch
  checklist are in [AI Reviews Beta Handoff](ai-reviews-beta-handoff.md).

## 2026-08-09 QA request-only correction

- Fresh read-only beta QA found that the authenticated `Generate now` server
  action could enter the provider coordinator after launch controls were
  enabled. This contradicted the accepted request-only contract.
- The action now only freezes or reuses its account-scoped immutable pending
  request. It does not reserve capacity, start an attempt or call a provider;
  protected scheduler issuance remains the only execution path. No hosted
  configuration, migration, provider call or scheduler activation occurred.
