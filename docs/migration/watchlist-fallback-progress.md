# Optional Watchlist fallback progress

[Plan](watchlist-fallback-plan.md). Owner-approved implementation complete; deployment/hosted acceptance pending.

- Confirmed old status promised an automatic fallback that did not run.
- Added selectors, persistence and one optional retry; primary/default and publication behavior preserved. Polling does not overwrite unsaved selector edits. Failed settings save does not apply new live configuration.
- Ten mocked service scenarios pass: Off, primary success, current/simple fallback success, both-fail and simple-fail cap, budget refusal, no-data preflight, ledger observer failure, and transport failure while configuration changes. Both request identities and attempt costs are retained. Generated admin JavaScript parses.
- Temporary persistence checks pass for default Off, explicit selection/effort, unrelated partial save, and switching back Off.
- Focused semantic comparison against exact parent and changed-file syntax are the checkpoint checks; existing missing local `sharp` is a baseline dependency limitation, not new source behavior.
- No hosted settings changed, paid requests, notifications or deployment.

## Release handoff

Runtime parent `5d0380275369735278fa628713bf280276b7e2cf`; Platform parent `acf7fc6166842dc3d4b86dac2d0d65c24f301dd8`, as confirmed by Coordinator. Runtime six-file delta: settings, service, manager, admin server, admin page, service regression tests. Platform three-file delta: this plan/progress and Watchlist Help. Immutable candidate preparation preserves mixed working trees and indexes.

No migration or environment change. Existing unused fallback environment value does not enable paid requests. Rollback drops the new optional fallback behavior; primary model/effort remain compatible with the model-options parent. Existing stored attempts remain intact. Hosted acceptance should verify Off by default, selected fallback/effort save+reload, names in current-status text and an owner-approved real generation only if requested. Actual paid API compatibility and visual hosted acceptance are not claimed by mocked tests.
