# Scanner indicator signal age

November 12, 2026. Scanner ticker cards retain their current EMA alignment and show the latest crossover separately for 15 elapsed minutes on 1m, 5m and 15m. Expanded indicator details use the same window and show relative ages. The shared clock updates the visible age and expires the event even when no new trade candle arrives. Watchlist signal history and scanner qualification are outside this change.

Private browser QA with a simulated clock verified that the 5m crossover updates from 30s ago to 1m ago, expires at 15 minutes without a new candle, and leaves the current alignment visible. Focused tests cover all three timeframes. No deployment.
