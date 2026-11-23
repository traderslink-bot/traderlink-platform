# Shared chart defaults and scanner opening timeframe

November 12, 2026. The Indicators panel labels account-wide additions, settings and removals under Chart defaults. This chart contains the local show/hide and on/off controls. Existing saved indicator data uses the same storage and requires no migration.

Scanner chart launch, drawer Add chart and the scanner Multiview controls now use the saved default timeframe for new charts. A launch clicked while preferences are loading waits for those preferences. Existing open charts keep their selected timeframes when the default changes.

Nineteen focused tests and targeted lint passed. The private preview browser test used isolated preferences and layout fixtures. It verified an early scanner click waits for a 5m preference, a second chart also opens at 5m, changing the default to 15m opens the third chart at 15m while the first two remain at 5m, adding EMA updates account defaults, and turning EMA off in one chart leaves it visible in the other. Help was updated to describe the controls. No production deployment.

## Indicator visibility across charts

The Indicators panel uses two radio choices above one list. The current choice uses the ticker and the app’s ticker accent color. Show values comes before its checkbox, and Show indicator controls the indicator itself.

The named chart choice changes the current view. All charts saves each indicator’s visibility and readout choices to the account. An account change replaces earlier chart choices for that indicator control. A later chart change can override it for that view. Removing an indicator from either radio choice requires confirmation and removes its active setup across the account. Add or edit indicator can add it again, and separately saved presets remain available.

The isolated browser layout check covered light desktop, dark phone portrait, dark phone landscape, and a 320 px portrait viewport with a long ticker. Both radio choices stayed side by side without horizontal clipping. The Add or edit indicator dropdown now stays above the list, and radio and checkbox labels keep a 44 px minimum tap height.
