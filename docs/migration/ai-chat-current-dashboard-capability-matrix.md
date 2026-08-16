# AI Chat Current Dashboard Capability Matrix

## Status

**Controlling implementation inventory — 2026-08-15.** This document turns
the current TraderLink dashboard into a finite AI Chat delivery target. It is
linked from the [TraderLink AI Companion Plan](ai-chat-plan.md) and tracked in
the [AI Companion Progress](ai-chat-progress.md).

The navigation, active dashboard routes, maintained Help Center collections,
server read services, and canonical command routes were audited again because
the dashboard gained features after the original AI Companion plan was
written. A feature is not considered supported merely because the model knows
its name or the language inventory recognizes the trader's wording.

## Completion rule

Every current user-facing feature must appear once in this inventory and end in
one of four capability states:

- **Read:** Chat can answer through an account-scoped deterministic tool.
- **Draft:** Chat can prepare an editable proposal without changing facts.
- **Confirm:** Chat can perform an allowlisted action only after showing the
  exact proposed change and receiving explicit confirmation.
- **Unavailable:** the deterministic capability is not implemented yet.

Unavailable is not itself a safety judgment. Every unavailable or excluded
item must also carry one of these reasons:

- **Safety-protected:** the action could expose private data, cross an account
  boundary, make an irreversible change, bypass factual checks, or change data
  without the trader seeing and confirming the exact change.
- **Product-excluded:** the owner has decided the function does not belong in
  trader Chat, such as admin controls, trading signals or arbitrary market-data
  access.
- **Not implemented yet:** the function belongs in Chat but still needs its
  deterministic tool, canonical action connection and evaluations.

Normal Journal reads, explanations, analytics, notes, tags, rules and supported
account preferences are not treated as unsafe. Where they change stored data,
the protection is an exact preview and explicit confirmation rather than a
blanket refusal.

Full AI Chat completion requires every row marked **planned** below to be
implemented and evaluated. Routes that redirect to a canonical feature are
aliases, not additional capabilities. Owner administration, secrets, account
erasure, authentication challenges, raw statement access, arbitrary database
queries and trading advice remain deliberately unavailable.

## Current implementation baseline

Local commit `2b4527ac` is the protected first-slice foundation, not the final
AI Chat completion checkpoint. It provides:

- OpenAI Agents SDK orchestration through the Responses API;
- private account-scoped conversations, bounded history, factual snapshots,
  usage receipts, cost reservations and safe provider identifiers;
- eight deterministic tools: completed-trade summary, grouping, list and
  detail; day/week/month Journal context; saved AI Review list and detail; and
  maintained Help Center search;
- confirmed drafts for Daily Tracker notes and Current Focuses, manual
  executions through the canonical preview/commit path, and AI Review delivery
  settings;
- the shared desktop/mobile drawer plus the `/ai-chat` direct-link fallback.

Subsequent protected checkpoints expanded that foundation with current
dashboard Journal, Tracker, Analytics, Import, Data Decisions, Notifications,
Account, saved Analyzer, Trading Rules and Trade Tags reads plus the first
confirmed product-setting actions. The row-by-row states below, not this
historical foundation description, are the current implementation truth.

## Current dashboard inventory

