# TraderLink AI Companion Plan

## Status

**Planning only.** This is the main, end-state plan for the TraderLink AI
Companion: AI Chat, the Daily Trade Tracker companion, saved weekly and monthly
reviews, conversational manual execution entry, account settings, and Journal
Administration controls. No new route, database record, provider request,
manual execution write, or automatic review behavior is authorized by this
document until the owner accepts the complete plan.

The [AI Reviews Plan](ai-weekly-review-plan.md) remains the governing contract
for the already-approved weekly and calendar-month review boundaries. This plan
coordinates that work with the broader AI product; it does not revive the V3
Coach or depend on a V3 route, database, analytics engine, or prompt.

Implementation status is tracked in [AI Companion Progress](ai-chat-progress.md).

## Product direction

TraderLink AI is a private companion for a trader's own Journal. It helps the
trader record accurate executions, complete a useful daily review, understand
their own results, and receive a grounded weekly or monthly perspective. It is
not a generic stock chatbot, a trade signal service, a prediction engine, or a
replacement for the trader's broker statement.

The complete product has four connected experiences:

| Experience | Where it appears | Purpose |
| --- | --- | --- |
| Daily Review Companion | Daily Trade Tracker | Helps the trader turn the day's facts and their own observations into a completed review. |
| AI Chat | `/ai-chat` | Lets the trader ask questions, examine their record, and enter a draft of manual executions conversationally. |
| AI Reviews | `/ai-reviews` | Delivers and saves scheduled weekly and calendar-month reviews. |
| AI controls | Account Settings and Journal Administration | Lets the trader choose a review schedule and lets the owner manage availability, models, spending, and delivery health. |

All four experiences read the same selected Journal account. Broker imports and
manual executions remain in the one canonical account ledger. AI never becomes
an alternate ledger, a source of market facts, or a hidden decision-maker.

## Non-negotiable rules

1. **Facts first.** The server builds a compact, account-scoped factual package
   before any model request. The model does not query the database directly or
   gain arbitrary application, browser, statement-file, or network access.
2. **The trader controls facts.** AI can explain, organize, suggest a draft, or
   ask a helpful question. It cannot silently save, edit, delete, exclude,
   classify, tag, complete a review, or alter an execution.
3. **Canonical Journal protection.** Conversational manual entry must use the
   same preview, duplicate, reconciliation, Data Decisions, and commit path as
   Quick Trade Entry and the trackers. There is no AI-only write path.
4. **No invention.** Missing coverage, unresolved Data Decisions, absent notes,
   missing prices/times, or unavailable calculated values must stay unavailable.
   The AI may ask the trader for a fact but never fill it in.
5. **No trading advice.** The AI must not recommend a ticker, price target,
   entry, exit, position size, strategy, or market prediction; it must not give
   tax, legal, medical, or financial advice.
6. **Privacy by account.** Conversations, factual snapshots, review packages,
   manual-entry drafts, and costs are scoped to the current user, workspace,
   and Journal account. Raw statements, account numbers, credentials, Discord
   identities, and hidden admin data never enter model context.
7. **No fake coaching.** Empty accounts receive an honest empty state. The
   product never creates sample conversations, fabricated insights, fictional
   trade notes, or placeholder reviews for a trader.

## Daily Trade Tracker companion

The Daily Trade Tracker remains the place where a trader journals one Eastern
market trading day. The AI companion makes that workflow easier and more useful
without taking ownership of it.

### Intended daily flow

1. The trader enters executions for one trading date, through the tracker or
   through a confirmed AI-chat draft. The existing Journal preview determines
   duplicate/reconciliation outcomes before any save.
2. The tracker organizes the saved day by ticker and trade. The trader can edit
   their own manual executions, choose tags, write a single trade note, and see
   applicable automatically evaluated rules.
3. The trader may open **Ask about this day**. AI receives only that day’s
   factual trade summary, saved notes, selected tags, evaluated rules, the
   Current Focuses history relevant to the day, and any stated availability
   limitations.
4. The companion can ask concise reflection questions, surface a supported
   observation, or help turn the trader’s own rough words into a proposed note.
   Example: if a rule was broken and no trade note exists, it may invite the
   trader to record what happened. It must not claim why the rule was broken.
5. When AI proposes wording for a trade note, daily note, or Current Focus, the
   proposed text is shown as an editable draft. The trader explicitly chooses
   whether to save it through the normal annotation command.
6. The trader marks **Review completed** themselves. That action saves any
   unsaved tracker fields first, but AI cannot press it, mark it automatically,
   or create a review for a day the trader never reviewed.

### Daily companion capabilities

