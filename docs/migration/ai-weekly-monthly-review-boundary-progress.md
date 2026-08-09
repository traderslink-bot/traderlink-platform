# Weekly and Monthly AI Review Boundary Progress

## Status

Owner-approved product boundary recorded on 2026-08-06. This document began as
the design and implementation record and now tracks the accepted implementation
slices below. No implementation slice rewrites Journal facts or activates an AI
provider.

Completion-driven generation and late-review behavior were refined with the
owner on 2026-08-07. The owner then approved the QA simplifications, one-time
thin-week two-cohort aggregation, `Monthly only`, and fixed 8:00 AM Eastern
next-day monthly generation. The authoritative market-calendar source and the
Daily Trade Tracker handoff are now also selected. AI Chat adaptation is a
later follow-on and does not block AI Review implementation or acceptance.

On 2026-08-08 the owner approved two explicit weekly/two-week timing modes and
removed completion as a note-inclusion gate. `Automatic after 12 hours`
generates 12 hours after the final-session post-market seal without
requiring any Tracker completion. `Give me extra time for Trade Tracker
reviews` may generate when the trader has marked reviews complete or selects
`Generate now`, but otherwise generates at the following trading week's final
post-market seal. Every non-empty note saved when generation begins is eligible
with its completed/incomplete state. Completion affects early timing only in
the extra-time mode. Migration `0043_coach_ai_review_timing_modes` persists the
choice; it passed disposable-copy verification and was applied locally.

On 2026-08-08 the owner also approved the automatic-generation and Journal
Administration completion slice now tracked in the controlling plan under
**Approved automatic-generation and administration completion slice**. The
scope includes the v2 coordinator/pending-request issuance path, immutable
retry behavior, non-expiring monthly automatic due state, global Admin master
control, personal Account On/Off, truthful scheduler/provider/calendar/paid-
access status and the simplified Account/AI Reviews copy. The scope explicitly
excludes real provider activation, paid entitlement activation, hosted
scheduler activation, deployment, AI Chat and Tracker/analyzer changes.

The pre-implementation QA established the current local baseline through a
read-only aggregate check: one v2 account setting is enabled, both weekly and
monthly platform provider controls are disabled with no configured caps,
provider pricing is incomplete, no legacy v1 delivery schedule exists and no
v2 period request exists. The existing scheduled route still invokes v1
runners; the v2 automatic request coordinator and v2 issuance entry points are
dormant and disconnected. Therefore no automatic or manual v2 AI Review can be
issued in the current local state, even when the UI planner says a period is
ready. This is the first implementation blocker for the new checklist.

The automatic-generation and administration completion implementation is now
technically complete. The owner approved the consolidated Account, AI Reviews
and Journal Administration visual checkpoint on 2026-08-08.
The scheduled route and `Generate now` action both use one fail-closed v2
coordinator. It freezes eligible evidence once, consumes pending requests
oldest-first, retries from the same immutable snapshot and leaves sufficiently
evidenced monthly periods automatically due until a request exists. The
default paid-access adapter remains deliberately `not_connected`, platform
provider controls remain owner-controlled, and no verification contacted
OpenAI.

Account now has a personal On/Off setting, the three accepted frequencies and
only the two accepted timing choices. Monthly-only hides weekly timing;
automatic timing is named `Automatic after 12 hours`; saved Tracker input is
still used without requiring daily review completion; and a context-free
one-trade week is explicitly labelled as combining once with the next trading
week. AI Reviews now distinguishes open/scheduled, insufficient, combining,
pending, generating, retrying, platform unavailable and paid-access
unavailable states and shows automatic instants in the viewer's local time.

Journal Administration now provides one global `AI Reviews available` safety
switch backed by the existing weekly/monthly provider controls, separate
weekly and monthly daily caps, provider credential/model/pricing status,
privacy-safe v2 operational counts, hosted-scheduler inactive status,
paid-access not-connected status, current/next verified calendar coverage and
an owner-only two-source `Verify calendar now` action. Review-time and page-time
calendar reads remain stored-snapshot-only.

Migration `0044_coach_ai_review_scheduler_health_v2` was coordinated before
registration, verified on a disposable database copy with protected counts
unchanged, immutable terminal run history and zero foreign-key failures, then
applied locally as the only pending migration. It records aggregate scheduler
run health without account identities or review content. Focused non-Vitest
verification passed for both timing modes, completion-triggered early start,
saved incomplete reflections, shared v2 routing, oldest-first ordering,
non-expiring monthly due state, frozen-evidence retry wiring, paid/provider
fail-closed behavior and no provider mutation. Targeted ESLint and
`git diff --check` pass. Changed-file TypeScript filtering is clean; the whole
project still reports unrelated pre-existing Analytics, Tracker, AI Chat and
test-file errors outside this slice. Port 3010 was not touched, no Tracker or
analyzer file was edited by this slice, and no scheduler/provider/paid access,
push or deployment was activated.

The first Journal Administration runtime check found a v2 cost-aggregation
query still reading `review_kind` from the generation-attempt row. In v2 that
field belongs to the linked period-request row. The query now joins the scoped
period request by request, user, workspace and account identifiers and groups
by its review kind. The focused disposable-database verifier now executes this
Admin aggregation path; it passes with no provider mutation, and the corrected
repository and verifier have no scoped TypeScript or ESLint errors. No schema
change or migration was required.

The owner then approved the corrected Journal Administration presentation and
the complete Account/AI Reviews/Admin visual slice on 2026-08-08. This closes
the local review-engine and UI acceptance checkpoint. Paid entitlement,
provider configuration and activation, hosted scheduling and production launch
remain deliberate launch work rather than unfinished visual-design work.

