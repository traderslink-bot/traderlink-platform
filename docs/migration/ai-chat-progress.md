# AI Companion Progress

## Status

The expanded professional-agent acceptance target is now designed in the
[Links AI Chat Professional Agent Remediation Plan](ai-chat-professional-agent-remediation-plan.md)
and tracked in its
[progress record](ai-chat-professional-agent-remediation-progress.md). That
plan is owner approved. The first source implementation checkpoint now includes
relationship memory, Meet Links, adaptive context beyond the former 12-message
window, exact-value claim validation, readiness-aware Chat states, the approved
Links presentation and aligned Help. Disposable migration, focused static
verification and a disposable desktop/mobile browser pass succeed; owner visual
acceptance remains open.

The current-plan technical implementation and local acceptance are complete.
Production provider enablement, final caps and launch operations remain owner
launch decisions. The parent plan is [TraderLink AI Companion Plan](ai-chat-plan.md).
The complete current-product target is the
[Links AI Chat Current Dashboard Capability Matrix](ai-chat-current-dashboard-capability-matrix.md).
The completed whole-feature audit is recorded in the
[Links AI Chat Complete QA Report](ai-chat-complete-qa-report.md).
The private persistence API checkpoint is tracked in
[Links AI Chat Persistence API Progress](ai-chat-api-progress.md).

## Accepted existing foundation

- AI Reviews has an approved weekly and calendar-month direction under
  [AI Reviews Plan](ai-weekly-review-plan.md).
- The replacement has owner-only provider/cost controls and immutable
  generation-cost tracking for review work.
- Current Focuses carry dated revisions for later review context.
- The complete language/query contract is finalized in the
  [Links AI Chatbot Complete Language Plan](traderslink_ai_chatbot_complete_language_plan.md).
- The category-by-category language delivery program is governed by the
  [AI Language Inventory Master](traderslink_ai_language_inventory_master.md)
  and its [required category template](category_completion_template_example.md).
- All twenty language-inventory categories are complete, independently
  reviewed and locked at Version 1. The inventory contains 417 canonical names
  and now controls runtime-registry generation and evaluation; it is no longer
  an unfinished planning dependency.

## Planned work

- [ ] Complete the owner-approved professional-agent remediation covering exact
  server-authored factual claims, durable conversation state, professional
  availability/failure UX, evaluated complex orchestration, current inventory
  reconciliation, and accepted new deterministic data/action tools.
- [x] Complete and link the AI Companion product plan and language/query plan.
- [x] Approve the complete integrated AI Companion direction for implementation.
- [x] Add the schema-only, account-scoped Links AI Chat foundation migration.
- [x] Implement and verify the AI Reviews schedule/list/detail foundation.
- [x] Implement account-scoped Chat persistence, ordered-message history,
  immutable factual snapshots, and generation-receipt contracts over migration
  `0029`.
- [x] Implement the separate Chat provider boundary and cost-control service.
- [x] Add the responsive saved-conversation Chat page and dashboard navigation.
- [x] Complete the twenty-category language inventory program and review/lock
  its canonical vocabulary before generating runtime registries.
- [x] Replace the transitional four-tool Vercel AI SDK Chat loop with the
  official OpenAI Agents SDK/Responses orchestration layer while preserving all
  existing TraderLink persistence, cost, scope and confirmation authorities.
- [x] Implement the first supportable private Links AI Chat question families through
  a machine-readable capability registry and eight deterministic factual
  tools.
- [x] Replace navigation-away Chat as the primary experience with the shared
  closable desktop/mobile dashboard drawer; retain `/ai-chat` as a direct-link
  fallback over the same reusable Chat surface.
- [x] Implement the Daily Trade Tracker companion drafting/confirmation flow
  for daily notes, one selected trade note, and Current Focuses. Tags, rule
  outcomes, executions, position classifications and review completion remain
  trader-controlled outside this AI write path.
- [x] Integrate conversational manual execution drafts with the canonical
  Journal preview and commit commands.
- [x] Let Chat prepare an allowlisted AI Review delivery day/time change and
  require explicit trader confirmation through the normal settings command.
- [x] Finish the scheduled AI Review control-enforcement slice: audit the
  Weekly/Monthly reservation retry and timeout paths, finish its owner-only
  controls, and record its narrow verification/commit checkpoint.
- [x] Implement the current-dashboard Journal/Tracker read families: Workspace,
  Daily Tracker, Swing Tracker, Calendar and Open Positions.
- [x] Implement page-aligned Analytics reads and an isolated, versioned adapter
  for Trade Explorer without creating a second calculation engine. The
  accepted follow-up now separates factual per-trade sorting from grouped
  ranking, keeps Result explicit and preserves the exact completed-trade Review
  handoff.
- [x] Implement saved Trade Analyzer and Candle Review result reads with exact
  coverage and unavailable states.
- [x] Implement Import, Data Decisions, Notifications, Account and entitlement
  reads without exposing statements, credentials, billing identity, admin data
  or secrets. Paid-plan questions use the privacy-safe entitlement projection
  plus the maintained billing Help guides; purchases, cancellations and payment
  changes remain outside Chat.
- [x] Add allowlisted Swing note, explicit open-position type and Swing tag
  drafts/confirmed actions through canonical commands. Position types are
  always selected by the trader and never inferred by Chat.
- [x] Add the eligible AI Review request action through the canonical
  availability and pending-request services. Confirmation does not start a
  provider call.
- [x] Add the owner-approved account setting actions through
  canonical commands. Trading Rules and completed-trade annotations
  have deterministic reads, and exact completed-trade/Swing tag replacement,
  confirmed Trading Rule changes and the bounded safe Data Decision action set
  are complete. Reporting
  currency, notification read/preferences, selected-account switching, exact
  confirmed Trade Tracker account creation and
  existing AI Review on/off changes are complete. Profile/authentication,
  broker-connection, billing, deletion and owner-administration changes remain
  deliberately in their guarded product surfaces.
- [x] Promote the language registry and Help Center only as each deterministic
  family becomes executable.
- [x] Complete live OpenAI Agents SDK verification. Five synthetic cases passed
  through the real configured `gpt-5.6-sol` Responses/Agents runtime: grounded
  entitlement read, refreshed follow-up, conversational manual executions,
  confirmation-only reporting-currency draft and unsupported stock-advice
  refusal. The verifier enforces complete usage accounting and a caller-supplied
  total cost ceiling. It reads no private Journal data and performs no product
  mutation.
