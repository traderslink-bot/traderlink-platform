# Category 13: Date and Time Language

# Category Metadata

| Field | Value |
|---|---|
| Category name | Date and Time Language |
| Category number | 13 |
| Category slug | date-time-language |
| File name | 13-date-time-language.md |
| Category type | Temporal expression, calendar, timezone, session, and range vocabulary |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-11 |
| Last updated | 2026-08-11 |
| Dependencies | Locked Category 1 intents; locked Category 7 time and duration metrics; locked Category 11 dimensions; locked Category 12 operators; Journal authorization, accepted-fact, UTC, account-IANA, coverage, and Data Decisions contracts |
| Owner | AI language inventory workflow |

> **Runtime reconciliation (2026-08-15):** Bounded reads retain their account,
> Tracker-Eastern, calendar, and coverage rules; the map cannot invent time facts.

**Completion state:** Version 1 is Complete after comprehensive independent
PASS and lead-controller approval on 2026-08-11. All nine exact canonical names
and all nine 38-subsection language registries are approved and locked; all 198
evaluation cases remain reviewed and passed. This inventory authorizes neither
a Chat route, parser, query, data source, test, schema, nor runtime capability.

**Controlling-source count resolution:** Section 8 of the complete language
plan declares nine ordered date/time resolution groups. The examples beneath it
are later language material, not extra canonical records. The exact controlling
range is therefore `C13-DT-001` through `C13-DT-009`; no source group is
omitted, merged, or renamed. All nine are approved and locked in Complete
Version 1.

**Controlling inventory status:** 9 `Planned`, 0 `Supported`, 0 `Unavailable`,
0 `Unsupported`, and 0 `Deprecated`. `Planned` is a future language/query
target subject to the boundaries below; it does not claim a current executable
Chat, time parser, session calendar, or Journal query.

---

# 1. Category Purpose

Category 13 establishes the future AI Companion's bounded interpretation of
calendar and clock language: named and relative dates, trading dates, rolling
and record-count windows, session wording, and the distinct timezone
conventions named by the controlling plan. It keeps a request such as "last
Friday before 10:00" from silently using a browser clock, server-local date,
guessed exchange schedule, wrong lifecycle event, or an undocumented range
endpoint.

Each resolved expression must become explicit structured temporal data: source
text, selected event basis, start/end or count window, boundary inclusivity,
effective timezone, and whether the result is a local-calendar value or an
instant. Raw Journal event timestamps remain UTC facts. Account-scoped
analytics first converts an accepted raw UTC instant through the authorized
selected account IANA timezone using the timezone database's applicable DST
offset. It must never reinterpret UTC as local time or substitute browser,
server, device, display, or exchange time.

This category owns date/time wording and resolution contracts. It does not own
intent routing (Category 1), metric meaning or eligibility (Categories 2-10),
field/event availability (Category 11), predicate syntax (Category 12),
ranking (Category 14), conversation context, slang, ambiguity policy, response
presentation, privacy policy, protected actions, market-data calendars, or
runtime implementation.

---

# 2. Category Boundaries

## Included

The exact controlling source vocabulary covers, in source order:

- calendar dates;
- relative dates;
- trading dates;
- rolling windows;
- record-count windows;
- session times;
- the trader display timezone where a display preference is relevant;
- the selected Journal account timezone for account-scoped analytics; and
- Eastern market time for Daily Trade Tracker dates, manual-entry times,
  sessions, and rule cutoffs unless a later product decision changes that
  trading convention.

Shared planning semantics specify raw UTC preservation, effective timezone and
DST conversion, event-basis selection, trustworthy `as_of` time, explicit
calendar/relative/count ranges, clock/range endpoint semantics, coverage, and
clarification boundaries for those nine source groups.

## Excluded

- Request intent, protected-action confirmation, and mutation authorization:
  Category 1.
- Metric formulas, populations, denominators, fees, and lifecycle eligibility:
  Categories 2-10.
- The factual time fields, lifecycle event identities, selected account, and
  their availability/authorization: Category 11.
- Typed comparison syntax and boolean composition: Category 12.
- Candidate populations, period-to-period comparison, ranking direction,
  ties, and limits: Category 14.
- Follow-up context, slang, global ambiguity recovery, presentation
  preferences, and safety/privacy policy: Categories 15-19.
- Exchange holiday calendars, market-data trading-hours feeds, browser/server
  clocks, provider calls, writes, raw-source browsing, and AI Chat runtime.

## Cross-Category References

- Category 1 supplies the stable intent and separates a factual time request
  from a recommendation, prediction, causation claim, or protected action.
- Category 7 owns hold duration, session-duration metrics, and metric-specific
  lifecycle endpoints; Category 13 resolves a requested temporal filter only
  after the metric/event contract is known.
- Category 11 owns the accepted event field, raw UTC timestamp, account scope,
  account IANA timezone, event availability, and `ready_closed`,
  `legitimate_open`, or `needs_decision` coverage. Date language cannot invent
  any of them.
- Category 12 applies a temporal equality/comparison/range predicate only
  after this category resolves the temporal operand, event basis, timezone, and
  endpoint semantics.
- Category 14 owns comparisons and rankings across periods; Category 13 only
  resolves an individually valid period/window.

---

# 3. Planning Analysis

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?** It maps the nine
   controlling source groups to explicit, safe temporal interpretation without
   inventing a clock, timezone, event, session, range endpoint, or missing
   facts.
2. **What canonical concepts belong here?** Only the nine source-order groups
   in Section 4. Example phrases and shared resolution rules do not create
   additional inventory records.
3. **What related concepts belong elsewhere?** Intent belongs to Category 1;
   metric/event definitions to Categories 2-11; predicate syntax to Category
   12; comparison/ranking to Category 14; later language and policy concerns
   to Categories 15-19.
4. **What data is required?** Server-authorized user/workspace/account scope;
   accepted current event timestamps stored as raw UTC; the selected event
   basis; an effective IANA timezone where a local calendar/clock is involved;
   a trusted server `as_of` instant for relative language; and explicit
   lifecycle/decision coverage.
5. **Which deterministic tools will answer requests?** A future read-only
   Journal fact-set/query validator may resolve an already-authorized temporal
   expression. This draft approves no parser, calendar service, session feed,
   or Chat execution contract.
6. **Which concepts are directly observed?** Accepted raw UTC event timestamps,
   explicit stored account timezone, and an explicitly stored display
   preference may be observed only within their authorization/coverage
   contracts.
7. **Which concepts are deterministically derived?** Account-local date/time,
   calendar boundaries, relative ranges, and rolling/count windows are derived
   only from an accepted raw UTC event, an approved effective timezone, and a
   trusted server `as_of` instant; DST is applied by the named IANA zone.
8. **Which concepts are proxy indicators?** None. Session words and trading-day
   words are temporal selectors, not evidence of trader behavior, market cause,
   quality, or advice.
9. **Which concepts are user-labelled?** A display-timezone preference can be
   user-selected only under the separately authorized preference contract. It
   may affect display rendering only; it cannot change account-scoped
   analytics, Journal event facts, Daily Trade Tracker convention, or access.
10. **Which concepts are not measurable?** A missing/unauthorized event,
    account IANA zone, trusted `as_of`, event basis, endpoint convention,
    approved trading-day/session definition, or count-window ordering returns
    clarification or unavailable coverage, never a guessed date/time,
    fabricated zero, or browser/server-local fallback.
11. **Which terms are ambiguous?** `today`, `yesterday`, `last Friday`, `this
    week`, `previous trading day`, `last five trading days`, `last 30 days`,
    `last 20 trades`, `since July 1`, `before 10:00`, `between 9:30 and 11:00`,
    `after lunch`, `at the open`, `near the close`, `premarket`, and `after
    hours` require one or more of timezone, event basis, trusted `as_of`,
    calendar/session definition, year, clock bound, or boundary convention.
12. **What defaults are safe?** Preserve raw UTC facts; for account-scoped
    analytics use the server-authorized selected account's IANA timezone and
    IANA DST rules; for Daily Trade Tracker dates/manual-entry times/sessions/
    rule cutoffs use `America/New_York` only under the controlling plan's
    stated convention; use a trusted server `as_of` instant. There is no
    default browser/server-local timezone, exchange session, event basis,
    fiscal calendar, week start, year for an incomplete date, clock endpoint,
    range inclusivity, lunch/open/close duration, or record order.
13. **What conditions require clarification?** Ask one focused question when
    selected event basis is unresolved; a relative/calendar phrase lacks its
    effective authorized timezone or trusted `as_of`; a partial date lacks its
    year; a clock/range lacks an endpoint convention; a trading-day/session
    term lacks an approved calendar/session definition; a record-count window
    lacks population/order; or a display preference is requested for an
    account-analytics calculation.
14. **What combinations are invalid?** Treating UTC as local; browser/server
    time fallback; applying display timezone to account analytics; applying
    account timezone to Daily Trade Tracker's stated Eastern convention;
    assuming a market/holiday/lunch/open/close schedule; silently selecting
    entry/fill/final-exit event; reversing endpoints; treating `before`/`after`
    as inclusive; extending `since` through an unknown future `as_of`; using a
    record-count window as a calendar window; using open/decision coverage as
    completed evidence; cross-account scope expansion; FX/metric changes;
    prediction, causation, motive, or advice.
15. **What evaluation coverage proves completion?** Later Sections 5-8 must
    cover every source record with UTC-to-IANA/DST conversion; explicit account
    versus display versus Tracker-Eastern context; event-basis clarification;
    named/relative/calendar/rolling/count windows; inclusive calendar-day and
    strict clock endpoints; missing year/zone/as-of/session contracts;
    authorized scope; open/decision coverage; and Category 7/11/12/14
    cross-category cases.

## 3.2 Dependencies

- **Locked language dependencies:** Category 1 for intent; Category 7 for
  metric/event endpoint meaning; Category 11 for time fields, account IANA
  facts, authorization, lifecycle/coverage; and Category 12 for typed temporal
  comparisons after resolution.
- **Journal/module contracts:** one server-authorized user/workspace/account
  scope; accepted current facts/provenance; raw UTC event timestamps; selected
  account IANA timezone; timezone-database DST conversion; trusted server
  `as_of`; Data Decisions; and visible `ready_closed`, `legitimate_open`, and
  `needs_decision` coverage.
- **Future dependencies:** Category 14 for period comparison/ranking and
  Categories 15-19 for conversational context, terminology, ambiguity,
  presentation, privacy, and policy.
- **Daily Trade Tracker convention:** the controlling plan names Eastern market
  time for its dates, manual-entry times, sessions, and rule cutoffs. This
  draft records that convention only; a change requires a later product
  decision and must not be inferred from the selected account or display zone.
- **Unsupported dependencies:** client/browser/server-local clocks; guessed
  exchange, holiday, lunch, open/close, premarket, or after-hours calendars;
  raw identity/broker/source material; V3 fallback; model-created event labels;
  and any unapproved calendar, session, or query service.

## 3.3 Risks, Overlaps, and Decisions

| Area | Draft decision / risk control |
|---|---|
| Source preservation | Preserve all nine Section 8 source bullets and their order. The sixteen example phrases are later registry material, not extra canonical records. |
| Raw time facts | Store/retain each accepted event timestamp as raw UTC. A local representation is derived for the requested contract and never becomes a replacement source fact. |
| Account-local conversion | For account-scoped analytics, convert raw UTC to the server-authorized selected account's IANA zone using the applicable IANA DST offset at that instant. Do not use a fixed offset or reinterpret local wall time. |
| Effective timezone separation | Display timezone affects only explicitly requested presentation. Account-IANA controls account-scoped analytics. `America/New_York` controls only the named Daily Trade Tracker convention. None authorizes or overwrites another. |
| Trusted now | Resolve relative dates/windows against a trusted server `as_of` instant supplied with the response/query contract. Never use browser, device, request-local, or server-local wall-clock guesses. Return resolved exact dates when relative wording could confuse. |
| Event basis | A range filters a declared accepted event (such as entry, execution/fill, final exit, or metric-specific event). If the phrase does not select one and no owning metric/intent supplies it, clarify rather than default. |
| Calendar periods | A resolved local calendar date includes the local interval from `00:00:00.000` through `23:59:59.999` in its effective timezone, represented as corresponding UTC instants for filtering. Named week/month/quarter/year require a separately approved calendar/week-start/fiscal definition; fiscal/tax periods are never inferred. |
| Relative and rolling periods | `today`, `yesterday`, `this week`, `last Friday`, and `last 30 days` require an effective timezone plus trusted `as_of`. Calendar periods and rolling durations remain distinct; a rolling duration is not silently rewritten as a named calendar period. |
| Date and clock range endpoints | `since X` has an inclusive lower bound and ends at trusted `as_of`; `before T` and `after T` are strict clock comparisons under Category 12; `between A and B` requires ordered explicit endpoints and a declared inclusion rule, otherwise clarify. A date-only upper bound includes that local calendar day only when the date-range contract states it. |
| Partial dates | Month/day without a year, ambiguous numeric dates, and clock text without an effective timezone require clarification. No nearest-year, locale, AM/PM, or date-format default is approved. |
| Trading date/session words | Trading date and session vocabulary need an approved calendar/session definition and declared event basis. `previous trading day`, premarket, after hours, lunch, open, and close cannot be guessed from an ordinary weekday, observed activity, or a market-data provider. |
| Record-count windows | `my last 20 trades` means a finite count over a declared eligible population, selected event/order, tie/ordering rule, and account scope. It is neither a date duration nor permission to include open/decision-ineligible records. |
| Coverage | Missing/unauthorized time facts, `legitimate_open`, `needs_decision`, or incomplete coverage remain visible coverage states. They do not satisfy or fail a temporal predicate by default. |
| Privacy and safety | Time language cannot enumerate other accounts, reveal raw private source content/identifiers, infer motive/causation, prescribe trading, or authorize a write. |
| Category ownership | Category 7 owns duration metrics; Category 11 owns fields/events; Category 12 owns predicate syntax; Category 13 owns expression resolution; Category 14 owns comparison/ranking. No category may silently substitute another's rule. |

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. It
> preserves all nine named date/time resolution groups from Section 8 of the
> complete language plan in exact source order. No source group is omitted,
> merged, renamed, approved, or locked.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C13-DT-001 | calendar_dates | Calendar Dates | Local-calendar expression | Planned | Requires declared event basis, effective timezone, explicit calendar definition, and accepted UTC facts; no fiscal/tax/locale default. |
| 2 | C13-DT-002 | relative_dates | Relative Dates | Relative local-calendar expression | Planned | Requires trusted server `as_of`, effective timezone, event basis, and calendar boundary contract; no browser/server-local fallback. |
| 3 | C13-DT-003 | trading_dates | Trading Dates | Trading-calendar expression | Planned | Requires an approved trading-day calendar, effective timezone, and event basis; weekdays/activity alone are insufficient. |
| 4 | C13-DT-004 | rolling_windows | Rolling Windows | Duration-based temporal window | Planned | Requires trusted `as_of`, explicit duration/unit/endpoints, effective timezone where dates are rendered, and declared event basis. |
| 5 | C13-DT-005 | record_count_windows | Record-Count Windows | Ordered-record temporal window | Planned | Requires authorized eligible population, selected event/order, finite count, and deterministic ordering/tie rule; it is not a calendar range. |
| 6 | C13-DT-006 | session_times | Session Times | Session/clock expression | Planned | Requires approved session/calendar definition, effective timezone, event basis, and explicit clock/range endpoint semantics; no guessed market schedule. |
| 7 | C13-DT-007 | display_timezone | Display Timezone | Presentation timezone preference | Planned | Requires an explicitly stored/authorized display preference; presentation only, never a substitute analytics/account timezone. |
| 8 | C13-DT-008 | account_timezone | Journal Account Timezone | Account-scoped analytics timezone | Planned | Requires server-authorized selected account IANA zone and accepted raw UTC facts; apply IANA DST conversion at each instant. |
| 9 | C13-DT-009 | daily_trade_tracker_eastern_market_time | Daily Trade Tracker Eastern Market Time | Tracker temporal convention | Planned | `America/New_York` only for Tracker dates, manual-entry times, sessions, and rule cutoffs under the plan's stated convention; future change requires product decision. |

## Proposed Inventory Additions

None. Named weekdays/months, `today`, `last Friday`, `last 30 days`, `since`,
clock comparison phrases, premarket/after-hours, lunch/open/close, endpoint
markers, holiday names, ISO timestamps, fiscal/tax periods, duration units, and
follow-up phrases are later language material or shared semantics. They are not
new canonical records without controller approval.

## Proposed Removals or Merges

None. Calendar, relative, trading, rolling, count-window, session, display,
account, and Tracker-Eastern groups overlap conversationally but have distinct
scope, event, timezone, authorization, boundary, and coverage behavior.

---

# 5. Canonical Inventory Deliverable

The nine Version 1 records below preserve the approved Section 4 inventory
order and exact `Planned` status. Their names are approved and locked.
Every result retains its own selected event, effective timezone, boundaries,
scope, and coverage; temporal resolution cannot create facts, access, a
calendar/session feed, or executable runtime support.

## `calendar_dates`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-001 |
| Category | Date and Time Language |
| Subcategory | Local-calendar expression |
| Canonical name | calendar_dates |
| Display name | Calendar Dates |
| Exact definition | Resolve an explicit named or date-form calendar expression to one or more declared local calendar-date interval(s) for a selected accepted event, using the effective authorized timezone and explicit calendar/date-format rules. A complete local date spans `00:00:00.000` through `23:59:59.999` in that timezone and filters the corresponding UTC instants. |
| Distinction from related concepts | It resolves fixed calendar dates, not a relative date, trading-day calendar, rolling duration, record-count window, session clock, or timezone preference. |
| Evidence classification | Deterministically derived from accepted raw UTC events, the effective timezone, and explicit calendar/date rules. |
| Capability status | Planned |
| Result units | Explicit local date interval(s), effective IANA timezone, selected event basis, endpoint contract, and corresponding UTC filter bounds; or clarification/unavailable coverage. |
| Open-trade support | Only when the selected event is covered and eligible under the owning field/metric contract; an open or decision-incomplete lifecycle is not recast as a calendar-date result. |
| Fee handling | Not applicable to date resolution; any selected money metric retains its own gross/net, fee, and currency contract. |
| Version | 1 |

### Related Concepts

- Broader concept: resolved temporal expression.
- Narrower concepts: ISO/named full local date and explicit local date range.
- Commonly confused concepts: `relative_dates`, `trading_dates`, and
  `rolling_windows`.
- Must not be merged with: `relative_dates` or `trading_dates`.

## `relative_dates`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-002 |
| Category | Date and Time Language |
| Subcategory | Relative local-calendar expression |
| Canonical name | relative_dates |
| Display name | Relative Dates |
| Exact definition | Resolve relative calendar language such as `today`, `yesterday`, `last Friday`, or `this week` against one trusted server `as_of` instant and the effective authorized timezone, then emit the exact resolved local date interval(s), selected event basis, and endpoints. |
| Distinction from related concepts | It is anchored to a trusted `as_of` instant and a local calendar; it is not a duration-backed rolling window, a record count, a trading-day calculation, or a client-clock interpretation. |
| Evidence classification | Deterministically derived from a trusted server `as_of`, effective timezone, explicit relative-calendar rule, and accepted raw UTC events. |
| Capability status | Planned |
| Result units | Source text, trusted `as_of`, explicit local date interval(s), effective IANA timezone, selected event basis, and UTC bounds; or clarification/unavailable coverage. |
| Open-trade support | The range may be resolved independently, but included records remain governed by the owning event/metric's open, decision, and coverage rules. |
| Fee handling | Not applicable to temporal resolution; no money-basis, fee, or currency default is created. |
| Version | 1 |

### Related Concepts

- Broader concept: resolved temporal expression.
- Narrower concepts: relative day, weekday, and named local calendar period.
- Commonly confused concepts: `calendar_dates`, `rolling_windows`, and
  `trading_dates`.
- Must not be merged with: `rolling_windows` or browser/server-local time.

## `trading_dates`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-003 |
| Category | Date and Time Language |
| Subcategory | Trading-calendar expression |
| Canonical name | trading_dates |
| Display name | Trading Dates |
| Exact definition | Resolve a trading-date expression such as `the previous trading day` or `the last five trading days` only through an explicitly approved trading-day calendar, effective timezone, selected event basis, and declared inclusive/exclusive boundary rule. An ordinary weekday or observed Journal activity is not proof of a trading day. |
| Distinction from related concepts | It uses an approved trading calendar rather than ordinary local calendar arithmetic, rolling duration, session clock range, or a count of Journal records. |
| Evidence classification | Deterministically derived only when an approved trading-day calendar, trusted server `as_of` where needed, effective timezone, and selected event are available. |
| Capability status | Planned |
| Result units | Ordered approved trading-date interval(s), effective timezone, selected event basis, calendar/version reference, boundary contract, and UTC bounds; or clarification/unavailable coverage. |
| Open-trade support | Resolved dates do not make a lifecycle eligible; open, incomplete, or `needs_decision` coverage remains visible under the owning metric/event contract. |
| Fee handling | Not applicable to date resolution; selected metric fee treatment is unchanged. |
| Version | 1 |

