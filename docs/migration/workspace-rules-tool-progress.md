# Workspace Rules tool progress

Related plan:
[workspace-rules-tool-plan.md](./workspace-rules-tool-plan.md).

## Current state

| Item | Status |
| --- | --- |
| Reusable Rules and Rule Results panel bodies | Implemented locally |
| Lazy Workspace Rules panel and views | Implemented locally |
| Optional period-aware broken-rules Workspace card | Implemented locally |
| Left-navigation Rules group removal | Implemented locally |
| Source QA | Complete |
| Owner visual review and release | Pending |

## Guardrails

- Reuse the existing account-scoped Rules and Rule Results contracts.
- Keep direct `/rules` and `/rules/results` routes working.
- Never derive results in the browser or treat omitted manual selections as
  broken rules.
- No dashboard server, broad test suite, production build, or release action
  runs during this design and implementation pass.

## Source QA

- **+ Rules** opens a lazy, account-scoped Drawer. It uses a four-view tab row;
  the existing Rules management client supplies Trading Rules, preset browsing,
  and custom-rule creation, while the existing factual Rule Results client
  supplies results history.
- Opening the Drawer loads rule management only. The all-time Rule Results
  read runs only when the trader selects **Rules results**, avoiding that
  heavier work during ordinary rule editing. When opened directly to Results,
  the results read waits for the initial Rules model rather than competing with
  it for database resources.
- The Drawer is full-width on mobile and 1040px wide on desktop. It contains
  no application navigation and is listed in the dashboard-template Drawer
  allowlist.
- The optional card defaults off, stores its choice for the selected account,
  follows the effective Workspace date range, reports unique rules broken, and
  lists at most three recent broken-rule titles. It performs no browser-side
  rule calculation.
- A successful rule mutation reloads the panel model before results are shown,
  so a newly created, changed, paused, resumed, or retired rule does not leave
  the panel's Results view stale.
- If the selected Journal account changes while the Rules panel is open, the
  panel closes before the user can act on a prior account's client model. The
  rendered panel is additionally bound to the account selection reference that
  opened it, so prior-account content cannot render during that transition.
- The Workspace-card preference write carries the panel's expected account
  selection reference and fails without writing if the selected account changes
  while that request is in flight.
- The direct `/rules` and `/rules/results` routes remain intact. The normal
  left-navigation Rules group is removed.
- `git diff --check` passed. No app process, test suite, TypeScript run, or
  production build was started under the low-resource design-first direction.

## Help review

The Help Center currently has no dedicated Trading Rules article in this
replacement checkout. There is therefore no existing guide to correct for the
new Workspace entry point; a dedicated Rules help article remains a separate
documentation slice.
