# Day Session Page Plan

Status: visual design approved; direct Trade Tracker route slice implemented

Progress tracker: [day-session-page-progress.md](./day-session-page-progress.md)

Trade-tag subsystem:
[trade-tag-system-plan.md](./trade-tag-system-plan.md)

## Goal

Build the factual single-day journal as the `Trade Tracker` experience inside
the approved V3 dashboard shell. `/trade-tracker` opens the latest traded day
supplied by governed authority; `/trade-tracker/[sessionDate]` displays a
specific governed traded day. There is no Day Sessions index or list in front
of the experience.

## Controlling product requirements

- The shared `Trade Tracker` navigation link opens a date-free working-day
  canvas, not an already completed historical journal.
- Place a manual execution composer at the top of that working canvas. The
  trader can enter multiple buys and sells without leaving the page.
- After executions are accepted and reconstructed, populate the approved Day
  Session design in place.
- Collapse the execution composer after submission into a compact summary that
  can be reopened for additions or corrections.
- Keep dated routes for historical traded-day navigation inside Trade Tracker.
- Summarize the whole trading day in the header.
- Place a current-week tracker above the day header.
- Show only days in the week that contain trades. Do not render empty weekdays.
- Give each traded day compact P/L, trade-count, and ticker-count facts, plus
  combined P/L, trades, tickers, and traded-day count for the week.
- Allow direct selection of a traded day, previous/next traded-day navigation,
  and a clear return to the current traded day when reviewing history.
- Previous and next navigation skip calendar days without trades. The
  current-day action returns to the latest governed traded day.
- Show full-width ticker cards below the header.
- When governed reconstruction retains unmatched inventory, show a separate
  `Open position` ticker card with remaining quantity, direction, average
  entry, opened time, and Open status.
- Open positions do not contribute unrealized P/L to completed daily or weekly
  P/L and do not count as completed trades.
- Overnight or swing intent is never inferred from an open lifecycle. The
  trader may explicitly label the position plan as Day trade, Swing, or Other.
- Open positions may receive their own tags. Those assignments remain separate
  from completed round-trip tags if the position later closes.
- On desktop, place ticker facts on the left and completed round trips on the
  wider right. Stack those regions on mobile.
- Keep ticker facts limited to ticker P/L and trade count.
- Show each completed round trip's gain or loss percentage using governed net
  P/L divided by its governed entry capital.
- Show each ticker's combined gain or loss percentage for the day using total
  ticker net P/L divided by total governed entry capital across that ticker's
  completed round trips. Never add per-trade percentages together.
- Attach tags, technical notes, and rule status to individual trades or round
  trips, never to tickers. Screenshot saving is not part of Day Session.
- Keep mobile trade cards compact by default. Show key trade facts immediately
  and expand technical notes and rule detail only when requested.
- Follow ticker cards with Rules and daily Notes.
- Include `What worked`, `What needs work`, optional `Technical recap`,
  `Tomorrow's focus`, and free-form `Anything else`.
- Keep the page factual. Do not add news, catalysts, market regime, inferred
  market interpretation, or AI summaries.
- Keep the design fixture unmistakably separate from real account data.

## Architecture decisions

- The route implementation lives under `app/(dashboard)` and inherits
  `V3DashboardTemplate` through the route-group layout.
- `Trade Tracker` is the first shared-navigation link in the `Trades` group,
  immediately above `Round Trips`, and points directly to `/trade-tracker`.
- `/trade-tracker` resolves only from persisted governed closed-trade
  authority. It redirects to the latest supplied traded date, or fails closed
  honestly when no governed traded day is available.
- `/trade-tracker/[sessionDate]` owns the approved weekly tracker and
  previous/next/current traded-day navigation. Days without trades are absent.
- The obsolete `/trades/day-sessions` list and the prior singular dated route
  are compatibility redirects; neither exposes a separate index page.
- Page composition uses the public exports from `app/dashboard-template.tsx`.
- The mistaken V2 prototype is a reference for layout and domain vocabulary,
  not a source of shell, navigation, or governed-data authority.
- The explicitly non-production `preview=design` fixture remains separated
  from normal data. The normal route never selects a fixture or invents a date.
- Imported executions, reconstructed round trips, P/L, timestamps, direction,
  and ticker identity remain governed V3 facts. Day Session persistence must
  never copy or recalculate those values.
- The legacy saved-trade note API and legacy SQLite trade repository are not
  valid authorities for this V3 route.
- Existing V3 preset and manual custom rule definitions remain the rule
  authorities. Day Session stores evaluations of those definitions, not
  duplicate rule definitions.

## Persistence contract for approval

All records are owner-scoped by `userId`, `workspaceId`, and nullable
`tradingAccountId`. Every timestamp uses the canonical UTC nanosecond format.
Every mutation uses an expected revision so a stale browser cannot silently
overwrite newer writing.

### Daily note record

One current record per owner and trading day:

- `sessionDate`
- `whatWorked`
- `whatNeedsWork`
- nullable `technicalRecap`
- `tomorrowsFocus`
- `anythingElse`
- `createdAt`
- `updatedAt`
- `revision`

The record is linked to the trading day even when the day currently has no
verified executions. Its creation date is stored but is not required in the
page UI.

### Round-trip journal record

One current record per owner and governed `semanticRoundTripKey`:

- `sessionDate`
- `semanticRoundTripKey`
- `tags`
- `technicalNote`
- `createdAt`
- `updatedAt`
- `revision`