Implementation began on 2026-08-07 with an isolated non-visual server
checkpoint. The versioned 2026 U.S.-equities calendar snapshot/validator and
cadence-neutral v2 weekly/two-week and monthly input/output type contracts are
implemented. Additive v2 weekly/two-week and monthly due-time functions now use
that calendar and preserve the existing v1 functions for current callers.
The additive weekly/two-week v2 input builder and private-lineage snapshot are
implemented, along with strict monthly v2 extraction/assembly. The v2
repository and read-only runner planners are integrated. Migration `0037` is
registered in the shared source manifest and applied in the local development
database. Provider prompts/calls, runner activation, paid entitlement
activation and automatic generation remain pending, so the new policy is not
live for paid customers.
The first visual-review slice replaces the old weekend delivery picker with
the three approved frequency choices, adds enabled/off and pending-effective
states to AI Reviews, and renders saved v2 weekly, two-week and monthly reviews
through cadence-neutral detail views. Settings saving and review generation
were deliberately disabled for the first presentation. The owner approved that
presentation on 2026-08-08 and clarified that visible account language uses
`Trade Tracker`, not `Journal`. Frequency saving is now connected with
optimistic revision checks and market-calendar effective dates; review
generation remained disabled during its visual checkpoint. The next UI slice
reads the signed-in account only and presents real market-calendar
period identity, completed/incomplete Trade Tracker review coverage and the
`in progress`, `ready`, `not ready`, or `requested` state. The owner approved
this visual checkpoint on 2026-08-08. Its eligible manual-generation buttons
now use an authenticated request-only server action: the server recalculates
the current account-scoped plan, freezes the immutable v2 input and private
evidence manifest, and creates or reuses the one pending period request. This
path does not reserve provider capacity, begin a generation attempt or call an
AI provider. Requested cards show completion counts and day states from the
frozen request snapshot so later Tracker edits cannot be mistaken for captured
AI evidence. The request service also implements a dormant automatic
coordinator that creates pending requests only for sealed `automatic_ready`
periods. Issuance services now expose a scoped pending-request entry point that
re-reads the immutable stored input and evidence manifest before any future
attempt. Neither path is scheduled, and no current route can start a provider
attempt. A
first-use runtime QA found and corrected the prior-week lookup: ordinary weekly
periods may resolve the preceding calendar week, while two-week periods still
cannot cross their persisted cadence anchor. Page availability now reads only
account-scoped Trade Tracker review status/date rows and request identity; it
does not build the full analytics/evidence snapshot during page rendering. If
first enablement occurs after a weekly period has already ended, availability
shows the next period as `Upcoming` rather than claiming the permanently
pre-enable week could later become eligible.
The owner approved the review-coverage drill-down on 2026-08-08. The AI Reviews
page lists only actual Trade Tracker day pages already created for the review
period, classifying each as `Marked complete` or `Not marked complete` and
linking both states to their date. It does not invent rows for future sessions,
market-closed dates or dates without a Tracker day. Monthly coverage stays
compact on the card and opens existing days in an in-page right drawer; the
drawer becomes full width on mobile and has an explicit sticky close control.
Account does not duplicate this review card. The separate `Weekly and two-week
reviews` panel remains issued AI-review history. This presentation is
implemented and owner approved.

The owner also approved preparing automatic future-year calendar verification
before the application goes live. Deployment evidence confirms that the full
replacement is intended for a single-node persistent-volume runtime because
its Platform/Journal database is SQLite, while the owner's existing
Vercel/Neon stack is not yet the full replacement runtime. Railway is one
suitable persistent-host candidate, not a required brand or a service the
owner currently uses. The accepted design
therefore does not add Vercel Cron. It reserves migration `0039` for immutable
verified annual snapshots plus mutable operational check state, adds a
protected host-neutral trigger, and makes activation of that trigger an
explicit production-cutover gate. Local development does not activate a
scheduler. A target year is accepted only when explicit Nasdaq Trader and NYSE
closed/early-close dates parse successfully and match exactly; NYSE-only
publication, source failure or disagreement remains fail-closed.
Migration `0039` was registered and locally applied on 2026-08-08. Registering
it initially caused the local runtime's expected
`TRADERLINK_PLATFORM_MIGRATIONS_PENDING` guard until the normal local migration
runner applied exactly `0039`; `/ai-reviews` then returned HTTP 200 without the
guard. No production database, deployment, scheduler or provider was changed.
The host-neutral verifier, two-source parser, database-backed active-snapshot
loader and protected trigger are now implemented. They remain inactive unless
an authorized scheduler calls the trigger; no review page or provider path
fetches an exchange site.

Migration number `0037` is now reserved by a registered forward migration
file. It defines the v2 account-frequency state, unified weekly/two-week/monthly
request identity, immutable input/evidence snapshots, retryable attempts,
issued outputs, cost receipts and one-time carry consumption. It deliberately
follows the committed `0036` Daily Tracker migration in the shared manifest.
The owner-authorized normal local migration run applied it on 2026-08-08; no
AI provider or review runner was activated.

The controlling product contract remains the
[AI Weekly Review Plan](ai-weekly-review-plan.md). This record refines its
weekly/monthly boundary so daily reviews remain useful across a calendar-month
edge without moving or double-counting Journal facts.

## 2026-08-07 non-visual server checkpoint

Implemented without touching Daily Tracker, replay/analyzer, Account, AI
Reviews UI, migration manifest or database state:

- `src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json`
  records the official-source 2026 holiday/early-close exceptions, normal 8:00
  PM Eastern seal, scheduled 5:00 PM Eastern seal, coverage range, retrieval
  time and self-verifying evidence digest.
- `src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service.ts`
  validates the snapshot, fails closed outside verified coverage, resolves
  normal/holiday/weekend/early-close sessions, returns Monday-Friday cohort
  identity and final-open-session seal, and finds the next open session.
- The four weekly/monthly AI Review contract files retain v1 and add v2 types
  for weekly/two-week cadence, separated market facts/reflections/coverage,
  one-unit carry bundles, exact calendar-month identity/partial coverage,
  narrative deduplication and cadence-neutral output fields.
