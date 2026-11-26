# Trading Workspace additional cards

The seven-card default stays available. In **Edit layout**, **Add card** adds up to two scanner cards configured independently as built-in scanners or saved scans. Desktop places a card in the first opening that fits and preserves the other cards. **Chart + 8 cards** is an optional desktop preset for nine total cards. The Chart card keeps its resize and Multiview controls.

Mobile layouts can hold nine cards in Tabs. Adding an eighth card switches the edited mobile layout to Tabs. Stacked remains available for layouts with up to seven cards. Portrait and landscape arrangements are saved independently, as before.

Built-in cards reuse the existing Workspace Scanner stream. The existing saved-scan stream batches distinct visible IDs, so repeated cards showing the same saved scan share a query.

## Mobile benchmark

The private Next.js preview used Chromium touch emulation at 390 × 844 and 844 × 390, 4× CPU throttling, 20 synthetic rows per busy scanner, and one live update per second. In a nine-card stacked trial, the 95th-percentile scroll frame interval reached 1,100–1,117 ms in portrait and 150–250 ms in landscape. Seven cards also had occasional stalls. These observations support limiting Stacked to seven and offering nine cards in Tabs. The numbers describe the isolated development stress test. [Stacked trial](/tmp/traderlink-workspace-add-card-20261122/browser-verified/results.json)

The final nine-tab median for built-in rows was 1.27 s in portrait versus 1.73 s with seven tabs, and 1.33 s in landscape versus 1.30 s with seven tabs. The first saved-scan reveal took 2.95 s in portrait and 1.73 s in landscape. Both orientations verified adding into a draft, the automatic switch to Tabs, one mounted card at a time, one live Scanner connection, shared requests for duplicate saved scans, the Chart canvas, save and reload, the Stacked limit, and Cancel restoring the saved nine-card layout. No page exceptions, Watchlist calls, or horizontal overflow were recorded. Desktop verified adding two cards to a resized Default layout without a preset, and checked Undo, Cancel, the nine-card preset, and the original Chart position after reload. [Browser results](/tmp/traderlink-workspace-add-card-20261122/mobile-complete/results.json)

Scoped lint and TypeScript, 26 focused tests, and the diff check passed. The browser fixture ran on loopback with synthetic data. Its temporary route was removed and its three sessions revoked.
