# Links AI Chat Professional Agent Remediation Progress

## Status

**Plan and visible experience owner-approved on 2026-08-20 with Links AI Chat as
the required feature name. The first professional-agent implementation slice is
complete in source: relationship memory and Meet Links, adaptive context,
versioned durable conversation state, exact-value grounding, readiness,
owner-approved Chat presentation and aligned Help. The protected database
remains unchanged. A disposable automated browser pass is complete. The owner
waived routine visual checkpoints while the approved drawer/card design remains
materially unchanged.**

The controlling plan is the
[Links AI Chat Professional Agent Remediation Plan](ai-chat-professional-agent-remediation-plan.md).
The current visible design checkpoint is
[Links First Impression And Relationship Memory Design](ai-chat-first-impression-and-relationship-memory-design.md).
The parent product contract remains the
[TraderLink AI Companion Plan](ai-chat-plan.md).

## Owner direction

- Links AI Chat has a high acceptance bar and will not be accepted as a narrow demo.
- It will be a professional agent with access to as much deterministic
  TraderLink data as the product can truthfully obtain.
- Missing product capabilities may be built when they are necessary for a
  useful Chat tool or workflow.
- New or existing sources may be considered when they add reliable data that
  TraderLink can obtain.
- Cross-conversation relationship memory must help Links AI Chat know the trader over
  time and provide consistent personal support.
- The bot must be supportive and encouraging without pressure, forced decisions,
  dependency-building language, or using remembered details as financial truth.
- Links AI Chat is a primary engagement and product-discovery surface that should give
  traders useful reasons to return while protecting their trust.
- Links must have one owner-defined TradersLink personality. Relationship memory
  personalizes what Links knows, not Links' personality or response mode.
- Links should feel like a smart, knowledgeable, well-rounded and successful
  buddy: confident, engaging, supportive and socially natural rather than
  deliberately plain-spoken or mechanical.
- Personality, tone, educational emphasis, coaching emphasis, and answer-depth
  controls belong only to the owner's admin account. All users receive the one
  currently published Links personality.
- The optional **Meet Links** introduction should ask about experience, trading
  approach, markets/products, setups, current focus, explicitly shared emotional
  patterns and routines, ending with **Is there anything else I should know?**
  Links should not ask the user to define how Links helps; Links owns that
  product knowledge and can surface useful relevant help.
- Links should be helpful in general and may surface relevant information,
  connections, tools, features or workflows the trader did not know to ask for.
- There is no required response structure, depth, timing, after-answer behavior,
  observation count or numerical feature limit. Links uses judgment and does not
  mechanically add information to every answer.
- Meet Links should positively teach the trader that saying **remember this**
  carries important context into future conversations.
- The visible feature name is **Links AI Chat** everywhere. **Links** remains the
  assistant's conversational name; `/ai-chat`, `coach_ai_chat_*` and other
  existing technical identifiers remain unchanged.
- Marketing or upgrade prompts must never exploit losses, emotional language,
  private notes, remembered vulnerabilities, fear, shame, or urgency.
- The current latest-12-message window is not sufficient as the durable-memory
  design, especially when a conversation contains many short messages.
- Financial accuracy, account isolation, privacy, cost controls, explicit
  confirmation, and visible owner approval remain mandatory.
- Routine visual approval is not required while implementation preserves the
  approved Links AI Chat drawer and card design. A materially different drawer
  or card design must return to the owner for approval before implementation.

## 2026-08-20 QA evidence

- The official OpenAI Agents SDK `0.16.0` and Responses API are active in the
  current source contract.
- Factual-tool contract v3 contains 36 deterministic tools; action-draft
  contract v1 contains 12 confirmation-only action kinds.
- Desktop acceptance retained the 860-pixel drawer at 1280 by 720 and preserved
  `/workspace`.
- Mobile acceptance retained a full-width 390 by 844 drawer with separate
  conversation and Chat close controls.
- The direct `/ai-chat` page had no horizontal overflow and the Links AI Chat Help
  route returned HTTP 200.
- The platform Chat control, four token-price classes, and all request/token/
  spend caps remain unset or disabled. The QA question made no provider call;
  message, generation-attempt, and receipt counts remained zero.
