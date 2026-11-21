# Halt Alert Lifecycle Reconciliation Progress

**Status:** Local daily delivery lifecycle implementation in progress; no release authorization

**Controlling plan:** [Nasdaq and NYSE Halt Alerts Plan](nasdaq-nyse-halt-alerts-plan.md)

## Scope

Prevent duplicate Halt Alert Push notifications when an official exchange feed revises the raw halt-time string or republishes a sparse lifecycle snapshot. This repair does not change visible wording, preferences, delivery configuration, scheduler frequency, or database schema.

## Required behavior

- [x] Reconcile snapshots only when source, ticker, trading date and halt reason match an existing lifecycle.
- [x] Keep the original event and Push delivery; a later snapshot must not enqueue a second device notification.
- [x] Retain published quote/trade resumption times when a later snapshot is sparse.
- [x] Keep a real later halt separate once it is after the prior published resumption boundary.
- [x] Add focused ATXG, NINI and WLYP-shaped lifecycle fixtures.
- [x] Complete static review and a narrow local commit for release-coordinator handoff.

## Local verification

- [x] `git diff --check` passed.
- [ ] Targeted ESLint could not run because this fresh isolated worktree has no installed project dependencies; no dependencies were installed.
- [ ] Focused Vitest was intentionally not run under the low-resource implementation policy.

## September 8 duplicate-delivery safeguard

Read-only production evidence found one stored FCUV halt with two successful Push delivery rows. The same evidence showed BUUU and YMAT each had two distinct stored halt events, so those separate alerts must remain visible. The scheduler aggregate cannot establish a device receipt, so the reported YMAT display gap remains a separate device/subscription observation issue.

- [x] Derive the browser notification tag from `halt_id`, rather than the individual delivery row, so same-halt retries and duplicate subscriptions share one browser tag.
- [x] Set the service-worker notification to `renotify: false`; matching tags replace silently without changing click or mute behavior.
- [x] Add focused fixtures for same-halt duplicate deliveries, a retry, distinct re-halts, no newly exposed halt field, and the service-worker contract.
- [ ] Run only the agreed light static checks; focused Vitest remains intentionally deferred under the owner resource policy.
- [ ] Hold local changes for release-coordinator review; no push, Railway action, migration, configuration change, or production verification is authorized during the owner hold.

## First-halt daily notification lifecycle

Owner-approved notification sequence: only the first recorded halt for a ticker and Eastern trading date can notify. It may send an initial alert, then expected quote/trade-time updates only when official values first appear or change. A trade-time update is terminal once the one-minute poll reaches that unchanged expected time; no alert claims an actual unhalt or resumed trade. Later same-day halts remain stored without delivery.

- [x] Owner approved minimal factual Push copy with no process explanation and no unhalt claim.
- [x] Visual Release Coordinator reserved migration `0121_news_market_halt_delivery_lifecycle` / execution order 121.
- [x] Add local staged delivery lifecycle, first-halt eligibility, and silent terminal logic.
- [x] Add migration/backfill design: existing delivery records become `initial` revision 0.
- [ ] Complete static/migration fixture review without running Vitest, build, browser, local server, or hosted migration.
- [ ] Local commit and release-coordinator handoff remain pending separate authorization.

## Release boundary

The release coordinator owns any push, Railway release, migration decision, and production verification. This repair is designed without a migration.

## November 21, 2026 — selectable detector and closed-market protection

**Status:** Source implementation complete; isolated checks pass. Not deployed or activated. Release integration and affected shared-push-hook review remain separate. Worktree `/home/traderlink/.codex/worktrees/halt-alpaca-closed-session-20261121/traderlink-platform`, branch `codex/halt-alpaca-closed-session-20261121`, Coordinator-assigned base `4783edd994cb23c1d57447df19bddf7b6fe1765a`. Git publication/integration stays with the Coordinator; no commit, push, restart or release was performed by this feature chat. The separate Watchlist card-placement release is not part of this slice.

The owner approved two owner-only controls at `/admin/market-halts`: **Detection source** (Alpaca or Nasdaq/NYSE) and **Detection** (On/Off). Saved settings use a dedicated revisioned, atomic private JSON file beside existing application storage. Reads and saves do not contact a provider or send an alert. The unchanged exchange loader remains selectable; without saved settings, Discord detection keeps the original exchange method, independently of the scanner's existing source setting. Off and source choices survive restart. Stale revisions cannot overwrite a newer choice. There is no database migration or new credential setting.

Alpaca detection reads the existing authenticated, provider-neutral-compatible gateway halt contract; it opens no new upstream stream. Confirmed current statuses supply actual pause start, venue and raw reason code. Unsupported codes, missing true halt start, inconsistent status, future/stale-day data, BOATS and unavailable source coverage do not become new alerts. The existing exchange venue column stays Nasdaq/NYSE, while saved source URL identifies Alpaca as detector. CTA A means additional information requested and M means LULD; the real codes are retained. Documentation cross-check: https://www.nyse.com/publicdocs/nyse/data/NYSE_BQT_Common_Client_Specification_v2.2k.pdf and https://docs.alpaca.markets/us/v1.4.2/docs/real-time-stock-pricing-data . No exchange detector is silently substituted when Alpaca is unavailable.

