# Private Watchlist owner pilot progress — 2026-11-22

## Scope

Private Watchlist remains a two-account production pilot while the wider Community rollout is paused. The restriction reuses the existing server-derived Watchlist dashboard predicate and its hosted Discord-subject custody. It does not add another account list or change that shared predicate.

## Implementation

- Gate the `/private-watchlist` server page before any Watchlist database read.
- Gate both Private Watchlist server actions before any generation, read, write, allowance, billing, or settlement operation.
- Hide the Private Watchlist navigation item for identities outside the same gate.
- Preserve the existing membership-feature and allowance checks for admitted accounts.
- Keep named-list work, Community routes, shared configuration, provider callbacks, billing, data, and internal settlement unchanged.

## Verification

- Focused fixtures cover both configured active accounts, an ordinary signed-in account, and a revoked configured identity.
- Source-boundary checks cover the direct page, both actions, authentication-before-gate ordering, gate-before-data ordering, and navigation.
- Signed-out requests remain denied by the existing required Platform identity boundary before the pilot predicate is evaluated.

## Help Center review

No Help Center guide change is required. This is a temporary availability restriction for an unreleased pilot, not a change to the feature's member workflow or commercial contract.

## Release boundary

This workspace must not deploy. The Release Coordinator owns private production account verification, integration onto the current release parent, hosted verification, and release ordering.