### Related Concepts

- Broader concept: resolved temporal expression.
- Narrower concepts: prior approved trading day and finite approved trading-day sequence.
- Commonly confused concepts: `calendar_dates`, `relative_dates`, and
  `record_count_windows`.
- Must not be merged with: `calendar_dates` or an assumed exchange schedule.

## `rolling_windows`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-004 |
| Category | Date and Time Language |
| Subcategory | Duration-based temporal window |
| Canonical name | rolling_windows |
| Display name | Rolling Windows |
| Exact definition | Resolve an explicit duration-backed window such as `the last 30 days` from one trusted server `as_of` instant, an explicit duration/unit, selected event basis, and declared start/end inclusivity. It yields exact temporal bounds and is not silently converted to a named calendar period. |
| Distinction from related concepts | It selects elapsed-duration time, not `this month`/other calendar membership, trading-calendar days, last-N records, or a session clock interval. |
| Evidence classification | Deterministically derived from trusted server `as_of`, explicit duration/unit, effective timezone where local rendering is requested, endpoint contract, and accepted raw UTC events. |
| Capability status | Planned |
| Result units | Explicit start/end instant or declared local interval, duration/unit, effective timezone where applicable, selected event basis, endpoint inclusivity, and UTC bounds; or clarification/unavailable coverage. |
| Open-trade support | Resolution does not alter lifecycle eligibility; records retain their owning open/decision/incomplete coverage state. |
| Fee handling | Not applicable to window resolution; no fee basis or currency conversion is inferred. |
| Version | 1 |

### Related Concepts

- Broader concept: resolved temporal expression.
- Narrower concepts: trailing duration with explicit start/end inclusivity.
- Commonly confused concepts: `relative_dates`, `calendar_dates`, and
  `record_count_windows`.
- Must not be merged with: a named calendar period or `record_count_windows`.

## `record_count_windows`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-005 |
| Category | Date and Time Language |
| Subcategory | Ordered-record temporal window |
| Canonical name | record_count_windows |
| Display name | Record-Count Windows |
| Exact definition | Resolve a request such as `my last 20 trades` to a finite ordered set from one authorized, eligible, declared population using a selected event/order key, count, deterministic tie rule, and explicit coverage behavior. It does not mean the prior 20 calendar or trading days. |
| Distinction from related concepts | It bounds records by count after a population/order contract, not by local date, elapsed duration, exchange/trading calendar, or session time. |
| Evidence classification | Deterministically derived from authorized accepted records, selected event/order key, finite count, deterministic ordering/tie rule, and coverage contract. |
| Capability status | Planned |
| Result units | Privacy-safe authorized record selection/set plus requested/returned counts, selected event/order key, tie rule, coverage counts, and optional resolved temporal extent; never raw, internal, or source identifier output; or clarification/unavailable coverage. |
| Open-trade support | Only records admitted by the declared population are included; `legitimate_open`, `needs_decision`, and incomplete records remain visible or unavailable according to that population rather than being silently included/excluded. |
| Fee handling | Not applicable to record selection; selected metrics preserve their fee/currency rules. |
| Version | 1 |

### Related Concepts

- Broader concept: resolved query window.
- Narrower concepts: finite last-N eligible records under one ordering contract.
- Commonly confused concepts: `rolling_windows`, `trading_dates`, and Category
  14 ranking.
- Must not be merged with: `rolling_windows` or a rank/best/worst request.

## `session_times`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-006 |
| Category | Date and Time Language |
| Subcategory | Session/clock expression |
| Canonical name | session_times |
| Display name | Session Times |
| Exact definition | Resolve session or clock language such as `before 10:00`, `between 9:30 and 11:00`, `after lunch`, `at the open`, `near the close`, `premarket`, or `after hours` only when an approved session/calendar definition, effective timezone, selected event basis, and exact endpoint rule exist. `before` and `after` remain strict Category 12 comparisons; a clock range must state or obtain its inclusivity. |
| Distinction from related concepts | It maps a clock/session selector under an approved session contract, not an assumed market schedule, a whole calendar date, duration window, or Tracker Eastern market-time convention. |
| Evidence classification | Deterministically derived only from accepted raw UTC events plus an approved session/calendar definition, effective timezone, selected event basis, and endpoint rules. |
| Capability status | Planned |
| Result units | Resolved local clock/session interval(s), effective timezone, session/calendar definition/version, selected event basis, endpoint contract, and corresponding UTC bounds; or clarification/unavailable coverage. |
| Open-trade support | A session filter does not turn an incomplete or decision-bound lifecycle into eligible evidence; preserve owning coverage states. |
| Fee handling | Not applicable to session resolution; no metric basis is changed. |
| Version | 1 |

### Related Concepts

- Broader concept: resolved temporal expression.
- Narrower concepts: strict clock comparison, explicit clock range, and approved named session.
- Commonly confused concepts: `calendar_dates`, `trading_dates`, and
  `daily_trade_tracker_eastern_market_time`.
- Must not be merged with: an inferred exchange schedule or a timezone setting.

## `display_timezone`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-007 |
| Category | Date and Time Language |
| Subcategory | Presentation timezone preference |
| Canonical name | display_timezone |
| Display name | Display Timezone |
| Exact definition | Apply an explicitly stored, authorized trader display-timezone preference only to rendering an already-resolved result. It may show the same accepted UTC instant in another IANA zone but cannot alter the account-scoped analytical date, event membership, Daily Trade Tracker convention, or source fact. |
| Distinction from related concepts | It is presentation-only user preference, not the selected Journal account timezone, a raw timestamp, an authorization selector, or a market/session timezone. |
| Evidence classification | User-labelled preference combined with deterministic IANA conversion of an accepted UTC instant. |
| Capability status | Planned |
| Result units | Rendered local timestamp/date plus display IANA timezone and retained source/account analytical timezone metadata; or unavailable presentation preference. |
| Open-trade support | It only renders records already authorized and eligible for the requesting result; it cannot alter open/decision coverage. |
| Fee handling | Not applicable; display conversion cannot alter money, fee, currency, or metric basis. |
| Version | 1 |

### Related Concepts

- Broader concept: timezone rendering contract.
- Narrower concepts: explicit user display-zone rendering of an accepted UTC instant.
- Commonly confused concepts: `account_timezone` and
  `daily_trade_tracker_eastern_market_time`.
- Must not be merged with: analytics timezone, scope selection, or source UTC.

## `account_timezone`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-008 |
| Category | Date and Time Language |
| Subcategory | Account-scoped analytics timezone |
| Canonical name | account_timezone |
| Display name | Journal Account Timezone |
| Exact definition | Use the server-authorized selected Journal account's stored IANA timezone to derive account-local calendar/clock values from accepted raw UTC event instants. Apply the IANA database's offset, including DST, at each individual instant; do not use a fixed offset or reinterpret UTC as local wall time. |
| Distinction from related concepts | It controls account-scoped analytical temporal membership, not display rendering, Tracker Eastern convention, browser/device locale, or account authorization itself. |
| Evidence classification | Directly observed stored account setting plus deterministic per-instant IANA/DST conversion of accepted raw UTC facts. |
| Capability status | Planned |
| Result units | Effective account IANA timezone, local calendar/clock representation, applicable per-instant offset, selected event basis, and retained raw UTC instant; or unavailable coverage. |
| Open-trade support | It can render a covered accepted event at any permitted lifecycle state, but it cannot make an open/decision-ineligible metric eligible. |
| Fee handling | Not applicable to timezone conversion; selected money metrics retain their exact currency, fee, and basis partitions. |
| Version | 1 |

### Related Concepts

- Broader concept: timezone resolution contract.
- Narrower concepts: per-instant raw-UTC-to-account-IANA/DST conversion.
- Commonly confused concepts: `display_timezone` and
  `daily_trade_tracker_eastern_market_time`.
- Must not be merged with: browser/server-local timezone or a fixed UTC offset.

## `daily_trade_tracker_eastern_market_time`

| Field | Value |
|---|---|
| Inventory ID | C13-DT-009 |
| Category | Date and Time Language |
| Subcategory | Tracker temporal convention |
| Canonical name | daily_trade_tracker_eastern_market_time |
| Display name | Daily Trade Tracker Eastern Market Time |
| Exact definition | Apply `America/New_York` as the controlling plan's Tracker-only Eastern market-time convention operational for Daily Trade Tracker dates, manual-entry times, sessions, and rule cutoffs, including the IANA DST offset at each instant. This convention has no scope outside the Tracker context and remains subject to a later explicit product decision. |
| Distinction from related concepts | It is a Tracker-specific convention, not a selected account analytical timezone, user display preference, generic market calendar, or permission to infer a session schedule. |
| Evidence classification | Deterministically derived IANA rendering/conversion of accepted UTC facts under the controlling Tracker convention; manual-entered time remains a user-provided fact under its owning tracker contract. |
| Capability status | Planned |
| Result units | Tracker-context local date/time, `America/New_York`, applicable per-instant DST offset, selected event/entry-time basis, and retained raw UTC when applicable; or unavailable/clarification. |
| Open-trade support | It renders/organizes Tracker facts only under their existing lifecycle and coverage contract; it cannot close, classify, or make a decision-bound trade analytics-ready. |
| Fee handling | Not applicable; Tracker temporal rendering cannot alter fees, P/L, currency, or metric eligibility. |
| Version | 1 |

### Related Concepts

- Broader concept: Tracker-specific temporal convention.
- Narrower concepts: Tracker date, manual-entry time, session, and rule-cutoff rendering.
- Commonly confused concepts: `account_timezone`, `display_timezone`, and
  `session_times`.
- Must not be merged with: generic exchange time, account analytics timezone,
  or a guessed session calendar.

---

# 6. Language Registry Deliverable

All nine 38-subsection language registries are complete, independently reviewed
PASS, approved, and locked at Version 1. They document future `Planned`
interpretation targets; they do not claim a parser, calendar service, query, or
runtime support.

## `calendar_dates` Language Registry

### Exact Definition

- Resolve a complete explicit calendar date/range to declared local-calendar
  interval(s) for a selected accepted event using an effective timezone; retain
  raw UTC facts and use the corresponding UTC bounds for filtering.

### Formal Wording

- "For the local calendar date 2026-07-01, show accepted final exits."

### Normal Conversational Wording

- "Show my trades on July 1."

### Trader Slang

- "Pull my July 1 plays."

### Abbreviations

- `Jul 1` is an incomplete calendar date until year and date format are clear.

### Common Misspellings

- `july 1st trades`
- `trades on jully 1`

### Noisy or Incomplete Input

- `AAPL Jul 1` requires the year, selected event basis, and validated ticker.

### Singular and Plural Forms

- "date" means one complete local calendar day; "dates" means explicit
  multiple dates/ranges, not an inferred rolling window.

### Full Questions

- "What accepted ready-closed trades had their final exit on 2026-07-01?"

### Commands

- "Show final exits on July 1, 2026."

### Sentence Fragments

- `on 2026-07-01`

### Follow-Up Wording

- "Use July 2 instead." Retain the prior validated event basis and authorized
  scope only; clarify if none exists.

### Correction Wording

- "Not July 1 — July 10, 2026." Replace only the explicit calendar value.

### Comparison Wording

- "Compare July 1 with July 2" routes comparison population/metric semantics
  to Category 14 after each date resolves here.

### Ranking Wording

- "What was my best July 1?" requires Category 14 metric, population,
  direction, and ties; a date alone is not a ranking.

### Negated Wording

- "Not July 1" is an exclusion only after an explicit selected event and
  complete date; it does not make unknown timestamps a match.

### Exclusion Wording

- "Exclude July 1, 2026" removes that declared local-date interval only from
  an already authorized population.

### Multi-Filter Wording

- "Ready-closed AAPL final exits on 2026-07-01" requires accepted final-exit
  basis, account scope, and independently validated ticker/lifecycle filters.

### Multi-Part Question Wording

- "Show count and net result for July 1, 2026, with coverage" keeps count and
  money contracts separate while sharing one resolved date/event basis.

### Ambiguous Wording

- "On 7/1" requires year and unambiguous date format; "July 1" also requires
  a year unless prior context has an explicit validated year.

### Negative Examples

These examples must not map to this concept.

- "Last 30 days" is `rolling_windows`.
- "Previous trading day" is `trading_dates`.
- "Before 10:00" is `session_times`.

### Context Requirements

- Require server-authorized scope, selected accepted event basis, raw UTC event
  facts, and the effective account IANA timezone for account analytics. A
  display preference cannot substitute for account analytics timezone.

### Required Data

- Complete explicit date(s), date-format/year resolution, selected event basis,
  accepted raw UTC facts, effective IANA timezone with per-instant DST, and
  coverage state.

### Optional Data

- Validated ticker, direction, lifecycle, metric, grouping, and explicitly
  requested display timezone for presentation after analytical resolution.

### Valid Filters

- A declared local calendar-date equality or range over a covered accepted
  event, translated to corresponding UTC bounds under Category 12 rules.

### Valid Groupings

- Existing owning metric/field groupings only; a calendar-date filter does not
  create a daily series or invent zero-activity dates.

### Valid Operators

- Category 12 validated temporal equality/range/exclusion after complete date,
  event basis, timezone, and endpoint semantics are resolved.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, and `inspect_data_quality` when their owning data
  contracts supply a valid event basis.

### Incompatible Combinations

- Browser/server-local date; missing year/date format; implicit entry versus
  exit selection; fiscal/tax period substitution; guessed session; cross-account
  scope; prediction, causation, motive, advice, or a protected write.

### Default Interpretation

- A complete ISO-like date with an already-declared event basis resolves in the
  authorized account IANA timezone for account analytics. No year, locale,
  event, or timezone default is created when missing.

### Clarification Conditions

- Clarify first the event basis if absent; then ask for one missing date field
  (year or date format) or the effective timezone when it is not authorized.

### Recommended Clarification Wording

1. "Which event date should I use: entry, execution, or final exit?"
2. If needed: "Which year and date format do you mean by 7/1?"

### Unsupported Conditions

- No accepted event timestamps, unavailable account timezone, partial/ambiguous
  date without clarification, browser-clock resolution, raw-source search, or
  unapproved fiscal/tax/session calendar.

### Target Analytics Tool or Query Capability

- Future read-only authorized Journal fact-set/query validator with explicit
  raw-UTC-to-account-IANA temporal filtering; not currently implemented.

### Result Units

- Source text, local date interval(s), effective timezone, selected event basis,
  UTC bounds, and coverage; no raw/internal/source identifier output.

### Fee Handling

- Not applicable; any returned money metric preserves its own fee basis,
  currency partition, and coverage.

### Open-Trade Handling

- Resolve the date independently but retain `legitimate_open`,
  `needs_decision`, and incomplete state according to the owning result
  contract; do not treat them as ready-closed evidence.

### Sample-Size Considerations

- Return eligible and excluded/unavailable coverage counts where the owning
  query provides them; do not infer a representative sample from one date.

## `relative_dates` Language Registry

### Exact Definition

- Resolve relative local-calendar wording against one trusted server `as_of`
  instant and effective timezone, then return explicit resolved local
  interval(s), selected event basis, and UTC bounds.

### Formal Wording

- "For the current local calendar week as of the trusted query time, summarize
  accepted final exits."

### Normal Conversational Wording

- "How did I do this week?"

### Trader Slang

- "How's this week been for my plays?"

### Abbreviations

- `tdy`, `yday`, and `lw` require a known relative-calendar rule and effective
  timezone; `YTD` is not silently interpreted here.

### Common Misspellings

- `yesturday`
- `this wek`

### Noisy or Incomplete Input

- `AAPL last Fri` requires trusted `as_of`, effective timezone, selected event,
  and validated ticker.

### Singular and Plural Forms

- "today"/"yesterday" select one resolved local date; "these days" is not a
  defined period without context.

### Full Questions

- "What accepted ready-closed trades had final exits yesterday?"

### Commands

- "Show this week's final exits with the exact resolved dates."

### Sentence Fragments

- `what about last Friday?`

### Follow-Up Wording

- "Now do last week." Retain prior valid intent/event/scope only and resolve
  against the same trusted server `as_of` unless the query contract supplies a
  new trusted server `as_of` instant; never use user- or device-local declared
  time as a replacement anchor.

### Correction Wording

- "I meant yesterday, not today." Replace the relative expression and expose
  the new exact resolved dates.

### Comparison Wording

- "Compare this week with last week" requires Category 14 comparison semantics
  after both periods independently resolve from the trusted `as_of`.

### Ranking Wording

- "Best trade this week" requires Category 14 metric/population/direction/tie
  policy; relative date resolution alone cannot rank.

### Negated Wording

- "Not this week" excludes the explicitly resolved interval only; it cannot
  turn unknown/missing timestamps into matches.

### Exclusion Wording

- "Exclude yesterday" uses the trusted `as_of` and effective timezone to
  remove that one explicit resolved local-day interval.

### Multi-Filter Wording

- "This week, only ready-closed long AAPL trades" requires independently
  validated lifecycle/direction/ticker filters and selected event basis.

### Multi-Part Question Wording

- "Show this week's count and net result with coverage" shares resolved range
  but preserves count, P/L, fee, currency, and eligibility contracts.

### Ambiguous Wording

- "This week," "last Friday," and "yesterday" require effective timezone and
  trusted `as_of`; week-start convention needs an approved calendar rule.

### Negative Examples

These examples must not map to this concept.

- "July 1, 2026" is `calendar_dates`.
- "Last 30 days" is `rolling_windows`.
- "Last five trading days" is `trading_dates`.

### Context Requirements

- Require server-authorized scope, trusted server `as_of`, effective timezone,
  declared relative-calendar rule, selected accepted event basis, raw UTC facts,
  and coverage. Never use browser/device/server-local wall time.

### Required Data

- Relative source text, one trusted server `as_of` instant, effective IANA zone
  with DST rules, calendar/week rule where needed, selected event basis, and
  accepted raw UTC facts.

### Optional Data

- Validated ticker/direction/lifecycle/metric filters and display-zone rendering
  after account-analytic period resolution.

### Valid Filters

- Explicit resolved local date interval(s) derived from relative language and
  converted to UTC bounds for the declared accepted event.

### Valid Groupings

- Existing owner-supported groupings only. `this week` is a filter, not a new
  grouping or a default weekly comparison series.

### Valid Operators

- Category 12 temporal predicates after trusted `as_of`, timezone, selected
  event, and endpoint semantics are resolved.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, and `inspect_data_quality` with a valid owning event
  contract.

### Incompatible Combinations

- Browser/server-local `now`; different hidden `as_of` instants in one request;
  display timezone as analytics zone; undefined week/fiscal/YTD meaning;
  implicit session/event; cross-account scope; advice, cause, motive, forecast,
  or protected write.

### Default Interpretation

- Use one trusted server `as_of` and authorized account IANA zone for an
  account-scoped request; show exact resolved dates when relative wording could
  confuse. No client-clock or unapproved week-start default exists.

### Clarification Conditions

- Clarify the selected event basis first when missing; then effective timezone,
  week/calendar rule, or relative phrase that lacks a defined contract.

### Recommended Clarification Wording

1. "Which event date should this relative period filter: entry, execution, or final exit?"
2. If needed: "Which local timezone should I use?"
3. Only for a week phrase after timezone resolves: "Which approved week definition should I use?"

### Unsupported Conditions

- Missing trusted `as_of`, unauthorized/missing timezone, unapproved calendar
  definition, guessed client clock, absent accepted timestamps, or unresolved
  event/coverage prerequisite.

### Target Analytics Tool or Query Capability

- Future read-only authorized Journal temporal resolver/query validator using a
  single trusted `as_of`; not currently implemented.

### Result Units

- Source text, trusted `as_of`, exact local interval(s), effective timezone,
  selected event basis, UTC bounds, and coverage; no raw/private identifiers.

### Fee Handling

- Not applicable; downstream money results retain their own gross/net, fee,
  currency, and eligibility terms.

### Open-Trade Handling

- Relative interval resolution does not change lifecycle eligibility; preserve
  open, decision, and incomplete coverage separately from ready-closed results.

### Sample-Size Considerations

- Report eligible and coverage-excluded counts where available; do not imply a
  full week/month population when coverage is incomplete.

## `trading_dates` Language Registry

### Exact Definition

- Resolve trading-date wording only using an approved trading-day calendar,
  effective timezone, selected accepted event basis, trusted `as_of` when
  relative, and explicit endpoint/count rules; weekdays and Journal activity do
  not establish a trading date.

### Formal Wording

- "For the five immediately preceding approved trading dates, summarize
  accepted final exits using the declared trading calendar."

### Normal Conversational Wording

- "Show me the last five trading days."

### Trader Slang

- "Pull my last five market days."

### Abbreviations

