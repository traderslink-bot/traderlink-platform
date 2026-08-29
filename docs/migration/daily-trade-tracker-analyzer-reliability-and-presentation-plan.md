# Daily Trade Tracker Analyzer Reliability And Presentation Plan

**Status:** Owner-approved on 2026-08-27; implementation active

**Controlling product plan:**
[Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md)

**Progress record:**
[Daily Trade Tracker Analyzer Reliability And Presentation Progress](daily-trade-tracker-analyzer-reliability-and-presentation-progress.md)

## 1. Outcome

Make the Daily Trade Tracker's Trade Analyzer reliable, honest and useful while
its market data is being collected. A connected trader must never be left with
an indefinite updating message. The tracker must show one clear page-level
status while its submitted trades are being analyzed, notify the trader when
analysis is ready, and report a terminal analyzer failure to the active Journal
owner administrator without exposing private trade details in a notification.

The same slice makes the mobile trade cards easier to scan and removes the
first-login Week Ahead email opt-in form.

The analyzer also validates each execution against market data before using it.
Validation uses the execution's Eastern-time minute and the entered price only:
seconds are ignored. An execution matches when its entered price is inclusively
between the low and high of that exact one-minute candle.

## 2. Confirmed diagnosis

- A completed trade currently stays pending until one hour after its final
  execution so the analyzer can collect the post-exit candle path. The owner
  approved a 30-minute collection window for this slice.
- The recurring Daily Trade Analyzer runner is currently started by the local
  development launcher only. The hosted production start command does not run
  that runner or otherwise schedule its authenticated route. A hosted job can
  therefore remain pending after its intended collection window.
- The current card renders only `Updating analysis with the latest executions.`
  for the pending state. It has no elapsed-time boundary, terminal worker-error
  presentation, user completion notification or administrator alert.
- The connection prompt is already conditional on the selected account lacking
  active `quote:read` access. It must remain absent for a connected account;
  this work must not hide a genuine connection or entitlement problem.

## 3. Reliability and notification contract

1. Use a 30-minute post-exit collection window for the first completed result
   and describe the wait as collection, not completed analysis. That result
   retains the available 5-, 15- and 30-minute post-exit observations. The
   existing post-session reconciliation may later add the 60-minute
   observation when market data supports it; that later observation is not
   required before notifying the trader that the first result is ready. Start
   the readiness clock at the final execution's containing one-minute candle;
   seconds never delay the first-result boundary into the following minute.
2. Add a hosted single-writer worker trigger owned by the release lane. It must
   authenticate to the existing worker route, run one bounded job at a time,
   and never introduce a second SQLite writer or an overlapping deployment
   worker.
3. Give every queued analyzer job bounded retry and lease recovery. A provider
   exception, repeated lease expiry, missing execution-minute coverage,
   unavailable provider, expired target and successful result each end in an
   explicit persisted outcome. Normalize an older one-hour first-result wake
   before selecting queued work, without changing a later post-session
   reconciliation wake. The UI must never infer success from elapsed time.
4. Create an idempotent `chart_update_ready` notification for the trade owner
   when the final usable analysis is ready. It appears in the in-app bell and
   is queued for every remote channel the trader has enabled in Notification
   Preferences. It links only to the account-scoped tracker day and trade.
5. Create a new terminal `chart_update` attention notification for the active
   Journal owner administrator when a job cannot finish after its retry budget.
   Follow the existing owner-alert pattern: always retain the in-app alert,
   ensure the administrator's email delivery category is enabled, keep the
   notification text free of ticker, account and execution details, and route
   it to the Journal Administration attention view.
6. Keep the existing account-scoped `quote:read` access read. A connected
   selected account does not show `Connect Data`; a disconnected or ineligible
   account continues to receive the existing connection guidance.
7. Treat a manual trade as saved only after the commit route confirms the
   durable Journal write. A transient commit/network failure may preserve a
   device outbox record, but it must remain visibly unsaved and must
   not collapse into a recorded-execution or ticker-card state.
