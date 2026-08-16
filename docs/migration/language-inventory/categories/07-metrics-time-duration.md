# Category 7: Time and Duration Metrics

# Category Metadata

| Field | Value |
|---|---|
| Category name | Time and Duration Metrics |
| Category number | 7 |
| Category slug | metrics-time-duration |
| File name | 07-metrics-time-duration.md |
| Category type | Execution-time, duration, calendar-bucket, daily-activity, and ordered-interval metric vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-10 |
| Last updated | 2026-08-10 |
| Dependencies | Category 1 Intents version 1; locked Categories 2-5; active Category 6 boundaries; replacement Journal Analytics Fact Set, allocation graph, metric registry, query/result, authorized account scope, account IANA timezone, currency, and coverage contracts; later Categories 8 and 11-19 |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Current mappings retain this
> category's locked capability split and do not create an absent time calculation.

**Controller state:** The controller accepted the exact 19-item inventory and
capability split: Supported `C7-TIME-001` through `C7-TIME-005`,
`C7-TIME-009`, `C7-TIME-010`, and `C7-TIME-012`; Planned `C7-TIME-006`,
`C7-TIME-008`, `C7-TIME-011`, and `C7-TIME-013` through `C7-TIME-019`; and
Unavailable `C7-TIME-007`. After independent PASS, the controller accepted all
19 canonical records and registries. Comprehensive independent Terra review
returned PASS for all 418/418 evaluation cases and the Section 8 coverage
report: 418 reviewed, 418 passed, and 0 failed. A clerical PASS confirmed the
final file. The controller approved and locked the exact canonical names and
language registries, accepted the category, and advanced it to Complete at
Version 1. This approval preserves the exact 8 Supported/10 Planned/1
Unavailable capability split. It does not create a Chat route, inflate runtime
support, authorize implementation, or convert Planned/Unavailable capabilities
to Supported.

---

# 1. Category Purpose

Category 7 gives the future TraderLink AI Companion one stable meaning for
questions about when a trade began or finished, how long a completed lifecycle
lasted, which account-local calendar bucket contains it, daily trade activity,
and intervals relative to a preceding outcome. It prevents `entry time`,
`exit time`, `hold duration`, `days held`, `session`, and `after a loss` from
silently changing execution events, wall-clock zones, date systems,
populations, or sequence rules.

An execution timestamp is an accepted raw instant. A user-facing clock time,
weekday, or calendar bucket is derived by rendering that instant in the
server-authorized account IANA timezone. A first entry is the first
position-opening allocation in a round trip; a final exit is the allocation
that returns that lifecycle to flat. They are not interchangeable with an
arbitrary entry, partial exit, first exit, import time, manual submission time,
or an exchange-session label.

The category maps language to a controlled metric target. Journal Analytics
remains responsible for server-authorized scope, current accepted facts,
allocation reconstruction, exact duration/calendar math, deterministic order,
coverage, and complete/partial/empty/unavailable results. A `Supported` row
means an existing conditional deterministic Journal primitive, not a working
AI Chat capability. The category does not infer discipline, patience, cause,
edge, intent, or a recommendation from a timestamp or duration.

---

# 2. Category Boundaries

## Included

The controlling inventory contains exactly the 19 Section 5.6 names for:

- first-entry and final-exit timestamps, shown as account-local time only after
  a raw instant and compatible account IANA timezone are available;
- exact elapsed holding duration and its average/median over a declared
  eligible closed-trade population;
- time from first entry to the first position-reducing exit;
- a named trading-session request, kept distinct from an observed local clock
  bucket because exchange-session facts are not currently accepted;
- weekday plus closing-date-derived week, month, quarter, and year buckets;
  the existing `entry_weekday` primitive does not approve a generic weekday
  or closing-weekday default;
- calendar date-boundaries held, distinct from elapsed-duration seconds;
- per-active-closing-day round-trip count, distinct from execution count and
  from a calendar-filled day series;
- ordered elapsed gaps from an exact immediately preceding lifecycle candidate,
  including prior-win/loss variants only when that same predecessor qualifies;
- first-entry and final-exit clock times for a declared local trading day.

All results retain authorized account scope, compatible account timezone and,
where P/L/outcome is involved, compatible currency and the selected Category
2/3 basis. They retain population, current projection state, exact formula
version, stable ordering/tie rule, included/limited/unavailable coverage, and
display rounding separately from stored precision.

## Excluded

The following related concepts are not owned here:

- execution construction, allocation roles, individual execution count,
  partial-exit count, fills, prices, and flip mechanics: Category 8;
- gross/net P/L, fee state, and money/currency policy: Categories 2 and 5;
  win/loss/flat outcome and outcome-streak meanings: Category 3; quality,
  behavior, and causation interpretation: Categories 4 and 9;
- quantity, position size, and exposure: Category 6;
- reusable account, ticker, direction, provenance, currency, and session
  dimensions: Category 11; operators: Category 12; natural-language date
  ranges, relative dates, week phrasing, and timezone wording: Category 13;
- comparison/ranking grammar, conversation context, terminology, ambiguity,
  response format, privacy, and policy: Categories 14-19;
- exchange calendars, market open/close, premarket/regular/after-hours labels,
  venue session facts, holidays, candles, quotes, and market-data replay; and
- writes, manual-entry amendments, protected actions, provider calls, and an
  AI Chat runtime.

## Cross-Category References

Category 7 references but does not redefine:

- Category 1 calculation, summary, grouping, comparison, ranking, sequence,
  explanation, and coverage intents;
- Categories 2, 3, and 5 for selected P/L/outcome, fee-complete net, exact
  zero/denominator, and realized-population rules used by prior-win/loss
  intervals;
- Category 6's active size/exposure boundary, without using duration as a size
  or behavior proxy;
- Category 8 for position-opening, position-reducing, flat, first-exit,
  final-exit, execution count, and reconstruction mechanics; and
- Categories 11-19 for dimensions, date/time language, context, terminology,
  clarification, presentation, privacy, no-invention, no-causation, and safety.

Category 7 owns the 19 metric meanings below. Elapsed duration, calendar days
held, local clock time, named exchange session, and execution count are
separate concepts and must not be merged.

---

# 3. Planning Analysis

This planning section establishes the exact 19-name controlling list and
evidence boundary. All 19 Section 5 canonical records passed independent review
and were controller-accepted. Section 6 Batches 1-4 contain independently
reviewed PASS registries for all `C7-TIME-001` through `C7-TIME-019`. A
comprehensive independent Terra review passed all 418 Section 7 cases and the
Section 8 coverage report with zero failures. Clerical review also passed. The
controller approved and locked Category 7 at Complete, Version 1, without
changing any capability status or runtime boundary.

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?**

   It makes time-related requests deterministic: identify the lifecycle event,
   retain its raw instant, render it only in a compatible account IANA timezone,
   and distinguish elapsed time, calendar grouping, daily activity, and outcome
   sequencing. It prevents a result from treating a local display clock as a
   source instant, a partial exit as final exit, or a named session as proven
   merely because a timestamp exists.

2. **What canonical concepts belong here?**

   Exactly the 19 ordered names and IDs in Section 4, `C7-TIME-001` through
   `C7-TIME-019`. They remain controlling even where the Journal exposes only
   a lower-level primitive or lacks a named capability.

3. **What related concepts belong elsewhere?**

   Category 8 owns execution/allocation mechanics. Category 13 owns
   date-expression grammar and timezone wording; Category 11 owns reusable
   calendar/session dimensions. Categories 2, 3, and 5 own P/L/outcome/fee
   rules required by prior-win/loss intervals. Category 9 may interpret a
   completed descriptive result only under its own evidence policy.

4. **What data is required?**

   Every item requires server-authorized workspace/account scope, current
   accepted execution versions, allocation graph and active round-trip state,
   exact execution instants, and coverage/Data Decision state. Local clock and
   calendar results also require the account IANA timezone. Closed duration and
   final-exit results require a `ready_closed` lifecycle with first opening and
   final-flat timestamps. Prior-win/loss intervals additionally require a
   declared gross/net outcome basis, fee-complete evidence for net, and every
   in-scope lifecycle candidate's first-entry UTC instant plus stable round-trip
   ID. The exact immediate predecessor is selected before eligibility
   filtering; it must be `ready_closed`, and a flat/open/decision barrier is
   not skipped. Calendar aggregation requires one compatible account-
   timezone partition; money/outcome requests also require one compatible
   currency partition.

5. **Which deterministic tools will answer these requests?**

   Existing evidence paths are the read-only `JournalAnalyticsFactSet`, typed
   `journal_analytics_query_v1`, current allocation/population builder,
   `JournalAnalyticsService`, exact decimal/rational math, extended metric
   calculator, versioned metric registry, grouped result service, and coverage
   contract. Accepted Phase 4 evidence supports holding-duration aggregates,
   first-entry local-time grouping, the distinct `entry_weekday` primitive,
   closing day/week/month/year grouping, and duration filters where covered.
   No current named tool establishes a generic `weekday` metric,
   first-exit timing, calendar-day-held semantics, daily trade-frequency
   presentation, interval-after-outcome policy, first/last daily trade, named
   exchange session, or a Chat route.

6. **Which concepts are directly observed?**

   Accepted execution instants, allocation roles, round-trip state, account
   timezone, and source coverage are observed Journal facts when covered. A
   local clock reading is a deterministic representation of an observed instant,
   not a separately observed exchange session. A first-entry timestamp may
   exist for `ready_closed` and factually confirmed `legitimate_open`
   projections; a final-exit timestamp exists only for a completed lifecycle.
   Aggregate times, durations, calendar buckets, counts, medians, and
   predecessor intervals are not directly observed. For the planned interval
   metrics, order all in-scope lifecycle candidates by first-entry UTC instant,
   then stable round-trip ID. Select the current lifecycle's exact immediate
   predecessor before applying eligibility filters. Only when that predecessor
   is `ready_closed` may the candidate elapsed gap be current first-entry UTC
   minus predecessor final-exit UTC. A `legitimate_open`, `needs_decision`, or
   other non-ready predecessor is a visible barrier and is never skipped. A
   zero or negative gap means overlap/concurrency; it is unavailable overlap
   coverage, not a valid interval, and is never clamped to zero.

7. **Which concepts are deterministically derived?**

   `hold_duration` is final close instant minus first position-opening instant
   in elapsed seconds; overnight/multi-day lifecycles remain one duration and
   DST does not alter the subtraction. `average_hold_duration` is the
   arithmetic mean of eligible per-round-trip durations. `median_hold_duration`
   is the exact sorted median, averaging the two middle exact values for an
   even non-empty population. Calendar buckets render final exit in the
   authorized account IANA timezone. `days_held` is the non-negative count of
   account-local date boundaries crossed from first entry to final exit: same
   local date is zero, an overnight date change is one. It is not elapsed
   seconds divided by 86,400. `trades_per_day` is a count of eligible round
   trips in each active closing-date bucket, not execution rows or an average.

8. **Which concepts are proxy indicators?**

   None is inherently a proxy calculation. A grouping by clock, duration, or
   outcome interval can show an association but cannot establish trader intent,
   discipline, fatigue, cause, skill, edge, or future performance.

9. **Which concepts are user-labelled?**

   None is user-labelled today. A future trader-defined session or trading-day
   convention must be explicit, versioned, effective-dated, and owned by an
   approved dimension/date contract. It cannot be inferred from broker text or
   overwrite historical accepted instants.

10. **Which concepts are not measurable?**

   Current accepted facts do not prove an exchange/venue session, scheduled
   market hours, holiday calendar, reason for an entry/exit, intentional
   waiting, time spent looking for a setup, intrabar sequence, elapsed time
   after an unfinalized/open/decision lifecycle, or a universal cross-account
   clock/calendar. Missing timestamps, timezone, allocation role, outcome
   basis, or predecessor are unavailable/limited coverage, never zero, import
   time, client clock, or model estimate.

11. **Which terms are ambiguous?**

   `Entry time` may mean first entry, every entry, submitted order time, or
   fill time. `Exit time` may mean first partial exit or final flat. `Hold
   duration` may mean elapsed wall time, market-session time, or calendar days.
   `Session` may mean a clock bucket, premarket/regular/after-hours, broker
   label, or personal routine. `Week` may mean ISO, Sunday-start, trailing
   seven-day period, or relative range. `Trades per day` may mean round trips,
   execution fills, active days, or an average. `After a loss/win` may mean the
   immediate previous outcome, any earlier outcome, same-ticker outcome, or a
   personal cooling rule. This draft resolves `first_trade_time` and
   `last_trade_time` asymmetrically as the start and end of the selected
   trading window: the first entry of the earliest eligible lifecycle and the
   final exit of the latest eligible `ready_closed` lifecycle. They are not a
   generic minimum and maximum of one timestamp field.

12. **What defaults are safe?**

   For a completed round trip, `entry_time` defaults to the first
   position-opening execution instant and `exit_time` to the final-flat instant.
   Render either in the authorized account IANA timezone and label it local.
   Holding metrics and calendar/trade-count aggregates default to eligible
   current `ready_closed` round trips; `legitimate_open` and `needs_decision`
   remain coverage. Week/month/quarter/year use final-exit local date; week
   uses ISO week-year/week when implementation is authorized. Generic
   `weekday` has no approved default: the current supported primitive is
   specifically `entry_weekday`, and it must not be silently mapped to generic
   weekday or closing weekday. `trades_per_day` is one round-trip count per
   active closing date, with no zero-filled calendar dates. For an interval,
   order every in-scope candidate by first-entry UTC then stable round-trip ID,
   select the exact immediate predecessor before eligibility filtering, and
   require that predecessor to be `ready_closed`. A prior-win/loss result
   additionally classifies that same predecessor on the selected basis;
   non-ready, flat, and non-classifiable predecessors are barriers.
   `first_trade_time` is
   the first entry instant of the earliest eligible lifecycle in the selected
   scope/period. `last_trade_time` is the final exit instant of the latest
   eligible `ready_closed` lifecycle in that scope/period. Both display in the
   account IANA timezone. No safe default exists for a named session,
   first-exit timing, same-ticker narrowing, generic weekday, or a missing
   selected scope/period.

13. **What conditions require clarification?**

   Ask one focused question when `entry` could mean first entry versus every
   fill, `exit` first partial versus final exit, `session` names a market/venue
   without an accepted session fact, `days held` calendar boundaries versus
   duration, generic `weekday` means entry versus closing weekday, `week` a
   relative range rather than calendar bucket, `trades` round trips versus
   executions, `after a loss/win` lacks an outcome basis, or first/last trade
   time lacks the selected scope/period. The first/last event choice itself is
   fixed by this draft and is not re-asked.
   Clarify account/timezone/currency partition only when trusted context does
   not supply a compatible one. Do not ask a trader to invent historic facts.

14. **What combinations are invalid?**

   Invalid combinations include using import/submission time as execution time;
   calling a first partial exit final exit; calculating final-exit duration for
   `legitimate_open` or `needs_decision`; treating elapsed seconds as calendar
   days or every day as 86,400 local seconds; mixing account timezones/currencies
   while claiming one calendar/outcome result; zero-filling inactive days;
   calling fill count `trades_per_day`; assigning a local timestamp to a named
   exchange session; silently mapping generic weekday to `entry_weekday` or
   closing weekday; filtering out non-ready candidates before immediate-
   predecessor selection; using close-time order for predecessor selection;
   skipping a flat, open, decision, or non-classifiable barrier to reach an
   earlier win/loss; accepting arbitrary order at tied first-entry instants;
   treating an
   overlapping/concurrent nonpositive gap as a valid interval or clamping it
   to zero; using the same event field for both first and last trade time;
   division by a zero/empty sample; or presenting a timing association as
   causation/advice.

15. **What evaluation coverage proves completion?**

   Later evaluation must cover all 19 names; raw UTC instant versus account IANA
   rendering; first entry/first exit/final exit under scale-in, partial exit,
   and flips; intraday, overnight, multi-day, and DST durations; exact
   average/median including empty, one-value, even, and tied samples; ISO
   calendar buckets and active rather than zero-filled days; round-trip count
   versus execution count; generic weekday versus the current `entry_weekday`
   primitive; first-entry-UTC-plus-round-trip-ID ordering across all in-scope
   candidates; predecessor selection before eligibility filtering; positive
   interval gaps versus zero/negative overlap coverage; the exact predecessor's
   selected-basis win/loss with flat/open/decision/non-classifiable barriers;
   asymmetric first-entry window
   start versus final-exit window end;
   ready-closed versus legitimate-open coverage; named-session unavailability;
   account/currency/timezone isolation; privacy; no-causation; and planned or
   unavailable Chat routing.

## 3.2 Dependencies

- **Required earlier categories:** Category 1 intent/coverage routing; Category
  2 selected P/L and exact empty/zero rules; Category 3 outcome,
  ready-closed/open/decision, and flat boundaries; Category 5
  fee-complete net policy. Category 6 supplies no prerequisite definition.
- **Required Journal facts/services:** authorized scope; current accepted
  executions and allocation roles; raw instants; first opening/first reducing/
  final flat reconstruction; lifecycle state; account IANA timezone; currency
  where outcome/P/L is used; read-only snapshot; exact duration/median math;
  first-entry-UTC-plus-stable-ID candidate ordering; predecessor-before-
  eligibility selection; positive-gap/overlap coverage;
  query/grouping/result contracts.
- **Required later contracts:** Category 8 execution mechanics; Category 11
  reusable calendar/session dimensions; Category 12 operators; Category 13
  relative date/time grammar; Categories 14-19 ranking, context, terminology,
  ambiguity, display, privacy, and policy.
- **Required UI/context:** only trusted server-authorized account selection and
  selected-trade/group context; a declared scope/period and compatible
  partition where required. Event meanings remain those fixed by this category.
- **Required external/trader facts:** named exchange-session results require
  accepted venue/session/calendar facts. A personal session convention requires
  a versioned effective-dated trader fact. A timestamp supplies neither.
- **Unsupported dependencies:** V3 fallback, client account IDs or timezone
  substitution, source-text/session inference, model-made values, private raw
  identifiers, market-calendar claims without facts, and provider/runtime access.

## 3.3 Risks

- **Event semantic:** first entry, later add, first partial exit, and final exit
  diverge for scaled and flipped lifecycles.
- **Instant/timezone:** UTC instant is not local clock; DST can repeat a local
  clock. Account timezones are separate calendar partitions.
- **Duration/calendar:** elapsed seconds, session time, and local-date
  boundaries differ; DST and overnight trades make fixed 24-hour conversion unsafe.
- **Session fact:** local timestamps support local clock buckets, not exchange
  or venue session labels; missing session facts stay unavailable.
- **Population:** `ready_closed`, `legitimate_open`, and `needs_decision` are
  distinct. Open/decision rows stay visible coverage and are not finalized.
- **Frequency:** active trading days are days with eligible round trips, not all
  calendar dates; round-trip count is not execution count.
- **Sequence:** order all in-scope lifecycle candidates by first-entry UTC then
  stable round-trip ID, and select the exact immediate predecessor before any
  eligibility filter. The predecessor must itself be `ready_closed`; a
  `legitimate_open`, `needs_decision`, or other non-ready predecessor is a
  visible barrier and cannot be skipped. Prior-win/loss also requires that same
  predecessor to classify as the selected-basis outcome; flat and non-
  classifiable outcomes are barriers. Close-time order must not select the
  predecessor. A current first entry at or before predecessor final exit is
  overlap coverage, not a duration and not clamped.
- **Trading-window endpoint:** `first_trade_time` uses the earliest eligible
  lifecycle's first entry, while `last_trade_time` uses the latest eligible
  `ready_closed` lifecycle's final exit. Treating both as min/max of one event
  column would erase the intended start/end asymmetry.
- **Exactness/sample:** mean/median need exact values and explicit empty/zero
  handling; small groups need counts/coverage, not timing conclusions.
- **Privacy/account:** scope is server-authoritative; no raw account, broker,
  source, execution, or identity identifier is exposed.
- **Causation/advice:** timing cannot prove a trader was impulsive, patient,
  disciplined, or likely to improve, and cannot prescribe when to trade.

## 3.4 Repository Evidence

The following privacy-safe sources were reviewed without reading private Journal
values, broker identifiers, tokens, statements, or database content.

| Repository path | What it proves for this planning record |
|---|---|
| `docs/migration/traderslink_ai_language_inventory_master.md` | Required workflow, delegated-file boundary, statuses, exact Category 7 order, controlling-inventory rule, and Markdown-only constraint. |
| `docs/migration/category_completion_template_example.md` | Required metadata, Sections 1-11, capability/evidence vocabulary, deferred-deliverable structure, checklist, review, and change-log conventions. |
| `docs/migration/language-inventory/categories/01-intents.md` | Locked intent, account-scope, deterministic evidence, clarification, planned-Chat, no-invention, privacy, and protected-action conventions. |
| `docs/migration/language-inventory/categories/02-metrics-profit-loss.md` | Locked selected P/L basis, currency, exact math, zero/empty, and realized-population boundaries. |
| `docs/migration/language-inventory/categories/03-metrics-outcomes.md` | Locked outcome, ready-closed/legitimate-open/needs-decision, flat, account-timezone closing date, coverage, and no-causation boundaries. Its close ordering does not select Category 7 interval predecessors. |
| `docs/migration/language-inventory/categories/04-metrics-edge-quality.md` | Prevents descriptive timing results from becoming edge, quality, or causal conclusions. |
| `docs/migration/language-inventory/categories/05-metrics-fees-costs.md` | Complete-fee/net policy inherited by prior-win/loss timing. |
| `docs/migration/language-inventory/categories/06-metrics-position-size.md` | Active Category 6 boundary: duration/time remains Category 7; no predecessor policy is inferred. |
| `docs/migration/traderslink_ai_chatbot_complete_language_plan.md` section 5.6 | Exact ordered 19-name list; no addition, removal, merge, alias, or runtime claim is authorized. |
| `docs/migration/analytics-capability-catalog.md` | First-entry local-time grouping; holding-time definition; closing calendar grouping/filter coverage; active-day rule; session-data absence; acceptance requirements. |
| `docs/migration/phase-4-core-analytics-plan.md` | First-open/final-close formula, duration aggregates, calendar grouping, local entry/exit distributions, named-session unavailability, and coverage contract. |
| `docs/migration/phase-4-core-analytics-progress.md` | Exact math/median, currency/timezone partitions, ready-closed/open/decision containment, privacy-safe aggregation, and no Chat runtime. |

Evidence interpretation: Phase 4 establishes the basis for first-open/final-
close duration, exact average/median mechanics, account-local calendar
attribution, active closing days, local-time grouping, coverage states, and
deterministic calculation. It does not establish named exchange sessions,
first-exit timing, calendar-day-held semantics, prior-outcome wait policy,
first/last daily trade named metrics, or Chat implementation. The accepted
`entry_weekday` primitive is evidence only for entry weekday; it does not
approve generic weekday or closing-weekday semantics. This planning review now
records interval and first/last-trade semantics without claiming runtime support.

## 3.5 Accepted Evidence and Remaining Controller Decisions

### Accepted evidence that is not being reopened

1. **Lifecycle duration:** eligible holding duration is final close instant
   minus first position-opening instant. Overnight/multi-day trades remain one
   elapsed duration; session-only duration needs separate facts.
2. **Exactness:** duration arithmetic and medians retain exact source values;
   display formatting does not change classification/order. Empty populations
   and zero denominators are honest states, not manufactured zero.
3. **Calendar isolation:** closing date uses account IANA timezone. Unlike
   account timezones are separate timing/calendar partitions; money/outcome
   work also stays in a compatible currency partition.
4. **Population/coverage:** realized defaults use `ready_closed`. Factually
   confirmed `legitimate_open` rows are not final-close records, and
   `needs_decision` remains coverage rather than invented fact.
5. **Existing primitives:** first-entry local-time grouping, the specifically
   named `entry_weekday` primitive, duration filters, closing
   day/week/month/year groupings, and duration aggregates are building blocks,
   not a Chat route or authorization to map generic weekday silently.

### Controller decisions recorded in this draft

1. **Events:** `entry_time` means first position-opening execution time;
   `exit_time` means final-flat execution time. `time_to_first_exit` ends at
   the first position-reducing exit after first entry.
2. **Raw/display time:** retain raw instants for order and duration; render
   user-facing clocks/calendar labels only in compatible account IANA timezone.
   Browser/client timezone is never a silent replacement.
3. **Duration/days:** `hold_duration` is elapsed seconds. `days_held` counts
   account-local date boundaries crossed, not seconds divided by 86,400 and not
   market-session duration.
4. **Calendar:** week/month/quarter/year use final-exit local date for closed-
   round-trip aggregation. Week means ISO week-year/week when implemented;
   relative-date grammar remains Category 13. Generic `weekday` remains
   Planned with no approved entry-versus-closing default. The current supported
   `entry_weekday` primitive is distinct and must be requested explicitly.
5. **Activity:** `trades_per_day` is eligible closed round-trip count per active
   final-exit local date. It neither counts executions nor inserts zero days.
6. **Session:** a local timestamp/bucket is observable. A named exchange/venue
   session is unavailable pending accepted session facts/taxonomy; this draft
   does not map clock time to premarket, regular, or after-hours.
7. **Interval semantics:** within one declared compatible authorized scope,
   order all lifecycle candidates by first-entry UTC instant then stable round-
   trip ID. Select the current lifecycle's exact immediate predecessor before
   eligibility filtering. The predecessor must be `ready_closed`; otherwise a
   `legitimate_open`, `needs_decision`, or any other non-ready predecessor is a
   visible barrier and the interval is unavailable. When it qualifies, compute
   current first-entry UTC minus predecessor final-exit UTC. A zero or negative
   result is overlapping/concurrent coverage, unavailable as a between-trade
   interval, and never clamped. Close-time ordering is never used to choose the
   predecessor.
8. **Prior outcome:** `time_after_previous_loss` and
   `time_after_previous_win` classify that exact predecessor on the selected
   basis after the predecessor passes `ready_closed` eligibility. Flat and
   non-classifiable outcomes are barriers, just as `legitimate_open`,
   `needs_decision`, and other non-ready predecessors are barriers before
   classification. None is skipped to reach an older win or loss. Both named
   metrics remain Planned.
9. **Trading-window endpoints:** `first_trade_time` is the first entry instant
   of the earliest eligible lifecycle in the selected scope/period.
   `last_trade_time` is the final exit instant of the latest eligible
   `ready_closed` lifecycle in that scope/period. Both display in the account
   IANA timezone. This is intentional start/end asymmetry, not generic min/max
   over one timestamp field; both named metrics remain Planned.
10. **Ties:** interval predecessor ordering uses first-entry UTC instant then
   stable round-trip ID across all in-scope candidates, never close time,
   database read order, local display time, or model choice.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C7-TIME-001 | `entry_time` | Entry time | Lifecycle time | Supported | First position-opening instant; current first-entry local-time grouping within authorized account-timezone scope. No Chat route. |
| 2 | C7-TIME-002 | `exit_time` | Exit time | Lifecycle time | Supported | Final-flat instant for `ready_closed`; Phase 4 accepts local entry/exit distributions. Not first partial exit. No Chat route. |
| 3 | C7-TIME-003 | `hold_duration` | Hold duration | Duration | Supported | Exact final-close minus first-open elapsed duration for eligible `ready_closed` round trips; not session duration/calendar days. |
| 4 | C7-TIME-004 | `average_hold_duration` | Average hold duration | Duration aggregate | Supported | Exact arithmetic mean over declared eligible duration population; empty remains empty/unavailable by result contract. |
| 5 | C7-TIME-005 | `median_hold_duration` | Median hold duration | Duration aggregate | Supported | Exact sorted median over declared eligible duration population, including even-sample handling. No Chat route. |
| 6 | C7-TIME-006 | `time_to_first_exit` | Time to first exit | Lifecycle interval | Planned | Requires first position-reducing-exit identification and separate lifecycle/query contract; not supplied by final-close duration. |
| 7 | C7-TIME-007 | `session` | Session | Session | Unavailable | Instants/local clock buckets do not establish named exchange/venue session facts, taxonomy, calendar, or hours. |
| 8 | C7-TIME-008 | `weekday` | Weekday | Calendar | Planned | Current support is specifically `entry_weekday`; generic weekday and a closing-weekday default are not approved and must not be silently mapped. |
| 9 | C7-TIME-009 | `week` | Week | Closing calendar | Supported | Existing closing-week grouping primitive; ISO week-year/week display contract is recorded for future implementation. |
| 10 | C7-TIME-010 | `month` | Month | Closing calendar | Supported | Existing closing-month grouping primitive using final-exit account-local date; relative month wording remains Category 13. |
| 11 | C7-TIME-011 | `quarter` | Quarter | Closing calendar | Planned | Exact quarter grouping/display is not an accepted named current capability, though it can derive from final-exit local date. |
| 12 | C7-TIME-012 | `year` | Year | Closing calendar | Supported | Existing closing-year grouping primitive using final-exit account-local date. |
| 13 | C7-TIME-013 | `days_held` | Days held | Calendar duration | Planned | Draft defines local date-boundaries crossed; current evidence supports elapsed duration, not this named calendar metric. |
| 14 | C7-TIME-014 | `trades_per_day` | Trades per day | Daily activity | Planned | Closing-day grouping and eligible round-trip counts are building blocks, but no named daily-frequency presentation contract is accepted. |
| 15 | C7-TIME-015 | `time_between_trades` | Time between trades | Ordered interval | Planned | Order all scoped candidates by first-entry UTC plus stable ID; select predecessor before filtering; require that predecessor `ready_closed`; compute current first entry minus predecessor final exit. Non-ready predecessor or nonpositive overlap is unavailable coverage, never skipped/clamped. |
| 16 | C7-TIME-016 | `time_after_previous_loss` | Time after previous loss | Outcome interval | Planned | Same predecessor-before-filtering and positive-gap rule, with that exact `ready_closed` predecessor classified as selected-basis loss. Flat/non-classifiable/open/decision barriers are visible and never skipped. |
| 17 | C7-TIME-017 | `time_after_previous_win` | Time after previous win | Outcome interval | Planned | Same predecessor-before-filtering and positive-gap rule, with that exact `ready_closed` predecessor classified as selected-basis win. Flat/non-classifiable/open/decision barriers are visible and never skipped. |
| 18 | C7-TIME-018 | `first_trade_time` | First trade time | Trading-window endpoint | Planned | First entry instant of earliest eligible lifecycle in selected scope/period, displayed in account IANA timezone; planned named metric. |
| 19 | C7-TIME-019 | `last_trade_time` | Last trade time | Trading-window endpoint | Planned | Final exit instant of latest eligible `ready_closed` lifecycle in selected scope/period, displayed in account IANA timezone; planned named metric. |

Draft capability counts: **8 Supported, 10 Planned, 1 Unavailable, 0
Unsupported, 0 Deprecated**. These are Journal evidence/capability states, not
AI Chat availability or category approval.

## Proposed Inventory Additions

None. The 19 Section 5.6 names are complete. Possible future concepts such as
`market_session_duration`, `overnight_trade_count`, `calendar_day_count`,
`execution_time`, `first_exit_time`, and `time_after_previous_trade` are not
inserted: they could duplicate listed concepts or belong to Categories 8, 11,
or 13.

## Proposed Removals or Merges

None. Do not merge `hold_duration` with `days_held`, `exit_time` with
`time_to_first_exit`, calendar metrics with Category 13 date grammar,
`trades_per_day` with execution count, or `time_after_previous_loss` with
`time_after_previous_win`.

---

# 5. Canonical Inventory Deliverable

Section 5 contains complete approved and locked Version 1 canonical records for
all 19 controlling items. Independent review returned PASS and the controller
accepted and locked all 19 exact names and records. Approval does not create or
inflate any runtime capability.

Every record consumes only the server-authorized account scope and current
accepted Journal facts. Raw UTC instants remain the ordering and arithmetic
facts; user-facing clock values are derived in the compatible account IANA
timezone with the timezone identified. Currency does not alter a timestamp or
duration, but any combined outcome/money query remains in its compatible
account/timezone/currency partition. Results expose privacy-safe values and
coverage, never raw account, broker, source, execution, or identity identifiers.

## `entry_time`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-001 |
| Category | Time and Duration Metrics |
| Subcategory | Lifecycle time |
| Canonical name | `entry_time` |
| Display name | Entry time |
| Exact definition | The raw UTC execution instant of the first accepted position-opening allocation in one selected lifecycle. Ordering and equality use the raw UTC instant. User-facing display converts that same instant to the server-authorized account IANA timezone and identifies the timezone; DST offset is resolved by the IANA rules for that instant. |
| Distinction from related concepts | It is not an order-created, import, upload, manual-submission, later-add, every-entry, first-exit, final-exit, or named-session time. The local display is a representation of the raw instant, not a replacement fact. |
| Evidence classification | Directly observed execution instant; deterministically derived first-opening selection and account-local rendering |
| Capability status | Supported |
| Result units | UTC timestamp plus account-IANA local date, clock time, offset, and timezone label |
| Open-trade support | Yes for a factually confirmed `legitimate_open` lifecycle with an accepted first position-opening allocation. `ready_closed` is also supported. A `needs_decision` or missing/conflicting first-opening fact is coverage/unavailable, not an inferred time. |
| Fee handling | Not applicable. When composed with an outcome or money query, the accepted gross/net, fee-completeness, and compatible currency partition remain separate constraints. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle event time.
- Narrower concepts: raw first-entry UTC instant; account-local entry-time
  display; explicit `entry_weekday` grouping owned by its approved primitive.
- Commonly confused concepts: order time, import time, submission time, later
  add time, generic session, `first_trade_time`.
- Must not be merged with: `exit_time`, `time_to_first_exit`, `session`, or an
  arbitrary execution timestamp.

Privacy and interpretation boundary: report the requested time and privacy-safe
coverage only. Entry time does not establish intent, patience, discipline,
cause, edge, future performance, or advice about when to trade.

## `exit_time`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-002 |
| Category | Time and Duration Metrics |
| Subcategory | Lifecycle time |
| Canonical name | `exit_time` |
| Display name | Exit time |
| Exact definition | The raw UTC execution instant of the accepted final-flat allocation that returns one selected lifecycle to zero position. Ordering and equality use UTC. User-facing display converts that exact instant to the server-authorized account IANA timezone and identifies its DST-resolved offset/timezone. |
| Distinction from related concepts | It is the final exit, not the first position-reducing or partial exit, order time, import time, last entry, or current as-of time. It exists only after a factually completed lifecycle. |
| Evidence classification | Directly observed execution instant; deterministically derived final-flat selection and account-local rendering |
| Capability status | Supported |
| Result units | UTC timestamp plus account-IANA local date, clock time, offset, and timezone label |
| Open-trade support | No final exit exists for `legitimate_open`. Only eligible `ready_closed` has this result. `legitimate_open` and `needs_decision` remain visible open/decision coverage and are never assigned an as-of or estimated exit. |
| Fee handling | Not applicable. Combined outcome/money queries retain their accepted fee and compatible currency partition separately. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle event time.
- Narrower concepts: raw final-exit UTC instant; account-local final-exit
  display.
- Commonly confused concepts: first partial exit, first reducing allocation,
  last fill in an import, current time, `last_trade_time`.
- Must not be merged with: `time_to_first_exit`, `entry_time`, `session`, or a
  provisional/open lifecycle timestamp.

Privacy and interpretation boundary: a final-exit time is a factual endpoint.
It does not prove exit quality, cause, discipline, future performance, or an
advisable exit time.

## `hold_duration`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-003 |
| Category | Time and Duration Metrics |
| Subcategory | Duration |
| Canonical name | `hold_duration` |
| Display name | Hold duration |
| Exact definition | For one eligible `ready_closed` lifecycle, subtract the first position-opening raw UTC instant from the final-flat raw UTC instant and return the exact elapsed duration in seconds. Overnight and multi-day lifecycles remain one elapsed interval. UTC subtraction preserves actual elapsed time across DST changes. |
| Distinction from related concepts | It is final-exit minus first-entry elapsed time, not time to first exit, market-session-only time, calendar-date boundaries crossed, business days, candle count, or local-clock subtraction. |
| Evidence classification | Deterministically derived from directly observed accepted execution instants and allocation roles |
| Capability status | Supported |
| Result units | Exact elapsed seconds, with an optional duration display that does not alter the stored/calculated value |
| Open-trade support | No completed hold duration is returned for `legitimate_open`; current age would be a separate as-of metric. `needs_decision`, missing endpoint, reversed endpoint, or unresolved allocation state is explicit coverage/unavailable. |
| Fee handling | Not applicable. Duration is independent of fees and currency, though a combined outcome query retains one compatible account/timezone/currency partition and its fee state. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle duration.
- Narrower concepts: exact elapsed seconds; optional privacy-safe formatted
  duration.
- Commonly confused concepts: `days_held`, time to first partial exit,
  open-position age, market-hours duration, local clock difference.
- Must not be merged with: `time_to_first_exit`, `days_held`, or `session`.

Privacy and interpretation boundary: duration is descriptive evidence. A short
or long hold does not by itself establish patience, overtrading, correctness,
cause, edge, or a recommendation.