- [ ] Implement production entitlement, scheduled-delivery, operational, and
  privacy-deletion decisions at their separate launch boundaries.

## 2026-08-20 Links relationship-memory implementation

- The professional-agent work now includes a source-only migration and private
  API foundation for approved cross-conversation relationship memory. User-wide
  memory and selected-Journal-account memory are distinct from Chat history and
  from current financial evidence.
- The implementation provides explicit save, versioned edit/reconfirmation,
  enable/disable, secure forget/forget-all, Meet Links skip and atomic Meet Links
  completion. It does not silently infer or save a memory.
- Migration `0067` was later applied to the protected local database by the PWA
  acceptance owner after fresh pre-apply backup/restore verification. The exact
  67-migration schema, integrity, unchanged pre-existing table counts, four
  empty new memory tables and fresh post-apply backup/restore all passed. The
  approved first-impression and **What Links remembers** interface is now
  implemented under the professional-agent progress record.

## Completed foundation: Agents SDK and global Links AI Chat companion

### 2026-08-18 Trade Explorer capability reconciliation

- `query_trade_explorer` now has explicit result families. `trades` accepts
  only one factual row sort and applies it before bounded pagination. Trading
  Days, Tickers, Entry Times, Holding Time, Position Size and Periods each
  accept only their current supported grouping, one Rank by metric and an
  ascending or descending direction, with unavailable values last inside each
  factual currency/timezone partition.
- The compact runtime capability registry advanced to
  `coach_ai_chat_runtime_capabilities_v3` so provider instructions cannot reuse
  the superseded generic Trade Explorer description. The factual-tool contract
  advanced to `coach_ai_chat_factual_tools_v2` for the new result-family shape;
  existing immutable answer snapshots remain historical evidence and are not
  replayed as current requests.
- Win, loss and flat remain explicit outcome filters. Profit factor, win rate,
  averages, medians and expectancy cannot be used as individual-trade sorts.
  The adapter still reuses the canonical Journal Analytics service, exact
  reporting-currency coverage and the server-selected account scope.
- Chat can read one exact confirmed completed trade's saved note, tags and
  custom-rule reviews. It explains a preset result only when the bounded
  rule-result read returned the exact applicable event; otherwise it points to
  Review. The combined Review is not a Chat mutation:
  the Trade Explorer editor retains one explicit atomic Save, stale-state
  rejection and read-only preset results. Existing tag proposals still require
  their exact before/after confirmation card.
- The maintained Links AI Chat Help guide and current-dashboard capability matrix now
  describe this boundary. Advanced comparison studies remain unavailable.
- Repository instructions prohibited Vitest and other test-runner execution
  for this slice. Verification used targeted lint, no-emit TypeScript and
  diff/static contract checks without a provider call, Journal write, browser
  server, push or deployment.

### 2026-08-16 second whole-feature QA checkpoint

- A second independent audit reconciled the then-current dashboard inventory with
  the runtime, Help and language registry. The live boundary remains exactly 13
  capability families, 34 deterministic factual tools and 12 confirmed action
  kinds. The remaining locked language entries do not become executable merely
  because their wording is recognized in planning documents.
- Two reliability defects were corrected. Paid usage is now receipted and the
  generation reaches a failed terminal state if derived confirmation content
  cannot be materialized. Pending-answer polling also refreshes all four draft
  collections so a completed reply never requires a page reload to reveal its
  confirmation card. The later 2026-08-18 Trade Explorer-only reconciliation is
  recorded above and does not change the 13/34/12 family, tool or action counts.
- The final one-worker Chat population passed 161 tests across 26 files; only
  the opt-in paid-provider file/test was skipped. Focused lint and the full
  no-emit TypeScript check passed. That evidence predates the separately
  recorded 2026-08-18 Trade Explorer adapter reconciliation.
- Fresh desktop and 390 by 844 mobile browser checks verified the shared
  drawer, direct page, route preservation, close action and account-scoped
  conversation/draft reads with no browser warnings or errors. The controlled
  no-worker review server was stopped.

### 2026-08-15 final local acceptance checkpoint

- The current dashboard capability matrix is implemented for every approved
  deterministic Read, Draft and Confirm family. Deliberately excluded
  authentication, billing, erasure, raw-statement, secret, broker-connection
  and owner-administration operations remain in their guarded product UI.
- At this 2026-08-15 checkpoint, Trade Explorer still used its earlier generic
  bounded adapter. The accepted Sort/Rank and Review contract was reconciled
  separately on 2026-08-18 as recorded above.
- The cumulative factual-tool result ceiling is 48 KB. This keeps bounded
  trade and analytics evidence available while reserving the expanded tool
  schemas, trusted page context, bounded conversation and structured response
  inside the immutable 256 KB provider-input ceiling. Oversized results still
  fail closed rather than being shortened or guessed.
- A focused one-worker acceptance run covered 16 Chat test files. Fourteen
  files and 82 tests passed on the first run; the run exposed the expanded
  provider envelope exceeding its ceiling. After the bounded-result correction,
  the generation and dispatcher files passed all 12 tests, completing the same
  original 91-case acceptance population without a provider request. Six added
  action-safeguard checks plus one registry-drift check and the final
  privacy-safe paid-access/Help checks bring the deterministic acceptance
  population to 100 cases and directly
  prove scoped list/confirm/reject routes, mutation-request enforcement,
  no-write rejection, 24-hour expiry and stable expired-draft retries.
- The expiry evaluation exposed and corrected one retry defect: confirming an
  already-expired action now returns the same terminal draft instead of trying
  to expire it again and reporting a conflict. A runtime inventory guard also
  compares the Agents SDK tool list with the deterministic factual-tool
  registry before any provider call; capability drift fails closed and is
  covered by the focused inventory suite.
- A Node-only live verifier now covers five synthetic cases against the actual
  OpenAI Agents SDK. The accepted run completed in 28.4 seconds and remained
  below its $2 estimated-cost ceiling. It proved grounded factual tool use,
  follow-up fact refresh, execution extraction without a mode button, an exact
  confirmation draft and a no-tool refusal. It printed no key, prompt, answer,
  provider body or private Journal value and did not open the platform database.
