# Notification Coverage Expansion Progress

**Status:** Locally accepted; hosted-only activation gates remain

**Controlling plan:** [Notification Coverage Expansion Plan](notification-coverage-expansion-plan.md)

## 2026-08-18 planning checkpoint

- [x] Audited the current Platform notification contract, durable event
      writers, Moomoo job scheduler, AI Review issuance path, Journal Data
      Decisions creation path, Account Settings preferences, and existing
      notification/import plan.
- [x] Confirmed current in-app coverage for statement imports, terminal Moomoo
      import outcomes, and AI statement-repair lifecycle updates.
- [x] Identified missing exact event writers for issued AI Reviews, standalone
      Data Decisions, Moomoo reauthorization, and hosted final chart updates.
- [x] Identified and contained automatic-sync noise: current 15-minute Moomoo
      sync completion must not alert when it finds no trader-visible change.
- [x] Owner approved the coverage matrix, coalescing rule, and two new Account
      Settings categories on 2026-08-18.
- [x] Added migration `0063_platform_notification_coverage`, extending the
      immutable notification vocabulary without rewriting the accepted `0053`
      migration. Existing events, read receipts, and opt-ins are preserved;
      the two new Discord categories default off.
- [x] Wired a fresh issued periodic AI Review to one in-app ready event, keyed
      to the immutable issued-review identity. Reopening a saved review does
      not create another event.
- [x] Changed Moomoo completion behavior so first/older history imports report
      their terminal result once, while a 15-minute incremental sync reports
      only when it accepts new Journal executions or opens review work.
- [x] Added one Moomoo reauthorization-required event per active-to-reconnect
      transition and a standalone Data Decisions event when a saved manual
      Trade Tracker batch creates new unresolved factual work.
- [x] Added the approved **Broker connection** and **Data Decisions** Account
      Settings labels and aligned the Notifications and Discord Help guides.
- [x] Completed a focused source review of the notification vocabulary,
      migration registration, durable event keys, and category-label consumers.
- [x] Created a private pre-0063 online backup and independently restored it
      with matching registry, schema, table-count, page-geometry, and recovery
      authority evidence. Applied `0063_platform_notification_coverage` to the
      configured local database; the completed-migration integrity gate passes.
- [x] Owner approved the completed local notification work and the two new
      Settings choices on 2026-08-18. Do not start a server, open the private
      Journal database, or activate Discord delivery as part of this local slice.
- [ ] Wire final eligible AI Review failure only after a bounded terminal retry
      contract exists. Current issuance returns retryable failures, so an alert
      now would be premature.
- [ ] Wire final Moomoo chart-update events and Discord delivery only after
      their separate hosted scheduler and bot activation gates are accepted.
