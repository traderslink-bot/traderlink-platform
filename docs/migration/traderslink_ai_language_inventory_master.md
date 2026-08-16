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

## 3.1 Current runtime reconciliation

The completed 20-category program remains the canonical language source: 417
locked entries with their individual source statuses. On 2026-08-15, all twenty
category files were audited against the current Chat capability registry,
factual-tool registry/contracts, action-draft contracts, and the current
dashboard capability matrix. The result is recorded in
[AI Chat Language Reconciliation Progress](traderlink-ai-chat-language-reconciliation-progress.md).

All thirteen currently live capability families now require a non-empty mapping
to exact canonical names and at least one validated representative language
fixture. The generated registry and focused test enforce those conditions.
Category-level `Planned` and `Unavailable` statuses remain truthful language
boundaries; a mapping only means the present bounded service can recognize that
language, not that every related metric, tool, action, or future product surface
is supported. Each category document now carries the same reconciliation note
to supersede stale blanket no-runtime wording.

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
- evidence classification: one or more of directly observed,
  deterministically derived, proxy-based, user-labelled, or not applicable;
- capability status: supported, planned but not implemented, unavailable
  because required data is missing, unsupported by product decision, or
  deprecated;
- units;
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

Intent evaluations must identify one `expectedPrimaryIntent` and an ordered
`expectedSecondaryIntents` list. They must also state the expected capability
status and, where applicable, protected-action, confirmation, clarification,
and unsupported-reason expectations. These expectations describe routing and
safety behavior; they do not authorize a write or imply that a planned runtime
already exists.

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

## 7.1 Delegated Production Boundary

- The lead controller edits only this master file and
  `category_completion_template_example.md`.
- A delegated worker may create or edit only its explicitly assigned category
  file under `docs/migration/language-inventory/categories/`.
- Delegated workers may inspect repository code, contracts, schemas, routes,
  services, and documentation read-only to establish evidence. They must not
  modify product code, tests, configuration, databases, or unrelated files.
- Luna is the default model for bounded category drafting and production.
  Terra may be selected when repository interpretation, cross-category
  conflicts, ambiguity, or remediation requires stronger judgment.
- A delegated worker may prepare a category for lead review, but it must not
  approve the category, lock canonical names, or mark the category `Complete`.
- The lead controller independently reviews every deliverable, directs any
  remediation, owns approval and locking decisions, and is the only role that
  updates this master tracker.
