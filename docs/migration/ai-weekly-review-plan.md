# AI Reviews Plan

## Status

Approved product direction recorded on 2026-08-05. Implementation is active;
the [progress record](ai-weekly-review-progress.md) tracks completed slices.
The owner-approved cross-month review policy and its pending implementation
boundary are recorded in the [weekly/monthly review boundary progress
record](ai-weekly-monthly-review-boundary-progress.md).
The non-visual 2026-08-08 engine slice now implements the additive v2 account
settings/storage repositories, private evidence manifests, exact-month
extraction and lineage-aware narrative selection, fact-first meaningful-
evidence eligibility, saved-note evidence, and read-only weekly/monthly
runner planning. These paths remain
dormant: migration `0037` is registered and applied in the local development
database, but provider calls, runner activation and paid customer activation
remain off. The first Account/AI Reviews presentation slice is implemented for
owner visual review and was approved on 2026-08-08. Visible account copy uses
`Trade Tracker`, not `Journal`. Frequency saving is now connected. The second
presentation slice now uses account-scoped read-only runner plans to
show the actual market-calendar period, completed/incomplete Trade Tracker
review coverage and current availability state. The owner approved this visual
checkpoint on 2026-08-08; the later fact-first evidence wording and counts are
also approved in the final Account, AI Reviews and Journal Administration
visual checkpoint on 2026-08-08. Eligible manual-generation buttons now call an
authenticated request-only action that rebuilds the current account-scoped v2
plan, freezes the immutable input and private evidence manifest, and saves one
idempotent pending request. It does not reserve paid capacity, start an attempt
or call an AI provider. Once requested, the card reads completion coverage from
that immutable snapshot rather than later live Tracker edits. The fact-first
availability revision now uses the same read-only exact candidate plan as the
request service so evidence sufficiency cannot drift between the card and the
server. It creates no request and calls no provider during page rendering;
route performance remains a required browser checkpoint. Weekend first
enablement after a sealed week presents the next
weekly period as upcoming; it does not expose the already-ended pre-enable week
as a recoverable review period.
The same request service now has a dormant automatic coordinator that freezes
only sealed `automatic_ready` weekly, two-week and monthly periods. It is not
scheduled or connected to provider execution; partial-coverage periods remain
manual. Weekly/two-week and monthly issuance services can later consume an
existing pending request by its scoped request ID, always re-reading the stored
input and evidence manifest instead of rebuilding from later Tracker data.
These methods are dormant and no provider runner invokes them.
The owner approved completing that dormant boundary on 2026-08-08. The next
slice must replace the scheduled v1 path with one v2 coordinator, consume
pending requests oldest-first, preserve frozen evidence across retryable
provider/cap failures, keep overdue monthly reviews automatic until requested,
and expose truthful Account, AI Reviews and Journal Administration controls.
Real provider calls, paid customer entitlement, hosted scheduler activation,
push and deployment remain outside the local implementation checkpoint.
The owner-approved coverage drill-down belongs only on AI Reviews. Weekly and
two-week cards show only actual Tracker day pages in the period, identify them
as marked complete or not marked complete, and link both states to their Trade
Tracker pages. They do not list future sessions or manufacture missing-review
rows for dates without a Tracker day. Monthly cards retain the concise
completion count and open existing month coverage in an in-page side drawer,
with a full-width mobile drawer and explicit close control. Account remains the
settings surface and does not duplicate the review-availability card. The
saved weekly/two-week panel remains issued AI-review history, not input
coverage.
The owner approved preparing automatic future-year market-calendar verification
before launch. The full replacement remains a single-node persistent-volume
application because its current Platform/Journal database is SQLite. Railway
is one suitable candidate, not a required brand or a service the owner already
uses. The existing Vercel/Neon deployment continues to serve the current
public surfaces and is not the full replacement database runtime. This work
therefore must not add Vercel Cron to the landing/Academy deployment. A
protected, host-neutral calendar job and locally applied migration `0039` now
store operational check state and immutable verified annual snapshots. The job
remains dormant during local development; the production launch checklist must
prove that the accepted single-node scheduler invokes it with its server-only
secret. The embedded verified 2026 snapshot remains the bootstrap fallback.
All hosting, database, secret, scheduler and cutover gates are consolidated in
the [TraderLink Platform Live Launch Readiness](traderlink-platform-live-launch-readiness.md)
checklist so calendar activation cannot be forgotten at launch.
The local two-week Journal fixture is the first controlled review input. This
supersedes the retired Reflection Loop page.

The broader AI product is governed by the [TraderLink AI Companion
Plan](ai-chat-plan.md). It connects scheduled reviews with private AI Chat,
Daily Trade Tracker assistance, conversational manual-entry drafts and shared
privacy/cost controls. Weekly and monthly review boundaries in this document
remain authoritative. Complete and accept the Daily Trade Tracker before
implementing the AI Chat slice that reads Tracker reviews or changes AI Review
settings. That later AI Chat adaptation is not an implementation or acceptance
dependency for AI Reviews. Account is the sole frequency-setting writer for
this feature; the existing AI Chat Friday/Saturday/Sunday delivery-change flow
remains preserved and disabled until Chat is deliberately updated to consume
the completed Tracker and AI Review contracts.

Real-provider acceptance, the owner-selected initial Whop subscription contract
and production provider configuration are governed by the
[AI Reviews Provider Acceptance and Whop Access Plan](ai-reviews-provider-and-whop-access-plan.md).

## Purpose

Give a trader a direct, honest weekly review of their own Journal work. The
review connects factual results, saved trade/day notes, Current Focuses and
automatically evaluated rules. It should identify progress, recurring process
problems, and a short direction for the following week without inventing a
strategy, motive, setup, or fact.

The review is not a trade signal, performance promise, diagnosis, or a Data
Decisions tool. It never changes Journal facts, notes, rules, tags, trade
classification, or analytics.

