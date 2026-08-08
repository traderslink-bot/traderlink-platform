# AI Reviews Plan

## Status

Approved product direction recorded on 2026-08-05. Implementation is active;
the [progress record](ai-weekly-review-progress.md) tracks completed slices.
The owner-approved cross-month review policy and its pending implementation
boundary are recorded in the [weekly/monthly review boundary progress
record](ai-weekly-monthly-review-boundary-progress.md).
The non-visual 2026-08-08 engine slice now implements the additive v2 account
settings/storage repositories, private evidence manifests, exact-month
extraction and lineage-aware narrative selection, completion/market-seal
eligibility, and read-only weekly/monthly runner planning. These paths remain
dormant: migration `0037` is registered in the source manifest but remains
unexecuted, provider calls and paid customer activation remain off, and
Account/AI Reviews UI work has not begun.
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
  calls while preserving completed Daily Tracker work for the calendar-month
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
- Completion, not a trader-selected delivery delay, controls generation. The
  market calendar seals a review period after its final eligible session's
  post-market close. For weekly frequency that is the one cohort's final
  session; for two-week frequency it is the second cohort's final session. If
  that final eligible trading day's Daily Tracker review is complete and every
  other Daily Tracker review the trader created in the review period is
  complete, the scheduler generates the AI review as soon as the period is
  sealed. A review completed before the seal waits for the seal so a later
  execution, correction or import is not omitted. Eligibility is derived at
  the seal; a separate persisted queue state is not required.
- A trader who did not trade every day, chose not to review a day or still has
  an incomplete daily review is never forced to create five reviews. After the
  review-period seal, AI Reviews presents one action labelled `Generate weekly
  review` or `Generate two-week review` for the selected cadence. It clearly
  identifies incomplete coverage and uses only daily reviews marked complete
  when the trader requests generation.
- The start of the next trading week is a freshness reminder, not a hard
  cutoff. The market calendar supplies the next open session for accurate UI
  wording, including holiday Mondays, but an ungenerated prior week remains
  available afterward. A later review uses the most recent issued prior review
  when one exists. Missing prior context is a quiet coverage disclosure and
  link to the older period, never a blocking choice or modal.
- At automatic or requested generation the system creates one immutable
  snapshot: all
  confirmed weekly executions, statistics, rule outcomes and tags remain in
  factual coverage, while only daily reviews marked complete at that moment
  enter trader-reflection evidence. A market-closed day is never expected to
  have a daily review. A no-trade market-open day may be marked complete and
  participates as a valid reviewed day.
- A period with no completed daily reviews is not sent to a provider. One or
  more completed daily reviews use the same output contract with exact coverage
  and proportionate conclusions. A period may be reviewed even when it has no
  closed trades; the output must state that closed-trade results are unavailable
  rather than discarding the trader's completed reflections.
- When weekly frequency has only one or two completed daily reviews, those
  reflections are not discarded. The weekly review may still be issued, and
  the dated completed reflections are included once as labelled
  `carryForwardEvidenceBundles` in the immediately following review. They
  remain historical process context: prior-week executions, P/L, rule counts
  and tag counts never become current-week facts. Carry-forward stops after one
  subsequent review and never accumulates indefinitely. This applies whether
  or not the thin weekly period itself produced an issued AI review.
- Carry-forward belongs to the immediately following chronological review
  period, not merely the next review generated. If that period has not yet been
  generated, the context remains available there; it does not leapfrog into
  later periods or accumulate. Every carried item retains a stable reflection
  reference, reviewed-status revision, exact note-content revision set,
  original date and source period. One bundle
  is one evidence unit: it contains the raw completed reflection plus an
  optional reference to the prior issued review that represented it. The raw
  reflection and prior review are never supplied as two independent evidence
  items or counted twice.
- A thin weekly source may carry into the immediately following weekly or
  two-week period. If `Monthly only` becomes effective before a shorter review
  can consume it, the first eligible monthly review is its terminal one-time
  destination. The source period makes the evidence eligible; the destination
  cadence does not erase it.
- Carry-forward does not by itself satisfy destination eligibility. The
  immediately following period must contain at least one newly completed
  reflection before an AI review uses the carried context. The carry is
  permanently bound to that one destination period: it remains available if
  that destination is generated late, but it is never copied or forwarded into
  a later period. No carry-expiration timer or mutable expiry state is stored.
  The original Daily Tracker record remains unchanged in Journal history.
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
  it, but includes only daily reflections actually completed by the trader.
  Coverage must disclose the midweek enablement; the system never invents or
  requires pre-enable reflections.

## Monthly review boundary and first-month rule

- A monthly review follows the market-calendar month, not a rolling four-week
  cycle. It is generated at 8:00 AM Eastern on the first calendar day after
  month end; a weekend or market holiday does not defer it. The UI displays the
  resulting instant in the trader's local time. Weekly completion timing does
  not alter the monthly rule, and there is no monthly delivery-time setting.