- Categories proceed in tracker order unless this master explicitly records a
  safe exception. Dependent categories do not begin production before their
  required canonical inventories are locked.

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
| 1 | Intents | [01-intents.md](language-inventory/categories/01-intents.md) | Complete | 1 | None | Approved and locked: 27 canonical intents, 27 complete registries, and 594 reviewed evaluation cases; Terra production/review and independent Luna review passed |
| 2 | Profit and Loss Metrics | [02-metrics-profit-loss.md](language-inventory/categories/02-metrics-profit-loss.md) | Complete | 1 | Intents | Approved and locked after independent Terra review of 22 canonical records, 22 complete language registries, and 484 evaluation cases; gross/before-fee and net/after-fee pairs remain language aliases to one deterministic calculation rather than duplicate calculations |
| 3 | Outcome Metrics | [03-metrics-outcomes.md](language-inventory/categories/03-metrics-outcomes.md) | Complete | 1 | Intents, Profit and Loss | Approved and locked after independent Terra review of 17 canonical records, 17 complete registries, and 374 evaluation cases; trade_count/closed alias, selected-basis outcomes, complete day buckets, and current/maximum streak boundaries are resolved |
| 4 | Edge and Quality Metrics | [04-metrics-edge-quality.md](language-inventory/categories/04-metrics-edge-quality.md) | Complete | 1 | Profit and Loss, Outcomes | Approved and locked after comprehensive independent Terra review of 13 canonical records, 13 complete language registries, and 286 evaluation cases; 7 Supported and 6 Planned boundaries retain exact formula, population, dispersion, concentration, outlier, and exclusion semantics |
| 5 | Fees and Costs Metrics | [05-metrics-fees-costs.md](language-inventory/categories/05-metrics-fees-costs.md) | Complete | 1 | Profit and Loss | Approved and locked after independent Terra review of 10 canonical records, 10 complete language registries, and 220 evaluation cases; user-facing fee states are exact, estimated, partially available, or unavailable, while Category 4/11-dependent impacts retain explicit unavailable boundaries |
| 6 | Position Size Metrics | [06-metrics-position-size.md](language-inventory/categories/06-metrics-position-size.md) | Complete | 1 | Intents | Approved and locked after comprehensive independent Terra review of 14 canonical records, 14 complete language registries, and 308 evaluation cases; 2 Supported, 8 Planned, and 4 Unavailable concepts retain exact quantity, exposure, baseline, sequence, transition, and denominator boundaries |
| 7 | Time and Duration Metrics | [07-metrics-time-duration.md](language-inventory/categories/07-metrics-time-duration.md) | Complete | 1 | Intents | Approved and locked after comprehensive independent Terra review of 19 canonical records, 19 complete language registries, and 418 evaluation cases; 8 Supported, 10 Planned, and 1 Unavailable concepts preserve UTC/local time, lifecycle endpoint, session, calendar, predecessor/barrier, overlap, and asymmetric-window semantics |
| 8 | Execution Metrics | [08-metrics-execution.md](language-inventory/categories/08-metrics-execution.md) | Complete | 1 | Intents | Approved and locked after comprehensive independent Terra review of 19 canonical records, 19 complete language registries, and 418 evaluation cases; all Planned concepts preserve exact allocation-event, execution-ID, price-basis, sequence/barrier, reconciliation, unmatched-coverage, and legitimate-open semantics without runtime-support inflation |
| 9 | Behaviour Metrics | [09-metrics-behaviour.md](language-inventory/categories/09-metrics-behaviour.md) | Complete | 1 | Outcomes, Time, Execution, Size | Approved and locked after comprehensive independent Terra review of 21 canonical records, 21 complete language registries, and 462 evaluation cases; all Planned concepts preserve exact denominators, pre-filter barriers, saved-rule versions, label/proxy gates, counterfactual boundaries, and Category 10-only giveback calculation ownership |
| 10 | Candle-Based Analytics | [10-metrics-candle-analytics.md](language-inventory/categories/10-metrics-candle-analytics.md) | Complete | 1 | Profit and Loss, Time | Approved and locked after comprehensive independent Terra review of 18 canonical records, 18 complete language registries, and 396 evaluation cases; 15 Planned and 3 Unavailable concepts preserve candle approximation, interval/source, formula, grain, sequence, benchmark, and trader-fact boundaries |
| 11 | Dimensions | [11-dimensions.md](language-inventory/categories/11-dimensions.md) | Complete | 1 | Core metrics | Approved and locked after comprehensive independent Terra review of 111 canonical records, 111 complete registries, and 2,442 evaluation cases; 77 Planned and 34 Unavailable dimensions preserve exact authorization/privacy, time/session, price, outcome, direction, size, sequence/barrier, Journal-fact, saved-definition, and no-inference boundaries |
| 12 | Operators | [12-operators.md](language-inventory/categories/12-operators.md) | Complete | 1 | Dimensions | Approved and locked after comprehensive independent Terra review of 11 canonical records, 11 complete registries, and 242 evaluation cases; all Planned concepts preserve exact typed comparison, endpoint, range, set, membership, authorization, privacy-safe text-search, clarification, and no-default boundaries |
| 13 | Date and Time Language | [13-date-time-language.md](language-inventory/categories/13-date-time-language.md) | Complete | 1 | Time metrics, Operators | Approved and locked after comprehensive independent Terra review of 9 canonical records, 9 complete registries, and 198 evaluation cases; all Planned concepts preserve exact UTC, account-IANA/DST, relative/trading/window/session, display/account/Tracker-Eastern, authorization, privacy, and no-invention boundaries |
| 14 | Comparison and Ranking Language | [14-comparison-ranking-language.md](language-inventory/categories/14-comparison-ranking-language.md) | Complete | 1 | Metrics, Dimensions, Operators | Exact 29 canonical names and 29 registries approved and locked after comprehensive independent PASS of all 638 evaluation cases; all capabilities remain Planned and no runtime support is authorized |
| 15 | Context and Conversation Language | [15-context-conversation-language.md](language-inventory/categories/15-context-conversation-language.md) | Complete | 1 | Intents, Dimensions | Exact 18 canonical names and 18 registries approved and locked after comprehensive independent PASS of all 396 evaluation cases; all capabilities remain Planned and no runtime support is authorized |
| 16 | Trader Terminology and Slang | [16-trader-terminology-slang.md](language-inventory/categories/16-trader-terminology-slang.md) | Complete | 1 | Core metrics and dimensions | Exact 15 canonical names and 15 registries approved and locked after comprehensive independent PASS of all 330 evaluation cases and 36 child terms; all capabilities remain Planned and no runtime support is authorized |
| 17 | Ambiguity Language | [17-ambiguity-language.md](language-inventory/categories/17-ambiguity-language.md) | Complete | 1 | All prior language categories | Exact 17 canonical names and 17 registries approved and locked after comprehensive independent PASS of all 374 evaluation cases; all capabilities remain Planned and no runtime support is authorized |
| 18 | Response Preferences | [18-response-preferences.md](language-inventory/categories/18-response-preferences.md) | Complete | 1 | Intents | Approved and locked after comprehensive independent Terra review of 6 canonical response modes, 6 complete language registries, and 132 evaluation cases; presentation modes cannot alter the resolved query, authorization, truth, evidence, coverage, privacy, capability, clarification, or safety policy |
| 19 | Language Policies | [19-language-policies.md](language-inventory/categories/19-language-policies.md) | Complete | 1 | All prior categories | Exact 11 canonical policy names and 11 registries approved and locked after comprehensive independent PASS of all 242 evaluation cases; all capabilities remain Planned and no runtime support is authorized |
| 20 | Evaluation Suite | [20-evaluation-suite.md](language-inventory/categories/20-evaluation-suite.md) | Complete | 1 | All categories | Exact 10 canonical names and registries approved and locked after review of all 220 cases, the 20-row IQA-001 ledger, 407-row locked-owner crosswalk, eight-axis/five-outcome matrix, and 22-of-22 Section 47 criteria; Markdown-only with no runtime support |

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
| Evidence classification | One or more of directly observed, deterministically derived, proxy-based, user-labelled, or not applicable; mixed concepts must list every applicable class |
| Capability status | Supported, planned but not implemented, unavailable because required data is missing, unsupported by product decision, or deprecated |
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

