# Workspace full Analyzer overlay plan

## Purpose

Open the complete, factual Trade Analyzer from the Analyzer icon in a
Workspace table row. The Analyzer fills the available Workspace screen as an
overlay, keeps the user in Workspace, and is designed as one reusable surface
that later buttons in a card, table, or chart can open with the selected
trade.

Progress is tracked in
[workspace-full-analyzer-drawer-progress.md](./workspace-full-analyzer-drawer-progress.md).

## Owner-reviewed interaction

1. Selecting the Analyzer icon in a Workspace trade row opens the full
   Analyzer immediately. It does not first open the right-side trade drawer.
2. The overlay has a close control and returns the user to the unchanged
   Workspace table when closed.
3. On all screen sizes, the overlay uses the available Workspace screen for a
   materially larger chart and detailed saved evidence.
4. The existing right-side drawer remains a three-tab surface, but its
   Analyzer-tab integration is deliberately deferred to a later slice.

## Facts and ownership

- The established Trade Analyzer route remains the sole source for saved
  chart data and detailed execution context.
- The established Daily Trade Analyzer chart remains the sole chart renderer.
  Its saved-candle interval aggregation is reused; interval labels must never
  be relabeled or inferred.
- The overlay loads saved chart code and detailed Analyzer facts only after a
  user opens it for a selected trade.
- The established detailed evidence remains visible: combined entry, combined
  exit, saved candle patterns, and green-to-red analysis. The underplanned
  Trade outcome presentation remains absent.
- Missing, pending, or unavailable saved analysis is shown as unavailable. No
  market fact, outcome, recommendation, or explanation is invented.

## Implementation boundary

This slice updates the reusable presentation component
`app/(dashboard)/workspace/workspace-trade-analyzer-panel.tsx`, wires it from
the existing Workspace table icon in
`app/(dashboard)/workspace/workspace-trade-library-client.tsx`, and updates
these tracking documents. It does not modify the side drawer, Workspace
trade-list reads, the Analyzer API, Moomoo access, migrations, storage, queues,
or another route.

## Delivery steps

1. Keep one client-side overlay component that accepts only a selected trade's
   display/read identity and an open/close contract.
2. Wire the Workspace table's Analyzer icon to that component.
3. Reuse the existing full chart and established evidence presentation without
   displaying the deferred Trade outcome summary.
4. Keep loading, unavailable, and transport-error states factual and recoverable.
5. Hold the side-card/tab trigger for its own owner-reviewed follow-up.

## Acceptance boundary

This is not visually accepted until the owner has reviewed it from the live
Workspace table. No test suite, server, deployment, migration, commit, or
publication is part of this design-first slice.