- `prev TD` and `5 TD` require an approved trading-day calendar; `TD` must not
  be silently expanded if it means something else in context.

### Common Misspellings

- `prevous trading day`
- `tradding days`

### Noisy or Incomplete Input

- `AAPL prev trading day` requires approved calendar, effective timezone,
  selected event, and validated ticker.

### Singular and Plural Forms

- "trading day" is one approved calendar date; "trading days" is an ordered
  approved sequence, not a count of days with Journal activity.

### Full Questions

- "Which accepted ready-closed final exits occurred on the previous approved
  trading day?"

### Commands

- "Show the last five approved trading dates with coverage."

### Sentence Fragments

- `previous trading day`

### Follow-Up Wording

- "Make that the previous two trading days." Retain only validated scope/event
  and resolve the count against the same approved calendar and trusted `as_of`.

### Correction Wording

- "Not the prior calendar day — the prior trading day." Replace calendar logic
  with an approved trading-calendar request.

### Comparison Wording

- "Compare the previous trading day with the one before it" requires Category
  14 comparison rules after both approved trading dates resolve.

### Ranking Wording

- "What was my best trading day?" requires Category 14 population/metric/
  direction/tie semantics; a trading-date selector does not rank days.

### Negated Wording

- "Not the previous trading day" excludes only that explicitly resolved
  approved date; unavailable timestamp coverage does not become a match.

### Exclusion Wording

- "Exclude the last trading day" requires the declared approved calendar,
  trusted `as_of`, timezone, selected event, and valid base population.

### Multi-Filter Wording

- "Last five trading days, ready-closed long AAPL final exits" requires the
  approved calendar plus independently validated filters and authorized scope.

### Multi-Part Question Wording

- "Show the prior trading day's count and net result with coverage" shares one
  resolved trading-date interval but preserves metric and fee/currency rules.

### Ambiguous Wording

- "Trading day," "market day," and "previous trading day" require the
  approved calendar, effective timezone, event basis, and trusted `as_of` if
  relative; no exchange/holiday/session provider is assumed.

### Negative Examples

These examples must not map to this concept.

- "Yesterday" is `relative_dates`.
- "July 1, 2026" is `calendar_dates`.
- "My last 20 trades" is `record_count_windows`.

### Context Requirements

- Require server-authorized scope, approved trading-day calendar/version,
  effective timezone, selected accepted event basis, raw UTC facts, trusted
  server `as_of` where relative, and explicit coverage.

### Required Data

- Approved trading calendar/version, effective IANA timezone with per-instant
  DST, selected event basis, accepted raw UTC timestamps, requested count/date,
  trusted `as_of` where relevant, and coverage state.

### Optional Data

- Validated ticker/direction/lifecycle/metric filters, display rendering after
  analytical resolution, and owner-supported grouping.

### Valid Filters

- Membership in explicit approved trading-date interval(s) over the declared
  accepted event, represented as corresponding UTC bounds.

### Valid Groupings

- Existing owner-supported date/metric groupings only; the selector does not
  synthesize missing trading dates or zero-activity days.

### Valid Operators

- Category 12 temporal membership/equality/range/exclusion only after calendar,
  timezone, event, count, and endpoint contracts are resolved.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, and `inspect_data_quality` where owning facts and
  event basis are valid.

### Incompatible Combinations

- Assuming weekdays/Journal activity are trading dates; guessed holiday/open/
  close/session; browser/server-local time; account-scope expansion; calendar-
  day substitution; missing calendar/version/event; prediction, cause, motive,
  advice, or protected write.

### Default Interpretation

- No trading-date result is defaulted. An explicit approved trading calendar,
  authorized account timezone, selected event, and trusted `as_of` when
  relative are prerequisites.

### Clarification Conditions

- Clarify first the approved trading-calendar contract when absent, then the
  selected event basis, timezone, or requested count/date as needed.

### Recommended Clarification Wording

1. "Which approved trading calendar should define the previous trading day?"
2. If needed: "Which event date should I filter: entry, execution, or final exit?"

### Unsupported Conditions

- No approved trading calendar, unavailable effective timezone, missing trusted
  `as_of` for relative request, absent accepted event times, inferred market
  hours/holidays, or unresolved coverage/authorization.

### Target Analytics Tool or Query Capability

- Future read-only authorized Journal temporal resolver paired with an approved
  trading-calendar contract; not currently implemented.

### Result Units

- Approved local trading-date interval(s), calendar/version reference,
  effective timezone, selected event basis, corresponding UTC bounds, and
  coverage; no raw/private/source identifiers.

### Fee Handling

- Not applicable; any downstream P/L or cost output retains its own exact fee,
  currency, and eligibility contract.

### Open-Trade Handling

- The trading-date filter cannot convert `legitimate_open`, `needs_decision`,
  or incomplete coverage into a completed result; retain visible coverage.

### Sample-Size Considerations

- Report the approved selected-date count and eligible/excluded coverage where
  the owning query supports it; never infer activity for an unavailable date.

## `rolling_windows` Language Registry

### Exact Definition

- Resolve an elapsed rolling window only from a positive integer duration and
  explicit unit, one trusted server `as_of` instant, selected accepted event
  basis, and declared endpoints. It is elapsed time, not a named local calendar
  period; local rendering requires an effective IANA timezone.

### Formal Wording

- "For the trailing 30 elapsed days ending at the trusted query instant,
  summarize accepted final exits."

### Normal Conversational Wording

- "How did I do in the last 30 days?"

### Trader Slang

- "Pull my last 30-day run."

### Abbreviations

- `30d` means a positive 30-day elapsed window only after unit and endpoint
  convention are declared; `1m` is ambiguous between month and minute.

### Common Misspellings

- `last 30 das`
- `trailing 3o days`

### Noisy or Incomplete Input

- `AAPL last 30` requires a positive integer unit, trusted `as_of`, selected
  event basis, and independently validated ticker.

### Singular and Plural Forms

- "last day" and "last 1 day" are elapsed-duration expressions; "last days"
  lacks a positive integer and is not a valid window.

### Full Questions

- "What was my net result over the last 30 elapsed days ending now?"

### Commands

- "Show final exits from the last 14 days with exact start and end times."

### Sentence Fragments

- `last 30 days`

### Follow-Up Wording

- "Make it 90 days." Retain the same trusted server `as_of`, scope, and
  selected event unless the query contract supplies a new trusted anchor.

### Correction Wording

- "Not this month — trailing 30 days." Replace calendar membership with the
  explicit elapsed-duration contract.

### Comparison Wording

- "Compare the last 30 days with the 30 before that" requires Category 14 to
  define comparison populations after both endpoint-safe windows resolve.

### Ranking Wording

- "Best trade in the last 30 days" requires Category 14 metric, population,
  direction, and ties; this registry supplies only the window.

### Negated Wording

- "Not in the last 30 days" excludes only the resolved interval; missing/open
  timestamps are coverage, not a negative match.

### Exclusion Wording

- "Exclude the last 7 days" requires a valid base population and removes the
  trusted-anchor interval only under Category 12 temporal rules.

### Multi-Filter Wording

- "Last 30 days, ready-closed long AAPL final exits" requires positive
  duration/unit, trusted `as_of`, event basis, authorized scope, and validated
  non-temporal filters.

### Multi-Part Question Wording

- "Show my last 30 days' count and net result with coverage" shares one
  resolved window but retains count, fee, currency, and eligibility contracts.

### Ambiguous Wording

- "Last month" is a calendar/relative phrase, not a rolling month; `30` lacks
  unit; `past few days` lacks a positive integer; `now` needs trusted server
  `as_of`.

### Negative Examples

These examples must not map to this concept.

- "This month" is `relative_dates`/calendar-period resolution.
- "Last five trading days" is `trading_dates`.
- "Last 20 trades" is `record_count_windows`.

### Context Requirements

- Require server-authorized scope, positive integer duration/unit, trusted
  server `as_of`, selected accepted event basis, declared endpoints, accepted
  raw UTC event facts, coverage, and effective timezone only for local display.

### Required Data

- Positive integer duration, explicit unit, trusted server `as_of`, selected
  event basis, endpoint inclusion rule, accepted raw UTC timestamps, and
  authorization/coverage state.

### Optional Data

- Validated ticker/direction/lifecycle/metric filters; effective account IANA
  timezone for rendering; approved grouping after the window resolves.

### Valid Filters

- One explicit elapsed start/end interval over the declared accepted event with
  Category 12-valid temporal membership/comparison semantics.

### Valid Groupings

- Existing owning-field/metric groupings only; a rolling window does not create
  calendar-day buckets, zero dates, or a period comparison.

### Valid Operators

- Category 12 temporal range, inclusion, or exclusion after duration/unit,
  anchor, event basis, and endpoint rules are complete.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, and `inspect_data_quality` when owning facts permit
  the chosen event basis.

### Incompatible Combinations

- Zero/negative/fractional or unitless duration; browser/server-local `now`;
  calendar-month substitution; hidden anchor change; implicit event; reversed/
  undeclared endpoint; cross-account scope; forecast, cause, motive, advice,
  or protected write.

### Default Interpretation

- No window exists without positive integer and unit. Use the trusted server
  `as_of` supplied by query contract; do not default a calendar period,
  timezone, event basis, or endpoint inclusivity.

### Clarification Conditions

- Clarify first the missing duration/unit, then selected event basis, then one
  missing endpoint convention or trusted-anchor prerequisite.

### Recommended Clarification Wording

1. "How many days, weeks, or another explicit unit should the rolling window cover?"
2. If needed: "Which event date should I filter: entry, execution, or final exit?"

### Unsupported Conditions

- Missing positive duration/unit, no trusted server `as_of`, unavailable event
  timestamps, undeclared endpoints, unauthorized scope, or any browser/client/
  server-local clock or calendar fallback.

### Target Analytics Tool or Query Capability

- Future read-only authorized Journal temporal resolver/query validator with
  elapsed-window bounds; not currently implemented.

### Result Units

- Positive duration/unit, trusted `as_of`, explicit start/end instants and
  inclusivity, selected event basis, optional local rendering zone, coverage,
  and no raw/private/source identifiers.

### Fee Handling

- Not applicable; downstream money outputs preserve their fee, currency, and
  metric basis partitions.

### Open-Trade Handling

- Window resolution cannot include or exclude open/decision records contrary to
  their owning eligibility contract; retain visible coverage states.

### Sample-Size Considerations

- Return eligible and coverage-excluded counts when available; elapsed time does
  not promise a minimum number of records or complete activity coverage.

## `record_count_windows` Language Registry

### Exact Definition

- Resolve a last-N record request only from explicit positive integer `N`, one
  authorized eligible population, selected event basis, raw-UTC primary order,
  stable privacy-safe tie order, and declared barriers/coverage. It selects a
  finite set, not an elapsed, calendar, or trading-day period.

### Formal Wording

- "For the 20 most recent eligible ready-closed round trips ordered by final
  exit raw UTC with stable tie handling, summarize net result and coverage."

### Normal Conversational Wording

- "How did I do on my last 20 trades?"

### Trader Slang

- "Pull my last 20 plays."

### Abbreviations

- `last 20 trds` is valid only after `trades` maps to a declared eligible
  population; bare `L20` has no approved meaning.

### Common Misspellings

- `last 20 trdes`
- `last tweny trades`

### Noisy or Incomplete Input

- `AAPL last 20` requires positive `N`, population, selected event/order,
  barriers, and validated ticker.

### Singular and Plural Forms

- "last trade" means `N=1` only when record type/population and event order are
  declared; "last trades" lacks positive `N`.

### Full Questions

- "What was my net result for my last 20 eligible ready-closed round trips by
  final exit order, with coverage?"

### Commands

- "Show my last 10 eligible closed trades and the ordering basis."

### Sentence Fragments

- `my last 20 trades`

### Follow-Up Wording

- "Make it my last 50." Change only positive `N`; retain the same authorized
  population, event/order, stable tie rule, and barriers unless explicitly
  re-resolved.

### Correction Wording

- "Not my last 20 calendar days — my last 20 closed trades." Replace elapsed
  time with finite eligible-record selection.

### Comparison Wording

- "Compare my last 20 with the 20 before that" requires Category 14 to define
  non-overlapping populations and comparison semantics after selection order.

### Ranking Wording

- "Best of my last 20" requires Category 14 metric/direction/ties; `last 20`
  is selection ordering, not rank ordering.

### Negated Wording

- "Not my last 20 trades" is not a safe complement without a declared finite
  base population; clarify rather than infer all other records.

### Exclusion Wording

- "Exclude the last trade" requires explicit eligible population and ordering;
  it removes one selected member without exposing any identifier.

### Multi-Filter Wording

- "My last 20 ready-closed long AAPL trades by final exit" requires positive
  `N`, one authorized eligible population, raw-UTC/stable-ID order, barriers,
  event basis, and independently valid filters.

### Multi-Part Question Wording

- "For my last 20 closed trades, show count and net result with coverage" uses
  one selection set while preserving metric, fee, currency, and coverage rules.

### Ambiguous Wording

- "Last 20 trades" can mean executions, round trips, entries, or closed trades;
  `recent` lacks N; ties and ordering barrier must be declared; it never means
  last 20 days.

### Negative Examples

These examples must not map to this concept.

- "Last 20 days" is `rolling_windows`.
- "Last five trading days" is `trading_dates`.
- "Top 20 trades" is Category 14 ranking.

### Context Requirements

- Require server-authorized scope, one declared eligible population, explicit
  positive N, selected event basis, raw UTC primary ordering, stable internal
  tie order, ordering barriers, privacy-safe output contract, and coverage.

### Required Data

- Positive integer N; authorized eligible population definition; selected event;
  accepted raw UTC timestamps; stable internal tie key; barriers; lifecycle/
  decision coverage; and privacy-safe selection response contract.

### Optional Data

- Validated ticker/direction/source/metric filters and optional resolved
  temporal extent that does not replace the selection contract.

### Valid Filters

- Category 12-valid filters applied only with their ordering point declared:
  whether before selection, within eligible population, or after selection; no
  silent filter/order swap.

### Valid Groupings

- Existing owning groupings after the selected set is fixed; no ranking or
  activity series is implied by last-N selection.

### Valid Operators

- Explicit positive-N selection plus Category 12 filters; no implicit rank,
  complement, calendar window, or unapproved list-membership output.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, and `inspect_data_quality` where the requested record
  type and eligible population are explicit.

### Incompatible Combinations

- Zero/negative/fractional N; undefined record type/population; raw identifier
  disclosure; unstable order/ties; order without raw UTC; omission of barriers;
  silently including decision/open records; last-N-as-rank; scope expansion;
  motive, cause, advice, prediction, or protected write.

### Default Interpretation

- No default record type, population, event, filter timing, tie rule, or
  complement exists. A fully declared authorized eligible selection is required.

### Clarification Conditions

- Clarify first what `trades` means (for example, eligible closed round trips
  versus executions), then N if absent/invalid, then selected event/order or
  filter timing only when still unresolved.

### Recommended Clarification Wording

1. "Do you mean eligible closed round trips or individual executions?"
2. If needed: "How many records should I include?"

### Unsupported Conditions

- Missing positive N, undeclared eligible population/event/order/tie/barrier,
  unavailable accepted timestamps, raw/internal/source-ID request, unauthorized
  scope, or attempt to infer a full complement.

### Target Analytics Tool or Query Capability

- Future read-only authorized Journal selection validator with raw-UTC primary
  ordering and stable internal tie handling; not currently implemented.

### Result Units

- Privacy-safe authorized selection/set, requested/returned counts, selected
  event/order metadata, stable tie/barrier metadata, coverage, and optional
  temporal extent; never raw, internal, or source identifiers.

### Fee Handling

- Not applicable to selection; selected metrics retain exact fee/currency/basis
  contracts.

### Open-Trade Handling

- Include `legitimate_open`, `needs_decision`, or incomplete records only if the
  declared eligible population explicitly permits them; otherwise return their
  coverage separately without silently changing membership.

### Sample-Size Considerations

- Return requested versus eligible selected count and exclusions/coverage; N is
  not evidence of statistical adequacy or complete historical coverage.

## `session_times` Language Registry

### Exact Definition

- Resolve a clock or named-session request only from account-local date and
  clock conversion of accepted raw UTC events, selected event basis, explicit
  effective timezone, approved session/calendar definition where named, and
  declared endpoints. Clock ranges that cross local midnight require explicit
  overnight handling; no named session is inferred. This is distinct from the
  Tracker-only Eastern market-time convention.

### Formal Wording

- "For accepted executions whose account-local clock time falls strictly before
  10:00 on each resolved local date, summarize the covered population."

### Normal Conversational Wording

- "Show my trades before 10:00."

### Trader Slang

- "Pull my early-morning plays."

### Abbreviations

- `9:30-11 ET` requires explicit timezone/context and declared endpoints; `PM`
  may mean afternoon or premarket and is not silently expanded.

### Common Misspellings

- `premrket`
- `aftr hours`

### Noisy or Incomplete Input

- `AAPL b4 10` requires account-local date/timezone, selected event basis,
  explicit 10:00 clock interpretation, and validated ticker.

### Singular and Plural Forms

- "session" requires one approved definition; "sessions" requires each named
  session definition and does not mean any observed time band.

### Full Questions

- "Which accepted executions occurred between 9:30 and 11:00 account-local time
  on the selected dates?"

### Commands

- "Show final exits after 13:00 account-local time with explicit boundaries."

### Sentence Fragments

- `after lunch`

### Follow-Up Wording

- "Now use after hours." Retain prior authorized scope/event/date only; require
  an approved named-session definition instead of inferring one.

### Correction Wording

- "Not before 10:00 inclusive — strictly before 10:00." Preserve strict
  Category 12 comparator semantics.

### Comparison Wording

- "Compare premarket with regular session" requires approved definitions and
  Category 14 comparison population/metric semantics after each resolves.

### Ranking Wording

- "Best trade at the open" requires approved open definition plus Category 14
  metric/direction/ties; session wording alone does not rank.

### Negated Wording

- "Not after hours" excludes only an approved resolved session interval; it
  cannot classify missing/unknown timestamps as regular session.

### Exclusion Wording

- "Exclude trades between 9:30 and 11:00" requires account-local date, event,
  ordered clock bounds, and declared inclusion rule; overnight ranges need
  explicit handling.

### Multi-Filter Wording

- "Ready-closed long AAPL final exits before 10:00 account-local time" requires
  selected date(s), event basis, timezone, strict endpoint, scope, and valid
  non-temporal filters.

### Multi-Part Question Wording

- "Show count and net result before 10:00 with coverage" shares one session/
  clock contract but retains result eligibility, fee, currency, and coverage.

### Ambiguous Wording

- "After lunch," "at the open," "near the close," `9:30`, `PM`, premarket,
  and after hours require timezone/date/event and approved session/endpoint
  definition; a range crossing midnight needs explicit overnight rule.

### Negative Examples

These examples must not map to this concept.

- "July 1" is `calendar_dates`.
- "Last 30 days" is `rolling_windows`.
- "Daily Trade Tracker Eastern time" is
  `daily_trade_tracker_eastern_market_time`, not a generic session definition.

### Context Requirements

- Require authorized selected account, account-local effective IANA timezone,
  resolved local date(s), selected accepted event basis, raw UTC facts, explicit
  clock bounds/endpoints, approved named-session calendar if applicable, and
  coverage. Tracker Eastern has no scope here unless the request is in Tracker.

### Required Data

- Accepted raw UTC timestamps; selected event; account IANA zone with
  per-instant DST; resolved local date(s); clock/session expression; ordered
  endpoints/inclusivity; overnight rule when crossing midnight; named session
  definition/version where used; authorization and coverage.

### Optional Data

- Validated ticker/direction/lifecycle/metric filters and explicit display
  rendering after account-local analytical filtering.

### Valid Filters

- Category 12 strict/inclusive temporal clock predicates and declared clock
  ranges on a resolved account-local date/event; named-session membership only
  through approved definition.

### Valid Groupings

- Existing owning metric/field groupings after session filtering; no inferred
  session labels, market-hours buckets, or daily activity series.

### Valid Operators

- Category 12 `before`/`after` strict comparisons, explicitly declared
  inclusive clock bounds, and ordered range/exclusion after all prerequisites.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, and `inspect_data_quality` where owning event/coverage
  contracts permit the selected event.

### Incompatible Combinations

- Browser/server-local timezone; missing local date/event/zone; assumed open,
  close, lunch, premarket, after-hours, or holiday schedule; `before`/`after`
  made inclusive; reversed/overnight range without rule; Tracker-Eastern
  conflation; scope expansion; motive, cause, advice, forecast, or write.

### Default Interpretation

- No named session or clock endpoint default is approved. Explicit numeric
  clock wording uses account-local timezone only after local date/event and
  strict/inclusive semantics are complete; otherwise clarify.

### Clarification Conditions

- Clarify first the selected event/date basis when absent, then the effective
  timezone, then one missing named-session definition, endpoint, or overnight
  rule. Do not ask a compound checklist.

