# Journal And Trade Tracker Help Coverage Plan

**Status:** Complete — approved by the owner on 2026-08-10.

**Progress:** [Journal And Trade Tracker Help Coverage Progress](help-center-journal-trade-tracker-coverage-progress.md)

**Authoring standard:** [Help Center Guide Authoring Standard](help-center-guide-authoring-standard.md)

**Related product plans:**

- [Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md)
- [Quick Trade Entry Progress](quick-trade-entry-progress.md)
- [Phase 4 Core Analytics Plan](phase-4-core-analytics-plan.md)
- [Trading Rules Help Center Plan](help-center-trading-rules-plan.md)
- [Trade Tags Help Center Plan](help-center-trade-tags-plan.md)

## Outcome

Give every currently supported Journal and Trade Tracker feature a plain-language
Help path. A trader can open the feature's complete guide from the page title
and open an exact answer from a question-mark icon beside a substantial section.

The Help Center remains the single shared Help system. New collections reuse the
existing overview, article, navigation, search, breadcrumb and previous/next
templates; they do not introduce another dashboard shell or documentation site.

## Fixed product and writing decisions

- **Daily Trade Tracker** is the single-trading-day review workflow. One save
  contains executions for one account-local trading date. It organizes that
  day's trades, notes, rules and review; it is not the historical bulk-entry
  tool.
- **Quick Trade Entry** is the execution-only alternative. It accepts multiple
  past trading dates in one batch, does not infer Day or Swing intent, and does
  not create notes, tags, rule reviews, day reviews or Swing notes.
- **Swing Trade Tracker** is currently a basic beta experience. Help documents
  only the actions that work today and invites traders to suggest useful
  improvements. It does not promise a feature roadmap or imply that a planned
  feature is already available.
- **Trade Explorer** is deliberately out of scope until its product work is
  ready. This slice must not create a guide, contextual link or Help claim for
  it.
- Existing Daily Trade Tracker, Trade Analyzer, Trading Rules and Trade Tags
  guides are retained. The new work links to their exact stable anchors instead
  of duplicating their detailed explanations.
- Help uses ordinary trading language, generic examples and current visible
  labels. It never exposes source data, account identifiers, implementation
  terms or unapproved future behavior.
- User-facing dashboard and Help language calls the product **Trade Tracker**.
  Internal Journal contracts, routes, data shapes and stable Help slugs remain
  implementation details and are not renamed by this copy work.

## Guide inventory

### Existing content to correct or connect

1. **Daily Trade Tracker**: correct the manual-entry wording to say one
   trading date per save and link Quick Trade Entry for multi-date entry.
2. **Trading Rules** and **Trade Tags**: add contextual access from their
   feature surfaces and from the matching Daily/Swing Tracker sections.
3. **Notifications and imports**: retain its current notification and
   stopped-import guidance, then add the normal Import Trades workflow.

### New collections

| Collection | Guides |
| --- | --- |
| Quick Trade Entry | Getting started; enter executions across dates; review saved entries and next steps; limits and follow-up decisions. |
| Swing Trade Tracker | Getting started; add, reduce and close; review and journal a swing; current limits and suggestions. |
| Calendar | Getting started; month and week views; inspect a day; coverage and limits. |
| Open Positions | Getting started; choose a position status; positions needing a decision. |
| Data Decisions | Getting started; resolve a trade question; review statement issues and history; open-position decisions. |
| Candle Review | Getting started; run and read a review; availability and limits. |
| Core Analytics | Getting started; use date ranges and read the overview; compare results by ticker; review timing and execution; coverage and limits. |

### Import Trades additions

1. Import a statement.
2. Review the mapping and import result.
3. Use import history and follow-up decisions.

## Feature-page access contract

- A title-row question mark opens the collection overview for every collection
  above. It has a clear accessible name, a tooltip and a stable target.
- A section question mark opens the article and exact anchor that explains the
  visible section. It is used only when an independent question has a published
  answer; it does not create an icon beside every ordinary label.
- The current Trade Analyzer icon behavior is the visual and accessibility
  reference. Its implementation is generalized for Journal and Tracker pages
  rather than copied feature by feature.
- Quick Trade Entry links to its own overview; the related Daily Tracker
  article cross-links both workflows so the distinction remains easy to find.

## Current integration map

| Feature page | Main Help target | Contextual targets |
| --- | --- | --- |
| Daily Trade Tracker | Daily Trade Tracker overview | Manual entry, ticker/trade cards, tags, rules, notes, day review. |
| Quick Trade Entry | Quick Trade Entry overview | Execution rows and post-save next steps. |
| Swing Trade Tracker | Swing Trade Tracker overview | Entry actions, review/journal card and current-beta notice. |
| Calendar | Calendar overview | Month/week navigation, selected-day details and coverage state. |
| Open Positions | Open Positions overview | Position status changes and needs-a-decision state. |
| Core Analytics | Core Analytics overview | Date range, metric meanings, ticker comparisons, timing/execution views and coverage state. |
| Trading Rules / Rule Results | Existing Trading Rules overview / exact article | Rule library, active rules, Daily Tracker review and results history. |
| Import Trades | Notifications and imports overview | Statement choice, mapping, import history and follow-up work. |
| Data Decisions | Data Decisions overview | Trade questions, statement issues, history and position classification. |
| Candle Review | Candle Review overview | Price path, review feedback and coverage state. |

## Completion and verification

- Every new overview, article and section is present in the central Help
  registry and resolves through search, navigation and static paths.
- Every product Help target resolves to a published route and, when applicable,
  an existing stable section anchor.
- The regular Analytics Overview, Results, Timing and Execution pages have one
  Core Analytics collection and exact contextual answers. Trade Explorer stays
  excluded until its separate product work is ready.
- The Swing beta notice is visible at the top of the Swing Trade Tracker and
  describes only its current state.
- Visible Help and dashboard references use Trade Tracker rather than Journal
  or Trader Intelligence, without changing internal contracts or stable links.
- Focused static registry, route and link checks run with low resource use.
- Browser and owner visual review are reserved for the completed integrated
  slice, as authorized by the owner.
- The final local commit stages only this Help slice and its controlling
  documents. It does not include the existing unrelated working-tree changes.