- `src/modules/coach/server/coach-weekly-review-due-time.ts` retains v1 and adds
  a v2 calendar-driven weekly/two-week resolver. It groups exactly one or two
  Monday-Friday cohorts, seals at the final open session's verified post-market
  end and returns the next open session only for freshness messaging.
- `src/modules/coach/server/coach-monthly-review-due-time.ts` retains v1 and adds
  a v2 exact-calendar-month resolver with fixed 8:00 AM Eastern generation on
  the first calendar day after month end and separate first-month coverage.
- `src/modules/coach/server/coach-weekly-ai-review-input-service.ts` and its
  read-only runtime retain v1 and add a v2 weekly/two-week builder. It verifies
  the Eastern Tracker date and review revision, separates exact period facts
  from saved reflections, includes rule/tag facts independently of review
  completion, records note evidence and its completion state, and fails closed on calendar or
  execution-date disagreement. The current Tracker does not expose an explicit
  no-trade-review flag, so v2 reports that value as unavailable rather than
  inferring it from zero eligible closed trades.
- `src/modules/coach/server/coach-monthly-ai-review-input-service.ts` retains v1
  and adds a pure v2 assembler. It recomputes monthly counts and P/L only from
  fact days inside the exact Eastern calendar-month coverage, verifies the
  fixed schedule and calendar evidence, treats weekly/two-week output only as
  non-statistical narrative context, and rejects duplicate reflection evidence
  supplied through both issued-review and raw-reflection paths.
- `src/modules/coach/server/database/migrations/0037_coach_ai_review_periods_v2.ts`
  reserves the next migration number, is registered in the shared manifest and
  is applied in the local development database. Its
  unified request table makes the period identity independent of input digest,
  preserves v1 tables, backfills only explicitly scheduled accounts as enabled
  weekly accounts, and creates no request, entitlement or provider call.

Nasdaq Trader currently publishes the 2026 holiday calendar but not a verified
2027 calendar. The implementation therefore supports verified 2026 periods and
honestly fails closed outside that range. Add a new reviewed snapshot version
when Nasdaq publishes the next calendar; do not infer 2027 from NYSE alone.
This was rechecked against both official sites on 2026-08-08: NYSE lists
2027/2028, while Nasdaq Trader and Nasdaq's market schedule still stop at 2026.

Focused verification completed: evidence digest recomputation and targeted,
alias-aware TypeScript compilation of only the four contracts, calendar
service, two due-time files, weekly/two-week input service/runtime and monthly
v2 assembler passed. No test suite, migration, database write, server restart,
provider call, commit or deployment ran.

## 2026-08-08 account/storage and runner-planning checkpoint

Implemented in one non-visual batch without touching Daily Tracker or its
replay/analyzer UI:

- V2 account settings persist enabled state, immutable first-use instant,
  weekly/two-week/monthly-only frequency, two-week anchor, next-period pending
  transition and optimistic revision. Every saved settings revision is also
  retained immutably so a calendar month containing a cadence change can be
  reconstructed instead of being reinterpreted from today's setting. Reads and
  enumeration remain owner/workspace/account isolated.
- The unified v2 repository persists one immutable request identity per exact
  account/period independently of input digest, a private evidence manifest,
  retryable attempts, issued output, receipts and one-time carry consumption.
  Automatic and manual origins converge on the same request identity.
- The provider-control TypeScript blocker is repaired by narrowing validated
  untrusted inputs and using correct database argument tuples; reservation
  behavior did not change in that repair.
- Periodic snapshots pair prompt-safe reflections with private Daily Tracker
  review/status and exact daily/trade-note revision IDs. Private database IDs
  are rejected if they appear in provider input.
- Monthly extraction recomputes facts only from the exact Eastern calendar
  month. Rules/tags remain factual month data. Whole weekly/two-week prose is
  admitted only for the month containing its calendar Friday/final Friday,
  labelled non-statistical, and deduplicated against raw reflection evidence.
  Cross-month reflections remain available through that narrative routing
  without moving their Journal date.
- Eligibility has no five-review or trade-every-day quota. Verified execution
  facts qualify independently of reflection completion, and every non-empty
  saved daily/trade note enters AI evidence with its current completion state.
  The deterministic meaningful-evidence threshold is two ready closed trades;
  one ready closed trade plus a substantive saved reflection, saved tag, or
  followed/broken rule result; or one substantive saved reflection. A
  context-free single trade does not trigger an AI
  review because it cannot support useful feedback. Monthly planning applies
  the same threshold to exact-month evidence at
  the fixed next-day 8:00 AM Eastern snapshot.
- Weekly and monthly runners now expose read-only v2 plans. They do not create
  requests, reserve paid capacity or call a provider. Monthly-only accounts are
  absent from periodic plans but remain included in monthly planning.
- Dormant v2 adapters enforce the periodic/monthly statistical boundaries in
  their prompts and return only cadence-neutral v2 output contracts. Additive
  issuance methods reload the stored immutable request input for every retry,
  reserve against shared v1/v2 daily caps, require complete provider usage
  before issuance and persist v2 receipts. No runner calls those methods, so
  customer generation remains off.
- Migration `0037` now also defines v2 generation-control reservations linked
  to v2 attempts. Existing v1 reads remain compatible before `0037`; after it
  is present, cap calculations and cost summaries include v1 and v2 records.
- A below-threshold weekly cohort is retained for exactly the next cohort. If
  their combined exact evidence meets the same threshold, one labelled
  two-week review is eligible. Aggregation never extends beyond those two
  cohorts; otherwise the facts remain available to the exact calendar month
  without generating a weak review.

