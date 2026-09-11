# Main Watchlist analysis review

Owner approved implementation on September 11, 2026. This is an additive workflow;
the existing AI Controls editor, audit and delivery recovery remain available.

## Controlling inventory

- Release Add after activation acknowledgement, independently of read refreshes.
- Automatically show review status and actions on each eligible ticker in its existing list.
- View / edit analysis opens the real TradersLink Analysis card with inline section editors.
- Edit text/prices, add/remove supported rows and setups, and hide/show sections.
- Save and close preserves a version without publishing; Close warns before discarding edits.
- Approve and publish is a separate row action and uses the saved, revision-pinned preview.
- Preserve original/audit, master/session review admission, manual refresh, and delivery safeguards.
- Do not change AI generation, request paid analysis, start local servers, or deploy this slice.

## Narrow source allowlist

Runtime: manual-watchlist-page.ts; new manual-watchlist-row-review.ts and focused test.
Platform: WatchlistRuntimeAdminClient; new inline editor and edit-model helpers/tests;
TradersLinkAiReadCard optional owner editor hooks only; display parser owner-empty evidence-ID compatibility; Watchlist Help; this progress record
and link from the Admin plan. Preserve pre-existing shared-file changes.

## Progress

- [x] Traced activation, existing review queue/save/preview/approve and owner relay.
- [x] Add acknowledgement separated from dashboard reads; reads bounded.
- [x] Main-row review actions and automatic status.
- [x] Actual-card inline editing and saved-version preservation.
- [x] Focused low-resource checkpoint (45 checks plus bounded owner-component semantic check).
- [x] Narrow local checkpoint (Platform commit containing this record; Runtime `fb85207`).
- [ ] Owner visual acceptance on hosted app after a separately authorized release.

No deployment, migration or OpenAI request is part of this implementation checkpoint.

QA caught an existing mismatch: owner-save clears scenario evidence IDs, while the
display parser required nonempty IDs. The parser now accepts an empty ID list;
generation evidence validation is unchanged. The preview clears those scenario IDs
in the same way as owner-save and retains all immutable original/audit data.

## Verification and release boundary

- Runtime row/Add and existing panel: 10 passing checks.
- Runtime review authorization, owner edits and publication preview: 19 passing checks.
- Platform editor model/modal, real-card rendering and preview contract: 16 passing checks.
- TypeScript semantic check: owner editor, wrapper and imported helpers; large public
  page isolated at its declared card-props boundary. Actual public card also transpiled
  and executed by focused rendering checks. This is not a full-app TypeScript/build claim.
- No local server, browser rendering, broad suite, OpenAI call, live publication or deployment.
- The ten real-card checks also passed against the selectively staged card, excluding
  pre-existing title/notice/layout changes. Those unrelated edits remain unstaged.
- Both Runtime and Platform changes are required. Release Platform first or in a coordinated
  slot before enabling the Runtime row buttons; the old AI Controls workflow remains available.
- No schema/migration/configuration changes. Existing review/session settings stay unchanged.
- Hosted visual acceptance still needs desktop/mobile card editing and real row lifecycle
  checks after a separately authorized release. Do not describe local checks as live acceptance.