| Product area | Current routes | Deterministic source of truth | Required Chat behavior | Current state |
| --- | --- | --- | --- | --- |
| AI Chat | Global drawer and `/ai-chat` | Account-scoped conversation, message, snapshot and receipt repositories | Create, rename, search, archive and restore private conversations; preserve bounded follow-ups and exact selected context; show factual/action cards from the same reusable Chat surface. | Implemented foundation; matrix capabilities expanding |
| Workspace | `/workspace` | Journal analytics/calendar, `readWorkspaceReviewSummary` for Current Focuses and the latest completed trading-day review, plus `CoachAiReviewRepository` for the latest saved AI Review | Explain the current workspace summary and open the exact related feature. No invented readiness statement. | Read implemented |
| Daily Trade Tracker | `/trade-tracker`, `/trade-tracker/[date]` | Trading-day read model, annotations, rules and review service | Read one day, trades, executions, notes, tags, rule results and review state. Draft notes/focuses. Confirm only the existing allowlisted note/focus save path. | Read and note/focus confirm implemented |
| Swing Trade Tracker | `/trade-tracker/swings` | `JournalTradeTrackerReadService`, Swing note, tag and trade-style services | List/detail active swings and their executions, notes, tags and status. Draft notes/tags/status changes; require confirmation through canonical commands. | Read implemented; actions planned |
| Quick Trade Entry | `/quick-trade-entry` | Manual trade preview and command services | Convert supplied facts into an editable preview and save only after explicit confirmation. Explain duplicate/reconciliation outcomes without bypassing Data Decisions. | Confirm implemented |
| Calendar | `/calendar` | `JournalDashboardReadModelService.getCalendar`, Calendar annotation evidence in `calendar-data.ts`, trading-day review state and ticker/day detail reads | Answer month/week/day questions, list exact daily trades, annotations and review state, and open the selected day. | Read implemented |
| Trading Rules | `/rules`, `/rules/results` | Rule dashboard, deterministic preset evaluator and saved custom-rule reviews. Rule recommendation evidence requires the separate planned deterministic recommendation service and does not exist yet. | List saved presets/custom rules, settings, applicable scope and exact results for a bounded period. Add/revise a preset or custom rule and pause/resume/retire an exact rule only through preview and trader confirmation. Never mark a result by model judgment or activate a rule autonomously. | Read and draft/confirm implemented; recommendation read not implemented yet |
| Trade Explorer | `/analytics/trade-explorer` | Bounded current Trade Explorer page model/query | Apply only the filters, groupings and metrics the current Explorer supports and return the exact resulting trades/summary. Reuse the page query contract rather than creating a second analytics engine. The Trade Explorer is incomplete and will be updated; keep this adapter isolated, describe unsupported Explorer behavior as unavailable, and revise its contract when the accepted Explorer update lands. | Current bounded read implemented; product incomplete |
| Open Positions | `/trades/open` | Open-position dashboard read model and trade-style service | List/detail factual open positions and current trader-defined type. Draft a type/status change and require confirmation. Never infer swing, long-term hold or bag holding. | Read implemented; actions planned |
| Analytics Overview | `/analytics` | `JournalAnalyticsService.getAnalyticsOverview` | Return exact overview cards and supported date/currency scope with coverage. | Dedicated read implemented |
| Results by Ticker | `/analytics/results` | `getResultAnalytics` | Return exact ticker results, sortable fields and supporting completed trades. | Dedicated read implemented |
| Timing | `/analytics/timing` | `getTimingAnalytics` | Return entry/exit time, weekday and session results with exact population and coverage. | Dedicated read implemented |
| Execution | `/analytics/execution` | `getExecutionAnalytics` and round-trip table | Return execution-count, scaling, quantity and related execution analytics without implying market-volume facts. | Dedicated read implemented |
| Day Trade Analysis | `/analytics/trade-analyzer/day` | Daily Trade Analyzer repository and long-term analytics service | Report analyzed coverage and saved analysis for eligible completed day trades only. | Saved read implemented |
| Entry & Exit | `/analytics/trade-analyzer/day/entry-exit` | Saved analyzer entry/exit facts | Explain the trader's saved entry/exit results and unavailable coverage. | Saved read implemented |
| MFE & MAE | `/analytics/trade-analyzer/day/mfe-mae` | Saved MFE/MAE facts | Return saved excursion facts and supported aggregates; never calculate from missing candles. | Saved read implemented |
| Green-to-Red | `/analytics/trade-analyzer/day/green-to-red` | Saved analyzer path facts | Return saved Green-to-Red evidence and exact population. | Saved read implemented |
| Candle Patterns | `/analytics/trade-analyzer/day/candle-patterns` | Saved analyzer pattern facts | Return detected supported candle patterns as observations, not trading signals. | Saved read implemented |
| Analyzed Trades | `/analytics/trade-analyzer/day/trades` | Daily Trade Analyzer repository | List/paginate analyzed trades and open the associated detail. | Saved read implemented |
| Candle Review | `/trades/candle-review` | `CandleReviewRepository.findTarget/readCurrent` | Read eligible saved candle review results and status. Requesting new provider work remains outside normal conversational reads until its paid-use confirmation contract is accepted. | Saved read implemented; provider action unavailable |
| AI Reviews | `/ai-reviews`, saved weekly/two-week/monthly review detail routes | Saved-review service and review schedule/settings commands | List/read weekly, two-week and monthly saved reviews, compare a review with later exact facts, request an eligible review when the canonical command allows it, and confirm delivery settings. | Saved read, delivery schedule and on/off confirmation implemented; eligible request planned |
| Market Charts | `/charts` | Current chart UI and its approved market-data sources | Explain how to use charts and open the route. Do not claim live quote/candle access through Chat unless a dedicated bounded market-data tool is later approved. | Help only; market facts unavailable |
| Import Trades | `/imports` | Import history/product service and broker-connection status | List imports, status, counts, supported formats and next repair step. No raw statement content enters Chat. Upload, mapping and broker authentication stay in their guarded UI. | Read implemented; guarded actions excluded |
| Data Decisions | `/data-decisions` | `JournalProductReadService` and `JournalDataDecisionService` | List/detail unresolved items in plain language with privacy-safe affected execution references. Draft supported confirmation, grouped-fill, source-limitation, exclusion/restoration or duplicate choices only from one exact detail result; require confirmation through the canonical resolution service. Numeric corrections and raw-statement comparisons stay in Data Decisions. | Read and bounded draft/confirm implemented |
| Notifications | `/notifications` | `PlatformNotificationRepository` | List recent notifications, explain their destination, mark one read, and confirm notification preference changes. | Read, one-notification mark-read and Discord preference confirmation implemented |
| Account profile | `/account/profile` | Account profile read service | Explain current non-secret profile/account state. Profile identity changes remain in Account UI unless a canonical confirmed command is accepted. | Read implemented; actions remain in Account UI |
| Account trading accounts | `/account/trading` | Journal account service and account selector | List privacy-safe Journal accounts, explain the selected account, switch accounts, or create a named account with an exact currency and trading timezone through confirmed canonical commands. Never merge, delete or reassign ownership through Chat. | Read, selection and confirmed creation implemented |
| Moomoo connection and automatic imports | `/account/trading`, `/imports` | `MoomooConnectionRepository`, connected-account link state and `MoomooExecutionImportCommandService` status | Explain privacy-safe connection, linked-account and automatic-import configuration state. OAuth/sign-in, disconnect, link changes, backfill, schedule changes and import runs remain in the guarded Account/Import UI until a separately reviewed confirmation contract exists. | Privacy-safe read implemented; guarded actions product-excluded from current Chat |
| Account preferences | `/account/preferences` | User preference repository | Read and confirm supported display/reporting-currency preferences. | Read and reporting-currency confirmation implemented |
| Account AI | `/account/ai` | AI Review delivery and entitlement settings | Read enabled features, schedule and availability; confirm supported schedule/opt-out settings. | Read and schedule confirmation implemented |
| Account privacy | `/account/privacy` | Privacy settings and erasure boundary | Explain privacy/retention and link to controls. Account/data erasure always stays outside Chat. | Help/read only |
| Help Center | `/help` and maintained guide collections | `HELP_SEARCH_RECORDS` | Search and answer from maintained product help with links. | Read implemented |
| Trade Tags | Daily/Swing Tracker annotation surfaces and `/help/trade-tags` | Annotation service and preset/custom tag catalog | Read the exact tags, trade note and saved custom-rule reviews on one completed trade, explain available tags, and draft a complete replacement set. Saving requires an exact before/after preview and the canonical tag command. Tags remain trader observations, never proof of cause, emotion, setup quality or a rule outcome. | Completed-Day-trade read/draft/confirm implemented; Swing tag action planned |
| Paid plan and billing | Account/Help billing surfaces | Entitlement read and customer billing URLs | Explain current entitlement and link to billing. No purchase, cancellation or payment action through Chat. | Planned read/help; actions unavailable |