- The disabled-state UI accepted a question, showed **Thinking…**, then returned
  a generic send failure. One empty local **New conversation** was created.
- The browser recorded no Chat error, but the shared logo emitted a Next.js
  aspect-ratio warning during the Chat path.
- The current answer validator verifies referenced tool-call identity but does
  not prove factual entailment of generated prose.
- Provider context uses the latest 12 messages; the server-built durable summary
  required by the parent plan was not found in the current implementation.
- The current three-turn/four-tool sequential budget is not yet proven against
  complex cross-feature questions.
- The QA pass found a stale two-tool inventory count and unavailable
  Compare Trades/Rule-idea claims despite current v3/v4 runtime coverage; the
  later capability-inventory checkpoint reconciled them.

## 2026-08-20 owner-approved Links identity direction

- The assistant's stable name is **Links** and the feature is **Links AI Chat**.
- The descriptor is **Your TradersLink AI assistant**.
- The existing `public/icons/traderlink-512.png` continuous interlocking-chain
  brand mark is the Links avatar direction.
- Links has one polished, confident, knowledgeable, well-rounded, buddy-like
  personality across all users.
- Relationship memory changes what Links knows about a trader, not Links'
  personality.
- Personality, tone, education, coaching, humor and answer-depth controls belong
  only to the owner's admin account. Exact admin UI remains an owner-review gate.
- The owner approved **Links is thinking…** as the exact active working-state
  copy, replacing the earlier generic pending label.
- The owner approved **Links AI Chat** as the required visible feature name. A
  bare **AI Chat** feature label is no longer accepted in current product copy;
  historical stored values and technical identifiers remain exact.
- The owner approved a temporary full-width **What Links remembers** screen
  inside the existing Chat drawer/direct page. **Back to chat** restores the
  conversation, unsent composer text and scroll position; no nested drawer is
  introduced.
