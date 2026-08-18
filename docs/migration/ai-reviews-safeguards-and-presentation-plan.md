# AI Reviews Subscriber Safeguards and Review Presentation Plan

## Status

Owner-approved direction recorded on 2026-08-09. The safeguard and presentation
implementation is complete and locally verified. The owner approved the UI and
then authorized the beta QA correction described below.
The linked
[progress record](ai-reviews-safeguards-and-presentation-progress.md) is the
resume state for this slice.

## Product decisions

1. The normal abuse safeguard is a **per-subscriber paid-cycle limit**, not a
   shared platform cutoff. The default is USD 2.00 for all AI Reviews generated
   for one TraderLink user during that user's current Whop renewal period.
   Multiple Trade Tracker accounts owned by the same subscriber share that
   subscriber allowance.
   This allowance covers weekly, two-week and monthly AI Reviews only. AI Chat
   does not consume it and will receive its own model-specific usage policy
   after AI Chat cost testing is complete.
2. A subscriber below their own limit remains eligible even when another
   subscriber has unusually high usage. Reaching the limit preserves the frozen
   review request and issued reviews; only that subscriber's new provider calls
   pause until their next paid cycle or an authorized Admin correction.
3. Use Whop's stored renewal-period start and end as the exact usage window.
   When active paid access is valid but Whop has not supplied both boundaries,
   use a trailing 30-day fail-safe window rather than silently granting an
   unlimited period or resetting on a calendar month.
4. The existing global trailing-30-day amount becomes an Admin warning
   threshold. Crossing it must be visible to Admin but must not block healthy
   subscribers.
5. A separate, explicitly labelled **Emergency stop for all AI Reviews** is the
   only global control that may intentionally prevent all new provider calls.
   The existing master availability switch remains the deliberate launch or
   maintenance control and is not used as an automatic spend tripwire.
6. Existing daily request, token and estimated-spend controls remain high-level
   burst and loop protection. They are Admin safety controls, not a customer
   allowance and not a substitute for the subscriber-cycle limit.
7. Raise the Trade Tracker per-trade note limit from 500 to 700 characters so it
   matches the four daily note fields. The measured Luna cost increase is
   negligible relative to the USD 2.00 subscriber safeguard. The Tracker owner
   must implement the counter and validation consistently; this slice will not
   edit active Tracker UI files.

## Review presentation contract

The owner-directed narrative-quality follow-on is tracked in
[AI Review Narrative Quality Progress](ai-review-narrative-quality-progress.md).

1. Weekly, two-week and monthly saved-review routes remain owner/account scoped
   Server Components. No benchmark output is written to a user's database.
2. Use one shared review-document presentation for real saved reviews and the
   local benchmark preview so the owner reviews the same hierarchy customers
   receive.
3. Present:
   - review type and exact covered dates;
   - one prominent review summary;
   - clearly separated `What improved` and `What held you back` sections;
   - focus follow-through;
   - numbered next-period focus actions; and
   - a subdued coverage note only when evidence is incomplete.
4. Do not expose prompt text, token counts, provider cost, internal evidence
   references, Data Decisions language or provider controls on customer review
   pages.
5. The benchmark preview reads the accepted synthetic local artifact and is
   available only to the local development owner or an authenticated production
   guild owner. Ordinary subscribers receive not-found. It must reuse the real
   customer review component and never create review rows or provider calls.
6. Use `Trade Tracker` in customer-facing copy. Keep the dedicated detail route
   for long reviews; do not force the content into a drawer.

## Implementation sequence

### A. Safeguard data contract

- Add one migration after coordinating the next free migration number.
- Extend the singleton AI Review budget policy with:
  - default per-subscriber AI Review paid-cycle estimated-spend cap;
  - global AI Review trailing-30-day warning threshold; and
  - optional global AI Review emergency trailing-30-day hard-stop threshold.
