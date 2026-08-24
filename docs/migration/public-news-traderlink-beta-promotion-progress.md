# Public News TradersLink Beta Promotion Progress

**Status:** Implementation active

**Linked plan:** [Press Release Dashboard Plan](press-release-dashboard-plan.md)

## Approved scope

- [x] Remove the Academy course cards and Learn Market Structure with Smokey image from every public News article sidebar.
- [x] Keep each article's headline, summary, facts, positives and negatives unchanged.
- [x] Add one shared right-sidebar TradersLink Beta App promotion after Company Info and any article-specific access card.
- [x] Use the owner-approved dark navy card with raised white feature cards.
- [x] Give Daily Trade Tracker and Trade Analyzer the most visual weight.
- [x] Use concise, trader-facing summaries for Daily Trade Tracker, Trade Analyzer, Smart Rules, Press Release Alerts, Trade Explorer and Analytics so the sidebar remains a compact advertisement rather than an article.
- [x] Replace the earlier Coming soon section with the approved Discord beta-access message and a `LOG IN NOW!` link to the dashboard's existing Discord sign-in path.
- [x] Exclude membership tiers, pricing, Free and Premium claims.

## Files

- `app/news/[ticker]/[slug]/page.tsx`
- `app/globals.css`
- `docs/migration/press-release-dashboard-plan.md`
- this progress record

## Verification and handoff

- [x] Focused ESLint and whitespace checks pass for the News article component and promotion styles.
- [x] The local article route returns HTTP 200 after the local database's pending migration completed.
- [ ] Confirm the deployed desktop and mobile presentation matches the owner-selected reference: fixed small circular icons, raised feature cards, and the centered Discord call to action.
- [ ] Confirm the deployed Discord sign-in redirect and member access gate.
