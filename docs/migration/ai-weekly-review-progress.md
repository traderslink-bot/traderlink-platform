# AI Weekly Review Progress

## Status

Active. The product contract is in [AI Weekly Review Plan](ai-weekly-review-plan.md).

## Completed: factual input package

- Added `traderlink_coach_weekly_ai_input_v1` as the server-side weekly input
  contract.
- Added a read-only input service and runtime over the replacement Coach,
  Journal Analytics, annotations and daily-review services.
- Added an account-scoped daily-focus revision reader so every saved Current
  Focuses revision within the review week is available to the future prompt.
- Corrected the weekly package to include holding duration when it can be
  derived from the Journal's exact open/close timestamps. Execution count,
  realized gross P/L and trading session remain explicitly unavailable because
  the current Coach read contract does not expose those Journal facts.
- Current Focuses now includes the value in effect at the start of the week and
  only dated revisions actually recorded during the week. Carried-forward text
  is marked with its effective week-start date and is not repeated as invented
  daily edits.
- Added trader-selected trade tags as contextual input. Tags are never treated
  as proof or a diagnosis.
- Added the Vercel AI SDK and direct OpenAI provider dependencies. An ignored
  local `OPENAI_API_KEY` is authorized only for controlled development testing;
  no key is committed or exposed to the browser.

## Verification

- Focused ESLint passed for the package and changed annotation files.
- `git diff --check` passed.
- The full TypeScript check was started once but exceeded the two-minute
  resource limit while the local dashboard was in use. It was stopped rather
  than retried. It remains a later checkpoint check, not a passed result.

## Completed: storage foundation and schedule

- Migration `0025_coach_weekly_reviews` creates immutable review request and
  issued-review records plus one Friday delivery-time setting per Journal
  account. It was applied to the local development database only after a
  successful online backup and `quick_check` verification.
- AI Reviews replaces the retired Reflection Loop navigation entry. The old
  route now redirects to AI Reviews so saved links remain useful.
- The AI Reviews page points traders to Account for their selected weekend
  delivery day and Eastern time. It contains no invented review while no issued
  review exists.

## Completed: private provider and cost controls

- Migration `0027_coach_ai_generation_cost_tracking` adds one protected
  provider/model configuration and immutable per-review cost receipts.
- Journal Administration now has an AI Reviews settings area. It reports only
  whether a server credential is available, never the credential itself, and
  lets the owner record the selected model's verified input/output token prices.
- Prices are captured with each issued review so later price changes never
  rewrite history. When no verified price is saved, the receipt retains token
  counts and leaves cost unavailable.
- Migration `0028_coach_ai_review_generation_attempts` adds retry-safe,
  immutable generation attempts and one receipt per completed provider call.
  An unchanged issued request is reused rather than calling the provider again.

## Completed: saved weekly review reading

- AI Reviews now reads only the selected account's immutable issued weekly
  reviews through the account-scoped repository. The saved list is newest
  first, and its empty state appears only when that account has no issued
  weekly review.
- Each saved weekly review has an addressable detail page that presents the
  trader-facing weekly summary, improvement, friction, focus follow-through,
  next-focus and applicable incomplete-record sections. It never reads or
  displays provider, model, token, cost, request or other operational data.

## Completed: deterministic weekly due-time calculator

- Added a pure server calculator that returns an explicit due/not-due result,
  the account-local Monday-Sunday period label, and the scheduled UTC instant.
- Friday is the effective market-week close; Saturday and Sunday are delayed
  delivery choices for that same Monday-Sunday period. Before the selected
  instant, the current period remains not due rather than being treated as
  complete.
- Account week boundaries and Eastern delivery conversion use the runtime's
  IANA timezone API, including daylight-saving transitions. The calculator
  does not call a provider or mutate a database.
- Focused test coverage includes all three delivery days, before/at/after
  delivery, current-week eligibility, and Eastern daylight-saving conversion.

## Completed: preceding weekly review context

- The next weekly package reads the immediately preceding issued review only
  through the same selected-account boundary used by the saved-review pages.
- The package includes only the prior review's trader-facing sections and
  period dates. Provider, model, token, cost and internal identifiers do not
  enter the prompt.

## Completed: monthly factual input/output contracts

- Added replacement-owned monthly input and output contracts with the six
  trader-facing monthly output sections: Monthly review, Progress across the
  month, Recurring friction, Focus follow-through, Next month focuses and
  Incomplete record.
- Added the account-scoped monthly factual input builder. It retains only the
  supplied complete calendar month or partial first-month period, selected
  account Journal facts, notes, tags, rule outcomes, reviewed-day state and
  dated Current Focuses revisions, including the value effective at the period
  start. Execution count, realized gross P/L and trading session stay
  unavailable when the replacement read contract does not expose them.
