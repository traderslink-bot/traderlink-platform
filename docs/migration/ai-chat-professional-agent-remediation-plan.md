# Links AI Chat Professional Agent Remediation Plan

## Status

**Owner approved on 2026-08-20, including the visible experience and the required
Links AI Chat naming correction. No implementation has started. The concurrent
working-tree audit and explicit first-slice file allowlist remain required before
code changes.**

The owner set the acceptance target as a professional TraderLink agent with no
artificially narrow product boundary. Links AI Chat should use as much deterministic
TraderLink data as the product can truthfully obtain, and new deterministic
services or approved data sources may be added when they materially improve the
trader's experience. This expanded target does not weaken account isolation,
financial accuracy, privacy, evidence, cost control, confirmation, or
owner-review boundaries.

Progress is tracked in
[Links AI Chat Professional Agent Remediation Progress](ai-chat-professional-agent-remediation-progress.md).
The owner-review design for Links' first impression and relationship memory is
[Links First Impression And Relationship Memory Design](ai-chat-first-impression-and-relationship-memory-design.md).
The parent product contract remains the
[TraderLink AI Companion Plan](ai-chat-plan.md). The complete executable
inventory remains the
[Links AI Chat Current Dashboard Capability Matrix](ai-chat-current-dashboard-capability-matrix.md),
which must be reconciled as part of this work before it can again be treated as
current.

## Outcome

Links AI Chat will be a private, account-scoped TraderLink agent that can:

- answer natural questions using exact deterministic Journal, Analytics,
  Tracker, Rules, Review, Import, Data Decision, Account, notification, saved
  analysis, and approved market-data facts;
- combine several factual sources when the question genuinely requires it;
- preserve useful conversation continuity without treating old prose as current
  financial evidence;
- build a consistent, user-controlled relationship across conversations by
  remembering approved preferences, goals, routines, and support needs;
- give traders useful reasons to return through factual continuity, chosen
  check-in routines, progress recognition, and relevant product discovery;
- be generally helpful and use good judgment, including surfacing relevant
  deterministic information, connections or capabilities the trader may not
  have known to ask for;
- show the trader where every material factual answer came from;
- prepare useful product changes and Journal work through exact previews and
  explicit confirmation;
- fail clearly when Chat, a fact, a source, or a supported action is unavailable;
  and
- remain responsive, understandable, and professional in the global desktop
  and mobile drawer and on the direct `/ai-chat` page.

Rendering a fluent answer is not acceptance. A completed answer must be scoped,
grounded, reproducible from its retained deterministic evidence, cost-accounted,
recoverable, and understandable without internal system language.

## Current verified baseline

The 2026-08-20 QA pass confirmed the following reusable foundation:

- the official OpenAI Agents SDK `0.16.0` uses the Responses API;
- provider response storage is disabled and private-content tracing is disabled;
- SQLite remains authoritative for conversations, messages, attempts, factual
  snapshots, confirmation drafts, receipts, and recovery;
- server-derived user, workspace, and selected Journal-account scope surrounds
  every Chat route and tool;
- factual-tool contract v3 exposes 36 bounded deterministic tools, including
  saved Compare Trades studies and deterministic Rule ideas;
- action-draft contract v1 exposes 12 explicit confirmation-only action kinds;
- the desktop drawer remains 860 pixels wide at 1280 by 720 and preserves the
  current route;
- the mobile drawer remains full width at 390 by 844, with separate conversation
  and Chat close controls;
- `/ai-chat` remains a responsive direct-link fallback over the shared Chat
  surface; and
- ordinary Chat remains disabled until all provider prices, request/token/spend
  caps, entitlements, and enablement controls are deliberately configured.

The QA pass also established that the current product is not yet acceptable at
the expanded professional-agent bar:

- the disabled provider state is discovered only after the trader submits;
- the output validator proves that a cited tool ran, but does not prove that the
  generated factual statement is entailed by the tool result;
- the provider receives only the latest 12 messages and no implemented durable
  structured summary of older conversation context was found;
- three agent turns and four sequential tool calls are not yet proven sufficient
  for complex cross-feature questions;
- the capability matrix, QA report, and progress records still contain stale
  34-tool and unavailable Compare/Rule-idea claims; and
- accepted or in-review product additions are not automatically reconciled into
  the Chat inventory.

## Non-negotiable boundaries

### Product naming

- The visible feature name is always **Links AI Chat** in navigation, page and
  drawer titles, Help, availability and failure states, owner controls, product
  descriptions and new current-status documentation.