- The platform `ai_chat` control remains disabled with no production caps. That
  is intentional after technical verification: production model/pricing,
  request/token/spend caps, entitlement and activation remain owner launch
  settings rather than an implementation shortcut.
- The final no-provider regression passed 160 tests across 26 Chat files with
  one worker and no file parallelism; the opt-in live-provider file and test
  were correctly skipped in that ordinary run. Targeted ESLint and the full
  no-emit TypeScript check also passed. The final diff and browser results are
  recorded in the complete QA report and runtime progress record.
- Controlled no-worker browser acceptance passed on `/workspace` and
  `/ai-chat`. On desktop and a 390 by 844 mobile viewport, Links AI Chat opened from
  navigation without changing `/workspace`, exposed a visible close action,
  closed without trapping the trader, and reported no browser console errors.
  The direct page loaded the same saved-conversation surface.
- TraderLink's local Chat provider state remains disabled and no Chat API key
  is configured. A representative live Agents SDK request therefore remains
  an owner-only launch input, not an implementation workaround. No key was
  copied from another application, no provider request was made, and no push
  or deployment occurred.

### 2026-08-15 checkpoint

- The owner set the target as a best-in-market trading-journal companion and
  approved continuing the complete Links AI Chat program without narrowing the
  language or product plan.
- The current protected foundation is reusable: migrations `0029`-`0031`,
  account-scoped conversations/messages/snapshots, cost reservations and
  receipts, Daily Companion drafts, AI Review setting drafts, and the canonical
  manual-execution preview/commit path remain authoritative.
- The former transitional Chat adapter used `@ai-sdk/openai` and a hand-written
  `generateText` loop with four closed-trade factual tools. The official
  `@openai/agents` package now owns Chat orchestration over the Responses API.
  One bounded manager agent can call eight narrow deterministic tools, while
  private-content tracing and provider response storage remain disabled.
- AI Reviews and import-repair provider adapters remain unchanged. The Chat
  migration does not authorize moving those separate features to the Agents SDK.
- The final Chat uses one primary manager agent, narrow server-bound tools,
  bounded locally persisted context, a privacy-safe hashed provider safety
  identifier, saved usage receipts and explicit confirmation for every
  proposed Journal or Account Settings change. The existing reservation model
  remains conservative when provider caching lowers the final bill; separate
  cached-input pricing is retained as a production-launch accounting boundary.
- The shared dashboard shell now has a closable right drawer on
  desktop and a full-width closable surface on mobile. It preserves the current
  dashboard page and uses the existing Chat component; `/ai-chat` remains the
  direct-link fallback. Daily Tracker and saved AI Review actions can open that
  same drawer with server-resolved context and a suggested opening question.
- Natural execution requests no longer require the visible **Enter trades in
  chat** mode. The optional shortcut may remain as guidance, but extraction,
  editable preview and explicit final confirmation remain mandatory.
- The locked twenty-category language inventory is compiled into a generated,
  digest-checked registry containing all 417 accepted entries. Only canonical
  names mapped to a deterministic runtime capability are exposed to the
  manager agent. The remaining vocabulary stays locked for future language and
  evaluation work; this checkpoint does not claim a deterministic runtime
  parser or unavailable-state router for those unmapped entries, and they
  cannot authorize a fabricated calculation.
- The runtime capability registry exposes completed-trade analytics, bounded
  day/week/month Journal context, saved AI Review follow-ups, maintained
  product help, selected-day writing drafts, manual-execution drafts, and the
  review-delivery setting draft.
- The trader can enforce **Recent 90 days**, one day, one week, one month,
  custom dates, or one ticker before asking. The server intersects or replaces
  tool filters with that selection and applies it to trade details as well as
  summaries, so the model cannot silently broaden the chosen population.
- The maintained Help Center now includes Links AI Chat getting-started, scope,
  manual-entry, answer-boundary, and privacy guidance. Chat product-help
  answers search the same registry rather than relying on model memory.
- The current working tree contains unrelated active changes in shared shell,
  layout and Daily Tracker files. Drawer integration must preserve those edits
  and stage only an explicit Links AI Chat allowlist at a coherent checkpoint.
- Focused lint and the full no-emit TypeScript check passed after the Agents SDK,
  deterministic tools, selected-scope, saved-review and Help integrations. Six
  focused Links AI Chat suites passed with one worker: 46 persistence, route, factual
  scope, trade-detail, generation-budget and language-registry tests.
- Controlled no-worker browser verification passed on 2026-08-15. The direct
  `/ai-chat` surface, maintained Help Center guides, global drawer, saved-review
  handoff and mobile-width drawer all loaded from the replacement dashboard.
  The drawer preserved the current route and exposed a visible close action.
- No provider request, Journal write, database initialization, push or
  deployment was performed by this implementation checkpoint.

### Current-dashboard expansion checkpoint

- The original plan predates current Trade Analyzer pages, the current Trade
  Explorer, expanded Account surfaces, Notifications, Import/connection work
  and several completed Tracker/Analytics revisions.
- The current navigation, active dashboard pages, Help collections, server
  services and command routes were re-audited on 2026-08-15.
- The new capability matrix records every current product surface, its
  canonical data/command source, required Chat behavior, exact current status,
  deliberate exclusions and final evaluation gate.
- Commit `2b4527ac` remains the protected first-slice foundation with eight
  factual tools and three confirmed-draft families. It is no longer described
  as full chatbot completion.

### Completed: current Journal, Tracker and Analytics reads

- Twelve page-aligned deterministic tools now cover Workspace, one Daily
  Tracker day, Calendar periods, Open Positions, active Swing positions,
  Analytics Overview, Results by Ticker, Timing, Execution and the currently
  supported Trade Explorer query surface.
- The tools reuse the canonical Journal dashboard, Tracker and Analytics
  services. They do not recalculate P/L, infer position types, broaden the
  trader's selected date/ticker scope or expose raw broker/source identifiers.
- Calendar periods are capped at 62 days, open-position collections at 100,
  Trade Explorer evidence at 50 rows and current page queries at their existing
  canonical page sizes. Oversized or unsupported requests fail rather than
  silently truncating or inventing facts.
- Trade Explorer remains deliberately isolated and versioned. Its current
  adapter now implements the accepted factual Sort trades, explicit Result,
  grouped Rank by and completed-trade Review read/handoff boundaries; advanced
  comparison studies remain unavailable.