The route must confirm that the round-trip key belongs to the requested owner
and trading day before reading or writing the record. Tags and notes do not
change the governed round-trip facts.

### Rule review record

One current record per rule, applicability target, owner, and trading day:

- definition source: preset execution rule or manual custom rule
- stable rule ID and exact rule version reference
- applicability: day or trade
- nullable `semanticRoundTripKey` for day applicability; required for trade
  applicability
- status: followed, broken, or not reviewed
- `createdAt`
- `updatedAt`
- `revision`

The selected applicability must be allowed by the referenced rule definition.
Custom rules are not copied into Day Session; the review points back to the
versioned custom-rule authority.

Trade-applicable rules are reviewed inside the completed round-trip card.
Preset results occupy the rule-review position and will be populated by the
governed automatic rule evaluator. Saved custom trade rules are selected by
name and marked followed, broken, or not reviewed beside that result. Day
rules remain in the full-width Rules section above Daily Notes. The UI must
not imitate or infer automatic preset results before the evaluator supplies
them.

### Tomorrow's focus carry-forward

When opening a later trading day with no saved `Tomorrow's focus`, the read
model finds the closest earlier dated daily note for the same owner/account and
returns its focus as a suggested carry-forward value. It is not persisted onto
the new day until the trader saves that day's notes.

### Cross-day open-position reconciliation

Manual executions must join the governed FIFO ledger across trading dates.
They are partitioned by owner, brokerage account, stable instrument identity,
and currency before timestamp ordering and lot matching. The working-day
browser must not infer prior inventory from a same-day submission.

- A sell smaller than an existing long position partially closes the oldest
  governed long lots and leaves the exact remaining quantity open.
- A sell equal to the remaining long quantity completes the position.
- A sell larger than the remaining long quantity closes the long position and
  opens only the excess quantity as a new short position.
- Executions for other tickers remain separate ledger partitions even when
  submitted in the same Trade Tracker form.
- A sell with no verified prior inventory must remain unresolved rather than
  being silently classified as a new short.
- Open-position intent remains trader-labelled as Day trade, Swing, or Other;
  factual inventory matching never infers intent.

### API and failure behavior

- One private owner-guarded read endpoint returns governed day facts joined with
  Day Session writing.
- Separate private owner-guarded mutations save daily notes, round-trip journal
  writing, and rule reviews.
- Invalid dates, oversized text/tags, unknown rule versions, foreign round-trip
  keys, and stale revisions fail closed with stable error codes.
- Empty optional fields are stored as `null`; whitespace-only required content
  is rejected.
- Preview fixtures never call persistence endpoints.

## Checkpoints

1. **Visual design — complete on main**
   - Reconcile the prototype with the canonical shell.
   - Render the full day header, ticker cards, compact trade-level journal
     details, Rules, and Notes.
   - Present the fixture-backed page in the browser and stop for approval.
   - Add the current-week traded-day tracker and historical/current-day
     navigation requested during the next visual review.
   - Approval received on 2026-07-29 after the weekly tracker review.
   - Remove the visible design-preview banner before integration while keeping
     fixture access gated to non-production `preview=design`.
   - Integrated into canonical `main` on 2026-07-29.
   - Added the `Trade Tracker` shared-navigation entry as the first item in the
     `Trades` group.
2. **Direct route and governed facts — complete in feature branch**
   - Made `/trade-tracker` the direct entry to the latest governed traded day.
   - Kept dated navigation within `/trade-tracker/[sessionDate]`, skipping
     dates without trades and supporting return to the latest traded day.
   - Projected verified closed round trips and exact-decimal totals into the
     approved view without changing its visual hierarchy.
   - Retired the old Day Sessions list behind compatibility redirects.
3. **Working-day execution canvas — approved and implemented in feature branch**
   - Preserve the approved Day Session design as the populated state.
   - Design the blank date-free entry state at `/trade-tracker`.
   - Add the expandable manual execution composer and in-place populated state.
   - UI approval received with the time-label and interactive-preview-tag
     refinements.
   - Keep successful manual entry on the date-free working-day canvas and
     populate it immediately from the accepted executions; do not redirect to
     the governed historical-day route before stable closed-trade keys exist.
   - Load active preset and custom rule definitions into the working day.
     Trade-scoped rules remain inside completed-trade cards, while day-session
     rules remain in the full-width Rules card.
4. **Trader-authored persistence — implemented in feature branch**
   - Trade tags are complete through the linked Trade Tag System Plan,
     including local webpage verification.
   - Added owner-scoped daily notes and rule reviews to the journal database.
   - Added private note and rule-review mutations with revision conflicts.
   - Joined active preset/custom rules and saved reviews into the day view.
   - Connected editable Daily Notes without changing the approved hierarchy.
   - Connected manual executions through the governed V3 import service.
   - Added governed entry/exit prices and exact gain/loss percentages for
     individual round trips and daily ticker aggregates.
   - Add the approved open-position visual card and preview reconstruction
     before connecting its trader-labelled plan to persistence.
5. **Original main-page acceptance — complete**
   - Run the focused checks required by the final implementation.
   - Run broader verification only at the explicit acceptance boundary.
   - Final UI approval received on 2026-07-30 for the Trade Tracker main-page
     objective.
   - Governed rules evaluation, cross-day inventory reconciliation, and stable
     trade-writing persistence remain documented follow-up integrations and do
     not reopen the approved original page design.

## Explicitly deferred

- Weekly AI review and pattern consumption
- Market-context or catalyst features
- Browser automation and broad test suites during the visual checkpoint
- Production deployment