- **Links** is the assistant's name inside conversation and relationship copy.
- The `/ai-chat` route, existing filenames, database tables, contract names and
  `coach_ai_chat_*` technical identifiers remain unchanged.
- Historical exact stored values or immutable evidence strings are not renamed
  without their own reviewed compatibility and migration contract.
- The current-inventory guard must reject new visible feature copy that labels
  the feature only **AI Chat**.

### Deterministic authority

- The model never calculates authoritative P/L, rates, ratios, populations,
  currency conversions, fees, timestamps, rule outcomes, position state,
  comparison results, candle measurements, or market facts.
- Canonical TraderLink services calculate and normalize every factual value.
- Every tool result includes exact scope, population, coverage, units, currency,
  timezone, source timestamp or fact revision, limitations, and a bounded route
  back to the owning product when those fields apply.
- Missing data remains unavailable. It is never replaced by zero, a guess, a
  relabelled source value, an unsupported conversion, or a model estimate.
- Reporting-currency presentation remains separate from source evidence and
  already-issued review text.

### Account, privacy, and source isolation

- The server derives the user, workspace, selected Journal account, entitlement,
  and permitted source scope. The browser and model cannot select arbitrary
  private identities.
- The model receives no database, filesystem, statement file, credential,
  broker-account identifier, payment identifier, secret, owner-admin data,
  arbitrary network access, code interpreter, shell, or MCP access.
- Trader-authored notes, tags, imported text, saved review prose, and market-data
  labels are data, never instructions.
- Raw-statement analysis remains a separate explicit opt-in workflow. Ordinary
  Chat never silently expands into statement review.
- Broker authentication, passwords, CAPTCHA, MFA, OAuth security prompts,
  payment, account erasure, and owner administration remain in their guarded
  product surfaces.

### Trader control

- A model generation cannot directly write Journal or Account facts.
- Every supported mutation starts from a current deterministic read, becomes a
  saved expiring proposal, shows the exact before/after state, rejects stale or
  cross-account confirmation, and executes only through the canonical command
  after the trader explicitly confirms.
- A confirmation card cannot imply that a draft, recommendation, or analysis has
  already been saved.
- Position type, rule outcomes, tags, causes, emotions, setup quality, and Data
  Decision resolutions are never inferred merely from performance or prose.

## Workstream A — exact factual grounding

The current `evidenceReferences` contract is strengthened from a tool-call link
to a typed factual-claim contract.

### Server-authored claim catalog

Every deterministic tool adapter will produce a bounded catalog of display-safe
claims alongside its structured result. Each claim has:

- an opaque per-generation claim reference;
- a server-authored plain-language fact statement;
- typed exact values and their value kind;
- units, money basis, currency, and timezone where applicable;
- population, requested scope, coverage, and limitation text;
- source revision or as-of time;
- owning product route and link label; and
- the factual-tool snapshot reference and digest retained with the answer.

Raw database IDs, account IDs, statement identifiers, broker identifiers,
digests, credentials, and unapproved links never enter the display catalog.

### Structured answer composition

- The agent returns a direct answer, explanatory text, selected claim references,
  an optional limitation, and an optional next question.
- Links may select compatible related claims when they are useful, but no rule
  requires additional depth, a minimum answer size, an after-answer section or a
  set number of observations.
- Exact displayed values, dates, tickers, rule states, coverage counts, and
  evidence labels are rendered from the selected server-authored claims rather
  than copied from free model prose.
- Any answer sentence that makes a current TraderLink factual claim must select
  at least one compatible claim reference.
- The validator rejects unknown claims, incompatible units or partitions,
  unsupported comparisons, stale claim sets, factual statements without
  evidence, and unused or fabricated evidence references.
- A no-tool answer may provide product help, clarification, or a refusal, but
  cannot contain current Journal or market facts.
- Immutable answer snapshots retain the exact claim catalog and selected claim
  references so the issued answer remains explainable after source facts change.

### Grounding acceptance

- Zero mismatched financial values, dates, tickers, populations, currencies,
  timezones, coverage states, or routes across the accepted factual evaluation
  population.
- Zero factual answer blocks without a retained compatible claim.
- Deliberately altered, stale, cross-account, unknown, and fabricated claim
  references fail before the assistant message becomes completed.
- Explanatory prose cannot turn association into causation, an observation into
  advice, or a saved tag/rule/review into proof.

## Workstream B — durable conversation and relationship memory