- Focused ESLint and a full no-emit TypeScript pass completed cleanly. Three
  focused one-worker suites passed eight tests covering account isolation,
  selected page contracts, raw identifier stripping, bounded evidence and
  exact high-precision decimal-range validation.

### Completed: current product status and saved Analyzer reads

- Eight deterministic product-status tools now cover privacy-safe import
  history, pending/resolved Data Decisions, recent notifications, Account
  profile/preferences/AI plan state and Account Trading status. The Trading
  read includes privacy-safe Moomoo connection, linked-account and automatic
  import status while withholding credentials, tokens, broker account values,
  encrypted link references, internal account selectors and payment IDs.
- Three saved-analysis tools cover the current Trade Analyzer result families,
  bounded analyzed-trade rows and an existing Candle Review. These reads reuse
  the canonical Journal Analytics rows and saved Analyzer/Candle Review
  repositories. They never run or queue analysis and never contact Yahoo,
  Moomoo or another market-data provider.
- Analyzer trade identifiers are replaced by selected-account-scoped opaque
  references. Candle Review responses omit stored candle series, provider
  request records, review/version IDs and raw analyzer snapshot JSON.
- The trader's selected date or ticker scope is enforced before dispatch.
  Analyzer result summaries reject a ticker-only scope when the current saved
  summary service cannot apply that filter; bounded analyzed-trade lists can
  apply it exactly.
- The factual result budget remains fixed and fail-closed. The conservative
  provider reservation now accounts for the full registered tool inventory,
  not only the original eight-tool foundation.
- Targeted ESLint and a full no-emit TypeScript pass completed cleanly. Three
  focused one-worker suites passed 11 tests covering product-data redaction,
  account isolation, opaque Analyzer references, bounded saved evidence and
  no-candle-series Candle Review projection.

### Completed: first confirmed product actions

- Links AI Chat can now prepare three expiring product changes: reporting currency,
  marking one exact notification read, and switching to one existing Journal
  account. Each proposal is built from the current account-scoped value or
  target and shown as a plain before/after confirmation card.
- Generation never performs the action. Migration
  `0055_coach_ai_chat_action_drafts` persists the private target payload,
  public preview digest, disposition, expiry and privacy-safe canonical
  command reference. Confirm and cancel are separate same-origin mutation
  routes.
- Confirmation re-reads the current value or target and fails on stale or
  cross-account state. Reporting currency and notification read state use the
  same repositories as their dashboard controls. Account selection returns the
  normal opaque account-selection cookie and reloads the dashboard only after
  the saved confirmation succeeds.
- Migration 0055 reserves only the reviewed allowlist of later action-family
  identifiers. Those reserved identifiers have no model schema, proposal path
  or executable command until their individual implementation and verification
  checkpoints are complete.
- Login, broker connection, payment, deletion, administration, raw statements,
  secrets and unsupported settings remain outside the action schema.
- The full no-emit TypeScript check passed. Three focused one-worker files
  passed 15 action/migration checks, including no-write-before-confirm,
  account-scoped notification targeting, account-switch cookie authority and
  the static migration contract.
- The protected pre-migration online backup and independent restore are
  preserved at checkpoint `ai-chat-actions-20260815T230111Z`. The backup and
  restored main files are byte-identical at SHA-256
  `b1585de8a8ca0e6e7759db3651dd7a2302754a053248f0f6313ce7dfc13228bd`;
  the exact 54-row registry, all 150 table counts, page geometry and recovery
  authority match.
- Migration `0055_coach_ai_chat_action_drafts` applied once. The protected
  database now has 55 migrations and schema digest
  `af6eb5ad0d79a023e109b2f338d654a504cecd34d8f28b44b9d841ef1723e035`.
  Foreign-key, quick and full integrity checks pass, and the new action-draft
  table is empty. Journal facts remain exactly one account, 1,172 executions
  and 372 round trips before and after the migration.
- The post-migration online backup and independent restore are preserved at
  checkpoint `ai-chat-actions-post-20260815T230224Z`. The backup and restored
  main files are byte-identical at SHA-256
  `d4f6be4c91a2b0857e06047f90825bf9d22429988f387599bdc6a1d7c8683989`;
  all 55 migration rows, 151 table counts, page geometry and recovery authority
  match.

### Completed: notification preferences and AI Review on/off actions

- Chat can now prepare the complete final set of Discord notification
  categories and show the current and proposed selections in plain language.
  Confirmation calls the same notification-preference repository as Account
  Settings; stale current preferences fail closed.
- A trader with existing AI Review settings can ask Chat to turn reviews on or
  off. Confirmation preserves the accepted cadence and timing choices, uses
  the current settings revision, and clears pending cadence changes when the
  trader turns reviews off. Chat does not invent a schedule for an account that
  has never configured AI Reviews.
- Generation still performs no write. Both changes use the existing expiring
  action-draft record, separate confirmation route, idempotent final state and
  privacy-safe canonical reference.

### Completed: Trading Rules and completed-trade annotation reads

- Three deterministic tools now list saved preset/custom Trading Rules, read
  exact preset and custom-rule results for a bounded period, and read one
  completed trade's saved trade note, Trade Tags and custom-rule reviews.
- Preset outcomes come from the existing deterministic evaluator. Custom-rule
  outcomes come only from saved trader selections. Chat does not create a rule
  result, turn a tag into evidence or expose the separately planned rule-
  recommendation capability before its canonical service exists.
- Rule-result requests cover no more than 62 days. The period summaries remain
  exact while individual events are limited to 50 and explicitly report when
  more events exist. Selected date/ticker scope is enforced by the dispatcher.
- The responses omit rule, review, note and tag record identifiers. The exact
  saved wording and configuration remain available because they are the facts
  the trader asked Chat to discuss.
- Focused ESLint and the full no-emit TypeScript check pass. Two one-worker
  files pass six tests covering selected-account isolation, private identifier
  removal, exact saved annotations, bounded periods and dispatcher behavior.
  This read-only slice performed no provider request, Journal write, migration,
  protected database change, push or deployment.

### Completed: confirmed completed-Day-trade tag changes

- Chat can prepare a complete replacement of the saved tags on one exact,
  analytics-ready completed Day trade. The preview shows the ticker, current
  tags and proposed final tags; generation itself writes nothing.
