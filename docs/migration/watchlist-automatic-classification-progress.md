# Watchlist automatic analysis classification correction

## Owner scope and status

Owner-authorized investigation, implementation, focused QA and production
handoff on October 27, 2026, America/Toronto. The temporary read-only hold was
explicitly lifted for this narrow correction. The earlier notification-price
copy release stays intact; the standalone recap remains plan-only.

Implementation and focused QA are complete locally. Coordinator owns Git,
release serialization and final deployed-source/health verification. This
record is the pre-release checkpoint, not a claim of live deployment.

## Recorded BRAI evidence

Coordinator executed bounded read-only probes on Runtime deployment
`b70b2134-2082-478e-9e14-01a4d949c6e3` and Platform deployment
`f63d789e-aa8a-434a-94bd-4f6feed69f10`. Runtime's complete 22-event BRAI review
chain passed integrity checks. No credentials, recipient identities, endpoints,
private URLs or actual review/message identifiers are copied here.

All times below are Eastern Time on October 27:

| Observation | Recorded fact |
| --- | --- |
| Admin activation | 8:45:05 AM; one current review cycle. |
| Initial analysis publication | Approval revision 6 at 8:59:05 AM; website acknowledged it; notification kind was listing with analysis included. |
| Original push dispatch | Nine deliveries accepted by the push provider at 8:59:34–8:59:54 AM, each in one attempt. |
| Category move | Main to Overnight at 7:08:02 PM, during boundary generation; same cycle preserved, move notification off. |
| Second analysis publication | Automatic approval revision 16 at 7:11:04 PM; frozen Runtime context had previous-analysis true, automatic true and the Overnight note. |
| Actual Discord readback | Unedited second message at 7:11:05 PM read “BRAI Analysis updated — Auto updated by AI.” It was not labelled first analysis. The original message readback was unavailable (404). |
| Platform event | Accepted at 7:11:16 PM for the same cycle/revision, but saved previous-analysis false and lost the category note. |
| New push dispatch | Nine deliveries accepted by the provider at 7:11:30–7:11:45 PM, each in one attempt. |

There is no hours-long server dispatch delay in those records. Provider
acceptance is not device receipt/display evidence. Exact historical push text
is not stored by these tables, and the owner's phone display time is unknown.
The later event's saved flag selects first-analysis wording in the formatter;
that is a source-based reconstruction, not a retrieved historical push body.
It is consistent with the report, without proving which phone alert was seen.

## Cause and narrow correction

`getAutomaticAnalysisEvents()` emits a deliberately compact approval plus
website-acknowledgement projection. It omitted the frozen
`analysisUpdateContext` as well as earlier approvals and analysis cards.
Platform then reconstructed classification from that incomplete history and
incorrectly derived no previous analysis. Runtime's full-history Discord path
was correct. The move itself did not reset BRAI's review identity.

The production correction is confined to
`src/lib/monitoring/manual-watchlist-runtime-manager.ts`: include
`analysisUpdateContextFromReview(review, event.revision)` in the compact
publication before handing it to Platform. That helper preserves saved
classification; where older context is absent it has the full acknowledged
history here, not the receiver's truncated history. The receiver already
understands this optional field. No Platform application change or migration
is required. Do not export full cards/history as a workaround.

No ticker-specific condition, review-cycle replacement, new publication
identity, approval rule, AI request, recipient selection, timing policy,
channel/tag change or setting is introduced. Manual/Discord behavior and the
reference-price removal remain unchanged. Existing documentation describes the
intended distinction correctly; no Help text change is required for this bug.

## No replay or historical rewrite boundary

- Do not update past notification events, frozen approvals, delivered messages
  or recipient snapshots.
- Do not manually rerun reconciliation, regenerate analysis, backfill events,
  resend, delete or edit Discord messages, or create a live test notification.
- Existing event IDs, approval revisions, expiry and acknowledgement semantics
  remain unchanged. A repeated accepted event is still a duplicate, including
  if a newer projection contains a corrected flag.
- Future naturally eligible approvals carry the correct context. A new
  approval can notify under existing settings; deploying this change is not
  an instruction to notify about an old approval.

## Verification

- Runtime: 35 focused tests passed across the automatic publication-context,
  analysis-update, publication-preview, review-store and review-policy suites.
  The strengthened four-test producer suite also passed after final assertions.
  Full `tsc --noEmit -p tsconfig.json` passed.
- Platform: 19 native CJS tests passed across automatic classification,
  notification price copy and mocked move/Free Chat delivery. New test lint
  and source whitespace checks passed.
- Sanitized recorded metadata reproduces the prior lossy projection; tests
  invoke the actual event producer, retain the saved context/category note,
  reject private-card export, exercise arbitrary symbols and older context,
  preserve genuine first analysis after listing-only, and retain manual update
  classification.
- Repeated moves/polling preserve event identity. In-memory outbox regression
  proves that an already delivered historical false flag is not rewritten or
  replayed, while only a new eligible approval creates one new pending item.
- A prior broader 47-test Runtime run had 45 passes and two unrelated existing
  API-harness failures (stale read-call ordering/mocks). Both unchanged API/test
  HEAD bytes reproduced the failures without invoking the changed producer;
  they are not silently counted as passes or included in this correction.

No live test send or provider/AI request was made by feature QA. The two
authorized hosted evidence probes only read data; Discord evidence used GETs.
The sanitized fixture contains metadata and explicit synthetic body-presence
markers, not an invented/replayed market analysis or a full original packet.

## Immutable handoff scope

Runtime parent `a541b8f2640ae6fbd028db69164483543f2e3667` in
`/home/traderlink/projects/watchlist-gain-runtime`:

- `src/lib/monitoring/manual-watchlist-runtime-manager.ts`
- `src/tests/watchlist-automatic-publication-context.test.ts`
- `src/tests/fixtures/brai-notification-provenance.json`

Platform parent `1e30afcb5207c0ca810a41856ccf060273bee5c1` in
`/home/traderlink/projects/watchlist-gain-card`, verification/record only:

- `src/modules/watchlist/server/notifications/__tests__/watchlist-automatic-classification.node-test.cjs`
- `docs/migration/watchlist-automatic-classification-progress.md`

Only the Runtime needs a production source release. Platform tests/docs can be
checkpointed without pushing a watched branch or rebuilding the live Platform.
Exclude and preserve both untracked BRAI probe scripts, preexisting
`public/sw.js` changes and the standalone recap plan (unchanged SHA256
`ca2952862e690d47c44c8398dcb9f92673bff3e503d7a26356fad97f2f02c0db`).
Coordinator rechecks exact source parents/concurrent state, allowlists and
hashes, then returns commit, parent, complete paths, deployment and health
receipts. No worker Git mutation or live deployment is represented by this
checkpoint.