### Recommended Clarification Wording

1. "Which event time should I use: entry, execution, or final exit?"
2. If needed: "Which account-local date should this clock time use?"
3. If still unresolved: "Which effective account IANA timezone should I use?"
4. If needed for a named session: "Which approved session definition should I use?"

### Unsupported Conditions

- Missing account-local date/zone/event, unavailable raw UTC facts, unnamed or
  unapproved session, guessed schedule, undeclared endpoints, unresolved
  overnight range, unauthorized scope, or client/server-local time fallback.

### Target Analytics Tool or Query Capability

- Future read-only authorized Journal temporal resolver/query validator with
  account-local clock/date conversion and approved session contracts; not
  currently implemented.

### Result Units

- Resolved local date/clock or session interval(s), effective IANA timezone,
  selected event basis, endpoint/overnight contract, session definition/version
  if used, corresponding UTC bounds, and coverage; no raw/private identifiers.

### Fee Handling

- Not applicable to time filtering; downstream money outputs retain their
  original fee, currency, and metric-basis terms.

### Open-Trade Handling

- A session/clock filter cannot change open/decision/incomplete eligibility;
  preserve those coverage states under the owning event/metric contract.

### Sample-Size Considerations

- Report eligible/excluded coverage where supported; no claim that a named
  session has complete market/calendar coverage without its approved source.

## `display_timezone` Language Registry

### Exact Definition

- Render an already authorized/resolved UTC instant in an explicitly stored
  display IANA timezone only. It is presentation-only and cannot rebucket
  account analytics, mutate raw UTC, select an account, or change Tracker time.
### Formal Wording
- "Display the accepted final-exit timestamps in my saved display timezone."
### Normal Conversational Wording
- "Show the times in my timezone."
### Trader Slang
- "Put these times in my local zone."
### Abbreviations
- `ET`, `PT`, and `local` require an explicit stored display IANA preference;
  abbreviations do not select an analytics timezone.
### Common Misspellings
- `timezoen`
- `locla time`
### Noisy or Incomplete Input
- `show AAPL in my time` requires a validated ticker and stored display zone.
### Singular and Plural Forms
- "timezone" is one explicit IANA presentation zone; "timezones" requires a
  separately supported comparison/rendering request.
### Full Questions
- "What time was this accepted execution in my saved display timezone?"
### Commands
- "Render these timestamps in my saved display timezone."
### Sentence Fragments
- `in my timezone`
### Follow-Up Wording
- "Use my display timezone." Change rendering only; retain prior raw UTC,
  authorized scope, event basis, and account-analytic membership.
### Correction Wording
- "Not account time — show my display time." Change presentation only.
### Comparison Wording
- "Compare my timezone with account time" may render labels but Category 14
  owns any analytical comparison; no rebucketing occurs.
### Ranking Wording
- "Best trade in my timezone" requires Category 14 and account-analytic date
  rules; display rendering cannot determine membership or rank.
### Negated Wording
- "Not my timezone" requires an explicit authorized alternate presentation
  preference; it never means use browser/device time.
### Exclusion Wording
- "Do not show local times" removes a presentation format only, not facts.
### Multi-Filter Wording
- "Show ready-closed AAPL final exits in my timezone" combines valid facts and
  filters; the display zone is applied after analytical selection.
### Multi-Part Question Wording
- "Show count and net result, then display dates in my timezone" keeps account
  analytics and money contracts intact before rendering.
### Ambiguous Wording
- "My time," `ET`, `PT`, and `local time` require an explicit saved IANA
  preference; ticker/entity language never supplies one.
### Negative Examples
These examples must not map to this concept.
- "Group my results by my timezone date" is account analytics/time resolution.
- "Use Eastern for Daily Tracker" is `daily_trade_tracker_eastern_market_time`.
- "What account timezone is selected?" is `account_timezone`.
### Context Requirements
- Require authorized resolved result, retained raw UTC, and explicit stored
  display IANA preference. It cannot rely on browser/server/device locale.
### Required Data
- Accepted UTC instant(s), authorized result scope, explicit display IANA zone,
  and timezone-database conversion/DST at each instant.
### Optional Data
- Validated ticker/entity filters and original account-analytic timezone label.
### Valid Filters
- None; presentation timezone is not an analytical filter.
### Valid Groupings
- None; it cannot create/rebucket calendar groups.
### Valid Operators
- Explicit rendering preference only; no Category 12 time predicate is created.
### Compatible Intents
- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, `inspect_data_quality`, and `analyze_trade` after
  their factual result is already resolved.
### Incompatible Combinations
- Analytics rebucketing; raw UTC mutation; browser/server-local fallback;
  account selection; Tracker convention substitution; scope expansion; motive,
  causation, advice, prediction, or write.
### Default Interpretation
- Use display preference only when explicitly stored/authorized or requested;
  otherwise retain the owning result's timezone representation.
### Clarification Conditions
- Clarify one missing field only: the explicit display IANA timezone preference.
### Recommended Clarification Wording
1. "Which saved display IANA timezone should I use for rendering?"
### Unsupported Conditions
- Missing/unauthorized display preference, unavailable UTC instant, request to
  alter analytics membership, raw fact, account scope, or Tracker convention.
### Target Analytics Tool or Query Capability
- Future read-only result renderer with IANA/DST conversion; not implemented.
### Result Units
- Rendered local timestamp/date, display IANA zone, per-instant offset, and
  retained raw UTC/account-analytic metadata; no raw/private identifiers.
### Fee Handling
- Not applicable; rendering cannot alter fee, currency, or P/L basis.
### Open-Trade Handling
- Renders only already authorized returned records and cannot change eligibility.
### Sample-Size Considerations
- No sample change; presentation does not add, remove, or rebucket records.

## `account_timezone` Language Registry

### Exact Definition
- Localize accepted raw UTC events for account-scoped analytics through the
  server-authorized selected account's stored IANA zone and per-instant DST.
  It is authoritative for that account's analytics but never mutates raw UTC or
  makes an account user-selectable outside authorization.
### Formal Wording
- "Use the selected Journal account's IANA timezone for local final-exit dates."
### Normal Conversational Wording
- "Use my account time."
### Trader Slang
- "Run it in the journal's time."
### Abbreviations
- `acct TZ` requires a server-authorized selected account; `ET` is not an
  account timezone unless the stored IANA setting is `America/New_York`.
### Common Misspellings
- `acount timezone`
- `analitics time`
### Noisy or Incomplete Input
- `AAPL account time` requires validated ticker and one authorized account.
### Singular and Plural Forms
- "account timezone" applies to one authorized selected account; "accounts"
  does not authorize comparison, discovery, or cross-account aggregation.
### Full Questions
- "Which local date contains this accepted final exit in the selected account timezone?"
### Commands
- "Use the selected account timezone for this final-exit date filter."
### Sentence Fragments
- `account time`
### Follow-Up Wording
- "Use account time instead." Re-resolve analytics localization for the same
  server-authorized account; do not change raw UTC, scope, or display setting.
### Correction Wording
- "Not my display time — use the selected account timezone." Change analytics
  localization, not source timestamps.
### Comparison Wording
- "Compare accounts by local date" requires separately authorized scope and
  Category 14; this registry cannot select/discover another account.
### Ranking Wording
- "Best account-time day" requires account-local date/event plus Category 14
  metric/population/ties; timezone alone cannot rank.
### Negated Wording
- "Not account time" requires an authorized presentation/Tracker contract; it
  cannot default to browser or server local time.
### Exclusion Wording
- "Exclude account-local July 1" removes one resolved account-local interval
  only after event basis and Category 12 semantics are complete.
### Multi-Filter Wording
- "Ready-closed AAPL final exits on July 1 in account time" requires authorized
  selected account, raw UTC events, IANA DST, event, date, and valid ticker.
### Multi-Part Question Wording
- "Show count and net result by account-local final-exit date with coverage"
  retains metric, fee/currency, and account authorization boundaries.
### Ambiguous Wording
- "Account time," `ET`, and `local` require selected authorized account and
  stored IANA zone; a ticker/entity cannot choose an account.
### Negative Examples
These examples must not map to this concept.
- "Show it in my preferred timezone" is `display_timezone`.
- "Tracker dates in Eastern" is `daily_trade_tracker_eastern_market_time`.
- "Before 10:00" is `session_times`.
### Context Requirements
- Require server-authorized user/workspace/account scope, stored account IANA
  zone, accepted raw UTC event, selected event basis, IANA DST conversion, and
  coverage. User input cannot choose an unauthorized account.
### Required Data
- Authorized selected account, stored IANA timezone, accepted raw UTC event(s),
  selected event basis, timezone database/DST, and lifecycle/decision coverage.
### Optional Data
- Validated ticker/entity/metric filters and display rendering after analytics.
### Valid Filters
- Account-local date/clock filters only after localization and Category 12
  operator semantics; no scope-selection filter.
### Valid Groupings
- Owner-supported account-local date grouping over already authorized scope.
### Valid Operators
- Category 12 temporal predicates after selected event, local calendar/clock,
  endpoint, and coverage contracts resolve.
### Compatible Intents
- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `group_and_aggregate`, `inspect_data_quality`, and `analyze_trade` under
  their authorized account contract.
### Incompatible Combinations
- Raw UTC rewrite; fixed offset; browser/server timezone; display rebucket;
  user-selected unauthorized account; cross-account discovery; scope expansion;
  motive, cause, advice, forecast, or write.
### Default Interpretation
- For account-scoped analytics, use only the server-authorized selected account
  stored IANA zone with per-instant DST; no user/ticker/browser fallback.
### Clarification Conditions
- Clarify first selected event basis if missing, then the authorized account
  context only if it is not already determined server-side.
### Recommended Clarification Wording
1. "Which event date should I use: entry, execution, or final exit?"
2. If needed: "A server-authorized selected Journal account context is required; establish it through the owning account flow, then retry this request."
### Unsupported Conditions
- No authorized selected account, missing stored IANA zone/raw UTC event,
  unauthorized account selection, fixed-offset request, or unresolved coverage.
### Target Analytics Tool or Query Capability
- Future read-only Journal temporal resolver with server-authorized account IANA
  localization; not implemented.
### Result Units
- Account-local date/time, stored IANA zone, per-instant DST offset, selected
  event basis, retained raw UTC, coverage; no private/internal identifiers.
### Fee Handling
- Not applicable; money facts retain existing currency, fee, and metric basis.
### Open-Trade Handling
- Localization may render covered open facts but cannot make open/decision
  records eligible for a metric that excludes them.
### Sample-Size Considerations
- Return eligible/unavailable coverage by the owning query; timezone does not
  repair missing records or imply comparable cross-account samples.

## `daily_trade_tracker_eastern_market_time` Language Registry

### Exact Definition
- Use `America/New_York` as the Tracker-only operational Eastern market-time
  convention for Daily Trade Tracker dates, manual-entry times, sessions, and
  rule cutoffs, applying IANA DST at each instant. It has no scope outside the
  Tracker and does not replace account analytics or display preferences.
### Formal Wording
- "Render the Daily Trade Tracker manual-entry time using its Eastern market-time convention."
### Normal Conversational Wording
- "Use Eastern time for my Daily Tracker."
### Trader Slang
- "Put my tracker day on market time."
### Abbreviations
- `ET` means Tracker `America/New_York` only in explicit Daily Trade Tracker
  context; otherwise it is ambiguous and not an account/display selection.
### Common Misspellings
- `eastern tracker time`
- `daily traker ET`
### Noisy or Incomplete Input
- `AAPL ET tracker` requires explicit Tracker context and validated ticker; it
  does not establish a session or account timezone.
### Singular and Plural Forms
- "Tracker time" is the one Tracker convention; "market times" does not add
  session definitions or other contexts.
### Full Questions
- "What Daily Trade Tracker date contains this manual-entry time in Eastern market time?"
### Commands
- "Show this Tracker rule cutoff in Eastern market time."
### Sentence Fragments
- `Daily Tracker ET`
### Follow-Up Wording
- "Use Tracker Eastern time." Apply only to the existing Tracker date/manual-
  entry/session/rule-cutoff rendering; do not alter account analytics or display.
### Correction Wording
- "Not my display time — use Tracker Eastern time for this rule cutoff."
### Comparison Wording
- "Compare Tracker Eastern with account time" may label renderings but Category
  14 owns analytical comparison; the convention cannot rebucket account facts.
### Ranking Wording
- "Best Tracker ET day" requires Tracker date contract and Category 14; ET
  convention alone cannot define a rank/population.
### Negated Wording
- "Not Tracker ET" requires an explicit different Tracker product decision; it
  never defaults to account/display/browser time.
### Exclusion Wording
- "Exclude Tracker ET times" affects stated Tracker rendering only, not events.
### Multi-Filter Wording
- "Show AAPL Tracker entries before 10:00 ET" requires Tracker context,
  accepted entry-time contract, date, strict endpoint, and no inferred session.
### Multi-Part Question Wording
- "Show Tracker dates and rule cutoffs in ET with coverage" retains lifecycle,
  authorization, and any result metric contracts.
### Ambiguous Wording
- `ET`, "market time," and "open" require explicit Daily Trade Tracker context;
  ticker/entity does not imply Tracker, account zone, display preference, or a
  named session definition.
### Negative Examples
These examples must not map to this concept.
- "Show all analytics in Eastern" is `account_timezone` only if stored so.
- "Show results in my timezone" is `display_timezone`.
- "After hours" is `session_times` with approved definition.
### Context Requirements
- Require explicit Daily Trade Tracker context, accepted Tracker time/event
  contract, `America/New_York` IANA/DST conversion, and authorized Tracker data.
  It has no standalone account scope or generic market-calendar authority.
### Required Data
- Tracker context, applicable Tracker date/manual-entry/session/rule-cutoff
  fact, `America/New_York`, per-instant DST, selected event/time basis, and
  authorization/coverage.
### Optional Data
- Validated Tracker ticker/entity and approved session definition when named.
### Valid Filters
- Tracker-context date/clock filters only under its owning time contract and
  Category 12 semantics; no generic account-analytic rebucketing.
### Valid Groupings
- Existing Tracker-supported dates/groups only; no generic market-session group.
### Valid Operators
- Category 12 temporal predicates after Tracker context, date/event, endpoints,
  and any named-session contract are explicit.
### Compatible Intents
- `retrieve_records`, `analyze_trade`, `assist_daily_review`,
  `inspect_data_quality`, and `summarize_performance` only when their data is
  explicitly in Tracker context and remains read-only.
### Incompatible Combinations
- Account analytics timezone substitution; display preference substitution;
  generic exchange-session inference; scope leakage; raw UTC mutation; implicit
  Tracker context; motive, causation, advice, forecast, or write.
### Default Interpretation
- In explicit Daily Trade Tracker context only, use `America/New_York` with
  per-instant DST for the stated Tracker temporal fields; otherwise do not use it.
### Clarification Conditions
- Clarify Tracker context first if absent, then selected Tracker event/time field,
  then one missing date/endpoint/session prerequisite.
### Recommended Clarification Wording
1. "Is this request for the Daily Trade Tracker?"
2. If needed: "Which Tracker time should I use: entry, manual entry, session, or rule cutoff?"
### Unsupported Conditions
- No explicit Tracker context, unavailable Tracker fact/coverage, attempt to
  use ET outside Tracker, unapproved session inference, or user request to
  change the convention without product decision.
### Target Analytics Tool or Query Capability
- Future read-only Daily Trade Tracker temporal renderer/resolver; not implemented.
### Result Units
- Tracker local date/time, `America/New_York`, per-instant DST offset, selected
  Tracker time basis, retained raw UTC where applicable, coverage; no identifiers.
### Fee Handling
- Not applicable; convention cannot alter P/L, fees, currency, or eligibility.
### Open-Trade Handling
- Renders/organizes only covered Tracker facts; cannot close/classify or make a
  decision-bound trade analytics-ready.
### Sample-Size Considerations
- Report owning Tracker coverage; Eastern rendering neither adds data nor proves
  session/calendar completeness.

---

# 7. Evaluation Cases Deliverable

## 7.1 Evaluation Case Schema

```json
{
  "caseId": "",
  "caseType": "canonical",
  "input": "",
  "expectedPrimaryIntent": "retrieve_records",
  "expectedSecondaryIntents": [],
  "expectedCanonicalConcepts": [
    "calendar_dates"
  ],
  "expectedFilters": [],
  "expectedGroupings": [],
  "expectedOperators": [],
  "expectedComparison": null,
  "expectedTimeRange": null,
  "expectedSelectedEntity": null,
  "expectedContextRequirements": [],
  "expectedCapabilityStatus": "Planned",
  "expectedProtectedAction": null,
  "confirmationExpected": false,
  "clarificationExpected": false,
  "expectedClarificationQuestion": null,
  "unsupportedExpected": false,
  "expectedUnsupportedReason": null,
  "notes": ""
}
```

## 7.2 Batch 1 Structured Evaluation Arrays

### C13-E1: `calendar_dates`

```json
[
  {
    "caseId": "C13-E1-01",
    "caseType": "canonical",
    "input": "Show accepted final exits on 2026-07-01 in the selected account timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation canonical."
  },
  {
    "caseId": "C13-E1-02",
    "caseType": "formal paraphrase",
    "input": "For local calendar date 2026-07-01, retrieve accepted final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"local calendar date 2026-07-01","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation formal paraphrase."
  },
  {
    "caseId": "C13-E1-03",
    "caseType": "conversational paraphrase",
    "input": "Show my trades on 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation conversational paraphrase."
  },
  {
    "caseId": "C13-E1-04",
    "caseType": "trader slang",
    "input": "Pull my July 1, 2026 plays.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"July 1, 2026","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation trader slang."
  },
  {
    "caseId": "C13-E1-05",
    "caseType": "abbreviation",
    "input": "2026-07-01 final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation abbreviation."
  },
  {
    "caseId": "C13-E1-06",
    "caseType": "misspelling",
    "input": "Trades on Jully 1 2026.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Jully 1 2026 normalized to July 1, 2026","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation misspelling."
  },
  {
    "caseId": "C13-E1-07",
    "caseType": "noisy input",
    "input": "AAPL 2026-07-01 final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": ["ticker:AAPL"],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": "ticker:AAPL (validated ticker filter/entity)",
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation noisy input."
  },
  {
    "caseId": "C13-E1-08",
    "caseType": "command",
    "input": "Show final exits on 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation command."
  },
  {
    "caseId": "C13-E1-09",
    "caseType": "fragment",
    "input": "on 2026-07-01",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation fragment."
  },
  {
    "caseId": "C13-E1-10",
    "caseType": "follow-up",
    "input": "Use 2026-07-02 instead.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-02 instead","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-02T00:00:00 inclusive to 2026-07-03T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation follow-up."
  },
  {
    "caseId": "C13-E1-11",
    "caseType": "correction",
    "input": "Not July 1—July 10, 2026.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Not July 1—July 10, 2026","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-10T00:00:00 inclusive to 2026-07-11T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end); correction replaces the prior date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation correction."
  },
  {
    "caseId": "C13-E1-12",
    "caseType": "comparison",
    "input": "Compare 2026-07-01 with 2026-07-02.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "compare_groups"
    ],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01 with 2026-07-02","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"two local-day intervals: [2026-07-01T00:00:00, 2026-07-02T00:00:00) and [2026-07-02T00:00:00, 2026-07-03T00:00:00)","utcBounds":"each interval derived after timezone conversion","endpointRule":"each interval is [start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Temporal expression resolves only; Category 14 owns comparison/ranking semantics."
  },
  {
    "caseId": "C13-E1-13",
    "caseType": "ranking",
    "input": "What was my best trade on 2026-07-01?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "rank_results"
    ],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Temporal expression resolves only; Category 14 owns comparison/ranking semantics."
  },
  {
    "caseId": "C13-E1-14",
    "caseType": "negation",
    "input": "Not 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Not 2026-07-01","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"excluded local-day interval [2026-07-01T00:00:00, 2026-07-02T00:00:00)","utcBounds":"excluded interval derived after timezone conversion","endpointRule":"exclude [start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation negation."
  },
  {
    "caseId": "C13-E1-15",
    "caseType": "exclusion",
    "input": "Exclude 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Exclude 2026-07-01","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"excluded local-day interval [2026-07-01T00:00:00, 2026-07-02T00:00:00)","utcBounds":"excluded interval derived after timezone conversion","endpointRule":"exclude [start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation exclusion."
  },
  {
    "caseId": "C13-E1-16",
    "caseType": "multi-filter",
    "input": "Ready-closed AAPL final exits on 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation multi-filter."
  },
  {
    "caseId": "C13-E1-17",
    "caseType": "multi-part",
    "input": "Show count and net result for 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Resolve one temporal contract while keeping count/money eligibility separate."
  },
  {
    "caseId": "C13-E1-18",
    "caseType": "ambiguous",
    "input": "Show trades on 7/1.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Which event date should I use: entry, execution, or final exit?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation ambiguous."
  },
  {
    "caseId": "C13-E1-19",
    "caseType": "negative example",
    "input": "Last 30 days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Must route to another temporal concept, not this concept."
  },
  {
    "caseId": "C13-E1-20",
    "caseType": "unsupported-data example",
    "input": "Show July 1 without an authorized account timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Required authorized temporal prerequisite is unavailable; do not guess a date, timezone, calendar, event, or coverage.",
    "notes": "calendar_dates evaluation unsupported-data example."
  },
  {
    "caseId": "C13-E1-21",
    "caseType": "selected-entity context example",
    "input": "For selected AAPL, show final exits on 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-02T00:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": {
      "type": "ticker",
      "value": "AAPL"
    },
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis",
      "selected_ticker:AAPL"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation selected-entity context example."
  },
  {
    "caseId": "C13-E1-22",
    "caseType": "cross-category example",
    "input": "Show final exits on 2026-07-01 before 10:00.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "calendar_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"2026-07-01 before 10:00","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"2026-07-01T00:00:00 inclusive to 2026-07-01T10:00:00 exclusive","utcBounds":"derived from those local bounds after timezone conversion","endpointRule":"[start, end)"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "account_iana_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "calendar_dates evaluation cross-category example."
  }
]
```