## `average_hold_duration`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-004 |
| Category | Time and Duration Metrics |
| Subcategory | Duration aggregate |
| Canonical name | `average_hold_duration` |
| Display name | Average hold duration |
| Exact definition | The exact arithmetic mean of `hold_duration` seconds for one declared eligible `ready_closed` population: exact sum of included elapsed seconds divided by the included lifecycle count. The result retains exact rational/decimal semantics; display rounding never changes inclusion or the value used by another calculation. |
| Distinction from related concepts | It is a mean across completed lifecycle durations, not median, midpoint of extrema, average local clock time, calendar days held, open-position age, or a session-only average. |
| Evidence classification | Deterministically derived |
| Capability status | Supported |
| Result units | Exact mean elapsed seconds plus included sample count; optional rounded duration display |
| Open-trade support | `legitimate_open` and `needs_decision` are excluded from the completed-duration numerator and denominator but remain visible coverage. They cannot be assigned zero or as-of durations. |
| Fee handling | Not applicable to duration. Combined outcome segmentation retains selected gross/net basis, fee completeness, and compatible currency separately. |
| Version | 1 |

### Related Concepts

- Broader concept: hold-duration aggregate.
- Narrower concepts: population sum of duration seconds; included lifecycle
  denominator; exact rational mean.
- Commonly confused concepts: `median_hold_duration`, average entry/exit clock,
  average `days_held`, average open age.
- Must not be merged with: `median_hold_duration` or an average across execution
  rows rather than round trips.

Zero/sample boundary: an empty eligible population is empty/unavailable, not a
zero average. Exact zero-duration members remain valid if their accepted raw
instants are equal; they do not create a zero denominator. Return sample count
and coverage, especially for one or few lifecycles. The mean does not establish
causation, statistical certainty, or advice.

## `median_hold_duration`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-005 |
| Category | Time and Duration Metrics |
| Subcategory | Duration aggregate |
| Canonical name | `median_hold_duration` |
| Display name | Median hold duration |
| Exact definition | Sort the exact `hold_duration` seconds of one declared eligible `ready_closed` population in ascending numeric order. For odd non-empty count, return the middle exact value. For even non-empty count, return the exact arithmetic mean of the two middle values. Tied and zero durations remain ordinary values. |
| Distinction from related concepts | It is the population median of completed elapsed durations, not the mean, a selected observed trade, a rounded display bucket, calendar days, open age, or session duration. |
| Evidence classification | Deterministically derived |
| Capability status | Supported |
| Result units | Exact median elapsed seconds plus included sample count; optional rounded duration display |
| Open-trade support | `legitimate_open` and `needs_decision` do not enter the completed-duration ordered population and remain visible coverage. Missing/unresolved endpoints are never sorted as zero. |
| Fee handling | Not applicable to duration. Outcome/money composition retains selected gross/net basis, fee coverage, and compatible currency partition separately. |
| Version | 1 |

### Related Concepts

- Broader concept: hold-duration aggregate.
- Narrower concepts: odd-count middle duration; even-count exact mean of the
  two middle durations.
- Commonly confused concepts: `average_hold_duration`, duration percentile,
  median entry clock, duration bucket label.
- Must not be merged with: arithmetic mean, an observed middle row chosen by
  unstable ties, or display-rounded duration.

Zero/sample boundary: an empty eligible population is empty/unavailable, not
zero. A one-member median equals that exact member; even samples use both
middle values; valid zero members remain included. Report sample count and
coverage. Median duration does not prove a typical cause, edge, or recommended
holding period.

## `time_to_first_exit`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-006 |
| Category | Time and Duration Metrics |
| Subcategory | Lifecycle interval |
| Canonical name | `time_to_first_exit` |
| Display name | Time to first exit |
| Exact definition | Planned definition: exact elapsed seconds from the accepted first position-opening raw UTC instant to the raw UTC instant of the first later accepted position-reducing allocation in the same lifecycle. The first reducing allocation may be partial and is not required to return the position to flat. UTC arithmetic preserves elapsed time across DST changes; local display uses the authorized account IANA timezone only for endpoints. |
| Distinction from related concepts | It ends at first reduction, not final exit. It is not time to first add, order submission, first sell side for every direction, session elapsed time, `hold_duration`, or a model estimate. |
| Evidence classification | Deterministically derived when the required first position-reducing-exit contract and accepted allocation facts exist |
| Capability status | Planned |
| Result units | Exact elapsed seconds; optional UTC and account-IANA local endpoint displays |
| Open-trade support | A factually confirmed `legitimate_open` lifecycle could qualify in a future implementation only if it has an accepted first reducing allocation under the approved contract. No reduction means unavailable/not-yet-observed, not zero. `needs_decision` or conflicting allocation roles remain visible coverage. |
| Fee handling | Not applicable. Any selected outcome/money composition retains compatible currency and fee state separately. |
| Version | 1 |

### Related Concepts

- Broader concept: lifecycle interval.
- Narrower concepts: first-reduction UTC endpoint; elapsed seconds to first
  reduction.
- Commonly confused concepts: `exit_time`, `hold_duration`, time to first sell,
  time to breakeven, scale-out count.
- Must not be merged with: final-exit duration, arbitrary execution duration,
  or Category 8 execution-count semantics.

Current evidence boundary: no accepted named position-reducing-exit query/
metric contract establishes this calculation, so it remains Planned even
though accepted allocation evidence may later support it. Do not infer roles
from side alone, use a local bucket as an endpoint, or expose private execution
identifiers. The interval does not prove exit quality, cause, or advice.

## `session`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-007 |
| Category | Time and Duration Metrics |
| Subcategory | Session |
| Canonical name | `session` |
| Display name | Session |
| Exact definition | A named exchange/venue trading-session classification for an explicitly selected lifecycle event, derived only from that event's raw UTC instant plus accepted instrument/venue identity, versioned exchange/venue session taxonomy, authoritative calendar/hours, holidays, exceptional schedules, and timezone/DST rules effective at the instant. |
| Distinction from related concepts | It is not an account-local clock bucket, user routine, generic morning/afternoon label, broker text guess, or time-of-day grouping. Entry session and exit session require an explicit event and are not interchangeable. |
| Evidence classification | Deterministically derived only if the required external/session facts become accepted; currently unavailable |
| Capability status | Unavailable |
| Result units | Versioned categorical session label with selected event and source/calendar coverage; no current result |
| Open-trade support | Currently unavailable for all populations. In a future supported contract, an entry-session classification could apply to a confirmed open lifecycle, while exit session would still require `ready_closed`. `needs_decision` remains coverage. |
| Fee handling | Not applicable. A combined outcome query would retain selected basis, fee completeness, and compatible account/timezone/currency partition separately. |
| Version | 1 |

### Related Concepts

- Broader concept: market-calendar dimension.
- Narrower concepts: entry session; exit session; venue-specific named session.
- Commonly confused concepts: `entry_time`, `exit_time`, local time bucket,
  premarket guessed from wall clock, trader-defined routine.
- Must not be merged with: any local-time bucket, `weekday`, account timezone,
  or candle session inferred without accepted venue/calendar facts.

Unavailable boundary: the accepted Journal facts do not provide the required
exchange/venue taxonomy and calendar contract. Do not fall back to local clock
buckets, fixed clock ranges, presumed US equity hours, broker prose, or model
knowledge. Return the missing-fact reason without exposing instrument/account
identifiers. A session label cannot establish cause, quality, edge, or advice.

## `weekday`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-008 |
| Category | Time and Duration Metrics |
| Subcategory | Calendar |
| Canonical name | `weekday` |
| Display name | Weekday |
| Exact definition | Planned generic calendar classification: convert one explicitly selected lifecycle event's raw UTC instant to the server-authorized account IANA timezone, take its local calendar date, and return that date's Monday-through-Sunday weekday. The selected event must be explicit; generic `weekday` has no approved entry-versus-final-exit default. |
| Distinction from related concepts | The currently supported primitive is specifically `entry_weekday`; it does not make generic weekday or closing weekday Supported. Weekday is not a date-range phrase, named market session, UTC weekday, browser-local weekday, or week bucket. |
| Evidence classification | Deterministically derived when the lifecycle event is explicitly selected |
| Capability status | Planned |
| Result units | Categorical local weekday plus selected event and account IANA timezone |
| Open-trade support | A future explicit entry-weekday request may include a factually confirmed `legitimate_open` lifecycle because first entry exists. A final-exit weekday requires `ready_closed`. `needs_decision`, a missing selected event, or incompatible timezone scope remains visible coverage/unavailable. |
| Fee handling | Not applicable. Combined outcome/money requests retain their selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: account-local calendar classification.
- Narrower concepts: explicit entry weekday; explicit final-exit weekday.
- Commonly confused concepts: supported `entry_weekday`, closing weekday,
  market session, relative date wording such as “last Monday.”
- Must not be merged with: `week`, `session`, or Category 13 date-language
  expressions.

Current boundary: do not silently map generic `weekday` to the supported
`entry_weekday` primitive or invent closing weekday as its default. Category 13
owns wording for named/relative weekdays; this metric owns only the eventual
factual classification. Return privacy-safe groups and coverage, not raw trade
identifiers. A weekday association does not prove cause, edge, or advice.

## `week`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-009 |
| Category | Time and Duration Metrics |
| Subcategory | Closing calendar |
| Canonical name | `week` |
| Display name | Week |
| Exact definition | For an eligible `ready_closed` lifecycle, convert its final-exit raw UTC instant to the server-authorized account IANA timezone, take the local closing date, and classify it by ISO week-date: ISO week-year plus ISO week number, with Monday as the first weekday and week 1 defined by ISO rules. UTC-to-local conversion occurs before the week boundary is derived; IANA offset/DST rules at the instant control the local date. |
| Distinction from related concepts | It is a final-exit local calendar bucket, not a trailing seven-day range, Sunday-start week, entry week, UTC week, brokerage statement week, or Category 13 phrase such as `this week`. |
| Evidence classification | Deterministically derived from the accepted final-exit instant and account IANA timezone |
| Capability status | Supported |
| Result units | ISO week key (`YYYY-Www`) with account IANA timezone and included sample count |
| Open-trade support | Only `ready_closed` has a final-exit week. `legitimate_open` and `needs_decision` remain visible coverage and are never assigned the current/as-of week or estimated final week. |
| Fee handling | Not applicable to bucket assignment. Any grouped outcome/money values retain selected gross/net basis, fee completeness, and one compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: closing-calendar bucket.
- Narrower concepts: ISO week-year; ISO week number; local closing date.
- Commonly confused concepts: rolling seven days, Sunday-start week, entry
  week, trading week, `this week` language.
- Must not be merged with: `weekday`, `month`, or Category 13 date-range
  interpretation.

Exactness/sample boundary: every eligible lifecycle belongs to exactly one ISO
week in its compatible account-timezone partition. An empty requested week may
return a factual zero count only with complete applicable coverage; grouped
active-week output does not invent missing weeks. Include counts and coverage.
Week-level association does not establish causation, seasonality certainty, or
advice.

## `month`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-010 |
| Category | Time and Duration Metrics |
| Subcategory | Closing calendar |
| Canonical name | `month` |
| Display name | Month |
| Exact definition | For an eligible `ready_closed` lifecycle, convert its final-exit raw UTC instant to the server-authorized account IANA timezone and classify the resulting local closing date by calendar year and month. UTC-to-local conversion occurs before the month boundary is derived, so the IANA offset and DST rules effective at the instant determine the bucket. |
| Distinction from related concepts | It is a final-exit local calendar month, not a trailing 30-day range, entry month, UTC month, statement month, billing month, or the natural-language range `this month`. |
| Evidence classification | Deterministically derived from the accepted final-exit instant and account IANA timezone |
| Capability status | Supported |
| Result units | Calendar month key (`YYYY-MM`) with account IANA timezone and included sample count |
| Open-trade support | Only `ready_closed` has a final-exit month. `legitimate_open` and `needs_decision` remain visible coverage and are not placed in a current/as-of closing month. |
| Fee handling | Not applicable to month assignment. Grouped outcome/money values retain selected gross/net basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: closing-calendar bucket.
- Narrower concepts: local closing year; local closing month number.
- Commonly confused concepts: trailing 30 days, entry month, statement month,
  `this month` or named-month range wording.
- Must not be merged with: `week`, `quarter`, `year`, or Category 13 date-range
  language.

Exactness/sample boundary: month membership comes from the exact local closing
date, not elapsed-day approximation. An explicitly requested month can have a
valid zero count only with complete applicable coverage; grouped active-month
output does not synthesize empty months. Include counts/coverage and keep
incompatible timezones/currencies partitioned. Month association is not cause,
prediction, or advice.

## `quarter`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-011 |
| Category | Time and Duration Metrics |
| Subcategory | Closing calendar |
| Canonical name | `quarter` |
| Display name | Quarter |
| Exact definition | Planned named capability: for an eligible `ready_closed` lifecycle, convert its final-exit raw UTC instant to the server-authorized account IANA timezone, take the local closing date, and classify its calendar month into Q1 (January-March), Q2 (April-June), Q3 (July-September), or Q4 (October-December) of that local calendar year. IANA offset/DST rules are applied before the quarter boundary. |
| Distinction from related concepts | It is a final-exit local calendar quarter, not a rolling three-month period, fiscal quarter, entry quarter, earnings quarter, or relative-date phrase. It is deterministically derivable but is not exposed as an accepted named current capability. |
| Evidence classification | Deterministically derived when the named query/group/result contract is implemented |
| Capability status | Planned |
| Result units | Calendar quarter key (`YYYY-Q1` through `YYYY-Q4`) with account IANA timezone and included sample count |
| Open-trade support | Final-exit quarter requires `ready_closed`. `legitimate_open` and `needs_decision` remain coverage and are not assigned an as-of/estimated closing quarter. |
| Fee handling | Not applicable to quarter assignment. Combined outcome/money groupings retain selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: closing-calendar bucket.
- Narrower concepts: Q1, Q2, Q3, and Q4 of a local calendar year.
- Commonly confused concepts: rolling three months, fiscal quarter, earnings
  quarter, entry quarter.
- Must not be merged with: `month`, `year`, or Category 13 relative/named
  quarter language.

Current boundary: local closing date supplies the deterministic primitive, but
the named quarter capability is not currently exposed and remains Planned.
Do not substitute a rolling 90-day period or fiscal calendar. Empty/zero,
sample count, privacy, account/timezone/currency partition, and no-causation
rules match other closing-calendar groups.

## `year`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-012 |
| Category | Time and Duration Metrics |
| Subcategory | Closing calendar |
| Canonical name | `year` |
| Display name | Year |
| Exact definition | For an eligible `ready_closed` lifecycle, convert its final-exit raw UTC instant to the server-authorized account IANA timezone and return the calendar year of the resulting local closing date. UTC-to-local conversion occurs before the year boundary is derived; the IANA offset/DST rules effective at the instant control year membership. |
| Distinction from related concepts | It is a final-exit local calendar year, not trailing 12 months, year-to-date range, entry year, UTC year, tax year, or fiscal year. |
| Evidence classification | Deterministically derived from the accepted final-exit instant and account IANA timezone |
| Capability status | Supported |
| Result units | Four-digit local calendar year with account IANA timezone and included sample count |
| Open-trade support | Only `ready_closed` has a final-exit year. `legitimate_open` and `needs_decision` remain visible coverage and are not assigned the current/as-of year as a closing year. |
| Fee handling | Not applicable to year assignment. Grouped outcome/money values retain selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: closing-calendar bucket.
- Narrower concepts: local closing calendar year.
- Commonly confused concepts: trailing 12 months, year to date, entry year,
  fiscal/tax year.
- Must not be merged with: `month`, `quarter`, or Category 13 year-range
  language.

Exactness/sample boundary: the final-exit instant near New Year may belong to a
different local year than its UTC date; only the account IANA conversion decides.
An explicitly requested year can have a factual zero only with complete
coverage; grouped active-year output does not invent empty years. Include count
and coverage. Year association is not cause, prediction, or advice.

## `days_held`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-013 |
| Category | Time and Duration Metrics |
| Subcategory | Calendar duration |
| Canonical name | `days_held` |
| Display name | Days held |
| Exact definition | Planned named metric for one eligible `ready_closed` lifecycle: convert the first-entry and final-exit raw UTC instants separately to the server-authorized account IANA timezone, take their local calendar dates, and return the exact non-negative number of local date boundaries crossed from entry date to final-exit date. Same local date is 0; the next local date is 1. DST does not turn this into fixed 24-hour arithmetic. |
| Distinction from related concepts | It counts local calendar-date boundaries, not elapsed seconds divided by 86,400, inclusive dates touched, exchange sessions, business days, overnight count inferred from candles, or current open age. |
| Evidence classification | Deterministically derived when the named metric contract is implemented |
| Capability status | Planned |
| Result units | Exact non-negative integer local date-boundaries crossed, with account IANA timezone |
| Open-trade support | Completed `days_held` requires `ready_closed`. `legitimate_open` would require a separately named as-of carried-days/age metric and is not assigned a final value here. `needs_decision`, missing endpoints, or reversed lifecycle facts remain coverage/unavailable. |
| Fee handling | Not applicable. Any outcome/money composition retains selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: calendar duration.
- Narrower concepts: entry local date; final-exit local date; date-boundary
  difference.
- Commonly confused concepts: `hold_duration`, inclusive dates touched,
  overnight trade flag, market sessions held, open-position age.
- Must not be merged with: elapsed seconds, `session`, or calendar-day language
  owned by Category 13.

Exactness/zero boundary: zero is a valid same-local-date result, not missing
data. A DST-short or DST-long overnight interval still crosses one date
boundary, while a long same-date elapsed duration remains zero days held.
Missing or unresolved endpoints never become zero. Report the exact value and
coverage without exposing identifiers or implying patience, quality, cause, or
a recommended holding period.

## `trades_per_day`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-014 |
| Category | Time and Duration Metrics |
| Subcategory | Daily activity |
| Canonical name | `trades_per_day` |
| Display name | Trades per day |
| Exact definition | Planned named presentation: for each declared closing local date in one compatible authorized account/timezone scope, count each eligible current `ready_closed` round trip exactly once by the account-IANA local date of its final-exit raw UTC instant. The output is a per-day count series/group, not an average unless an explicitly separate aggregation is requested. |
| Distinction from related concepts | It counts round-trip lifecycles, not execution fills, orders, entries, exits, symbols, attempts, calendar days, trading-day count, or average trades across a period. Upload/import order does not affect the count. |
| Evidence classification | Deterministically derived when the named daily-count presentation contract is implemented |
| Capability status | Planned |
| Result units | Exact non-negative integer round-trip count per declared account-local closing date, plus coverage/sample counts |
| Open-trade support | `legitimate_open` is not a completed round trip in a closing-day count; `needs_decision` is not classified or counted. Both remain visible coverage and do not suppress unrelated `ready_closed` rows. |
| Fee handling | Count assignment does not require fees. Outcome/money values grouped beside it retain selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: daily lifecycle activity.
- Narrower concepts: eligible ready-closed round-trip count for one local
  closing date; active closing-day series.
- Commonly confused concepts: execution count, entry count, exit count,
  `trading_day_count`, average trades per day, calendar-filled activity.
- Must not be merged with: Category 8 execution metrics, `first_trade_time`,
  `last_trade_time`, or a calendar-day denominator.

Exactness/zero/sample boundary: an explicitly requested declared date can
return zero only when applicable coverage is complete and no eligible
`ready_closed` lifecycle closes that date. An active-day grouped series does not
insert no-trade calendar dates. Counts remain exact integers; sample/coverage
states accompany the result. The named presentation remains Planned even
though closing-day grouping and round-trip count primitives exist. A high or
low count does not establish overtrading, discipline, cause, or advice.

## `time_between_trades`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-015 |
| Category | Time and Duration Metrics |
| Subcategory | Ordered interval |
| Canonical name | `time_between_trades` |
| Display name | Time between trades |
| Exact definition | Planned interval for a selected current lifecycle within one declared compatible server-authorized scope: order every in-scope lifecycle candidate by first-entry UTC instant, then stable round-trip ID. Select the exact immediate predecessor before applying eligibility filters. Require that predecessor to be `ready_closed`, then compute current first-entry UTC minus predecessor final-exit UTC in exact elapsed seconds. A zero or negative result is overlap/concurrency coverage and is unavailable as a between-trade interval; it is never clamped. |
| Distinction from related concepts | It is the gap from the exact predecessor's final exit to the current lifecycle's first entry. It is not entry-to-entry time, close-to-close time, hold duration, import order, close-time predecessor selection, a search for the nearest earlier eligible trade after filtering, or intentional waiting time. |
| Evidence classification | Deterministically derived when the named interval contract is implemented and the exact predecessor qualifies |
| Capability status | Planned |
| Result units | Exact elapsed seconds plus predecessor/current coverage state; optional UTC and account-IANA local endpoint displays |
| Open-trade support | A current factually confirmed `legitimate_open` lifecycle may qualify in a future implementation because its first entry is observed, provided its exact predecessor is `ready_closed` and the gap is positive. A predecessor that is `legitimate_open`, `needs_decision`, or otherwise non-ready is a visible barrier and is never skipped. A current `needs_decision` remains coverage rather than a computed interval. |
| Fee handling | Not applicable to the interval. Any combined outcome/money query retains its selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: ordered lifecycle interval.
- Narrower concepts: exact immediate predecessor; predecessor final-exit UTC;
  current first-entry UTC; positive inter-lifecycle gap.
- Commonly confused concepts: entry-to-entry interval, close-to-close interval,
  `hold_duration`, time after any earlier trade, cooldown rule.
- Must not be merged with: `time_after_previous_loss`,
  `time_after_previous_win`, or Category 8 execution spacing.

Ordering/coverage boundary: first-entry UTC plus stable round-trip ID orders all
candidates before eligibility filtering; close time, local display time,
database row order, or model choice never selects the predecessor. Non-ready
predecessors are barriers. Raw UTC arithmetic remains exact across DST; local
endpoint display uses the authorized account IANA timezone only. An empty
scope, first candidate with no predecessor, missing endpoint, or nonpositive
gap is unavailable/coverage, not zero. Report privacy-safe endpoints/counts and
coverage without exposing IDs. The interval does not prove intentional delay,
discipline, cause, or advice.

## `time_after_previous_loss`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-016 |
| Category | Time and Duration Metrics |
| Subcategory | Outcome interval |
| Canonical name | `time_after_previous_loss` |
| Display name | Time after previous loss |
| Exact definition | Planned interval using the same predecessor contract as `time_between_trades`: order all in-scope lifecycle candidates by first-entry UTC plus stable round-trip ID, select the exact immediate predecessor before eligibility filtering, require it to be `ready_closed`, and classify that same predecessor as a loss on the declared Category 2/3 selected gross or net P/L basis. If it qualifies, compute current first-entry UTC minus predecessor final-exit UTC in exact seconds. The gap must be positive. |
| Distinction from related concepts | It refers only to the exact immediate predecessor on the selected outcome basis. It is not time after any earlier loss, same-day loss, same-ticker loss, largest loss, losing day, loss streak, behavior diagnosis, or trader-defined cooldown rule. |
| Evidence classification | Deterministically derived when the named interval, predecessor, outcome-basis, and fee contracts are implemented |
| Capability status | Planned |
| Result units | Exact positive elapsed seconds plus selected outcome basis, sample count, and predecessor/current coverage state |
| Open-trade support | A current `legitimate_open` lifecycle may qualify in a future implementation because its first entry exists. The exact predecessor must be `ready_closed` and a selected-basis loss. A predecessor that is `legitimate_open`, `needs_decision`, otherwise non-ready, flat, or non-classifiable is a visible barrier and is never skipped. A current `needs_decision` remains coverage. |
| Fee handling | Gross loss uses the accepted gross basis. Net loss requires fee-complete evidence under Category 5; fee-incomplete/conflicting/unsupported net classification is non-classifiable coverage and cannot be replaced with gross. All outcome classification remains in a compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: outcome-conditioned ordered interval.
- Narrower concepts: exact immediate predecessor; selected-basis predecessor
  loss; positive final-exit-to-first-entry gap.
- Commonly confused concepts: time after any loss, time after a losing day,
  cooldown after a loss, loss streak, same-ticker sequence.
- Must not be merged with: `time_between_trades`,
  `time_after_previous_win`, or a trader rule/behavior label.

Exact/barrier boundary: predecessor selection occurs before readiness or
outcome filtering. Flat and non-classifiable outcomes, non-ready predecessors,
missing endpoints, absence of a predecessor, and zero/negative overlap gaps are
unavailable coverage, never skipped, relabelled, or clamped. Raw UTC controls
order and arithmetic; IANA local endpoint display is contextual only and
preserves DST. Report the selected basis, included sample count, and coverage.
The result is a historical association and cannot prove revenge trading,
emotion, causation, improvement opportunity, or advice.

## `time_after_previous_win`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-017 |
| Category | Time and Duration Metrics |
| Subcategory | Outcome interval |
| Canonical name | `time_after_previous_win` |
| Display name | Time after previous win |
| Exact definition | Planned interval using the same predecessor contract as `time_between_trades`: order all in-scope lifecycle candidates by first-entry UTC plus stable round-trip ID, select the exact immediate predecessor before eligibility filtering, require it to be `ready_closed`, and classify that same predecessor as a win on the declared Category 2/3 selected gross or net P/L basis. If it qualifies, compute current first-entry UTC minus predecessor final-exit UTC in exact seconds. The gap must be positive. |
| Distinction from related concepts | It refers only to the exact immediate predecessor on the selected outcome basis. It is not time after any earlier win, same-day win, same-ticker win, largest win, winning day, win streak, behavior diagnosis, or trader-defined rule. |
| Evidence classification | Deterministically derived when the named interval, predecessor, outcome-basis, and fee contracts are implemented |
| Capability status | Planned |
| Result units | Exact positive elapsed seconds plus selected outcome basis, sample count, and predecessor/current coverage state |
| Open-trade support | A current `legitimate_open` lifecycle may qualify in a future implementation because its first entry exists. The exact predecessor must be `ready_closed` and a selected-basis win. A predecessor that is `legitimate_open`, `needs_decision`, otherwise non-ready, flat, or non-classifiable is a visible barrier and is never skipped. A current `needs_decision` remains coverage. |
| Fee handling | Gross win uses the accepted gross basis. Net win requires fee-complete evidence under Category 5; fee-incomplete/conflicting/unsupported net classification is non-classifiable coverage and cannot be replaced with gross. All outcome classification remains in a compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: outcome-conditioned ordered interval.
- Narrower concepts: exact immediate predecessor; selected-basis predecessor
  win; positive final-exit-to-first-entry gap.
- Commonly confused concepts: time after any win, time after a profitable day,
  win streak, same-ticker sequence, confidence after a win.
- Must not be merged with: `time_between_trades`,
  `time_after_previous_loss`, or a behavior/motive label.

Exact/barrier boundary: predecessor selection occurs before readiness or
outcome filtering. Flat and non-classifiable outcomes, non-ready predecessors,
missing endpoints, absence of a predecessor, and zero/negative overlap gaps are
unavailable coverage, never skipped, relabelled, or clamped. Raw UTC controls
order and arithmetic; IANA local endpoint display is contextual only and
preserves DST. Report the selected basis, included sample count, and coverage.
The result cannot prove overconfidence, discipline, causation, future
performance, or advice.

## `first_trade_time`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-018 |
| Category | Time and Duration Metrics |
| Subcategory | Trading-window endpoint |
| Canonical name | `first_trade_time` |
| Display name | First trade time |
| Exact definition | Planned trading-window start: within one declared compatible server-authorized scope and period, order eligible lifecycles by first-entry UTC instant, then stable round-trip ID, select the earliest eligible lifecycle, and return its first position-opening raw UTC instant. User-facing display converts that same instant to the account IANA timezone with its effective offset/timezone. |
| Distinction from related concepts | It is the first-entry endpoint of the earliest eligible lifecycle, not the first execution row of any role, earliest final exit, minimum of mixed timestamp fields, first import, market open, named session, or `last_trade_time`. |
| Evidence classification | Deterministically derived when the named trading-window endpoint contract is implemented |
| Capability status | Planned |
| Result units | Raw UTC timestamp plus account-IANA local date, clock time, offset, timezone, and eligible sample count |
| Open-trade support | A factually confirmed `legitimate_open` lifecycle may participate when the declared population includes open lifecycles and its first opening is accepted. Default realized analysis uses `ready_closed`. `needs_decision` and missing/conflicting first-entry facts remain visible coverage and are not selected. |
| Fee handling | Not applicable to endpoint selection. Outcome/money-filtered populations retain selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: selected trading-window endpoint.
- Narrower concepts: earliest eligible lifecycle; its first-entry UTC instant;
  account-local window-start display.
- Commonly confused concepts: `entry_time` for one selected lifecycle, earliest
  execution of any role, market open, first fill, first trade result.
- Must not be merged with: `last_trade_time`, `session`, or a generic minimum
  over entry and exit timestamps.

Exact/sample boundary: an empty eligible population has no first trade time and
is unavailable/empty, never midnight or zero. Tied first-entry UTC instants use
stable round-trip ID only to select the lifecycle; display rounding/local time
does not alter selection. Raw UTC preserves DST-correct identity and the local
display uses only the authorized account timezone. Return sample/coverage
without private IDs. An early first trade does not prove preparation,
impulsiveness, cause, or advice.

## `last_trade_time`

| Field | Value |
|---|---|
| Inventory ID | C7-TIME-019 |
| Category | Time and Duration Metrics |
| Subcategory | Trading-window endpoint |
| Canonical name | `last_trade_time` |
| Display name | Last trade time |
| Exact definition | Planned trading-window end: within one declared compatible server-authorized scope and period, order eligible `ready_closed` lifecycles by final-exit UTC instant, then stable round-trip ID, select the lifecycle with the latest final exit, and return that final-flat raw UTC instant. User-facing display converts that same instant to the account IANA timezone with its effective offset/timezone. |
| Distinction from related concepts | It is the final-exit endpoint of the latest eligible completed lifecycle, not the latest first entry, last arbitrary execution, maximum of mixed timestamp fields, query as-of time, market close, named session, or `first_trade_time`. The first/last pair is intentionally asymmetric: first entry starts the window and final exit ends it. |
| Evidence classification | Deterministically derived when the named trading-window endpoint contract is implemented |
| Capability status | Planned |
| Result units | Raw UTC timestamp plus account-IANA local date, clock time, offset, timezone, and eligible sample count |
| Open-trade support | Only `ready_closed` can supply a final-exit endpoint. `legitimate_open` and `needs_decision` remain visible coverage and are never assigned the query as-of time, current clock, or estimated final exit. |
| Fee handling | Not applicable to endpoint selection. Outcome/money-filtered populations retain selected basis, fee completeness, and compatible account/timezone/currency partition. |
| Version | 1 |

### Related Concepts

- Broader concept: selected trading-window endpoint.
- Narrower concepts: latest eligible `ready_closed` lifecycle; its final-exit
  UTC instant; account-local window-end display.
- Commonly confused concepts: `exit_time` for one selected lifecycle, latest
  entry, last execution of any role, market close, query as-of time.
- Must not be merged with: `first_trade_time`, `session`, or a generic maximum
  over entry and exit timestamps.

Exact/sample boundary: an empty eligible `ready_closed` population has no last
trade time and is unavailable/empty, never midnight, zero, or now. Tied final-
exit UTC instants use stable round-trip ID only to select the lifecycle; display
rounding/local time does not alter selection. Raw UTC preserves DST-correct
identity and the local display uses only the authorized account timezone.
Return sample/coverage without private IDs. A late last trade does not prove
overtrading, discipline, cause, or advice.

## Canonical Record Completion

None. All 19 controlling inventory items have controller-approved and locked
Version 1 canonical records after independent PASS and clerical PASS. Section 5
acceptance does not authorize an AI Chat/runtime claim.

---

# 6. Language Registry Deliverable

Section 6 Batches 1-4 contain complete, approved, locked, independently reviewed
PASS Version 1 language registries for all `C7-TIME-001` through
`C7-TIME-019`. These
registries map language to accepted
deterministic concepts; they do not create filters, groupings, exchange-session
facts, date-language defaults, account access, or an AI Chat/runtime tool.

## `entry_time` Language Registry

### Exact Definition

The raw UTC execution instant of the first accepted position-opening allocation
in one selected lifecycle. Selection/order use raw UTC. Display converts that
same instant to the server-authorized account IANA timezone with its effective
DST offset and timezone label.

### Formal Wording

- “first position-opening execution time”
- “entry timestamp in the account timezone”

### Normal Conversational Wording

- “What time did I enter?”
- “When did this trade start?”

### Trader Slang

- “What time was my first fill?” maps only when trusted trade context makes
  “first fill” the first position-opening allocation, not any order/fill.
- “When did I get in?”

### Abbreviations

- `entry tm` and `entry time` are safe in selected-trade context.
- `UTC` or `local` may modify the requested display. Bare `ET` is not mapped:
  it can mean Eastern Time rather than entry time.

### Common Misspellings

- `entery time`
- `etry timestamp`

### Noisy or Incomplete Input

- `AAPL entry time?` treats `AAPL` as a ticker token only after the approved
  symbol resolver and authorized scope validate it.
- `entry 09:35?` is ambiguous between retrieving an entry time and filtering
  by a local time token.

### Singular and Plural Forms

- Singular: “entry time” for one selected lifecycle.
- Plural: “entry times” for an eligible population; never every entry fill
  unless Category 8 is explicitly requested.

### Full Questions

- “What was the entry time for the selected trade?”
- “Show the first-entry times for eligible AAPL round trips in the selected
  period.”

### Commands

- “Show this trade’s entry time in the account timezone.”
- “List eligible entry times with timezone labels.”

### Sentence Fragments

- “first entry time”
- “AAPL entries, local time”

### Follow-Up Wording

- “Show those in local time.” requires the trusted prior population and the
  same authorized account timezone.
- “What about the selected trade?” changes the population, not the definition.

### Correction Wording

- “I meant the first position-opening time, not every fill.”
- “Use UTC, not the local display.”

### Comparison Wording

- “Compare first-entry times for the two already selected groups.”
- Comparison waits for Category 14 validation and retains compatible account
  timezone partitions.

### Ranking Wording

- “Which eligible trade had the earliest entry?”
- “Show the latest first-entry time, with deterministic UTC/ID ties.”

### Negated Wording

- “Show entry times without open lifecycles.”
- “Do not use order-submission times.”

### Exclusion Wording

- “Entry times excluding AAPL” may use only the validated symbol exclusion.
- “Exclude `needs_decision` from values but show its coverage count.”

### Multi-Filter Wording

- “Show first-entry times for eligible closed long AAPL trades in the selected
  period” combines only validated population, direction, symbol, and range
  filters.

### Multi-Part Question Wording

- “What was this trade’s entry time, and show the same instant in UTC and
  account-local time?” returns two representations of one fact.

### Ambiguous Wording

- “First fill” may mean first fill of any order or first position opening.
- “Entry at 09:35” may be a claimed fact, a filter, or a retrieval request.
- “ET” may mean Eastern Time; never treat it as `entry_time` without context.

### Negative Examples

These examples must not map to this concept.

- “When was my first partial exit?” maps to `time_to_first_exit`/Category 8.
- “Was this premarket?” maps to unavailable `session`, not local entry time.
- “Change the entry time to 09:35” is a protected Journal-write request.

### Context Requirements

Require one server-authorized account scope and either one trusted selected
lifecycle or a validated eligible population. Use only the account IANA
timezone; a browser/client timezone is not trusted. A ticker/time token does
not select an account or invent a trade.

### Required Data

- Current accepted execution versions and allocation graph.
- First position-opening raw UTC instant and lifecycle state.
- Authorized account scope and account IANA timezone for local display.
- Coverage/Data Decision state.

### Optional Data

- Validated symbol/direction/source/outcome filters and selected period.
- Trusted selected-trade context and requested UTC/local display preference.
- Compatible currency partition when combined with outcome/money results.

### Valid Filters

- Only existing validated Journal query filters, including selected lifecycle,
  authorized account, closing-date range, symbol, direction, source, outcome,
  and accepted entry-time bucket where applicable.
- A bare ticker or `09:35` token is not a filter until its owning resolver and
  timezone context validate it.

### Valid Groupings

- Existing validated `entry_time_bucket` grouping in the declared account
  timezone.
- Other accepted Journal groupings may segment the same eligible population;
  this registry creates no new grouping.

### Valid Operators

- Direct retrieval and deterministic UTC chronological earliest/latest.
- Comparisons/rankings require later Category 12/14 validation; no operator is
  inferred from a time token alone.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Journal mutation without protected draft/confirmation handling.
- Named exchange session without accepted session facts.
- Cross-account access, incompatible timezone merging, or a money/outcome
  comparison across incompatible currencies.
- Advice, prediction, motive, or causation inferred from clock time.

### Default Interpretation

For one selected lifecycle, use the first position-opening raw UTC instant and
display it in the authorized account IANA timezone. For an aggregate request,
default to eligible `ready_closed`; include `legitimate_open` only when the
request/trusted context explicitly selects the open population. Never default
to every entry fill.

### Clarification Conditions

Clarify when “entry” could mean first opening versus every fill, when `09:35`
could be a filter versus a claimed/result time, when UTC versus local display
matters and no trusted preference exists, or when no selected lifecycle/
population is available. Do not ask for account identity the server must supply.

### Recommended Clarification Wording

1. “Do you mean the trade’s first position-opening time or every entry fill?”
2. If still needed: “Should I show the raw UTC time or the account-local time?”
3. If still needed: “Which selected trade or eligible population should I use?”