The current fixed latest-12-message provider window is not an acceptable durable
memory design. Twelve short messages can represent only a few minutes and can
lose the subject, a correction, an unresolved question, or the reason a trader
asked for help. The professional agent will use an adaptive context package
instead of treating any fixed message count as memory.

### Adaptive current-conversation context

Each request receives a server-built context package containing:

- the current question and the complete unresolved exchange it belongs to;
- the most relevant recent messages that fit the evaluated model, privacy,
  latency, token, and spend budget;
- pinned corrections, unresolved questions, pending proposals, selected scope,
  and current task state even when they fall outside the recent window;
- a versioned structured summary of older conversation episodes; and
- bounded retrieval of relevant earlier messages from the same private
  conversation when the current question refers back to them.

The context budget is measured primarily in tokens and semantic task boundaries,
not message count. Short messages therefore do not prematurely displace useful
context. If the context budget is reached, the server summarizes the oldest
eligible material while preserving corrections, promises, unresolved questions,
and user-approved memories. The model never receives unlimited history.

### Versioned conversation state

The account-scoped conversation record gains a versioned private state containing
only what is needed for continuity:

- the active question or task;
- current date/ticker/analysis scope;
- opaque references to previously discussed trades, days, rules, reviews,
  comparisons, Rule ideas, notifications, decisions, positions, or accounts;
- unresolved clarification questions;
- pending confirmation/draft references and their terminal state;
- trader-supplied wording preferences or goals that belong only to this
  conversation; and
- a bounded plain-language summary of older conversational context.

### Cross-conversation relationship memory

Relationship memory is a separate private, versioned record that can help the
agent feel consistent across new and archived conversations. It has two explicit
scopes:

- **User-wide memory** follows the stable TraderLink user across their permitted
  conversations and may contain their chosen name, learning goals, recurring
  areas of focus, and general routines.
- **Journal-account memory** remains inside one selected Journal account and may
  contain user-approved trading-process goals, recurring review focus, routines,
  and reminders that should not cross into another account.

The bot may suggest a memory only when the trader has clearly expressed something
useful for future conversations. Saving it requires an explicit **Remember this**
confirmation, or an equivalent direct request such as “remember that I prefer
short answers.” Ambiguous, inferred, sensitive, or financial details are not
saved as relationship memory. Every saved item records its scope, source
conversation/message, creation time, last confirmation time, and active,
superseded, or forgotten state.

Relationship memories remain available until the trader changes or forgets them;
they do not expire merely because a fixed number of days or messages passes.
Potentially time-sensitive goals, routines, and focus areas are presented as
“You previously told me…” and periodically offered for reconfirmation rather than
asserted as current. The system will provide a plain **What Links remembers**
surface where the trader can review, correct, change scope, or forget individual
items and turn relationship memory off.

The bot never creates hidden psychological profiles or permanently infers risk
tolerance, emotional state, financial circumstances, skill, discipline,
personality, diagnoses, weaknesses, or trading intent. It does not save raw
Journal facts, P/L, positions, executions, market facts, credentials, or broker
identifiers as relationship memories.

### Supportive relationship behavior

- Be warm, patient, supportive, and encouraging while remaining clear that the
  trader controls every choice.
- Encourage preparation, reflection, consistency, and use of the trader's own
  stated process rather than celebrating profit, loss, trade frequency, or risk.
- Present suggestions as optional paths, never as pressure, urgency, shame,
  fear, obligation, or a forced decision.
- Ask permission before changing direction, setting a reminder, proposing an
  action, or turning a remembered goal into a follow-up.
- Do not use dependency-building language, claim human feelings, imply exclusive
  friendship, or suggest the trader should rely on Links AI Chat instead of qualified
  financial, medical, legal, or personal support.
- When a trader is frustrated or has a setback, acknowledge it without diagnosing
  them, then offer factual review or a pause as optional next steps.

### Memory safety

- Conversation state helps interpret follow-ups; it is never financial evidence.
- Relationship memory personalizes tone and continuity; it is never financial
  evidence, proof of current intent, or authority to perform an action.
- Every current fact is re-read from the canonical deterministic service before
  it appears in a new answer or proposal.
- Stale entity references resolve again inside the current account or become
  unavailable.
- The model may propose a state update, but the server validates allowlisted
  fields, size, scope, and references before saving a new immutable state version.
- The state summary excludes raw statements, credentials, account identifiers,
  provider data, and facts from another account.