### C13-E2: `relative_dates`

```json
[
  {
    "caseId": "C13-E2-01",
    "caseType": "canonical",
    "input": "Show accepted final exits yesterday using trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"yesterday","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"local calendar day immediately before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation canonical."
  },
  {
    "caseId": "C13-E2-02",
    "caseType": "formal paraphrase",
    "input": "For the current local week as of trusted query time, summarize final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"current local week as of trusted query time","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"approved local week containing trusted_server_as_of","utcBounds":"derived from week bounds after timezone conversion","endpointRule":"[local Monday 00:00, next local Monday 00:00); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation formal paraphrase."
  },
  {
    "caseId": "C13-E2-03",
    "caseType": "conversational paraphrase",
    "input": "How did I do yesterday?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"yesterday","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"local calendar day immediately before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation conversational paraphrase."
  },
  {
    "caseId": "C13-E2-04",
    "caseType": "trader slang",
    "input": "How were my plays last Friday?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"last Friday","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"most recent completed local Friday before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation trader slang."
  },
  {
    "caseId": "C13-E2-05",
    "caseType": "abbreviation",
    "input": "tdy final exits",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"tdy normalized to today","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"local calendar day containing trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation abbreviation."
  },
  {
    "caseId": "C13-E2-06",
    "caseType": "misspelling",
    "input": "yesturday final exits",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"yesturday normalized to yesterday","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"local calendar day immediately before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation misspelling."
  },
  {
    "caseId": "C13-E2-07",
    "caseType": "noisy input",
    "input": "AAPL last Fri",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": ["ticker:AAPL"],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"last Fri","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"most recent completed local Friday before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": "ticker:AAPL (validated ticker filter/entity)",
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation noisy input."
  },
  {
    "caseId": "C13-E2-08",
    "caseType": "command",
    "input": "Show this week's final exits with exact dates.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"this week","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"approved local week containing trusted_server_as_of","utcBounds":"derived from week bounds after timezone conversion","endpointRule":"[local Monday 00:00, next local Monday 00:00); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation command."
  },
  {
    "caseId": "C13-E2-09",
    "caseType": "fragment",
    "input": "what about last Friday?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"last Friday","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"most recent completed local Friday before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation fragment."
  },
  {
    "caseId": "C13-E2-10",
    "caseType": "follow-up",
    "input": "Now do yesterday.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"yesterday","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"local calendar day immediately before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation follow-up."
  },
  {
    "caseId": "C13-E2-11",
    "caseType": "correction",
    "input": "I meant yesterday, not today.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"yesterday, not today","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"local calendar day immediately before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); correction replaces today; trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation correction."
  },
  {
    "caseId": "C13-E2-12",
    "caseType": "comparison",
    "input": "Compare this week with last week.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "compare_groups"
    ],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"this week with last week","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"two approved local weeks: current week and immediately preceding week relative to trusted_server_as_of","utcBounds":"each week derived after timezone conversion","endpointRule":"each [local Monday 00:00, next local Monday 00:00); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Temporal expression resolves only; Category 14 owns comparison/ranking semantics."
  },
  {
    "caseId": "C13-E2-13",
    "caseType": "ranking",
    "input": "Best trade this week?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "rank_results"
    ],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"this week","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"approved local week containing trusted_server_as_of","utcBounds":"derived from week bounds after timezone conversion","endpointRule":"[local Monday 00:00, next local Monday 00:00); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Temporal expression resolves only; Category 14 owns comparison/ranking semantics."
  },
  {
    "caseId": "C13-E2-14",
    "caseType": "negation",
    "input": "Not this week.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Not this week","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"excluded approved local week containing trusted_server_as_of","utcBounds":"excluded interval derived after timezone conversion","endpointRule":"exclude [local Monday 00:00, next local Monday 00:00); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation negation."
  },
  {
    "caseId": "C13-E2-15",
    "caseType": "exclusion",
    "input": "Exclude yesterday.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Exclude yesterday","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"excluded local calendar day immediately before trusted_server_as_of","utcBounds":"excluded interval derived after timezone conversion","endpointRule":"exclude [start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation exclusion."
  },
  {
    "caseId": "C13-E2-16",
    "caseType": "multi-filter",
    "input": "This week, only ready-closed long AAPL trades.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"This week","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"approved local week containing trusted_server_as_of","utcBounds":"derived from week bounds after timezone conversion","endpointRule":"[local Monday 00:00, next local Monday 00:00); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation multi-filter."
  },
  {
    "caseId": "C13-E2-17",
    "caseType": "multi-part",
    "input": "Show this week's count and net result.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"this week","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"approved local week containing trusted_server_as_of","utcBounds":"derived from week bounds after timezone conversion","endpointRule":"[local Monday 00:00, next local Monday 00:00); trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Resolve one temporal contract while keeping count/money eligibility separate."
  },
  {
    "caseId": "C13-E2-18",
    "caseType": "ambiguous",
    "input": "Show this week.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Which event basis should this week use?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation ambiguous. After event basis, ask for the effective timezone only if unresolved; then require the approved Monday-start local [start,end) week definition only if still unresolved."
  },
  {
    "caseId": "C13-E2-19",
    "caseType": "negative example",
    "input": "July 1, 2026.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Must route to another temporal concept, not this concept."
  },
  {
    "caseId": "C13-E2-20",
    "caseType": "unsupported-data example",
    "input": "Resolve yesterday without trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Required authorized temporal prerequisite is unavailable; do not guess a date, timezone, calendar, event, or coverage.",
    "notes": "relative_dates evaluation unsupported-data example."
  },
  {
    "caseId": "C13-E2-21",
    "caseType": "selected-entity context example",
    "input": "For selected AAPL, show yesterday's final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"yesterday","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"local calendar day immediately before trusted_server_as_of","utcBounds":"derived from that local-day interval after timezone conversion","endpointRule":"[start, end); trusted_server_as_of is required"},
    "expectedSelectedEntity": {
      "type": "ticker",
      "value": "AAPL"
    },
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis",
      "selected_ticker:AAPL"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation selected-entity context example."
  },
  {
    "caseId": "C13-E2-22",
    "caseType": "cross-category example",
    "input": "Show this week before 10:00.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "relative_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"this week before 10:00","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","localBounds":"each local day from current approved week start through trusted_server_as_of, capped at 10:00 local","utcBounds":"derived from each local interval after timezone conversion","endpointRule":"[local Monday 00:00, next local Monday 00:00) with time-of-day predicate before 10:00; trusted_server_as_of is required"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "effective_timezone",
      "approved_week_definition:monday_start_local_[start,end)",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "relative_dates evaluation cross-category example."
  }
]
```

### C13-E3: `trading_dates`

```json
[
  {
    "caseId": "C13-E3-01",
    "caseType": "canonical",
    "input": "Show accepted final exits on the previous approved trading day.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"previous approved trading day","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation canonical."
  },
  {
    "caseId": "C13-E3-02",
    "caseType": "formal paraphrase",
    "input": "For the five immediately preceding approved trading dates, summarize final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"five immediately preceding approved trading dates","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"five approved trading dates immediately before the as_of trading date, selected from the approved calendar","utcBounds":"each resolved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation formal paraphrase."
  },
  {
    "caseId": "C13-E3-03",
    "caseType": "conversational paraphrase",
    "input": "Show me the last five trading days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"last five trading days","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"five approved trading dates immediately before the as_of trading date, selected from the approved calendar","utcBounds":"each resolved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation conversational paraphrase."
  },
  {
    "caseId": "C13-E3-04",
    "caseType": "trader slang",
    "input": "Pull my last five market days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"last five market days","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"five approved trading dates immediately before the as_of trading date, selected from the approved calendar","utcBounds":"each resolved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation trader slang."
  },
  {
    "caseId": "C13-E3-05",
    "caseType": "abbreviation",
    "input": "prev TD final exits",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"prev TD normalized to previous trading day","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation abbreviation."
  },
  {
    "caseId": "C13-E3-06",
    "caseType": "misspelling",
    "input": "prevous trading day",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"prevous normalized to previous trading day","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation misspelling."
  },
  {
    "caseId": "C13-E3-07",
    "caseType": "noisy input",
    "input": "AAPL prev trading day",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": ["ticker:AAPL"],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"prev trading day","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": "ticker:AAPL (validated ticker filter/entity)",
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation noisy input."
  },
  {
    "caseId": "C13-E3-08",
    "caseType": "command",
    "input": "Show the last five approved trading dates.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"last five approved trading dates","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"five approved trading dates immediately before the as_of trading date, selected from the approved calendar","utcBounds":"each resolved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation command."
  },
  {
    "caseId": "C13-E3-09",
    "caseType": "fragment",
    "input": "previous trading day",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"previous trading day","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation fragment."
  },
  {
    "caseId": "C13-E3-10",
    "caseType": "follow-up",
    "input": "Make that the previous two trading days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"previous two trading days","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"two approved trading dates immediately before the as_of trading date, selected from the approved calendar","utcBounds":"each resolved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation follow-up."
  },
  {
    "caseId": "C13-E3-11",
    "caseType": "correction",
    "input": "Not prior calendar day—the prior trading day.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Not prior calendar day—the prior trading day","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date; correction rejects a calendar-day rule"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation correction."
  },
  {
    "caseId": "C13-E3-12",
    "caseType": "comparison",
    "input": "Compare prior trading day with the one before it.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "compare_groups"
    ],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"prior trading day with the one before it","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"two adjacent approved trading dates immediately before the as_of trading date, selected from the approved calendar","utcBounds":"each resolved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Temporal expression resolves only; Category 14 owns comparison/ranking semantics."
  },
  {
    "caseId": "C13-E3-13",
    "caseType": "ranking",
    "input": "What was my best trading day?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "rank_results"
    ],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"trading day","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"all approved trading dates in the authorized active analysis coverage","utcBounds":"each approved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Temporal expression resolves only; Category 14 owns comparison/ranking semantics."
  },
  {
    "caseId": "C13-E3-14",
    "caseType": "negation",
    "input": "Not the previous trading day.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Not the previous trading day","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"excluded approved trading date immediately before the as_of trading date","utcBounds":"excluded interval converted to UTC","endpointRule":"exclude [start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation negation."
  },
  {
    "caseId": "C13-E3-15",
    "caseType": "exclusion",
    "input": "Exclude the last trading day.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Exclude the last trading day","eventBasis":"inherited selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"excluded approved trading date immediately before the as_of trading date","utcBounds":"excluded interval converted to UTC","endpointRule":"exclude [start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation exclusion."
  },
  {
    "caseId": "C13-E3-16",
    "caseType": "multi-filter",
    "input": "Last five trading days, ready-closed long AAPL final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Last five trading days","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","countSemantics":"five approved trading dates immediately before the as_of trading date, selected from the approved calendar","utcBounds":"each resolved local trading-date interval converted to UTC","endpointRule":"each date is [start, end); no calendar-day substitution"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation multi-filter."
  },
  {
    "caseId": "C13-E3-17",
    "caseType": "multi-part",
    "input": "Show prior trading day count and net result.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"prior trading day","eventBasis":"authorized selected event basis","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Resolve one temporal contract while keeping count/money eligibility separate."
  },
  {
    "caseId": "C13-E3-18",
    "caseType": "ambiguous",
    "input": "Trading day.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Which intended trading-date expression should I resolve?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation ambiguous."
  },
  {
    "caseId": "C13-E3-19",
    "caseType": "negative example",
    "input": "Yesterday.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Must route to another temporal concept, not this concept."
  },
  {
    "caseId": "C13-E3-20",
    "caseType": "unsupported-data example",
    "input": "Resolve prior trading day with no approved calendar.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Required authorized temporal prerequisite is unavailable; do not guess a date, timezone, calendar, event, or coverage.",
    "notes": "trading_dates evaluation unsupported-data example."
  },
  {
    "caseId": "C13-E3-21",
    "caseType": "selected-entity context example",
    "input": "For selected AAPL, show the prior trading day's final exits.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"prior trading day","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"one approved trading date immediately before the as_of trading date","utcBounds":"that approved local trading-date interval converted to UTC","endpointRule":"[start, end) for the resolved approved trading date"},
    "expectedSelectedEntity": {
      "type": "ticker",
      "value": "AAPL"
    },
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis",
      "selected_ticker:AAPL"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation selected-entity context example."
  },
  {
    "caseId": "C13-E3-22",
    "caseType": "cross-category example",
    "input": "Prior trading day before 10:00.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "trading_dates"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Prior trading day before 10:00","eventBasis":"final_exit","effectiveTimezone":"authorized selected account IANA timezone","trusted_server_as_of":"required","localBounds":"resolved prior approved trading date from 00:00 inclusive to 10:00 exclusive local","utcBounds":"that local interval converted to UTC","endpointRule":"[start, 10:00) for the resolved approved trading date"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "approved_trading_calendar",
      "trusted_server_as_of",
      "effective_timezone",
      "selected_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "trading_dates evaluation cross-category example."
  }
]
```

## 7.4 Batch 2 Structured Evaluation Arrays

### C13-E4: `rolling_windows`

```json
[
  {
    "caseId": "C13-E4-01",
    "caseType": "canonical",
    "input": "Show accepted final exits in the trailing 30 elapsed days ending at the trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show accepted final exits in the trailing 30 elapsed days ending at the trusted server as_of.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows canonical; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-02",
    "caseType": "formal paraphrase",
    "input": "Retrieve final exits in a positive 30-day elapsed window ending at trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Retrieve final exits in a positive 30-day elapsed window ending at trusted server as_of.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows formal paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-03",
    "caseType": "conversational paraphrase",
    "input": "How did I do over the last 30 elapsed days by final exit?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "How did I do over the last 30 elapsed days by final exit?",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows conversational paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-04",
    "caseType": "trader slang",
    "input": "Pull my 30-day run by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Pull my 30-day run by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows trader slang; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-05",
    "caseType": "abbreviation",
    "input": "Show final exits for trailing 30d ending at trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show final exits for trailing 30d ending at trusted server as_of.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows abbreviation; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-06",
    "caseType": "misspelling",
    "input": "Show final exits for the last 30 das ending at trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show final exits for the last 30 das ending at trusted server as_of.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows misspelling; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-07",
    "caseType": "noisy input",
    "input": "AAPL ready-closed final exits in the last 30 elapsed days ending at trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "AAPL ready-closed final exits in the last 30 elapsed days ending at trusted server as_of.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows noisy input; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-08",
    "caseType": "command",
    "input": "Show final exits in the trailing 14 elapsed days with exact bounds.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show final exits in the trailing 14 elapsed days with exact bounds.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:14",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows command; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-09",
    "caseType": "fragment",
    "input": "last 30 elapsed days by final exit",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "last 30 elapsed days by final exit",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows fragment; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-10",
    "caseType": "follow-up",
    "input": "Make it trailing 90 elapsed days with the same trusted server as_of and final-exit basis.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Make it trailing 90 elapsed days with the same trusted server as_of and final-exit basis.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:90",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows follow-up; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-11",
    "caseType": "correction",
    "input": "Not this calendar month—use trailing 30 elapsed days by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Not this calendar month—use trailing 30 elapsed days by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows correction; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-12",
    "caseType": "comparison",
    "input": "Compare the trailing 30 elapsed days with the preceding 30-day window.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {
      "type": "period_or_group_comparison",
      "owner": "Category 14"
    },
    "expectedTimeRange": {
      "sourceText": "Compare the trailing 30 elapsed days with the preceding 30-day window.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "two nonoverlapping positive-30-day elapsed windows ending at trusted server as_of; never named calendar periods",
      "endpointRule": "[trusted_server_as_of minus 30 elapsed days, trusted_server_as_of) versus [trusted_server_as_of minus 60 elapsed days, trusted_server_as_of minus 30 elapsed days) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows comparison; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-13",
    "caseType": "ranking",
    "input": "Rank trades in the trailing 30 elapsed days by net profit.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {
      "type": "ranking",
      "owner": "Category 14"
    },
    "expectedTimeRange": {
      "sourceText": "Rank trades in the trailing 30 elapsed days by net profit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows ranking; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-14",
    "caseType": "negation",
    "input": "Exclude events outside the trailing 30 elapsed days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "exclusion"
    ],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Exclude events outside the trailing 30 elapsed days.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows negation; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-15",
    "caseType": "exclusion",
    "input": "Exclude the trailing 7 elapsed days from the authorized population.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "exclusion"
    ],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Exclude the trailing 7 elapsed days from the authorized population.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:7",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows exclusion; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-16",
    "caseType": "multi-filter",
    "input": "Ready-closed long AAPL final exits in the trailing 30 elapsed days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      },
      {
        "field": "direction",
        "value": "long"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Ready-closed long AAPL final exits in the trailing 30 elapsed days.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows multi-filter; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-17",
    "caseType": "multi-part",
    "input": "Show count and net result for trailing 30 elapsed days by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show count and net result for trailing 30 elapsed days by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows multi-part; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-18",
    "caseType": "ambiguous",
    "input": "Show my recent trades.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "authorized_account_iana_timezone",
      "staged_clarification:window_kind_then_duration_unit_and_event_basis"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Does “recent” mean an elapsed-time window or a last-N record count?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows ambiguous; Planned evaluation only; no runtime support claim. First clarify elapsed-window versus last-N; only then clarify duration/unit and event basis. Do not assume final_exit."
  },
  {
    "caseId": "C13-E4-19",
    "caseType": "negative example",
    "input": "This calendar month.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Must route elsewhere: calendar period, elapsed window, or Tracker convention is not this concept."
  },
  {
    "caseId": "C13-E4-20",
    "caseType": "unsupported-data example",
    "input": "Resolve trailing 30 days without a trusted server as_of.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Required authorized temporal prerequisite is unavailable; do not invent an anchor, eligible population, ordering, timezone, session, event, or boundary.",
    "notes": "rolling_windows unsupported-data example; Planned evaluation only; no runtime support claim. Return unavailable coverage without clarification or fallback."
  },
  {
    "caseId": "C13-E4-21",
    "caseType": "selected-entity context example",
    "input": "For selected AAPL, show ready-closed final exits in trailing 30 elapsed days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "For selected AAPL, show ready-closed final exits in trailing 30 elapsed days.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": {
      "type": "ticker",
      "value": "AAPL"
    },
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone",
      "selected_ticker:AAPL"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows selected-entity context example; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E4-22",
    "caseType": "cross-category example",
    "input": "Show trailing 30 elapsed days before 10:00 account-local time by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "rolling_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show trailing 30 elapsed days before 10:00 account-local time by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone for local rendering with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "positive-N elapsed duration ending at trusted server as_of; never a named calendar period",
      "endpointRule": "[trusted_server_as_of minus N elapsed days, trusted_server_as_of) in UTC"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "trusted_server_as_of",
      "selected_event_basis:final_exit",
      "positive_integer_duration:30",
      "duration_unit:day",
      "authorized_account_iana_timezone"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "rolling_windows cross-category example; Planned evaluation only; no runtime support claim. Preserve owning Category 12 operator and Category 14 grouping/comparison boundaries."
  }
]
```

### C13-E5: `record_count_windows`

