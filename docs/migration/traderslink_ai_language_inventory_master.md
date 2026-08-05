# TradersLink AI Language Inventory
## Master Instructions and Category Completion Tracker

## 1. Purpose

This is the controlling work document for building the complete natural-language inventory for the TradersLink Journal AI chatbot.

The inventory must help the chatbot understand complete questions, commands, fragments, follow-ups, corrections, comparisons, rankings, negation, ambiguity, trader slang, misspellings, shorthand, multi-part requests, unsupported requests, and requests that depend on conversation or page context.

The chatbot converts natural language into validated machine-readable analytics requests. The language model interprets and communicates. Deterministic tools retrieve data and perform calculations.

This work is independent of the former V3 system.

---

# 2. Controlling Documents

1. [TradersLink AI Companion Plan](ai-chat-plan.md)
   - Controls the complete product, account scope, Daily Trade Tracker
     companion, manual execution drafts, account-setting confirmation, AI
     Reviews, privacy, costs and administration.
2. [AI Chatbot Complete Language Plan](traderslink_ai_chatbot_complete_language_plan.md)
   - Controls language/query architecture, capability routing, deterministic
     answer boundaries, and the relationship between natural language and
     verified results.
3. `traderslink_ai_language_inventory_master.md`
   - Controls scope, category sequence, status, links, review gates, and global rules.
4. [category_completion_template_example.md](category_completion_template_example.md)
   - Defines the required structure for every category document.
5. One category Markdown file for every category in the completion tracker.
   - Each file must use the approved name.
   - Each file must be linked from this master document.
   - Each file becomes the controlling record for that category.

---

# 3. Required Project Structure

```text
docs/migration/
├── traderslink_ai_language_inventory_master.md
├── category_completion_template_example.md
└── language-inventory/
    ├── categories/
│   ├── 01-intents.md
│   ├── 02-metrics-profit-loss.md
│   ├── 03-metrics-outcomes.md
│   ├── 04-metrics-edge-quality.md
│   ├── 05-metrics-fees-costs.md
│   ├── 06-metrics-position-size.md
│   ├── 07-metrics-time-duration.md
│   ├── 08-metrics-execution.md
│   ├── 09-metrics-behaviour.md
│   ├── 10-metrics-candle-analytics.md
│   ├── 11-dimensions.md
│   ├── 12-operators.md
│   ├── 13-date-time-language.md
│   ├── 14-comparison-ranking-language.md
│   ├── 15-context-conversation-language.md
│   ├── 16-trader-terminology-slang.md
│   ├── 17-ambiguity-language.md
│   ├── 18-response-preferences.md
│   ├── 19-language-policies.md
│   └── 20-evaluation-suite.md
    └── generated/
        ├── canonical-inventory/
        ├── language-registry/
        ├── evaluation-cases/
        └── coverage-reports/
```

Do not change file names, numbering, or category order without updating this master file and recording the reason in the change log.

The master and template remain in `docs/migration/`. Category documents and
generated artifacts belong only under `docs/migration/language-inventory/` when
they are created; do not create a parallel language-inventory program elsewhere
in the workspace.

---

# 4. Mandatory Category Workflow

```text
Define category
→ plan category boundaries, dependencies, risks, and tools
→ establish the complete canonical concept list
→ declare that list the controlling inventory
→ identify overlaps and ownership boundaries
→ build complete language coverage
→ build Canonical Inventory deliverable
→ build Language Registry Entries deliverable
→ build Evaluation Cases deliverable
→ build Coverage Report deliverable
→ review gaps, duplicates, ambiguity, unsupported cases, and collisions
→ complete the acceptance checklist
→ mark Ready for Review
→ make required changes
→ approve the category
→ lock canonical names
→ mark Complete
→ update this master file
→ move to the next category
```

The AI must not start by generating synonyms or example questions before the complete canonical concept list has been established.

---

# 5. Required Work Order Inside Each Category

## Phase 1: Category Planning

Define:

- category purpose;
- included concepts;
- excluded concepts;
- dependencies on earlier categories;
- overlap with other categories;
- data requirements;
- deterministic tool requirements;
- directly observed concepts;
- derived concepts;
- proxy concepts;
- user-labelled concepts;
- concepts that cannot be measured;
- known ambiguity;
- unsupported areas;
- category-specific acceptance criteria.

## Phase 2: Complete Canonical Concept Inventory

Establish the complete list of canonical concepts belonging in the category.

