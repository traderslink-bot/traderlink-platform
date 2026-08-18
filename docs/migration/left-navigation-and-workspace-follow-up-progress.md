# Left Navigation and Workspace Follow-up Progress

**Status:** Complete on 2026-08-18.

**Controlling plan:** [Migration Progress](migration-progress.md)

## Owner-approved changes

- Data Decisions is a direct navigation link; the separate Data group is removed.
- Import Trades follows Account; Market Charts, Data Decisions, and Help Center are the final three links in that order.
- Trading Rules and Rule Results follow Open Positions in the Trades group.
- Workspace places Current Focuses, Focus rules, and Previous trading-day review in one responsive row on large screens.
- Long Current Focuses text stays within its card and provides a View more control.
- The Workspace Add a manual trade card is removed.

## Verification

- No test suite or dashboard process was run, per the current low-resource design-first direction.
- Targeted ESLint and `git diff --check` passed for the changed dashboard sources; no test suite, app server, or production build was run.