- The owner approved the **What Links remembers** introduction, relationship-
  memory status, **About you** and Journal-account sections, exact memory-card
  details, **Edit**/**Forget** actions and **Tell Links something to remember**.
- The owner approved the **Remember this?** proposal and scope selection, plus
  the exact edit, stale-memory reconfirmation, single-memory forget,
  relationship-memory turn-off and forget-all behavior and copy.

## Progress checklist

### Planning and approval

- [x] Complete the 2026-08-20 live and source QA pass.
- [x] Draft the professional-agent remediation plan.
- [x] Define exact owner-review copy for unavailable, temporary failure, limit,
  pending, and retry states.
- [x] Owner reviews and approves the complete plan.
- [x] Owner reviews and approves the exact visible state copy and behavior with
  **Links AI Chat** as the required feature name.
- [x] Audit concurrent file ownership and publish the first implementation
  allowlist.

### Grounding and continuity

- [x] Implement the server-authored factual-claim catalog.
- [ ] Implement structured answer composition and strict claim validation.
- [x] Persist immutable claim catalogs and exact selected claims with answers.
- [x] Implement versioned private conversation state and bounded older-context
  summary.
- [x] Replace the fixed latest-12-message context boundary with an evaluated
  token- and task-aware context package plus bounded same-conversation retrieval.
- [x] Implement separately scoped user-wide and Journal-account relationship
  memory with explicit save, reconfirm, correct, forget, and disable controls.
- [x] Design and obtain owner approval for **What Links remembers** before
  implementing its visible controls.
- [x] Draft Links' first-impression and relationship-memory design, layouts,
  exact copy, controls and mobile/accessibility boundary for owner review.
- [x] Obtain owner approval for every applicable item in the design checklist,
  including the general-helpfulness and **remember this** comments.
- [ ] Enforce supportive, encouraging, non-pressuring relationship behavior and
  reject hidden psychological or financial profiling.
- [ ] Prove long follow-ups, corrections, account changes, stale references, and
  exact current-fact re-reads, including at least 50 consecutive short messages.

### Professional experience

- [x] Implement privacy-safe Chat readiness projection.
- [x] Implement the owner-approved unavailable/failure/limit/pending/retry UI.
- [x] Prevent empty conversation/message/attempt creation when Chat is not ready.
- [ ] Render server-authored evidence and exact owning-product links.
- [x] Correct Chat-path browser warnings.
- [x] Complete the currently required desktop/mobile/direct-page review. Repeat
  owner review only for a materially different drawer or card design.

### Relationship and return engagement

- [x] Draft the optional deterministic **Meet Links** setup for name, experience,
  trading approach, markets/products, setups, current focus, explicitly shared
  emotional patterns, routines and a final optional free-text question without
  personality or answer-mode selection.
- [x] Draft the complete 860-pixel desktop and 390-by-844 mobile **Meet Links**
  flow, neutral progress, skip/resume behavior, question branches, final atomic
  memory review, short new-account variant and completion state.
- [x] Obtain owner approval for the exact **Meet Links** questions, choices,
  final memory review, short new-account flow and sensitive-memory boundaries.
- [x] Review and approve **Links** as the stable assistant identity, **Your
  TradersLink AI assistant** as its descriptor, and
  `public/icons/traderlink-512.png` as its avatar direction.
- [x] Lock one owner-defined Links voice across all users while allowing approved
  memories to personalize context rather than personality.
- [x] Define Links' polished buddy-like voice and situational range without fake
  human experience, status, emotion, forced slang, pressure, or false certainty.
- [ ] Design the owner-only versioned personality controls for tone, educational
  emphasis, coaching emphasis, humor restraint, and default answer depth.
- [ ] Design synthetic preview, one-version publish, answer-version attribution,
  and rollback while keeping safety and factual invariants outside personality
  configuration.
- [ ] Design the factual **Welcome back** and **Continue where we left off**
  experiences with dismiss, category, and disable controls.
- [ ] Design opt-in pre-session, post-session, weekly, monthly, and custom
  follow-up routines using the canonical notification system.
- [ ] Design deterministic process-based progress recognition without profit,
  risk, activity-volume, or streak pressure.
- [ ] Design general helpfulness and contextual product discovery with exact
  availability, entitlement, data and cost disclosure and no mechanical response
  pattern.
- [ ] Obtain iterative owner approval for each visible engagement state before
  implementation.
- [ ] Prove losses, emotional text, private notes, remembered vulnerabilities,
  long absence, and declined prompts cannot drive pressure or upgrade targeting.

### Orchestration and coverage

- [ ] Establish evaluated turn, tool, byte, token, latency, and cost budgets.
- [x] Reconcile the current 36-tool/12-action matrix, Help, language, runtime,
  QA, and progress records.
- [x] Add a static inventory-drift guard.
- [ ] Complete the professional synthetic live-provider evaluation.

### New deterministic capabilities

- [ ] Review market-data access status as the first source-status candidate.
- [ ] Review bounded market quotes, candles, float, fundamentals, and screener
  facts only against accepted source contracts.
- [ ] Review Compare Trades proposal/confirmation.
- [ ] Review atomic completed-trade Review proposal/confirmation.
- [ ] Review cost-confirmed Trade Analyzer and Candle Review requests.
- [ ] Preserve full-statement review as a separate explicit opt-in workflow.

### Launch boundary

- [ ] Select the accepted model from evaluation evidence.
- [ ] Record official ordinary-input, cached-input, cache-write-input, and output
  prices.
- [ ] Configure entitlement and request/token/spend caps.
- [ ] Complete the explicitly approved private provider-data acceptance run.
- [ ] Complete final operational, static, browser, Help, and owner acceptance.
- [ ] Obtain separate authorization for activation, deployment, and publication.

## Current non-actions

- No protected or private database was opened or changed. Migration `0067`
  remains unapplied there; the complete 67-migration chain was instead verified
  against a disposable empty database that was removed after the check.
- No provider request was made.
- No Journal fact or existing message was changed.
- No test runner, build, deployment, push, merge, or publication occurred.
- No concurrent dirty file was staged, committed, overwritten, or discarded.

## 2026-08-20 implementation checkpoint: relationship-memory foundation

- The concurrent working tree was re-audited before implementation. The first
  allowlist was limited to the new Coach relationship-memory contract,
  repository, route parser, migration `0067`, four private route handlers, the
  central migration manifest and these two Links progress records. Concurrent
  Tracker, PWA, Analytics, Calendar, Rules, Candle Review and unrelated planning
  work remained outside the slice.
- Migration `0067_coach_ai_chat_relationship_memory` defines separately scoped
  user-wide and current-Journal-account memories, versioned private wording,
  content-free lifecycle events, memory enablement and Meet Links completion.
- Forgetting a memory marks its content-free parent record forgotten and deletes
  every private text version in the same transaction. The remaining event does
  not retain the forgotten wording. Forget-all can affect only the current
  user's user-wide and selected-account memories returned by the scoped read.
- The repository supports read, explicit create, versioned edit, reconfirm,
  forget, forget-all, enable/disable, Meet Links skip and atomic Meet Links
  completion. A Meet Links request retains no partial answers: its selected
  memories and completion setting are written together or not at all.
- New private endpoints expose only authenticated server-derived scope:
  `/api/coach/chat/memories`, `/api/coach/chat/memories/settings`,
  `/api/coach/chat/memories/[memoryId]`, and `/api/coach/chat/meet-links`.
- Focused ESLint passed for all new relationship-memory and changed manifest
  files. `git diff --check` passed. The full no-emit TypeScript process exceeded
  its 60-second low-resource window without reporting an error and is recorded
  as incomplete, not passed. A static manifest import then failed before project
  code loaded because the operating system returned `ENOMEM`; no retry storm,
  test runner, protected-database write or provider call was used.

## 2026-08-20 implementation checkpoint: professional Chat slice

- The fixed latest-12-message provider boundary is replaced by a private
  adaptive context package. It considers up to 400 source messages, keeps the
  recent conversation inside a 12-kilobyte budget and uses a separate bounded
  older-message retrieval channel for relevant corrections, remember requests
  and topic returns. A deterministic verifier retained 60 consecutive short
  messages and retrieved an older correction after intervening discussion.
- Relationship memories are injected through a separate bounded channel rather
  than being counted as recent conversation. Disabled memories are not injected;
  overdue memories are identified as needing confirmation rather than current.
- Time-sensitive setup, focus, emotional-pattern, routine and learning-goal
  memories receive a 90-day review boundary. The visible review actions are
  **Keep it**, **Update** and **Forget**.
- A server-authored opaque claim catalog now records typed scalar values and
  their exact deterministic tool-result paths, scope, coverage, currency,
  timezone, population and as-of context when available. Answer validation
  rejects unsupported exact money, percentage, date, currency and numeric
  tokens. The catalog is persisted with the generation snapshot. Broader
  semantic-entailment evaluation remains open.
- The provider prompt now fixes one Links personality and explicitly enforces
  evidence-led, supportive, non-pressuring behavior, no fake lived experience,
  no mechanical extra-insight quota and no use of memories as financial fact.
- A privacy-safe readiness endpoint blocks ordinary generation before creating
  a conversation when entitlement, provider control, caps or any of the four
  price classes is unavailable. Explicit **remember this** requests use one
  local transaction before any provider generation; a failed memory write
  leaves no empty conversation. The approved unavailable state still disables
  the composer and therefore does not expose new direct-memory commands until
  Links AI Chat is ready.
- The owner-approved visible source now includes the Links avatar and identity,
  **Links is thinking…**, first-impression suggestions, full-width **What Links
  remembers**, explicit edit/scope/forget/disable controls, stale-memory review,
  and the optional atomic Meet Links introduction. Visible current feature
  labels use **Links AI Chat**. The Help Center now explains Meet Links,
  relationship-memory scope, review and secret boundaries.
- The focused Links TypeScript project passed with a 1,024-megabyte heap after
  Material UI API corrections. Focused ESLint, adaptive-context verification,
  exact-value grounding verification and `git diff --check` passed. The full
  repository TypeScript check was attempted earlier but exhausted the low-
  resource environment without diagnostics and is not claimed as passed.
- All 67 migrations, including the final relationship-memory trigger, applied
  successfully to a disposable empty database with schema SHA-256
  `f6abd205e6840524263c14f6def7f5c029a4942023225866f6bbc2aea7535405`.
- A worker-disabled local review server used only a disposable seeded database.
  Desktop and 390-by-844 browser checks passed for the direct page, Meet Links,
  the unavailable state, first impression, **What Links remembers**, the memory
  edit dialog and persistence, the non-destructive forget confirmation and the
  new Help guide. The live pass exposed and corrected mechanical proposed-memory
  wording, missing memory textbox labels and the memory-screen heading level.
  Browser console inspection reported no warnings or errors.
- The low-resource first compilation took 66 seconds and later route compilation
  took up to 49 seconds, but every exercised route returned HTTP 200. The exact
  review process tree and its validated temporary database/log folder were
  removed after acceptance.
- No test runner, full build, provider request, protected-database migration,
  deployment, push or publication occurred. Routine visual review is no longer
  a gate while the approved Links drawer/card design remains materially intact.

## 2026-08-20 implementation checkpoint: durable state and selected claims

- Each completed provider answer now persists a structured conversation state
  inside its immutable answer snapshot. The latest valid state is loaded under
  the same user, workspace and Journal-account boundary before the next answer,
  so every successful answer forms a version without a mutable summary row.
- Conversation state carries the current question, enforced analysis scope,
  safe page hint, explicit conversation corrections/goals, unresolved follow-up,
  opaque pending-draft references and a bounded older-context transcript. It is
  separately identified as continuity context and cannot establish current
  financial facts or current draft status.
- The older-context summary is capped at 8 kilobytes and the complete state at
  16 kilobytes. Ordinary old transcript lines yield first when the bound is
  reached, preserving explicit corrections and goals in both the summary and a
  structured 12-note channel. Draft UUIDs are hashed to bounded opaque refs
  before state enters the provider envelope or snapshot.
- The structured provider answer now cites exact JSON Pointer paths inside each
  deterministic tool result. The server resolves those paths to its own opaque
  claim references, rejects unknown paths, cross-tool claims, unselected exact
  values and selected exact claims that the evidence statement does not use,
  then stores the selected claim refs with answer contract v2.
- Deterministic verification passed for an 80-message conversation: the explicit
  older correction remained, the summary was 8,151 bytes, total state was 9,017
  bytes, internal draft IDs were absent, malformed state was rejected, the
  latest snapshot restored successfully and a different active Journal account
  could not read it.
  Claim verification rejected unsupported, unselected, cross-tool and unused
  exact claims. The focused Links TypeScript project and focused ESLint passed.
- No provider request, protected database read/write, migration, test runner,
  full build, browser process, deployment, push or publication occurred.

## 2026-08-20 implementation checkpoint: capability and budget drift guards

- The factual-tool contract now exports one ordered runtime inventory. Its 36
  names must exactly match the factual-tool registry, and every definition must
  retain its contract version, description and limitation boundary.
- The action-draft contract now exports one unique 12-kind inventory with a
  compile-time exhaustive check against the discriminated extraction union.
  The generated 417-entry language coverage fixtures now include the saved
  Compare Trades and saved Rule-idea reads, so their tool union again equals
  the runtime registry.
- Current QA, capability-matrix, language-progress and professional-agent
  records now agree that saved Compare Trades and Rule-idea evidence are
  bounded read-only sources. Links cannot create or recalculate a comparison,
  generate or dismiss a Rule idea, or activate a rule through those reads.
- A deterministic inventory verifier passed with 36 factual tools, 12 action
  kinds, 13 runtime capability families, 417 language entries and four current
  controlling documents free of the retired tool count.
- The runtime keeps three agent turns: at most two sequential lookup steps and
  one structured answer turn. The dispatcher retains a four-snapshot hard cap,
  48-kilobyte total factual-result cap and a 96-kilobyte cumulative cross-turn
  result cap. A deterministic budget verifier accepted four small result
  packages and rejected a sequence beyond either byte ceiling.
- Raising the live turn/tool budget remains intentionally open until the
  synthetic provider evaluation measures complex cross-feature completion,
  latency, actual token usage and cost. No unevaluated cost boundary was
  widened in this checkpoint.
- All five deterministic Links verifiers, the focused no-emit TypeScript
  project and focused ESLint passed after integration. The generated language
  file was rebuilt from its maintained source and was not hand-edited.
- No provider request, protected database read/write, migration, test runner,
  full build, browser process, deployment, push or publication occurred.
