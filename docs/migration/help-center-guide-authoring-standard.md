# Help Center Guide Authoring Standard

## Purpose

This file is the reusable standard for adding or changing TraderLink Help
Center collections. A feature-specific Help plan may add stricter factual
requirements, but it does not replace this standard.

## Start from product truth

- Read the accepted feature plan, progress record and current user interface
  before writing Help content.
- Confirm every visible label, choice, result, limitation and destination from
  the current product. Do not document planned behavior as if it is available.
- When a mutable fact is owned by another service, link the trader to that
  source instead of copying a price, trial, schedule or feature list that can
  become stale.
- Use generic examples and never copy private account, broker, payment,
  statement, trade or identity information into Help content.

## Write for an ordinary user

- Begin with what the feature does and why the user would open it.
- Use the exact user-facing product labels and ordinary trading language.
- Prefer short sentences, direct steps, small tables and concrete examples.
- Explain what a result means, where it came from and what the user can do on
  the page. Do not explain internal code or storage architecture.
- Never expose internal database names, IDs, migrations, queues, providers,
  repositories, digests, permission codes, status codes or implementation
  terminology.
- Do not invent causes, facts, advice or certainty. Keep missing information
  visibly missing and explain unavailable states honestly.
- Separate facts from interpretation. Do not make predictive, causal,
  financial-advice or product-recommendation claims unless the approved
  feature explicitly provides them.

## Collection structure

- Reuse `HelpCollectionOverview`, `HelpArticle` and the shared `HelpGuide`
  content model. Do not create a second Help layout or local dashboard shell.
- Give the collection one clear top-level Help navigation item and one Help
  start-page card.
- Give each guide a stable slug, clear title, one-sentence description and a
  small set of sections that match real user questions.
- Give every section a stable, descriptive anchor ID, a short summary, useful
  search keywords and content built from the shared paragraph, bullet, step,
  callout, link or table blocks.
- Keep collection navigation collapsible. The active collection may open
  automatically; other collections must not turn the sidebar into one long
  list.
- Add metadata, breadcrumbs, previous/next guide navigation and appropriate
  links back to the product page.

## Search and cross-links

- Add the collection overview, every guide and every section to the central
  Help registry so search can open the exact answer.
- Use plain aliases that users may type, including common abbreviations and
  alternate phrases, without leaking internal names.
- Add a Popular help entry only for a likely high-frequency question.
- Link related collections at the most useful exact guide or section. Keep a
  short workflow explanation in the original collection and place the full
  reference in the feature's own collection.
- Treat published slugs and section IDs as stable links. Do not rename or
  remove them casually after publication.

## Design and accessibility

- Match the approved light Material dashboard and existing Help templates.
- Keep one page `h1`, logical section headings, semantic lists and tables,
  visible focus, readable contrast and meaningful link/button labels.
- Keep desktop and mobile navigation usable, touch targets practical, tables
  scrollable inside their own container and the page free of horizontal
  overflow.
- Do not add screenshots until the matching feature design is owner approved.
  Update or remove a screenshot when the visible product changes.

## Project records and verification

- Create a feature-specific plan and progress record in `docs/migration/` and
  link them from the relevant product or migration record.
- Keep the progress record current while implementing. Record owner approval
  and exact verification results rather than claiming a broad gate passed.
- Verify registry uniqueness, guide/section counts, search IDs, navigation
  links, route metadata, static paths and cross-links.
- Run focused lint and type checks first. Because new Help routes affect the
  application build, run the final build at the acceptance boundary unless a
  documented unrelated repository baseline prevents it.
- Complete bounded desktop and narrow-mobile browser checks for the overview
  and representative long articles, including navigation, anchors, console,
  error overlay and horizontal overflow.
- Stage only the explicit Help files and related documents. Preserve unrelated
  concurrent work and create one narrow local commit when the slice is
  complete and approved or when the owner has delegated final acceptance.
