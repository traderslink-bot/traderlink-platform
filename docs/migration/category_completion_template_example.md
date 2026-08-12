# Category Completion Template Example
## Required template for every TradersLink AI language-inventory category

> Template-use rule: in a category document, replace the two template-only
> headings above with one clear heading in the form
> `# Category [Number]: [Category Name]`. Do not retain the words
> `Template Example` or add a second descriptive title.

# Category Metadata

| Field | Value |
|---|---|
| Category name | |
| Category number | |
| Category slug | |
| File name | |
| Category type | |
| Status | Not Started |
| Version | 0 |
| Created date | |
| Last updated | |
| Dependencies | |
| Owner | AI language inventory workflow |

---

# 1. Category Purpose

Describe:

- the exact user-language problem this category solves;
- its role in structured query interpretation;
- the chatbot features that depend on it;
- what is outside this category.

---

# 2. Category Boundaries

## Included

List all concept families included in this category.

## Excluded

List related concepts owned by other categories.

## Cross-Category References

List concepts referenced here but owned elsewhere. Do not redefine them.

---

# 3. Planning Analysis

Planning must be completed before language coverage begins.

## 3.1 Required Planning Questions

1. What exact problem does this category solve?
2. What canonical concepts belong here?
3. What related concepts belong elsewhere?
4. What data is required?
5. Which deterministic tools will answer these requests?
6. Which concepts are directly observed?
7. Which concepts are deterministically derived?
8. Which concepts are proxy indicators?
9. Which concepts are user-labelled?
10. Which concepts are not measurable?
11. Which terms are ambiguous?
12. What defaults are safe?
13. What conditions require clarification?
14. What combinations are invalid?
15. What evaluation coverage proves completion?

## 3.2 Dependencies

Document:

- required earlier categories;
- required database fields or services;
- required analytics tools;
- required UI context;
- required user-defined vocabulary;
- required external data;
- unsupported dependencies.

## 3.3 Risks

Document:

- ambiguity risks;
- synonym collisions;
- duplicate-concept risks;
- unsupported-data risks;
- false-positive mapping risks;
- privacy and account-boundary risks;
- causation risks;
- sample-size risks.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

Use only these capability-status values: `Supported`, `Planned`, `Unavailable`,
`Unsupported`, or `Deprecated`. Keep capability status separate from the
current evidence boundary. For example, a planned Chat intent may have existing
deterministic Journal primitives without being executable through Chat.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | | | | | Planned | |

## Proposed Inventory Additions

List possible missing concepts here. Do not add them to the controlling inventory until approved.

## Proposed Removals or Merges

List proposals and reasons. Do not silently remove or merge controlling items.

---

# 5. Canonical Inventory Deliverable

Repeat this section for every controlling inventory item.

`Evidence classification` may contain more than one of `directly observed`,
`deterministically derived`, `proxy-based`, and `user-labelled` when the
concept genuinely spans evidence types. Use `not applicable` only when none of
those evidence classes describes the concept. Do not force a mixed concept into
one class.

## `[canonical_name]`

| Field | Value |
|---|---|
| Inventory ID | |
| Category | |
| Subcategory | |
| Canonical name | |
| Display name | |
| Exact definition | |
| Distinction from related concepts | |
| Evidence classification | |
| Capability status | |
| Result units | |
| Open-trade support | |
| Fee handling | |
| Version | |

### Related Concepts

- Broader concept:
- Narrower concepts:
- Commonly confused concepts:
- Must not be merged with:

---

# 6. Language Registry Deliverable

Repeat this section for every controlling inventory item.

## `[canonical_name]` Language Registry

### Exact Definition

### Formal Wording

-

### Normal Conversational Wording

-

### Trader Slang

-

### Abbreviations

-

### Common Misspellings

-

### Noisy or Incomplete Input

-

### Singular and Plural Forms

-

### Full Questions

-

### Commands

-

### Sentence Fragments

-

### Follow-Up Wording

-

### Correction Wording

-

### Comparison Wording

-

### Ranking Wording

-

### Negated Wording

-

### Exclusion Wording

-

### Multi-Filter Wording

-

### Multi-Part Question Wording

-

### Ambiguous Wording

-

### Negative Examples

These examples must not map to this concept.

-

### Context Requirements

Document required conversation, selected-trade, selected-ticker, page, or prior-query context.

### Required Data

-

### Optional Data

-

### Valid Filters

-

### Valid Groupings

-

### Valid Operators

-

### Compatible Intents

-

### Incompatible Combinations

-

### Default Interpretation

State the safe default, or state that none exists.

### Clarification Conditions

State exactly when clarification is required.

### Recommended Clarification Wording

Provide one focused question for the highest-impact unresolved field. If more
than one field is missing, list separate questions in the order they should be
asked; do not combine the full checklist into one compound prompt.

### Unsupported Conditions

-