### Unsupported Conditions

- Missing/conflicting first-opening fact or `needs_decision` lifecycle.
- Unavailable/invalid account IANA timezone for local display.
- Requested named exchange session, unvalidated filter/group, or unauthorized
  account scope.
- Request to infer a missing time, motive, quality, or recommendation.

### Target Analytics Tool or Query Capability

- Read-only `JournalAnalyticsFactSet`, current allocation/population builder,
  `JournalAnalyticsService`, validated `journal_analytics_query_v1`, and
  existing entry-time bucket result path.
- AI Chat interpretation/validation/runtime remains unimplemented.

### Result Units

- Raw UTC timestamp plus account-IANA local date/time, effective UTC offset,
  and timezone label; population results also include sample/coverage counts.

### Fee Handling

- Not applicable to the timestamp. Combined net/outcome requests retain the
  accepted fee-completeness and compatible currency state.

### Open-Trade Handling

- `ready_closed` and factually confirmed `legitimate_open` can have an entry
  time. `needs_decision` or missing/conflicting first-entry facts remain
  coverage and are never inferred.

### Sample-Size Considerations

- One selected lifecycle returns one factual instant; an empty population is
  empty/unavailable, never midnight or zero.
- Aggregates/groups report included count and coverage. Clock-time patterns in
  small samples are descriptive only and never causation or advice.

## `exit_time` Language Registry

### Exact Definition

The raw UTC execution instant of the accepted final-flat allocation that
returns one selected lifecycle to zero position. Display converts that same
instant to the server-authorized account IANA timezone with its effective DST
offset. It is not the first partial exit.

### Formal Wording

- “final position-closing execution time”
- “final-exit timestamp in the account timezone”

### Normal Conversational Wording

- “What time did I exit?”
- “When was this trade fully closed?”

### Trader Slang

- “When was I all out?” maps to final exit in selected-trade context.
- “What time did I flatten?” maps only when it means this lifecycle returned
  to zero, not an account-wide flatten action.

### Abbreviations

- `exit tm` and `final exit` are safe with selected-trade context.
- `UTC`/`local` may modify display. Bare `x` or `ET` is not a safe alias.

### Common Misspellings

- `exiit time`
- `final ext timestamp`

### Noisy or Incomplete Input

- `AAPL all out when?` requires validated ticker and lifecycle context.
- `exit 15:42?` is ambiguous between retrieval, correction, and time filter.

### Singular and Plural Forms

- Singular: “exit time” for one completed lifecycle.
- Plural: “exit times” means final-exit times across eligible completed round
  trips, not every reducing execution.

### Full Questions

- “What was the final-exit time for the selected trade?”
- “Show eligible AAPL final-exit times in account-local time.”

### Commands

- “Show this trade’s final exit in UTC and local time.”
- “List final-exit times for the selected eligible population.”

### Sentence Fragments

- “final exit time”
- “when fully flat”

### Follow-Up Wording

- “Use the final exit, not the partial.” retains the trusted selected trade.
- “Show those in UTC.” retains the prior authorized population.

### Correction Wording

- “I meant when the position was fully flat, not the first scale-out.”
- “Use the account-local display, not browser time.”

### Comparison Wording

- “Compare final-exit times for the two selected groups.”
- Comparison requires later validated comparison semantics and compatible
  timezone partitions.

### Ranking Wording

- “Which eligible closed trade exited earliest?”
- “Show the latest final exit, using UTC and stable-ID ties.”

### Negated Wording

- “Show final-exit times without unresolved trades.”
- “Do not use partial exits.”

### Exclusion Wording

- “Exit times excluding AAPL” uses only validated symbol exclusion.
- “Exclude open lifecycles from values but show open coverage.”

### Multi-Filter Wording

- “Show final-exit times for eligible closed short AAPL trades in the selected
  period” uses only validated population/direction/symbol/range filters.

### Multi-Part Question Wording

- “When did this trade first reduce and when was it fully closed?” maps the
  first part to `time_to_first_exit` and the second to `exit_time`; do not merge.

### Ambiguous Wording

- “Exit time” may mean first reduction or final flat without context.
- “Last fill” may be an unrelated allocation/import row rather than final flat.
- `15:42` may be a claimed value, filter, or desired display.

### Negative Examples

These examples must not map to this concept.

- “How long until my first partial?” maps to `time_to_first_exit`.
- “How long was I in the trade?” maps to `hold_duration`.
- “Change my exit time” is a protected Journal-write request.

### Context Requirements

Require server-authorized scope plus one trusted selected completed lifecycle
or validated eligible `ready_closed` population. Account IANA timezone controls
local display. Ticker/time tokens never authorize scope or invent a close.

### Required Data

- Current accepted allocation graph and lifecycle state.
- Accepted final-flat raw UTC instant.
- Authorized account scope and account IANA timezone.
- Coverage/Data Decision state proving `ready_closed`.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Selected-trade context and UTC/local display preference.
- Compatible currency partition for combined outcome/money results.

### Valid Filters

- Selected lifecycle and only existing validated Journal query filters.
- Any exit-time bucket/range must already exist in the validated query contract;
  this registry does not create one from a bare clock token.

### Valid Groupings

- Existing accepted final-exit local-time distribution/grouping where exposed
  by the Journal service.
- Other validated Journal groupings may segment the same `ready_closed`
  population; no grouping is invented here.

### Valid Operators

- Direct retrieval and deterministic UTC earliest/latest.
- Comparisons/rankings require Category 12/14 validation and stable ties.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Including `legitimate_open`/`needs_decision` as if final-flat.
- Substituting first partial exit, query as-of time, or current clock.
- Cross-account or incompatible timezone/currency merging.
- Session, motive, quality, prediction, causation, or advice inference.

### Default Interpretation

For a selected completed lifecycle, use the final-flat raw UTC instant and show
account-local time. Aggregate requests use eligible `ready_closed` only. Never
default to the first reducing execution or current/as-of time.

### Clarification Conditions

Clarify first partial versus final exit, UTC versus account-local display when
it materially matters, or missing selected lifecycle/population. A request
that clearly says “fully closed” needs no event clarification.

### Recommended Clarification Wording

1. “Do you mean the first partial exit or when the position was fully closed?”
2. If still needed: “Should I show UTC or the account-local time?”
3. If still needed: “Which selected trade or eligible closed population?”

### Unsupported Conditions

- `legitimate_open`, `needs_decision`, missing/conflicting final-flat fact, or
  reversed/unresolved lifecycle.
- Missing account timezone for local display or unauthorized account scope.
- Unvalidated time filter/group, named session, inferred value, or advice.

### Target Analytics Tool or Query Capability

- Read-only fact set/allocation graph, `JournalAnalyticsService`, validated
  `journal_analytics_query_v1`, and accepted final-exit local distribution.
- AI Chat interpretation/validation/runtime remains unimplemented.

### Result Units

- Raw UTC timestamp plus account-IANA local date/time, effective offset, and
  timezone label; population results include sample/coverage counts.

### Fee Handling

- Not applicable. Combined net/outcome results retain fee completeness and a
  compatible currency partition.

### Open-Trade Handling

- `legitimate_open` has no final exit. Open and `needs_decision` remain visible
  coverage and are never assigned now/as-of/estimated exit times.

### Sample-Size Considerations

- One completed lifecycle returns one factual instant; an empty eligible
  population is empty/unavailable, never midnight or zero.
- Grouped clock patterns show sample and coverage and cannot establish a best
  exit time, causation, or advice.

## `hold_duration` Language Registry

### Exact Definition

For one eligible `ready_closed` lifecycle, subtract the first position-opening
raw UTC instant from the final-flat raw UTC instant and return exact elapsed
seconds. UTC arithmetic preserves actual elapsed time through DST, overnight,
and multi-day spans.

### Formal Wording

- “elapsed holding duration from first open to final close”
- “final-exit UTC minus first-entry UTC”

### Normal Conversational Wording

- “How long did I hold this trade?”
- “How much time was I in the position?”

### Trader Slang

- “How long was I in it?” requires trusted selected-trade context.
- “Time in trade” maps to full lifecycle duration, not market-only time.

### Abbreviations

- `hold dur`, `holding dur`, and `time in trade` are safe in analytics context.
- Bare `HT`, `TIT`, `sec`, or `min` is not a canonical-concept alias; unit
  tokens modify a resolved duration only.

### Common Misspellings

- `hold dureation`
- `holding duraton`

### Noisy or Incomplete Input

- `AAPL held how long?` requires validated ticker and lifecycle/population.
- `hold < 5m` is a duration-filter fragment, not automatically a metric result;
  `5m` must resolve as five minutes, not a ticker/timeframe, through context.

### Singular and Plural Forms

- Singular: “hold duration” for one eligible completed lifecycle.
- Plural: “hold durations” for a `ready_closed` population, one duration per
  round trip rather than per execution.

### Full Questions

- “What was the hold duration for the selected trade?”
- “Show exact holding durations for eligible AAPL round trips.”

### Commands

- “Calculate first-entry-to-final-exit duration.”
- “List hold durations in minutes, preserving exact seconds.”

### Sentence Fragments

- “time held”
- “under 5 min holds”

### Follow-Up Wording

- “Use final exit, not first scale-out.” retains selected context.
- “Show that in seconds.” changes display units, not the exact duration.

### Correction Wording

- “I meant the full hold, not time to first exit.”
- “Use elapsed time, not calendar days held.”

### Comparison Wording

- “Compare hold durations for the two selected eligible groups.”
- Comparisons retain exact seconds, sample counts, compatible partitions, and
  later Category 14 validation.

### Ranking Wording

- “Which eligible trade had the shortest hold?”
- “Show the longest hold, using exact duration and stable ties.”

### Negated Wording

- “Show hold durations without open lifecycles.”
- “Do not count market-closed time only; use full elapsed time.”

### Exclusion Wording

- “Hold durations excluding AAPL” uses validated symbol exclusion only.
- “Exclude `needs_decision` from values but report decision coverage.”

### Multi-Filter Wording

- “Show exact hold durations for eligible closed long AAPL trades in the
  selected period and under the validated duration bucket.”

### Multi-Part Question Wording

- “Show this trade’s entry time, final exit time, and exact hold duration.”
  maps to three distinct concepts over the same accepted endpoints.

### Ambiguous Wording

- “Days held” may mean local date boundaries, not elapsed duration.
- `5m` may mean five minutes, a five-minute candle interval, or a token.
- “Time in position” may mean completed hold or open-position age.

### Negative Examples

These examples must not map to this concept.

- “How many calendar days did I hold it?” maps to planned `days_held`.
- “How long until the first partial exit?” maps to `time_to_first_exit`.
- “How old is my open position now?” requires a separate as-of age metric.

### Context Requirements

Require authorized account scope and one selected eligible `ready_closed`
lifecycle or validated completed population. Raw UTC endpoints control math;
account IANA local displays are contextual only. Ticker/duration tokens require
their approved resolvers.

### Required Data

- Accepted first position-opening and final-flat raw UTC instants.
- Current allocation graph and `ready_closed` state.
- Authorized account scope, account IANA timezone, and coverage state.

### Optional Data

- Validated symbol/direction/source/outcome/range and duration-bucket filters.
- Requested seconds/minutes/hours display without losing exact seconds.
- Compatible currency partition for combined outcome/money analysis.

### Valid Filters

- Selected lifecycle and existing validated Journal filters.
- Existing validated `holding_duration_bucket`/duration range where covered;
  no unit token creates a filter by itself.

### Valid Groupings

- Existing validated `holding_duration_bucket` and other accepted Journal
  groupings over the same `ready_closed` population.
- This registry creates no market-session or calendar grouping.

### Valid Operators

- Exact UTC subtraction, equality, and validated duration range comparisons.
- Earliest/shortest/latest/longest ranking requires Category 12/14 validation
  and deterministic ties.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Final duration for `legitimate_open`/`needs_decision`.
- Local-clock subtraction, fixed 86,400-second day substitution, or
  market-session-only duration.
- Cross-account/timezone/currency mixing or unvalidated filters/groupings.
- Behavior, motive, quality, causation, prediction, or advice claims.

### Default Interpretation

Use exact final-exit UTC minus first-entry UTC for one eligible `ready_closed`
round trip, including overnight/non-market time. Default display may be a human
duration, but exact seconds remain authoritative.

### Clarification Conditions

Clarify full hold versus time to first exit, elapsed time versus `days_held`,
completed duration versus open age, or an ambiguous unit token such as `5m`.
Do not ask for facts the Journal must establish.

### Recommended Clarification Wording

1. “Do you mean the full first-entry-to-final-exit hold or time to the first exit?”
2. If still needed: “Do you want elapsed time or local calendar days held?”
3. If still needed: “Should I display the exact result in seconds, minutes, or hours?”

### Unsupported Conditions

- Open/decision/unresolved lifecycle, missing/reversed endpoint, or invalid
  account timezone/scope.
- Requested session-only/business-day/candle duration without its facts.
- Unvalidated unit/filter/group, invented endpoint, or advice request.

### Target Analytics Tool or Query Capability

- Read-only fact set/allocation graph, exact duration calculator,
  `JournalAnalyticsService`, validated `journal_analytics_query_v1`, and
  existing holding-duration bucket/result path.
- AI Chat interpretation/validation/runtime remains unimplemented.

### Result Units

- Exact elapsed seconds; optional hours/minutes/seconds display plus account-
  local endpoint labels, sample count, and coverage.

### Fee Handling

- Not applicable. Combined outcome/net requests preserve fee completeness and
  compatible currency partition separately.

### Open-Trade Handling

- Only `ready_closed` has final hold duration. `legitimate_open` age is a
  separate as-of concept; open and `needs_decision` remain visible coverage.

### Sample-Size Considerations

- A single lifecycle returns one exact duration. A valid zero duration requires
  equal accepted raw instants; missing endpoints never become zero.
- Empty populations are empty/unavailable. Groups show sample and coverage;
  duration alone cannot establish cause or a recommended hold.

## `average_hold_duration` Language Registry

### Exact Definition

The exact arithmetic mean of `hold_duration` seconds over one declared eligible
`ready_closed` population: exact sum of included elapsed seconds divided by the
included lifecycle count. Calculation retains exact rational/decimal semantics;
display rounding never changes inclusion or downstream values.

### Formal Wording

- “arithmetic mean holding duration”
- “exact average elapsed seconds per eligible closed round trip”

### Normal Conversational Wording

- “How long do I hold trades on average?”
- “What’s my average time in a trade?”

### Trader Slang

- “Avg hold”
- “Average time in the name” maps only when the eligible round-trip population
  is clear, not per ticker-screen time or open-position age.

### Abbreviations

- `avg hold`, `avg hold dur`, and `mean hold` are safe analytics abbreviations.
- Bare `avg time`, `AHT`, `min`, or `m` is not sufficient; `min` can also mean
  minimum rather than minutes.

### Common Misspellings

- `avarage hold duration`
- `avg holding dureation`

### Noisy or Incomplete Input

- `avg hold AAPL?` requires validated ticker, authorized population, and scope.
- `avg hold 5m` is ambiguous between a five-minute display/filter and an
  asserted result.

### Singular and Plural Forms

- Singular metric: “average hold duration” for one population.
- “Average hold durations” may request multiple validated groups; it does not
  mean averaging already rounded group averages together.

### Full Questions

- “What is the exact average hold duration for eligible closed trades?”
- “What was average hold time for eligible AAPL round trips in the selected
  period?”

### Commands

- “Calculate average first-entry-to-final-exit duration.”
- “Show the exact mean in seconds and a readable duration.”

### Sentence Fragments

- “average hold”
- “mean time in trade”

### Follow-Up Wording

- “Use the same eligible population.” retains prior authorized filters and
  coverage.
- “Now show it in minutes.” changes display only.

### Correction Wording

- “I meant the mean, not the median.”
- “Average full holds, not time to first partial exit.”

### Comparison Wording

- “Compare average hold duration for the two selected groups.”
- Each group needs its own included count, exact mean, compatible partition,
  and later validated comparison semantics.

### Ranking Wording

- “Rank the validated groups by average hold duration.”
- Ties use exact unrounded means and later Category 14 deterministic rules.

### Negated Wording

- “Average hold duration without open or decision lifecycles.”
- “Do not round before averaging.”

### Exclusion Wording

- “Average hold excluding AAPL” uses validated symbol exclusion only.
- “Exclude fee-incomplete rows” is not required for duration alone; if the
  population also selects net outcome, preserve its fee/coverage rule.

### Multi-Filter Wording

- “Average hold for eligible closed long AAPL trades in the selected period and
  validated duration range.”

### Multi-Part Question Wording

- “Show average and median hold duration, with both sample counts.” maps to
  `average_hold_duration` and `median_hold_duration` separately.

### Ambiguous Wording

- “Average time” may mean clock time, duration, time to first exit, or open age.
- `min` may mean minutes or minimum.
- “My normal hold” is not an accepted user baseline or average by itself.

### Negative Examples

These examples must not map to this concept.

- “What is the median holding time?” maps to `median_hold_duration`.
- “What is my shortest hold?” is a minimum/ranking request, not average.
- “How long should I hold?” asks for advice and must not map to a factual mean.

### Context Requirements

Require one server-authorized account scope, declared eligible `ready_closed`
population, compatible account timezone, and validated filters. When combined
with money/outcomes, retain one compatible currency/basis/fee partition. Prior
context may supply filters only when trusted and unchanged.

### Required Data

- Exact `hold_duration` seconds for every included `ready_closed` lifecycle.
- Included lifecycle count and complete/partial/empty coverage.
- Authorized account scope and compatible account IANA timezone partition.

### Optional Data

- Existing validated symbol/direction/source/outcome/range/duration filters.
- Requested duration display units.
- Compatible currency, selected P/L basis, and fee state for combined queries.

### Valid Filters

- Only existing validated Journal query filters and holding-duration range/
  bucket where covered.
- Filters apply before one exact sum and denominator are formed; ticker/time
  tokens require their approved resolvers.

### Valid Groupings

- Only existing accepted Journal groupings, including holding-duration bucket,
  over separately reconciled eligible populations.
- Never average displayed group averages to create an overall mean.

### Valid Operators

- Exact sum, nonzero included-count division, comparison, and later validated
  ranking on unrounded values.
- No inferred statistical-significance or recommendation operator.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trend`, `explain_result`,
  `analyze_trade` when context selects a population, and `inspect_data_quality`.

### Incompatible Combinations

- Including `legitimate_open`/`needs_decision` as zero/as-of completed holds.
- Averaging rounded displays, group averages, calendar days, first-exit times,
  or incompatible account/timezone/currency populations.
- Invented filter/group, statistical certainty, causation, or advice.

### Default Interpretation

Use all eligible `ready_closed` round-trip `hold_duration` seconds in the
validated population, sum exactly, and divide by exact included count. Report
the count/coverage and preserve exact seconds beneath display formatting.

### Clarification Conditions

Clarify mean versus median, full hold versus first-exit interval, population/
filters when absent, or display unit ambiguity (`min`). Do not ask for account
scope the server must authorize.

### Recommended Clarification Wording

1. “Do you want the arithmetic mean hold duration or the median?”
2. If still needed: “Should this use full first-entry-to-final-exit holds?”
3. If still needed: “Which selected eligible population should I average?”
4. If still needed: “Should I display the exact result in seconds, minutes, or hours?”

### Unsupported Conditions

- Empty eligible population (no denominator), unresolved/open endpoints, or
  incompatible authorized account/timezone scope.
- Unvalidated filter/group, cross-currency outcome mix, invented session/date,
  or request for advice/causal inference.

### Target Analytics Tool or Query Capability

- Exact duration accumulator/mean calculation over the read-only fact set,
  `JournalAnalyticsService`, validated query/group result, and metric registry.
- AI Chat interpretation/validation/runtime remains unimplemented.

### Result Units

- Exact mean elapsed seconds, readable duration display, included count, and
  complete/partial/empty/unavailable coverage.

### Fee Handling

- Not applicable to duration. Net/outcome-filtered populations preserve fee
  completeness and compatible currency rather than altering the duration.

### Open-Trade Handling

- Only `ready_closed` durations enter numerator/denominator. `legitimate_open`
  and `needs_decision` remain visible coverage, never zero or as-of values.

### Sample-Size Considerations

- Empty is unavailable, not zero. One member’s mean equals its exact duration;
  valid zero-duration members remain included without zeroing the denominator.
- Always return included count/coverage. Small-sample means are descriptive and
  do not establish a normal hold, confidence, cause, or advice.

## `median_hold_duration` Language Registry

### Exact Definition

Sort exact `hold_duration` seconds for one declared eligible `ready_closed`
population in ascending numeric order. For an odd non-empty count, return the
middle exact value. For an even non-empty count, return the exact arithmetic
mean of the two middle values. Ties and valid zeros remain ordinary members.

### Formal Wording

- “exact median holding duration”
- “middle elapsed duration, with even-count midpoint”

### Normal Conversational Wording

- “What’s my median hold time?”
- “What is the middle holding duration?”

### Trader Slang

- “Med hold”
- “Typical hold” may map only after clarifying that the trader means median;
  `typical` is not a safe automatic synonym.

### Abbreviations

- `med hold`, `median hold`, and `med hold dur` are safe analytics forms.
- Bare `med`, `mid`, `min`, or `P50` is not automatically mapped; `P50` may
  belong to a later percentile contract.

### Common Misspellings

- `meadian hold duration`
- `median holding duraton`

### Noisy or Incomplete Input

- `med hold AAPL?` requires validated ticker, population, and scope.
- `middle hold 5m?` is ambiguous between a claimed result, filter, and display
  unit/timeframe token.

### Singular and Plural Forms

- Singular metric: “median hold duration” for one population.
- “Median hold durations” may request multiple validated groups, each with its
  own exact median and sample count.

### Full Questions

- “What is the exact median hold duration for eligible closed trades?”
- “Show median holding time for eligible AAPL round trips in the selected
  period.”

### Commands

- “Calculate the median of exact first-entry-to-final-exit durations.”
- “Show the median in seconds and readable time with sample count.”

### Sentence Fragments

- “median hold”
- “middle time in trade”

### Follow-Up Wording

- “Use the same eligible population, but show the median.”
- “Show the exact even-sample midpoint.” retains prior authorized context.

### Correction Wording

- “I meant median, not average.”
- “Use full hold duration, not days held.”

### Comparison Wording

- “Compare median hold duration for the two selected groups.”
- Each group reports exact median/count/coverage in a compatible partition and
  awaits Category 14 comparison validation.

### Ranking Wording

- “Rank the validated groups by median hold duration.”
- Exact unrounded medians and deterministic later tie policy control rank.

### Negated Wording

- “Median hold without open or decision lifecycles.”
- “Do not pick a rounded middle display value.”

### Exclusion Wording

- “Median hold excluding AAPL” uses validated symbol exclusion only.
- “Exclude unresolved durations but show their coverage count.”

### Multi-Filter Wording

- “Median hold for eligible closed short AAPL trades in the selected period and
  validated duration range.”

### Multi-Part Question Wording

- “Show median and average hold duration, and explain the different values.”
  maps to two metrics plus `explain_result`; neither calculation changes.

### Ambiguous Wording

- “Typical hold” may mean median, mean, mode, or a trader-defined target.
- “Middle trade” may mean an ordered lifecycle, not median duration.
- `P50` may imply percentile semantics not owned by this registry.

### Negative Examples

These examples must not map to this concept.

- “What is average holding time?” maps to `average_hold_duration`.
- “Show my minimum hold” is an extrema request, not median.
- “What hold time should I target?” is advice, not a factual median.

### Context Requirements

Require one server-authorized account scope, declared eligible `ready_closed`
population, compatible timezone, and validated filters. Combined money/outcome
requests retain compatible currency/basis/fee partitions. Trusted prior context
may carry a population but not invent a median meaning.

### Required Data

- Exact `hold_duration` seconds for every included `ready_closed` lifecycle.
- Exact included count, ordering, and complete/partial/empty coverage.
- Authorized account scope and compatible account IANA timezone partition.

### Optional Data

- Existing validated symbol/direction/source/outcome/range/duration filters.
- Requested display unit and trusted prior population.
- Compatible currency, outcome basis, and fee state for combined queries.

### Valid Filters

- Only existing validated Journal filters and holding-duration range/bucket.
- Apply filters before sorting one exact population; a token never silently
  creates a filter.

### Valid Groupings

- Only existing accepted Journal groupings, including holding-duration bucket,
  with a separate exact median/count per reconciled group.
- Never take the median of displayed group medians as the overall result.

### Valid Operators

- Exact ascending sort, odd middle selection, even-middle exact arithmetic
  mean, comparison, and later validated ranking.
- No inferred significance, “typical behavior,” or recommendation operator.

### Compatible Intents

- `calculate_metric`, `summarize_performance`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trend`, `explain_result`,
  `analyze_trade` when context selects a population, and `inspect_data_quality`.

### Incompatible Combinations

- Including open/decision rows as zero/as-of durations.
- Sorting display-rounded values, choosing an unstable middle row, or using
  average/calendar days/first-exit duration instead.
- Incompatible account/timezone/currency merging, invented filter/group,
  causation, statistical certainty, or advice.

### Default Interpretation

Use the exact eligible `ready_closed` `hold_duration` population, sort numeric
seconds, and apply odd/even median rules. Preserve exact value beneath display
formatting and report included count/coverage.

### Clarification Conditions

Clarify median versus mean/“typical,” full hold versus first-exit duration,
population/filters when absent, or ambiguous unit/percentile tokens. Do not
ask the trader to supply server-owned scope or missing historical endpoints.

### Recommended Clarification Wording

1. “By typical hold, do you mean the exact median or the arithmetic average?”
2. If still needed: “Should this use full first-entry-to-final-exit durations?”
3. If still needed: “Which selected eligible population should I use?”
4. If still needed: “Should I display the exact result in seconds, minutes, or hours?”

### Unsupported Conditions

- Empty eligible population, unresolved/open endpoint, or incompatible/
  unauthorized account-timezone scope.
- Unvalidated percentile/filter/group, cross-currency outcome mix, invented
  session/date fact, or advice/causal request.

### Target Analytics Tool or Query Capability

- Exact duration accumulator/sorter/median calculation over the read-only fact
  set, `JournalAnalyticsService`, validated query/group result, and registry.
- AI Chat interpretation/validation/runtime remains unimplemented.

### Result Units

- Exact median elapsed seconds, readable duration display, included count, and
  complete/partial/empty/unavailable coverage.

### Fee Handling

- Not applicable. Net/outcome-filtered populations preserve fee completeness
  and compatible currency separately.

### Open-Trade Handling

- Only `ready_closed` durations enter the ordered population. `legitimate_open`
  and `needs_decision` remain visible coverage, never zero/as-of members.

### Sample-Size Considerations

- Empty is unavailable, not zero. One member returns itself; even samples use
  both exact middle values; tied and valid zero durations remain included.
- Always return count/coverage. A small-sample median is descriptive and does
  not establish a normal/ideal hold, causation, confidence, or advice.

## `time_to_first_exit` Language Registry

### Exact Definition

Planned exact elapsed seconds from the accepted first position-opening raw UTC
instant to the raw UTC instant of the first later accepted position-reducing
allocation in the same lifecycle. The endpoint may be a partial reduction and
does not need to return the position to flat. No current named implementation
or query contract is claimed.

### Formal Wording

- “elapsed time from first position opening to first position reduction”
- “first-entry UTC to first-reducing-execution UTC interval”

### Normal Conversational Wording

- “How long until my first exit?”
- “When did I first take some off?”

### Trader Slang

- “Time to first scale-out” maps only when the first reduction is a scale-out.
- “How long till first trim?” requires an accepted position-reducing role, not
  side inference.

### Abbreviations

- `TTFE` and `time 2 first exit` are safe only in explicit trade-analytics
  context.
- Bare `TFE`, `1st x`, or `sell time` is not safe across long/short directions.

### Common Misspellings

- `time to frist exit`
- `time to first exiit`

### Noisy or Incomplete Input

- `AAPL 1st trim how long?` requires validated ticker and selected lifecycle.
- `first exit 5m?` is ambiguous between a claimed result, comparison/filter,
  and five-minute display token.

### Singular and Plural Forms

- Singular: “time to first exit” for one lifecycle.
- Plural: “times to first exit” means one qualified first-reduction interval per
  lifecycle, not all exit-execution gaps.

### Full Questions

- “How many exact seconds elapsed before the selected trade’s first reduction?”
- “Show planned time-to-first-exit results for the selected eligible population.”

### Commands

- “Calculate first opening to first reduction, not final close.”
- “Show the UTC endpoints and account-local display if the metric is available.”

### Sentence Fragments

- “time to first partial”
- “first trim delay”

### Follow-Up Wording

- “Use the first reduction, not when I was flat.” retains trusted context.
- “Show that in seconds.” changes display only, not the planned formula.

### Correction Wording

- “I meant first partial exit, not final-exit time.”
- “Do not infer first exit from Sell side; use the allocation role.”

### Comparison Wording

- “Compare time to first exit for the two selected groups.”
- The request remains Planned and requires later validated comparison semantics,
  identical formula, sample counts, and compatible partitions.

### Ranking Wording

- “Rank eligible trades by time to first exit.”
- Ranking remains unavailable until the named metric and Category 12/14 rules
  exist; exact unrounded intervals would control ties.

### Negated Wording

- “Time to first exit without open trades that never reduced.”
- “Do not use the final exit.”

### Exclusion Wording

- “Exclude AAPL” uses only validated symbol exclusion.
- “Exclude unresolved reductions from values but report their coverage.”

### Multi-Filter Wording

- “Time to first exit for eligible closed long AAPL trades in the selected
  period” uses only validated population/direction/symbol/range filters.

### Multi-Part Question Wording

- “Show time to first exit and full hold duration.” maps to this Planned metric
  and supported `hold_duration` separately.

### Ambiguous Wording

- “First exit” may mean first reducing allocation or final flat.
- “First sell” is not first exit for a short lifecycle.
- `5m` may mean minutes, a candle timeframe, a filter, or a claimed value.

### Negative Examples

These examples must not map to this concept.

- “When was I fully out?” maps to `exit_time`.
- “How long did I hold?” maps to `hold_duration`.
- “When should I take my first partial?” asks for advice, not a factual metric.

### Context Requirements

Require server-authorized scope plus a trusted selected lifecycle or validated
population. Future calculation requires accepted allocation roles and endpoints.
Raw UTC controls arithmetic; account IANA timezone controls endpoint display.
Ticker/time tokens cannot authorize scope or establish an exit role.

### Required Data

- Accepted first position-opening raw UTC instant.
- Accepted first later position-reducing raw UTC instant and allocation role.
- Current lifecycle state, authorized account scope/timezone, and coverage.
- A separately accepted named query/metric contract, which is currently absent.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Requested seconds/minutes/hours display and endpoint timezone display.
- Compatible currency/basis/fee partition for combined outcome requests.

### Valid Filters

- Selected lifecycle and only existing validated Journal filters.
- No first-exit-time filter is created here; a duration token is not a filter
  until the future metric/query validator explicitly supports it.

### Valid Groupings

- No named first-exit grouping is currently accepted.
- Future results may use only already validated Journal groupings after the
  metric contract exists; this registry invents none.

### Valid Operators

- Future exact UTC subtraction and validated duration comparisons.
- Comparison/ranking requires Category 12/14 validation; no current execution
  operator is implied by this Planned registry.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality`; each must
  return Planned/unavailable until the deterministic contract exists.

### Incompatible Combinations

- Treating final flat as first reduction or inferring reduction from side.
- Assigning zero when no reduction is observed, or final duration to unresolved
  open/decision rows.
- Invented query/filter/group/session/date/account scope, causation, or advice.

### Default Interpretation

Interpret “time to first exit” as first-opening UTC to first later accepted
position reduction, not final close. Return Planned/unavailable rather than
calculating until the accepted first-reduction query contract exists.

### Clarification Conditions

Clarify first reduction versus final exit, selected lifecycle/population, or an
ambiguous unit token. Do not clarify missing implementation or historical facts
into a guessed result.

### Recommended Clarification Wording

1. “Do you mean time to the first position reduction or time until fully closed?”
2. If still needed: “Which selected trade or eligible population should I use?”
3. If still needed: “Should the eventual result display in seconds, minutes, or hours?”

### Unsupported Conditions

- Current absence of an accepted named first-reduction query/metric contract.
- Missing/conflicting first-opening or reducing role/time, no observed
  reduction, `needs_decision`, or unauthorized/incompatible scope.
- Request for inferred session, motive, quality, prediction, or advice.

### Target Analytics Tool or Query Capability

- Planned future exact allocation-role interval over the read-only fact set and
  validated Journal query/result contract.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future exact elapsed seconds with optional UTC/account-IANA endpoint displays,
  included count, and complete/partial/unavailable coverage.

### Fee Handling

- Not applicable. Combined net/outcome populations retain fee completeness and
  compatible currency separately.

### Open-Trade Handling

- A factually confirmed `legitimate_open` could qualify only if an accepted
  first reduction exists under the future contract. No reduction is unavailable,
  not zero. `needs_decision` remains visible coverage.

### Sample-Size Considerations

- No current samples may be claimed through this Planned metric. Future one-
  trade results use exact endpoints; empty/no-reduction is unavailable.
- Group results must show count/coverage and cannot imply an ideal first-exit
  time, causation, or advice.

## `session` Language Registry

### Exact Definition

A named exchange/venue trading-session classification for an explicitly
selected lifecycle event, derivable only from its raw UTC instant plus accepted
instrument/venue identity, versioned session taxonomy, authoritative calendar/
hours, holidays/exceptions, and effective timezone/DST rules. Those required
facts are absent, so the capability is Unavailable.

### Formal Wording

- “exchange-session classification for the selected execution event”
- “venue-calendar session label with versioned schedule evidence”

### Normal Conversational Wording

- “Was this entry premarket or regular hours?”
- “Which trading session was the final exit in?”

### Trader Slang

- “PM, RTH, or AH?”
- “Was I in the open?” remains ambiguous between a named market session,
  opening minutes, and an open position.

### Abbreviations

- `PM`, `RTH`, `REG`, and `AH` are session-label candidates only after a
  versioned venue taxonomy validates them.
- Bare `AM`, `open`, `EXT`, or `ETH` is unsafe and must not map automatically.

### Common Misspellings

- `premaket session`
- `afterhours sesion`

### Noisy or Incomplete Input

- `AAPL 09:12 PM?` may contain ticker/time/session tokens but cannot prove a
  named exchange session.
- `RTH trade?` lacks selected event, venue, calendar, and accepted taxonomy.

### Singular and Plural Forms

- Singular: “session” for one explicitly selected event.
- Plural: “sessions” for a population still requires one accepted classification
  per event; it is not a local-clock bucket list.

### Full Questions

- “Which exchange session contained the selected trade’s first entry?”
- “Group final exits by named venue session if authoritative facts are available.”

### Commands

- “Classify the selected entry by exchange session.”
- “Return unavailable if the venue calendar contract is missing.”

### Sentence Fragments

- “entry session”
- “PM vs RTH vs AH”

### Follow-Up Wording

- “I meant the exit session.” changes the selected event but does not supply
  missing venue/calendar facts.
- “Use local time instead.” changes the concept to a time bucket, not `session`.

### Correction Wording

- “I meant named exchange session, not a 30-minute clock bucket.”
- “Use final exit as the event, not first entry.”

### Comparison Wording

- “Compare results by entry session” remains Unavailable until accepted facts,
  taxonomy, validated grouping, and Category 14 semantics exist.

### Ranking Wording

- “Rank sessions by result” remains Unavailable and must not rank local-time
  buckets under session labels.

### Negated Wording

- “Show trades outside regular hours” is unavailable without authoritative
  session facts; do not replace it with a fixed local-clock exclusion.

### Exclusion Wording

- “Exclude after-hours trades” remains unavailable without accepted session
  classification; do not infer from broker prose or wall clock.

### Multi-Filter Wording

- “Long AAPL entries in RTH for the selected period” can validate ticker,
  direction, and range independently, but the session filter remains unavailable.

### Multi-Part Question Wording

- “Show entry time and tell me the session.” may return supported `entry_time`
  plus an explicit unavailable `session` result; do not suppress either state.

### Ambiguous Wording

- “Session” may mean exchange hours, account-local bucket, personal routine,
  day-trading session, browser session, or open-position lifecycle.
- `PM` may mean premarket, afternoon, or a ticker/token.

### Negative Examples

These examples must not map to this concept.

- “What time did I enter?” maps to `entry_time`.
- “Group entries into 30-minute intervals” maps to an accepted time bucket.
- “Start a new login session” is not a trading-time metric.

### Context Requirements

Require server-authorized account scope, an explicitly selected entry/final-
exit event, instrument/venue identity, and accepted taxonomy/calendar evidence.
Current context lacks the latter facts. Account IANA local time alone cannot
supply exchange/venue session classification.

### Required Data

- Selected event raw UTC instant and accepted lifecycle role.
- Accepted instrument/venue identity.
- Versioned exchange/venue session taxonomy and authoritative calendar/hours.
- Holiday/exception schedule, effective timezone/DST rules, and coverage.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Requested entry-session versus final-exit-session presentation.
- Compatible currency/basis/fee partition for combined result metrics.

### Valid Filters

- No named-session filter is currently valid because classification facts are
  unavailable.
- Existing non-session filters may narrow a population but cannot make the
  session predicate available.

### Valid Groupings

- No named exchange/venue session grouping is currently accepted.
- Existing `entry_time_bucket`/local time distributions are distinct and must
  not be relabelled as sessions.

### Valid Operators

- None for current session classification beyond returning explicit
  Unavailable with missing-fact reason.
- Future equality/group/compare/rank operators require accepted taxonomy plus
  Category 12/14 validation.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_trade`, `explain_result`,
  `inspect_data_quality`, and `unsupported_request`; all must preserve the
  Unavailable state rather than fabricate a label.