- Explain a factual result or rule outcome in ordinary language.
- Help the trader write a clearer trade note, daily reflection, or focus while
  preserving that it is trader-authored and editable.
- Ask a short, relevant reflection question based on saved facts; it should not
  show generic boilerplate or force the trader to answer.
- Compare the day with the trader’s active Current Focuses and earlier saved
  focuses, using the dated revision history rather than pretending there was
  one immutable weekly focus.
- Point the trader to an existing Data Decisions item only when it truly limits
  a fact they asked about. It does not make Data Decisions the center of a
  daily-review experience.

### Daily companion boundaries

- It never creates tags, rules, notes, rule outcomes, classifications, or a
  completed review on its own.
- It does not ask the trader to reconstruct old historical days. Historical
  imported days can be read and discussed if supported, but the current daily
  journaling workflow remains for current/recent trading days.
- It does not treat a tag as proof of a setup, emotion, or cause. Tags are
  trader context.
- It does not use open positions in realized P/L conclusions. An intentional
  swing or bag hold may be discussed only when the trader asks about it and its
  saved classification supports that discussion.

## Conversational manual execution entry

AI Chat must let a trader enter manual executions naturally while retaining the
same financial safeguards as every other entry surface.

### Deliberate entry mode

- The chat has a clear **Enter trades in chat** action. Ordinary questions are
  never silently interpreted as a request to write trades.
- The trader may describe one or several executions in normal language, such as
  a buy, add, partial exit, or full exit.
- AI extracts only a **draft**. It presents one editable execution row per
  proposed execution with: trading date, Eastern execution time, ticker, side,
  quantity, price, and optional fees.
- It asks a short direct follow-up for a missing required fact. If the trader
  cannot supply the fact, the draft stays unsaved. The AI must not substitute a
  guessed time, price, quantity, date, or ticker.
- The confirmation screen explains that exact broker values—especially time—
  make later statement matching more reliable, without technical language.

### Confirm and save

1. The trader edits the extracted rows and explicitly confirms the draft.
2. The server calls the existing Journal manual-entry preview for the selected
   account. It applies duplicate detection, exact arithmetic, chronological
   rebuilding, provenance, and Data Decisions protections.
3. The preview shows a plain result: ready to save, possible duplicate,
   conflicting record, or a factual decision that needs attention. It never
   hides valid unrelated activity.
4. Only an explicit final **Save executions** action invokes the existing
   canonical Journal commit command. The resulting facts are indistinguishable
   from manual facts entered in Quick Trade Entry or a tracker, except for
   truthful entry provenance showing that the trader used AI Chat to prepare
   the draft.
5. The chat displays the saved result and offers the appropriate next step:
   Daily Trade Tracker for a one-day review, Swing Trade Tracker for an
   intentional multi-day swing, or Quick Trade Entry for a simple execution
   record with no review flow.

### Day, swing, and open-position handling

- A Daily Trade Tracker submission accepts one trading date only. If a chat
  draft contains more than one date, it must not force the rows into one daily
  review; it routes the trader to Quick Trade Entry or the Swing Trade Tracker.
- A trader explicitly identifies an intentional swing when appropriate. AI may
  ask for that classification when a position remains open, but it never infers
  a swing merely from duration.
- A position intentionally left open can be marked as swing, long-term hold, or
  bag hold by the trader. These are trader choices, separate from source-import
  Data Decisions.
- Later broker imports may overlap chat-entered manual executions. The normal
  reconciliation workflow asks the trader to decide rather than silently
  deleting the manual record or admitting a duplicate.

## AI Chat experience

### Route and layout

- Add `/ai-chat` to the dashboard navigation beside **AI Reviews**.
- The page has a concise, trader-facing introduction; no database, prompt,
  token, or system-language copy appears in the visible product.
- Desktop: saved private conversations on the left, active conversation in the
  center, and a compact account/date context control above the composer.
- Mobile: conversations open in a drawer; the conversation and composer remain
  the main screen. Factual cards stack without wide tables.
- The account follows the normal account selector. A conversation never moves
  between accounts. Default analysis scope is recent history, but the trader
  can choose a supported date range before asking.

### Conversation features

- New, rename, archive, restore, and search personal conversations.
- Saved answer history and follow-ups from a weekly or monthly review.
- Compact, linked factual cards for the exact trades or periods an answer
  discusses. These open existing TraderLink details, not raw broker rows.
- An explicit context selector: current day, selected week, selected month,
  custom date range, selected ticker, or selected trade where supported.
- A visible entry-mode switch for conversational manual execution drafts.
- Suggested opening questions only in an empty conversation and only as generic
  examples; never as fake results.

### Supported question families

