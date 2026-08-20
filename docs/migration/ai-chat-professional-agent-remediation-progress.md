# Links AI Chat Professional Agent Remediation Progress

## Status

**Plan and visible experience owner-approved on 2026-08-20 with Links AI Chat as
the required feature name. No implementation has started. The concurrent-file
audit and first implementation allowlist remain open.**

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
- Controlling documentation still contains stale 34-tool and unavailable
  Compare Trades/Rule-idea claims despite current v3/v4 runtime coverage.

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
- [ ] Audit concurrent file ownership and publish the first implementation
  allowlist.

### Grounding and continuity

- [ ] Implement the server-authored factual-claim catalog.
- [ ] Implement structured answer composition and strict claim validation.
- [ ] Persist immutable claim catalogs and exact selected claims with answers.
- [ ] Implement versioned private conversation state and bounded older-context
  summary.
- [ ] Replace the fixed latest-12-message context boundary with an evaluated
  token- and task-aware context package plus bounded same-conversation retrieval.
- [ ] Implement separately scoped user-wide and Journal-account relationship
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

- [ ] Implement privacy-safe Chat readiness projection.
- [ ] Implement the owner-approved unavailable/failure/limit/pending/retry UI.
- [ ] Prevent empty conversation/message/attempt creation when Chat is not ready.
- [ ] Render server-authored evidence and exact owning-product links.
- [ ] Correct Chat-path browser warnings.
- [ ] Complete iterative desktop/mobile/direct-page owner review.

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
- [ ] Reconcile the current 36-tool/12-action matrix, Help, language, runtime,
  QA, and progress records.
- [ ] Add a static inventory-drift guard.
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

- No application or database implementation was changed.
- No provider request was made.
- No Journal fact or existing message was changed.
- No test runner, build, deployment, push, merge, or publication occurred.
- No concurrent dirty file was staged, committed, overwritten, or discarded.
