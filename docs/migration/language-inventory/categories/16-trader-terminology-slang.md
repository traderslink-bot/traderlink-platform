# Category 16: Trader Terminology and Slang

# Category Metadata

| Field | Value |
|---|---|
| Category name | Trader Terminology and Slang |
| Category number | 16 |
| Category slug | trader-terminology-slang |
| File name | 16-trader-terminology-slang.md |
| Category type | Vocabulary routing and account-scoped user-defined language |
| Status | Complete |
| Version | 1 |
| Created date | 2026-08-11 |
| Last updated | 2026-08-11 |
| Dependencies | Locked Categories 1-15 and 18; approved account-scoped vocabulary storage; Category 17 ambiguity policy; Category 19 policy; Category 20 evaluation |
| Owner | AI language inventory workflow |

The lead controller accepted the exact fifteen-record controlling inventory
and 36-child-term boundary on 2026-08-11 and authorized canonical production.
The lead controller approved and locked all fifteen exact canonical names and
all fifteen corresponding language registries on 2026-08-11. The category and
canonical records are Complete Version 1, and the master tracker records the
synchronized Complete and locked state. Nothing in this document implements a
registry/resolver, authorizes data access, or claims a Chat runtime capability.

---

# 1. Category Purpose

This category defines how trader vocabulary, slang, aliases, and authorized
user-created labels are resolved into already-controlled meanings. It prevents
casual language from becoming a second analytics vocabulary, and it preserves
important distinctions when phrases that sound related are not equivalent.

The source plan requires an editable registry with canonical term, category,
synonyms, deprecated terms, locale, and version. It declares six important
vocabulary groups and nine classes of user-created language. This category
therefore owns the language-resolution classes and their account-scoped
registry behavior. The metric, dimension, intent, operator, time, comparison,
and context concepts reached through those classes remain owned by Categories
1-15 and 18.

This category must support:

- locale- and version-aware generic vocabulary entries;
- editable, versioned, account-scoped user labels and aliases;
- retained deprecated-term history without silently reviving an old meaning;
- exact-match precedence for a strong authorized user label only inside the
  same user/workspace/Journal-account boundary;
- conservative fuzzy matching, ambiguity detection, alias collision handling,
  abbreviation and ticker safety, and explicit clarification;
- routing to locked owner concepts without redefining their calculations,
  evidence, populations, capability status, or coverage; and
- privacy-safe resolution without placing raw IDs or unnecessary private label
  text in prompts, logs, errors, or cross-account context.

This category does not calculate a metric, classify a factual trade by itself,
diagnose motive or emotion, infer a user's private label, read arbitrary notes,
create or edit a label, provide trading advice, predict results, establish
causation, or implement any runtime.

---

# 2. Category Boundaries

## Included

- The six source-declared vocabulary groups, in source order: Trade Outcome,
  Trading Frequency, Profit Giveback, Repeat Trading, Position Size, and Price
  Terms.
- Every one of the 36 source-listed terms as a mandatory child language entry
  whose own boundary must be preserved in Section 6; none is silently omitted
  or treated as necessarily identical to every other term in its group.
- The nine source-declared user-language classes, in source order: tags,
  setups, strategies, rules, mistakes, playbooks, session names, price buckets,
  and goals.
- Generic and account-scoped aliases, abbreviations, spelling variants,
  deprecated terms, locale, registry version, definition/effective version,
  coverage, provenance class, match method, collision state, and owning locked
  concept reference.
- Exact-match and fuzzy-match gates, user-label precedence, alias collision
  handling, ticker/token safety, clarification, deprecation, and account
  isolation.

## Excluded

- Canonical analytics definitions, formulas, populations, filters, groupings,
  operators, dates, comparisons, rankings, and response modes owned by locked
  Categories 1-15 and 18.
- Global ambiguity/confidence policy owned by Category 17, even though this
  category supplies vocabulary-specific collision and clarification facts.
- Security, retention, provider, evidence, advice, causation, and logging policy
  owned by Category 19, and final cross-category proof owned by Category 20.
- Creating, renaming, merging, deleting, or mutating user labels or aliases.
  A protected write, if ever approved elsewhere, remains draft/confirmation
  controlled and is not authorized here.
- Inferring revenge, FOMO, discipline, forced trading, a mistake, a setup, a
  strategy, a rule breach, a goal, or any motive from executions, outcomes,
  ticker, price, duration, or prose alone.
- Treating a note, screenshot, browser text, raw identifier, opaque handle, or
  another account's vocabulary as authorization or language evidence.

## Cross-Category References

- Category 1 owns intent routing and protected-action boundaries.
- Categories 2-10 own metrics such as gross/net P/L, exact breakeven outcomes,
  overtrading proxies, repeat attempts, size measures, and candle
  `profit_giveback`.
- Category 11 owns dimensions and factual labels including `setup`, `strategy`,
  `playbook`, `custom_tag`, `mistake`, `rule`, `price_buckets`, and
  `penny_stocks_where_explicitly_defined`.
- Categories 12-14 own operators, time resolution, comparisons, and rankings.
- Category 15 owns trusted conversation state and selected-entity resolution.
- Category 18 owns presentation preference only.
- Categories 17, 19, and 20 own global ambiguity, policy, and final evaluation.

---

# 3. Planning Analysis

## 3.1 Required Planning Questions

1. **What exact problem does this category solve?** It resolves trader language
   and authorized private aliases to locked concepts without flattening
   non-identical phrases, inventing private meanings, or duplicating analytics.
2. **What canonical concepts belong here?** Fifteen registry classes: the six
   source-declared generic vocabulary groups followed by the nine
   source-declared user-label classes. The 36 listed expressions are mandatory
   child language entries, not 36 new analytics concepts.
3. **What related concepts belong elsewhere?** All routed intents, metrics,
   dimensions, operators, dates, comparisons, rankings, context fields, and
   response modes remain with their locked owners. A phrase is not allowed to
   change an owner's exact definition or capability status.
4. **What data is required?** A server-authorized account scope; generic
   registry entry and version; locale; canonical owner reference; aliases and
   deprecated terms; for user language, authorized label class, effective
   label/definition version, aliases, status, coverage, and a server-side
   opaque reference; and privacy-safe collision/match metadata.
5. **Which deterministic tools will answer these requests?** A versioned
   vocabulary loader; locked-concept router; server-authorized account-label
   loader; locale/Unicode normalizer; exact resolver; conservative fuzzy
   candidate generator; ticker/abbreviation guard; collision detector;
   capability/coverage validator; and Category 17 clarification router. These
   are planned tool contracts, not implemented capabilities.
6. **Which concepts are directly observed?** Stored generic registry rows,
   explicit authorized label names/aliases, their class/locale/version/status,
   and an explicit user-authored use of a term are directly observed.
7. **Which concepts are deterministically derived?** Normalized exact-match
   keys, candidate sets, collision states, effective-version selection, and
   owner-concept routing can be derived from authorized versioned facts.
8. **Which concepts are proxy indicators?** Activity language such as
   `overtrade`, `kept clicking`, or `churned`, and sequence language such as
   `revenge traded`, can route to an explicitly requested proxy only under its
   locked owner. They never prove motive, quality, or discipline.
9. **Which concepts are user-labelled?** Tags, setups, strategies, rules,
   mistakes, playbooks, session names, price buckets, and goals. Their meaning
   exists only through an authorized explicit definition/version and coverage.
10. **Which concepts are not measurable?** The registry classes themselves are
    language routes, not measures. Subjective cheapness, forced trading,
    revenge, failure to lock gains, or approximate scratch status is not
    measurable without the owning explicit threshold, label, or evidence
    contract.
11. **Which terms are ambiguous?** Every family contains risks: `green`/`red`
    can describe a trade or day and require basis; `flat` is exact zero while
    `scratch` may be approximate; frequency phrases may express a judgment or
    a thresholded proxy; `giveback` has candle, P/L-path, and behavioral
    readings; re-entry can be an add or a new attempt; `position`, `size`, and
    `exposure` are different measures; price terms differ by threshold, basis,
    currency, and saved definition; and private aliases may collide with one
    another, generic language, abbreviations, or ticker symbols.
12. **What defaults are safe?** Preserve the explicit text, account, locale,
    and effective registry version. A unique normalized exact authorized match
    may resolve within the same account and compatible query type. There is no
    safe default for metric basis, population, threshold, price basis,
    currency, label class, fuzzy candidate, causal meaning, or account.
13. **What conditions require clarification?** Multiple compatible exact
    matches; an exact user/generic collision whose query type does not resolve
    ownership; every non-unique or insufficiently strong fuzzy match; unknown
    locale/version; missing account authorization; ambiguous abbreviation or
    ticker-like token; missing outcome basis/grain; `scratch` without exact
    versus tolerance meaning; subjective frequency/giveback/revenge terms;
    re-entry versus add; size versus quantity/notional/exposure; or a price term
    without its approved threshold/basis/currency/definition.
14. **What combinations are invalid?** Cross-account label loading; raw IDs or
    private label text in model/log output; current-quote or ticker inference
    for penny-stock status; treating every term in a source group as identical;
    allowing a fuzzy user alias to override a valid generic exact match;
    accepting a bare abbreviation as a label or ticker without safe grammar;
    routing a deprecated term to a changed meaning without version evidence;
    inferring motive/quality/advice/causation; using an alias to change a locked
    concept; or claiming runtime support from this inventory.
15. **What evaluation coverage proves completion?** Later Sections 5-8 must
    cover all fifteen records and all 36 mandatory generic expressions; exact,
    fuzzy, deprecated, locale, user-alias, collision, abbreviation, ticker,
    missing-definition, stale-version, unauthorized, cross-account, privacy,
    ambiguity, unsupported, no-cause, no-advice, and cross-category cases.

## 3.2 Dependencies

- **Locked owner concepts:** Categories 1-15 and 18, including exact selected-
  basis outcomes; factual lifecycle starts and repeat attempts; thresholded
  behavior proxies; exact size/quantity/notional contracts; candle-only
  `profit_giveback`; authorized Journal labels; price-bucket/penny-stock
  definitions; operators, time, comparisons, and accepted conversation state.
- **Registry contract:** an editable append/version-aware store containing a
  stable registry entry, canonical owner reference, category/class, locale,
  current aliases, deprecated aliases, definition/effective version, and
  coverage. A changed meaning creates a new version; prior language remains
  auditable and is not silently rewritten.
- **Authorization contract:** server-derived Platform user, workspace, and
  Journal account; every user-defined candidate must be loaded only from that
  exact scope and revalidated at use time. An alias string or raw/opaque ID is
  not authorization.
- **Resolution contract:** Unicode- and locale-aware normalization; normalized
  exact matching; compatible query-type filtering; collision detection;
  approved ticker/abbreviation guards; and a versioned fuzzy algorithm with an
  approved strength threshold. Until the algorithm and threshold are approved,
  fuzzy candidates require clarification and cannot auto-route.
- **Policy/evaluation dependencies:** Category 17 for staged highest-impact
  clarification and confidence policy, Category 19 for privacy/logging/
  retention/advice/causation policy, and Category 20 for end-to-end proof.
- **Unsupported dependencies:** arbitrary prompt-embedded synonym lists;
  unrestricted note/text search; raw account, label, broker, source, execution,
  trade, or conversation identifiers; another account's vocabulary; client-
  claimed authorization; current quote or market-data classification; V3
  fallback; unrestricted SQL; and unapproved provider or fuzzy-model behavior.

## 3.3 Exact and Fuzzy Match Contract

1. Normalize with the registry entry's declared locale and a versioned approved
   Unicode/case/whitespace/punctuation policy. Preserve the original text for
   audit; normalization never changes the stored label or canonical owner.
2. A **strong exact user-label match** exists only when one active authorized
   label or alias in the current account has the same normalized form, its
   class is compatible with the query slot, its effective version and coverage
   are available, and no same-scope collision remains. Only this match may take
   precedence over a generic interpretation.
3. A user-label match never takes precedence outside the same authorized
   account, across an incompatible class, from a stale/deprecated meaning, or
   merely because a label string appears in prose, a browser, or a raw ID.
4. A generic exact match remains governed by its locked owner and can still
   require clarification for basis, grain, threshold, or meaning. Exact text
   does not make an underspecified analytics request complete.
5. Fuzzy matching is candidate generation, not authority. Auto-resolution is
   prohibited until a controller-approved, versioned algorithm and strength
   threshold exist. Later auto-resolution, if approved, must additionally be
   unique, same-account, class-compatible, locale-compatible, non-deprecated,
   non-ticker-like, non-abbreviation-only, and collision-free. Otherwise ask
   one focused Category 17 clarification question.
6. A bare uppercase/short token is checked as a possible ticker or abbreviation
   before alias routing. A user alias cannot capture a valid ticker in ticker
   grammar, and ticker shape cannot create a label or analytics meaning.
7. Deprecated terms remain versioned audit facts. They may route only when the
   prior and current meaning are provably equivalent under an explicit retained
   mapping; a changed, split, merged, or ambiguous meaning requires
   clarification and never silently migrates the user's request.

## 3.4 Risks, Overlaps, and Decisions

| Area | Draft decision / risk control |
|---|---|
| Inventory unit decision | Use the six explicitly named synonym groups and nine explicitly listed user-label classes as the fifteen canonical registry records. The 36 source terms are required child entries, because promoting each phrase would duplicate locked analytics concepts while collapsing them into six undifferentiated synonyms would lose material meaning. |
| Locked-owner precedence | Category 16 routes only. A slang phrase cannot change a locked formula, basis, population, threshold, coverage, capability status, evidence class, or availability. |
| User-label precedence | A strong normalized exact active label/alias may win only in the same server-authorized account and compatible label slot. Cross-account, fuzzy, stale, deprecated, colliding, or incompatible candidates never receive precedence. |
| Alias collisions | Detect collisions among current aliases, deprecated aliases, generic terms, label classes, abbreviations, and ticker-like tokens. Use trusted typed query context only when it yields one compatible candidate; otherwise clarify. |
| Private vocabulary | Load the minimum required candidates server-side. Model context and operational logs use privacy-safe typed match metadata or digests, not raw IDs or unnecessary private label/definition/note text. Trader-visible output may echo a label only when authorized and required to answer. |
| Locale and version | Registry rows declare locale and version. Never silently fall back across locales or overwrite old semantics. Unknown locale/effective version is clarification or unavailable, not English/current-version guessing. |
| Exact versus fuzzy | Exact matching follows the bounded contract above. Fuzzy auto-routing remains unavailable until its algorithm and threshold are approved; candidate suggestions alone cannot establish meaning. |
| Outcome language | `flat` follows the locked exact-zero owner. `scratch` remains distinct because the source calls it approximate; bare scratch wording requires exact-zero versus explicit tolerance resolution and must not silently invent a tolerance. `green`/`red`/`winner`/`loser` still require eligible grain and selected gross/net basis. |
| Frequency language | `overtrade` and `trade too much` are judgments unless an explicit saved threshold or locked proxy is requested. `kept clicking` can describe executions rather than lifecycle starts; `forced trades` is subjective; `churned` may mean turnover, repeats, or excessive activity. |
| Giveback language | Category 10 solely owns candle `profit_giveback`. Phrases about being green then losing it, a winner turning red, or round-tripping profit may instead ask about a trade/day P/L path. `failed to lock in gains` adds a judgment and cannot be treated as factual cause or advice. |
| Repeat language | `re-entered`, `went back in`, and `second shot` route to Category 8 repeat attempts only when a prior lifecycle returned to zero. Adding while still open is not another attempt. `revenge traded` requires explicit user-authored meaning and never follows from a loss plus re-entry alone. |
| Size language | Shares/quantity, maximum open position, dollar notional, and exposure are distinct. `went bigger`, `sized up`, and `went heavy` need an explicit comparison baseline and size measure; no default exposure or share-size substitution is allowed. |
| Price language | `sub-dollar`, `under a buck`, and `below $1` express a threshold but still need approved price basis, time, unit/currency, and applicability. `penny stock` requires the locked explicit saved/app-wide definition. `cheap` and `low-priced` are relative and need an approved threshold/definition. |
| User label classes | Tags, setups, strategies, rules, mistakes, playbooks, sessions, price buckets, and goals remain separate typed classes even when the same string appears in several. A label does not prove a trade fact without applicable explicit coverage. |
| Causation/advice/runtime | Vocabulary can route historical factual or user-labelled questions only. It cannot diagnose motive, prove causation, recommend a trade, predict an outcome, mutate labels, access data, or imply a runtime exists. |

## 3.5 Mandatory Source-Term Distinctions

Every row below is mandatory later Section 6 material. The `Owner/boundary`
column prevents source ordering from being mistaken for semantic identity.

| # | Source group | Source term | Owner/boundary that must be preserved |
|---:|---|---|---|
| 1 | Trade Outcome | `green` | Positive eligible result only after trade/day grain and gross or fee-complete net basis are known; not a color, open gain, or prediction. |
| 2 | Trade Outcome | `red` | Negative eligible result under declared grain/basis; not a color, open loss, or prediction. |
| 3 | Trade Outcome | `flat` | Category 3 exact selected-basis zero, not rounded or approximately zero. |
| 4 | Trade Outcome | `scratch` | Source-declared approximately-breakeven language; do not merge with exact `flat` or invent a tolerance. Clarify exact zero versus explicit tolerance when context does not settle it. |
| 5 | Trade Outcome | `winner` | Eligible profitable trade at explicit basis; not a winning day, ticker, setup, or future trade. |
| 6 | Trade Outcome | `loser` | Eligible losing trade at explicit basis; not a red day, ticker judgment, person, or prediction. |
| 7 | Trading Frequency | `overtrade` | Category 9 thresholded proxy or explicit user judgment; no universal trade-count threshold. |
| 8 | Trading Frequency | `trade too much` | Subjective frequency claim unless an explicit threshold/comparison is supplied. |
| 9 | Trading Frequency | `too many trades` | Requires a declared count baseline, threshold, rule, or comparison. |
| 10 | Trading Frequency | `kept clicking` | May describe execution events rather than new lifecycle attempts; never silently use trade count. |
| 11 | Trading Frequency | `forced trades` | Trader-authored subjective label; executions and losses cannot prove force or motive. |
| 12 | Trading Frequency | `churned` | Could mean turnover, repeat attempts, executions, or excessive activity; context or clarification is required. |
| 13 | Profit Giveback | `gave back profit` | Could request Category 10 candle price giveback or a compatible trade/day P/L path; select neither silently. |
| 14 | Profit Giveback | `was green then lost it` | Requires declared grain, selected basis, and chronological path; not automatically candle giveback. |
| 15 | Profit Giveback | `let a winner turn red` | Requires factual positive-to-negative path and adds possible agency wording that must not become causal judgment. |
| 16 | Profit Giveback | `failed to lock in gains` | Subjective quality/judgment wording; historical movement does not prove failure or advice. |
| 17 | Profit Giveback | `round-tripped profit` | May mean a trade/day path returning from positive toward zero/negative; it is not automatically a full position round trip or Category 10 metric. |
| 18 | Repeat Trading | `re-entered` | A new Category 8 attempt only after a stable-instrument lifecycle returned to zero; otherwise it may be an add. |
| 19 | Repeat Trading | `tried it again` | Repeat-attempt language requiring stable instrument/date/sequence and visible barriers. |
| 20 | Repeat Trading | `another attempt` | Means second-or-later lifecycle attempt, not another fill inside the same open lifecycle. |
| 21 | Repeat Trading | `went back in` | Ambiguous between add, reopen, and repeat attempt unless lifecycle state is known. |
| 22 | Repeat Trading | `revenge traded the same ticker` | Explicit user-authored revenge wording may be retained; no loss/re-entry pattern proves revenge or motive. |
| 23 | Repeat Trading | `second shot` | Specifically ordinal attempt language when the full pre-filter sequence proves attempt two. |
| 24 | Position Size | `size` | Ambiguous size measure; ask quantity, maximum open quantity, notional, or approved exposure where needed. |
| 25 | Position Size | `share size` | Share/quantity measure, not dollar exposure or number of executions. |
| 26 | Position Size | `position` | Position/lifecycle entity or open quantity depending grammar; not a size metric by itself. |
| 27 | Position Size | `exposure` | Requires an approved exposure measure and currency/valuation basis; never substitute share size. |
| 28 | Position Size | `went bigger` | Comparative size wording requiring two valid observations and the same explicit measure/basis. |
| 29 | Position Size | `sized up` | Increase relative to an explicit predecessor/baseline; not proof of risk or motive. |
| 30 | Position Size | `went heavy` | Subjective/relative size that needs an approved measure and baseline; not a universal threshold. |
| 31 | Price Terms | `sub-dollar` | Explicit numeric threshold under one dollar but still missing approved price basis, time, currency, and applicability. |
| 32 | Price Terms | `under a buck` | Conversational under-one-dollar threshold with the same required basis/currency contract. |
| 33 | Price Terms | `below $1` | Explicit strict threshold; does not identify which price field/time governs classification. |
| 34 | Price Terms | `penny stock` | Category 11 explicit saved/app-wide definition only; never infer from ticker wording or current quote. |
| 35 | Price Terms | `cheap stock` | Relative/value-laden phrase needing a user-approved definition; not automatically sub-dollar or penny stock. |
| 36 | Price Terms | `low-priced stock` | Needs an approved threshold and price basis; not necessarily below one dollar. |
The source contains 36 displayed terms across the six groups. Singular/plural,
hyphenation, spelling, and locale variants remain later registry coverage and
must not be counted as additional source terms or broaden a term's meaning.

---

# 4. Complete Controlling Inventory

> The following is the complete controlling inventory for this category. Every listed item must be completed. Do not silently omit, rename, merge, or replace items. Flag any missing concept separately without changing the controlling list.

The source plan names six vocabulary groups and nine user-defined language
classes. Those fifteen classes are the controlling records in exact source
order. Individual slang strings remain mandatory language entries under their
own group and route to locked owners; they are not duplicate analytics records.
The lead controller accepted this exact planning inventory for deliverable
production and approved and locked its fifteen exact canonical names and
registries on 2026-08-11. The approved canonical records are Version 1.

| # | Inventory ID | Canonical Name | Display Name | Subcategory | Capability Status | Current Evidence Boundary |
|---:|---|---|---|---|---|---|
| 1 | C16-TERM-001 | trade_outcome_vocabulary | Trade Outcome Vocabulary | Generic trader vocabulary | Planned | Owns routing for the six source terms `green`, `red`, `flat`, `scratch`, `winner`, and `loser`; exact trade/day grain, selected basis, eligibility, zero/tolerance, and locked Category 3 meanings remain required. |
| 2 | C16-TERM-002 | trading_frequency_vocabulary | Trading Frequency Vocabulary | Generic trader vocabulary | Planned | Owns routing for `overtrade`, `trade too much`, `too many trades`, `kept clicking`, `forced trades`, and `churned`; thresholded proxy, execution/lifecycle grain, saved rule, subjective-label, and no-motive distinctions remain explicit. |
| 3 | C16-TERM-003 | profit_giveback_vocabulary | Profit Giveback Vocabulary | Generic trader vocabulary | Planned | Owns routing for the five source giveback phrases while preserving candle `profit_giveback`, trade/day P/L path, agency/judgment, basis, grain, chronology, and coverage distinctions. |
| 4 | C16-TERM-004 | repeat_trading_vocabulary | Repeat Trading Vocabulary | Generic trader vocabulary | Planned | Owns routing for the six source repeat phrases; Category 8 lifecycle-return-to-zero sequence controls an attempt, adds remain distinct, and revenge/motive is never inferred. |
| 5 | C16-TERM-005 | position_size_vocabulary | Position Size Vocabulary | Generic trader vocabulary | Planned | Owns routing for the seven source size phrases while preserving share quantity, maximum position, notional/exposure, transition, baseline, currency, and risk distinctions. |
| 6 | C16-TERM-006 | price_terms_vocabulary | Price Terms Vocabulary | Generic trader vocabulary | Planned | Owns routing for the six source price phrases; explicit threshold, operator, price field/time, unit/currency, applicability, and approved price-bucket/penny-stock definition remain required. |
| 7 | C16-TERM-007 | user_tag_language | User Tag Language | Account-scoped user language | Planned | Resolves an active authorized current-account tag name/alias only to Category 11 `custom_tag` with exact version and coverage; no note inference or cross-account lookup. |
| 8 | C16-TERM-008 | user_setup_language | User Setup Language | Account-scoped user language | Planned | Resolves active authorized setup names/aliases such as the source example `First Green Day Breakout`/`FGD` only with same-account exact definition/version/coverage; ticker and generic-green collisions remain guarded. |
| 9 | C16-TERM-009 | user_strategy_language | User Strategy Language | Account-scoped user language | Planned | Resolves an active authorized strategy name/alias to Category 11 `strategy`; it cannot infer strategy from ticker, result, setup, or playbook language. |
| 10 | C16-TERM-010 | user_rule_language | User Rule Language | Account-scoped user language | Planned | Resolves an active authorized versioned/effective rule name/alias to Category 11 `rule`; alias recognition does not prove applicability, adherence, breach, or authorize mutation. |
| 11 | C16-TERM-011 | user_mistake_language | User Mistake Language | Account-scoped user language | Planned | Resolves an explicit active authorized mistake label/alias to Category 11 `mistake`; losses, repeats, rule events, and slang never create a mistake label. |
| 12 | C16-TERM-012 | user_playbook_language | User Playbook Language | Account-scoped user language | Planned | Resolves an active authorized playbook name/alias to Category 11 `playbook`; playbooks remain distinct from setups and strategies even when names overlap. |
| 13 | C16-TERM-013 | user_session_name_language | User Session Name Language | Account-scoped user language | Planned | Resolves an explicitly stored active authorized session-name definition/alias with timezone, boundary, version, and coverage; never replaces locked exchange/session/time facts or guesses from ordinary words. |
| 14 | C16-TERM-014 | user_price_bucket_language | User Price Bucket Language | Account-scoped user language | Planned | Resolves an active authorized price-bucket name/alias only with its approved price basis, thresholds/endpoints, unit/currency, applicability, version, and coverage; no current-quote or penny-stock inference. |
| 15 | C16-TERM-015 | user_goal_language | User Goal Language | Account-scoped user language | Planned | Resolves an active authorized goal name/alias with exact target definition, basis, effective period/version, applicability, and coverage; a goal is not a prediction, recommendation, achieved-state fact, or generic daily target without evidence. |

## Proposed Inventory Additions

None at this planning checkpoint. Individual source terms, aliases,
abbreviations, misspellings, deprecated terms, locale variants, match modes,
collision outcomes, and the example `FGD` phrases are required Section 6
coverage inside the fifteen records, not separate canonical analytics concepts.

## Proposed Removals or Merges

None. The six generic groups route different semantic families. The nine
user-defined classes have different owning facts and applicability contracts
and must remain typed even when an alias string collides. Do not merge tags,
setups, strategies, rules, mistakes, playbooks, session names, price buckets,
or goals into one untyped `custom_label` record.

---

# 5. Canonical Inventory Deliverable

**Canonical batch status:** All fifteen canonical records independently PASSed
and the lead controller approved and locked all fifteen exact canonical names
at Version 1 on 2026-08-11. Approval and locking authorize no runtime.

| Inventory ID | Approved and locked exact canonical name | Corresponding registry status |
|---|---|---|
| C16-TERM-001 | `trade_outcome_vocabulary` | Approved and locked |
| C16-TERM-002 | `trading_frequency_vocabulary` | Approved and locked |
| C16-TERM-003 | `profit_giveback_vocabulary` | Approved and locked |
| C16-TERM-004 | `repeat_trading_vocabulary` | Approved and locked |
| C16-TERM-005 | `position_size_vocabulary` | Approved and locked |
| C16-TERM-006 | `price_terms_vocabulary` | Approved and locked |
| C16-TERM-007 | `user_tag_language` | Approved and locked |
| C16-TERM-008 | `user_setup_language` | Approved and locked |
| C16-TERM-009 | `user_strategy_language` | Approved and locked |
| C16-TERM-010 | `user_rule_language` | Approved and locked |
| C16-TERM-011 | `user_mistake_language` | Approved and locked |
| C16-TERM-012 | `user_playbook_language` | Approved and locked |
| C16-TERM-013 | `user_session_name_language` | Approved and locked |
| C16-TERM-014 | `user_price_bucket_language` | Approved and locked |
| C16-TERM-015 | `user_goal_language` | Approved and locked |

**Batch-wide registry contract:** These records describe language-routing
classes, not new analytics calculations. Every match must preserve the locked
owner's exact concept, formula, population, capability status, data coverage,
units, gross/net and fee contract, open-trade handling, and unavailable state.
Generic registry entries retain canonical owner reference, category, current
aliases, deprecated aliases, locale, version, and coverage. A changed meaning
creates a new version and never silently rewrites history.

Normalized exact matching may resolve only one locale-compatible,
query-compatible, collision-free active entry. Fuzzy matching remains candidate
generation until a controller-approved algorithm and strength threshold exist;
it cannot auto-route. Short/uppercase/ticker-like tokens receive abbreviation
and ticker safety checks first. Trusted context may narrow candidates only
inside the same server-authorized user/workspace/Journal-account scope. Neither
text nor a raw/opaque ID grants authorization. Model context, operational logs,
and errors must not expose raw IDs, private labels, notes, definitions, or
another account's vocabulary. No record infers motive, emotion, quality,
causation, prediction, advice, a protected write, or runtime support.

## `trade_outcome_vocabulary`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-001 |
| Category | Trader Terminology and Slang |
| Subcategory | Generic trader vocabulary |
| Canonical name | `trade_outcome_vocabulary` |
| Display name | Trade Outcome Vocabulary |
| Exact definition | The versioned locale-aware routing class for the source terms `green`, `red`, `flat`, `scratch`, `winner`, and `loser`. It resolves compatible language to locked Category 3 outcome concepts only after exact grain, eligible population, declared gross or fee-complete net basis, currency partition, and coverage are established. It does not calculate or classify an outcome itself. |
| Distinction from related concepts | This is a vocabulary class, not `winning_trades`, `losing_trades`, `breakeven_trades`, a day result, an open-position state, a color, or a tolerance-based scratch metric. `flat` is exact selected-basis zero. Because the source calls `scratch` approximately breakeven, a bare approximate reading cannot be silently collapsed into exact zero or assigned an invented tolerance. |
| Evidence classification | Directly observed source/stored registry terms and explicit user wording; deterministically derived locale-normalized candidate and locked-owner routing when exact context is complete |
| Capability status | Planned |
| Result units | Typed resolution to an existing locked outcome concept plus grain, basis, currency, locale/version, match method, and coverage metadata; no independent numeric unit |
| Open-trade support | Outcome count/rate routing uses the locked owner's eligible `ready_closed` population. Open or unresolved rows remain visible coverage and cannot become a realized winner, loser, flat, or scratch through language alone. Explicit unrealized green/red language must route to its separate locked owner if available, never to this realized-outcome default. |
| Fee handling | A direct realized outcome requires gross or fee-complete net basis when classifications can differ. Net uses the locked exact fee/credit contract; missing fee completeness is partial/unavailable, not gross fallback. The vocabulary never supplies a fee basis. |
| Version | 1 |

### Related Concepts

- Broader concept: versioned generic trader vocabulary routing.
- Narrower concepts: positive trade outcome wording; negative trade outcome
  wording; exact-zero wording; approximate scratch wording.
- Commonly confused concepts: `winning_trades`, `losing_trades`,
  `breakeven_trades`, green/red/flat days, unrealized P/L, color labels.
- Must not be merged with: an analytics outcome metric, a user-defined
  tolerance, a day classification, or open-position state.

### Mandatory Child-Term Contract

- `green`: positive eligible result only after trade/day grain and selected
  basis are known; never a color, open gain, or prediction.
- `red`: negative eligible result only after grain and basis are known; never a
  color, open loss, or prediction.
- `flat`: exact selected-basis zero under Category 3, never rounded or
  approximately zero.
- `scratch`: preserve the source's approximate reading. In trusted Category 3
  exact-outcome grammar it may route only under that locked exact-zero contract;
  otherwise clarify exact zero versus an explicit tolerance and never invent
  the tolerance.
- `winner`: one eligible profitable trade at a declared basis, not a winning
  day, ticker, setup, trader, or future result.
- `loser`: one eligible losing trade at a declared basis, not a red day, ticker
  judgment, person, or prediction.

## `trading_frequency_vocabulary`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-002 |
| Category | Trader Terminology and Slang |
| Subcategory | Generic trader vocabulary |
| Canonical name | `trading_frequency_vocabulary` |
| Display name | Trading Frequency Vocabulary |
| Exact definition | The versioned locale-aware routing class for `overtrade`, `trade too much`, `too many trades`, `kept clicking`, `forced trades`, and `churned`. It distinguishes a user judgment, saved rule/threshold, execution activity, lifecycle-start count, repeat attempts, turnover, and the locked Category 9 `overtrading_frequency` proxy before routing. |
| Distinction from related concepts | It is not a universal definition of overtrading, not `trade_count`, `execution_count`, `repeat_attempts`, turnover, rule breach, mistake, or motive. Category 9's exact proxy requires an explicit nonnegative threshold `T` and complete active-day lifecycle-start coverage; conversational intensity does not create that threshold. |
| Evidence classification | Directly observed registry wording and explicit user-authored label/rule language; proxy-based only when routed to the locked Category 9 thresholded proxy; deterministic candidate resolution does not prove overtrading |
| Capability status | Planned |
| Result units | Typed resolution to a locked activity concept or focused ambiguity with locale/version, candidate grain, threshold/rule reference class, match method, and coverage; no independent numeric unit |
| Open-trade support | Category 9's proxy counts factual zero-to-nonzero starts from `ready_closed` and `legitimate_open` within each complete-coverage account-local active day. `needs_decision` or incomplete candidates make the day partial/unavailable and visibly excluded, never silently skipped. Other execution/repeat routes preserve their own open-state contracts. |
| Fee handling | Not applicable to factual activity counts. A request comparing performance or outcomes after high activity must separately declare gross or fee-complete net basis and preserve the owning metric's population/coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: versioned generic trader vocabulary routing.
- Narrower concepts: thresholded overtrading-proxy wording; lifecycle-count
  wording; execution-activity wording; explicit subjective frequency labels.
- Commonly confused concepts: `overtrading_frequency`, `trade_count`, execution
  count, `repeat_attempts`, turnover, `mistake`, `rule_broken`.
- Must not be merged with: a universal activity threshold, inferred discipline,
  inferred motive, or one untyped count.

### Mandatory Child-Term Contract

- `overtrade`: Category 9 thresholded proxy or an explicit user judgment; there
  is no universal trade-count threshold.
- `trade too much`: subjective frequency unless an explicit comparison,
  threshold, saved rule, or user label supplies meaning.
- `too many trades`: requires a declared count grain and baseline, threshold,
  rule, or comparison.
- `kept clicking`: may describe accepted execution events rather than new
  zero-to-nonzero lifecycles; never silently substitute trade count.
- `forced trades`: subjective user-authored characterization; executions,
  losses, or frequency cannot prove force, mistake, discipline, or motive.
- `churned`: may mean turnover, executions, repeated lifecycles, or excessive
  activity; trusted compatible context must yield one meaning or clarification
  is required.

For the locked `overtrading_frequency` owner only, the exact formula is the
number of complete-coverage account-local active days whose factual lifecycle-
start count is strictly greater than explicit `T`, divided by all complete-
coverage active days in the declared period. `T` must be nonnegative and
explicit, zero denominator is unavailable, and the result proves no motive or
discipline.

## `profit_giveback_vocabulary`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-003 |
| Category | Trader Terminology and Slang |
| Subcategory | Generic trader vocabulary |
| Canonical name | `profit_giveback_vocabulary` |
| Display name | Profit Giveback Vocabulary |
| Exact definition | The versioned locale-aware routing class for `gave back profit`, `was green then lost it`, `let a winner turn red`, `failed to lock in gains`, and `round-tripped profit`. It distinguishes Category 10 candle `profit_giveback`, a compatible chronological trade/day P/L path, full-position lifecycle language, and subjective agency/quality wording before routing. |
| Distinction from related concepts | This class does not calculate giveback and cannot equate every phrase with Category 10. Candle `profit_giveback` is a non-negative favourable-candle-extreme-to-exact-exit price difference. A positive-to-negative trade/day P/L path needs its own declared grain, basis, chronology, and supported owner. `failed` or `let` wording cannot prove agency, poor execution, regret, or advice. |
| Evidence classification | Directly observed registry wording and explicit request; deterministically resolved to a compatible locked owner when grain/basis/window are complete; candle routing uses the owner’s directly observed boundaries/candles and derived approximation, not a new Category 16 calculation |
| Capability status | Planned |
| Result units | Typed routing to an existing candle-price or P/L-path concept, or focused ambiguity, with grain, basis, interval/source, locale/version, match method, and coverage; no independent numeric unit |
| Open-trade support | Category 10 candle giveback requires an exact matched realized exit or eligible final exit and is unavailable for open, disputed, unmatched, or incomplete activity. A separate open P/L-path request must use an explicitly supported owner; vocabulary cannot invent an exit or convert current unrealized movement into realized giveback. |
| Fee handling | Category 10 candle giveback excludes fees because it is a price difference. A trade/day P/L path must separately declare gross or fee-complete net basis and preserve Category 2/5 fee/credit/currency coverage. No phrase silently selects one interpretation or fee basis. |
| Version | 1 |

### Related Concepts

- Broader concept: versioned generic trader vocabulary routing.
- Narrower concepts: candle price giveback language; chronological trade/day
  P/L reversal language; subjective agency/quality language.
- Commonly confused concepts: Category 10 `profit_giveback`, realized P/L,
  peak-to-final P/L reversal, percentage captured, post-exit continuation,
  full position round trip.
- Must not be merged with: one universal giveback formula, behavioral cause,
  exit-quality judgment, regret, or holding advice.

### Mandatory Child-Term Contract

- `gave back profit`: may request Category 10 candle price giveback or a
  compatible trade/day P/L path; select neither silently.
- `was green then lost it`: requires declared grain, selected gross/net basis,
  chronological path, and coverage; it is not automatically candle giveback.
- `let a winner turn red`: requires a factual positive-to-negative selected-
  basis path, while `let` must not become a causal or agency conclusion.
- `failed to lock in gains`: contains subjective judgment; historical movement
  cannot prove failure, mistake, poor quality, or what the user should do.
- `round-tripped profit`: may mean a trade/day path returning from positive
  toward zero/negative; it is not automatically a complete flat-to-flat
  position lifecycle or Category 10's candle metric.

For the locked Category 10 owner only, let `P` be the entry-zero-baseline
maximum favourable price using exact entry plus only eligible candles wholly
after entry and wholly before exit, and `X` the exact realized exit boundary
price at the same grain. Long giveback is `max(0, P - X)` and short giveback is
`max(0, X - P)`. Entry- and exit-containing candle extremes are excluded;
complete coverage with no favourable price beyond entry uses `P = E`; missing
or incompatible coverage is unavailable. The result is price distance with
source, interval, grain, and coverage metadata, not P/L or causal evidence.

## `repeat_trading_vocabulary`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-004 |
| Category | Trader Terminology and Slang |
| Subcategory | Generic trader vocabulary |
| Canonical name | `repeat_trading_vocabulary` |
| Display name | Repeat Trading Vocabulary |
| Exact definition | The versioned locale-aware routing class for `re-entered`, `tried it again`, `another attempt`, `went back in`, `revenge traded the same ticker`, and `second shot`. It distinguishes a later zero-to-nonzero lifecycle from another fill/add in an existing lifecycle and preserves explicit user-authored revenge wording without inferring motive. |
| Distinction from related concepts | This is not Category 8 `repeat_attempts`, an execution/add count, overtrading, rapid re-entry, a rule breach, or revenge diagnosis. A repeat attempt exists only after position returned to zero and the complete pre-filter lifecycle sequence establishes its ordinal position. Date/result/state filters cannot create or renumber attempts. |
| Evidence classification | Directly observed registry wording and explicit user language; deterministically resolved to the locked Category 8 sequence only from authorized lifecycle facts; `revenge` remains user-labelled/explicit and is never derived from a loss or re-entry pattern |
| Capability status | Planned |
| Result units | Typed routing to `repeat_attempts`, add/execution activity, an explicit user label, or focused ambiguity, with sequence grain, locale/version, match method, and coverage; no independent numeric unit |
| Open-trade support | The owner sequence includes `ready_closed`, factual `legitimate_open`, `needs_decision`, and incomplete current lifecycle candidates before analytic filters. A legitimate open may have an ordinal position but is not a realized result. Decision/incomplete candidates are visible barriers and later attempts cannot be renumbered across them. |
| Fee handling | Not applicable to attempt identity/order. Any outcome/performance comparison of attempts must independently use one declared gross or fee-complete net basis, one compatible currency, and the owner's unfiltered predecessor/barrier sequence. |
| Version | 1 |

### Related Concepts

- Broader concept: versioned generic trader vocabulary routing.
- Narrower concepts: repeat-attempt wording; add/re-entry ambiguity; explicit
  revenge-label wording; ordinal second-attempt wording.
- Commonly confused concepts: `repeat_attempts`, execution count, scale-in,
  rapid re-entry, overtrading, `trade_after_loss`, revenge trading.
- Must not be merged with: same-lifecycle adds, behavioral motive, mistake,
  quality, or filtered/renumbered sequence.

### Mandatory Child-Term Contract

- `re-entered`: a new attempt only after the stable-instrument lifecycle
  returned to zero; otherwise it may describe an add or correction.
- `tried it again`: repeat-attempt wording that still requires stable
  instrument/date/sequence and visible barriers.
- `another attempt`: second-or-later zero-to-nonzero lifecycle, not another
  fill within one open lifecycle.
- `went back in`: ambiguous among add, reopen, and repeat attempt until exact
  lifecycle state is known.
- `revenge traded the same ticker`: explicit user-authored wording may retain a
  revenge label, but a prior loss plus re-entry proves neither revenge nor any
  other motive.
- `second shot`: exactly ordinal attempt two only when the full pre-filter
  sequence proves one initial attempt and this later lifecycle; never any
  arbitrary later fill.

For the locked Category 8 owner only, first build all current authorized
lifecycle candidates, partition by account, stable instrument, and account-
local entry date, then order by first-entry raw UTC and stable server-side
identity before applying analytic filters. The first zero-to-nonzero lifecycle
is initial; every later one is a repeat. Decision/incomplete candidates are
unskippable state-labelled barriers, with exact pre-barrier count and partial/
unavailable later coverage. Raw stable identities are server-side tie facts and
must not reach model or trader output.

## `position_size_vocabulary`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-005 |
| Category | Trader Terminology and Slang |
| Subcategory | Generic trader vocabulary |
| Canonical name | `position_size_vocabulary` |
| Display name | Position Size Vocabulary |
| Exact definition | The versioned locale-aware routing class for `size`, `share size`, `position`, `exposure`, `went bigger`, `sized up`, and `went heavy`. It resolves only after identifying quantity versus maximum open quantity versus accepted notional/exposure measure, observation grain, currency/valuation basis, comparison baseline, sequence, denominator, and coverage. |
| Distinction from related concepts | It is not one generic size metric. Share-side quantity, maximum absolute open position quantity, entry notional, market/equity/margin exposure, and relative-size transition are distinct. A `position` may name the lifecycle entity rather than a measure. Relative wording requires comparable observations and cannot infer risk, normal size, or motive. |
| Evidence classification | Directly observed accepted execution quantities/prices and explicit registry wording; deterministically derived locked quantity/maximum-position/notional aggregates where supported; proxy-based for baseline-relative language; generic dollar exposure remains unavailable without its approved contract |
| Capability status | Planned |
| Result units | Typed routing to an existing size concept or focused ambiguity with grain, quantity/notional/exposure basis, currency, baseline, locale/version, match method, and coverage; no independent numeric unit |
| Open-trade support | Factual quantity/position facts may include accepted open lifecycle state only where the locked owner permits it. Realized performance-by-size and sequence outcome metrics retain their ready-closed population and barriers. Language cannot treat an open position as closed or invent missing allocation/quantity coverage. |
| Fee handling | Quantity and maximum-position size exclude fees. Notional/exposure uses only its approved price/currency basis. Performance or profit-per-exposure requests separately require declared gross or fee-complete net P/L, identical eligible populations, compatible currency, and zero/unknown-denominator handling. |
| Version | 1 |

### Related Concepts

- Broader concept: versioned generic trader vocabulary routing.
- Narrower concepts: share quantity; maximum absolute open quantity; approved
  notional/exposure; relative-size comparison; size transition.
- Commonly confused concepts: `shares_purchased`, `shares_sold`,
  `average_position_size`, `maximum_position_size`, average/maximum dollar
  exposure, entry notional, account utilization, `size_escalation`.
- Must not be merged with: one generic exposure measure, a position entity,
  personal normal-size baseline, risk, buying power, or account return.

### Mandatory Child-Term Contract

- `size`: ambiguous measure; resolve quantity, maximum open quantity, notional,
  or approved exposure rather than defaulting.
- `share size`: share/quantity measure, not dollar exposure, account risk, or
  number of executions.
- `position`: may identify the position/lifecycle entity or its running quantity
  depending grammar; it is not a metric by itself.
- `exposure`: requires an approved exposure definition, valuation time/price,
  unit/currency, and coverage; share size is not a fallback.
- `went bigger`: compares two compatible observations on one explicit measure
  and basis; missing predecessor/baseline requires clarification.
- `sized up`: a positive size transition relative to an explicit compatible
  predecessor/baseline; it proves no risk, confidence, or motive.
- `went heavy`: subjective relative-size language requiring an approved measure
  and baseline; there is no universal threshold.

Locked Category 6 owners remain unchanged: `average_position_size` is the
arithmetic mean and `median_position_size` the exact median of each eligible
Stock round trip's maximum absolute running position quantity;
`maximum_position_size` is the maximum across those per-round-trip maxima.
Incomplete quantity/allocation coverage is partial/unavailable. Generic average
or maximum dollar exposure remains unavailable because no approved exposure
time-point/denominator contract exists, and entry notional, marked market value,
equity/margin utilization, share quantity, FX, or multiplier may not substitute.
`went bigger`/`sized up`/`went heavy` cannot auto-route until the explicit size
measure, compatible predecessor/baseline, comparison formula/equality state,
and coverage are known.

## `price_terms_vocabulary`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-006 |
| Category | Trader Terminology and Slang |
| Subcategory | Generic trader vocabulary |
| Canonical name | `price_terms_vocabulary` |
| Display name | Price Terms Vocabulary |
| Exact definition | The versioned locale-aware routing class for `sub-dollar`, `under a buck`, `below $1`, `penny stock`, `cheap stock`, and `low-priced stock`. It routes only after the requested price field, observation time/event, strict operator and threshold, unit/currency, applicability, approved definition version, and factual coverage are explicit. It never classifies from ticker spelling, lexical tone, or an unrequested current quote. |
| Distinction from related concepts | `sub-dollar`, `under a buck`, and `below $1` share an under-one-dollar surface threshold but do not identify the governing price field/time. `penny stock` is Category 11's explicit saved/app-wide-definition dimension, not a synonym for every sub-dollar trade. `cheap stock` and `low-priced stock` are relative and have no universal threshold. This record is not `price_buckets` and does not fetch or infer market data. |
| Evidence classification | Directly observed source/stored registry wording and explicit query threshold/definition references; deterministically derived locale-normalized candidate routing only when the locked price owner, exact definition version, applicable factual price field/time, unit/currency, and coverage are available |
| Capability status | Planned |
| Result units | Typed routing to a locked price predicate or approved price-definition dimension with field, event time, operator, threshold, unit/currency, applicability, locale/version, match method, and coverage; no independent numeric unit |
| Open-trade support | Only the locked owner's explicitly permitted factual price at its declared event/time may classify an open or closed record. A current quote, entry price, exit price, average price, candle price, or selected-chart value cannot substitute for another field. Open/unresolved activity remains state-labelled and cannot acquire missing price coverage through wording. |
| Fee handling | Not applicable to price classification. Fees, gross/net P/L, and trade outcome do not change the price predicate. A separate performance request must preserve the owning metric's declared fee, currency, population, and coverage contract. |
| Version | 1 |

### Related Concepts

- Broader concept: versioned generic trader vocabulary routing.
- Narrower concepts: explicit under-one-dollar predicate language; approved
  penny-stock-definition language; relative cheap/low-price language.
- Commonly confused concepts: Category 11 `price_buckets`,
  `penny_stocks_where_explicitly_defined`, entry/exit/average price, current
  quote, low-priced ticker names.
- Must not be merged with: one universal penny-stock threshold, current-market
  classification, valuation judgment, or unversioned user bucket.

### Mandatory Child-Term Contract

- `sub-dollar`: strict price less than one declared dollar unit, but the
  governing price field, event/time, currency, applicability, and coverage are
  still required.
- `under a buck`: conversational strict-under-one-dollar language with the same
  unresolved field/time/currency/applicability contract; `buck` does not
  authorize a currency guess across incompatible partitions.
- `below $1`: an explicit strict `< 1` threshold in the declared dollar
  currency, but it still does not choose entry, exit, average, candle, or
  current price or an observation time.
- `penny stock`: only the locked Category 11 explicit approved saved/app-wide
  effective definition with price basis, threshold/operator, unit/currency,
  applicability, version, and coverage; ticker or current-quote inference is
  prohibited.
- `cheap stock`: relative/value-laden wording requiring an approved user or
  app-wide definition; never default to sub-dollar, penny stock, or a quality
  judgment.
- `low-priced stock`: requires an approved price threshold, field/time, unit/
  currency, applicability, version, and coverage; it need not mean below one
  dollar or penny stock.

Category 11 `price_buckets` and
`penny_stocks_where_explicitly_defined` remain `Unavailable` without their
approved saved/app-wide definitions and exact price contracts. A strong generic
exact phrase match still cannot fill those missing facts. Short/ticker-like
forms are collision-checked, and fuzzy candidates never auto-route.

## `user_tag_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-007 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_tag_language` |
| Display name | User Tag Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized tag name or alias to locked Category 11 `custom_tag`. A strong match requires one normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate loaded server-side from the same authorized user/workspace/Journal account with explicit association coverage. Fuzzy results are candidates only. |
| Distinction from related concepts | A tag is not a setup, strategy, rule, mistake, playbook, free-text note, hashtag, inferred theme, or generic slang meaning. The same string stored in another label class or account is a collision, not evidence that the records are identical. Recognizing the label does not prove it applies to a trade without a covered explicit association. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned tag/alias plus explicit covered tag association; deterministically derived normalized exact match and collision state within the same authorized account |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to locked `custom_tag`, definition/alias version, locale, exact-match method, association coverage, and collision status; no numeric unit and no raw label/account ID |
| Open-trade support | A tag may route for an open or closed record only where that exact authorized record has an explicit covered tag association and the owning query permits its state. Missing association is unknown/unavailable, never inferred from notes, outcomes, ticker, selection, or similar records. |
| Fee handling | Not applicable to label identity. Metrics grouped or filtered by the tag retain their own gross/net, fee/credit, currency, eligible-population, open-state, and coverage contracts. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: active tag name; active tag alias; retained deprecated tag
  alias; explicit covered tag association.
- Commonly confused concepts: Category 11 `custom_tag`, setup, strategy,
  mistake, free-text note, hashtag, generic term.
- Must not be merged with: another label class, note-text inference, another
  account's tag, or a write to create/rename/apply a tag.

A changed tag meaning creates a new effective definition/version; the old alias
remains a deprecated audit fact and cannot silently adopt the new meaning.
Only the unique strong exact current-account match may receive user-label
precedence over generic language. Any exact class collision, stale/deprecated
meaning, ticker-like abbreviation, or fuzzy candidate requires trusted typed
context that leaves one compatible current match or a focused clarification.
Resolution exposes only minimum privacy-safe typed metadata; raw IDs and
unnecessary private label/definition/note text never cross accounts or enter
operational logs, errors, or broad model context.

## `user_setup_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-008 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_setup_language` |
| Display name | User Setup Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized setup name or alias, including the source example `First Green Day Breakout`, only to locked Category 11 `setup`. A strong match must be a unique normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate from the same authorized account with an explicit covered setup fact. Fuzzy candidates do not auto-route. |
| Distinction from related concepts | A setup is not a strategy, playbook, rule, tag, chart-pattern inference, ticker, generic green-day outcome, or automatically a good trade. The label/alias identifies only the trader-authored setup definition/version; it does not infer applicability or setup quality from price action, outcome, duration, screenshots, or notes. Category 11 `setup` remains Unavailable without the explicit covered fact. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned setup/alias plus explicit covered setup association; deterministically derived normalized exact match and collision state within the same account |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to locked `setup`, effective definition/alias version, locale, exact-match method, association coverage, and collision status; no numeric unit and no raw setup/account ID |
| Open-trade support | A setup may route for an open or closed record only when its explicit covered authorized association exists and the owning query permits that state. No setup is inferred from a live chart, selected ticker, screenshot, result, or another trade. |
| Fee handling | Not applicable to setup identity. Setup-filtered/grouped analytics retain the selected metric's exact gross/net, fee/credit, currency, population, open-state, and coverage requirements. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: setup name; setup alias; deprecated setup alias; explicit
  covered setup association.
- Commonly confused concepts: Category 11 `setup`, strategy, playbook, rule,
  chart pattern, `green` outcome wording, ticker symbol.
- Must not be merged with: inferred technical pattern, another label class,
  another account's setup, setup quality, or a setup write.

For the source example, `First Green Day Breakout` is the stored label while
`first green day`, `FGD`, `FGD breakout`, and `my first-green setup` are possible
user-editable aliases only when present in the active authorized registry.
`FGD` is short uppercase text and must pass ticker/abbreviation collision checks;
it is never globally reserved. A changed setup meaning creates a new version;
deprecated aliases do not silently migrate. User-label precedence applies only
to the unique strong exact current-account match. Ambiguous exact matches and
all fuzzy candidates require focused clarification. Raw IDs and unnecessary
private setup names/definitions/notes remain server-side and never leak across
accounts, logs, errors, or broad model context.

## `user_strategy_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-009 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_strategy_language` |
| Display name | User Strategy Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized strategy name or alias only to locked Category 11 `strategy`. Resolution requires one normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate from the same authorized account and an explicit covered strategy fact; fuzzy candidates remain clarification-only. |
| Distinction from related concepts | A strategy is not a setup, playbook, rule, goal, tag, ticker behavior, inferred trading style, or result pattern. The same text in another class remains a typed collision. Recognition cannot infer that a trade used the strategy, that the strategy caused an outcome, or that the user should trade it. Category 11 `strategy` remains Unavailable without explicit coverage. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned strategy/alias plus explicit covered strategy association; deterministically derived normalized exact match and collision state within the same account |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to locked `strategy`, effective definition/alias version, locale, exact-match method, association coverage, and collision status; no numeric unit and no raw strategy/account ID |
| Open-trade support | A strategy may route for an open or closed record only when that exact record has an explicit covered authorized association and the owning query supports its state. Ticker, execution shape, candle path, notes, or another record cannot supply a missing strategy fact. |
| Fee handling | Not applicable to strategy identity. Any strategy-filtered/grouped metric preserves its own gross/net, fees/credits, currency, eligible population, open-trade rule, sample, and coverage. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: strategy name; strategy alias; deprecated strategy alias;
  explicit covered strategy association.
- Commonly confused concepts: Category 11 `strategy`, setup, playbook, rule,
  goal, inferred style or pattern.
- Must not be merged with: another label class/account, causal performance
  explanation, recommendation, prediction, or strategy mutation.

Only a unique strong normalized exact active current-account match receives
user-label precedence. Exact collisions across classes/versions, stale or
deprecated meanings, short/ticker-like forms, and every fuzzy candidate require
trusted typed disambiguation or one focused clarification. A changed definition
creates a new version and retains prior terms as deprecated audit history; it
never rewrites earlier associations. Resolution uses minimum privacy-safe typed
metadata and cannot expose raw identifiers or unnecessary private strategy,
alias, definition, or note text to another account, logs, errors, or broad model
context.

## `user_rule_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-010 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_rule_language` |
| Display name | User Rule Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized rule name or alias only to locked Category 11 `rule` and its exact effective version. A strong match is one normalized exact, locale-compatible, class-compatible, current/effective, non-deprecated, collision-free candidate from the same authorized account. It identifies the rule only; applicability and `rule_followed`/`rule_broken` require their separate covered facts or approved deterministic predicate. Fuzzy candidates never auto-route. |
| Distinction from related concepts | A rule is not a goal, playbook, setup, strategy, tag, mistake, outcome, or advice. Recognizing its name does not apply the rule to a trade, establish adherence/breach, rewrite an endpoint, make it effective for another time, or authorize create/edit/delete actions. Category 11 `rule`, `rule_followed`, and `rule_broken` keep separate exact contracts. |
| Evidence classification | User-labelled and directly observed through an authorized versioned/effective rule/alias and explicit applicability/evaluation facts where present; deterministically derived normalized exact match and collision state only within the same account |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to locked `rule` and exact effective version plus locale, exact-match method, applicability/evaluation coverage, and collision status; no numeric unit and no raw rule/account ID |
| Open-trade support | Rule identity may be referenced for an open or closed record only when the exact effective version and explicit applicability coverage exist. Adherence/breach for open or closed activity follows the rule owner's accepted evaluation contract; outcome or partial behavior cannot fill a missing evaluation. |
| Fee handling | Not applicable to rule identity. A P/L threshold in a rule must retain its own exact gross or fee-complete net basis, fee/credit, currency, effective-period, endpoint, and coverage contract; alias matching cannot infer or alter those fields. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: rule name; rule alias; deprecated rule alias; exact
  effective rule version; explicit applicability and evaluation references.
- Commonly confused concepts: Category 11 `rule`, `rule_followed`,
  `rule_broken`, goal, mistake, setup, strategy, playbook, advice.
- Must not be merged with: adherence/breach inference, a protected rule write,
  another effective version, another label class, or another account's rule.

Only the unique strong normalized exact active/effective current-account match
may take precedence over generic wording. Exact collisions, an unspecified
effective version, deprecated or changed meaning, ticker/abbreviation risk, and
every fuzzy candidate require trusted typed disambiguation or clarification.
A changed rule meaning creates a new effective definition/version; prior terms
and historical associations remain versioned and are never silently rewritten.
Resolution keeps raw IDs and unnecessary private rule names, aliases,
definitions, thresholds, and notes server-side and prevents cross-account,
operational-log, error, or broad-model-context leakage. It authorizes no rule
mutation, causal claim, advice, prediction, or runtime.

## `user_mistake_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-011 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_mistake_language` |
| Display name | User Mistake Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized mistake name or alias only to locked Category 11 `mistake`. A strong match requires one normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate from the same authorized account and an explicit covered trader-authored mistake association. Fuzzy results remain candidates only. |
| Distinction from related concepts | A mistake is not a loss, rule breach, repeated attempt, overtrading proxy, bad outcome, emotion, setup, tag, or model diagnosis. Recognizing a stored mistake definition does not prove that it applies to a trade, how often it occurred, what it cost, why it happened, or how to prevent it. Category 11 `mistake` remains Unavailable without explicit trader-labelled coverage. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned mistake/alias plus an explicit covered trader-authored association; deterministically derived normalized exact match and collision state within the same authorized account |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to locked `mistake`, effective definition/alias version, locale, exact-match method, association coverage, and collision status; no numeric unit and no raw mistake/account ID |
| Open-trade support | A mistake label may route for open or closed activity only when that exact authorized record has an explicit covered association and the owning query permits the state. A current loss, adverse movement, repeated entry, or rule signal cannot create the label. |
| Fee handling | Not applicable to mistake identity. Mistake frequency/cost retains Category 9's explicit label, denominator, eligible evidence, declared gross or fee-complete net basis, currency, and coverage; missing cost evidence is unavailable and never inferred. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: mistake name; mistake alias; deprecated mistake alias;
  explicit covered mistake association.
- Commonly confused concepts: Category 11 `mistake`, `rule_broken`, loss,
  overtrading proxy, revenge wording, emotion, `mistake_frequency`,
  `mistake_cost`.
- Must not be merged with: outcome/proxy inference, another label class/account,
  causal explanation, corrective advice, or a mistake-label write.

Only a unique strong normalized exact active current-account match may receive
user-label precedence. Exact collisions, stale/deprecated or changed meanings,
ticker/abbreviation risks, and all fuzzy candidates require trusted typed
disambiguation or focused clarification. A changed mistake definition creates a
new version and retains earlier terms/associations as versioned history; it does
not rewrite prior facts. Resolution keeps raw IDs and unnecessary private
mistake names, definitions, associations, and notes server-side and prevents
cross-account, log, error, or broad-model-context leakage. It cannot infer an
association/evaluation, motive, cause, advice, mutation, or runtime.

## `user_playbook_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-012 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_playbook_language` |
| Display name | User Playbook Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized playbook name or alias only to locked Category 11 `playbook`. Resolution requires one normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate from the same authorized account and an explicit covered playbook association. Fuzzy candidates never auto-route. |
| Distinction from related concepts | A playbook is not a setup, strategy, rule, goal, tag, inferred trading style, collection of similar tickers, or recommendation. Recognizing its definition does not prove that an execution used it, that it performed well, or that it caused an outcome. Category 11 `playbook` remains Unavailable without explicit covered trader-authored facts. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned playbook/alias plus explicit covered association; deterministically derived normalized exact match and collision state within the same authorized account |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to locked `playbook`, effective definition/alias version, locale, exact-match method, association coverage, and collision status; no numeric unit and no raw playbook/account ID |
| Open-trade support | A playbook may route for open or closed records only with an explicit covered authorized association and an owning query that permits the record state. Similar execution shape, ticker, chart, result, note, setup, or strategy cannot fill a missing playbook fact. |
| Fee handling | Not applicable to playbook identity. Any playbook-filtered or grouped metric preserves its own gross/net, fees/credits, currency, eligible population, open-state, sample, and coverage rules. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: playbook name; playbook alias; deprecated playbook alias;
  explicit covered playbook association.
- Commonly confused concepts: Category 11 `playbook`, setup, strategy, rule,
  goal, tag, inferred style.
- Must not be merged with: another label class/account, inferred association,
  causal performance explanation, recommendation, or playbook mutation.

Only the unique strong normalized exact active current-account match receives
user-label precedence. Same-string class/version collisions, stale/deprecated
or changed meanings, ticker/abbreviation risks, and every fuzzy candidate
require trusted typed disambiguation or one focused clarification. Changed
meaning creates a new effective version and retains deprecated terms and prior
associations as history. Raw IDs and unnecessary private playbook names,
aliases, definitions, associations, and notes remain server-side and cannot
leak across accounts, logs, errors, or broad model context. Recognition proves
no association, evaluation, cause, advice, protected mutation, or runtime.

## `user_session_name_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-013 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_session_name_language` |
| Display name | User Session Name Language |
| Exact definition | The account-scoped language class that first resolves an explicit active authorized user session name or alias and effective version to locked Category 11 `custom_trading_session`. A strong match requires one normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate from the same authorized account. The Category 11 owner remains Unavailable unless its complete saved effective-dated definition states IANA zone, calendar/day applicability, start/end bounds, endpoint treatment, overnight handling, and effective version. Only after that owner definition is complete may locked Category 13 `session_times` resolve exact time boundaries and record membership from the selected accepted UTC event facts. Fuzzy results are candidates only. |
| Distinction from related concepts | Category 11 `custom_trading_session` owns the saved name, effective-dated definition, and Unavailable boundary; Category 13 `session_times` owns later temporal resolution/membership and cannot supply or bypass an incomplete owner definition. A user session name is not an exchange-defined session, ordinary word, page title, server/browser or account clock, account timezone, or automatic replacement for `premarket`, regular hours, lunch, or after hours. Name recognition alone classifies no record. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned session name/alias/definition; deterministically resolved to exact UTC boundaries and record membership only when the locked calendar, timezone, event, endpoint, and coverage contracts are complete |
| Capability status | Planned |
| Result units | First, a privacy-safe typed reference to locked Category 11 `custom_trading_session` and its exact effective definition version, IANA zone, calendar/day applicability, bounds/endpoints, overnight policy, locale, match method, and definition coverage; only when complete, Category 13-resolved UTC interval(s), selected event basis, membership, and factual coverage; no raw session/account ID |
| Open-trade support | Open or closed records may be filtered by session only when the owning query permits their state and the selected event's accepted UTC instant has complete coverage under the effective session definition. A visible chart time, device clock, or current page cannot supply missing event/timezone facts. |
| Fee handling | Not applicable to session identity or membership. Any session-filtered metric keeps its own gross/net, fee/credit, currency, eligible-population, open-state, sample, and coverage contract. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: session name/alias and effective definition owned by
  Category 11 `custom_trading_session`; later time/membership resolution owned
  by Category 13 `session_times`.
- Commonly confused concepts: Category 11 `custom_trading_session`, Category 13
  `session_times`, account/display timezone, exchange session, page/browser
  time, and a session label on a trade.
- Must not be merged with: the Category 13 resolver, an inferred market
  schedule, another account's session, a generic time phrase, or session-
  definition mutation.

Only a unique strong normalized exact active current-account match may select a
saved definition. Exact collisions, missing/changed/deprecated definitions,
ordinary-word or ticker/abbreviation risks, and all fuzzy candidates require
trusted typed disambiguation or clarification. A changed boundary, timezone,
calendar, event basis, endpoint, or applicability creates a new effective
version; historical membership is not silently recomputed under a new meaning.
Resolution exposes only minimum privacy-safe typed interval/version metadata,
never raw IDs or unnecessary private session names/definitions across accounts,
logs, errors, or broad model context. It infers no association, cause, advice,
mutation, or runtime.

## `user_price_bucket_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-014 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_price_bucket_language` |
| Display name | User Price Bucket Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized price-bucket name or alias only to locked Category 11 `price_buckets` and its exact saved effective definition. A strong match requires one normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate from the same authorized account. Classification additionally requires the approved price field/basis, unit/currency, bounds, endpoint inclusion, tie/gap/overlap policy, applicability, and factual coverage. Fuzzy candidates never auto-route. |
| Distinction from related concepts | A named price bucket is not `penny_stocks_where_explicitly_defined`, a generic `cheap stock`, a current-quote band, a ticker class, or an inferred low/medium/high range. Recognizing the definition does not prove that a record belongs in it; membership requires the exact applicable price fact and boundary contract. Category 11 `price_buckets` remains Unavailable without the complete approved saved effective definition. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned bucket name/alias/definition; deterministically derived membership only from the exact approved definition and covered compatible price fact |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to locked `price_buckets`, effective definition version, price basis, unit/currency, boundary/endpoint policy, applicability, locale, exact-match method, membership coverage, and collision status; no raw bucket/account ID |
| Open-trade support | Open or closed records may be classified only when the locked owner permits their state and the exact required price field/time has complete compatible coverage. Current quote, entry, exit, average, candle, or chart price cannot substitute for a different declared basis. |
| Fee handling | Not applicable to bucket identity or price membership. Bucket-filtered/grouped performance retains the metric owner's exact gross/net, fee/credit, currency, population, open-state, sample, and coverage rules. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language.
- Narrower concepts: price-bucket name; alias; deprecated alias; effective
  saved definition; covered membership.
- Commonly confused concepts: Category 11 `price_buckets`, penny-stock
  definition, sub-dollar predicate, cheap/low-priced wording, current quote.
- Must not be merged with: inferred default buckets, another account's bucket,
  penny-stock status, or a bucket-definition write.

Only the unique strong normalized exact active current-account match may select
the bucket definition. Same-string collisions, missing/changed/deprecated
definitions, ticker/abbreviation risks, and all fuzzy candidates require trusted
typed disambiguation or clarification. Any change to price basis, unit/currency,
bounds, endpoints, tie/gap/overlap rules, or applicability creates a new
effective version and does not rewrite historical facts. Raw IDs and
unnecessary private bucket names, aliases, definitions, or associations remain
server-side and cannot leak across accounts, logs, errors, or broad model
context. Definition recognition never infers membership, evaluation, cause,
advice, mutation, or runtime.

## `user_goal_language`

| Field | Value |
|---|---|
| Inventory ID | C16-TERM-015 |
| Category | Trader Terminology and Slang |
| Subcategory | Account-scoped user language |
| Canonical name | `user_goal_language` |
| Display name | User Goal Language |
| Exact definition | The account-scoped language class that resolves an explicit active authorized goal name or alias to its exact saved effective definition/version, then routes a valid progress request to locked Category 1 `evaluate_goal`, whose capability status remains Planned. A strong match requires one normalized exact, locale-compatible, class-compatible, current-version, non-deprecated, collision-free candidate from the same authorized account. The saved definition must preserve target metric/fact, comparator and threshold, unit/currency or count basis, effective period/timezone, applicability, evaluation grain, and coverage. The separate locked metric or rule owner retains the exact target calculation, population, chronology, basis, denominator, capability status, and factual coverage; Category 16 and `evaluate_goal` do not redefine it. Fuzzy candidates remain candidates only. |
| Distinction from related concepts | Category 16 recognizes the saved goal/version; Category 1 `evaluate_goal` owns the Planned goal-progress intent; the selected locked metric or rule owns the underlying facts and calculation. A goal is not a rule, daily target, prediction, achieved-state fact, recommendation, strategy, playbook, or generic desire. Recognition proves no applicability, progress, attainment, failure, causation, or advice, and neither the saved definition nor Planned intent creates a runtime. |
| Evidence classification | User-labelled and directly observed through an authorized active versioned goal name/alias/definition; deterministically derived progress or attainment only when a separate locked owner accepts the exact target, population, chronology, basis, denominator, and complete coverage |
| Capability status | Planned |
| Result units | Privacy-safe typed reference to the effective goal definition with target concept, operator/threshold, unit/currency or count basis, period/timezone, applicability, locale/version, exact-match method, evaluation coverage, and collision status; no raw goal/account ID |
| Open-trade support | Goal identity may be referenced, but open activity contributes only when the exact compatible locked target/evaluation contract explicitly permits it. A live unrealized value, current quote, incomplete day, or open trade cannot establish attainment by default. |
| Fee handling | Goal identity has no fee basis. A P/L goal must explicitly use gross or fee-complete net under the locked owner, with charge costs/credits, currency, denominator, eligible population, time boundary, and coverage preserved. Alias matching cannot choose or change the basis. |
| Version | 1 |

### Related Concepts

- Broader concept: authorized account-scoped user-defined language routed to
  Category 1 `evaluate_goal`.
- Narrower concepts: goal name/alias and effective version; Planned goal-
  progress intent; separately owned metric/rule target evaluation.
- Commonly confused concepts: Category 1 `evaluate_goal`, `calculate_metric`,
  `evaluate_rule`, saved rule, daily target,
  `trade_after_daily_target_reached`, strategy, playbook, prediction, advice.
- Must not be merged with: the target metric/rule owner, an achieved/failure
  fact, causal evaluation, another account's goal, a universal target,
  protected goal mutation, or an implemented runtime.

Only a unique strong normalized exact active current-account match may select a
goal definition. Same-string class/version collisions, changed/deprecated or
incomplete definitions, ticker/abbreviation risks, and every fuzzy candidate
require trusted typed disambiguation or one focused clarification. Any change
to target, comparator, threshold, unit/currency, basis, period/timezone,
applicability, or grain creates a new effective version and preserves historical
definitions/evaluations rather than rewriting them. Raw IDs and unnecessary
private goal names, aliases, thresholds, definitions, or evaluations remain
server-side and cannot leak across accounts, logs, errors, or broad model
context. Recognition proves no association, progress, attainment, cause,
prediction, advice, mutation, or runtime.

---

# 6. Language Registry Deliverable

**Registry batch status:** All fifteen registries independently PASSed and the
lead controller approved and locked all fifteen at Version 1 on 2026-08-11.
Registry approval and locking authorize no runtime.

Every registry below inherits Section 5's locale/version/deprecation, exact-
versus-fuzzy, collision, ticker/abbreviation, authorization, privacy, locked-
owner, and no-causation/advice/runtime contract. A normalized fuzzy form is a
candidate only. Only one compatible collision-free exact active entry may
resolve; otherwise ask the first focused unresolved field. Compatible intents
below use only locked Category 1 canonical names.

## `trade_outcome_vocabulary` Language Registry

### Exact Definition

Routes `green`, `red`, `flat`, `scratch`, `winner`, and `loser` to locked
Category 3 outcomes only after eligible grain and selected gross or fee-complete
net basis are known. `green` is `> 0`, `red` is `< 0`, and `flat` is exact `= 0`.
`scratch` never invents a near-zero tolerance.

### Formal Wording

- profitable trade; losing trade; exact-zero realized trade; selected-basis
  positive, negative, or zero outcome.

### Normal Conversational Wording

- trades that made money; trades that lost money; trades that finished exactly
  even; which trades were winners or losers.

### Trader Slang

- `green` = positive eligible selected-basis result; `red` = negative result;
  `flat` = exact zero; `scratch` = context-sensitive exact-zero or explicit
  tolerance request; `winner`/`loser` = profitable/losing eligible trade.

### Abbreviations

- `W`/`L` may resolve only beside explicit winner/loser trade grammar. `BE` may
  resolve only beside explicit breakeven/exact-zero grammar. Bare short tokens
  are abbreviation/ticker collisions and require clarification.

### Common Misspellings

- `profittable`, `loosing trade`, `breakevenn`, `winnder`, `losser`, and
  `scrtach` may normalize only when the remaining grammar uniquely preserves
  grain and meaning.

### Noisy or Incomplete Input

- `green trades july net pls`; `losers last wk gross`; `scratch count?` The
  first two retain explicit scope/basis; the last still needs scratch meaning,
  grain, basis, and period in staged order.

### Singular and Plural Forms

- winner/winners; loser/losers; green trade/green trades; red trade/red trades;
  flat trade/flat trades; scratch/scratches.

### Full Questions

- How many eligible closed trades were net winners in July?
- Which gross realized trades finished exactly flat last week?

### Commands

- Count gross losers this month.
- Retrieve fee-complete net winners for the selected period.

### Sentence Fragments

- July net winners.
- Exact-zero gross trades.

### Follow-Up Wording

- How many of those were losers on the same basis?
- Of that trusted result, show only exact flats.

Follow-ups reuse only a trusted accepted account, period, population, grain,
currency, and basis; missing or stale state requires clarification.

### Correction Wording

- I meant trade winners, not green days.
- Use fee-complete net, not gross.
- By scratch I mean within my explicit one-dollar tolerance, not exact flat.

### Comparison Wording

- Compare net winner counts for the two authorized periods using the same
  eligible population.
- Compare exact-flat rates by ticker on one declared gross basis.

### Ranking Wording

- Rank authorized ticker groups by net losing-trade count with an approved tie
  policy.
- Rank groups by exact-flat rate only where each denominator is nonzero.

### Negated Wording

- Show trades that were not net winners.
- Count exact flats, not approximately flat results.

Negation maps through Category 12 and never makes unknown/partial rows the
opposite class.

### Exclusion Wording

- Exclude open and decision rows from realized winner counts.
- Exclude fee-incomplete rows from the net classification and report coverage.

### Multi-Filter Wording

- Show July NVDA ready-closed net losers with complete fee coverage.
- Count gross winners in the selected session and size bucket only when those
  dimensions are authorized and available.

### Multi-Part Question Wording

- Give me gross winner, loser, and exact-flat counts for July, then state the
  eligible population and exclusions.

Each outcome remains a separate locked concept over the same compatible
population/basis.

### Ambiguous Wording

- `Was I green?` lacks trade/day/account-period grain and gross/net basis.
- `How many scratches?` lacks exact-zero versus explicit tolerance meaning.
- `Show W` is also an abbreviation/ticker collision.

### Negative Examples

These examples must not map to this concept.

- Make the chart green.
- Is RED a ticker?
- Will my next trade be a winner?
- Call every trade within five dollars flat without saving that threshold.

### Context Requirements

Require server-authorized account, locked Category 3 concept, eligible
`ready_closed` population, selected trade/day grain, declared gross or fee-
complete net basis, compatible currency, period/timezone, coverage, and trusted
accepted state for follow-ups. Raw IDs or another account's facts never resolve
context.

### Required Data

- Accepted realized P/L at the selected basis; projection state; currency;
  fee/credit completeness for net; exact eligible denominator; account/time
  scope; coverage and exclusions.

### Optional Data

- Authorized ticker, direction, session, setup/tag, or other available locked
  dimensions; approved explicit scratch tolerance where requested.

### Valid Filters

- Period, authorized account, `ready_closed`, ticker, direction, and other
  available Category 11 dimensions; selected-basis sign/equality predicate.

### Valid Groupings

- Available authorized Category 11 dimensions with compatible currency,
  population, timezone, and grain; no private raw label text or IDs.

### Valid Operators

- Category 12 exact `greater_than 0`, `less_than 0`, `equals 0`, explicit
  tolerance range, count, rate, comparison, and exclusion operators.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Mixed gross/net classification; mixed currency; open/unresolved rows treated
  as realized; silent scratch tolerance; prediction; advice; cross-account
  context; or a fuzzy/colliding abbreviation treated as exact.

### Default Interpretation

No gross/net, grain, period, or scratch-tolerance default. A unique exact active
locale-compatible term selects only the vocabulary candidate, not missing query
facts. `flat` remains exact zero; `scratch` requires trusted exact-outcome
context or clarification.

### Clarification Conditions

Clarify when outcome grain, gross/net basis, period, scratch meaning, compatible
currency/population, abbreviation/ticker identity, or exact-match collision is
unresolved. Fuzzy matches always require clarification until approved otherwise.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean trade outcomes or daily outcomes?
2. Should I use gross P/L or fee-complete net P/L?
3. For scratch, do you mean exact zero or a specific tolerance?
4. What period should I use?

### Unsupported Conditions

- Missing realized/fee/currency/coverage facts; zero rate denominator;
  unauthorized account; unsupported user tolerance; prediction, causation,
  advice, color/UI request, or attempted classification from private text.

### Target Analytics Tool or Query Capability

- Versioned vocabulary resolver, Category 3 outcome query, Category 2/5 P/L
  and fee coverage, Category 12 predicate validator, and coverage reporter;
  all Chat routing remains Planned.

### Result Units

- Owner result: nonnegative count or percentage with numerator/denominator, or
  bounded record list; always selected basis, currency, population, exclusions,
  coverage, locale/registry version, and match method.

### Fee Handling

Gross uses the locked gross result. Net uses exact gross P/L minus allocated
charge costs plus allocated charge credits and requires fee completeness.
Missing net evidence is partial/unavailable, never gross fallback.

### Open-Trade Handling

Open, decision, disputed, and incomplete rows cannot be realized winners,
losers, or flats. Keep them visible in coverage; route explicit unrealized
green/red language only to its separate locked owner when supported.

### Sample-Size Considerations

Return eligible count and exclusions with every rate/comparison/ranking. Zero
denominator is unavailable. Small samples remain factual with an explicit
limitation, never proof of skill or future performance.

## `trading_frequency_vocabulary` Language Registry

### Exact Definition

Routes `overtrade`, `trade too much`, `too many trades`, `kept clicking`,
`forced trades`, and `churned` only after distinguishing thresholded lifecycle-
start frequency, execution activity, repeat attempts, turnover, saved rule, or
explicit subjective label. No term proves motive or discipline.

### Formal Wording

- activity above an explicit lifecycle-start threshold; execution-event
  frequency; repeat-attempt frequency; trader-labelled excessive activity.

### Normal Conversational Wording

- Did I trade more than my limit?
- How many times was I in and out?
- Did I keep placing executions after my cutoff?

### Trader Slang

- `overtrade`/`trade too much`/`too many trades` need a threshold or comparison;
  `kept clicking` may mean executions; `forced trades` is user-labelled;
  `churned` may mean turnover, repeats, executions, or excessive activity.

### Abbreviations

- No bare `OT`, `TC`, or `TF` auto-route. Accept an abbreviation only with
  explicit activity/frequency grammar and after ticker/token collision checks.

### Common Misspellings

- `overtraded`, `over tradng`, `to many trades`, `kept cliking`, `churrned` may
  normalize only where grain and threshold meaning remain unique.

### Noisy or Incomplete Input

- `overtrade days july > 5 starts`; `clicks after loss?`; `churned alot`. The
  first supplies a threshold/grain; the others require grain or meaning.

### Singular and Plural Forms

- overtrade/overtrades/overtraded; trade/trades; click/clicks; forced
  trade/forced trades; churn/churned/churning.

### Full Questions

- What percentage of complete-coverage July active days had more than five
  zero-to-nonzero lifecycle starts?
- How many accepted execution events did I place in the selected session?

### Commands

- Calculate overtrading frequency with threshold five lifecycle starts.
- Count accepted execution events; do not call them trades.

### Sentence Fragments

- Days over five lifecycle starts.
- Execution clicks after 11:00.

### Follow-Up Wording

- Use six starts instead.
- Of those complete days, show the underlying lifecycle starts.

Reuse only the trusted account, active-day definition, period, grain, threshold,
timezone, and coverage; never reconstruct them from prose.

### Correction Wording

- I meant executions, not flat-to-flat trades.
- By churned I mean repeat attempts, not dollar turnover.
- Use my saved activity limit, not a universal overtrading threshold.

### Comparison Wording

- Compare the same thresholded frequency across two periods with complete
  account-local active-day coverage.
- Compare execution counts and repeat-attempt counts as separate results.

### Ranking Wording

- Rank authorized ticker groups by repeat-attempt count with a valid candidate
  population and tie policy.
- Rank periods by thresholded active-day rate only with nonzero denominators.

### Negated Wording

- Show complete days that were not above five lifecycle starts.
- Count executions, not inferred forced trades.

### Exclusion Wording

- Exclude partial days from the denominator and report them separately.
- Exclude no candidate before sequence positions and barriers are established.

### Multi-Filter Wording

- Show July NVDA long lifecycle starts after 10:00, while preserving the full
  pre-filter sequence and day coverage.

### Multi-Part Question Wording

- Calculate days above five starts, count accepted executions, and count repeat
  attempts; label each grain and coverage separately.

### Ambiguous Wording

- `Did I overtrade?` lacks threshold/rule and period.
- `I kept clicking` lacks execution versus lifecycle meaning.
- `Did I churn?` may mean turnover, repeat attempts, executions, or judgment.

### Negative Examples

These examples must not map to this concept.

- Diagnose why I forced trades from my losses.
- Tell me the universal number of trades that is overtrading.
- Treat every same-ticker fill as a new trade.
- Will I overtrade tomorrow?

### Context Requirements

Require server-authorized account, account IANA active-day scope, explicit
activity grain, period, threshold/rule/comparison where applicable, full
candidate sequence before filters, projection states/barriers, and coverage.
Private labels or raw IDs never establish context.

### Required Data

- Accepted lifecycle starts and/or execution events at the declared grain;
  account-local dates; complete active-day coverage; explicit threshold `T` or
  rule/comparison; projection/barrier states; denominator and exclusions.

### Optional Data

- Authorized ticker, direction, session, saved activity rule/version, repeat-
  attempt ordinal, and selected performance metric/basis for a separate result.

### Valid Filters

- Period, authorized account, ticker, direction, session, declared state, and
  post-sequence output filters. Filters never renumber candidates or hide
  barriers before the owning calculation.

### Valid Groupings

- Account-local day, authorized ticker, session, and other available factual
  dimensions compatible with the selected activity grain.

### Valid Operators

- Count; strict `greater_than T`; rate numerator/denominator; explicit
  comparison; ordered repeat ordinal; exclusion with visible coverage.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `detect_pattern`, `analyze_sequence`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Universal/default threshold; mixed execution/lifecycle/trade grains;
  filtered-before-sequencing attempts; hidden decision barriers; motive or
  discipline diagnosis; cross-account data; advice/prediction; fuzzy collision.

### Default Interpretation

No activity grain, threshold, rule, period, or motive default. Exact vocabulary
chooses only candidates. `kept clicking`, `forced trades`, and `churned` require
their explicit meaning unless trusted context supplies one unique compatible
typed owner.

### Clarification Conditions

Clarify missing grain first, then threshold/rule, period, and requested count/
rate. Clarify `churned` and `forced` meaning, abbreviations/tickers, collisions,
and every fuzzy candidate.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean execution events, lifecycle starts, or repeat attempts?
2. What threshold or saved rule should define too much?
3. What period should I use?
4. Do you want a count or the percentage of complete active days?

### Unsupported Conditions

- Missing activity/active-day/sequence coverage; absent threshold; zero rate
  denominator; unavailable rule version; unauthorized scope; motive,
  prediction, advice, or requested diagnosis from execution facts alone.

### Target Analytics Tool or Query Capability

- Versioned vocabulary resolver; Category 8 execution/repeat query; Category 9
  `overtrading_frequency`; rule/threshold validator; sequence barrier and
  coverage reporter. Chat runtime remains Planned.

### Result Units

- Nonnegative event/lifecycle/repeat count or percentage of complete active
  days, with exact grain, `T`, numerator/denominator, timezone, exclusions,
  barriers, locale/registry version, match method, and limitations.

### Fee Handling

Not applicable to activity identity. Any separate performance comparison uses
one explicit gross or fee-complete net basis, one currency, owner population,
and fee/credit coverage.

### Open-Trade Handling

Factual `legitimate_open` lifecycle starts may count in the locked thresholded
activity proxy. Decision/incomplete candidates make their day partial/
unavailable. They remain barriers and are never treated as realized outcomes.

### Sample-Size Considerations

Return complete active-day denominator and partial/excluded days. Zero
denominator is unavailable. Few days or events cannot prove overtrading,
discipline, motive, or future behavior.

## `profit_giveback_vocabulary` Language Registry

### Exact Definition

Routes `gave back profit`, `was green then lost it`, `let a winner turn red`,
`failed to lock in gains`, and `round-tripped profit` only after distinguishing
Category 10 candle `profit_giveback`, a supported trade/day P/L path, lifecycle
round trip, or subjective agency/quality wording.

### Formal Wording

- favourable candle extreme to exact realized exit price reversal; selected-
  basis positive-to-negative chronological P/L path; subjective gain-retention
  assessment.

### Normal Conversational Wording

- How much came off the best candle price before I exited?
- Which days were positive and later closed negative on the same basis?

### Trader Slang

- `gave back profit` is ambiguous; `was green then lost it` is a path claim;
  `let a winner turn red` adds agency wording; `failed to lock in gains` is a
  judgment; `round-tripped profit` is not automatically a position round trip.

### Abbreviations

- `PGB` may route only beside explicit candle profit-giveback grammar. Bare
  `GB`, `PGB`, or `RT` is abbreviation/ticker-unsafe and never auto-routes.

### Common Misspellings

- `givebak`, `gave bak`, `round triped profit`, `lockd gains`, `winner turnd red`
  may normalize only when grain and owner meaning are otherwise explicit.

### Noisy or Incomplete Input

- `giveback selected exit 1m candles pls`; `green then red july net?`; `gb?`.
  The first two preserve candidate owner clues; the last requires meaning.

### Singular and Plural Forms

- giveback/givebacks; winner/winners; gain/gains; exit/exits; trade/day P/L
  path(s); round-trip/round-tripped.

### Full Questions

- What was the one-minute candle profit giveback for the selected eligible
  long exit?
- Which July days moved from positive to negative fee-complete net P/L, if that
  path capability is available?

### Commands

- Calculate candle price giveback for the selected exact exit.
- Check availability for a gross positive-to-negative daily P/L path; do not
  substitute the candle metric.

### Sentence Fragments

- Selected exit candle giveback.
- Net green-then-red days.

### Follow-Up Wording

- Use the same exit and candle interval.
- I meant the same day's net P/L path.

Follow-ups require the trusted accepted grain, direction, boundaries, source/
interval or P/L basis, period, account, and coverage.

### Correction Wording

- I meant candle price giveback before exit, not post-exit movement.
- I meant a daily P/L path, not the Category 10 candle metric.
- Remove the judgment; just show the factual result and limitations.

### Comparison Wording

- Compare two eligible exits on the same candle source, interval, grain, and
  price basis.
- Compare compatible daily P/L paths only if their owner capability exists.

### Ranking Wording

- Rank eligible ticker groups by median per-unit candle price giveback with an
  approved tie policy and compatible coverage.

### Negated Wording

- Show candle giveback without using the exit-containing candle extreme.
- Return the factual path, not a judgment that I failed.

### Exclusion Wording

- Exclude exits with incomplete wholly-between-boundary candle coverage and
  report their count.
- Exclude unsupported P/L paths rather than substituting candle movement.

### Multi-Filter Wording

- Show one-minute candle giveback for selected ready-closed long NVDA exits
  with complete saved-source coverage.

### Multi-Part Question Wording

- Show candle giveback and percentage captured as separate locked formulas,
  then state interval, grain, and exclusions.

### Ambiguous Wording

- `How much did I give back?` lacks candle versus P/L path versus behavior.
- `I let winners turn red` lacks factual grain, basis, chronology, and asks
  possible agency interpretation.

### Negative Examples

These examples must not map to this concept.

- Tell me why I failed to lock gains.
- Should I hold longer next time?
- Use the exit candle high even though its intrabar order is unknown.
- Predict tomorrow's giveback.

### Context Requirements

Require authorized account and one explicit owner. Candle routing requires
exact entry/exit/direction/grain, compatible saved source/version/interval,
eligible wholly-between-boundary candles, price/currency/corporate-action basis,
and coverage. P/L paths require a separately supported owner, chronology,
population, basis, currency, and coverage.

### Required Data

- Candle owner: exact entry `E`, exit `X`, direction/times, eligible highs/lows,
  source/version/interval and gap coverage. P/L-path owner: exact timestamped
  compatible selected-basis values, grain, population, currency, and coverage.

### Optional Data

- Authorized ticker/direction/session filters; comparison side; approved group;
  presentation detail. Subjective label only when explicitly trader-authored.

### Valid Filters

- Trusted selected exit(s), direction, ticker, eligible grain, saved candle
  source/interval/coverage, period, and available owner-specific dimensions.

### Valid Groupings

- Compatible authorized dimensions that do not mix allocation/lifecycle grain,
  candle source/interval/basis, instrument/currency, or P/L path population.

### Valid Operators

- Long `P=max(E,H)`, `max(0,P-X)`; short `P=min(E,L)`, `max(0,X-P)`;
  owner-approved path comparisons; median/aggregate; exclusion/coverage.

### Compatible Intents

- `calculate_metric`, `compare_groups`, `group_and_aggregate`, `rank_results`,
  `analyze_trade`, `analyze_trend`, `explain_result`, `inspect_data_quality`,
  `unsupported_request`.

### Incompatible Combinations

- Candle and P/L path silently merged; boundary-candle extrema; mixed grains/
  intervals/sources/currencies; missing exit; fee-adjusted candle formula;
  agency/cause/advice/prediction; cross-account or fuzzy collision.

### Default Interpretation

No default owner, grain, interval, source, basis, or behavioral meaning.
Explicit `candle profit giveback` selects the Category 10 candidate only; a bare
giveback phrase requires clarification.

### Clarification Conditions

Clarify owner meaning first, then selected grain/exit or P/L grain, basis,
period, source/interval, and coverage. Clarify abbreviation/ticker collisions
and every fuzzy candidate.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean candle price giveback before exit, a P/L path, or a behavioral label?
2. Which trade, exit, or daily period should I use?
3. For a P/L path, should I use gross or fee-complete net?
4. For candles, which saved source and interval should I use?

### Unsupported Conditions

- No exact exit/direction; missing or incompatible candle coverage; unsupported
  combined-entry grain; absent P/L-path owner; missing fee/currency coverage;
  agency, causation, advice, regret, prediction, or unauthorized data.

### Target Analytics Tool or Query Capability

- Versioned vocabulary resolver; Category 10 `profit_giveback`; exact boundary
  and saved-candle coverage reader; separate locked P/L-path capability when
  available; coverage/limitation reporter. No Chat runtime is claimed.

### Result Units

- Candle owner: nonnegative per-unit price difference with instrument/currency,
  source/interval/grain/coverage. Other owners retain their own units. Include
  locale/registry version, match method, exclusions, and limitations.

### Fee Handling

Category 10 candle giveback excludes fees. A P/L-path result must declare gross
or fee-complete net and preserve charge costs/credits, currency, population,
and partial/unavailable coverage.

### Open-Trade Handling

Candle giveback requires an exact realized exit and is unavailable for open,
disputed, unmatched, or incomplete activity. A separate open path is allowed
only if its locked owner explicitly supports the required factual state.

### Sample-Size Considerations

Single-exit results are descriptive. Group comparisons/rankings report eligible
count, gaps, exclusions, and interval/source compatibility. Small samples prove
neither exit quality nor what the trader should do.

## `repeat_trading_vocabulary` Language Registry

### Exact Definition

Routes `re-entered`, `tried it again`, `another attempt`, `went back in`,
`revenge traded the same ticker`, and `second shot` while distinguishing a new
post-flat zero-to-nonzero lifecycle, a same-lifecycle add/fill, and explicit
user-labelled revenge wording. Motive is never derived.

### Formal Wording

- second-or-later zero-to-nonzero lifecycle in the same authorized account,
  stable instrument, and account-local entry date; same-lifecycle additional
  execution; explicit trader-authored revenge label.

### Normal Conversational Wording

- How many times did I get back into the same ticker after going flat?
- Was that another fill or a new attempt?

### Trader Slang

- `re-entered`, `tried it again`, and `another attempt` are sequence candidates;
  `went back in` may be add or reopen; `second shot` means exact attempt two;
  `revenge traded` is explicit language but no inferred motive.

### Abbreviations

- `RA`, `2A`, or `RT` never auto-route. `2nd shot` may normalize only with
  explicit same-instrument lifecycle grammar and ticker/token safety.

### Common Misspellings

- `re enterd`, `anther attempt`, `went bak in`, `revnge trade`, `secnd shot` may
  normalize only without changing lifecycle/add/motive meaning.

### Noisy or Incomplete Input

- `nvda back in after flat july`; `2nd shot same ticker`; `went back in?`.
  The last lacks add versus new-lifecycle context.

### Singular and Plural Forms

- re-entry/re-entries; attempt/attempts; shot/shots; add/adds; repeat/repeats;
  revenge trade/revenge trades.

### Full Questions

- How many second-or-later NVDA lifecycle attempts occurred on each account-
  local entry date in July?
- Did the selected `went back in` execution add to an open position or begin a
  new post-flat lifecycle?

### Commands

- Count repeat attempts after building the complete pre-filter sequence.
- Show attempt two only; do not count scale-ins.

### Sentence Fragments

- Same-ticker attempts after flat.
- Selected went-back-in event.

### Follow-Up Wording

- Which of those were exactly second attempts?
- Show the decision barrier and stop before it.

Trusted account/instrument/date/sequence and barrier state are required; an
untrusted `those` reference cannot select private records.

### Correction Wording

- I meant adds while still open, not repeat attempts.
- Keep attempt order before applying the loss filter.
- I used revenge as my label; do not infer it from re-entry timing.

### Comparison Wording

- Compare repeat-attempt counts across periods using the same partition and
  complete pre-filter ordering.
- Compare attempt performance only after identity is fixed and basis declared.

### Ranking Wording

- Rank authorized ticker groups by repeat-attempt count with visible barriers
  and an approved deterministic tie policy.

### Negated Wording

- Show new attempts, not same-lifecycle adds.
- Count repeats without labelling them revenge trades.

### Exclusion Wording

- Exclude scale-ins after lifecycle identity is established.
- Do not skip a decision/incomplete candidate or renumber later attempts.

### Multi-Filter Wording

- Show July NVDA long repeat attempts after 10:00, preserving the complete
  account/stable-instrument/local-date sequence before output filters.

### Multi-Part Question Wording

- Count repeat attempts, list exact second attempts, and report each barrier and
  partial segment; do not infer motive.

### Ambiguous Wording

- `I went back in` lacks add versus new attempt.
- `Was that revenge?` asks a motive not established by sequence facts.
- `second shot` lacks the complete sequence/partition.

### Negative Examples

These examples must not map to this concept.

- Count every entry fill as another attempt.
- Remove the unresolved predecessor before numbering attempts.
- Diagnose revenge from a loss followed by re-entry.
- Tell me whether I should take a second shot tomorrow.

### Context Requirements

Require authorized account, stable instrument, account IANA entry date, complete
current lifecycle candidates, first-entry raw UTC order and server-side stable
tie fact, projection/barrier state, and trusted selected entity for follow-ups.
Raw IDs stay server-side.

### Required Data

- Accepted zero-to-nonzero and return-to-zero lifecycle facts; account/stable
  instrument; first-entry raw UTC; account timezone/local date; projection
  states; complete candidate and barrier coverage.

### Optional Data

- Authorized ticker/direction/session filters applied after numbering; explicit
  user revenge label; selected outcome/performance metric and gross/net basis.

### Valid Filters

- Account, period, ticker, direction, session, state, and ordinal only after the
  full partition/order/barriers establish attempt identity.

### Valid Groupings

- Authorized stable instrument, account-local entry date, exact attempt ordinal,
  and other available factual dimensions that do not renumber the sequence.

### Valid Operators

- Ordered partition, first versus second/later classification, count, ordinal
  equality/range, comparison/ranking, and visible barrier truncation.

### Compatible Intents

- `retrieve_records`, `calculate_metric`, `compare_groups`,
  `group_and_aggregate`, `rank_results`, `analyze_sequence`, `explain_result`,
  `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Fill/add count substituted for lifecycle attempt; filters before ordering;
  skipped barriers; cross-date/account/instrument sequence; raw IDs; inferred
  revenge/motive; advice/prediction; fuzzy or ticker collision.

### Default Interpretation

No add-versus-attempt or motive default. Explicit `repeat attempt` selects the
Category 8 candidate, but identity still requires the full sequence. `went back
in` and revenge wording require context or clarification.

### Clarification Conditions

Clarify add versus new lifecycle first; then stable instrument/date scope,
selected ordinal, and whether revenge is an explicit stored label. Clarify
abbreviation/ticker collisions and every fuzzy candidate.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean another execution while still open or a new entry after returning to flat?
2. Which ticker and account-local date should define the attempt sequence?
3. Do you want all second-or-later attempts or exactly attempt two?
4. Is revenge an explicit trader-authored label, or are you asking about factual repeat attempts only?

### Unsupported Conditions

- Incomplete lifecycle identity/order; missing stable instrument/timezone;
  decision barrier beyond exact prefix; cross-account reference; inferred
  motive/quality; advice/prediction; or requested renumbering after filters.

### Target Analytics Tool or Query Capability

- Versioned vocabulary resolver; Category 8 `repeat_attempts` sequence builder;
  lifecycle/add classifier; coverage/barrier reporter; optional explicit label
  reader. Chat runtime remains Planned.

### Result Units

- Nonnegative repeat-attempt count or bounded lifecycle list per authorized
  account/stable-instrument/account-local-entry-date partition, with ordinals,
  exact pre-barrier prefix, partial/unavailable coverage, locale/version and
  match method.

### Fee Handling

Not applicable to attempt identity. Any outcome/performance result separately
uses one explicit gross or fee-complete net basis, compatible currency, owner
population, and visible sequence barriers.

### Open-Trade Handling

The pre-filter sequence includes factual `legitimate_open`, `ready_closed`,
`needs_decision`, and incomplete candidates. Legitimate open may retain ordinal
state; decision/incomplete candidates are unskippable barriers. None becomes a
realized outcome through vocabulary.

### Sample-Size Considerations

Return partition count, eligible repeat count, and barrier/exclusion counts.
Small repeat samples do not establish overtrading, revenge, edge, or future
performance.

## `position_size_vocabulary` Language Registry

### Exact Definition

Routes `size`, `share size`, `position`, `exposure`, `went bigger`, `sized up`,
and `went heavy` only after resolving measure, grain, valuation/currency basis,
comparison baseline/predecessor, formula, and coverage. These terms are not one
generic exposure concept.

### Formal Wording

- accepted share quantity; maximum absolute running position quantity; approved
  notional/exposure measure; size transition relative to an explicit comparable
  predecessor or baseline.

### Normal Conversational Wording

- How many shares was the position at its largest?
- Was the next trade larger on the same size measure?
- What was the approved dollar exposure definition?

### Trader Slang

- `size` is ambiguous; `share size` means quantity; `position` may be an entity;
  `exposure` needs a contract; `went bigger`/`sized up` compare observations;
  `went heavy` is subjective without baseline.

### Abbreviations

- `qty` and `shs` may resolve beside explicit quantity grammar. Bare `PS`,
  `SZ`, `EXP`, or uppercase short forms require abbreviation/ticker checks and
  never auto-route.

### Common Misspellings

- `posistion size`, `share sze`, `expousre`, `sized upp`, `went hevy` may
  normalize only without choosing a missing measure or baseline.

### Noisy or Incomplete Input

- `max shares nvda july`; `bigger after loss?`; `exposure pls`. The first has a
  candidate measure; the others need measure/baseline or exposure definition.

### Singular and Plural Forms

- share/shares; position/positions; size/sizes; exposure/exposures;
  transition/transitions; predecessor/predecessors.

### Full Questions

- What was the maximum absolute open share quantity for each eligible July
  round trip?
- Did the selected next trade have a larger maximum position quantity than its
  exact compatible predecessor?

### Commands

- Calculate average maximum position size in shares.
- Check whether approved dollar exposure is available; do not substitute entry
  notional.

### Sentence Fragments

- Median max-open shares.
- Went bigger versus exact predecessor.

### Follow-Up Wording

- Use share quantity, not dollars.
- Compare it with the exact prior compatible trade.

Trusted measure/grain/baseline/account/period are required; `it` cannot resolve
from prose alone.

### Correction Wording

- I meant maximum open share quantity, not shares purchased.
- Use entry notional only if I explicitly request that locked measure; do not
  call it generic exposure.
- I meant a larger next trade, not adding within one position.

### Comparison Wording

- Compare average maximum position quantity across two compatible groups.
- Compare selected and predecessor size on the same measure and basis, with
  signed difference and equality state.

### Ranking Wording

- Rank authorized ticker groups by median maximum position quantity with an
  approved tie policy and eligible population.

### Negated Wording

- Show quantity size, not dollar exposure.
- Compare larger positions without treating equal size as bigger.

### Exclusion Wording

- Exclude incomplete quantity/allocation coverage and report it.
- Exclude unavailable exposure observations rather than substituting shares.

### Multi-Filter Wording

- Show July ready-closed long NVDA trades by maximum position quantity, with
  complete accepted quantity/allocation coverage.

### Multi-Part Question Wording

- Return average, median, and maximum of per-round-trip maximum absolute open
  quantity, then state eligible count and exclusions.

### Ambiguous Wording

- `What was my size?` lacks measure and grain.
- `Did I go heavy?` lacks baseline/threshold.
- `Show exposure` lacks valuation time/price, definition, unit, and currency.
- `position` may name an entity rather than a metric.

### Negative Examples

These examples must not map to this concept.

- Treat share size as dollar exposure.
- Infer risk from maximum shares.
- Use account equity as the missing exposure denominator.
- Tell me how large I should trade tomorrow.

### Context Requirements

Require authorized account, locked Category 6 measure, exact trade/execution
grain, accepted quantity/allocation facts, period, eligible population,
currency/price basis where monetary, and explicit predecessor/baseline for
relative language. Raw IDs/private labels remain server-side.

### Required Data

- Quantity measures: accepted execution quantities and chronological running
  position per eligible round trip. Exposure: separately approved definition,
  valuation event/price, unit/currency, denominator and coverage. Transition:
  two compatible observations, order, formula, equality, and barriers.

### Optional Data

- Authorized ticker, direction, session, size bucket, selected P/L basis for a
  separate performance metric, and approved personal baseline/version.

### Valid Filters

- Period, account, ticker, direction, state, session, explicit quantity/notional
  bounds, and available approved size buckets under their exact definition.

### Valid Groupings

- Authorized ticker, direction, session, explicit size bucket, and other
  available dimensions compatible with the same measure/grain/currency.

### Valid Operators

- Sum accepted side quantity; maximum absolute running quantity per round trip;
  arithmetic mean; exact median; maximum; explicit difference/percentage and
  equality; typed threshold/range; exclusion/coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_sequence`,
  `analyze_trend`, `explain_result`, `inspect_data_quality`,
  `unsupported_request`.

### Incompatible Combinations

- Quantity/exposure/notional mixed; entry notional as generic exposure;
  position entity as metric; missing baseline; mixed grains/currencies;
  incomplete allocations silently included; inferred risk/motive/advice;
  cross-account or fuzzy/ticker collision.

### Default Interpretation

No measure, grain, exposure definition, currency, baseline, or transition
formula default. `share size` selects quantity candidate; `size`, `position`,
`exposure`, and relative slang still require explicit compatible facts.

### Clarification Conditions

Clarify measure first, then grain, baseline/predecessor for relative wording,
period, and currency/valuation definition. Clarify abbreviation/ticker
collisions and every fuzzy candidate.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean share quantity, maximum open quantity, entry notional, or a saved exposure measure?
2. Should I calculate it per execution, per round trip, or across a group?
3. For larger/heavier, what predecessor or saved baseline should I compare with?
4. What period should I use?

### Unsupported Conditions

- Missing quantity/allocation coverage; absent exposure definition or valuation
  basis; unavailable normal-size baseline; unknown predecessor; mixed currency/
  grain; zero denominator; inferred risk/motive; advice/prediction or
  unauthorized account.

### Target Analytics Tool or Query Capability

- Versioned vocabulary resolver; Category 6 size metrics; accepted execution/
  running-position reader; explicit exposure/baseline registry when available;
  comparison validator and coverage reporter. Chat runtime remains Planned.

### Result Units

- Shares/quantity for quantity owners; approved currency-notional/exposure unit
  only under its exact definition; signed/absolute/percentage transition only
  with valid denominator. Include grain, population, coverage, locale/version,
  match method, and limitations.

### Fee Handling

Quantity and maximum-position calculations exclude fees. Any performance or
profit-per-exposure metric separately declares gross or fee-complete net basis,
charge costs/credits, compatible currency/population, and denominator coverage.

### Open-Trade Handling

Accepted open quantity may be visible where the locked owner permits it.
Realized performance-by-size retains its ready-closed population. Decision or
incomplete allocation chains remain visible and cannot become zero/closed.

### Sample-Size Considerations

Return eligible observation count, incomplete/excluded coverage, measure/grain,
and baseline count. Small groups cannot prove risk, discipline, confidence, or
optimal future size; zero/unknown denominators are unavailable.

## `price_terms_vocabulary` Language Registry

### Exact Definition

Routes `sub-dollar`, `under a buck`, `below $1`, `penny stock`, `cheap stock`,
and `low-priced stock` only with explicit price field/time, strict operator and
threshold, unit/currency, applicability, definition version, and coverage.

### Formal Wording

- Price strictly below one declared currency unit; record within an approved
  effective price definition or bucket.

### Normal Conversational Wording

- Which trades had the specified entry price below one USD?
- Show records covered by my approved low-price definition.

### Trader Slang

- `sub-dollar`, `under a buck`, and `below $1` express `< 1` but not the price
  field/time; `penny stock` needs its saved definition; `cheap stock` and
  `low-priced stock` need an approved threshold.

### Abbreviations

- Bare `PS`, `LP`, or `SD` never auto-route. Short/uppercase forms are checked
  as tickers/tokens and require explicit price-definition grammar.

### Common Misspellings

- `subdollar`, `under a buk`, `peny stock`, `cheep stock`, `low price stock`
  may normalize without supplying missing field, time, currency, or definition.

### Noisy or Incomplete Input

- `entry <1 usd july`; `penny stocks pls`; `cheap names`. Only the first states
  field/operator/unit; the others need an approved definition.

### Singular and Plural Forms

- penny stock/penny stocks; cheap stock/cheap stocks; low-priced stock/stocks;
  sub-dollar trade/trades.

### Full Questions

- Which July trades had accepted entry price strictly below one USD?
- Which records satisfy the effective approved penny-stock definition?

### Commands

- Filter by exact entry price below one USD.
- Check price-bucket availability; do not invent low/medium/high bounds.

### Sentence Fragments

- Entry below $1 USD.
- Approved penny-stock definition only.

### Follow-Up Wording

- Use exit price instead.
- Keep that exact effective definition and period.

Follow-ups require trusted field/time/currency/definition/account state.

### Correction Wording

- I meant entry price, not the current quote.
- By low-priced I mean my saved bucket, not penny stock.
- Use strict below one, not less-than-or-equal.

### Comparison Wording

- Compare compatible groups inside versus outside the same approved definition.
- Compare counts below one USD using the same price field and observation event.

### Ranking Wording

- Rank approved price buckets by eligible trade count only with complete
  nonoverlapping definitions and a tie policy.

### Negated Wording

- Show records not below one USD on the declared entry-price field.
- Use the saved definition, not ticker names that sound cheap.

### Exclusion Wording

- Exclude missing/incompatible price facts and report coverage.
- Exclude records outside the approved effective bucket without inventing gaps.

### Multi-Filter Wording

- Show July ready-closed long NVDA entries strictly below one USD with complete
  accepted entry-price coverage.

### Multi-Part Question Wording

- Count records below one USD and records in my approved penny-stock definition;
  return them separately with field, version, and coverage.

### Ambiguous Wording

- `Show penny stocks` lacks effective definition and price basis.
- `Cheap stocks` lacks threshold/field/time/currency.
- `Below $1` lacks price field and observation event.

### Negative Examples

These examples must not map to this concept.

- Infer penny stocks from ticker names.
- Use today's quote for historical entry classification.
- Invent cheap as below five dollars.
- Recommend a penny stock to buy.

### Context Requirements

Require authorized account, locked price owner, exact field/event, operator,
threshold, unit/currency, applicability, effective version, accepted price fact,
and coverage. No current quote, browser text, private label, or raw ID fallback.

### Required Data

- Covered compatible price fact; field/time; operator/threshold; unit/currency;
  approved definition bounds/endpoints/ties/gaps/overlap/applicability/version.

### Optional Data

- Authorized ticker, direction, period, session, selected group, and compatible
  performance metric/basis.

### Valid Filters

- Explicit price predicate, approved `price_buckets`, approved
  `penny_stocks_where_explicitly_defined`, period, ticker, direction, and state.

### Valid Groupings

- Approved nonoverlapping price buckets and available authorized dimensions
  with the same price field/time/unit/currency/definition version.

### Valid Operators

- Strict `<`, `>`, exact endpoints, explicit range/membership, count,
  comparison/rank, and exclusion with coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`,
  `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Current quote as historical fact; ticker/word inference; missing definition;
  mixed field/time/currency/version; silent endpoint; advice/prediction;
  cross-account or fuzzy/abbreviation collision.

### Default Interpretation

No field, time, currency, bucket, penny-stock, or cheapness default. Explicit
`below $1` supplies strict threshold only; it does not complete classification.

### Clarification Conditions

Clarify price field first, then event/time, currency, and approved definition.
Clarify ticker/abbreviation collisions and every fuzzy candidate.

### Recommended Clarification Wording

Ask one field at a time:

1. Which price field should I use: entry, exit, average, candle, or another approved field?
2. At what event or time should that price be observed?
3. Which currency should the threshold use?
4. Which saved effective definition should penny stock, cheap, or low-priced use?

### Unsupported Conditions

- Missing/incompatible price fact; absent approved bucket/penny definition;
  unknown field/time/currency; unavailable coverage; current-quote inference;
  unauthorized scope; advice, prediction, or causation.

### Target Analytics Tool or Query Capability

- Versioned vocabulary/definition resolver; Category 11 price predicate,
  `price_buckets`, and `penny_stocks_where_explicitly_defined`; Category 12
  operator validator; coverage reporter. Unavailable owners remain unavailable.

### Result Units

- Bounded records/counts/groups with exact price field/event, operator,
  threshold, unit/currency, definition version, coverage, locale/version, and
  match method.

### Fee Handling

Not applicable to price classification. Performance requests retain their own
gross/net, fee/credit, currency, population, and coverage contract.

### Open-Trade Handling

Open or closed records classify only where the locked owner permits their state
and the exact required price field/time is covered. No quote/price substitution.

### Sample-Size Considerations

Return eligible and missing-price counts per definition/version. Small buckets
do not prove value, quality, or future performance.

## `user_tag_language` Language Registry

### Exact Definition

Resolves one unique normalized exact active locale-compatible current-account
tag name/alias to Category 11 `custom_tag` only when class/version/collision and
explicit association coverage pass. Fuzzy candidates never auto-route.

### Formal Wording

- Records explicitly associated with authorized custom tag [name/version].

### Normal Conversational Wording

- Show trades I tagged with my exact saved label.
- How did my selected tag perform on the declared basis?

### Trader Slang

- User-entered tag names/aliases retain their stored meaning; generic slang is
  not a tag unless the same-account active registry proves it.

### Abbreviations

- A short/uppercase alias resolves only after ticker/token and other-label-class
  collision checks. Bare hashtag or initials never create a tag.

### Common Misspellings

- Misspellings are fuzzy candidates only and require focused confirmation of
  the intended authorized tag.

### Noisy or Incomplete Input

- `my [tag] trades july`; `tagg perf`; `#ABC`. Missing/short labels require the
  exact authorized candidate and collision check.

### Singular and Plural Forms

- tag/tags; label/labels; tagged trade/tagged trades; alias/aliases.

### Full Questions

- Show July trades explicitly associated with my authorized tag [display name].
- Compare gross P/L for tagged versus untagged only with complete tag coverage.

### Commands

- Filter by the exact active tag version.
- Explain tag coverage without exposing private IDs.

### Sentence Fragments

- My [tag] trades.
- Exact tag version, July.

### Follow-Up Wording

- Use that same authorized tag.
- Show its coverage first.

Trusted typed tag reference/account/version is required; prose recency is not.

### Correction Wording

- I meant my tag, not the generic phrase.
- Use the current tag version, not the deprecated alias meaning.
- I meant setup, not tag.

### Comparison Wording

- Compare explicitly tagged and untagged eligible populations with identical
  coverage and metric basis.

### Ranking Wording

- Rank authorized tags by one declared metric with covered associations and an
  approved tie policy.

### Negated Wording

- Show eligible records not explicitly associated with this exact tag; unknown
  coverage is not untagged.

### Exclusion Wording

- Exclude this tag association while preserving other filters and coverage.

### Multi-Filter Wording

- Show July NVDA ready-closed trades with my exact tag and complete association
  coverage.

### Multi-Part Question Wording

- Show the tag's eligible count and net P/L, then state association and fee
  coverage separately.

### Ambiguous Wording

- Same alias in tag/setup classes; multiple current tags with normalized same
  form; deprecated changed meaning; short ticker-like alias; fuzzy misspelling.

### Negative Examples

These examples must not map to this concept.

- Infer a tag from note text or outcome.
- Use another account's same-named tag.
- Apply/create/rename the tag now.
- Claim the tag caused performance.

### Context Requirements

Require server-authorized account, unique active exact tag/alias and version,
class compatibility, collision-free match, explicit association and coverage.
Only minimum privacy-safe typed metadata leaves server resolution.

### Required Data

- Active tag definition/alias/version/locale/status; same-account authorization;
  explicit record associations; association coverage; locked metric facts when
  analyzing results.

### Optional Data

- Deprecated equivalent alias mapping, authorized ticker/period/dimensions, and
  selected metric/basis.

### Valid Filters

- Exact authorized `custom_tag` association, period, ticker, direction, state,
  and other available locked dimensions.

### Valid Groupings

- Authorized covered tags and compatible dimensions; output uses approved
  display names only when needed, never raw IDs/private definitions.

### Valid Operators

- Exact membership/nonmembership with unknown separated; count, aggregate,
  compare, rank, and coverage operations.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `evaluate_label`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Cross-account lookup; note/outcome inference; unknown as untagged; fuzzy
  auto-route; class/ticker collision; deprecated changed meaning; mutation;
  cause/advice/runtime claim.

### Default Interpretation

Only one strong exact active same-account collision-free tag match may take
precedence over generic language. No fuzzy, class, version, or association
default.

### Clarification Conditions

Clarify label class first, then exact colliding tag/version, then association
scope. Fuzzy candidates and short/ticker-like aliases always clarify.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean your saved tag or the generic phrase?
2. Which of the matching active tags do you mean?
3. Should I use the current version or a specific historical version?
4. What period should I analyze?

### Unsupported Conditions

- Missing/unauthorized tag definition or association; incomplete coverage;
  cross-account request; deprecated changed meaning; mutation; inferred label,
  cause, prediction, or advice.

### Target Analytics Tool or Query Capability

- Authorized versioned label resolver, Category 11 `custom_tag` membership,
  metric owner and coverage reporter. No label write or Chat runtime.

### Result Units

- Privacy-safe tag reference/display plus eligible count or owner metric units,
  definition/alias version, locale/match method, association/metric coverage,
  exclusions, and limitations; no raw IDs/private text.

### Fee Handling

Tag identity has no fees. Tag analytics retain the metric owner's gross/net,
charge-cost/credit, currency, population, and coverage.

### Open-Trade Handling

Open or closed records qualify only with explicit covered association and owner-
permitted state. Missing tag coverage is unknown, not false.

### Sample-Size Considerations

Report tagged eligible count, unknown-association count, exclusions, and metric
denominator. Small samples prove neither tag quality nor causation.

## `user_setup_language` Language Registry

### Exact Definition

Resolves one unique normalized exact active same-account setup name/alias to
Category 11 `setup` only with current version and explicit covered association.
The owner remains Unavailable without that fact; fuzzy candidates never route.

### Formal Wording

- Records explicitly associated with authorized trader-defined setup
  [name/effective version].

### Normal Conversational Wording

- Show trades from my First Green Day Breakout setup.
- How did my saved setup perform, if setup coverage exists?

### Trader Slang

- `First Green Day Breakout`, `first green day`, `FGD`, `FGD breakout`, and
  `my first-green setup` are aliases only when stored active in this account.

### Abbreviations

- `FGD` and other uppercase initials must pass ticker/abbreviation and cross-
  class collision checks; none is globally reserved.

### Common Misspellings

- `first gren day`, `brakout`, and misspelled private aliases are fuzzy
  candidates only, never automatic setup matches.

### Noisy or Incomplete Input

- `fgd july perf`; `my first green`; `setup?`. Short/incomplete language needs
  exact authorized candidate, class, and scope.

### Singular and Plural Forms

- setup/setups; setup trade/setup trades; alias/aliases; breakout/breakouts.

### Full Questions

- Show July records explicitly associated with my current FGD setup version.
- What is gross P/L for that setup if association coverage is complete?

### Commands

- Filter by the exact authorized setup.
- Report setup coverage before calculating results.

### Sentence Fragments

- My FGD setup, July.
- First-green setup coverage.

### Follow-Up Wording

- Use that same setup version.
- Show its covered trades.

Requires trusted typed accepted setup reference/account/version.

### Correction Wording

- FGD is my setup alias, not a ticker.
- I meant strategy, not setup.
- Use the historical setup version effective then.

### Comparison Wording

- Compare two explicitly covered setup populations on one metric/basis.

### Ranking Wording

- Rank authorized covered setups by a declared metric with sample counts and tie
  policy.

### Negated Wording

- Show records not explicitly associated with this setup; unknown remains
  unknown, not `no setup`.

### Exclusion Wording

- Exclude this exact setup version while preserving visible coverage.

### Multi-Filter Wording

- Show July NVDA ready-closed trades explicitly labelled with my FGD setup.

### Multi-Part Question Wording

- Return setup trade count and gross P/L, then association and metric coverage.

### Ambiguous Wording

- `FGD` may be ticker/abbreviation; `first green day` may be generic outcome;
  same alias may be setup/tag/strategy; version or association may be missing.

### Negative Examples

These examples must not map to this concept.

- Infer FGD setup from a green day or chart pattern.
- Use another account's setup.
- Create/apply the setup label.
- Say the setup caused profits or recommend it.

### Context Requirements

Require authorized account, unique active exact setup/alias/version, collision-
free compatible class, explicit association, and coverage. No chart, note,
ticker, result, raw ID, or private cross-account fallback.

### Required Data

- Setup definition/aliases/version/locale/status; authorization; explicit record
  association and coverage; owner metric facts for analysis.

### Optional Data

- Deprecated equivalent aliases, effective historical version, authorized
  period/ticker/dimensions, and metric/basis.

### Valid Filters

- Exact authorized `setup` association plus available period, ticker, direction,
  state, and dimensions.

### Valid Groupings

- Covered authorized setups and compatible factual dimensions; never raw IDs or
  unnecessary private definitions.

### Valid Operators

- Exact membership/nonmembership with unknown separate; count, aggregate,
  compare, rank, and coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `evaluate_label`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Chart/result inference; cross-account; FGD ticker collision; fuzzy auto-route;
  changed/deprecated meaning; unknown as absent; mutation; cause/advice/runtime.

### Default Interpretation

Only a unique strong exact active current-account setup match may receive label
precedence. No global FGD, fuzzy, version, applicability, or association default.

### Clarification Conditions

Clarify setup versus ticker/generic/class first, then exact collision/version,
then period. Every fuzzy candidate requires clarification.

### Recommended Clarification Wording

Ask one field at a time:

1. Does FGD mean your saved setup, a ticker, or the generic phrase?
2. Which matching setup/version do you mean?
3. What period should I analyze?

### Unsupported Conditions

- Missing explicit setup fact/association; Category 11 owner Unavailable;
  cross-account; incomplete coverage; mutation; inferred pattern/quality/cause;
  advice or prediction.

### Target Analytics Tool or Query Capability

- Authorized versioned label resolver; Category 11 `setup`; `evaluate_label` and
  metric/coverage owners when facts exist. No write or Chat runtime.

### Result Units

- Privacy-safe setup reference/display plus eligible count or metric units,
  effective/alias version, locale/match, association/metric coverage and
  limitations; no raw IDs/private definition text.

### Fee Handling

Setup identity has no fee basis. Setup analytics retain owner gross/net,
charges/credits, currency, population, and coverage.

### Open-Trade Handling

Only explicitly associated records in owner-permitted state qualify. Missing
association remains unknown and cannot be inferred from live charts.

### Sample-Size Considerations

Report associated eligible count, unknown coverage, exclusions, and denominator.
Small setup samples do not establish quality, cause, or future edge.

## `user_strategy_language` Language Registry

### Exact Definition

Resolves one unique normalized exact active current-account strategy name/alias
to Category 11 `strategy` only with exact version and covered association. The
owner remains Unavailable without explicit facts; fuzzy candidates never route.

### Formal Wording

- Records explicitly associated with authorized trader-defined strategy
  [name/effective version].

### Normal Conversational Wording

- Show trades recorded under my saved strategy.
- Compare two covered strategies on the same metric.

### Trader Slang

- Trader-authored strategy aliases retain only their stored versioned meaning;
  style/pattern slang does not create a strategy association.

### Abbreviations

- Initials/short aliases require ticker, generic-term, and label-class collision
  checks; no strategy abbreviation is global.

### Common Misspellings

- Misspelled strategy names are fuzzy candidates requiring focused confirmation.

### Noisy or Incomplete Input

- `my strat july`; `[alias] perf`; `strategy?` requires one authorized active
  candidate, association coverage, and analysis scope.

### Singular and Plural Forms

- strategy/strategies; strategy trade/trades; name/names; alias/aliases.

### Full Questions

- Show July records explicitly associated with my active strategy version.
- What was net P/L for that strategy with complete fees and associations?

### Commands

- Filter by this exact authorized strategy.
- Report association coverage first.

### Sentence Fragments

- My strategy, July.
- Exact strategy version results.

### Follow-Up Wording

- Use that same strategy and basis.
- Show its covered record count.

Trusted typed strategy/account/version context is required.

### Correction Wording

- I meant strategy, not setup or playbook.
- Use the effective historical version, not today's changed definition.

### Comparison Wording

- Compare two explicit covered strategy populations on identical basis/metric.

### Ranking Wording

- Rank authorized strategies by one declared metric with eligible counts and an
  approved tie policy.

### Negated Wording

- Show records not explicitly associated with this strategy; unknown is not
  unassociated.

### Exclusion Wording

- Exclude this exact strategy version and report association coverage.

### Multi-Filter Wording

- Show July long NVDA ready-closed records explicitly assigned to my strategy.

### Multi-Part Question Wording

- Return strategy count and fee-complete net P/L, then state both coverages.

### Ambiguous Wording

- Same alias across setup/strategy/playbook/tag; short ticker-like alias;
  current/historical version collision; fuzzy or incomplete name.

### Negative Examples

These examples must not map to this concept.

- Infer strategy from ticker, candles, results, or notes.
- Use another account's same name.
- Rename/apply the strategy.
- Claim strategy caused results or recommend it.

### Context Requirements

Require authorized account, unique active exact strategy/alias/version,
compatible class, no collision, explicit association and coverage. Raw IDs and
private definitions remain server-side.

### Required Data

- Strategy definition/aliases/version/locale/status; authorization; explicit
  associations and coverage; selected metric facts and coverage.

### Optional Data

- Deprecated equivalent alias mapping, historical version, period/ticker/
  dimensions, metric and basis.

### Valid Filters

- Exact authorized `strategy` association plus available factual filters.

### Valid Groupings

- Covered authorized strategies and compatible dimensions, privacy-safe only.

### Valid Operators

- Exact membership/nonmembership with unknown separate; count, aggregate,
  compare, rank, and coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `evaluate_label`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Association inference; class/version collision; fuzzy auto-route;
  cross-account; unknown as absent; mutation; causation/advice/prediction/runtime.

### Default Interpretation

Only a unique strong exact active same-account strategy match may receive label
precedence. No class, fuzzy, version, association, or analysis default.

### Clarification Conditions

Clarify label class first, then exact strategy/version collision, then period/
metric. Short/ticker-like and every fuzzy candidate require clarification.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean your saved strategy, setup, playbook, or a generic phrase?
2. Which active strategy/version do you mean?
3. What period should I analyze?
4. Which metric and basis should I use?

### Unsupported Conditions

- Missing explicit strategy fact/association; owner Unavailable; unauthorized or
  cross-account; incomplete coverage; mutation; inferred pattern/cause/advice.

### Target Analytics Tool or Query Capability

- Authorized versioned label resolver, Category 11 `strategy`, locked metric and
  coverage owners. No mutation or Chat runtime.

### Result Units

- Privacy-safe strategy reference/display plus eligible count or owner metric,
  version/locale/match, association and metric coverage; no raw IDs/private text.

### Fee Handling

Strategy identity has no fees. Analytics retain exact owner gross/net,
charges/credits, currency, population, and coverage.

### Open-Trade Handling

Only explicit covered association and owner-permitted state qualify; open facts
cannot infer strategy or realized results.

### Sample-Size Considerations

Report eligible associated count, unknown coverage, exclusions and denominator.
Small strategy samples prove no cause, quality, or future outcome.

## `user_rule_language` Language Registry

### Exact Definition

Resolves one unique normalized exact active/effective same-account rule name or
alias to Category 11 `rule`. Identity is separate from applicability and
`rule_followed`/`rule_broken`; fuzzy candidates never auto-route.

### Formal Wording

- Authorized effective saved rule [name/version]; explicit applicability and
  separately covered rule-evaluation result.

### Normal Conversational Wording

- Show my rule's exact effective definition.
- Evaluate this saved rule only where applicability/evaluation facts exist.

### Trader Slang

- User rule nicknames/aliases retain stored versioned meaning; outcome or
  behavior slang cannot establish a rule or breach.

### Abbreviations

- Short/uppercase rule aliases require ticker/token and label-class collision
  checks; no bare initials auto-route.

### Common Misspellings

- Misspelled rule names are fuzzy candidates requiring confirmation, never a
  changed endpoint/version.

### Noisy or Incomplete Input

- `my max2 rule july`; `broke [alias]?`; `rule?` needs exact rule/version and
  separate applicability/evaluation coverage.

### Singular and Plural Forms

- rule/rules; rule name/names; alias/aliases; followed/broken evaluations.

### Full Questions

- Which July records had explicit applicability for my effective rule version?
- What covered facts say whether that rule was followed?

### Commands

- Retrieve the exact saved rule version.
- Evaluate only covered applicability; do not infer breach from loss.

### Sentence Fragments

- My effective rule version.
- Rule coverage, July.

### Follow-Up Wording

- Use the version effective then.
- Show covered evaluations only.

Trusted typed rule/account/version context is required.

### Correction Wording

- I meant the rule, not my goal.
- Use gross threshold as saved; do not change it to net.
- I meant retrieve the rule, not edit it.

### Comparison Wording

- Compare covered followed versus broken populations under the same exact rule
  version and metric basis.

### Ranking Wording

- Rank authorized rules by covered evaluation count, not inferred adherence,
  with tie policy and applicability counts.

### Negated Wording

- Show records where this rule was explicitly not followed; unknown is not
  broken.

### Exclusion Wording

- Exclude records where the rule was not applicable and report unknown coverage.

### Multi-Filter Wording

- Show July NVDA ready-closed records with explicit applicability to rule
  version three and covered evaluation.

### Multi-Part Question Wording

- Return applicable, followed, broken, and unknown counts separately, then the
  metric result on one declared basis.

### Ambiguous Wording

- Same alias across rule/goal/playbook; unspecified effective version;
  `broke it` without rule/reference; short ticker-like alias; fuzzy match.

### Negative Examples

These examples must not map to this concept.

- Infer a broken rule from a losing trade.
- Rewrite the threshold from this question.
- Use another account's rule.
- Tell me which rule I should adopt.

### Context Requirements

Require authorized account, unique exact active/effective rule/alias/version,
compatible class/no collision, explicit applicability/evaluation and coverage.
Raw IDs/private definitions remain server-side.

### Required Data

- Rule definition/aliases/effective version/locale/status; exact endpoints,
  basis/time/applicability; explicit evaluation facts or approved deterministic
  predicate; coverage.

### Optional Data

- Historical effective version, authorized period/ticker/dimensions, selected
  metric/basis, and deprecated equivalent alias.

### Valid Filters

- Exact `rule`, effective version, explicit applicability, `rule_followed`,
  `rule_broken`, period, and other available dimensions.

### Valid Groupings

- Covered authorized rules/evaluation states and compatible dimensions; no raw
  private definition or ID grouping.

### Valid Operators

- Exact membership/applicability; followed/broken/unknown partition; count,
  rate with nonzero denominator, compare/rank, and coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `evaluate_rule`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Identity as applicability/breach; loss as breach; mixed effective versions/
  bases; unknown as broken; cross-account; fuzzy collision; mutation;
  causation/advice/runtime.

### Default Interpretation

Only a unique strong exact active/effective current-account rule match may
resolve identity. No version, applicability, evaluation, threshold/basis, fuzzy,
or mutation default.

### Clarification Conditions

Clarify rule versus goal/class first, then effective version, then retrieve
versus evaluate, then period. Every fuzzy/ticker-like candidate clarifies.

### Recommended Clarification Wording

Ask one field at a time:

1. Do you mean your saved rule or another label class?
2. Which effective rule version should I use?
3. Do you want the definition or covered followed/broken evaluations?
4. What period should I analyze?

### Unsupported Conditions

- Missing/unauthorized rule/version; absent applicability/evaluation coverage;
  mixed basis; inferred breach; cross-account; requested mutation/advice/cause;
  no rule-evaluation runtime.

### Target Analytics Tool or Query Capability

- Authorized versioned rule resolver; Category 11 `rule`, `rule_followed`, and
  `rule_broken`; Category 1 `evaluate_rule`; metric/coverage owners. No write.

### Result Units

- Privacy-safe rule reference/version plus applicable/followed/broken/unknown
  counts or owner metric, denominator, locale/match, coverage and limitations;
  no raw IDs/private definition text.

### Fee Handling

Rule identity has no default basis. P/L rules preserve saved gross or fee-
complete net, charge costs/credits, currency, time endpoints, and coverage.

### Open-Trade Handling

Only explicit rule applicability/evaluation under an owner-permitted state may
include open activity. Open movement or outcome cannot infer adherence/breach.

### Sample-Size Considerations

Report applicable denominator, followed/broken/unknown counts and exclusions.
Small samples establish neither discipline, causation, nor recommended rules.

## `user_mistake_language` Language Registry

### Exact Definition

Resolves one unique exact active same-account mistake label/alias/version to
Category 11 `mistake` only with explicit association; owner is Unavailable
without it and fuzzy candidates never auto-route.

### Formal Wording

- Records explicitly associated with authorized trader-defined mistake [version].

### Normal Conversational Wording

- Show trades I explicitly labelled with this mistake.

### Trader Slang

- Mistake nicknames are labels only when stored; losses/repeats never create them.

### Abbreviations

- Short/uppercase aliases require ticker/class collision checks.

### Common Misspellings

- Misspellings are fuzzy candidates requiring confirmation.

### Noisy or Incomplete Input

- `my mistake july`; `[alias] cost?` needs exact label, association, and scope.

### Singular and Plural Forms

- mistake/mistakes; label/labels; association/associations.

### Full Questions

- What was gross P/L for July trades explicitly associated with this mistake?

### Commands

- Filter by the exact authorized mistake label and show coverage.

### Sentence Fragments

- My mistake label, July.

### Follow-Up Wording

- Use that same trusted label/version; show covered records only.

### Correction Wording

- I meant my mistake label, not every loss or broken rule.

### Comparison Wording

- Compare explicitly labelled versus unlabelled-known populations on one basis.

### Ranking Wording

- Rank covered mistake labels by declared cost metric and tie policy.

### Negated Wording

- Not associated with this label; unknown association stays unknown.

### Exclusion Wording

- Exclude this exact mistake version and report unknown coverage.

### Multi-Filter Wording

- July NVDA ready-closed trades explicitly associated with this mistake.

### Multi-Part Question Wording

- Return mistake count and cost separately with association/fee coverage.

### Ambiguous Wording

- Same alias across classes, deprecated meaning, fuzzy/ticker form, or `mistake`
  as a judgment rather than saved label.

### Negative Examples

These examples must not map to this concept.

- Infer mistake from loss, re-entry, note, or rule signal; create/apply it; say
  it caused losses; recommend a correction.

### Context Requirements

Authorized account, unique active exact label/version, compatible class,
collision-free match, explicit association and coverage; no raw IDs/private text.

### Required Data

- Versioned label/alias/locale/status, authorization, association/coverage, and
  selected metric facts for frequency/cost.

### Optional Data

- Equivalent deprecated alias, period/ticker/dimensions, metric/basis.

### Valid Filters

- Exact `mistake` association plus available factual filters.

### Valid Groupings

- Covered authorized mistake labels and compatible dimensions, privacy-safe.

### Valid Operators

- Membership/nonmembership/unknown, count, aggregate, compare, rank, coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `evaluate_label`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Inferred association, unknown as absent, cross-account, fuzzy collision,
  mutation, diagnosis, cause, advice, prediction, runtime.

### Default Interpretation

Only one strong exact active same-account collision-free label resolves; no
association, fuzzy, judgment, basis, or period default.

### Clarification Conditions

Clarify saved label versus judgment first, then colliding label/version, period,
and metric; every fuzzy/ticker-like form clarifies.

### Recommended Clarification Wording

1. Do you mean your saved mistake label or a general judgment?
2. Which matching active label/version do you mean?
3. What period should I use?

### Unsupported Conditions

- Missing/unauthorized label/association, incomplete coverage, owner
  Unavailable, inferred motive/cause, mutation, advice, prediction.

### Target Analytics Tool or Query Capability

- Versioned label resolver, C11 `mistake`, C9 mistake frequency/cost when
  covered, C1 `evaluate_label`, metric/coverage owners; no write/runtime.

### Result Units

- Privacy-safe label reference plus count/metric units, versions, match,
  association/metric coverage; no raw IDs/private text.

### Fee Handling

Identity has no fees; cost uses declared gross or fee-complete net, currency and coverage.

### Open-Trade Handling

Only explicit associations and owner-permitted states; open/loss facts infer nothing.

### Sample-Size Considerations

Report labelled/unknown counts and denominator; small samples prove no cause.

## `user_playbook_language` Language Registry

### Exact Definition

Resolves one unique exact active same-account playbook alias/version to C11
`playbook` with explicit association; owner remains Unavailable otherwise.

### Formal Wording

- Records explicitly associated with authorized playbook [effective version].

### Normal Conversational Wording

- Show trades recorded under my saved playbook.

### Trader Slang

- Playbook nicknames keep stored meaning; setup/strategy slang is not equivalent.

### Abbreviations

- Initials require ticker and cross-class collision checks.

### Common Misspellings

- Misspelled names are fuzzy candidates only.

### Noisy or Incomplete Input

- `my book july`; `[alias] perf` needs exact candidate/class/version.

### Singular and Plural Forms

- playbook/playbooks; play/play(s); alias/aliases.

### Full Questions

- Show July trades explicitly associated with my playbook version.

### Commands

- Filter by the exact playbook and report coverage.

### Sentence Fragments

- My playbook, July.

### Follow-Up Wording

- Keep that trusted playbook/version and basis.

### Correction Wording

- I meant playbook, not setup or strategy.

### Comparison Wording

- Compare two covered playbook populations on the same metric.

### Ranking Wording

- Rank covered playbooks by declared metric, sample count, and tie policy.

### Negated Wording

- Not associated with this playbook; unknown remains unknown.

### Exclusion Wording

- Exclude this version and report association coverage.

### Multi-Filter Wording

- July long NVDA ready-closed records with this explicit playbook.

### Multi-Part Question Wording

- Return playbook count and net P/L with both coverages.

### Ambiguous Wording

- Same alias in setup/strategy/playbook, short ticker form, changed/deprecated meaning.

### Negative Examples

These examples must not map to this concept.

- Infer playbook from chart/ticker/outcome; use another account; mutate it;
  claim cause or recommend it.

### Context Requirements

Authorized account, unique active exact playbook/version, compatible class,
explicit association/coverage; no raw IDs/private definitions.

### Required Data

- Versioned definition/aliases/locale/status, authorization, associations,
  coverage and selected metric facts.

### Optional Data

- Historical/equivalent alias, period/ticker/dimensions, metric/basis.

### Valid Filters

- Exact `playbook` association plus factual filters.

### Valid Groupings

- Covered playbooks and compatible dimensions, privacy-safe.

### Valid Operators

- Membership/nonmembership/unknown, count, aggregate, compare, rank, coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `evaluate_label`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Inference, class/version collision, fuzzy auto-route, cross-account, mutation,
  cause/advice/prediction/runtime.

### Default Interpretation

Only one strong exact active same-account collision-free playbook resolves.

### Clarification Conditions

Clarify label class first, then playbook/version, period and metric; fuzzy clarifies.

### Recommended Clarification Wording

1. Do you mean your playbook, setup, strategy, or a generic phrase?
2. Which active playbook/version do you mean?
3. What period should I use?

### Unsupported Conditions

- Missing explicit association/coverage, owner Unavailable, unauthorized scope,
  mutation, inferred cause/quality/advice.

### Target Analytics Tool or Query Capability

- Versioned label resolver, C11 `playbook`, C1 `evaluate_label`, metric/coverage owners.

### Result Units

- Privacy-safe playbook reference plus count/metric, version/match/coverage; no IDs/private text.

### Fee Handling

Identity has no fees; analytics retain owner gross/net, charges, currency and coverage.

### Open-Trade Handling

Only explicit association and owner-permitted state; no inferred playbook.

### Sample-Size Considerations

Report eligible/unknown counts; small samples prove no quality or cause.

## `user_session_name_language` Language Registry

### Exact Definition

Resolves one unique exact active same-account name/version first to C11
`custom_trading_session`, Unavailable without complete effective-dated IANA
zone, calendar/day, bounds/endpoints, overnight/version definition; only then
C13 `session_times` resolves UTC membership. Fuzzy never auto-routes.

### Formal Wording

- Records within authorized custom-session definition [effective version].

### Normal Conversational Wording

- Show trades in my saved morning session.

### Trader Slang

- Session nicknames are stored definitions, not guessed market schedules.

### Abbreviations

- Short names require ticker/time-token/cross-class checks.

### Common Misspellings

- Misspelled session names are fuzzy candidates only.

### Noisy or Incomplete Input

- `my am sess`; `[alias] trades` needs exact definition/version.

### Singular and Plural Forms

- session/sessions; window/windows; name/names.

### Full Questions

- Which accepted entry events fall in my effective saved session?

### Commands

- Resolve the saved session definition before membership.

### Sentence Fragments

- My morning session, July.

### Follow-Up Wording

- Keep that exact session version/event basis.

### Correction Wording

- I meant my custom session, not regular market hours.

### Comparison Wording

- Compare two complete session definitions on identical event/metric basis.

### Ranking Wording

- Rank complete custom sessions by eligible count with tie policy.

### Negated Wording

- Outside this session; unknown membership remains unknown.

### Exclusion Wording

- Exclude outside intervals without guessing overnight endpoints.

### Multi-Filter Wording

- July NVDA entries inside my exact effective session.

### Multi-Part Question Wording

- Return session count and gross P/L with definition/time/metric coverage.

### Ambiguous Wording

- Ordinary/ticker-like name, multiple versions, missing event, overnight or endpoint rules.

### Negative Examples

These examples must not map to this concept.

- Use account/browser clock or exchange label fallback; infer schedule; mutate session.

### Context Requirements

Authorized account, exact active name/version, complete C11 definition, selected
accepted UTC event and C13 resolution coverage; no IDs/private text.

### Required Data

- IANA zone, calendar/day applicability, bounds/endpoints, overnight/effective
  version, event basis, UTC facts and coverage.

### Optional Data

- Period/ticker/dimensions and selected metric/basis.

### Valid Filters

- Exact `custom_trading_session`, event basis, period and factual filters.

### Valid Groupings

- Complete compatible custom sessions and dimensions.

### Valid Operators

- Endpoint-aware interval membership, count, compare, rank, coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `analyze_trend`,
  `explain_result`, `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Incomplete definition, guessed clock/schedule/event, mixed versions/zones,
  fuzzy collision, cross-account, mutation/advice/runtime.

### Default Interpretation

Only one strong exact active same-account name resolves; no schedule/event default.

### Clarification Conditions

Clarify saved versus exchange session first, then version, event basis, period.

### Recommended Clarification Wording

1. Do you mean your saved custom session or an exchange session?
2. Which effective session version should I use?
3. Which event should determine membership?

### Unsupported Conditions

- Incomplete C11 definition, missing UTC/event coverage, unauthorized scope,
  inferred schedule, mutation, advice.

### Target Analytics Tool or Query Capability

- Versioned resolver, C11 `custom_trading_session`, then C13 `session_times`, coverage owner.

### Result Units

- Privacy-safe definition/version plus UTC intervals/membership, zone/event/coverage; no IDs.

### Fee Handling

Session identity has no fees; metrics retain owner fee contract.

### Open-Trade Handling

Owner-permitted state and covered selected UTC event only.

### Sample-Size Considerations

Report eligible/missing-event counts; small sessions prove no edge.

## `user_price_bucket_language` Language Registry

### Exact Definition

Resolves one unique exact active same-account bucket/version to C11
`price_buckets`, Unavailable absent complete basis/unit/currency/bounds/endpoints/
ties/gaps-overlap/applicability/coverage definition. Fuzzy never auto-routes.

### Formal Wording

- Membership in authorized effective saved price bucket [version].

### Normal Conversational Wording

- Show trades in my saved low-price bucket.

### Trader Slang

- Bucket nicknames do not imply penny stock, cheap, or default bounds.

### Abbreviations

- Short bucket aliases require ticker/class collision checks.

### Common Misspellings

- Misspelled bucket names are fuzzy candidates only.

### Noisy or Incomplete Input

- `my low bucket`; `[alias] perf` needs exact definition/version.

### Singular and Plural Forms

- bucket/buckets; band/bands; range/ranges.

### Full Questions

- Which records satisfy my exact effective bucket definition?

### Commands

- Resolve the bucket definition before membership.

### Sentence Fragments

- My low bucket, July.

### Follow-Up Wording

- Keep that same bucket version and price basis.

### Correction Wording

- I meant my saved bucket, not penny stock or current quote.

### Comparison Wording

- Compare two nonoverlapping complete buckets on one metric/basis.

### Ranking Wording

- Rank complete buckets by eligible count with tie policy.

### Negated Wording

- Outside this bucket; unknown price coverage remains unknown.

### Exclusion Wording

- Exclude outside bounds while preserving gaps/overlap policy.

### Multi-Filter Wording

- July NVDA entries in my effective low bucket.

### Multi-Part Question Wording

- Return bucket count and net P/L with definition/price/fee coverage.

### Ambiguous Wording

- Same alias/class collision, changed version, missing price basis/bounds/endpoints.

### Negative Examples

These examples must not map to this concept.

- Invent low/medium/high bounds; use current quote; infer penny stock; mutate bucket.

### Context Requirements

Authorized account, unique active exact bucket/version, complete definition,
covered compatible price fact; no IDs/private text.

### Required Data

- Basis, unit/currency, bounds/endpoints, ties/gaps/overlap, applicability,
  version, price fact and coverage.

### Optional Data

- Period/ticker/dimensions and metric/basis.

### Valid Filters

- Exact `price_buckets` membership and factual filters.

### Valid Groupings

- Complete compatible buckets and authorized dimensions.

### Valid Operators

- Endpoint-aware range membership, unknown, count, compare, rank, coverage.

### Compatible Intents

- `retrieve_records`, `summarize_performance`, `calculate_metric`,
  `compare_groups`, `group_and_aggregate`, `rank_results`, `explain_result`,
  `inspect_data_quality`, `unsupported_request`.

### Incompatible Combinations

- Incomplete definition, quote/field substitution, overlap invention, fuzzy/
  ticker collision, cross-account, mutation/advice/runtime.

### Default Interpretation

Only one strong exact active same-account bucket resolves; no bounds/basis default.

### Clarification Conditions

Clarify saved bucket first, then version, price field/basis, period.

### Recommended Clarification Wording

1. Which saved price bucket do you mean?
2. Which effective version should I use?
3. Which covered price field should determine membership?

### Unsupported Conditions

- Incomplete owner definition/price coverage, unauthorized scope, invented
  bounds, mutation, advice/prediction.

### Target Analytics Tool or Query Capability

- Versioned resolver, C11 `price_buckets`, price/coverage owners; no write/runtime.

### Result Units

- Privacy-safe bucket/version plus membership/count/metric and coverage; no IDs/private text.

### Fee Handling

Membership has no fees; metrics retain gross/net/charges/currency coverage.

### Open-Trade Handling

Only owner-permitted state and covered exact price basis/time.

### Sample-Size Considerations

Report eligible/missing price counts; small buckets prove no quality.

## `user_goal_language` Language Registry

### Exact Definition

Resolves one unique exact active same-account goal/version, routes progress to C1
`evaluate_goal` Planned, while the separate metric/rule owner retains target,
population, basis, chronology, denominator and coverage. Fuzzy never auto-routes.

### Formal Wording

- Evaluate progress toward authorized saved goal [effective version].

### Normal Conversational Wording

- How close am I to my saved goal this period?

### Trader Slang

- Goal nicknames retain stored meaning; target/daily-limit slang is not equivalent.

### Abbreviations

- Short aliases require ticker/class collision checks.

### Common Misspellings

- Misspelled goal names are fuzzy candidates only.

### Noisy or Incomplete Input

- `my goal progress`; `[alias] july` needs exact goal/version and period.

### Singular and Plural Forms

- goal/goals; target/targets; milestone/milestones.

### Full Questions

- Evaluate my exact saved goal using its effective target and covered facts.

### Commands

- Show goal progress without changing its definition.

### Sentence Fragments

- My July goal progress.

### Follow-Up Wording

- Use that same goal version and factual snapshot.

### Correction Wording

- I meant goal, not rule; use net exactly as saved.

### Comparison Wording

- Compare progress for compatible goals without merging target owners.

### Ranking Wording

- Rank authorized goals by approved comparable progress only with tie policy.

### Negated Wording

- Show goals not attained; unknown coverage is not failure.

### Exclusion Wording

- Exclude unavailable evaluations and report reasons.

### Multi-Filter Wording

- Evaluate my July net-P/L goal for covered ready-closed facts.

### Multi-Part Question Wording

- Return target, actual, difference/progress, status, counts and limitations.

### Ambiguous Wording

- Same alias as rule, unspecified version/period/basis, generic `target`.

### Negative Examples

These examples must not map to this concept.

- Invent a goal; infer attainment from open P/L; change it; predict/advice/cause.

### Context Requirements

Authorized account, unique active exact goal/version, complete saved target,
compatible locked owner, period/timezone/population/basis/coverage; no IDs/private text.

### Required Data

- Target metric/fact, comparator/threshold, units/currency, period/timezone,
  applicability/grain/version and owner facts/coverage.

### Optional Data

- Authorized dimensions, historical version, presentation detail.

### Valid Filters

- Exact goal/version and owner-permitted factual filters.

### Valid Groupings

- Only owner-approved comparable goal populations/dimensions.

### Valid Operators

- Target comparison, difference/progress, count/status, coverage; no invented formula.

### Compatible Intents

- `evaluate_goal`, `calculate_metric`, `summarize_performance`,
  `compare_groups`, `rank_results`, `explain_result`, `inspect_data_quality`,
  `unsupported_request`.

### Incompatible Combinations

- Goal as rule/achievement, mixed targets/bases, open fact default, fuzzy
  collision, cross-account, mutation, cause/advice/prediction/runtime.

### Default Interpretation

Only one strong exact active same-account goal resolves; no target/basis/period default.

### Clarification Conditions

Clarify goal versus rule first, then version, period, and missing owner basis.

### Recommended Clarification Wording

1. Do you mean your saved goal or a saved rule?
2. Which goal/version do you mean?
3. What evaluation period should I use?
4. Which owner-approved basis should evaluate the target?

### Unsupported Conditions

- Missing goal/owner facts/coverage, unauthorized scope, unsupported comparison,
  mutation, advice/prediction/cause; `evaluate_goal` runtime remains absent.

### Target Analytics Tool or Query Capability

- Versioned resolver, C1 `evaluate_goal`, separate locked metric/rule and coverage owners.

### Result Units

- Goal target, actual, difference/progress, status, counts/limitations, versions,
  match/coverage; no raw IDs/private text.

### Fee Handling

P/L goal preserves saved gross or fee-complete net, charges/credits, currency and coverage.

### Open-Trade Handling

Open facts count only when the exact locked goal owner explicitly permits them.

### Sample-Size Considerations

Return qualifying count/denominator/limitations; small samples prove no cause or advice.

---

# 7. Evaluation Cases Deliverable

Evaluation Batches 1 through 5 (`C16-E1` through `C16-E15`) independently
PASSed all 330 `Planned` cases. Each of the 15/15 arrays contains all
22 standard case types in the required order and exact ordered schema. Overall
evaluation review is PASS with 330 reviewed PASS, zero failed, zero unreviewed,
and zero pending cases. No case, array, canonical name, or category is approved
or locked, and no runtime capability is claimed.

## Evaluation Array C16-E1 -- trade_outcome_vocabulary

~~~json
[
  {"caseId":"C16-E1-01","caseType":"canonical","input":"Count my fee-complete net winning trades in the authorized July period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","net_pnl"],"expectedFilters":["eligible ready_closed trades with selected-basis net_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["resolve winner wording to the locked positive-outcome owner","count eligible selected-basis positive trades"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active locale-compatible registry version","eligible ready_closed trade grain","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency partition","exact positive sign without rounding","eligible excluded missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Vocabulary routes only; it does not calculate, infer open-trade outcomes, or claim runtime support."},
  {"caseId":"C16-E1-02","caseType":"formal_paraphrase","input":"Retrieve eligible realized trades with a negative gross result during the validated prior week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","losing_trades","gross_pnl"],"expectedFilters":["eligible ready_closed trades with selected-basis gross_pnl less than zero"],"expectedGroupings":[],"expectedOperators":["resolve negative-result wording to the locked losing-trades owner","preserve exact gross sign classification"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","current generic registry version and locale","eligible ready_closed trade grain","locked gross_pnl contract","exact negative sign without rounded-zero substitution","currency population and lifecycle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A formal paraphrase changes no owner formula, population, basis, or coverage."},
  {"caseId":"C16-E1-03","caseType":"conversational_paraphrase","input":"Which closed trades finished exactly even on gross P and L this month?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","breakeven_trades","gross_pnl"],"expectedFilters":["eligible ready_closed trades with exact gross_pnl equal to zero"],"expectedGroupings":[],"expectedOperators":["resolve exactly even to the locked breakeven owner","apply exact-zero classification before display rounding"],"expectedComparison":null,"expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique compatible registry entry","eligible ready_closed trade grain","locked gross_pnl fact","exact stored zero not approximate display zero","coverage and unavailable reasons"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Flat means exact selected-basis zero and never a near-zero tolerance."},
  {"caseId":"C16-E1-04","caseType":"trader_slang","input":"Show my green trades on fee-complete net for the validated morning session.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","net_pnl"],"expectedFilters":["validated morning-session filter","eligible ready_closed trades with net_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["resolve green as positive trade outcome only from explicit grain and basis","retain the locked net outcome contract"],"expectedComparison":null,"expectedTimeRange":"validated morning-session temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","active locale-aware green registry entry","explicit trade grain","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee completeness and compatible currency","exact positive sign and result coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Green does not mean an open gain, color, winning day, or prediction."},
  {"caseId":"C16-E1-05","caseType":"abbreviation","input":"Count W trades on gross P and L in the validated week; W means winner here.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","gross_pnl"],"expectedFilters":["eligible ready_closed trades with gross_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["accept W only beside explicit winner trade grammar","count exact positive gross outcomes"],"expectedComparison":null,"expectedTimeRange":"validated week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","abbreviation and ticker collision check","explicit winner meaning","eligible ready_closed trade grain","locked gross_pnl sign and currency coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A bare W would not auto-route; the explicit grammar removes the abbreviation collision."},
  {"caseId":"C16-E1-06","caseType":"misspelling","input":"List my profittable fee-complete net trades for the authorized prior month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate profitable as a locale-compatible fuzzy candidate only","leave the outcome owner route pending until the candidate is confirmed"],"expectedComparison":null,"expectedTimeRange":"authorized prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","current non-deprecated registry version and locale-aware normalization","fuzzy matching remains candidate generation","no accepted outcome route basis classification or data access before clarification","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean profitable trades?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fuzzy misspelling never auto-routes, even when one candidate appears strong; grain, fee basis, period, and coverage remain staged after confirmation."},
  {"caseId":"C16-E1-07","caseType":"noisy_input","input":"july red trades... gross only pls, closed ones","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","losing_trades","gross_pnl"],"expectedFilters":["eligible ready_closed trades with gross_pnl less than zero"],"expectedGroupings":[],"expectedOperators":["resolve red from explicit trade grain and gross basis","retrieve exact negative gross outcomes"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current registry match","explicit ready_closed trade grain","locked gross_pnl contract","exact negative sign","currency lifecycle and missing-data coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not change red into a day label, color, or open-position state."},
  {"caseId":"C16-E1-08","caseType":"command","input":"Count exact-flat ready-closed trades on fee-complete net in the validated quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","breakeven_trades","net_pnl"],"expectedFilters":["eligible ready_closed trades with exact net_pnl equal to zero"],"expectedGroupings":[],"expectedOperators":["resolve exact-flat wording to exact breakeven","count without display-rounding classification"],"expectedComparison":null,"expectedTimeRange":"validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","active compatible registry version","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency","exact stored zero","eligible and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command authorizes no mutation and does not convert approximate scratches into exact flats."},
  {"caseId":"C16-E1-09","caseType":"fragment","input":"prior-week gross losers, ready-closed only","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","losing_trades","gross_pnl"],"expectedFilters":["eligible ready_closed trades with gross_pnl less than zero"],"expectedGroupings":[],"expectedOperators":["route loser to exact negative selected-basis outcome","retain the explicit ready_closed population"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique compatible locale/version","locked gross_pnl fact","exact negative sign","compatible currency and lifecycle coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete only because grain, basis, and period are explicit and authorized."},
  {"caseId":"C16-E1-10","caseType":"follow_up","input":"Of that trusted fee-complete net trade result, show only the exact flats for the same accepted period.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","breakeven_trades","net_pnl"],"expectedFilters":["eligible ready_closed trades with exact net_pnl equal to zero"],"expectedGroupings":[],"expectedOperators":["reuse only the trusted accepted trade grain basis and period","apply exact-zero outcome filter"],"expectedComparison":null,"expectedTimeRange":"retained validated accepted temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained ready_closed trade grain","retained net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","retained fee completeness currency and coverage","exact zero before rounding"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up may reuse only typed accepted state, not nearby prose or stale results."},
  {"caseId":"C16-E1-11","caseType":"correction","input":"I meant fee-complete net winners, not gross winners, for the same validated month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","net_pnl"],"expectedFilters":["eligible ready_closed trades with net_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["replace only the outcome basis after validation","reclassify from exact net facts rather than relabeling gross results"],"expectedComparison":null,"expectedTimeRange":"retained validated month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted ready_closed population","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency","exact positive sign","gross result remains unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Gross and net classifications may differ; vocabulary never treats them as interchangeable."},
  {"caseId":"C16-E1-12","caseType":"comparison","input":"Compare fee-complete net winner counts between the two authorized months using the same eligible trade population.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","net_pnl"],"expectedFilters":["eligible ready_closed trades with net_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["count exact positive net outcomes separately on each side","compare compatible side-specific counts"],"expectedComparison":"authorized month A winner count versus authorized month B winner count","expectedTimeRange":"two validated nonoverlapping monthly temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit two comparison sides","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency on both sides","same ready_closed eligibility contract","side-specific counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The comparison proves no cause or future advantage."},
  {"caseId":"C16-E1-13","caseType":"ranking","input":"Rank authorized ticker groups by fee-complete net winner count this quarter using the approved tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","net_pnl"],"expectedFilters":["eligible ready_closed trades with net_pnl greater than zero"],"expectedGroupings":["authorized exact ticker groups"],"expectedOperators":["count exact positive net outcomes per group","sort descending with approved privacy-safe tie policy"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized ticker universe","positive result limit","approved privacy-safe tie contract","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency and per-group coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking wording supplies neither hidden direction nor a quality judgment beyond the explicit count."},
  {"caseId":"C16-E1-14","caseType":"negation","input":"Show ready-closed trades that were not exact-flat on gross P and L in the validated week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","breakeven_trades","gross_pnl"],"expectedFilters":["eligible ready_closed trades with exact gross_pnl not equal to zero"],"expectedGroupings":[],"expectedOperators":["resolve exact-flat to exact-zero outcome","apply the explicit complement without including unknown results"],"expectedComparison":null,"expectedTimeRange":"validated week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl fact","exact nonzero classification before rounding","eligible ready_closed population","unknown and unavailable outcomes kept outside the complement","coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not flat means known nonzero; it does not turn missing facts into winners or losers."},
  {"caseId":"C16-E1-15","caseType":"exclusion","input":"Summarize gross trade outcomes this month while excluding exact losers and preserving unavailable coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["trade_outcome_vocabulary","losing_trades","gross_pnl"],"expectedFilters":["eligible ready_closed trades excluding known gross_pnl less than zero"],"expectedGroupings":[],"expectedOperators":["exclude exact negative gross outcomes only","report excluded missing and unavailable populations separately"],"expectedComparison":null,"expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked gross_pnl contract","exact negative sign","ready_closed population","unknown is not non-loser","eligible excluded missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion shapes the answer population and never deletes or reclassifies Journal facts."},
  {"caseId":"C16-E1-16","caseType":"multi_filter","input":"Retrieve July long-side fee-complete net winners under five dollars outside premarket.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","net_pnl"],"expectedFilters":["validated long-side predicate","validated under-five-dollar predicate","validated outside-premarket predicate","eligible ready_closed trades with net_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["resolve winner on the explicit net trade basis","apply the owner-validated predicate tree with explicit precedence"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency","exact positive sign","ready_closed lifecycle and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Multiple filters do not change outcome ownership or invent price/session facts."},
  {"caseId":"C16-E1-17","caseType":"multi_part","input":"For the validated month, return fee-complete net winner, loser, and exact-flat counts with eligible and unavailable totals.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","losing_trades","breakeven_trades","net_pnl"],"expectedFilters":["eligible ready_closed trade population"],"expectedGroupings":[],"expectedOperators":["partition known exact net signs into positive negative and zero","return mutually exclusive counts and coverage totals"],"expectedComparison":null,"expectedTimeRange":"validated month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency","exact sign before display rounding","ready_closed eligibility","eligible partial missing excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The three exact sign classes cannot overlap; scratches with an unspecified tolerance stay unresolved."},
  {"caseId":"C16-E1-18","caseType":"ambiguous","input":"How many scratches did I have?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain an unresolved scratch-meaning ambiguity","leave exact-zero and tolerance-based candidates unselected"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","no approved scratch tolerance in the request","no silent collapse to exact flat","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"By scratch, do you mean exactly zero or within a specific tolerance?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one field first; grain, basis, and period remain staged after scratch meaning resolves."},
  {"caseId":"C16-E1-19","caseType":"negative_example","input":"Which trading days were green on fee-complete net P and L last month?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["green_days","net_pnl"],"expectedFilters":["authorized trading days with fee-complete net_pnl greater than zero"],"expectedGroupings":[],"expectedOperators":["route explicit day grain to the locked green_days owner","do not map day classification to trade_outcome_vocabulary"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit day grain","locked green_days and net_pnl contracts","fee-complete compatible currency","day coverage and exact positive sign"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Green is not owned by the trade-outcome vocabulary when the user explicitly asks about days."},
  {"caseId":"C16-E1-20","caseType":"unsupported_data","input":"Call every open or unresolved trade, including another account's records, a net winner from its current color even when allocated fees are incomplete.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trade_outcome_vocabulary","winning_trades","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account open unresolved color-based net-outcome inference"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","ready_closed eligibility required for realized outcome counts","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee completeness required","unresolved and open rows remain visible coverage","no private text raw identifier or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's records, open or unresolved status, current color, and incomplete allocated fees cannot establish a realized fee-complete net winning trade.","notes":"Fail closed without crossing account scope, reclassifying records, exposing identifiers or private text, or claiming a runtime result."},
  {"caseId":"C16-E1-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed trade, explain whether its exact fee-complete net result is positive, negative, or zero.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["explain_result"],"expectedCanonicalConcepts":["trade_outcome_vocabulary","net_pnl"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","classify its exact net sign without display rounding"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["trusted typed selected trade","same server-authorized account scope","current ownership type provenance and lifecycle coverage","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency","no raw trade or account identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection authorizes only the minimum typed factual package and proves no cause or future result."},
  {"caseId":"C16-E1-22","caseType":"cross_category","input":"Compare gross winner rates by authorized setup for the prior month and present the supported counts and coverage in a table.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","group_and_aggregate","explain_result"],"expectedCanonicalConcepts":["trade_outcome_vocabulary","win_rate","gross_pnl","setup"],"expectedFilters":["eligible ready_closed trades with known gross_pnl sign"],"expectedGroupings":["authorized explicit setup labels"],"expectedOperators":["resolve winner wording to exact positive gross outcomes","calculate each setup winner count divided by its eligible ready_closed denominator","apply table presentation without changing analytical truth"],"expectedComparison":"compatible authorized setup winner rates","expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 11 authorized setup associations","locked gross_pnl sign and win_rate denominator","side-specific eligible counts","currency lifecycle label and missing-data coverage","Category 18 table response mode"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Vocabulary, metric, grouping, time, and presentation owners remain separate; no setup quality or cause is inferred."}
]
~~~

## Evaluation Array C16-E2 -- trading_frequency_vocabulary

~~~json
[
  {"caseId":"C16-E2-01","caseType":"canonical","input":"Calculate my overtrading-frequency proxy for the authorized month using the explicit threshold of more than five lifecycle starts per complete active day.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["count factual zero-to-nonzero lifecycle starts per active day","count days with lifecycle-start count strictly greater than explicit threshold five","divide qualifying days by all complete-coverage active days"],"expectedComparison":null,"expectedTimeRange":"authorized month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit nonnegative threshold T equals five","ready_closed and legitimate_open lifecycle starts","needs_decision and incomplete candidates make a day partial or unavailable","nonzero denominator","qualifying-day denominator and excluded-day coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The proxy reports thresholded activity only and proves no motive, discipline, mistake, or cause."},
  {"caseId":"C16-E2-02","caseType":"formal_paraphrase","input":"Return the proportion of complete active days whose factual lifecycle-start count exceeded the declared threshold of three.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["derive lifecycle-start count per day","apply strict count greater than three","divide qualifying days by complete-coverage active days"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit nonnegative threshold three","complete lifecycle coverage including legitimate_open starts","decision and incomplete barriers","nonzero active-day denominator","exact numerator denominator and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording preserves the strict threshold and exact denominator."},
  {"caseId":"C16-E2-03","caseType":"conversational_paraphrase","input":"On how many complete days did I start more than four trades this quarter?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["treat start as zero-to-nonzero lifecycle start under the locked overtrading_frequency owner","count days with lifecycle-start count strictly greater than explicit threshold four"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit nonnegative threshold four","factual lifecycle-start grain not execution count","ready_closed and legitimate_open coverage","needs_decision and incomplete day status","eligible day denominator and unavailable day counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The locked owner supplies the strict thresholded complete-day contract; the requested qualifying-day count proves no behavioral diagnosis."},
  {"caseId":"C16-E2-04","caseType":"trader_slang","input":"Show the overtrade proxy for days with more than six new position starts, using only complete-coverage days.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["resolve overtrade to the explicit thresholded proxy","apply strict lifecycle-start count greater than six","divide qualifying by complete active days"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit nonnegative threshold six","zero-to-nonzero lifecycle definition","ready_closed and legitimate_open coverage","partial days excluded visibly","nonzero denominator and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit proxy grammar resolves the slang without making overtrading a universal fact."},
  {"caseId":"C16-E2-05","caseType":"abbreviation","input":"Calculate the OT frequency proxy with T equal to five lifecycle starts for the validated month; OT means overtrading proxy here.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["accept OT only from explicit overtrading-proxy grammar","apply strict lifecycle-start count greater than T","divide qualifying days by complete active days"],"expectedComparison":null,"expectedTimeRange":"validated month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","abbreviation and ticker collision check","explicit T equals five","complete lifecycle-start day coverage","nonzero denominator","numerator denominator and unavailable-day counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A bare OT would not be authority or a threshold."},
  {"caseId":"C16-E2-06","caseType":"misspelling","input":"How often did I overtrdae with more than seven lifecycle starts on a complete active day this month?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate overtrade as a locale-compatible fuzzy candidate only","leave the thresholded owner route pending until the candidate is confirmed"],"expectedComparison":null,"expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","current non-deprecated registry version and locale-aware normalization","fuzzy matching remains candidate generation","explicit threshold seven remains unexecuted while language is unresolved","no accepted metric route or data access before clarification"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean the overtrade frequency proxy?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fuzzy candidate cannot auto-route; activity grain, denominator, coverage, and no-motive boundaries apply only after confirmation."},
  {"caseId":"C16-E2-07","caseType":"noisy_input","input":"too many trades = >5 new starts/day... complete days only... this month pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["parse the explicit too-many-trades threshold as strictly greater than five","count zero-to-nonzero lifecycle starts","divide qualifying days by all complete active days"],"expectedComparison":null,"expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit threshold five","factual lifecycle-start grain","complete-day denominator","decision and incomplete coverage statuses","exact numerator denominator and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy symbols do not relax threshold, grain, coverage, or denominator rules."},
  {"caseId":"C16-E2-08","caseType":"command","input":"Count accepted execution events per authorized day; do not call them trades or overtrading.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":["authorized accepted execution events"],"expectedGroupings":["authorized account-local day groups"],"expectedOperators":["route to the locked Category 8 accepted execution-event query","count accepted execution-event facts per day","preserve execution grain distinct from lifecycle starts and thresholded proxy"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted Category 8 execution-event owner","account-local day boundary","execution coverage","no universal activity judgment"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clicks or fills may be execution activity and must not be silently converted into trade count or a nonexistent generic metric token."},
  {"caseId":"C16-E2-09","caseType":"fragment","input":"prior month, lifecycle starts above four, complete days","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["count lifecycle starts per day","apply strict count greater than four","return qualifying-day count and denominator"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit threshold four","zero-to-nonzero lifecycle grain","complete active-day coverage","visible partial days","exact denominator"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is resolvable because threshold, count grain, period, and coverage are explicit."},
  {"caseId":"C16-E2-10","caseType":"follow_up","input":"For that trusted complete-day result, use the same lifecycle-start grain but change the explicit threshold to eight.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["retained complete-coverage account-local active days"],"expectedGroupings":[],"expectedOperators":["retain the accepted lifecycle-start and day contracts","replace only T with eight after validation","recompute strict count greater than eight"],"expectedComparison":null,"expectedTimeRange":"retained validated accepted temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","explicit replacement threshold eight","retained ready_closed and legitimate_open lifecycle coverage","nonzero denominator","accepted state unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only typed accepted state may carry forward; prose proximity cannot supply a threshold or grain."},
  {"caseId":"C16-E2-11","caseType":"correction","input":"By churned I meant accepted execution count, not turnover or lifecycle-start trade count, for the validated session.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":["accepted execution events in the validated session"],"expectedGroupings":[],"expectedOperators":["resolve the corrected churned meaning to Category 8 execution-event grain","count accepted execution events only"],"expectedComparison":null,"expectedTimeRange":"validated session temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit corrected execution grain","accepted Category 8 execution facts","session boundary and coverage","prior lifecycle or turnover interpretation not mutated before validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Churned may mean execution activity, turnover, repeats, or excessive activity; the explicit correction resolves only this request without inventing a generic metric token."},
  {"caseId":"C16-E2-12","caseType":"comparison","input":"Compare complete-day overtrading-frequency proxies for the two authorized months using the same threshold of more than five lifecycle starts.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days on each side"],"expectedGroupings":[],"expectedOperators":["calculate each side as days above five divided by its own complete active-day denominator","compare compatible side-specific rates"],"expectedComparison":"authorized month A proxy versus authorized month B proxy","expectedTimeRange":"two validated monthly temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit common threshold five","same zero-to-nonzero lifecycle definition","side-specific complete-day denominators","decision and incomplete coverage on each side","no causal conclusion"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Different denominators remain visible and neither side proves discipline or motive."},
  {"caseId":"C16-E2-13","caseType":"ranking","input":"Rank authorized months by the proportion of complete active days above the explicit five-lifecycle-start threshold, using approved ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days per month"],"expectedGroupings":["authorized monthly groups"],"expectedOperators":["calculate each monthly thresholded proportion","sort descending with approved privacy-safe tie policy"],"expectedComparison":null,"expectedTimeRange":"validated multi-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit threshold five","positive result limit","approved ties","per-month nonzero complete-day denominator","per-group unavailable coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking the proxy does not rank trader quality or recommend an activity level."},
  {"caseId":"C16-E2-14","caseType":"negation","input":"Show complete active days that did not exceed four lifecycle starts in the validated month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage active days with lifecycle-start count less than or equal to four"],"expectedGroupings":[],"expectedOperators":["count factual zero-to-nonzero lifecycle starts under the locked overtrading_frequency owner","apply the known complement of strict count greater than explicit threshold four"],"expectedComparison":null,"expectedTimeRange":"validated month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit nonnegative threshold four","ready_closed and legitimate_open lifecycle-start coverage","needs_decision unknown or partial days excluded from complement","eligible complete-day denominator and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The locked owner's complement applies only to known complete days and proves no restraint or quality."},
  {"caseId":"C16-E2-15","caseType":"exclusion","input":"Summarize lifecycle-start frequency by day while excluding incomplete-coverage days and reporting how many were excluded.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":["authorized account-local day groups"],"expectedOperators":["route to the locked Category 8 factual lifecycle query","count zero-to-nonzero lifecycle starts per complete day","exclude partial days visibly","report excluded decision and incomplete day counts"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","ready_closed and legitimate_open lifecycle starts","needs_decision and incomplete barriers","account-local day contract","complete excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is a factual Category 8 lifecycle-start query, not an invented trade_count metric; exclusion cannot silently make coverage complete."},
  {"caseId":"C16-E2-16","caseType":"multi_filter","input":"For validated July long-side activity outside premarket, count factual lifecycle starts per complete active day.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":["validated long-side predicate","validated outside-premarket predicate","complete-coverage account-local active days"],"expectedGroupings":["authorized account-local day groups"],"expectedOperators":["route to the locked Category 8 factual lifecycle query","apply validated predicates without renumbering lifecycles","count zero-to-nonzero starts per complete day"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid predicate tree","unfiltered lifecycle construction before analytic filters","ready_closed and legitimate_open coverage","needs_decision barriers and excluded counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is a factual Category 8 lifecycle-start query, not an invented trade_count metric; filters do not turn fills into starts or create a behavioral label."},
  {"caseId":"C16-E2-17","caseType":"multi_part","input":"Return complete-day lifecycle-start counts, days above the explicit threshold of five, the proxy rate, and all partial-day limitations.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","explain_result"],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":["authorized account-local day groups"],"expectedOperators":["count factual zero-to-nonzero lifecycle starts per day under the locked owner","count days strictly above explicit threshold five","divide qualifying days by complete active days","report partial and unavailable day coverage"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit nonnegative threshold five","ready_closed and legitimate_open starts","needs_decision and incomplete barriers","nonzero complete-day denominator","exact numerator denominator and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The locked overtrading_frequency owner provides the strict threshold and denominator; the result remains proxy-based, never motive or advice."},
  {"caseId":"C16-E2-18","caseType":"ambiguous","input":"Did I trade too much?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain unresolved activity-measure ambiguity","do not choose a universal threshold or count grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","no explicit saved rule threshold or comparison","execution lifecycle repeat-attempt and turnover meanings remain distinct","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which activity measure do you want to use: executions, new trade starts, repeat attempts, or turnover?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one field first; threshold, period, and coverage questions remain staged after the measure resolves."},
  {"caseId":"C16-E2-19","caseType":"negative_example","input":"Count how often I kept clicking by accepted fills each day without treating those fills as new trades.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized accepted execution events"],"expectedGroupings":["authorized account-local day groups"],"expectedOperators":["route explicit fill grammar directly to the locked Category 8 execution-event query","do not map it to trading_frequency_vocabulary judgment or lifecycle-start count"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted Category 8 execution-event owner","account-local day boundary","execution coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit fill counting is a negative mapping example for this vocabulary class and is not an overtrade diagnosis or invented generic metric."},
  {"caseId":"C16-E2-20","caseType":"unsupported_data","input":"Use another account's private notes to infer that I forced revenge trades because I clicked quickly after losses, without a saved label, rule, or threshold.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-text use","reject motive mistake and behavioral-cause inference from timing losses and clicks"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","explicit user-authored label or approved rule required for subjective meaning","activity facts cannot prove force or revenge","no threshold or grain invention","no private-note raw-ID or cross-account fallback"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private notes, click timing, and prior losses cannot establish forced or revenge-trading motive without an explicit authorized same-account user label or rule.","notes":"Fail closed without cross-account access, diagnosis, advice, private-text search, or runtime claims."},
  {"caseId":"C16-E2-21","caseType":"selected_entity_context","input":"For the trusted selected trading day, return its factual lifecycle-start count and complete or partial coverage state.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["trading_frequency_vocabulary"],"expectedFilters":["trusted selected account-local trading day"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected day","route to the locked Category 8 factual lifecycle query","count zero-to-nonzero lifecycle starts without skipping barriers","report day coverage state"],"expectedComparison":null,"expectedTimeRange":"server-validated selected trading-day boundary","expectedSelectedEntity":"server-validated selected trading day","expectedContextRequirements":["trusted typed selected day","same server-authorized account scope","ready_closed legitimate_open needs_decision and incomplete lifecycle candidates","current provenance and coverage","no raw account trade or execution identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This is a factual Category 8 lifecycle-start query, not an invented trade_count metric; the selected day provides no universal threshold, motive, quality, or recommendation."},
  {"caseId":"C16-E2-22","caseType":"cross_category","input":"Compare fee-complete net P and L on complete active days above versus at or below the explicit five-lifecycle-start threshold for the validated quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["trading_frequency_vocabulary","overtrading_frequency","net_pnl"],"expectedFilters":["complete-coverage account-local active days"],"expectedGroupings":["days with lifecycle starts strictly greater than five","days with lifecycle starts less than or equal to five"],"expectedOperators":["classify complete days using explicit threshold five","sum net_pnl separately for each compatible day population","compare supported results with side-specific coverage"],"expectedComparison":"complete days above five starts versus complete days at or below five starts","expectedTimeRange":"validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit threshold five","complete lifecycle-start day coverage","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency","side-specific eligible counts and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An association by threshold group proves no causal effect of activity on P/L and gives no trading advice."}
]
~~~

## Evaluation Array C16-E3 -- profit_giveback_vocabulary

Every successful candle route in `C16-E3-01` through `C16-E3-07`,
`C16-E3-09` through `C16-E3-10`, `C16-E3-12` through `C16-E3-16`, and
`C16-E3-21` through `C16-E3-22` inherits these required structured context
facts in addition to the case-specific requirements below: a declared
compatible saved candle source and source version; a declared compatible
interval and complete coverage; the exact owner-allowed grain, entry/exit
boundaries, and direction; compatible instrument, price/currency, and
corporate-action adjustment bases; and no default selected entity, source,
source version, interval, grain, boundary, direction, instrument, currency, or
adjustment policy. `C16-E3-06` remains a fuzzy candidate and cannot use these
facts or become a successful route until its focused clarification resolves.

~~~json
[
  {"caseId":"C16-E3-01","caseType":"canonical","input":"Calculate the selected long trade's candle profit giveback from eligible one-minute candles and its exact realized exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["set P to the maximum favorable price from entry and eligible candles wholly after entry and wholly before exit","set X to the exact realized exit boundary price","calculate max of zero and P minus X for the long trade"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed long trade","expectedContextRequirements":["same server-authorized account scope","exact entry exit direction and candle interval","exclude entry-containing and exit-containing candle extrema","complete compatible candle coverage","use P equal to entry when no favorable price exceeds entry","price-distance result with source interval grain and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Candle giveback excludes fees, is not P/L, and proves no exit mistake, agency, or advice."},
  {"caseId":"C16-E3-02","caseType":"formal_paraphrase","input":"For the selected ready-closed short, derive the nonnegative difference between its exact exit price and its maximum favorable pre-exit candle price.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["derive P from entry and eligible fully interior candle lows","set X to the exact realized exit boundary price","calculate max of zero and X minus P for the short trade"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed short trade","expectedContextRequirements":["same server-authorized account scope","exact entry exit direction and candle interval","entry and exit boundary candles excluded","complete compatible candle coverage","P equals entry when no favorable move occurs","price units source interval grain and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The formal paraphrase preserves the short-side formula and nonnegative clamp."},
  {"caseId":"C16-E3-03","caseType":"conversational_paraphrase","input":"When I say this long trade gave back profit, I mean favorable candle price movement before its exact exit; how much was it?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve gave-back-profit to candle price giveback from the explicit meaning","calculate long max of zero and P minus exact exit X"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed long trade","expectedContextRequirements":["same server-authorized account scope","explicit favorable price-movement meaning","exact entry exit and direction","eligible candles wholly inside boundaries","complete interval coverage","price-distance units and no fee basis"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit price-movement grammar distinguishes the candle owner from a chronological P/L path."},
  {"caseId":"C16-E3-04","caseType":"trader_slang","input":"For this selected long, measure the candle giveback from peak favorable price to the exact exit, one-minute interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["treat peak as maximum favorable eligible candle price P","calculate max of zero and P minus exact exit X"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed long trade","expectedContextRequirements":["same server-authorized account scope","one-minute candle source and interval","exact entry exit and long direction","exclude boundary-candle extrema","complete interior-candle coverage","P falls back to entry only when coverage is complete and no favorable move exists"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Peak slang is bounded by the exact owner and never means unrealized P/L or best possible exit advice."},
  {"caseId":"C16-E3-05","caseType":"abbreviation","input":"Compute PG for the selected short using exact exit and covered one-minute candles; PG means candle profit giveback here.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["accept PG only from explicit candle profit-giveback grammar","calculate short max of zero and exact exit X minus favorable price P"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed short trade","expectedContextRequirements":["same server-authorized account scope","abbreviation and ticker collision check","exact short direction entry and exit","eligible one-minute candles wholly inside boundaries","complete compatible coverage","price-distance result metadata"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A bare PG would not auto-route or authorize trade data."},
  {"caseId":"C16-E3-06","caseType":"misspelling","input":"Calculate candle profit givback for the selected long from covered five-minute candles and the exact exit.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate candle profit giveback as a locale-compatible fuzzy candidate only","leave the candle owner route pending until the candidate is confirmed"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed long trade","expectedContextRequirements":["same server-authorized account scope","current non-deprecated registry version and locale-aware normalization","fuzzy matching remains candidate generation","five-minute interval and selected trade remain unexecuted while language is unresolved","no accepted owner route or candle access before clarification"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean candle profit giveback?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fuzzy candidate cannot auto-route or use selected/source/interval context until confirmed."},
  {"caseId":"C16-E3-07","caseType":"noisy_input","input":"selected long... 1m candles fully inside entry/exit... peak-to-exit giveback pls","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["derive maximum favorable interior-candle price P","calculate max of zero and P minus exact exit X"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed long trade","expectedContextRequirements":["same server-authorized account scope","exact selected long entry and exit","one-minute candle interval","fully interior candle eligibility","complete source coverage","price-distance result and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not alter the boundary exclusions or convert giveback into P/L."},
  {"caseId":"C16-E3-08","caseType":"command","input":"Show when the selected trade was green then lost it on fee-complete net P and L; do not use the candle giveback formula.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve the requested chronological selected-basis P/L-path meaning","reject calculation because no locked supported intratrade selected-basis P/L observation or path owner exists","do not infer agency"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["same server-authorized account scope","no locked chronological intratrade selected-basis P/L observation fact","no net_pnl-at-observation formula or fee allocation contract","candle profit_giveback is not a P/L path","selected trade authorizes no unsupported reconstruction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No locked supported chronological intratrade selected-basis P/L observation or path owner exists, so a green-then-lost-it net P/L path cannot be calculated.","notes":"Fail closed while preserving the user's language; do not substitute candle price giveback, invent net_pnl observations, or infer agency."},
  {"caseId":"C16-E3-09","caseType":"fragment","input":"selected short, covered one-minute candles, favorable low to exact exit","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["set P to the minimum favorable eligible interior-candle price for the short","calculate max of zero and exact exit X minus P"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed short trade","expectedContextRequirements":["same server-authorized account scope","exact short entry exit and direction","one-minute source and interval","entry and exit candle extrema excluded","complete coverage","price-distance units and metadata"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete because entity, direction, interval, coverage, and exact exit are supplied."},
  {"caseId":"C16-E3-10","caseType":"follow_up","input":"For that trusted selected long, keep the exact boundaries and recompute candle giveback with the accepted five-minute interval.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain validated entry exit and long direction","replace only the candle interval after validation","recompute max of zero and P minus X"],"expectedComparison":null,"expectedTimeRange":"retained exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed long trade","expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","accepted five-minute candle source and interval","fully interior candle coverage","exact exit X","accepted state unchanged until compatibility validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Changing interval creates a separately identified approximation and never silently reuses one-minute extrema."},
  {"caseId":"C16-E3-11","caseType":"correction","input":"By round-tripped profit I meant the fee-complete net P and L path returning from positive toward zero or negative, not a flat-to-flat position lifecycle or candle giveback.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve the corrected chronological selected-basis P/L-path meaning","reject calculation because no locked supported intratrade selected-basis P/L observation or path owner exists","do not map it to a position lifecycle candle metric or agency conclusion"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["same server-authorized account scope","explicit P/L-path meaning does not create owner support","no locked net_pnl-at-observation facts or fee-allocation chronology","no compatible selected-basis path coverage contract","prior lifecycle or candle interpretation remains distinct"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No locked supported chronological intratrade selected-basis P/L observation or path owner exists, so round-tripped-profit net P/L chronology cannot be calculated.","notes":"Fail closed while preserving the correction; do not invent observations, substitute a position or candle owner, or infer agency."},
  {"caseId":"C16-E3-12","caseType":"comparison","input":"Compare candle profit giveback for two authorized ready-closed long trades using the same one-minute source and exact exit contract.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["calculate each long side as max of zero and P minus X","compare compatible price-distance results"],"expectedComparison":"authorized selected long trade A giveback versus authorized selected long trade B giveback","expectedTimeRange":"each trade's exact entry-to-exit boundary","expectedSelectedEntity":"two server-validated ready-closed long trades","expectedContextRequirements":["same server-authorized account scope","same one-minute candle source interval and grain","exact entry and exit facts for both sides","fully interior complete candle coverage on each side","side-specific price-distance values and limitations","no cross-currency P/L interpretation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A larger price giveback proves no worse decision, cause, or recommended exit."},
  {"caseId":"C16-E3-13","caseType":"ranking","input":"Rank authorized ready-closed long trades by one-minute candle profit giveback, highest price distance first, with approved ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":["ready-closed long trades with complete compatible candle coverage"],"expectedGroupings":[],"expectedOperators":["calculate max of zero and P minus X per eligible long trade","sort descending with positive limit and approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated requested trade-entry-to-exit windows","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized trade universe","one-minute candle source interval and grain","exact entry exits and complete interior coverage","positive result limit and approved ties","eligible excluded and unavailable counts without raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking historical price distances does not judge execution quality or prescribe exits."},
  {"caseId":"C16-E3-14","caseType":"negation","input":"Show eligible selected trades whose covered candle profit giveback was not greater than zero.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":["eligible trades with complete compatible coverage and profit_giveback equal to zero"],"expectedGroupings":[],"expectedOperators":["calculate the direction-specific nonnegative giveback formula","apply the known complement of greater than zero only to covered results"],"expectedComparison":null,"expectedTimeRange":"validated requested trade windows","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact entry exit and direction","complete compatible interior-candle coverage","P equals entry when complete coverage has no favorable move","unknown and unavailable cases excluded from complement","coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not positive means exact known zero because the metric is nonnegative; missing coverage is not zero."},
  {"caseId":"C16-E3-15","caseType":"exclusion","input":"Summarize covered one-minute candle giveback while excluding trades with missing exact exits and reporting them as unavailable.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":["ready-closed trades with exact exits and complete compatible one-minute candle coverage"],"expectedGroupings":[],"expectedOperators":["exclude missing-exit cases visibly","calculate direction-specific nonnegative price giveback for eligible trades","report excluded and unavailable reasons"],"expectedComparison":null,"expectedTimeRange":"validated requested trade windows","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact entry exit and direction","one-minute source and interval","interior-candle coverage","missing exit cannot be invented","eligible excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion does not hide unavailable facts or convert them to zero."},
  {"caseId":"C16-E3-16","caseType":"multi_filter","input":"For authorized July long trades under five dollars outside premarket, calculate one-minute candle profit giveback where coverage is complete.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_trade"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":["authorized July predicate","validated long-side predicate","validated under-five-dollar predicate","validated outside-premarket predicate","complete one-minute candle coverage"],"expectedGroupings":[],"expectedOperators":["apply the validated predicate tree","calculate each eligible long as max of zero and P minus exact exit X"],"expectedComparison":null,"expectedTimeRange":"authorized July trade-entry-to-exit windows","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","exact entry exits and long direction","one-minute source interval and fully interior candles","complete coverage and price-distance units","excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filters cannot alter candle boundaries or turn the price distance into P/L."},
  {"caseId":"C16-E3-17","caseType":"multi_part","input":"For the selected trade I said I let a winner turn red; return the first positive and later negative fee-complete net observations, timestamps, and coverage without judging agency.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["preserve the requested positive-then-negative selected-basis P/L chronology","reject observation timestamps and path calculation because no locked supported owner exists","do not infer that the trader let or caused the reversal"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["same server-authorized account scope","no locked chronological intratrade selected-basis P/L observation facts","no net_pnl-at-observation fee or currency contract","no supported timestamped path coverage","privacy-safe output without raw identifiers or private notes","no agency quality or advice conclusion"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"No locked supported chronological intratrade selected-basis P/L observation or path owner exists, so positive-then-negative net observations and timestamps cannot be returned.","notes":"Fail closed while preserving the user's language; candle facts cannot substitute, and no agency, cause, or advice is inferred."},
  {"caseId":"C16-E3-18","caseType":"ambiguous","input":"How much profit did I give back?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain candle-price versus chronological P/L-path ambiguity","select neither owner or fee basis"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","no explicit candle-price or P/L-path meaning","no declared trade or day grain","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean candle price movement before an exit, or a chronological trade or day P and L path?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask the highest-impact meaning first; entity, interval, basis, and period remain staged."},
  {"caseId":"C16-E3-19","caseType":"negative_example","input":"Show the exact flat-to-flat closed position lifecycles for the validated month, regardless of any favorable candle move.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["closed_trades"],"expectedFilters":["authorized position lifecycles that return from zero to zero"],"expectedGroupings":[],"expectedOperators":["route explicit flat-to-flat closed-lifecycle grammar to the locked closed_trades owner","do not map position round trips to profit_giveback_vocabulary"],"expectedComparison":null,"expectedTimeRange":"validated month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact chronological position lifecycle","accepted execution and closed-trade coverage","no candle or P/L-path meaning supplied"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A closed flat-to-flat lifecycle is not automatically round-tripped profit or candle giveback."},
  {"caseId":"C16-E3-20","caseType":"unsupported_data","input":"Use another account's private exit note to infer that I failed to lock in gains and should have exited earlier from an open trade's partial candles and missing exact exit.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-text use","reject missing-exit candle giveback calculation","reject agency quality and trading-advice inference"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","exact realized exit required for candle profit_giveback","open trade is ineligible for realized exit metric","complete compatible interior-candle coverage required","no private-note raw-ID or cross-account fallback","historical movement proves no failure or preferred action"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private note and an open trade with partial candles and no exact realized exit cannot support candle profit giveback, agency, execution-quality, or exit advice.","notes":"Fail closed while preserving open-state and unavailable coverage without exposing private text or identifiers."},
  {"caseId":"C16-E3-21","caseType":"selected_entity_context","input":"For the trusted selected ready-closed trade, resolve candle giveback only after revalidating its exact direction, boundaries, interval, and coverage.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","apply the direction-specific nonnegative giveback formula only if coverage is complete"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry-to-exit boundary","expectedSelectedEntity":"server-validated selected ready-closed trade","expectedContextRequirements":["trusted typed selected trade","same server-authorized account scope","current ownership type provenance and lifecycle state","exact entry exit direction candle source interval and grain","complete interior-candle coverage","no raw trade account source or candle identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context supplies identity only; it does not supply missing market data, agency, or advice."},
  {"caseId":"C16-E3-22","caseType":"cross_category","input":"Compare one-minute candle profit giveback with fee-complete net P and L for authorized ready-closed long trades last month, keeping price distance and currency results separate.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","analyze_trade","inspect_data_quality"],"expectedCanonicalConcepts":["profit_giveback_vocabulary","profit_giveback","net_pnl"],"expectedFilters":["authorized ready-closed long trades with compatible complete coverage"],"expectedGroupings":[],"expectedOperators":["calculate candle giveback as max of zero and P minus X in price units","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","compare supported paired observations without merging units"],"expectedComparison":"per-trade candle price giveback versus fee-complete net_pnl as separate measures","expectedTimeRange":"validated prior-month trade-entry-to-exit windows","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","one-minute interior-candle coverage and exact exits","fee-complete compatible currency and charge allocation","ready_closed population","separate price-distance and currency units","eligible paired missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Cross-metric comparison neither converts price distance to P/L nor establishes causal effect or advice."}
]
~~~

## Evaluation Array C16-E4 -- repeat_trading_vocabulary

~~~json
[
  {"caseId":"C16-E4-01","caseType":"canonical","input":"Count my re-entered NVDA attempts after I went flat in the authorized July period.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["authorized July NVDA lifecycle candidates"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["build the complete pre-filter lifecycle sequence","classify each later post-flat zero-to-nonzero lifecycle as a repeat","count repeats without skipping barriers"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","active locale-compatible non-deprecated registry version","accepted zero-to-nonzero and return-to-zero lifecycle facts","first-entry raw UTC order with private stable tie fact","ready_closed legitimate_open needs_decision and incomplete candidates","exact pre-barrier count and partial or unavailable later coverage","no raw IDs or private text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Re-entered means a new attempt only after the prior lifecycle returned to zero; vocabulary does not implement runtime behavior."},
  {"caseId":"C16-E4-02","caseType":"formal_paraphrase","input":"Retrieve every second-or-later zero-to-nonzero lifecycle for the same authorized instrument and account-local entry date.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["second-or-later lifecycle candidates after a completed return to zero"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["construct the unfiltered lifecycle order","retain ordinals and barrier states","return bounded privacy-safe records"],"expectedComparison":null,"expectedTimeRange":"validated requested account-local entry dates","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact lifecycle boundaries","raw UTC ordering","complete current candidate set before filters","state-labelled decision and incomplete barriers","coverage counts without raw identifiers"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A formal lifecycle description preserves Category 8 sequence ownership and does not convert fills into attempts."},
  {"caseId":"C16-E4-03","caseType":"conversational_paraphrase","input":"I said I tried it again on AMD after closing the position last month; how many repeat attempts was that?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["authorized AMD candidates in the validated prior month"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["verify a return to zero before each later attempt","count complete repeat attempts and report barriers"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","current exact registry match for tried it again","complete pre-filter lifecycle sequence","accepted position transitions and local-date partition","visible legitimate-open decision and incomplete states","coverage and limitation counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Tried it again routes to factual sequencing only and proves no overtrading, motive, or quality."},
  {"caseId":"C16-E4-04","caseType":"trader_slang","input":"Show my second shot in TSLA after the first lifecycle went flat on the validated date.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["exact ordinal attempt two for authorized TSLA on the validated local date"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["build the full sequence before filtering","select only the lifecycle with ordinal two"],"expectedComparison":null,"expectedTimeRange":"validated account-local entry date","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","strong current exact second shot registry entry","one initial lifecycle and one later post-flat lifecycle","unskipped decision or incomplete barriers","server-side stable tie resolution","privacy-safe projection"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Second shot means exactly attempt two, never an arbitrary later fill or lifecycle."},
  {"caseId":"C16-E4-05","caseType":"abbreviation","input":"Show 2A for the same instrument; by 2A I mean the exact second post-flat attempt.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["exact ordinal attempt two after a verified return to zero"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["collision-check the abbreviation","accept the explicit second-attempt expansion","rebuild the complete sequence before selecting ordinal two"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit abbreviation expansion","ticker and token collision check","trusted retained instrument and local date","current registry version","complete lifecycle and barrier coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare 2A never auto-routes; the explicit meaning and trusted lifecycle context resolve it here."},
  {"caseId":"C16-E4-06","caseType":"misspelling","input":"Show when I re enterd the same ticker after going flat.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_trading_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate re-entered as a fuzzy locale-compatible candidate only","leave lifecycle routing and data access unresolved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","current non-deprecated registry version","fuzzy matching remains candidate generation","accepted query state unchanged","no private record lookup before confirmation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean re-entered after the prior position returned to zero?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one meaning field first; instrument, date, and full sequence remain staged after confirmation."},
  {"caseId":"C16-E4-07","caseType":"noisy_input","input":"nvda back in after flat july, another attempt pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["authorized July NVDA candidates after a verified return to zero"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["normalize went back in and another attempt from explicit post-flat grammar","construct the full sequence before applying the requested output filter"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active exact registry resolution","accepted lifecycle transitions","full pre-filter candidate set","barrier states and coverage","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit after-flat wording resolves went back in as a new lifecycle rather than an add."},
  {"caseId":"C16-E4-08","caseType":"command","input":"Count another attempt only after the earlier position returned to zero; do not count scale-ins.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["later zero-to-nonzero lifecycles only"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["separate same-lifecycle adds from post-flat attempts","count repeat lifecycles after full ordering","retain all barriers"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete accepted execution chronology","zero return before the later opening transition","current lifecycle projection states","pre-filter sequence coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Adds within an open lifecycle remain distinct and cannot increase repeat-attempt count."},
  {"caseId":"C16-E4-09","caseType":"fragment","input":"same-ticker attempts after flat, prior week","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["authorized same-instrument repeat attempts in the prior week"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["number complete lifecycles before the prior-week output filter","return repeat ordinals and barrier coverage"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit post-flat attempt grain","stable instrument resolution","accepted lifecycle boundaries","complete pre-filter ordering and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is sufficient only because repeat-attempt grain and temporal scope are explicit."},
  {"caseId":"C16-E4-10","caseType":"follow_up","input":"Of that trusted lifecycle sequence, show which one was exactly the second shot.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["ordinal attempt two in the retained accepted sequence"],"expectedGroupings":["retained same account stable instrument and account-local entry date"],"expectedOperators":["reuse only trusted typed sequence context","revalidate the ordinal against current lifecycle and barrier state"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained instrument local date and sequence partition","current projection and barrier states","no prose-only or stale-result selection","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up may reuse typed accepted state, not nearby private prose or raw identities."},
  {"caseId":"C16-E4-11","caseType":"correction","input":"I meant fills added while the position was still open, not another attempt after flat.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary"],"expectedFilters":["accepted executions added within the same open lifecycle"],"expectedGroupings":["selected lifecycle"],"expectedOperators":["replace the repeat-attempt interpretation with same-lifecycle add activity","preserve the accepted chronology and lifecycle state"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","validated correction revision","accepted execution chronology","position never returned to zero before the added fills","no renumbering of attempts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correction changes the route to factual add activity; it does not rewrite execution facts."},
  {"caseId":"C16-E4-12","caseType":"comparison","input":"Compare repeat-attempt counts between the two authorized months using the same complete pre-filter sequence contract.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["repeat lifecycles established before month output filters"],"expectedGroupings":["authorized month A","authorized month B"],"expectedOperators":["build each side's complete compatible sequence","count post-flat later lifecycles separately","compare side-specific counts and barriers"],"expectedComparison":"authorized month A repeat-attempt count versus authorized month B repeat-attempt count","expectedTimeRange":"two validated monthly temporal contracts","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","same stable-instrument and local-date partition rule","same lifecycle projection contract","side-specific complete prefixes barriers and unavailable tails","compatible coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The comparison establishes neither overtrading nor causal or future-performance conclusions."},
  {"caseId":"C16-E4-13","caseType":"ranking","input":"Rank authorized ticker groups by repeat-attempt count this quarter with visible barriers and the approved tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["validated current-quarter filter applied only after attempt identity and ordinal are fixed"],"expectedGroupings":["authorized stable-instrument ticker groups"],"expectedOperators":["partition all current candidates by the same authorized account stable instrument and account-local entry date","order and classify the complete pre-filter lifecycle sequence within every partition","retain every decision and incomplete barrier","apply the current-quarter output filter after sequencing","count repeats per authorized ticker group without renumbering","sort descending with the approved privacy-safe tie policy"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized ticker universe","account IANA timezone and account-local entry dates","stable instrument and first-entry raw UTC order","positive result limit","approved deterministic privacy-safe ties","complete pre-filter sequences and current projection states","per-group barriers and coverage without raw stable IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Attempt identity is partitioned and numbered before current-quarter filtering or group ranking; factual counts diagnose no revenge, quality, or edge."},
  {"caseId":"C16-E4-14","caseType":"negation","input":"Show new post-flat attempts, not same-lifecycle adds, for the validated session.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["later lifecycles preceded by an exact return to zero","exclude executions that only add within one open lifecycle"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["apply the known lifecycle-state distinction","retain excluded-add and barrier counts"],"expectedComparison":null,"expectedTimeRange":"validated session temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted chronological position facts","exact return-to-zero boundary","complete candidate sequence","state and coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Negation excludes known adds only; unknown or incomplete lifecycle states are not treated as new attempts."},
  {"caseId":"C16-E4-15","caseType":"exclusion","input":"Exclude scale-ins from repeat counts, but keep every decision or incomplete predecessor as a visible barrier.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality","analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["post-flat repeat lifecycles after add classification"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["exclude confirmed same-lifecycle scale-ins","do not delete or skip barriers","return exact pre-barrier count and unavailable later coverage"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete candidate ordering before exclusion","confirmed lifecycle state for excluded adds","decision and incomplete state labels","coverage limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion cannot renumber later attempts or hide unresolved valid data."},
  {"caseId":"C16-E4-16","caseType":"multi_filter","input":"Show authorized July long NVDA repeat attempts after 10:00, preserving the full local-date sequence before filters.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","validated after-10:00 predicate applied after numbering"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["construct and number the complete sequence first","apply the validated output predicate tree afterward"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","account IANA timezone","stable instrument and raw UTC order","complete pre-filter lifecycle set","visible barriers and filter exclusions","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Date, side, ticker, and time filters cannot create or renumber attempt identity."},
  {"caseId":"C16-E4-17","caseType":"multi_part","input":"I explicitly wrote that I revenge traded the same ticker; count repeat attempts, list each exact second shot, and report all barriers.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["calculate_metric","retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts"],"expectedFilters":["all authorized repeat lifecycles and ordinal-two lifecycles"],"expectedGroupings":["same account stable instrument and account-local entry date"],"expectedOperators":["build one complete sequence","count later lifecycles","select ordinal two","report barriers and unavailable tails","retain the explicit user-authored revenge wording without deriving motive"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete accepted lifecycle chronology","projection states and coverage","privacy-safe bounded records","explicit same-account user-authored revenge label"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"One sequence may support count, ordinal, coverage, and an explicit user label while factual lifecycle data still proves no motive."},
  {"caseId":"C16-E4-18","caseType":"ambiguous","input":"I went back in.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_trading_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain add versus reopen ambiguity","select neither lifecycle route"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","no verified prior return-to-zero state","no trusted selected execution","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Had the prior position returned to zero before you went back in?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask the highest-impact lifecycle field first; instrument, date, sequence, and label meaning remain staged."},
  {"caseId":"C16-E4-19","caseType":"negative_example","input":"Count every additional entry fill as another attempt even while the position remains open.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["analyze_sequence"],"expectedCanonicalConcepts":[],"expectedFilters":["accepted additional entry executions within open lifecycles"],"expectedGroupings":["open lifecycle"],"expectedOperators":["route the explicit request to execution or add activity","do not map fills to repeat_trading_vocabulary or repeat_attempts"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted execution chronology","position remains nonzero","execution activity is distinct from lifecycle attempts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A same-lifecycle additional fill is not a post-flat repeat attempt."},
  {"caseId":"C16-E4-20","caseType":"unsupported_data","input":"Use another account's private notes and hidden record IDs to decide that my re-entry after a loss was revenge and tell me whether to do it tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["repeat_trading_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-text and raw-ID access","reject inferred revenge motive from loss and re-entry","reject trading advice and prediction"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","private notes and raw IDs never reach model or output","loss plus later lifecycle proves no motive","no supported advice or prediction route","chat runtime remains Planned"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Cross-account private evidence and hidden identifiers are unauthorized, and lifecycle facts cannot establish revenge motive or future trading advice.","notes":"Fail closed without exposing private text, identities, or speculative behavioral conclusions."},
  {"caseId":"C16-E4-21","caseType":"selected_entity_context","input":"For the trusted selected went-back-in execution, determine whether it added to an open position or began a new post-flat lifecycle.","expectedPrimaryIntent":"analyze_sequence","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["repeat_trading_vocabulary"],"expectedFilters":[],"expectedGroupings":["selected instrument lifecycle"],"expectedOperators":["resolve and revalidate the selected execution server-side","inspect position immediately before the execution","classify add versus new lifecycle only from accepted chronology"],"expectedComparison":null,"expectedTimeRange":"exact selected-execution lifecycle boundary","expectedSelectedEntity":"server-validated selected execution","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type and provenance","accepted execution and position chronology","zero versus nonzero predecessor state","no raw execution account or source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context supplies identity only; lifecycle state must still be revalidated from current facts."},
  {"caseId":"C16-E4-22","caseType":"cross_category","input":"Compare fee-complete net P and L for initial versus repeat attempts after the complete lifecycle sequence is fixed.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["analyze_sequence","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["repeat_trading_vocabulary","repeat_attempts","net_pnl"],"expectedFilters":["ready_closed and fee-complete net-P-and-L eligibility applied only after initial-versus-repeat identity is fixed"],"expectedGroupings":["initial attempt","second-or-later repeat attempt"],"expectedOperators":["partition all current candidates by the same authorized account stable instrument and account-local entry date","order and classify the complete pre-filter lifecycle sequence with every decision and incomplete barrier retained","fix initial and repeat ordinals before ready_closed or performance filters","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","compare compatible side-specific results and coverage"],"expectedComparison":"initial-attempt fee-complete net_pnl versus repeat-attempt fee-complete net_pnl","expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","account IANA timezone and account-local entry dates","stable instrument and first-entry raw UTC order","complete pre-filter sequence current projection states and barrier coverage","ready_closed performance population applied after sequence identity","fee-complete compatible currency and conserving charge allocation","side-specific eligible excluded and unavailable counts","no raw stable IDs or cause motive advice conclusion"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Full partitioned attempt identity precedes lifecycle and net-P-and-L filters; performance comparison neither renumbers attempts nor proves cause."}
]
~~~

## Evaluation Array C16-E5 -- position_size_vocabulary

~~~json
[
  {"caseId":"C16-E5-01","caseType":"canonical","input":"Calculate my average maximum position size in shares for eligible July Stock round trips.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary","average_position_size"],"expectedFilters":["eligible July Stock round trips with complete accepted quantity and allocation coverage"],"expectedGroupings":[],"expectedOperators":["derive each round trip's maximum absolute running position quantity","calculate the arithmetic mean across eligible maxima"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","active locale-compatible non-deprecated registry version","accepted execution quantities and chronology","eligible Stock round-trip grain","complete quantity and allocation coverage","share units","eligible excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 6 average_position_size is the mean of per-round-trip maximum absolute running quantities, not average execution size."},
  {"caseId":"C16-E5-02","caseType":"formal_paraphrase","input":"Return the exact median of per-round-trip maximum absolute open share quantities for the authorized quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary","median_position_size"],"expectedFilters":["eligible Stock round trips with complete accepted quantity and allocation coverage"],"expectedGroupings":[],"expectedOperators":["derive one maximum absolute running quantity per eligible round trip","calculate the exact median"],"expectedComparison":null,"expectedTimeRange":"validated quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked Category 6 owner","accepted chronological executions","Stock round-trip grain","complete quantity and allocation coverage","share units and sample count"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording does not change the owner population, grain, or exact-median rule."},
  {"caseId":"C16-E5-03","caseType":"conversational_paraphrase","input":"What was the biggest my position got in shares on each closed trade last week?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":["eligible prior-week ready-closed Stock round trips with complete quantity coverage"],"expectedGroupings":["round trip"],"expectedOperators":["rebuild running position from accepted quantities","return each round trip's factual maximum absolute running share quantity primitive"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit position-as-running-quantity grammar","accepted execution chronology","ready_closed round-trip state","share units","coverage and unavailable reasons"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This returns the Category 6 per-round-trip primitive; it does not invoke the outer maximum_position_size aggregate."},
  {"caseId":"C16-E5-04","caseType":"trader_slang","input":"I sized up on the selected next trade; was its maximum open share quantity larger than the exact prior compatible trade?","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["analyze_sequence","calculate_metric"],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":["selected trade and exact compatible predecessor with complete quantity coverage"],"expectedGroupings":[],"expectedOperators":["derive the factual per-round-trip maximum absolute running quantity primitive for each observation","calculate signed next-minus-prior share difference","report larger smaller or equal state"],"expectedComparison":"selected next trade maximum open shares versus exact predecessor maximum open shares","expectedTimeRange":"validated selected sequence boundary","expectedSelectedEntity":"server-validated selected next trade","expectedContextRequirements":["same server-authorized account scope","explicit share measure and round-trip grain","trusted exact predecessor","compatible lifecycle states","complete quantity and allocation coverage on both sides","no risk confidence or motive inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Sized up compares two Category 6 per-round-trip primitives; it is not the outer maximum_position_size aggregate, and equality is not bigger."},
  {"caseId":"C16-E5-05","caseType":"abbreviation","input":"Show max qty in shs for eligible NVDA round trips this month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":["eligible current-month NVDA Stock round trips with complete quantity coverage"],"expectedGroupings":["round trip"],"expectedOperators":["resolve qty and shs beside explicit quantity grammar","derive the factual maximum absolute running share quantity primitive per round trip"],"expectedComparison":null,"expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","abbreviation and ticker collision check","explicit maximum quantity measure","accepted execution chronology","share units and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit max-quantity grammar permits qty and shs and returns per-round-trip primitives, not the outer maximum_position_size aggregate."},
  {"caseId":"C16-E5-06","caseType":"misspelling","input":"What was my expousre on the selected trade?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate exposure as a fuzzy locale-compatible candidate only","leave measure and data access unresolved"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":"unresolved selected-trade reference","expectedContextRequirements":["same server-authorized account scope","current non-deprecated registry version","fuzzy matching remains candidate generation","no accepted exposure definition or valuation basis","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean exposure?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After fuzzy confirmation, the exact exposure measure is still clarified one field at a time."},
  {"caseId":"C16-E5-07","caseType":"noisy_input","input":"july nvda max shares, long closed only","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary","maximum_position_size"],"expectedFilters":["authorized July NVDA long ready-closed Stock round trips with complete quantity coverage"],"expectedGroupings":[],"expectedOperators":["derive per-round-trip maximum absolute running quantity","calculate the maximum across eligible per-round-trip maxima"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active exact registry route","accepted execution quantities and allocation","ready_closed Stock round-trip population","share units","eligible and excluded counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not turn maximum running shares into shares purchased or dollar exposure."},
  {"caseId":"C16-E5-08","caseType":"command","input":"Calculate median position size as maximum open share quantity per eligible round trip; do not use dollars.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary","median_position_size"],"expectedFilters":["eligible Stock round trips with complete quantity coverage"],"expectedGroupings":[],"expectedOperators":["derive each round trip's maximum absolute running share quantity","calculate the exact median","exclude monetary measures"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locked Category 6 median owner","accepted chronological quantities","share units","complete allocation coverage","sample count"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit command chooses quantity and round-trip grain without authorizing mutation."},
  {"caseId":"C16-E5-09","caseType":"fragment","input":"average max-open shares, prior month","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary","average_position_size"],"expectedFilters":["eligible prior-month Stock round trips with complete quantity coverage"],"expectedGroupings":[],"expectedOperators":["derive per-round-trip maximum absolute running share quantity","calculate the arithmetic mean"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit quantity measure and round-trip grain","accepted execution chronology","share units","eligible excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete because measure, aggregate, grain, and period are explicit."},
  {"caseId":"C16-E5-10","caseType":"follow_up","input":"For that trusted comparison, I said the next trade went bigger; use maximum open share quantity versus its exact prior compatible trade.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","analyze_sequence"],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":["retained selected next trade and exact compatible predecessor with complete quantity coverage"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed pair period and grain","derive the factual per-round-trip maximum absolute running quantity primitive on both sides","calculate signed next-minus-prior difference and equality state"],"expectedComparison":"next trade maximum open shares versus exact prior compatible trade maximum open shares","expectedTimeRange":"retained validated sequence boundary","expectedSelectedEntity":"server-validated selected next trade","expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained exact predecessor and round-trip grain","accepted execution quantities on both sides","share units and complete coverage","no prose-only or stale-result context"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Went bigger compares two per-round-trip primitives rather than the outer maximum_position_size aggregate; it proves no risk, confidence, or motive."},
  {"caseId":"C16-E5-11","caseType":"correction","input":"I meant maximum position size across the same closed trades, not total shares purchased.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary","maximum_position_size"],"expectedFilters":["retained eligible ready-closed Stock round trips with complete quantity and allocation coverage"],"expectedGroupings":[],"expectedOperators":["replace cumulative purchase quantity with the locked maximum-position owner","derive each eligible round trip's maximum absolute running position quantity from accepted chronology","return the greatest exact per-round-trip value across the eligible closed-trade population","return unavailable for an empty eligible population","report eligible excluded partial and unavailable counts"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","validated correction revision","accepted execution quantities order and conserving allocation","eligible ready_closed Stock round-trip population","share units","complete quantity coverage","zero eligible population is unavailable"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"maximum_position_size is the outer maximum across eligible per-round-trip maximum-running-quantity primitives; shares purchased is a different owner."},
  {"caseId":"C16-E5-12","caseType":"comparison","input":"Compare average maximum position quantity between the two authorized ticker groups using the same share basis.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["position_size_vocabulary","average_position_size"],"expectedFilters":["eligible Stock round trips with complete quantity coverage on each side"],"expectedGroupings":["authorized ticker group A","authorized ticker group B"],"expectedOperators":["calculate the arithmetic mean of per-round-trip maximum quantities separately","calculate signed A-minus-B share difference","report equality state"],"expectedComparison":"ticker group A average_position_size versus ticker group B average_position_size","expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","same round-trip grain and quantity measure","side-specific compatible populations","share units","complete allocation coverage and sample counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The comparison proves no risk, confidence, motive, or preferred future size."},
  {"caseId":"C16-E5-13","caseType":"ranking","input":"Rank authorized ticker groups by median maximum position quantity this quarter using the approved tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["position_size_vocabulary","median_position_size"],"expectedFilters":["eligible current-quarter Stock round trips with complete quantity coverage"],"expectedGroupings":["authorized ticker groups"],"expectedOperators":["calculate exact median per group from per-round-trip maxima","sort descending with approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized ticker universe","positive result limit","approved deterministic tie policy","share units","per-group sample and coverage counts","no raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking size does not rank quality or recommend a future position amount."},
  {"caseId":"C16-E5-14","caseType":"negation","input":"Show share size, not dollar exposure, for eligible positions in the validated week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["exclude the dollar-exposure interpretation","retain entered current-or-residual and maximum-open share-quantity ambiguity","leave routing and data access pending"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","share units are explicit but the quantity observation is not","accepted query state unchanged","no record access or period application before measure clarification"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean entered share quantity, current or residual share quantity, or maximum open share quantity?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The negation removes dollar exposure but does not select one share-quantity measure; the validated week and coverage are staged after this first clarification."},
  {"caseId":"C16-E5-15","caseType":"exclusion","input":"Exclude incomplete quantity chains from maximum-position statistics and report them as unavailable rather than zero.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["position_size_vocabulary","maximum_position_size"],"expectedFilters":["eligible Stock round trips with complete quantity and allocation coverage"],"expectedGroupings":[],"expectedOperators":["exclude incomplete chains visibly","calculate the maximum only over covered per-round-trip maxima","report excluded and unavailable counts"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted execution chronology","complete quantity conservation","missing or decision states preserved","unknown size is not zero"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coverage exclusion cannot silently discard valid rows or invent a zero maximum."},
  {"caseId":"C16-E5-16","caseType":"multi_filter","input":"Show authorized July ready-closed long NVDA trades by maximum open share quantity with complete allocation coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":["authorized July predicate","validated ready_closed predicate","validated long predicate","authorized NVDA predicate","complete quantity and allocation coverage"],"expectedGroupings":["round trip"],"expectedOperators":["apply the validated predicate tree","derive the factual maximum absolute running share quantity primitive for each eligible round trip"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","accepted execution chronology","Stock round-trip grain","share units","excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"This lists per-round-trip primitives rather than invoking the outer maximum_position_size aggregate; filters imply no exposure or risk."},
  {"caseId":"C16-E5-17","caseType":"multi_part","input":"Return average, median, and maximum of per-round-trip maximum open shares, then state eligible count and exclusions.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["summarize_performance","inspect_data_quality"],"expectedCanonicalConcepts":["position_size_vocabulary","average_position_size","median_position_size","maximum_position_size"],"expectedFilters":["eligible Stock round trips with complete accepted quantity and allocation coverage"],"expectedGroupings":[],"expectedOperators":["derive one maximum absolute running quantity per round trip","calculate arithmetic mean","calculate exact median","calculate maximum","report sample and exclusion counts"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","one compatible Stock round-trip population","accepted chronological quantities","share units","complete quantity and allocation coverage","partial and unavailable reasons"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"All three Category 6 aggregates share one explicit per-round-trip maximum-quantity observation set."},
  {"caseId":"C16-E5-18","caseType":"ambiguous","input":"What was my size?","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain quantity maximum-open-quantity notional and saved-exposure ambiguity","select no measure or grain"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","no explicit measure","no execution round-trip or group grain","no accepted query mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean share quantity, maximum open quantity, entry notional, or a saved exposure measure?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one field first; grain, period, currency, and baseline remain staged."},
  {"caseId":"C16-E5-19","caseType":"negative_example","input":"Open the trusted selected position lifecycle and list its accepted executions and current state.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["retrieve_records"],"expectedCanonicalConcepts":[],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve position as the selected lifecycle entity","retrieve authorized execution and state facts","do not map entity grammar to position_size_vocabulary"],"expectedComparison":null,"expectedTimeRange":"selected lifecycle boundary","expectedSelectedEntity":"server-validated selected position lifecycle","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership provenance and lifecycle state","privacy-safe execution projection"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Position can identify an entity rather than a size metric; grammar controls routing."},
  {"caseId":"C16-E5-20","caseType":"unsupported_data","input":"Use another account's private baseline to decide I went heavy, infer my risk tolerance, and tell me how large to trade tomorrow.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private baseline access","reject went-heavy classification without an authorized explicit measure and baseline","reject risk inference and trading advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","private labels notes and raw IDs unavailable","no approved personal baseline in scope","no factual route from size to risk tolerance","chat runtime remains Planned"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private baseline is unauthorized, and no approved same-account measure or baseline supports went-heavy classification, risk inference, or future sizing advice.","notes":"Fail closed without exposing private evidence or inventing a universal heavy-size threshold."},
  {"caseId":"C16-E5-21","caseType":"selected_entity_context","input":"For the trusted selected round trip, return its maximum absolute open share quantity after revalidating every accepted fill.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["position_size_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected round trip server-side","rebuild chronological running position","return the factual per-round-trip maximum absolute share quantity primitive only with complete coverage"],"expectedComparison":null,"expectedTimeRange":"exact selected round-trip boundary","expectedSelectedEntity":"server-validated selected round trip","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and ready-closed state","accepted execution quantities and allocation","share units","no raw trade account source or execution IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected context returns one Category 6 primitive, not the outer maximum_position_size aggregate, and cannot fill missing quantity or allocation facts."},
  {"caseId":"C16-E5-22","caseType":"cross_category","input":"Compare fee-complete net P and L per approved dollar exposure across authorized groups, and report unavailable if the saved exposure contract is absent.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["position_size_vocabulary","net_pnl"],"expectedFilters":["compatible eligible ready_closed observations only if an approved exposure owner exists"],"expectedGroupings":["authorized comparison groups"],"expectedOperators":["validate the saved exposure definition and denominator first","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","divide only with compatible nonzero exposure denominators","fail closed when exposure is unavailable"],"expectedComparison":"fee-complete net_pnl per approved dollar-exposure unit across authorized groups","expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved exposure definition valuation event price unit currency and version","fee-complete compatible net P/L","identical eligible populations","nonzero denominator coverage","generic dollar exposure currently unavailable without its contract"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Generic dollar exposure has no approved valuation-time and denominator contract, so profit per exposure is unavailable unless a saved compatible exposure owner is supplied.","notes":"Entry notional, shares, equity, margin, or current market value cannot substitute for the absent exposure contract."}
]
~~~

## Evaluation Array C16-E6 -- price_terms_vocabulary

~~~json
[
  {"caseId":"C16-E6-01","caseType":"canonical","input":"Show authorized July trades with accepted entry price strictly below one USD.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["accepted entry price strictly less than 1 USD at the declared entry event"],"expectedGroupings":[],"expectedOperators":["apply the explicit strict less-than operator to the covered entry-price fact","exclude missing or incompatible price coverage visibly"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","active locale-compatible non-deprecated registry version","locked accepted entry-price owner","entry event and applicability","strict threshold 1","USD currency partition","eligible missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Sub-dollar routing requires strict less than one on the declared field and event; no current quote is consulted."},
  {"caseId":"C16-E6-02","caseType":"formal_paraphrase","input":"Retrieve records whose covered average execution price at lifecycle entry was less than one CAD.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["covered average execution price at lifecycle entry strictly less than 1 CAD"],"expectedGroupings":[],"expectedOperators":["validate the declared average-entry price owner","apply strict less than one within the CAD partition"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact average-entry field and lifecycle-entry event","strict threshold 1","CAD unit and currency","owner applicability to requested records","complete compatible price coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording preserves the declared field, event, operator, currency, and applicability."},
  {"caseId":"C16-E6-03","caseType":"conversational_paraphrase","input":"Which closed trades entered under a buck USD this month?","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["ready-closed trades with accepted entry price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["resolve under a buck from explicit entry and USD context","apply the strict entry-price predicate"],"expectedComparison":null,"expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current exact registry match","accepted entry price and entry event","ready_closed applicability","strict threshold 1 USD","price coverage and exclusions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Buck does not authorize a currency guess; USD is explicit here."},
  {"caseId":"C16-E6-04","caseType":"trader_slang","input":"List sub-dollar entries on the accepted fill price in USD for the validated week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["accepted entry fill price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["resolve sub-dollar to strict less than one only after field event and currency are explicit","return covered records"],"expectedComparison":null,"expectedTimeRange":"validated week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","active exact sub-dollar registry entry","accepted entry-fill field and event","strict threshold 1","USD currency and applicability","coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Sub-dollar is a predicate phrase, not a penny-stock classification or value judgment."},
  {"caseId":"C16-E6-05","caseType":"abbreviation","input":"Use SD to mean entry price below one USD for these authorized trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["accepted entry price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["collision-check SD as abbreviation and ticker-like token","accept the explicit expansion","apply the covered strict entry-price predicate"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit abbreviation meaning","ticker and token collision check","accepted entry-price owner and event","strict threshold 1 USD","current registry version and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bare SD never auto-routes; explicit price grammar resolves the abbreviation here."},
  {"caseId":"C16-E6-06","caseType":"misspelling","input":"Show my peny stocks from July.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate penny stock as a fuzzy locale-compatible candidate only","leave definition and record access unresolved"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","current non-deprecated registry version","fuzzy matching remains candidate generation","no approved effective penny-stock definition supplied","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean penny stocks?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"After fuzzy confirmation, the saved effective definition and price basis still require separate validation."},
  {"caseId":"C16-E6-07","caseType":"noisy_input","input":"july long nvda entry <1 usd, closed only","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","ready_closed predicate","accepted entry price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["normalize the explicit predicate tree","apply strict less than one to accepted entry price"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact entry-price field and event","strict threshold 1 USD","ready_closed applicability","compatible accepted price coverage","excluded and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes no field, endpoint, currency, lifecycle, or coverage rule."},
  {"caseId":"C16-E6-08","caseType":"command","input":"Filter by accepted exit price below one USD at the closing event; use strict less than, not less-than-or-equal.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["accepted exit price strictly less than 1 USD at the closing event"],"expectedGroupings":[],"expectedOperators":["apply strict less than one to the declared exit field","reject endpoint widening"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted exit-price owner and closing event","strict threshold 1","USD currency","ready-closed applicability","complete exit-price coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exit price cannot be substituted with entry, average, candle, or current price."},
  {"caseId":"C16-E6-09","caseType":"fragment","input":"below $1 USD at accepted entry, prior month","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["accepted entry price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["apply the explicit strict entry-price predicate","return only covered compatible records"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","entry field and event","strict threshold 1","USD currency","owner applicability","coverage and limitations"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete because field, event, endpoint, currency, and period are explicit."},
  {"caseId":"C16-E6-10","caseType":"follow_up","input":"For that trusted price filter, use accepted exit price instead and keep strict below one USD.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["accepted exit price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["reuse only trusted period and authorized population","replace entry with exit field after validation","recalculate membership from covered exit facts"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained strict endpoint and USD currency","accepted exit-price owner and closing event","ready-closed applicability and coverage","no stale-result relabeling"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up changes the price field only after trusted typed state is revalidated."},
  {"caseId":"C16-E6-11","caseType":"correction","input":"By low-priced stock I mean my saved entry-price bucket, not penny stock or today's quote.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary","price_buckets"],"expectedFilters":["membership in the explicitly selected saved entry-price bucket"],"expectedGroupings":[],"expectedOperators":["replace the penny-stock interpretation with the saved bucket","resolve exact effective definition and version","classify only covered accepted entry prices"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized active saved bucket","entry-price field and event","explicit bounds endpoints unit currency applicability and version","accepted historical price coverage","no current quote"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction is valid only if the saved definition is available; low-priced has no universal threshold."},
  {"caseId":"C16-E6-12","caseType":"comparison","input":"Compare counts inside versus outside the same approved low-priced entry bucket for the two authorized groups.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["price_terms_vocabulary","price_buckets"],"expectedFilters":["covered accepted entry prices classified by one approved bucket definition"],"expectedGroupings":["inside approved bucket","outside approved bucket"],"expectedOperators":["apply one definition version and endpoint contract","count side-specific compatible records","compare counts with coverage"],"expectedComparison":"inside versus outside the approved low-priced entry bucket","expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved nonoverlapping bucket definition","same entry field event unit currency applicability and version","known complement only over covered records","side-specific missing and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Unknown price coverage is neither inside nor outside the definition."},
  {"caseId":"C16-E6-13","caseType":"ranking","input":"Rank approved nonoverlapping price buckets by eligible trade count using the same entry-price basis and approved tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric"],"expectedCanonicalConcepts":["price_terms_vocabulary","price_buckets"],"expectedFilters":["eligible records with covered accepted entry prices"],"expectedGroupings":["approved nonoverlapping price buckets"],"expectedOperators":["classify with exact saved definitions","count eligible records per bucket","sort descending with approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved bounds endpoints gaps overlaps applicability and versions","same entry event unit and currency","positive result limit","approved tie policy","per-bucket coverage without raw IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking approved buckets does not judge value or recommend a security."},
  {"caseId":"C16-E6-14","caseType":"negation","input":"Show covered accepted entries not below one USD, using the exact known complement in USD.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["covered accepted entry price greater than or equal to 1 USD as the complement of strict less than 1"],"expectedGroupings":[],"expectedOperators":["apply the known complement only to covered compatible entry-price facts","exclude unknown price coverage from both sets"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted entry field and event","USD currency","strict source predicate and exact complement","owner applicability","coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not below one means at least one only for known compatible facts; missing data is not a complement member."},
  {"caseId":"C16-E6-15","caseType":"exclusion","input":"Exclude records missing accepted entry prices from the sub-dollar result and report them as unavailable.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["covered accepted entry price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["exclude missing or incompatible price facts visibly","apply strict less than one only to covered entries","report eligible excluded and unavailable counts"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted entry-price owner","entry event strict threshold and USD","missing price cannot be invented or replaced","coverage reasons"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion does not convert missing prices to zero or consult a current quote."},
  {"caseId":"C16-E6-16","caseType":"multi_filter","input":"Show authorized July ready-closed long NVDA entries strictly below one USD with complete accepted entry-price coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["authorized July predicate","validated ready_closed predicate","validated long predicate","authorized NVDA predicate","accepted entry price strictly less than 1 USD","complete entry-price coverage"],"expectedGroupings":[],"expectedOperators":["apply the validated predicate tree","evaluate strict less than one only on accepted entry prices"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","entry field and event","strict threshold 1 USD","ready_closed applicability","coverage and exclusions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker filtering does not classify price, and price wording does not infer the ticker."},
  {"caseId":"C16-E6-17","caseType":"multi_part","input":"Count accepted entries below one USD and records in my approved penny-stock definition, returning separate results with versions and coverage.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["price_terms_vocabulary","penny_stocks_where_explicitly_defined"],"expectedFilters":["accepted entry price strictly less than 1 USD","membership in the explicit approved penny-stock definition if available"],"expectedGroupings":["strict under-one entry predicate","approved penny-stock definition"],"expectedOperators":["calculate each classification separately","preserve distinct field definition and version","report unavailable definition without substitution"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","accepted entry-price field and event","strict threshold 1 USD","separately approved penny-stock basis threshold unit currency applicability and version","compatible coverage","no synonym merge"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"The strict under-one entry count may be supported, but penny-stock membership remains unavailable until an approved saved or app-wide effective definition and exact price contract are supplied.","notes":"Return the supported component and label the unavailable component; sub-dollar is not a penny-stock fallback."},
  {"caseId":"C16-E6-18","caseType":"ambiguous","input":"Show cheap stocks.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain threshold price-field and definition ambiguity","select no price bucket or current quote"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","no approved cheap-stock threshold","no price field or observation event","no accepted query mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Which price field should I use: entry, exit, average, candle, or another approved field?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask one field first; event, currency, threshold, definition, period, and applicability remain staged."},
  {"caseId":"C16-E6-19","caseType":"negative_example","input":"Show today's current quotes for the authorized watchlist without applying a historical price definition.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized watchlist current-quote request"],"expectedGroupings":[],"expectedOperators":["route explicit current-market quote grammar to a separate market-data owner if available","do not map current quotes to price_terms_vocabulary or historical trade classification"],"expectedComparison":null,"expectedTimeRange":"explicit current observation time","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate current-market-data availability contract","no historical entry exit average candle or bucket substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A current quote request is not automatically a sub-dollar, penny-stock, cheap, or low-priced historical classification."},
  {"caseId":"C16-E6-20","caseType":"unsupported_data","input":"Infer penny stocks from ticker names and another account's private bucket, then recommend which cheap stock I should buy.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["price_terms_vocabulary","penny_stocks_where_explicitly_defined"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject ticker-spelling inference","reject cross-account private-definition access","reject missing penny and cheap definition defaults","reject investment recommendation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no private labels notes raw IDs or cross-account definitions","approved effective price definition absent","no current quote fallback","chat runtime remains Planned"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Ticker names and another account's private bucket cannot establish an authorized price definition, and this inventory does not provide security recommendations.","notes":"Fail closed without exposing private definitions or inventing price thresholds."},
  {"caseId":"C16-E6-21","caseType":"selected_entity_context","input":"For the trusted selected trade, test accepted entry price below one USD after revalidating its exact entry event and currency.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["price_terms_vocabulary"],"expectedFilters":["selected trade accepted entry price strictly less than 1 USD"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","read only the accepted entry-price fact at entry","apply strict less than one if currency and coverage are compatible"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade entry event","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","accepted entry-price field event and USD currency","owner applicability and coverage","no raw trade account source or execution IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected identity supplies no missing price, event, currency, or definition facts."},
  {"caseId":"C16-E6-22","caseType":"cross_category","input":"Compare fee-complete net P and L inside versus outside my approved low-priced entry bucket, keeping price classification and currency results separate.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["price_terms_vocabulary","price_buckets","net_pnl"],"expectedFilters":["eligible ready_closed trades with covered accepted entry-price bucket membership and fee-complete net P/L"],"expectedGroupings":["inside approved low-priced entry bucket","outside approved low-priced entry bucket"],"expectedOperators":["classify with one approved bucket definition","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","compare compatible side-specific results without merging price and P/L units"],"expectedComparison":"fee-complete net_pnl inside versus outside the approved low-priced entry bucket","expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved entry-price bucket bounds endpoints currency applicability and version","known complement only over covered entry prices","ready_closed fee-complete compatible net P/L","side-specific sample missing and unavailable counts","no cause value or advice inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A supported association does not establish that low price caused performance or that a stock is cheap or desirable."}
]
~~~

## Evaluation Array C16-E7 -- user_tag_language

~~~json
[
  {"caseId":"C16-E7-01","caseType":"canonical","input":"Show authorized July trades explicitly associated with my active Opening Focus tag.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["explicit covered association to the active Opening Focus custom tag"],"expectedGroupings":[],"expectedOperators":["resolve one unique normalized exact active tag match","retrieve only records with explicit covered tag association"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized user workspace and Journal account scope","locale-compatible class-compatible current-version non-deprecated tag","collision-free exact match","explicit association and coverage","no note outcome ticker or similar-record inference","privacy-safe display without raw IDs or private definition text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognizing the tag definition and proving record membership remain separate checks; this case supplies both."},
  {"caseId":"C16-E7-02","caseType":"formal_paraphrase","input":"Explain whether the authorized current tag registry recognizes Opening Focus as one exact active label, without selecting records.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one active current-version non-deprecated class-compatible collision-free exact tag entry","report recognition state without testing associations"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized current tag registry version","exact-match and collision metadata","minimum privacy-safe typed result","no record population metric or association access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Definition recognition alone does not prove that any record carries the tag or that the tag performed well."},
  {"caseId":"C16-E7-03","caseType":"conversational_paraphrase","input":"How did my saved Opening Focus tag do on gross P and L last month, using only explicitly tagged ready-closed trades?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag","gross_pnl"],"expectedFilters":["explicit covered association to the resolved Opening Focus tag","eligible ready_closed trades"],"expectedGroupings":["resolved Opening Focus tag population"],"expectedOperators":["resolve the exact active tag","build the population from explicit covered associations","sum locked gross_pnl over eligible records","report association and metric coverage separately"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active locale-compatible tag version","explicit association coverage","eligible ready_closed gross_pnl facts","compatible currency partition","eligible excluded missing and unavailable counts","no quality cause or advice inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The metric is calculated only after recognition and explicit population construction."},
  {"caseId":"C16-E7-04","caseType":"trader_slang","input":"Pull my July gap-and-go tagged trades, where gap-and-go is the exact active alias saved for my tag.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["explicit covered association to the resolved gap-and-go tag alias"],"expectedGroupings":[],"expectedOperators":["resolve the trader-authored alias only through the authorized tag registry","retrieve explicit covered associations"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique exact active tag alias","current definition and alias versions","locale and class compatibility","no generic slang default","association coverage and privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader slang becomes tag language only because an authorized exact stored alias proves that meaning."},
  {"caseId":"C16-E7-05","caseType":"abbreviation","input":"Use OF as my tag only if the authorized registry confirms one current tag alias and no ticker or label-class collision.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["explicit covered association to the uniquely resolved OF tag alias"],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker and cross-class collision checks","accept only one exact active same-account tag candidate","retrieve covered associations after resolution"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short-token and ticker safety","unique locale-compatible class-compatible current alias","non-deprecated collision-free result","explicit association coverage","no bare-initial default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The explicit condition permits routing only after server-side safety gates pass."},
  {"caseId":"C16-E7-06","caseType":"misspelling","input":"Show trades with my Openng Focus tag last week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate Opening Focus as a fuzzy tag candidate only","leave tag identity and population unchanged until clarification"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware candidate generation","no fuzzy auto-route","no association or record access before confirmation","accepted query state unchanged","no candidate text leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Opening Focus tag?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A likely misspelling remains candidate-only and cannot silently select a private label."},
  {"caseId":"C16-E7-07","caseType":"noisy_input","input":"july trades... my exact Opening Focus tag only, covered assoc pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["explicit covered association to the exact active Opening Focus tag"],"expectedGroupings":[],"expectedOperators":["resolve the exact authorized tag despite harmless noise","retrieve explicitly associated records","report association coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current exact tag match","class locale version and deprecation checks","explicit association coverage","unknown associations kept separate","privacy-safe results"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise supplies no missing authorization, definition, or membership fact."},
  {"caseId":"C16-E7-08","caseType":"command","input":"Report association coverage for my exact active Opening Focus tag without calculating performance.","expectedPrimaryIntent":"inspect_data_quality","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the unique active tag","count explicit associated unknown and unavailable records","avoid metric calculation"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact active non-deprecated collision-free tag version","authorized candidate population","association coverage states","no raw record or label IDs","no outcome inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coverage inspection is not tag evaluation and does not classify unknown association as absent."},
  {"caseId":"C16-E7-09","caseType":"fragment","input":"Evaluate my Opening Focus tag by fee-complete net P and L this quarter, explicit associations only.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag","net_pnl"],"expectedFilters":["explicit covered association to the resolved Opening Focus tag","eligible ready_closed trades with fee-complete net P/L"],"expectedGroupings":["resolved Opening Focus tag population"],"expectedOperators":["resolve tag identity","construct the explicit associated eligible population","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report sample and coverage without assigning quality"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active current tag version","explicit association coverage","ready_closed fee-complete compatible currency facts","eligible denominator and limitations","no cause recommendation or future-edge claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The locked evaluate_label intent orchestrates an explicit metric; recognition itself does not supply evaluation."},
  {"caseId":"C16-E7-10","caseType":"follow_up","input":"For that trusted accepted tag query, keep the same tag version and show its covered ready-closed records.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["explicit covered association to the retained tag version","validated ready_closed records"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted tag account and version","revalidate current authorization and association coverage","retrieve covered records"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained typed tag reference and version","current authorization and provenance","explicit associations","no recency-only or prose-only context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up revalidates typed state and never trusts a raw label ID or nearby prose."},
  {"caseId":"C16-E7-11","caseType":"correction","input":"I meant my active Opening Focus tag, not the setup with the same words.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["explicit covered association to the corrected tag-class match"],"expectedGroupings":[],"expectedOperators":["replace the label class only after validation","resolve one exact current tag entry","rebuild population from tag associations rather than setup associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit tag class correction","unique active locale-compatible tag version","cross-class collision resolved","tag association coverage","prior setup interpretation remains unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A class correction changes neither stored labels nor historical associations."},
  {"caseId":"C16-E7-12","caseType":"comparison","input":"Compare gross P and L for explicitly associated Opening Focus versus Pullback Tag trades last month.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag","gross_pnl"],"expectedFilters":["eligible ready_closed records explicitly associated to either resolved tag"],"expectedGroupings":["Opening Focus associated trades","Pullback Tag associated trades"],"expectedOperators":["resolve both exact active tag versions independently","build side-specific explicit populations","sum gross_pnl per compatible side","compare with side-specific coverage"],"expectedComparison":"Opening Focus tag population versus Pullback Tag population","expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","two unique class-compatible nondeprecated tag matches","explicit side-specific associations","same ready_closed gross_pnl and currency basis","overlap handling declared","side-specific eligible unknown and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The comparison reports association, not mutual exclusivity, causation, or label quality."},
  {"caseId":"C16-E7-13","caseType":"ranking","input":"Rank my five authorized tags by explicitly associated ready-closed trade count this year using the approved tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["eligible ready_closed records with covered explicit tag associations"],"expectedGroupings":["five authorized resolved tags"],"expectedOperators":["resolve each active tag independently","count eligible explicit associations per tag","sort descending using approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive integer result limit five","unique active versions and collision checks","declared overlap handling","approved privacy-safe tie policy","per-tag association coverage and sample counts","no raw IDs or private definitions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking by count does not rank quality or recommend a tag."},
  {"caseId":"C16-E7-14","caseType":"negation","input":"Show covered July records not explicitly associated with my active Opening Focus tag; keep unknown association separate.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["known nonmembership in the resolved Opening Focus tag"],"expectedGroupings":[],"expectedOperators":["resolve the exact tag","apply nonmembership only where association coverage is known","exclude unknown association from both membership sets"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active tag version","authorized candidate population","complete per-record association state for known complement","unknown and unavailable counts","no missing-as-false default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not tagged is a known complement only over records with covered association state."},
  {"caseId":"C16-E7-15","caseType":"exclusion","input":"Exclude trades explicitly carrying my Opening Focus tag from the authorized result and report unknown tag coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["authorized population excluding explicit Opening Focus tag associations"],"expectedGroupings":[],"expectedOperators":["resolve the exact active tag","remove only proven associations","retain and report unknown association separately"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active tag version","explicit association facts","authorized base population","unknown and unavailable coverage","no mutation of stored tags"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Query exclusion is not a protected action to remove the tag from any record."},
  {"caseId":"C16-E7-16","caseType":"multi_filter","input":"Show authorized July long NVDA ready-closed trades explicitly associated with my active Opening Focus tag.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","validated ready_closed predicate","explicit covered Opening Focus tag association"],"expectedGroupings":[],"expectedOperators":["resolve the exact active tag","apply the validated predicate tree","retain association coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","unique current tag version","explicit association coverage","ticker token kept separate from label resolution","eligible and excluded counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker and outcome filters cannot infer the tag."},
  {"caseId":"C16-E7-17","caseType":"multi_part","input":"Confirm whether Opening Focus is my current tag, count its explicitly associated July trades, then evaluate fee-complete net P and L as separate results.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag","net_pnl"],"expectedFilters":["explicit covered association to the resolved tag","eligible ready_closed July records with fee-complete net P/L"],"expectedGroupings":["resolved Opening Focus tag population"],"expectedOperators":["report exact definition recognition","separately construct and count explicit associations","separately calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report label and metric coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated tag recognition","explicit association coverage","ready_closed fee-complete compatible currency facts","separate recognition population and evaluation states","no quality cause or advice inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The three requested stages must not be collapsed into one label match."},
  {"caseId":"C16-E7-18","caseType":"ambiguous","input":"Show my Opening Focus trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain tag-versus-setup class collision","select no label or population before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","same normalized alias exists in tag and setup classes","no trusted typed class context","accepted query state unchanged","no association access or private candidate disclosure"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean your saved tag or your saved setup?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify label class first; exact version, period, population, and metric remain staged."},
  {"caseId":"C16-E7-19","caseType":"negative_example","input":"Find July notes containing the words Opening Focus without treating the words as a saved tag.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized note-text search for the literal phrase if a separate owner permits it"],"expectedGroupings":[],"expectedOperators":["route explicit note search to a separate authorized note owner if available","do not resolve note text as user_tag_language or custom_tag membership"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate note-search availability and privacy contract","no tag registry or association inference","no broad model or log exposure of note text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Literal note wording is not tag evidence."},
  {"caseId":"C16-E7-20","caseType":"unsupported_data","input":"Copy another account's private Opening Focus tag onto my trades, infer it from notes, and say it caused my profits.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-label access","reject protected tag mutation","reject note-based association inference","reject causation claim"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no raw IDs private labels definitions or notes from another account","no explicit same-account association","no mutation authorization","no cause advice or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private label and note text cannot authorize a tag, create associations, or establish that the tag caused performance.","notes":"Fail closed without exposing private text or proposing a write workflow."},
  {"caseId":"C16-E7-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report whether it has an explicit covered association to my exact active Opening Focus tag.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag"],"expectedFilters":["selected trade explicit association to the resolved Opening Focus tag"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","resolve the exact active tag separately","read the explicit association state and coverage"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","unique current tag version","explicit association coverage","no raw trade account source label or association IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies identity only; it cannot supply tag membership."},
  {"caseId":"C16-E7-22","caseType":"cross_category","input":"Compare fee-complete net P and L for explicitly Opening Focus-tagged versus known-untagged ready-closed trades this quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_tag_language","custom_tag","net_pnl"],"expectedFilters":["eligible ready_closed trades with known Opening Focus association state and fee-complete net P/L"],"expectedGroupings":["explicitly associated Opening Focus trades","known nonassociated Opening Focus trades"],"expectedOperators":["resolve the exact active tag","build known membership and known complement populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible side-specific results"],"expectedComparison":"explicitly Opening Focus-tagged versus known-untagged populations","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active tag version","covered association state with unknown excluded from both sides","ready_closed fee-complete compatible currency facts","side-specific samples missing and unavailable counts","no cause quality recommendation or mutation inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A supported association comparison does not prove that the tag caused the P/L difference."}
]
~~~

## Evaluation Array C16-E8 -- user_setup_language

~~~json
[
  {"caseId":"C16-E8-01","caseType":"canonical","input":"Show July trades explicitly associated with my active First Green Day Breakout setup.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["explicit covered association to the active First Green Day Breakout setup"],"expectedGroupings":[],"expectedOperators":["resolve one unique normalized exact active setup match","retrieve only records with explicit covered setup association"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized user workspace and Journal account scope","locale-compatible class-compatible current-version non-deprecated setup","collision-free exact match","explicit setup association and coverage","no chart outcome ticker note or pattern inference","privacy-safe display without raw IDs or private definition text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The setup definition and the record association are separately required facts."},
  {"caseId":"C16-E8-02","caseType":"formal_paraphrase","input":"Determine whether First Green Day Breakout is one authorized exact active setup entry, without inferring any trade association.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one active current-version non-deprecated class-compatible collision-free exact setup entry","report recognition without building a trade population"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized current setup registry version","exact-match and collision metadata","minimum privacy-safe typed result","no chart association metric or evaluation inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognizing a stored setup name does not prove that any trade used the setup."},
  {"caseId":"C16-E8-03","caseType":"conversational_paraphrase","input":"How did my saved FGD setup perform on gross P and L last month, using only explicitly associated ready-closed trades?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup","gross_pnl"],"expectedFilters":["explicit covered association to the resolved FGD setup","eligible ready_closed trades"],"expectedGroupings":["resolved FGD setup population"],"expectedOperators":["resolve the authorized exact setup alias","construct the population from explicit covered setup facts","sum locked gross_pnl over eligible records","report association and metric coverage separately"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","FGD ticker abbreviation and generic-green collision checks","unique active current setup version","explicit association coverage","eligible ready_closed gross_pnl facts","compatible currency and sample counts","no setup-quality cause or advice inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Performance is downstream of exact setup resolution and explicit association, never inferred from the alias."},
  {"caseId":"C16-E8-04","caseType":"trader_slang","input":"Pull my first-green breakout setup trades for the authorized week, where that phrase is my exact active saved alias.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["explicit covered association to the resolved first-green breakout setup alias"],"expectedGroupings":[],"expectedOperators":["resolve trader wording only through the same-account active setup registry","retrieve explicit covered setup associations"],"expectedComparison":null,"expectedTimeRange":"authorized week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique normalized exact active setup alias","current definition and alias versions","generic outcome and pattern collision checks","explicit association coverage","no global slang default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"First-green wording is setup language only when the authorized stored alias proves it."},
  {"caseId":"C16-E8-05","caseType":"abbreviation","input":"Use FGD as my setup only after confirming one current authorized setup alias and no ticker, generic-green, or label-class collision.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["explicit covered association to the uniquely resolved FGD setup alias"],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker generic-term and cross-class collision checks","accept only one exact active same-account setup candidate","retrieve covered associations after resolution"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","FGD token safety","unique locale-compatible current non-deprecated setup alias","collision-free class-compatible result","explicit setup association coverage","no global FGD reservation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"FGD routes only if every declared safety gate succeeds."},
  {"caseId":"C16-E8-06","caseType":"misspelling","input":"Show my First Gren Day Breakout setup trades for the prior month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate First Green Day Breakout as a fuzzy setup candidate only","leave setup identity and population unchanged pending clarification"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no setup association or record access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved First Green Day Breakout setup?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A misspelled private setup remains a candidate and never becomes a fact automatically."},
  {"caseId":"C16-E8-07","caseType":"noisy_input","input":"july fgd setup trades... exact saved one, assoc coverage pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["explicit covered association to the resolved FGD setup"],"expectedGroupings":[],"expectedOperators":["resolve the exact authorized FGD setup after safety checks","retrieve explicitly associated records","report setup coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","FGD ticker generic and class collision checks","unique current exact setup version","explicit association coverage","unknown associations separate","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy wording cannot waive FGD safety or association evidence."},
  {"caseId":"C16-E8-08","caseType":"command","input":"Report setup-association coverage for my exact active FGD version without judging its performance.","expectedPrimaryIntent":"inspect_data_quality","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the unique active setup version","count explicit associated unknown and unavailable records","avoid metric or quality evaluation"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","FGD safety checks","exact active non-deprecated collision-free setup","authorized candidate population","association coverage states","no raw IDs private definition chart inference or outcome judgment"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coverage reporting does not establish setup quality or future edge."},
  {"caseId":"C16-E8-09","caseType":"fragment","input":"Evaluate my FGD setup by fee-complete net P and L this quarter, explicit associations only.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup","net_pnl"],"expectedFilters":["explicit covered association to the resolved FGD setup","eligible ready_closed trades with fee-complete net P/L"],"expectedGroupings":["resolved FGD setup population"],"expectedOperators":["resolve the exact authorized setup","construct the explicit associated eligible population","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report samples and coverage without a quality verdict"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","FGD abbreviation and collision safety","unique active setup version","explicit association coverage","ready_closed fee-complete compatible currency facts","eligible denominator and limitations","no cause recommendation or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"evaluate_label coordinates a declared metric and never infers setup quality from its name."},
  {"caseId":"C16-E8-10","caseType":"follow_up","input":"For that trusted accepted setup query, retain the same historical FGD version and show its covered records.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["explicit covered association to the retained historical FGD setup version"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted setup account and version","revalidate authorization and effective version","retrieve covered associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained typed setup reference and effective version","current authorization and provenance","explicit associations","no recency-only prose or raw-ID context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up may retain an accepted historical version but must not substitute today's changed meaning."},
  {"caseId":"C16-E8-11","caseType":"correction","input":"I meant my FGD setup alias, not a ticker symbol or a green-day outcome.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["explicit covered association to the corrected FGD setup match"],"expectedGroupings":[],"expectedOperators":["replace the token class only after validation","resolve one exact current setup alias","build the population from explicit setup facts"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit setup-class correction","unique active locale-compatible FGD alias","ticker and generic-outcome collisions resolved","setup association coverage","prior interpretation unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The correction cannot create the alias or infer setup membership."},
  {"caseId":"C16-E8-12","caseType":"comparison","input":"Compare gross P and L for explicitly associated FGD versus Morning Pullback setup trades last month.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup","gross_pnl"],"expectedFilters":["eligible ready_closed records explicitly associated to either resolved setup"],"expectedGroupings":["FGD associated trades","Morning Pullback associated trades"],"expectedOperators":["resolve both exact active setup versions independently","build side-specific explicit populations","sum gross_pnl per compatible side","compare with side-specific coverage"],"expectedComparison":"FGD setup population versus Morning Pullback setup population","expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","two unique nondeprecated setup matches","FGD token safety","explicit side-specific setup facts","same ready_closed gross_pnl and currency basis","overlap handling and side-specific counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparing explicit setup populations does not prove either setup caused performance."},
  {"caseId":"C16-E8-13","caseType":"ranking","input":"Rank my four authorized setups by explicitly associated ready-closed trade count this year using approved privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["eligible ready_closed records with covered explicit setup associations"],"expectedGroupings":["four authorized resolved setups"],"expectedOperators":["resolve each active setup independently","count eligible explicit associations per setup","sort descending using approved tie policy"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive integer result limit four","unique active versions and collision checks","declared overlap handling","approved privacy-safe tie policy","per-setup coverage and sample counts","no raw IDs or private definitions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A count ranking provides no setup recommendation or quality score."},
  {"caseId":"C16-E8-14","caseType":"negation","input":"Show covered July records not explicitly associated with my active FGD setup; keep unknown setup coverage separate.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["known nonmembership in the resolved FGD setup"],"expectedGroupings":[],"expectedOperators":["resolve the exact setup after FGD safety checks","apply nonmembership only where setup coverage is known","exclude unknown association from both sets"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active FGD setup version","authorized candidate population","complete per-record setup association state for known complement","unknown and unavailable counts","no missing-as-false default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not FGD means proven nonmembership only, not lack of chart resemblance."},
  {"caseId":"C16-E8-15","caseType":"exclusion","input":"Exclude trades explicitly carrying my FGD setup from the authorized result and report unknown setup coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["authorized population excluding explicit FGD setup associations"],"expectedGroupings":[],"expectedOperators":["resolve the exact active setup","remove only proven associations","retain and report unknown association separately"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","FGD ticker and class safety","unique active setup version","explicit association facts","authorized base population and coverage","no mutation of stored setup labels"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Filtering out a setup is not permission to detach or delete its associations."},
  {"caseId":"C16-E8-16","caseType":"multi_filter","input":"Show authorized July long NVDA ready-closed trades explicitly associated with my active FGD setup.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","validated ready_closed predicate","explicit covered FGD setup association"],"expectedGroupings":[],"expectedOperators":["resolve the exact active setup after FGD safety checks","apply the validated predicate tree","retain setup association coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","unique current FGD setup version","explicit association coverage","NVDA ticker kept separate from FGD alias resolution","eligible and excluded counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker direction and outcome cannot infer FGD setup membership."},
  {"caseId":"C16-E8-17","caseType":"multi_part","input":"Confirm FGD is my current setup, count explicitly associated July trades, then evaluate gross P and L as separate results.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup","gross_pnl"],"expectedFilters":["explicit covered association to the resolved FGD setup","eligible ready_closed July records"],"expectedGroupings":["resolved FGD setup population"],"expectedOperators":["report exact setup definition recognition after FGD safety checks","separately construct and count explicit associations","separately sum gross_pnl over eligible records","report setup and metric coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated setup recognition","explicit association coverage","ready_closed compatible gross_pnl and currency facts","separate recognition population and evaluation states","no chart inference quality cause or advice claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The requested recognition, membership count, and evaluation remain distinct outputs."},
  {"caseId":"C16-E8-18","caseType":"ambiguous","input":"Show my FGD trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain setup ticker generic-green and label-class collisions","select no entity label or population before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short uppercase token with multiple compatible meanings","no trusted typed setup context","accepted query state unchanged","no association access or private candidate disclosure"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Does FGD mean one of your saved label classes, a ticker, or the generic first-green-day phrase?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify the token class first. Only if the user selects saved labels and a collision remains, ask a second privacy-safe class question among authorized saved setup, tag, or strategy candidates; exact version, period, association, and metric remain staged."},
  {"caseId":"C16-E8-19","caseType":"negative_example","input":"Find July charts with a first green day breakout pattern without using any saved setup label.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized July chart-pattern request if a separate factual owner supports it"],"expectedGroupings":[],"expectedOperators":["route explicit chart-pattern analysis to a separate approved owner if available","do not map visual resemblance to user_setup_language or setup association"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate candle or chart-pattern availability contract","no saved setup registry use","no screenshot note result or price-action association inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A factual chart pattern is not an explicit trader-authored setup association."},
  {"caseId":"C16-E8-20","caseType":"unsupported_data","input":"Infer FGD setups from green candles, copy another account's private definition, apply it to my trades, and recommend it.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject chart-based setup inference","reject cross-account private-definition access","reject protected setup mutation","reject recommendation and future-edge claim"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no raw IDs private definitions screenshots or notes from another account","no explicit same-account setup association","no mutation authorization","no advice prediction cause or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Candles and another account's private setup cannot establish an authorized FGD association, authorize applying it, or support a recommendation.","notes":"Fail closed without exposing private setup text or creating a write path."},
  {"caseId":"C16-E8-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report whether it has an explicit covered association to my exact active FGD setup.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup"],"expectedFilters":["selected trade explicit association to the resolved FGD setup"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","resolve FGD separately through ticker and class safety","read explicit setup association and coverage"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","unique active FGD setup version","explicit setup association coverage","no raw trade account source setup or association IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The selected chart and outcome do not establish FGD membership."},
  {"caseId":"C16-E8-22","caseType":"cross_category","input":"Compare fee-complete net P and L for explicitly FGD-associated versus explicitly Morning Pullback-associated ready-closed trades this quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_setup_language","setup","net_pnl"],"expectedFilters":["eligible ready_closed trades explicitly associated to either resolved setup and with fee-complete net P/L"],"expectedGroupings":["explicit FGD setup population","explicit Morning Pullback setup population"],"expectedOperators":["resolve both exact active setup versions","build side-specific explicit association populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible side-specific results"],"expectedComparison":"explicit FGD setup population versus explicit Morning Pullback setup population","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","FGD token safety and unique setup versions","explicit side-specific association coverage","ready_closed fee-complete compatible currency facts","overlap handling and side-specific samples","no cause quality recommendation mutation or chart inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Association-based comparison does not prove either setup created the result."}
]
~~~

## Evaluation Array C16-E9 -- user_strategy_language

~~~json
[
  {"caseId":"C16-E9-01","caseType":"canonical","input":"Show July trades explicitly associated with my active Opening Momentum strategy.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["explicit covered association to the active Opening Momentum strategy"],"expectedGroupings":[],"expectedOperators":["resolve one unique normalized exact active strategy match","retrieve only records with explicit covered strategy association"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized user workspace and Journal account scope","locale-compatible class-compatible current-version non-deprecated strategy","collision-free exact match","explicit strategy association and coverage","no ticker result setup playbook note or chart inference","privacy-safe display without raw IDs or private definition text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Strategy recognition and explicit record association remain independent facts."},
  {"caseId":"C16-E9-02","caseType":"formal_paraphrase","input":"Explain whether Opening Momentum resolves to one authorized exact active strategy entry, without selecting a population.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one active current-version non-deprecated class-compatible collision-free exact strategy entry","report recognition without testing record associations"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized current strategy registry version","exact-match and collision metadata","minimum privacy-safe typed result","no record population metric or evaluation access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A recognized strategy definition does not imply any associated trade or performance."},
  {"caseId":"C16-E9-03","caseType":"conversational_paraphrase","input":"How did my saved Opening Momentum strategy do on gross P and L last month, using explicitly associated ready-closed trades only?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy","gross_pnl"],"expectedFilters":["explicit covered association to the resolved Opening Momentum strategy","eligible ready_closed trades"],"expectedGroupings":["resolved Opening Momentum strategy population"],"expectedOperators":["resolve the exact active strategy","construct the population from explicit covered strategy facts","sum locked gross_pnl over eligible records","report association and metric coverage separately"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active current strategy version","explicit association coverage","eligible ready_closed gross_pnl facts","compatible currency partition","eligible excluded missing and unavailable counts","no quality cause or advice inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Strategy performance is downstream of exact resolution and explicit population construction."},
  {"caseId":"C16-E9-04","caseType":"trader_slang","input":"Pull my open-drive strategy trades for the authorized week, where open-drive is my exact active saved strategy alias.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["explicit covered association to the resolved open-drive strategy alias"],"expectedGroupings":[],"expectedOperators":["resolve trader wording only through the active same-account strategy registry","retrieve explicit covered strategy associations"],"expectedComparison":null,"expectedTimeRange":"authorized week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique normalized exact active strategy alias","current definition and alias versions","generic phrase setup playbook and ticker collision checks","explicit association coverage","no global slang default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A trader phrase is strategy language only when the authorized registry proves the stored meaning."},
  {"caseId":"C16-E9-05","caseType":"abbreviation","input":"Use OM as my strategy only if one current authorized strategy alias remains after ticker and label-class collision checks.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["explicit covered association to the uniquely resolved OM strategy alias"],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker generic-term and cross-class collision checks","accept only one exact active same-account strategy candidate","retrieve covered associations after resolution"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short-token and ticker safety","unique locale-compatible current non-deprecated strategy alias","collision-free class-compatible result","explicit strategy association coverage","no bare-initial default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The short alias is accepted only after all exact-match safety gates succeed."},
  {"caseId":"C16-E9-06","caseType":"misspelling","input":"Show my Opening Momemtum strategy trades for the prior month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate Opening Momentum as a fuzzy strategy candidate only","leave strategy identity and population unchanged pending clarification"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no strategy association or record access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Opening Momentum strategy?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Misspelling similarity cannot establish private strategy identity."},
  {"caseId":"C16-E9-07","caseType":"noisy_input","input":"july OM strat trades... exact saved one, assoc coverage pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["explicit covered association to the resolved OM strategy"],"expectedGroupings":[],"expectedOperators":["resolve the exact authorized strategy after short-token safety checks","retrieve explicitly associated records","report strategy coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","ticker generic and class collision checks","unique current exact strategy version","explicit association coverage","unknown associations separate","privacy-safe output"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise grants no shortcut around exact strategy and association requirements."},
  {"caseId":"C16-E9-08","caseType":"command","input":"Report association coverage for my exact active Opening Momentum strategy without calculating results.","expectedPrimaryIntent":"inspect_data_quality","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the unique active strategy","count explicit associated unknown and unavailable records","avoid metric or quality evaluation"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact active non-deprecated collision-free strategy version","authorized candidate population","association coverage states","no raw IDs private definition note or outcome inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coverage reporting does not evaluate strategy quality."},
  {"caseId":"C16-E9-09","caseType":"fragment","input":"Evaluate my Opening Momentum strategy by fee-complete net P and L this quarter, explicit associations only.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy","net_pnl"],"expectedFilters":["explicit covered association to the resolved Opening Momentum strategy","eligible ready_closed trades with fee-complete net P/L"],"expectedGroupings":["resolved Opening Momentum strategy population"],"expectedOperators":["resolve the exact authorized strategy","construct the explicit associated eligible population","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report samples and coverage without a quality verdict"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active strategy version","explicit association coverage","ready_closed fee-complete compatible currency facts","eligible denominator and limitations","no cause recommendation prediction or future-edge claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"evaluate_label uses a declared owner metric and does not infer value from the strategy name."},
  {"caseId":"C16-E9-10","caseType":"follow_up","input":"For that trusted accepted strategy query, keep the same effective version and show its covered ready-closed records.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["explicit covered association to the retained strategy version","validated ready_closed records"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted strategy account and version","revalidate current authorization and effective version","retrieve covered associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained typed strategy reference and version","current authorization and provenance","explicit associations","no recency-only prose or raw-ID context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An accepted effective version is revalidated and never silently replaced by today's meaning."},
  {"caseId":"C16-E9-11","caseType":"correction","input":"I meant my Opening Momentum strategy, not the setup or playbook with the same alias.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["explicit covered association to the corrected strategy-class match"],"expectedGroupings":[],"expectedOperators":["replace the label class only after validation","resolve one exact current strategy entry","rebuild the population from strategy associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit strategy class correction","unique active locale-compatible strategy version","setup and playbook collisions resolved","strategy association coverage","prior interpretation unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Changing the interpretation class performs no label or association mutation."},
  {"caseId":"C16-E9-12","caseType":"comparison","input":"Compare gross P and L for explicitly associated Opening Momentum versus Trend Continuation strategy trades last month.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy","gross_pnl"],"expectedFilters":["eligible ready_closed records explicitly associated to either resolved strategy"],"expectedGroupings":["Opening Momentum associated trades","Trend Continuation associated trades"],"expectedOperators":["resolve both exact active strategy versions independently","build side-specific explicit populations","sum gross_pnl per compatible side","compare with side-specific coverage"],"expectedComparison":"Opening Momentum strategy population versus Trend Continuation strategy population","expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","two unique nondeprecated strategy matches","explicit side-specific strategy facts","same ready_closed gross_pnl and currency basis","overlap handling declared","side-specific eligible unknown and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An observed difference does not establish causal strategy quality."},
  {"caseId":"C16-E9-13","caseType":"ranking","input":"Rank my three authorized strategies by explicitly associated ready-closed trade count this year using approved privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["eligible ready_closed records with covered explicit strategy associations"],"expectedGroupings":["three authorized resolved strategies"],"expectedOperators":["resolve each active strategy independently","count eligible explicit associations per strategy","sort descending using approved tie policy"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive integer result limit three","unique active versions and collision checks","declared overlap handling","approved privacy-safe tie policy","per-strategy association coverage and sample counts","no raw IDs or private definitions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count order is not a strategy recommendation or profitability rank."},
  {"caseId":"C16-E9-14","caseType":"negation","input":"Show covered July records not explicitly associated with my active Opening Momentum strategy; keep unknown coverage separate.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["known nonmembership in the resolved Opening Momentum strategy"],"expectedGroupings":[],"expectedOperators":["resolve the exact active strategy","apply nonmembership only where strategy coverage is known","exclude unknown association from both sets"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active strategy version","authorized candidate population","complete per-record strategy association state for known complement","unknown and unavailable counts","no missing-as-false default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not associated is a covered fact, not an inference from ticker, setup, playbook, or outcome."},
  {"caseId":"C16-E9-15","caseType":"exclusion","input":"Exclude trades explicitly carrying my Opening Momentum strategy from the authorized result and report unknown strategy coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["authorized population excluding explicit Opening Momentum strategy associations"],"expectedGroupings":[],"expectedOperators":["resolve the exact active strategy","remove only proven associations","retain and report unknown association separately"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active strategy version","explicit association facts","authorized base population","unknown and unavailable coverage","no mutation of stored strategy labels"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Query exclusion does not detach, rename, or delete a strategy."},
  {"caseId":"C16-E9-16","caseType":"multi_filter","input":"Show authorized July long NVDA ready-closed trades explicitly associated with my active Opening Momentum strategy.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","validated ready_closed predicate","explicit covered Opening Momentum strategy association"],"expectedGroupings":[],"expectedOperators":["resolve the exact active strategy","apply the validated predicate tree","retain strategy association coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","unique current strategy version","explicit association coverage","ticker and direction kept separate from strategy resolution","eligible and excluded counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker, direction, duration, and outcome cannot infer a strategy."},
  {"caseId":"C16-E9-17","caseType":"multi_part","input":"Confirm Opening Momentum is my current strategy, count explicitly associated July trades, then evaluate fee-complete net P and L separately.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy","net_pnl"],"expectedFilters":["explicit covered association to the resolved strategy","eligible ready_closed July records with fee-complete net P/L"],"expectedGroupings":["resolved Opening Momentum strategy population"],"expectedOperators":["report exact definition recognition","separately construct and count explicit associations","separately calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report strategy and metric coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated strategy recognition","explicit association coverage","ready_closed fee-complete compatible currency facts","separate recognition population and evaluation states","no quality cause advice or prediction claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognition, population count, and evaluation are three separate requested outputs."},
  {"caseId":"C16-E9-18","caseType":"ambiguous","input":"Show my Opening Momentum trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain strategy setup playbook and tag class collisions","select no label or population before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","same normalized alias exists in multiple label classes","no trusted typed class context","accepted query state unchanged","no association access or private candidate disclosure"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean your saved strategy, setup, playbook, or tag?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify class first; exact version, period, association, and metric remain staged."},
  {"caseId":"C16-E9-19","caseType":"negative_example","input":"Group July trades by ticker momentum without treating momentum as my saved strategy.","expectedPrimaryIntent":"group_and_aggregate","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["authorized July records"],"expectedGroupings":["a separately supported factual ticker-momentum grouping if one exists"],"expectedOperators":["route explicit factual grouping to its own approved owner if available","do not map generic momentum wording to user_strategy_language or strategy association"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate factual grouping definition and coverage","no strategy registry use","no association inference from ticker candles results or wording"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Generic market-description language is not a private strategy fact."},
  {"caseId":"C16-E9-20","caseType":"unsupported_data","input":"Copy another account's private Opening Momentum strategy, infer it from winners, apply it to my trades, and recommend it.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-definition access","reject outcome-based strategy inference","reject protected strategy mutation","reject recommendation and future-edge claim"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no raw IDs private definitions notes or associations from another account","no explicit same-account strategy association","no mutation authorization","no advice prediction cause or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private strategy and winning outcomes cannot establish an authorized association, authorize applying it, or support a recommendation.","notes":"Fail closed without exposing private text or creating a write workflow."},
  {"caseId":"C16-E9-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report whether it has an explicit covered association to my exact active Opening Momentum strategy.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy"],"expectedFilters":["selected trade explicit association to the resolved Opening Momentum strategy"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","resolve the exact active strategy separately","read explicit strategy association and coverage"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","unique active strategy version","explicit strategy association coverage","no raw trade account source strategy or association IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected ticker, setup, result, and chart cannot establish strategy membership."},
  {"caseId":"C16-E9-22","caseType":"cross_category","input":"Compare fee-complete net P and L for explicitly Opening Momentum-associated versus Trend Continuation-associated ready-closed trades this quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_strategy_language","strategy","net_pnl"],"expectedFilters":["eligible ready_closed trades explicitly associated to either resolved strategy and with fee-complete net P/L"],"expectedGroupings":["explicit Opening Momentum strategy population","explicit Trend Continuation strategy population"],"expectedOperators":["resolve both exact active strategy versions","build side-specific explicit association populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible side-specific results"],"expectedComparison":"explicit Opening Momentum strategy population versus explicit Trend Continuation strategy population","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active strategy versions","explicit side-specific association coverage","ready_closed fee-complete compatible currency facts","overlap handling and side-specific samples","no cause quality recommendation mutation or inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A supported association comparison proves neither causation nor future strategy edge."}
]
~~~

## Evaluation Array C16-E10 -- user_rule_language

~~~json
[
  {"caseId":"C16-E10-01","caseType":"canonical","input":"Show authorized July trades explicitly associated with my active No Chase rule, without assuming whether it applied or was followed.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language","rule"],"expectedFilters":["explicit covered association to the active No Chase rule"],"expectedGroupings":[],"expectedOperators":["resolve one unique normalized exact active rule match","retrieve only records with explicit covered rule association","leave applicability adherence and violation unclassified"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized user workspace and Journal account scope","locale-compatible class-compatible current-version non-deprecated rule","collision-free exact match","explicit rule association and coverage","no applicability adherence violation loss note or chart inference","privacy-safe display without raw IDs or private definition text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Rule identity and association do not imply that the rule applied, was followed, or was broken."},
  {"caseId":"C16-E10-02","caseType":"formal_paraphrase","input":"Explain whether No Chase resolves to one authorized exact active rule definition, without examining trades or compliance.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one active current-version non-deprecated class-compatible collision-free exact rule entry","report definition recognition without testing association applicability adherence or violation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized current rule registry version","exact-match and collision metadata","minimum privacy-safe typed result","no record population compliance evaluation or private text access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Definition recognition is separate from every record-level rule fact."},
  {"caseId":"C16-E10-03","caseType":"conversational_paraphrase","input":"How often did I follow my saved No Chase rule last month among trades where it was explicitly applicable and adherence was covered?","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed","rule_broken"],"expectedFilters":["explicit covered applicability of the resolved No Chase rule","covered explicit followed or violated status"],"expectedGroupings":["followed No Chase","violated No Chase"],"expectedOperators":["resolve the exact active rule","construct only the explicitly applicable covered population","count followed and violated records separately","calculate adherence rate with the covered applicable denominator"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active rule version","explicit association applicability and adherence coverage","nonzero covered applicable denominator","sample excluded unknown and unavailable counts","no outcome note or chart inference","no cause advice or future-performance claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Only explicit applicability and adherence evidence supports rule evaluation."},
  {"caseId":"C16-E10-04","caseType":"trader_slang","input":"Pull my July no-chasing-rule trades, where no-chasing is the exact active alias saved for my rule.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language","rule"],"expectedFilters":["explicit covered association to the resolved no-chasing rule alias"],"expectedGroupings":[],"expectedOperators":["resolve trader wording only through the authorized rule registry","retrieve explicit covered rule associations","make no compliance classification"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique normalized exact active rule alias","current definition and alias versions","generic phrase and cross-class collision checks","association coverage","no global slang default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader wording becomes rule language only because the authorized registry proves the stored alias."},
  {"caseId":"C16-E10-05","caseType":"abbreviation","input":"Treat NC as a possible rule abbreviation, but ask before using it even if one current authorized alias survives collision checks.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker generic-term and cross-class collision checks","generate the surviving NC rule alias as a candidate only","leave rule identity association and compliance unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short-token and ticker safety","locale-compatible current non-deprecated rule alias candidate","class collision checks","no abbreviation auto-route","no association applicability adherence or data access before confirmation","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved No Chase rule?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short abbreviation remains candidate-only even when one authorized registry candidate survives."},
  {"caseId":"C16-E10-06","caseType":"misspelling","input":"Show trades associated with my No Chsae rule for the prior month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate No Chase as a fuzzy rule candidate only","leave rule identity population and compliance unchanged pending clarification"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no rule association applicability or adherence access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved No Chase rule?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fuzzy spelling candidate cannot establish private rule identity or compliance."},
  {"caseId":"C16-E10-07","caseType":"noisy_input","input":"july NC rule trades... saved one maybe, assoc only, dont call broken","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run short-token ticker generic and class collision checks","generate No Chase as a rule candidate only","leave the July population association and adherence unexecuted pending confirmation"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware abbreviation candidate generation","no short-form auto-route","no association applicability adherence or record access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved No Chase rule?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise and an apparent single short-form candidate do not authorize rule routing."},
  {"caseId":"C16-E10-08","caseType":"command","input":"Report applicability and adherence coverage for my exact active No Chase rule without judging performance.","expectedPrimaryIntent":"inspect_data_quality","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed","rule_broken"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the unique active rule","count associated applicable nonapplicable followed violated unknown and unavailable states separately","avoid performance or causal evaluation"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact active non-deprecated collision-free rule version","authorized candidate population","separate association applicability and adherence coverage states","no raw IDs private definition notes outcomes or chart inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coverage reporting is not a verdict that the rule was good, applicable, followed, or broken."},
  {"caseId":"C16-E10-09","caseType":"fragment","input":"Evaluate my No Chase rule this quarter by explicit covered adherence rate, applicable trades only.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed","rule_broken"],"expectedFilters":["explicitly applicable records with covered No Chase adherence state"],"expectedGroupings":["followed No Chase","violated No Chase"],"expectedOperators":["resolve the exact authorized rule","count explicit followed states over the covered applicable denominator","report sample and coverage limitations without a quality verdict"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active rule version","explicit applicability and adherence facts","nonzero covered applicable denominator","eligible excluded missing and unavailable counts","no loss note repeat or chart inference","no cause advice or prediction"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"evaluate_rule uses declared covered rule facts, not a semantic guess from the rule name."},
  {"caseId":"C16-E10-10","caseType":"follow_up","input":"For that trusted accepted rule query, keep the same effective version and show only records with covered explicit applicability.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule"],"expectedFilters":["explicit covered applicability of the retained rule version"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted rule account and version","revalidate current authorization and effective version","retrieve applicable records without inferring adherence"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained typed rule reference and version","current authorization and provenance","explicit applicability coverage","no recency-only prose or raw-ID context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A retained rule version is revalidated and applicability still does not imply adherence."},
  {"caseId":"C16-E10-11","caseType":"correction","input":"I meant my No Chase rule, not the tag or playbook with the same alias; keep compliance unclassified.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language","rule"],"expectedFilters":["explicit covered association to the corrected rule-class match"],"expectedGroupings":[],"expectedOperators":["replace the label class only after validation","resolve one exact current rule entry","rebuild the population from explicit rule associations","preserve unknown applicability and adherence"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit rule class correction","unique active locale-compatible rule version","tag and playbook collisions resolved","rule association coverage","prior interpretation unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Correcting the interpretation class performs no label mutation and supplies no compliance fact."},
  {"caseId":"C16-E10-12","caseType":"comparison","input":"Compare fee-complete net P and L for explicitly followed versus explicitly violated No Chase trades last month, among covered applicable records.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_rule","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed","rule_broken","net_pnl"],"expectedFilters":["explicit applicable covered No Chase records with followed or violated status","eligible ready_closed fee-complete net P/L"],"expectedGroupings":["explicitly followed No Chase","explicitly violated No Chase"],"expectedOperators":["resolve the exact active rule","build side-specific explicit adherence populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible side-specific results"],"expectedComparison":"explicitly followed versus explicitly violated No Chase populations","expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active rule version","explicit applicability and adherence coverage","ready_closed fee-complete compatible currency facts","overlap impossible under one covered status contract","side-specific samples missing and unavailable counts","no causation or advice inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A performance difference does not prove that following or breaking the rule caused the result."},
  {"caseId":"C16-E10-13","caseType":"ranking","input":"Rank my three authorized rules by explicit covered violation count this year using approved privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["evaluate_rule","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_broken"],"expectedFilters":["explicitly applicable records with covered violated status"],"expectedGroupings":["three authorized resolved rules"],"expectedOperators":["resolve each active rule independently","count explicit covered violations per rule","sort descending using approved tie policy"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive integer result limit three","unique active versions and collision checks","explicit applicability and adherence coverage","approved privacy-safe tie policy","per-rule applicable samples and unknown counts","no raw IDs or private definitions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Violation count order is not a causal quality ranking or recommendation."},
  {"caseId":"C16-E10-14","caseType":"negation","input":"Show covered July records where my active No Chase rule was explicitly not applicable; do not treat them as followed.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule"],"expectedFilters":["explicit covered nonapplicability of the resolved No Chase rule"],"expectedGroupings":[],"expectedOperators":["resolve the exact active rule","select only proven nonapplicable records","exclude unknown applicability from both sets","make no adherence classification"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active rule version","authorized candidate population","complete applicability state for known complement","unknown and unavailable counts","nonapplicable is not followed or violated"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Explicit nonapplicability and compliance are distinct rule states."},
  {"caseId":"C16-E10-15","caseType":"exclusion","input":"Exclude records explicitly associated with my No Chase rule from the authorized result and report unknown association coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule"],"expectedFilters":["authorized population excluding explicit No Chase rule associations"],"expectedGroupings":[],"expectedOperators":["resolve the exact active rule","remove only proven associations","retain and report unknown association separately"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active rule version","explicit association facts","authorized base population","unknown and unavailable coverage","no mutation of stored rule definitions or assignments"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Query exclusion neither deletes a rule nor classifies applicability, adherence, or violation."},
  {"caseId":"C16-E10-16","caseType":"multi_filter","input":"Show authorized July long NVDA ready-closed trades where my active No Chase rule was explicitly applicable and followed.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["evaluate_rule"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","validated ready_closed predicate","explicit covered No Chase applicability","explicit covered followed status"],"expectedGroupings":[],"expectedOperators":["resolve the exact active rule","apply the validated predicate tree","retain separate applicability and adherence coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","unique current rule version","explicit applicability and adherence facts","ticker direction outcome and chart kept separate from rule resolution","eligible excluded and unknown counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker, direction, lifecycle, and result cannot infer a rule state."},
  {"caseId":"C16-E10-17","caseType":"multi_part","input":"Confirm No Chase is my current rule, count explicit July associations, then report applicability and adherence separately.","expectedPrimaryIntent":"evaluate_rule","expectedSecondaryIntents":["retrieve_records","inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed","rule_broken"],"expectedFilters":["explicit covered association to the resolved rule","covered applicability and adherence states for authorized July records"],"expectedGroupings":["associated","applicable","followed","violated"],"expectedOperators":["report exact definition recognition","separately construct and count explicit associations","separately count applicable nonapplicable followed violated and unknown states","report each coverage denominator"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated rule recognition","explicit association applicability and adherence coverage","separate recognition association applicability and evaluation states","no missing-as-false default","no quality cause advice or prediction claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The four requested rule stages remain separate outputs."},
  {"caseId":"C16-E10-18","caseType":"ambiguous","input":"Show my No Chase trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain rule tag and playbook class collisions","retain association applicability and adherence ambiguity","select no label population or compliance state before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","same normalized alias exists in multiple label classes","no trusted typed class context","accepted query state unchanged","no association compliance or private candidate access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean your saved rule, tag, or playbook?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify the label class first; rule version, association, applicability, adherence, period, and metric remain staged."},
  {"caseId":"C16-E10-19","caseType":"negative_example","input":"Show losing July trades without treating a loss as proof that any rule was broken.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["eligible losing July records under a separately approved P/L owner"],"expectedGroupings":[],"expectedOperators":["route explicit loss filtering to its metric owner","do not map loss to user_rule_language rule applicability or violation"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate exact loss metric basis and coverage","no rule registry or compliance inference","no cause or advice claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Outcome is not evidence that a rule existed, applied, or was violated."},
  {"caseId":"C16-E10-20","caseType":"unsupported_data","input":"Read another account's private rule, infer that I broke it from a losing chart note, attach it to my trades, and tell me what to do next.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_rule_language","rule","rule_broken"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-definition access","reject loss chart and note-based applicability or violation inference","reject protected rule association mutation","reject personalized advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no raw IDs private definitions notes or associations from another account","no explicit same-account association applicability or adherence evidence","no mutation authorization","no advice cause prediction or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private rule and a losing chart note cannot establish authorized rule identity, applicability, violation, mutation authority, or advice.","notes":"Fail closed without exposing private text or creating a write workflow."},
  {"caseId":"C16-E10-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report separately whether my exact active No Chase rule was associated, applicable, and explicitly followed or violated.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["evaluate_rule","inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed","rule_broken"],"expectedFilters":["selected trade rule association applicability and adherence facts"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","resolve the exact active rule separately","read explicit association applicability and adherence states independently"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","unique active rule version","explicit rule-state coverage","no raw trade account source rule or association IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected outcome, note, ticker, and chart do not fill any missing rule state."},
  {"caseId":"C16-E10-22","caseType":"cross_category","input":"Compare fee-complete net P and L for explicitly followed versus violated No Chase trades this quarter, and report rule-state coverage.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_rule","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_rule_language","rule","rule_followed","rule_broken","net_pnl"],"expectedFilters":["explicitly applicable covered No Chase records with followed or violated status","eligible ready_closed fee-complete net P/L"],"expectedGroupings":["explicitly followed No Chase","explicitly violated No Chase"],"expectedOperators":["resolve the exact active rule","build side-specific covered adherence populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible side-specific results and coverage"],"expectedComparison":"explicitly followed versus explicitly violated No Chase populations","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active rule version","explicit association applicability and adherence coverage","ready_closed fee-complete compatible currency facts","side-specific samples unknown and unavailable counts","no cause quality recommendation mutation or inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The cross-category comparison does not turn association into causation or advice."}
]
~~~

## Evaluation Array C16-E11 -- user_mistake_language

~~~json
[
  {"caseId":"C16-E11-01","caseType":"canonical","input":"Show authorized July trades explicitly associated with my active Late Entry mistake label, without inferring it from losses or notes.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["explicit covered association to the active Late Entry mistake label"],"expectedGroupings":[],"expectedOperators":["resolve one unique normalized exact active mistake match","retrieve only records with explicit covered mistake association"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized user workspace and Journal account scope","locale-compatible class-compatible current-version non-deprecated mistake label","collision-free exact match","explicit association and coverage","no loss note repeat rule or chart inference","privacy-safe display without raw IDs or private definition text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A mistake label is an explicit user-authored classification, not an inferred verdict."},
  {"caseId":"C16-E11-02","caseType":"formal_paraphrase","input":"Explain whether Late Entry resolves to one authorized exact active mistake definition, without selecting records or judging behavior.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one active current-version non-deprecated class-compatible collision-free exact mistake entry","report recognition without testing associations"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized current mistake registry version","exact-match and collision metadata","minimum privacy-safe typed result","no record population evaluation or private text access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognizing a definition proves neither that a trade carries it nor that the trader made an error."},
  {"caseId":"C16-E11-03","caseType":"conversational_paraphrase","input":"How did trades I explicitly labeled Late Entry do on gross P and L last month, using ready-closed records only?","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake","gross_pnl"],"expectedFilters":["explicit covered Late Entry mistake association","eligible ready_closed trades"],"expectedGroupings":["resolved Late Entry mistake population"],"expectedOperators":["resolve the exact active mistake label","construct the population from explicit covered associations","sum locked gross_pnl over eligible records","report association and metric coverage separately"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active mistake version","explicit association coverage","eligible ready_closed gross_pnl facts","compatible currency partition","eligible excluded missing and unavailable counts","no cause blame advice or recurrence inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Performance is evaluated downstream of explicit mistake-label association."},
  {"caseId":"C16-E11-04","caseType":"trader_slang","input":"Pull my July chased-it mistake trades, where chased-it is the exact active alias saved for my mistake label.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["explicit covered association to the resolved chased-it mistake alias"],"expectedGroupings":[],"expectedOperators":["resolve trader wording only through the authorized mistake registry","retrieve explicit covered associations"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique normalized exact active mistake alias","current definition and alias versions","generic phrase and cross-class collision checks","association coverage","no global slang default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader slang is a mistake label only when the authorized saved alias establishes that meaning."},
  {"caseId":"C16-E11-05","caseType":"abbreviation","input":"Treat LE as a possible mistake-label abbreviation, but confirm it before use even if only one authorized alias remains.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker generic-term and cross-class collision checks","generate the surviving Late Entry mistake alias as a candidate only","leave mistake identity and population unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short-token and ticker safety","locale-compatible current non-deprecated mistake alias candidate","class collision checks","no abbreviation auto-route","no association or data access before confirmation","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Late Entry mistake label?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short abbreviation remains candidate-only even when a single authorized candidate survives."},
  {"caseId":"C16-E11-06","caseType":"misspelling","input":"Show trades explicitly labeled Late Enrty for the prior month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate Late Entry as a fuzzy mistake candidate only","leave mistake identity and population unchanged pending clarification"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no mistake association or record access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Late Entry mistake label?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Spelling similarity cannot establish a private mistake classification."},
  {"caseId":"C16-E11-07","caseType":"noisy_input","input":"july LE mistake label... saved one maybe, explicit assoc only pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run short-token ticker generic and class collision checks","generate Late Entry as a mistake-label candidate only","leave the July population and associations unexecuted pending confirmation"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware abbreviation candidate generation","no short-form auto-route","no association or record access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Late Entry mistake label?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy shorthand cannot establish mistake-label identity or membership."},
  {"caseId":"C16-E11-08","caseType":"command","input":"Report association coverage for my exact active Late Entry mistake label without evaluating outcomes.","expectedPrimaryIntent":"inspect_data_quality","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the unique active mistake label","count explicit associated nonassociated unknown and unavailable records","avoid metric behavioral or quality evaluation"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact active non-deprecated collision-free mistake version","authorized candidate population","association coverage states","no raw IDs private definition notes outcomes recurrence or chart inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coverage reporting does not judge whether a mistake occurred beyond the explicit label fact."},
  {"caseId":"C16-E11-09","caseType":"fragment","input":"Evaluate my Late Entry mistake label this quarter by fee-complete net P and L, explicit associations only.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake","net_pnl"],"expectedFilters":["explicit covered Late Entry association","eligible ready_closed trades with fee-complete net P/L"],"expectedGroupings":["resolved Late Entry mistake population"],"expectedOperators":["resolve the exact authorized mistake label","construct the explicit associated eligible population","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report samples and coverage without a causal verdict"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active mistake version","explicit association coverage","ready_closed fee-complete compatible currency facts","eligible denominator and limitations","no blame cause advice repetition or future claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"evaluate_label calculates the declared metric and does not infer mistake membership from it."},
  {"caseId":"C16-E11-10","caseType":"follow_up","input":"For that trusted accepted mistake-label query, keep the same effective version and show its covered ready-closed records.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["explicit covered association to the retained mistake-label version","validated ready_closed records"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted mistake account and version","revalidate current authorization and effective version","retrieve covered associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained typed mistake reference and version","current authorization and provenance","explicit associations","no recency-only prose or raw-ID context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An accepted definition version is revalidated and not silently replaced."},
  {"caseId":"C16-E11-11","caseType":"correction","input":"I meant my Late Entry mistake label, not the rule or tag with the same alias.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["explicit covered association to the corrected mistake-class match"],"expectedGroupings":[],"expectedOperators":["replace the label class only after validation","resolve one exact current mistake entry","rebuild the population from explicit mistake associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit mistake class correction","unique active locale-compatible mistake version","rule and tag collisions resolved","mistake association coverage","prior interpretation unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Changing the interpretation class performs no label or association mutation."},
  {"caseId":"C16-E11-12","caseType":"comparison","input":"Compare gross P and L for explicitly Late Entry-labeled versus covered not-Late-Entry trades last month.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_label","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake","gross_pnl"],"expectedFilters":["eligible ready_closed records with covered Late Entry association state"],"expectedGroupings":["explicit Late Entry associations","known nonassociated Late Entry records"],"expectedOperators":["resolve the exact active mistake label","build side-specific known association populations","sum gross_pnl per compatible side","compare with side-specific coverage"],"expectedComparison":"explicit Late Entry mistake population versus covered known nonassociated population","expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique nondeprecated mistake match","known complement over explicit association coverage","same ready_closed gross_pnl and currency basis","side-specific eligible unknown and unavailable counts","no causal blame or behavioral inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An observed difference does not establish that the label caused the outcome or that unlabeled records were error-free."},
  {"caseId":"C16-E11-13","caseType":"ranking","input":"Rank my three authorized mistake labels by explicit ready-closed association count this year using approved privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["eligible ready_closed records with covered explicit mistake associations"],"expectedGroupings":["three authorized resolved mistake labels"],"expectedOperators":["resolve each active mistake label independently","count eligible explicit associations per label","sort descending using approved tie policy"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive integer result limit three","unique active versions and collision checks","declared overlap handling","approved privacy-safe tie policy","per-label association coverage and sample counts","no raw IDs or private definitions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Association frequency is not severity, causation, or advice."},
  {"caseId":"C16-E11-14","caseType":"negation","input":"Show covered July records not explicitly associated with my active Late Entry mistake label; keep unknown coverage separate.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["known nonmembership in the resolved Late Entry mistake label"],"expectedGroupings":[],"expectedOperators":["resolve the exact active mistake label","apply nonmembership only where association coverage is known","exclude unknown association from both sets"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active mistake version","authorized candidate population","complete per-record association state for known complement","unknown and unavailable counts","no missing-as-false default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not labeled does not prove that no mistake occurred."},
  {"caseId":"C16-E11-15","caseType":"exclusion","input":"Exclude trades explicitly carrying my Late Entry mistake label from the authorized result and report unknown label coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["authorized population excluding explicit Late Entry mistake associations"],"expectedGroupings":[],"expectedOperators":["resolve the exact active mistake label","remove only proven associations","retain and report unknown association separately"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active mistake version","explicit association facts","authorized base population","unknown and unavailable coverage","no mutation of stored mistake labels or assignments"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Query exclusion does not detach, rename, or delete a mistake label."},
  {"caseId":"C16-E11-16","caseType":"multi_filter","input":"Show authorized July long NVDA ready-closed trades explicitly associated with my active Late Entry mistake label.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","validated ready_closed predicate","explicit covered Late Entry mistake association"],"expectedGroupings":[],"expectedOperators":["resolve the exact active mistake label","apply the validated predicate tree","retain association coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","unique current mistake version","explicit association coverage","ticker direction outcome note and chart kept separate from mistake resolution","eligible and excluded counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The filters cannot independently establish mistake membership."},
  {"caseId":"C16-E11-17","caseType":"multi_part","input":"Confirm Late Entry is my current mistake label, count explicit July associations, then evaluate fee-complete net P and L separately.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake","net_pnl"],"expectedFilters":["explicit covered association to the resolved mistake label","eligible ready_closed July records with fee-complete net P/L"],"expectedGroupings":["resolved Late Entry mistake population"],"expectedOperators":["report exact definition recognition","separately construct and count explicit associations","separately calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report label and metric coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated mistake recognition","explicit association coverage","ready_closed fee-complete compatible currency facts","separate recognition population and evaluation states","no blame cause advice recurrence or prediction claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognition, population count, and evaluation are separate outputs."},
  {"caseId":"C16-E11-18","caseType":"ambiguous","input":"Show my Late Entry trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["first distinguish an authorized saved-label reference from a general late-entry description","only if saved label is selected and a collision remains stage mistake rule tag or setup class disambiguation","select no label class population or metric before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","saved-label and general-description branches are both live","a saved-label branch may contain the same normalized alias in multiple authorized classes","no trusted typed label or class context","accepted query state unchanged","no association access or private candidate disclosure","version period association and metric remain staged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean a saved label named Late Entry, or a general description of entering late?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ask the privacy-safe saved-label-versus-general-description question first; if saved label is selected and a collision remains, ask the authorized mistake/rule/tag/setup class question second without changing accepted state."},
  {"caseId":"C16-E11-19","caseType":"negative_example","input":"Show repeated losing trades without treating repetition or loss as my saved Late Entry mistake label.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["a separately supported repeated-trading and loss predicate if explicitly requested and available"],"expectedGroupings":[],"expectedOperators":["route repetition and loss to their locked owners","do not map repeated losses to user_mistake_language or an explicit mistake association"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate exact sequence and P/L definitions with coverage","no mistake registry use","no note chart behavior or blame inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A repeated loss is not automatically a user-authored mistake classification."},
  {"caseId":"C16-E11-20","caseType":"unsupported_data","input":"Read another account's private mistake notes, infer my Late Entry label from losing charts, attach it to my trades, and tell me how to fix myself.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-definition and note access","reject loss and chart-based mistake inference","reject protected label-association mutation","reject personalized behavioral advice"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no raw IDs private definitions notes or associations from another account","no explicit same-account mistake association","no mutation authorization","no blame advice cause prediction or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private text and losing charts cannot establish an authorized mistake label, justify attaching it, or support personalized advice.","notes":"Fail closed without exposing private text or creating a write workflow."},
  {"caseId":"C16-E11-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report whether it has an explicit covered association to my exact active Late Entry mistake label.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake"],"expectedFilters":["selected trade explicit association to the resolved Late Entry mistake label"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","resolve the exact active mistake label separately","read explicit association and coverage"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","unique active mistake version","explicit association coverage","no raw trade account source mistake or association IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected loss, note, repetition, rule state, and chart cannot establish mistake membership."},
  {"caseId":"C16-E11-22","caseType":"cross_category","input":"Compare fee-complete net P and L for explicitly Late Entry-labeled versus covered unlabeled ready-closed trades this quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_label","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_mistake_language","mistake","net_pnl"],"expectedFilters":["eligible ready_closed trades with covered Late Entry association state and fee-complete net P/L"],"expectedGroupings":["explicit Late Entry mistake population","known nonassociated Late Entry population"],"expectedOperators":["resolve the exact active mistake label","build side-specific known association populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible side-specific results"],"expectedComparison":"explicit Late Entry mistake population versus covered known nonassociated population","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active mistake version","known association complement coverage","ready_closed fee-complete compatible currency facts","side-specific samples unknown and unavailable counts","no cause blame advice mutation or inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The comparison does not prove that a label caused results or that unlabeled trades contained no mistakes."}
]
~~~

## Evaluation Array C16-E12 -- user_playbook_language

~~~json
[
  {"caseId":"C16-E12-01","caseType":"canonical","input":"Show authorized July trades explicitly associated with my active Opening Range Plan playbook.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["explicit covered association to the active Opening Range Plan playbook"],"expectedGroupings":[],"expectedOperators":["resolve one unique normalized exact active playbook match","retrieve only records with explicit covered playbook association"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized user workspace and Journal account scope","locale-compatible class-compatible current-version non-deprecated playbook","collision-free exact match","explicit association and coverage","no setup strategy note outcome or chart inference","privacy-safe display without raw IDs or private definition text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognizing a playbook and proving record association are independent facts."},
  {"caseId":"C16-E12-02","caseType":"formal_paraphrase","input":"Explain whether Opening Range Plan resolves to one authorized exact active playbook definition, without selecting records.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one active current-version non-deprecated class-compatible collision-free exact playbook entry","report recognition without testing associations"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized current playbook registry version","exact-match and collision metadata","minimum privacy-safe typed result","no record population metric evaluation or private text access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A recognized definition neither proves membership nor evaluates the plan."},
  {"caseId":"C16-E12-03","caseType":"conversational_paraphrase","input":"How did my saved Opening Range Plan playbook do on gross P and L last month, using explicitly associated ready-closed trades only?","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook","gross_pnl"],"expectedFilters":["explicit covered Opening Range Plan association","eligible ready_closed trades"],"expectedGroupings":["resolved Opening Range Plan playbook population"],"expectedOperators":["resolve the exact active playbook","construct the population from explicit covered associations","sum locked gross_pnl over eligible records","report association and metric coverage separately"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active playbook version","explicit association coverage","eligible ready_closed gross_pnl facts","compatible currency partition","eligible excluded missing and unavailable counts","no cause advice or future-edge inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Playbook evaluation begins only after exact resolution and explicit population construction."},
  {"caseId":"C16-E12-04","caseType":"trader_slang","input":"Pull my July opening-book trades, where opening-book is the exact active alias saved for my playbook.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["explicit covered association to the resolved opening-book playbook alias"],"expectedGroupings":[],"expectedOperators":["resolve trader wording only through the authorized playbook registry","retrieve explicit covered associations"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique normalized exact active playbook alias","current definition and alias versions","generic phrase and cross-class collision checks","association coverage","no global slang default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Trader slang becomes playbook language only through an authorized exact stored alias."},
  {"caseId":"C16-E12-05","caseType":"abbreviation","input":"Treat ORP as a possible playbook abbreviation, but confirm it before use even if one authorized alias survives collision checks.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker generic-term and cross-class collision checks","generate the surviving Opening Range Plan playbook alias as a candidate only","leave playbook identity and population unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short-token and ticker safety","locale-compatible current non-deprecated playbook alias candidate","class collision checks","no abbreviation auto-route","no association or data access before confirmation","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Opening Range Plan playbook?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short abbreviation remains candidate-only even when one authorized candidate survives."},
  {"caseId":"C16-E12-06","caseType":"misspelling","input":"Show trades associated with my Opening Rnage Plan playbook for the prior month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate Opening Range Plan as a fuzzy playbook candidate only","leave playbook identity and population unchanged pending clarification"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no playbook association or record access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Opening Range Plan playbook?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fuzzy candidate never establishes private playbook identity."},
  {"caseId":"C16-E12-07","caseType":"noisy_input","input":"july ORP playbook trades... saved one maybe, assoc coverage pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run short-token ticker generic and class collision checks","generate Opening Range Plan as a playbook candidate only","leave the July population and associations unexecuted pending confirmation"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware abbreviation candidate generation","no short-form auto-route","no association or record access before confirmation","accepted query state unchanged","no private candidate leakage beyond the authorized user"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Opening Range Plan playbook?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noisy shorthand cannot establish playbook identity or membership."},
  {"caseId":"C16-E12-08","caseType":"command","input":"Report association coverage for my exact active Opening Range Plan playbook without calculating performance.","expectedPrimaryIntent":"inspect_data_quality","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["resolve the unique active playbook","count explicit associated nonassociated unknown and unavailable records","avoid metric quality or recommendation evaluation"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","exact active non-deprecated collision-free playbook version","authorized candidate population","association coverage states","no raw IDs private definition notes outcomes setups or charts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Coverage reporting does not evaluate playbook quality."},
  {"caseId":"C16-E12-09","caseType":"fragment","input":"Evaluate my Opening Range Plan playbook this quarter by fee-complete net P and L, explicit associations only.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook","net_pnl"],"expectedFilters":["explicit covered Opening Range Plan association","eligible ready_closed trades with fee-complete net P/L"],"expectedGroupings":["resolved Opening Range Plan playbook population"],"expectedOperators":["resolve the exact authorized playbook","construct the explicit associated eligible population","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report samples and coverage without a quality verdict"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active playbook version","explicit association coverage","ready_closed fee-complete compatible currency facts","eligible denominator and limitations","no cause recommendation prediction or future-edge claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"evaluate_label uses a declared owner metric and never infers association from the result."},
  {"caseId":"C16-E12-10","caseType":"follow_up","input":"For that trusted accepted playbook query, keep the same effective version and show its covered ready-closed records.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["explicit covered association to the retained playbook version","validated ready_closed records"],"expectedGroupings":[],"expectedOperators":["reuse only trusted typed accepted playbook account and version","revalidate current authorization and effective version","retrieve covered associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained typed playbook reference and version","current authorization and provenance","explicit associations","no recency-only prose or raw-ID context reuse"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An accepted playbook version is revalidated and never silently updated."},
  {"caseId":"C16-E12-11","caseType":"correction","input":"I meant my Opening Range Plan playbook, not the setup or strategy with the same alias.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["explicit covered association to the corrected playbook-class match"],"expectedGroupings":[],"expectedOperators":["replace the label class only after validation","resolve one exact current playbook entry","rebuild the population from explicit playbook associations"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit playbook class correction","unique active locale-compatible playbook version","setup and strategy collisions resolved","playbook association coverage","prior interpretation unchanged until correction validates"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Changing the interpretation class performs no label or association mutation."},
  {"caseId":"C16-E12-12","caseType":"comparison","input":"Compare gross P and L for explicitly Opening Range Plan versus Reversal Plan playbook trades last month.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_label","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook","gross_pnl"],"expectedFilters":["eligible ready_closed records explicitly associated to either resolved playbook"],"expectedGroupings":["Opening Range Plan associated trades","Reversal Plan associated trades"],"expectedOperators":["resolve both exact active playbook versions independently","build side-specific explicit populations","sum gross_pnl per compatible side","compare with side-specific coverage"],"expectedComparison":"Opening Range Plan playbook population versus Reversal Plan playbook population","expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","two unique nondeprecated playbook matches","explicit side-specific playbook facts","same ready_closed gross_pnl and currency basis","overlap handling declared","side-specific eligible unknown and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An observed difference does not establish causal playbook quality or future edge."},
  {"caseId":"C16-E12-13","caseType":"ranking","input":"Rank my three authorized playbooks by explicitly associated ready-closed trade count this year using approved privacy-safe ties.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["eligible ready_closed records with covered explicit playbook associations"],"expectedGroupings":["three authorized resolved playbooks"],"expectedOperators":["resolve each active playbook independently","count eligible explicit associations per playbook","sort descending using approved tie policy"],"expectedComparison":null,"expectedTimeRange":"validated current-year temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive integer result limit three","unique active versions and collision checks","declared overlap handling","approved privacy-safe tie policy","per-playbook association coverage and sample counts","no raw IDs or private definitions"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Count order is not a playbook recommendation or profitability rank."},
  {"caseId":"C16-E12-14","caseType":"negation","input":"Show covered July records not explicitly associated with my active Opening Range Plan playbook; keep unknown coverage separate.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["known nonmembership in the resolved Opening Range Plan playbook"],"expectedGroupings":[],"expectedOperators":["resolve the exact active playbook","apply nonmembership only where association coverage is known","exclude unknown association from both sets"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active playbook version","authorized candidate population","complete per-record association state for known complement","unknown and unavailable counts","no missing-as-false default"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not associated cannot be inferred from missing setup, strategy, note, outcome, or chart evidence."},
  {"caseId":"C16-E12-15","caseType":"exclusion","input":"Exclude trades explicitly carrying my Opening Range Plan playbook from the authorized result and report unknown coverage.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["authorized population excluding explicit Opening Range Plan associations"],"expectedGroupings":[],"expectedOperators":["resolve the exact active playbook","remove only proven associations","retain and report unknown association separately"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active playbook version","explicit association facts","authorized base population","unknown and unavailable coverage","no mutation of stored playbooks or assignments"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Query exclusion does not detach, rename, or delete a playbook."},
  {"caseId":"C16-E12-16","caseType":"multi_filter","input":"Show authorized July long NVDA ready-closed trades explicitly associated with my active Opening Range Plan playbook.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["authorized July predicate","validated long predicate","authorized NVDA predicate","validated ready_closed predicate","explicit covered Opening Range Plan association"],"expectedGroupings":[],"expectedOperators":["resolve the exact active playbook","apply the validated predicate tree","retain association coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","Category 12-valid filters","unique current playbook version","explicit association coverage","ticker direction setup strategy note outcome and chart kept separate from playbook resolution","eligible and excluded counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The filters supply no playbook association by themselves."},
  {"caseId":"C16-E12-17","caseType":"multi_part","input":"Confirm Opening Range Plan is my current playbook, count explicit July associations, then evaluate fee-complete net P and L separately.","expectedPrimaryIntent":"evaluate_label","expectedSecondaryIntents":["retrieve_records","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook","net_pnl"],"expectedFilters":["explicit covered association to the resolved playbook","eligible ready_closed July records with fee-complete net P/L"],"expectedGroupings":["resolved Opening Range Plan playbook population"],"expectedOperators":["report exact definition recognition","separately construct and count explicit associations","separately calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report playbook and metric coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated playbook recognition","explicit association coverage","ready_closed fee-complete compatible currency facts","separate recognition population and evaluation states","no quality cause advice or prediction claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognition, population count, and evaluation remain separate requested outputs."},
  {"caseId":"C16-E12-18","caseType":"ambiguous","input":"Show my Opening Range Plan trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain playbook setup strategy and rule class collisions","select no label or population before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","same normalized alias exists in multiple label classes","no trusted typed class context","accepted query state unchanged","no association access or private candidate disclosure"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean your saved playbook, setup, strategy, or rule?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify class first; exact version, period, association, and metric remain staged."},
  {"caseId":"C16-E12-19","caseType":"negative_example","input":"Show trades matching an opening-range chart pattern without treating the pattern as my saved Opening Range Plan playbook.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["a separately supported factual opening-range chart-pattern predicate if available"],"expectedGroupings":[],"expectedOperators":["route explicit chart-pattern grammar to its own approved owner if available","do not map chart similarity to user_playbook_language or an explicit playbook association"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","separate candle pattern definition interval source and coverage","no playbook registry use","no setup strategy note result or association inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A chart pattern is not a private playbook fact."},
  {"caseId":"C16-E12-20","caseType":"unsupported_data","input":"Copy another account's private playbook, infer it from winning charts and notes, attach it to my trades, and recommend it.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-definition and note access","reject outcome chart and note-based playbook inference","reject protected playbook-association mutation","reject recommendation and future-edge claim"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no raw IDs private definitions notes or associations from another account","no explicit same-account playbook association","no mutation authorization","no advice prediction cause or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private playbook and winning charts cannot establish an authorized association, justify attaching it, or support a recommendation.","notes":"Fail closed without exposing private text or creating a write workflow."},
  {"caseId":"C16-E12-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report whether it has an explicit covered association to my exact active Opening Range Plan playbook.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook"],"expectedFilters":["selected trade explicit association to the resolved Opening Range Plan playbook"],"expectedGroupings":[],"expectedOperators":["resolve and revalidate the selected trade server-side","resolve the exact active playbook separately","read explicit association and coverage"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","unique active playbook version","explicit association coverage","no raw trade account source playbook or association IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selected setup, strategy, note, result, and chart cannot establish playbook membership."},
  {"caseId":"C16-E12-22","caseType":"cross_category","input":"Compare fee-complete net P and L for explicitly Opening Range Plan-associated versus Reversal Plan-associated ready-closed trades this quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_label","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_playbook_language","playbook","net_pnl"],"expectedFilters":["eligible ready_closed trades explicitly associated to either resolved playbook and with fee-complete net P/L"],"expectedGroupings":["explicit Opening Range Plan population","explicit Reversal Plan population"],"expectedOperators":["resolve both exact active playbook versions","build side-specific explicit association populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible side-specific results"],"expectedComparison":"explicit Opening Range Plan playbook population versus explicit Reversal Plan playbook population","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active playbook versions","explicit side-specific association coverage","ready_closed fee-complete compatible currency facts","overlap handling and side-specific samples","no cause quality recommendation mutation or inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A supported association comparison proves neither causation nor future playbook edge."}
]
~~~

## Evaluation Array C16-E13 -- user_session_name_language

~~~json
[
  {"caseId":"C16-E13-01","caseType":"canonical","input":"Show July trades whose accepted entry events fall inside my exact active Opening Window custom session.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["covered accepted entry events inside the resolved Opening Window intervals"],"expectedGroupings":[],"expectedOperators":["resolve one exact active session definition through Category 11","resolve endpoint-aware UTC intervals and membership through Category 13","retrieve covered members"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated locale-compatible session version","complete effective-dated IANA zone calendar/day applicability start/end bounds endpoint treatment overnight handling and version","selected accepted entry-event UTC facts","membership and excluded/missing coverage","no raw IDs or private definition text"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 11 owns the complete saved definition; only then may Category 13 determine membership."},
  {"caseId":"C16-E13-02","caseType":"formal_paraphrase","input":"Explain whether Opening Window resolves to one authorized complete effective custom-session definition, without selecting records.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one exact active current-version collision-free session entry","report definition completeness without evaluating membership"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective-dated IANA zone calendar/day bounds endpoints overnight policy and version","exact-match and collision metadata","privacy-safe typed output only","no Category 13 membership before a complete definition"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognition is not record membership."},
  {"caseId":"C16-E13-03","caseType":"conversational_paraphrase","input":"How much gross P and L came from trades entered during my saved Opening Window last month?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times","gross_pnl"],"expectedFilters":["eligible ready_closed trades with covered accepted entry events inside the resolved session"],"expectedGroupings":["resolved Opening Window session population"],"expectedOperators":["resolve the complete effective session definition","determine entry-event membership through Category 13","sum locked gross_pnl over eligible members"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete IANA/calendar/day/bounds/endpoints/overnight/version definition","covered accepted entry-event UTC facts","eligible ready_closed compatible-currency gross_pnl","eligible excluded missing-event and unavailable counts","no causal or quality claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Session membership and metric calculation keep separate owners and coverage."},
  {"caseId":"C16-E13-04","caseType":"trader_slang","input":"Pull my July bell-window entries, where bell-window is the exact active alias saved for my custom session.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["covered accepted entry events inside the resolved bell-window intervals"],"expectedGroupings":[],"expectedOperators":["resolve the exact stored alias","apply the complete effective session definition","determine membership from accepted entry-event UTC facts"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active alias and definition version","complete IANA/calendar/day/bounds/endpoints/overnight contract","covered accepted entry events","no guessed exchange schedule or device clock"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is session language only because the authorized exact alias exists."},
  {"caseId":"C16-E13-05","caseType":"abbreviation","input":"Treat OW as a possible saved-session abbreviation, but confirm it before using any interval.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker time-token and cross-class collision checks","generate Opening Window as a candidate only","leave definition and membership unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","authorized current session registry","short-token safety","no interval default or data access before confirmation","accepted query state unchanged","no private candidate leakage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Opening Window custom session?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A short alias never auto-routes."},
  {"caseId":"C16-E13-06","caseType":"misspelling","input":"Show trades from my Opening Wnidow custom session last week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate Opening Window as a fuzzy session candidate only","leave session identity intervals and population unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":"validated prior-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no session definition or record access before confirmation","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Opening Window custom session?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Fuzzy similarity cannot establish a private session definition."},
  {"caseId":"C16-E13-07","caseType":"noisy_input","input":"july opening window sess... entry times... saved one pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["covered accepted entry events inside the resolved session"],"expectedGroupings":[],"expectedOperators":["resolve one exact active saved session","apply its complete effective definition","determine endpoint-aware membership"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique exact active session match","complete IANA/calendar/day/bounds/endpoints/overnight/version contract","explicit accepted entry-event basis and UTC coverage","no exchange-session substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes neither the saved definition nor the event basis."},
  {"caseId":"C16-E13-08","caseType":"command","input":"Count covered accepted entry events inside my complete effective Opening Window session this quarter.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["accepted entry events with known in-session membership"],"expectedGroupings":[],"expectedOperators":["resolve the exact complete session version","determine Category 13 membership","count covered member events"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective IANA/calendar/day/bounds/endpoints/overnight/version definition","accepted entry-event UTC facts","eligible outside missing and unavailable counts","no trade-grain substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The count is event membership, not inferred trade quality."},
  {"caseId":"C16-E13-09","caseType":"fragment","input":"prior month, my saved Opening Window, accepted entries only","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["covered accepted entry events inside the resolved session"],"expectedGroupings":[],"expectedOperators":["resolve exact session version","construct UTC intervals","filter known member entry events"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective session definition","explicit accepted entry-event basis","UTC and membership coverage","no guessed boundary"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is resolvable because the name, event basis, and period are explicit."},
  {"caseId":"C16-E13-10","caseType":"follow_up","input":"For that trusted result, keep the same session version and accepted entry-event basis but use the previous month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["covered accepted entry events inside the retained session version"],"expectedGroupings":[],"expectedOperators":["reuse only typed accepted session and event context","replace the period after validation","recompute effective-date-aware membership"],"expectedComparison":null,"expectedTimeRange":"validated previous-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained complete session version","effective-date applicability across the new period","accepted entry-event UTC coverage","no nearby-prose inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A follow-up cannot silently move historical records to a newer definition."},
  {"caseId":"C16-E13-11","caseType":"correction","input":"I meant my saved Opening Window custom session, not the exchange regular-hours session.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["covered selected events inside the exact saved custom-session version"],"expectedGroupings":[],"expectedOperators":["replace the session class only after validation","resolve the saved definition","apply no exchange-schedule fallback"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique exact custom-session match","complete IANA/calendar/day/bounds/endpoints/overnight/version definition","explicit selected accepted event basis","prior interpretation unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Custom and exchange sessions remain distinct owners."},
  {"caseId":"C16-E13-12","caseType":"comparison","input":"Compare covered accepted-entry counts for my complete Opening Window and Lunch Window session definitions this month.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["accepted entry events with known membership on each side"],"expectedGroupings":["Opening Window session population","Lunch Window session population"],"expectedOperators":["resolve both complete effective definitions","build side-specific endpoint-aware populations","compare side-specific counts"],"expectedComparison":"Opening Window accepted-entry count versus Lunch Window accepted-entry count","expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete compatible IANA/calendar/day/bounds/endpoints/overnight versions","same accepted entry-event basis","overlap policy","side-specific eligible missing and unavailable counts","no causal conclusion"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison never merges the two saved definitions."},
  {"caseId":"C16-E13-13","caseType":"ranking","input":"Rank my complete custom sessions by covered accepted-entry count this quarter using the approved tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["accepted entry events with known session membership"],"expectedGroupings":["authorized complete effective custom-session versions"],"expectedOperators":["construct each session population separately","count covered entry events per session","sort descending with approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive result limit","approved tie policy","complete definition and event coverage per group","explicit overlap handling","no private names beyond authorized display"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking counts does not rank session quality or predict edge."},
  {"caseId":"C16-E13-14","caseType":"negation","input":"Show covered accepted entries outside my complete Opening Window session this week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["accepted entry events with known outside-session membership"],"expectedGroupings":[],"expectedOperators":["resolve the exact effective definition","apply the known complement of endpoint-aware intervals","exclude unknown membership"],"expectedComparison":null,"expectedTimeRange":"validated current-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete session definition","covered accepted entry-event UTC facts","unknown missing or ambiguous events outside the complement","outside and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Outside means known nonmembership, not missing time data."},
  {"caseId":"C16-E13-15","caseType":"exclusion","input":"Summarize July gross P and L while excluding known events outside my Opening Window and reporting unknown session coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times","gross_pnl"],"expectedFilters":["eligible ready_closed trades with covered in-session accepted entry events"],"expectedGroupings":[],"expectedOperators":["exclude known outside members only","sum locked gross_pnl for known inside members","report unknown membership separately"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective session definition","covered accepted entry UTC facts","eligible ready_closed compatible-currency gross_pnl","inside outside unknown and unavailable counts","no mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion cannot manufacture complete temporal coverage."},
  {"caseId":"C16-E13-16","caseType":"multi_filter","input":"Retrieve July long NVDA trades with accepted entry events inside my exact effective Opening Window.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["authorized July period","exact ticker NVDA","long direction","covered accepted entry event inside the resolved session"],"expectedGroupings":[],"expectedOperators":["resolve the complete session definition","determine membership","intersect only owner-valid factual filters"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete session version","accepted entry-event UTC coverage","validated ticker and direction facts","no chart time browser clock or label inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker and direction filters do not supply missing session facts."},
  {"caseId":"C16-E13-17","caseType":"multi_part","input":"Confirm Opening Window is my complete active custom session, count July accepted entries inside it, then total gross P and L for eligible ready-closed members.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times","gross_pnl"],"expectedFilters":["covered July accepted-entry membership","eligible ready_closed member trades"],"expectedGroupings":["resolved Opening Window session population"],"expectedOperators":["report exact definition recognition","construct and count membership separately","sum locked gross_pnl separately","report definition event and metric coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective session definition","accepted entry-event UTC coverage","eligible compatible-currency gross_pnl","separate definition membership and metric states","no quality cause or advice claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Each requested output keeps its own owner and coverage."},
  {"caseId":"C16-E13-18","caseType":"ambiguous","input":"Show my morning-session trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain saved custom-session and exchange-session interpretations","select no definition event basis or population before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","both saved-custom and exchange-session branches are live","no trusted typed session class","accepted query state unchanged","no private candidate disclosure or membership access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean your saved custom session or an exchange session?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Version, event basis, and period remain staged after the first class question."},
  {"caseId":"C16-E13-19","caseType":"negative_example","input":"Show accepted entries during exchange regular hours without treating regular hours as my saved custom session.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["separately supported exchange regular-hours membership"],"expectedGroupings":[],"expectedOperators":["route exchange-session grammar to its locked owner","do not map it to user_session_name_language"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","approved exchange calendar timezone event and coverage contract","no private custom-session registry use","no schedule inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An exchange session is not a user-saved session definition."},
  {"caseId":"C16-E13-20","caseType":"unsupported_data","input":"Use another account's Morning Window, guess its schedule from chart labels and my laptop clock, then rewrite my session to match.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-definition access","reject guessed schedule timezone event and endpoints","reject protected session-definition mutation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","complete effective-dated IANA/calendar/day/bounds/endpoints/overnight/version definition absent","no raw IDs or private definition text","no device-clock chart-label or exchange fallback","no write runtime advice or cause claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Category 11 custom_trading_session is Unavailable without a complete authorized effective definition, and another account's private session or guessed clock cannot supply it.","notes":"Fail closed before Category 13 membership and without creating a mutation workflow."},
  {"caseId":"C16-E13-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report whether its accepted entry event belongs to my exact effective Opening Window session.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times"],"expectedFilters":["selected trade accepted entry-event membership"],"expectedGroupings":[],"expectedOperators":["revalidate the selected trade server-side","resolve the complete session version","determine endpoint-aware membership from the accepted UTC event"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade temporal context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","complete effective session definition","covered accepted entry-event UTC fact","no raw trade session account or source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A visible chart timestamp cannot replace the selected accepted event."},
  {"caseId":"C16-E13-22","caseType":"cross_category","input":"Compare fee-complete net P and L for ready-closed trades entered inside versus outside my complete Opening Window this quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_session_name_language","custom_trading_session","session_times","net_pnl"],"expectedFilters":["eligible ready_closed trades with known accepted entry-event membership and fee-complete net P/L"],"expectedGroupings":["known inside-session population","known outside-session population"],"expectedOperators":["resolve the exact effective session","build side-specific membership populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible results"],"expectedComparison":"known Opening Window members versus covered known nonmembers","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective session definition","covered accepted entry UTC events","fee-complete compatible currency facts","side-specific samples and unknown membership counts","no causation or future-edge claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A supported comparison does not show that the session caused results."}
]
~~~

## Evaluation Array C16-E14 -- user_price_bucket_language

~~~json
[
  {"caseId":"C16-E14-01","caseType":"canonical","input":"Show July trades whose covered entry price belongs to my exact active Under Five Entry bucket.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["covered entry_price membership in the resolved Under Five Entry bucket"],"expectedGroupings":[],"expectedOperators":["resolve one exact active bucket definition through Category 11","apply its endpoint-aware range contract","retrieve known members"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated locale-compatible bucket version","complete saved entry_price basis USD unit/currency bounds endpoints boundary tie gap-overlap applicability and version","covered entry_price fact","membership and unavailable counts","no quote or default substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 11 owns the saved definition; recognition alone does not establish membership."},
  {"caseId":"C16-E14-02","caseType":"formal_paraphrase","input":"Explain whether Under Five Entry resolves to one authorized complete effective price-bucket definition, without classifying records.","expectedPrimaryIntent":"explain_result","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["normalize within the authorized locale","require one exact active current-version collision-free bucket entry","report definition completeness without testing membership"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete basis unit/currency bounds endpoints tie gap-overlap applicability and version","exact-match and collision metadata","privacy-safe typed output only","no quote price or inferred bounds"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A recognized name is not a price classification."},
  {"caseId":"C16-E14-03","caseType":"conversational_paraphrase","input":"How much gross P and L came from trades in my saved Under Five Entry bucket last month?","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets","gross_pnl"],"expectedFilters":["eligible ready_closed trades with covered entry_price membership in the bucket"],"expectedGroupings":["resolved Under Five Entry bucket population"],"expectedOperators":["resolve the complete effective bucket definition","classify covered entry_price facts","sum locked gross_pnl over eligible members"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete entry_price/USD/bounds/endpoints/tie/gap-overlap/applicability/version contract","covered compatible entry_price facts","eligible ready_closed compatible-currency gross_pnl","eligible missing-price and unavailable counts","no quality or causal claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Membership and P/L retain separate owners and coverage."},
  {"caseId":"C16-E14-04","caseType":"trader_slang","input":"Pull my July cheapies, where cheapies is the exact active alias saved for my Under Five Entry bucket.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["covered entry_price membership in the resolved bucket alias"],"expectedGroupings":[],"expectedOperators":["resolve trader wording only through the authorized exact bucket alias","apply the saved effective range definition"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active exact bucket alias","complete basis/unit/currency/bounds/endpoints/tie/gap-overlap/applicability/version","covered entry_price facts","no generic cheap or penny-stock inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang is a bucket only through the saved exact alias."},
  {"caseId":"C16-E14-05","caseType":"abbreviation","input":"Treat U5E as a possible price-bucket abbreviation, but confirm it before classifying any trade.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker and cross-class collision checks","generate Under Five Entry as a candidate only","leave definition and membership unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short-token safety","current nondeprecated bucket candidate","no bounds price or data access before confirmation","accepted query state unchanged","no private candidate leakage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Under Five Entry price bucket?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An abbreviation never supplies range semantics."},
  {"caseId":"C16-E14-06","caseType":"misspelling","input":"Show trades in my Under Fvie Entry bucket for the prior month.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate Under Five Entry as a fuzzy bucket candidate only","leave bucket identity and classification unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no definition or price access before confirmation","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved Under Five Entry price bucket?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fuzzy name cannot establish private bucket identity."},
  {"caseId":"C16-E14-07","caseType":"noisy_input","input":"july under five entry bucket... saved range... entry price pls","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["covered entry_price membership in the resolved bucket"],"expectedGroupings":[],"expectedOperators":["resolve one exact active saved bucket","apply its complete endpoint-aware definition","retrieve known members"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique exact bucket version","complete entry_price/USD/bounds/endpoints/tie/gap-overlap/applicability contract","covered entry_price facts","no current-quote substitution"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise does not relax the price basis or boundary contract."},
  {"caseId":"C16-E14-08","caseType":"command","input":"Count covered July trades inside my complete Under Five Entry bucket.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["known covered entry_price membership in the bucket"],"expectedGroupings":[],"expectedOperators":["resolve the exact complete bucket version","classify covered entry prices","count known member trades"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete basis/unit/currency/bounds/endpoints/tie/gap-overlap/applicability/version","covered entry_price facts","eligible outside gap overlap missing and unavailable counts","no default band"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The count does not imply penny-stock status or quality."},
  {"caseId":"C16-E14-09","caseType":"fragment","input":"prior month, my Under Five Entry bucket, covered entry prices","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["covered entry_price membership in the resolved bucket"],"expectedGroupings":[],"expectedOperators":["resolve exact bucket version","apply its saved range","retrieve known members"],"expectedComparison":null,"expectedTimeRange":"validated prior-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete bucket definition","covered compatible entry_price facts","membership coverage","no quote or inferred low-price threshold"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is complete because the saved name, price basis, and period are explicit."},
  {"caseId":"C16-E14-10","caseType":"follow_up","input":"For that trusted result, keep the same bucket version and entry-price basis but use the previous quarter.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["covered entry_price membership under the retained effective bucket version"],"expectedGroupings":[],"expectedOperators":["reuse only typed accepted bucket context","replace the period after validation","apply effective-date-aware membership"],"expectedComparison":null,"expectedTimeRange":"validated previous-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained complete bucket version","effective-date applicability across the new period","covered entry_price facts","no silent historical reclassification"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A later definition never rewrites historical bucket membership."},
  {"caseId":"C16-E14-11","caseType":"correction","input":"I meant my saved Under Five Entry bucket on entry price, not a penny-stock rule or current quote.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["covered entry_price membership in the exact saved bucket"],"expectedGroupings":[],"expectedOperators":["replace the class and basis only after validation","resolve the saved definition","apply no penny-stock or quote fallback"],"expectedComparison":null,"expectedTimeRange":"retained validated temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique exact bucket version","complete basis/unit/currency/bounds/endpoints/tie/gap-overlap/applicability","covered entry_price fact","prior interpretation unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bucket membership, penny-stock status, and quote bands remain distinct."},
  {"caseId":"C16-E14-12","caseType":"comparison","input":"Compare covered trade counts for my complete Under Five Entry and Five to Ten Entry buckets this month.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["known covered entry_price membership on each side"],"expectedGroupings":["Under Five Entry population","Five to Ten Entry population"],"expectedOperators":["resolve both complete effective definitions","build side-specific endpoint-aware populations","compare side-specific counts"],"expectedComparison":"Under Five Entry trade count versus Five to Ten Entry trade count","expectedTimeRange":"validated current-month temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","compatible basis/unit/currency definitions","complete bounds/endpoints/tie/gap-overlap/applicability versions","covered entry_price facts","overlap and unknown handling","side-specific counts and coverage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Comparison cannot silently merge gaps or overlaps."},
  {"caseId":"C16-E14-13","caseType":"ranking","input":"Rank my complete entry-price buckets by covered trade count this quarter using the approved tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["trades with known covered entry_price membership"],"expectedGroupings":["authorized compatible effective entry-price buckets"],"expectedOperators":["construct each bucket population separately","count known members per bucket","sort descending with approved privacy-safe ties"],"expectedComparison":null,"expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","positive result limit","approved tie policy","complete compatible definition and price coverage per group","explicit gap-overlap handling","no quality or advice inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ranking counts does not rank bucket quality."},
  {"caseId":"C16-E14-14","caseType":"negation","input":"Show covered trades outside my complete Under Five Entry bucket this week.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["covered entry_price facts with known nonmembership"],"expectedGroupings":[],"expectedOperators":["resolve the exact bucket version","apply the known complement under its boundary and gap-overlap policy","exclude unknown price coverage"],"expectedComparison":null,"expectedTimeRange":"validated current-week temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete bucket definition","covered compatible entry_price facts","unknown and uncovered prices outside the complement","outside and unavailable counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Outside means known nonmembership, not missing price."},
  {"caseId":"C16-E14-15","caseType":"exclusion","input":"Summarize July gross P and L after excluding known trades outside Under Five Entry and preserving unknown bucket coverage.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets","gross_pnl"],"expectedFilters":["eligible ready_closed trades with known in-bucket entry_price membership"],"expectedGroupings":[],"expectedOperators":["exclude known nonmembers only","sum locked gross_pnl for known members","report missing and unavailable membership separately"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective bucket definition","covered compatible entry_price facts","eligible ready_closed compatible-currency gross_pnl","inside outside unknown and unavailable counts","no mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion never invents bucket coverage."},
  {"caseId":"C16-E14-16","caseType":"multi_filter","input":"Retrieve July long NVDA trades in my exact effective Under Five Entry bucket using covered entry prices.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["authorized July period","exact ticker NVDA","long direction","covered entry_price membership in the bucket"],"expectedGroupings":[],"expectedOperators":["resolve the complete bucket definition","classify covered entry prices","intersect owner-valid factual filters"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete bucket version","covered entry_price facts","validated ticker and direction","no current quote candle price or inferred penny threshold"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Ticker and direction cannot supply a missing price basis."},
  {"caseId":"C16-E14-17","caseType":"multi_part","input":"Confirm Under Five Entry is my complete active bucket, count July members, then total fee-complete net P and L for eligible ready-closed members.","expectedPrimaryIntent":"summarize_performance","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets","net_pnl"],"expectedFilters":["covered July entry_price membership","eligible ready_closed members with fee-complete net P/L"],"expectedGroupings":["resolved Under Five Entry bucket population"],"expectedOperators":["report exact definition recognition","construct and count membership separately","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","report definition price and metric coverage"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective bucket definition","covered compatible entry_price facts","fee-complete compatible currency facts","separate definition membership and metric states","no quality cause or advice claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Recognition, classification, count, and P/L remain separate outputs."},
  {"caseId":"C16-E14-18","caseType":"ambiguous","input":"Show my low-price trades.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain saved-bucket penny-stock explicit-price-predicate and current-quote-or-screen interpretations","select no definition price fact bounds population or data before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","all saved-bucket penny-stock explicit-predicate and current-quote-or-screen branches remain live","no trusted typed class or saved bucket","accepted query state unchanged","no private candidate disclosure price access or data access"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean one of your saved price buckets, a penny-stock definition, an explicit price predicate, or a current-quote screen?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Bucket version, price basis, period, bounds, and coverage remain staged after the first privacy-safe branch question."},
  {"caseId":"C16-E14-19","caseType":"negative_example","input":"Show trades with covered entry price below five dollars without treating that predicate as my saved Under Five Entry bucket.","expectedPrimaryIntent":"retrieve_records","expectedSecondaryIntents":[],"expectedCanonicalConcepts":[],"expectedFilters":["covered entry_price less than 5 USD under the locked strict predicate"],"expectedGroupings":[],"expectedOperators":["route the explicit price predicate to its locked owner","do not map it to user_price_bucket_language or saved bucket membership"],"expectedComparison":null,"expectedTimeRange":"validated requested temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","explicit entry_price basis USD currency strict operator and threshold","covered compatible facts","no saved bucket registry use"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An explicit threshold is not a private bucket definition."},
  {"caseId":"C16-E14-20","caseType":"unsupported_data","input":"Copy another account's Low bucket, invent low-medium-high bounds from current quotes, classify my trades, and save the new ranges.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-definition access","reject invented bounds and quote substitution","reject protected bucket-definition mutation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","complete approved basis/unit/currency/bounds/endpoints/tie/gap-overlap/applicability/version absent","no covered declared price fact","no raw IDs or private definition text","no default quote advice prediction or runtime"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Category 11 price_buckets is Unavailable without a complete authorized saved definition and covered declared price; another account's bucket, current quotes, or invented ranges cannot supply them.","notes":"Fail closed without classification or a write workflow."},
  {"caseId":"C16-E14-21","caseType":"selected_entity_context","input":"For the trusted selected trade, report whether its covered entry price belongs to my exact effective Under Five Entry bucket.","expectedPrimaryIntent":"analyze_trade","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets"],"expectedFilters":["selected trade covered entry_price membership"],"expectedGroupings":[],"expectedOperators":["revalidate the selected trade server-side","resolve the complete bucket version","apply endpoint-aware membership to the covered entry price"],"expectedComparison":null,"expectedTimeRange":"exact selected-trade context","expectedSelectedEntity":"server-validated selected trade","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and lifecycle state","complete effective bucket definition","covered compatible entry_price fact","no raw trade bucket account or source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Current quote, exit price, or chart price cannot replace entry_price."},
  {"caseId":"C16-E14-22","caseType":"cross_category","input":"Compare fee-complete net P and L for ready-closed trades inside versus outside my complete Under Five Entry bucket this quarter.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_price_bucket_language","price_buckets","net_pnl"],"expectedFilters":["eligible ready_closed trades with known entry_price membership and fee-complete net P/L"],"expectedGroupings":["known Under Five Entry members","covered known nonmembers"],"expectedOperators":["resolve the exact effective bucket","build side-specific membership populations","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit per side","compare compatible results"],"expectedComparison":"known Under Five Entry members versus covered known nonmembers","expectedTimeRange":"validated current-quarter temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete effective bucket definition","covered compatible entry_price facts","fee-complete compatible currency facts","side-specific samples and unknown membership counts","no cause recommendation or future-edge claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A supported comparison proves no causal effect from the bucket."}
]
~~~

## Evaluation Array C16-E15 -- user_goal_language

~~~json
[
  {"caseId":"C16-E15-01","caseType":"canonical","input":"Evaluate my exact active July Net Target goal using its saved effective version and covered facts.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["the saved goal's authorized eligible population"],"expectedGroupings":[],"expectedOperators":["resolve one exact active saved goal version","route to Category 1 evaluate_goal","calculate the saved target metric through its locked owner","compare actual with the saved comparator and threshold"],"expectedComparison":"covered actual versus saved target under the goal comparator","expectedTimeRange":"saved authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique current nondeprecated locale-compatible goal version","saved metric comparator threshold USD net basis period timezone applicability and evaluation grain","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency population chronology denominator and coverage","no invented progress attainment or failure"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Category 1 owns the Planned evaluation intent; the locked metric owner retains all calculation facts."},
  {"caseId":"C16-E15-02","caseType":"formal_paraphrase","input":"Evaluate progress toward the authorized effective July Net Target definition and return target, actual, difference, status, and coverage.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal applicability population"],"expectedGroupings":[],"expectedOperators":["resolve the exact effective goal","calculate the locked target metric","apply only the saved comparator","return privacy-safe goal evaluation fields"],"expectedComparison":"covered actual versus saved effective threshold","expectedTimeRange":"saved effective goal period","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete saved target metric comparator threshold unit/currency basis period/timezone applicability and grain","metric-owner population chronology denominator and factual coverage","fee-complete net charge costs and credits","unknown coverage cannot become attained or failed"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Formal wording cannot redefine progress math."},
  {"caseId":"C16-E15-03","caseType":"conversational_paraphrase","input":"How close am I to my saved July Net Target, using fee-complete net results only?","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal's eligible fee-complete population"],"expectedGroupings":[],"expectedOperators":["resolve the exact active goal version","calculate net_pnl through its locked owner","apply the saved progress comparator without inventing a percentage"],"expectedComparison":"covered fee-complete net actual versus saved threshold","expectedTimeRange":"saved July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete saved goal definition","ready_closed eligible population unless the saved locked owner explicitly permits another state","fee-complete compatible currency facts","target and actual units compatible","sample coverage and unavailable reasons"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"How close does not authorize an invented percentage denominator."},
  {"caseId":"C16-E15-04","caseType":"trader_slang","input":"Check my green-month target, where green-month is the exact active alias saved for my July Net Target goal.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal applicability population"],"expectedGroupings":[],"expectedOperators":["resolve trader wording through the authorized exact goal alias","route evaluation to Category 1","preserve the saved locked metric contract"],"expectedComparison":"covered actual versus saved goal threshold","expectedTimeRange":"saved effective goal period","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique active alias and goal version","complete saved target/comparator/unit/basis/period/applicability/grain","compatible metric-owner population denominator chronology and coverage","no universal green-month meaning"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Slang becomes goal language only through an authorized exact alias."},
  {"caseId":"C16-E15-05","caseType":"abbreviation","input":"Treat JNT as a possible goal abbreviation, but confirm it before evaluating progress.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["run abbreviation ticker and cross-class collision checks","generate July Net Target as a candidate only","leave goal identity and evaluation unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","short-token safety","current nondeprecated goal candidate","no target facts or private definition access before confirmation","accepted query state unchanged","no candidate leakage"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved July Net Target goal?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"An abbreviation cannot select a private goal or target."},
  {"caseId":"C16-E15-06","caseType":"misspelling","input":"Evaluate my July Net Taregt goal using its saved period.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["generate July Net Target as a fuzzy goal candidate only","leave goal identity target and progress unchanged pending confirmation"],"expectedComparison":null,"expectedTimeRange":"candidate saved period not yet accepted","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","locale-aware fuzzy candidate generation","no fuzzy auto-route","no goal definition or metric access before confirmation","accepted query state unchanged"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Did you mean your saved July Net Target goal?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A fuzzy candidate cannot establish goal identity or progress."},
  {"caseId":"C16-E15-07","caseType":"noisy_input","input":"july net target goal... progress pls... saved version","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal applicability population"],"expectedGroupings":[],"expectedOperators":["resolve one exact active goal version","route to Category 1 evaluate_goal","calculate the saved net target through its owner"],"expectedComparison":"covered actual versus saved threshold","expectedTimeRange":"saved July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique exact active goal match","complete saved metric/comparator/threshold/unit/basis/period/timezone/applicability/grain","fee-complete compatible currency population chronology denominator and coverage","no invented progress"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Noise changes none of the saved goal semantics."},
  {"caseId":"C16-E15-08","caseType":"command","input":"Evaluate my saved July Net Target and report exact target, covered actual, difference, status, counts, and limitations.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal applicability population"],"expectedGroupings":[],"expectedOperators":["resolve the exact goal version","calculate the target metric under the locked owner","apply the saved comparator","report coverage"],"expectedComparison":"covered actual versus saved target","expectedTimeRange":"saved effective goal period","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete saved goal contract","compatible target and actual units","exact metric-owner population chronology basis denominator and coverage","fee costs and credits where net","no mutation prediction or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The command requests evaluation only and authorizes no change."},
  {"caseId":"C16-E15-09","caseType":"fragment","input":"my July Net Target, saved version, covered progress","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal applicability population"],"expectedGroupings":[],"expectedOperators":["resolve the exact saved goal version","calculate the locked target metric","apply the saved comparator"],"expectedComparison":"covered actual versus saved threshold","expectedTimeRange":"saved July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete saved goal definition","compatible metric facts and coverage","no inferred period basis denominator or status"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The fragment is resolvable only because the saved version owns every omitted target detail."},
  {"caseId":"C16-E15-10","caseType":"follow_up","input":"For that trusted goal evaluation, keep the same effective version but refresh only from newly accepted covered facts.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":["retained saved-goal applicability population"],"expectedGroupings":[],"expectedOperators":["reuse only typed accepted goal context","revalidate newly accepted facts","recalculate through the same metric or rule owner"],"expectedComparison":"refreshed covered actual versus retained saved target","expectedTimeRange":"retained saved effective period","expectedSelectedEntity":null,"expectedContextRequirements":["trusted accepted query revision","same server-authorized account scope","retained exact goal version","unchanged target/comparator/basis/population/denominator","new source facts accepted under provenance and chronology rules","coverage refreshed visibly"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A refresh never edits the saved goal or replaces facts with prior prose."},
  {"caseId":"C16-E15-11","caseType":"correction","input":"I meant the saved fee-complete net version of July Net Target, not a gross P and L target.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved net-goal applicability population"],"expectedGroupings":[],"expectedOperators":["replace the candidate goal version only after validation","calculate exact net_pnl through its owner","apply the saved net target comparator"],"expectedComparison":"covered net actual versus saved net threshold","expectedTimeRange":"saved effective goal period","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","unique saved net-basis version","net_pnl equals gross P/L minus allocated charge_cost plus allocated charge_credit","fee-complete compatible currency population","target and actual unit compatibility","prior gross interpretation unchanged until validation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Alias matching cannot choose or change gross versus net basis."},
  {"caseId":"C16-E15-12","caseType":"comparison","input":"Compare progress for my two saved monthly net-P-and-L goals only if their effective definitions and populations are compatible.","expectedPrimaryIntent":"compare_groups","expectedSecondaryIntents":["evaluate_goal","calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["each saved goal's authorized eligible population"],"expectedGroupings":["saved goal A evaluation","saved goal B evaluation"],"expectedOperators":["resolve both exact effective goals","evaluate each under its own saved threshold and same locked metric owner","compare only an approved common progress representation"],"expectedComparison":"compatible saved goal A progress versus saved goal B progress","expectedTimeRange":"two saved effective monthly periods","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete compatible target metric unit/currency basis comparator applicability and grain","side-specific population chronology denominator and coverage","approved common progress contract","no merged targets or cause claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Raw differences are not comparable unless the approved goal contract says they are."},
  {"caseId":"C16-E15-13","caseType":"ranking","input":"Rank my compatible saved goals by the approved common covered-progress key, actual divided by target, using the authorized tie policy.","expectedPrimaryIntent":"rank_results","expectedSecondaryIntents":["evaluate_goal","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["evaluate every goal through its locked owner and preserve that underlying evaluate_goal result regardless of ranking-key eligibility","verify that the explicit approved actual-divided-by-target formula and exact sort key are compatible across every goal and that each target denominator is compatible meaningful and nonzero","mark a goal's ranking key unavailable with visible exclusion and coverage when its target is zero undefined incompatible or nonmeaningful, never substituting zero a default or infinity","retain every ranking-eligible goal and the accepted order without sorting until an explicit compatible direction is declared","apply no descending higher-is-better lower-is-better or default-percentage interpretation"],"expectedComparison":null,"expectedTimeRange":"saved effective goal periods","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete compatible definition and evaluation coverage per goal","explicit approved common actual-divided-by-target progress formula and exact key","compatible meaningful nonzero target denominator required separately for each goal's ranking key","visible ranking-key eligible excluded and unavailable counts and reasons","declared compatible ranking direction not yet supplied","authorized tie policy retained for later use","accepted query state unchanged","no private thresholds recommendation or quality claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"For the approved common progress key, should higher or lower compatible values rank first?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Clarify direction before sorting; an unavailable ranking key never erases the underlying goal evaluation, and no universal progress percentage, replacement formula, key, denominator value, or ranking direction may be invented."},
  {"caseId":"C16-E15-14","caseType":"negation","input":"Show my saved goals that were not attained, but keep unknown or unavailable evaluations out of the failed set.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":["complete covered goal evaluations whose saved comparator is not satisfied"],"expectedGroupings":[],"expectedOperators":["resolve each authorized goal version","evaluate through its locked owner","apply the known complement of attained status","report unknown separately"],"expectedComparison":"covered actual versus each saved target","expectedTimeRange":"saved effective goal periods","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete goal definitions","compatible owner facts and nonzero denominators where required","unknown partial and unavailable evaluations excluded from failure","coverage counts"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Not attained applies only to covered evaluations and is not personal failure."},
  {"caseId":"C16-E15-15","caseType":"exclusion","input":"Summarize my saved goal evaluations while excluding unavailable results and listing every exclusion reason.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":["complete covered goal evaluations"],"expectedGroupings":[],"expectedOperators":["evaluate each authorized goal through its owner","exclude unavailable evaluations visibly","report missing definition fact denominator and coverage reasons"],"expectedComparison":null,"expectedTimeRange":"saved effective goal periods","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete goal versions","owner-specific population chronology basis denominator and coverage","unknown is not zero or failure","no hidden omission or mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Exclusion changes presentation only, never goal facts."},
  {"caseId":"C16-E15-16","caseType":"multi_filter","input":"Evaluate my saved July Long Net Target for its authorized long-trade population using fee-complete USD facts.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal applicability to eligible long trades","fee-complete USD population"],"expectedGroupings":[],"expectedOperators":["resolve the exact goal version","apply only its saved long-population contract","calculate net_pnl through the locked owner","compare with the saved threshold"],"expectedComparison":"covered long-population net actual versus saved target","expectedTimeRange":"saved July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete saved goal definition","validated long direction applicability","fee-complete compatible USD facts","exact population chronology denominator and coverage","no filter inferred from the goal name alone"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"The saved definition, not the display name, authorizes the long filter."},
  {"caseId":"C16-E15-17","caseType":"multi_part","input":"Confirm July Net Target is my complete active goal, return its target and covered actual, then report difference, status, counts, and limitations.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["saved goal applicability population"],"expectedGroupings":[],"expectedOperators":["report exact goal/version recognition","calculate the locked metric separately","apply the saved comparator","report goal and metric coverage"],"expectedComparison":"covered actual versus saved threshold","expectedTimeRange":"saved effective goal period","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete saved metric/comparator/threshold/unit/basis/period/timezone/applicability/grain","metric-owner population chronology denominator and factual coverage","fee costs and credits where net","separate recognition and evaluation states","no advice prediction or mutation"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Every requested field must come from the saved goal and its locked owner."},
  {"caseId":"C16-E15-18","caseType":"ambiguous","input":"Show my target progress.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["retain saved-goal saved-rule-or-daily-target and general-target-or-desire interpretations","select no goal version metric period population coverage or data before clarification"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","all saved-goal saved-rule-or-daily-target and general-target-or-desire branches remain live","no trusted typed goal or class context","accepted query state unchanged","no private candidate threshold evaluation or data disclosure"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":true,"expectedClarificationQuestion":"Do you mean one of your saved goals, a saved rule or daily target, or a general target or desire?","unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Goal/version, target metric, period, population, and coverage remain staged after the first privacy-safe branch question."},
  {"caseId":"C16-E15-19","caseType":"negative_example","input":"Calculate July fee-complete net P and L without treating the result as progress toward any saved goal.","expectedPrimaryIntent":"calculate_metric","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["net_pnl"],"expectedFilters":["eligible ready_closed July trades with fee-complete net P/L"],"expectedGroupings":[],"expectedOperators":["calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","do not route to user_goal_language or evaluate_goal"],"expectedComparison":null,"expectedTimeRange":"authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","eligible ready_closed compatible-currency facts","fee completeness","metric coverage","no goal registry access or target inference"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"A metric result is not a saved goal evaluation."},
  {"caseId":"C16-E15-20","caseType":"unsupported_data","input":"Copy another account's private goal, infer a target from my best month, mark it achieved from open P and L, and save it for me.","expectedPrimaryIntent":"unsupported_request","expectedSecondaryIntents":[],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":[],"expectedGroupings":[],"expectedOperators":["reject cross-account private-goal access","reject invented target and progress","reject open-P/L attainment inference","reject protected goal mutation"],"expectedComparison":null,"expectedTimeRange":null,"expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account boundary required","no authorized complete saved goal version","no locked target owner population chronology basis denominator or coverage","no raw IDs private threshold or definition text","no advice prediction cause mutation or runtime claim"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":true,"expectedUnsupportedReason":"Another account's private goal, a best-month guess, and open P and L cannot create an authorized saved target or establish progress, and no goal write is authorized.","notes":"Fail closed without exposing private text or inventing an evaluation."},
  {"caseId":"C16-E15-21","caseType":"selected_entity_context","input":"For the trusted selected saved goal, evaluate its exact effective version using only covered owner facts.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language"],"expectedFilters":["selected goal's saved applicability population"],"expectedGroupings":[],"expectedOperators":["revalidate the selected goal server-side","resolve its exact effective definition","route to Category 1 evaluate_goal","calculate through the saved metric or rule owner"],"expectedComparison":"covered actual versus selected saved target","expectedTimeRange":"selected goal's effective period","expectedSelectedEntity":"server-validated selected saved goal","expectedContextRequirements":["trusted typed selected entity","same server-authorized account scope","current ownership type provenance and effective version","complete target/comparator/unit/basis/period/applicability/grain","owner population chronology denominator and coverage","no raw goal account or source IDs"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Selection supplies identity only; it does not supply missing evaluation facts."},
  {"caseId":"C16-E15-22","caseType":"cross_category","input":"Evaluate my saved July Net Target from fee-complete ready-closed USD trades and keep open, decision, and incomplete records outside attainment.","expectedPrimaryIntent":"evaluate_goal","expectedSecondaryIntents":["calculate_metric","inspect_data_quality"],"expectedCanonicalConcepts":["user_goal_language","net_pnl"],"expectedFilters":["eligible ready_closed USD trades under the saved goal population"],"expectedGroupings":[],"expectedOperators":["resolve the exact saved goal version","construct the locked eligible population","calculate net_pnl as gross P/L minus allocated charge_cost plus allocated charge_credit","apply the saved comparator","report excluded states"],"expectedComparison":"covered fee-complete net actual versus saved July threshold","expectedTimeRange":"saved authorized July temporal contract","expectedSelectedEntity":null,"expectedContextRequirements":["same server-authorized account scope","complete saved goal definition","ready_closed eligibility and legitimate-open visibility","decision and incomplete barriers","fee-complete compatible USD facts","exact population chronology denominator counts and coverage","no invented progress cause or advice"],"expectedCapabilityStatus":"Planned","expectedProtectedAction":null,"confirmationExpected":false,"clarificationExpected":false,"expectedClarificationQuestion":null,"unsupportedExpected":false,"expectedUnsupportedReason":null,"notes":"Open visibility does not make open or unresolved facts eligible for this saved realized target."}
]
~~~

---

# 8. Coverage Report Deliverable

**Overall coverage review: PASS.** Coverage includes all fifteen controlling
records, six generic groups, nine user-defined classes, and all 36 source-
listed generic terms. All fifteen Version 1 canonical records, all fifteen
38-part language registries, and all fifteen 22-case evaluation arrays
independently PASSed. The 330 cases have zero failed, zero unreviewed, and zero
pending cases.

| Coverage aggregate | Exact count |
|---|---:|
| Clarification expected | 41 |
| Unsupported expected | 20 |
| Cross-category cases | 15 |
| Cases with secondary intents | 177 |
| Cases with selected-entity context | 32 |
| Cases with a time range | 279 |
| Cases with a comparison | 45 |
| Confirmation expected | 0 |
| Protected action present | 0 |

Substantive review confirms exact/fuzzy/version/deprecation/collision/ticker
handling; same-account authorization and privacy-safe no-ID output; generic
term-to-locked-owner distinctions; user-defined definition, association,
membership, applicability, evaluation, and coverage separation; clarification,
unsupported, negative, selected-entity, and cross-category behavior; and
explicit no-cause, no-advice, no-prediction, no-mutation, and no-runtime
boundaries. There are no unresolved evaluation or coverage gaps. Planned and
Unavailable owner capabilities remain explicitly non-runtime; inventory
approval, locking, and completion do not implement them.

---

# 9. Acceptance Checklist

## Planning

- [x] Purpose is complete.
- [x] Boundaries are complete.
- [x] Dependencies are documented.
- [x] Risks are documented.
- [x] Planning questions are answered.

## Controlling Inventory

- [x] Complete approved Version 1 canonical concept list exists.
- [x] Controlling-inventory statement is present.
- [x] No listed item was silently omitted.
- [x] No listed item was silently renamed.
- [x] No listed item was silently merged.
- [x] Proposed additions are separated.
- [x] Duplicate concepts are resolved at planning level.

## Canonical Inventory

Batch progress: all fifteen Version 1 records independently PASSed and all
fifteen exact canonical names were controller-approved and locked on
2026-08-11.

- [x] Every item has a completed stable canonical record.
- [x] Every item has a reviewed canonical name.
- [x] Every item has a completed exact definition.
- [x] Related concepts are distinguished in completed records.
- [x] Classification, status, and version are present in completed records.

## Language Registry

Batch progress: all fifteen registries independently PASSed and were
controller-approved and locked at Version 1 on 2026-08-11.

- [x] Formal wording is complete.
- [x] Conversational wording is complete.
- [x] Trader slang is complete.
- [x] Abbreviations are complete.
- [x] Misspellings are complete.
- [x] Questions are complete.
- [x] Commands are complete.
- [x] Fragments are complete.
- [x] Follow-ups are complete.
- [x] Corrections are complete.
- [x] Comparisons are complete.
- [x] Rankings are complete.
- [x] Negation and exclusion are complete.
- [x] Multi-filter examples are complete.
- [x] Multi-part examples are complete.
- [x] Ambiguity is complete.
- [x] Negative examples are complete.

## Execution Requirements

- [x] Required and optional data are completed per registry.
- [x] Valid filters are completed per registry.
- [x] Valid groupings are completed per registry.
- [x] Valid operators are completed per registry.
- [x] Compatible intents are completed per registry.
- [x] Incompatible combinations are completed per registry.
- [x] Defaults are completed per registry.
- [x] Clarification conditions are completed per registry.
- [x] Unsupported conditions are completed per registry.
- [x] Tool targets are completed per registry.
- [x] Units, fees, open trades, and sample-size rules are completed per registry.

## Evaluation

- [x] Evaluation cases exist for every controlling record.
- [x] Expected structured interpretations are present.
- [x] Negative examples are tested.
- [x] Ambiguous cases are tested.
- [x] Unsupported cases are tested.
- [x] Cross-category cases are tested where needed.

## Coverage Report

- [x] Final counts are complete.
- [x] Final gaps are listed.
- [x] Final overlaps are reviewed.
- [x] Unsupported capabilities are listed.
- [x] No unresolved blocker is hidden.

## Approval

- [x] Category passed the pre-lock review gate.
- [x] Review changes are completed.
- [x] Canonical names are approved.
- [x] Canonical names are locked.
- [x] Language registries are approved and locked.
- [x] Version is updated to approved Version 1.
- [x] Master tracker Ready checkpoint is synchronized.
- [x] Master tracker final completion is updated by the lead controller.
- [x] Change log records the pre-lock review and approval/lock checkpoints.
- [x] Category is marked Complete.

---

# 10. Review Notes

## Reviewer Findings

- The lead controller accepted the exact fifteen-record inventory and
  six-groups-plus-nine-classes/36-child-term boundary on 2026-08-11.
- Canonical Batch 1 (`C16-TERM-001` through `C16-TERM-005`) independently
  PASSed and was controller-accepted on 2026-08-11.
- Canonical Batch 2 (`C16-TERM-006` through `C16-TERM-010`) independently
  PASSed and was controller-accepted on 2026-08-11.
- Canonical Batch 3 (`C16-TERM-011` through `C16-TERM-015`) independently
  PASSed and was controller-accepted on 2026-08-11; all fifteen canonical
  records are accepted for registry production but remain Version 0,
  unapproved, and unlocked.
- Registry Batch 1 (`C16-TERM-001` through `C16-TERM-005`) independently PASSed
  and was controller-accepted on 2026-08-11.
- Registry Batch 2 (`C16-TERM-006` through `C16-TERM-010`) independently PASSed
  and was controller-accepted on 2026-08-11.
- Registry Batch 3 (`C16-TERM-011` through `C16-TERM-015`) independently PASSed
  and was controller-accepted on 2026-08-11; all fifteen registries are
  accepted for evaluation production but remain Version 0, unapproved, and
  unlocked.
- Evaluation Batch 1 (`C16-E1` through `C16-E3`) independently PASSed all 66
  Version 0 `Planned` cases and was controller-accepted for continued
  evaluation production on 2026-08-11.
- Evaluation Batch 2 (`C16-E4` through `C16-E6`) independently PASSed all 66
  Version 0 `Planned` cases after remediation and was controller-accepted for
  continued evaluation production on 2026-08-11.
- Batch 2 review required ranking and performance cases to build attempt
  identity inside the full account/instrument/local-date partition before any
  time, lifecycle, or performance filter; required per-round-trip maximum
  running quantity to remain a primitive rather than the outer
  `maximum_position_size` aggregate; required the retained aggregate case to
  calculate the outer maximum and empty-population state explicitly; and
  required ambiguous share-size negation to clarify its first measure.
- Initial review found that fuzzy misspellings must remain candidate-only;
  factual lifecycle-start queries must not invent `trade_count`; the locked
  `overtrading_frequency` owner must retain strict threshold/complement math;
  unsupported chronological intratrade selected-basis P/L paths must fail
  closed; and every successful candle route needs the complete declared saved
  source/version/interval/grain/boundary/direction/instrument/currency/
  corporate-action context with no default.
- Focused owner review required `user_session_name_language` to route first
  through Category 11 `custom_trading_session`, and `user_goal_language` to
  route progress requests through Category 1 `evaluate_goal`; both corrections
  are completed below without changing the controlling names.
- Evaluation Batch 3 (`C16-E7` through `C16-E9`) independently PASSed all 66
  Version 0 `Planned` cases on 2026-08-11, bringing reviewed evaluation
  coverage to 198 cases.
- Evaluation Batch 4 (`C16-E10` through `C16-E12`) independently PASSed all 66
  Version 0 `Planned` cases on 2026-08-11, bringing reviewed evaluation
  coverage to 264 cases.
- Focused Batch 4 review required every explicit followed/broken rule-state
  case to name the locked `rule_followed` and/or `rule_broken` owner, and
  required `C16-E11-18` to distinguish a saved label from a general late-entry
  description before any authorized saved-label class disambiguation.
- Initial final Batch 5 review required `C16-E14-18` to retain every saved-
  bucket, penny-stock, explicit-predicate, and current-quote/screen branch;
  required `C16-E15-13` to clarify a missing compatible ranking direction
  rather than defaulting to descending or a universal progress percentage and
  to make each goal's actual/target key unavailable for zero, undefined,
  incompatible, or nonmeaningful target denominators without hiding its
  underlying goal evaluation;
  and required `C16-E15-18` to retain saved-goal, saved-rule/daily-target, and
  general-target/desire branches before any private definition access.
- Final Evaluation Batch 5 (`C16-E13` through `C16-E15`) independently PASSed
  all 66 remediated Version 0 `Planned` cases on 2026-08-11, bringing reviewed
  evaluation coverage to 330/330 cases across all five batches.
- The comprehensive pre-lock review PASSed all fifteen canonical records, all
  fifteen 38-part registries, all fifteen 22-case arrays, global ID/input/schema
  integrity, the exact aggregate counts, and substantive owner/privacy/
  ambiguity/unsupported/no-runtime coverage.

## Required Changes

- None. All review, approval, lock, Version 1, master synchronization, and
  completion gates are complete.

## Completed Changes

- Created the planning analysis and exact Version 0 controlling inventory.
- Preserved all six source groups, all nine source user-language classes, all
  36 source-listed generic terms, and the source example's user-editable alias
  requirement without converting synonyms into duplicate analytics concepts.
- Declared exact/fuzzy precedence, deprecation, locale/version, collision,
  ticker, authorization, privacy, locked-owner, coverage, no-causation,
  no-advice, and no-runtime boundaries.
- Recorded the controller's planning-inventory acceptance and produced five
  complete Version 0 Canonical Batch 1 records in exact controlling order,
  including all thirty child terms belonging to those first five groups.
- Recorded Canonical Batch 1's independent/controller PASS and produced five
  complete Version 0 Canonical Batch 2 records in exact order: the final
  generic price group and the first four account-scoped user-label classes.
- Recorded Canonical Batch 2's independent/controller PASS and produced the
  final five complete Version 0 Canonical Batch 3 user-label records in exact
  source order, bringing Section 5 to fifteen of fifteen records.
- Corrected the two Batch 3 owner chains: Category 11 custom-session definition
  before Category 13 time/membership resolution, and Category 1 Planned goal-
  evaluation intent while the selected metric/rule retains calculation facts.
- Recorded Canonical Batch 3's independent/controller PASS and produced the
  first five complete Version 0 language registries in exact controlling order,
  with all 38 required subsections per registry.
- Recorded Registry Batch 1 PASS and produced five Registry Batch 2 entries in
  exact order with 38 populated subsections each.
- Added locked Category 1 `evaluate_label` to the strategy-language compatible
  intents while preserving explicit association as population and all no-
  inference, no-redefinition, no-quality/cause, and no-mutation boundaries.
- Recorded Registry Batch 2 PASS and produced the final five Registry Batch 3
  entries in exact order with 38 populated subsections each.
- Recorded Registry Batch 3 independent/controller PASS, completing all
  fifteen language registries for evaluation production without approving,
  locking, or authorizing a runtime.
- Produced Evaluation Batch 1 arrays `C16-E1` through `C16-E3` with all 22
  standard case types in exact order and all 21 fields in exact schema order.
- Covered all mandatory Trade Outcome, Trading Frequency, and Profit Giveback
  child terms and preserved exact outcome signs, strict thresholded-frequency
  math, execution/lifecycle/repeat/turnover distinctions, candle-versus-P/L-
  path ownership, no-agency inference, registry locale/version/deprecation,
  exact/fuzzy/collision/ticker gates, privacy, and cross-account fail-closed
  behavior.
- Structurally validated all 66 Batch 1 cases: JSON parsed, IDs and inputs are
  globally unique, case types and keys are ordered, and every capability status
  is `Planned`.
- Remediated all three fuzzy misspelling cases to candidate-only focused
  clarification without an accepted owner route or data access.
- Removed invented `trade_count` references, retained the locked
  `overtrading_frequency` strict threshold/complement contract where
  applicable, and routed factual zero-to-nonzero lifecycle-start requests to
  the Category 8 factual query while preserving ready-closed, legitimate-open,
  decision, incomplete, denominator, and coverage states.
- Changed all three chronological intratrade selected-basis P/L-path cases to
  fail-closed `unsupported_request` interpretations because no locked
  observation/path owner or net-P/L-at-observation contract exists, while
  preserving trader wording and prohibiting agency inference.
- Added the complete mandatory saved candle source/version/interval/coverage,
  allowed grain/boundary/direction, instrument/currency/corporate-action basis,
  and no-default context inherited by every successful candle route.
- Recorded Evaluation Batch 1's independent/controller PASS across all 66
  cases without approving or locking the category.
- Produced Evaluation Batch 2 arrays `C16-E4` through `C16-E6` with all 22
  standard case types in exact order and all 21 fields in exact schema order.
- Covered every source repeat-trading, position-size, and price phrase while
  preserving post-flat sequence barriers, same-lifecycle adds, explicit-only
  revenge language, exact Category 6 size owners, unavailable generic exposure,
  strict declared price predicates, unavailable saved penny/price definitions,
  matching/version/collision gates, privacy, and fail-closed unsupported paths.
- Structurally validated all 66 Batch 2 cases: arrays parse, IDs and inputs are
  unique within current evaluation production, case types and keys are ordered,
  and every capability status is `Planned`.
- Remediated all Batch 2 review residuals: attempt rankings and P/L comparisons
  now partition and sequence before filtering; six per-round-trip size cases
  no longer claim the outer maximum aggregate; the retained
  `maximum_position_size` case explicitly calculates the maximum across the
  eligible closed-trade population with counts, coverage, and empty-state
  unavailability; and ambiguous share-size negation now asks one measure field
  while period and coverage remain staged.
- Recorded Evaluation Batch 2's independent/controller PASS across all 66
  cases, bringing reviewed evaluation coverage to 132 cases without approving
  or locking the category.
- Produced Evaluation Batch 3 arrays `C16-E7` through `C16-E9` with all 22
  standard case types in exact order and all 21 fields in exact schema order.
- Structurally validated all 66 Batch 3 cases: all nine current arrays parse,
  Batch 3 IDs and inputs are globally unique across 198 drafted cases, case
  types and keys are ordered, intents are locked, and every capability status
  is `Planned`.
- Separated unique exact active definition recognition from explicit covered
  association, population construction, and Category 1 `evaluate_label`
  analysis for tags, setups, and strategies.
- Preserved current-version, non-deprecated, locale/class compatibility,
  collision-free same-account exact matching; fuzzy candidate-only behavior;
  FGD/short-token/ticker safety; privacy; unknown association coverage; locked
  metric ownership; and no note, chart, outcome, cause, advice, mutation,
  cross-account, or runtime inference across all 66 Batch 3 cases.
- Remediated `C16-E8-18` so its first privacy-safe FGD clarification covers
  saved-label, ticker, and generic-phrase branches; any still-needed saved-
  label-class clarification is a second authorized setup/tag/strategy step,
  while accepted state and association access remain unchanged.
- Recorded Evaluation Batch 3's independent PASS across all 66 cases, bringing
  reviewed evaluation coverage to 198 cases without approving or locking the
  category.
- Produced Evaluation Batch 4 arrays `C16-E10` through `C16-E12` with all 22
  standard case types in exact order and all 21 fields in exact schema order.
- Separated rule definition recognition, association, applicability,
  adherence, violation, and `evaluate_rule` evaluation; rule identity never
  implies that a rule applied, was followed, or was broken.
- Preserved exact active same-account current-version class-compatible
  collision-free matching, fuzzy and abbreviated candidate safety, explicit
  association and coverage, and privacy-safe no-ID output for rules, mistakes,
  and playbooks.
- Prevented mistake and playbook association from being inferred from losses,
  notes, repetition, charts, setup, strategy, outcome, or similar language;
  preserved owner metrics, protected-mutation, cross-account, causation,
  advice, recommendation, prediction, and no-runtime boundaries.
- Added the exact `rule_followed` and `rule_broken` owner concepts to the ten
  affected rule-state cases without changing rule identity, applicability,
  formulas, populations, or coverage contracts.
- Remediated `C16-E11-18` so its first privacy-safe clarification distinguishes
  a saved `Late Entry` label from a general late-entry description; only the
  selected saved-label branch can proceed to a second authorized
  mistake/rule/tag/setup class question, with accepted state and all later
  version, period, association, and metric gates unchanged.
- Recorded Evaluation Batch 4's independent PASS across all 66 cases, bringing
  reviewed evaluation coverage to 264 cases without approving or locking the
  category.
- Produced final Evaluation Batch 5 arrays `C16-E13` through `C16-E15` with all
  22 standard case types in exact order, all 21 fields in exact schema order,
  and all cases `Planned`.
- Preserved Category 11 `custom_trading_session` unavailability until a
  complete effective-dated IANA-zone, calendar/day, bounds/endpoints,
  overnight, and version contract exists; only then does Category 13 resolve
  selected-event membership.
- Preserved Category 11 `price_buckets` unavailability until complete saved
  basis, unit/currency, bounds/endpoints, boundary-tie, gap/overlap,
  applicability, version, and covered-price facts exist, with no current-quote
  or default-range substitution.
- Routed saved goal/version evaluation to locked Category 1 `evaluate_goal`
  while keeping target metric/rule calculation, population, chronology, basis,
  denominator, and coverage with the locked owner and inventing no progress.
- Structurally validated the final 66 cases: all three arrays parse, case IDs
  and natural inputs are unique, case types and keys are exactly ordered, and
  every capability status is `Planned`.
- Remediated the three focused final-batch residuals: the price ambiguity now
  covers all four privacy-safe branches without selecting a definition, price,
  or data; goal ranking now requires an explicit approved common formula/key
  and compatible declared direction before sorting, plus a compatible
  meaningful nonzero target denominator per ranking key with visible
  unavailable coverage while preserving the goal evaluation; and target-progress
  ambiguity now covers saved-goal, saved-rule/daily-target, and general-desire
  branches while preserving accepted state and staging every later field.
- Recorded final Evaluation Batch 5's independent PASS, completing all five
  batches and all 330 reviewed cases with zero failed, unreviewed, or pending.
- Completed the comprehensive pre-lock canonical, child-term, registry,
  evaluation, aggregate, uniqueness, schema, and substantive-coverage audit;
  recorded overall evaluation and coverage PASS; and advanced the category to
  Ready for Review Version 0 without approval, locking, runtime, or completion.
- Recorded the lead controller's 2026-08-11 approval and lock of all fifteen
  exact canonical names and all fifteen corresponding registries; advanced the
  metadata and fifteen canonical records to Version 1 without changing the 36
  child terms, formulas, registries, 330 Planned cases, aggregates, or no-
  runtime boundary.
- Recorded the master tracker's Category 16 Complete Version 1 and locked state
  and closed the final master-synchronization and Category Complete gates
  without changing inventory or evaluation content.

## Approval Decision

- Status: Complete Version 1; master-synchronized, approved, and locked.
- Approved by: Lead controller.
- Approval date: 2026-08-11.
- Version: 1.
- Canonical names approved: Yes, all 15 exact names.
- Canonical names locked: Yes, all 15 exact names.
- Language registries approved: Yes, all 15 registries.
- Language registries locked: Yes, all 15 registries.
- Master tracker synchronized: Yes; Category 16 is Complete Version 1 and
  locked.
- Capability status: Planned; no runtime authorization.

---

# 11. Change Log

| Date | Change | Reason | Version |
|---|---|---|---:|
| 2026-08-11 | Master completion synchronized; Category 16 marked Complete | Record the master tracker Complete Version 1 and locked state, close the final two checklist gates, and mark Category 16 Complete while preserving all 15 approved/locked canonical names and registries, all 36 child terms and formulas, all 330 passed Planned evaluations, exact aggregates, and the no-runtime boundary | 1 |
| 2026-08-11 | Lead controller approved and locked all 15 canonical names and registries | Transition metadata and all 15 canonical record Version fields to 1; approve and lock the exact names and corresponding registries without changing the 36 child terms, formulas, 330 Planned evaluations, aggregates, or no-runtime boundary; retain Ready for Review and leave only final master Complete sync and Category Complete pending | 1 |
| 2026-08-11 | Advanced Category 16 to Ready for Review after final Batch 5 and comprehensive pre-lock PASS | Record 15/15 canonical records, 36 child terms, 15/15 38-part registries, 15/15 22-case arrays, 330/330 reviewed PASS cases, exact aggregates, zero failed/unreviewed/pending, and substantive coverage while leaving approval, locks, Version 1, final master completion, runtime, and Complete pending | 0 |
| 2026-08-11 | Remediated three focused final Evaluation Batch 5 residuals | Preserve complete first-question branches for price and target ambiguity; require an explicit approved comparable progress formula/key, compatible meaningful nonzero target denominator with visible unavailable coverage, and declared compatible direction before sorting saved goals; preserve underlying goal evaluations | 0 |
| 2026-08-11 | Produced final Evaluation Batch 5 (`C16-E13` through `C16-E15`) after Batch 4 PASS | Complete all 330 drafted cases with exact saved-session, price-bucket, and goal owners; fail closed on incomplete definitions or coverage; preserve matching, version, collision, privacy, no-inference, no-mutation, and no-runtime boundaries | 0 |
| 2026-08-11 | Recorded independent PASS of Evaluation Batch 4 | Continue final evaluation production after all 66 rule, mistake, and playbook cases passed without category approval, locking, runtime, or implementation | 0 |
| 2026-08-11 | Remediated focused Evaluation Batch 4 owner and ambiguity residuals | Name locked followed/broken rule-state owners wherever those states are interpreted, and make Late Entry clarification privacy-safe and staged before saved-label class resolution | 0 |
| 2026-08-11 | Produced Evaluation Batch 4 (`C16-E10` through `C16-E12`) after Batch 3 PASS | Add 66 ordered-schema Planned cases for rule, mistake, and playbook language with separate recognition/association/rule-state/evaluation, exact/fuzzy/collision/ticker safety, coverage, privacy, and fail-closed contracts | 0 |
| 2026-08-11 | Recorded independent PASS of Evaluation Batch 3 | Continue account-scoped user-language evaluation production after all 66 cases passed without final category approval, locking, runtime, or implementation | 0 |
| 2026-08-11 | Remediated the `C16-E8-18` FGD clarification residual | Cover every live token-class branch in the first privacy-safe question, stage authorized saved setup/tag/strategy disambiguation second, and preserve accepted state plus association/version/period/metric gates | 0 |
| 2026-08-11 | Produced Evaluation Batch 3 (`C16-E7` through `C16-E9`) after Batch 2 PASS | Add 66 ordered-schema Planned cases for tag, setup, and strategy language with separate recognition/association/evaluation, exact/fuzzy/collision/ticker safety, coverage, privacy, and fail-closed contracts | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Evaluation Batch 2 | Continue account-scoped user-language evaluation production after all 66 remediated cases passed without final category approval, locking, runtime, or implementation | 0 |
| 2026-08-11 | Remediated initial Evaluation Batch 2 review residuals | Sequence attempt partitions before filters, distinguish Category 6 per-round-trip quantity primitives from the outer maximum aggregate, complete aggregate coverage/empty-state behavior, and clarify ambiguous share quantity one field at a time | 0 |
| 2026-08-11 | Produced Evaluation Batch 2 (`C16-E4` through `C16-E6`) after Batch 1 PASS | Add 66 ordered-schema Planned cases for repeat-trading, position-size, and price vocabulary with exact owner, sequence, coverage, matching, privacy, clarification, and fail-closed contracts | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Evaluation Batch 1 | Continue evaluation production after all 66 initial cases passed without final category approval, locking, runtime, or implementation | 0 |
| 2026-08-11 | Remediated initial Evaluation Batch 1 review findings | Keep fuzzy forms candidate-only, remove invented count concepts, preserve locked threshold ownership and lifecycle coverage, fail closed unsupported P/L paths, and require complete declared candle-source context with no defaults | 0 |
| 2026-08-11 | Produced Evaluation Batch 1 (`C16-E1` through `C16-E3`) after all registries passed | Add 66 ordered-schema Planned cases for outcome, frequency, and giveback vocabulary with exact owner formulas, mandatory child distinctions, matching/privacy gates, focused ambiguity, and fail-closed unsupported behavior | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Registry Batch 3 and all fifteen registries | Authorize evaluation production without final category approval, locking, runtime, or implementation | 0 |
| 2026-08-11 | Produced final Registry Batch 3 (`C16-TERM-011` through `C16-TERM-015`) after Registry Batch 2 PASS | Complete mistake, playbook, session-name, price-bucket, and goal language with 38-part owner, availability, matching, privacy, clarification, and no-runtime contracts | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Registry Batch 2 | Continue final registry production after records 006-010 passed | 0 |
| 2026-08-11 | Added `evaluate_label` to `user_strategy_language` compatible intents | Complete the locked Category 1 label-evaluation route without inferring association, redefining strategy, judging quality, claiming cause, or authorizing mutation/runtime | 0 |
| 2026-08-11 | Produced Registry Batch 2 (`C16-TERM-006` through `C16-TERM-010`) after Registry Batch 1 PASS | Complete the price, tag, setup, strategy, and rule language entries with 38-part owner, matching, version, privacy, clarification, and no-runtime contracts | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Registry Batch 1 | Continue registry production after records 001-005 passed without final category approval or locking | 0 |
| 2026-08-11 | Produced Registry Batch 1 (`C16-TERM-001` through `C16-TERM-005`) after all canonical records passed | Complete 38-part language routing for the first five generic groups with exact child-term, owner, clarification, safety, privacy, coverage, and no-runtime boundaries | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Canonical Batch 3 and all fifteen canonical records | Authorize language-registry production without final approval, locking, or runtime support | 0 |
| 2026-08-11 | Corrected Canonical Batch 3 session-name and goal owner routing | Preserve Category 11 `custom_trading_session` Unavailable definition ownership before Category 13 resolution and Category 1 `evaluate_goal` Planned intent before separate metric/rule evaluation, without implying runtime support | 0 |
| 2026-08-11 | Produced final Canonical Batch 3 (`C16-TERM-011` through `C16-TERM-015`) after recording Batch 2 PASS | Complete the mistake, playbook, session-name, price-bucket, and goal language contracts with exact ownership, association/evaluation, version, authorization, privacy, and no-runtime boundaries | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Canonical Batch 2 | Continue final canonical production after records 006-010 passed review without approving or locking the category | 0 |
| 2026-08-11 | Produced Canonical Batch 2 (`C16-TERM-006` through `C16-TERM-010`) after recording Batch 1 PASS | Complete price-language and the first four user-defined-label canonical contracts with exact threshold, version, authorization, collision, privacy, owner, and no-runtime boundaries | 0 |
| 2026-08-11 | Recorded independent/controller acceptance of Canonical Batch 1 | Continue canonical production after the first five records passed review without approving or locking the full category | 0 |
| 2026-08-11 | Produced Canonical Batch 1 (`C16-TERM-001` through `C16-TERM-005`) after controller authorization | Define the first five generic vocabulary groups and all thirty child-term boundaries without changing locked owner concepts or claiming runtime support | 0 |
| 2026-08-11 | Recorded controller acceptance of the exact fifteen-record/36-child-term controlling inventory | Authorize canonical deliverable production while keeping the category unapproved and unlocked | 0 |
| 2026-08-11 | Created Category 16 planning and the exact fifteen-item Version 0 controlling inventory | Preserve the six named vocabulary groups, nine user-defined classes, individual source-term distinctions, and safe account-scoped registry behavior before deliverable production | 0 |