The following statement must appear immediately above the list:

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

Possible additions must be placed in `Proposed Inventory Additions`. They must not be inserted into the controlling inventory until approved.

## Phase 3: Complete Language Coverage

For every canonical concept, complete every applicable area:

- exact definition;
- distinction from related concepts;
- formal wording;
- normal conversational wording;
- trader slang;
- abbreviations;
- common misspellings;
- noisy and incomplete input;
- singular and plural forms;
- full questions;
- commands;
- sentence fragments;
- follow-up wording;
- correction wording;
- comparison wording;
- ranking wording;
- negated wording;
- exclusion wording;
- multi-filter wording;
- multi-part question wording;
- ambiguous wording;
- wording that looks similar but means something else;
- negative examples that must not map to the concept;
- pronoun and context-dependent wording where applicable;
- required data;
- optional data;
- valid filters;
- valid groupings;
- valid operators;
- compatible intents;
- incompatible combinations;
- default interpretation;
- clarification conditions;
- unsupported conditions;
- target analytics tool or query capability;
- result units;
- fee handling where applicable;
- open-trade handling where applicable;
- sample-size considerations;
- evaluation examples.

## Phase 4: Four Required Deliverables

Every category must contain or generate:

1. Canonical Inventory
2. Language Registry Entries
3. Evaluation Cases
4. Coverage Report

## Phase 5: Review and Lock

Before completion:

- find duplicate canonical concepts;
- find synonyms incorrectly represented as separate concepts;
- find distinct concepts incorrectly merged as synonyms;
- identify conflicts with completed categories;
- identify unsafe or unclear defaults;
- identify missing clarification rules;
- identify unsupported calculations;
- verify data and tool requirements;
- verify every controlling inventory item is complete;
- verify evaluation coverage;
- approve and lock canonical names.

This order is mandatory.

---

# 6. The Four Deliverables

## 6.1 Canonical Inventory

Defines stable machine-readable concepts.

Every entry must include:

- inventory ID;
- category;
- subcategory;
- canonical name;
- display name;
- exact definition;
- distinction from related concepts;
- observed, derived, proxy, user-labelled, or unsupported classification;
- units;
- status;
- version.

Canonical names must use lowercase `snake_case`, describe one exact concept, remain stable after approval, and never be silently renamed.

## 6.2 Language Registry Entries

Maps real user language to canonical concepts.

It must cover applicable formal language, conversational language, slang, abbreviations, spelling variants, misspellings, questions, commands, fragments, corrections, follow-ups, comparisons, rankings, negation, exclusion, ambiguity, negative examples, required context, defaults, and clarification behaviour.

The registry must map language into controlled meanings. It must not be a flat list of unrelated sentences.

## 6.3 Evaluation Cases

Proves that language maps to the correct structure.

Important concepts must include applicable cases for:

- canonical wording;
- formal paraphrase;
- conversational paraphrase;
- trader slang;
- abbreviation;
- misspelling;
- noisy input;
- command;
- fragment;
- follow-up;
- correction;
- comparison;
- ranking;
- negation;
- exclusion;
- multiple filters;
- multi-part requests;
- ambiguity;
- negative examples;
- unsupported data;
- selected UI entity;
- cross-category combinations.

Every case must define the expected structured interpretation. A test does not pass merely because the final prose sounds reasonable.

## 6.4 Coverage Report

Must report:

- controlling inventory count;
- completed inventory count;
- registry entry count;
- evaluation case count;
- proposed additions;
- duplicate concepts;
- overlaps;
- ambiguity risks;
- required data;
- required tools;
- unsupported capabilities;
- clarification-required cases;
- unresolved issues;
- acceptance status.

---

# 7. Category File Creation Rules

When beginning a category, the AI must:

1. Copy the structure from `category_completion_template_example.md`.
2. Create a new Markdown file with the exact approved file name.
3. Confirm the file is linked in the completion tracker.
4. Use a relative Markdown link from this master file.
5. Set the category status to `In Planning`.
6. Complete planning before language generation.
7. Maintain the category file throughout the work.
8. Update this master file whenever category status changes.
9. Mark the category `Complete` only after all acceptance requirements pass.
10. Record completion date, version, counts, and approval notes.

Do not place complete category work directly in this master file.

---

# 8. Allowed Category Status Values

