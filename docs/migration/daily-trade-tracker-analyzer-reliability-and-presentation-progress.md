# Daily Trade Tracker Analyzer Reliability And Presentation Progress

**Status:** Owner-approved implementation active

**Controlling plan:**
[Daily Trade Tracker Analyzer Reliability And Presentation Plan](daily-trade-tracker-analyzer-reliability-and-presentation-plan.md)

## Confirmed live finding — 2026-08-27

The owner-reported AEMD trade on the connected selected account displayed
`Live trade analysis (1-minute)` and `Updating analysis with the latest
executions.` after more than thirty minutes. The page did not show `Connect
Data`, and its browser console had no warning or error. This confirms the
visible symptom without reading or altering private database records.

Source inspection found that the analyzer deliberately waited for one hour of
post-exit candle collection and that its repeating worker is launched only by
the local development server. The production standalone start command did not
start the analyzer worker or schedule its route.

The active implementation changes the collection window to 30 minutes, starts
one bounded analyzer claim every 30 seconds in the one-process hosted runtime,
and processes the existing remote notification queue every 15 seconds. A job
now becomes ready, is retried up to three times, or is persisted as an honest
terminal unavailable state. This source change is not a hosted release or
delivery-configuration claim.

## Checklist

- [x] Confirm the live pending symptom without changing trader data.
- [x] Confirm the selected connected account does not show connection guidance.
- [x] Trace the queue, worker, current notification repository and hosted
      entrypoint.
- [x] Draft the owner-facing reliability, notification and mobile presentation
      contract.
- [x] Obtain owner approval for the visual and delivery contract.
- [x] Set the first completed-result window to 30 minutes, preserving the
      available 5-, 15- and 30-minute observations. The later post-session
      reconciliation may still add the 60-minute observation when it exists;
      the trader no longer waits for it before receiving the ready update.
- [x] Correct late-session status copy so an execution near the 8:00 PM
      Eastern close reports the available shortened market-data window instead
      of claiming that a full 30 minutes formed.
- [x] Derive first-result readiness from the final execution's containing
      minute so seconds cannot make the displayed time earlier than the actual
      candle-aligned worker boundary.
- [x] Normalize legacy queued first-result wakeups from the former one-hour
      policy before job claim while preserving next-day reconciliation wakes.
- [x] Implement bounded analyzer completion/failure outcomes and notifications.
- [x] Keep device-only manual entries visibly unsaved until their Journal commit
      is confirmed; they no longer collapse into the recorded-executions state.
- [x] Implement page-level status and mobile presentation.
- [x] Remove first-login Week Ahead opt-in presentation without changing
      existing consent.
- [x] Update affected Help content.
- [x] Record the owner-approved minute-and-price validation contract: seconds
      are ignored, candle boundaries are inclusive and every mismatch is shown.
- [x] Add the Coordinator-allocated
      `0099_daily_trade_execution_mismatches` state and account-isolated,
      immutable mismatch/confirmation storage after the staging lineage has
      integrated 0095 -> 0096 -> 0097 -> 0098. The 0099 source is registered
      on the reconciled feature branch but remains unapplied.
- [x] Validate every execution, refresh provider data once, persist all
      mismatches and create one idempotent trader correction notification.
- [x] Present all mismatches in the trade card and support broker-confirmed
      discrepancies without changing the Journal execution.
- [x] Draft focused cases for candle boundaries, ignored seconds, extended
      hours, multiple mismatches and the one provider refresh. Existing manual
      execution coverage proves edit-driven reanalysis; account-isolation and
      broker-confirmation storage cases remain part of the 0099 migration gate
      after predecessor integration.
- [x] Draft focused regressions for seconds-independent first-result readiness
      and pre-claim normalization of a legacy one-hour queued wakeup.
- [x] Complete focused validation.
- [ ] Complete owner visual/product review.
- [x] Prepare a narrow release handoff after explicit authorization.

## Owner staging UI follow-up — 2026-08-29

- [x] Route a successful day-execution submission to the trading date carried
      by the submitted executions instead of retaining the calendar-day route.
- [x] Keep one obvious page-level pending notice above manual execution entry
      and before the weekly summary whenever one or more submitted trades are
      pending analysis, even when an expected-ready timestamp is unavailable.
- [x] Add a restrained, accessible blue pending status to every collapsed
      pending trade card without depending on expansion or execution count.
- [x] Return the server-authoritative affected trading date and a sanitized
      Analyzer queue outcome after manual save. Navigation now uses that date,
      pending presentation still requires a persisted queued job, disconnected
      saves show `Connect Moomoo to analyze this trade.` with the existing
      Account connection action, and an ineligible save is described without
      implying an Analyzer failure.
- [x] Use one market-data-ready predicate for Analyzer and Account Settings.
      Moomoo is labelled `Connected` only when its workspace-owned record is
      active and includes `quote:read`; a stale active or reauthorization row
      instead shows a truthful market-data-unavailable reconnect state without
      changing or sharing OAuth credentials.
- [ ] Complete owner desktop and mobile visual approval for this follow-up.

## Selected-day trade-card review — 2026-08-29

- [x] Replace the rejected per-ticker expansion draft with one selected trade
      across the entire selected-day page. The first rendered trade in the top
      ticker opens initially and renders its saved Analyzer chart when present;
      every other trade starts compact.
- [x] Keep collapsed trades easy to open with **Review trade**. Reviewing any
      trade closes and unmounts the prior expanded trade and chart before
      opening only the selected trade and its chart.
- [x] Let the currently open trade close with a plain **Hide trade** control,
      including Trade 1 and single-trade tickers. It is bottom-right on desktop
      and bottom-left on mobile. Closing it leaves the page with no expanded
      trade or mounted Analyzer chart until **Review trade** is selected.
- [x] Preserve deep-link targeting by opening the linked trade instead of the
      default first rendered trade.
- [x] Make the root Demo Trade Tracker route resolve to the fixed accepted demo
      day, `/trade-tracker/2026-08-27`, while normal accounts retain their
      ordinary timezone-based root-date behavior.
- [x] Keep ordinary expansion free of programmatic scrolling. The existing
      intentional deep-link focus scroll now keys only to the linked trade, so
      a data refresh does not unexpectedly repeat it.
- [x] Preserve pending, mismatch, broker-confirmation, account-selection and
      saved Analyzer presentation paths without changing calculations or data.
- [ ] Complete owner desktop and mobile staging review.

## Verification boundary

No local server, hosted database mutation, migration, publish, deployment or
hosted configuration change has been performed. Migration 0099 is registered
after the confirmed 0095 -> 0096 -> 0097 -> 0098 manifest lineage but remains
unapplied. The 7 focused Analyzer/validation checks and 12 focused migration
checks pass with one worker, scoped server and UI TypeScript checks pass, the
exact changed-file ESLint check passes with zero warnings, and
`git diff --check` passes. Broad suites and the local server remain outside
this checkpoint.