```json
[
  {
    "caseId": "C13-E5-01",
    "caseType": "canonical",
    "input": "Show my last 20 eligible ready-closed round trips ordered by final-exit raw UTC then stable internal ID.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show my last 20 eligible ready-closed round trips ordered by final-exit raw UTC then stable internal ID.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows canonical; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-02",
    "caseType": "formal paraphrase",
    "input": "Retrieve the 20 most recent eligible ready-closed round trips using final-exit raw UTC and stable tie order.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Retrieve the 20 most recent eligible ready-closed round trips using final-exit raw UTC and stable tie order.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows formal paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-03",
    "caseType": "conversational paraphrase",
    "input": "How did I do on my last 20 eligible closed trades by final exit?",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "How did I do on my last 20 eligible closed trades by final exit?",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows conversational paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-04",
    "caseType": "trader slang",
    "input": "Pull my last 20 eligible plays by final-exit order.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Pull my last 20 eligible plays by final-exit order.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows trader slang; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-05",
    "caseType": "abbreviation",
    "input": "Show L20 eligible ready-closed round trips using final-exit UTC order.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show L20 eligible ready-closed round trips using final-exit UTC order.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows abbreviation; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-06",
    "caseType": "misspelling",
    "input": "Show my last tweny eligible closed trades by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show my last tweny eligible closed trades by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows misspelling; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-07",
    "caseType": "noisy input",
    "input": "AAPL last 20 eligible ready-closed round trips by final-exit UTC and stable ties.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "AAPL last 20 eligible ready-closed round trips by final-exit UTC and stable ties.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows noisy input; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-08",
    "caseType": "command",
    "input": "Show my last 10 eligible ready-closed round trips with ordering metadata.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show my last 10 eligible ready-closed round trips with ordering metadata.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:10",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows command; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-09",
    "caseType": "fragment",
    "input": "last 20 eligible closed trades by final exit",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "last 20 eligible closed trades by final exit",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows fragment; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-10",
    "caseType": "follow-up",
    "input": "Make it the last 50 with the same eligible population, barriers, and ordering.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Make it the last 50 with the same eligible population, barriers, and ordering.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:50",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows follow-up; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-11",
    "caseType": "correction",
    "input": "Not last 20 days—last 20 eligible ready-closed round trips.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Not last 20 days—last 20 eligible ready-closed round trips.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows correction; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-12",
    "caseType": "comparison",
    "input": "Compare my last 20 eligible round trips with the 20 immediately before them.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {
      "type": "period_or_group_comparison",
      "owner": "Category 14"
    },
    "expectedTimeRange": {
      "sourceText": "Compare my last 20 eligible round trips with the 20 immediately before them.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select latest 20 and immediately prior 20 nonoverlapping eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe sets and counts, never IDs",
      "endpointRule": "same eligible population, barriers, filter timing, deterministic descending order, and stable tie rule; latest 20 then immediately prior 20; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows comparison; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-13",
    "caseType": "ranking",
    "input": "Rank the last 20 eligible round trips by net profit.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {
      "type": "ranking",
      "owner": "Category 14"
    },
    "expectedTimeRange": {
      "sourceText": "Rank the last 20 eligible round trips by net profit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows ranking; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-14",
    "caseType": "negation",
    "input": "Exclude records outside the last 20 eligible round-trip selection.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "exclusion"
    ],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Exclude records outside the last 20 eligible round-trip selection.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows negation; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-15",
    "caseType": "exclusion",
    "input": "Exclude the latest eligible round trip from the selected last-20 set.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "exclusion"
    ],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Exclude the latest eligible round trip from the selected last-20 set.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows exclusion; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-16",
    "caseType": "multi-filter",
    "input": "Last 20 eligible ready-closed long AAPL round trips by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      },
      {
        "field": "direction",
        "value": "long"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Last 20 eligible ready-closed long AAPL round trips by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows multi-filter; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-17",
    "caseType": "multi-part",
    "input": "For my last 20 eligible closed trades show count and net result with coverage.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "For my last 20 eligible closed trades show count and net result with coverage.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows multi-part; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-18",
    "caseType": "ambiguous",
    "input": "Show my last trades.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Do you mean eligible closed round trips or individual executions?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows ambiguous; Planned evaluation only; no runtime support claim. Ask one field first; do not infer missing temporal context."
  },
  {
    "caseId": "C13-E5-19",
    "caseType": "negative example",
    "input": "Show the last 20 days.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Must route elsewhere: calendar period, elapsed window, or Tracker convention is not this concept."
  },
  {
    "caseId": "C13-E5-20",
    "caseType": "unsupported-data example",
    "input": "Select last 20 trades without an eligible-population or ordering contract.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Required authorized temporal prerequisite is unavailable; do not invent an anchor, eligible population, ordering, timezone, session, event, or boundary.",
    "notes": "record_count_windows unsupported-data example; Planned evaluation only; no runtime support claim. Return unavailable coverage without clarification or fallback."
  },
  {
    "caseId": "C13-E5-21",
    "caseType": "selected-entity context example",
    "input": "For selected AAPL, show last 20 eligible ready-closed round trips by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "For selected AAPL, show last 20 eligible ready-closed round trips by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": {
      "type": "ticker",
      "value": "AAPL"
    },
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids",
      "selected_ticker:AAPL"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows selected-entity context example; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E5-22",
    "caseType": "cross-category example",
    "input": "Show the last 20 eligible round trips and group them by ticker.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "record_count_windows"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show the last 20 eligible round trips and group them by ticker.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized account IANA timezone only for optional displayed temporal extent",
      "utcOrLocalBoundsOrCountSemantics": "select positive N eligible ready-closed round trips by final-exit raw UTC then stable internal-ID tie order; return privacy-safe set and counts, never IDs",
      "endpointRule": "selection barrier and filter timing declared; deterministic descending order; no calendar-duration substitution"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "eligible_population:ready_closed_round_trips",
      "positive_integer_n:20",
      "selected_event_basis:final_exit",
      "primary_order:raw_utc",
      "stable_internal_id_tie_order",
      "ordering_barriers",
      "privacy_safe_selection_no_raw_ids"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "record_count_windows cross-category example; Planned evaluation only; no runtime support claim. Preserve owning Category 12 operator and Category 14 grouping/comparison boundaries."
  }
]
```

### C13-E6: `session_times`

```json
[
  {
    "caseId": "C13-E6-01",
    "caseType": "canonical",
    "input": "Show accepted final exits on 2026-07-01 strictly before 10:00 in the authorized account IANA timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show accepted final exits on 2026-07-01 strictly before 10:00 in the authorized account IANA timezone.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times canonical; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-02",
    "caseType": "formal paraphrase",
    "input": "Retrieve final exits on local date 2026-07-01 in [09:30,11:00) account-local time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Retrieve final exits on local date 2026-07-01 in [09:30,11:00) account-local time.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times formal paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-03",
    "caseType": "conversational paraphrase",
    "input": "Show my final exits after 13:00 on 2026-07-01 account-local time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show my final exits after 13:00 on 2026-07-01 account-local time.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times conversational paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-04",
    "caseType": "trader slang",
    "input": "Pull my early plays before 10:00 on 2026-07-01 by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Pull my early plays before 10:00 on 2026-07-01 by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times trader slang; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-05",
    "caseType": "abbreviation",
    "input": "Show final exits on 2026-07-01 from 09:30-11:00 account-local [start,end).",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show final exits on 2026-07-01 from 09:30-11:00 account-local [start,end).",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times abbreviation; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-06",
    "caseType": "misspelling",
    "input": "Show final exits on 2026-07-01 premrket using approved premarket definition v1.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show final exits on 2026-07-01 premrket using approved premarket definition v1.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "approved_session_definition:premarket-v1"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times misspelling; Planned evaluation only; no runtime support claim. Resolve premrket only to approved premarket definition v1."
  },
  {
    "caseId": "C13-E6-07",
    "caseType": "noisy input",
    "input": "AAPL ready-closed final exits on 2026-07-01 before 10:00 account-local time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "AAPL ready-closed final exits on 2026-07-01 before 10:00 account-local time.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times noisy input; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-08",
    "caseType": "command",
    "input": "Show final exits after 13:00 on 2026-07-01 with strict endpoint.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show final exits after 13:00 on 2026-07-01 with strict endpoint.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times command; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-09",
    "caseType": "fragment",
    "input": "before 10:00 on 2026-07-01 by final exit in account time",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "before 10:00 on 2026-07-01 by final exit in account time",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times fragment; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-10",
    "caseType": "follow-up",
    "input": "Now use [13:00,16:00) on 2026-07-01 with the same event and account timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Now use [13:00,16:00) on 2026-07-01 with the same event and account timezone.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times follow-up; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-11",
    "caseType": "correction",
    "input": "Not at or before 10:00—strictly before 10:00 on 2026-07-01.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Not at or before 10:00—strictly before 10:00 on 2026-07-01.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times correction; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-12",
    "caseType": "comparison",
    "input": "Compare approved premarket v1 final exits with approved regular-session v1 final exits on 2026-07-01.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {
      "type": "period_or_group_comparison",
      "owner": "Category 14"
    },
    "expectedTimeRange": {
      "sourceText": "Compare approved premarket v1 final exits with approved regular-session v1 final exits on 2026-07-01.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "approved_session_definition:premarket-v1",
      "approved_session_definition:regular-session-v1"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times comparison; Planned evaluation only; no runtime support claim. Use the two explicit approved session definitions and the explicitly stated final-exit event basis."
  },
  {
    "caseId": "C13-E6-13",
    "caseType": "ranking",
    "input": "Rank final-exit round trips in approved regular-session v1 on 2026-07-01 by net profit.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {
      "type": "ranking",
      "owner": "Category 14"
    },
    "expectedTimeRange": {
      "sourceText": "Rank final-exit round trips in approved regular-session v1 on 2026-07-01 by net profit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "approved_session_definition:regular-session-v1"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times ranking; Planned evaluation only; no runtime support claim. Use the explicit approved regular-session v1 definition and the explicitly stated final-exit event basis."
  },
  {
    "caseId": "C13-E6-14",
    "caseType": "negation",
    "input": "Exclude final exits at or after 16:00 on 2026-07-01 account-local time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "exclusion"
    ],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Exclude final exits at or after 16:00 on 2026-07-01 account-local time.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "inclusive exclusion at or after 16:00: exclude [16:00, next resolved local-date start) after per-instant DST conversion"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times negation; Planned evaluation only; no runtime support claim. At or after 16:00 is an inclusive >= 16:00 exclusion."
  },
  {
    "caseId": "C13-E6-15",
    "caseType": "exclusion",
    "input": "Exclude [09:30,11:00) final exits on 2026-07-01 account-local time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [
      "exclusion"
    ],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Exclude [09:30,11:00) final exits on 2026-07-01 account-local time.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times exclusion; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-16",
    "caseType": "multi-filter",
    "input": "Ready-closed long AAPL final exits before 10:00 on 2026-07-01 account-local.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [
      {
        "field": "ticker",
        "value": "AAPL"
      },
      {
        "field": "lifecycle",
        "value": "ready_closed"
      },
      {
        "field": "direction",
        "value": "long"
      }
    ],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Ready-closed long AAPL final exits before 10:00 on 2026-07-01 account-local.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times multi-filter; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-17",
    "caseType": "multi-part",
    "input": "Show count and net result before 10:00 on 2026-07-01 by final exit.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [
      "calculate_metric"
    ],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show count and net result before 10:00 on 2026-07-01 by final exit.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times multi-part; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-18",
    "caseType": "ambiguous",
    "input": "Show trades after lunch.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "staged_clarification:event_basis_then_local_date_and_account_iana_timezone_then_approved_lunch_session_or_exact_interval"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Which event basis should I use for trades after lunch?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times ambiguous; Planned evaluation only; no runtime support claim. First clarify event basis, then local date and account IANA timezone, then approved lunch/session definition or exact interval."
  },
  {
    "caseId": "C13-E6-19",
    "caseType": "negative example",
    "input": "Use Daily Trade Tracker Eastern time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Must route elsewhere: calendar period, elapsed window, or Tracker convention is not this concept."
  },
  {
    "caseId": "C13-E6-20",
    "caseType": "unsupported-data example",
    "input": "Resolve premarket with no approved session definition.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Required authorized temporal prerequisite is unavailable; do not invent an anchor, eligible population, ordering, timezone, session, event, or boundary.",
    "notes": "session_times unsupported-data example; Planned evaluation only; no runtime support claim. Return unavailable coverage without clarification or fallback."
  },
  {
    "caseId": "C13-E6-21",
    "caseType": "selected-entity context example",
    "input": "For selected AAPL, show final exits before 10:00 on 2026-07-01 account-local.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "For selected AAPL, show final exits before 10:00 on 2026-07-01 account-local.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "explicit resolved local date and clock/session bounds converted to UTC; named sessions require approved version; overnight ranges declare both local dates",
      "endpointRule": "strict before/after or explicit [start,end); reversed/missing endpoints invalid; overnight only when explicitly spanning midnight"
    },
    "expectedSelectedEntity": {
      "type": "ticker",
      "value": "AAPL"
    },
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_local_date",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "declared_clock_endpoints",
      "selected_ticker:AAPL"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times selected-entity context example; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E6-22",
    "caseType": "cross-category example",
    "input": "Show final exits in overnight range [22:00,02:00) spanning 2026-07-01 to 2026-07-02 account-local.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": [
      "session_times"
    ],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {
      "sourceText": "Show final exits in overnight range [22:00,02:00) spanning 2026-07-01 to 2026-07-02 account-local.",
      "selectedEventBasis": "final_exit",
      "effectiveTimezone": "authorized selected account IANA timezone with per-instant DST",
      "utcOrLocalBoundsOrCountSemantics": "following-date overnight interval from 2026-07-01 22:00 to 2026-07-02 02:00 account-local, converted to UTC with per-instant DST",
      "endpointRule": "explicit [2026-07-01 22:00, 2026-07-02 02:00) account-local; start inclusive, end exclusive"
    },
    "expectedSelectedEntity": null,
    "expectedContextRequirements": [
      "authorized_account_scope",
      "accepted_raw_utc",
      "selected_event_basis:final_exit",
      "resolved_start_local_date:2026-07-01",
      "resolved_end_local_date:2026-07-02",
      "authorized_account_iana_timezone",
      "per_instant_dst",
      "explicit_overnight_range:[22:00,02:00)"
    ],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "session_times cross-category example; Planned evaluation only; no runtime support claim. Preserve owning Category 12 operator and Category 14 grouping/comparison boundaries."
  }
]
```

### C13-E7: `display_timezone`

