# Day Analyzer count-card follow-up

## Local source correction

- Shared Day count-card label and number now use explicit sx warning.main, matching the PR scanner ticker token and the /day/trades card. This avoids theme Typography overrides taking precedence over the color prop.
- Shared label can wrap within the card. The /day/trades caption now overrides the shared metric component's noWrap locally; other dashboard metric cards are unchanged.
- Found an eligibility discrepancy: readAnalyzerFacts did not require an active round trip whose current version matched the saved analysis version. The analyzed-trades table does require this. Owner assigned count work to Build owner-only Market Data; sent that task this finding and removed my uncommitted six-line join to avoid overlapping fixes. No count-logic changes remain in this slice.
- No data deletion, forced counts, reanalysis, schema change, new client state, or dashboard-shell change.

## Remaining verification

- The owner reported 94 versus 89. The source mismatch is established, but the five specific live records have not been reconciled; do not claim that exact difference is confirmed resolved. Count repair belongs to task 01a08434-b594-7fa0-bc5c-e5170cc8950a.
- Focused ESLint and whitespace checks; no test suite, build, or production action. React review: existing components and accessibility retained, no new hooks, requests, or dependencies.
- Source changes implemented; integrated desktop/mobile Light/Dark verification and live count reconciliation pending. Help edits remain deferred.