### Incompatible Combinations

- Local-clock fallback, fixed US-equity-hour assumption, browser timezone, or
  broker-text inference.
- Missing event/venue, cross-account scope, or an invented filter/group.
- Session label used as cause, quality, recommendation, or prediction.

### Default Interpretation

Interpret unqualified trading `session` as a named exchange/venue session for
an explicitly selected event, but return Unavailable because the required
taxonomy/calendar facts do not exist. There is no entry-versus-exit default and
no local-bucket fallback.

### Clarification Conditions

Clarify whether the trader means named exchange session versus local time
bucket/personal routine, then entry versus final-exit event. Do not ask a
clarification that suggests the missing venue/calendar facts can be guessed.

### Recommended Clarification Wording

1. “Do you mean a named exchange session or an account-local time bucket?”
2. If named session: “Should the session classify the first entry or final exit?”
3. Then report that named session is unavailable until venue/calendar facts exist.

### Unsupported Conditions

- Current absence of accepted venue identity, versioned session taxonomy,
  exchange calendar/hours, holiday/exception, or DST schedule facts.
- Ambiguous selected event, `needs_decision`, unauthorized scope, or request
  for inferred/local-fallback session.

### Target Analytics Tool or Query Capability

- None currently. A future versioned venue-calendar session classifier and
  validated Journal grouping would be required.
- Current time-bucket services and AI/model knowledge are not substitutes.

### Result Units

- Current result is Unavailable with privacy-safe missing-fact coverage.
- Future result would be a versioned categorical session label, selected event,
  source/calendar version, and sample/coverage counts.

### Fee Handling

- Not applicable. Combined outcome/net metrics would retain fee completeness
  and compatible currency independently.

### Open-Trade Handling

- Currently unavailable for every lifecycle state. In a future contract, entry
  session could classify confirmed `legitimate_open`; final-exit session would
  require `ready_closed`. `needs_decision` remains coverage.

### Sample-Size Considerations

- No current classified samples may be claimed. Empty/unavailable is not a
  zero-count session result.
- Future grouped results must show counts/coverage and cannot imply a best
  session, causation, or advice from small samples.

## `weekday` Language Registry

### Exact Definition

Planned generic weekday classification: convert one explicitly selected
lifecycle event’s raw UTC instant to the server-authorized account IANA
timezone, take its local date, and return Monday through Sunday. Generic
`weekday` has no approved entry-versus-final-exit default. The separately
supported existing primitive is specifically `entry_weekday`.

### Formal Wording

- “account-local weekday for the explicitly selected lifecycle event”
- “event-specific local calendar weekday classification”

### Normal Conversational Wording

- “What weekday was this trade?” requires event clarification.
- “Which day of the week did I exit?” explicitly selects final exit.

### Trader Slang

- “What day was I in?” is ambiguous between weekday, date, and days held.
- “Monday trades” requires Category 13 range language and explicit entry/
  closing event semantics.

### Abbreviations

- `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, and `Sun` are weekday value tokens
  only after the event and date-language owner validate the request.
- Bare `DOW` may mean weekday or Dow Jones; it is not a safe automatic alias.

### Common Misspellings

- `weekeday`
- `day of teh week`

### Noisy or Incomplete Input

- `AAPL Mon?` contains ticker/weekday tokens but lacks entry-versus-final-exit
  event and a validated date/filter interpretation.
- `weekday exits` explicitly suggests final exit but still requires authorized
  scope and the Planned generic contract.

### Singular and Plural Forms

- Singular: “weekday” for one explicitly selected event.
- Plural: “weekdays” may mean multiple values or business days; Category 13
  must resolve range/filter language before metric mapping.

### Full Questions

- “What account-local weekday contained the selected trade’s final exit?”
- “Group eligible trades by generic weekday once I choose entry or final exit.”

### Commands

- “Use final-exit weekday in the account timezone.”
- “Do not default generic weekday to entry weekday.”

### Sentence Fragments

- “closing weekday”
- “entry day of week”

### Follow-Up Wording

- “Use the exit day instead.” changes the event but retains trusted scope.
- “What about Monday?” requires the prior event/population and Category 13
  interpretation to remain trusted.

### Correction Wording

- “I meant final-exit weekday, not the supported entry-weekday grouping.”
- “Use the account timezone, not UTC weekday.”

### Comparison Wording

- “Compare results by final-exit weekday” remains Planned for generic weekday
  and requires validated Category 14 semantics and compatible partitions.

### Ranking Wording

- “Rank closing weekdays by result” remains Planned; do not route silently to
  supported `entry_weekday` or infer a best day/advice.

### Negated Wording

- “Show weekdays without open lifecycles” may select final-exit weekday only
  after the event is explicit.
- “Do not use entry weekday.”

### Exclusion Wording

- “Exclude Monday final exits” requires explicit final-exit event plus later
  validated weekday/date filter; it is not created by this registry.

### Multi-Filter Wording

- “Closed long AAPL trades with final exits on Monday in the selected period”
  preserves ticker/direction/population/range tokens but the generic weekday
  filter remains Planned until validated.

### Multi-Part Question Wording

- “Show entry weekday and final-exit weekday.” returns the supported explicit
  `entry_weekday` primitive separately and Planned generic/final-exit weekday;
  do not merge their states.

### Ambiguous Wording

- “Weekday” may refer to first entry, final exit, every execution, or a date
  filter; no default is safe.
- “Monday trades” may mean opened Monday, closed Monday, or active on Monday.
- `DOW` may mean day of week or a market index.

### Negative Examples

These examples must not map to this concept.

- “What was my entry time?” maps to `entry_time`.
- “Which ISO week was this?” maps to `week`.
- “Trade only on Mondays” is advice/rule language, not a weekday metric result.

### Context Requirements

Require server-authorized scope, an explicitly selected first-entry or final-
exit event, raw UTC event fact, and account IANA timezone. Category 13 owns
relative/named weekday range language. A ticker/weekday token cannot choose an
account, event, or filter.

### Required Data

- Explicit selected event and its accepted raw UTC instant.
- Account IANA timezone and authorized compatible scope.
- Lifecycle state plus open/decision/coverage classification.
- Planned generic event-aware query/group contract, currently absent.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Existing explicit `entry_weekday` primitive when the request selects entry.
- Compatible currency/basis/fee partition for combined outcome/money analysis.

### Valid Filters

- Existing validated `entry_weekday` applies only to explicit entry-weekday
  requests; it is not generic weekday support.
- No generic or closing-weekday filter is created here. Other existing filters
  may narrow a population without resolving weekday.

### Valid Groupings

- Existing `entry_weekday` grouping only when entry is explicit.
- Generic/final-exit weekday grouping remains Planned; this registry does not
  invent it or relabel an entry group.

### Valid Operators

- Future equality/inclusion over explicit weekday values and Category 12/14
  validated compare/rank operations.
- Current generic weekday requests return Planned/unavailable, not an inferred
  operator/result.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality` while preserving
  the Planned generic status.

### Incompatible Combinations

- Silent mapping to `entry_weekday` or a closing-weekday default.
- UTC/browser-local weekday, named exchange session, or relative-date invention.
- Cross-account/incompatible timezone/currency grouping or advice/causation.

### Default Interpretation

No generic event default exists. If the request explicitly says entry weekday,
route to the separately supported `entry_weekday` primitive. If it explicitly
says final-exit weekday, retain the Planned generic capability. Otherwise ask
one event clarification.

### Clarification Conditions

Clarify entry versus final-exit event first. Then, only if needed, clarify
whether a weekday token is a requested value/filter versus an output grouping,
and let Category 13 resolve relative date language.

### Recommended Clarification Wording

1. “Should weekday mean the trade’s first-entry day or final-exit day?”
2. If still needed: “Do you want Monday as a filter or a weekday grouping?”
3. If still needed: “Which selected trade or eligible population should I use?”

### Unsupported Conditions

- Missing event choice, absent generic/final-exit weekday contract, invalid
  account timezone, or unauthorized/incompatible scope.
- `needs_decision` event fact, unvalidated weekday/date filter, named session
  inference, or advice/causal request.

### Target Analytics Tool or Query Capability

- Existing validated `entry_weekday` path only for explicitly selected entry.
- Planned future event-aware weekday classifier/grouping for generic/final-exit
  requests. No AI Chat runtime or silent fallback exists.

### Result Units

- Future categorical Monday-through-Sunday value with selected event, account
  IANA timezone, sample count, and coverage. Explicit `entry_weekday` retains
  its own supported result state.

### Fee Handling

- Not applicable to weekday assignment. Combined net/outcome requests preserve
  fee completeness and compatible currency separately.

### Open-Trade Handling

- Explicit entry weekday can apply to confirmed `legitimate_open`; final-exit
  weekday requires `ready_closed`. `needs_decision` remains visible coverage.

### Sample-Size Considerations

- One selected event yields one local weekday if facts are valid; empty/missing
  event is unavailable, not a zero weekday.
- Future groups show count/coverage and cannot establish a best weekday,
  causation, or advice, especially for small samples.

## `week` Language Registry

### Exact Definition

For each eligible `ready_closed` lifecycle, convert the final-exit raw UTC
instant to the server-authorized account IANA timezone, take the local closing
date, and classify it by ISO week-date: ISO week-year plus ISO week number,
Monday start, with ISO week 1 rules. Convert UTC to local before deriving the
week so the effective IANA/DST offset controls boundary membership.

### Formal Wording

- “final-exit account-local ISO week-year”
- “ISO closing-week classification”

### Normal Conversational Wording

- “Which week did this trade close in?”
- “Show results by closing week.”

### Trader Slang

- “Weekly closes” may map to closing-week grouping, not weekly candle closes.
- “Week of the trade” is ambiguous until closing attribution versus range
  language is clear.

### Abbreviations

- `wk`, `ISO wk`, and a full token such as `2026-W32` are safe with context.
- Bare `W32`, `WOW`, or `1W` is unsafe without ISO year/meaning; `1W` may be a
  chart timeframe.

### Common Misspellings

- `clsoing week`
- `ISO weak year`

### Noisy or Incomplete Input

- `AAPL wk 32?` needs validated ticker, ISO year, scope, and range intent.
- `weekly trades` may request an ISO closing-week grouping or Category 13 date
  range and needs context.

### Singular and Plural Forms

- Singular: “week” means one ISO closing-week key when context is factual.
- Plural: “weeks” means multiple ISO closing-week groups, not rolling seven-day
  windows.

### Full Questions

- “What ISO week-year contains the selected trade’s final exit?”
- “Group eligible closed trades by account-local ISO closing week.”

### Commands

- “Show closing-week totals using ISO week-year.”
- “Keep account timezones partitioned and include week coverage counts.”

### Sentence Fragments

- “ISO closing week”
- “by week, final exits”

### Follow-Up Wording

- “Use the same population by week.” retains trusted filters/scope.
- “What about the previous week?” requires Category 13 to resolve the relative
  range; the metric definition remains ISO closing week.

### Correction Wording

- “I meant ISO closing week, not trailing seven days.”
- “Use final-exit local date, not entry week.”

### Comparison Wording

- “Compare the two selected ISO closing weeks.”
- Each week retains compatible account timezone/currency/basis and its own
  sample/coverage; Category 14 validates comparison.

### Ranking Wording

- “Rank ISO closing weeks by the selected metric.”
- Ranking uses validated metric/tie rules and must not infer a best week to trade.

### Negated Wording

- “Show weekly results without open or decision lifecycles.”
- “Do not use rolling seven-day windows.”

### Exclusion Wording

- “Exclude `2026-W32`” requires validated ISO-week filter/range semantics.
- “Exclude AAPL from closing-week groups” uses validated symbol exclusion.

### Multi-Filter Wording

- “Group eligible closed long AAPL trades by ISO closing week in the selected
  range” combines only validated filters and supported grouping.

### Multi-Part Question Wording

- “Show closing-week counts and net results with coverage.” uses `week` plus
  accepted outcome/fee/currency metrics without changing week membership.

### Ambiguous Wording

- “This week,” “last week,” and “week 32” require Category 13 range/year rules.
- “Weekly close” may mean price candle close rather than trade final exit.
- Calendar year and ISO week-year can differ near New Year.

### Negative Examples

These examples must not map to this concept.

- “Show the last seven days” is a Category 13 rolling range.
- “Which weekday was this?” maps to `weekday`.
- “Use weekly candles” is a candle/market-data request.

### Context Requirements

Require server-authorized compatible account scope, eligible `ready_closed`
population, final-exit raw UTC instants, and account IANA timezone. Category 13
owns relative week/range tokens. Money/outcome grouping also needs compatible
currency/basis/fee state.

### Required Data

- Accepted final-flat raw UTC instant per included lifecycle.
- Account IANA timezone and ISO week-date calculation.
- `ready_closed` state and open/decision/coverage counts.
- Authorized scope and validated query/group contract.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Selected metric(s) to aggregate within each week.
- Compatible currency, P/L basis, and fee-completeness state.

### Valid Filters

- Existing validated Journal filters and closing-date range.
- ISO-week selection only through the validated date/query owner; a bare `W32`
  token does not create a filter.

### Valid Groupings

- Supported existing `closing_week`/ISO closing-week grouping over the same
  reconciled eligible population.
- Group totals must reconcile to the filtered headline population.

### Valid Operators

- ISO week membership, equality/range through validated date semantics, and
  Category 12/14 validated compare/rank operations.
- No rolling-window or calendar-fill operator is inferred.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Entry/UTC/Sunday-start/fiscal week substituted for final-exit local ISO week.
- `legitimate_open`/`needs_decision` assigned a closing week.
- Incompatible account timezone/currency merging, invented range/group/session,
  prediction, causation, or advice.

### Default Interpretation

For a metric/grouping request explicitly asking “by week,” use final-exit
account-local ISO week-year for eligible `ready_closed` lifecycles. Relative
week selection remains Category 13 and must not be guessed.

### Clarification Conditions

Clarify ISO closing-week grouping versus rolling seven-day/relative range,
missing ISO year in a `W32` token, or absent population/metric. Do not re-ask
closing attribution when the request clearly says closing week.

### Recommended Clarification Wording

1. “Do you mean ISO final-exit week or a rolling seven-day period?”
2. If `W32` lacks year: “Which ISO week-year should I use?”
3. If still needed: “Which selected eligible population or metric should be grouped?”

### Unsupported Conditions

- Missing/conflicting final exit, invalid account timezone, `legitimate_open`,
  `needs_decision`, or unauthorized/incompatible scope.
- Unresolved relative range, unvalidated filter, invented non-ISO calendar,
  or advice/causal request.

### Target Analytics Tool or Query Capability

- Read-only fact set, account-local closing-date resolver,
  `JournalAnalyticsService`, validated `journal_analytics_query_v1`, and
  supported `closing_week` grouping/result path.
- AI Chat interpretation/validation/runtime remains unimplemented.

### Result Units

- ISO week key `YYYY-Www`, account IANA timezone, exact included count, selected
  aggregate units, and complete/partial/empty/unavailable coverage.

### Fee Handling

- Week assignment is fee-independent. Net/outcome aggregates retain fee
  completeness and one compatible currency partition.

### Open-Trade Handling

- Only `ready_closed` has a final-exit week. `legitimate_open` and
  `needs_decision` remain visible coverage and are never assigned current week.

### Sample-Size Considerations

- An explicitly selected week can have exact zero only with complete applicable
  coverage; active-week output does not synthesize empty weeks.
- Always show count/coverage. Sparse weekly differences do not establish
  seasonality, causation, a best week, or advice.

## `month` Language Registry

### Exact Definition

For each eligible `ready_closed` lifecycle, convert the final-exit raw UTC
instant to the server-authorized account IANA timezone, take the local closing
date, and return its calendar year/month. UTC-to-local conversion precedes the
month boundary, so the IANA timezone and effective DST offset determine
membership.

### Formal Wording

- “final-exit account-local calendar month”
- “local closing year-month classification”

### Normal Conversational Wording

- “Which month did this trade close in?”
- “Show results by closing month.”

### Trader Slang

- “Monthly closes” maps only to trade closing-month groups, not monthly candles.
- “My August trades” needs Category 13 to resolve year/range and retains final-
  exit attribution only when explicit/trusted.

### Abbreviations

- `mo`, `mth`, and full `YYYY-MM` tokens are safe with calendar context.
- `M`, `1M`, `Aug`, or `08` alone is unsafe: it may be quantity, timeframe,
  relative period, or a month without year.

### Common Misspellings

- `clsoing month`
- `calender mnth`

### Noisy or Incomplete Input

- `AAPL Aug?` needs validated ticker, year/range intent, and authorized scope.
- `monthly trades` may mean closing-month grouping, monthly average, or a
  Category 13 date range.

### Singular and Plural Forms

- Singular: “month” means one local closing year-month when context is factual.
- Plural: “months” means multiple closing-month groups, not equal 30-day windows.

### Full Questions

- “What account-local calendar month contains this trade’s final exit?”
- “Group eligible closed trades by final-exit month.”

### Commands

- “Show closing-month totals with year-month keys.”
- “Convert final exits to account-local dates before month grouping.”

### Sentence Fragments

- “closing month”
- “by month, final exits”

### Follow-Up Wording

- “Use the same population by month.” retains trusted filters/scope.
- “What about August?” requires prior year/range context or Category 13
  clarification; it does not alter the metric definition.

### Correction Wording

- “I meant calendar closing month, not trailing 30 days.”
- “Use final-exit month, not entry month.”

### Comparison Wording

- “Compare the two selected closing months.”
- Each month retains compatible account timezone/currency/basis, count, and
  coverage; Category 14 validates the comparison.

### Ranking Wording

- “Rank closing months by the selected metric.”
- Ranking uses exact metric values and validated ties; it cannot imply a best
  month to trade.

### Negated Wording

- “Monthly results without open or decision lifecycles.”
- “Do not use rolling 30-day periods.”

### Exclusion Wording

- “Exclude `2026-08`” requires validated calendar-month filter/range handling.
- “Exclude AAPL from closing-month groups” uses validated symbol exclusion.

### Multi-Filter Wording

- “Group eligible closed short AAPL trades by closing month in the selected
  range” combines only validated filters and supported grouping.

### Multi-Part Question Wording

- “Show trade count and net result by closing month with coverage.” combines
  `month` with accepted count/outcome/fee/currency metrics without changing
  month membership.

### Ambiguous Wording

- “This month,” “last month,” `Aug`, and `08` require Category 13 range/year
  interpretation.
- “Monthly close” may mean a candle close, statement period, or trade final exit.
- “One month” may mean duration, not calendar bucket.

### Negative Examples

These examples must not map to this concept.

- “Show the last 30 days” is a rolling Category 13 range.
- “How many months did I hold it?” is calendar duration, not closing month.
- “Use monthly candles” is a market-data request.

### Context Requirements

Require authorized compatible account scope, eligible `ready_closed`
population, final-exit raw UTC instants, and account IANA timezone. Category 13
owns relative/named month ranges. Money/outcome grouping also requires
compatible currency/basis/fee state.

### Required Data

- Accepted final-flat raw UTC instant for each included lifecycle.
- Account IANA timezone and exact local calendar-date conversion.
- `ready_closed` state and open/decision/coverage counts.
- Authorized scope and validated closing-month query/group contract.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Selected metric(s) to aggregate in each month.
- Compatible currency, P/L basis, and fee completeness.

### Valid Filters

- Existing validated Journal filters and closing-date range.
- Calendar-month selection only through the validated date/query owner; bare
  `Aug` or `08` does not create a filter.

### Valid Groupings

- Supported existing `closing_month` grouping over the reconciled eligible
  population.
- Group totals must reconcile exactly to the filtered headline population.

### Valid Operators

- Local calendar-month membership, equality/range via validated date semantics,
  and Category 12/14 validated compare/rank operations.
- No rolling-30-day, fiscal, or statement-month operator is inferred.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Entry/UTC/statement/fiscal month substituted for final-exit local month.
- `legitimate_open`/`needs_decision` assigned a closing month.
- Incompatible timezone/currency merging, invented range/group/session,
  prediction, causation, or advice.

### Default Interpretation

For an explicit “by month” metric/group request, use final-exit account-local
calendar `YYYY-MM` for eligible `ready_closed` lifecycles. Relative/named month
selection remains Category 13 and is never guessed.

### Clarification Conditions

Clarify calendar closing-month grouping versus rolling period, missing year for
a named/numeric month token, or absent population/metric. Do not re-ask closing
attribution when “closing month” is explicit.

### Recommended Clarification Wording

1. “Do you mean final-exit calendar month or a rolling 30-day period?”
2. If a month lacks year: “Which calendar year should I use for that month?”
3. If still needed: “Which selected eligible population or metric should be grouped?”

### Unsupported Conditions

- Missing/conflicting final exit, invalid account timezone, `legitimate_open`,
  `needs_decision`, or unauthorized/incompatible scope.
- Unresolved named/relative month, unvalidated filter, invented fiscal calendar,
  or advice/causal request.

### Target Analytics Tool or Query Capability

- Read-only fact set, account-local closing-date resolver,
  `JournalAnalyticsService`, validated `journal_analytics_query_v1`, and
  supported `closing_month` grouping/result path.
- AI Chat interpretation/validation/runtime remains unimplemented.

### Result Units

- Calendar month key `YYYY-MM`, account IANA timezone, exact included count,
  selected aggregate units, and complete/partial/empty/unavailable coverage.

### Fee Handling

- Month assignment is fee-independent. Net/outcome aggregates retain fee
  completeness and one compatible currency partition.

### Open-Trade Handling

- Only `ready_closed` has a final-exit month. `legitimate_open` and
  `needs_decision` remain visible coverage and are never assigned current month.

### Sample-Size Considerations

- An explicitly selected month can have exact zero only with complete applicable
  coverage; active-month output does not synthesize empty months.
- Always show count/coverage. Sparse monthly differences do not establish
  seasonality, causation, a best month, or advice.

## `quarter` Language Registry

### Exact Definition

Planned named closing-calendar capability: for each eligible `ready_closed`
lifecycle, convert its final-exit raw UTC instant to the server-authorized
account IANA timezone, take the local closing date, and map its month to Q1
(January-March), Q2 (April-June), Q3 (July-September), or Q4
(October-December) of that local calendar year. No current named support is
claimed.

### Formal Wording

- "final-exit account-local calendar quarter"
- "closing-date quarter key in the authorized account timezone"

### Normal Conversational Wording

- "Which quarter did this trade close in?"
- "Group my closed trades by quarter."

### Trader Slang

- "Q1 closes" and "Q4 trades" map only when closing-quarter context is clear.
- "Earnings quarter" and "quarterly setup" do not establish this metric.

### Abbreviations

- `Q1` through `Q4` are safe quarter values only with a resolved local year.
- Bare `q`, `qrtr`, or `3mo` is ambiguous and must not create a quarter filter.

### Common Misspellings

- `quater`
- `qaurter`

### Noisy or Incomplete Input

- `AAPL Q2 closes?` requires validated ticker, year/range, and closing-quarter
  intent.
- `q3` requires a year/range and must not be treated as current support.

### Singular and Plural Forms

- Singular: "quarter" means one local closing-quarter key.
- Plural: "quarters" means groups of eligible closed lifecycles, not rolling
  three-month windows.

### Full Questions

- "Which local calendar quarter contains the selected trade's final exit?"
- "Summarize eligible closed trades by closing quarter with coverage."

### Commands

- "Use calendar quarters from the account-local final-exit date."
- "Show planned closing-quarter groups, not fiscal quarters."

### Sentence Fragments

- "closing quarter"
- "final-exit Q2"

### Follow-Up Wording

- "Use the closing quarter." retains trusted scope and explicitly selects the
  final-exit event.
- "Make that Q1 through Q4." changes the proposed presentation, not support.

### Correction Wording

- "I meant the quarter it closed, not the entry quarter."
- "Use calendar quarter, not trailing three months."

### Comparison Wording

- "Compare Q1 and Q2 closing results" requires resolved local year/ranges,
  compatible partitions, identical metric definitions, count, and coverage.
- The grouping remains Planned even when the compared money metric is supported.

### Ranking Wording

- "Rank closing quarters by net result" requires future quarter support plus
  Category 12/14 ranking and deterministic tie rules.
- A rank must not imply a best quarter, seasonality, or advice.

### Negated Wording

- "Quarter groups without open trades" excludes open rows only from completed
  values while retaining their coverage.
- "Do not use fiscal quarters."

### Exclusion Wording

- "Exclude AAPL from quarter groups" uses only validated symbol exclusion.
- "Exclude Q4" requires a resolved local year/range and future validated quarter
  predicate; the token alone is not executable.

### Multi-Filter Wording

- "Eligible closed long AAPL trades by closing quarter in the selected range"
  combines only independently validated filters and the Planned grouping.

### Multi-Part Question Wording

- "Show count and net result by closing quarter with coverage" combines the
  Planned bucket with accepted metrics without changing quarter membership.

### Ambiguous Wording

- "This quarter," "last quarter," and bare `Q2` require Category 13 year/range
  resolution.
- "Quarterly" may mean rolling three months, fiscal reporting, or a frequency.

### Negative Examples

These examples must not map to this concept.

- "Show the last 90 days" is a Category 13 rolling range.
- "Which quarter did I enter?" does not select final-exit quarter.
- "Show earnings quarter" requires unavailable external event facts.

### Context Requirements

Require authorized compatible account scope, eligible `ready_closed` population,
final-exit raw UTC instants, and account IANA timezone. Category 13 owns named
and relative quarter ranges. Ticker or quarter tokens cannot authorize scope.

### Required Data

- Accepted final-flat raw UTC instant for each included lifecycle.
- Account IANA timezone and exact local calendar-date conversion.
- `ready_closed` state, coverage, and future named quarter query/group contract.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Selected metrics plus compatible currency, basis, and fee-completeness state.

### Valid Filters

- Existing validated Journal filters and closing-date range.
- Quarter selection only through a future validated date/query contract; bare
  `Q2` does not create a current filter.

### Valid Groupings

- No named closing-quarter grouping is currently accepted.
- A future grouping must use the final-exit account-local calendar date and
  reconcile exactly to the same eligible population.

### Valid Operators

- Future calendar-quarter membership and Category 12/14 validated comparisons.
- No rolling-90-day, fiscal, or current executable operator is inferred.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`; each retains Planned status.

### Incompatible Combinations

- Entry quarter, UTC/browser-local quarter, rolling three months, fiscal/tax
  quarter, or earnings quarter substituted for closing calendar quarter.
- Open/decision rows assigned a current quarter, incompatible partitions,
  invented filters/runtime support, causation, or advice.

### Default Interpretation

Interpret explicit "closing quarter" as the final-exit account-local calendar
quarter. Return Planned/unavailable until the named contract exists. Do not
silently claim support or turn an unqualified relative quarter into a range.

### Clarification Conditions

Clarify event if entry versus closing is unresolved, then clarify only one
missing year/range or fiscal-versus-calendar field. Do not re-ask trusted scope.

### Recommended Clarification Wording

1. "Do you mean the entry quarter or the final-exit quarter?"
2. If still needed: "Which local calendar year or date range should I use?"
3. If still needed: "Do you mean calendar quarter rather than fiscal quarter?"

### Unsupported Conditions

- Current absence of an accepted named closing-quarter query/group contract.
- Missing/conflicting final exit or timezone, non-ready lifecycle, unresolved
  date language, or unauthorized/incompatible scope.
- Request for inferred fiscal/session facts, prediction, causation, or advice.

### Target Analytics Tool or Query Capability

- Planned future closing-calendar quarter derivation over the read-only Journal
  fact set and validated query/result contract.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future `YYYY-Q1` through `YYYY-Q4` key, account IANA timezone, exact included
  count, and complete/partial/unavailable coverage.

### Fee Handling

- Not applicable to quarter assignment. Combined net/outcome results retain
  compatible currency, selected basis, and fee-completeness coverage.

### Open-Trade Handling

- Only `ready_closed` has a final-exit quarter. `legitimate_open` and
  `needs_decision` remain visible coverage and are never assigned current Q.

### Sample-Size Considerations

- An explicitly resolved quarter can have exact zero only with complete
  applicable coverage; grouped active-quarter output does not synthesize gaps.
- Show counts/coverage. Sparse differences do not prove seasonality or advice.

## `year` Language Registry

### Exact Definition

For each eligible `ready_closed` lifecycle, convert its final-exit raw UTC
instant to the server-authorized account IANA timezone and return the four-digit
calendar year of the resulting local closing date. Conversion with the offset
and DST rules effective at that instant occurs before year membership is set.

### Formal Wording

- "final-exit account-local calendar year"
- "local closing-year classification"

### Normal Conversational Wording

- "Which year did this trade close?"
- "Group my closed trades by year."

### Trader Slang

- "2025 closes" maps only to closing-year context.
- "YTD trades" is a date-range request, not the year grouping itself.

### Abbreviations

- A four-digit `YYYY` token is safe only after its date/filter role is resolved.
- `yr`, `CY`, `FY`, and `YTD` are ambiguous; fiscal and year-to-date meanings
  must not be silently mapped.

### Common Misspellings

- `yaer`
- `calender year`

### Noisy or Incomplete Input

- `AAPL 2025 closes` requires validated ticker plus closing-year intent.
- `last yr` requires Category 13 to resolve the authorized local range.

### Singular and Plural Forms

- Singular: "year" means one local closing calendar year.
- Plural: "years" means closing-year groups, not trailing 12-month windows.

### Full Questions

- "What local calendar year contains this lifecycle's final exit?"
- "Show eligible closed-trade counts by closing year with coverage."

### Commands

- "Group by account-local final-exit year."
- "Use calendar year, not entry year or UTC year."

### Sentence Fragments

- "closing year"
- "2025 final exits"

### Follow-Up Wording

- "Use the close year." retains trusted scope and selects final exit.
- "Now show 2024." adds a year selection only through validated date semantics.

### Correction Wording

- "I meant the year it fully closed, not the entry year."
- "Use calendar year, not trailing twelve months."

### Comparison Wording

- "Compare closing results for 2024 and 2025" requires identical definitions,
  compatible partitions, exact counts, and coverage.
- Category 14 owns comparison framing; local year membership remains unchanged.

### Ranking Wording

- "Rank closing years by net result" requires Category 12/14 validation and
  deterministic ties over accepted values.
- Ranking does not establish a best future year or causal seasonal effect.

### Negated Wording

- "Year groups without open trades" retains open/decision coverage.
- "Do not use UTC year."

### Exclusion Wording

- "Exclude 2024" requires a validated account-local date/year predicate.
- "Exclude AAPL" uses only validated symbol exclusion and never changes year
  conversion.

### Multi-Filter Wording

- "Eligible closed long AAPL trades by closing year in the selected range" uses
  only independently validated filters and supported grouping.

### Multi-Part Question Wording

- "Show count and net result by closing year with coverage" combines supported
  year membership with accepted metrics and compatible money partitions.

### Ambiguous Wording

- "This year," "last year," and "YTD" require Category 13 range semantics.
- "Tax year" and "fiscal year" are not local calendar year.

### Negative Examples

These examples must not map to this concept.

- "Show trailing 12 months" is a rolling Category 13 range.
- "What year did I enter?" does not select final-exit year.
- "Use yearly candles" is a market-data request.

### Context Requirements

Require server-authorized compatible account scope, eligible `ready_closed`
population, final-exit raw UTC instants, and account IANA timezone. Category 13
owns relative/year range language; ticker/year tokens cannot authorize scope.

### Required Data

- Accepted final-flat raw UTC instant per included lifecycle.
- Account IANA timezone and exact local calendar-date/year conversion.
- `ready_closed` state, authorized scope, and coverage counts.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Selected metrics plus compatible currency, basis, and fee completeness.

### Valid Filters

- Existing validated Journal filters and account-local closing-date range.
- A year token becomes a filter only through validated Category 13/query rules.

### Valid Groupings

- Supported existing `closing_year` grouping over the reconciled eligible
  population.
- Group totals must reconcile exactly to the filtered headline population.

### Valid Operators

- Local calendar-year membership/equality/range through validated date rules,
  plus Category 12/14 validated compare/rank operations.
- No fiscal, tax, YTD, or rolling-window operator is inferred.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`.

### Incompatible Combinations

- Entry year, UTC/browser-local year, fiscal/tax year, YTD, or trailing 12 months
  substituted for final-exit local calendar year.
- Open/decision closing year, incompatible partitions, invented filters/session,
  prediction, causation, or advice.

### Default Interpretation

Interpret explicit "closing year" as the calendar year of final exit in the
authorized account IANA timezone. Relative or bare-year range selection remains
Category 13 and is never guessed.

### Clarification Conditions

Clarify event if entry versus closing is unresolved, then only one missing
calendar-versus-fiscal or relative-range field. Preserve trusted scope.

### Recommended Clarification Wording

1. "Do you mean the entry year or the final-exit year?"
2. If still needed: "Do you mean local calendar year or a fiscal/tax year?"
3. If still needed: "Which year or date range should I use?"

### Unsupported Conditions

- Missing/conflicting final exit or account timezone, non-ready lifecycle,
  unresolved date role, or unauthorized/incompatible scope.
- Request for fiscal/session/external facts, invented calendar fill, prediction,
  causation, or advice.

### Target Analytics Tool or Query Capability

- Supported deterministic `closing_year` derivation/grouping through the
  read-only Journal analytics query/result contract.
- This registry does not claim an AI Chat route or write capability.

### Result Units

- Four-digit local calendar year, account IANA timezone, exact included count,
  and complete/partial/unavailable coverage.

### Fee Handling

- Not applicable to year assignment. Combined net/outcome values retain selected
  basis, compatible currency, and fee-completeness coverage.

### Open-Trade Handling

- Only `ready_closed` has a final-exit year. `legitimate_open` and
  `needs_decision` remain visible coverage and are never assigned current year.

### Sample-Size Considerations

- An explicitly requested year can have exact zero only with complete applicable
  coverage; active-year grouping does not synthesize empty years.
- Always show count/coverage; sparse year differences do not establish cause.

## `days_held` Language Registry

### Exact Definition

Planned exact non-negative integer for one eligible `ready_closed` lifecycle:
convert the first-entry and final-exit raw UTC instants separately to the
server-authorized account IANA timezone, take their local calendar dates, and
count the date boundaries crossed from entry date to final-exit date. Same local
date is 0; next local date is 1. It is never elapsed seconds divided by 86,400.

### Formal Wording

- "account-local calendar-date boundaries crossed while held"
- "local entry-date to final-exit-date difference"

### Normal Conversational Wording

- "How many calendar days did I hold this trade?"
- "Did this close on the same local day?"

### Trader Slang

- "Overnights held" is only an informal cue; it must not imply market sessions.
- "Same-day hold" maps to zero boundaries only with complete endpoints.

### Abbreviations

- `days held` and explicit `calendar days held` are safe.
- Bare `d`, `DTE`, `1D`, or `24h` is ambiguous and must not select this metric.

### Common Misspellings

- `days heald`
- `dayz held`

### Noisy or Incomplete Input

- `AAPL held 2d?` requires validated ticker/lifecycle and clarification whether
  `2d` is a claimed calendar-boundary value or elapsed 48 hours.
- `overnight?` must not infer an exchange session or complete endpoints.

### Singular and Plural Forms

- Singular: "day held" may express a value of one boundary.
- Plural: "days held" is one integer per eligible closed lifecycle, not dates
  touched or a day-series count.

### Full Questions

- "How many account-local date boundaries did the selected trade cross?"
- "Show planned days-held values for eligible ready-closed trades."

### Commands

- "Calculate local date boundaries from first entry to final exit."
- "Do not divide elapsed seconds by 86,400."

### Sentence Fragments

- "calendar days held"
- "same-day versus overnight"

### Follow-Up Wording

- "Use calendar days, not hours." changes the metric from elapsed duration.
- "Use the account timezone." retains the server-authorized timezone; it does
  not accept a browser-supplied override.

### Correction Wording

- "I meant date boundaries crossed, not 24-hour periods."
- "Use final exit, not the first partial exit."

### Comparison Wording

- "Compare days held for the two selected groups" remains Planned and requires
  the identical account-local formula, compatible partitions, counts, coverage.

### Ranking Wording

- "Rank trades by days held" requires the future named metric plus Category
  12/14 rules; exact integer values control ties with stable tie handling.
- Ranking does not imply patience, discipline, quality, or advice.

### Negated Wording

- "Days held without same-day trades" means exclude exact zero values only after
  the metric and validated predicate exist.
- "Do not include open positions" retains open coverage rather than hiding it.

### Exclusion Wording

- "Exclude AAPL" uses only validated symbol exclusion.
- "Exclude zero-day holds" requires the future metric predicate and complete
  endpoint coverage; missing values are not zero.

### Multi-Filter Wording

