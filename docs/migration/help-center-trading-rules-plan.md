# Trading Rules Help Center Plan

**Status:** Complete under the owner's delegated final acceptance on 2026-08-10.

**Progress:** [Trading Rules Help Center Progress](help-center-trading-rules-progress.md)

**Authoring standard:** [Help Center Guide Authoring Standard](help-center-guide-authoring-standard.md)

**Related product plan:** [Trading Rules Evidence And Results Plan](trading-rules-evidence-and-results-plan.md)

## Outcome

Add **Trading Rules** as a complete Help Center collection using the existing
light Material Help template. The collection explains preset rules, custom
rules, Daily Trade Tracker review, automatic evidence, Rule Results, history
and unavailable states in language intended for an ordinary trader.

## Guide inventory

1. Getting started
2. Add and manage preset rules
3. Preset rules reference
4. Create and manage custom rules
5. Review rules in Daily Trade Tracker
6. Understand rule results
7. Use Rule Results and history
8. Data availability and limitations

## Product and writing boundaries

- Explain what the trader sees and what they can do next.
- Use **Trading Rules**, **Daily Trade Tracker**, **Rule Results**, **Preset**,
  **Custom**, **Followed**, **Broken**, **N/A** and **Not selected** exactly as
  the product uses them.
- Do not expose database, migration, evaluator, repository, digest, internal
  identity or implementation terminology.
- Preset rules remain automatic after the trader activates them. Help never
  asks the trader to confirm or explain an automatic result.
- Custom rules remain manually reviewed. Not selected is counted without
  assuming why the trader did not choose a result.
- Rule Results reports facts and never recommends keeping, changing or
  removing a rule.
- Describe P/L, fees, missing facts, chart availability and version history
  honestly. Do not replace unavailable information with zero or a guess.
- Use generic examples only. Do not expose real user, account, broker or trade
  information.

## Routes

| Route | Page |
| --- | --- |
| `/help/trading-rules` | Collection overview |
| `/help/trading-rules/getting-started` | Getting started |
| `/help/trading-rules/manage-preset-rules` | Add and manage preset rules |
| `/help/trading-rules/preset-rules-reference` | Preset rules reference |
| `/help/trading-rules/custom-rules` | Create and manage custom rules |
| `/help/trading-rules/daily-trade-tracker` | Review rules in Daily Trade Tracker |
| `/help/trading-rules/understand-results` | Understand rule results |
| `/help/trading-rules/results-history` | Use Rule Results and history |
| `/help/trading-rules/data-availability` | Data availability and limitations |

## Integration

- Add the collection to the Help start page and expandable Help navigation.
- Index every guide and section in Help search.
- Add one useful Trading Rules result to Popular help.
- Link the existing Daily Trade Tracker rules section to the complete Trading
  Rules collection.
- Reuse the shared collection overview and article renderers without creating
  another Help layout.
- Preserve stable section anchors, metadata, breadcrumbs and previous/next
  navigation.

## Acceptance

- All eight guides and the overview route render in the existing Help design.
- Every current preset is documented by its visible product name.
- Preset and custom workflows, lifecycle changes, Daily Tracker evidence,
  grouped chart markers, Rule Results, versions and limitations are covered.
- Search and Help navigation find every guide and section.
- Desktop and narrow-mobile pages have no error overlay or horizontal page
  overflow.
- Focused lint, type checking, route/link checks and the final production build
  complete or any unrelated repository baseline failure is recorded exactly.
- The feature and its documents are preserved in one narrow local commit.
