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
| Saved Sessions finder and Calendar discovery | Implemented locally; needs owner visual review and release checkpoint |

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
- Its card-specific content layout uses smaller title spacing and side padding,
  then gives the focus text the remaining card height. This does not change the
  surrounding Workspace metric cards.
- A minimized workspace chart now removes the chart body from layout while
  retaining it for restore, leaving one compact **Minimized {ticker} Chart**
  control rather than an empty chart surface.
- Session Review now exposes a date-indexed Session Reviews history in the
  drawer. Selecting a date opens its complete saved notes, tags and custom
  rule results; the tag picker is shorter, shows checked selections below the
  picker, and includes per-account tag creation and retirement controls.

## Resume point

The implementation is intentionally separate from the Analyzer: new shared
Notes routes and a reusable drawer sit outside Workspace. The first Tracker
launch passes a session context and renders a compact per-trade Session
Summary. Standard session/trade fields continue through the established
annotation service; only custom and unsupported fixed combinations use the
additive categorized-note records. No migration, browser review, commit, or
release has been run.

## 2026-09-02 Saved Sessions follow-up

- The owner directed a separate session-note save, retained final Session
  Review save, tag-library creation/management, reordered Review/Details/Saved
  sessions navigation, scalable saved-review discovery, and Calendar
  discoverability.
- The complete proposed interaction and explicit non-goals are recorded in
  [shared-notes-drawer-saved-sessions-design.md](./shared-notes-drawer-saved-sessions-design.md).
- The owner approved the interaction direction, including an on-demand
  Calendar panel in Workspace. Calendar data is loaded only after the
  Workspace Calendar action is opened; closing it unmounts the panel. Release
  remains coordinator-owned; no publish, migration, or Railway action occurs
  from this worktree.

## 2026-09-02 Saved Sessions implementation

- The Review view now keeps **Save note** independent from **Save Session
  Review**. The former saves only the selected note type and retains the
  current editing view; the latter saves only selected session tags and changed
  custom-rule results.
- The session-only tabs now read **Review**, **Details**, and **Saved
  sessions** on desktop and in the mobile selector.
- Saved sessions now has a bounded account-scoped finder with date limits,
  note/tag text search, month grouping, result counts, and a 20-result
  continuation cursor.
- Calendar now has account-scoped Session Review markers and an
  **Open Session Review** launcher. Workspace loads the reusable Calendar
  client only after its Calendar action is selected.