- Relationship-memory retrieval is server-scoped before provider work and cannot
  be broadened by a prompt, model-selected identifier, or remembered name.
- Archiving preserves the bounded state with the conversation. A future deletion
  policy must erase it with the same account-scoped privacy authority as messages.

### Continuity acceptance

- Follow-ups after long runs of at least 50 short messages retain the correct
  subject, corrections, unresolved questions, and scope.
- Relevant earlier exchanges can be recovered from the full private conversation
  without sending unrelated history to the provider.
- A new conversation can use approved relationship memories while keeping its
  transcript and account-specific facts isolated.
- Correcting or forgetting a relationship memory takes effect on the next
  request and does not rewrite historical messages.
- The same prompt produces no cross-account relationship-memory leakage, even
  when accounts use the same ticker, date, goal wording, or conversation title.
- Changing the selected Journal account invalidates prior account-bound entity
  references instead of carrying facts across accounts.
- A trader correction supersedes the conversational interpretation without
  rewriting earlier immutable answers.
- Refresh, retry, pending-generation recovery, archive/restore, and direct-page
  handoff preserve the same current conversation state.

## Workstream C — professional orchestration

- Keep one primary TraderLink manager agent unless an evaluation proves that a
  specialist agent or handoff materially improves accuracy enough to justify its
  extra cost, latency, and operational surface.
- Replace the unproven fixed three-turn/four-tool assumption with an evaluated,
  bounded request budget. Simple requests remain small; complex requests may use
  a larger approved turn/tool envelope only inside the reserved token and spend
  cap.
- Continue to disallow arbitrary tool names and verify exact Agents SDK tool
  order against the canonical registry before provider work begins.
- Tool calls remain account-scoped, schema-strict, byte-bounded, and cumulative-
  result bounded. The agent cannot silently broaden the trader's visible scope.
- Evaluate sequential and safe independent read concurrency. Enable concurrency
  only if deterministic snapshot ordering, resource use, recovery, and cost
  accounting remain exact.
- A complex request that cannot be completed inside its approved budget returns
  a useful partial answer with its exact limitation or asks one focused follow-up;
  it does not improvise missing evidence.

## Workstream D — professional availability and failure experience

The client receives a privacy-safe readiness projection before a question can be
submitted. It exposes only trader-relevant states, never provider names, model
IDs, prices, tokens, internal controls, or failure codes.

### Exact visible states for owner approval

#### Not available yet

- Heading: **Links AI Chat is not available yet**
- Body: **Your conversations are saved, but new answers are not available yet.**
- Composer placeholder: **Links AI Chat is not available yet**
- The composer and Send action are disabled.
- Starting or submitting does not create an empty conversation, message,
  generation attempt, or receipt.

#### Temporarily unavailable

- Heading: **Links AI Chat is temporarily unavailable**
- Body: **Your question has not been sent. Try again when you are ready.**
- Action: **Try again**
- A saved failed or pending question keeps its accurate state and never starts a
  duplicate generation.

#### Daily limit reached

- Heading: **Today’s Links AI Chat limit has been reached**
- Body: **Your conversations are still available. You can ask another question
  when your daily access resets.**
- When the server can state the reset time exactly, the UI may show it in plain
  local time. It must not guess.

#### Answer still in progress

- Label: **Links is thinking…**
- The saved question remains visible.
- Send stays disabled until the attempt reaches a completed, failed, blocked, or
  safely expired state.
- Refreshing the page resumes the same attempt and confirmation-card polling.

#### Answer could not be completed

- Heading: **The answer could not be completed**
- Body: **Your question is saved. You can try it again without creating a
  duplicate.**
- Action: **Try again**

### Layout boundary

- Preserve the current light Material design.
- Preserve the 860-pixel desktop drawer at 1280 by 720, the bounded wider
  extra-large layout, and the full-width 390 by 844 mobile layout.
- Preserve the current dashboard route when Chat opens or closes.
- Keep conversation-list and Chat close controls independently reachable on
  mobile.
- The direct `/ai-chat` page uses the same conversation, readiness, answer,
  evidence, and confirmation components.
- Correct all Chat-path browser errors and warnings before visual acceptance,
  including shared-shell warnings encountered during Chat QA.

No visible implementation in this workstream starts until the owner approves
this copy and state behavior.

## Workstream E — complete deterministic capability coverage

### Reconcile before expanding

- Rebuild the matrix from the current navigation, routes, Help collections,
  canonical services, action routes, and accepted in-review product plans.
