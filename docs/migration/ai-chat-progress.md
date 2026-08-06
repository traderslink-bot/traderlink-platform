# AI Companion Progress

## Status

Implementation is active. The parent plan is [TraderLink AI Companion Plan](ai-chat-plan.md).
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
- [ ] Complete the twenty-category language inventory program and review/lock
  its canonical vocabulary before generating runtime registries.
- [ ] Implement the private AI Chat experience and factual question families.
- [ ] Implement Daily Trade Tracker companion drafting/confirmation flow.
  The trusted one-day discussion/context boundary is complete; editable note,
  focus, tag, classification and review proposals remain confirmation work.
- [ ] Integrate conversational manual execution drafts with the canonical
  Journal preview and commit commands.
- [ ] Implement production entitlement, scheduled-delivery, operational, and
  privacy-deletion decisions at their separate launch boundaries.

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
- Manual-entry and daily companion records are drafts/proposals only. They can
  retain a later canonical Journal command/reference outcome, but have no
  execution or annotation write path. Confirmed manual rows freeze before the
  canonical save transition.
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
- Users can create, rename, archive, restore and page through conversations,
  load earlier messages, and submit a question without exposing internal
  generation identifiers or failure codes.
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
