# Membership handoff — Press Release filters and sorting

News feature implementation and its focused source, SQLite, routing and actual-component QA pass. This is the owner-authorized handoff point to the existing VPS Custom plans task `01a15619-1e59-7b10-808c-64676a438a33`. Coordinator remains `01a1ec9c-a655-7f01-aa7a-1024fa236e13`. Do not create another task or revive the archived Membership continuation merely to find this work.

## Owner-approved commercial behavior

- Capability key: `news.filters_sorting` (boolean).
- Owner-facing option: `Press release filters and sorting` under existing `Stock Press Releases` (`news.access`).
- Suggested description: `Filter news by ticker, market cap, date, news type, read status and summary availability, and choose its order.`
- **Leave enforcement off.** The owner has not yet restricted filters to premium. All existing news readers retain controls now, including readers without this capability in their plan. This is policy-off behavior, not a fabricated subscription grant.
- Register/configure this option through the established catalog and subscription-plan editor contracts. Do not automatically grant it, attach it to a named plan, change pricing, rewrite subscriptions, turn enforcement on or change live grants/policies.
- When the owner deliberately enables enforcement later, readers with `news.access` but without this capability retain the ordinary newest-first Press Releases feed and article drawer, without search/filter/sort controls. The server ignores advanced predicates and resets a restricted advanced view to the basic first page. Readers with the capability retain controls.
- Granting filters does not grant basic `news.access`; preserve the existing news-reading access rules and visibility delay. Notifications and notification delays remain independent. Browsing preferences never change notification subscriptions.

## Implemented interface

`NEWS_FILTERS_FEATURE` is exported from `src/modules/news/contracts/press-release-filters.ts`. `PressReleaseDashboardRepository.listPage` evaluates that exact key per authenticated user using the existing `evaluateMembershipFeature`. The page and `loadPressReleaseFeed` server action use this reader. Returned `filtersAllowed` controls UI visibility; the server independently chooses validated advanced filters or fixed defaults, so client flags cannot grant the capability.

Actual policy-engine tests verify the current absent/off policy resolves mode off, allowed true; selecting an enforced policy with no grant resolves allowed false. Reader tests verify denied capability keeps basic reading and discards forged advanced filters. No production policy/catalog row has been written by News.

Catalog registration may require a migration depending on the existing Membership design. Determine this explicitly. If a migration is required, the owner's release timing gate is after 20:00 America/Toronto on November 18, 2026. News itself adds no schema migration or index. Coordinate all integration/Git/release actions with the Coordinator; no independent publication.

## Required Membership QA and return

Verify plan-editor option grouping/labels, persisted draft/published plan feature, default-off rollout, no automatic pricing/grants/policy changes, eligible/ineligible readers after future enforcement, news-access dependency, expiration/removal, owner bypass consistent with existing policy, and unchanged notifications/delays. Return exact files/base/diff, test evidence and explicit migration requirement to Coordinator. Joint full-application/authenticated membership integration and release health checks remain required; News component QA does not claim those.
