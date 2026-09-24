# Trader notes progress

Status: implementation and focused offline QA complete. Integration, hosted build and live acceptance pending. Not deployed.

Plan: [approved scope](watchlist-trader-notes-plan.md).

Source trace: runtime owns activation, persisted WatchlistEntry, review cycles, listing-only approval, Discord delivery and the embedded owner console. Platform owns member card rendering and push/email approval reconciliation. Existing listing-only approval is the integration point, not a second publisher.

Verified integration parents supplied by Visible release coordinator: Platform 67eadb8ee6264c8205b06369074e7a975bd9e217; runtime 68a7e0b2ecb3db289dc9d7425d885c240508231a. Runtime remains the staging-named live service; no environment move. Existing dirty source and pending wording-only commit d1710014 are preserved.

Plan QA: explicitly covers persistence, no background spend, private drafts, later manual review, existing public notes versus unsaved draft, reactivation, notification opt-out, plain-text safety and current compact list behavior.

## Implemented

- Generate analysis checkbox next to Symbol, checked initially. Unchecking reveals My notes instead of the private OpenAI instruction field. A private review cycle is created even when global/session generation is off.
- Per-ticker automatic-analysis choice and notes draft persist through the existing Watchlist store. All non-manual AI triggers stop for opted-out tickers. Manual Generate analysis remains subject to the existing master/session settings.
- My notes row editor: Save draft, Close, and Publish notes after listing. Drafts remain private. Explicit notes updates publish only that plain-text card and do not notify. Empty published text removes the card. 12,000-character transport/UI bound.
- Initial Publish ticker without analysis freezes saved notes in the existing publication record. Notify users for ticker-only post defaults checked; off propagates through Discord and Platform push/email proof. Existing retry/idempotency handling remains.
- Later generated analysis stays owner-review held. Approval reveals the analysis without copying any newer notes draft; published notes remain. Existing Notify users controls cover the later analysis announcement.
- Member card: Trader notes, full card-grid width on desktop/mobile, preserved line breaks, long-text wrapping, React text escaping. No hidden analysis placeholder for notes-only listing.
- Help updated for members and owner workflow. No new database migration or AI prompt/model change.

## Verification

- `src/scripts/verify-watchlist-trader-notes.cjs`: nine focused offline scenario groups pass, using exact candidate source, actual persisted review/store logic in disposable fixtures, actual selected manager methods with provider/delivery doubles, authenticated API dispatch and React static rendering. Includes later analysis publication blocked before owner approval, then correctly enabled after approval.
- Every changed TypeScript/TSX file transpiles without syntax errors; every generated admin inline script parses.
- Targeted ESLint of six changed Platform TypeScript/TSX files: zero errors; existing unused cleanLevelMapCardBody warning only.
- QA corrected initial listing notification validation to permit explicit opt-out and confirmed no newer private notes draft enters later approved analysis.
- No OpenAI/Moomoo requests, live ticker additions, Discord/email/push sends, local server, broad suite or production build were run. Offline checks are not hosted/device-delivery proof or full-project type checking.

## Handoff and remaining acceptance

Source-preserving commits are assembled directly from the confirmed release parents, not the mixed e70f checkout or dirty runtime checkout. Coordinator owns integration and release. Platform must deploy before runtime so the new notes card renders and the owner notes API proxy is available before controls are used. Both releases are required; no migration. Pending wording-only commit d1710014 is separate and must remain preserved.

Hosted acceptance after owner release approval: add one unchecked ticker, save/edit notes, verify zero AI attempts and no member visibility before publication; publish with notifications off, verify notes/levels/indicators and no analysis card; generate/review/approve later analysis, verify published notes survive and newer notes draft stays private; exercise opted-in notification delivery with owner-approved test audience. Verify small-screen modal/card layout without starting a local server.

## General Watchlist extension and final local checkpoint

Owner selected General Watchlist, approved the explanatory tooltip and bidirectional Move to List behavior, then authorized coordinator production handoff.

- General is now accepted by activation/move APIs, runtime/Platform group normalization, disk state persistence, publisher and audit serialization. Admin has add/move options and its own section; member listing has a matching section/count and approved tooltip. Native expandable information controls work by click/tap/keyboard and use themed member colors.
- Move is now a placement-only patch, not activation. Existing notes, approved analysis/review identity, original time and per-ticker settings remain; no AI schedule, thread operation or notification. Private tickers stay private after moving. Automatic-selector entries become manual when deliberately moved, matching prior pinning behavior.
- Final QA found and corrected two integration gaps before release: actual disk serializer needed the notes/opt-out fields, and the old Move implementation could schedule analysis when moved into Top Regular. Eleven offline scenario groups now pass, including actual disk save/load and all six General-to/from-existing-category transitions.
- Both combined replacement commits supersede the earlier local 24709005/06cad8e1 package; do not apply both versions. Pending d1710014 wording correction remains a separate three-file change for coordinator reconciliation.
- No migration. Preserve all existing production state/notes and compact-list performance changes. Platform first, then runtime; hosted build, health and owner-audience acceptance are still required. Runtime rollback to the old parser is unsafe after General entries are saved because it does not recognize the new group: use a forward correction or first reconcile General entries with owner approval, never discard the state file.
