# Trading Rules Evidence And Results Plan

**Status:** Complete and owner approved on 2026-08-10.

**Progress:** [Trading Rules Evidence And Results Progress](trading-rules-evidence-and-results-progress.md)

**Help collection:** [Trading Rules Help Center Plan](help-center-trading-rules-plan.md)

**Related planning:** [Preset Rule Recommendations Plan](preset-rule-recommendations-plan.md)
is a separate future recommendation feature. This plan reports facts about
rules the trader already chose. It never recommends keeping, removing or
changing a rule.

## Purpose

Make Trading Rules complete enough to explain every automatic preset result,
show the evidence in Daily Trade Tracker and its existing chart, and provide a
factual `/rules/results` history. Preset rules remain automatic after the
trader selects and configures one. No daily confirmation, explanation, note or
exception input is required for a preset.

Manual rules remain trader reviewed. Every applicable manual rule begins as
**Not selected** without requiring an action. The trader may explicitly choose
Followed or Broken and may add an optional note.

## Product boundaries

- Preset outcomes are deterministic `Followed`, `Broken` or `N/A` results.
- The trader cannot override an automatic preset outcome.
- Missing required facts produce `N/A`; they never become Followed, Broken or
  zero.
- Rule Results uses factual counts, results, P/L and coverage only. It never
  uses labels such as helpful, harmful, keep, remove, continue, stop using or
  review this setting.
- AI does not calculate, phrase, rank or interpret Rule Results.
- This plan adds no preset, no automatic recommendation and no market/news
  inference.
- All reads and writes remain isolated to the selected Journal account.
- Exact money remains decimal text until presentation. Browser code never
  recalculates financial facts.

## Exact applicability

Rule history must be reconstructed from immutable versions and lifecycle
events, not from the rule's current state alone.

- A rule applies only after the exact `effective_from_utc` of its applicable
  version.
- Paused intervals are excluded; a resumed interval begins at its exact event
  timestamp.
- Retirement ends future applicability while retaining all earlier results.
- A same-day rule activation never evaluates earlier executions from that day.
- Results from different rule versions/settings remain separate by default.
- Ready-closed Day trades are the preset population. Swing trades, open
  positions and fact-dependent chains in Data Decisions are not guessed into
  the population.

## Preset evidence contract

The server-owned preset evaluator returns an immutable evidence object for
each applicable rule target. It contains:

- deterministic evaluation key and current Journal fact-set digest;
- rule identity, exact rule-version identity and configured values;
- exact active interval used for the evaluation;
- trading date, account timezone and target day or round trip;
- status: Followed, Broken or N/A;
- trigger kind, timestamp and referenced execution/round trip when applicable;
- factual values immediately before and after the trigger;
- first violating execution/round trip and all later violating events;
- actual realized P/L of the violating completed trades;
- fee coverage and the exact N/A or chart-coverage limitation; and
- stable links needed to open the date, trade and chart evidence.

Automatic evidence is derived from current immutable Journal facts rather than
stored as duplicate financial facts. Import corrections and accepted Data
Decisions therefore rebuild the evidence deterministically.

### Trigger and violation definitions

- **Avoid an entry-price range:** the weighted entry price is both the checked
  value and violation evidence; anchor to the entry execution.
- **Cooldown after a loss:** the prior losing trade's final exit triggers the
  cooldown; a later entry before the permitted time is a violation.
- **Cooldown before re-entering the same ticker:** the prior same-ticker final
  exit triggers the cooldown; the early same-ticker re-entry is a violation.
- **Maximum ticker attempts:** completing the allowed attempt establishes the
  limit; the opening execution of the next attempt is the first violation.
- **Maximum completed trades:** completing the allowed trade establishes the
  limit; the opening execution of the next completed Day trade is the first
  violation.
- **No new trades after a selected time:** the configured account-local time is
  the trigger; the first entry at or after it is the first violation.
- **Consecutive or total daily loss-count limits:** the closing trade that
  reaches the selected loss count is the trigger; a later entry is the first
  violation.
- **Daily realized loss/gain and profit-giveback limits:** the closing trade
  that crosses the configured realized threshold is the trigger; a later entry
  is the first violation. The trigger trade is not itself a violation.
- **Stop a ticker after losing attempts:** the same-ticker loss that reaches
  the configured count is the trigger; a later same-ticker entry is the first
  violation.

Ambiguous chronological order, missing required times/P&L/prices or incomplete
dependent facts produce N/A only for the affected evaluation.

## Daily Trade Tracker

Rule rows remain compact and use inline disclosure rather than a drawer.

- Broken presets show **Details**.
- N/A presets show **Why N/A**.
- Followed presets remain collapsed; their history remains available in Rule
  Results.
- Expanding a trade rule shows its setting, trigger, first violation, affected
  trade, realized result and coverage.
- Expanding a daily rule shows a chronological timeline of the threshold and
  every later violation.
- The day summary distinguishes unique **Rules broken** from **Broken events**.
- Every evidence row can open the exact trade and select its chart marker when
  chart coverage exists.

### Manual results and notes

- Each applicable manual trade rule has one opportunity per eligible completed
  Day trade. Each manual day rule has one opportunity per Daily Tracker
  trading day. `both` rules create the corresponding separate targets.