| Family | Examples | What the AI may return |
| --- | --- | --- |
| Results and patterns | best/worst days, ticker results, hold-time patterns, re-entries, scaling | filtered Journal facts plus supported observations |
| Rules and focuses | rule follow-through, current-focus progress, repeated behavior in notes | factual outcomes plus carefully bounded coaching |
| Daily review | help me review today, turn these bullets into a note, what did I miss? | reflection prompts and user-approved drafts |
| Saved review follow-up | what should I take from last week’s review? | prior review context paired with current factual context |
| Journal guidance | how does this tracker work? what does this status mean? | product help without exposing internals |
| Manual execution capture | I bought/sold/added/covered... | editable execution draft and canonical preview/commit |
| Future data-backed analysis | entry/exit analysis, chart/candle facts, tagged setup comparison | only after the required market-data coverage and product contract exist |

Unsupported questions receive a brief honest answer describing what the chat can
help with now. It must not quietly turn an unsupported request into unrelated
analysis.

## Weekly and monthly reviews

Weekly and calendar-month reviews are not chat transcripts. They are saved,
dated coaching records generated from an immutable input package after the
selected review schedule. AI Chat can start a follow-up conversation from a
saved review, but it must identify the review as prior context rather than new
proof.

### Review input package

The existing review plan governs the exact shape. At a high level, a package
contains only the active account’s eligible completed facts, evaluated rules,
trader notes, selected tags, daily-review completion state, Current Focuses
and every dated revision during the period, prior relevant AI reviews, and
truthful availability limitations. It does not contain raw statements, private
identity, credentials, other accounts, or invented narrative.

### Scheduling

- The trader chooses Friday, Saturday, or Sunday and an Eastern delivery time
  in Account Settings.
- The weekly schedule creates one review per completed eligible week.
- A calendar-month review follows the approved partial-first-month and
  eligibility rules in the AI Reviews Plan; it is not a rolling four-week
  summary.
- The scheduler is idempotent and records a saved review package before calling
  the provider. A retry never double-bills or silently replaces an issued
  review.
- No review is sent merely because a calendar time passed. It must meet the
  stated data/review eligibility conditions.

## Data, history, and retention

### New AI Companion records

One future Coach migration, numbered only at implementation, should add the
following account-scoped records:

| Record | Purpose |
| --- | --- |
| `coach_ai_chat_conversations` | conversation identity, title, ownership, archive state |
| `coach_ai_chat_messages` | ordered trader/assistant messages and generation state |
| `coach_ai_chat_answer_snapshots` | immutable, compact factual package and SHA-256 digest for an answer |
| `coach_ai_chat_generation_receipts` | provider/model, token counts, verified price snapshot, estimated cost |
| `coach_ai_manual_entry_drafts` | explicit user-owned chat drafts, confirmation state, and expiry/archive policy |
| `coach_ai_daily_companion_interactions` | optional saved daily reflection drafts and their approved/rejected disposition |
| `coach_ai_archive_events` | append-only archive/restore actions |

This does not duplicate executions, notes, tags, rules, Current Focuses, or
reviews. Those stay in their owning Journal/Coach tables and are referenced
through bounded snapshots.

### Immutable evidence and user control

- Every submitted question is persisted before provider work begins; every
  completed assistant answer retains its immutable input snapshot and receipt.
- Every manual-entry draft records that it was a draft. Only the canonical
  manual-entry command creates ledger facts.
- Revising Journal facts later does not rewrite an earlier answer or review.
  A new question or deliberately regenerated eligible review gets a new dated
  package.
- Archiving hides a conversation from normal navigation but does not erase the
  record required to explain a completed paid generation. A separate
  owner-approved privacy/deletion policy must define permanent deletion.

## Prompt, model, and output design

- A short system instruction defines the allowed question family, factual
  grounding, privacy boundary, non-advice boundary, and user-control rules.
- The model receives the minimum typed factual package for the request, plus
  only the relevant recent conversation context and a server-built summary of
  older context. It never receives unlimited history.
- Responses use a structured server contract: direct answer, supporting
  observations, availability limitation when needed, and an optional next
  question. The UI renders these naturally and does not expose internal labels.
- A server-side validator rejects malformed, unsupported, unsafe, or
  ungrounded output before it becomes a completed assistant message.
- Manual-entry extraction has a distinct structured draft schema. It is not a
  natural-language answer treated as a command.
- Any future chart/candle analysis must be separately approved and must state
  actual coverage. AI cannot claim a technical indicator or candle pattern
  without retained, verified market-data evidence.

## Settings, entitlements, administration, and cost controls

### Trader account settings

