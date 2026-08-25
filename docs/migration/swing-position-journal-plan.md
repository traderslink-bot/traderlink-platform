# Swing Position Journal And Tracker Card Plan

**Status:** Owner-authorized implementation contract

**Date:** 2026-08-22

**Controlling tracker plan:** [Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md)

**Progress:** [Swing Position Journal Progress](swing-position-journal-progress.md)

## Outcome

An intentional active Swing remains one Journal position. Selecting **Active
swing** in Daily Trade Tracker makes that same confirmed-open position appear
in Swing Trade Tracker automatically. It does not copy executions, create a
second trade, or make the Swing page authoritative over the Daily page.

Both views present the same desktop card structure: identity and factual
position summary at left, a compact execution history beside it, and the
position journal at right. The Daily Tracker does not show an **Open Swing
Tracker** button; the Swing Tracker remains the dedicated longer-running view
in the Trades navigation.

## Position journal facts

The position journal is trader-authored planning context, not broker evidence,
market data, realized P/L, or an AI conclusion. It is scoped to the stable
account and position identity and is versioned so later changes do not rewrite
the original plan.

Each saved plan revision contains:

- **Why I entered** — required trader-authored entry thesis;
- **Upcoming catalyst** — Yes or No;
- **Catalyst details** — required when the answer is Yes and otherwise empty;
- **Planned hold** — an exact selected number of trading days.

The planned hold selector records an integer, rather than a bucket. It offers
every value from 1 through 30 and common longer durations through 252 trading
days. Future analytics can compare the original selected duration with the
actual elapsed trading days without inventing a duration or collapsing it into
a broad bucket.

Existing Swing classifications and positions remain valid with no plan saved.
The UI invites the trader to add a plan; it never fabricates one or blocks an
existing factual position from appearing.

## Layout contract

On desktop at the `md` breakpoint and above:

1. The left rail contains the status, ticker, direction, average entry and
   opened time.
2. The factual execution history occupies a compact middle column. Editing an
   eligible manual execution remains available there.
3. The right column contains the position journal. Active Swings show the
   shared plan editor and dated Swing updates; completed Day trades show their
   existing trade note there.

Small screens retain a single-column readable order: summary, executions,
journal. No fact is hidden merely to make the desktop card compact.

## AI Review boundary

The position journal is eligible trader-authored context for a later AI Review
evidence packet. It does not establish a market fact, prove improvement, or
change eligibility by itself. An issued review remains immutable; later plan
or dated-note revisions can affect only future evidence gathering.

## Persistence and safety contract

- Add a new global migration after existing migration 0073; do not edit an
  applied migration.
- Extend the existing account-scoped, append-only-revision position-style plan
  for the stable round-trip/position identity; do not create a parallel Swing
  record.
- Read and write only through scoped Journal services and a validated client
  mutation route. The browser never receives private source-row or broker
  identifiers.
- Rebuilds preserve the position journal through the existing stable position
  identity. A stale or missing position is rejected rather than relinked by
  ticker, time, or a guessed match.
- The plan is not an execution, tag, Daily Note, Swing daily note, rule result,
  Data Decision, or broker import. It must not change reconstruction, P/L,
  counts, coverage, or the date assigned to a Daily Trade Tracker review.

## Delivery slices

- [x] Create the migration, scoped contracts, repository/service and route.
- [x] Add the shared editor and load the saved plan into both tracker reads.
- [x] Align the initial Daily open-position and Swing Tracker cards; remove the
      redundant in-card Swing Tracker link.
- [x] Apply the owner-requested exact desktop structure correction: left factual
      summary, compact execution column, and right-side Swing journal/notes.
- [x] Confirm the normal completed Day-trade note remains in the desktop right
      column without duplicating it.
- [x] Align Help Center guidance and static checks.
- [ ] Apply migration 0075 only in the agreed single-writer release window,
      then perform owner browser review of the real saved plan flow.
