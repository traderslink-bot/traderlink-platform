# Chart recovery after an overnight disconnect

On November 12, 2026 the owner reported that a live NXXT chart left open overnight stopped at November 11, 7:55 PM. The public app health endpoint returned ready. The original browser and its event stream were unavailable for inspection, so deployment timing and the exact cause for that tab remain unconfirmed.

The published source displays Reconnecting on an EventSource error without clearing its connected flag. The next connected status can therefore skip fetching missed candles. The existing timer only fetches history at a date change while connected. The local fix resets the flag, reopens terminal EventSource connections, and checks for missing history, a date rollover, or a stalled live feed when a tab becomes visible, comes online, or reaches the existing minute timer. History recovery is bounded to one attempt per chart per minute and retains the existing shared fetch path.

Focused lint and the shared-stream terminal reconnect regression passed. No production deploy or private preview change.

## Private preview browser QA

The fix was applied to the isolated preview on November 12. Chromium kept one synthetic NXXT chart open at 7:55 PM ET, then simulated a transient SSE disconnect and reconnect with no missed-bar replay from the stream. The chart fetched history and rendered the missed 7:57 PM ET candle. The same chart then crossed into the next market date with a terminally closed stream. The minute recovery timer opened a replacement stream and fetched and rendered the 4:08 AM ET candle. The document identity was unchanged through both cases. No hosted deploy or live Alpaca traffic was used in the simulation.