### Target Analytics Tool or Query Capability

-

### Result Units

-

### Fee Handling

-

### Open-Trade Handling

-

### Sample-Size Considerations

-

---

# 7. Evaluation Cases Deliverable

## 7.1 Evaluation Case Schema

```json
{
  "caseId": "",
  "caseType": "canonical",
  "input": "",
  "expectedPrimaryIntent": "",
  "expectedSecondaryIntents": [],
  "expectedCanonicalConcepts": [],
  "expectedFilters": [],
  "expectedGroupings": [],
  "expectedOperators": [],
  "expectedComparison": null,
  "expectedTimeRange": null,
  "expectedSelectedEntity": null,
  "expectedContextRequirements": [],
  "expectedCapabilityStatus": "",
  "expectedProtectedAction": null,
  "confirmationExpected": false,
  "clarificationExpected": false,
  "expectedClarificationQuestion": null,
  "unsupportedExpected": false,
  "expectedUnsupportedReason": null,
  "notes": ""
}
```

`expectedPrimaryIntent` is required for an intent evaluation. Secondary intents
must be listed in interpretation order and must remain empty when none apply.
Use explicit empty arrays or `null` values rather than omitting fields. A
protected-action expectation records draft/proposal handling only;
`confirmationExpected: true` never authorizes a write or state change.

### 7.1.1 Final Evaluation Suite Extension

Category 20 and any later controller-authorized final-suite revision must append
these eleven fields in this exact order to the 21-field base schema. Locked
Categories 1-19 retain their accepted Version 1 schemas; this extension does not
retroactively rewrite their cases.

```json
{
  "expectedOwnerInventoryReferences": [],
  "expectedSubrequests": null,
  "expectedToolTarget": null,
  "executionProhibited": true,
  "expectedAcceptedQueryBefore": null,
  "expectedPendingAmbiguityBefore": null,
  "expectedAcceptedQueryAfter": null,
  "expectedPendingAmbiguityAfter": null,
  "expectedPolicyOutcomes": {
    "deterministic_truth_policy": {},
    "server_authoritative_scope_policy": {},
    "privacy_minimization_policy": {},
    "evidence_and_coverage_policy": {},
    "missing_data_no_invention_policy": {},
    "unsupported_request_policy": {},
    "causation_policy": {},
    "prediction_policy": {},
    "advice_policy": {},
    "protected_action_confirmation_policy": {},
    "untrusted_content_policy": {}
  },
  "expectedCombinationAxes": null,
  "expectedCombinationOutcome": null
}
```

Every owner reference uses exact locked category/ID/name/version/status fields.
Every genuine multi-part request has two through four ordered clause objects
and deterministic top-level projection; every other case uses
`expectedSubrequests: null`. Category 15 accepted/pending state and all eleven
Category 19 policies must be explicit. A null tool target and prohibited
execution are assertions, not an implemented runtime.

## 7.2 Required Case Types

- canonical;
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
- multi-filter;
- multi-part;
- ambiguous;
- negative example;
- unsupported-data example;
- selected-entity context example;
- cross-category example where applicable.

## 7.3 Evaluation Summary

| Case Type | Required | Completed | Passed | Notes |
|---|---:|---:|---:|---|
| Canonical | | | | |
| Formal paraphrase | | | | |
| Conversational paraphrase | | | | |
| Slang | | | | |
| Abbreviations | | | | |
| Misspelling | | | | |
| Noisy input | | | | |
| Commands | | | | |
| Fragments | | | | |
| Follow-ups | | | | |
| Corrections | | | | |
| Comparisons | | | | |
| Rankings | | | | |
| Negation | | | | |
| Exclusion | | | | |
| Multi-filter | | | | |
| Multi-part | | | | |
| Ambiguity | | | | |
| Negative examples | | | | |
| Unsupported data | | | | |
| Selected entity | | | | |
| Cross-category | | | | |

---

# 8. Coverage Report Deliverable

## 8.1 Inventory Coverage

| Measure | Count |
|---|---:|
| Controlling inventory items | |
| Completed items | |
| Incomplete items | |
| Proposed additions | |
| Proposed removals or merges | |
| Locked canonical names | |

## 8.2 Language Coverage

| Measure | Count |
|---|---:|
| Formal variants | |
| Conversational variants | |
| Slang variants | |
| Abbreviations | |
| Misspellings | |
| Noisy or incomplete inputs | |
| Singular and plural forms | |
| Full questions | |
| Commands | |
| Fragments | |
| Follow-ups | |
| Corrections | |
| Comparison examples | |
| Ranking examples | |
| Negated examples | |
| Exclusion examples | |
| Multi-filter examples | |
| Multi-part examples | |
| Ambiguous examples | |
| Negative examples | |
| Clarification wording examples | |

## 8.3 Evaluation Coverage