```json
[
  {
    "caseId": "C13-E7-01",
    "caseType": "canonical",
    "input": "Render accepted final-exit timestamps in my authorized saved display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Render accepted final-exit timestamps in my authorized saved display timezone.","selectedEventBasis":"final_exit retained from the already resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"render the same accepted raw UTC instants after, not during, the owning authorized analytical selection","endpointRule":"presentation-only; no date, clock, membership, or grouping boundary is created or changed"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","retained_account_analytic_timezone","stored_authorized_display_iana_timezone","per_instant_dst","presentation_after_analytic_selection"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone canonical; Planned evaluation only; no runtime support claim. Rendering does not alter account analytics, Tracker time, or raw UTC."
  },
  {
    "caseId": "C13-E7-02",
    "caseType": "formal paraphrase",
    "input": "Present the authorized result's accepted UTC event instants in the saved display IANA timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Present the authorized result's accepted UTC event instants in the saved display IANA timezone.","selectedEventBasis":"retained from the already resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants are rendered after owning selection","endpointRule":"presentation-only; no analytical temporal boundary is changed"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","stored_authorized_display_iana_timezone","per_instant_dst","retained_account_analytic_timezone"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone formal paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-03",
    "caseType": "conversational paraphrase",
    "input": "Show those trade times in my saved display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Show those trade times in my saved display timezone.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants rendered only after prior analytical selection","endpointRule":"presentation-only; no temporal filter or rebucketing"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","stored_authorized_display_iana_timezone","per_instant_dst","retained_account_analytic_timezone"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone conversational paraphrase; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-04",
    "caseType": "trader slang",
    "input": "Put those fills in my local zone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Put those fills in my local zone.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC fill instants rendered after existing selection","endpointRule":"presentation-only; local zone is never inferred from browser or device"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","stored_authorized_display_iana_timezone","per_instant_dst","no_browser_or_device_timezone_default"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone trader slang; Planned evaluation only; no runtime support claim. 'Local' resolves only to an authorized stored display preference."
  },
  {
    "caseId": "C13-E7-05",
    "caseType": "abbreviation",
    "input": "Render these accepted timestamps in my saved ET display preference.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Render these accepted timestamps in my saved ET display preference.","selectedEventBasis":"retained from the already resolved result","effectiveTimezone":"authorized stored display IANA timezone America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants rendered after owning selection","endpointRule":"ET is accepted only because the stored authorized IANA preference is America/New_York; no fixed EST offset or analytics change"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","stored_authorized_display_iana_timezone:America/New_York","per_instant_dst","no_fixed_est_offset"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone abbreviation; Planned evaluation only; no runtime support claim. ET is a presentation label for the explicit stored IANA preference, not an account-timezone selector."
  },
  {
    "caseId": "C13-E7-06",
    "caseType": "misspelling",
    "input": "Show final exits in my saved timezoen.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Show final exits in my saved timezoen.","selectedEventBasis":"final_exit retained from the already resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC final-exit instants rendered after existing selection","endpointRule":"presentation-only; no account-analytic date or membership change"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","stored_authorized_display_iana_timezone","per_instant_dst","retained_account_analytic_timezone"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone misspelling; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-07",
    "caseType": "noisy input",
    "input": "AAPL fills my time pls.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [{"field":"ticker","value":"AAPL"}],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"AAPL fills my time pls.","selectedEventBasis":"retained from the already resolved accepted-execution result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"validated AAPL accepted raw UTC execution instants render after the owning result selection","endpointRule":"presentation-only; ticker does not provide or change a timezone"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","validated_ticker:AAPL","stored_authorized_display_iana_timezone","per_instant_dst","no_browser_or_device_timezone_default"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone noisy input; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-08",
    "caseType": "command",
    "input": "Render the authorized result timestamps in my saved display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Render the authorized result timestamps in my saved display timezone.","selectedEventBasis":"retained from the already resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants rendered after existing selection","endpointRule":"presentation-only; no membership or timezone-default change"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","stored_authorized_display_iana_timezone","per_instant_dst","presentation_after_analytic_selection"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone command; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-09",
    "caseType": "fragment",
    "input": "in my saved display timezone",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"in my saved display timezone","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants rendered after prior selection","endpointRule":"presentation-only; no new temporal selection"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","stored_authorized_display_iana_timezone","per_instant_dst"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone fragment; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-10",
    "caseType": "follow-up",
    "input": "Now use my display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Now use my display timezone.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants rendered after prior authorized selection","endpointRule":"presentation-only follow-up; retains prior scope, event basis, account analytics, and raw UTC"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","stored_authorized_display_iana_timezone","per_instant_dst","retained_account_analytic_membership"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone follow-up; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-11",
    "caseType": "correction",
    "input": "Not account time - show the same timestamps in my saved display time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Not account time - show the same timestamps in my saved display time.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants rendered in a different presentation zone after selection","endpointRule":"correct rendering only; account-analytic dates, groups, filters, and raw UTC remain unchanged"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","stored_authorized_display_iana_timezone","retained_account_analytic_timezone","per_instant_dst"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone correction; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-12",
    "caseType": "comparison",
    "input": "Show each accepted timestamp in my saved display zone beside its account-time label.",
    "expectedPrimaryIntent": "compare_groups",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone","account_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {"type":"presentation_label_comparison","owner":"Category 14"},
    "expectedTimeRange": {"sourceText":"Show each accepted timestamp in my saved display zone beside its account-time label.","selectedEventBasis":"retained from the already resolved result","effectiveTimezone":"authorized stored display IANA timezone and retained authorized account IANA timezone, each with per-instant DST","utcOrLocalBoundsOrCountSemantics":"the same accepted raw UTC instant receives two labels after existing selection","endpointRule":"presentation labels only; no analytical comparison, rebucketing, or new time boundary"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","stored_authorized_display_iana_timezone","retained_authorized_account_iana_timezone","per_instant_dst","presentation_after_analytic_selection"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone comparison; Planned evaluation only; no runtime support claim. Category 14 owns any comparison result; this concept only renders labels."
  },
  {
    "caseId": "C13-E7-13",
    "caseType": "ranking",
    "input": "Rank ready-closed round trips by net profit, then render their timestamps in my saved display timezone.",
    "expectedPrimaryIntent": "rank_results",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [{"field":"lifecycle","value":"ready_closed"}],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": {"type":"ranking","owner":"Category 14"},
    "expectedTimeRange": {"sourceText":"Rank ready-closed round trips by net profit, then render their timestamps in my saved display timezone.","selectedEventBasis":"explicit resolved ranking result event basis","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"ranked authorized result retains its same accepted raw UTC instants; rendering happens after ranking","endpointRule":"display timezone cannot determine rank, ties, lifecycle, or analytical membership"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_ranked_result_scope","accepted_raw_utc","validated_lifecycle:ready_closed","stored_authorized_display_iana_timezone","per_instant_dst","category_14_rank_metric_and_ties"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone ranking; Planned evaluation only; no runtime support claim. Ranking remains Category 14-owned."
  },
  {
    "caseId": "C13-E7-14",
    "caseType": "negation",
    "input": "Do not use my saved display timezone; render the same result in my authorized alternate display preference.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Do not use my saved display timezone; render the same result in my authorized alternate display preference.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"explicit authorized alternate stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants rendered after prior selection","endpointRule":"negation changes a presentation preference only and never falls back to browser or device time"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","explicit_authorized_alternate_display_iana_timezone","per_instant_dst","no_browser_or_device_timezone_default"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone negation; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-15",
    "caseType": "exclusion",
    "input": "Show the same authorized results, but do not show local-time labels.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Show the same authorized results, but do not show local-time labels.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"retained source/account presentation metadata; no alternate display rendering requested","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants and result membership remain unchanged","endpointRule":"excludes only a display format; it cannot exclude records or alter temporal analytics"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","retained_account_analytic_timezone","preserve_result_membership"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone exclusion; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-16",
    "caseType": "multi-filter",
    "input": "Show ready-closed long AAPL final exits in my saved display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [{"field":"ticker","value":"AAPL"},{"field":"lifecycle","value":"ready_closed"},{"field":"direction","value":"long"}],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Show ready-closed long AAPL final exits in my saved display timezone.","selectedEventBasis":"final_exit","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"validated ready-closed long AAPL final-exit raw UTC instants render only after analytical filters and membership resolve","endpointRule":"display timezone is not an additional filter and cannot rebucket the filtered result"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_account_scope","accepted_raw_utc","selected_event_basis:final_exit","validated_ticker:AAPL","validated_lifecycle:ready_closed","validated_direction:long","stored_authorized_display_iana_timezone","per_instant_dst","presentation_after_analytic_selection"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone multi-filter; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-17",
    "caseType": "multi-part",
    "input": "Show count and net result for ready-closed AAPL trades, then render their dates in my saved display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": ["calculate_metric"],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [{"field":"ticker","value":"AAPL"},{"field":"lifecycle","value":"ready_closed"}],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Show count and net result for ready-closed AAPL trades, then render their dates in my saved display timezone.","selectedEventBasis":"explicit resolved metric/result event basis","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"the same authorized result's accepted raw UTC instants render after count/net eligibility, fee, currency, and coverage contracts resolve","endpointRule":"presentation cannot alter count, net-result population, account dates, or currency/fee basis"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_account_scope","accepted_raw_utc","validated_ticker:AAPL","validated_lifecycle:ready_closed","stored_authorized_display_iana_timezone","per_instant_dst","resolved_metric_eligibility_fee_currency_coverage","presentation_after_analytic_selection"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone multi-part; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-18",
    "caseType": "ambiguous",
    "input": "Show these times in local time.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["prior_authorized_resolved_result","accepted_raw_utc","staged_clarification:stored_authorized_display_iana_timezone"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": true,
    "expectedClarificationQuestion": "Which saved display IANA timezone should I use for rendering?",
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone ambiguous; Planned evaluation only; no runtime support claim. Do not infer browser, device, account, Tracker, ET, EST, or EDT timezone."
  },
  {
    "caseId": "C13-E7-19",
    "caseType": "negative example",
    "input": "Group my results by account-timezone date.",
    "expectedPrimaryIntent": "group_and_aggregate",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["account_timezone"],
    "expectedFilters": [],
    "expectedGroupings": ["account_local_date"],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Group my results by account-timezone date.","selectedEventBasis":"retained resolved Journal analytical event basis","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive account-local date grouping from accepted raw UTC events only after authorized scope and event basis resolve","endpointRule":"account-local grouping boundary is Category 14-owned; display timezone cannot create or alter it"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","retained_resolved_journal_event_basis","server_authorized_account_iana_timezone","per_instant_dst","category_14_grouping_contract"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "Must route to account_timezone and Category 14 grouping ownership; display timezone cannot create calendar groups."
  },
  {
    "caseId": "C13-E7-20",
    "caseType": "unsupported-data example",
    "input": "Render this authorized result in my saved display timezone when no authorized stored display preference exists.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": null,
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_resolved_result_scope","accepted_raw_utc","missing_authorized_stored_display_iana_timezone"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": true,
    "expectedUnsupportedReason": "Required authorized presentation preference is unavailable; do not infer browser, device, account, Tracker, ET, EST, EDT, or a fixed offset.",
    "notes": "display_timezone unsupported-data example; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-21",
    "caseType": "selected-entity context example",
    "input": "For selected AAPL, render accepted final-exit timestamps in my saved display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone"],
    "expectedFilters": [],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"For selected AAPL, render accepted final-exit timestamps in my saved display timezone.","selectedEventBasis":"final_exit","effectiveTimezone":"authorized stored display IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"selected AAPL accepted raw UTC final-exit instants render after existing authorized selection","endpointRule":"selected ticker constrains owning result only and does not supply or change display timezone"},
    "expectedSelectedEntity": {"type":"ticker","value":"AAPL"},
    "expectedContextRequirements": ["authorized_account_scope","accepted_raw_utc","selected_event_basis:final_exit","selected_ticker:AAPL","stored_authorized_display_iana_timezone","per_instant_dst","presentation_after_analytic_selection"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone selected-entity context example; Planned evaluation only; no runtime support claim."
  },
  {
    "caseId": "C13-E7-22",
    "caseType": "cross-category example",
    "input": "Show ready-closed AAPL final exits on 2026-07-01 account-local, then render the same timestamps in my saved display timezone.",
    "expectedPrimaryIntent": "retrieve_records",
    "expectedSecondaryIntents": [],
    "expectedCanonicalConcepts": ["display_timezone","calendar_dates","account_timezone"],
    "expectedFilters": [{"field":"ticker","value":"AAPL"},{"field":"lifecycle","value":"ready_closed"}],
    "expectedGroupings": [],
    "expectedOperators": [],
    "expectedComparison": null,
    "expectedTimeRange": {"sourceText":"Show ready-closed AAPL final exits on 2026-07-01 account-local, then render the same timestamps in my saved display timezone.","selectedEventBasis":"final_exit","effectiveTimezone":"authorized account IANA timezone derives the 2026-07-01 analytical bounds; authorized stored display IANA timezone renders results with per-instant DST","utcOrLocalBoundsOrCountSemantics":"filter accepted raw UTC final exits by account-local [2026-07-01T00:00,2026-07-02T00:00), then render the identical included instants in display time","endpointRule":"account-local analytical [start,end) is retained; display rendering does not re-evaluate membership or grouping"},
    "expectedSelectedEntity": null,
    "expectedContextRequirements": ["authorized_account_scope","accepted_raw_utc","selected_event_basis:final_exit","validated_ticker:AAPL","validated_lifecycle:ready_closed","server_authorized_account_iana_timezone","stored_authorized_display_iana_timezone","per_instant_dst","account_local_date_bounds:[2026-07-01,2026-07-02)","presentation_after_analytic_selection"],
    "expectedCapabilityStatus": "Planned",
    "expectedProtectedAction": null,
    "confirmationExpected": false,
    "clarificationExpected": false,
    "expectedClarificationQuestion": null,
    "unsupportedExpected": false,
    "expectedUnsupportedReason": null,
    "notes": "display_timezone cross-category example; Planned evaluation only; no runtime support claim. Calendar-date and account-timezone ownership determine membership before presentation rendering."
  }
]
```

### C13-E8: `account_timezone`

```json
[
  {"caseId":"C13-E8-01","caseType":"canonical","input":"Use the selected Journal account timezone to show accepted final exits on 2026-07-01.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Use the selected Journal account timezone to show accepted final exits on 2026-07-01.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive local [2026-07-01T00:00,2026-07-02T00:00) then filter accepted raw UTC final-exit instants","endpointRule":"account-local [start,end), start inclusive/end exclusive; raw UTC remains unchanged"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone canonical; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-02","caseType":"formal paraphrase","input":"Localize accepted execution instants using the server-authorized selected account IANA timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Localize accepted execution instants using the server-authorized selected account IANA timezone.","selectedEventBasis":"execution","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"convert accepted raw UTC execution instants only for account-local analytical representation","endpointRule":"no fixed offset, browser/device zone, display preference, or raw-UTC reinterpretation"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:execution","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone formal paraphrase; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-03","caseType":"conversational paraphrase","input":"Show my results in the account's time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show my results in the account's time.","selectedEventBasis":"retained resolved result event basis","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"accepted raw UTC instants retain the selected account's authoritative local representation","endpointRule":"account timezone is analytics context, not a browser/device or display setting"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","retained_resolved_event_basis","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone conversational paraphrase; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-04","caseType":"trader slang","input":"Put my fills on the books in account time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Put my fills on the books in account time.","selectedEventBasis":"execution","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"accepted raw UTC execution instants use their authoritative account-local representation","endpointRule":"no change to raw UTC, scope, lifecycle coverage, or account selection"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:execution","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone trader slang; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-05","caseType":"abbreviation","input":"Show accepted final exits in the selected account's ET zone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show accepted final exits in the selected account's ET zone.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected Journal account IANA timezone America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"accepted raw UTC final exits use selected-account local representation","endpointRule":"ET is valid only because the authorized stored account IANA zone is America/New_York; no fixed EST offset"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","account_iana_timezone:America/New_York","per_instant_dst","no_fixed_est_offset"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone abbreviation; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-06","caseType":"misspelling","input":"Show accepted executions in account timezoen.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show accepted executions in account timezoen.","selectedEventBasis":"execution","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"accepted raw UTC execution instants retain authoritative account-local representation","endpointRule":"raw UTC is unchanged and no display/browser timezone is substituted"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:execution","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone misspelling; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-07","caseType":"noisy input","input":"AAPL exits accnt time pls.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[{"field":"ticker","value":"AAPL"}],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"AAPL exits accnt time pls.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"validated AAPL accepted raw UTC final exits retain selected-account local representation","endpointRule":"ticker does not select an account or timezone"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","validated_ticker:AAPL","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone noisy input; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-08","caseType":"command","input":"Use the selected account IANA timezone for this authorized result.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Use the selected account IANA timezone for this authorized result.","selectedEventBasis":"retained resolved result event basis","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants retain account-local analytical representation","endpointRule":"does not select, reveal, or change account identity; raw UTC unchanged"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","retained_resolved_event_basis","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone command; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-09","caseType":"fragment","input":"in account time","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"in account time","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"prior accepted raw UTC result retains account-local analytical representation","endpointRule":"no account choice or browser/device fallback"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","server_authorized_selected_journal_account","accepted_raw_utc","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone fragment; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-10","caseType":"follow-up","input":"Now use the selected account timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Now use the selected account timezone.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"prior accepted raw UTC result retains selected-account local analytic representation","endpointRule":"retains prior authorized scope and event basis; no account identity/choice requested"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","server_authorized_selected_journal_account","accepted_raw_utc","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone follow-up; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-11","caseType":"correction","input":"Not my display timezone - retain the selected account's analytical time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Not my display timezone - retain the selected account's analytical time.","selectedEventBasis":"retained from prior resolved result","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants retain account-local analytical representation","endpointRule":"correction removes presentation preference only; no raw-UTC or membership change"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","server_authorized_selected_journal_account","accepted_raw_utc","account_iana_timezone","per_instant_dst","no_display_timezone_substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone correction; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-12","caseType":"comparison","input":"Compare accepted final-exit counts by selected-account local date for 2026-07-01 and 2026-07-02.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":["account_local_date"],"expectedOperators":[],"expectedComparison":{"type":"period_or_group_comparison","owner":"Category 14"},"expectedTimeRange":{"sourceText":"Compare accepted final-exit counts by selected-account local date for 2026-07-01 and 2026-07-02.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive each account-local [start,end) date interval then compare their accepted raw UTC final-exit populations","endpointRule":"each local date is [start,end); Category 14 owns comparison metric/population"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","account_iana_timezone","per_instant_dst","category_14_comparison_contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone comparison; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-13","caseType":"ranking","input":"Rank ready-closed round trips by net profit for the selected account's 2026-07-01 local date.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[{"field":"lifecycle","value":"ready_closed"}],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":{"type":"ranking","owner":"Category 14"},"expectedTimeRange":{"sourceText":"Rank ready-closed round trips by net profit for the selected account's 2026-07-01 local date.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive account-local date bounds, select eligible raw UTC final-exit membership, then rank","endpointRule":"local [start,end); Category 14 owns net-profit, direction, and ties"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","validated_lifecycle:ready_closed","account_iana_timezone","per_instant_dst","category_14_rank_metric_and_ties"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone ranking; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-14","caseType":"negation","input":"Do not use browser time; keep the selected account's analytical timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Do not use browser time; keep the selected account's analytical timezone.","selectedEventBasis":"retained resolved result event basis","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same accepted raw UTC instants retain account-local analytical representation","endpointRule":"negation excludes browser/device fallback only; no temporal membership change"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","retained_resolved_event_basis","account_iana_timezone","per_instant_dst","no_browser_or_device_timezone_default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone negation; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-15","caseType":"exclusion","input":"Exclude accepted executions outside the selected account's 2026-07-01 local date.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone","calendar_dates"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exclusion"],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Exclude accepted executions outside the selected account's 2026-07-01 local date.","selectedEventBasis":"execution","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive account-local [2026-07-01T00:00,2026-07-02T00:00) and exclude accepted raw UTC execution instants outside it","endpointRule":"include [start,end) only; no browser/device/display/Tracker timezone fallback"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:execution","account_iana_timezone","per_instant_dst","calendar_date:2026-07-01"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone exclusion; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-16","caseType":"multi-filter","input":"Show ready-closed long AAPL final exits on 2026-07-01 in the selected account timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone","calendar_dates"],"expectedFilters":[{"field":"ticker","value":"AAPL"},{"field":"lifecycle","value":"ready_closed"},{"field":"direction","value":"long"}],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show ready-closed long AAPL final exits on 2026-07-01 in the selected account timezone.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"apply validated non-temporal filters to accepted raw UTC final exits within account-local [2026-07-01T00:00,2026-07-02T00:00)","endpointRule":"account-local [start,end); timezone is authoritative analytics context, not a filter"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","validated_ticker:AAPL","validated_lifecycle:ready_closed","validated_direction:long","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone multi-filter; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-17","caseType":"multi-part","input":"Show count and net result for 2026-07-01 account-local, then render timestamps in my saved display timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["account_timezone","display_timezone","calendar_dates"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show count and net result for 2026-07-01 account-local, then render timestamps in my saved display timezone.","selectedEventBasis":"explicit resolved metric/result event basis","effectiveTimezone":"server-authorized selected account IANA timezone derives analytic bounds; authorized display IANA timezone renders after selection, each with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive account-local [2026-07-01T00:00,2026-07-02T00:00), resolve authorized metric population, then render identical included raw UTC instants","endpointRule":"account-local [start,end) governs membership; display rendering cannot change count, net result, fee/currency basis, or membership"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","account_iana_timezone","stored_authorized_display_iana_timezone","per_instant_dst","resolved_metric_eligibility_fee_currency_coverage","resolved_metric_result_event_basis","presentation_after_analytic_selection"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone multi-part; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-18","caseType":"ambiguous","input":"Show these in account time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","staged_clarification:server_authorized_selected_journal_account_context_through_owning_flow"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Please continue from the server-authorized Journal account context in its owning flow.","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone ambiguous; Planned evaluation only; no runtime support claim. Ask one context field, not for account identity or an account choice."},
  {"caseId":"C13-E8-19","caseType":"negative example","input":"Use Eastern time for the Daily Trade Tracker.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Use Eastern time for the Daily Trade Tracker.","selectedEventBasis":"retained authorized Tracker event basis","effectiveTimezone":"Tracker-only America/New_York convention with per-instant DST","utcOrLocalBoundsOrCountSemantics":"Tracker context uses its controlling convention without choosing or altering a Journal account analytics timezone","endpointRule":"Tracker-only operational convention; no cross-context account-timezone fallback"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_context","retained_authorized_tracker_event_basis","tracker_america_new_york_convention","per_instant_dst","no_selected_journal_account_timezone_substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Must route to daily_trade_tracker_eastern_market_time; this does not map to account_timezone."},
  {"caseId":"C13-E8-20","caseType":"unsupported-data example","input":"Localize this authorized result when its selected account has no server-authorized IANA timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","missing_account_iana_timezone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required server-authorized account IANA timezone is unavailable; do not infer a browser, device, display, Tracker, ET, EST, EDT, fixed-offset, or cross-account substitute.","notes":"account_timezone unsupported-data example; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-21","caseType":"selected-entity context example","input":"For selected AAPL, show accepted final exits on 2026-07-01 in the selected account timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone","calendar_dates"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"For selected AAPL, show accepted final exits on 2026-07-01 in the selected account timezone.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected Journal account IANA timezone with per-instant DST","utcOrLocalBoundsOrCountSemantics":"selected AAPL accepted raw UTC final exits are included only when in account-local [2026-07-01T00:00,2026-07-02T00:00)","endpointRule":"account-local [start,end); ticker cannot select account or timezone"},"expectedSelectedEntity":{"type":"ticker","value":"AAPL"},"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","selected_ticker:AAPL","account_iana_timezone","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone selected-entity context example; Planned evaluation only; no runtime support claim."},
  {"caseId":"C13-E8-22","caseType":"cross-category example","input":"Compare 2026-07-01 and 2026-07-02 accepted final-exit counts by selected-account local date, then display both labels in my saved display timezone.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone","calendar_dates","display_timezone"],"expectedFilters":[],"expectedGroupings":["account_local_date"],"expectedOperators":[],"expectedComparison":{"type":"period_or_group_comparison","owner":"Category 14"},"expectedTimeRange":{"sourceText":"Compare 2026-07-01 and 2026-07-02 accepted final-exit counts by selected-account local date, then display both labels in my saved display timezone.","selectedEventBasis":"final_exit","effectiveTimezone":"server-authorized selected account IANA timezone derives analytical groups; saved authorized display IANA timezone renders labels after comparison, each with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive two account-local [start,end) intervals from accepted raw UTC final exits, compare under Category 14, then render labels without rebucketing","endpointRule":"account-local [start,end) governs membership; display zone is presentation-only"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","selected_event_basis:final_exit","account_iana_timezone","stored_authorized_display_iana_timezone","per_instant_dst","category_14_comparison_contract","presentation_after_analytic_selection"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"account_timezone cross-category example; Planned evaluation only; no runtime support claim."}
]
```

### C13-E9: `daily_trade_tracker_eastern_market_time`

