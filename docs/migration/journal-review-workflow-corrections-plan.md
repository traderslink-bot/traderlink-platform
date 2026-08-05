# Journal Review Workflow Corrections Plan

**Status:** Owner-approved product direction. The remaining Data Decisions
follow-up is consolidated in the separate [Data Decisions Repair and Review
Plan](data-decisions-repair-and-review-plan.md); no implementation begins from
that draft alone.

**Progress:** [Journal Review Workflow Corrections Progress](journal-review-workflow-corrections-progress.md)

## 1. Objective

Correct the integrated Journal review experience so an ordinary trader sees
plain, useful choices instead of internal reconstruction controls. The work
keeps the accepted Journal integrity boundaries: exact source evidence,
versioned executions, one account-scoped ledger, deterministic round trips,
trader-controlled Data Decisions and visible unrelated valid activity.

The correction covers the Day and Swing Trackers, manual execution corrections,
Trading Rules, preset tags, Data Decisions, repeated warning notices and Calendar
annotation indicators. It does not add V3 runtime authority, sample data, guessed
financial values, a second execution store or a second Swing ledger.

## 2. Product decisions

### 2.1 Ordinary manual capture

- The route selected by the trader supplies the intended trade style:
  `/trade-tracker` supplies Day and `/trade-tracker/swings` supplies Swing.
- The server still validates and previews the complete selected-account chain
  before any write.
- An obvious, internally consistent manual trade saves without a separate
  ceremonial confirmation screen.
- Internal values such as `start_new_trade`, `continue_tracked_position`,
  `close_tracked_position` and `day_trade` never appear as ordinary UI labels.
- The UI does not ask the trader to confirm that an obvious balanced buy/sell is
  closed or that a trade entered through Swing was planned as a Swing.
- A focused question appears only when the proposed rows genuinely conflict with
  a current position, create a direction flip whose excess position needs intent,
  or otherwise require a factual choice. The question names the ticker and the
  fact that needs attention in ordinary trading language.
- Editable rows remain available before save. The reminder says: “For the best
  match with future statements, enter the time, price and quantity exactly as
  they appear in your broker.”

### 2.2 Saved manual execution corrections

- A saved canonical manual execution has an Edit action from its trading-day
  execution list and from the applicable Swing execution history.
- Editing creates a new immutable execution version. It never overwrites or
  deletes the original manual source evidence.
- The mutation re-authorizes owner/workspace/account access, verifies an opaque
  account- and version-bound execution reference, rejects stale revisions and
  validates date/time, instrument, side, quantity, price, fees and currency.
- If date, ticker, currency or position effect changes, all old and new affected
  account/instrument/currency chains are rebuilt in the same transaction.
- Corrections preserve the stable trade identity only when deterministic
  rebuild proves the same successor; ambiguous annotation links fail closed.
- A manual row involved in broker reconciliation is never silently detached or
  replaced. The correction uses the existing evidence-preserving Data Decisions
  path and then re-evaluates the candidate set.
- The response returns only privacy-safe affected dates and stable route refs.

### 2.3 Day and Swing ownership

- Daily Trade Tracker owns Day entry, day-trade cards, daily notes, daily rules and
  current/recent day review.
- Swing Trade Tracker owns Swing entry, active/recent Swing lifecycle cards,
  dated Swing notes and Swing-level annotations.
- Both surfaces continue to read and write the same Journal execution ledger.
- A Swing fill remains visible as factual execution activity on its actual date,
  but Day Tracker does not duplicate the full active-Swing card. A compact Swing
  activity link/count may point to Swing Tracker.
- `/trades/open` remains the factual inventory for all confirmed open positions,
  including Swing, still-open Day, unplanned holds and other confirmed opens.
- Only the longest matching navigation destination is active; `/trade-tracker`
  must not stay active while `/trade-tracker/swings` is selected.
- “Planned from entry” is removed from visible UI. Existing stored plan evidence
  remains preserved for audit compatibility.

### 2.4 Trading Rules

#### Superseding catalog direction — 2026-08-04

- Remove these presets from the Trading Rules catalog and all rule-selection
  surfaces:
  - Reduce the next trade to half size after a loss
  - Trade only the selected direction
  - Skip the next trade after an outcome
  - Wait after a losing trade
