# TradersLink Scanner Alerts and Mobile Progress

## Status

Planned on 2026-08-22 at the owner's direction. No alert evaluator, scheduler,
notification, persistence model or public community page has been implemented
by this record.

Alerts are intentionally deferred. Community Scanner discovery, publishing and
sharing, My Scanners collections, and ratings/discovery filters are the next
product work before this plan starts implementation.

## Scanner alert model to perfect before implementation

An alert subscribes a trader to a defined scanner rule. It is not a copy of the
creator's credentials or a separate provider request for every subscriber.

1. A trader chooses a scanner from their My Scanners collection or a community
   scanner they have added to it.
2. They may choose one, two or three supported scanner conditions as the alert
   trigger and choose **all conditions** or **any condition**.
3. The first useful trigger is a **new match**: a symbol starts matching after
   not matching in the prior completed evaluation. Later alert types, such as
   a match leaving a screen, remain separate product decisions.
4. A per-user, per-alert, per-symbol cooldown prevents repeated notices while
   a symbol continues to match. A global evaluation window and daily delivery
   cap protect the market-data provider, notifications and trader attention.
5. The alert always records the exact scanner definition, evaluation time and
   matching symbols that caused the notice. It never records or sends another
   user's market-data token, broker data or private scanner collection.

## Delivery and evaluation boundaries

- Evaluation must reuse one bounded shared refresh per equivalent scanner rule;
  it must not poll once per person viewing or subscribing to the same screen.
- A persistent, account-scoped alert state and prior-match snapshot are needed
  before any scheduler is introduced. The current in-memory active-view cache
  is not an alert engine.
- Initial delivery should use the existing private in-app notification model.
  Push and Discord delivery are separate opt-in preference decisions and must
  reuse their existing consent/privacy boundaries.
- Market-hours schedule, evaluation cadence, API entitlement limits, retry
  policy, holiday handling and whether to allow more than three conditions
  remain owner decisions before an implementation plan is accepted.

## Mobile Scanner acceptance plan

- Target 360px and 390px widths first, then desktop. Text stays readable and
  scanner selection/filter/run controls keep at least the dashboard action
  target size.
- Ready-to-run scanner names use a wrapping, readable category layout; they are
  not reduced to tiny labels to show more choices at once.
- The custom filter builder stacks fields in a clear order on phones. It must
  not require a horizontal page scroll or hide the condition a trader selected.
- Scanner results use a mobile row layout: symbol and company remain prominent;
  price/change, volume, market cap and exact update time stay available without
  tiny columns. The full comparison table remains the desktop presentation.
- The mobile run/refresh control, active screen and result freshness remain
  obvious while results are being read. No fabricated data is used to prove the
  layout.

## Next checkpoint

- [x] Add a mobile Scanner library layout with readable two-column screen
  actions, 56px minimum action height and an obvious active screen.
- [x] Add a phone-specific result-row layout that keeps every current result
  field visible without a tiny or horizontally scrolling comparison table.
- [x] Move the ready-to-run Scanner library into a closable drawer. Phones keep
  the builder visible until the trader opens the library, then close that drawer
  after a screen is selected; categories remain easy to find as expandable
  headings with counts.
- [ ] Owner tests Scanner controls and results at 360px and 390px widths with
  live market data before mobile acceptance.
- [ ] Owner reviews and perfects the alert-trigger choices and community
  ranking rules before implementation begins.
- [ ] Design the separate Community Scanner home and My Scanners collection
  pages, including ownership, add-to-collection and rating boundaries.
- [ ] Implement only after the scanner data test and the above product choices
  are accepted.