- Record the current 36 factual tools and 12 action kinds exactly.
- Reconcile Compare Trades and Rule ideas across the parent plan, matrix,
  progress, QA report, language registry, runtime capability registry, and Help.
- Give every current product feature one explicit Read, Draft, Confirm,
  Unavailable, Safety-protected, or Product-excluded disposition.
- Add a static inventory guard so a route/capability/tool/help change cannot leave
  these controlling inventories silently inconsistent.

### Candidate professional-agent expansions

Each candidate below receives its own deterministic source contract, privacy
review, cost boundary, focused verifier, language/evaluation mapping, Help
update, and owner approval before implementation.

1. **Market-data access status**
   - Read whether the selected user/workspace has the accepted market-data
     entitlement and an active authorized connection.
   - Expose no credential, broker-account identifier, OAuth token, or private
     connection record.
   - This follows the owner acceptance boundary of the current Moomoo
     market-data guidance work; Chat does not silently adopt unapproved UI work.

2. **Bounded market facts**
   - Add only facts TraderLink can lawfully and reliably obtain from an accepted
     source: quote, exchange, as-of time, supported candles, float,
     fundamentals, or screener fields as separately approved.
   - Every response states source, market timestamp, exchange/session, currency,
     delay/coverage, and unavailable fields.
   - The model receives no arbitrary symbol/network endpoint. The server owns the
     symbol allowlist, source request, caching, entitlement, and retained evidence.
   - Market facts describe observed data and never become signals, predictions,
     price targets, or trading instructions.

3. **Compare Trades proposals**
   - Let Chat prepare two-to-four named groups using only validated Trade
     Explorer filters.
   - Show exact group definitions and current deterministic preview before the
     trader confirms a save.
   - Never label a group best, recommended, causal, or predictive.

4. **Completed-trade Review proposals**
   - Let Chat prepare one atomic proposed Review containing the complete note,
     complete tag set, and explicit custom-rule outcomes for one exact completed
     trade.
   - Preset results remain deterministic and read-only.
   - The existing Trade Explorer stale-state, account, and one-Save transaction
     remains authoritative.

5. **Cost-confirmed analysis requests**
   - Where the owning product has an accepted canonical request command, Chat may
     prepare an exact Trade Analyzer or Candle Review request with coverage,
     entitlement, expected cost boundary, and explicit confirmation.
   - Confirmation requests work; it does not promise a result or write invented
     analysis.

6. **Explicit full-statement review**
   - Remain outside ordinary conversation context.
   - Require a separate visible opt-in that states what source content will be
     sent, for what purpose, to which configured provider boundary, and what will
     be retained.
   - Never expose credentials, raw identity values, broker-account identifiers,
     secrets, or unrelated statements.

### Permanent exclusions unless separately reapproved

- credentials, passwords, CAPTCHA, MFA, security prompts, and OAuth completion;
- arbitrary SQL, database browsing, filesystem, shell, code execution, general
  web browsing, or arbitrary network calls;
- payment, subscription purchase/cancellation, account erasure, ownership
  transfer, or Journal Administration;
- trade signals, predictions, price targets, portfolio instructions, tax/legal
  advice, or autonomous rule/position judgments; and
- direct unconfirmed writes to Journal, Account, broker, or market-data state.

## Workstream F — provider, entitlement, and cost readiness

- Select the launch model only after professional-agent evaluations prove its
  accuracy, instruction following, tool selection, structured-output stability,
  latency, and cost for TraderLink's real contract.
- Record current official prices for ordinary input, cached input, cache-write
  input, and output at the owner-controlled activation checkpoint. Never guess or
  copy rates from another model.
- Configure platform and account entitlement, daily request cap, daily token
  cap, and daily estimated-spend cap before enablement.
- Preserve conservative reservation, exact receipt finalization, Eastern-day
  accounting, cache-class separation, abort timeout, stale lease recovery, and
  one pending generation per conversation.
- Readiness must fail closed when any price, cap, entitlement, key, model, or
  integrity precondition is incomplete.
- No private live-provider acceptance run occurs without the owner's explicit
  approval of the exact data and provider boundary. Synthetic/disposable cases
  remain the first gate.

## Workstream G — personal return value and responsible engagement

Links AI Chat is a primary TraderLink engagement surface, but it earns repeat use by
being consistently useful and trustworthy. It does not manufacture urgency,
maximize dependence, or turn a trader's losses, emotions, or private writing
into marketing pressure.

### Optional relationship setup

