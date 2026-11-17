# Signed-in home menu and home page preference

The owner chose **Home** for the page title and sidebar label and `/home` for the page address. Home can grow beyond menu cards to include general market data, market updates, and app updates. The previous `/welcome` address redirects to `/home`.

## Scope

- Open the signed-in Home page by default. Show Trading Tools, Market News, Trade Analyzer and Trading Journal cards with direct links the signed-in user can use.
- In Account Settings → Preferences, show a Home page dropdown and Save button above Appearance. Offer Home, Trading Workspace, Scanners, Screeners and Journal Workspace. Keep unavailable choices visible and disabled. Use the shared dashboard theme and stack cards on small screens.
- Keep the preference with the Platform user. A missing or unavailable preference resolves to Home. A Journal Workspace home requires a selectable trading account. The Trading Journal card on Home can link eligible users to Journal onboarding.
- Use the dashboard entry route for ordinary web opens, default sign-in returns and installed app launches. Keep the installed app ID, explicit destination URLs and OAuth account-link returns. Existing installs pick up the new launch URL through the browser's manifest update.
- Keep the existing demo lifecycle with the Coordinator. The Home route reads card access from the signed-in account.

## Design

Trading Tools comes first visually and in keyboard order. The Settings field stays near the width of its longest choice on desktop and wraps with Save when space is limited. Use a visible label, keyboard operation, and feedback beside the field. The owner accepted this direction for the first review on November 16, 2026. [Material UI Select guidance](https://mui.com/material-ui/react-select/), [W3C Reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## Progress

- [x] Verified the assigned branch and production-base commit. Mapped app entry, login returns, route access and offline navigation.
- [x] Owner approved the proposed first pass, with Trading Tools first.
- [x] Implement and verify isolated routing, migration, persistence, permissions and UI.
- [x] Add the three market-cap Press Releases links to the Welcome Market News card for users with existing Press Releases access.
- [x] Apply the Home name and legacy redirect while preserving existing start-page preferences.
- [ ] Owner review of the preview.

## Verification

- Home naming and routing passed 32 focused tests and scoped lint. Isolated Chromium verified the title and sidebar label, the permanent legacy redirect with query preservation, signed-out sign-in return, direct Home navigation with a different start page saved, default and unavailable-preference fallback, and installed-app launch. The existing Home preference is carried forward under its persisted key without another migration.

- Focused auth, return-target, dashboard-template and migration checks passed. The final migration and access run passed 17 tests across three files. The existing migration suite needed a 20-second per-test timeout on the VPS.
- Isolated Chromium passed Light desktop and 320px Navy Dark portrait. It exercised keyboard selection, a failed save and retry, persistence, signed-out entry and fresh email sign-in, remembered entry, manifest URL launch, fallback after an unavailable setting, and a direct Journal Workspace query while Scanners was the saved home. Demo API calls were intercepted with an unavailable response during the browser run.
- Scoped lint passed. The changed Workspace and shared shell still report existing timing-purity and hook-dependency diagnostics. The full type check reported the existing missing `jsdom` declaration in `feature-page-embed-host.test.ts`. The production build, browser-specific updates of older installations and hosted staging review remain pending.

- The market-cap link addition passed scoped lint, all seven dashboard-template checks and isolated Chromium navigation to each channel. The card fits a 320px viewport, and an account without Press Releases access retains the public Market News link. The existing Help Center instructions for these channels still apply.

## Hosted integration

The isolated initialization produced 182 ledger rows. The first 181 match the exact ledger and target schema digest committed in `scripts/platform/analyzer-exact-ledger.json`.

- Migration `0195_platform_home_page_preference` at execution order 255.
- Statements checksum `885490dff11dc6ec0cb9ca45af104f3569c3156007a7b457e16b7a76dd508088`.
- Post-migration schema digest `9de32e9030284aeeafc2d8a10dcecfff3d800dabdfecef02fa8598d33113dda9`.

The Railway startup wrapper pins the exact 181-entry production ledger. Coordinate a staging-compatible build and an explicit backed-up migration before any new runtime reads the home-page column. Recheck the predecessor and migration order at integration. The managed VPS launcher does not currently list this worktree.