- "Days held for eligible closed long AAPL trades in the selected range" uses
  only validated filters and preserves compatible account/timezone partition.

### Multi-Part Question Wording

- "Show days held and elapsed hold duration" returns two distinct metrics with
  the same endpoints; neither may be substituted for the other.

### Ambiguous Wording

- "Held two days" may mean two date boundaries, 48 elapsed hours, two sessions,
  or two inclusive dates touched.
- `1D` can be a candle timeframe rather than a duration.

### Negative Examples

These examples must not map to this concept.

- "How many exact hours did I hold?" maps to `hold_duration`.
- "How old is my open position?" requires a separate as-of age metric.
- "How many sessions was it open?" requires unavailable session facts.

### Context Requirements

Require authorized account scope, one trusted lifecycle or validated population,
accepted first-entry/final-exit raw UTC instants, `ready_closed` state, and the
account IANA timezone. Date/ticker tokens cannot provide missing endpoints.

### Required Data

- Accepted first position-opening and final-flat raw UTC instants.
- Account IANA timezone with effective historical offset/DST rules.
- `ready_closed` state, future named metric contract, and coverage.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Compatible currency/basis/fee partition for combined outcome analysis.

### Valid Filters

- Selected lifecycle and existing validated Journal filters.
- A days-held comparison/exclusion becomes valid only under the future named
  metric/query contract; no duration token creates it now.

### Valid Groupings

- No named `days_held` grouping is currently accepted.
- Future exact-integer buckets require explicit validation and must not be
  relabelled elapsed-duration or session buckets.

### Valid Operators

- Future exact local-date subtraction, equality/range, and Category 12/14
  validated comparison/ranking.
- No `/ 86400`, inclusive-day, business-day, or as-of operator is inferred.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality`; Planned remains.

### Incompatible Combinations

- Elapsed seconds/86,400, inclusive dates touched, business/exchange sessions,
  current-open age, first partial exit, or browser-local dates.
- Missing endpoints coerced to zero, incompatible partitions, invented runtime,
  causation, quality judgment, or advice.

### Default Interpretation

Interpret explicit "days held" as account-local calendar-date boundaries from
first entry through final exit for `ready_closed`, not fixed 24-hour units.
Return Planned/unavailable until the named metric contract exists.

### Clarification Conditions

Clarify calendar boundaries versus elapsed 24-hour periods first, then only one
missing lifecycle/population field. Do not ask for already trusted scope.

### Recommended Clarification Wording

1. "Do you mean local calendar-date boundaries or exact elapsed time?"
2. If still needed: "Which selected trade or eligible population should I use?"
3. If still needed: "Should I use the final exit rather than the first partial?"

### Unsupported Conditions

- Current absence of an accepted named `days_held` query/metric contract.
- Open or decision lifecycle, missing/reversed endpoints, missing timezone, or
  unauthorized/incompatible scope.
- Request for inferred sessions, as-of open age, causation, quality, or advice.

### Target Analytics Tool or Query Capability

- Planned future local-date-boundary metric over accepted lifecycle endpoints
  and the read-only Journal query/result contract.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future exact non-negative integer local date-boundaries crossed, account IANA
  timezone, included count, and complete/partial/unavailable coverage.

### Fee Handling

- Not applicable. Combined outcome/money populations retain selected basis,
  compatible currency, and fee-completeness coverage separately.

### Open-Trade Handling

- Completed `days_held` requires `ready_closed`. `legitimate_open` needs a
  separate as-of age metric; `needs_decision` and missing endpoints are coverage.

### Sample-Size Considerations

- Exact zero is valid only for a complete same-local-date lifecycle; missing or
  unresolved endpoints never become zero. DST-short/long nights still cross dates.
- Show count/coverage; samples do not establish an ideal holding period.

## `trades_per_day` Language Registry

### Exact Definition

Planned named presentation: for each explicitly declared account-local closing
trading date in one compatible server-authorized account/timezone/currency
scope, count every eligible current `ready_closed` round-trip lifecycle exactly
once by the local date of its final-exit raw UTC instant. It is a per-date count,
not executions, open/decision rows, or an average over calendar days. The IANA
offset/DST rules effective at final exit are applied before date assignment.

### Formal Wording

- "eligible ready-closed round-trip count per declared local closing date"
- "account-local closing-date lifecycle frequency"

### Normal Conversational Wording

- "How many trades closed each day?"
- "Show my completed trades per closing day."

### Trader Slang

- "Trades a day" maps only after per-date series versus average is resolved.
- "Number of plays today" does not establish a lifecycle count or closing date.

### Abbreviations

- `TPD` is safe only in explicit analytics context with the per-day meaning.
- `tr/day`, `avg/day`, `fills/day`, and bare `daily` are ambiguous.

### Common Misspellings

- `trades per dey`
- `trads/day`

### Noisy or Incomplete Input

- `AAPL TPD Aug?` requires validated ticker and Category 13 range/year handling.
- `5 trades/day?` may be a claimed daily value, threshold, or desired behavior;
  it must not become a filter or recommendation.

### Singular and Plural Forms

- Singular: "trade per day" can describe an exact count of one for a date.
- Plural: "trades per day" means one round-trip count per declared closing date,
  not one count per execution or symbol.

### Full Questions

- "How many eligible ready-closed round trips closed on each declared local date?"
- "Show the planned trades-per-day series with coverage."

### Commands

- "Count completed round trips once per final-exit local date."
- "Do not count executions or average across calendar days."

### Sentence Fragments

- "closed trades per day"
- "daily round-trip count"

### Follow-Up Wording

- "Use closing day." explicitly retains final-exit date assignment.
- "Show the average instead" changes to a separately defined aggregation and
  must not silently alter this per-date series.

### Correction Wording

- "I meant round trips, not fills."
- "Show each closing date, not an average per calendar day."

### Comparison Wording

- "Compare trades per day for two selected periods" requires identical declared
  date series/denominator semantics, compatible partitions, counts, and coverage.
- It remains Planned even if the underlying count and closing-date primitives exist.

### Ranking Wording

- "Rank closing dates by trade count" requires the future named presentation
  plus Category 12/14 tie/order rules over exact integer counts.
- Ranking cannot label high-count dates as overtrading or recommend a limit.

### Negated Wording

- "Daily counts without open positions" retains open/decision coverage and
  excludes them only from completed counts.
- "Do not count partial exits."

### Exclusion Wording

- "Exclude AAPL" uses only validated symbol exclusion.
- "Exclude zero-trade days" depends on the declared date-series contract; an
  active-day-only series never synthesizes those calendar dates.

### Multi-Filter Wording

- "Ready-closed long AAPL round trips per local closing date in August" combines
  only validated filters, a Category 13 range, and the Planned presentation.

### Multi-Part Question Wording

- "Show trades per day and net result per day with coverage" uses the same
  declared closing-date groups but keeps count, money, fees, and currency distinct.

### Ambiguous Wording

- "Trades per day" may mean per-date series, average across active trading days,
  average across calendar days, entries, executions, or a personal rule.
- "Today" requires Category 13 and the authorized account timezone.

### Negative Examples

These examples must not map to this concept.

- "How many fills did I place each day?" is Category 8 execution count.
- "What is my average trades per calendar day?" requires a separate denominator.
- "Should I take fewer trades?" is advice, not a factual count.

### Context Requirements

Require authorized compatible account/timezone/currency scope, an explicitly
declared closing-date/range contract, eligible current `ready_closed` population,
and exact final-exit UTC instants. Ticker/date tokens cannot authorize scope.

### Required Data

- Accepted current lifecycle state and one stable round-trip identity per lifecycle.
- Final-flat raw UTC instant and account IANA timezone for local date assignment.
- Declared closing dates/range, validated population, coverage, and future named
  daily-count presentation contract.

### Optional Data

- Validated symbol/direction/source/outcome/range filters.
- Metrics grouped beside count with compatible currency, basis, fee state.

### Valid Filters

- Existing validated Journal filters plus Category 13-resolved closing-date range.
- A count threshold is not a filter until the future presentation/query contract
  validates it; date selection does not invent empty days.

### Valid Groupings

- Existing closing-date grouping and exact ready-closed round-trip count are
  primitives; the named `trades_per_day` presentation remains Planned.
- No execution, entry, symbol, or calendar-filled grouping is substituted.

### Valid Operators

- Future exact integer count per declared date and Category 12/14 validated
  equality/comparison/ranking.
- No calendar-day average, active-day average, or synthetic fill operator.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, and `inspect_data_quality`; named presentation stays Planned.

### Incompatible Combinations

- Execution/order/entry/exit count, symbols traded, average per calendar or active
  day, open/decision count, or unvalidated calendar filling.
- Cross-account/timezone/currency aggregation, behavior diagnosis, causal claim,
  limit recommendation, or invented runtime/filter.

### Default Interpretation

Interpret explicit "trades per day" as a per-declared-closing-date count of
eligible `ready_closed` round trips, not an average. Return Planned/unavailable
until the named presentation contract exists.

### Clarification Conditions

Clarify per-date series versus average first; if average is requested, clarify
active trading days versus calendar days as a separate metric. Otherwise ask
only one missing closing date/range field and preserve trusted scope.

### Recommended Clarification Wording

1. "Do you want a count for each closing date or an average across days?"
2. If average: "Should the denominator be active trading days or calendar days?"
3. Otherwise: "Which account-local closing date or date range should I use?"

### Unsupported Conditions

- Current absence of the accepted named `trades_per_day` presentation contract.
- Missing closing-date range/timezone, incomplete scope, decision state, or
  unauthorized/incompatible partition.
- Request for execution count, invented zero days, behavior judgment, or advice.

### Target Analytics Tool or Query Capability

- Planned named per-closing-date round-trip-count presentation over existing
  read-only closing-date and eligible-lifecycle primitives.
- No AI Chat handler or new runtime aggregation is claimed.

### Result Units

- Future exact non-negative integer eligible round trips per declared local
  closing date, plus included/limited/unavailable counts and timezone.

### Fee Handling

- Count assignment does not require fees. Money/outcome values beside it retain
  selected basis, compatible currency, and fee-completeness coverage.

### Open-Trade Handling

- `legitimate_open` and `needs_decision` are never counted as completed closing-
  day round trips. Both remain visible coverage and do not suppress ready rows.

### Sample-Size Considerations

- An explicitly declared date can have exact zero only with complete applicable
  coverage; an active-day series does not insert no-trade calendar dates.
- Show exact counts and coverage; high/low counts do not prove overtrading.

## `time_between_trades` Language Registry

### Exact Definition

Planned interval for a selected current lifecycle in one declared compatible
server-authorized scope. Build every current in-scope lifecycle candidate and
order them by first-entry raw UTC instant, then stable round-trip ID. Select the
exact immediate predecessor before eligibility, state, date, or result filtering.
Require that predecessor to be `ready_closed`, then compute current first-entry
UTC minus that predecessor's final-exit UTC in exact elapsed seconds. A non-ready
predecessor is a visible barrier; a zero/negative gap is overlap coverage and
unavailable, never skipped or clamped.

### Formal Wording

- "exact predecessor final-exit UTC to current first-entry UTC interval"
- "first-entry-ordered immediate-lifecycle gap"

### Normal Conversational Wording

- "How long was it between this trade and the one right before it?"
- "Show the gap after the immediately previous lifecycle."

### Trader Slang

- "Time between setups" maps only when "setups" means accepted lifecycles.
- "Cooldown between trades" is not inferred intentional waiting or a rule.

### Abbreviations

- `TBT` is safe only in explicit lifecycle-interval context.
- `gap`, `btw`, `prev`, `5m`, and ticker-like tokens are ambiguous alone.

### Common Misspellings

- `time beetween trades`
- `time betwen trads`

### Noisy or Incomplete Input

- `AAPL gap from prev?` requires validated current lifecycle; AAPL does not
  restrict the predecessor search after ordering.
- `gap 5m?` may be a claimed value, threshold, display unit, or candle gap.

### Singular and Plural Forms

- Singular: "time between trades" is one qualified predecessor/current pair.
- Plural: "times between trades" means one candidate interval per selected
  current lifecycle; it is not every execution-to-execution gap.

### Full Questions

- "What exact positive interval separates this lifecycle from its immediate
  first-entry-ordered predecessor?"
- "Show planned between-trade intervals with predecessor-barrier coverage."

### Commands

- "Order all authorized candidates by first entry and stable ID before filtering."
- "Use the exact predecessor's final exit; do not skip barriers or clamp overlaps."

### Sentence Fragments

- "gap from previous trade"
- "between-lifecycle seconds"

### Follow-Up Wording

- "Use the one immediately before it." retains the first-entry-ordered exact
  predecessor, not the prior filtered/closed result.
- "Show minutes." changes display only; raw UTC seconds remain exact.

### Correction Wording

- "I meant final exit to next first entry, not entry to entry."
- "Do not skip the open predecessor or reorder by close time."

### Comparison Wording

- "Compare between-trade gaps for two selected groups" applies groups to current
  result rows only after predecessor selection and requires compatible scope,
  identical formula, count, and barrier coverage.

### Ranking Wording

- "Rank trades by time since the predecessor" remains Planned and requires
  Category 12/14 rules; exact positive seconds control value ties.
- Unavailable barrier/overlap rows are not assigned zero for ranking.

### Negated Wording

- "Gaps without overlaps" excludes unavailable overlap rows from values but
  reports them as coverage; it does not search farther back.
- "Do not include open predecessors" cannot skip them; they remain barriers.

### Exclusion Wording

- "Exclude AAPL current trades" may filter selected current result rows only;
  it must not remove AAPL candidates before predecessor selection.
- Excluding a predecessor state/outcome never authorizes predecessor skipping.

### Multi-Filter Wording

- "Between-trade gaps for selected long AAPL current rows in August" validates
  filters on current results after predecessor selection; the candidate order
  still includes all authorized in-scope lifecycle states and dates.

### Multi-Part Question Wording

- "Show gap, predecessor state, and current entry time" returns this Planned
  interval plus privacy-safe coverage/endpoints without exposing stable IDs.

### Ambiguous Wording

- "Previous trade" may mean prior row, close, eligible result, same ticker, or
  exact first-entry-ordered lifecycle candidate.
- "Gap" may mean price gap, entry spacing, hold duration, or elapsed interval.

### Negative Examples

These examples must not map to this concept.

- "How far apart were my fills?" is Category 8 execution spacing.
- "How long did the prior trade last?" maps to `hold_duration`.
- "Did I wait long enough?" asks for judgment/advice, not this factual metric.

### Context Requirements

Require one compatible server-authorized account/timezone/currency scope and a
trusted selected current lifecycle/result population. Candidate ordering must
use all current lifecycle candidates in that scope before state/date/result
filters; raw UTC and stable IDs are internal facts, never user authorization.

### Required Data

- First-entry raw UTC instant and stable round-trip ID for every in-scope current
  lifecycle candidate.
- Exact immediate predecessor state and, if `ready_closed`, final-exit raw UTC.
- Current lifecycle first-entry raw UTC, authorization/partition, and coverage.
- A future accepted named interval query/result contract.

### Optional Data

- Current-result-only validated symbol/direction/source/outcome/date filters.
- UTC/account-IANA endpoint display and seconds/minutes/hours formatting.
- Compatible money/outcome basis and fee state for combined analysis.

### Valid Filters

- Validated filters may select current result rows only after the complete
  first-entry order and exact predecessor are fixed.
- No filter may remove a candidate, require a ready predecessor, or search for a
  same-ticker/prior-date/prior-result trade before predecessor selection.

### Valid Groupings

- No named between-trade grouping is currently accepted.
- Future grouping may organize qualified current-result intervals after exact
  predecessor selection; unavailable barriers/overlaps retain coverage.

### Valid Operators

- Future total order by first-entry UTC then stable ID, exact predecessor select,
  raw UTC subtraction, positive-gap test, and validated compare/rank operators.
- Close-time order, local-time order, eligible-first search, clamping, or skip-
  backward operators are invalid.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_sequence`, `explain_result`, and `inspect_data_quality`; Planned remains.

### Incompatible Combinations

- Pre-filtering candidates by readiness, date, ticker, direction, source, outcome,
  or result inclusion; close-time/database/import ordering; farther-back search.
- Non-ready predecessor skipped, nonpositive gap clamped to zero, cross-account/
  timezone/currency mixing, intentional-wait claim, causation, or advice.

### Default Interpretation

Interpret "time between trades" as the positive raw-UTC gap from the exact
first-entry-ordered predecessor's final exit to the selected current lifecycle's
first entry. Return Planned/unavailable when the named contract or eligibility
is absent; never choose a previous eligible result instead.

### Clarification Conditions

Clarify current lifecycle/population versus execution spacing first, then only
one missing compatible scope field. Do not offer to skip a barrier, choose a
same-ticker predecessor, or reinterpret a negative gap.

### Recommended Clarification Wording

1. "Do you mean the lifecycle gap from the immediately previous trade's final exit?"
2. If still needed: "Which current trade or result population should I use?"
3. If still needed: "Which compatible authorized account scope should I use?"

### Unsupported Conditions

- Current absence of an accepted named between-trade interval contract.
- No predecessor, missing first-entry/final-exit/order fact, non-ready exact
  predecessor, current `needs_decision`, or unauthorized/incompatible scope.
- Zero/negative overlap gap, request to clamp/skip/search farther back, inferred
  intent/discipline, causation, or advice.

### Target Analytics Tool or Query Capability

- Planned future deterministic ordered-lifecycle interval over the current
  read-only Journal fact set with explicit barrier/overlap coverage.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future exact positive elapsed seconds plus privacy-safe predecessor/current
  coverage and optional UTC/account-IANA endpoint displays with effective DST.

### Fee Handling

- Not applicable to the interval. Combined outcome/money queries retain selected
  basis, compatible currency, and fee-completeness state separately.

### Open-Trade Handling

- A current `legitimate_open` may qualify in a future contract because its first
  entry exists if its exact predecessor is ready closed and gap positive.
- A predecessor `legitimate_open`, `needs_decision`, or other non-ready state is
  a visible barrier and never skipped; current `needs_decision` is coverage.

### Sample-Size Considerations

- The first candidate has no predecessor and is unavailable, not zero. A zero or
  negative gap is overlap coverage, never a sample value or clamped result.
- Show qualified count and every barrier/missing/overlap coverage class; gaps do
  not establish intentional waiting, discipline, causation, or advice.

## `time_after_previous_loss` Language Registry

### Exact Definition

Planned interval for a selected current lifecycle in one compatible authorized
account/timezone/currency scope. Order every current in-scope lifecycle candidate
by first-entry raw UTC instant, then stable round-trip ID, and select the exact
immediate predecessor before eligibility, state, date, or result filtering. That
same predecessor must be `ready_closed` and a loss on the declared Category 2/3
gross or net basis. Then compute current first-entry UTC minus predecessor final-
exit UTC in exact seconds. Non-ready, flat, or non-classifiable predecessors are
visible barriers; a nonpositive gap is overlap coverage, unavailable and unclamped.

### Formal Wording

- "positive final-exit-to-first-entry interval after the exact selected-basis loss"
- "immediate first-entry-ordered predecessor loss gap"

### Normal Conversational Wording

- "How long after the previous losing trade did I enter this one?"
- "Show the gap after the trade immediately before it, if that trade was a loss."

### Trader Slang

- "Time after an L" maps only to the exact predecessor on a declared outcome basis.
- "Revenge-trade gap" must not infer motive, behavior, or causation.

### Abbreviations

- `TAPL` is safe only in explicit outcome-interval context.
- Bare `L`, `prev loss`, `red`, `5m`, or a ticker token is ambiguous alone.

### Common Misspellings

- `time after prevous loss`
- `time aftr last lose`

### Noisy or Incomplete Input

- `AAPL 5m after L?` requires a selected current lifecycle, outcome basis, and
  clarification whether `5m` is a claimed value, threshold, or display unit.
- `after last red trade` cannot use display color to establish a factual loss.

### Singular and Plural Forms

- Singular: "time after the previous loss" is one qualified predecessor/current pair.
- Plural: "times after previous losses" means one interval per selected current
  lifecycle whose exact predecessor qualifies, not gaps after any earlier loss.

### Full Questions

- "What exact positive interval followed the immediate predecessor when it was
  a loss on the selected basis?"
- "Show planned after-loss intervals with barrier and fee coverage."

### Commands

- "Select the immediate predecessor before filtering and require that same trade
  to be a selected-basis loss."
- "Do not skip flat, open, unresolved, or overlapping predecessors."

### Sentence Fragments

- "gap after previous loss"
- "seconds since exact losing predecessor"

### Follow-Up Wording

- "Use net loss." changes the basis only if fee-complete compatible net evidence
  exists; it does not substitute gross or reselect the predecessor.
- "Show minutes." changes display only; raw UTC seconds remain exact.

### Correction Wording

- "I meant the immediately previous lifecycle, not any earlier loss."
- "Classify that same predecessor on net basis; do not skip it if fees are incomplete."

### Comparison Wording

- "Compare after-loss gaps for two selected current groups" applies result filters
  after predecessor selection and requires identical basis/formula, compatible
  partitions, qualified counts, and barrier coverage.

### Ranking Wording

- "Rank current trades by time after the previous loss" remains Planned and
  requires Category 12/14 rules; exact positive seconds control value ties.
- Barriers and overlaps stay unavailable, not zero-ranked values.

### Negated Wording

- "After-loss gaps without overlaps" removes overlap rows only from computed
  values while reporting coverage; it never searches farther back.
- "Do not include flat predecessors" cannot skip them; flat remains a barrier.

### Exclusion Wording

- "Exclude AAPL current trades" may filter selected current result rows only
  after the predecessor is fixed; it cannot remove candidates from the order.
- Excluding open, flat, or fee-incomplete predecessors never permits backtracking.

### Multi-Filter Wording

- "Net after-loss gaps for selected long AAPL current trades in August" validates
  filters on current results after all-candidate predecessor selection and needs
  compatible currency plus fee-complete net classification.

### Multi-Part Question Wording

- "Show gap, predecessor net result, and coverage" combines the Planned interval
  with the accepted selected-basis outcome without exposing private identifiers.

### Ambiguous Wording

- "Previous loss" may mean immediate predecessor, any earlier loss, losing day,
  same-ticker loss, largest loss, or loss streak.
- "Loss" may mean gross or net; color and signless display do not choose the basis.

### Negative Examples

These examples must not map to this concept.

- "How long after any loss did I trade again?" asks for a different sequence search.
- "Did I revenge trade?" asks for unsupported behavior/causation interpretation.
- "How long did the losing trade last?" maps to `hold_duration`.

### Context Requirements

Require one compatible server-authorized account/timezone/currency scope, a
trusted selected current lifecycle/result population, and a declared Category
2/3 gross or net outcome basis. Candidate ordering precedes all state/date/result
filters. Raw UTC and stable IDs are internal facts, never user authorization.

### Required Data

- First-entry raw UTC and stable round-trip ID for every current in-scope candidate.
- Exact immediate predecessor state, final-exit UTC, selected-basis realized P/L,
  currency, and fee completeness when net is selected.
- Current first-entry raw UTC, authorization/partition, and coverage.
- A future accepted named after-loss interval query/result contract.

### Optional Data

- Current-result-only validated symbol/direction/source/outcome/date filters.
- UTC/account-IANA endpoint display and seconds/minutes/hours formatting.
- Compatible gross or fee-complete net money details for presentation.

### Valid Filters

- Validated filters may select current result rows only after the complete
  first-entry order and exact predecessor are fixed.
- No loss/readiness/date/ticker/outcome filter may prune predecessor candidates
  or search for the nearest earlier loss.

### Valid Groupings

- No named after-loss interval grouping is currently accepted.
- Future grouping may organize qualified current-result intervals only after the
  exact predecessor/basis test; barriers and overlaps retain coverage.

### Valid Operators

- Future first-entry UTC plus stable-ID order, immediate-predecessor selection,
  selected-basis loss classification, raw UTC subtraction, and positive-gap test.
- Close-time order, eligible/loss-first search, gross-for-net fallback, clamping,
  and backward skipping are invalid.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_sequence`, `explain_result`, and `inspect_data_quality`; Planned remains.

### Incompatible Combinations

- Pre-filtering candidates by state/date/ticker/direction/source/outcome/result;
  selecting any earlier loss; close-time/import/database ordering.
- Non-ready/flat/non-classifiable barrier skipped, net inferred without complete
  fees/currency, overlap clamped, behavior diagnosis, causation, or advice.

### Default Interpretation

Interpret "time after previous loss" as the positive raw-UTC gap after the exact
first-entry-ordered predecessor only when that same predecessor is `ready_closed`
and a loss on the declared basis. Return Planned/unavailable otherwise; never
search back to a qualifying loss.

### Clarification Conditions

Clarify gross versus net basis first when absent, then only one missing current
lifecycle/population or compatible scope field. Do not offer to skip a barrier.

### Recommended Clarification Wording

1. "Should the immediately previous trade be classified by gross or net result?"
2. If still needed: "Which current trade or result population should I use?"
3. If still needed: "Which compatible authorized account scope should I use?"

### Unsupported Conditions

- Current absence of an accepted named after-loss interval contract.
- No predecessor; missing order/endpoints; exact predecessor non-ready, flat,
  non-classifiable, or not a loss on the selected basis; current `needs_decision`.
- Fee-incomplete net, incompatible currency/scope, nonpositive overlap, request
  to skip/clamp/search farther back, causation, behavior label, or advice.

### Target Analytics Tool or Query Capability

- Planned future deterministic outcome-conditioned interval over the current
  read-only Journal facts, selected-basis outcome, and fee/coverage contracts.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future exact positive elapsed seconds plus declared outcome basis, compatible
  currency/fee state, sample count, barrier coverage, and optional UTC/account-
  IANA endpoint displays with effective DST.

### Fee Handling

- Gross loss uses accepted gross P/L. Net loss requires fee-complete evidence;
  incomplete/conflicting/unsupported net is non-classifiable coverage and cannot
  fall back to gross. Classification stays in one compatible currency partition.

### Open-Trade Handling

- A current `legitimate_open` may qualify in a future contract because its first
  entry exists if the exact predecessor qualifies and the gap is positive.
- A predecessor open/decision/non-ready is a barrier and never skipped; current
  `needs_decision` is coverage, not a computed interval.

### Sample-Size Considerations

- No predecessor, a flat/non-classifiable/non-loss predecessor, or nonpositive
  gap is unavailable, never an exact zero sample. Report every barrier class.
- Show qualified count, selected basis, fees, currency, and coverage; associations
  do not prove revenge trading, emotion, causation, or advice.

## `time_after_previous_win` Language Registry

### Exact Definition

Planned interval for a selected current lifecycle in one compatible authorized
account/timezone/currency scope. Order every current in-scope lifecycle candidate
by first-entry raw UTC instant, then stable round-trip ID, and select the exact
immediate predecessor before eligibility, state, date, or result filtering. That
same predecessor must be `ready_closed` and a win on the declared Category 2/3
gross or net basis. Then compute current first-entry UTC minus predecessor final-
exit UTC in exact seconds. Non-ready, flat, or non-classifiable predecessors are
visible barriers; a nonpositive gap is overlap coverage, unavailable and unclamped.

### Formal Wording

- "positive final-exit-to-first-entry interval after the exact selected-basis win"
- "immediate first-entry-ordered predecessor win gap"

### Normal Conversational Wording

- "How long after the previous winning trade did I enter this one?"
- "Show the gap after the trade immediately before it, if that trade was a win."

### Trader Slang

- "Time after a W" maps only to the exact predecessor on a declared outcome basis.
- "Confidence gap" must not infer emotion, behavior, or causation.

### Abbreviations

- `TAPW` is safe only in explicit outcome-interval context.
- Bare `W`, `prev win`, `green`, `5m`, or a ticker token is ambiguous alone.

### Common Misspellings

- `time after prevous win`
- `time aftr last won`

### Noisy or Incomplete Input

- `AAPL 5m after W?` requires a selected current lifecycle, outcome basis, and
  clarification whether `5m` is a claimed value, threshold, or display unit.
- `after last green trade` cannot use display color to establish a factual win.

### Singular and Plural Forms

- Singular: "time after the previous win" is one qualified predecessor/current pair.
- Plural: "times after previous wins" means one interval per selected current
  lifecycle whose exact predecessor qualifies, not gaps after any earlier win.

### Full Questions

- "What exact positive interval followed the immediate predecessor when it was
  a win on the selected basis?"
- "Show planned after-win intervals with barrier and fee coverage."

### Commands

- "Select the immediate predecessor before filtering and require that same trade
  to be a selected-basis win."
- "Do not skip flat, open, unresolved, or overlapping predecessors."

### Sentence Fragments

- "gap after previous win"
- "seconds since exact winning predecessor"

### Follow-Up Wording

- "Use net win." changes basis only if fee-complete compatible net evidence
  exists; it does not substitute gross or reselect the predecessor.
- "Show minutes." changes display only; raw UTC seconds remain exact.

### Correction Wording

- "I meant the immediately previous lifecycle, not any earlier win."
- "Classify that same predecessor on net basis; do not skip it if fees are incomplete."

### Comparison Wording

- "Compare after-win gaps for two selected current groups" applies result filters
  after predecessor selection and requires identical basis/formula, compatible
  partitions, qualified counts, and barrier coverage.

### Ranking Wording

- "Rank current trades by time after the previous win" remains Planned and
  requires Category 12/14 rules; exact positive seconds control value ties.
- Barriers and overlaps stay unavailable, not zero-ranked values.

### Negated Wording

- "After-win gaps without overlaps" removes overlap rows only from computed
  values while reporting coverage; it never searches farther back.
- "Do not include flat predecessors" cannot skip them; flat remains a barrier.

### Exclusion Wording

- "Exclude AAPL current trades" may filter selected current result rows only
  after the predecessor is fixed; it cannot remove candidates from the order.
- Excluding open, flat, or fee-incomplete predecessors never permits backtracking.

### Multi-Filter Wording

- "Net after-win gaps for selected long AAPL current trades in August" validates
  filters on current results after all-candidate predecessor selection and needs
  compatible currency plus fee-complete net classification.

### Multi-Part Question Wording

- "Show gap, predecessor net result, and coverage" combines the Planned interval
  with the accepted selected-basis outcome without exposing private identifiers.

### Ambiguous Wording

- "Previous win" may mean immediate predecessor, any earlier win, winning day,
  same-ticker win, largest win, or win streak.
- "Win" may mean gross or net; color and signless display do not choose the basis.

### Negative Examples

These examples must not map to this concept.

- "How long after any win did I trade again?" asks for a different sequence search.
- "Was I overconfident?" asks for unsupported behavior/causation interpretation.
- "How long did the winning trade last?" maps to `hold_duration`.

### Context Requirements

Require one compatible server-authorized account/timezone/currency scope, a
trusted selected current lifecycle/result population, and a declared Category
2/3 gross or net outcome basis. Candidate ordering precedes all state/date/result
filters. Raw UTC and stable IDs are internal facts, never user authorization.

### Required Data

- First-entry raw UTC and stable round-trip ID for every current in-scope candidate.
- Exact immediate predecessor state, final-exit UTC, selected-basis realized P/L,
  currency, and fee completeness when net is selected.
- Current first-entry raw UTC, authorization/partition, and coverage.
- A future accepted named after-win interval query/result contract.

### Optional Data

- Current-result-only validated symbol/direction/source/outcome/date filters.
- UTC/account-IANA endpoint display and seconds/minutes/hours formatting.
- Compatible gross or fee-complete net money details for presentation.

### Valid Filters

- Validated filters may select current result rows only after the complete
  first-entry order and exact predecessor are fixed.
- No win/readiness/date/ticker/outcome filter may prune predecessor candidates
  or search for the nearest earlier win.

### Valid Groupings

- No named after-win interval grouping is currently accepted.
- Future grouping may organize qualified current-result intervals only after the
  exact predecessor/basis test; barriers and overlaps retain coverage.

### Valid Operators

- Future first-entry UTC plus stable-ID order, immediate-predecessor selection,
  selected-basis win classification, raw UTC subtraction, and positive-gap test.
- Close-time order, eligible/win-first search, gross-for-net fallback, clamping,
  and backward skipping are invalid.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_sequence`, `explain_result`, and `inspect_data_quality`; Planned remains.

### Incompatible Combinations

- Pre-filtering candidates by state/date/ticker/direction/source/outcome/result;
  selecting any earlier win; close-time/import/database ordering.
- Non-ready/flat/non-classifiable barrier skipped, net inferred without complete
  fees/currency, overlap clamped, behavior diagnosis, causation, or advice.

### Default Interpretation

Interpret "time after previous win" as the positive raw-UTC gap after the exact
first-entry-ordered predecessor only when that same predecessor is `ready_closed`
and a win on the declared basis. Return Planned/unavailable otherwise; never
search back to a qualifying win.

### Clarification Conditions

Clarify gross versus net basis first when absent, then only one missing current
lifecycle/population or compatible scope field. Do not offer to skip a barrier.

### Recommended Clarification Wording

1. "Should the immediately previous trade be classified by gross or net result?"
2. If still needed: "Which current trade or result population should I use?"
3. If still needed: "Which compatible authorized account scope should I use?"

### Unsupported Conditions

- Current absence of an accepted named after-win interval contract.
- No predecessor; missing order/endpoints; exact predecessor non-ready, flat,
  non-classifiable, or not a win on the selected basis; current `needs_decision`.
- Fee-incomplete net, incompatible currency/scope, nonpositive overlap, request
  to skip/clamp/search farther back, causation, behavior label, or advice.

### Target Analytics Tool or Query Capability

- Planned future deterministic outcome-conditioned interval over the current
  read-only Journal facts, selected-basis outcome, and fee/coverage contracts.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future exact positive elapsed seconds plus declared outcome basis, compatible
  currency/fee state, sample count, barrier coverage, and optional UTC/account-
  IANA endpoint displays with effective DST.

### Fee Handling

- Gross win uses accepted gross P/L. Net win requires fee-complete evidence;
  incomplete/conflicting/unsupported net is non-classifiable coverage and cannot
  fall back to gross. Classification stays in one compatible currency partition.

### Open-Trade Handling

- A current `legitimate_open` may qualify in a future contract because its first
  entry exists if the exact predecessor qualifies and the gap is positive.
- A predecessor open/decision/non-ready is a barrier and never skipped; current
  `needs_decision` is coverage, not a computed interval.

### Sample-Size Considerations

- No predecessor, a flat/non-classifiable/non-win predecessor, or nonpositive
  gap is unavailable, never an exact zero sample. Report every barrier class.
- Show qualified count, selected basis, fees, currency, and coverage; associations
  do not prove overconfidence, discipline, causation, or advice.

## `first_trade_time` Language Registry

### Exact Definition

Planned trading-window start within one declared compatible server-authorized
scope and period: order eligible lifecycles by first-entry raw UTC instant, then
stable round-trip ID, select the earliest eligible lifecycle, and return its first
position-opening raw UTC instant. Display converts that same instant to the
account IANA timezone with its effective offset/DST. `legitimate_open` participates
only when the declared population explicitly includes it; otherwise realized
analysis uses `ready_closed`. `needs_decision` never supplies the endpoint.

### Formal Wording

- "first-entry instant of the earliest eligible lifecycle in the selected window"
- "account-local trading-window opening endpoint"

### Normal Conversational Wording

- "What time was my first trade in the selected period?"
- "When did my trading window start?"

### Trader Slang

- "First trade of the day" maps only after the account-local day is resolved.
- "At the bell" does not establish market open, exchange session, or an endpoint.

### Abbreviations

- `FTT` is safe only in explicit time-metric context.
- `first tr`, `1st`, `AM`, `open`, `9:30`, and ticker-like tokens are ambiguous.

### Common Misspellings

- `frist trade time`
- `first trad tiem`

### Noisy or Incomplete Input

- `AAPL first today?` requires validated ticker, Category 13 period, and lifecycle
  population; it does not choose an account or include open trades automatically.
- `1st 9:35?` may be a claimed value, threshold, or question.

### Singular and Plural Forms

- Singular: "first trade time" is one window-start timestamp for one declared scope.
- Plural: "first trade times" means one endpoint per separately declared group,
  not every first entry within a lifecycle.

### Full Questions

- "What raw UTC first-entry instant starts the selected eligible trading window?"
- "Show its account-local clock time, timezone, sample count, and coverage."

### Commands

- "Select the earliest eligible lifecycle by first-entry UTC and stable ID."
- "Use its first opening, not an arbitrary execution or final exit."

### Sentence Fragments

- "first trade time"
- "earliest lifecycle entry"

### Follow-Up Wording

- "Include legitimate open trades." explicitly broadens only the declared
  eligible population; it does not include decision rows.
- "Show local time." changes display only, not raw UTC selection.

### Correction Wording

- "I meant the first entry, not the first exit."
- "Use ready-closed only; do not include open lifecycles."

### Comparison Wording

- "Compare first trade times across selected periods" requires separately
  resolved account-local periods, identical eligibility, compatible partitions,
  raw-UTC selection, local display context, samples, and coverage.

### Ranking Wording

- "Rank days by earliest first trade" remains Planned and requires Category
  12/14 clock/date semantics and deterministic ties.
- Earlier local time does not imply preparation, quality, or advice.

### Negated Wording

- "First trade time without open lifecycles" selects a ready-closed-only
  population while retaining open/decision coverage.
- "Do not use import time."