- These four presets are permanently retired product decisions. Future rule
  ideation, catalog expansion, migrations and compatibility work must not add
  them back under the same wording or a substantially equivalent behavior
  without a new explicit owner decision.
- Add the preset **Stop after a daily realized gain limit**. Its eventual
  implementation must use the selected account's configured trading-day
  boundary and exact realized gain from eligible closed trades; it must not
  guess from open positions, unrealized P/L or incomplete trade chains.
- This is a catalog change only. It does not authorize implementation in this
  planning revision.

- Every preset must activate, revise, pause/resume and retire using the accepted
  selected-account boundary.
- Configuration keys use one documented format consistently across catalog,
  client, service, persistence and evaluation. The generic validator must not
  reject the catalog’s own keys.
- Each preset has exact server-side validation for required keys, allowed
  values, positive numbers, whole counts, time values and ranges. Unknown and
  extra fields are rejected.
- Errors identify the field and correction in plain language; internal error
  codes remain server-side.
- The implementation verifies the complete preset catalog, not only the four
  presets reported during review.
- Daily Trade Tracker shows a preset outcome only after a real evaluator provides
  Followed or Broken. It never presents an uncomputed preset result as a manual
  “Not reviewed” task for the trader.

### 2.5 Preset and custom tags

- The Journal supplies a small, versioned, broker-neutral preset catalog grouped
  as Setup, Entry and execution, Exit, Mistake, Emotion, Market context and Risk
  and process.
- Custom tags remain available and appear under Custom.
- Presets are virtual until selected. Saving a missing preset atomically creates
  the account-scoped tag and assigns it to the selected trade; no global
  cross-account tag record is shared.
- Persisted tags matching a known preset regain their display category from the
  versioned catalog. Renaming a custom tag never silently converts another tag.
- Existing per-trade tag limits, optimistic revision checks and stable round-trip
  identity protections remain enforced.
- Day trades and Swings use the same tag authority. Swing details expose tags and
  applicable rule review without duplicating execution facts.

### 2.6 Data Decisions

#### Superseding owner direction — 2026-08-04

The following direction supersedes any conflicting wording in this section and
in the earlier open-position correction:

- Data Decisions is a trader-facing repair and trade-resolution area. It helps
  the trader make imported rows match their broker statement; it does not ask
  them to repair internal position facts, choose raw identifiers or explain the
  application's reconstruction method.
- It provides three connected views for a selected statement and account:
  **Statement details** shows every preserved source row; **Statement issues**
  shows only flagged rows with direct repair controls; and **Trades needing a
  decision** groups affected rows by their reconstructed trade.
- A trade card uses the label **Executions used by this trade**. It shows every
  execution used by that trade and every flagged imported row relevant to it,
  even if the flagged row was not accepted into the current reconstruction.
  Use a plain source label such as "Imported from broker statement," not the
  ambiguous status "accepted."
- The normal action is **Fix this row**. Editing appends a correction/version;
  it never overwrites or deletes original broker evidence. A missing execution
  may be added only when the broker statement genuinely contains one that the
  importer did not detect.
- **Do not use this as a trade execution** is an exceptional advanced action,
  not the normal solution. It is for a false, duplicate or non-trade row, a
  broker correction/reversal, or a corporate-action case that cannot yet be
  represented safely. It preserves the row and decision history, removes only
  its derived ledger effect, and can later be revised. A concise reason category
  is selected; no free-form explanation is required.
- When an imported trade ends nonzero, the practical choices are: confirm that
  it is still open and classify it; add the real missing closing execution(s);
  or repair the imported row that is wrong. Open classifications are Active
  Swing, Long-term hold, Unplanned hold (bag hold), Day trade still open and
  Other.
- Resolved items move to a separate review history. The default queue remains
  the work that needs attention. Remove raw position-fact controls, mandatory
  decision notes, the long implementation paragraph and generic links to
  affected trading days or account analytics.

- Decision cards are collapsed by default and lead with issue title, “Needs your
  decision,” ticker/currency, one direct question and one short consequence.
- The question is derived on the server from the issue type and accepted
  evidence. The browser does not calculate positions or invent financial facts.
- Examples include “Which position total matches your statement?”, “What
  position did you actually hold at the end of this statement?” and “Does this
  broker fill match the manual execution you entered?”
- `Review and decide` expands source evidence, exact differences and permitted
  actions. Large queues therefore remain scannable.
