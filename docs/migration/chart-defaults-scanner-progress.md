# Shared chart defaults and scanner opening timeframe

November 12, 2026. The Indicators panel labels account-wide additions, settings and removals under Chart defaults. This chart contains the local show/hide and on/off controls. Existing saved indicator data uses the same storage and requires no migration.

Scanner chart launch, drawer Add chart and the scanner Multiview controls now use the saved default timeframe for new charts. A launch clicked while preferences are loading waits for those preferences. Existing open charts keep their selected timeframes when the default changes.

Nineteen focused tests and targeted lint passed. The private preview browser test used isolated preferences and layout fixtures. It verified an early scanner click waits for a 5m preference, a second chart also opens at 5m, changing the default to 15m opens the third chart at 15m while the first two remain at 5m, adding EMA updates account defaults, and turning EMA off in one chart leaves it visible in the other. Help was updated to describe the controls. No production deployment.

## Indicator visibility across charts

The Indicators panel uses two radio choices above one list. The current choice uses the ticker and the app’s ticker accent color. Show values comes before its checkbox, and Show indicator controls the indicator itself.

The named chart choice changes the current view. All charts saves each indicator’s visibility and readout choices to the account. An account change replaces earlier chart choices for that indicator control. A later chart change can override it for that view. Removing an indicator from either radio choice requires confirmation and removes its active setup across the account. Add or edit indicator can add it again, and separately saved presets remain available.

The isolated browser layout check covered light desktop, dark phone portrait, dark phone landscape, and a 320 px portrait viewport with a long ticker. Both radio choices stayed side by side without horizontal clipping. The Add or edit indicator dropdown now stays above the list, and radio and checkbox labels keep a 44 px minimum tap height.

## Indicators panel redesign for owner review

The redesigned panel uses an Apply to dropdown and a single list with one row per indicator. Show values and Show indicator have their own columns. Each row opens its settings with a gear. The settings view keeps presets, line controls and confirmed account-wide removal together. Back to indicators restores focus to the gear or indicator dropdown. The existing global line width control sits under Line widths.

The browser check passed in light desktop, dark phone portrait, dark landscape and 320 px portrait with a long ticker. Indicator checkboxes and gear buttons measured at least 44 px. The check exercised both Apply to choices, returning focus from settings and opening line widths. Twelve focused tests covered chart/account changes, the removal confirmation and the line width confirmation. The redesign is local for owner review. [Phone screenshot](/home/traderlink/preview-runtime/chart-indicators-redesign.sySiRq/phone-dark.png) · [Verification](/home/traderlink/preview-runtime/chart-indicators-redesign.sySiRq/browser-result.json)

The owner chose to make the dropdown add-only. **Add indicator** lists indicator types that have not been added. Each indicator's gear opens its existing settings, including additional EMA and SMA lines and account-wide removal.

On compact charts the toolbar timeframe is the single picker for the open chart. The chart gear still opens Chart settings, where Default timeframe applies to new charts. A 390 px touch browser check selected 5m from the toolbar, verified the duplicate was absent from the gear menu, and opened Default timeframe in Chart settings. [Browser result](/home/traderlink/preview-runtime/chart-single-timeframe-menu.Bny9Rn/browser-result.json)

The compact toolbar displays the active timeframe in an outlined dropdown with neutral text and a down chevron. Light and dark 390 px touch checks verified both appearance and selection. [Browser result](/home/traderlink/preview-runtime/chart-timeframe-dropdown.X1tuyx/browser-result.json)

The owner confirmed that the Indicators icon belongs on the chart toolbar. On desktop and compact charts, it opens the redesigned Indicators panel directly. The gear opens Chart settings directly. The intermediate options menu was removed. A local browser check verified both one-action entries, the redesigned panel, and selection in the independent compact timeframe picker. Checks covered 320 px and 390 px portrait, 740 px landscape, and 1440 px desktop. [Browser result](/home/traderlink/preview-runtime/chart-direct-preferences.yrHlQ7/browser-result.json)

The trendline now previews during a pointer drag and commits on release. A tap still starts the existing two-point placement flow. A completed drawing remains selected for endpoint edits. Chart-only indicator visibility is stored on this device for the specific open chart and survives refresh. Closing or replacing that chart clears its overrides. The Indicators footer explains the storage scope. Focused lint and 37 drawing and chart-view tests passed. The owner requested the live ticker walkthrough during the next open session.