- AI Reviews enabled/disabled.
- Weekly delivery day (Friday, Saturday, or Sunday) and Eastern delivery time.
- Clear history/status for saved reviews and any current availability state.
- Future entitlement/allowance display in plain language. Pricing, subscription,
  and credit-pack design are product decisions before public launch; AI Chat
  and automatic reviews should be gated by entitlement rather than made
  unbounded by default.

### Journal Administration

The owner-only AI area should include:

- server credential availability only—never the key itself;
- current model selection and verified input/output price values;
- separate enablement for Chat, Daily Companion, Weekly Reviews, and Monthly
  Reviews so unfinished surfaces cannot become public accidentally;
- per-account/day and platform-wide request, token, and estimated-spend caps;
- model/feature/account aggregate costs, requests, token totals, failures,
  blocked requests, scheduled-review status, and delivery health;
- account-level enablement/entitlement support when the commercial plan is
  defined;
- no bulk display of private conversation text, notes, broker data, or prompts.
  Support access to private content requires a future explicit privacy policy,
  not a convenience admin screen.

### Cost and abuse protections

- One active generation per conversation; server idempotency keys for retries.
- Question and answer length limits before provider work begins.
- Per-account request rate limits and feature-specific daily/period caps.
- Before every provider request, enforce the tighter of allowance, request cap,
  and spend cap. Do not make a partial call that will be discarded.
- Price is snapshotted with the actual completed generation. Admin totals show
  estimates truthfully and never invent a cost when provider usage is absent.
- Operational logs contain only privacy-safe status/count information, never
  prompts, answers, credentials, raw statement contents, or raw identities.

## Security and failure behavior

- Every route/service verifies the selected Platform user/workspace/account
  scope. Conversation IDs and draft IDs are opaque and never sufficient to
  bypass scope.
- Provider calls run server-side only. API keys are environment-only and never
  enter a client bundle, SQLite, screenshots, browser storage, or logs.
- Provider failure leaves a clear saved failed/pending state and an explicit
  retry choice; it does not show raw provider errors or double-charge.
- A browser refresh never starts a second generation. A resumed request must
  match its saved question, account, date scope, and factual digest.
- AI availability errors use plain trader language. Internal codes and database
  terminology remain server-side.

## Future scope, deliberately sequenced

This is the complete target plan, not a promise to enable every capability at
once. The following sequence controls safe delivery:

1. **Foundation:** schema/contracts, scopes, provider adapter, receipts, cost
   controls, and immutable snapshots.
2. **AI Reviews completion:** saved review list/detail, scheduler, weekly and
   monthly issuance, account settings, and owner controls.
3. **AI Chat core:** private conversations, factual question families, saved
   answers, review follow-up, and responsive UI.
4. **Daily companion:** tracker entry point, factual reflection support,
   editable AI drafts for notes/focuses, and review-completion guardrails.
5. **Conversational manual entry:** structured drafts, explicit confirmation,
   existing Journal preview/commit integration, duplicate/reconciliation and
   tracker routing.
6. **Entitlements and production operations:** public login boundary, feature
   eligibility, scheduled delivery execution, monitoring, costs, and support
   workflow.
7. **Future analysis expansion:** only data-backed chart/candle or enhanced
   coaching capabilities after their market-data, product, cost, and privacy
   contracts are separately approved.

## Verification and acceptance

Before each implementation slice, add focused deterministic checks for its own
contract. The final product must prove at least:

- strict user/workspace/account isolation for conversations, reviews, drafts,
  facts, receipts, and settings;
- one saved factual snapshot and one receipt per completed provider generation;
- no V3 dependency and no raw statement or credential inclusion;
- safe provider retry/idempotency and accurate cost-cap behavior;
- an AI manual-entry draft cannot create or change executions until the trader
  explicitly confirms and the canonical Journal command succeeds;
- duplicate and overlap handling remains exactly the same regardless of whether
  the trader typed rows or used chat to prepare them;
- AI cannot save notes, tags, focuses, classifications, rule outcomes, or a
  completed day review without the trader’s normal confirmation action;
- weekly/monthly schedules are idempotent and honor eligibility, account
  timezone, selected Eastern delivery time, and partial-first-month rules;
- generated results are honest when coverage is missing and never hide valid
  unrelated Journal activity;
- the light Material UI is responsive and visually accepted before broadening a
  visible AI surface;
- focused service and browser checks run during each completed slice; broader
  test/build/CI verification happens at the approved launch checkpoint.

## Completion definition

The AI Companion is complete only when the approved components above work from
the canonical replacement Journal, are safely account-scoped and cost-managed,
and are understandable to a trader without system language. A chat response,
manual-entry draft, daily companion prompt, or scheduled review is never
considered complete merely because it renders: it must preserve factual
boundaries, trader control, privacy, and truthful availability.