## Aliases and non-product routes

The following paths do not receive separate tools:

- `/manual-entry` redirects to the canonical manual-entry experience.
- `/account` redirects to `/account/preferences`.
- `/analytics/trade-analysis` redirects to `/analytics/trade-analyzer/day`.
- `/trades/ticker` redirects to Results by Ticker.
- `/trades/roundtrips` redirects to Execution.
- `/trades` redirects to Calendar.
- former day-session and Swing detail paths resolve to their canonical Tracker
  pages.
- former Analytics Lab paths redirect to current Analytics surfaces and do not
  restore the removed Lab runtime.
- `/reflection-loop` redirects to AI Reviews.
- `/workspace/readiness`, AI benchmark preview, owner Journal Administration,
  Watchlist operations and legacy Intelligence routes are operational,
  development, owner-only or preserved compatibility surfaces. Normal trader
  Chat cannot inspect or change them.

## Planned deterministic tool families

Tool names are implementation-facing and never appear as normal UI copy. Each
tool must have a strict schema, bounded result size, selected-account scope,
coverage state and representative evaluation cases.

### Journal and tracker reads

- `get_workspace_summary`
- `get_trading_day_details`
- `list_swing_positions`
- `get_swing_position_details`
- `get_calendar_period`
- `list_open_positions`
- `get_open_position_details`

