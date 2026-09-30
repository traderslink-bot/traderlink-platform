# Ticker-detail posted price

Owner-approved September 30: add the original posted price next to Posted date/time and Live data in the ticker-detail header. Do not restore a second live-price display.

Implemented: the header uses the same saved `potentialGain.startingPrice` shown as Added to watchlist in Potential Gain, only when it belongs to the current `firstPostedAt` cycle and is a finite positive price. The field remains frozen as subsequent prices and analysis change. Missing values are omitted rather than substituted with the live quote or latest analysis price. It works even when the Potential Gain card is hidden. Existing price formatting and responsive summary styling are reused.

No storage, API, analysis, notification, date, live-price, or access changes. Static JSX check and exact-parent diff review apply; hosted visual verification remains part of release acceptance. Help clarification is included in the release package. This follow-up is separate from the CNTB preview checkpoint and follows it in release order.