The narrow TypeScript checkpoint is clean for every changed AI Review file,
including provider controls, v2 adapters and v2 issuance. `git diff --check`
also passes. At that implementation checkpoint, no Vitest/test suite,
migration, database write, local server action, provider call or deployment
ran. Temporary checkpoint configuration was removed. A later owner-authorized
normal local migration run recorded exactly migrations `0037` and `0038`;
`0037` is therefore locally applied while AI Reviews remain inactive.

Remaining activation work is intentionally separate: design paid
entitlement/packaging, connect the dormant automatic request coordinator to an
explicitly enabled schedule plus a pending-request issuance path, activate the
host scheduler at production cutover, and wait for two-source official
agreement before calendar coverage can extend beyond verified 2026.

## 2026-08-08 future-year calendar verification implementation checkpoint

- The existing embedded 2026 calendar remains the trusted bootstrap and keeps
  its immutable ID/digest.
- A protected operational job checks official sources outside page rendering
  and review generation. It uses fixed HTTPS allowlists, bounded timeout and
  response size, and stores content digests/retrieval evidence without placing
  copied source pages in the database.
- Nasdaq Trader is the required primary source. NYSE is an independent exact
  cross-check. A year is not verified until both explicitly publish the same
  closed and scheduled early-close dates. Both parses require explicit target-
  year evidence plus credible non-empty result counts; empty agreement is not
  verification.
- Immutable annual snapshots are stored in the persistent Platform database.
  Operational status is idempotent and may move among `awaiting_primary`,
  `source_unavailable`, `conflict` and `verified`; a failed recheck never
  deletes or rewrites prior verified evidence.
- The production scheduler may invoke the job daily, while the service itself
  limits checks to weekly for a normally unverified next year, daily in the
  final 45 days of current coverage, and monthly after next-year verification.
- No Vercel Cron entry is added because it would run against the wrong deployed
  application. Production acceptance must prove migration `0039`, the
  server-only scheduler secret, persistent single-node job invocation and
  current/next-year calendar readiness. The calendar job is host-neutral and
  works on Railway or an equivalent provider. This prevents launch from
  depending on an informal reminder.
- The design QA rejected three tempting shortcuts: trusting NYSE alone,
  writing a runtime JSON source file, and fetching exchanges during review
  generation. Each would compromise the existing fail-closed or immutable
  evidence contract.
- A later official revision creates a new immutable version and becomes active
  only after the same two-source verification. Older versions and every review
  request's original calendar ID/digest remain unchanged.
- The implemented runtime loads active verified snapshots from the scoped
  Platform database and combines them with the embedded 2026 bootstrap.
  Cross-year review periods receive deterministic composite calendar evidence;
  missing annual coverage fails closed rather than silently using another year.
- The protected route rejects missing or incorrect scheduler authorization
  before opening the database or fetching a source. An unauthenticated local
  request returned HTTP 401.
- A read-only live parser check on 2026-08-08 produced 10 closures and 2 early
  closes from each official source, with identical normalized digests. The same
  check confirmed that NYSE exposes a 2027 calendar (10 closures, 1 early
  close) while Nasdaq Trader still has no explicit 2027 schedule. The verifier
  therefore correctly remains `awaiting_primary`/fail-closed for 2027.
- After correcting a parser regular-expression syntax error found by the live
  runtime, `/ai-reviews`, `/account` and `/trade-tracker/2026-08-07` all returned
  HTTP 200 on the clean post-`0040` local runtime. No restart was required for
  the parser correction.

## 2026-08-08 request workflow checkpoint

- The owner approved the availability and Trade Tracker coverage presentation.
- Manual weekly, two-week and monthly actions reauthenticate the page scope,
  accept only the displayed period identity, recalculate eligibility on the
  server and create or reuse one immutable v2 request.
- Prior-review lineage is accepted only from an earlier issued v2 review in the
  same user/workspace/account scope and compatible cadence family.
- Duplicate or stale submissions cannot create a second period request. A stale
  ineligible period returns a refresh message without creating a request.
- Requested cards read their completion counts and review-day states from the
  stored input snapshot, not later live Trade Tracker status.
- A dormant coordinator can create pending requests for `automatic_ready`
  periods, but no schedule invokes it and it cannot reserve capacity or call a
  provider.
- Dormant issuance entry points can later consume a pending weekly/two-week or
  monthly request by scoped ID; they always use the stored snapshot rather than
  rebuilding mutable evidence.
- Focused ESLint, changed-file TypeScript filtering and `git diff --check` pass,
  and the existing local `/ai-reviews` route returns HTTP 200. The full shared
  TypeScript project remains nonzero because of unrelated active-worktree
  errors outside this slice. Per repository instruction, no Vitest or other
  test suite ran. No migration, provider call, runner activation, Tracker edit,
  server restart, commit, push or deployment occurred.

## 2026-08-08 fact-first eligibility QA checkpoint

- The owner approved removing `Mark review complete` as an evidence-inclusion
  boundary. Every non-empty daily/trade note saved when generation begins can
  enter the immutable review snapshot. Its completed or incomplete state is
  preserved so AI can use the trader's words without claiming that the whole
  daily review was finalized. Completion affects early generation only in the
  extra-time mode; it never gates canonical execution facts, tags or recorded
  rule results.
- QA rejected raw execution count as the sufficiency measure. An entry-only
  open position is visible coverage but not a ready closed trade and cannot
  trigger a review. The threshold uses ready closed trades plus substantive
  context so the AI is not asked to restate one execution without enough
  evidence to provide useful feedback.
- QA selected explicit branches rather than a hidden evidence score: two ready
  closed trades; one ready closed trade plus a substantive completed
  reflection, saved tag, or followed/broken rule result; or a substantive
  saved reflection. `not reviewed` rule counts and an empty completed
  review do not create context.
- Missing notes, tags or rules are disclosed as unavailable/not recorded. They
  are never converted into claims that the trader had no setup, broke no rule,
  or followed a process.
