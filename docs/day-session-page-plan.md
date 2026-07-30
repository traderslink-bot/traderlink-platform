# Day Session Page Plan

Status: visual design integrated into main; persistence contract awaiting approval

Progress tracker: [day-session-page-progress.md](./day-session-page-progress.md)

## Goal

Build the factual single-day journal at `/trades/day-session/[sessionDate]`
inside the approved V3 dashboard shell. The first checkpoint is a fixture-only
visual review. Persistence, governed account-data projection, weekly AI review,
and final verification are later checkpoints.

## Controlling product requirements

- Summarize the whole trading day in the header.
- Place a current-week tracker above the day header.
- Show only days in the week that contain trades. Do not render empty weekdays.
- Give each traded day compact P/L, trade-count, and ticker-count facts, plus
  combined P/L, trades, tickers, and traded-day count for the week.
- Allow direct selection of a traded day, previous/next traded-day navigation,
  and a clear return to the current traded day when reviewing history.
- Show full-width ticker cards below the header.
- On desktop, place ticker facts on the left and completed round trips on the
  wider right. Stack those regions on mobile.
- Keep ticker facts limited to ticker P/L and trade count.
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
- Page composition uses the public exports from `app/dashboard-template.tsx`.
- The mistaken V2 prototype is a reference for layout and domain vocabulary,
  not a source of shell, navigation, or governed-data authority.
- The visual checkpoint uses an explicitly non-production `preview=design`
  fixture. The normal route fails closed until the canonical data projection is
  implemented in a later checkpoint.
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

### Tomorrow's focus carry-forward

When opening a later trading day with no saved `Tomorrow's focus`, the read
model finds the closest earlier dated daily note for the same owner/account and
returns its focus as a suggested carry-forward value. It is not persisted onto
the new day until the trader saves that day's notes.

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
2. **Data and persistence — awaiting contract approval**
   - Add exact contract validators for the three trader-authored record types.
   - Add isolated storage and schema migration for the approved V3 journal
     database.
   - Project governed V3 round-trip facts into the approved view model.
   - Join trader-authored writing only after owner/day/key validation.
   - Add private read and mutation endpoints with revision conflicts.
   - Connect the approved page without changing its visual hierarchy.
   - Present saved fixture writing and the mobile expansion behavior for the
     next UI review gate.
3. **Acceptance**
   - Run the focused checks required by the final implementation.
   - Run broader verification only at the explicit acceptance boundary.

## Explicitly deferred

- Weekly AI review and pattern consumption
- Market-context or catalyst features
- Browser automation and broad test suites during the visual checkpoint
- Production deployment