- The long “Before/After” implementation paragraph is removed. Expanded help may
  say that only the affected ticker is rebuilt and unrelated trades remain
  available.
- Evidence, actions, original source rows and append-only decision history remain
  complete; progressive disclosure changes presentation only.

### 2.7 Dismissible repeated notices

#### Superseding owner direction — 2026-08-04

- A dismissal is scoped to the selected account and the pending-decision digest,
  not to one page. Closing it on one Journal or Analytics page hides the same
  unchanged notice across those pages.
- A colored Data Decisions navigation badge continues to show the selected
  account's unresolved count after a notice is dismissed.

- Repeated Data Decisions coverage banners can be closed without resolving or
  hiding the underlying decisions.
- The dismissal is browser-local and scoped to the selected account, surface and
  a server-derived digest of the current pending-decision set/revisions.
- The same unchanged notice stays hidden. A materially changed pending set gets a
  new digest and appears again.
- Decision counts, coverage indicators and the Data Decisions page remain
  available after dismissal.
- No raw decision UUID, account UUID or private evidence is put in browser
  storage.

### 2.8 Calendar annotation indicators

- Week-view ticker rows show compact indicators for notes, tags and reviewed
  rules. Month view uses smaller counts/icons and a bounded `+more` treatment.
- The day detail drawer shows the fuller annotation summary.
- Counts are composed server-side from Journal-owned annotations and the exact
  round trips represented by each Analytics calendar ticker/day.
- Note counts distinguish trade notes and dated Swing notes; tag counts are
  distinct assigned tags; rule status distinguishes reviewed, followed and
  broken where the saved review supports that fact.
- No browser-side financial or round-trip matching is introduced.

### 2.9 Decision-specific open-position review

#### Superseding owner direction — 2026-08-04

- A card contains only the affected trade's executions and relevant source rows,
  not every historical execution or technical position row for that ticker.
- A completed zero-to-zero trade remains available even if a later position in
  the same ticker needs review. Background opening/closing balance rows do not
  become a trader question when accepted executions establish the later trade's
  zero-to-nonzero start.
- An importer mapping defect, duplicate source row or contradictory statement
  evidence is repaired as source-row evidence. The user is not asked to set
  opening inventory merely because technical balance rows exist.

### 2.10 Import order, duplicates and time ordering

- An exact re-upload of a previously imported statement remains idempotent: the
  application reports that its executions are already imported and creates no
  duplicate ledger effect or new Data Decision.
- Near-duplicate broker/manual candidates remain contained for the trader to
  compare; manual evidence is not silently discarded or replaced.
- When two broker rows have the same valid execution time, their preserved
  source-row order is the deterministic tie-breaker. This is ordinary statement
  data, not a Data Decision. Only a missing or unreadable time needs repair.

- A Data Decision must show only the executions and position facts belonging to
  the affected reconstructed position, not every historical execution for the
  same ticker.
- A zero-to-zero trade that has already closed remains a ready closed round trip
  and stays available to Trades, Calendar and Analytics even when a later
  position in the same ticker needs a factual decision.
- A normal zero opening balance is background statement context, not a trader
  question, when the affected position begins later from accepted executions.
- When statement rows disagree after a later purchase but the statement's open
  position evidence supports a nonzero remainder, the card asks whether that
  remainder matches the broker account. It identifies the affected purchase
  date and quantity in plain language.
- Confirming the supported remainder corrects only the contradictory statement
  fact through an append-only correction; it never removes the original row or
  guesses a fact.
- After the factual position is confirmed, the trader is directed to classify
  that open position as an active Swing, long-term hold, unplanned hold (bag
  hold), day trade still open, or other. Classification is trader-authored
  intent, separate from the broker fact.
- If the remainder is not correct, the trader still has the full fact-correction
  path. Opening inventory is not offered when the accepted chain demonstrably
  starts from zero within the imported statement.

## 3. Contract correction

Intentional manual capture proves the entered executions occurred. It does not
prove complete brokerage-account/day coverage, but it also does not create a
routine warning merely for being manual. Genuine duplicates, source conflicts,
impossible position arithmetic, same-time ordering ambiguity that changes
allocation and broker/manual reconciliation candidates still create contained
Data Decisions. This supersedes the stale statement that every manual trading
date automatically creates a `manual_trading_day_coverage_unconfirmed` decision.

