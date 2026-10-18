# PC Codex handoff: actual Demo Analysis screenshots

The capture source is app.traderslink.pro, signed in with the owner's specific
account that has the populated Demo account selected. The owner will sign in
normally; credentials, session cookies and browser storage must remain private.
The Codespaces login fixture is not this data source.

Capture the existing pages as they are, after charts/tables and fonts have
finished rendering. Verify the Viewing demo data indicator before each capture.
Crop to `[data-traderlink-platform-dashboard-page]` so images show the actual
page content, not duplicated app navigation, account details or sidebar. Capture
full content height. Keep native UI and existing results; no generated data,
redesign, overlays or interactions need to be simulated.

Use viewport1440x1000 for desktop and390x1000 for mobile, deviceScaleFactor1.
Capture each in actual Light and Navy Dark appearances. Change appearance
through the existing UI when needed; restore the initial appearance/account
selection afterward. Screenshots are read-only content for a restricted preview;
no filters, pagination or replay need to be exercised.

| Filename key | App route |
| --- | --- |
| day | /analytics/trade-analyzer/day |
| trades | /analytics/trade-analyzer/day/trades |
| trend-momentum | /analytics/trade-analyzer/day/trend-momentum |
| entry-exit | /analytics/trade-analyzer/day/entry-exit |
| mfe-mae | /analytics/trade-analyzer/day/mfe-mae |
| green-to-red | /analytics/trade-analyzer/day/green-to-red |
| scaling-out | /analytics/trade-analyzer/day/scaling-out |
| candle-patterns | /analytics/trade-analyzer/day/candle-patterns |

Filename: `{key}-{light|dark}-{desktop|mobile}.png` (or.webp).32 images total.
For example: `day-light-desktop.png`, `day-dark-mobile.png`.
Return a ZIP containing only these images. No browser profile, storage state,
credentials, exports, database or account identifiers need to be transferred.
If page height exceeds16000px, report it so the image can be split faithfully
rather than cropped or redesigned. State the app source/capture date separately.

## Codespaces integration after receipt

Import the owner-confirmed captures with:

```bash
node scripts/feature-preview/import-trade-analysis-screenshots.cjs /absolute/private/captures --demo-account-confirmed
node scripts/feature-preview/validate-trade-analysis-screenshots.cjs
```

The importer requires all32 originals, verifies responsive dimensions, compresses
WebP to a one-megabyte-per-image budget and records dimensions and checksums.
The static manifest is published only after the complete set passes import.
The renderer selects one theme/viewport image with no live demo data reads,
filters, paging, replay or image-optimization server work. Only the upgrade
link remains active. Actual image/browser acceptance must follow import.
