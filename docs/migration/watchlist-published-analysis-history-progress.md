# Previous published Watchlist analyses

Owner scope: add Previous analyses beside a ticker in Watchlist Admin. Show the
original published card and published updates during its current Watchlist stay,
using the real ticker-detail card design so the owner can take screenshots.
Do not regenerate, edit, approve, publish, notify or retrieve old activations.

## Source and implementation

Coordinator assigned Platform `/home/traderlink/projects/watchlist-analysis-history`
at `760e754e2e5755e5b47cefaa82c54f39bc538d48`, and Runtime
`/home/traderlink/projects/watchlist-history-runtime` at
`7b925e04ea0bc4b10a8968fc78420ae36672546e`. Old dirty workspaces remain intact.
Git preservation, integration and release remain Coordinator-owned.

- Runtime adds one secondary Previous analyses button beside View / edit analysis.
  It sends a same-origin dashboard message containing ticker and current review
  identity. It does not request analysis or call any mutation endpoint.
- The lazy-loaded owner dialog makes one existing owner-authorized GET to the
  current review endpoint. It rejects a response for a different activation.
  The existing owner/session gate is unchanged; there is no new public endpoint.
- Projection includes only approval snapshots with acknowledged website delivery,
  with matching ticker and current cycle. Drafts, listing-only publications,
  hidden analysis, Discord-only delivery, failures and old cycles are excluded.
  Repeated unchanged approvals/receipts are deduplicated. Published edits with
  different text, notes or visibility remain separate versions.
- Card JSON remains byte-identical to the saved publication. The actual shared
  TradersLinkAiReadCard and SimpleAnalysisCard render it. Optional historical
  timeline props prevent the nested card from fetching today's timeline. Other
  consumers retain their existing behavior. No live market context is supplied.
- Original notes and recorded visibility accompany each snapshot. Display
  settings that were not recorded cannot be reconstructed as historical facts.
- Standard and expanded views use the existing card styles and theme, with
  loading, empty, retry and close states. Selection controls sit outside the card.
  Requests are aborted on close; no per-version request or polling is introduced.

## Recorded boundary

Normal refreshes retain the current review cycle, including earlier approvals.
Moving to Private can start a separate cycle. Actor text alone is not sufficient
to prove activation continuity, so this viewer never follows a parent actor link
or queries ticker-wide archives. Private-transition and legacy-replacement records
show an explicit incomplete-history notice. Missing original snapshots are never
replaced with a draft, current read, guessed data or a new generation.

## Verification

Passed:

```
node src/lib/live-watchlist/__tests__/owner-published-analysis-history.node-test.cjs
node src/lib/live-watchlist/__tests__/owner-analysis-rows.node-test.cjs
node src/lib/live-watchlist/__tests__/analysis-inline-edit.node-test.cjs
node src/lib/live-watchlist/__tests__/owner-published-analysis-history.node-check.cjs
```

Twelve history tests cover published-only/current-cycle selection, immutable
edited content, listing and failed-delivery exclusions, deduplication, notes,
Simple format, malformed snapshots, private-continuity limitations, actual viewer
load/select/close behavior and stale-activation rejection. Actual Simple card SSR
verifies original notes, prices and frozen timeline. Existing six row and four
inline-editor tests pass. The bounded semantic check covers history projection,
dialog and actual Simple/timeline components; the large public-page import is
isolated at its declared card-props boundary, not claimed as a full-app compile.

Runtime embedded-script syntax and synthetic button-click checks pass: one
same-origin message with expected ticker/cycle, no request or mutation. Targeted
ESLint has zero errors (one existing unused-helper warning in the public page);
diff checks pass. Help owner instructions updated. React checklist:
lazy loading, cancellable GET, stable version keys, labeled selector/dialog,
error/empty states, no new per-row polling, existing theme/components retained.

No server, provider or real notification was started. Browser visual acceptance,
full integration build and deployment are not claimed by these offline checks.
No schema migration or stored publication change is required. Ready for
Coordinator source preservation; deployment requires its normal release gate.
