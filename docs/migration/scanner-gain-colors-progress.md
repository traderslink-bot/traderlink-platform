# Scanner price and change colors

November 12, 2026. Top Gainers and Momentum use the same gain/loss colors in single-row, two-row, card, expanded and full scanner views. Top Losers and High Drops use the same color helper for price and actual percentage changes. Positive changes are green, negative changes red, and zero or unavailable values neutral. Reference prices, hypothetical recovery distances, volume and spread do not use gain/loss colors.

Day change keeps the previous trading day's regular close. Post-market change keeps today's regular close. Price uses the primary comparison for its scanner list. The chart drawer prefers the available Day reference, displays Post separately, and can display price and session change for a ticker present only in Top Losers or High Drops. Scanner calculations and qualification are unchanged.

Focused ESLint and 85 tests passed on the exact release source plus this slice. The client regression verifies opposite Day and Post signs and rendered colors in the chart drawer. Existing Scanners Help describes the comparison bases and needs no behavior change. The private preview source was updated. No production deployment.