- The proposed list is limited to ten unique tags that already exist for the
  account or belong to the maintained preset catalog. Chat cannot invent a
  custom tag, infer a tag from P/L or notes, or silently add a tag that the
  trader did not request.
- Confirmation rechecks the selected account, completed trade and exact current
  tag revisions before calling the same canonical Journal annotation command
  used by the dashboard. A stale trade or changed tag list fails closed.
- Focused ESLint, the full no-emit TypeScript check and two one-worker test files
  pass. Nine tests cover the read boundary, no-write preview, confirmed
  replacement and selected-account isolation. This action reused the accepted
  Links AI Chat action registry; it required no migration or protected-database
  change and performed no provider request, push or deployment.

### Completed: confirmed Trading Rule changes

- `list_trading_rules` now returns each exact saved rule through a privacy-safe
  opaque reference plus the maintained preset catalog and every required
  setting. Raw rule identifiers remain private.
- Chat can prepare a maintained preset rule, create or revise a custom rule,
  revise preset settings, or pause, resume and retire one exact saved rule. The
  preview shows the current and complete proposed state, and generation writes
  nothing.
- Confirmation rechecks the selected account, exact rule revision and lifecycle
  state before calling the canonical Trading Rules mutation. A changed rule,
  invalid transition, missing preset field or already-satisfied change fails
  closed.
- The model cannot activate a rule merely because analysis suggests it. A
  trader must explicitly request the exact rule change and separately confirm
  its persisted preview. Rule-result outcomes remain deterministic and cannot
  be changed by Chat.
- Focused ESLint, the full no-emit TypeScript check and two one-worker test
  files pass. Eleven tests cover opaque references, maintained preset choices,
  no-write previews, confirmed preset/custom mutations, lifecycle changes and
  selected-account isolation. This slice required no migration or protected-
  database change and performed no provider request, push or deployment.

### Completed: bounded confirmed Data Decision actions

- Data Decision detail reads now expose privacy-safe references for the exact
  affected executions while keeping decision, execution, version, import,
  instrument and raw-statement identifiers private.
- Chat can prepare only the bounded resolutions that do not require it to see
  or invent missing statement facts: confirm a supported open position,
  reconcile grouped fills, accept a source limitation, exclude/restore/keep an
  exact returned execution, or merge one exact supported duplicate pair.
- The trader sees the decision question, ticker, chosen action and affected
  execution summary before confirmation. Creating the preview performs no
  Journal write. Confirmation reloads the pending decision at the exact saved
  revision, recreates the canonical resolution and calls the existing Journal
  decision service.
- Numeric corrections, missing executions, coverage facts and any task that
  requires comparison with the original statement remain on Data Decisions.
  Chat never receives raw statement rows and never invents an exclusion reason
  or duplicate choice.
- Focused ESLint, the full no-emit TypeScript check and 13 focused action and
  product-context tests across two files passed with one worker. This slice
  made no migration or protected-database change and performed no provider
  request, push or deployment.

### Completed: confirmed Trade Tracker account creation

- Chat can prepare a new Trade Tracker account only when its final name,
  three-letter base currency and IANA trading timezone are known. An omitted
  currency or timezone may reuse the exact active-account value returned by
  the account tool; Chat cannot invent a different value.
- The preview states that the account becomes active after creation. Preparing
  it writes no Journal account. Confirmation rejects a changed account roster,
  rechecks workspace manager access and the 25-account limit, then calls the
  canonical Journal account service and returns the normal account-selection
  cookie.
- A server-generated account identifier makes confirmation retry-safe without
  exposing the identifier to the model or trader. Account merge, deletion,
  ownership changes and broker connections remain outside this action.
- Focused ESLint, the full no-emit TypeScript check and 10 one-worker action
  tests passed. This slice reused migration 0055's accepted action registry;
  it performed no migration, protected-database write, provider request, push
  or deployment.

### Completed in source: eligible AI Review requests

- `get_account_ai_plan` now returns the exact currently available periodic and
  monthly review periods from `CoachAiReviewAvailabilityService`, alongside
  the existing schedule, delivery and entitlement state.
- Chat may prepare a request only when its review kind and both period dates
  exactly match a `manual_available` or `automatic_ready` period and the
  generation gate is available. The preview identifies the review kind and
  exact date range.
- Confirmation rechecks the generation gate and calls
  `CoachAiReviewRequestService.requestManualV2`. It creates or reuses only the
  immutable pending request; it never starts issuance, reserves provider
  capacity or contacts OpenAI.
- Focused ESLint, the full no-emit TypeScript check and 18 focused action and
  product-context tests across two files passed with one worker. No protected
  database write, provider request, process start, push or deployment occurred.

### Completed in source: Swing notes, position type and Swing tags

- Chat can prepare one exact dated Swing note, including its complete note and
  optional next-session plan, after reading the current note and revision.
  Confirmation re-reads the note and calls `JournalSwingNoteService.save` with
  a stable Chat idempotency key. Long notes up to the Journal's 12,000-character
  limit remain intact in the durable private draft.
- Chat can change one exact open position only when the trader explicitly
  selects active swing, day trade still open, unplanned hold (bag hold), or
  long-term hold. It never infers a type from executions, age, ticker or P/L.
  Confirmation re-reads the position and style revision, then calls
  `JournalTradeStyleService.change` with distinct `ai_chat` audit provenance.
- The same complete tag-replacement preview and confirmation now supports an
  exact Swing position as well as a completed trade. The private position
  reference is resolved server-side to the canonical round trip and is never
  exposed as a Journal identifier.
- Migrations `0056_coach_ai_chat_action_expansion` and
  `0057_journal_ai_chat_trade_style_source` expand durable private draft
  capacity and the Journal audit source without changing existing action
  behavior. Clean initialization, migration-file integrity, action behavior
  and no-write-before-confirm passed 25 focused tests across three files with
  one worker. Focused ESLint and the full no-emit TypeScript check also passed.
- Before the protected apply, the database remained at 55 migrations with
  schema digest `af6eb5ad0d79a023e109b2f338d654a504cecd34d8f28b44b9d841ef1723e035`,
  one Journal account, 1,172 execution versions and 372 round trips. The
  checkpoint `ai-chat-actions-0056-0057-pre-20260816T004824Z` created an online
  backup and independent restore that are byte-identical at SHA-256
  `d4f6be4c91a2b0857e06047f90825bf9d22429988f387599bdc6a1d7c8683989`;
  registry, table counts, page geometry and recovery authority match.