### Rules, tags and review evidence

- `list_trading_rules`
- `get_trading_rule_results`
- `list_saved_rule_recommendations` — blocked on the separately planned
  deterministic rule-recommendation evidence service; it must not be exposed
  before that source exists.
- `get_trade_annotations`

The three implemented reads above are selected-account scoped. Rule-result
requests cover at most 62 days and return no more than 50 individual events;
their exact summaries remain complete for the requested period. Preset
outcomes come only from the deterministic evaluator, custom outcomes come only
from saved trader reviews, and unavailable evidence remains unavailable.

### Analytics and exploration

- `get_analytics_overview`
- `get_results_by_ticker`
- `get_timing_analytics`
- `get_execution_analytics`
- `query_trade_explorer`

`query_trade_explorer` is a versioned adapter to the currently implemented
Explorer, not a declaration that the page is complete. Its current factual
coverage must remain narrow and replaceable so future Explorer work does not
require rewriting unrelated Chat capabilities.

The existing completed-trade summary/group/list/detail tools remain the shared
lower-level factual primitives. Dedicated page-aligned tools must not duplicate
calculations; they adapt the canonical services and return the same population,
coverage and sorting as the dashboard.

### Trade Analyzer and market-context results

- `get_trade_analyzer_results` — one strict `view` selects Day, Entry/Exit,
  MFE/MAE, Green-to-Red or Candle Patterns without multiplying provider tools.
- `list_analyzed_trades`
- `get_saved_candle_review`

These tools read saved analysis only. Chat cannot fetch arbitrary market data,
turn patterns into signals, or imply that missing coverage is zero.

### Data, settings and platform state

- `list_imports`
- `list_data_decisions`
- `get_data_decision_details`
- `list_notifications`
- `get_account_profile`
- `get_account_trading`
- `get_account_preferences`
- `get_account_ai_plan`

Raw statement rows may be shown only inside the existing private Data Decisions
or Import UI. Chat receives bounded, redacted deterministic fields needed to
describe the issue; it never receives statement files, account identifiers or
broker credentials.

## Confirmed action matrix