- The hands-off timing mode uses one deterministic 12-hour post-seal timer and
  never checks Tracker completion. The extra-time mode may release a
  sufficiently evidenced period after the seal when the trader marks the
  relevant reviews complete or selects `Generate now`; otherwise its automatic
  cutoff is the following trading week's final post-market seal. No custom hour
  picker is introduced.
- A below-threshold weekly cohort may combine only with its immediately next
  cohort, producing a real two-week review with exact dates when the combined
  package qualifies. It cannot roll a third time. Exact-month recomputation
  means all facts still reach their calendar-month review without being moved
  or counted twice.
- Monthly-only accounts and ordinary monthly reviews use exact raw month facts;
  weekly/two-week prose remains optional non-statistical context. Therefore a
  monthly review does not depend on a weekly review having been issued.
- Existing v2 snapshots separate fact days, reflection coverage, completed
  reflections and saved-note evidence from incomplete reviews. Migration 0043
  adds only the persisted account timing choice; immutable requests retain
  exact note revisions and completion state. Paid entitlement, provider
  activation and hosted scheduling remain separate launch gates.
- The focused non-Vitest timing verifier passed all approved branches:
  hands-off remains manual before 12 hours and becomes automatic at 12 hours;
  extra-time remains manual until the following trading-week seal and becomes
  automatic at that seal; completed relevant reviews can release at the
  original seal; and one ready closed trade plus a substantive saved note from
  an incomplete review satisfies the meaningful-evidence rule. Focused ESLint,
  changed-file TypeScript filtering and `git diff --check` pass. The full
  shared TypeScript project remains nonzero only on unrelated active-worktree
  and test-file errors. Per repository instruction, no Vitest or other test
  suite ran.

### 2026-08-08 migration 0041 schema repair

- Disposable migration verification found that the reservation-scope trigger
  created by applied migration `0037` referenced `attempt.review_kind`, even
  though review kind belongs to the linked period request. SQLite accepted the
  trigger initially but rejected later table alterations while reparsing the
  invalid schema, blocking all future migrations.
- Corrective migration
  `0041_coach_ai_review_reservation_scope_trigger` drops only that trigger and
  recreates it by joining each generation attempt to its account-scoped period
  request and checking `request.review_kind`.
- Independent disposable-copy verification applied exactly `0041`, preserved
  the analyzer table counts and returned zero foreign-key failures. The same
  verified migration was then applied locally and the app returned to `41/41`.
  The narrow source commit is `462c213c`. No provider call, push or deployment
  occurred.
- This repair is database integrity work only. It does not make the fact-first
  eligibility change require new storage and does not activate AI Reviews.

## Approved policy

### Weekly review

- The U.S.-equity market calendar in `America/New_York` controls AI Review
  scheduling and review-period dates. It supplies market-closed days, the
  final eligible session, that session's post-market close and the next week's
  first eligible session. It does not rewrite preserved Journal facts.
- One **End-of-trading-week review** covers the complete Monday-through-Friday
  market-calendar cohort. An exchange holiday is a closed day, not an invented
  missing daily review or a truncated weekly-review period.
- Calendar Friday identifies the cohort and its narrative-month ownership even
  when Friday is closed. The final actual open session controls only when the
  week seals; it does not change the cohort to a shorter week.
- AI Reviews derives an Eastern market-session date from each exact preserved
  execution timestamp. The current U.S.-market Daily Tracker already links each
  trader-created review, including a no-trade review, to a trusted Eastern
  `journal_trading_days.trading_date`. AI Reviews exposes that existing value as
  request-only `reviewMarketDate` after verifying the linked timezone is
  `America/New_York`; it never infers the date from completion time or converts
  a non-Eastern Journal date. A local Saturday completion for an Asia-based
  trader can therefore remain a U.S. Friday review without rewriting its source
  timestamp, `trading_day_id`, trading date/timezone or local display.
- A month boundary never creates a shortened weekly review. If a month ends on
  Tuesday, the weekly review still contains Monday through Friday.
- Each account selects an AI Review frequency: `Every trading week` (default),
  `Every two trading weeks`, or `Monthly only`. Two-week frequency combines
  exactly two consecutive Monday-through-Friday cohorts. Monthly only suppresses
  weekly/two-week provider calls and uses eligible saved exact-month reflections
  in the monthly review, preserving their completed/incomplete state.
- The default is a preselected choice, not automatic activation. Existing
  accounts with an explicit AI Review schedule remain enabled and migrate to
  weekly frequency with their original first-use instant. Accounts without an
  explicit schedule remain disabled. New accounts generate nothing until the
  trader explicitly saves/enables AI Reviews. Migration creates no review,
  request or provider call.
- A frequency change is based on the account's current frequency. Current
  weekly or Monthly-only begins the new choice with the next unstarted cohort;
  current two-week finishes both cohorts of an open period first. Calendar-month
  reviews continue independently. The stored cadence anchor and exact period
  dates prevent a setting change from regrouping an open or issued review.
  Calendar months may
  contain reflection context created under different settings; reflection-level
  lineage and deduplication handle that boundary explicitly.
- The two persisted timing modes control when weekly/two-week generation begins,
  not what saved evidence is included. Hands-off accounts always use the fixed
  12-hour post-seal schedule without checking completion. Extra-time accounts
  may generate after their own period seal when reviews are marked complete or
  `Generate now` is selected; otherwise the older review generates at the
  following trading week's final post-market seal before the newer review.
- If the trader did not trade or review every day, intentionally leaves a day
  without a review, or has incomplete work, there is no fixed review quota.
  After the seal, one cadence-appropriate `Generate weekly review` or
  `Generate two-week review` action requests the review using everything saved
  at that moment.
- The following trading week's final seal is the extra-time automatic cutoff.
  Oldest-first planning makes the older issued review available as continuity
  context before the newer review begins.