- The 8:00 AM snapshot includes only Daily Tracker reflections complete at that
  instant. Account and AI Reviews display the localized deadline before month
  end. If at least one reflection is complete, the one final monthly review is
  issued and later completions cannot replace it. If zero are complete, no
  immutable request is created; the month remains available with a `Generate
  monthly review` action after at least one reflection is completed.
- A monthly review combines the calendar month's dated trading facts,
  including executions, statistics, rule outcomes and trade tags. Those facts
  never move to another month.
- Under weekly or two-week frequency, Daily-review notes remain stored under
  their actual trading date but are consumed by their complete cadence cohort.
  When that cohort crosses a month boundary, its notes are routed to the month
  of the cohort's final calendar Friday for review-narrative continuity; this
  routing does not rewrite the note's factual date. Under `Monthly only`, raw
  completed reflections remain narrative-owned by their own Eastern
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
  context; otherwise it uses the completed raw reflection. It never supplies
  both representations as independent evidence. Under `Monthly only`, no
  shorter review exists, so the raw completed reflection is used with its
  original date and derived narrative-owner month.
- Narrative ownership is explicit: weekly context belongs to the month
  containing its cohort's calendar Friday; two-week context belongs to the
  month containing its second cohort's calendar Friday; Monthly-only raw
  reflection context belongs to the reflection's own Eastern calendar month.
- Unconsumed thin-week carry-forward that reaches a `Monthly only` transition
  may appear once in the first eligible monthly review as clearly dated prior-
  period narrative context. It remains non-statistical and is deduplicated by
  reflection reference.
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
- A first partial month uses the same simple eligibility rule as any later
  month: at least one completed daily reflection. With zero completed
  reflections, no provider call is made. A completed reflection can support a
  coverage-aware monthly review even when there are no closed trades.
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
   follow-through, not as evidence that its advice was correct. Reflection
   references represented by that review are declared so an overlapping carry
   bundle remains one evidence unit.
7. The immediately prior weekly period's eligible one-time
   `carryForwardEvidenceBundles` when that prior period had only one or two
   completed daily reviews. Each bundle retains its date and revision, is
   explicitly separate from current-period facts and may reference, but never
   independently duplicate, its prior issued-review representation.
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
  `0036` and is registered in the source manifest. It remains unapplied until
  a separately authorized database checkpoint.
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
manual request, the page explains that only currently completed daily reviews
will be included and that later edits will not change the issued review.
While `Monthly only` is effective, AI Reviews hides weekly/two-week generation
actions but continues to show historical issued reviews and monthly status.
If the 8:00 AM monthly check found zero completed reflections, the page shows
that no AI review was generated and enables `Generate monthly review` only
after at least one Daily Tracker reflection becomes complete.

Account includes an **AI Review frequency** setting with three clear choices:
`Every trading week`, `Every two trading weeks`, and `Monthly only`. Supporting
copy explains that two-week frequency combines exactly two consecutive trading
weeks for traders who want more activity and reflection context, while monthly
only generates no weekly/two-week AI reviews. The issued review always shows
its actual fact and reflection coverage.

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
   forward, completion-driven automatic/manual generation, immutable
   generation-time coverage snapshots and the monthly routing recorded in the
   linked boundary progress record before enabling hosted generation.

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
  that validates source metadata, digest, coverage and seals. No new market-
  calendar dependency or live review-time web request is required.
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

## Acceptance criteria

- Only selected-account confirmed facts and explicitly eligible completed
  reflections are sent.
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
- One or two completed weekly reflections are carried forward once as dated
  process context without moving or recounting prior-week market facts. Each
  carry bundle is one evidence unit even when it references a prior issued
  review, remains bound to its one destination for late generation and never
  requires an expiry timer or advances to another period.
- Monthly-only accounts receive no weekly/two-week provider calls and their
  monthly input uses only exact-month facts and completed exact-month
  reflections.
- A monthly period with zero completed reflections at 8:00 AM creates no
  request and becomes manually generatable after the first reflection is
  completed; a period generated with one or more remains final.
- A first partial month has one calendar-month request identity and a separate
  immutable coverage range beginning at first use; pre-enable facts and
  reflections are excluded without permitting a second request.
- Prompt-safe evidence references map privately to immutable source/revision
  lineage and prevent duplicate weighting across raw, carried and issued-review
  context.
- Traded and trader-created no-trade Daily Tracker reviews expose their existing
  verified Eastern trading date as request-only `reviewMarketDate`, preserving
  `trading_day_id`, trading timezone and source timestamps. Eligibility uses the
  current status revision whose latest state remains `reviewed`, while the
  immutable manifest separately identifies every note content revision used.
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
