# Automatic analysis publication notifications

Owner approved October 6, 2026. Implementation complete; deployment and hosted acceptance pending.

- Add **Notify users when analyses publish automatically** below automatic publishing in AI Controls. Defaults on to preserve behavior.
- Off publishes automatic boundary replacements silently. On uses the existing member delivery path.
- Preserve automatic generation, review-before-publication, manual approval notification choices, and separate owner review alerts.
- Persist in existing Runtime settings; no database migration, secret or new AI call.

Verification: focused in-memory persistence checks cover ON/OFF, reload, unrelated saves and legacy defaults. Five changed Runtime TypeScript files pass syntax diagnostics; API/UI and automatic dispatch wiring checked. No broad suite, server, hosted mutation or test notification.

Runtime package is generated from d59756865440b34bc6e9bcd1ae56f5e5599ef0f6 by `src/scripts/package-watchlist-auto-notify.cjs`. Coordinator must reconcile onto its release parent and verify save/reload plus silent/notifying automatic publication after deployment. The separately held per-ticker notification checkbox placement remains separate.
