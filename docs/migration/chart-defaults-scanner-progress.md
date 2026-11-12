# Shared chart defaults and scanner opening timeframe

November 12, 2026. The Indicators panel labels account-wide additions, settings and removals under Chart defaults. This chart contains the local show/hide and on/off controls. Existing saved indicator data uses the same storage and requires no migration.

Scanner chart launch, drawer Add chart and the scanner Multiview controls now use the saved default timeframe for new charts. A launch clicked while preferences are loading waits for those preferences. Existing open charts keep their selected timeframes when the default changes.

Nineteen focused tests and targeted lint passed. The private preview browser test used isolated preferences and layout fixtures. It verified an early scanner click waits for a 5m preference, a second chart also opens at 5m, changing the default to 15m opens the third chart at 15m while the first two remain at 5m, adding EMA updates account defaults, and turning EMA off in one chart leaves it visible in the other. Help was updated to describe the controls. No production deployment.
