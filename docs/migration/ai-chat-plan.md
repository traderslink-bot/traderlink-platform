# AI Chat Plan

## Status

Planning only. No AI Chat route, database table, provider request, user
interface or API cost will be created until this plan is reviewed and approved.
AI Chat is a separate Coach feature that follows the AI Reviews foundation; it
does not revive or depend on the retired V3 Coach runtime.

## Purpose

Give a trader a private place to ask clear questions about their own trading
record. The chat helps them examine results, notes, rules, tags, Current
Focuses and saved AI Reviews. It should be direct and useful without pretending
to know why a trade happened or what will happen next.

Examples of useful questions:

- “What did I do differently on my best trading days this month?”
- “Which rule did I break most often this week?”
- “Show me the trades where I added to a losing position.”
- “Did my notes support the focus I set at the start of the week?”
- “What changed between this month and last month?”

AI Chat is not a signal service, an execution tool, a prediction engine, a
Data Decisions editor or an automatic trade classifier. It cannot add, change,
delete or conceal Journal facts, notes, rules, tags, decisions or reviews.

## Product decisions

### One private chat per selected Journal account

- The chat always belongs to the currently selected Journal account. A user
  can switch accounts in the normal dashboard switcher, but conversations and
  messages never cross that boundary.
- A conversation is private to the user who created it. Account sharing and
  team coaching are later product decisions, not part of this first release.
- The chat does not read another user’s account, the admin dashboard, broker
  statement files, raw statement rows, credentials or Discord information.
- Each account starts with an empty state. The product never creates example
  conversations or fake answers.

### What the chat may use

The answer service can use only bounded, replacement-owned Journal views:

1. Confirmed completed trades and their factual P/L, dates/times, ticker,
   direction, trade session, execution count, holding time and selected
   account currency.
2. Trader-authored trade notes, daily notes, Current Focuses, selected tags
   and automatically evaluated rule outcomes.
3. Saved weekly and monthly AI Reviews as prior coaching context, never as
   proof that a conclusion is true.
4. Open-position classification only when the trader asks about open positions.
   Open positions stay out of realized P/L conclusions.
5. A short plain-language availability note when unresolved Data Decisions,
   missing coverage, unavailable values or unreviewed days limit the answer.

The chat does not receive raw broker statements, account numbers, source-row
values, internal issue codes, implementation logs, provider credentials or
hidden admin information.

### Facts before interpretation

- The server first builds a compact factual answer package for the active
  account and the question’s stated time period. The model never queries SQLite
  directly and never receives unrestricted application access.
- Factual values shown in an answer must come from that saved package. If the
  record is incomplete, the answer says what is unavailable rather than filling
  the gap with a guess.
- The assistant may connect a pattern to a note, tag, Current Focus or rule
  outcome only when the supplied record supports it. Tags remain trader context,
  not a diagnosis or verified setup.
- It must not call a profitable trade “good process” or a losing trade “bad
  process” without evidence from the trader’s own notes or rules.

### Direct answers, not a generic financial chatbot

The chat can explain the trader’s own results, point out a supported pattern,
compare selected periods and ask a focused follow-up question. It must not:

- give a trade recommendation, price target, entry/exit instruction or
  position-size instruction;
- predict a ticker, market direction, news result or future P/L;
- diagnose a trader’s mental state or invent motivation;
- tell the trader to override their broker, statement or Data Decisions;
- represent its answer as tax, legal, financial or medical advice.

Trader-facing wording should be conversational and specific. It should not
mention databases, prompts, model tokens, internal codes or source systems.

## Chat experience

### Route and navigation

- Add a dedicated dashboard route: `/ai-chat`.
- Add one left-navigation item named **AI Chat** in the AI/Analytics area,
  beside AI Reviews. It is not nested under the retired Reflection Loop.
- The page title and introduction should sell the feature in ordinary language,
  for example: “Ask questions about your trades, habits, notes and progress.
  AI Chat uses the record you have built in TraderLink to help you see patterns
  and stay focused.” Final copy requires owner visual review.

### Layout

Desktop layout:

- A compact conversation list on the left with **New chat** and searchable
  saved conversation titles.
- The active conversation in the main panel.
- A small account/date context control above the composer. The active account
  is always visible; date scope defaults to the most recent 30 calendar days.