- `Not Started`
- `In Planning`
- `Inventory Drafted`
- `Language Coverage In Progress`
- `Deliverables In Progress`
- `Ready for Review`
- `Changes Required`
- `Approved`
- `Complete`
- `Blocked`
- `Deprecated`

A category cannot move directly from `Not Started` to `Complete`.

---

# 9. Recommended Category Sequence and Completion Tracker

| # | Category | File | Status | Version | Dependencies | Notes |
|---:|---|---|---|---:|---|---|
| 1 | Intents | [01-intents.md](language-inventory/categories/01-intents.md) | Not Started | 0 | None | Complete action inventory first |
| 2 | Profit and Loss Metrics | [02-metrics-profit-loss.md](language-inventory/categories/02-metrics-profit-loss.md) | Not Started | 0 | Intents | |
| 3 | Outcome Metrics | [03-metrics-outcomes.md](language-inventory/categories/03-metrics-outcomes.md) | Not Started | 0 | Intents | |
| 4 | Edge and Quality Metrics | [04-metrics-edge-quality.md](language-inventory/categories/04-metrics-edge-quality.md) | Not Started | 0 | Profit and Loss, Outcomes | |
| 5 | Fees and Costs Metrics | [05-metrics-fees-costs.md](language-inventory/categories/05-metrics-fees-costs.md) | Not Started | 0 | Profit and Loss | |
| 6 | Position Size Metrics | [06-metrics-position-size.md](language-inventory/categories/06-metrics-position-size.md) | Not Started | 0 | Intents | |
| 7 | Time and Duration Metrics | [07-metrics-time-duration.md](language-inventory/categories/07-metrics-time-duration.md) | Not Started | 0 | Intents | |
| 8 | Execution Metrics | [08-metrics-execution.md](language-inventory/categories/08-metrics-execution.md) | Not Started | 0 | Intents | |
| 9 | Behaviour Metrics | [09-metrics-behaviour.md](language-inventory/categories/09-metrics-behaviour.md) | Not Started | 0 | Outcomes, Time, Execution, Size | |
| 10 | Candle-Based Analytics | [10-metrics-candle-analytics.md](language-inventory/categories/10-metrics-candle-analytics.md) | Not Started | 0 | Profit and Loss, Time | State candle-data dependencies |
| 11 | Dimensions | [11-dimensions.md](language-inventory/categories/11-dimensions.md) | Not Started | 0 | Core metrics | |
| 12 | Operators | [12-operators.md](language-inventory/categories/12-operators.md) | Not Started | 0 | Dimensions | |
| 13 | Date and Time Language | [13-date-time-language.md](language-inventory/categories/13-date-time-language.md) | Not Started | 0 | Time metrics, Operators | |
| 14 | Comparison and Ranking Language | [14-comparison-ranking-language.md](language-inventory/categories/14-comparison-ranking-language.md) | Not Started | 0 | Metrics, Dimensions, Operators | |
| 15 | Context and Conversation Language | [15-context-conversation-language.md](language-inventory/categories/15-context-conversation-language.md) | Not Started | 0 | Intents, Dimensions | |
| 16 | Trader Terminology and Slang | [16-trader-terminology-slang.md](language-inventory/categories/16-trader-terminology-slang.md) | Not Started | 0 | Core metrics and dimensions | |
| 17 | Ambiguity Language | [17-ambiguity-language.md](language-inventory/categories/17-ambiguity-language.md) | Not Started | 0 | All prior language categories | |
| 18 | Response Preferences | [18-response-preferences.md](language-inventory/categories/18-response-preferences.md) | Not Started | 0 | Intents | |
| 19 | Language Policies | [19-language-policies.md](language-inventory/categories/19-language-policies.md) | Not Started | 0 | All prior categories | |
| 20 | Evaluation Suite | [20-evaluation-suite.md](language-inventory/categories/20-evaluation-suite.md) | Not Started | 0 | All categories | Cross-category proof |

---

# 10. Category Ownership Rules

One category must own each canonical concept. Other categories may reference it but must not redefine it.

Examples:

- `net_profit` belongs in Profit and Loss Metrics.
- “How do I trade after a loss?” is an evaluation phrase, not a separate metric.
- “Gave it back” maps to a profit-giveback concept; the phrase is not a separate calculation.
- “Best” belongs in ranking and ambiguity language, not as a metric.
- “Under $5” combines a price dimension and a less-than operator.
- “What about last month?” belongs in context plus date-time language.
- “Show me the trades” belongs in evidence and response-preference language.
- “Will this ticker go up?” belongs in unsupported-request policy.