| Action | Reason/state | Chat may prepare | Required final authority and current existence |
| --- | --- | --- | --- |
| Daily note, trade note, Current Focuses | Supported | Yes | Existing Daily Companion draft/confirm routes and repository |
| Manual executions | Supported | Yes | Existing `/manual-entry-drafts` preview/commit routes, canonical manual preview, duplicate/reconciliation checks and command service |
| Swing note | Not implemented yet in Chat | Yes | Existing `/api/platform/journal/swings/[positionRef]/notes` command; Chat-specific persisted expiring draft/confirm contract still required |
| Open-position or Swing status/type | Not implemented yet in Chat | Yes | Existing `/api/platform/journal/trade-style/[positionRef]` command; Chat-specific persisted expiring draft/confirm contract still required; classification comes from the trader |
| Preset/custom rule activation or settings | Implemented | Yes | Persisted expiring Chat action draft resolves an opaque rule reference or maintained preset, validates every setting, rejects stale revisions, and confirms through `mutateJournalTradingRules`. Trader-confirmed activation is allowed; autonomous activation is forbidden. |
| Trade tags | Completed-Day-trade replacement supported; Swing tag action not implemented yet | Yes | Persisted expiring Chat action draft confirms one completed trade through `JournalAnnotationService.replaceRoundTripTagsWithPresets` after exact current-tag and tag-catalog revision checks; Swing tags still require their separate position command connection |
| Data Decision confirmation/exclusion/duplicate resolution | Bounded supported subset implemented | Yes | Persisted expiring Chat action draft resolves an opaque pending decision and execution references, recreates the canonical resolution against the current revision, and confirms through `JournalDataDecisionService.resolve`. Numeric corrections, missing rows, coverage facts and raw-statement comparisons remain in the guarded Data Decisions UI. |
| AI Review delivery schedule | Supported | Yes | Existing Chat review-delivery draft/confirm routes and Account command |
| AI Review opt-out or eligible request | Existing AI Review on/off confirmation supported; eligible review request not implemented yet in Chat | Yes | Persisted expiring Chat action draft reuses `CoachReviewDeliveryScheduleRepository.saveV2` with revision protection; a request still requires the existing entitlement/cost command and a separate confirmation contract |
| Notification read state/preferences | Supported | Yes | Persisted expiring Chat action drafts confirm through `PlatformNotificationRepository.markRead` and `replaceDiscordDmCategories` after exact target/current-state checks |
| Reporting currency | Supported | Yes | Persisted expiring Chat action draft confirms through `PlatformUserPreferenceRepository.updateActiveUserReportingCurrency` after a stale-value check |
| Selected Journal account and new Journal account | Implemented | Yes | Persisted expiring Chat action drafts resolve one exact existing account or preview an exact new account name, currency and timezone. Confirmation rejects a stale account roster, enforces the workspace-manager and 25-account boundaries, calls the canonical account service, and returns the normal opaque selection cookie. |
| Import upload/mapping/commit or Moomoo authentication/connection changes | Product-excluded from current Chat | No | Guarded Import/Account UI only |
| Raw statement, credentials, account numbers, private identity or secret access | Safety-protected | No | Never enters trader Chat or provider context |
| Delete or directly rewrite an execution/Journal fact | Safety-protected | No | Corrections use canonical Data Decisions/manual-edit UI with exact evidence; no direct Chat deletion path |
| Delete an AI conversation | Product decision: archive/restore only | No | Current Chat preserves history and supports archive/restore; deletion is not part of this plan |
| Account or user-data erasure | Safety-protected irreversible action | No | Existing Account Privacy erasure control only |
| Purchase/cancel billing, change login identity, ownership or roles | Product-excluded from Chat | No | Guarded billing/authentication/account UI only |
| Change admin controls, API keys, models or cost caps | Safety-protected owner administration | No | Journal Administration only |

Every allowed mutation uses a server-issued draft identifier, expires safely,
shows the exact before/after change in the Chat surface, accepts one explicit
confirmation, is idempotent, records a privacy-safe audit reference, and
returns the canonical command result. General replies such as “yes” may confirm
only the one visible pending action in that conversation.