### Exclusion Wording

- "Exclude AAPL" uses only validated symbol exclusion before earliest eligible
  selection within the declared result population.
- Excluding `needs_decision` from values does not hide its coverage.

### Multi-Filter Wording

- "First trade time for eligible closed long AAPL lifecycles on the selected
  local date" combines only validated filters and Category 13-resolved period.

### Multi-Part Question Wording

- "Show first trade time and last trade time" returns asymmetric planned window
  endpoints: earliest eligible first entry and latest ready-closed final exit.

### Ambiguous Wording

- "First trade" may mean first lifecycle entry, first execution of any role,
  earliest closed result, first import, or market open.
- "Today" and bare clock times require account timezone/date context.

### Negative Examples

These examples must not map to this concept.

- "When did the selected trade enter?" maps to single-lifecycle `entry_time`.
- "What time did the market open?" requires external session/calendar facts.
- "What was my first fill?" is an execution-level Category 8 request.

### Context Requirements

Require one compatible server-authorized account/timezone/currency scope, a
Category 13-resolved period, and explicitly declared eligible lifecycle states.
Open lifecycles are excluded unless explicitly included. Ticker/time tokens and
browser timezone cannot authorize or change the scope.

### Required Data

- Accepted first position-opening raw UTC instant for each eligible lifecycle.
- Eligibility/current projection state, stable round-trip ID, period, authorized
  account scope, account IANA timezone, and coverage.
- A future accepted named trading-window-start query/result contract.

### Optional Data

- Validated symbol/direction/source/outcome/date filters.
- Explicit inclusion of `legitimate_open` and compatible outcome/money partition.
- Requested UTC/local date, clock, offset, and timezone presentation.

### Valid Filters

- Existing validated Journal filters, Category 13-resolved period, and explicit
  lifecycle population before earliest selection.
- A clock token does not create a threshold/filter without future validation.

### Valid Groupings

- No named first-trade-time grouping is currently accepted.
- Future per-period/group endpoints must independently select the earliest
  eligible first entry and report empty groups without invented midnight values.

### Valid Operators

- Future minimum over first-entry raw UTC only, with stable-ID tie selection and
  Category 12/14 validated clock comparisons/ranking.
- Mixed-timestamp minimum, local-display ordering, or current support is not inferred.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality`; Planned remains.

### Incompatible Combinations

- Minimum over arbitrary executions, final exits, import/submission times, mixed
  timestamp fields, market/session open, browser time, or unapproved as-of logic.
- Open rows silently included, decision rows selected, incompatible partitions,
  invented runtime/filter, behavior inference, causation, or advice.

### Default Interpretation

Interpret "first trade time" as the first-entry instant of the earliest eligible
lifecycle in the declared scope/period. Default realized analysis is
`ready_closed`; include `legitimate_open` only when explicitly declared. Return
Planned/unavailable until the named endpoint contract exists.

### Clarification Conditions

Clarify period first if absent, then only one missing population field such as
whether to include legitimate open lifecycles. Preserve trusted scope/timezone.

### Recommended Clarification Wording

1. "Which account-local date or period should I use?"
2. If still needed: "Should the eligible population include legitimate open trades?"
3. If still needed: "Do you mean the first lifecycle entry rather than first fill?"

### Unsupported Conditions

- Current absence of an accepted named first-trade-time endpoint contract.
- Empty population, missing/conflicting first-entry/timezone/period, unauthorized
  scope, incompatible partition, or only `needs_decision` candidates.
- Request for session/market-open inference, mixed-timestamp minimum, causation,
  behavior judgment, or advice.

### Target Analytics Tool or Query Capability

- Planned future deterministic trading-window-start endpoint over the current
  read-only Journal fact set and validated query/result contract.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future raw UTC timestamp plus account-IANA local date, clock time, offset,
  timezone, eligible sample count, and complete/partial/empty coverage.

### Fee Handling

- Not applicable to endpoint selection. Outcome/money-filtered populations retain
  selected basis, fee completeness, and compatible currency partition.

### Open-Trade Handling

- `legitimate_open` may participate only when explicitly declared and its accepted
  first opening exists. Default realized scope is `ready_closed`.
- `needs_decision` and missing/conflicting first entries remain visible coverage.

### Sample-Size Considerations

- An empty eligible population is unavailable/empty, never zero or midnight. One
  lifecycle yields its exact first entry. Tied UTC entries use stable ID only to
  select the lifecycle; private IDs and display rounding never affect the value.
- Report eligibility/count/coverage; early time does not prove behavior or advice.

## `last_trade_time` Language Registry

### Exact Definition

Planned trading-window end within one declared compatible server-authorized
scope and period: order eligible `ready_closed` lifecycles by final-exit raw UTC
instant, then stable round-trip ID, select the lifecycle with the latest final
exit, and return that final-flat raw UTC instant. Display converts that same
instant to the account IANA timezone with its effective offset/DST. Open and
decision lifecycles never receive the query as-of time, current clock, or an
estimated close. This deliberately differs from `first_trade_time`'s first entry.

### Formal Wording

- "final-exit instant of the latest eligible ready-closed lifecycle"
- "account-local trading-window closing endpoint"

### Normal Conversational Wording

- "What time did my last completed trade close?"
- "When did my selected trading window end?"

### Trader Slang

- "Last trade of the day" maps only after the local date and completed population resolve.
- "At the close" does not establish market close, session, or final exit.

### Abbreviations

- `LTT` is safe only in explicit time-metric context.
- `last tr`, `EOD`, `close`, `PM`, `16:00`, and ticker-like tokens are ambiguous.

### Common Misspellings

- `last trad time`
- `last trade tiem`

### Noisy or Incomplete Input

- `AAPL last today?` requires validated ticker, Category 13 period, and completed
  population; it must not use an open position's current time.
- `last 3:55?` may be a claimed value, threshold, or question.

### Singular and Plural Forms

- Singular: "last trade time" is one window-end timestamp for one declared scope.
- Plural: "last trade times" means one endpoint per separately declared group,
  not every exit within a lifecycle.

### Full Questions

- "What raw UTC final-exit instant ends the selected ready-closed trading window?"
- "Show its account-local clock time, timezone, sample count, and coverage."

### Commands

- "Select the latest eligible ready-closed lifecycle by final-exit UTC and stable ID."
- "Use final flat, not the latest entry, partial exit, or current time."

### Sentence Fragments

- "last trade time"
- "latest final exit"

### Follow-Up Wording

- "Use the final close." retains the final-flat endpoint, not the first reduction.
- "Show local time." changes display only, not raw UTC selection.

### Correction Wording

- "I meant the latest final exit, not the latest entry."
- "Do not use now for the open position."

### Comparison Wording

- "Compare last trade times across selected periods" requires separately
  resolved account-local periods, identical ready-closed eligibility, compatible
  partitions, raw-UTC selection, local display, samples, and coverage.

### Ranking Wording

- "Rank days by latest last trade" remains Planned and requires Category 12/14
  clock/date semantics and deterministic ties.
- Later local time does not establish overtrading, discipline, or advice.

### Negated Wording

- "Last trade time without open positions" still reports open/decision coverage
  while only ready-closed rows can supply a value.
- "Do not use the first exit."

### Exclusion Wording

- "Exclude AAPL" uses only validated symbol exclusion before latest eligible
  ready-closed selection within the declared result population.
- Excluding decision rows from values does not hide their coverage.

### Multi-Filter Wording

- "Last trade time for eligible closed long AAPL lifecycles on the selected
  local date" combines only validated filters and Category 13-resolved period.

### Multi-Part Question Wording

- "Show first trade time and last trade time" returns asymmetric planned window
  endpoints: earliest eligible first entry and latest ready-closed final exit.

### Ambiguous Wording

- "Last trade" may mean latest lifecycle final exit, latest entry, arbitrary
  execution, latest imported row, query as-of time, or market close.
- "Today," `EOD`, and bare clock times require account timezone/date context.

### Negative Examples

These examples must not map to this concept.

- "When did the selected trade exit?" maps to single-lifecycle `exit_time`.
- "What time did the market close?" requires external session/calendar facts.
- "What is the latest fill?" is an execution-level Category 8 request.

### Context Requirements

Require one compatible server-authorized account/timezone/currency scope, a
Category 13-resolved period, eligible current `ready_closed` lifecycles, exact
final-exit facts, and visible open/decision coverage. Ticker/time tokens and
browser timezone cannot authorize or change scope.

### Required Data

- Accepted final-flat raw UTC instant for every eligible `ready_closed` lifecycle.
- Stable round-trip ID, period, authorized account scope, account IANA timezone,
  current state, and coverage.
- A future accepted named trading-window-end query/result contract.

### Optional Data

- Validated symbol/direction/source/outcome/date filters.
- Compatible outcome/money basis, currency, and fee completeness.
- Requested UTC/local date, clock, offset, and timezone presentation.

### Valid Filters

- Existing validated Journal filters and Category 13-resolved period over
  `ready_closed` lifecycles before latest final-exit selection.
- A clock token does not create a threshold/filter without future validation.

### Valid Groupings

- No named last-trade-time grouping is currently accepted.
- Future per-period/group endpoints must independently select the latest final
  exit and report empty groups without invented midnight/as-of values.

### Valid Operators

- Future maximum over final-exit raw UTC only, with stable-ID tie selection and
  Category 12/14 validated clock comparisons/ranking.
- Mixed-timestamp maximum, local-display ordering, or current support is not inferred.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trade`,
  `analyze_trend`, `explain_result`, and `inspect_data_quality`; Planned remains.

### Incompatible Combinations

- Maximum over entries, arbitrary/partial executions, import/submission times,
  mixed timestamp fields, market/session close, browser time, or as-of current time.
- Open/decision rows assigned a close, incompatible partitions, invented runtime/
  filter, behavior inference, causation, or advice.

### Default Interpretation

Interpret "last trade time" as the final-exit instant of the latest eligible
`ready_closed` lifecycle in the declared scope/period. Never use an as-of value
for open/decision rows. Return Planned/unavailable until the named contract exists.

### Clarification Conditions

Clarify period first if absent, then only one missing event/population field such
as final exit versus latest entry. Do not ask whether to estimate an open close.

### Recommended Clarification Wording

1. "Which account-local date or period should I use?"
2. If still needed: "Do you mean the latest completed final exit rather than latest entry?"
3. If still needed: "Which compatible authorized account scope should I use?"

### Unsupported Conditions

- Current absence of an accepted named last-trade-time endpoint contract.
- Empty ready-closed population, missing/conflicting final exit/timezone/period,
  unauthorized scope, incompatible partition, or only open/decision candidates.
- Request for as-of/estimated close, session/market-close inference, mixed-field
  maximum, causation, behavior judgment, or advice.

### Target Analytics Tool or Query Capability

- Planned future deterministic trading-window-end endpoint over current
  `ready_closed` Journal facts and validated query/result contract.
- No current named runtime metric or AI Chat handler is claimed.

### Result Units

- Future raw UTC timestamp plus account-IANA local date, clock time, offset,
  timezone, eligible sample count, and complete/partial/empty coverage.

### Fee Handling

- Not applicable to endpoint selection. Outcome/money-filtered populations retain
  selected basis, fee completeness, and compatible currency partition.

### Open-Trade Handling

- Only `ready_closed` supplies a final-exit endpoint. `legitimate_open` and
  `needs_decision` remain visible coverage and are never assigned now, query
  as-of time, current clock, or an estimated exit.

### Sample-Size Considerations

- An empty eligible ready-closed population is unavailable/empty, never zero,
  midnight, or now. One lifecycle yields its exact final exit. Tied UTC exits use
  stable ID only to select the lifecycle; private IDs/display rounding do not alter it.
- Report count/coverage; a late endpoint does not prove behavior or advice.

## Language Registry Completion

None. All 19 approved Version 1 canonical records have complete, approved, and
locked language registries. Section 6 acceptance does not create an AI
Chat/runtime capability.

---

# 7. Evaluation Cases Deliverable

## 7.1 Evaluation Case Schema and Batch Boundary

Every object below uses the locked Category 1 exact 21-key schema and key order,
with explicit empty arrays and `null` values. Batches 1-6 contain all 418/418
cases for `C7-TIME-001` through `C7-TIME-019`: nineteen complete 22-case arrays,
`C7-E1-01` through `C7-E19-22`. A comprehensive independent Terra review passed
all 418 cases with zero failures. The controller accepted that PASS and locked
the category at Version 1. Review and approval do not create an AI Chat/runtime
capability or inflate the recorded Supported/Planned/Unavailable split.

All cases retain server-authorized compatible account/timezone scope, accepted
raw UTC instants, account-IANA local rendering with effective DST, lifecycle
state, and explicit included/limited/unavailable coverage. Trusted selected
entities and periods are used only when the input explicitly invokes trusted
prior context. The cases do not invent dates, identifiers, sessions, facts,
causation, behavioral judgments, predictions, or advice. Expected results and
coverage remain privacy-safe and never expose raw account, broker, execution,
source, identity, or stable tie-break identifiers.

## 7.2 Required Case Types

Each saved array has this exact order: canonical, formal paraphrase,
conversational paraphrase, trader slang, abbreviation, misspelling, noisy input,
command, fragment, follow-up, correction, comparison, ranking, negation,
exclusion, multi-filter, multi-part, ambiguity, negative example, unsupported
data, selected entity, and cross-category.

## 7.3 Batch Coverage Summary

| Evaluation state | Count |
|---|---:|
| Target cases | 418 |
| Saved cases | 418 |
| Reviewed cases | 418 |
| Passed cases | 418 |
| Failed cases | 0 |
| Unreviewed saved cases | 0 |
| Unsaved cases | 0 |
| Complete 22-case arrays | 19 |
| Pending arrays | 0 |
| Clarification-expected cases saved | 19 |
| Unsupported-expected cases saved | 57 |
| Cross-category cases saved | 19 |

## 7.4 Structured Evaluation Arrays

### `entry_time`

```json
[{"caseId":"C7-E1-01","caseType":"canonical","input":"Show the selected trade's entry time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-02","caseType":"formal_paraphrase","input":"Return the first position-opening timestamp for the selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-03","caseType":"conversational_paraphrase","input":"What time did I get into the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-04","caseType":"trader_slang","input":"When did I get in on the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-05","caseType":"abbreviation","input":"Show entry timestamp (ET) for the selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit entry-time grammar","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-06","caseType":"misspelling","input":"Show the selected trade's entery time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-07","caseType":"noisy_input","input":"selected trade get-in time pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-08","caseType":"command","input":"Return the selected lifecycle's first-entry time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-09","caseType":"fragment","input":"Selected lifecycle entry timestamp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-10","caseType":"follow_up","input":"For that trusted prior selected lifecycle, what was its entry time?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["trusted prior selected lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior lifecycle context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-11","caseType":"correction","input":"For that trusted result, I meant first entry, not final exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-12","caseType":"comparison","input":"Compare entry times for the two trusted selected lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["trusted first lifecycle","trusted second lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone","timestamp comparison"],"expectedComparison":{"left":"trusted first lifecycle","right":"trusted second lifecycle","basis":"entry_time"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two trusted selected lifecycles","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-13","caseType":"ranking","input":"Rank the trusted selected lifecycles by entry time.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["trusted selected lifecycles"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone","ascending raw UTC","stable-ID tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["trusted selected lifecycle set","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-14","caseType":"negation","input":"Show entry time, not exit time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["exclude final-exit interpretation"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-15","caseType":"exclusion","input":"Show entry time excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-16","caseType":"multi_filter","input":"Show entry time for the trusted selected ticker in the trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-17","caseType":"multi_part","input":"For the trusted current and prior selections, compare entry times and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["trusted current selection","trusted prior selection"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone","timestamp comparison","coverage inspection"],"expectedComparison":{"left":"trusted current selection","right":"trusted prior selection","basis":"entry_time"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior selection context","expectedContextRequirements":["explicit trusted current and prior selections","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-18","caseType":"ambiguity","input":"What time did I trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved lifecycle event","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the first entry time or the final exit time?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose entry, exit, a session, or a date; ask one event-field question."},{"caseId":"C7-E1-19","caseType":"negative_example","input":"What time should I enter my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed timing"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed entry timing are unsupported; a historical entry timestamp cannot recommend a future action.","notes":"This is advice, not a factual entry-time request; do not infer an ideal time."},{"caseId":"C7-E1-20","caseType":"unsupported_data","input":"Use browser local time and guess the missing entry timestamp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant required","no browser-timezone authority or timestamp invention"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Entry time is unavailable when the accepted first-opening instant or compatible account IANA timezone is missing or conflicting; browser time and guessed timestamps cannot replace source facts.","notes":"Return explicit missing/conflicting coverage. A legitimate open may have entry time; needs_decision remains unavailable coverage."},{"caseId":"C7-E1-21","caseType":"selected_entity_context","input":"For the trusted selected lifecycle, show entry time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["entry_time"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected lifecycle context","expectedContextRequirements":["explicit trusted selected lifecycle context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the accepted first opening raw UTC instant; account-IANA local rendering is display only. Never substitute import time, arbitrary execution time, or infer causation or advice."},{"caseId":"C7-E1-22","caseType":"cross_category","input":"Explain the trusted lifecycle's entry time alongside shares entered without implying that size caused the timing.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["entry_time","shares_entered"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted first position-opening raw UTC instant and render in account IANA timezone","cross-category boundary explanation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle context","expectedContextRequirements":["explicit trusted selected lifecycle context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening raw UTC instant","ready_closed, legitimate_open, and needs_decision coverage","Category 6 shares-entered boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain time and quantity as separate factual dimensions; do not expose identifiers or claim that size caused timing."}]
```

### `exit_time`

```json
[{"caseId":"C7-E2-01","caseType":"canonical","input":"Show the selected trade's exit time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-02","caseType":"formal_paraphrase","input":"Return the final-flat timestamp for the selected ready-closed lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-03","caseType":"conversational_paraphrase","input":"What time was I fully out of the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-04","caseType":"trader_slang","input":"When did I flatten the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-05","caseType":"abbreviation","input":"Show final exit timestamp (XT) for the selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit final-exit-time grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-06","caseType":"misspelling","input":"Show the selected trade's exiit time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-07","caseType":"noisy_input","input":"selected trade fully-out time pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-08","caseType":"command","input":"Return the selected lifecycle's final-exit time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-09","caseType":"fragment","input":"Selected lifecycle final-flat timestamp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-10","caseType":"follow_up","input":"For that trusted prior selected lifecycle, what was its exit time?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["trusted prior selected lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior lifecycle context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-11","caseType":"correction","input":"For that trusted result, I meant final exit, not first partial.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-12","caseType":"comparison","input":"Compare exit times for the two trusted selected closed lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["trusted first ready-closed lifecycle","trusted second ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone","timestamp comparison"],"expectedComparison":{"left":"trusted first lifecycle","right":"trusted second lifecycle","basis":"exit_time"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two trusted selected ready-closed lifecycles","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-13","caseType":"ranking","input":"Rank the trusted selected closed lifecycles by exit time.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["trusted selected ready-closed lifecycles"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone","ascending raw UTC","stable-ID tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ready-closed lifecycle set","expectedContextRequirements":["trusted selected ready-closed lifecycle set","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-14","caseType":"negation","input":"Show exit time, not first-exit time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["exclude first-reduction interpretation"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-15","caseType":"exclusion","input":"Show exit time excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-16","caseType":"multi_filter","input":"Show exit time for the trusted selected ticker in the trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-17","caseType":"multi_part","input":"For the trusted current and prior selections, compare exit times and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["trusted current selection","trusted prior selection"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone","timestamp comparison","coverage inspection"],"expectedComparison":{"left":"trusted current selection","right":"trusted prior selection","basis":"exit_time"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior selection context","expectedContextRequirements":["explicit trusted current and prior selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-18","caseType":"ambiguity","input":"What time was I out?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved exit event","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the first position reduction or the final exit that returned the trade to flat?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently map out to a partial or final exit; ask one endpoint-field question."},{"caseId":"C7-E2-19","caseType":"negative_example","input":"When should I exit my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed timing"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed exit timing are unsupported; a historical final-exit timestamp cannot recommend a future action.","notes":"This is advice, not a factual exit-time request; do not infer an ideal exit."},{"caseId":"C7-E2-20","caseType":"unsupported_data","input":"Use the current clock as exit time for the open position.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted final-flat raw UTC instant required","open and decision rows never receive as-of exit values"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Exit time requires an accepted final-flat instant for a ready_closed lifecycle; legitimate_open and needs_decision rows cannot receive the current clock, an estimate, or zero as an exit.","notes":"Return explicit open/decision coverage without suppressing unrelated ready-closed results."},{"caseId":"C7-E2-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed lifecycle, show exit time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["exit_time"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed lifecycle context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the accepted final-flat raw UTC instant of a ready_closed lifecycle; account-IANA local rendering is display only. Never substitute first reduction, current time, or infer causation or advice."},{"caseId":"C7-E2-22","caseType":"cross_category","input":"Explain the trusted trade's exit time beside net P&L without claiming that the exit clock caused the result.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["exit_time","net_pnl"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["select accepted final-flat raw UTC instant and render in account IANA timezone","cross-category boundary explanation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed lifecycle context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","legitimate_open and needs_decision coverage retained","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep time and money separate, retain compatible currency and fees, and make no causal or advisory claim."}]
```

### `hold_duration`

```json
[{"caseId":"C7-E3-01","caseType":"canonical","input":"Show the selected trade's hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-02","caseType":"formal_paraphrase","input":"Calculate exact elapsed seconds from first position opening to final flat.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-03","caseType":"conversational_paraphrase","input":"How long did I hold the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-04","caseType":"trader_slang","input":"How long was I in the selected trade before I flattened?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-05","caseType":"abbreviation","input":"Show hold dur (HD) for the selected closed lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit hold-duration grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-06","caseType":"misspelling","input":"Show the selected trade's hold duraton.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-07","caseType":"noisy_input","input":"selected trade held how long pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-08","caseType":"command","input":"Calculate the selected ready-closed lifecycle's hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-09","caseType":"fragment","input":"First-entry-to-final-exit elapsed time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-10","caseType":"follow_up","input":"For that trusted prior selected lifecycle, how long was it held?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["trusted prior selected lifecycle"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior lifecycle context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-11","caseType":"correction","input":"For that trusted result, I meant full hold duration, not time to first partial.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-12","caseType":"comparison","input":"Compare hold duration for the two trusted selected closed lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["trusted first ready-closed lifecycle","trusted second ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds","duration comparison"],"expectedComparison":{"left":"trusted first lifecycle","right":"trusted second lifecycle","basis":"hold_duration"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two trusted selected ready-closed lifecycles","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-13","caseType":"ranking","input":"Rank the trusted selected closed lifecycles by hold duration.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["trusted selected ready-closed lifecycles"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds","descending exact seconds","stable tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ready-closed lifecycle set","expectedContextRequirements":["trusted selected ready-closed lifecycle set","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-14","caseType":"negation","input":"Show hold duration, not calendar days held.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["exclude calendar-date-boundary interpretation"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-15","caseType":"exclusion","input":"Show hold duration excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-16","caseType":"multi_filter","input":"Show hold duration for the trusted selected ticker in the trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-17","caseType":"multi_part","input":"For the trusted current and prior selections, compare hold duration and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["trusted current selection","trusted prior selection"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds","duration comparison","coverage inspection"],"expectedComparison":{"left":"trusted current selection","right":"trusted prior selection","basis":"hold_duration"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior selection context","expectedContextRequirements":["explicit trusted current and prior selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-18","caseType":"ambiguity","input":"How many days was I in the trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved duration basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean exact elapsed time or account-local calendar-date boundaries crossed?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not divide by 86400 or choose calendar days silently; ask one duration-basis question."},{"caseId":"C7-E3-19","caseType":"negative_example","input":"How long should I hold my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed holding period"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed holding periods are unsupported; a historical hold duration cannot recommend a future action.","notes":"This is advice, not a factual duration request; do not infer an ideal hold."},{"caseId":"C7-E3-20","caseType":"unsupported_data","input":"Give the open position a completed hold duration using now.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first-opening and final-flat raw UTC instants required","open and decision rows never receive completed as-of durations"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Completed hold duration requires a ready_closed lifecycle with accepted ordered endpoints; open, needs_decision, missing, or reversed endpoints are unavailable and cannot receive now, zero, or an estimate.","notes":"An exact zero is valid only when two accepted endpoints are equal; missing or open endpoints never become zero."},{"caseId":"C7-E3-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed lifecycle, show hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["hold_duration"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed lifecycle context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use exact raw UTC elapsed seconds from first opening to final flat. Equal accepted instants may yield exact zero; open, decision, missing, or reversed endpoints are unavailable coverage. Never substitute calendar days, sessions, causation, or advice."},{"caseId":"C7-E3-22","caseType":"cross_category","input":"Compare the trusted trade's hold duration with net P&L without treating either as the cause of the other.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["hold_duration","net_pnl"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["subtract first-entry raw UTC from final-exit raw UTC in exact elapsed seconds","descriptive cross-category comparison"],"expectedComparison":{"left":"hold_duration","right":"net_pnl","basis":"trusted selected lifecycle"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed lifecycle context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage retained","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact duration and compatible money facts separate; a descriptive association is not causation or advice."}]
```

### `average_hold_duration`

```json
[{"caseId":"C7-E4-01","caseType":"canonical","input":"Show my average hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-02","caseType":"formal_paraphrase","input":"Calculate the exact arithmetic mean of eligible completed lifecycle durations.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-03","caseType":"conversational_paraphrase","input":"On average, how long did I hold my completed trades?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-04","caseType":"trader_slang","input":"What was my avg time in completed trades?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-05","caseType":"abbreviation","input":"Show avg hold dur.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit average hold-duration grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-06","caseType":"misspelling","input":"Show averge hold duraton.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-07","caseType":"noisy_input","input":"avg time held closed trades pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-08","caseType":"command","input":"Calculate average hold duration with sample count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-09","caseType":"fragment","input":"Mean completed hold time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-10","caseType":"follow_up","input":"For that trusted prior population, what was average hold duration?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["trusted prior population"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior population context","expectedContextRequirements":["explicit trusted prior population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-11","caseType":"correction","input":"For that trusted result, I meant mean hold duration, not median.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-12","caseType":"comparison","input":"Compare average hold duration across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count","exact mean comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"average_hold_duration"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-13","caseType":"ranking","input":"Rank the trusted compatible result groups by average hold duration.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count","descending exact mean","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["explicit trusted compatible group context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-14","caseType":"negation","input":"Show average hold duration, not median hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["exclude median interpretation"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-15","caseType":"exclusion","input":"Show average hold duration excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-16","caseType":"multi_filter","input":"Show average hold duration for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-17","caseType":"multi_part","input":"For the trusted current and prior periods, compare average hold duration and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count","exact mean comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"average_hold_duration"},"expectedTimeRange":"trusted current and prior closing-date contexts","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-18","caseType":"ambiguity","input":"What's my average time?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved time metric","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean average completed hold duration or an average entry or exit clock time?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose a duration, timestamp, date range, or population; ask one metric-basis question."},{"caseId":"C7-E4-19","caseType":"negative_example","input":"What average holding time should I target?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed holding target"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed holding targets are unsupported; a historical average hold duration cannot recommend a future action.","notes":"This is advice, not a factual mean-duration request; do not infer an ideal hold."},{"caseId":"C7-E4-20","caseType":"unsupported_data","input":"Treat open and decision trades as zero-duration members of the average.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed completed-duration population required","open and decision rows retained only as coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Average hold duration excludes legitimate_open and needs_decision rows from numerator and denominator; empty, missing, reversed, or incompatible endpoint populations are unavailable and cannot be replaced with zero or as-of durations.","notes":"Accepted equal endpoints may contribute exact zero seconds, but missing/open endpoints never become zero and an empty denominator is unavailable."},{"caseId":"C7-E4-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show average hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["average_hold_duration"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Compute the exact arithmetic mean of completed raw-UTC hold-duration seconds and return the included count and coverage. Exact zero-duration members remain valid; an empty population is unavailable, never zero. Display rounding does not change the value, and no causation or advice is inferred."},{"caseId":"C7-E4-22","caseType":"cross_category","input":"Compare the trusted population's average hold duration with net P&L without treating either as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["average_hold_duration","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact sum of included ready_closed hold-duration seconds divided by exact included lifecycle count","descriptive cross-category comparison"],"expectedComparison":{"left":"average_hold_duration","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from numerator and denominator","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact duration and compatible money facts separate; show sample/coverage and make no causal or advisory claim."}]
```

### `median_hold_duration`

```json
[{"caseId":"C7-E5-01","caseType":"canonical","input":"Show my median hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-02","caseType":"formal_paraphrase","input":"Calculate the exact median of eligible completed lifecycle durations.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-03","caseType":"conversational_paraphrase","input":"What's the middle hold time for my completed trades?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-04","caseType":"trader_slang","input":"What was my med hold time?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-05","caseType":"abbreviation","input":"Show med hold dur.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit median hold-duration grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-06","caseType":"misspelling","input":"Show medain hold duraton.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-07","caseType":"noisy_input","input":"middle time held closed trades pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-08","caseType":"command","input":"Calculate median hold duration with sample count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-09","caseType":"fragment","input":"Median completed hold time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-10","caseType":"follow_up","input":"For that trusted prior population, what was median hold duration?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["trusted prior population"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior population context","expectedContextRequirements":["explicit trusted prior population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-11","caseType":"correction","input":"For that trusted result, I meant median hold duration, not average.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-12","caseType":"comparison","input":"Compare median hold duration across the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint","exact median comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"median_hold_duration"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-13","caseType":"ranking","input":"Rank the trusted compatible result groups by median hold duration.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":["trusted compatible approved result group"],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint","descending exact median","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted group context","expectedContextRequirements":["explicit trusted compatible group context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-14","caseType":"negation","input":"Show median hold duration, not average hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["exclude mean interpretation"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-15","caseType":"exclusion","input":"Show median hold duration excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-16","caseType":"multi_filter","input":"Show median hold duration for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-17","caseType":"multi_part","input":"For the trusted current and prior periods, compare median hold duration and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["trusted current period","trusted prior period"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint","exact median comparison","coverage inspection"],"expectedComparison":{"left":"trusted current period","right":"trusted prior period","basis":"median_hold_duration"},"expectedTimeRange":"trusted current and prior closing-date contexts","expectedSelectedEntity":"trusted current and prior period context","expectedContextRequirements":["explicit trusted current and prior period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-18","caseType":"ambiguity","input":"What's my median time?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved time metric","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean median completed hold duration or a median entry or exit clock time?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose a duration, timestamp, date range, or population; ask one metric-basis question."},{"caseId":"C7-E5-19","caseType":"negative_example","input":"What median holding time should I aim for?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed holding target"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed holding targets are unsupported; a historical median hold duration cannot recommend a future action.","notes":"This is advice, not a factual median-duration request; do not infer an ideal hold."},{"caseId":"C7-E5-20","caseType":"unsupported_data","input":"Use the lower middle value and include open trades in an even-sample median.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed completed-duration sample required","exact even-count arithmetic midpoint and open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Median hold duration requires the exact ready_closed duration sample and the arithmetic midpoint for an even count; open, needs_decision, missing, reversed, or incompatible endpoints cannot be inserted, estimated, or treated as zero.","notes":"Exact zero-duration members remain valid, but empty samples are unavailable and display rounding never selects the middle values."},{"caseId":"C7-E5-21","caseType":"selected_entity_context","input":"For the trusted selected compatible population, show median hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["median_hold_duration"],"expectedFilters":["trusted selected compatible population"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Order exact completed raw-UTC hold-duration seconds; use the middle value for odd count and exact arithmetic midpoint of the two middle values for even count. Exact zero members remain valid; an empty population is unavailable. Display rounding does not change ordering or the value, and no causation or advice is inferred."},{"caseId":"C7-E5-22","caseType":"cross_category","input":"Compare the trusted population's median hold duration with net P&L without treating either as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["median_hold_duration","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":[],"expectedOperators":["exact median of included ready_closed hold-duration seconds with exact even-count arithmetic midpoint","descriptive cross-category comparison"],"expectedComparison":{"left":"median_hold_duration","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycles with accepted first-entry and final-flat raw UTC instants","legitimate_open and needs_decision coverage excluded from the ordered sample","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep exact median duration and compatible money facts separate; show sample/coverage and make no causal or advisory claim."}]
```

### `time_to_first_exit`

```json
[{"caseId":"C7-E6-01","caseType":"canonical","input":"Show time to first exit for the selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-02","caseType":"formal_paraphrase","input":"Calculate elapsed time from first position opening to the first later accepted position reduction.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-03","caseType":"conversational_paraphrase","input":"How long until I first took some off the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-04","caseType":"trader_slang","input":"How long until my first trim on the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-05","caseType":"abbreviation","input":"Show TTFE for the explicitly selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit time-to-first-exit grammar","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-06","caseType":"misspelling","input":"Show time to frist exiit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-07","caseType":"noisy_input","input":"selected trade first trim how long pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-08","caseType":"command","input":"Calculate first-entry to first-reduction time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-09","caseType":"fragment","input":"First scale-out elapsed time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-10","caseType":"follow_up","input":"For that trusted prior selected lifecycle, what was time to first exit?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["trusted prior selected lifecycle"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior lifecycle context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-11","caseType":"correction","input":"For that trusted result, I meant first position reduction, not final exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-12","caseType":"comparison","input":"Compare time to first exit for the two trusted selected lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["trusted first lifecycle","trusted second lifecycle"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC","planned exact interval comparison"],"expectedComparison":{"left":"trusted first lifecycle","right":"trusted second lifecycle","basis":"time_to_first_exit"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted selected lifecycles","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-13","caseType":"ranking","input":"Rank the trusted selected lifecycles by time to first exit.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["trusted selected lifecycles"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC","ascending exact seconds","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle set","expectedContextRequirements":["explicit trusted selected lifecycle set","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-14","caseType":"negation","input":"Show time to first exit, not full hold duration.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["exclude final-flat duration interpretation"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-15","caseType":"exclusion","input":"Show time to first exit excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-16","caseType":"multi_filter","input":"Show time to first exit for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["trusted selected ticker","trusted declared period"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-17","caseType":"multi_part","input":"For the trusted current and prior selections, compare time to first exit and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["trusted current selection","trusted prior selection"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC","planned exact interval comparison","coverage inspection"],"expectedComparison":{"left":"trusted current selection","right":"trusted prior selection","basis":"time_to_first_exit"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior selection context","expectedContextRequirements":["explicit trusted current and prior selection context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-18","caseType":"ambiguity","input":"How long until I exited?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved exit endpoint","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean time to the first position reduction or time until the final exit?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Do not silently choose first reduction, final flat, a date range, or a lifecycle; ask one endpoint question."},{"caseId":"C7-E6-19","caseType":"negative_example","input":"When should I take my first partial exit?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed exit timing"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed partial-exit timing are unsupported; a historical time-to-first-exit metric cannot recommend a future action.","notes":"This is advice, not a factual interval request; do not infer an ideal first exit."},{"caseId":"C7-E6-20","caseType":"unsupported_data","input":"Assign zero when no accepted position-reducing allocation is observed.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted first-opening and first-reducing allocation roles and raw UTC instants required","planned named query contract required"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Time to first exit is unavailable when the named contract, first opening, or first accepted position-reducing allocation is absent, conflicting, reversed, or unresolved; no observed reduction cannot be replaced with zero or final-flat invention.","notes":"A confirmed open lifecycle may qualify only with an observed accepted reduction; needs_decision and no-reduction lifecycles remain explicit unavailable coverage."},{"caseId":"C7-E6-21","caseType":"selected_entity_context","input":"For the trusted selected lifecycle, show time to first exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_to_first_exit"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected lifecycle context","expectedContextRequirements":["explicit trusted selected lifecycle context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned first-opening-to-first-reduction interval without claiming current implementation. The endpoint may be a partial reduction and differs from final exit. A confirmed open lifecycle may qualify only when an accepted reduction is observed; missing or no reduction is unavailable, never zero. Raw UTC controls arithmetic and account-IANA rendering is display only."},{"caseId":"C7-E6-22","caseType":"cross_category","input":"Compare the trusted trade's time to first exit with net P&L without claiming the timing caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["time_to_first_exit","net_pnl"],"expectedFilters":["trusted selected lifecycle"],"expectedGroupings":[],"expectedOperators":["planned subtraction of first-entry raw UTC from first later accepted position-reducing allocation raw UTC","descriptive cross-category comparison"],"expectedComparison":{"left":"time_to_first_exit","right":"net_pnl","basis":"trusted selected lifecycle"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected lifecycle context","expectedContextRequirements":["explicit trusted selected lifecycle context","server-authorized compatible account and account-IANA timezone scope","accepted first position-opening and first later position-reducing raw UTC instants with allocation roles","ready_closed, legitimate_open, and needs_decision coverage under the planned named contract","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned interval and compatible money fact separate; do not claim runtime support, causation, or advice."}]
```

### `session`