- Migrations 0056 and 0057 then applied once. The protected database now has
  57 migrations and schema digest
  `389e481a012ff6fb4cd6a3052c6209886662b711964871a33a036349140ac43c`.
  Quick check, full integrity check and foreign-key verification pass. Journal
  facts remain exactly 1,172 execution versions and 372 round trips, and the
  expanded Links AI Chat action-draft table remains empty.
- The post-apply checkpoint
  `ai-chat-actions-0056-0057-post-20260816T004914Z` created an online backup and
  independent restore that are byte-identical at SHA-256
  `e841ee2e86af9a175f04f8c367df654c4040a91e91930f2aed92684e43c64363`;
  all 57 migration rows, table counts, page geometry and recovery authority
  match. No provider request, process start, push or deployment occurred.

## Completed: scheduled AI Review control enforcement

### Current checkpoint

- Migration `0032_coach_ai_review_provider_controls` is now applied to the
  protected local development database. It creates distinct Weekly Review and
  Monthly Review control/reservation boundaries so neither can consume Chat's
  allowance or the other review type's allowance.
- The protected backup, restore and current-database verification checkpoint
  completed on 2026-08-06. The completed database has 32 ordered migrations;
  `quick_check`, `integrity_check`, foreign-key verification and the current
  schema-digest check passed after the apply.
- The runtime and administration enforcement slice is complete and preserved in
  local commit `8df62c25` (`feat(coach): control scheduled AI review generation`).
  Weekly, Monthly and Chat controls remain independent, and later AI Review
  safeguards/cost checkpoints build on this accepted boundary.

- Preserve each trader's saved Friday/Saturday/Sunday and Eastern-time delivery
  preference when an owner disables a review feature; disabling generation must
  never erase the schedule.
- Enforce independent platform controls and request/token/spend caps for Weekly
  Reviews and Monthly Reviews before provider work. Chat, Weekly Reviews and
  Monthly Reviews must not consume or unlock one another's allowance.
- Add an immutable, privacy-safe reservation record for each attempted scheduled
  review. It may retain scope references, feature, model/pricing snapshots,
  bounded usage reservations, state, safe failure code and timestamps, but no
  prompt, notes, review text, statement content or display identity.
- Keep review provider pricing separate from Chat provider pricing. Enabling or
  retaining a review feature requires configured Review pricing; Chat and Daily
  Companion continue to require configured Chat pricing.
- The runner checks the platform switch before account enumeration or input
  construction, and the issuance service checks/reserves again immediately
  before a provider call so a mid-run disable or exhausted cap fails closed.
- Journal Administration will show separate Weekly and Monthly controls and
  aggregate requests, blocks, failures, tokens, estimated cost and delivery
  health without exposing private review content or raw account identifiers.
- Account Settings will retain the user's delivery choices. The user-facing
  automatic-review opt-out remains distinct from owner enablement/entitlement
  and will be added only through an explicit durable preference contract.

## Completed: schema-only Links AI Chat foundation

- Migration `0029_coach_ai_chat_foundation` adds the seven planned private,
  account-scoped records for conversations, ordered messages, factual answer
  snapshots, generation receipts, manual-entry drafts, daily companion
  interactions and archive events.
- The schema retains private original user text separately from normalized and
  structured interpretation fields, bounds private text/JSON payload sizes,
  and keeps operational receipt rows free of conversation content.
- Assistant messages begin pending with one active generation per conversation.
  Completed answers require an immutable factual snapshot before their receipt;
  failed assistant attempts may retain an honest receipt when provider usage is
  available without inventing a snapshot, token count or cost.
- At the schema-foundation checkpoint, manual-entry and daily companion records
  were drafts/proposals only. Later completed slices now use their guarded
  canonical Journal command/reference states; confirmed manual rows still
  freeze before the canonical save transition.
- Append-only triggers protect message/snapshot/receipt/archive history, and
  narrowly constrain conversation, assistant-generation, draft, daily-proposal
  and canonical-save state transitions. Conversation insertion requires an
  active workspace membership and matching Journal account workspace.

## Verification

- Focused one-worker migration tests passed: 13 tests across the `0029`
  migration, migration registry, and migration-file contract.
- Focused ESLint and `git diff --check` passed.
- The standalone migration-file verifier is deferred: its local Node process
  fails before file inspection with `uv_os_get_passwd` ENOMEM. No project
  configuration was changed to work around that local environment failure.

## Completed: private Chat persistence repository

- `CoachAiChatRepository` is server-only and verifies the current active user,
  workspace membership, and selected Journal account from the database for
  every operation. Conversation identifiers never bypass that scope.
- It creates, reads, renames, archives, and restores private conversations
  without deletion. Archive and restore append the immutable archive evidence.
- Conversation metadata and private message history are intentionally separate:
  message reads use a newest-page query with a default limit of 50, a maximum
  of 100, and a typed sequence cursor while returning each page in chronological
  order. This prevents an unbounded long-lived-history read.
- User-message append and pending-assistant reservation run in one immediate
  transaction. The repository preserves message sequence order and refuses a
  second pending assistant reservation for a conversation.
- Completed assistant messages are finalized in one transaction with a
  canonicalized immutable factual snapshot, SHA-256 digest, and generation
  receipt. Failed messages retain only a safe code and may record an honest
  usage receipt; neither path writes Journal facts, calls a provider, or creates
  a route/UI/manual-entry/daily-companion save path.
- Added focused one-worker repository tests covering cross-account denial, inactive
  membership, ordered reservations, duplicate-pending prevention, success and
  failure persistence, archive/restore, deterministic conversation and message
  pagination, and privacy-safe errors.

## Verification

- The canonical checkout passed eight focused one-worker tests across the Chat
  repository and migration foundation, plus focused ESLint for the new
  contracts, repository, and repository tests.
- That verification caught and corrected a row-field mismatch in assistant
  finalization before this persistence checkpoint was accepted. No dependency
  install, download, real database migration, or configuration workaround was
  needed.

## Historical schema/persistence boundary

