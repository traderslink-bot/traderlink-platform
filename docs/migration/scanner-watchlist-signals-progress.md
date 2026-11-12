# Watchlist signals in scanner ticker cards

The configurable ticker-card preview now calculates the same Trend, EMA, RSI, RSI momentum, VWAP, Volume and ATR events as the Watchlist. The card shows a compact current reading and puts timestamps and additional signal context in Details. Card sections lets users toggle each indicator independently and select 1m, 5m or 15m. The default stays 5m with EMA, VWAP and RSI enabled when Indicators is first turned on. Preferences stay in the browser.

The existing chart-bars request queue only fetches for visible cards with selected indicators. It reuses cached symbol history and keeps prior bars when a request fails. VWAP now uses the Watchlist calculation on the latest observed premarket-through-postmarket day. There are no scanner ranking or eligibility changes.

Chromium QA on the isolated scanner preview passed default selection, all seven indicator reads, signal timestamps, 15m switching, independent deselection and reload persistence at mobile and desktop sizes. The preview uses its existing synthetic scanner fixtures. The phone bridge and loopback page returned HTTP 200. Direct HTTPS from the VPS could not complete the tailnet TLS connection. Exact-file lint passed. No hosted deployment.
