# Day Session Page Plan

Status: visual design checkpoint in progress

Progress tracker: [day-session-page-progress.md](./day-session-page-progress.md)

## Goal

Build the factual single-day journal at `/trades/day-session/[sessionDate]`
inside the approved V3 dashboard shell. The first checkpoint is a fixture-only
visual review. Persistence, governed account-data projection, weekly AI review,
and final verification are later checkpoints.

## Controlling product requirements

- Summarize the whole trading day in the header.
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

## Checkpoints

1. **Visual design**
   - Reconcile the prototype with the canonical shell.
   - Render the full day header, ticker cards, compact trade-level journal
     details, Rules, and Notes.
   - Present the fixture-backed page in the browser and stop for approval.
2. **Data and persistence**
   - Project governed V3 round-trip facts into the approved view model.
   - Add dated daily-note persistence linked to the trading day.
   - Add preset/custom rule persistence and trade/day applicability.
   - Define how `Tomorrow's focus` carries forward.
3. **Acceptance**
   - Run the focused checks required by the final implementation.
   - Run broader verification only at the explicit acceptance boundary.

## Explicitly deferred

- Weekly AI review and pattern consumption
- Market-context or catalyst features
- Browser automation and broad test suites during the visual checkpoint
- Production deployment
