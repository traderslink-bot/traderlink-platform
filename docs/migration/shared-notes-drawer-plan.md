# Shared Notes Drawer Plan

## Purpose

Provide one reusable Notes drawer that any dashboard page can open without
duplicating note UI or storage. It supports notes for one exact trade or one
trading-day session. The Day Trade Tracker is the first host; later a table,
chart, Workspace card, or other page supplies the same launch context.

Progress is tracked in
[shared-notes-drawer-progress.md](./shared-notes-drawer-progress.md).

The owner-directed Saved Sessions follow-up is specified for visual review in
[shared-notes-drawer-saved-sessions-design.md](./shared-notes-drawer-saved-sessions-design.md).

## Owner-approved interaction

The shared drawer accepts either a trade context (stable round-trip id) or a
session context (account-local trading date).

Session Review entry uses two tabs:

1. **Review**
2. **Details**
On mobile, the tab row becomes one full-width view selector that displays the
selected view and opens a menu or bottom sheet containing those same three
views. Unsaved text is never discarded when the trader changes views or
closes the drawer without deciding what to do.

`Details` means Trade Details for a trade launch and Session Summary for a
session launch. Session Summary lists only that account-local day’s trades and
loads compact factual rows first; an individual row expands for its displayed
P/L, share size, and entry time. It is reference material while entering a
new review.

Calendar remains the existing trade-inspection surface: its day drawer shows
that day’s trades and leads to Trade Tracker. It does not display, read, or
edit Session Reviews. Editing an existing session remains in Trade Tracker
until a separate session reader is planned and approved.

An unattached launch starts a **Session Note** for the current account-local
date and lets the trader select an earlier date. A trade launch remains tied
to that exact stable trade identity.

## Notes

The fixed session note types reuse the existing authoritative Daily Notes
fields:

- What worked
- What needs work
- Technical recap
- General (the existing `anythingElse` field, relabeled only in the UI)

The fixed fields and existing individual-trade note/technical-note records
remain readable and writable. No existing authored note is copied, deleted,
or silently reinterpreted.

The Add Note view defaults to **General**. Its type selector exposes the fixed
types valid for the current scope and active custom types. Beside it, **+ Custom
note type** expands into an `Enter note name` field and a small **Save** action.

For a session launch, Review also includes Session tags and Session rules.
On desktop these sections are open beneath the note editor; on mobile they are
collapsed until selected. Session tags attach to the trading-day record and
reuse the account's tag catalog without being confused with any individual
trade's tags. Session rules reuse existing day-rule reviews and retain the
explicit Followed, Broken, and Not reviewed statuses.

Custom note types are user-owned. Their names are unique case-insensitively
for that user and bounded. Retiring a type removes it from future selection but
does not erase existing notes or their historical display label. Rename is not
part of the first slice; retire/delete is the required management action.

Custom and otherwise unsupported fixed scope/type combinations use new
revisioned categorized-note records. The Notes drawer reads the legacy
authoritative fields and these additive records through one server-owned
adapter so Saved Notes is one truthful list.

## Current Focuses

Current Focuses is not a session note or a trade note. It is one ongoing,
user-level trading reminder: for example, working on a rule or learning a
chart-reading skill. Workspace opens it in its own focused drawer, separate
from Session Review. The Workspace Current Focuses card displays the saved
note only when its user preference is enabled and includes an Edit Focuses
action. A Focuses launcher remains available when that card is hidden. The
focused drawer provides:

- the current focus editor and explicit Save action;
- an optional **Show in Workspace** preference; and
- an honest empty state when no focus has been written.

The existing account/day-derived focus history remains historical evidence for
existing AI reviews. The new user-level current focus becomes the Workspace
reminder and the current AI-review focus context after its additive migration;
no cross-account value is silently selected as the user’s new focus.

## Data, privacy, and performance contract

- Every session/trade note read and write derives the selected workspace and
  Journal account on the server. Browser-supplied identifiers never grant
  access.
- User-level focus and its Workspace visibility preference derive the stable
  Platform user on the server. They do not expose one account’s private notes
  to another account.
- New persistence is forward-only, revisioned, and additive. Retiring a type
  never cascades to authored notes.
- Saved Notes uses bounded, paginated searches. Contextual launches default to
  their selected trade or session; broader filters remain server-bounded.
- The drawer loads only after the trader opens it. Details fetch compact facts
  for one trade or one session and expands further only on demand.
- AI review contracts retain their current daily/trade note data. New custom
  notes are optional, clearly labeled trader-authored context; they never
  become market facts or inferred behavior.

## Delivery steps

1. Add the migration, server contracts, repository/service, and bounded
   account/user-authorized routes for categorized notes, custom note types,
   user-level Current Focuses, and Workspace visibility.
2. Build the shared client Notes drawer with its context-only open contract,
   desktop tabs, mobile selector, stale-write protection, and truthful loading
   states.
3. Reuse the established Daily Notes and individual-trade-note service paths
   through one Notes adapter; preserve their revision behavior.
4. Add the first Day Trade Tracker launch point and the optional Workspace
   Current Focuses display. Do not change the deferred shared-tools launcher
   or the Trade Analyzer slice.
5. Obtain owner visual approval from the production-capable dashboard before
   release. Moomoo/Analyzer availability is unrelated to this Notes feature.

6. Session-note saving and account-local tag library controls remain in the
entry flow. A historical-session finder or reader is deferred. The on-demand
Workspace Calendar panel reuses the existing Calendar trade data only; it does
not preload data or render Session Reviews.

## Acceptance boundary

This feature is complete only when the same Notes drawer can open a session,
a trade, and Current Focuses without a parallel notes store; existing notes
remain available to AI reviews; and Workspace displays Current Focuses only
when its user preference is enabled. No deployment or publication occurs
without the designated release coordinator.
