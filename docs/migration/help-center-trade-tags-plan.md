# Trade Tags Help Center Plan

**Status:** Complete on 2026-08-10 under the owner's delegated final acceptance.

**Progress:** [Trade Tags Help Center Progress](help-center-trade-tags-progress.md)

**Authoring standard:** [Help Center Guide Authoring Standard](help-center-guide-authoring-standard.md)

**Related product record:** [Trade Tag System Plan](../trade-tag-system-plan.md)

## Outcome

Add **Trade Tags** as a complete Help Center collection using the existing
Help design. Explain how traders label individual trades with presets or their
own wording, manage reusable tags, use tags with Day and Swing trades, and
understand where saved tags can and cannot be used.

## Guide inventory

1. Getting started
2. Add and edit trade tags
3. Preset tags reference
4. Create and manage custom tags
5. Use tags in Swing Trade Tracker
6. Where tags are used
7. Data availability and limitations

## Product and writing boundaries

- Tags describe individual trades or supported Swing positions. They are not
  ticker-wide or day-wide labels.
- The trader chooses every tag. TraderLink does not infer a setup, mistake,
  emotion, market condition or process result from executions or P/L.
- Tags do not change executions, trade construction, P/L, Rule results or
  Analyzer results.
- Preset names are convenient starting choices, not automatic findings.
- Use **Trade tags**, **Add tags**, **Edit tags**, **Manage tags**, **Create
  tag** and **Save tags** as they appear in the product.
- Explain current availability honestly. Do not claim tag-based Analytics,
  filters, bulk tagging or automatic suggestions are available.
- Use ordinary language and generic examples without exposing private account
  or trade information.

## Routes

| Route | Page |
| --- | --- |
| `/help/trade-tags` | Collection overview |
| `/help/trade-tags/getting-started` | Getting started |
| `/help/trade-tags/add-edit-tags` | Add and edit trade tags |
| `/help/trade-tags/preset-tags-reference` | Preset tags reference |
| `/help/trade-tags/custom-tags` | Create and manage custom tags |
| `/help/trade-tags/swing-trade-tracker` | Use tags in Swing Trade Tracker |
| `/help/trade-tags/where-tags-are-used` | Where tags are used |
| `/help/trade-tags/data-availability` | Data availability and limitations |

## Integration

- Add the collection to the Help start page and collapsible Help navigation.
- Index the overview, all guides and every section in Help search.
- Add one high-frequency Tag answer to Popular help.
- Link the existing Daily Trade Tracker tag section to the complete collection.
- Use stable slugs, section anchors, metadata, breadcrumbs and previous/next
  navigation through the shared Help components.

## Acceptance

- The collection overview and seven guide routes render in the existing Help
  design.
- All 41 preset tags are documented under their seven visible categories.
- Day trade assignment, Swing assignment, creation, selection, saving,
  renaming, retirement, assignment counts and limits are explained accurately.
- Help search and navigation find every guide and section.
- Focused lint and type checks, static registry checks, route compilation and
  bounded desktop/mobile browser checks complete or an unrelated repository
  failure is recorded exactly.
- One narrow local commit contains only the Trade Tags Help files and related
  documentation.