```json
[{"caseId":"C7-E7-01","caseType":"canonical","input":"Show the named exchange session for the selected entry event.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-02","caseType":"formal_paraphrase","input":"Classify the selected execution event using an authoritative exchange-session taxonomy.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-03","caseType":"conversational_paraphrase","input":"Was the selected entry in the regular trading session?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-04","caseType":"trader_slang","input":"Was that selected entry RTH or after hours?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-05","caseType":"abbreviation","input":"Show RTH/ETH session for the explicitly selected event.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit named-session grammar","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-06","caseType":"misspelling","input":"Show the exchage sesion for the selected event.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-07","caseType":"noisy_input","input":"selected entry rth or ah pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-08","caseType":"command","input":"Return the named venue session for the selected final-exit event.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-09","caseType":"fragment","input":"Selected event exchange session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-10","caseType":"follow_up","input":"For that trusted prior selected entry event, what named session was it in?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":["trusted prior selected entry event"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected event context","expectedContextRequirements":["explicit trusted prior event context","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-11","caseType":"correction","input":"For that trusted result, I meant named exchange session, not a local clock bucket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-12","caseType":"comparison","input":"Compare named sessions for the two trusted selected events.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["session"],"expectedFilters":["trusted first event","trusted second event"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage","unavailable session comparison"],"expectedComparison":{"left":"trusted first event","right":"trusted second event","basis":"session"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted selected events","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-13","caseType":"ranking","input":"Rank named sessions by trade count for the trusted compatible population.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["session"],"expectedFilters":["trusted compatible population"],"expectedGroupings":["named exchange session"],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage","unavailable grouping and ranking"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-14","caseType":"negation","input":"Show named session, not account-local time bucket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":["exclude local-clock-bucket interpretation"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage","exclude fallback meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-15","caseType":"exclusion","input":"Show named sessions excluding RTH.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":["exclude named RTH session"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage","unavailable named-session filter"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-16","caseType":"multi_filter","input":"Show the selected entry's named session for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":["trusted selected ticker","trusted declared period","explicit entry event"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":"trusted declared period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker, period, and event context","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-17","caseType":"multi_part","input":"For the trusted selected event, show entry time and named session with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["session","entry_time"],"expectedFilters":["trusted selected event"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage","supported entry-time component","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected event context","expectedContextRequirements":["explicit trusted selected event context","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Entry time may render from raw UTC in the account timezone, but the named session component remains Unavailable; do not suppress either state or invent a fallback."},{"caseId":"C7-E7-18","caseType":"ambiguity","input":"Which session was that?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved meaning of session","server-authorized compatible account scope"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean a named exchange or venue session, or an account-local clock-time bucket?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one meaning-field question. Do not invent an event, date, venue, or silently route to a local bucket."},{"caseId":"C7-E7-19","caseType":"negative_example","input":"Which market session should I trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed session"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed session selection are unsupported; unavailable historical session classification cannot recommend when to trade.","notes":"This is advice, not a factual session request; do not infer a preferred session."},{"caseId":"C7-E7-20","caseType":"unsupported_data","input":"Classify the event as regular hours using fixed local clock times.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","authoritative venue/session/calendar facts required","no local-clock fallback"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Fixed clock windows, account-local buckets, browser time, and assumed US-equity hours cannot establish a named exchange session."},{"caseId":"C7-E7-21","caseType":"selected_entity_context","input":"For the trusted selected event, show its named exchange session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["session"],"expectedFilters":["trusted selected event"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected event context","expectedContextRequirements":["explicit trusted selected event context","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Recognize named exchange or venue session language and return Unavailable with the exact missing-fact reason. Never fall back to account-local clock buckets, entry_weekday, fixed US-equity hours, browser time, or an inferred date/session."},{"caseId":"C7-E7-22","caseType":"cross_category","input":"Explain why the trusted event's entry time can render locally while its named exchange session remains unavailable.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["session","entry_time"],"expectedFilters":["trusted selected event"],"expectedGroupings":[],"expectedOperators":["return Unavailable for named exchange or venue session classification with exact missing-fact coverage","cross-category boundary explanation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected event context","expectedContextRequirements":["explicit trusted selected event context","server-authorized compatible account and account-IANA timezone scope","explicit entry or final-exit event raw UTC instant","accepted venue identity, session taxonomy, and authoritative calendar facts are required but absent","entry_time raw-UTC and account-IANA display boundary"],"expectedCapabilityStatus":"Unavailable","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Named exchange or venue session is unavailable because accepted venue identity, a versioned session taxonomy, and authoritative calendar, holiday, exception, timezone, and DST rules are absent; account-local clock buckets cannot be relabelled as sessions.","notes":"Explain the factual boundary: a timestamp and local display do not supply venue taxonomy or calendar facts, and no session fallback is allowed."}]
```

### `weekday`

```json
[{"caseId":"C7-E8-01","caseType":"canonical","input":"Show the final-exit weekday for the selected ready-closed lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-02","caseType":"formal_paraphrase","input":"Return the account-local weekday of the explicitly selected final-exit event.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-03","caseType":"conversational_paraphrase","input":"Which day of the week did the selected trade finally close?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-04","caseType":"trader_slang","input":"What DOW did I flatten the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-05","caseType":"abbreviation","input":"Show final-exit DOW for the selected lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit final-exit weekday grammar","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-06","caseType":"misspelling","input":"Show the final-exit weekdy.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-07","caseType":"noisy_input","input":"selected trade close dow pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-08","caseType":"command","input":"Return the selected final exit's account-local weekday.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-09","caseType":"fragment","input":"Final-exit weekday.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-10","caseType":"follow_up","input":"For that trusted prior selected final-exit event, what weekday was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["trusted prior selected final-exit event"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected event context","expectedContextRequirements":["explicit trusted prior event context","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-11","caseType":"correction","input":"For that trusted result, I meant final-exit weekday, not entry_weekday.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-12","caseType":"comparison","input":"Compare final-exit weekdays for the two trusted selected populations.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["trusted first population","trusted second population","explicit final-exit event"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday","planned weekday comparison"],"expectedComparison":{"left":"trusted first population","right":"trusted second population","basis":"final-exit weekday"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible populations","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-13","caseType":"ranking","input":"Rank trusted final-exit weekday groups by trade count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["explicit final-exit event"],"expectedGroupings":["planned account-local final-exit weekday"],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population and event context","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-14","caseType":"negation","input":"Show final-exit weekday, not entry_weekday.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["exclude entry-event interpretation"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday","exclude alternate event"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-15","caseType":"exclusion","input":"Show final-exit weekday excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["exclude trusted selected ticker","explicit final-exit event"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and event context","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-16","caseType":"multi_filter","input":"Show final-exit weekday for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["trusted selected ticker","trusted declared period","explicit final-exit event"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker, period, and event context","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-17","caseType":"multi_part","input":"For the trusted selected population, show final-exit weekday and the distinct entry_weekday result with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["weekday","entry_weekday"],"expectedFilters":["trusted selected population","explicit entry and final-exit events"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday","distinct supported entry_weekday component","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected population context","expectedContextRequirements":["explicit trusted population and both event contexts","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-18","caseType":"ambiguity","input":"Which weekday was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved lifecycle event","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the first-entry weekday or the final-exit weekday?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one event-field question. Do not invent a date or silently map generic weekday to entry_weekday or closing weekday."},{"caseId":"C7-E8-19","caseType":"negative_example","input":"Which weekday should I trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed weekday"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed weekday selection are unsupported; a historical weekday classification cannot recommend when to trade.","notes":"This is advice, not a factual weekday request; do not infer a best day."},{"caseId":"C7-E8-20","caseType":"unsupported_data","input":"Silently use entry_weekday for an unqualified weekday request.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and clarify event"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit or trusted lifecycle event required","no generic-to-entry_weekday fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic weekday is Planned and has no entry-versus-final-exit default; entry_weekday may be used only when entry is explicit, while final-exit weekday requires a ready_closed final exit.","notes":"Keep legitimate_open and needs_decision coverage visible. Missing event/timezone facts never become an inferred weekday."},{"caseId":"C7-E8-21","caseType":"selected_entity_context","input":"For the trusted selected final-exit event, show weekday.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["weekday"],"expectedFilters":["trusted selected final-exit event"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected event context","expectedContextRequirements":["explicit trusted selected final-exit context","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep generic weekday Planned and require the event to be explicit or trusted. Never silently choose entry versus final exit or substitute the supported entry_weekday primitive. Convert raw UTC to the authorized account IANA timezone before weekday display and retain open/decision coverage."},{"caseId":"C7-E8-22","caseType":"cross_category","input":"Explain why explicit entry weekday can use entry_weekday while generic weekday remains Planned.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["weekday","entry_weekday"],"expectedFilters":["explicit entry-weekday interpretation"],"expectedGroupings":[],"expectedOperators":["planned conversion of an explicitly selected event raw UTC instant to account-IANA local weekday","cross-category capability-boundary explanation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted event context","expectedContextRequirements":["explicit entry-event context","server-authorized compatible account and account-IANA timezone scope","explicit first-entry or final-exit event and accepted raw UTC instant","generic or final-exit weekday contract remains Planned; explicit entry_weekday is a distinct supported primitive"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explain the distinct capability states without relabelling entry_weekday as generic or final-exit weekday and without inventing a date or result."}]
```

### `week`

```json
[{"caseId":"C7-E9-01","caseType":"canonical","input":"Show the selected closed trade's ISO closing week-year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-02","caseType":"formal_paraphrase","input":"Return the ISO week-year and week number of the selected lifecycle's account-local final-exit date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-03","caseType":"conversational_paraphrase","input":"Which ISO week did the selected trade finally close in?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-04","caseType":"trader_slang","input":"What ISO week did I flatten that selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-05","caseType":"abbreviation","input":"Show final-exit ISO week key (YYYY-Www).","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit ISO closing-week grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-06","caseType":"misspelling","input":"Show the selected trade's ISO weak-year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-07","caseType":"noisy_input","input":"selected close iso wk yr pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-08","caseType":"command","input":"Return the selected lifecycle's account-local ISO closing week.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-09","caseType":"fragment","input":"Final-exit ISO week-year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-10","caseType":"follow_up","input":"For that trusted prior selected ready-closed lifecycle, what was its ISO closing week-year?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":["trusted prior selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-11","caseType":"correction","input":"For that trusted result, I meant ISO final-exit week-year, not entry week or calendar year alone.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-12","caseType":"comparison","input":"Compare ISO closing-week groups for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["week"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":["ISO final-exit week-year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number","exact group comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"ISO closing week-year"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-13","caseType":"ranking","input":"Rank trusted ISO closing-week groups by ready-closed trade count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":["ISO final-exit week-year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-14","caseType":"negation","input":"Show ISO closing week, not entry week.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":["exclude entry-date interpretation"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number","exclude alternate event"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-15","caseType":"exclusion","input":"Show ISO closing-week groups excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":["ISO final-exit week-year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-16","caseType":"multi_filter","input":"Show ISO closing week for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":["trusted selected ticker","trusted declared closing-date period"],"expectedGroupings":["ISO final-exit week-year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and closing-date period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-17","caseType":"multi_part","input":"For the trusted selected population, show ready-closed count and net P&L by ISO closing week with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["week","net_pnl"],"expectedFilters":["trusted selected population"],"expectedGroupings":["ISO final-exit week-year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number","exact ready_closed count","compatible net P&L aggregation","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-18","caseType":"ambiguity","input":"Which week was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved week meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the ISO week-year of the final exit, or a named or relative week date range?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one week-meaning question. Do not invent a lifecycle, date, year, entry event, or calendar-year-only key."},{"caseId":"C7-E9-19","caseType":"negative_example","input":"Which ISO week should I trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed week"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed week selection are unsupported; a historical ISO closing-week grouping cannot recommend when to trade.","notes":"This is advice, not a factual ISO-week request; do not infer a best week."},{"caseId":"C7-E9-20","caseType":"unsupported_data","input":"Assign the current ISO week as the closing week for open and decision trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted ready_closed final-flat raw UTC instant required","open and decision rows never receive as-of closing weeks"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"ISO closing week requires an accepted final-flat instant for a ready_closed lifecycle; legitimate_open and needs_decision rows cannot receive the current week, an estimate, calendar year alone, or zero as a closing-week key.","notes":"An explicitly resolved week can have exact zero count only with complete coverage; active grouping does not synthesize empty weeks."},{"caseId":"C7-E9-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed lifecycle, show ISO closing week-year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["week"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use the ready_closed final-exit raw UTC instant, convert it with the effective account-IANA offset/DST, then derive the ISO week-year and ISO week number. Never use entry date, UTC date, calendar year alone, rolling seven days, or as-of values for open/decision rows. Explicit zero and grouped-empty behavior require complete coverage."},{"caseId":"C7-E9-22","caseType":"cross_category","input":"Compare net P&L across the trusted ISO closing-week groups without treating week membership as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","explain_result"],"expectedCanonicalConcepts":["week","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":["ISO final-exit week-year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive ISO week-year plus ISO week number","compatible net P&L comparison","descriptive cross-category explanation"],"expectedComparison":{"left":"trusted ISO closing-week groups","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","ISO week-date rules, final-exit event, and legitimate_open/needs_decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep ISO week membership and compatible money results separate; show count/coverage and make no seasonality, causal, predictive, or advisory claim."}]
```

### `month`

```json
[{"caseId":"C7-E10-01","caseType":"canonical","input":"Show the selected closed trade's local closing month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-02","caseType":"formal_paraphrase","input":"Return the YYYY-MM calendar key of the selected lifecycle's account-local final-exit date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-03","caseType":"conversational_paraphrase","input":"Which local calendar month did the selected trade finally close in?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-04","caseType":"trader_slang","input":"What month did I flatten that selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-05","caseType":"abbreviation","input":"Show final-exit month key (YYYY-MM).","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit closing-month grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-06","caseType":"misspelling","input":"Show the selected trade's closing mnth.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-07","caseType":"noisy_input","input":"selected close local mo pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-08","caseType":"command","input":"Return the selected ready-closed lifecycle's account-local closing month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-09","caseType":"fragment","input":"Final-exit calendar month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-10","caseType":"follow_up","input":"For that trusted prior selected ready-closed lifecycle, what was its closing month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":["trusted prior selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-11","caseType":"correction","input":"For that trusted result, I meant final-exit calendar month, not entry month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-12","caseType":"comparison","input":"Compare closing-month groups for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["month"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":["account-local final-exit calendar month"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM","exact group comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"closing month"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-13","caseType":"ranking","input":"Rank trusted closing-month groups by ready-closed trade count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":["account-local final-exit calendar month"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-14","caseType":"negation","input":"Show closing month, not entry month or rolling 30 days.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":["exclude entry-month and rolling-range interpretations"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-15","caseType":"exclusion","input":"Show closing-month groups excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":["account-local final-exit calendar month"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-16","caseType":"multi_filter","input":"Show closing month for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":["trusted selected ticker","trusted declared closing-date period"],"expectedGroupings":["account-local final-exit calendar month"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and closing-date period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-17","caseType":"multi_part","input":"For the trusted selected population, show ready-closed count and net P&L by closing month with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["month","net_pnl"],"expectedFilters":["trusted selected population"],"expectedGroupings":["account-local final-exit calendar month"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM","exact ready_closed count","compatible net P&L aggregation","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-18","caseType":"ambiguity","input":"Which month was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved month meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the calendar month of the final exit, or a named or relative month date range?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one month-meaning question. Do not invent a lifecycle, date, year, entry event, rolling range, or browser-local bucket."},{"caseId":"C7-E10-19","caseType":"negative_example","input":"Which month should I trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed month"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed month selection are unsupported; a historical closing-month grouping cannot recommend when to trade.","notes":"This is advice, not a factual closing-month request; do not infer seasonality or a best month."},{"caseId":"C7-E10-20","caseType":"unsupported_data","input":"Assign the current month as closing month for open and decision trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted ready_closed final-flat raw UTC instant required","open and decision rows never receive as-of closing months"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Closing month requires an accepted final-flat instant for a ready_closed lifecycle; legitimate_open and needs_decision rows cannot receive the current month, an estimate, UTC/browser month, or zero as a closing key.","notes":"An explicitly resolved month can have exact zero count only with complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed lifecycle, show closing month.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["month"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return YYYY-MM. Never substitute entry month, UTC/browser month, rolling 30 days, statement/fiscal month, or an as-of month for open/decision rows. Exact zero for an explicitly resolved month requires complete coverage; active grouping does not synthesize empty months."},{"caseId":"C7-E10-22","caseType":"cross_category","input":"Compare net P&L across the trusted closing-month groups without treating month membership as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","explain_result"],"expectedCanonicalConcepts":["month","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":["account-local final-exit calendar month"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive calendar month key YYYY-MM","compatible net P&L comparison","descriptive cross-category explanation"],"expectedComparison":{"left":"trusted closing-month groups","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep local calendar-month membership and compatible money results separate; show count/coverage and make no seasonal, causal, predictive, or advisory claim."}]
```

### `quarter`

```json
[{"caseId":"C7-E11-01","caseType":"canonical","input":"Show the selected closed trade's local closing quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-02","caseType":"formal_paraphrase","input":"Return the planned YYYY-Qn key from the selected lifecycle's account-local final-exit date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-03","caseType":"conversational_paraphrase","input":"Which local calendar quarter did the selected trade finally close in?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-04","caseType":"trader_slang","input":"What quarter did I flatten that selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-05","caseType":"abbreviation","input":"Show final-exit calendar qtr key (YYYY-Qn).","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit closing-calendar-quarter grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-06","caseType":"misspelling","input":"Show the selected trade's closing quater.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-07","caseType":"noisy_input","input":"selected close cal qtr pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-08","caseType":"command","input":"Return the selected ready-closed lifecycle's planned closing quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-09","caseType":"fragment","input":"Final-exit calendar quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-10","caseType":"follow_up","input":"For that trusted prior selected ready-closed lifecycle, what was its closing quarter?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":["trusted prior selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-11","caseType":"correction","input":"For that trusted result, I meant final-exit calendar quarter, not entry or fiscal quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-12","caseType":"comparison","input":"Compare planned closing-quarter groups for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["quarter"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":["planned account-local final-exit calendar quarter"],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn","planned exact group comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"closing calendar quarter"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-13","caseType":"ranking","input":"Rank trusted planned closing-quarter groups by ready-closed trade count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":["planned account-local final-exit calendar quarter"],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-14","caseType":"negation","input":"Show closing calendar quarter, not entry quarter or rolling three months.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":["exclude entry-quarter and rolling-range interpretations"],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-15","caseType":"exclusion","input":"Show planned closing-quarter groups excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":["planned account-local final-exit calendar quarter"],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-16","caseType":"multi_filter","input":"Show planned closing quarter for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":["trusted selected ticker","trusted declared closing-date period"],"expectedGroupings":["planned account-local final-exit calendar quarter"],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and closing-date period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-17","caseType":"multi_part","input":"For the trusted selected population, show ready-closed count and net P&L by planned closing quarter with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["quarter","net_pnl"],"expectedFilters":["trusted selected population"],"expectedGroupings":["planned account-local final-exit calendar quarter"],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn","exact ready_closed count","compatible net P&L aggregation","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-18","caseType":"ambiguity","input":"Which quarter was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved quarter meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the local calendar quarter of the final exit, or the entry quarter?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one event-field question. Do not invent a date/year, fiscal calendar, rolling range, current quarter, or named capability."},{"caseId":"C7-E11-19","caseType":"negative_example","input":"Which quarter should I trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed quarter"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed quarter selection are unsupported; a historical planned closing-quarter grouping cannot recommend when to trade.","notes":"This is advice, not a factual planned-quarter request; do not infer seasonality or a best quarter."},{"caseId":"C7-E11-20","caseType":"unsupported_data","input":"Return quarter results now despite the absent named contract and use current quarter for open rows.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted ready_closed final-flat raw UTC instant and named quarter contract required","open and decision rows never receive as-of closing quarters"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Closing quarter remains Planned because the accepted named query/group contract is absent; open, needs_decision, missing-final-exit, unauthorized, or incompatible rows cannot receive a current, estimated, entry, fiscal, or rolling quarter.","notes":"Do not claim current support merely because local closing date is derivable. Explicit zero and empty-quarter behavior require the future named contract and complete coverage."},{"caseId":"C7-E11-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed lifecycle, show planned closing quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["quarter"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize the Planned final-exit local calendar-quarter meaning without claiming current named support. Convert raw UTC to the authorized account-IANA local date with effective offset/DST, then map month to YYYY-Q1 through YYYY-Q4. Never substitute entry quarter, current/as-of quarter, rolling three months, fiscal/earnings quarter, or an inferred date."},{"caseId":"C7-E11-22","caseType":"cross_category","input":"Compare net P&L across the trusted planned closing-quarter groups without treating quarter membership as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","explain_result"],"expectedCanonicalConcepts":["quarter","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":["planned account-local final-exit calendar quarter"],"expectedOperators":["planned conversion of final-exit raw UTC to account-IANA local calendar quarter key YYYY-Qn","compatible net P&L comparison","descriptive cross-category explanation"],"expectedComparison":{"left":"trusted planned closing-quarter groups","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date derivation plus absent named quarter query/group contract and open/decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned quarter and compatible money result separate; show count/coverage and make no current-support, seasonal, causal, predictive, or advisory claim."}]
```

### `year`

```json
[{"caseId":"C7-E12-01","caseType":"canonical","input":"Show the selected closed trade's local closing calendar year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-02","caseType":"formal_paraphrase","input":"Return the four-digit calendar year of the selected lifecycle's account-local final-exit date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-03","caseType":"conversational_paraphrase","input":"Which local calendar year did the selected trade finally close in?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-04","caseType":"trader_slang","input":"What year did I flatten that selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-05","caseType":"abbreviation","input":"Show final-exit calendar yr (YYYY).","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit closing-calendar-year grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-06","caseType":"misspelling","input":"Show the selected trade's closing yaer.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-07","caseType":"noisy_input","input":"selected close local yr pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-08","caseType":"command","input":"Return the selected ready-closed lifecycle's account-local closing year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-09","caseType":"fragment","input":"Final-exit calendar year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-10","caseType":"follow_up","input":"For that trusted prior selected ready-closed lifecycle, what was its closing year?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":["trusted prior selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-11","caseType":"correction","input":"For that trusted result, I meant final-exit calendar year, not entry year or ISO week-year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-12","caseType":"comparison","input":"Compare closing-year groups for the two trusted compatible selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["year"],"expectedFilters":["trusted first selection","trusted second selection"],"expectedGroupings":["account-local final-exit calendar year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year","exact group comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"closing calendar year"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible selections","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-13","caseType":"ranking","input":"Rank trusted closing-year groups by ready-closed trade count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":["account-local final-exit calendar year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year","descending exact count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-14","caseType":"negation","input":"Show closing calendar year, not entry year or trailing twelve months.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":["exclude entry-year and rolling-range interpretations"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-15","caseType":"exclusion","input":"Show closing-year groups excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":["account-local final-exit calendar year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-16","caseType":"multi_filter","input":"Show closing year for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":["trusted selected ticker","trusted declared closing-date period"],"expectedGroupings":["account-local final-exit calendar year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and closing-date period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-17","caseType":"multi_part","input":"For the trusted selected population, show ready-closed count and net P&L by closing year with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["year","net_pnl"],"expectedFilters":["trusted selected population"],"expectedGroupings":["account-local final-exit calendar year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year","exact ready_closed count","compatible net P&L aggregation","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-18","caseType":"ambiguity","input":"Which year was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved year meaning","server-authorized compatible account scope"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the local calendar year of the final exit, or the entry year?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one event-field question. Do not invent a lifecycle, date, ISO week-year, fiscal/tax calendar, YTD, rolling range, or current year."},{"caseId":"C7-E12-19","caseType":"negative_example","input":"Which year should I trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed year"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed year selection are unsupported; a historical closing-year grouping cannot recommend when to trade.","notes":"This is advice, not a factual closing-year request; do not infer a best year or trend."},{"caseId":"C7-E12-20","caseType":"unsupported_data","input":"Assign the current calendar year as closing year for open and decision trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted ready_closed final-flat raw UTC instant required","open and decision rows never receive as-of closing years"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Closing year requires an accepted final-flat instant for a ready_closed lifecycle; legitimate_open and needs_decision rows cannot receive the current year, an estimate, ISO week-year, UTC/browser year, or zero as a closing key.","notes":"An explicitly resolved calendar year can have exact zero count only with complete coverage; active grouping does not synthesize empty years."},{"caseId":"C7-E12-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed lifecycle, show closing calendar year.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["year"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Use only the ready_closed final-exit raw UTC instant, convert it to the authorized account-IANA local date with effective offset/DST, and return its four-digit calendar year. Never substitute entry year, UTC/browser year, ISO week-year, fiscal/tax year, YTD, trailing 12 months, or an as-of year for open/decision rows."},{"caseId":"C7-E12-22","caseType":"cross_category","input":"Compare net P&L across the trusted closing-year groups without treating year membership as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","explain_result"],"expectedCanonicalConcepts":["year","net_pnl"],"expectedFilters":["trusted compatible population"],"expectedGroupings":["account-local final-exit calendar year"],"expectedOperators":["convert final-exit raw UTC to account-IANA local date and derive four-digit calendar year","compatible net P&L comparison","descriptive cross-category explanation"],"expectedComparison":{"left":"trusted closing-year groups","right":"net_pnl","basis":"trusted compatible population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted compatible population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted final-flat raw UTC instant","final-exit local calendar-date conversion with effective IANA offset and DST plus open/decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Supported","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep local calendar-year membership and compatible money results separate; show count/coverage and make no trend, causal, predictive, or advisory claim."}]
```

### `days_held`

```json
[{"caseId":"C7-E13-01","caseType":"canonical","input":"Show days held for the selected ready-closed lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-02","caseType":"formal_paraphrase","input":"Return the exact account-local calendar-date boundaries crossed from first entry to final exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-03","caseType":"conversational_paraphrase","input":"How many local calendar days did I hold the selected closed trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-04","caseType":"trader_slang","input":"How many overnights did that selected trade cross by local date?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-05","caseType":"abbreviation","input":"Show cal days held for the selected closed lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit calendar-days-held grammar","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-06","caseType":"misspelling","input":"Show dayz heald for the selected trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-07","caseType":"noisy_input","input":"selected closed trade local days held pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-08","caseType":"command","input":"Calculate local date boundaries from first opening to final flat.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-09","caseType":"fragment","input":"Entry-date to exit-date boundaries.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-10","caseType":"follow_up","input":"For that trusted prior selected ready-closed lifecycle, how many local days was it held?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["trusted prior selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior selected lifecycle context","expectedContextRequirements":["explicit trusted prior ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-11","caseType":"correction","input":"For that trusted result, I meant local date boundaries, not elapsed 24-hour periods.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-12","caseType":"comparison","input":"Compare days held for the two trusted selected ready-closed lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["trusted first ready-closed lifecycle","trusted second ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date","planned exact integer comparison"],"expectedComparison":{"left":"trusted first lifecycle","right":"trusted second lifecycle","basis":"days_held"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted ready-closed lifecycles","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-13","caseType":"ranking","input":"Rank the trusted selected ready-closed lifecycles by days held.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["trusted selected ready-closed lifecycles"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date","descending exact integer","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ready-closed lifecycle set","expectedContextRequirements":["explicit trusted ready-closed lifecycle set","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-14","caseType":"negation","input":"Show days held, not elapsed seconds or inclusive dates touched.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["exclude elapsed-duration and inclusive-date interpretations"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-15","caseType":"exclusion","input":"Show days held excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-16","caseType":"multi_filter","input":"Show days held for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["trusted selected ticker","trusted declared closing-date period"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and period context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-17","caseType":"multi_part","input":"For the trusted current and prior selections, compare days held and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["trusted current selection","trusted prior selection"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date","planned exact integer comparison","coverage inspection"],"expectedComparison":{"left":"trusted current selection","right":"trusted prior selection","basis":"days_held"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior selection context","expectedContextRequirements":["explicit trusted current and prior selection context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-18","caseType":"ambiguity","input":"How many days did that trade last?",
"expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved duration basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean account-local calendar-date boundaries crossed or exact elapsed time?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one duration-basis question. Do not invent a lifecycle, date, timezone, 24-hour division, or open-age endpoint."},{"caseId":"C7-E13-19","caseType":"negative_example","input":"How many days should I hold my next trade?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed holding period"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed holding periods are unsupported; historical calendar days held cannot recommend a future action.","notes":"This is advice, not a factual calendar-boundary request; do not infer an ideal hold."},{"caseId":"C7-E13-20","caseType":"unsupported_data","input":"Divide hold seconds by 86400 and use now as the final exit for an open position.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","accepted ready_closed first-opening and final-flat raw UTC instants required","no fixed-day division or open-position as-of endpoint"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Days held requires a ready_closed lifecycle and separate account-IANA local entry and final-exit dates; open, needs_decision, missing, reversed, or incompatible endpoints cannot use now, elapsed seconds divided by 86400, or an estimate.","notes":"A complete same-local-date lifecycle may yield exact zero; missing or open endpoints never become zero. DST-short and DST-long nights still use date boundaries."},{"caseId":"C7-E13-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed lifecycle, show days held.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["days_held"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned days held as the exact non-negative number of account-local calendar-date boundaries crossed from first entry to final exit. Same local date is zero and the next local date is one. Never divide elapsed seconds by 86400, count inclusive dates, infer sessions, or assign completed age to open/decision rows."},{"caseId":"C7-E13-22","caseType":"cross_category","input":"Compare the trusted trade's days held with net P&L without treating calendar duration as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["days_held","net_pnl"],"expectedFilters":["trusted selected ready-closed lifecycle"],"expectedGroupings":[],"expectedOperators":["planned exact difference between account-IANA local final-exit date and local first-entry date","descriptive cross-category comparison"],"expectedComparison":{"left":"days_held","right":"net_pnl","basis":"trusted selected lifecycle"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ready-closed lifecycle context","expectedContextRequirements":["explicit trusted selected ready-closed context","server-authorized compatible account and account-IANA timezone scope","eligible ready_closed lifecycle with accepted first-entry and final-flat raw UTC instants","effective IANA offset and DST applied separately before local-date subtraction plus open/decision coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned local-date-boundary value and compatible money fact separate; do not claim current runtime, causation, quality, or advice."}]
```

### `trades_per_day`

```json
[{"caseId":"C7-E14-01","caseType":"canonical","input":"Show the ready-closed trade count for each explicitly declared local closing date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-02","caseType":"formal_paraphrase","input":"Return the exact eligible round-trip lifecycle count per declared account-local final-exit date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-03","caseType":"conversational_paraphrase","input":"How many completed trades closed on each selected local day?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-04","caseType":"trader_slang","input":"What was my daily completed round-trip count?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-05","caseType":"abbreviation","input":"Show TPD as ready-closed trades per declared closing date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit trades-per-day lifecycle-count grammar","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-06","caseType":"misspelling","input":"Show trads per dey for the declared closing dates.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-07","caseType":"noisy_input","input":"closed trades daily count pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-08","caseType":"command","input":"Count each eligible completed round trip once per local closing date.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-09","caseType":"fragment","input":"Daily ready-closed lifecycle count.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-10","caseType":"follow_up","input":"For that trusted prior declared closing date, how many ready-closed trades were there?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":["trusted prior declared closing date"],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":"trusted prior declared closing date","expectedSelectedEntity":"trusted prior closing-date context","expectedContextRequirements":["explicit trusted prior closing-date context","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-11","caseType":"correction","input":"For that trusted result, I meant completed round trips per closing date, not executions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-12","caseType":"comparison","input":"Compare trades per day across the two trusted declared closing-date selections.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":["trusted first closing-date selection","trusted second closing-date selection"],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date","planned exact count-series comparison"],"expectedComparison":{"left":"trusted first selection","right":"trusted second selection","basis":"trades_per_day"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted closing-date selections","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-13","caseType":"ranking","input":"Rank the trusted declared closing dates by ready-closed trade count.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["group_and_aggregate","calculate_metric"],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":["explicitly declared account-local closing date"],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date","descending exact integer count","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted declared closing-date set","expectedContextRequirements":["explicit trusted closing-date set","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-14","caseType":"negation","input":"Show trades per day, not executions per day or a calendar-day average.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":["exclude execution-count and average interpretations"],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-15","caseType":"exclusion","input":"Show trades per day excluding the trusted selected ticker.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":["exclude trusted selected ticker"],"expectedGroupings":["explicitly declared account-local closing date"],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted selected ticker context","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-16","caseType":"multi_filter","input":"Show trades per day for the trusted selected ticker and trusted declared closing-date range.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":["trusted selected ticker","trusted declared closing-date range"],"expectedGroupings":["explicitly declared account-local closing date"],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":"trusted declared closing-date range","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted ticker and closing-date-range context","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-17","caseType":"multi_part","input":"For the trusted selected closing dates, show ready-closed count and net P&L per day with coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["trades_per_day","net_pnl"],"expectedFilters":["trusted selected closing dates"],"expectedGroupings":["explicitly declared account-local closing date"],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date","compatible net P&L aggregation","coverage inspection"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted closing-date context","expectedContextRequirements":["explicit trusted compatible closing-date context","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-18","caseType":"ambiguity","input":"How many trades per day?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved daily-count presentation","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you want one completed round-trip count for each closing date, or an average across days?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one presentation-field question. Do not invent dates, an active/calendar-day denominator, execution counts, or empty-day filling."},{"caseId":"C7-E14-19","caseType":"negative_example","input":"How many trades should I take per day?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed daily limit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed daily trade limits are unsupported; historical completed round-trip counts cannot recommend how many trades to take.","notes":"This is advice, not a factual per-closing-date count; do not diagnose overtrading."},{"caseId":"C7-E14-20","caseType":"unsupported_data","input":"Count executions and open trades, fill missing calendar days with zero, and average the series.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit closing-date series and eligible ready_closed lifecycle population required","no execution substitution, open/decision count, calendar filling, or implicit average"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trades per day counts eligible ready_closed round trips once per explicitly declared local closing date; executions, orders, open, needs_decision, synthetic empty dates, and undeclared calendar or active-day averages cannot be substituted.","notes":"Exact zero is valid only for an explicitly declared date with complete applicable coverage; an empty or missing date-series contract is not zero."},{"caseId":"C7-E14-21","caseType":"selected_entity_context","input":"For the trusted explicitly declared local closing date, show trades per day.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trades_per_day"],"expectedFilters":["trusted declared local closing date"],"expectedGroupings":[],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date"],"expectedComparison":null,"expectedTimeRange":"trusted declared local closing date","expectedSelectedEntity":"trusted server-authorized closing-date context","expectedContextRequirements":["explicit trusted closing-date context","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned trades per day as one exact ready_closed round-trip count for each explicitly declared account-local final-exit date. Never count executions, orders, entries, exits, symbols, open/decision rows, or silently calculate an average. An explicitly declared date may be exact zero only with complete coverage; an active-day series does not synthesize empty calendar dates."},{"caseId":"C7-E14-22","caseType":"cross_category","input":"Compare the trusted daily ready-closed counts with net P&L without treating activity as causal.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["group_and_aggregate","calculate_metric","explain_result"],"expectedCanonicalConcepts":["trades_per_day","net_pnl"],"expectedFilters":["trusted compatible closing-date selection"],"expectedGroupings":["explicitly declared account-local closing date"],"expectedOperators":["planned exact count of eligible ready_closed round trips per explicitly declared account-local final-exit date","compatible net P&L comparison","descriptive cross-category explanation"],"expectedComparison":{"left":"trades_per_day","right":"net_pnl","basis":"trusted compatible closing-date selection"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted closing-date context","expectedContextRequirements":["explicit trusted compatible closing-date context","server-authorized compatible account and account-IANA timezone scope","explicitly declared account-local closing date or closing-date range","eligible current ready_closed round trips counted once with legitimate_open and needs_decision coverage retained","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned daily lifecycle count and compatible money results separate; show zero/empty/coverage states and make no causal, behavioral, predictive, or advisory claim."}]
```

### `time_between_trades`