## Weekly boundary and request model

- The U.S.-equity market calendar in `America/New_York` is authoritative for
  AI Review scheduling and review-period dates. It determines the Monday-to-
  Friday calendar cohort, which days are market-closed, the final eligible
  trading session, that session's post-market close and the next week's first
  eligible session. This scheduling basis does not rewrite an execution's
  preserved Journal timestamp or source timezone evidence.
- The calendar source is a server-owned, versioned TraderLink U.S.-equities
  review-calendar snapshot built from the official [Nasdaq Trader U.S. holiday
  calendar](https://www.nasdaqtrader.com/Trader.aspx?id=Calendar) and its linked
  Equity Trader Alerts for system operating times. Every annual snapshot is
  cross-checked against the official [NYSE Holidays & Trading Hours
  calendar](https://www.nyse.com/markets/hours-calendars). A mismatch remains
  unverified and fails closed; it is never resolved by guessing.
- Normal full sessions seal at 8:00 PM Eastern. Scheduled early-close sessions
  seal at 5:00 PM Eastern, matching the official Nasdaq extended-session rule
  and NYSE late-session schedule. Unscheduled closures require an explicit
  source-backed calendar revision before generation.
- Every snapshot records source URLs, publication/retrieval times, covered
  years, a content digest, verification status, open/closed/early-close dates
  and the exact `postMarketEndUtc` used for each seal. Keep the current and next
  calendar year actively verified; refresh when an exchange alert changes the
  schedule and before active coverage expires. Preserve every prior annual
  snapshot needed by an account's first-use date or an ungenerated historical
  period. Historical snapshots remain immutable and addressable rather than
  expiring merely because the year changed. Missing, stale, conflicting or
  incomplete coverage for the requested period prevents generation. No browser
  or provider call fetches live calendar data at review time.
- Future-year verification is an operational job, never part of an AI Review
  page render or provider request. It fetches only the allowlisted official
  Nasdaq Trader and NYSE pages with bounded time and response size, records
  retrieval/content-digest evidence, and normalizes only explicit closed and
  scheduled early-close dates for one target year. A year becomes verified
  only when Nasdaq Trader publishes it and the independently parsed NYSE dates
  agree exactly. Both parses require explicit target-year evidence and credible
  non-empty closure/early-close counts; empty agreement is never verification.
  NYSE publication by itself is `awaiting_primary`; an HTTP,
  parsing or content-shape failure is `source_unavailable`; any difference is
  `conflict`. All three states fail closed and preserve the last verified
  snapshot without guessing.
- Verified annual snapshots are immutable database records. Runtime calendar
  selection may combine the embedded 2026 bootstrap with database snapshots.
  The latest successfully verified version for a year becomes active, while
  prior versions remain addressable and a calendar ID/digest already frozen
  into a review request is never replaced. An ambiguous ordering or duplicate
  version fails closed. Operational check state may advance idempotently;
  verified snapshot history cannot be updated or deleted.
- The production scheduler may call the protected calendar job daily. The job
  itself suppresses unnecessary source traffic: normally it rechecks an
  unverified next year weekly, moves to daily checks during the final 45 days
  of current coverage, and rechecks an already verified next year monthly for
  official revisions. A successful revision creates a new immutable snapshot
  version rather than mutating the prior one. Review generation always reads
  stored verified evidence and never waits on a live exchange request.
- Launch readiness requires: migration `0039` applied to the production
  persistent database, a server-only scheduler secret, the accepted
  single-node scheduler invoking the protected job, and a health/readiness
  check that shows verified current-year coverage plus either verified next-
  year coverage or an explicit fail-closed warning. This is an operational
  launch gate owned by the application, not something the owner must remember
  informally.
- The Monday-through-Friday cohort is identified by its calendar Friday in
  `America/New_York`, even when Friday is market-closed. Calendar Friday
  determines the cohort's narrative-month ownership; the final actual open
  session controls only when the week seals. For example, if Friday is closed,
  Thursday's post-market close seals the cohort without turning it into a
  Monday-through-Thursday week.
- AI Review grouping derives a separate Eastern market-session date from each
  exact preserved execution timestamp. For the current U.S.-market Daily Trade
  Tracker, the linked `journal_trading_days.trading_date` is already the trusted
  Eastern review date, including a trader-created no-trade review date. AI
  Reviews exposes that existing value as request field `reviewMarketDate` only
  after verifying `trading_timezone = 'America/New_York'`; it does not add a
  second Journal date, infer one from completion time or silently reinterpret a
  non-Eastern account date. Execution-derived Eastern dates must agree with the
  linked Tracker date or the affected evidence fails closed. The original
  `trading_day_id`, trading date/timezone, source timestamps and local display
  remain unchanged. An Asia-based trader may therefore complete the U.S. Friday
  review on local Saturday while the reviewed market date remains Friday. AI
  Review implementation uses the implemented, owner-approved Daily Tracker
  visual workflow; AI Chat adaptation is not part of that dependency.
- A weekly review is an **End-of-trading-week review** over one complete
  Monday-through-Friday market-calendar cohort. A holiday never creates a
  fictitious trading day or a shortened one-, two- or three-day review.
- A calendar-month boundary never creates a one-, two- or three-day weekly
  review. A Monday-through-Friday week that crosses months remains one weekly
  review so the trader's daily-review work is read together.
- Each account has an **AI Review frequency** setting: `Every trading week`
  (the default), `Every two trading weeks`, or `Monthly only`. A two-week review
  joins exactly two consecutive Monday-through-Friday market-calendar cohorts;
  it is not an open-ended wait for the system to decide that a trader has
  accumulated enough trades. `Monthly only` disables weekly/two-week provider
  calls while preserving saved Daily Tracker work for the calendar-month
  review.
- The frequency named above is a default selection, not automatic activation.
  Existing accounts with an explicit AI Review schedule remain enabled and
  migrate to `Every trading week`, preserving their original AI Review enabled/
  first-use instant. Accounts without an explicit existing schedule remain
  disabled. A newly enabled account sees `Every trading week` preselected, but
  generation cannot begin until the trader explicitly saves/enables AI Reviews.
  Migration never creates a review, request or provider call.
- Every frequency change is based on the account's **current** frequency. If
  the current frequency is weekly or Monthly-only, the change begins with the
  next unstarted Monday-through-Friday cohort. If the current frequency is
  two-week and a two-week period is open, both cohorts finish first and the new
  frequency begins with the following cohort. Monthly calendar reviews continue
  independently. A change never regroups an already open or issued period. A
  two-week period is identified by its account-specific cadence
  anchor plus its exact two-cohort start and end dates. Calendar months may
  therefore contain reflection context produced under two settings; the
  monthly builder resolves that safely by reflection identity rather than
  pretending market-week and month boundaries always align.
- The account has two explicit weekly/two-week timing modes. `Automatic - no
  daily reviews required` always waits 12 hours after the final eligible
  session's verified post-market close, then generates from sufficiently
  meaningful evidence without checking Daily Tracker completion. `Give me
  extra time for Trade Tracker reviews` may generate after the seal when the
  trader has marked the relevant created reviews complete or selects
  `Generate now`; otherwise it generates at the following trading week's
  final verified post-market seal. The market calendar supplies both seals,
  including holiday-shortened weeks. A review never starts before its own
  factual period seals, so later executions, corrections or imports from the
  open period are not omitted.
- A trader who did not trade every day, chose not to review a day or still has
  an incomplete daily review is never forced to create five reviews. After the
  review-period seal, AI Reviews presents one action labelled `Generate weekly
  review` or `Generate two-week review` for the selected cadence. It clearly
  identifies incomplete review coverage and includes verified execution facts
  plus every non-empty daily/trade note, tag and recorded rule result saved at
  generation time. Completion is never required for inclusion.
- In the extra-time mode, the end of the following trading week is the hard
  automatic cutoff for the older pending review. The system resolves the
  oldest review first, then lets the new period enter its own timing window, so
  the previous issued review is available as continuity context before the
  next AI Review starts. Provider retries may delay that ordering but never
  cause the newer review to invent or silently skip prior context.
- At automatic or requested generation the system creates one immutable
  snapshot: all
  confirmed weekly executions, statistics, rule outcomes and tags remain in
  factual coverage, while every non-empty note saved at that moment enters
  trader-reflection evidence with its completed/incomplete review state. A
  saved note from an incomplete review is user-authored evidence but does not
  prove the trader finalized the whole daily review. A market-closed day is
  never expected to have a daily review.
- Automatic generation uses a deterministic meaningful-evidence gate so the
  AI has enough factual or reflective context to provide useful feedback,
  expressed in ready closed trades rather than raw execution count. A period
  qualifies with at least two ready closed trades; one ready closed trade plus
  a substantive saved reflection, a saved trade tag, or a followed/broken
  rule result; or a substantive saved reflection on its own. A reflection is
  substantive only when it contains non-empty saved daily/trade
  note content. A context-free single ready closed trade, an open position with
  only an entry execution, an empty completed review, or zero usable evidence
  does not trigger an AI review.
- Below-threshold weekly evidence is not discarded. AI Reviews shows its exact
  deterministic facts without a provider call and binds it to the immediately
  following trading-week cohort. If those two exact cohorts together meet the
  same meaningful-evidence gate, the system creates one clearly labelled
  two-week review. Aggregation stops after that one additional cohort; it never
  becomes an open-ended rolling period. If the two-week package is still below
  threshold, no weak review is generated, while the exact dated facts and
  saved reflections remain available to their calendar-month review.
- Thin-period aggregation belongs to the immediately following chronological
  cohort, not merely the next review generated. The resulting two-week request
  contains the two cohorts' exact facts under their original dates and one
  deduplicated copy of each saved reflection. It does not relabel prior-
  week facts as current-week facts or leapfrog into a later period.
- A thin weekly source may carry into the immediately following weekly or
  two-week period. If `Monthly only` becomes effective before a shorter review
  can consume it, the first eligible monthly review is its terminal one-time
  destination. The source period makes the evidence eligible; the destination
  cadence does not erase it.
- The combined two-week evidence must itself satisfy the same meaningful-
  evidence rule. There is no hidden evidence score, indefinite accumulation,
  mutable expiry timer or silent frequency change. The original Trade Tracker
  records remain unchanged.
- `Already represented` has one deterministic meaning: the exact private tuple
  of source reflection ID, reviewed-status revision and ordered note-content
  revision IDs appeared in the immutable input snapshot of the prior issued
  review. A later note edit is a different content version even when the day
  remains reviewed. Representation never depends on whether the model mentioned
  that reflection in its output.
- Daily Tracker `review_status = 'reviewed'` is the product's completed state.
  The eligible completion revision is the review's current revision whose
  latest immutable event remains `reviewed`. Existing Tracker behavior remains:
  editing a saved note does not silently change the day-review status. At
  generation, the immutable manifest captures both the day-review status
  revision and the exact daily/trade-note content revision IDs used. An issued
  AI review remains unchanged; a later eligible scope may use later note
  revisions with lineage to the earlier content. AI Reviews never invents a
  separate completion status.
- A request is keyed independently of its factual-input digest. Weekly and
  two-week identity is owner/workspace/account, cadence and exact period;
  monthly identity is owner/workspace/account and exact calendar month. A
  completed request for that identity returns the saved review rather than
  charging for another generation. The digest remains evidence within the one
  immutable request.
- A retryable provider failure fails only its immutable generation attempt; the
  review request and input snapshot remain pending so another attempt can use
  that exact request. The request becomes `issued` after one successful attempt
  and becomes permanently `failed` only for an explicit non-retryable failure
  or administrative stop. Every attempt remains visible in the private
  operational record; no error text becomes trader-facing AI feedback.
- An issued review is immutable and final for that account and period. Provider
  failures may retry the same immutable input snapshot, but later Journal edits
  never create a second paid review for the period.
- If AI Reviews is enabled midweek, the first weekly factual package retains
  the complete market-calendar cohort and all confirmed facts available for
  it, plus every non-empty reflection saved inside the enabled coverage by
  generation time. Each reflection retains its completed/incomplete state.
  Coverage must disclose the midweek enablement; the system never invents or
  requires pre-enable reflections.

## Monthly review boundary and first-month rule

- A monthly review follows the market-calendar month, not a rolling four-week
  cycle. It is generated at 8:00 AM Eastern on the first calendar day after
  month end; a weekend or market holiday does not defer it. The UI displays the
  resulting instant in the trader's local time. Weekly completion timing does
  not alter the monthly rule, and there is no monthly delivery-time setting.
- The 8:00 AM snapshot includes exact month facts and every non-empty Daily
  Tracker note saved at that instant, with its completion state. Account and
  AI Reviews display the localized deadline before month end. The one final
  monthly review is issued only when the exact-month package satisfies the same
  meaningful-evidence rule; later completions cannot replace it. A below-
  threshold month creates no AI review request and remains factually visible.
- A monthly review combines the calendar month's dated trading facts,
  including executions, statistics, rule outcomes and trade tags. Those facts
  never move to another month.
- Under weekly or two-week frequency, Daily-review notes remain stored under
  their actual trading date but are consumed by their complete cadence cohort.
  When that cohort crosses a month boundary, its notes are routed to the month
  of the cohort's final calendar Friday for review-narrative continuity; this
  routing does not rewrite the note's factual date. Under `Monthly only`, raw
  saved reflections remain narrative-owned by their own Eastern
  `reviewMarketDate` month because no shorter review exists.
- A monthly review can use an issued cross-month weekly or two-week review only
  as clearly labelled process context. A weekly review belongs to the month of
  its calendar Friday; a two-week review belongs to the month of its final
  calendar Friday. Its execution, P/L, rule or tag facts must never be added to
  that month unless their own trading date is in that calendar month. The
  monthly review does not merely repeat prior reviews.
- Monthly reflection context uses one deduplicating rule for every frequency.
  Each eligible reflection receives a narrative-owner month from the cadence
  period that contains it. If an issued weekly/two-week review represents that
  reflection, the monthly input uses the issued review as labelled narrative
  context; otherwise it uses the saved raw reflection with its completion
  state. It never supplies
  both representations as independent evidence. Under `Monthly only`, no
  shorter review exists, so the raw saved reflection is used with its
  original date and derived narrative-owner month.
- Narrative ownership is explicit: weekly context belongs to the month
  containing its cohort's calendar Friday; two-week context belongs to the
  month containing its second cohort's calendar Friday; Monthly-only raw
  reflection context belongs to the reflection's own Eastern calendar month.
- A below-threshold weekly cohort does not create a narrative carry bundle when
  `Monthly only` becomes effective. Its facts and saved reflections enter
  the appropriate exact calendar month directly under their original dates.
- The first monthly review begins on the date the trader enabled AI Reviews.
  If that begins mid-month, the first eligible period is visibly labelled with
  its actual start and end dates as a partial month and is never compared with
  a prior month.
- Monthly identity and coverage are separate. `calendarMonthStartDate` and
  `calendarMonthEndDate` identify the one immutable calendar-month request.
  `coverageStartDate` is the later of calendar-month start or the preserved AI
  Review first-use date; `coverageEndDate` is calendar-month end. The provider
  and UI receive that honest coverage range plus `periodCoverage` of
  `complete_month` or `partial_month`. Exact facts and reflections before a
  partial month's `coverageStartDate` are not included.
- A first partial month uses the same meaningful-evidence rule as any later
  month. A substantive saved reflection can support a coverage-aware
  monthly review even with no closed trades; an empty completed review cannot.
- There is exactly one issued review per account/month. Later Journal edits do
  not create another paid review.

## Exact AI input package

The server builds one immutable, privacy-safe package from replacement-owned
read services. It contains only the selected account and review period:

1. Review-period identity, cadence, one or two complete Monday-through-Friday
   market-calendar cohorts, calendar timezone, currency partition and factual
   coverage.
2. Completed ready-closed day trades: ticker, direction, entry/exit times,
   execution count, realized gross/net P/L, holding duration and applicable
   trading session. Open positions and unresolved chains stay out of realized
   result conclusions.
3. Per-trading-day facts: trade count, realized P/L, reviewed/not-reviewed
   status, automatically evaluated rule outcomes, and daily note fields.
4. Each completed trade's trader-authored trade note, selected trading tags and
   applicable automatic rule outcomes. The initial tags include setup and
   execution context such as First pullback, Pullback, Breakout, Reversal,
   Chased entry, Early entry, Late entry, Patient entry, Good fill, Poor fill
   and Anxious.
5. Every dated Current Focuses value that was in effect during the week,
   including immutable revisions. A focus that simply carried forward is
   represented at each relevant date without pretending the trader edited it.
6. The immediately preceding issued review, if one exists, as context for
   follow-through, not as evidence that its advice was correct.
7. For an adaptive thin-week combination, one two-cohort
   `reviewPeriodMarketFacts` package built directly from the exact two-week
   period. New fact-first requests keep legacy `carryForwardEvidenceBundles`
   empty rather than duplicating prior facts or reflections as narrative carry.
8. A concise Data Decisions/coverage notice so the review distinguishes
   confirmed results from facts still awaiting a trader decision.

Tags are trader-selected context, not proof. The review may identify a repeated
tag pattern across trades, but it must never treat a tag as a diagnosis or add
meaning that the trader did not record. If a single trade has conflicting tags,
the review names that conflict rather than deciding which tag is correct.

## Review output contract

The versioned v2 model output uses cadence-neutral stored fields so the same
contract supports weekly and two-week reviews. The required stored field names
are `reviewSummary`, `whatImproved`, `whatHeldYouBack`,
`focusFollowThrough`, `nextPeriodFocuses` and `incompleteRecord`:

- **Review summary:** a brief factual summary of results and coverage, rendered
  as `Weekly review` or `Two-week review` by the UI.
- **What improved:** only progress supported by notes, rule outcomes, current
  focuses or a comparison with the preceding review.
- **What held you back:** direct but respectful criticism, anchored to exact
  notes, rule outcomes or facts; no invented psychology.
- **Focus follow-through:** how the dated Current Focuses changed and whether
  the review period's written work supports them.
- **Next-period focuses:** no more than three specific, process-oriented
  focuses. The UI renders the ordinary-language heading `Focus until your next
  review` for either cadence. They are suggestions, never new Journal rules.
- **Incomplete record:** shown only when an unreviewed day, missing note or
  contained Data Decision limits a conclusion.

Monthly reviews use the same evidence rules with month-appropriate headings:
monthly review, progress across the month, recurring friction, focus
follow-through and next-month focuses. They can refer to a repeated review
theme only when that theme appears in a saved weekly or two-week review record
and is supported by the current month's Journal package.

The prompt prohibits trade recommendations, price targets, diagnosing emotion,
claiming certainty, treating profit as proof of good process, treating a loss
as proof of bad process, and any mention of internal codes, providers, token
counts or database terms.

## Storage and provider boundary

- Existing migrations `0025_coach_weekly_reviews.ts` and
  `0026_coach_monthly_reviews.ts` remain historical v1 truth. Add forward
  migration `0037_coach_ai_review_periods_v2.ts` to preserve those rows while
  adding activation/cadence/effective-period identity, v2 input/output versions,
  evidence lineage, period-level uniqueness and retryable request-state
  behavior. Migration `0037` follows the committed Daily Tracker migration
  `0036`, is registered in the source manifest and was applied to the local
  development database on 2026-08-08. This does not activate a runner,
  provider call or paid entitlement.
  Corrective migration `0041_coach_ai_review_reservation_scope_trigger.ts`
  later repaired one invalid reservation-scope trigger from `0037` by reading
  review kind from the linked period request rather than the generation
  attempt. That repair is schema integrity work only; the approved fact-first
  threshold, note-completion boundary and two-cohort behavior require no new
  storage.
  Do not create a separate biweekly subsystem or reinterpret historical rows.
- Persist a private immutable evidence manifest for each request. It maps a
  prompt-safe ordinal such as `reflection_001` to the private source Daily
  Tracker review ID, reviewed-status revision, ordered daily/trade-note content
  revision IDs, original Eastern market date, source period, narrative-owner
  month, carry-forward destination period and any prior request that already
  represented that exact tuple. Private database IDs never enter the provider
  package; the provider sees only the prompt-safe evidence reference.
- Enforce one request identity independently of the input digest. Weekly and
  two-week uniqueness is owner/workspace/account plus cadence, period start and
  period end. Monthly uniqueness is owner/workspace/account plus
  `calendarMonthStartDate` and `calendarMonthEndDate`; partial coverage dates are
  immutable request evidence but not a second identity. The immutable digest
  remains evidence inside that one request; it must not permit a second request
  after Journal facts change. Automatic and manual generation converge
  atomically on the same request identity.
- Update the request-state guards so retryable attempt failure leaves the
  request pending. Attempt rows remain immutable. Only successful issuance,
  explicit non-retryable failure or an administrative stop finalizes the
  request.
- The input snapshot and issued response are private owner/account records. No
  Journal source rows, raw broker file contents, private identifiers, secrets
  or Data Decision implementation details enter the prompt.
- Local development testing uses the direct OpenAI provider and an ignored
  `OPENAI_API_KEY` in the replacement checkout's `.env.local`. The key is
  never committed, logged or sent to the browser. The first direct test uses
  the account-available `gpt-5.6-sol` model. Hosted-provider configuration is
  deferred until the live deployment boundary is designed.
- Completion-driven generation is the approved product behavior. A fully
  completed set of trader-created daily reviews, including the final eligible
  trading day's review, makes one review eligible at the market-calendar seal.
  Otherwise the trader uses the cadence-appropriate one-click generation action
  after the seal. The scheduler derives eligibility idempotently; it does not
  require a persisted queue state. A later edit never triggers another paid
  review.
- Monthly generation uses separate immutable monthly request/output records.
  The saved first-use date controls the partial-month rule and is never reset
  by weekly completion or generation timing.
- AI Review provider controls belong only in Journal Administration. The
  administrator can select the exact provider model and record the verified
  input/output price per million tokens. The API credential stays in the
  server environment; it is never stored in the Journal database or returned
  to a browser.
- Every issued review records its provider, model, input/output token counts
  and the price snapshot used for that request. The resulting immutable receipt
  gives the administrator a per-review and account-wide estimated API-cost
  history. If pricing is not configured, token use is still retained and the
  cost remains unavailable rather than guessed.

## UI direction

AI Reviews is its own dashboard page at `/ai-reviews` with a left-navigation
item. It replaces the retired Reflection Loop page. The page lists saved weekly,
two-week and monthly reviews and opens an addressable detail view. AI Reviews
shows completed, incomplete and unavailable coverage and the one-click
generation action when needed. It never asks the trader to configure Eastern
time, a weekday or an hour delay, and never invents a review or claims automatic
generation is active before the market-calendar scheduler exists. Before a
manual request, the page explains that verified execution facts and everything
saved at generation time can be used, completion affects early timing only in
the extra-time mode, and later edits will not change the issued review.
While `Monthly only` is effective, AI Reviews hides weekly/two-week generation
actions but continues to show historical issued reviews and monthly status.
If the 8:00 AM monthly check found insufficient meaningful evidence, the page
shows the exact available facts without claiming an AI review was generated. A
later manual request becomes available only when the package satisfies the
same meaningful-evidence rule.

Account includes an **AI Review frequency** setting with three clear choices:
`Every trading week`, `Every two trading weeks`, and `Monthly only`. Supporting
copy explains that two-week frequency combines exactly two consecutive trading
weeks for traders who want more activity and reflection context, while monthly
only generates no weekly/two-week AI reviews. The issued review always shows
its actual fact and reflection coverage.

For weekly and two-week frequencies, Account also shows both timing choices at
once. `Automatic - no daily reviews required` states that generation begins 12
hours after the period's final post-market seal and requires no Tracker
completion. `Give me extra time for Trade Tracker reviews` states that marking
reviews complete or selecting `Generate now` can start the review sooner, but
otherwise the review automatically starts at the end of the following trading
week using everything then saved. Monthly-only hides the weekly timing cards;
its exact-month 8:00 AM rule remains independent.

Enabling and changing frequency are separate actions. `Every trading week` may
be preselected, but no customer account becomes active until the trader saves/
enables AI Reviews. A frequency change is calculated from the current frequency:
weekly or Monthly-only begins the new choice with the next unstarted market-week
cohort; an open two-week period finishes both cohorts first. The Account page
shows the calculated effective cohort date before saving. Monthly construction
continues independently and may therefore encounter reflections produced under
different settings in one calendar month; reflection references and lineage-
based source selection prevent duplication.

Account is the only settings writer in this implementation slice. Existing AI
Chat delivery-day/time extraction, proposals, confirmation routes and writes
remain in the repository but are disabled. AI Review completion does not wait
for replacement Chat behavior. After the Daily Trade Tracker and AI Reviews are
accepted, a separate AI Chat slice will read their authoritative settings and
completion contracts instead of owning a competing schedule.

The Account frequency control, effective-date disclosure, monthly deadline,
Monthly-only states and every weekly/two-week/monthly generation action require
iterative owner visual approval before the UI slice is accepted.

AI Reviews is intended to be a paid feature. Pricing, packaging, checkout and
customer-entitlement policy are not yet designed and do not block completing
the review engine and approved UI. Until that later paid-access plan is accepted,
hosted customer activation and customer-triggered provider calls remain off.
Local owner-controlled development and fixture verification may use the
existing private provider controls; no migration silently grants paid access.

Visible copy uses ordinary trading language. It does not explain its internal
source, generation process, provider, prompt, token count, or database state.

## Implementation order

The implemented, owner-approved U.S.-market Daily Trade Tracker supplies its
linked Eastern trading date, current `reviewed` status revision and immutable
note revisions. AI Reviews derives its request-only `reviewMarketDate` from that
trusted link; it does not require Tracker redesign or a duplicate date field.
The later AI Chat adaptation is not a dependency.

1. Create the immutable factual review-period package and its focused server
   contract.
2. Add the reserved `0037_coach_ai_review_periods_v2.ts`, the evidence manifest,
   retryable request-state behavior and the account-isolated
   request/snapshot/issued-response service.
3. Implement the strict prompt and direct local-provider adapter, then issue
   one controlled fixture review before adding persistent generation storage.
4. Add saved weekly/monthly review storage, the three account-scoped frequency
   choices, completion-driven generation and the AI Reviews list/detail
   experience.
5. Add calendar-month eligibility, retained first-use date, monthly-only raw
   reflection routing, the simplified first-partial-month rule and fixed 8:00
   AM Eastern next-day generation before the automatic runner is enabled.
6. Use the local two-week fixture: issue week one, then issue week two with
   week one's saved review as prior context. Verify no fixture Journal fact,
   note, rule, focus revision, Decision or open-position state changes.
7. Add the owner-only provider/cost settings and append an immutable cost
   receipt whenever a saved review is issued.
8. Implement the market-calendar Monday-through-Friday boundary, fixed weekly,
   two-week and monthly-only behavior, one-time thin-week reflection carry-
   forward, the two persisted timing modes, saved-note inclusion, oldest-first
   automatic/manual generation, immutable
   generation-time coverage snapshots and the monthly routing recorded in the
   linked boundary progress record before enabling hosted generation.
9. Add the host-neutral future-year calendar verifier, immutable database
   snapshots and protected trigger. **Implemented and dormant locally.** Do not
   add Vercel Cron to the landing deployment; scheduler activation plus calendar
   readiness remain explicit gates for the accepted persistent single-node
   production cutover, whether hosted on Railway or an equivalent provider.

## Exact implementation allowlist

The boundary slice may change only the following production files. Migration
`0037` is reserved for this slice; do not reuse that number:

- Contracts: `src/modules/coach/contracts/weekly-ai-review-input-contracts.ts`,
  `src/modules/coach/contracts/weekly-ai-review-output-contracts.ts`,
  `src/modules/coach/contracts/monthly-ai-review-input-contracts.ts` and
  `src/modules/coach/contracts/monthly-ai-review-output-contracts.ts`.
- Period/reflection runtime: `src/modules/coach/server/coach-reflection-service.ts`
  and `src/modules/coach/server/coach-reflection-runtime.ts`.
- Weekly runtime: `src/modules/coach/server/coach-weekly-review-due-time.ts`,
  `coach-weekly-ai-review-input-service.ts`,
  `coach-weekly-ai-review-input-runtime.ts`,
  `coach-weekly-ai-review-runner.ts`,
  `coach-weekly-ai-review-issuance-service.ts` and
  `coach-weekly-ai-review-openai-adapter.ts` in that same server folder.
- Monthly runtime: `src/modules/coach/server/coach-monthly-review-due-time.ts`,
  `coach-monthly-ai-review-input-service.ts`,
  `coach-monthly-ai-review-input-runtime.ts`,
  `coach-monthly-ai-review-runner.ts`,
  `coach-monthly-ai-review-issuance-service.ts` and
  `coach-monthly-ai-review-openai-adapter.ts` in that same server folder.
- Persistence/settings: `src/modules/coach/server/coach-ai-review-repository.ts`,
  `src/modules/coach/server/coach-weekly-review-schedule-repository.ts`,
  `src/modules/coach/server/coach-ai-review-provider-controls-repository.ts`,
  `src/modules/coach/server/coach-ai-provider-settings-repository.ts`, new
  `src/modules/coach/server/database/migrations/0037_coach_ai_review_periods_v2.ts`
  and `src/modules/platform/server/database/platform-migration-manifest.ts`.
- Calendar: new
  `src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json`
  containing the reviewed official-source snapshot and new
  `src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service.ts`
  that validates source metadata, digest, coverage and seals; additive
  `coach-us-equities-calendar-source-adapter.ts`,
  `coach-us-equities-calendar-repository.ts` and
  `coach-us-equities-calendar-verification-service.ts` in that folder may
  implement the bounded official-source job and database-backed snapshot
  registry. No live review-time web request is permitted.
- Calendar persistence/trigger: new
  `src/modules/coach/server/database/migrations/0039_coach_us_equities_review_calendars.ts`,
  `src/modules/platform/server/database/platform-migration-manifest.ts` and new
  `app/api/cron/ai-review-calendar/route.ts`. Migration `0039` is reserved for
  this slice after coordination confirmed no Tracker/analyzer reservation.
  `vercel.json` is explicitly excluded because the complete replacement's
  scheduler belongs to its accepted persistent single-node deployment, not the
  current landing/Academy Vercel runtime. The calendar contract does not depend
  on Railway specifically.
- Account/AI Reviews: `app/(dashboard)/account/page.tsx`,
  `app/(dashboard)/account/ai-review-delivery-settings.tsx`,
  `app/(dashboard)/account/ai-review-delivery-actions.ts`,
  `app/(dashboard)/account/account-management-client.tsx`,
  `app/(dashboard)/ai-reviews/page.tsx`,
  `app/(dashboard)/ai-reviews/weekly/[reviewId]/page.tsx`,
  `app/(dashboard)/ai-reviews/monthly/[reviewId]/page.tsx` and
  `app/api/cron/ai-reviews/route.ts`. The delivery-named Account files may be
  renamed to frequency terminology only as part of the approved UI slice.
- Documentation: `docs/migration/ai-weekly-review-plan.md`,
  `docs/migration/ai-weekly-monthly-review-boundary-progress.md`,
  `docs/migration/migration-register.md` and
  `docs/migration/migration-progress.md`.

AI Chat production files are outside this slice and are not an AI Review
implementation dependency. Their existing delivery-change behavior remains
preserved and disabled until a later approved Chat adaptation. Any additional
production file requires a documented reason and owner scope approval before it
joins this slice. Focused verification files mirror the named contracts/services
and the platform migration manifest, but no test command runs during the
design/visual-approval stage.

## Approved automatic-generation and administration completion slice

This checklist is the controlling completion record for the owner-approved
2026-08-08 follow-on. A checked item requires both implementation evidence and
the applicable focused verification; UI items also require owner visual
approval. The linked weekly/monthly boundary progress record carries dated
evidence and the current resume point.

### Product and plan

- [x] Record the two-layer control model: Journal Administration owns global
  platform availability; Account owns the selected Trade Tracker account's
  personal AI Reviews On/Off preference.
- [x] Keep three frequency choices and only two weekly timing choices. Do not
  add note/tag/rule switches, custom delay hours, user-selected evidence
  thresholds or a manual-only timing preference.
- [x] Confirm that review generation reads saved verified annual market
  calendars and never fetches Nasdaq/NYSE during a page render or review.
- [x] Complete a QA pass on this implementation checklist before production
  code changes begin.

### V2 automatic request and issuance path

- [x] Replace the scheduled v1 weekly/monthly execution path with one v2
  coordinator without activating the hosted scheduler.
- [x] Freeze every newly eligible automatic request exactly once, then consume
  pending v2 requests oldest-first so the prior issued review is available as
  continuity context before a newer review begins.
- [x] Route `Generate now` through the same pending-request issuance workflow;
  it must not leave an indefinitely unconsumed request.
- [x] Retry temporary provider failures and request/token/spend-cap delays from
  the exact immutable input/evidence snapshot. Never rebuild mutable Tracker
  evidence for a retry.
- [x] Keep a sufficiently evidenced monthly review automatically due from
  8:00 AM Eastern after month end until its immutable request exists. Once a
  request exists, retain it pending until issuance or deliberate stop.
- [x] Preserve idempotent account/period identity, owner/account isolation,
  exact facts, calendar dates, evidence lineage and no duplicate provider call.

### Journal Administration

- [x] Present one clear global `AI Reviews available` master control backed by
  the existing weekly/two-week and monthly platform safety controls. Off pauses
  new requests and not-started pending work; issued reviews remain readable and
  an already-started attempt may finish safely.
- [x] Keep provider credential status, model, verified pricing and separate
  request/token/spend caps in Admin rather than Account.
- [x] Show scheduler health, pending/retrying/failed/issued operational counts,
  current-year and next-year market-calendar verification, and paid-access
  integration status without exposing account identities or review contents.
- [x] Add an owner-only `Verify calendar now` action only if it can reuse the
  existing protected stored-snapshot verifier without introducing a review-time
  web dependency.
- [x] Do not add a manual paid-entitlement grant or imply that billing is
  connected before the paid-plan contract is approved.

### Trader Account and AI Reviews UI

- [x] Add a personal AI Reviews On/Off control for the selected Trade Tracker
  account. Off prevents new account review generation without deleting Tracker
  data or issued reviews.
- [x] Rename the Account panel `AI Review settings`, rename the hands-off timing
  choice `Automatic after 12 hours`, and keep `No daily reviews required` as
  explanatory copy that also states saved Tracker input is still used.
- [x] Disclose that a context-free one-trade week may combine once with the
  following trading week instead of producing weak feedback.
- [x] Hide weekly timing for `Monthly only` and state clearly whether a timing
  change affects an already open but unissued period.
- [x] Show the localized automatic time and distinguish period open, waiting
  for timing, insufficient evidence, combined with next week, pending,
  generating, retrying, platform unavailable and paid-access unavailable.
- [x] Never show `ready to start automatically` when the v2 coordinator,
  calendar, provider controls or entitlement gate cannot actually proceed.

### Verification and release boundary

- [x] Update this plan and the linked progress record after every material
  implementation or visual checkpoint.
- [x] Run focused non-Vitest timing/coordinator/retry checks, targeted ESLint,
  changed-file TypeScript filtering and `git diff --check` at the checkpoint.
- [x] Obtain owner visual approval for Account, AI Reviews and Journal
  Administration before accepting the UI slice.
- [x] Use a new migration only if persistent coordinator/master-status state is
  truly required, and coordinate its number before registration or execution.
- [x] Preserve all concurrent Trade Tracker/analyzer work. Do not activate paid
  access, real provider calls or a hosted scheduler; do not push or deploy.

### Completion-slice allowlist

The completion slice may edit only the existing AI Review plan/progress files;
the Account and AI Reviews files already named above; `app/api/cron/ai-reviews/route.ts`;
`app/api/cron/ai-review-calendar/route.ts`; the files under
`app/admin/journal/ai-reviews/` excluding AI Chat controls/actions; and the
following Coach server boundaries: request service, weekly/monthly v2 planners,
evidence eligibility, availability service, weekly/monthly issuance services,
AI Review repository, provider-controls repository, provider-settings
repository, AI Review administration repository and market-calendar
repository/verification services. One narrowly named v2 coordinator and
focused non-Vitest verification scripts may be added. Any migration or
production file outside this list requires a plan amendment and explicit owner
scope approval. Daily Trade Tracker, analyzer and AI Chat production files are
excluded.

Migration `0044_coach_ai_review_scheduler_health_v2` is the approved narrow
exception for privacy-safe persistent coordinator-run health. It stores only
run origin/state, timestamps, aggregate summary JSON and a bounded failure
code. It stores no user/account identity, review content or Tracker evidence.
The migration and its focused disposable-copy verifier are within this slice,
as are the migration manifest/register/progress entries required to track it.

## Acceptance criteria

- Only selected-account confirmed facts and explicitly eligible saved
  reflections are sent; every reflection preserves whether its daily review
  was complete or incomplete at snapshot time.
- The saved input snapshot precisely reproduces what the model received.
- Reopening a saved review never calls a provider again.
- Existing reviews remain readable after later Journal edits.
- Exactly one issued review exists per account and review period; retries reuse
  the same immutable input snapshot.
- Retryable attempt failure leaves the request pending; only issuance,
  non-retryable failure or administrative stop finalizes it.
- A missing provider credential produces an honest unavailable state, never a
  mock review.
- A later weekly or two-week generation receives the prior issued review and
  dated Current Focuses history.
- A below-threshold weekly cohort combines with only its immediately following
  cohort as one exact two-week period. New requests do not duplicate that
  evidence through legacy carry bundles.
- Monthly-only accounts receive no weekly/two-week provider calls and their
  monthly input uses only exact-month facts and eligible saved exact-month
  reflections.
- A monthly period below the meaningful-evidence threshold at 8:00 AM creates
  no AI review request; one that qualifies from exact facts and/or substantive
  saved reflections remains final.
- A first partial month has one calendar-month request identity and a separate
  immutable coverage range beginning at first use; pre-enable facts and
  reflections are excluded without permitting a second request.
- Prompt-safe evidence references map privately to immutable source/revision
  lineage and prevent duplicate weighting across raw, carried and issued-review
  context.
- Traded and trader-created no-trade Daily Tracker reviews expose their existing
  verified Eastern trading date as request-only `reviewMarketDate`, preserving
  `trading_day_id`, trading timezone and source timestamps. Eligibility uses the
  current status revision and preserves whether its state is `reviewed` or
  `incomplete`, while the immutable manifest separately identifies every note
  content revision used.
- A frequency change made during an open two-week period waits until both
  cohorts finish and never splits or regroups that period.
- Historical market-calendar snapshots required for late generation remain
  immutable and addressable after the active calendar years roll forward.
- AI Reviews can be completed and accepted without implementing the later AI
  Chat adaptation; Account remains the sole frequency writer.
- Migration preserves explicitly scheduled existing accounts and their first-
  use instant, leaves unscheduled accounts disabled and creates no review,
  request, entitlement or provider call.
- Paid packaging remains deferred while hosted customer activation and
  customer-triggered provider calls remain off; owner-controlled local
  verification grants no customer entitlement.
- Owner visual approval is recorded for every new Account and AI Reviews state
  before the UI slice is accepted.
- Valid unrelated Journal activity remains visible if another chain needs a
  Data Decision.

## 2026-08-05 implementation checkpoint

The first server-only input package is complete. It reads the selected account's
weekly factual Reflection Loop, trader-authored daily/trade notes, reviewed-day
state, automatic rule results and immutable Current Focuses revision trail. It
does not call a provider, create a review, alter Journal data or expose a UI.
