# Workspace Trade Library Journal Copy Correction Progress

**Status:** Copy correction ready; completion badge deferred

## Owner-approved correction

Remove these two inherited Journal-drawer lines without replacement:

- `Record what happened, what worked and what you want to remember.`
- `Saved notes, tags and rule results can be used in future AI Reviews.`

## Source reconciliation and allowlist

Both lines are rendered by the existing shared Trade Explorer review editor,
which Workspace embeds for the saved-trade Journal tab. The correction is
therefore limited to that presentation source, this plan link, and this
progress record. It does not alter notes, tags, rules, save behavior, review
data, or the Trade Explorer workflow outside the removed lines.

The existing Workspace gain/loss source already uses the exact gross,
fee-independent `gainLossDecimal`, two-decimal money formatting, and the shared
`financialOutcomeColor` helper. That helper returns green for a positive exact
decimal, red for a negative exact decimal, and neutral for zero; it is used by
the desktop list, mobile summary, and saved-trade drawer. No color-source edit
is required.

The proposed notepad Review icon with a green saved-Journal badge is deferred
from the active Workspace scope. The contract audit found no authoritative
persisted current-version completion fact: the review read model exposes only
the current note revision/text, assigned tags, and each custom-rule review
status/revision. `saveTradeReview` persists whichever changed subset was
supplied after strict account and expected-round-trip-version validation; it
does not write or return a completed-review state. The Workspace projection
likewise has no review state. No heuristic badge was added. A persisted,
current-round-trip-version completion contract is a later, separately approved
scope.

Allowlist:

- `app/(dashboard)/analytics/trade-explorer/trade-review-editor.tsx`
- `docs/migration/workspace-trade-library-plan.md`
- this progress record

## Verification

- `git diff --check` passed.
- The two removed strings are absent from the shared editor.
- The three Workspace P/L display sites retain `financialOutcomeColor` over
  `gainLossDecimal`; that exact gross, fee-independent projection value still
  formats to two decimal places.
- No server, tests, install, build, migration, data action, staging,
  deployment, push, or release action was performed.