---

# 11. Shared Inventory Fields

| Field | Purpose |
|---|---|
| Inventory ID | Stable unique identifier |
| Category | Intent, metric, dimension, operator, slang, policy, etc. |
| Subcategory | Profit, time, behaviour, sequence, etc. |
| Canonical meaning | Exact machine-readable term |
| Display name | User-facing label |
| Definition | Exact meaning |
| Distinction | Difference from related concepts |
| Formal language | Professional wording |
| Informal language | Normal conversational wording |
| Trader slang | Trading-community wording |
| Abbreviations | Shortened forms |
| Misspellings | Common noisy forms |
| Question examples | Complete questions |
| Command examples | Direct instructions |
| Fragment examples | Incomplete or follow-up phrases |
| Follow-up examples | Context-dependent continuation |
| Correction examples | User corrections |
| Comparison examples | Group or period comparisons |
| Ranking examples | Best, worst, highest, lowest |
| Negated examples | Not, without, exclude |
| Multi-filter examples | Multiple conditions |
| Multi-part examples | Multiple requests |
| Ambiguous examples | More than one plausible meaning |
| Negative examples | Similar wording that must not map here |
| Required data | Data required to answer |
| Optional data | Data improving the answer |
| Valid filters | Supported filtering fields |
| Valid groupings | Supported grouping dimensions |
| Valid operators | Supported operators |
| Compatible intents | Intents that may use the concept |
| Incompatible combinations | Invalid combinations |
| Default rule | Safe default interpretation |
| Clarification rule | When the bot must ask |
| Unsupported conditions | When it cannot answer |
| Tool or query target | Deterministic capability used |
| Result units | Dollars, percentage, count, duration, etc. |
| Fee handling | Exact, estimated, partial, unavailable |
| Open-trade support | Whether open trades are supported |
| Sample-size rule | Confidence or display requirement |
| Status | Supported, planned, unavailable, deprecated |
| Version | Registry version |

---

# 12. Canonical Naming Rules

Canonical names must:

- use lowercase `snake_case`;
- describe one exact concept;
- avoid implementation-specific table names;
- avoid marketing terms;
- avoid ambiguous wording when a precise term exists;
- remain stable after approval;
- not encode version numbers;
- not change to match casual wording.

Good examples:

```text
net_profit
average_losing_trade
trade_sequence_bucket
previous_trade_outcome
profit_giveback
repeat_attempt_number
```

Avoid:

```text
best_trade_stat
bad_trades
money_made
thing_after_loss
metric_v2
```

---

# 13. Language Quality Rules

Coverage must include realistic TradersLink language:

- formal financial wording;
- normal conversational English;
- small-cap day-trader wording;
- incomplete typing;
- likely spelling errors;
- lowercase and punctuation-free input;
- commands;
- questions;
- follow-ups;
- selected-trade references;
- references to prior answers;
- corrections;
- comparisons;
- rankings;
- negation;
- exclusions;
- multiple conditions;
- multi-part requests.

Do not inflate counts with near-duplicate sentences. Variants must be materially different.

---

# 14. Negative Example Rule

Every important concept must include language that must not map to it.

Example for `net_profit`:

Positive:

```text
What did I make after fees?
Show my net P&L.
```

Negative:

```text
How much gross profit did my winners produce?
What is the unrealized profit on my open trade?
How much cash is in my account?
```

Negative examples are required to prevent overly broad matching.

---

# 15. Ambiguity Rules

Ambiguous language must not be silently forced into a meaning when the choice materially changes the answer.

Every ambiguity entry must define:

- phrase;
- possible meanings;
- context signals;
- safe default, if one exists;
- clarification condition;
- clarification wording;
- positive examples;
- negative examples.

Priority terms include:

- best;
- worst;
- better;
- profit;
- size;
- risk;
- later trades;
- recent;
- cheap stocks;
- scalp;
- overtrading;
- good trade;
- bad trade;
- normal size;
- large loss;
- performance;
- consistency.

---

# 16. Unsupported and Missing-Data Rules

The system must recognize requests even when execution is impossible.

Every unsupported condition must identify:

- recognized intent;
- missing data or capability;
- reason;
- related supported question;
- whether support is planned;
- data needed for future support.

The AI must not invent:

- candle metrics without candles;
- fees when fee data is missing;
- emotional state without journal evidence;
- market context without external data;
- sequence inside a candle interval that cannot preserve sequence;
- predictions or trade signals;
- other users’ private information.

---

# 17. Evaluation Rules

Evaluation verifies structure, not prose alone.

Each case should define fields such as:

```json
{
  "caseId": "compare-after-loss-001",
  "input": "Do I trade worse after a red trade?",
  "expectedIntent": "compare_groups",
  "expectedCanonicalConcepts": [
    "previous_trade_outcome",
    "net_profit",
    "win_rate",
    "expectancy"
  ],
  "expectedFilters": [],
  "expectedComparison": {
    "dimension": "previous_trade_outcome",
    "groups": ["loss", "not_loss"]
  },
  "clarificationExpected": false,
  "unsupportedExpected": false
}
```

Each category must contain focused cases. The final Evaluation Suite adds cross-category combinations.

---

# 18. Review Gate

A category may be marked `Ready for Review` only when:

- planning is complete;
- the controlling inventory exists;
- every controlling item is completed;
- all four deliverables exist;
- every required field is populated or marked not applicable;
- negative examples exist;
- ambiguity is documented;
- unsupported cases are documented;
- data requirements are documented;
- tool targets are documented;
- evaluation cases exist;
- the coverage report is complete;
- no unresolved duplicate remains;
- no silent rename or merge occurred.

---

# 19. Approval and Locking

After review:

1. Record findings.
2. Set status to `Changes Required` when needed.
3. Apply changes without silently altering the controlling inventory.
4. Return to `Ready for Review`.
5. Set status to `Approved` when accepted.
6. Lock canonical names.
7. Set version to `1` for initial completion.
8. Set status to `Complete`.
9. Add completion date and counts.
10. Update this master tracker.
11. Add a change-log entry.
12. Move to the next category.

Later changes require a new recorded version.

---

# 20. Master File Maintenance

Update this file whenever any of these change:

- category status;
- category version;
- file link;
- dependency;
- blocker;
- approval note;
- completion date;
- canonical inventory count;
- evaluation case count;
- file name;
- deprecated category;
- newly approved category.

The master file must always show the true project state.

---

# 21. Progress Summary

| Measure | Current |
|---|---:|
| Total categories | 20 |
| Not started | 20 |
| In progress | 0 |
| Ready for review | 0 |
| Complete | 0 |
| Blocked | 0 |
| Locked canonical inventories | 0 |

Update this table whenever category status changes.

---

# 22. AI Operating Instructions

> Work on one category at a time in the listed order unless this master file explicitly authorizes a different sequence.

> Create the category Markdown file from the shared template before performing detailed category work.

> Complete category planning before establishing the controlling inventory.

> Establish the complete controlling inventory before generating full language coverage.

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

> Complete all four required deliverables: Canonical Inventory, Language Registry Entries, Evaluation Cases, and Coverage Report.

> Do not mark a category complete merely because examples were generated.

> Update this master file whenever status, version, link, dependency, counts, or completion state changes.

> Do not change a locked canonical name without documenting the migration.

> Do not invent supported analytics, data, filters, groupings, or tools.

> A recognized capability may be marked planned or unavailable, but it must not
> be presented as executable until the governing AI Companion and Chatbot plans
> authorize a deterministic capability behind it.

> Category documentation does not authorize provider calls, runtime routes,
> database migrations, account-setting writes, manual-execution writes, or any
> Journal mutation. Protected actions continue to require their separate
> explicit-confirmation and implementation contracts.

> Do not hide incomplete scope behind wording such as “including,” “at minimum,” “for example,” or “and similar concepts.”

> Preserve the complete controlling inventory. Checkpoints may limit what is implemented in one work session, but must not hide or reduce the full target scope.

---

# 23. Change Log

| Date | Category/File | Change | Reason | Version |
|---|---|---|---|---:|
| 2026-08-05 | Master project | Initial category structure, workflow, tracker, and review gates created | Establish controlled language-inventory process | 1 |

---

# 24. Final Project Acceptance

The project is complete only when:

- all 20 category documents exist;
- all links work;
- all categories are marked Complete;
- every category has all four deliverables;
- all canonical names are locked;
- cross-category duplicates are resolved;
- cross-category ambiguity is resolved;
- required data and tool mappings are documented;
- unsupported cases are documented;
- the final evaluation suite passes;
- the progress summary is accurate;
- the change log is current;
- approved category documents can generate the runtime registries.