- Preserve immutable reservation and receipt evidence. Do not store payment
  card data, provider credentials or review text in budget policy rows.
- Expose Whop renewal-period start and end through the existing paid-access
  record without exposing raw Whop identifiers.

### B. Enforcement and Admin UX

- Before each provider call, count actual receipt cost plus conservative active
  reservations for the current subscriber and billing window.
- Block only the over-limit subscriber with a distinct retryable failure code.
- Calculate global trailing-30-day usage for the warning display. Enforce it
  only when the separate emergency hard stop is configured and reached.
- Replace the current ambiguous global-budget card with three plainly labelled
  controls and concise explanations. Default the subscriber limit to USD 2.00.
- Keep controls server-authorized and revalidate only the affected Admin and AI
  Review paths.

### C. Saved-review presentation and benchmark preview

- Extract the duplicated weekly/monthly detail markup into one shared,
  server-rendered review-document component.
- Update both real saved-review routes to use it without changing repository
  access or owner/account isolation.
- Add an owner-only benchmark preview that offers the accepted heavy weekly
  reviews and heavy monthly review through that same component. The artifact
  remains local, so a hosted owner route without that artifact fails closed.
- Obtain owner visual approval at the completed UI checkpoint before marking
  the presentation accepted.

### D. Focused verification

- Disposable-copy verify the migration and prove existing receipt/reservation
  counts are unchanged.
- Verify one subscriber reaching USD 2.00 cannot block a different subscriber.
- Verify the warning threshold never blocks and the emergency threshold does.
- Verify active reservations cannot evade the cap and finalized receipts use
  actual immutable cost.
- Run focused TypeScript/ESLint and repository verification scripts only. Do
  not run Vitest, broad regression, provider calls, deployment or activation.
- Verify the local preview and both saved-review routes visually only after the
  shared runtime is available and coordinated.

## Acceptance criteria

- A subscriber under their own paid-cycle limit is never blocked by another
  subscriber's spend.
- The default subscriber limit is USD 2.00 and follows the Whop renewal period.
- AI Chat usage, model selection and later Chat limits remain completely
  separate from the AI Review allowance.
- Global warning and emergency behavior are visibly distinct in Admin.
- Frozen work is retryable and all issued reviews remain readable.
- Real weekly, two-week and monthly outputs use one readable customer
  presentation.
- The owner can inspect accepted benchmark outputs in that exact presentation
  without persisting synthetic reviews.
- The 700-character trade-note decision is recorded for the coordinated
  Tracker implementation.

## 2026-08-09 beta QA pricing correction

The owner accepted USD 2.00 per subscriber per Whop paid cycle after beta QA
found that the benchmark report had applied prices one fifth of the current
official GPT-5.6 Luna rates. USD 2.00 covers the corrected tested heavy month
with bounded retry room without recreating the earlier oversized safety margin.

The provider cost contract must now distinguish all four GPT-5.6 token classes:

- ordinary uncached input;
- cache-read input;
- cache-write input; and
- output.

`usage.inputTokenDetails.cacheWriteTokens` is required evidence. A complete
receipt must preserve it and the immutable cache-write price used for that
attempt. Reservation maximums must price all potentially cache-written input at
the configured cache-write rate, because a pre-call reservation cannot know the
eventual cache-read/write split. Subscriber, global warning, emergency and
Admin aggregation must use the corrected receipt or conservative reservation
cost without mixing AI Chat usage.

Implementation uses migration `0051_coach_ai_review_cache_write_accounting`.
Migrations 0050 and 0051 are applied and frozen. The correction also keeps the
timing, scheduler-health, cached-pricing and safeguard verification paths
repeatable against a fully migrated disposable copy. Hosted scheduler launch
acceptance remains a separate production operation.

The exact current checkpoint, QA-first continuation boundary and hosted go-live
requirements are maintained in
[AI Reviews Beta Handoff](ai-reviews-beta-handoff.md).
