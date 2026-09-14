# Selectable Simple analysis — Platform

Source integrated September 14 under owner approval to complete and deploy.
Release is coordinated with the canonical Watchlist runtime, not a new host.

- Current/Simple format is saved per read. Simple has a separate four-section
  card and inline editor; Current functionality remains available.
- Numeric ranges, owner-hidden sections and saved format survive preview/edit.
  Original and edited versions stay separate through the existing runtime audit.
- Removed unsupported dilution/listing standalone card sections, their inline
  controls and obsolete tooltip promise. Saved history remains readable.
- Left the previously disabled live-five-minute section disconnected.
- Watchlist Help updated for the selector and unchanged approval workflow.
- Four focused Node checks pass: old/new parsing, range rendering/editing,
  escaping/hiding, and syntax. This is not hosted visual acceptance.
- No local server, dependency install or Platform build. Coordinator must compile,
  deploy and verify health, and complete hosted owner-private draft acceptance.
- Deploy Platform support before runtime selector activation. Keep Current as
  default. Preserve existing staging-named runtime connection and search OFF.
- No migrations. Rollback must retain Simple parser/card support for saved reads.

Existing unrelated CSS, notice placement and older documentation changes in this
worktree remain excluded from this release commit. Reconcile only the committed
Simple/dilution/listing hunks into the freshly verified Platform main parent.