- Suggested starting questions only when there are no messages. Suggestions are
  examples, not invented results and not automatic analyses.

Mobile layout:

- The conversation list opens as a drawer.
- The active conversation and composer remain the primary screen.
- Data cards and answer sections stack; no horizontal table is required for a
  first release.

### Conversation behavior

- **New chat** creates a private, empty conversation. A title is created from
  the trader’s first saved question, then remains editable by the trader.
- The trader can type a free-form question and select an optional date range.
  The account selection always follows the dashboard account switcher.
- One question is processed at a time per conversation. The send control is
  unavailable while an answer is being generated.
- A saved response appears in the conversation with any compact factual cards
  needed to make it understandable, such as a selected-period P/L summary or
  a short list of the trades explicitly discussed.
- Clicking a factual trade card opens that trade’s existing Journal detail
  surface; it does not expose raw statement rows.
- The trader can rename, archive and later reopen a conversation. Archive is a
  normal visibility action, not destruction of paid-generation history.
- The trader can start a new conversation from a saved Weekly or Monthly Review
  using “Ask a follow-up.” The review is included as context only for that new
  conversation.

### Initial answer modes

The first release supports these bounded question types, even when the trader
uses ordinary free-form language:

| Answer mode | What it can answer | Primary output |
| --- | --- | --- |
| Period review | “How did I trade last week?” | direct narrative plus summary figures |
| Rule and focus follow-through | “How did I do with my focus?” | supported observations and named rules |
| Trade pattern | “How were my re-entries?” | matching completed trades and pattern summary |
| Ticker or tag review | “How did I trade ABC?” | filtered completed-trade summary |
| Comparison | “This month versus last month” | side-by-side factual comparison |
| Trade explanation | “Why is this marked a day trade?” | factual construction explanation only |

Unsupported questions receive an honest, short response explaining what the
chat can presently help with. The feature does not silently change a question
into a different analysis.

## Data and persistence design

### New records

Add one new Coach migration after the currently applied cost-tracking
migration. The exact migration number is assigned only when implementation
begins.

| Record | Purpose | Key rules |
| --- | --- | --- |
| `coach_ai_chat_conversations` | Account-scoped private conversation identity, title and archive state | UUID, user/workspace/account ownership, created/updated timestamps, no cross-account reads |
| `coach_ai_chat_messages` | Ordered trader and assistant messages | UUID, immutable message content, role, status, created timestamp; assistant text is saved before it is displayed as complete |
| `coach_ai_chat_answer_snapshots` | Exact bounded factual package used for each assistant answer | immutable JSON and SHA-256 digest; no raw broker statement data |
| `coach_ai_chat_generation_receipts` | Provider/model, token use and price snapshot for each completed assistant answer | immutable, one receipt per completed assistant message |
| `coach_ai_chat_archive_events` | Trader archive/restore actions | append-only history; no hidden deletion of paid generation evidence |

The existing review-cost receipt table accepts only weekly/monthly review
records, so chat receipts remain in their own immutable table. Journal
Administration aggregates both receipt families into one AI-cost view.

### Saved conversation history

- Every trader question is saved before a provider request begins.
- Every assistant answer has an addressable message ID and its own factual
  snapshot. Later Journal edits do not rewrite an earlier answer.
- A browser refresh during generation leaves a visible “Preparing answer”
  state. A background completion can resume only when the pending request’s
  immutable question, selected account, time range and factual digest still
  match; otherwise it is marked unavailable and is never charged twice.
- Conversation context sent to the model is bounded: the most recent relevant
  messages plus a server-built compact summary of earlier messages. It must not
  send an account’s unlimited chat history on each question.
- Archiving hides the conversation from the normal list but preserves the
  auditable receipt and message history. A future privacy/deletion policy will
  define whether and how a trader can request permanent content removal.

## Provider, costs and limits

### Provider settings

- Continue using the existing server-only provider credential and owner-only
  AI Review settings area. The credential is never stored in SQLite or shown in
  the dashboard.
- AI Chat uses the currently selected approved model. Changing the model affects
  only future answers; each saved answer records its actual model.
- The administrator records verified input/output pricing before enabling
  paid chat. If pricing is blank, Chat remains unavailable for new generation
  rather than showing a made-up cost.

### Cost controls

- Record input tokens, output tokens, selected model, input/output price
  snapshot and estimated cost for every completed answer.
