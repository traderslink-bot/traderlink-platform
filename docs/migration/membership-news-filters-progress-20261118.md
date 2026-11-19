# Press release filters and sorting in Custom Plans

The News owner handed off the approved `news.filters_sorting` capability after its focused feature QA. The controlling contract is `docs/press-releases-membership-handoff-20261118.md` in `news-outbound-links-20261118`. Membership uses its existing Coordinator-assigned `membership-market-tools-integration` workspace on parent `92d7c4d7ffe58d0665bd2f5a68403ad64dc56939`. The current Coordinator received the workspace and scope before edits and confirmed the bounded assignment. The handoff contains only the new News diff from this parent. Earlier market-tool and Options work is outside this release slice. Coordinator owns Git preservation, final integration and any release.

## Implementation

- Add the boolean definition to the built-in feature catalog. The existing reader exposes it without writing data. Normal owner publication synchronizes missing definitions.
- Show one compact checkbox under Stock Press Releases in the existing unified editor. Persist its selection through normal draft and publication paths. Parent removal removes its nested settings.
- Supply shared brief and expanded copy. The default Stock Press Releases plan-card description mentions filters when selected.
- Keep the existing default-off membership policy. Existing plans receive no automatic selection, and publication does not assign members or set enforcement.

## Migration assessment

No schema migration or data backfill is required for this slice. The existing feature-definition and plan-feature tables accept the new key. Reading the catalog performs no writes. Normal owner publication synchronizes a missing built-in definition. Synthetic publication verified an identical SQLite schema before and after adding the selection and zero new policy, grant, subscription or Discord rule records.

## QA

- Thirty-three unique focused tests passed in four files, including six new real SQLite cases. They cover draft save/reopen/publication, preservation of existing plans, off/shadow/future enforced behavior, matching and missing grants, expiry/revocation, base-news dependency, owner bypass, notifications and both independent delays. Existing catalog lifecycle and notification tests passed. A later focused rerun of the six new cases verified the added schema-equality assertion.
- A disposable same-database integration used real Membership publication/grants and the actual News reader with SHA-256 `b5288645256ebc7695ddbada5b1026d5fda6bd0561f11822693e6b93ed2d088b`. It passed current-open advanced predicates, future enforced denial with a basic newest-first feed and first-page reset, eligible grants, revocation, visibility delay, and base-news dependency. External requests were disabled.
- Scoped TypeScript passed for seven changed code/test roots. ESLint found no errors and reported the two pre-existing unused-name warnings in `membership-product-features.ts`.
- The exact new nine-path diff applies to main `1806d747028b77e6f50f9dad0903f83555eb6233`. The first check found a neighboring Coaching-copy context mismatch. The News insertion was moved beside existing News settings, then the full applicability check passed. No earlier market-tool or Coach helper is required by these new hunks.
- Twelve actual editor component browser checks passed. They cover the unchecked nested checkbox, keyboard focus, selected-state preview copy, save/reopen, deselection, error/retry, parent removal, and Light/Navy Dark at 1440px and 390px without horizontal overflow. Synthetic save callbacks were used. The first standalone harness failed before launching a browser because it included an unrelated Next Discord server action. Adding the synthetic action boundary to the harness fixed it; the application source needed no correction for that harness failure.
- Browser execution acquired the actual shared feature marker and common flock after Chart released them. The browser/context and child closed cleanly with exit 0, and the controller released its own guards. Chart and Paid received the terminal handoff. The shared app preview was not changed.

Root must qualify the combined current source, authenticated member flow and release behavior. This local report establishes the new Membership slice and the synthetic reader integration.

The new diff and pre/post hashes are recorded in `docs/membership-news-filters-handoff-20261118.patch` and `docs/membership-news-filters-handoff-20261118.json`. These are handoff artifacts for Root's Git preservation. The source remains uncommitted as requested.