- The result dropdown visibly defaults to **Not selected**. No database write
  is required for the omission; absence of a saved review derives Not selected.
- Followed and Broken require an explicit selection.
- Selecting Not selected after a saved result appends a `not_reviewed` review
  version, preserving the existing database value and history.
- Not selected never blocks **Mark day reviewed** and no reason is requested.
- **Add note** or **View note** expands an optional text editor. The note is
  versioned independently so it can exist in any result state.
- Long custom-rule names may truncate in the selector but display fully in the
  expanded content and accessible label.

The note foundation uses new account-scoped rule-review-note identity and
immutable revision tables keyed to the exact rule version and day/round-trip
target. Stale account selections and stale revisions fail without writing.

## Rule chart markers

The installed Lightweight Charts version is 5.2.0. Extend the existing custom
annotation primitive and existing in-chart information box rather than adding a
drawer, modal or separate chart component.

- Use reserved gold `#9A6700` with white text only for Rule markers. This color
  is not in the current execution/pattern marker palette and meets normal-text
  contrast against white.
- A Rule marker uses a longer, thinner leader line and a farther placement lane
  than execution and pattern markers so those markers retain visual priority.
- Create one marker for each broken rule and anchor it to that rule's first
  violating execution candle.
- When several broken rules share the same candle, combine them into one marker
  labelled **N RULES** while retaining each separate evidence result.
- Clicking a Rule marker reuses the current chart information box and lists all
  grouped rule evidence. The box becomes pinned and interactive, with a close
  button, Escape/click-elsewhere dismissal, mobile-safe width and bounded
  internal scrolling.
- Selecting a marker expands/highlights its Tracker rule row. **Show on chart**
  selects the marker without unnecessarily resetting chart zoom.
- If the violating timestamp has no matching candle coverage, no marker is
  invented. The correct Broken result and Tracker evidence remain visible with
  an explicit chart-coverage limitation.

## Rule Results

Add `/rules/results` as a separate factual page. Link it from `/rules` and each
active rule card through **View results**; do not add another primary left-nav
destination.

The default view covers the current rule version from its exact effective
time. Earlier versions are selectable and never silently combined.

### Search, filters and history

Server-owned URL filters cover rule, preset/manual kind, result, day/trade
scope, date, ticker and version. Results use bounded pagination and stable
newest-first ordering. Sort options include most recent, most checked, most
broken, lowest selection coverage and actual P/L of broken events.

Each history row shows date, rule, exact version, target, result, actual P/L,
coverage, optional-note presence and links to Daily Tracker evidence/chart.

### Preset facts

Preset cards report:

- eligible checks, Followed, Broken and N/A;
- unique days and unique broken rules versus broken events;
- actual combined P/L, wins/losses and largest gain/loss for violating trades;
- ticker/day concentration and single-trade concentration;
- exact fee coverage; and
- current-version effective duration with earlier versions separate.

Deterministic factual sentences may say:

- “This rule was broken 8 times across 6 trading days. Those trades totaled
  −$640. Six were losses and two were gains. The largest loss was −$230.”
- “This rule was broken 4 times across 3 trading days. Those trades totaled
  +$310. The largest gain was +$280; the other three trades totaled +$30.”
- “Three of the five broken events occurred in the same ticker.”
- “One trade accounted for 90% of the combined gain.”
- “The rule had 12 eligible checks and 2 N/A results.”
- “Broken trades totaled −$420 before fees; fee coverage was unavailable.”
- “The current $500 setting has been active for 18 trading days. The earlier
  $300 version is shown separately.”

No sentence concludes whether the rule is useful.

### Manual facts

Manual cards report eligible opportunities, Followed, Broken, Not selected,
selection coverage, optional-note presence and target-appropriate trade/day
P/L. A missing selection remains a counted fact without inferring why.

## Implementation sequence

1. Add exact lifecycle/version reads and the rich preset evidence contract.
2. Add independent versioned manual-rule notes and Not selected presentation.
3. Add inline Tracker evidence/timelines and unique-rule/event counts.
4. Add grouped gold chart markers and reuse the chart information box.
5. Add the server-owned `/rules/results` read service and page.
6. Complete focused verification, owner visual approval and checkpoint gates.

## Verification and acceptance

During the design/UI construction pass, do not run Vitest or broad suites.
After the complete slice is ready for owner visual review, verify in the
project's low-resource cadence.

Focused evaluator proofs cover every preset, threshold-versus-violation
semantics, timezone/DST ordering, same-time ambiguity, lifecycle intervals,
version changes, N/A behavior and account isolation.

Persistence proofs cover derived Not selected results, Followed/Broken changes,
clearing, optional notes in every state, immutable note revisions and stale
selection/revision rejection.

Results proofs cover aggregates, current/earlier versions, unique rules versus
events, factual sentence generation, fee/coverage handling, search/filter/sort
and the absence of recommendation language.

Visual acceptance covers desktop/mobile inline disclosures, long manual-rule
names, combined same-candle markers, longer gold leader lines, existing marker
priority, the reused chart detail box and close behavior, missing chart
coverage, `/rules/results`, and row/marker synchronization.

After owner visual approval, run the smallest focused checks first, then the
required TypeScript/lint/build/browser checkpoint. Stage only this feature's
explicit files and preserve unrelated concurrent work.