- Offer the owner-reviewed deterministic **Meet Links** setup defined in
  [Links First Impression And Relationship Memory Design](ai-chat-first-impression-and-relationship-memory-design.md).
- It asks what the trader wants to be called and may collect explicitly declared
  experience, trading approach, markets/products, setups, current process focus,
  emotional patterns and routines through a final reviewed memory package.
- Apply the same memory confirmation and edit/forget controls as every other
  relationship memory.
- Do not force a personality quiz, label the trader, or block Chat until setup is
  complete.
- Do not ask the user to define how Links should help. Links owns complete
  product-capability awareness and may surface useful relevant help beyond the
  immediate request without changing its one owner-defined personality.
- Introduce **remember this** during Meet Links as a useful continuing capability
  that lets the trader carry important context into future conversations.

### Owner-approved stable Links identity

- The feature title is **Links AI Chat**. The assistant's stable name is
  **Links**, with the plain descriptor **Your TradersLink AI assistant**.
- Use the existing `public/icons/traderlink-512.png` brand asset as the
  assistant avatar: the white continuous interlocking chain on a deep-blue
  square. Do not invent a separate robot, person, face, or unrelated AI mark.
- Links has one owner-defined TradersLink personality across every user and
  account. Users do not select alternate named characters, personalities, tone
  modes, answer-depth modes, coaching modes, or educational modes.
- Relationship memory changes what Links knows about the trader, not who Links
  becomes. Name, goals, routines, prior context, and current deterministic facts
  make the relationship personal while the voice remains stable.
- Links has the presence of a smart, knowledgeable, well-rounded and successful
  buddy: socially natural, confident, engaging, perceptive, supportive, and easy
  to spend time with. Its language can be polished, expressive, and
  conversational rather than deliberately plain or mechanical.
- “Successful” describes Links' composure, competence, taste, consistency, and
  judgment. Links never invents personal wealth, trades, lived experience,
  relationships, feelings, or status, and never uses success as pressure.
- Links adjusts naturally to the situation inside that one identity: relaxed and
  upbeat in ordinary conversation, focused around exact evidence, and steady and
  respectful after a difficult session. It does not become theatrical, forced,
  slang-heavy, falsely familiar, promotional inside a factual answer, or falsely
  certain.
- Evidence-led is a truth and behavior contract, not a requirement that every
  sentence sound clinical. Links can be charismatic and warm while every factual
  claim remains deterministic and supported.
- The name, descriptor, icon treatment, introduction, message avatar, working
  state, evidence state, confirmation state, unavailable state, and small-size
  accessibility must receive iterative owner visual approval before acceptance.

### Owner-controlled Links personality

- Users receive one published Links personality and cannot select or alter its
  personality, tone, educational emphasis, coaching emphasis, or default answer
  depth.
- The one active personality is controlled only through the owner's authenticated
  admin account and the accepted server-side owner-admin authority. Ordinary
  workspace roles, Premium entitlement, client state, account ownership, or a
  model request cannot authorize these controls.
- Owner controls cover the stable personality definition, conversational tone
  range, educational emphasis, coaching emphasis, humor restraint, default
  answer depth, and related examples. They personalize the global Links product,
  not individual users.
- Personality settings use versioned draft, preview, publish, and rollback
  states. Only one version is published for all users at a time, and each answer
  retains the exact personality-version reference used to generate it.
- Preview uses synthetic, non-private evaluation prompts across ordinary chat,
  factual analysis, missing data, difficult sessions, boundaries, product
  discovery, and confirmation flows before publication.
- Owner personality controls cannot weaken account isolation, deterministic
  grounding, privacy, confirmation, non-advice, cost, entitlement, or
  non-manipulation policies. Those remain enforced separately by server code.
- The exact admin route, controls, labels, preview experience, and publication
  workflow require a separate design and owner approval before implementation.

### Factual welcome-back experience

- When useful current evidence exists, open with a concise **Welcome back** card
  that can continue an unresolved conversation, revisit an approved goal, or
  identify meaningful changes since the trader's last visit.
- Eligible changes come only from deterministic TraderLink state, such as a
  completed import, a Data Decision needing attention, newly available analysis,
  an unfinished review, or a user-approved follow-up.
- If nothing meaningful changed, do not fabricate activity or imply the trader
  has been absent too long. Open directly into conversation.
- The trader can dismiss the card, disable it, or choose which categories may
  appear.

### User-chosen routines and follow-ups