```json
[{"caseId":"C7-E15-01","caseType":"canonical","input":"Show time between the selected current lifecycle and its exact immediate predecessor.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-02","caseType":"formal_paraphrase","input":"Calculate the positive raw-UTC gap from the exact first-entry-ordered predecessor's final exit to the current first entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-03","caseType":"conversational_paraphrase","input":"How long after the trade right before it did this selected trade begin?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-04","caseType":"trader_slang","input":"What was the gap from the previous trade's flatten to this trade's entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-05","caseType":"abbreviation","input":"Show TBT for the explicitly selected current lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit between-lifecycle interval grammar","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-06","caseType":"misspelling","input":"Show time betwen trads for the selected current lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-07","caseType":"noisy_input","input":"selected trade gap from exact prev pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-08","caseType":"command","input":"Select the immediate predecessor before filters and calculate its final-exit-to-current-entry gap.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-09","caseType":"fragment","input":"Exact predecessor gap.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-10","caseType":"follow_up","input":"For that trusted prior selected current lifecycle, what was its time between trades?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["trusted prior selected current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior current-lifecycle context","expectedContextRequirements":["explicit trusted prior current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-11","caseType":"correction","input":"For that trusted result, I meant exact predecessor final exit to current first entry, not entry to entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-12","caseType":"comparison","input":"Compare time-between-trades gaps for the two trusted selected current lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["trusted first current lifecycle","trusted second current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction","planned exact interval comparison"],"expectedComparison":{"left":"trusted first current lifecycle","right":"trusted second current lifecycle","basis":"time_between_trades"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted current-lifecycle selections","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-13","caseType":"ranking","input":"Rank trusted selected current lifecycles by time since their exact predecessors.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["trusted selected current lifecycles"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction","descending exact positive seconds","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted current-lifecycle set","expectedContextRequirements":["explicit trusted current-lifecycle set","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-14","caseType":"negation","input":"Show time between trades without entry-to-entry or eligible-predecessor substitution.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["exclude entry-spacing and eligible-first interpretations"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-15","caseType":"exclusion","input":"Show time-between gaps excluding the trusted selected ticker from current results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["exclude trusted selected ticker from current result rows only"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-16","caseType":"multi_filter","input":"Show time-between gaps for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["trusted selected ticker on current results","trusted declared period on current results"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":"trusted declared current-result period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker and period context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-17","caseType":"multi_part","input":"For the trusted current and prior result selections, compare time-between gaps and include barrier coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["trusted current result selection","trusted prior result selection"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction","planned exact interval comparison","barrier and overlap coverage inspection"],"expectedComparison":{"left":"trusted current result selection","right":"trusted prior result selection","basis":"time_between_trades"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior result context","expectedContextRequirements":["explicit trusted current and prior result context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-18","caseType":"ambiguity","input":"How much time was between the trades?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved interval basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the lifecycle gap from the exact previous final exit to the current first entry, or spacing between executions?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one interval-basis question. Do not invent a date, current lifecycle, execution mapping, or eligible predecessor."},{"caseId":"C7-E15-19","caseType":"negative_example","input":"How long should I wait between trades?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, behavior rule, or prescribed waiting interval"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed waiting intervals are unsupported; a historical between-trade gap cannot recommend a cooldown or future action.","notes":"This is advice, not a factual interval request; do not infer discipline, intent, or a required wait."},{"caseId":"C7-E15-20","caseType":"unsupported_data","input":"Skip the open predecessor, search farther back for a closed trade, and clamp any negative gap to zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The exact immediate predecessor is selected from all authorized current candidates before analytic filters and must be ready_closed; a non-ready predecessor is an unskippable barrier, and zero or negative overlap is unavailable rather than clamped or searched past.","notes":"No predecessor, missing endpoints, current needs_decision, incompatible scope, or overlap is explicit coverage, never zero. A current legitimate_open may qualify only from its accepted first entry when its exact predecessor qualifies."},{"caseId":"C7-E15-21","caseType":"selected_entity_context","input":"For the trusted selected current lifecycle, show time between trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_between_trades"],"expectedFilters":["trusted selected current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected current-lifecycle context","expectedContextRequirements":["explicit trusted selected current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time between trades using the exact immediate predecessor from the complete authorized current-candidate order before analytic filters. Compute current first-entry UTC minus that ready_closed predecessor's final-exit UTC only when positive. Never order by close/import/local time, skip a non-ready barrier, search farther back, or clamp overlap to zero. Stable IDs remain private tie facts; account-IANA endpoint rendering is display only."},{"caseId":"C7-E15-22","caseType":"cross_category","input":"Compare the trusted time-between gap with net P&L without claiming the gap caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["time_between_trades","net_pnl"],"expectedFilters":["trusted selected current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection, then positive predecessor-final-exit to current-first-entry UTC subtraction","descriptive cross-category comparison"],"expectedComparison":{"left":"time_between_trades","right":"net_pnl","basis":"trusted selected current lifecycle"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected current-lifecycle context","expectedContextRequirements":["explicit trusted current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact predecessor must be ready_closed with accepted final-exit UTC; non-ready and nonpositive overlap remain coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned exact predecessor gap and compatible money fact separate; expose privacy-safe coverage rather than IDs and make no causal, behavioral, predictive, or advisory claim."}]
```

### `time_after_previous_loss`

```json
[{"caseId":"C7-E16-01","caseType":"canonical","input":"Show time after the exact previous losing lifecycle for the selected current lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-02","caseType":"formal_paraphrase","input":"Calculate the positive raw-UTC gap from the ready-closed losing predecessor's final exit to the current first entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-03","caseType":"conversational_paraphrase","input":"How long after the loss right before it did the selected trade begin?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-04","caseType":"trader_slang","input":"What was the gap from the previous red trade's flatten to this entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-05","caseType":"abbreviation","input":"Show TAPL for the explicitly selected current lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit time-after-previous-loss grammar; TAPL is accepted only in that explicit phrase","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-06","caseType":"misspelling","input":"Show time afer the prevous los for the selected current trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-07","caseType":"noisy_input","input":"selected trade gap after exact prev loss pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-08","caseType":"command","input":"Return the gap after the immediately preceding selected-basis loss.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-09","caseType":"fragment","input":"Previous-loss final-exit to current-entry gap.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-10","caseType":"follow_up","input":"For that trusted prior current lifecycle, how long after its exact previous loss did it begin?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["trusted prior current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior current-lifecycle context","expectedContextRequirements":["explicit trusted prior current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-11","caseType":"correction","input":"For that trusted result, I meant after the previous loss, not after any previous trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-12","caseType":"comparison","input":"Compare time after previous loss for the two trusted current lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["trusted first current lifecycle","trusted second current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","planned exact positive interval comparison"],"expectedComparison":{"left":"trusted first current lifecycle","right":"trusted second current lifecycle","basis":"time_after_previous_loss"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted current-lifecycle selections","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-13","caseType":"ranking","input":"Rank the trusted current lifecycles by time after previous loss.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["trusted current lifecycles with qualifying previous losses"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","descending exact positive seconds","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted qualifying current-lifecycle set","expectedContextRequirements":["explicit trusted qualifying current-lifecycle set","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-14","caseType":"negation","input":"Show time after previous loss, not time after previous win.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["exclude previous-win and generic-predecessor interpretations"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-15","caseType":"exclusion","input":"Show previous-loss gaps excluding the trusted selected ticker from current results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["exclude trusted selected ticker from current results"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-16","caseType":"multi_filter","input":"Show previous-loss gaps for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["trusted selected ticker on current results","trusted declared period on current results"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":"trusted declared current-result period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker and period context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-17","caseType":"multi_part","input":"For the trusted current and prior selections, compare time after previous loss and include barrier coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["trusted current result selection","trusted prior result selection"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","planned exact positive interval comparison","coverage inspection"],"expectedComparison":{"left":"trusted current result selection","right":"trusted prior result selection","basis":"time_after_previous_loss"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior result context","expectedContextRequirements":["explicit trusted current and prior result context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-18","caseType":"ambiguity","input":"How long after a losing trade was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved loss basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should loss mean gross P&L or fee-complete net P&L for the exact immediate predecessor?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one selected-basis question. Do not invent a date, current lifecycle, predecessor, fee state, currency, or result."},{"caseId":"C7-E16-19","caseType":"negative_example","input":"How long should I wait after a loss?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, behavior rule, or prescribed post-loss wait"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed post-loss waiting periods are unsupported; a historical interval cannot recommend a cooldown or future action.","notes":"This is advice, not a factual previous-loss interval request; do not infer discipline, causation, or an ideal wait."},{"caseId":"C7-E16-20","caseType":"unsupported_data","input":"Ignore a flat or open predecessor, find an earlier loss, and clamp a negative gap to zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The exact immediate predecessor is selected from all authorized current candidates before filters and must be ready_closed and a loss on the declared basis; flat, nonclassifiable, open, or decision predecessors are unskippable barriers, and zero or negative overlap is unavailable rather than clamped.","notes":"No predecessor, missing endpoints, incomplete net fees, incompatible currency, a non-loss outcome, current needs_decision, or overlap remains explicit coverage. A current legitimate_open may qualify from its accepted first entry only when its exact predecessor qualifies."},{"caseId":"C7-E16-21","caseType":"selected_entity_context","input":"For the trusted selected current lifecycle, show time after its previous loss.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_loss"],"expectedFilters":["trusted selected current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected current-lifecycle context","expectedContextRequirements":["explicit trusted selected current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous loss only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a loss on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E16-22","caseType":"cross_category","input":"Compare the trusted previous-loss gap with net P&L without claiming the gap caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["time_after_previous_loss","net_pnl"],"expectedFilters":["trusted selected current lifecycle with qualifying previous loss"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis loss classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","descriptive cross-category comparison"],"expectedComparison":{"left":"time_after_previous_loss","right":"net_pnl","basis":"trusted selected current lifecycle"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected current-lifecycle context","expectedContextRequirements":["explicit trusted qualifying current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a loss on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned previous-loss interval and compatible money fact separate; expose privacy-safe coverage and make no causal, behavioral, predictive, or advisory claim."}]
```

### `time_after_previous_win`

```json
[{"caseId":"C7-E17-01","caseType":"canonical","input":"Show time after the exact previous winning lifecycle for the selected current lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-02","caseType":"formal_paraphrase","input":"Calculate the positive raw-UTC gap from the ready-closed winning predecessor's final exit to the current first entry.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-03","caseType":"conversational_paraphrase","input":"How long after the win right before it did the selected trade begin?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-04","caseType":"trader_slang","input":"What was the gap from the previous green trade's flatten to this entry?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-05","caseType":"abbreviation","input":"Show TAPW for the explicitly selected current lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit time-after-previous-win grammar; TAPW is accepted only in that explicit phrase","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-06","caseType":"misspelling","input":"Show time afer the prevous wn for the selected current trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-07","caseType":"noisy_input","input":"selected trade gap after exact prev win pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-08","caseType":"command","input":"Return the gap after the immediately preceding selected-basis win.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-09","caseType":"fragment","input":"Previous-win final-exit to current-entry gap.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-10","caseType":"follow_up","input":"For that trusted prior current lifecycle, how long after its exact previous win did it begin?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["trusted prior current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior current-lifecycle context","expectedContextRequirements":["explicit trusted prior current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-11","caseType":"correction","input":"For that trusted result, I meant after the previous win, not after any previous trade.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-12","caseType":"comparison","input":"Compare time after previous win for the two trusted current lifecycles.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["trusted first current lifecycle","trusted second current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","planned exact positive interval comparison"],"expectedComparison":{"left":"trusted first current lifecycle","right":"trusted second current lifecycle","basis":"time_after_previous_win"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted current-lifecycle selections","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-13","caseType":"ranking","input":"Rank the trusted current lifecycles by time after previous win.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["trusted current lifecycles with qualifying previous wins"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","descending exact positive seconds","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted qualifying current-lifecycle set","expectedContextRequirements":["explicit trusted qualifying current-lifecycle set","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-14","caseType":"negation","input":"Show time after previous win, not time after previous loss.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["exclude previous-loss and generic-predecessor interpretations"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-15","caseType":"exclusion","input":"Show previous-win gaps excluding the trusted selected ticker from current results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["exclude trusted selected ticker from current results"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-16","caseType":"multi_filter","input":"Show previous-win gaps for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["trusted selected ticker on current results","trusted declared period on current results"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":"trusted declared current-result period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker and period context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-17","caseType":"multi_part","input":"For the trusted current and prior selections, compare time after previous win and include barrier coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["trusted current result selection","trusted prior result selection"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","planned exact positive interval comparison","coverage inspection"],"expectedComparison":{"left":"trusted current result selection","right":"trusted prior result selection","basis":"time_after_previous_win"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior result context","expectedContextRequirements":["explicit trusted current and prior result context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-18","caseType":"ambiguity","input":"How long after a winning trade was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved win basis","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Should win mean gross P&L or fee-complete net P&L for the exact immediate predecessor?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one selected-basis question. Do not invent a date, current lifecycle, predecessor, fee state, currency, or result."},{"caseId":"C7-E17-19","caseType":"negative_example","input":"How long should I wait after a win?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, behavior rule, or prescribed post-win wait"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed post-win waiting periods are unsupported; a historical interval cannot recommend a pause or future action.","notes":"This is advice, not a factual previous-win interval request; do not infer discipline, causation, or an ideal wait."},{"caseId":"C7-E17-20","caseType":"unsupported_data","input":"Ignore a flat or decision predecessor, find an earlier win, and clamp a zero gap to zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The exact immediate predecessor is selected from all authorized current candidates before filters and must be ready_closed and a win on the declared basis; flat, nonclassifiable, open, or decision predecessors are unskippable barriers, and zero or negative overlap is unavailable rather than clamped.","notes":"No predecessor, missing endpoints, incomplete net fees, incompatible currency, a non-win outcome, current needs_decision, or overlap remains explicit coverage. A current legitimate_open may qualify from its accepted first entry only when its exact predecessor qualifies."},{"caseId":"C7-E17-21","caseType":"selected_entity_context","input":"For the trusted selected current lifecycle, show time after its previous win.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["time_after_previous_win"],"expectedFilters":["trusted selected current lifecycle"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected current-lifecycle context","expectedContextRequirements":["explicit trusted selected current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned time after previous win only from the exact immediate predecessor selected before analytic filters. That predecessor must be ready_closed and a win on the declared gross or fee-complete net basis. Compute current first-entry UTC minus predecessor final-exit UTC only when positive; never skip flat, nonclassifiable, open, or decision barriers or clamp overlap. Stable IDs remain private tie facts, local rendering is display only, and no causation or advice is inferred."},{"caseId":"C7-E17-22","caseType":"cross_category","input":"Compare the trusted previous-win gap with net P&L without claiming the gap caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["time_after_previous_win","net_pnl"],"expectedFilters":["trusted selected current lifecycle with qualifying previous win"],"expectedGroupings":[],"expectedOperators":["planned all-candidate first-entry-UTC plus stable-ID order, exact predecessor selection and selected-basis win classification, then positive predecessor-final-exit to current-first-entry UTC subtraction","descriptive cross-category comparison"],"expectedComparison":{"left":"time_after_previous_win","right":"net_pnl","basis":"trusted selected current lifecycle"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected current-lifecycle context","expectedContextRequirements":["explicit trusted qualifying current-lifecycle context","server-authorized compatible account, account-IANA timezone, and currency scope","all current in-scope lifecycle candidates ordered by first-entry raw UTC then stable round-trip ID before eligibility, state, date, ticker, outcome, or result filters","exact immediate predecessor must be ready_closed and classified as a win on the explicitly selected gross or fee-complete net basis","flat, nonclassifiable, legitimate_open, and needs_decision predecessors remain barriers; nonpositive overlap remains unavailable","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned previous-win interval and compatible money fact separate; expose privacy-safe coverage and make no causal, behavioral, predictive, or advisory claim."}]
```

### `first_trade_time`

```json
[{"caseId":"C7-E18-01","caseType":"canonical","input":"Show first trade time for the explicitly declared lifecycle population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-02","caseType":"formal_paraphrase","input":"Return the first-entry raw UTC instant of the earliest eligible lifecycle and render it in the account timezone.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-03","caseType":"conversational_paraphrase","input":"What time did trading start in the selected scope?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-04","caseType":"trader_slang","input":"When was my first get-in for the declared trading window?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-05","caseType":"abbreviation","input":"Show FTT for the explicitly declared lifecycle population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit first-trade-time grammar; FTT is accepted only in that explicit phrase","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-06","caseType":"misspelling","input":"Show the frist trad tiem for the declared population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-07","caseType":"noisy_input","input":"declared pop first entry clock pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-08","caseType":"command","input":"Return the earliest eligible first-entry time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-09","caseType":"fragment","input":"Trading-window first-entry timestamp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-10","caseType":"follow_up","input":"For that trusted prior population, when did its first eligible lifecycle begin?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["trusted prior declared population"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior population context","expectedContextRequirements":["explicit trusted prior population context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-11","caseType":"correction","input":"For that trusted result, I meant first trade time, not last trade time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-12","caseType":"comparison","input":"Compare first trade times for the two trusted declared populations.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["trusted first declared population","trusted second declared population"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone","planned raw-UTC timestamp comparison"],"expectedComparison":{"left":"trusted first declared population","right":"trusted second declared population","basis":"first_trade_time"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible population contexts","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-13","caseType":"ranking","input":"Rank the trusted declared populations by first trade time.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["trusted declared compatible populations"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone","ascending first-entry raw UTC","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted declared population set","expectedContextRequirements":["explicit trusted compatible population set","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-14","caseType":"negation","input":"Show first trade time, not the earliest exit or import timestamp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["exclude final-exit, import-time, and generic-minimum interpretations"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-15","caseType":"exclusion","input":"Show first trade times excluding the trusted selected ticker from current results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["exclude trusted selected ticker from current results"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-16","caseType":"multi_filter","input":"Show first trade time for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["trusted selected ticker on current results","trusted declared period on current results"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":"trusted declared current-result period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker and period context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-17","caseType":"multi_part","input":"For the trusted current and prior populations, compare first trade time and include coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["trusted current result selection","trusted prior result selection"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone","planned raw-UTC timestamp comparison","coverage inspection"],"expectedComparison":{"left":"trusted current result selection","right":"trusted prior result selection","basis":"first_trade_time"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior result context","expectedContextRequirements":["explicit trusted current and prior result context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-18","caseType":"ambiguity","input":"When did I start?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved start-time target","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the first eligible lifecycle entry in an explicitly declared population or the selected lifecycle's entry time?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one target-field question. Do not invent a date, period, population, lifecycle, open-state policy, or timezone."},{"caseId":"C7-E18-19","caseType":"negative_example","input":"What time should I start trading?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed trading start time"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed start times are unsupported; a historical first trade time cannot recommend when to trade.","notes":"This is advice, not a factual trading-window start request; do not infer an ideal start, intent, quality, or causation."},{"caseId":"C7-E18-20","caseType":"unsupported_data","input":"Use the earliest import timestamp and silently include every open or decision lifecycle.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit eligible population, period, and legitimate_open inclusion policy required","accepted first-entry raw UTC facts required; import time and needs_decision rows are not substitutes"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"First trade time requires the earliest eligible lifecycle's accepted first-entry raw UTC instant within an explicit population; import timestamps, silent open inclusion, needs_decision rows, missing facts, or incompatible scope cannot supply or default the value.","notes":"An empty eligible population is unavailable, never midnight or zero. A legitimate_open lifecycle participates only when its inclusion is explicit; local rendering and DST do not change raw-UTC selection."},{"caseId":"C7-E18-21","caseType":"selected_entity_context","input":"For the trusted selected declared population, show first trade time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["first_trade_time"],"expectedFilters":["trusted selected declared population"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected population context","expectedContextRequirements":["explicit trusted selected population, period, and open-inclusion context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned first trade time as the first-entry raw UTC instant of the earliest eligible lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Include legitimate_open only when the population explicitly declares it; retain needs_decision and missing facts as coverage. Stable tie IDs stay private. This is the trading-window start endpoint, not a generic minimum timestamp, causal signal, or recommendation."},{"caseId":"C7-E18-22","caseType":"cross_category","input":"Compare the trusted first trade time with net P&L without claiming the start time caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["first_trade_time","net_pnl"],"expectedFilters":["trusted selected declared population"],"expectedGroupings":[],"expectedOperators":["planned earliest eligible lifecycle by first-entry raw UTC plus stable-ID tie, return first entry and render in account IANA timezone","descriptive cross-category comparison"],"expectedComparison":{"left":"first_trade_time","right":"net_pnl","basis":"trusted selected declared population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected population context","expectedContextRequirements":["explicit trusted compatible population context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible lifecycle population and period","earliest eligible lifecycle selected by first-entry raw UTC then stable round-trip ID; legitimate_open included only when explicitly declared","needs_decision and missing first-entry facts retained as coverage","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned trading-window start instant and compatible money fact separate; show privacy-safe population/coverage and make no causal, predictive, quality, or advisory claim."}]
```

### `last_trade_time`

```json
[{"caseId":"C7-E19-01","caseType":"canonical","input":"Show last trade time for the explicitly declared ready-closed population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-02","caseType":"formal_paraphrase","input":"Return the final-exit raw UTC instant of the latest eligible ready-closed lifecycle and render it in the account timezone.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-03","caseType":"conversational_paraphrase","input":"What time did completed trading finish in the selected scope?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-04","caseType":"trader_slang","input":"When was my last eligible flatten for the declared trading window?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-05","caseType":"abbreviation","input":"Show LTT for the explicitly declared ready-closed population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["explicit last-trade-time grammar; LTT is accepted only in that explicit phrase","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-06","caseType":"misspelling","input":"Show the lst trad tiem for the declared closed population.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["misspelling normalization","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-07","caseType":"noisy_input","input":"declared pop last final exit clock pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-08","caseType":"command","input":"Return the latest eligible ready-closed final-exit time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-09","caseType":"fragment","input":"Trading-window final-flat timestamp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-10","caseType":"follow_up","input":"For that trusted prior population, when did its latest eligible lifecycle finally flatten?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["trusted prior declared ready-closed population"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted prior population context","expectedContextRequirements":["explicit trusted prior ready-closed population context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-11","caseType":"correction","input":"For that trusted result, I meant last trade time, not first trade time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["trusted selected result"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone","metric correction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected result context","expectedContextRequirements":["explicit trusted result context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-12","caseType":"comparison","input":"Compare last trade times for the two trusted declared populations.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["trusted first declared ready-closed population","trusted second declared ready-closed population"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone","planned raw-UTC timestamp comparison"],"expectedComparison":{"left":"trusted first declared ready-closed population","right":"trusted second declared ready-closed population","basis":"last_trade_time"},"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["two explicit trusted compatible ready-closed population contexts","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-13","caseType":"ranking","input":"Rank the trusted declared populations by last trade time.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["trusted declared compatible ready-closed populations"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone","descending final-exit raw UTC","deterministic tie policy"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted declared ready-closed population set","expectedContextRequirements":["explicit trusted compatible ready-closed population set","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-14","caseType":"negation","input":"Show last trade time, not the latest entry or an as-of open timestamp.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["exclude first-entry, as-of-open, and generic-maximum interpretations"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone","exclude alternate meaning"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-15","caseType":"exclusion","input":"Show last trade times excluding the trusted selected ticker from current results.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["exclude trusted selected ticker from current results"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-16","caseType":"multi_filter","input":"Show last trade time for the trusted selected ticker and trusted declared period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["trusted selected ticker on current results","trusted declared period on current results"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":"trusted declared current-result period","expectedSelectedEntity":"trusted selected ticker context","expectedContextRequirements":["explicit trusted current-result ticker and period context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-17","caseType":"multi_part","input":"For the trusted current and prior populations, compare last trade time and include closed-coverage details.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","compare_groups","inspect_data_quality"],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["trusted current result selection","trusted prior result selection"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone","planned raw-UTC timestamp comparison","coverage inspection"],"expectedComparison":{"left":"trusted current result selection","right":"trusted prior result selection","basis":"last_trade_time"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted current and prior result context","expectedContextRequirements":["explicit trusted current and prior result context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-18","caseType":"ambiguity","input":"When did I finish?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["metric routing"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["one unresolved finish-time target","server-authorized compatible account scope"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean the final exit of the latest eligible ready-closed lifecycle in an explicitly declared population or the selected lifecycle's exit time?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one target-field question. Do not invent a date, period, population, lifecycle, final exit, or timezone."},{"caseId":"C7-E19-19","caseType":"negative_example","input":"What time should I stop trading?","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["unsupported request"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["no trading advice, prediction, or prescribed trading stop time"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Trading advice and prescribed stop times are unsupported; a historical last trade time cannot recommend when to stop trading.","notes":"This is advice, not a factual trading-window end request; do not infer an ideal stop, discipline, quality, or causation."},{"caseId":"C7-E19-20","caseType":"unsupported_data","input":"Use now as the final exit for an open position and ignore decision rows.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["return Planned/unavailable and coverage"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["server-authorized compatible account and account-IANA timezone scope","explicit eligible ready_closed population and period required","accepted final-exit raw UTC facts required; now, open, decision, or missing endpoints are not substitutes"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Last trade time requires the latest eligible ready_closed lifecycle's accepted final-exit raw UTC instant within an explicit population; legitimate_open, needs_decision, missing-final-exit, as-of-now, or incompatible rows cannot supply or default the value.","notes":"An empty eligible ready_closed population is unavailable, never now, midnight, or zero. Local rendering and DST do not change raw-UTC selection; open and decision rows remain visible coverage."},{"caseId":"C7-E19-21","caseType":"selected_entity_context","input":"For the trusted selected declared ready-closed population, show last trade time.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["last_trade_time"],"expectedFilters":["trusted selected declared ready-closed population"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"trusted server-authorized selected ready-closed population context","expectedContextRequirements":["explicit trusted selected ready-closed population and period context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognize Planned last trade time as the final-exit raw UTC instant of the latest eligible ready_closed lifecycle in the explicitly declared population, with account-IANA local rendering after selection. Open, decision, and missing-final-exit rows remain coverage and never receive an as-of endpoint. Stable tie IDs stay private. This is the trading-window end endpoint, asymmetrically paired with first-entry-based first trade time, not a generic maximum timestamp or advice."},{"caseId":"C7-E19-22","caseType":"cross_category","input":"Compare the trusted last trade time with net P&L without claiming the finish time caused the result.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","explain_result"],"expectedCanonicalConcepts":["last_trade_time","net_pnl"],"expectedFilters":["trusted selected declared ready-closed population"],"expectedGroupings":[],"expectedOperators":["planned latest eligible ready_closed lifecycle by final-exit raw UTC plus stable-ID tie, return final exit and render in account IANA timezone","descriptive cross-category comparison"],"expectedComparison":{"left":"last_trade_time","right":"net_pnl","basis":"trusted selected declared ready-closed population"},"expectedTimeRange":null,"expectedSelectedEntity":"trusted selected ready-closed population context","expectedContextRequirements":["explicit trusted compatible ready-closed population context","server-authorized compatible account and account-IANA timezone scope","explicitly declared eligible ready_closed lifecycle population and period","latest eligible lifecycle selected by final-exit raw UTC then stable round-trip ID","legitimate_open, needs_decision, and missing final-exit facts retained as coverage and never assigned an as-of exit","Category 2 net P&L and Category 5 fee-completeness boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Keep the Planned trading-window end instant and compatible money fact separate; show privacy-safe population/coverage and make no causal, predictive, quality, or advisory claim."}]
```

## Evaluation Review State

All 19 evaluation arrays and 418 Batch 1-6 cases are complete. Every case was
reviewed and passed in the comprehensive independent Terra review, with zero failures. This
accepted evaluation review gate is part of the controller-approved and locked
Version 1 category.

---

# 8. Coverage Report Deliverable

Production and comprehensive independent review complete. The controlling-list
count is 19. All 19 Section 5 records passed independent review and are
controller-approved and locked. Section 6 has 19 complete, approved, locked,
independently reviewed PASS registries. Section 7 has all 418/418 cases across
19 complete arrays; all 418 passed review with zero failures. Accepted coverage
is 19/19 concepts, 19/19 arrays, 418/418 cases, 19 clarification cases, 57
unsupported cases, and 19 cross-category cases. The coverage review gate is
accepted. Category approval, canonical-name/registry lock, Complete, and
Version 1 were subsequently accepted by the controller after clerical PASS.
This completed coverage does not claim runtime support beyond the exact
capability split.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete for the approved Version 1 boundary.
- [x] Boundaries are complete for the approved Version 1 boundary.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed item was silently omitted, renamed, or merged.
- [x] Proposed additions/removals are separated.
- [x] Duplicate-concept review and exact status split are controller-accepted.

## Canonical Inventory

- [x] `C7-TIME-001` through `C7-TIME-019` have complete Version 1 canonical
  records with exact definitions, distinctions, evidence, statuses, units,
  open-trade/decision coverage, fee handling, and related concepts.
- [x] Completed records preserve privacy, account/timezone/currency partition,
  raw-instant/local-display, exactness, coverage, and no-causation boundaries.

## Language Registry

- [x] `C7-TIME-001` through `C7-TIME-019` have all 38 populated registry
  subsections.
- [x] All 19 language registries are complete.
- [x] Batches 1-4 retain staged clarification, authorized scope, exact time math,
  coverage, privacy, no-invention, and no-causation/advice boundaries.
- [x] All 19 registries independently passed review.

## Review and Approval Gates

- [x] Every item has an independently reviewed, controller-approved Version 1
  canonical record (19 complete).
- [x] Language registries are complete (19/19 complete).
- [x] Section 7 Batches 1-6 save all 418 cases in 19 complete arrays with exact
  schema, ordered types, unique IDs, and unique inputs.
- [x] Evaluation case production is complete (418/418 saved; 0 unsaved).
- [x] Evaluation case review is complete (418 reviewed; 418 passed; 0 failed).
- [x] Coverage report production is complete (Section 8 production counts saved).
- [x] Coverage report review is complete (comprehensive independent PASS).
- [x] Pre-lock review gate is accepted.
- [x] Canonical names and language registries are approved and locked.
- [x] Master tracker transition is accepted by the lead controller.
- [x] Category is marked Complete.
- [x] Version 1 is assigned after controller approval and lock.

---

# 10. Review Notes

## Reviewer Findings

- The controller accepted the exact 19-item controlling inventory and status
  split recorded in Section 4 and preserved it through final approval and lock.
- Independent review returned PASS for all 19 Version 1 canonical records and
  registries, and the controller accepted and locked them.
- Section 6 Batches 1-4 registries `C7-TIME-001` through `C7-TIME-019` are
  complete and independently passed review.
- Comprehensive independent Terra review returned PASS for all 418/418 Section 7
  cases through `last_trade_time`: 418 reviewed, 418 passed, and 0 failed.
- The same comprehensive review accepted the Section 8 coverage report at 19/19
  concepts, 19/19 arrays, 418/418 cases, 19 clarification cases, 57 unsupported
  cases, and 19 cross-category cases.
- Canonical, registry, evaluation, and coverage review gates are accepted. The
  comprehensive Terra PASS and final clerical PASS support the controller's
  Complete, Version 1 approval and lock.
- Statuses distinguish existing Journal primitives from planned metric contracts
  and unavailable exchange-session facts; they do not claim AI Chat availability.

## Required Changes

- None. Category 7 is controller-approved, locked, and Complete at Version 1.
- Any later semantic or language change requires an explicitly versioned
  revision; approval does not authorize runtime implementation or support
  inflation.

## Completed Changes

- Initial bounded planning established the exact IDs/names and Sections 5-8
  deliverable structure.
- Planning-review remediation applied: generic weekday is Planned and distinct
  from `entry_weekday`; interval gaps, overlap coverage, and predecessor
  barriers are explicit; first/last trade times use asymmetric trading-window
  start/end events.
- Remaining interval-order remediation applied: predecessor selection now uses
  first-entry UTC plus stable ID across all scoped candidates before eligibility
  filtering; close-time order and eligible-first skipping are explicitly barred.
- Controller acceptance of the exact 19-item inventory/status split is recorded;
  the final status is Complete and locked at Version 1.
- Complete Version 1 canonical records for `C7-TIME-001` through
  `C7-TIME-019` independently passed review and are controller-approved and
  locked.
- Complete 38-subsection Version 1 language registries for `C7-TIME-001`
  through `C7-TIME-019` independently passed review and are approved and locked.
- Section 7 Batches 1-6 saved all 418 cases in exact 22-case arrays through
  `last_trade_time`; comprehensive independent Terra review passed all 418 with
  zero failures and accepted the Section 8 coverage report.
- Final clerical PASS and controller approval recorded; the exact names and
  registries are locked and Category 7 is Complete at Version 1.

## Approval Decision

- Status: Complete; approved; locked.
- Approved by: Lead controller under the owner-authorized language-inventory workflow.
- Approval date: 2026-08-10.
- Version: 1.
- Canonical names locked: Yes.
- Language registries locked: Yes.
- Evaluation and coverage gates: 418 reviewed; 418 passed; 0 failed; accepted.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-10 | Initial Category 7 Version 0 planning draft with exact 19-item controlling inventory; Sections 5-8 deferred | Establish evidence-backed time/duration definitions, capability boundaries, and controller decisions without creating runtime or language deliverables | 0 |
| 2026-08-10 | Applied planning-review remediation for weekday, interval, overlap, and first/last-trade semantics | Resolve controller findings without producing Sections 5-8, approving names, locking the inventory, or changing Version 0 | 0 |
| 2026-08-10 | Applied remaining interval-order remediation to C7-TIME-015 through C7-TIME-017 | Select the exact first-entry-ordered predecessor before eligibility filtering and preserve non-ready, outcome, and overlap barriers without changing deliverable or approval state | 0 |
| 2026-08-10 | Recorded controller acceptance of the exact inventory/status split and produced Section 5 records C7-TIME-001 through C7-TIME-007 | Begin bounded canonical-record production while preserving pending records, deferred Sections 6-8, Version 0, and unapproved/unlocked state | 0 |
| 2026-08-10 | Produced Section 5 canonical records C7-TIME-008 through C7-TIME-014 | Extend bounded canonical production through weekday, closing calendar, days-held, and daily-count metrics while preserving IDs 015-019 as pending and Sections 6-8 as deferred | 0 |
| 2026-08-10 | Produced final Section 5 canonical records C7-TIME-015 through C7-TIME-019 | Complete the unreviewed Version 0 canonical inventory with exact predecessor intervals and asymmetric trading-window endpoints while preserving Sections 6-8 as deferred and the category as unapproved/unlocked | 0 |
| 2026-08-10 | Recorded independent PASS/controller acceptance for all 19 canonical records and produced Section 6 Batch 1 registries C7-TIME-001 through C7-TIME-005 | Begin bounded language-registry production with all 38 subsections per accepted concept while preserving registries 006-019 and Sections 7-8 as deferred and Version 0 as unlocked | 0 |
| 2026-08-10 | Produced Section 6 Batch 2 registries C7-TIME-006 through C7-TIME-010 | Extend exact 38-subsection coverage through first-exit, unavailable session, event-specific weekday, ISO closing week, and closing month while preserving registries 011-019 and Sections 7-8 as deferred | 0 |
| 2026-08-10 | Produced Section 6 Batch 3 registries C7-TIME-011 through C7-TIME-015 | Extend exact 38-subsection coverage through planned closing quarter, supported closing year, local date-boundary days held, per-closing-date ready-closed count, and exact predecessor interval while preserving registries 016-019 and Sections 7-8 as deferred | 0 |
| 2026-08-10 | Produced final Section 6 Batch 4 registries C7-TIME-016 through C7-TIME-019 | Complete all 19 Version 0 language registries with exact selected-basis predecessor barriers and asymmetric trading-window endpoints while preserving Sections 7-8 as deferred and the category as unapproved/unlocked | 0 |
| 2026-08-10 | Recorded independent PASS for all 19 Section 6 registries and saved Section 7 Batch 1 arrays C7-E1 through C7-E3 | Save 66/418 exact-schema cases for entry time, exit time, and hold duration as unreviewed while preserving arrays 4-19 and Section 8 as deferred and avoiding any category approval or lock claim | 0 |
| 2026-08-10 | Saved Section 7 Batch 2 arrays C7-E4 through C7-E6 | Extend unreviewed exact-schema evaluation coverage to 132/418 cases through average hold duration, median hold duration, and planned time to first exit while preserving arrays 7-19 and Section 8 as deferred | 0 |
| 2026-08-10 | Saved Section 7 Batch 3 arrays C7-E7 through C7-E9 | Extend unreviewed exact-schema evaluation coverage to 198/418 cases through unavailable named session, planned event-explicit weekday, and supported ISO closing week while preserving arrays 10-19 and Section 8 as deferred | 0 |
| 2026-08-10 | Saved Section 7 Batch 4 arrays C7-E10 through C7-E12 | Extend unreviewed exact-schema evaluation coverage to 264/418 cases through supported local closing month, planned local closing quarter, and supported local closing calendar year while preserving arrays 13-19 and Section 8 as deferred | 0 |
| 2026-08-10 | Saved Section 7 Batch 5 arrays C7-E13 through C7-E15 | Extend unreviewed exact-schema evaluation coverage to 330/418 cases through planned local date-boundary days held, planned ready-closed trades per declared closing date, and planned exact-predecessor between-trade intervals while preserving arrays 16-19 and Section 8 as deferred | 0 |
| 2026-08-10 | Saved final Section 7 Batch 6 arrays C7-E16 through C7-E19 and produced Section 8 coverage counts | Complete 418/418 unreviewed exact-schema cases through selected-basis prior-loss/prior-win intervals and asymmetric trading-window endpoints while preserving Version 0, unreviewed coverage, and unapproved/unlocked state | 0 |
| 2026-08-10 | Recorded comprehensive independent Terra PASS and pre-lock Ready for Review transition | Accept canonical, registry, evaluation, and coverage review gates at 418 reviewed/418 passed/0 failed while preserving Version 0, unapproved/unlocked names and registries, and unchecked Complete/Version 1 gates | 0 |
| 2026-08-10 | Recorded controller approval, lock, clerical PASS, and Category 7 completion | Finalize the exact 19-name 8 Supported/10 Planned/1 Unavailable inventory at Version 1 after comprehensive 418/418 evaluation PASS without inflating runtime support | 1 |
