# Scanner compact chart

The member Scanner page reserves the bottom-right two desktop columns for
one shared chart. The space next to Market Events remains available for a
future scanner. On mobile, the chart is last in stacked mode and has its own
Chart tab in tabbed mode.

The chart starts after the first scanner data is rendered and only while its
card is visible. It selects the leading gainer, falls back to the leading
momentum ticker or SPY, and keeps the selected ticker for that card mount.
Opening the Scanner chart drawer stops the page chart and its subscriptions.
Closing the drawer lets the chart resume when its card is visible.

Isolated Chromium comparison used three baseline and three candidate runs
per mode with fixture scanner and candle data and 4× mobile CPU throttling.
It verified chart canvas dimensions, startup ordering, zero offscreen mobile
chart subscriptions, and disconnect and reconnect when opening and closing
the drawer. Production deployment and live market-data timing are pending.

Clicking an orange ticker selects it in the page chart. The green chart
action opens the drawer. Mobile tabs switch to Chart, and the stacked
layout scrolls the chart into view. Browser QA covered Table, Two rows
and Cards on desktop and in both mobile layouts.