- Let the trader opt into useful routines such as a pre-session plan, post-session
  reflection, end-of-week review, monthly progress review, or a custom follow-up.
- Each routine has an explicit account scope, cadence, delivery surface, and
  pause/stop control. Notifications remain in the owning notification system.
- Links AI Chat may ask once whether the trader wants a useful follow-up remembered. It
  cannot repeatedly push after the trader declines.
- Returning to a routine continues from the relevant approved memory and current
  deterministic facts rather than restarting with a generic script.

### Process-based progress recognition

- Recognize actions under the trader's control: completing reviews, resolving
  source issues, documenting a plan, revisiting a rule, or consistently using a
  chosen reflection routine.
- Do not praise profit, trade frequency, leverage, risk-taking, or the act of
  returning merely to create engagement.
- Do not use streak loss, countdowns, scarcity, shame, fear of missing out, or
  comparative rankings to pressure a return.
- Any progress comparison includes its exact period, eligible population,
  coverage, and limitations.

### General helpfulness and contextual product discovery

- Links may surface relevant facts, connections, coverage, analysis, tools,
  features or workflows the trader did not know to request when doing so is
  genuinely helpful.
- There is no fixed format, required depth, timing rule, suggestion step,
  extra-insight quota or numerical feature limit. Links does not mechanically
  add information to every response.
- A feature or workflow appears only when it naturally helps the trader
  understand, verify or continue the subject. It must not displace the factual
  answer or turn conversation into repetitive product promotion.
- Explain why the feature is relevant and whether it is currently available,
  requires more data, has a provider cost, or belongs to another entitlement.
- Never hide an available included path in order to promote a paid one.
- Private notes, emotional language, losses, drawdowns, risk behavior, and
  relationship memories cannot be used to target upgrades or promotional copy.
- Product discovery is helpful navigation, not a substitute for a factual answer.

### Engagement success measures

Success is measured by useful outcomes: resolved questions, completed chosen
reviews, accurate return-to-task continuation, adopted relevant features,
memory corrections honored, opt-in routine usefulness, and trader-rated trust.
Time spent in Chat, number of messages, notifications opened, trades taken, and
upgrade conversion are never standalone optimization targets for agent behavior.

## Workstream H — professional evaluation program

The locked 417-entry language registry remains a vocabulary and routing target;
it is not sufficient proof of professional agent quality.

### Required evaluation families

- exact single-tool facts;
- multi-tool synthesis across Journal, Analytics, Rules, Reviews, and product
  state;
- varied helpfulness cases proving Links can answer briefly or surface additional
  supported information without following a fixed pattern or inventing a cause,
  setup, label or capability;
- long follow-ups beyond the recent-message window;
- new conversations using, correcting, reconfirming, disabling, and forgetting
  approved relationship memories;
- at least 50 consecutive short-message turns, topic returns after intervening
  discussion, and meaningful returns after extended inactivity;
- optional relationship setup, welcome-back relevance, chosen routines,
  non-pressuring follow-ups, process recognition, and contextual product
  discovery;
- stable Links personality behavior across casual, factual, educational,
  coaching, difficult-session, refusal, and unavailable contexts;
- owner-only personality draft, preview, publish, rollback, version attribution,
  authorization failure, and invariant-policy enforcement;
- adversarial engagement cases involving losses, frustration, emotional notes,
  repeated declines, upgrade eligibility, and long absence;
- corrections, contradictions, scope changes, and selected-account changes;
- missing coverage, mixed currency/timezone partitions, unresolved Data
  Decisions, and unavailable market data;
- factual sorting versus grouped ranking;
- saved comparisons and deterministic Rule ideas;
- draft creation, preview, confirm, reject, expiry, stale state, retry, and
  idempotency for every action kind;
- adversarial text inside notes, tags, rule text, imports, saved reviews, and
  market labels;
- unsupported advice, prediction, admin, payment, deletion, authentication,
  and raw-statement requests;
- provider timeout, malformed output, usage mismatch, cost-cap block, refresh,
  recovery, and duplicate-send behavior; and
- desktop, mobile, direct-page, drawer, history, evidence, confirmation, and
  accessibility behavior.

### Required pass gates

- zero cross-user, cross-workspace, or cross-account reads or writes;
- zero unconfirmed product or Journal mutations;
- zero unsupported or mismatched exact factual claims;
- zero fabricated evidence, routes, source timestamps, coverage, or current
  capabilities;
