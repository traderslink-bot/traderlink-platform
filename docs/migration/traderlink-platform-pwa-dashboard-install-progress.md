# TraderLink Platform dashboard install card progress

**Status:** Implemented; owner visual approval pending

**Controlling plan:** [TraderLink Platform PWA Plan](traderlink-platform-pwa-plan.md)

## Scope

- [x] Put a dedicated **Install TradersLink PWA App** card in the `/workspace` action-card grid, with the same responsive column width as Current Focuses and Add Trades.
- [x] Preserve the owner-approved install text exactly.
- [x] Keep a visible **Install TradersLink app** button in both places. It opens Chromium's native prompt when available and otherwise opens exact device-specific installation steps.
- [x] Capture Chromium's install-ready event once in the shared authenticated dashboard lifecycle and show a dismissible in-app install modal on whichever dashboard page the trader is using. Its primary action immediately opens the native browser install prompt.
- [x] Count each device-local display of the in-app install modal. On its third display, show **Don't show this again**; choosing it permanently suppresses only this modal on that browser/device, while the Account install action remains available.
- [x] Give iPhone/iPad users the required Share then Add to Home Screen instruction in the clickable install guide.
- [x] Hide the Workspace install card when the current app runs standalone. On supported Chrome and Edge website tabs, use the manifest's self-related-app entry to hide it when the exact TradersLink PWA is already installed. Account retains device-data settings without an install action in standalone mode.
- [x] Put the same native install action and device-specific steps in Account General, with the owner-approved replacement text, device-data controls and browser-install guidance retained.
- [ ] Owner reviews the desktop and mobile card and global install-modal presentation.

## Boundaries

The card does not request Push permission, create an offline entry, change
device storage, alter Journal facts, or change hosted configuration. Push
permission remains an explicit action in Account Preferences after installation.