## 4. Implementation slices

### Correction 0: documents and contracts

- Record this plan and its progress tracker.
- Correct the stale manual-day Data Decisions language.
- Link the plan from the master plan, migration progress/register and Tracker
  plan/progress.

### Correction 1: Tracker capture and ownership

- Make the active navigation match the most-specific configured route.
- Keep server preview/validation while removing redundant ordinary confirmation.
- Use the selected Tracker route as the style authority.
- Remove visible “Planned from entry” language.
- Remove full Swing lifecycle cards from Day Tracker while retaining factual
  dated execution activity and a clear Swing Tracker path.

### Correction 2: versioned manual editing

- Add secure execution-edit read/mutation contracts and routes.
- Reuse or extract the append-only correction and rebuild transaction used by
  Data Decisions.
- Add edit controls to saved manual executions and Swing execution history.
- Prove stale-version, account isolation, reconciliation and old/new chain/date
  rebuild behavior.

### Correction 3: Trading Rules catalog

- Align the key-format contract and add template-specific validation.
- Improve plain-language validation feedback.
- Verify every preset’s complete lifecycle.

### Correction 4: tags and Swing annotations

- Add the versioned preset catalog and categorized chooser.
- Create missing selected presets atomically and keep custom tags.
- Connect tags and rule review to Swing detail using the same annotation service.

### Correction 5: Data Decisions and notices

- Add server-derived issue questions/summaries.
- Convert the queue to collapsed progressive-disclosure cards.
- Replace long implementation copy.
- Add reusable digest-bound dismissible notices across Journal/Analytics pages.

### Correction 6: Calendar annotations

- Add Journal server aggregation for the calendar’s exact round-trip/day scope.
- Add bounded Week, Month and drawer annotation indicators.

### Correction 7: integrated verification and review

- Run focused static/type/lint/tests after each complete slice, with one Vitest
  worker where tests are needed.
- At the final checkpoint run the applicable migration/static guards, focused
  regression, full TypeScript/lint/build and browser verification as resources
  allow.
- Verify no V3 imports, sample fallback, raw identifiers, duplicate execution
  effects or unrelated-data suppression were introduced.
- Restart the protected port-3010 replacement instance only for the completed
  owner visual/product review.

### Correction 8: scoped position decisions

**Superseded scope note:** Implement this correction using the repair-first
direction in sections 2.6, 2.9 and 2.10. Do not add raw position-fact controls
or generic opening-inventory actions.

- Resolve Data Decision evidence against the exact affected current round-trip
  projection and its allocated executions.
- Keep unrelated closed round trips out of the card and use a concise summary
  for any conflicting statement rows.
- Replace generic opening-inventory guidance with an open-position confirmation
  flow where the imported chain already establishes a zero start.
- Hand off a confirmed factual position to the existing open-position
  classification surface with trader-facing labels for Swing, long-term hold
  and unplanned/bag hold.
- Add focused regression coverage for a closed trade followed by a later open
  position in the same ticker, including statement-row conflict and account
  isolation.

### Correction 9: statement repair and review information architecture

- Add Statement details, Statement issues and Trades needing a decision using
  the same immutable source evidence and account boundary.
- Show flagged source rows alongside the executions used by the affected trade;
  never hide the actual row that prompted review.
- Provide field-specific inline correction, controlled missing-execution entry
  and exceptional derived-effect exclusion with revision history.
- Remove same-time ordering decisions when statement row order is available;
  retain only missing/unreadable-time review.
- Make dismissal account-wide across relevant surfaces and add the unresolved
  count badge to Data Decisions navigation.

### Correction 10: Trading Rules catalog revision

- Remove the four permanently retired presets from the catalog, rule chooser,
  validation/evaluation registry and all preset-specific UI copy.
- Add **Stop after a daily realized gain limit** with a required positive exact
  monetary limit and account trading-day/timezone scope.
- Evaluate it only against eligible closed-trade realized gain. Open positions,
  unresolved trades and unavailable reconstruction must not produce a guessed
  followed/broken result.
- Preserve existing historical rule-review evidence without presenting a retired
  preset as available for new activation.
- Update catalog-wide validation and focused lifecycle coverage for the revised
  catalog before final implementation review.

#### Automatic preset-evaluation contract — owner-approved 2026-08-04