- No Chat route, provider request, manual-execution write, daily-companion save,
  or AI change to Journal facts was made in the earlier schema or persistence
  slices. At that checkpoint the migration was verified only against disposable
  test databases. The protected local migration checkpoint recorded below now
  supersedes only that former unapplied-database state.
- No V3 Coach runtime is a source for the new implementation.

## Completed: private Chat persistence API

- [x] Added private account-scoped conversation list/create/read, strict
  rename/archive/restore, and bounded message-history route handlers over the
  existing migration `0029` repository.
- [x] Added focused route coverage for validation, pagination, archive/restore,
  scope denial, and privacy-safe errors.
- [x] Recorded the API boundary in
  [Links AI Chat Persistence API Progress](ai-chat-api-progress.md).

## Completed: saved-question generation orchestration

The server-only saved-question runtime is recorded in
[Links AI Chat Runtime Progress](ai-chat-runtime-progress.md). It adds no route or
visible surface, does not call a provider during tests, and retains the
existing migration, Journal, and account boundaries.

## Completed: saved-conversation Chat page

- `/ai-chat` now provides a responsive private conversation workspace using
  the dashboard's existing Material UI design. Desktop users see the
  conversation list beside the active thread; smaller screens use a closable
  conversation drawer.
- Users can create, rename, archive, restore, search and page through
  conversations, load earlier messages, and submit a question without exposing
  internal generation identifiers or failure codes. Search covers saved titles
  and message text only within the current user, workspace and Journal account.
- Submission keeps one stable request identifier across an uncertain network
  retry so the same saved question cannot accidentally create a second paid
  answer. Definite completed, pending, blocked and failed outcomes refresh from
  the saved conversation record.
- Provider answers are requested as plain text for direct display inside the
  current Material UI rather than introducing a second component system or
  rendering untrusted HTML.

### Verification

- Focused ESLint passed for the new page, client, dashboard navigation and
  provider presentation instruction.
- The account-scoped search addition passed 31 focused repository/route tests
  with one worker, plus focused ESLint.
- `git diff --check` passed for the tracked files. No provider call, database
  migration, dependency change or dashboard process was made during this UI
  checkpoint.

## Completed: trusted Daily Trade Tracker companion context

- The Daily Trade Tracker now opens Links AI Chat with an explicit trading-date and
  currency selector. The browser never supplies Journal facts: the message
  route resolves the selected day from the current user, workspace and Journal
  account before generation.
- One bounded context package includes the selected day's exact fact-set
  revision, result, review state, daily notes, dated Current Focuses revisions,
  saved rule outcomes, trade notes and tags, open-position classifications and
  visible coverage limitations. Tags remain context, never proof of a setup,
  emotion, cause or rule break.
- Daily context is attached only to a newly created daily-review conversation.
  Selecting an existing conversation clears that binding so an unrelated
  private thread cannot silently inherit the day.
- A Daily Companion request must pass both Chat and Daily Companion platform
  and account controls. The tighter enabled request, token and spend caps apply;
  both features remain disabled by default.
- Idempotent retries return the original saved attempt before rebuilding live
  day context. The exact trusted context used for a completed answer is kept in
  the immutable answer evidence and in a scoped Daily Companion proposal record.
  No Journal note, tag, focus, classification, execution or review state is
  changed by this slice.

### Verification

- Three focused one-worker files passed 33 tests covering route trust,
  feature/cost gates, bounded context, immutable evidence, Daily Companion
  proposals and idempotent retry behavior.
- Focused ESLint passed with zero errors. The Tracker retains two pre-existing
  unused-variable warnings, and `git diff --check` passed.
- One project-wide TypeScript pass was attempted with incremental output
  disabled after the checkout rejected its cache write. It remains blocked by
  the existing cross-project Analytics, Calendar, Import, Tracker fixture and
  older test typing backlog; no new runtime failure was found by the focused
  Daily Companion checks.

## Completed: editable Daily Companion note drafts

- A trusted date-bound Daily Companion answer may propose one editable daily
  note update, one selected trade note, or one Current Focuses update. The
  provider sees stable global trade numbers; the canonical round-trip ID stays
  server-only and is never selected or invented by the browser or model.
- The trader reviews and may edit every proposed word in a plain Material UI
  card. **Save** and **Discard draft** are explicit. Generating an answer alone
  never changes the Daily Trade Tracker.
- Confirming a daily note or Current Focuses draft preserves every untouched
  daily-note field. Confirming a trade-note draft preserves its technical note.
  A newer Journal note revision causes a safe conflict instead of overwriting
  the trader's later work.
- The proposal transition and canonical Journal annotation save share one
  immediate SQLite transaction. Repeated confirmation of an already committed
  draft is idempotent and cannot create a second note revision.
- Tags, rule outcomes, trading-day review completion, position
  classifications and executions are outside this write path. The AI does not
  mark a day reviewed or call the trading-day review service.

### Verification

- Four focused one-worker files passed 36 tests covering trusted generation,
  idempotent draft persistence, server-only trade targeting, strict route
  behavior, field preservation, stale-revision rollback, explicit rejection
  and the absence of any review-completion write.
- Focused ESLint passed for all 15 implementation files and
  `git diff --check` passed. No provider call, protected-database write,
  migration, dependency change, process start, deployment or push was made.

## Implemented: confirmed AI Review delivery changes

- A trader may ask Chat to prepare a weekly AI Review delivery change. The
  allowlist contains only Friday, Saturday or Sunday and a half-hour Eastern
  time from 4:00 PM through 11:30 PM.
- Chat displays the saved current schedule and proposed schedule in an editable
  confirmation card. Generation alone never changes Account Settings. Login,
  billing, ownership, privacy, provider/model and administration settings are
  outside this path.
- The server accepts only the same Friday-to-Sunday half-hour choices shown in
  Account Settings, from 4:00 PM through 11:30 PM Eastern. A proposal expires
  after 24 hours and cannot write settings after expiry.
- Explicit confirmation uses the existing
  `CoachReviewDeliveryScheduleRepository.save` command. A saved-setting
  timestamp and value comparison prevents a stale Chat card from overwriting a
  newer Account Settings change; the draft transition and setting save share
  one immediate transaction.
- Migration `0031_coach_ai_chat_setting_change_drafts` adds the durable,
  account-scoped, refresh-safe proposal and confirmation record without
  changing migration `0029`. The migration passed disposable verification and
  the protected local backup/apply/restore checkpoint described below.

