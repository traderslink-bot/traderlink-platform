# TraderLink Platform dashboard install card progress

**Status:** Implemented; owner visual approval pending

**Controlling plan:** [TraderLink Platform PWA Plan](traderlink-platform-pwa-plan.md)

## Scope

- [x] Put a dedicated **Install TradersLink PWA App** card in the `/workspace` action-card grid, with the same responsive column width as Current Focuses and Add Trades.
- [x] Preserve the owner-approved install text exactly.
- [x] Keep a visible **Install TradersLink app** button in both places. It opens Chromium's native prompt when available and otherwise opens exact device-specific installation steps.
- [x] Give iPhone/iPad users the required Share then Add to Home Screen instruction in the clickable install guide.
- [x] State when the app is already installed and remove the redundant install action.
- [x] Put the same native install action and device-specific steps in Account General, with the owner-approved replacement text, device-data controls and browser-install guidance retained.
- [ ] Owner reviews the desktop and mobile card presentation.

## Boundaries

The card does not request Push permission, create an offline entry, change
device storage, alter Journal facts, or change hosted configuration. Push
permission remains an explicit action in Account Preferences after installation.