## Conversation and agent design

- Keep one manager agent for the trader-facing conversation. Deterministic
  tools remain narrow server functions; model orchestration does not become a
  second business-logic layer.
- Provide only the tools relevant to the current request and selected page
  context. The manager has explicit output, refusal and stopping rules plus a
  bounded tool-call budget.
- Preserve account/date/ticker/trade context across follow-ups only while it is
  visible to the trader. The server re-resolves every reference and rejects
  stale or cross-account context.
- Use compact summaries for large result sets and offer pagination/drill-down.
  Do not send a whole account history merely because it fits a model context
  window.
- Operational logs contain safe identifiers/hashes, timings, states, tool
  names, token counts and costs. Original messages and full replies stay only
  in the private account-scoped conversation record.

## Evaluation and acceptance matrix

Each tool/action family must pass all applicable checks before its capability
is promoted from unavailable to live:

1. **Exactness:** values, population, sorting, date/timezone, currency,
   unavailable states and coverage match the canonical dashboard service.
2. **Isolation:** cross-user, cross-workspace, cross-account and stale-context
   references fail closed without leaking existence or values.
3. **Conversation:** direct request, paraphrase, follow-up, correction,
   ambiguous scope and unsupported request produce the expected behavior.
4. **Action safety:** preview, edit, confirmation, rejection, expiry, retry and
   duplicate confirmation preserve one canonical result. Existing dashboard
   mutation routes alone are not proof: each Chat action must also prove its
   account-scoped draft persistence, expiry, idempotency and one-time confirm
   transition.
5. **Privacy:** provider input and normal logs contain no raw statement,
   credential, account number, Discord identity, admin-only data or secret.
6. **Cost:** bounded tool calls, context, output and reservation/receipt totals
   are enforced independently for Chat, Weekly Reviews and Monthly Reviews.
7. **UI:** drawer/direct page use the same capability, stay closable on desktop
   and mobile, preserve the current dashboard page and show clear factual or
   confirmation cards in plain trader language.
8. **Links and page context:** every returned link is selected from an
   allowlisted TraderLink route contract; day/trade/ticker/review references are
   server-resolved; stale or mismatched current-page hints fail closed; and the
   drawer preserves the page the trader was using.
9. **Live provider:** representative read, follow-up, unavailable, draft,
   confirm and refusal cases pass using the configured OpenAI Agents SDK
   runtime without enabling provider-side private response storage or tracing.

The final technical checkpoint also runs the focused Chat/tool suites with one
worker, targeted lint and TypeScript checks, migration verification for any new
schema, a controlled no-worker browser pass, and only then the broader final
acceptance checks required by the repository plan.

## Delivery order

1. Lock this current-product inventory and correct the parent plan/progress
   language so the first slice is not mistaken for full completion.
2. Add page-aligned deterministic reads for Journal/Tracker and Analytics.
3. Add Trade Analyzer, Import, Data Decisions, Notifications and Account reads.
4. Add allowlisted draft/confirmation actions one canonical command family at
   a time, with focused safety checks before exposing the capability.
5. Update the language capability mapping and Help Center after each completed
   family; recognized language never outruns executable support.
6. Run representative agent evaluations, live provider verification,
   responsive browser acceptance, privacy/cost/account-scope checks and the
   final completion audit.

## Plan QA record

The 2026-08-15 plan audit confirms:

- every primary navigation destination is represented;
- current Account sections, Notifications, Rule Results and Candle Review are
  represented even though they are not all primary navigation links;
- compatibility, removed, development and owner-only routes are separated;
- every proposed factual tool names an existing canonical read source or is
  explicitly marked blocked on a not-yet-implemented deterministic source;
- every proposed mutation names its current command/route, explicitly marks
  the missing Chat draft contract, and requires exact preview plus
  confirmation; and
- the completion gate measures executable capability, not language inventory
  size, UI presence or model fluency.
