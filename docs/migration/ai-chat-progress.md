# AI Companion Progress

## Status

Implementation is active. The parent plan is [TraderLink AI Companion Plan](ai-chat-plan.md).
The complete current-product target is the
[AI Chat Current Dashboard Capability Matrix](ai-chat-current-dashboard-capability-matrix.md).
The private persistence API checkpoint is tracked in
[AI Chat Persistence API Progress](ai-chat-api-progress.md).

## Accepted existing foundation

- AI Reviews has an approved weekly and calendar-month direction under
  [AI Reviews Plan](ai-weekly-review-plan.md).
- The replacement has owner-only provider/cost controls and immutable
  generation-cost tracking for review work.
- Current Focuses carry dated revisions for later review context.
- The complete language/query contract is finalized in the
  [AI Chatbot Complete Language Plan](traderslink_ai_chatbot_complete_language_plan.md).
- The category-by-category language delivery program is governed by the
  [AI Language Inventory Master](traderslink_ai_language_inventory_master.md)
  and its [required category template](category_completion_template_example.md).
- All twenty language-inventory categories are complete, independently
  reviewed and locked at Version 1. The inventory contains 417 canonical names
  and now controls runtime-registry generation and evaluation; it is no longer
  an unfinished planning dependency.

## Planned work

- [x] Complete and link the AI Companion product plan and language/query plan.
- [x] Approve the complete integrated AI Companion direction for implementation.
- [x] Add the schema-only, account-scoped AI Chat foundation migration.
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
- [x] Implement the first supportable private AI Chat question families through
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
  for the currently incomplete Trade Explorer without creating a second
  calculation engine. Revisit that adapter when the accepted Explorer update
  is implemented.
- [x] Implement saved Trade Analyzer and Candle Review result reads with exact
  coverage and unavailable states.
- [x] Implement Import, Data Decisions, Notifications, Account and entitlement
  reads without exposing statements, credentials, admin data or secrets.
- [ ] Add allowlisted Swing, tag, rule, Data Decision, notification and account
  setting drafts/confirmed actions through canonical commands. Reporting
  currency, notification read/preferences, selected-account switching and
  existing AI Review on/off changes are complete; the remaining command
  families stay pending.
- [ ] Promote the language registry and Help Center only as each deterministic
  family becomes executable.
- [ ] Complete representative agent evaluations, live OpenAI Agents SDK
  verification, account/privacy/cost/action safeguards and responsive
  drawer/direct-page browser acceptance across the capability matrix.
- [ ] Implement production entitlement, scheduled-delivery, operational, and
  privacy-deletion decisions at their separate launch boundaries.

## Completed foundation: Agents SDK and global AI Chat companion

### 2026-08-15 checkpoint

- The owner set the target as a best-in-market trading-journal companion and
  approved continuing the complete AI Chat program without narrowing the
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
  manager agent; the remaining vocabulary stays recognized-but-unavailable and
  cannot authorize a fabricated calculation.
- The runtime capability registry exposes completed-trade analytics, bounded
  day/week/month Journal context, saved AI Review follow-ups, maintained
  product help, selected-day writing drafts, manual-execution drafts, and the
  review-delivery setting draft.
- The trader can enforce **Recent 90 days**, one day, one week, one month,
  custom dates, or one ticker before asking. The server intersects or replaces
  tool filters with that selection and applies it to trade details as well as
  summaries, so the model cannot silently broaden the chosen population.
- The maintained Help Center now includes AI Chat getting-started, scope,
  manual-entry, answer-boundary, and privacy guidance. Chat product-help
  answers search the same registry rather than relying on model memory.
- The current working tree contains unrelated active changes in shared shell,
  layout and Daily Tracker files. Drawer integration must preserve those edits
  and stage only an explicit AI Chat allowlist at a coherent checkpoint.
- Focused lint and the full no-emit TypeScript check passed after the Agents SDK,
  deterministic tools, selected-scope, saved-review and Help integrations. Six
  focused AI Chat suites passed with one worker: 46 persistence, route, factual
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
- Trade Explorer remains an incomplete product feature. Its Chat integration
  is deliberately isolated and versioned to the current supported filters,
  groupings and metrics; future accepted Explorer work must revise that adapter
  without changing unrelated Chat capabilities.
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

- AI Chat can now prepare three expiring product changes: reporting currency,
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

## Completed: schema-only AI Chat foundation

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
  [AI Chat Persistence API Progress](ai-chat-api-progress.md).

## Completed: saved-question generation orchestration

The server-only saved-question runtime is recorded in
[AI Chat Runtime Progress](ai-chat-runtime-progress.md). It adds no route or
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

- The Daily Trade Tracker now opens AI Chat with an explicit trading-date and
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

- AI Chat now has a deliberate **Enter trades in chat** mode. Ordinary trading
  questions and Daily Companion discussions cannot silently become execution
  drafts, and manual-entry extraction receives no analytics tools.
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
  label records `AI Chat manual executions` without changing execution facts.
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
