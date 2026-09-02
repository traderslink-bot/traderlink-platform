# Shared Notes Drawer Progress

Related plan:
[shared-notes-drawer-plan.md](./shared-notes-drawer-plan.md).

## Current state

| Item | Status |
| --- | --- |
| Product contract and mobile navigation | Owner-directed; recorded |
| Existing day/trade note and focus ownership audit | Complete |
| Additive categorized-notes and user-focus contract | Implemented locally; migration not applied |
| Shared Notes drawer | Implemented locally; focused source QA complete, needs owner visual review |
| First Day Trade Tracker trigger | Implemented locally; needs owner visual review |
| Optional Workspace Current Focuses display | Implemented locally; needs migration and owner review |
| Session tags and existing day-rule review controls | Implemented locally; needs migration and owner review |
| Analyzer changes | Explicitly out of scope |
| Browser review, migration application, commit, deployment | Pending owner and release checkpoints |

## Focused QA record

- Verified the shared drawer launches against a specific session date, reloads all
  note/tag/rule/summary reads when that date changes, and rejects stale responses.
- Corrected the date-switch and close paths so unsaved note text, session tags,
  or session-rule selections cannot be silently discarded.
- Corrected the Add Note layout so the date selector is at the top and the
  desktop Session tags and Session rules controls are beneath the note editor
  before the note save action.
- Corrected Session Summary to show its combined P/L across every completed
  trade, retain fee-aware P/L per trade, order trades chronologically, and sum
  execution shares with exact decimal arithmetic.
- A second source QA pass verified the session/date state, mobile view selector,
  Current Focuses confirmation, migration registration, and server-enforced
  account-selection and mutation boundaries.
- A further Workspace flow check corrected Current Focuses so turning its
  Workspace display on or off is reflected immediately after a successful save.
- Current Focuses now opens in its own focused drawer from Workspace; Session
  Review retains only its three session-specific views.
- A focused source QA pass verified the Workspace Focuses launcher, the
  Current Focuses card description and Edit Focuses action, preference-gated
  visibility, immediate post-save card updates, focused mobile drawer mode,
  and the user-scoped revision-protected API path.
- A repeat Session Review source QA pass verified the three session views,
  guarded date changes, account-scoped session tags and rules, note-save
  targets, and the chronological completed-trade summary with P/L, shares,
  and entry time.
- Removed the duplicate Tracker-only session-detail rendering so the shared,
  account-scoped Session Summary route is the one source of that display.
- `git diff --check` passed. Runtime/browser, migration, TypeScript, and lint
  verification remain unavailable in this worktree because dependencies are not
  installed; no dependency installation, server start, migration, or test suite
  was run.

## 2026-09-01 Session Review repair

- Session Review now loads its compact tag and custom-rule catalog independently
  from the reporting-backed Details summary, so the tag selector is not held up
  by session analytics.
- One **Save Session Review** action saves the entered note plus changed session
  tags and custom-rule results. Creating a new tag selects it locally; it is
  attached only by that one review save.
- Demo accounts may now write trader-authored notes, tags, and rule reviews,
  while the demo account guard remains in place for execution and market-fact
  mutations.
- The Details empty state names the selected date and does not render P/L or
  trade-detail content when there are no recorded trades. Its P/L wording no
  longer makes an unsupported net/gross claim.
- Automatically evaluated preset day rules are surfaced as read-only status
  rows beside the editable custom rules.
- Session Review now exposes the same built-in tag presets as Daily Trade
  Tracker even when the account has no existing tag catalog. Presets stay
  provisional in the drawer and are created and attached only by the one
  Session Review save action.
- The Workspace Current Focuses card now keeps only the saved focus content,
  caps that content in a compact scroll area with shared light/dark theme
  scrollbar tokens, and places an open chart below the card.

## Resume point

The implementation is intentionally separate from the Analyzer: new shared
Notes routes and a reusable drawer sit outside Workspace. The first Tracker
launch passes a session context and renders a compact per-trade Session
Summary. Standard session/trade fields continue through the established
annotation service; only custom and unsupported fixed combinations use the
additive categorized-note records. No migration, browser review, commit, or
release has been run.
