# Scanner chart drawer reopen and replacement

November 12, 2026. Closing the scanner chart drawer hides the current setup. Reopen chart drawer restores the saved chart layout, selected ticker, active details tab and selected scanner cards while the page remains open. Chart view memory is kept on close. Clicking a different ticker opens a temporary single-chart view with Back to saved charts and Add to saved charts. Adding to a full drawer requires choosing a chart slot or cancelling. Replacement removes only the chosen chart panel.

Eleven focused tests and targeted lint passed. Desktop Chromium in the isolated private preview verified restoring four charts and their timeframes, restoring selected scanner cards, returning from a temporary ticker, cancelling a replacement, and replacing the chosen slot. The browser fixture did not measure zoom restoration. No production deployment.

Reopen uses an outlined candlestick icon in the Scanner top navigation, beside the desktop Dashboard Customize icon. Browser QA confirmed the saved ticker reopens on desktop and both mobile layouts.
