# Crisp Dashboard Support Chat Plan

**Status:** implementation complete — local browser check pending an active shared dashboard process

**Progress:** [Crisp Dashboard Support Chat Progress](crisp-dashboard-support-chat-progress.md)

## Owner-approved outcome

Add an obvious **Contact support** button to the private TraderLink Platform
dashboard top navigation. The button uses the established primary blue with
white text and a white support icon. Selecting it opens the owner-configured
Crisp workspace.

## Scope and privacy boundary

- The chat is available only in the dashboard shell served at
  `app.traderslink.pro`; it is not installed on the public marketing host.
- Crisp is loaded only after the trader selects **Contact support**. It is not
  loaded during ordinary dashboard navigation.
- The integration sends no Platform/Journal identity, email address, Discord
  identity, account information, trade data, or custom session data to Crisp.
- The owner-provided Crisp Website ID identifies the support workspace and is
  not treated as a secret.
- The control keeps a compact icon-only presentation on the narrowest mobile
  header to preserve the existing navigation, notification, Help and Account
  controls; its accessible name remains **Contact support**.

## Implementation and acceptance

1. Add Crisp's web SDK as a dashboard dependency.
2. Add one client-only support control that lazily configures and opens Crisp.
3. Place the control in the shared top navigation before the AI, notification,
   Help and Account actions.
4. Verify the dashboard compiles cleanly and, on the local dashboard, verify
   the primary-blue button opens the intended Crisp workspace without passing
   TraderLink facts.

No Journal schema, account/session contract, notification storage, public-site
code or Railway configuration changes are part of this slice.
