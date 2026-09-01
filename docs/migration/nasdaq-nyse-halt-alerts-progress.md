# Nasdaq and NYSE Halt Alerts Progress

**Status:** Implementation active

**Controlling plan:** [Nasdaq and NYSE Halt Alerts Plan](nasdaq-nyse-halt-alerts-plan.md)

- [x] Owner set the included/excluded halt types and 07:50 ET Nasdaq T1 suppression.
- [x] Owner selected opt-in Halt alerts, same-day ticker mutes, Select all controls, and live deployment.
- [x] Add durable event, preference, mute and delivery records.
- [x] Add official Nasdaq RSS and NYSE CSV polling with normalization.
- [x] Send exact alert content through the existing Push service worker.
- [x] Add Account Push setup and Help alignment.
- [x] Add the detailed Halt Alerts guide under the Tools Help section, linked from Notifications and imports.
- [x] Replace permanent settings-page ticker mutes with a **Mute for today** notification action and 8:00 PM Eastern expiry.
- [x] Add the left-navigation Halt Alerts drawer with same-day ticker mutes and mobile close controls.
- [x] Add the owner-approved delivery-readiness status below the toggle. See [Halt Alert Status Indicator Progress](halt-alert-status-indicator-progress.md).
- [ ] Refresh the drawer layout with the owner-approved Halt alerts, Muted Tickers and device-install sections.
- [ ] Complete focused verification and owner visual approval.
- [ ] Deploy, activate the one-minute hosted schedule, and confirm real device Push.

## Source-isolation repair — local checkpoint 2026-08-29

- [x] Confirmed that the protected cron previously treated Nasdaq and NYSE as one all-or-nothing fetch: either unavailable source returned `503` before events or Push deliveries could be created.
- [x] Isolated the two official-source reads. A healthy source now continues through the existing event, recipient, mute and encrypted Web Push flow when the other source is unavailable; both unavailable sources still return `503`.
- [x] Added safe source-only observability to the protected cron response and warning log: exchange name plus HTTP status, or `null` for a network failure. No user, subscription, endpoint, credential or upstream response content is logged.
- [x] Use Nasdaq's primary official host for the same Trade Halt RSS feed and bound each official-source connection to 15 seconds, after production showed repeated transport failures to the `www` host.
- [x] Replace the Nasdaq RSS browser-style fetch with one direct IPv4 HTTPS request to the same official feed after the host repair still failed in Railway; NYSE retains its independent existing request.
- [ ] Verify the local checkpoint with focused static checks, then obtain Railway log/device-delivery confirmation before release.