- At automatic or requested generation, the review-period snapshot includes
  all confirmed execution facts, statistics, rule outcomes and selected tags
  from its one or two five-date cohorts. Every non-empty note saved at
  generation becomes trader-reflection evidence with its completion state.
  A no-trade market-open day can be completed as a valid no-trade review.
- Completed reviews are not required when factual trade evidence or substantive
  saved notes satisfy the meaningful-evidence gate. Conversely, an empty review and a
  context-free single trade remain below threshold. Every generated output must
  disclose its fact/reflection coverage and limit conclusions accordingly.
- Under weekly frequency, a below-threshold cohort is combined once with the
  immediately following cohort as a real, clearly labelled two-week period.
  Both cohorts retain their exact fact dates and deduplicated saved
  reflections. It never accumulates beyond that next cohort.
- Carry-forward attaches to the immediately following chronological period. It
  does not leapfrog a skipped period. Every item retains a stable reflection
  reference, reviewed-status revision, exact note-content revision set,
  original date and source period, plus whether that exact tuple is already
  represented by the prior issued review. The model must not treat those two
  representations as independent confirmation.
- The combined two-week package must meet the same meaningful-evidence gate.
  If it remains below threshold, no provider request is created and evidence
  does not roll again. Exact dated facts still participate in their monthly
  review; the original Trade Tracker record remains preserved.
- `Already represented` is deterministic: the exact private tuple of source
  reflection ID, reviewed-status revision and ordered note-content revision IDs
  appeared in the immutable input manifest of a prior issued review. A later
  note edit is a different content version even when the day remains reviewed.
  Representation does not depend on whether the model mentioned the note.
- Each carry bundle is one evidence unit containing the raw reflection and an
  optional reference to the prior issued review that represented it. Those are
  never supplied or weighted as two independent observations.
- Daily Tracker `review_status = 'reviewed'` is the completed state. Eligibility
  uses the current status revision whose latest immutable event remains
  `reviewed`. Existing editable-note behavior remains unchanged. At generation,
  the immutable manifest captures that status revision and the exact daily/trade
  note revision IDs used, so later edits cannot alter an issued review and later
  eligible scopes can identify newer content without duplicating the old input.
- A thin weekly source may feed the immediately following weekly/two-week
  period. If Monthly only becomes effective first, the first eligible monthly
  review is its terminal one-time destination.
- Midweek enablement retains the complete market-calendar factual cohort but
  includes only reflections the trader actually saved. Coverage discloses
  the midweek start; pre-enable reflections are never invented or required.

### Monthly review

- Monthly reviews generate at 8:00 AM Eastern on the first calendar day after
  month end, including weekends and market holidays. The UI localizes that
  instant; the Account page has no monthly-time setting.
- The 8:00 AM snapshot includes exact month facts and all non-empty reflections
  saved at that instant, with their completion states. It creates the one final monthly
  request only when the same meaningful-evidence threshold is met. A below-
  threshold month remains factually visible without generating a weak review.
- Monthly execution facts remain an exact market-calendar month. Executions,
  realized statistics, rule outcomes and trade tags are assigned by the
  market-calendar date used by AI Reviews.
- For a month ending Tuesday, Monday and Tuesday execution statistics, rule
  outcomes and tags remain in that ending month's monthly review. They are also
  available to the cross-month weekly review; this is intentional reuse across
  two different report scopes, not double-counting within either report.
- Under weekly or two-week frequency, daily notes remain immutable records of
  their actual trading date and are routed for AI narrative use by their cadence
  cohort, not moved in Journal storage. A Monday/Tuesday note in a week ending
  on the next month's Friday therefore supports that first weekly review. Under
  Monthly only, raw reflections remain narrative-owned by their own Eastern
  `reviewMarketDate` month.
- The later monthly review for the relevant review's final calendar-Friday
  month may receive a cross-month weekly or two-week review as labelled process
  context. It must not count the earlier month's executions, P/L, rule outcomes
  or tags in the new month's statistics.
- Monthly narrative construction uses one lineage-aware source-selection rule
  across all frequencies. For each eligible reflection, use an issued
  weekly/two-week review that represents it when available; otherwise use the
  raw saved reflection. Never send both as independent evidence. Under
  `Monthly only`, raw reflections are used because no shorter review exists.
  Their narrative-owner month is derived from the effective cadence period,
  while their original dates remain unchanged. A first partial month uses the
  same meaningful-evidence rule; reflection completion is not a prerequisite
  for otherwise sufficient exact-month trade facts.
- Narrative-owner mapping is explicit: weekly context uses its cohort calendar-
  Friday month; two-week context uses its second cohort calendar-Friday month;
  Monthly-only raw reflections use their own Eastern calendar month.
- A below-threshold weekly cohort entering `Monthly only` does not create a
  narrative carry bundle. Its exact facts and saved reflections participate
  in the correct calendar month directly under their original dates.
- Monthly identity is always `calendarMonthStartDate` plus
  `calendarMonthEndDate`. A first partial month separately stores
  `coverageStartDate` as the later of month start or preserved first-use date,
  `coverageEndDate` as month end and `periodCoverage = 'partial_month'`. Facts
  and reflections before the partial coverage start are excluded without
  creating a second identity for that month.

## Required input separation

The weekly/two-week v2 provider input must keep these sections distinct:

1. `reviewPeriodMarketFacts`: all confirmed facts in one or two complete
   Monday-through-Friday cohorts, including execution/statistical facts, rule
   outcomes and tags.
2. `completedDailyReflections`: saved reflections whose Daily Tracker reviews
   were marked complete at the generation snapshot.
3. `savedDailyReflections`: non-empty saved notes from reviews not marked
   complete, preserving their original trading date and incomplete state.
4. `reflectionCoverage`: completed, uncompleted, no-trade and market-closed
   day states. It controls the strength of claims without selecting a different
   output contract.
