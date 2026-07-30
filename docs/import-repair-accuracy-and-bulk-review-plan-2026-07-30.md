# Import Repair Accuracy And Bulk Review Plan

Status: implementation in progress

Progress tracker: [import-repair-accuracy-and-bulk-review-progress-2026-07-30.md](./import-repair-accuracy-and-bulk-review-progress-2026-07-30.md)

Related feature record: `src/docs/data-decisions-import-repair-beta-plan-2026-07-29.md`

## Problem

The current Import Repair table treats every parser-set-aside broker row as a
trader decision. In the April Interactive Brokers statement this produces a
large false review count: valid stock executions end at rows 870–875, then
the statement changes into heading, FX, summary, and other non-stock records.
Those rows must remain visible, but they must not be presented as hundreds of
errors to correct or exclude.

## Product decisions

- Keep every original broker row visible in Data Decisions.
- Separate **Needs review** from **Automatically set aside**. Only the first
  group contributes to the review count or gets a row action.
- Automatically set aside recognized headings, report sections, non-stock
  rows, unfilled orders, and other deterministic non-execution rows. Explain
  the detected reason in plain language and do not require a trader decision.
- Keep truly ambiguous, malformed, unsupported, or incomplete stock rows in
  Needs review. Never invent missing values.
- Show Date and Time as separate visible and editable columns. The persisted
  V3 execution retains its exact timestamp. The separate columns are a
  reversible display of the broker value, not an inferred or invented value.
  The client recombines them only when the trader saves a correction.
- Add table sorting: Symbol A–Z/Z–A and Date/Time oldest/newest.
- Add row checkboxes, select-all-visible, and bulk action controls. Bulk
  actions may set **Exclude row**, **Keep as imported**, or **Reset to source**
  for selected review rows; they must not bulk-save invented corrections.
- Show a non-blocking **Possible open positions** signal based on net signed
  shares by symbol. An odd number of executions is shown as an additional clue,
  not proof of an open position.

## Delivery order

1. Diagnose the April IBKR statement boundary and ensure deterministic
   non-trade rows are classified as automatically set aside.
2. Correct review counting and display so automatic rows do not appear as
   manual repair tasks.
3. Add date/time display separation, sorting, selection, and bulk actions.
4. Add the possible-open-position signal using only complete accepted
   executions; disclose its limits.
5. Review the connected table with the owner before changing any persisted
   statement decision in the live review data.
6. Run only focused checks on changed files, then verify the April statement
   from canonical main on port 3010.

## Shared dashboard dependency

The April statement's 575 accepted stock executions are present in the V3
import history. The canonical dashboard is currently returning its explicit
unavailable state through the shared analytics-authority path. Import Repair
must not introduce a second dashboard data source or bypass that authority.
This work will keep the import records and their rebuild binding correct, while
the shared-authority repair restores those accepted executions to Workspace,
Trades, and Analytics.

## Date and time presentation decision

When an execution table is shown to a trader, it should display the exact
broker timestamp as separate Date and Time columns. The canonical timestamp
remains the identity and ordering authority. This is a display requirement;
it does not require a second analytics data source or a new financial value.

## Acceptance criteria

- The April statement does not claim that its heading/FX/summary block is a
  large set of trader errors.
- A deterministic non-trade block remains visible and has a plain-language
  automatic-set-aside explanation.
- Review count includes only rows requiring a choice or correction.
- Sorting and bulk selection work without changing unselected rows.
- Date and Time are separate columns and preserve the exact broker timestamp.
- Valid closed stock executions continue through the one shared V3 authority.
- No source row is silently dropped and no missing financial value is invented.