### Verification

- Five focused one-worker files passed 36 tests covering migration/file
  contracts, scoped draft creation, idempotent generation, explicit edited
  confirmation, stale rollback and rejection without a settings write.
- A later correctness pass added five focused schedule/confirmation checks for
  half-hour enforcement and expiry without a settings write.
- Focused ESLint and `git diff --check` passed. No provider call, protected
  database write, process start, dependency change, deployment or push was
  made.

## Completed: confirmed conversational manual execution drafts

- Clear natural-language requests to record executions work without a required
  **Enter trades in chat** mode. The optional shortcut only guides the trader.
  Ambiguous discussion does not silently become an execution draft, and
  manual-entry extraction receives no analytics tools.
- The provider may propose at most eight editable rows per response. Required
  date, Eastern time, ticker, side, quantity or price facts stay blank when the
  trader did not provide them; relative dates are never converted into guessed
  calendar dates. Follow-up messages can refine the latest active draft.
- Drafts are private to the current user, workspace and selected Journal
  account. They expire after 24 hours, retain exact decimal text, and remain
  separate from the Journal until the trader reviews every row.
- The responsive Chat card supports row edits and additions, Quick Trade
  Entry, Swing Trade and same-day Daily Trade Tracker destinations. It sends
  the edited rows through the existing Journal preview, displays the permitted
  trade relationship and type choices, and requires an explicit confirmation
  that every execution was included before enabling **Save executions**.
- Saving uses the canonical Journal manual-execution command with its existing
  account-selection, preview-integrity, duplicate reconciliation and Data
  Decisions behavior. The AI never calls the Journal command. The committed
  draft retains the canonical import-batch reference, while the Journal source
  historical provenance label records `AI Chat manual executions` without
  changing execution facts. That exact stored technical value remains unchanged
  by the visible **Links AI Chat** naming decision.
- Stable request identifiers make generation and Journal commit retries
  idempotent. A concurrent follow-up archives every older active draft inside
  the final persistence transaction so one conversation retains one current
  editable draft.

### Verification

- Six focused files passed 37 tests with one worker and no file parallelism.
  Coverage includes scoped/immutable draft persistence, manual-intent routing,
  server-derived Eastern account defaults, bounded provider reservation,
  idempotent extraction retries, strict draft routes, editable-row preview,
  explicit confirmation, one canonical commit under retry, and the durable AI
  Chat source label/reference.
- Focused ESLint and `git diff --check` passed. No provider call, real database
  write or migration, dependency change, process start, deployment or push was
  made for this slice. Chat remains disabled by default.

## Completed: protected local migration checkpoint

- Before migration, the protected database contained 28 ordered migrations,
  `quick_check=ok`, zero foreign-key issues, one Journal account, 1,128
  executions and 361 round trips.
- The pre-migration online backup and independent restore completed under
  `private-data/traderlink-platform` at checkpoint
  `ai-chat-20260806T023503Z`. The backup and restored main files are
  byte-identical at SHA-256
  `4ee839d5495468b918287d2ec6b42a1d5e52d0bac8e83b9dedc9b817c3bd7607`;
  registry, table counts, page geometry and recovery authority also match.
- Migrations `0029_coach_ai_chat_foundation` and
  `0030_coach_ai_chat_provider_controls` applied together. The protected
  database now has 30 migrations and final schema digest
  `56cf851cc70348adb97ee810f364a856f03e5a0ab7953a1871475b022c2a0776`.
- Post-migration `quick_check` remains `ok`, the foreign-key issue count remains
  zero, and the Journal account, execution and round-trip counts remain exactly
  1, 1,128 and 361. All private Chat conversation, message, snapshot, receipt
  and attempt tables remain empty. Chat and Daily Companion platform controls
  remain disabled by default.
- A post-migration online backup and independently restored copy are
  byte-identical at SHA-256
  `d8282ad00d39ff06b7581c4a5829b9522012c771cd94c3ac2d87ce524f8977a9`,
  with all 30 migration records and all 117 table counts matching.

## Completed: protected migration 0031 checkpoint

- Before applying migration `0031_coach_ai_chat_setting_change_drafts`, the
  protected database still had 30 ordered migrations, 117 application tables,
  `quick_check=ok`, zero foreign-key issues, one Journal account, 1,128
  executions and 361 round trips.
- The pre-migration online backup and independent restore were created at
  checkpoint `ai-chat-settings-20260806T123545Z`. The backup and restored main
  files are byte-identical at SHA-256
  `d8282ad00d39ff06b7581c4a5829b9522012c771cd94c3ac2d87ce524f8977a9`;
  all 30 migration rows, 117 table counts, page geometry and recovery authority
  match.
- Migration 0031 applied once. The protected database now has 31 ordered
  migrations, 118 application tables and final schema digest
  `1bc31b4d8c488177a51f22bb6adc765ff5dafb08599dda9c76821b3e79aa8535`.
  The new `coach_ai_review_delivery_change_drafts` table is empty.
- Post-migration `quick_check`, `integrity_check` and foreign-key verification
  pass. Journal facts remain exactly one account, 1,128 executions and 361
  round trips; all private Chat conversation, message, draft, snapshot,
  receipt and attempt tables remain empty. Chat and Daily Companion controls
  remain disabled by default.
- The post-migration online backup and independently restored copy are
  byte-identical at SHA-256
   `a2d41c697abf3430e18c7f3d41e60449a0bb607b803e941f0871b8e0416722e3`,
   with all 31 migration records, 118 table counts, page geometry and recovery
   authority matching.

## Completed: protected migration 0032 checkpoint

- Before applying `0032_coach_ai_review_provider_controls`, a fresh protected
  online backup and independent restore were created under the private Platform
  data boundary. The backup and restore matched exactly.
- Migration `0032` applied once and only once. The current development
  database now has 32 ordered migrations and schema digest
  `2b282574a975a701f00d7bb961422e09ed33badb61050a4a7ca46fa7486f577b`.
- The post-apply verifier passed `quick_check`, `integrity_check`,
  foreign-key validation and the current schema contract. This checkpoint
  changes no Journal execution, trade, annotation, account, provider key or
  user-facing review content.
- Focused one-worker tests for the migration and migration-file contract passed
  before the protected apply. The runtime/admin controls remain an active
  source slice until their own focused verification and local commit are
  recorded.