- Add owner settings for: chat enabled/disabled, maximum answers per account per
  day, maximum question length, maximum answer length and optional per-account
  daily cost cap.
- Apply the smaller of the answer-count and cost cap before a provider request.
  A reached cap produces a plain trader-facing availability message; it never
  sends a partial request or charges for a response that is discarded.
- Journal Administration shows total and period cost, answer count, tokens,
  model breakdown, limit blocks and failed requests. It never shows message
  contents or a credential in the cost overview.

### Rate and abuse protection

- Require the current Platform account scope for every read and write.
- Limit active generations to one per conversation and use server-side
  idempotency keys for retry-safe submissions.
- Enforce a short per-account request limit and reject oversized questions
  before creating a provider request.
- Log only safe operational outcomes and counts. Do not write prompts, answers,
  credentials or raw trader content to application logs.

## Server design

### Read services

Create an account-scoped `CoachAiChatFactService` that accepts a validated
question mode and date range. It composes existing Journal Analytics,
annotation, trading-day review, open-position and saved-review services into a
small typed answer package. It has no write access to Journal facts.

The service has a fixed set of read operations, not arbitrary SQL or free-form
database tool calls. It always applies account ownership, factual eligibility,
timezone and Data Decisions coverage rules before building the package.

### Conversation service

Create a `CoachAiChatConversationService` responsible for:

1. creating/renaming/archiving a conversation;
2. validating a trader question and selected date range;
3. writing the trader message and pending assistant message transactionally;
4. building and saving the immutable answer snapshot;
5. applying budget/rate/idempotency checks;
6. calling the provider from a server-only adapter;
7. saving the completed answer and immutable cost receipt;
8. returning a compact result for the UI without re-calling the provider.

Provider failure produces a neutral failed-answer state with a retry action. It
does not reveal provider error text, erase the trader’s question or create a
second billable answer without explicit retry.

### Prompt and response contract

- Use a short system instruction focused on the trader’s own record and the
  permitted answer modes.
- Include the selected account/date facts and the minimal relevant prior
  conversation context. Do not include credentials, raw statement rows or
  unrelated accounts.
- Require structured response sections: direct answer, supporting observations,
  record limitations and optional next question. The rendered UI can present
  them naturally without exposing its internal structure.
- Do not enable autonomous tools, browser access, market-data retrieval,
  trading integration or arbitrary URL access in the first release.
- Run a server-side output validator before marking the assistant message
  complete. Invalid or unsafe output is not displayed and does not overwrite
  the pending record.

## Delivery sequence

### Phase A — foundation

1. Review and approve this plan.
2. Finalize model/pricing/cap values in Journal Administration.
3. Add migration, exact contracts and account-isolated repositories.
4. Add conversation/message/snapshot/receipt services with no dashboard route.
5. Verify account isolation, immutable histories, retry/idempotency, cost math
   and absence of Journal writes.

### Phase B — first chat experience

1. Add `/ai-chat`, navigation, conversation list and responsive chat view.
2. Add New Chat, archive/restore, date scope and free-form question composer.
3. Connect only the six initial answer modes and render saved answers.
4. Add AI Review follow-up entry points.
5. Obtain owner visual approval before expanding modes or changing the layout.

### Phase C — production controls

1. Add admin enabled state, budgets, model/pricing controls and combined cost
   reporting.
2. Add scheduled cleanup/archive retention only after a separate privacy
   decision; no automatic deletion in the first release.
3. Add Discord-hosted authentication and entitlement checks at the existing
   hosted-launch boundary.
4. Run final one-worker tests, targeted browser checks, then broader launch
   verification at the established replacement checkpoint.

## Acceptance criteria

- No V3 engine, V3 database, V3 route or V3 analytics dependency is introduced.
- A chat answer never crosses selected-user/workspace/account boundaries.
- Reopening an answer never triggers another model call.
- Each completed answer remains readable with its exact saved factual snapshot.
- Each provider call has one immutable token/model/cost receipt, or is clearly
  unavailable before a request is sent.
- The chat never changes Journal facts and cannot bypass Data Decisions.
- Missing/contained records limit the answer honestly without hiding unrelated
  valid activity.
- Empty accounts receive an honest empty state, not a fabricated conversation.
- The first UI is responsive, light Material UI, and visually approved before
  later chat features expand.
