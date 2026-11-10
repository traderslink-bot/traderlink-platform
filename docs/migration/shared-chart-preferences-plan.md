# Shared chart preferences — first panel review

Owner approved trying on-chart Indicators and settings panels after discussing saved user setups. No separate preferences page. All indicators optional; future catalog breadth is not restricted to this first implementation. Drawing tools and named templates remain separate design work.

## Review composition

Mobile below900px: Indicators and gear next to existing timeframe controls open a bottom sheet, up to78dvh, with fixed title/44px close control, scrolling form and automatic-save status. Desktop uses a400px right drawer. Reuse the existing Material shell, inputs and modal focus behavior. The chart remains behind the panel for context. No permanent drawing toolbar.

Indicators: search the working catalog, add independent instances, edit supported periods/color/line width and remove them. First functioning entries: EMA, SMA, Eastern-calendar-day VWAP using HLC3 and actual volume, Wilder RSI, MACD12/26/9 with signal/histogram, Bollinger20-style configurable period/2standard deviations. MACD periods and VWAP reset are explicitly shown fixed in this first slice. RSI uses0–100 range. No indicator enabled by default. This is not a claim that all possible indicators or TradingView's embedded study library are implemented.

Settings: candles/OHLC bars/line; app/light/dark theme; up/down colors; default timeframe; Eastern/Toronto/UTC display; grid; volume visibility/height; normal/log and auto/manual main price scale; premarket/regular/postmarket visibility. At least one session stays enabled. Intraday filtering occurs on actual minute facts before higher-timeframe aggregation. Disabled-session carried marks are omitted. Daily provider bars stay unchanged. Overnight data connection, independent background/grid color customization, pane rearrangement and symbol-specific drawings are not implemented in this first review.

## Ownership and persistence

Authenticated GET/POST `/api/charts/preferences`, standard Platform same-origin mutation foundation,16KiB body bound, strict versioned schema. One account setup, shared across chart locations; all open same-account instances receive successful saved changes. Active timeframe stays independent in each already-open chart; changing it saves the default for future chart mounts. New mounts/devices read server state. No browser-local storage fallback masquerading as account persistence.

Private storage is beside the configured Platform database under `chart-preferences-v1`, one SHA256-user-key filename,0700 directory/0600 atomic JSON files with fsync and revision checks. No new SQLite migration and no Journal/trading facts touched. Single application writer remains required. Authentication, not a submitted owner ID, determines storage scope. GET returns an opaque owner key and POST must match it, preventing a stale tab from writing an old setup into a newly signed-in account. Stale revisions409; errors stay visible. Pending saves are serialized per chart, use keepalive and continue after navigation; no debounce silently drops a last edit. Other-device live push sync is not implemented; returning/reloading fetches saved settings. Coordinated release must include these private preference files in account-data backup/restore inventory.

## Chart behavior

All locations import the same shared component. Indicators use actual aggregated candles, never carried display marks. Display/source separation remains. Chart reconstruction for structural settings retains raw history/older cursor, visible time range and manual price range where valid; session filtering clamps a saved range or falls back to recent positions instead of requesting an invalid range. Latest-price precision uses greatest timestamp, not insertion order after loading older chunks. Per-instance streams/timers are disposed normally. Saving cannot change scanner qualification or provider selection.

## Verification and acceptance

See [shared chart progress](shared-lightweight-chart-progress.md). Source checks and browser review are separate from owner visual approval. Only the existing isolated private preview is updated. No production release, hosted settings or shared Alpaca gateway change authorized.

Verification checkpoint:37 focused tests pass, UI/API typecheck0errors, targeted lint pass. Actual preview browser confirms mobile/desktop panels, adding/removing indicators, save/reload/symbol retention, all six studies, manual/log/line/UTC/light rendering, inherited scanner-drawer setup and independent open-chart timeframes. Test preferences restored. No production acceptance claim. Auto-save status distinguishes queued from acknowledged changes; a full document exit before pending requests finish is not claimed as verified.

## November 9 owner correction — indicator completeness

The owner rejected the nonstandard VWAP label and limited indicator controls. The six-study prototype above is historical and must not be treated as completed indicator parity. Follow [indicator research and concrete editor proposal](chart-indicator-standard-settings-review-20261109.md) for the corrected requirements, numerical/reference gaps, saved-setup preservation and review checkpoint. No new production change authorized.

The owner's later strict sequence and three-pass-per-indicator requirement are tracked in [completion/QA ledger](chart-indicator-completion-ledger-20261109.md). VWAP is first; the earlier broad editor draft is unfinished and not evidence of completed indicators. All six offered chart timeframes are mandatory for each checkpoint.


November9 owner-goal checkpoint: ordered indicator implementation remains on VWAP. Calculation-timeframe/close and offset shared-renderer integration passed the six-by-six browser matrix at263b263e; full VWAP/catalog acceptance and all18 final QA passes remain pending. Added measured compression evidence and the standard saved Scale price chart only development option; main/scanner crosshair parity verified in shared-source desktop/mobile fixtures. See chart-indicator-completion-ledger-20261109.md for exact evidence, failures, limits and remaining work. No deployment.

Forward VWAP offsets use supplied trading sessions. When positions cross calendar coverage, the chart requests the next year through the authenticated calendar-only gateway path, with bounded lookahead and retry cooldown. It does not assume weekends are the only closures or create candles/volume for forward positions. Provider-unavailable future years remain unavailable. This remains a private local indicator draft.


### November10 owner scope clarification

Finish familiar standard indicators and practical editable periods/multiple EMA/SMA lines first. TradingView comparison does not require specialist earnings anchors or indicator-on-indicator linking for this pass. Keep existing working optional controls; do not add extras that delay delivery. Finnhub earnings is conditionally permitted if the current tier supports it, but is deferred from this pass. See completion ledger for corrected calculation and verification evidence. No production deployment authorized.


### November 10 technical completion

The six standard indicators and practical saved settings are implemented and technically verified under the owner’s clarified scope. Three complete QA inventories per indicator are recorded in [the final QA receipt](chart-indicator-final-qa-20261110.md); the first found three obsolete expectations, and both follow-up inventories passed. Shared price-only scaling and main/compact date/crosshair fixes are included. Owner visual acceptance and any deployment remain separate; no hosted or preview update.