- The package includes only immutable issued weekly reviews whose complete
  Monday-Sunday periods fall within the selected monthly period. It also reads
  the immediately preceding issued monthly review through the same
  selected-account boundary and includes only its trader-facing sections.
- Added a pure first-partial-month eligibility helper: it requires the exact
  AI Reviews enabled date as the period start, at least seven calendar days,
  and at least three reviewed trading days. It does not schedule, issue or
  skip a no-trade month.

## Completed: monthly persistence and issuance

- Added account-scoped immutable monthly request snapshots keyed by complete
  or partial period dates and the exact canonical input digest. Repeated
  unchanged packages reuse the issued review rather than make another provider
  call.
- Added account-scoped monthly issued-review reads, including the latest issued
  monthly review before a supplied period start for later prior-context wiring.
- Added retry-safe monthly generation attempts using the existing immutable
  attempt and receipt records with `review_kind='monthly'`. Complete provider
  usage records the saved model-price receipt; partial or missing usage remains
  unavailable and is never estimated.
- Added the structured direct OpenAI monthly adapter. Its output is restricted
  to the monthly contract's six trader-facing sections and at most three
  next-month focuses. The adapter receives only the supplied factual package.

## Completed: saved monthly review UI

- AI Reviews now reads the selected account's saved monthly reviews through the
  account-scoped repository. The monthly panel shows a truthful empty state
  only when that account has no saved monthly review.
- Saved monthly reviews have addressable detail pages with Monthly review,
  Progress across the month, Recurring friction, Focus follow-through, Next
  month's focuses and an Incomplete record section only when present.
- A first partial month is labelled with plain dates as the trader's first
  month. Provider, model, token, cost and internal identifiers remain absent
  from both list and detail views. The existing weekly list and detail UI is
  preserved.

## Completed: weekly issuance runner and protected trigger

- The runner enumerates only active scheduled Journal accounts, calculates the
  selected account's due week, builds the exact immutable input package and
  issues sequentially so one scheduler invocation cannot fan out uncontrolled
  provider calls.
- A due week with no completed trade is skipped before a request or provider
  call is created. Repeated runs reuse the existing issued review, and failed
  provider attempts remain retryable with separate cost receipts.
- `GET /api/cron/ai-reviews` is a server-only trigger protected by
  `CRON_SECRET`. It returns aggregate counts only and never returns account,
  review, provider or credential details.
- Hosted scheduler registration remains a deployment-boundary task because the
  replacement dashboard's final Vercel-versus-single-node runtime has not been
  activated. The protected trigger and runner are ready for that scheduler.

## Completed: monthly due time and issuance runner

- Monthly reviews use closed calendar months. They become due on the first day
  after the month at the account's selected Eastern delivery time. The first
  period begins on the account-local AI Reviews enablement date; later periods
  are complete calendar months.
- The monthly runner processes scheduled accounts sequentially, carries the
  preceding monthly review into the input, skips no-trade months, and skips a
  first partial month unless it contains at least seven calendar days and
  three reviewed trading days.
- Weekly and monthly runners now check the period's already-issued review
  before rebuilding input. Later Journal edits therefore do not silently issue
  a second paid review for an already completed period.
- The protected scheduler route invokes both runners and returns aggregate
  counts only. Hosted scheduler registration remains deferred until the
  accepted deployment runtime is activated.

## Completed: local migration 0028 checkpoint

- Before applying migration `0028`, an SQLite online backup was created at
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\ai-reviews-20260806T000658Z\development-before-ai-review-migration.sqlite`.
  It is 29,507,584 bytes, has SHA-256
  `2A3A5D119B426FFFE36153C22E138C2A7CDB2C9291850630F6787F18696466E2`,
  contains 27 migration rows and passed `quick_check`.
- Migration `0028_coach_ai_review_generation_attempts` was then applied to the
  local development database. The current verifier passed schema digest,
  foreign-key, quick, and full integrity checks with 28 exact migration rows.

## Next slice

Start the approved AI Chat foundation as a separate migration and server
contract. Register the protected review trigger with the accepted hosted
scheduler only at the deployment boundary.

## Planned input addition: selected trade tags

The weekly package will include the trader-selected tags already shown beside
each completed trade. They give useful setup and execution context, but remain
context rather than proof. Conflicting tags on one trade must be presented as a
conflict, never silently resolved by the review.

## In progress: local OpenAI review test

- The first controlled direct OpenAI response completed against the first
  fixture week without changing Journal data.
- It exposed a scope-label ambiguity: account-wide coverage counts appeared
  beside weekly trade counts. The input contract now names week and account
  coverage separately before the final local review run.