```json
[
{"caseId":"C13-E9-01","caseType":"canonical","input":"Use Daily Trade Tracker Eastern market time for my 2026-07-01 tracker entries.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Use Daily Trade Tracker Eastern market time for my 2026-07-01 tracker entries.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"use Tracker local 2026-07-01 date/time representation under controlling convention; retain raw UTC where applicable","endpointRule":"Tracker local [2026-07-01T00:00,2026-07-02T00:00); no account/global/display/browser/device timezone substitution"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst","explicit_tracker_date:2026-07-01","tracker_manual_entry_time","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time canonical; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-02","caseType":"formal paraphrase","input":"Render Daily Trade Tracker manual-entry timestamps under its operational America/New_York convention.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Render Daily Trade Tracker manual-entry timestamps under its operational America/New_York convention.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"render authorized Tracker facts under the convention and retain raw UTC when applicable","endpointRule":"operational Tracker convention only; no analytics rebucketing or generic session definition"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_manual_entry_time","tracker_america_new_york_convention","per_instant_dst","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time formal paraphrase; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-03","caseType":"conversational paraphrase","input":"Show my Daily Tracker times in Eastern market time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show my Daily Tracker times in Eastern market time.","selectedEventBasis":"retained Tracker event or manual-entry basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"authorized Tracker timestamps use the controlling Eastern convention","endpointRule":"Tracker context required; no account/display/browser/device fallback"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst","retained_tracker_event_basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time conversational paraphrase; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-04","caseType":"trader slang","input":"Put my day-tracker fills on NY time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Put my day-tracker fills on NY time.","selectedEventBasis":"Tracker-owned execution time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"authorized Tracker fill facts use the convention; accepted raw UTC remains retained when applicable","endpointRule":"NY time is allowed only in Daily Trade Tracker context and does not imply a market session"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_execution_time","tracker_america_new_york_convention","per_instant_dst","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time trader slang; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-05","caseType":"abbreviation","input":"Use the Daily Tracker ET (America/New_York) convention for the July 2026 entry date.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Use the Daily Tracker ET (America/New_York) convention for the July 2026 entry date.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"the July Tracker America/New_York date resolves the applicable IANA offset at each entry instant","endpointRule":"America/New_York remains the Tracker-only convention and does not select account/display/global timezone"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_manual_entry_time","tracker_america_new_york_convention","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time abbreviation; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-06","caseType":"misspelling","input":"Show Daily Tracker sessions in eastren market time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show Daily Tracker sessions in eastren market time.","selectedEventBasis":"explicit Tracker session/event basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"use only an existing approved Tracker session/rule definition and retained Tracker time facts","endpointRule":"timezone convention alone never invents a named session or endpoints"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst","approved_tracker_session_or_rule_definition"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time misspelling; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-07","caseType":"noisy input","input":"AAPL day tracker time ET pls.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[{"field":"ticker","value":"AAPL"}],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"AAPL day tracker time ET pls.","selectedEventBasis":"retained authorized Tracker event basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"validated AAPL Tracker facts use IANA offset applicable at each instant","endpointRule":"ET denotes the Tracker America/New_York convention with per-instant DST, not a fixed offset"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","validated_ticker:AAPL","tracker_america_new_york_convention","per_instant_dst","retained_authorized_tracker_event_basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time noisy input; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-08","caseType":"command","input":"Apply the Daily Trade Tracker Eastern market-time convention to these authorized Tracker entries.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Apply the Daily Trade Tracker Eastern market-time convention to these authorized Tracker entries.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"authorized Tracker facts use convention without changing raw facts or lifecycle","endpointRule":"cannot escape Tracker scope or become a generic Eastern display/account setting"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_manual_entry_time","tracker_america_new_york_convention","per_instant_dst","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time command; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-09","caseType":"fragment","input":"Daily Tracker Eastern time","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Daily Tracker Eastern time","selectedEventBasis":"retained Tracker event or manual-entry basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"prior authorized Tracker facts use operational convention","endpointRule":"Tracker-only presentation/organization; no account or display timezone substitution"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_tracker_result","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time fragment; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-10","caseType":"follow-up","input":"Now apply Tracker Eastern time to the same Daily Trade Tracker rows.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Now apply Tracker Eastern time to the same Daily Trade Tracker rows.","selectedEventBasis":"retained prior Tracker event or manual-entry basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"same authorized Tracker rows use the controlling convention","endpointRule":"retain Tracker scope/date/session/rule facts; no scope leakage"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_tracker_result","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst","retained_tracker_event_basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time follow-up; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-11","caseType":"correction","input":"Not account time - use Daily Trade Tracker Eastern market time for the entry cutoff.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Not account time - use Daily Trade Tracker Eastern market time for the entry cutoff.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"apply only an approved Tracker rule cutoff to authorized Tracker entry-time facts","endpointRule":"approved Tracker cutoff endpoint required; no generic/account timezone rule substitution"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_manual_entry_time","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time correction; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-12","caseType":"comparison","input":"Compare two approved Daily Tracker rule-cutoff windows using Tracker Eastern time.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":{"type":"period_or_group_comparison","owner":"Category 14"},"expectedTimeRange":{"sourceText":"Compare two approved Daily Tracker rule-cutoff windows using Tracker Eastern time.","selectedEventBasis":"Tracker-owned stated rule/event basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"resolve both approved Tracker cutoff windows under the convention before Category 14 comparison","endpointRule":"each cutoff window must have approved explicit endpoints; timezone does not invent them"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst","two_approved_tracker_rule_cutoff_definitions","category_14_comparison_contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time comparison; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-13","caseType":"ranking","input":"Rank Daily Tracker ready-closed trades by net profit after the approved 10:00 Eastern cutoff.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[{"field":"lifecycle","value":"ready_closed"}],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":{"type":"ranking","owner":"Category 14"},"expectedTimeRange":{"sourceText":"Rank Daily Tracker ready-closed trades by net profit after the approved 10:00 Eastern cutoff.","selectedEventBasis":"approved retained Tracker rule event basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"apply approved Tracker 10:00 cutoff to covered ready-closed Tracker facts before ranking","endpointRule":"strictly after approved 10:00 Tracker cutoff; Category 14 owns metric, direction, and ties"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","validated_lifecycle:ready_closed","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff:10:00","approved_retained_tracker_event_basis","category_14_rank_metric_and_ties","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time ranking; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-14","caseType":"negation","input":"Do not use browser time for Daily Tracker rule cutoffs; keep Tracker Eastern time.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Do not use browser time for Daily Tracker rule cutoffs; keep Tracker Eastern time.","selectedEventBasis":"Tracker-owned stated rule/event basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"approved Tracker cutoff uses controlling convention","endpointRule":"negation excludes browser/device fallback only; approved cutoff endpoint remains required"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff","no_browser_or_device_timezone_default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time negation; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-15","caseType":"exclusion","input":"Exclude Daily Tracker entries at or after the approved 16:00 Eastern rule cutoff.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exclusion"],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Exclude Daily Tracker entries at or after the approved 16:00 Eastern rule cutoff.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"exclude covered Tracker manual-entry times at or after approved local cutoff","endpointRule":"inclusive >= 16:00 only under an approved Tracker rule definition; no invented market-session endpoint"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_manual_entry_time","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff:16:00","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time exclusion; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-16","caseType":"multi-filter","input":"Show ready-closed long AAPL Daily Tracker entries before the approved 10:00 Eastern cutoff.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[{"field":"ticker","value":"AAPL"},{"field":"lifecycle","value":"ready_closed"},{"field":"direction","value":"long"}],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show ready-closed long AAPL Daily Tracker entries before the approved 10:00 Eastern cutoff.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"validated covered Tracker facts apply approved cutoff after scope and lifecycle validation","endpointRule":"strictly before approved 10:00 Tracker cutoff; no unapproved session/calendar inference"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_manual_entry_time","validated_ticker:AAPL","validated_lifecycle:ready_closed","validated_direction:long","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff:10:00","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time multi-filter; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-17","caseType":"multi-part","input":"Show Daily Tracker count and net result after the approved 10:00 Eastern cutoff, with open and decision coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Show Daily Tracker count and net result after the approved 10:00 Eastern cutoff, with open and decision coverage.","selectedEventBasis":"approved retained Tracker rule event basis","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"resolve approved cutoff before metric eligibility; retain open/decision states as coverage without making them eligible","endpointRule":"strictly after approved cutoff; metric fee/currency/population rules remain separate"},"expectedSelectedEntity":null,"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff:10:00","approved_retained_tracker_event_basis","resolved_metric_eligibility_fee_currency_coverage","open_and_decision_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time multi-part; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-18","caseType":"ambiguous","input":"Use Eastern time for these trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["staged_clarification:daily_trade_tracker_context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Is this for the Daily Trade Tracker?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time ambiguous; Planned evaluation only; no runtime support claim. First establish Tracker context, then ask only one missing event/date/cutoff field if needed."},
{"caseId":"C13-E9-19","caseType":"negative example","input":"Render my Journal analytics in the authorized selected account America/New_York timezone.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["account_timezone"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"Render my Journal analytics in the authorized selected account America/New_York timezone.","selectedEventBasis":"retained Journal analytical event basis","effectiveTimezone":"server-authorized selected Journal account IANA timezone America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"Journal analytics use their own account-timezone contract; no Tracker convention applies","endpointRule":"must not route to Tracker; explicit account context is required and display rendering remains separate"},"expectedSelectedEntity":null,"expectedContextRequirements":["prior_authorized_resolved_result","retained_journal_analytical_event_basis","authorized_account_scope","server_authorized_selected_journal_account","accepted_raw_utc","account_iana_timezone:America/New_York","per_instant_dst","no_fixed_offset","no_tracker_convention_leakage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Must route to account_timezone; Daily Tracker Eastern convention has no Journal-analytics scope."},
{"caseId":"C13-E9-20","caseType":"unsupported-data example","input":"Apply Daily Tracker Eastern rule time when no authorized Tracker context or approved cutoff exists.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["missing_authorized_tracker_context_or_approved_tracker_rule_cutoff"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Required Tracker context or approved rule endpoint is unavailable; do not invent a session, cutoff, account/global timezone, browser/device fallback, or fixed ET/EST/EDT offset.","notes":"daily_trade_tracker_eastern_market_time unsupported-data example; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-21","caseType":"selected-entity context example","input":"For selected AAPL, show Daily Tracker entries before the approved 10:00 Eastern cutoff.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":null,"expectedTimeRange":{"sourceText":"For selected AAPL, show Daily Tracker entries before the approved 10:00 Eastern cutoff.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"selected AAPL covered Tracker facts use approved local cutoff","endpointRule":"strictly before approved 10:00 Tracker cutoff; selected ticker cannot provide timezone or invent session"},"expectedSelectedEntity":{"type":"ticker","value":"AAPL"},"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","selected_ticker:AAPL","tracker_manual_entry_time","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff:10:00","existing_lifecycle_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time selected-entity context example; Planned evaluation only; no runtime support claim."},
{"caseId":"C13-E9-22","caseType":"cross-category example","input":"For selected AAPL, compare Daily Tracker ready-closed entries before versus after the approved 10:00 Eastern cutoff, with open and decision coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["daily_trade_tracker_eastern_market_time"],"expectedFilters":[{"field":"lifecycle","value":"ready_closed"}],"expectedGroupings":[],"expectedOperators":[],"expectedComparison":{"type":"period_or_group_comparison","owner":"Category 14"},"expectedTimeRange":{"sourceText":"For selected AAPL, compare Daily Tracker ready-closed entries before versus after the approved 10:00 Eastern cutoff, with open and decision coverage.","selectedEventBasis":"Tracker-owned manual-entry time","effectiveTimezone":"Tracker-only America/New_York with per-instant DST","utcOrLocalBoundsOrCountSemantics":"derive two approved Tracker cutoff populations from covered AAPL facts, then compare under Category 14 while retaining open/decision coverage","endpointRule":"strict before and at-or-after partitions require the approved 10:00 cutoff; no named-session invention"},"expectedSelectedEntity":{"type":"ticker","value":"AAPL"},"expectedContextRequirements":["authorized_tracker_context","daily_trade_tracker_scope","selected_ticker:AAPL","validated_lifecycle:ready_closed","tracker_manual_entry_time","tracker_america_new_york_convention","per_instant_dst","approved_tracker_rule_cutoff:10:00","category_14_comparison_contract","open_and_decision_coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"daily_trade_tracker_eastern_market_time cross-category example; Planned evaluation only; no runtime support claim."}
]
```

## 7.5 Evaluation Progress Summary

| Batch | Concepts | Cases saved | Independently reviewed | Passed | Status |
|---|---|---:|---|---:|---|
| E1-E3 | calendar_dates through trading_dates | 66 | Yes | 66 | Independently reviewed PASS |
| E4-E6 | rolling_windows through session_times | 66 | Yes | 66 | Independently reviewed PASS |
| E7-E9 | display_timezone through daily_trade_tracker_eastern_market_time | 66 | Yes | 66 | Independently reviewed PASS |
| Total | Category 13 | 198 of 198 | 198 | 198 | 0 failed; 0 unreviewed |

**Case-order contract:** Every saved array uses the standard 22 case types in exact order: canonical; formal paraphrase; conversational paraphrase; trader slang; abbreviation; misspelling; noisy input; command; fragment; follow-up; correction; comparison; ranking; negation; exclusion; multi-filter; multi-part; ambiguous; negative example; unsupported-data example; selected-entity context example; cross-category example.



---

# 8. Coverage Report Deliverable

## 8.1 Inventory Coverage

| Measure | Count |
|---|---:|
| Controlling inventory items | 9 |
| Completed canonical records | 9 |
| Incomplete canonical records | 0 |
| Proposed additions | 0 |
| Proposed removals or merges | 0 |
| Locked canonical names | 9 |

## 8.2 Language Coverage

| Measure | Count |
|---|---:|
| Complete 38-subsection registries | 9 |
| Formal variants represented | 9 |
| Conversational variants represented | 9 |
| Slang variants represented | 9 |
| Abbreviations represented | 9 |
| Misspellings represented | 9 |
| Noisy or incomplete inputs represented | 9 |
| Singular and plural forms represented | 9 |
| Full questions represented | 9 |
| Commands represented | 9 |
| Fragments represented | 9 |
| Follow-ups represented | 9 |
| Corrections represented | 9 |
| Comparison examples represented | 9 |
| Ranking examples represented | 9 |
| Negated examples represented | 9 |
| Exclusion examples represented | 9 |
| Multi-filter examples represented | 9 |
| Multi-part examples represented | 9 |
| Ambiguous examples represented | 9 |
| Negative examples represented | 9 |
| Clarification wording subsections represented | 9 |

## 8.3 Evaluation Coverage

| Measure | Count |
|---|---:|
| Total evaluation cases | 198 |
| Independently reviewed and passed | 198 |
| Failed | 0 |
| Unreviewed | 0 |
| Clarification cases | 9 |
| Unsupported cases | 9 |
| Cross-category cases | 9 |
| Cases with nonempty secondary intents | 16 |
| Confirmation cases | 0 |
| Protected-action cases | 0 |
| Non-null time contracts | 174 |
| Null time contracts | 24 |

## 8.4 Data and Tool Coverage

- Required data: server-authorized scope; accepted raw UTC events; explicit
  selected event basis; authoritative account IANA timezone with per-instant
  DST where applicable; trusted server `as_of`; approved calendar/session
  definitions; exact endpoints; eligible populations, ordering, ties, barriers,
  and visible open/decision/incomplete coverage.
- Optional data: validated ticker/entity and other compatible filters, approved
  groupings, and presentation-only display timezone after analytics resolves.
- Missing data: every absent required prerequisite is represented by focused
  clarification or explicit unavailable coverage; no browser/server-local,
  fixed-offset, guessed date/session, identifier, or cross-account fallback.
- Tool targets: future read-only authorized Journal temporal resolver/query
  validator and result renderer under the documented contracts.
- Tools not yet implemented: no Chat parser, calendar/session service, query,
  or renderer is authorized by this inventory.
- Unsupported capabilities: guessed time/calendar/session context, raw/private
  identifier output, unauthorized account selection, motive/causation,
  prediction/advice, and protected writes.

## 8.5 Overlap Review

- Duplicate concepts found: none among the nine controlling records.
- Synonym collisions: calendar versus relative versus trading dates; elapsed
  versus record-count windows; display versus account versus Tracker time; and
  clock/session wording are resolved by their explicit contracts.
- Cross-category conflicts: none unresolved after preserving Category 7 event/
  duration ownership, Category 11 facts, Category 12 operators, and Category 14
  comparison/ranking ownership.
- Terms requiring global ambiguity policy: `local`, `ET`, `last`, `recent`,
  `trading day`, `open`, `close`, `lunch`, `premarket`, and `after hours` retain
  their documented clarification gates.
- Terms requiring user-defined aliases: none added by this category.

## 8.6 Remaining Gaps

- Category-document gaps: none.
- Runtime implementation and runtime verification remain outside this Markdown
  inventory and are not authorized by its Complete status.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete.
- [x] Boundaries are complete.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed item was silently omitted.
- [x] No listed item was silently renamed.
- [x] No listed item was silently merged.
- [x] Proposed additions are separated.
- [x] Duplicate concepts are resolved for planning.

## Canonical Inventory

- [x] Every item has a stable inventory ID.
- [x] Every item has a canonical name.
- [x] Every item has an exact definition.
- [x] Related concepts are distinguished.
- [x] Classification, status, and version are present.

## Language Registry

- [x] All nine registries are complete, independently reviewed PASS, approved,
  and locked.
- [x] Formal wording is complete.
- [x] Conversational wording is complete.
- [x] Trader slang is complete.
- [x] Abbreviations are complete.
- [x] Misspellings are complete.
- [x] Questions are complete.
- [x] Commands are complete.
- [x] Fragments are complete.
- [x] Follow-ups are complete.
- [x] Corrections are complete.
- [x] Comparisons are complete.
- [x] Rankings are complete.
- [x] Negation and exclusion are complete.
- [x] Multi-filter examples are complete.
- [x] Multi-part examples are complete.
- [x] Ambiguity is complete.
- [x] Negative examples are complete.

## Execution Requirements

- [x] Planning-stage required and optional data boundaries are documented.
- [x] Planning-stage defaults, clarification, unsupported, and tool boundaries are documented.
- [x] Item-level filters, groupings, and operators are documented.
- [x] Item-level units, fees, open trades, and sample-size rules are documented.

## Evaluation and Coverage

- [x] Evaluation cases exist for every important concept (198 of 198 reviewed
  and passed).
- [x] Expected structured interpretations are present.
- [x] Negative, ambiguous, unsupported, and cross-category cases are tested.
- [x] Counts, gaps, overlaps, and unsupported capabilities are reported.

## Approval

- [x] Category reached Ready for Review.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Language registries are locked.
- [x] Version is updated.
- [x] Master tracker is updated.
- [x] Change log is updated.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- Comprehensive independent substantive review passed all nine canonical
  records, all nine registries, and all 198 evaluation cases after focused
  temporal, authorization, privacy, and ambiguity remediation.
- Structural audit confirms 9 records, 9 registries with 38 subsections each,
  9 evaluation arrays with 22 cases each, exact 21-key schema/order, 198 unique
  case IDs/inputs, and the Section 8 aggregate counts.
- Lead controller approved and locked the exact names and all nine registries
  on 2026-08-11 after master synchronization.

## Required Changes

- None for Category 13 Version 1.

## Completed Changes

- Preserved the exact nine source groups in source order with explicit
  UTC/IANA/DST, event-basis, period, endpoint, coverage, authorization,
  privacy, and no-invention boundaries.
- Remediated record-count result privacy and clarified that the Tracker Eastern
  convention is operational only within the Daily Trade Tracker context,
  including the session-time distinction.
- Completed and independently passed all nine 38-subsection registries.
- Completed, remediated, and independently passed all nine 22-case evaluation
  arrays, including explicit temporal contracts, staged clarification,
  authorized context, privacy-safe selection, and coverage handling.
- Completed the exact coverage report and workflow synchronization.
- Applied controller approval, locked all nine exact canonical names and all
  nine registries, synchronized the master, and finalized Complete Version 1.

## Approval Decision

- Status: Complete.
- Approved by: Lead controller.
- Approval date: 2026-08-11.
- Version: 1.
- Canonical names locked: Yes.
- Language registries locked: Yes.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-11 | Initial Version 0 planning/inventory draft created | Preserve the exact nine Section 8 date/time source groups and establish temporal safety boundaries before canonical production | 0 |
| 2026-08-11 | Controller accepted the nine-item planning inventory; drafted nine canonical records | Advance only canonical-record production while retaining unapproved/unlocked Version 0 status and deferring registries, evaluations, and coverage | 0 |
| 2026-08-11 | Remediated two canonical-record boundaries after focused review | Keep record-count output privacy-safe and make the Eastern market-time convention operational only inside the Daily Trade Tracker | 0 |
| 2026-08-11 | Drafted Registry Batch 1 for C13-DT-001 through C13-DT-003 | Advance three exact source-order registries while preserving 4-9 as deferred and Version 0 unapproved/unlocked | 0 |
| 2026-08-11 | Drafted Registry Batch 2 for C13-DT-004 through C13-DT-006 | Advance the next three exact source-order registries while preserving 7-9 as deferred and Version 0 unapproved/unlocked | 0 |
| 2026-08-11 | Drafted Registry Batch 3 for C13-DT-007 through C13-DT-009 | Complete the nine exact source-order registry drafts while retaining Version 0 unapproved/unlocked status and deferring evaluations/coverage | 0 |
| 2026-08-11 | Drafted Evaluation Batch 1 C13-E1 through C13-E3 | Save 66 exact-schema cases for the first three concepts while E4-E9 remain pending and no PASS/approval/lock is claimed | 0 |
| 2026-08-11 | Recorded E1-E3 independent PASS and drafted Evaluation Batch 2 C13-E4 through C13-E6 | Save 132 of 198 exact-schema cases while E4-E6 remain unreviewed, E7-E9 remain pending, and no category approval/lock is claimed | 0 |
| 2026-08-11 | Remediated C13-E1 through C13-E3 evaluation contracts | Added resolvable time contracts, relative/trading-date anchors, approved week definitions, and cited entity or clarification corrections; E1-E3 remain unreviewed and Version 0 is not approved or locked | 0 |
| 2026-08-11 | Clarified C13-E2 week-definition contexts | Recorded the approved Monday-start local [start,end) definition on every cited this-week contract and staged the ambiguous clarification without changing review, approval, or lock status | 0 |
| 2026-08-11 | Completed and remediated Evaluation Batches E1-E9 | Preserve exact temporal, timezone, DST, event, endpoint, count, ordering, authorization, privacy, ambiguity, and coverage contracts across 198 cases | 0 |
| 2026-08-11 | Passed comprehensive independent substantive and structural review; advanced to Ready for Review | Record 9 canonical records, 9 complete registries, 198 reviewed/passed cases, exact aggregate coverage, and the unapproved/unlocked Version 0 pre-lock boundary | 0 |
| 2026-08-11 | Lead controller approved and locked Category 13; finalized Complete Version 1 | Preserve 9 Planned canonical records, 9 locked registries, 198 reviewed/passed cases, exact coverage, and the no-runtime-support boundary after master synchronization | 1 |