Clarification wording must ask one focused question about the highest-impact
missing or ambiguous field. When several fields are unresolved, ask them
sequentially; do not combine a checklist of unrelated choices into one prompt.

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
  "caseType": "conversational_paraphrase",
  "input": "Do I trade worse after a red trade?",
  "expectedPrimaryIntent": "compare_groups",
  "expectedSecondaryIntents": [],
  "expectedCanonicalConcepts": [
    "previous_trade_outcome",
    "net_profit",
    "win_rate",
    "expectancy"
  ],
  "expectedFilters": [],
  "expectedGroupings": [],
  "expectedOperators": [],
  "expectedComparison": {
    "dimension": "previous_trade_outcome",
    "groups": ["loss", "not_loss"]
  },
  "expectedTimeRange": null,
  "expectedSelectedEntity": null,
  "expectedContextRequirements": [],
  "expectedCapabilityStatus": "Planned",
  "expectedProtectedAction": null,
  "confirmationExpected": false,
  "clarificationExpected": false,
  "expectedClarificationQuestion": null,
  "unsupportedExpected": false,
  "expectedUnsupportedReason": null,
  "notes": "Compare the two factual populations without implying causation."
}
```

Each category must contain focused cases. The final Evaluation Suite adds
cross-category combinations and the exact eleven-field extension documented in
the completion template: locked owner references, structured subrequests,
tool/execution state, Category 15 accepted/pending before/after state, all
eleven Category 19 policy outcomes, and Category 20 combination axes/outcome.
The locked Categories 1-19 retain their accepted Version 1 schemas.

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
| Not started | 0 |
| In progress | 0 |
| Ready for review | 0 |
| Complete | 20 |
| Blocked | 0 |
| Locked canonical inventories | 20 |
| Locked canonical names | 417 |
| Reviewed evaluation cases | 9,174 |
| Final evaluation suite | PASS |

Update this table whenever category status changes.

---

# 22. AI Operating Instructions

> Work on one category at a time in the listed order unless this master file explicitly authorizes a different sequence.

> **Owner-approved concurrency exception, expanded 2026-08-10:** At most three category
> files may be active at once. Each delegated worker owns exactly one category
> Markdown file; dependencies must already be satisfied; the lead controller
> alone updates the master tracker; no two workers may edit the same file; and
> low-resource Markdown-only checks remain mandatory. Reduce to two or one active
> categories if the Codex app or owner computer becomes sluggish. All category
> lanes are now complete. The completed out-of-order
> Category 18 lane was dependency-safe because it depended only on locked
> Category 1. This exception does not waive Category 11 or any later category's
> dependency gates. The
> owner computer's press-release/scanner-with-levels process is scheduled to
> start at 03:55 local time and takes resource priority. If pressure appears
> after that start, pause the highest-numbered dependency-safe lane first; if
> pressure remains, retain the lowest-numbered sequential lane alone. Preserve each worker's saved Markdown
> checkpoint so paused lanes can resume without rework.

> Categories 1-20 are Complete, Version 1, approved, locked, and
> master-synchronized. Category 20 closed the final sequential lane with 10
> canonical records, 10 registries, 220 reviewed cases, and the complete final
> evidence and acceptance report.

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
| 2026-08-15 | Current runtime language reconciliation | Added generated multi-family mappings and validated representative fixtures for all 13 current AI Chat capability families | Keep the locked 417-entry language contract aligned with current bounded reads, the exact 34 factual-tool names, and 12 confirmation-draft action kinds without promoting future concepts or changing category source statuses | 1 |
| 2026-08-12 | Category 20 - Evaluation Suite | Accepted and locked Category 20 and completed the all-20 inventory program | Record 10 approved records/registries, 220 reviewed cases, IQA-001 20/20, locked-owner crosswalk 407/407, Section 47 criteria 22/22, exact no-runtime boundary, and master totals of 20 Complete/20 locked | 1 |
| 2026-08-12 | Category 20 - Evaluation Suite | Accepted the exact 10-record planning inventory after independent Terra review and authorized canonical production | Preserve the universal exact-query/state/policy oracle, IQA-001 paraphrase quota, eight-axis combination proof, closed 407-name crosswalk, privacy, capability, and no-runtime boundaries before suite generation | 0 |
| 2026-08-12 | Category 20 - Evaluation Suite | Began bounded planning after Category 19 locked | Establish the complete final proof suite for canonical, paraphrase, misspelling, shorthand, multi-part, follow-up, negation, ambiguity, adversarial, and cross-category combination coverage before deliverable production | 0 |
| 2026-08-12 | Category 19 - Language Policies | Accepted and locked Category 19 after comprehensive independent Terra review of 242 cases and final Version 1 validation | Complete deterministic truth, server scope, privacy, evidence/coverage, no-invention, Unsupported, causation, prediction, advice, confirmation, and untrusted-content policy boundaries before Category 20 begins | 1 |
| 2026-08-12 | Category 19 - Language Policies | Advanced to Ready for Review after comprehensive independent Terra PASS of 11 canonical policies, 11 registries, and 242 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact policy boundaries, privacy, state, capability distinctions, and no runtime-support claim | 0 |
| 2026-08-12 | Category 19 - Language Policies | Accepted the exact 11-record planning inventory after independent Terra review and authorized canonical production | Preserve deterministic truth, server scope, privacy, evidence/coverage, missing-data, Unsupported, causation, prediction, advice, confirmation, untrusted-content, state, and no-runtime boundaries before language generation | 0 |
| 2026-08-12 | Category 19 - Language Policies | Began bounded planning after Category 17 locked | Establish the complete language-policy vocabulary and deterministic truth, server scope, privacy, evidence, no-invention, unsupported, causation, prediction, advice, protected-action confirmation, and untrusted-content boundaries before deliverable production | 0 |
| 2026-08-12 | Category 17 - Ambiguity Language | Accepted and locked Category 17 after comprehensive independent Terra review of 374 cases and final Version 1 validation | Complete the ambiguity-routing vocabulary with exact owner, resolution, clarification, capability, authorization, privacy, collision, and no-hidden-default boundaries before Category 19 begins | 1 |
| 2026-08-12 | Category 17 - Ambiguity Language | Advanced to Ready for Review after comprehensive independent Terra PASS of 17 canonical records, 17 registries, and 374 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact ambiguity-routing contracts, privacy, capability distinctions, and no runtime-support claim | 0 |
| 2026-08-11 | Category 17 - Ambiguity Language | Accepted the exact 17-record planning inventory after independent Terra review and authorized canonical production | Preserve the shared resolution ladder, one-field focused clarification, locked-owner meanings, Category 15 state ownership, Category 16 token-collision safety, privacy, capability-state distinctions, and no-hidden-default boundaries before language generation | 0 |
| 2026-08-11 | Category 17 - Ambiguity Language | Began bounded planning after Category 16 locked | Establish the complete ambiguity-routing vocabulary, owner boundaries, focused clarification, pending-state, authorization, privacy, and no-default contracts before deliverable production | 0 |
| 2026-08-11 | Category 16 - Trader Terminology and Slang | Accepted and locked Category 16 after comprehensive independent Terra review of 330 cases, 15 records, and 36 child terms | Complete the trader synonym, slang, and user-defined-label vocabulary with exact owner, matching, collision, authorization, privacy, and no-inference boundaries before Category 17 begins | 1 |
| 2026-08-11 | Category 16 - Trader Terminology and Slang | Advanced to Ready for Review after comprehensive independent Terra PASS of 15 canonical records, 15 registries, 36 child terms, and 330 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact owner/matching contracts, privacy, and no runtime-support claim | 0 |
| 2026-08-11 | Category 16 - Trader Terminology and Slang | Accepted the exact 15-record and 36-child-term planning inventory after independent Terra review and authorized canonical production | Preserve per-term semantic distinctions, same-account user-label precedence, collision safety, privacy, and no-identity-collapse boundaries before language generation | 0 |
| 2026-08-11 | Category 16 - Trader Terminology and Slang | Began bounded planning after Category 15 locked | Establish the complete trader synonym, slang, user-defined-label, precedence, authorization, privacy, and no-identity-collapse vocabulary before deliverable production | 0 |
| 2026-08-11 | Category 15 - Context and Conversation Language | Accepted and locked Category 15 after comprehensive independent Terra review of 396 cases and final Version 1 validation | Complete the structured conversation-state and follow-up vocabulary with exact revision, clarification, reference, authorization, privacy, and no-stale-context boundaries before Category 16 begins | 1 |
| 2026-08-11 | Category 15 - Context and Conversation Language | Advanced to Ready for Review after comprehensive independent Terra PASS of 18 canonical records, 18 registries, and 396 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact two-track context contracts, privacy, and no runtime-support claim | 0 |
| 2026-08-11 | Category 15 - Context and Conversation Language | Accepted the exact 18-item planning inventory after independent Terra review and authorized canonical production | Preserve accepted-query revision, pending-ambiguity, sample/population, reference-resolution, authorization, privacy, and no-stale-context boundaries before language generation | 0 |
| 2026-08-11 | Category 15 - Context and Conversation Language | Began bounded planning after Category 14 locked | Establish the complete context, follow-up, reference-resolution, state-update, authorization, privacy, and no-invention vocabulary before deliverable production | 0 |
| 2026-08-11 | Category 14 - Comparison and Ranking Language | Accepted and locked Category 14 after comprehensive independent Terra review of 638 cases and final Version 1 validation | Complete the comparison/ranking vocabulary with exact metric, direction, baseline, denominator, tie, coverage, authorization, privacy, and no-default boundaries before Category 15 begins | 1 |
| 2026-08-11 | Category 14 - Comparison and Ranking Language | Advanced to Ready for Review after comprehensive independent Terra PASS of 29 canonical records, 29 registries, and 638 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact comparison/ranking contracts, privacy, and no runtime-support claim | 0 |
| 2026-08-11 | Category 14 - Comparison and Ranking Language | Accepted the exact 29-item planning inventory after independent Terra review and authorized canonical production | Preserve explicit metric, basis, units, population, grouping, baseline, denominator, order, tie, coverage, authorization, privacy, and no-invention boundaries before language generation | 0 |
| 2026-08-11 | Category 14 - Comparison and Ranking Language | Began bounded planning after Categories 1-13 locked | Establish the complete comparison/ranking vocabulary and exact basis, population, partition, order, tie, coverage, authorization, privacy, and no-invention boundaries before deliverable production | 0 |
| 2026-08-11 | Category 13 - Date and Time Language | Accepted and locked Category 13 after comprehensive independent Terra review of 198 cases and final Version 1 validation | Complete the date/time vocabulary with exact UTC, account-IANA/DST, relative/trading/window/session, display/account/Tracker-Eastern, authorization, privacy, and no-invention boundaries before Category 14 begins | 1 |
| 2026-08-11 | Category 13 - Date and Time Language | Advanced to Ready for Review after comprehensive independent Terra PASS of 9 canonical records, 9 registries, and 198 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact temporal/timezone contracts, privacy, and no runtime-support claim | 0 |
| 2026-08-11 | Category 13 - Date and Time Language | Accepted the exact 9-item planning inventory after independent Terra review and authorized canonical production | Preserve raw UTC, authorized account-IANA/DST, event-basis, trusted as-of, calendar/trading-date/window/count, display/account/Tracker-Eastern separation, authorization, privacy, and no-invention boundaries before language generation | 0 |
| 2026-08-11 | Category 13 - Date and Time Language | Began bounded planning after Categories 7 and 12 locked | Establish the complete date/time vocabulary and exact timezone, DST, event-basis, relative-period, range, context, authorization, privacy, and no-invention boundaries before deliverable production | 0 |
| 2026-08-11 | Category 12 - Operators | Accepted and locked Category 12 after comprehensive independent Terra review of 242 cases and final Version 1 validation | Complete the operator vocabulary with exact typed comparison, endpoint, range, set, membership, authorization, privacy-safe text-search, clarification, and no-default boundaries before Category 13 begins | 1 |
| 2026-08-11 | Category 12 - Operators | Advanced to Ready for Review after comprehensive independent Terra PASS of 11 canonical records, 11 registries, and 242 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact typed operator contracts, privacy-safe text search, and no runtime-support claim | 0 |
| 2026-08-11 | Category 12 - Operators | Accepted the exact 11-item planning inventory after independent Terra review and authorized canonical production | Preserve typed operand, comparison, range, set, logical, null, coverage, precedence, authorization, privacy, and cross-category ownership boundaries before language generation | 0 |
| 2026-08-11 | Category 12 - Operators | Synchronized the exact 11-item Version 0 planning inventory for independent final recheck | Preserve template order and exact typed comparison, range, set, logical, null, coverage, precedence, authorization, privacy, and no-invention decisions before canonical production | 0 |
| 2026-08-11 | Category 12 - Operators | Began bounded planning after Category 11 locked | Establish the complete ordered operator vocabulary and its operand, type, null, coverage, precedence, scope, comparison/range/set/logical, clarification, and no-invention boundaries before canonical production | 0 |
| 2026-08-11 | Category 11 - Dimensions | Accepted and locked Category 11 after comprehensive independent Terra review of 2,442 cases and final Version 1 audit | Complete the dimension vocabulary with exact identity, time/session, price, outcome, direction, size, fixed-sequence/barrier, Journal-evidence, duration-definition, privacy, and no-inference boundaries before Category 12 begins | 1 |
| 2026-08-11 | Category 11 - Dimensions | Advanced to Ready for Review after comprehensive independent Terra PASS of 111 canonical records, 111 registries, and 2,442 evaluation cases | Synchronize the pre-lock category and master state while preserving Version 0, unapproved names, unlocked registries, exact 77 Planned/34 Unavailable capability boundaries, and no runtime-support claim | 0 |
| 2026-08-11 | Category 11 - Dimensions | Accepted the corrected exact 111-item planning inventory after independent Terra review and authorized canonical production | Preserve complete source coverage with exact authorization/privacy, UTC/IANA, price-basis, outcome/fee, sequence/barrier, journal-fact, saved-definition, capability, and no-inference boundaries | 0 |
| 2026-08-11 | Category 11 - Dimensions | Saved the corrected exact 111-item Version 0 planning inventory for independent review | Resolve dimension ownership, factual availability, authorization/privacy, time/session, price basis, sequence/barrier, journal-fact, saved-definition, and cross-category boundaries before canonical production | 0 |
| 2026-08-11 | Category 11 - Dimensions | Corrected the controlling source count from 110 to 111 while bounded planning continues | Preserve all Section 6 source bullets after recounting the Outcome group as 11 items rather than omitting `did_not_recover` to fit an incorrect total | 0 |
| 2026-08-11 | Category 11 - Dimensions | Began bounded planning after Categories 1-10 locked | Establish the complete ordered dimension vocabulary and its identity, time, price, outcome, direction, size, sequence, journal, hold-time, capability, privacy, and ownership boundaries before deliverable production | 0 |
| 2026-08-11 | Category 9 - Behaviour Metrics | Accepted and locked Category 9 after 462-case comprehensive review, exact schema correction, and post-lock independent Terra PASS | Complete behavior language with exact activity/performance denominators, pre-filter predecessor barriers, effective saved-rule paths, evidence-gated labels/proxies, counterfactual limits, and no motive/causation invention | 1 |
| 2026-08-11 | Category 9 - Behaviour Metrics | Advanced to Ready for Review after 462-case comprehensive independent Terra PASS | Synchronize the pre-lock category and master state after exact schema correction while preserving Version 0, unapproved names, unlocked registries, and no runtime-support claim | 0 |
| 2026-08-11 | Category 10 - Candle-Based Analytics | Accepted and locked Category 10 after 396-case comprehensive review and post-lock independent Terra PASS | Complete candle analytics language with entry-zero directional formulas, explicit candle approximation and interval/source coverage, bounded windows and grain, interval-aware extrema/recovery, and unavailable benchmark/stop/target dependencies | 1 |
| 2026-08-10 | Category 10 - Candle-Based Analytics | Advanced to Ready for Review after 396-case comprehensive independent Terra PASS | Synchronize the pre-lock category and master review state while preserving Version 0, unapproved names, unlocked registries, and no runtime-support claim | 0 |
| 2026-08-10 | Category 9 - Behaviour Metrics | Accepted the exact 21-item planning inventory after independent Terra review and authorized canonical production | Preserve exact day/ordinal denominators, immediate-predecessor barriers, saved-rule cumulative path and continuation grains, label/proxy limits, and Category 10 giveback ownership without motive or causation invention | 0 |
| 2026-08-10 | Category 10 - Candle-Based Analytics | Accepted the exact 18-item planning inventory after independent Terra review and authorized canonical production | Preserve entry-zero long/short formulas, candle approximation and interval limits, wholly bounded windows, explicit allocation grain, interval-aware timing/recovery, and unavailable dependency boundaries | 0 |
| 2026-08-10 | Category 10 - Candle-Based Analytics | Saved the exact 18-item Version 0 planning inventory for independent review | Resolve candle-source approximation, interval and sequence, direction formulas, held/post-exit horizons, session benchmarks, relative-volume denominator, and stop/target fact boundaries before canonical production | 0 |
| 2026-08-10 | Category 9 - Behaviour Metrics | Saved the exact 21-item Version 0 planning inventory for independent review | Resolve direct, deterministic, proxy, user-labelled, unmeasurable, threshold, saved-rule, lifecycle-barrier, and cross-category ownership boundaries before canonical production | 0 |
| 2026-08-10 | Category 10 - Candle-Based Analytics | Began bounded planning in the second authorized category lane after Category 8 lock | Establish the exact 18-name candle vocabulary and its interval, sequence, coverage, market-data, benchmark, stop/target, and capability boundaries before deliverable production | 0 |
| 2026-08-10 | Category 9 - Behaviour Metrics | Began bounded planning after Categories 3, 6, 7, and 8 locked | Establish the exact 21-name behavior vocabulary and separate direct facts, deterministic results, proxies, user labels, and unmeasurable claims before deliverable production | 0 |
| 2026-08-10 | Category 8 - Execution Metrics | Accepted and locked Category 8 after 418-case comprehensive review and post-lock independent Terra PASS | Complete execution language with stable allocation/event grains, explicit price bases, candidate-before-filter sequencing, exact reconciliation, exclusive unmatched coverage, and factual legitimate-open quantity | 1 |
| 2026-08-10 | Category 7 - Time and Duration Metrics | Accepted and locked Category 7 after 418-case comprehensive review and post-lock independent Terra PASS | Complete time/duration language with raw-UTC and account-IANA semantics, exact lifecycle endpoints and durations, explicit session unavailability, calendar boundaries, predecessor-before-filter barriers, overlap handling, and asymmetric window endpoints | 1 |
| 2026-08-10 | Category 18 - Response Preferences | Accepted and locked Category 18 after 132-case comprehensive review and post-lock independent Terra PASS | Complete response-detail language for six presentation modes while preserving the resolved query, authorization, mathematical truth, evidence, coverage, privacy, capability, clarification, and safety boundaries | 1 |
| 2026-08-10 | Category 8 - Execution Metrics | Accepted the exact 19-item planning inventory after independent Terra review and authorized canonical production | Preserve stable allocation-event and execution-ID grains, distinct simple/weighted prices, exact partial-exit rate, Category 7 duration ownership, candidate-before-filter barriers, and exclusive unmatched-coverage membership | 0 |
| 2026-08-10 | Category 18 - Response Preferences | Accepted the exact six-mode planning inventory after independent Terra review and authorized canonical production | Preserve response presentation as a bounded layer that cannot alter the resolved query, authorization, mathematical truth, evidence, coverage, privacy, clarification, capability state, or safety policy | 0 |
| 2026-08-10 | Category 18 - Response Preferences | Saved the exact six-mode Version 0 planning inventory for independent review | Establish presentation/detail ownership and preserve truth, evidence, coverage, privacy, clarification, capability, and safety boundaries before canonical production | 0 |
| 2026-08-10 | Category 18 - Response Preferences | Opened a third dependency-safe, planning-only lane under the owner-approved three-category limit | Define the exact six response-detail modes from the controlling source plan without waiting on unrelated metric categories, while retaining low-resource single-file work and independent review | 0 |
| 2026-08-10 | Category 8 - Execution Metrics | Saved the exact 19-item Version 0 planning inventory for independent review | Resolve event/execution count ownership, price weighting, partial-exit rate, duration overlap, lifecycle barriers, and unmatched coverage before canonical production | 0 |
| 2026-08-10 | Category 8 - Execution Metrics | Began bounded planning in the second authorized category lane after Category 6 lock | Establish the exact 19-name execution vocabulary and its entry/exit event, allocation role, weighted price, scaling, partial-exit, flip, attempt, sequence, duration, quantity reconciliation, unmatched, open-quantity, unit, and capability boundaries before deliverable production | 0 |
| 2026-08-10 | Category 6 - Position Size Metrics | Accepted and locked Category 6 after 308-case batch review, focused remediation, and comprehensive independent Terra PASS | Complete size/exposure language with exact execution-side and maximum-position semantics, no exposure/baseline fallbacks, explicit bucket/predecessor/transition boundaries, and zero/unknown denominator containment | 1 |
| 2026-08-10 | Category 7 - Time and Duration Metrics | Accepted the exact 19-item planning inventory after independent Terra review and authorized deliverable production | Preserve raw-instant and account-timezone rendering, exact lifecycle endpoints/durations, named-session unavailability, calendar ownership, predecessor-before-filtering barriers, overlap handling, and asymmetric trading-window endpoints | 0 |
| 2026-08-10 | Category 7 - Time and Duration Metrics | Began bounded planning in the second authorized category lane after Category 4 lock | Establish the exact 19-name time/duration vocabulary and its timestamp, timezone, session, calendar-bucket, holding, daily-frequency, prior-outcome interval, ordering, coverage, and capability boundaries before deliverable production | 0 |
| 2026-08-10 | Category 4 - Edge and Quality Metrics | Accepted and locked Category 4 after 286-case batch review, focused remediation, and comprehensive independent Terra PASS | Complete edge/quality language with exact supported formulas, explicit planned-only definitions, population P/L dispersion, non-default concentration/outlier boundaries, and one-deterministic-extreme net exclusions | 1 |
| 2026-08-10 | Category 6 - Position Size Metrics | Accepted the exact 14-item planning inventory after independent Terra review and authorized deliverable production | Preserve execution-side share volume, maximum-open-quantity position size, and accepted quantity/notional primitives while keeping undefined exposure, normal baseline, bucket defaults, predecessor barriers, size transitions, and profit-per-exposure denominator contracts explicit rather than invented | 0 |
| 2026-08-10 | Category 6 - Position Size Metrics | Began bounded planning in the second authorized category lane after Category 5 lock | Establish the exact 14-name size/exposure vocabulary and its execution quantity, position lifecycle, notional, baseline, outcome-sequence, denominator, currency, and capability boundaries before deliverable production | 0 |
| 2026-08-10 | Category 5 - Fees and Costs Metrics | Accepted and locked Category 5 after exact 220-case structural validation, focused semantic remediation, and final independent Terra PASS | Complete fee/cost language with kind-backed unavailable components, non-netted charge cost and separate credits, exact denominators, stable dependency boundaries, and required exact/estimated/partially available/unavailable display states | 1 |
| 2026-08-10 | Category 4 - Edge and Quality Metrics | Accepted the exact 13-item planning inventory after independent Terra review and authorized deliverable production | Preserve seven evidence-backed supported concepts and six explicit planned concepts without inventing payoff, consistency, return-denominator, multi-trade concentration, or outlier-dependency formulas; retain supported net-only one-extreme exclusions and defer gross variants | 0 |
| 2026-08-10 | Category 4 - Edge and Quality Metrics | Began bounded planning after the Category 3 lock while Category 5 deliverable production continues in the other authorized lane | Establish the exact 13-name quality-and-edge vocabulary and its formula, denominator, currency, sample, outlier, and capability boundaries before deliverable production | 0 |
| 2026-08-10 | Category 3 - Outcome Metrics | Accepted and locked Category 3 after exact 374-case structural validation, focused semantic remediation, and final independent Terra PASS | Complete outcome counts, rates, realized-day results, and current/maximum streak language with exact population, basis, fee, timezone, denominator, ordering, and sequence-barrier boundaries | 1 |
| 2026-08-10 | Category 5 - Fees and Costs Metrics | Accepted the exact 10-item planning inventory and authorized deliverable production in the second category lane | Lock transaction-cost, credit, entered-share, coverage-label, expectancy-dependency, broker-identity, and capability-status boundaries before canonical records | 0 |
| 2026-08-10 | Master project / Category 5 | Authorized a maximum of two concurrent category files and opened Category 5 as the second planning lane | Improve throughput for remote Markdown generation while preserving one-file ownership, dependency order, controller-only master edits, and the low-resource boundary | 0 |
| 2026-08-10 | Category 3 - Outcome Metrics | Accepted the exact 17-item planning inventory and authorized deliverable production | Lock the no-duplicate trade-count mapping and the direct gross-versus-net clarification rule while preserving Category 1's fee-aware multi-metric summary default | 0 |
| 2026-08-10 | Category 3 - Outcome Metrics | Began bounded planning and controlling-inventory production after Category 2 lock | Establish the complete 17-name outcome vocabulary and its closed/open, day, rate, denominator, streak, fee-basis, timezone, and deterministic ordering boundaries before deliverable production | 0 |
| 2026-08-10 | Category 2 - Profit and Loss Metrics | Accepted and locked Category 2 after exact 484-case structural validation, focused semantic remediation, and final independent Terra PASS | Complete the profit-and-loss vocabulary with exact gross/net, realized/unrealized, fee, currency, account, period, alias, clarification, and unsupported-data boundaries before Category 3 begins | 1 |
| 2026-08-10 | Category 2 - Profit and Loss Metrics | Resumed Category 2 at deliverable production and reconciled the master progress summary after the project pause | Accept the complete 22-item production target while treating explicit before-fee/after-fee names as routed language aliases, preserve Category 1 as complete and locked, and continue the ordered workflow | 0 |
| 2026-08-05 | Category 2 - Profit and Loss Metrics | Began bounded category planning and controlling-inventory production after Category 1 lock | Establish the complete profit-and-loss metric vocabulary before any language-registry or evaluation expansion | 0 |
| 2026-08-05 | Category 1 - Intents | Accepted and locked Category 1 after final Batch 3 remediation, exact 594-case structural and changed-case fingerprint audits, and independent Luna PASS | Complete the controlling intent vocabulary with reviewed routing, evidence, ambiguity, unavailable-data, and protected-action boundaries before Category 2 begins | 1 |
| 2026-08-05 | Category 1 - Intents | Accepted Evaluation Batch 2 after Terra remediation, 396-case structural validation, exact changed-case fingerprint audit, and final independent Luna PASS | Preserve owning-intent routing, ambiguity, exact identity/version, ranking population, chronology, window, counterfactual, and no-causation boundaries before the final batch | 0 |
| 2026-08-05 | Category 1 - Intents | Returned Evaluation Batch 2 for semantic remediation after independent Luna review | Correct invented comparisons, misrouted negative examples, overfilled ambiguous cases, and rankings without valid candidate populations before acceptance | 0 |
| 2026-08-05 | Category 1 - Intents | Accepted Evaluation Batch 1 after 198-case structural validation, Terra semantic remediation, independent recheck, and final Terra PASS | Preserve exact routing, temporal scope, stored-label, pattern, causation, unavailable-data, and clarification boundaries before starting Batch 2 | 0 |
| 2026-08-05 | Category 1 - Intents | Accepted 27 canonical records and 27 complete language registries after Luna production and Terra risk review; began structured evaluation production | Advance the category only after counts, focused clarifications, symbol safety, chronology, protected-action, and unavailable-state boundaries reconciled | 0 |
| 2026-08-05 | Category 1 - Intents | Began planning under the approved lead-controller and delegated-worker boundary; 27-item inventory draft created for review | Start the first category without widening controller or worker write scope | 0 |
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