| Measure | Count |
|---|---:|
| Total evaluation cases | |
| Passed | |
| Failed | |
| Clarification cases | |
| Unsupported cases | |
| Cross-category cases | |

### 8.3.1 Final Evaluation Suite Evidence

Complete this subsection for Category 20 or another controller-authorized final
suite:

| Measure | Required evidence |
|---|---|
| Exact array/case count | One reviewed result per required array and case type |
| Ordered schema | Exact 21-field base plus eleven-field extension |
| Multi-part projection | Clause count, 23-field clause schema, and exact reductions |
| Important-question quota | Normalized unique input, case ID, digest, PASS, and review reference |
| Locked-owner crosswalk | One row per locked owner with source anchor, owner PASS case, Category 20 proof class, disposition, rationale, and review result |
| Policy invariants | Exact policy key, universal presence, owner PASS case, and constrain/refuse exemplar |
| Acceptance criteria | Exact criterion-to-passing-case crosswalk |
| Combination matrix | All eight ordered axes and every required outcome class |
| Tool/runtime boundary | Exact tool target and execution assertion for every case |
| Remaining gaps | Explicit zero or exact unresolved IDs; never an aggregate-only waiver |

## 8.4 Data and Tool Coverage

- Required data:
- Optional data:
- Missing data:
- Tool targets:
- Tools not yet implemented:
- Unsupported capabilities:

## 8.5 Overlap Review

- Duplicate concepts found:
- Synonym collisions:
- Cross-category conflicts:
- Terms requiring global ambiguity policy:
- Terms requiring user-defined aliases:

## 8.6 Remaining Gaps

List every unresolved gap. Do not use vague wording such as “and similar items.”

---

# 9. Acceptance Checklist

## Planning

- [ ] Purpose is complete.
- [ ] Boundaries are complete.
- [ ] Dependencies are documented.
- [ ] Risks are documented.
- [ ] Planning questions are answered.

## Controlling Inventory

- [ ] Complete canonical concept list exists.
- [ ] Controlling-inventory statement is present.
- [ ] No listed item was silently omitted.
- [ ] No listed item was silently renamed.
- [ ] No listed item was silently merged.
- [ ] Proposed additions are separated.
- [ ] Duplicate concepts are resolved.

## Canonical Inventory

- [ ] Every item has a stable inventory ID.
- [ ] Every item has a canonical name.
- [ ] Every item has an exact definition.
- [ ] Related concepts are distinguished.
- [ ] Classification, status, and version are present.

## Language Registry

- [ ] Formal wording is complete.
- [ ] Conversational wording is complete.
- [ ] Trader slang is complete.
- [ ] Abbreviations are complete.
- [ ] Misspellings are complete.
- [ ] Questions are complete.
- [ ] Commands are complete.
- [ ] Fragments are complete.
- [ ] Follow-ups are complete.
- [ ] Corrections are complete.
- [ ] Comparisons are complete.
- [ ] Rankings are complete.
- [ ] Negation and exclusion are complete.
- [ ] Multi-filter examples are complete.
- [ ] Multi-part examples are complete.
- [ ] Ambiguity is complete.
- [ ] Negative examples are complete.

## Execution Requirements

- [ ] Required and optional data are documented.
- [ ] Valid filters are documented.
- [ ] Valid groupings are documented.
- [ ] Valid operators are documented.
- [ ] Compatible intents are documented.
- [ ] Incompatible combinations are documented.
- [ ] Defaults are documented.
- [ ] Clarification conditions are documented.
- [ ] Unsupported conditions are documented.
- [ ] Tool targets are documented.
- [ ] Units, fees, open trades, and sample-size rules are documented.

## Evaluation

- [ ] Evaluation cases exist for every important concept.
- [ ] Expected structured interpretations are present.
- [ ] Negative examples are tested.
- [ ] Ambiguous cases are tested.
- [ ] Unsupported cases are tested.
- [ ] Cross-category cases are tested where needed.

## Coverage Report

- [ ] Counts are complete.
- [ ] Gaps are listed.
- [ ] Overlaps are reviewed.
- [ ] Unsupported capabilities are listed.
- [ ] No unresolved blocker is hidden.

## Approval

- [ ] Category reached Ready for Review.
- [ ] Review changes are completed.
- [ ] Canonical names are approved.
- [ ] Canonical names are locked.
- [ ] Version is updated.
- [ ] Master tracker is updated.
- [ ] Change log is updated.
- [ ] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

-

## Required Changes

-

## Completed Changes

-

## Approval Decision

- Status:
- Approved by:
- Approval date:
- Version:
- Canonical names locked: Yes / No

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-12 | Added the final Evaluation Suite extension and evidence-report requirements | Preserve Category 20's exact owner, subrequest, state, policy, combination, crosswalk, IQA, acceptance, and no-runtime proof contract in the shared template | 1 |
| | Initial category file created | | 0 |
