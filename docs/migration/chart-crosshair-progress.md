# Shared chart crosshair controls

November 12, 2026. Chart settings now offers price, Normal, nearest line, and individual visible indicator lines from the price pane. Price snapping follows the candle close. The preference is shared by Charts and scanner charts. If the saved line or its value is unavailable on the active candle, the crosshair follows price.

Seven preference tests and targeted lint passed. The private preview browser check verified the default, the EMA 9 choice, Normal, nearest line availability, and saved settings with isolated fixtures. Cursor positioning was checked against the installed Lightweight Charts API. No production deployment.

## Free movement default

November 17, 2026. Free movement is the shared chart default. Previous crosshair selections reset when account preferences are read. Snap choices remain available under Crosshair, and selections made after the reset are saved with the other account preferences.

All 27 focused tests, changed-file TypeScript, and targeted lint passed against the production source. Chromium fixtures verified that moving vertically changes the price-scale readout without moving horizontally on desktop and on touch in portrait and landscape. They covered main and compact chart configurations and confirmed that a new snap selection survives a reload. Local checkpoint only.