5. `carryForwardEvidenceBundles`: retained for stored-contract compatibility
   but empty for new fact-first requests. Adaptive thin weeks are represented as
   one real two-cohort `reviewPeriodMarketFacts` package, so prior facts and
   reflections are not duplicated as narrative carry.

The monthly provider input must keep these sections distinct:

1. `calendarMonthFacts`: exact market-calendar dates only; source for all
   financial totals, trade counts, rule counts and tag-based context.
2. `reviewNarrativeContext`: issued weekly or two-week reviews selected by
   narrative-owner month, each labelled with its exact range or ranges,
   represented reflection references and non-statistical status.
3. `rawReflectionContext`: eligible saved Daily Tracker reflections not
   represented by an included issued review, with prompt-safe reference,
   reviewed-status revision, exact note-content revision set, original date,
   source period and narrative-owner month.

The prompt must prohibit using `reviewNarrativeContext` to derive or restate a
monthly count, P/L value, rule-break count or tag frequency outside
`calendarMonthFacts`. It must also prohibit treating an issued-review summary
and a raw/carry-forward reflection with the same lineage reference as separate
supporting observations.

The visible label for `nextPeriodFocuses` is **Focus until your next review**.
That cadence-neutral wording applies to weekly, two-week and monthly review
frequencies.

## Example: month ends Tuesday under weekly frequency

For Monday March 30 through Friday April 3:

| Evidence | March monthly | April weekly | April monthly |
| --- | --- | --- | --- |
| March 30-31 executions and statistics | Included | Included | Not counted |
| March 30-31 rule outcomes and tags | Included | Included | Not counted |
| March 30-31 saved daily notes | Not used in March monthly narrative | Included when saved by generation | Available only through labelled weekly context |
| April 1-3 facts and notes | Not included | Included | Included |

## Implementation checkpoint

The implemented, owner-approved U.S.-market Daily Trade Tracker supplies its
linked Eastern trading date, current `reviewed` status revision and immutable
note revisions. AI Reviews derives request-only `reviewMarketDate` from that
trusted link; no Tracker redesign or duplicate date field is introduced. AI
Chat adaptation is a separate later slice and is not a blocker.

Before implementation, replace the current Monday-Sunday period assumptions
with the approved market-calendar Monday-through-Friday boundary in the
reflection period service and contracts, eligibility calculator, input
contracts/services, runners, provider prompts, UI copy and focused tests.
Replace the fixed Friday/Saturday/Sunday setting with the two explicit timing
modes, the three account-scoped frequency choices and the post-seal
cadence-appropriate generation action. The existing
monthly filter that admits only complete Monday-Sunday weekly reviews is not
compatible with this policy; replace it with final-calendar-Friday review
selection and the explicit input separation above.
Replace the current completed-reflection and zero-closed-trades runner skips
with the approved meaningful-evidence rule. Raw executions and context-free
single trades do not trigger an AI review because they cannot support useful
feedback; exact trade facts may qualify without
notes, and substantive saved reflections may qualify without closed trades.

