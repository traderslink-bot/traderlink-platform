# Shared Notes Drawer Saved Sessions Design

Status: owner-approved interaction direction. Implementation, commit, and
release remain separate checkpoints.

Related plan:
[Shared Notes Drawer Plan](./shared-notes-drawer-plan.md).

## Scope

This follow-up corrects the Session Review workflow without changing the
authoritative day-note, tag, rule-review, or Calendar facts.

1. A trader can save each selected session note type independently.
2. The final Session Review save remains responsible for the session-level tag
   and custom-rule selections.
3. Find sessions becomes a bounded date-indexed editor finder. Calendar is
   the complete dated-review reader.
4. Saved sessions become visible from the existing Calendar.

## Proposed drawer direction for owner review

Desktop tab order and mobile selector order are identical:

1. **Review**
2. **Details**
3. **Find sessions**

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

### Find sessions

This view is a bounded editor finder rather than a date-chip row. Its top controls are
a date range and a text search across saved session-note text and saved tag
names. Results are grouped by month and paginated. Each result shows its date,
saved-note count, selected-tag count, and saved rule-result count. Its **Edit
review** action opens the entry view on that selected date. The complete saved
review is read in Calendar's Session Review tab, not rendered again inside the
entry drawer.

The query remains account-scoped, server-bounded, and does not load Calendar
or chart data.

### Calendar Session view

The existing Calendar remains the Session Review reader. A date with a saved
Session Review receives a compact **Session Review** marker. Selecting that
date opens the existing ticker/trade/execution drawer. Its **Session Review**
tab shows that date's saved notes, tags and preset/custom rule outcomes. The
reader has an explicit **Edit Session Review** action which opens the shared
entry drawer on the same date. No parallel Calendar data store is created.

On Workspace, a compact **Calendar** action beside the existing tool actions
opens the existing Calendar as an on-demand Workspace panel. Workspace does
not request or render Calendar data until that action is used. Closing the
panel unmounts it; the complete Calendar page remains available separately.

## Acceptance and non-goals

- A new session note type does not replace any previously saved session note.
- Saving tags/rules cannot overwrite an unsaved note editor value.
- Calendar markers expose only the presence of the selected account's saved
  Session Review; they do not expose note contents in the calendar grid. The
  selected-day drawer loads the saved review only when its Session Review tab
  is opened.
- Existing trade notes, Current Focuses, chart behavior, and individual trade
  tags are unchanged.
- The Workspace Calendar panel reuses the Calendar read model and account
  authorization; it is not a second Calendar store or a preloaded dashboard
  card.
- Owner visual approval is required before implementation. Focused source and
  browser checks follow only after that approval.
