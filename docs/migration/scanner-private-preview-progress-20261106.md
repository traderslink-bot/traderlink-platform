# Scanner private preview — November 6, 2026

Owner explicitly requested stopping Coaching and starting Admin Watchlist. The unprivileged traderlink-preview service now serves the assigned workspace on VPS 127.0.0.1:3010, with isolated preview-runtime/admin-watchlist data and --no-workers. Coaching data was preserved. No hosted action occurred.

Initialization initially failed because this mixed checkout lacked imported source modules. Fifty missing dependencies were restored byte-for-byte from the cached origin/main tree, without overwriting existing files. The exact inventory is retained privately in /home/traderlink/preview-runtime/admin-watchlist/restored-source-prerequisites.json. These are preview prerequisites, not scanner production release scope.

Owner browser URL localhost:64937 exposed a local runner defect: Next fills x-forwarded-port from listener port 3010, which disagrees with the browser-facing SSH tunnel port. Reproduced the access-denied error before correction. The runner now sets trusted forwarding metadata only after rejecting client forwarding/assertion headers and validating loopback peer and Host. No access validator or production authentication code was weakened.

Verification: five existing development-boundary tests and runner ESLint pass. After service restart, a temporary loopback proxy at port 64937 preserved the browser Host; actual Chromium navigation to http://localhost:64937/screeners rendered five scanner cards with no browser exceptions. The temporary proxy was closed. Client-supplied forwarding headers return HTTP 400. Browser data remains empty with workers disabled; live scanner behavior and populated table visual review are not claimed.

## Production-source correction

Owner rejected the outdated feature-checkout preview and explicitly directed using the correct current application. Read-only Railway metadata confirmed deployment e06e05fd-1ea4-4138-9362-f523aa800e3c SUCCESS at ebe8f054e4d45fb488712e19a1d8c1ced0939dae, matching remote main. It already contains the requested table density and newspaper changes.

The active unprivileged preview service now runs a disposable Git source archive of that exact commit under /home/traderlink/preview-runtime/admin-watchlist/production-ebe8f054e/source, with its own new isolated data directory. This is a generated preview runtime artifact, not another development checkout; no project branch or unfinished files were replaced. Dependencies are linked to the existing installation rather than copied. The only source overlay is the local server runner's tunnel-port fix and explicit Webpack selection for compatibility with linked dependencies; production UI source remains exact. The existing launcher environment allowlist is reused. No root service, real credentials or public listener.

Actual browser navigation verified current navigation, five cards, completed hydration (zero skeletons) and no page exceptions. Page and scanner API return 200. A loopback tunnel proxy preserving Host localhost:64937 also rendered all five cards. Disabled stock lists are expected with isolated data and --no-workers; populated/live scanner acceptance is not claimed. This corrects the earlier preview source mismatch.

## Owner-authorized populated table preview

Owner requested static fake rows in Top Gainers and Momentum to make layout review useful. The disposable production-source runtime now contains preview-fixtures/scanner-rows.json (20 rows per scanner) and a preview-only API read branch gated by NODE_ENV=development plus TRADERLINK_PREVIEW_STATIC_SCANNER_ROWS=1. Existing route authorization is retained. Table/card components remain byte-identical to production ebe8f054e. No provider calls, live DB copies or production feature changes.

Rows cover missing float, varied prices/volume, PR/SEC/no-news control positions, multiple signal labels and cooling state. Browser verified 20 expandable rows per card, correct Vol→Float→$ × Vol gainer order, successful expansion in each card, zero page exceptions, and mobile document width 390px at a 390px viewport. Existing full-table views use the same static model. Synthetic article IDs are display fixtures, not stored articles; live news/article acceptance is not claimed.

## Tailscale phone bridge restored

Owner explicitly requested restoring mobile access. Existing Tailscale Serve configuration was already tailnet-only HTTPS at traderlink-live-preview.tail41b7ab.ts.net, forwarding to loopback port 3032, but nothing listened there. Added a feature-owned unprivileged transient user service traderlink-preview-phone-bridge.service, using the generated phone-bridge.cjs in this preview runtime, forwarding only to 127.0.0.1:3010. No Tailscale configuration, public ports, root services or hosted app changes. It validates the exact preview Host and HTTPS Origin plus loopback peer, normalizes only the trusted private forwarding hop, and supports WebSocket upgrades. This is isolated development-owner preview access for the already-authorized tailnet route.

Actual HTTPS verification through Tailscale returned 200. Mobile Chromium at 390px loaded the exact HTTPS URL with 20 rows in both primary cards, scanner API 200 and zero page exceptions. Initial request raced service startup (502); the subsequent full browser check passed. Service restarts on failure. Restore command if needed: systemctl --user restart traderlink-preview-phone-bridge.service. Main app service remains traderlink-preview.service; generated current-production source uses the explicit serve.py command recorded above.