The server-side market-calendar boundary uses a versioned TraderLink U.S.
equities review-calendar snapshot. Build it from the official
[Nasdaq Trader calendar](https://www.nasdaqtrader.com/Trader.aspx?id=Calendar)
and its linked Equity Trader Alerts for full system operating times, and
cross-check holiday and early-close dates against the official
[NYSE hours and calendars](https://www.nyse.com/markets/hours-calendars). The
official [Nasdaq market schedule](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule)
documents normal after-hours trading through 8:00 PM Eastern. Normal full
sessions therefore seal at 8:00 PM Eastern; a scheduled early-close session
seals at 5:00 PM Eastern only when the official operating-time evidence supports
it. Never substitute the regular-session close.

The snapshot records source URLs, publication and retrieval times, digest,
coverage status, Eastern timezone, Monday/Friday cohort, open and closed dates,
and each eligible session's exact post-market seal. Current-year and next-year
coverage must be actively verified. Preserve immutable prior-year snapshots for
every period reachable from an account's first-use date or late-generation
history; historical coverage does not expire because the year changes. Missing,
stale, incomplete or conflicting official coverage for the requested period
prevents generation. Runtime generation never depends on a live web fetch;
unexpected closures require a source-backed snapshot revision. The next open
session may be calculated separately for display.

Account settings is the sole writer of AI Review frequency in this slice. The
existing AI Chat Friday/Saturday/Sunday delivery-setting path is preserved but
disabled. AI Review completion does not wait for replacement Chat behavior.
After the Daily Trade Tracker and AI Reviews are accepted, a separate AI Chat
slice reads their authoritative setting and completion contracts instead of
maintaining a competing schedule.

This is a semantic change to immutable AI input/output snapshots and generation
eligibility. Introduce cadence-neutral v2 weekly/two-week input and output
contracts plus the required monthly input version. Use one forward-only Coach
migration, `0037_coach_ai_review_periods_v2.ts`, that preserves the existing
tables and v1 rows while adding activation, cadence, effective-period identity,
permitted v2 contract versions, evidence lineage, corrected uniqueness and
retryable request-state behavior. Migration `0037` follows the committed Daily
Tracker migration `0036`, is registered in the shared source manifest and is
applied in the local development database. Do
not create a parallel biweekly subsystem, persist a derived queue state, or
reinterpret issued reviews.

The migration persists a private immutable evidence manifest per request. Each
row maps a prompt-safe ordinal such as `reflection_001` to the private source
Daily Tracker review ID, reviewed-status revision, ordered daily/trade-note
content revision IDs, original Eastern market date, source period, narrative-
owner month, legacy nullable carry destination and any prior request that already
represented that exact tuple. Private database IDs never enter provider input.

The v2 stored output fields are `reviewSummary`, `whatImproved`,
`whatHeldYouBack`, `focusFollowThrough`, `nextPeriodFocuses` and
`incompleteRecord`. The migration must also replace digest-based period
uniqueness: weekly/two-week requests are unique by owner/workspace/account,
cadence and exact period; monthly requests are unique by
owner/workspace/account and exact `calendarMonthStartDate`/
`calendarMonthEndDate`. Partial coverage start/end remain immutable evidence,
not a second identity. The input digest stays inside the immutable request but
cannot authorize a second review. Automatic and manual paths converge
atomically on the same request identity.

Retryable provider failure finalizes only the immutable attempt and leaves its
request pending. Another numbered attempt may reuse that exact request/input.
The request becomes terminal only after issuance, explicit non-retryable
failure or administrative stop.

### Exact implementation allowlist

The controlling plan's **Exact implementation allowlist** is authoritative.
It limits implementation to the cadence-neutral Coach contracts and services,
the versioned calendar snapshot/service, repository and migration `0037`, the
platform migration manifest, Account and AI Reviews UI/routes, the review
runner, and the related migration documents. AI Chat production files are
outside this slice; their Tracker-aware replacement remains deferred and does
not block AI Review acceptance. Any additional file requires an explicit plan
amendment and owner approval.

AI Reviews is intended to be paid. Pricing, packaging, checkout and entitlement
policy remain a later design slice and do not block completion of the engine and
approved UI. Until that plan is accepted, hosted customer activation and
customer-triggered provider calls stay off; local owner-controlled development
may use the existing private provider controls. Migration never grants paid
access implicitly.

## Verification required at the implementation checkpoint

- Month ends on every weekday, including Tuesday, with a cross-month Monday to
  Friday week.
- Normal, holiday and shortened-session market-calendar weeks, including an
  early-completed final-day review held until the factual week seals.
- Automatic generation when all trader-created daily reviews and the final-day
  review are complete; one-click generation with partial coverage otherwise.
- Weekly and two-week cadence selection, exact two-cohort grouping, a
  mid-period setting change that takes effect only later, and no automatic
  extension of a weak-activity review period.
- A setting change during cohort one of an open two-week period waits until
  cohort two ends; it never splits or regroups that open period.
- A change from current weekly or Monthly-only takes effect at the next
  unstarted cohort; a change from current two-week waits for its open two-cohort
  period to finish. Monthly-only then produces zero weekly/two-week provider
  calls and lineage-deduplicated monthly reflection input.
- Migration preserves explicitly enabled accounts and their first-use instant,
  leaves accounts without an explicit schedule disabled and creates no review,
  request, paid entitlement or provider call.
- The next open session is shown as a freshness reminder, including a Monday
  holiday, without disabling late generation.
- Missing-prior-week disclosure that does not block generation or require a
  modal choice.
- Calendar-Friday cohort ownership when Friday is closed, with the final open
  session controlling only the seal.
- Eastern market-session date derivation for UTC and Asia-local timestamps,
  with the exact source timestamps preserved.
- Request-only `reviewMarketDate` coverage for traded and trader-created
  no-trade reviews, derived from the verified Eastern Tracker trading day while
  preserving `trading_day_id`, timezone and local display. Eligibility uses the
  current `reviewed` status revision and records exact note content revisions.
- Midweek first-use coverage without invented pre-enable daily reflections.
- Exact monthly statistics exclude the prior-month Monday/Tuesday facts from
  the new month's totals while weekly or two-week narrative context remains
  available.
- Saved daily notes retain their actual stored trading date and appear in the
  correct five-day weekly cohort; incomplete review status limits claims but
  does not exclude saved note evidence.
- Fact-only eligibility with zero saved reflections, substantive
  reflection-only eligibility, and a below-threshold context-free single trade.
- One-time aggregation of a below-threshold weekly cohort with only its
  immediately following cohort, producing a labelled two-week period when the
  combined package qualifies and never rolling a third time.
- `Already represented` is true only when the exact source reflection ID,
  reviewed-status revision and ordered note-content revision IDs exist in a
  prior issued request's immutable manifest, regardless of the model's prose.
- Exactly one issued review per account/period, with provider retries reusing
  the same immutable input and later Journal edits creating no replacement.
- First partial month using the same meaningful-evidence rule and monthly
  generation at 8:00 AM Eastern on the next calendar day.
- First partial month has one calendar-month identity and a separate immutable
  coverage start/end, excluding pre-enable facts/reflections without permitting
  a second request for that month.
- Zero-reflection monthly check creates no request, followed by one-click manual
  eligibility after a reflection is completed; a generated monthly review
  remains final despite later completions.
- Monthly input selecting exactly one narrative representation per reflection
  when settings change inside a calendar month.
- Prompt-safe evidence references and private immutable source/revision lineage
  across raw, carried and issued-review contexts.
- Each carry bundle remains one structural evidence unit even when it references
  a prior issued review; the provider never receives two independently weighted
  copies of the same reflection revision.
- Retryable failed attempts leave the request pending; terminal request states
  remain immutable.
- Normal and early-close calendar seals with provider/version/cache evidence
  and fail-closed behavior when post-market coverage is unavailable.
- Versioned official-calendar snapshots prove normal 8:00 PM and scheduled
  early-close 5:00 PM Eastern seals; missing or conflicting Nasdaq/NYSE evidence
  fails closed and no runtime live-web dependency is introduced.
- Prior-year calendar snapshots required for late generation remain immutable
  and addressable after active current/future coverage rolls forward.
- Account settings remains the only frequency writer; the old AI Chat delivery
  control cannot mutate review scheduling, and Tracker-aware AI Chat work does
  not begin until the Daily Trade Tracker is complete and accepted.
- Paid packaging remains deferred while hosted customer activation/provider
  calls stay off; owner-controlled local verification does not grant entitlement.
- Owner/account isolation, immutable issued snapshots, no-trade handling,
  partial-first-month rules and no duplicate provider calls remain intact.
- Owner visual approval covers Account frequency/effective-date states, the
  localized monthly deadline, Monthly-only UI and every generation action
  before the UI slice is accepted.