- Presets evaluate only confirmed, eligible Day trades from the canonical Journal
  execution ledger. Swing trades, open positions, pending Data Decisions and
  unsupported reconstruction never receive a guessed preset outcome.
- Presets are grouped by what they evaluate:

  | Group | Presets |
  | --- | --- |
  | Trade rules | Avoid an entry-price range; No new trades after a selected time |
  | Trade + day rules | Maximum ticker attempts per day; Stop a ticker after losing attempts |
  | Day rules | Maximum completed trades per day; Stop after consecutive losses; Stop after a daily realized loss limit; Stop after a daily realized gain limit; Stop after a realized profit giveback |

- “Entry price” means the exact weighted-average price of all position-increasing
  entry executions in the completed trade, never merely its first partial fill.
- The configured Journal account timezone determines the trading date and local
  cutoff time. The first execution that moves position from zero is the factual
  start of a trade; the execution that returns position to zero is its close.
- “Stop after” rules are broken only by a later eligible Day-trade entry after
  the threshold has been reached. The trade that reaches a realized loss, gain,
  streak or giveback threshold is not itself a violation.
- Each calculated result is Followed or Broken. A result is N/A only when that
  particular rule cannot be calculated from its required facts; it never blocks
  unrelated rules, trades or trading days. Missing time affects only
  time/sequence rules; unresolved chains affect only dependent results.
- Preset outcomes are system-calculated. The Daily Trade Tracker does not show
  a manual Followed/Broken/Not reviewed selector for presets. Custom rules
  remain trader-authored review items.
- Preset outcomes are derived from the current confirmed Journal facts whenever
  the tracker reads the affected day. They are not copied into a mutable manual
  review record, so a later factual execution correction immediately produces a
  correct recalculation. Custom-rule reviews remain separately persisted.
- A newly activated preset applies from the beginning of its activation date in
  the account's trading timezone. A trader may therefore add a rule during a
  day’s review and receive its result for that day’s trades; earlier trading
  dates remain N/A unless a future historical-analysis feature adds an explicit
  “apply from” date.

### Correction 11: Daily Trade Tracker one-day review workflow

**Implementation status:** Implemented locally on 2026-08-04; owner visual
review remains pending.

- A Day Tracker manual-entry submission may contain executions for any date,
  but all submitted rows must belong to one Eastern Time trading date. The
  client and server preserve the form and plainly reject a mixed-date batch;
  no first row establishes or locks the selected date.
- Saving executions writes the normal selected-account execution ledger and
  creates or updates that date's Day Tracker. It does not mark the day reviewed.
- Tags and notes save independently wherever the trader chooses to use them;
  all saved notes remain editable before and after day completion.
- The final Daily Trade Tracker action is trader-authored: **Mark day
  reviewed**. A day not marked Reviewed remains incomplete without a separate
  action. Marking it Reviewed automatically saves any unsaved trade and daily
  notes first; leaving with unsaved notes or an unreviewed day gives the trader
  a clear warning. A weekly/monthly AI review uses only the explicit Reviewed
  state captured at its scheduled one-time run. It ignores unreviewed dates,
  does not invent a no-trade review, and never revises an already issued weekly
  review because of a later edit.
- An intentional manual entry may leave a position open. Before its date is
  marked reviewed, the trader classifies that open position as Swing,
  Long-term hold or Bag holding. Saving the executions remains allowed before
  that classification.
- Day Tracker manual-entry dates/times use Eastern Time for the current U.S.
  market workflow so copied broker-app entries, the Day Tracker and imported
  broker statements use the same trading-day clock. Future account types may
  define their own broker-market timezone without changing this behavior.

### Correction 12: Open-position and Swing Tracker consolidation

**Implementation status:** Owner-approved; implementation active.

- Daily Tracker open-position cards use the same left-summary/right-detail
  structure as closed ticker cards. The prominent label is **Open position**;
  the internal-style label "Day trade still open" is not displayed there.
- A non-Swing open position can show its factual executions, versioned manual
  edit controls, trade tags, applicable rules and one editable trade note in
  the Daily Tracker. These annotations attach to the same in-progress Journal
  trade, never a second position store.
- Selecting Active Swing classifies the factual open position from Daily
  Tracker. Its Swing-specific notes, tags, rules, execution history and future
  position changes are then managed in one place: the Swing Tracker main page.
  Daily Tracker provides a direct path there rather than duplicate editors.
