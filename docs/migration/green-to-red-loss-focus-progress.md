# Green-to-red loss focus

## Implemented locally

- Lead with Reached +20%, Finished red, Profit opportunity before the loss, and Actual losses.
- Opportunity and losses use exactly the same finished-red saved trades; actual losses remain red and include earlier realized gains in final Gross P/L.
- No profit taken / Some profit taken split only the finished-red population. Empty groups show a sentence instead of a misleading stack of zero-dollar amounts.
- Recovery remains separate; recovered-then-red trades are already included in losses, not additional trades.
- Highest-zone table now groups finished-red trades only. Exact records open with Finished red selected; other filters, pagination and the trade drawer remain available.
- Broad opportunity, profit taken and turned-red context remain available in a collapsed All trades that reached +20% section.
- Saved analysis calculations and qualification rules are unchanged. This slice changes presentation populations, not source trades or market data.

## Verification and release boundary

- Focused ESLint and diff whitespace checks passed. Reviewed aggregation inputs, denominators, empty states and retained table controls.
- No broad tests or app build run on the resource-constrained computer.
- Integrated desktop/mobile Light/Dark rendering has not been verified. Owner online visual review remains pending.
- Local implementation only; no push, deployment or coordinator handoff authorized for this slice yet.
- Help articles remain deferred until page acceptance.