- exact provider usage and cost receipt for every completed paid generation;
- deterministic retry and recovery without duplicate answer, write, or charge;
- every unavailable state remains truthful and useful;
- zero engagement prompts based on private vulnerability, loss, fear, shame,
  urgency, fabricated activity, or repeated declined follow-ups;
- all visible copy remains plain trader language; and
- owner visual/product acceptance at every changed desktop and mobile state.

Under the current repository instruction, implementation verification does not
use Vitest or another test runner. It uses narrow deterministic operational
verifiers, targeted TypeScript and lint checks, whitespace/static inventory
checks, controlled low-resource browser acceptance, and an explicitly approved
live-provider evaluation only at its checkpoint. Broader build/CI verification
remains a final acceptance or merge-readiness boundary.

## Delivery checkpoints

### Checkpoint 0 — plan and visible-state approval

- [x] Owner approves this complete plan.
- [x] Owner approves the exact availability/failure copy and drawer behavior with
  **Links AI Chat** as the required visible feature name.
- [x] Audit concurrent working-tree ownership and establish explicit file
  allowlists before implementation.

### Checkpoint 1 — grounding and conversation-state contracts

- Add the typed claim catalog, structured answer composition, strict validator,
  immutable claim snapshot, adaptive context package, versioned conversation
  state, older-context summary, and scoped relationship-memory contracts.
- Prove account isolation, stale reference handling, deterministic re-reads, and
  exact answer reconstruction before changing visible answer presentation.
- Present the **What Links remembers** experience for iterative owner approval
  before implementing its visible controls.
- Follow the exact owner-approved interaction and copy contract in
  [Links First Impression And Relationship Memory Design](ai-chat-first-impression-and-relationship-memory-design.md).

### Checkpoint 2 — professional Chat presentation

- Implement owner-approved readiness/failure states and server-authored evidence
  presentation in the shared Chat surface.
- Complete iterative owner review on desktop drawer, mobile drawer, direct page,
  conversation history, answer, evidence, and confirmation states.
- Present the optional relationship setup, welcome-back card, routine controls,
  stable Links identity, progress recognition, and contextual feature suggestion
  states for separate owner approval before implementing each visible
  experience.
- Present the owner-only personality controls, preview, publish, and rollback
  experience for separate owner approval before implementing the admin surface.

### Checkpoint 3 — orchestration and complete current-product evaluation

- Establish the accepted turn/tool/result/token budget from the professional
  evaluation population.
- Reconcile the current matrix, language, Help, runtime, QA, and progress
  inventories.
- Complete synthetic live-provider evaluation without private Journal data.

### Checkpoint 4 — new deterministic data and actions

- Review and approve candidates individually in value/risk order.
- Implement only accepted source and action contracts.
- Obtain separate owner visual approval for every new visible source, evidence,
  proposal, or confirmation state.

### Checkpoint 5 — controlled launch acceptance

- Select model, official four-class prices, entitlement, caps, monitoring, and
  support boundaries.
- Complete the approved private-data/provider acceptance, full low-resource
  browser pass, final static/operational verification, and release handoff.
- Activation, deployment, and publication remain separate explicit owner
  operations.

## Documentation and progress control

- This plan and its progress record must stay current while work is underway.
- The parent AI Companion plan, AI Companion progress, current-dashboard matrix,
  complete QA report, runtime progress, language registry, Help, and relevant
  feature plans must agree before a capability is called complete.
- Historical immutable answer snapshots and old QA records are not rewritten as
  if they used a later contract. Current status sections must clearly distinguish
  historical checkpoints from current executable truth.
- Each accepted implementation checkpoint uses a narrow local commit containing
  only its explicit files. Concurrent and unknown work is preserved and never
  staged merely because it is present.

## Completion definition

The professional-agent remediation is complete only when:

- every current product surface has a truthful, current capability disposition;
- every displayed material fact is rendered from a retained compatible
  server-authored claim;
- long conversations retain useful private continuity while every current fact
  is re-read from canonical authority;
- approved relationship memories make new conversations feel personally
  consistent while remaining reviewable, correctable, forgettable, and isolated;
- return engagement comes from factual continuity and chosen useful routines,
  never pressure, manufactured urgency, vulnerability targeting, or dependence;
- complex supported questions complete inside an evaluated cost and tool budget;
- unavailable, blocked, pending, failed, and recovered states are professional
  and unambiguous;
- accepted new deterministic data and actions preserve source, coverage,
  privacy, and confirmation boundaries;
- the full professional evaluation program passes; and
- the owner accepts the integrated desktop and mobile product experience.