8. Release verification must prove the hosted scheduler and the existing
   authenticated remote-notification delivery route are both configured before
   claiming that emails, Discord DMs or web push will be sent. This is a
   separate release/configuration handoff and is not authorized by this plan.
9. Before calculating analysis, compare every execution with its exact
   one-minute candle. Treat prices equal to the candle low or high as matches,
   retain extended-hours candles, and never reject an execution because of its
   seconds value. If an execution minute is absent or its price is outside the
   candle range, refresh provider data once before persisting the terminal
   `execution_mismatch` outcome.
10. Persist every mismatching execution under the exact workspace, Journal
    account, round-trip version and analysis version. The immutable record must
    retain the entered execution facts, candle minute and available candle
    range without changing the Journal execution itself.
11. Create one idempotent trader `needs correction` notification for each
    affected round-trip version. Show every mismatching execution in the trade
    card. Editing and resubmitting an execution automatically queues analysis
    for the rebuilt round-trip version.
12. A trader may confirm that the broker record is correct. That confirmation
    preserves the execution and unavailable analysis, and creates a
    privacy-safe administrator/provider-data alert. An ordinary entry mismatch
    alerts only the trader and never implies that the broker record is wrong.

## 4. Approved-copy candidate and placement

### Page-level analysis status

Show one blue, full-width status card immediately above the submitted-execution
card area whenever one or more trades on the day are pending collection. It is
not repeated on each ticker card.

- Visible line: `Trade Analyzer is collecting market data.`
- Supporting line: `You can complete your page here or leave the page. A notification will be sent when it is ready.`
- Normal timing line: `Analysis will begin after [Eastern time], when the 30-minute post-exit market-data window is complete.`
- When the 8:00 PM Eastern session end prevents a full 30-minute window, use
  `available post-exit market-data window` instead of claiming that all 30
  minutes formed.

When a terminal failure affects that day, replace the collecting status with a
plain error alert that says the analyzer could not collect the required market
data for the affected trade and that the trader will be notified if it becomes
available. Do not expose worker codes, provider exception text, account IDs or
retry counts.

When market data does not match one or more entered executions, show this
trade-specific correction state:

- `Execution did not match market data, so this trade could not be analyzed.`
- For each mismatch: `Check this execution: [Buy/Sell] [quantity] [ticker] at
  [Eastern minute], entered at [price].`
- When the candle exists: `Market data for the [Eastern minute] candle ranged
  from [low] to [high].`
- When the candle is absent: explain that market data did not contain that
  minute.
- `Check the execution time and price, then edit and resubmit the trade.`

The presentation lists all mismatches rather than stopping at the first. It
does not mention seconds, internal status codes, provider exceptions or account
identifiers.

### Ticker card while pending

The ticker card keeps a compact `Live trade analysis` treatment while collection
is underway, but it refers to the shared page-level status rather than implying
that the card is silently refreshing forever.

### Mobile collapsed trade card

- Replace the plus icon with a small outlined `View More` button using the
  same treatment as the existing compact card controls.
- Show the dollar P/L and percentage together above the time, using the exact
  same font family, size and weight as the current time row.
- Show the time below in a smaller, lighter style.
- Remove the `Long/Short · N executions` line from the collapsed presentation.
- Keep the coloured `Trade N` label and the factual P/L sign; do not alter
  exact execution, price or Journal facts.

### Mobile expanded trade card

- Replace `Collapse trade` with `Close Trade`.
- Place that outlined button at the bottom-left of the expanded trade card,
  after the card's details, rather than at the top-right.

### Daily Trading Rules on mobile

- Add at least 32 pixels above the Daily Trading Rules card on phone widths,
  which is at least twice the normal 16-pixel section gap.
- Directly below the title show: `Track rules that apply to your day here. Track rules that apply to your trades in the ticker cards.`

### First-login email form

- After Discord authorization, route directly to the validated return path
  instead of rendering the Week Ahead opt-in form.