Nasdaq/NYSE resumption schedules are fetched separately as enrichment when Alpaca is selected. Only a unique exact ticker/trading-date/halt-second match can supply valid later quote/trade times. Exchange-only rows never originate Alpaca alerts. Schedule reads are coalesced with a one-minute minimum refresh, a one-second foreground wait and at most two minutes of retained schedule context; late exchange responses enrich a later poll without blocking the primary detector. Confirmed Alpaca resumption closes an existing matching notification sequence and expires pending alerts; it does not reclassify a sending attempt or generate a resumed notification. Existing first-halt/day, deduplication, enforced Discord nonce, original retry identity and independent device preferences remain intact.

Both methods use the same existing verified US-equities calendar before source intake, at queue reconciliation and immediately before delivery. The normal window is 04:00–20:00 Eastern, with the calendar's 17:00 extended close on scheduled early-close dates. Weekends, holidays, invalid/out-of-coverage dates, overnight and out-of-window events are denied. Re-read revision/source/On-Off after source/direction awaits; saved settings are read again at the send boundary. A source or On/Off change invalidates previously queued unsent work instead of flushing it after re-enable. Discord rechecks after its asynchronous channel lookup. Push uses an optional synchronous `beforeSend` repository hook immediately before the existing transport call; a rejected halt expires only its delivery, not the device. Other repositories without that hook keep the original path. Health records identify the actual selected detector and stop reporting a previous source or disabled detector as ready.

The owner clarified that Discord's one-alert behavior must not limit Trading Workspace Market Events. No Market Events source, reader, card, retention or scanner-source-control file was edited. Repeated genuine events remain stored, and the actual Market Events selection function still accepts multiple genuine events for the same ticker. Existing resumption-monitor call remains unchanged.

Incident evidence preserved before edits: the supplied 50-row attachment has SHA256 `2576918c66406fbbcd119fcf08612deb0f6324b31317a95155448b5b55b2630d`, with TOVX at 09:49:21 and AIM at 09:39:15 on Saturday November 21. MITT is absent. Machine receipt `/tmp/halt-attachment-evidence-20261121-6swbhvb2/receipt.json` records that boundary. Actual Discord notification timestamps, source event IDs, saved queue rows and dedupe receipts were not available through this source-only assignment; no production database/provider/Discord requests were made and no MITT event was invented. Weekend exchange-testing notices remain an unproven lead, not a claimed cause.

Verification uses **46 isolated Node checks**, actual parsers and existing calendar, representative gateway status fixtures, captured TOVX/AIM values, and `better-sqlite3` 12.9.0 in-memory fixture tables (no migration runner). Both selected feeds reach one successful mocked Discord delivery; repeated polls remain silent. Cases cover weekend/holiday/early-close gates, unavailable calendar/source, partial/invalid status, exact schedule matching, first-alert dedupe with later stored halts, source/Off changes during channel validation, crossing session close, stale Saturday work on Monday, resumption, unchanged nonce on an unknown mocked transport result, push suppression without device expiry, unrelated push consumers, owner/mutation access, size/type/revision rejection and unchanged Market Events multiplicity. All HTTP/provider transports are blocked or explicit local mocks. No Vitest, real generation or posts. Command: `HALT_QA_DEPENDENCY_ROOT=/home/traderlink/projects/watchlist-alpaca-qa node --max-old-space-size=384 --test --test-concurrency=1 src/modules/news/server/market-halt-detection.node-test.cjs`. An installed canonical checkout can omit that dependency override.

Strict TypeScript no-emit qualification passes for 16 changed roots and their 2,105 actual source/dependency files, using the existing qualified dependency tree without installing/copying/stubbing source. Targeted lint passes 19 files, zero errors/warnings (React auto-detection emits a tooling note because this worktree intentionally has no own node_modules). Actual React/MUI jsdom flows pass loading, selecting a source, toggling, saving, reopening, dark theme, conflict preserving unsaved input and explicit refresh. These are isolated DOM checks, not browser screenshot or live-account acceptance. Receipts and finite resource-guarded driver scripts: `/tmp/halt-controls-qa-20261121/`. Earlier harness path/realm and sparse-lifecycle fixture failures, plus the installed MUI switch-prop correction, remain in their original logs. No assertions were removed to obtain passes. Existing Vitest fixture files now use explicit synthetic settings and full event fields; their assertions are preserved and Vitest remains unrun as instructed.

Remaining external acceptance: affected-source peer review of the two-line optional shared push hook, canonical integration/build/hosted acceptance and a real trading-day observation when explicitly authorized. No held provider, shared shell, private wrapper, Runtime, production configuration, keys, leases or migration catalog was changed. Do not deploy this slice without the owner's separate release instruction.
