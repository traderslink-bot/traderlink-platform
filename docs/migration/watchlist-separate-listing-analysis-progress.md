# Separate listing and analysis progress

Controlling [plan](watchlist-separate-listing-analysis-plan.md).

- [x] Owner approved explicit listing without analysis plus listing notifications.
- [x] Owner approved Notify users for any analysis added to an already-listed ticker.
- [x] Traced row controls, AI Controls, approval API, runtime publication gate and
  current Platform cycle-only notification deduplication.
- [x] Recorded full scope, exact labels and initial failure-mode QA.
- [x] Coordinator reserved `0138_platform_watchlist_notification_action_identity`,
  exact predecessor 0137; runtime parent remains 94728c8101ba8f32d53de1f00c4b61ff0619d1ea.
- [x] Final storage design in separately reserved 0138; 0137 unchanged.
- [x] Runtime listing permission and saved per-analysis notification choice.
- [x] Listing-only publication and silent/notified analysis delivery.
- [x] Owner controls in both existing admin surfaces.
- [x] Revision-aware Platform notification events and delivery.
- [x] Focused verification and Help.
- [x] Runtime immutable checkpoint: `b8a8e62bef15080a006b6f14c835b0e3f9946dcf`,
  parent `94728c8101ba8f32d53de1f00c4b61ff0619d1ea`, 15-file allowlist.
- [x] Platform child checkpoint: `759b451e273ab841ebecaed368d7448e293cd5b9`,
  parent `49feda72d88b7a19dbbbc37e13ec61548c639b77`, 13-file allowlist.
- [x] Complete source/verification/allowlist/migration-risk handoff sent to Visible
  release coordinator. Implementation checkpoint complete; deployment is not claimed.

0137 and candidate 49feda72 remain immutable. Coordinator reports TypeScript and
0137 predecessor rehearsal passed; its production release remains separately
paused for owner migration/config/deployment authorization. This new slice must
not modify, substitute for, or imply release of that candidate.

The initial standalone action helper was superseded by the integrated event
contract and removed. Actual storage/reconciliation/delivery flow tests now cover
listing-only publication, silent approval, frozen retry choice, a distinct later
notified analysis, opt-outs and cancellation. No provider actions.
Read-only port
3010 check found no listener; no local runtime was started. Runtime file paths
are the canonical levels-system-post-mtf-handoff-stability project, not the
deprecated levels-system folder. Platform work remains in assigned e70f.

## Verification checkpoint

- Platform contract, store, flow and email scripts pass with in-memory databases
  and mocked transports. 0138 also rehearsed over populated 0137 tables:
  preferences, accepted intents, event IDs and delivered receipts survived;
  foreign keys and immutable event protection passed. No hosted migration ran.
- Runtime listing-only manager/store/policy/API checks pass, including no AI
  draft or image, duplicate retry, website callback acknowledgment, private later
  draft and saved silent choice after restart.
- Six existing combined activation/queue tests (premarket, regular, postmarket)
  pass after updating stale fixture expectations for existing Current format and
  linked Discord messages plus new queue metadata and explicit notified updates.
- Runtime no-emit TypeScript reported no errors in this slice; it is NOT a clean
  full-project result: local `sharp` declarations are missing and two existing
  image/cooldown test fixtures have unrelated type errors. Coordinator must verify
  the reconciled dependency-complete candidates. No dependencies were installed.
- First test-loader attempt hit Windows `uv_os_get_passwd` ENOMEM before tests;
  the existing process-only user-info shim allowed focused tests to run. The shim
  is not part of either allowlist.
- 49 focused runtime checks passed, including executable owner-row controls and
  generated editor script checks; six additional combined activation/queue flows
  passed. Live rendered acceptance remains a guarded release check, not claimed.
- Help updated; resolved blob `28e8da4fb03c8d62e49a4384b30707b1e77d256e`.
  Immutable handoff sent. Last UI adjustment preserved unsaved edits while listing
  and kept Discord recovery reachable when there is no AI draft; 12 UI tests passed.

## Release boundary

No real OpenAI calls, Discord posts, push/email sends, provider configuration,
local servers, pushes, hosted migrations or deployments occurred. Release needs
both the runtime and Platform follow-ups; the runtime should not expose the new
listing action before the Platform proxy and 0138 are ready. Existing 0137 rollout
is separately paused, so Coordinator must first establish that exact predecessor.
0138 renames event/delivery keys and rebuilds only the intent table to allow a
listing without an AI draft. It preserves rows but is not backward-compatible
with the old notification worker SQL. Guarded backup, stopped old workers and a
matching source/schema cutover are required; rollback must restore the paired
backup/source rather than run old code against 0138. No migration was applied here.
