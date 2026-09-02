# Shared Notes Drawer Saved Sessions Design

Status: superseded by the 2026-09-02 Calendar correction. Retained as a
decision record; historical-session discovery and a separate reader are
deferred.

Related plan:
[Shared Notes Drawer Plan](./shared-notes-drawer-plan.md).

## Scope

This follow-up corrects the Session Review workflow without changing the
authoritative day-note, tag, rule-review, or Calendar facts.

1. A trader can save each selected session note type independently.
2. The final Session Review save remains responsible for the session-level tag
   and custom-rule selections.
3. Historical-session discovery and editing are deferred until a separate,
   approved reader is planned. Existing session editing remains in Trade
   Tracker.

## Proposed drawer direction for owner review

Desktop tab order and mobile selector order are identical:

1. **Review**
2. **Details**

### Review

The note-type selector and editor appear first. Its action is **Save note**;
it saves only that selected note type for the chosen session date and keeps the
saved text in the editor so it can be changed again. Selecting a previously
saved note type loads that note's current text into the editor.

**Save Note** sits immediately below the note editor. **Save multiple note
types to a session** sits after the Session tags and Session rules controls,
so it is available where those choices are made. It saves the selected session
tags and changed custom-rule results; it does not silently save or overwrite
text that is still in the note editor.

The tag picker is a short scroll region. A checked tag has a check icon and
filled appearance; it is not repeated below the picker. **Manage saved tags**
is the account-local tag library: it contains the create-personal-tag field and
the retirement controls. Retiring a used tag requires confirmation and
preserves historical assignment evidence.

### Deferred historical sessions

The entry drawer is for creating a Session Review and keeping the session’s
notes, tags, and custom-rule selections together. Historical-session discovery
and editing will be designed as a separate feature later. Until then, existing
session editing remains in Trade Tracker.

Calendar keeps its existing selected-day drawer for tickers, trades, and
executions. It does not show Session Review markers, tabs, notes, tags, or
rules. Workspace may open that Calendar on demand; it does not request or
render Calendar data until the user selects it.

## Acceptance and non-goals

- A new session note type does not replace any previously saved session note.
- Saving tags/rules cannot overwrite an unsaved note editor value.
- Calendar remains independent of Session Review persistence and does not
  expose session-note, tag, or rule information.
- Existing trade notes, Current Focuses, chart behavior, and individual trade
  tags are unchanged.
- The Workspace Calendar panel reuses the Calendar read model and account
  authorization; it is not a second Calendar store or a preloaded dashboard
  card.
- Owner visual approval is required before implementation. Focused source and
  browser checks follow only after that approval.
