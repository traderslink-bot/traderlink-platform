# Journal And Trade Tracker Help Coverage Progress

**Plan:** [Journal And Trade Tracker Help Coverage Plan](help-center-journal-trade-tracker-coverage-plan.md)

## Approved scope

- [x] Owner approved implementation without an intermediate guide-inventory or
  link-placement review.
- [x] Trade Explorer is deferred until its feature work is ready.
- [x] Swing Trade Tracker Help will describe its current basic beta state and
  invite useful feature suggestions without promising future features.
- [x] Daily Trade Tracker and Quick Trade Entry are documented as distinct
  workflows: one trading date per Daily Tracker save versus multi-date past
  execution entry in Quick Trade Entry.

## Implementation checklist

- [x] Correct Daily Trade Tracker manual-entry guidance and add the Quick
  Trade Entry cross-link.
- [x] Add Quick Trade Entry Help collection, routes, search and navigation.
- [x] Add Swing Trade Tracker beta notice and Help collection.
- [x] Add Calendar Help collection.
- [x] Add Open Positions Help collection.
- [x] Add Data Decisions Help collection.
- [x] Add Candle Review Help collection after the completion audit identified it as a supported Daily Tracker follow-up workflow.
- [x] Add Core Analytics Help collection after the completion audit identified the active Analytics Overview, Results, Timing and Execution pages as Trade Tracker fact surfaces without Help entry points.
- [x] Expand Import Trades Help coverage inside Notifications and imports.
- [x] Add the shared title and section question-mark Help links to covered
  feature pages.
- [x] Verify Help registry registrations, published route files and contextual
  targets with a static source pass.
- [x] Complete a low-resource formatting and integration pass without starting
  a server or running a broad test suite.
- [x] Audit visible dashboard and Help terminology, then replace Journal and
  Trader Intelligence product wording with Trade Tracker while preserving
  internal contracts and stable Help slugs.
- [x] Owner approved the integrated Help and terminology slice on 2026-08-10.

## Implemented coverage

- Added four Quick Trade Entry guides, four current-beta Swing Trade Tracker
  guides, four Calendar guides, three Open Positions guides and four Data
  Decisions guides.
- Added three Candle Review guides covering eligible completed trades, the
  on-demand review action, price-path feedback and availability limits.
- Added five Core Analytics guides covering the standard Analytics Overview,
  Results, Timing and Execution pages, their date-range behavior, coverage
  boundaries and the difference from Trade Analyzer.
- Added three normal Import Trades guides to the existing Notifications and
  imports collection without removing its existing notification or
  stopped-import guidance.
- Registered every new collection and article in Help navigation, Help Center
  start-page cards, search and Popular help.
- Generalized the approved Trade Analyzer question-mark control and added
  feature/section links for Daily Tracker, Quick Trade Entry, Swing Tracker,
  Calendar, Open Positions, Trading Rules, Rule Results, Trade Tags, Import
  Trades, Data Decisions, Candle Review and Core Analytics.
- The Swing Trade Tracker now carries this approved beta note: "Swing Trade
  Tracker is in early beta. Use the available workflow today, and share feature
  suggestions that would make your review more useful."
- The dashboard shell title area and lower navigation, metadata, accessible
  account-switcher label, feature pages, analytics copy and Help content now
  use Trade Tracker as the product-facing name. Existing Journal
  implementation names and stable Help links are unchanged.

## Boundaries

- No feature behavior, database data, migrations, external services, pricing,
  deployments or authentication configuration changes are part of this work.
- Existing Tracker, Analyzer, Rules and Tags Help content is reused where it
  already answers the question; it is not duplicated under a new collection.
- Existing unrelated working-tree changes remain outside this Help slice.

## Focused source verification

- [x] Source-only collection count: Quick Trade Entry 4, Swing Trade Tracker 4,
  Calendar 4, Open Positions 3, Data Decisions 4, Candle Review 3 and Core
  Analytics 5 guides. The existing Notifications and imports collection gained
  3 normal Import Trades guides.
- [x] Source-only route check: every new collection has its overview route and
  dynamic article route; registry navigation, search and Help Center start-page
  cards include every new collection.
- [x] Source-only contextual-link check: all Core Analytics question-mark
  targets resolve to a published Core Analytics guide and exact section anchor;
  existing covered feature targets were checked the same way during the first
  integration pass.
- [x] Full source-only Help-target audit: all 55 static product Help article
  targets resolve to a known published guide slug and, where used, a known
  section anchor. The source inventory contains 59 Help guide slugs and 243
  section anchors.
- [x] `git diff --check` reports no whitespace error. Git reports only the
  existing Daily Tracker file's CRLF-to-LF warning.
- [x] Owner final visual/product approval recorded on 2026-08-10. No local
  server, broad test suite, build or deploy was run for this slice under the
  low-resource working agreement.