- Preserve existing newsletter consent rows and all Account/Notifications
  controls. Do not subscribe, decline, delete or alter a user's consent just
  because the first-login form is removed.

## 5. Boundaries

- Do not mutate manual executions, source evidence, stored Journal facts or
  Market Data connection records.
- Do not replace a connected-account problem with hidden guidance; diagnose the
  selected stored connection/scope state instead.
- Keep all notification identities idempotent, account-scoped and free of
  private execution values outside the tracker itself.
- Reuse the existing Platform notification repository and remote-delivery
  queue; do not create a parallel email or notification store.
- A serialized database migration is required to add the honest
  `execution_mismatch` analysis outcome, immutable account-isolated mismatch
  rows and broker-confirmation records. It must follow the latest migration
  owned by the coordinated release line and be released in its own approved
  Railway slot. The Coordinator allocated
  `0099_daily_trade_execution_mismatches` after the immutable 0095, 0096, 0097
  and 0098 demo-data predecessors. The feature branch is now reconciled onto
  that ordered manifest and registers 0099; applying it remains a separate
  authorized staging boundary.
- No deployment, migration, hosted scheduler change, secret change or remote
  notification configuration occurs without separate owner release approval.

## 6. Delivery sequence

1. Add explicit analyzer job outcomes, bounded retry/failure recording and
   idempotent owner/trader notifications.
2. Wire the single page-level collection/failure status and the revised ticker
   states without changing the existing account-scope connection rule.
3. Apply the mobile card and Daily Trading Rules presentation changes.
4. Make `/welcome` a safe pass-through and update the Discord callback so it
   no longer routes a first login into the email opt-in form.
5. Review and update the affected Daily Trade Tracker, Trade Analyzer and
   Notifications Help guides.
6. Add focused coverage for inclusive candle boundaries, Eastern-time minute
   normalization with ignored seconds, extended-hours candles, multiple
   mismatches, one provider refresh, account isolation, edit-driven reanalysis
   and broker-confirmed discrepancies.
7. Perform focused low-resource source/lint checks only after the completed
   implementation batch. Do not run Vitest, a full build or a broad suite
   during this owner-review stage.
8. Present the live desktop and mobile flows for owner visual/product approval.
9. After owner release authorization, hand off the narrow commit, serialized
   migration and hosted
   scheduler/delivery requirements to the single Railway release owner.

## 7. Acceptance checklist

- [ ] A completed trade cannot remain in a pending state beyond the bounded
      collection/retry policy without a persisted terminal outcome.
- [ ] A device-only manual entry is visibly distinct from a server-saved trade
      and cannot be presented as a recorded ticker trade.
- [ ] The connected selected account does not show `Connect Data` or its
      explanatory prompt.
- [ ] One blue collection card appears above the submitted executions while
      any day trade is pending, with the owner-supplied copy.
- [ ] A ready analysis creates one idempotent trader notification and enters
      the configured remote delivery queue.
- [ ] A terminal analyzer failure creates an administrator attention alert and
      does not reveal private execution details.
- [ ] Every execution is validated by Eastern minute and inclusive candle
      price range; seconds never affect validation.
- [ ] A mismatch is persisted as `execution_mismatch`, account-isolated and
      shown with every affected execution and its available candle range.
- [ ] A mismatch refreshes provider data once, notifies the trader once and
      requeues automatically after a corrected edit.
- [ ] A broker-confirmed discrepancy preserves the execution and creates only
      a privacy-safe administrator/provider-data alert.
- [ ] Mobile collapsed and expanded cards match the approved labels, ordering
      and button placement.
- [ ] Daily Trading Rules has the approved mobile spacing and guidance.
- [ ] First Discord login skips the Week Ahead form without changing existing
      newsletter consent.
- [ ] Affected Help guides accurately explain collection, completion and
      failure behavior.
- [ ] Owner completes integrated desktop and mobile visual/product review.