- The Swing Tracker main page expands each ticker card to contain position
  facts, execution history/editing, tags, dated saved-note links and an
  **Add additional note** action. It does not show an always-open current-day
  note textbox. The separate Swing detail route redirects to the matching main
  tracker card for compatibility.
- Swing average entry uses the normal money presentation (for example,
  `$1.00`), not a currency-code prefix. Prices display two decimal places.
- Rules that measure a day-trading behavior are not presented as Swing review
  tasks. Swing Tracker cards show no Rules section, and a Swing classification
  never carries Daily Tracker rule reviews into Swing Tracker. Daily open
  position cards present applicable rules only for a Bag holding classification.
  A later Swing-specific rule contract requires an explicit owner decision
  before any such control returns.
- Swing manual entry accepts the real date on every execution. A completed
  Swing may therefore include an earlier opening date and a later closing date;
  only the Daily Trade Tracker rejects a mixed-date batch.
- A Swing card offers one plain **Add execution** action, which currently opens
  the same Journal manual-entry flow as the page-level form. There is no
  special close mutation: selling/buying enough shares closes the factual
  position, while reclassification to Bag holding keeps it open.
- An already-confirmed Active Swing does not repeat the general position-type
  selector. Its card has one **Add execution** action and one **Mark failed
  swing** action. The latter reclassifies the still-open position as Bag
  holding; it never fabricates a closing execution.
- Daily Trade Tracker does not mention active Swings merely because they exist.
  It shows an Active Swing card only when that day contains an execution linked
  to the Swing. A Daily entry that continues or closes an existing Swing keeps
  the Swing classification and links to that same factual trade; it never
  creates a new Day trade. The Daily card offers the same failed-Swing action
  and no Swing rule controls.

### Correction 13: factual Day-trade analytics classification

- Treat a reconstructed ready-closed trade as a factual Day trade when its
  opening and final closing executions have the same account trading date.
  Treat it as a Multi-day trade when those dates differ.
- Keep this analytics classification separate from the trader's chosen Swing,
  Bag holding or other position classification. An intentionally entered Swing
  that closes on its opening date retains its Swing tracker treatment and is
  still included in factual Day-trade analytics.
- Analytics Lab provides a direct Day-trades-only filter, so holding-time and
  other metrics can be calculated for that factual population without an
  unnecessary Day-versus-Multi-day comparison.

## 5. QA and stop conditions

Stop the affected slice if any implementation:

- writes a second manual or Swing execution store;
- bypasses server authorization, account selection, revision or idempotency;
- overwrites/deletes original execution evidence;
- auto-confirms a real conflict or asks for confirmation when facts are already
  deterministic;
- treats the Tracker route label as proof that contradictory ledger facts are
  valid;
- hides an underlying Data Decision when dismissing a notice;
- stores raw private IDs/evidence in browser preferences;
- allows one bad rule field to partially save a rule;
- creates preset tags globally across users/accounts;
- infers a Swing from elapsed time;
- moves full active-Swing lifecycle management back into Day Tracker;
- calculates annotation-to-trade relationships or financial values in the
  browser;
- revives V3, sample data or legacy test annotations; or
- lets an unresolved trade hide unrelated accepted activity.

## 6. Acceptance checklist

- [x] Product correction direction approved through owner review feedback.
- [x] Day/Swing surface ownership decided.
- [x] Ordinary deterministic manual save and exceptional-question boundary
  decided.
- [x] Versioned saved-manual editing boundary decided.
- [x] Rule catalog-wide validation boundary decided.
- [x] Preset/custom tag model decided.
- [x] Data Decisions progressive-disclosure and notice-dismissal behavior
  decided.
- [x] Calendar annotation meaning decided.
- [x] Corrections 0-6 implemented.
- [x] Focused and integrated verification passed.
- [x] Completed UI ready for owner visual/product review.
- [x] Decision-specific CISS/open-position clarification approved by owner
  feedback.
- [ ] Scoped open-position decision flow implemented and verified.
- [x] Data Decisions repair-first information architecture approved for planning.
- [ ] Statement repair and review information architecture implemented and
  verified.
- [x] Trading Rules permanent retirement and realized-gain-limit direction
  approved for planning.
- [ ] Trading Rules catalog revision implemented and verified.
