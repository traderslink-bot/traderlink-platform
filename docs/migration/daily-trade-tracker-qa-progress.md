# Daily Trade Tracker QA Progress

**Status:** Owner-authorized review-status safeguard and empty-day first-write
repair implemented; desktop, responsive and real-save browser QA passed

**Started:** 2026-08-16

**Controlling product plan:**
[Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md)

## Scope

Review the Daily Trade Tracker as a complete trader-facing workflow while
preserving its owner-approved light Material design. Correct the leave-page
warning so it appears only when the trader has user-entered changes that are
not saved. Additional visible UI changes require owner approval before they are
implemented.

## QA checklist

- [x] Confirm the canonical repository, branch and concurrent working-tree
      boundary.
- [x] Trace the current leave-page warning and every navigation path it covers.
- [x] Remove the warning for an untouched day that is merely not reviewed.
- [x] Keep the warning for actual unsaved Daily Notes and trade notes.
- [x] Clear dirty state when an edit is restored to its last-saved value.
- [x] Cover date-dropdown navigation as well as ordinary dashboard links.
- [x] Cover browser Back navigation without trapping clean navigation.
- [x] Warn before an account change mutates the server-side selection.
- [x] Cover user-entered manual-execution, manual-edit, tag, trade-type and
      custom-rule-note drafts.
- [x] Inspect the desktop Daily Trade Tracker workflow in the canonical runtime
      without writing Journal facts.
- [x] Inspect the responsive Daily Trade Tracker workflow in the canonical
      runtime without writing Journal facts.
- [x] Verify the real `Mark reviewed anyway` note-save path with an unfinished
      execution draft, reload the day and restore the original note.
- [x] Record factual QA findings, Help Center impact and remaining owner-review
      boundaries.

## Verification boundary

The owner requested feature-first QA and the repository instructions prohibit
Vitest or other test runs during this approval stage. Verification is therefore
limited to focused lint, source inspection and browser acceptance. The owner
later authorized a temporary Daily Note save because this Journal contains test
data. No manual execution, tag or imported fact was added.

## 2026-08-16 implementation and focused QA

The former guard warned whenever a day was not marked reviewed, even when the
trader had not changed anything. It also covered ordinary links but not the
Day/Month/Year controls that navigate with the Next.js router. Dirty note flags
remained set when the trader restored the last-saved text.

The corrected guard now receives actual unsaved state from:

- Daily Notes and individual trade notes;
- manual execution entry and manual execution editing;
- tag selection and tag-name drafts;
- trade-type selection; and
- day-level and trade-level custom-rule notes or a new custom-rule draft.

An untouched day and a merely unreviewed day report no unsaved state. Restoring
note text or a selection to its last-saved value clears the relevant source.
Ordinary internal links, browser unloads and the Day/Month/Year controls share
the same plain confirmation. External or new-tab links are not intercepted.

Focused ESLint passed for the eight touched Tracker files. `git diff --check`
also passed. Per the owner instruction, no Vitest, broad suite, TypeScript-wide
check, build or production proof test was run.

The canonical branch is `codex/traderlink-platform-replacement`. Port 3010 was
not listening and the machine had about 2.2 GB of free physical memory. The
prior tracker record observed about 2.3 GiB for a temporary Next.js review
server before navigation, so no new server was started. Desktop, responsive and
browser-back behavior remain live-browser acceptance items.

## Help Center review

No Help Center change is required for the warning correction. The existing
Daily Trade Tracker guide tells traders to save notes before leaving and
explains that marking the day reviewed is a separate completion signal. It does
not claim that an unreviewed day blocks navigation.

The later review-status safeguard does require Help alignment. The guide now
explains that pending Daily Notes and trade notes are saved by `Mark day
reviewed`, while another unfinished draft can be left unfinished. The trader
can keep reviewing or mark the day reviewed without silently saving or
discarding that separate draft.

## Owner-approved visible QA corrections

The owner approved both remaining visible corrections on 2026-08-16.

1. Rejected custom-rule result and rule-note saves now show a compact Material
   error alert in the relevant trade or day rule section. Account-selection or
   revision conflicts use the route's plain refresh guidance. Network failures
   tell the trader to check the connection and try again. A failed request does
   not replace the currently saved rule result or discard the note draft.
2. The Daily Trade Tracker recent-entry message now states the exact today plus
   previous-six-calendar-days boundary, rejects future execution times plainly,
   and directs older activity to Imports. Swing and Quick Trade Entry retain
   tracker-specific guidance instead of receiving inaccurate Daily Tracker
   wording.

Focused ESLint and `git diff --check` passed for the two changed Tracker files.
No Vitest, broad test suite, build or live Journal mutation was run.

## 2026-08-16 repeat QA run

The controlled review server ran from the canonical replacement repository on
port 3010 with Webpack and workers disabled. The initial desktop route rendered
the complete approved shell, manual execution entry, week/day summary, trading
date controls, Daily Trading Rules, Daily Notes and Day review. The initial
load had no browser console errors or framework error overlay.

Non-mutating browser checks passed for these warning states:

- a clean or merely unreviewed day leaves without a warning;
- an unsaved Daily Note warns, cancelling keeps the note, and restoring the
  saved value removes the warning;
- an unsaved manual-execution draft warns, and clearing the draft removes the
  warning;
- changing the Day selector warns while a note is unsaved, cancelling keeps the
  selected day, and clean date navigation does not warn; and
- browser Back now warns in a fresh Tracker document, cancelling keeps both the
  route and draft, while clean Back leaves without a warning.

Two hidden defects were found and corrected during the repeat run:

1. The dashboard account selector posted the new active account before the
   leave warning could run. It now asks first and cancels the one permitted
   unload if the account request itself fails.
2. Next.js client-side history traversal bypassed both the link-click and
   `beforeunload` guards. A guarded history entry now protects browser Back only
   while there is real unsaved work, preserves the draft when the trader stays,
   and is skipped without prompting once the draft is cleared.

Focused ESLint passed for the navigation event helper, unsaved-changes provider
and dashboard account selector. `git diff --check` passed for the same files.
No Vitest, broad suite, TypeScript-wide check, build or Journal-writing browser
action was run.

The temporary browser tab was closed and the exact worker-disabled port 3010
process tree was stopped. Port 3010 was confirmed closed, the protected Chrome
launcher remained running and free memory recovered from about 1.2 GB to about
3.1 GB. The responsive browser pass was stopped at that resource boundary
rather than forcing another expensive Tracker render.

## Owner-authorized review-status safeguard and final repeat QA

The owner authorized the best user-friendly correction without forcing traders
to complete work they do not want to complete. `Mark day reviewed` remains
available. When a separately saved execution, tag, trade-type, custom-rule or
rule-note draft is still pending, it now opens an `Unsaved changes` dialog with
two factual choices:

- `Keep reviewing` closes the dialog and preserves the unfinished draft; and
- `Mark reviewed anyway` continues the existing review action, saves pending
  Daily Notes and trade notes, and leaves every other draft unsaved for the
  trader to decide later.

The dialog is not shown when the only pending work is Daily Notes or trade notes
because the review action already saves those notes. The existing requirement
to classify open positions before completing the day remains unchanged.

Fresh non-mutating desktop QA passed on the canonical `/trade-tracker` route:

- the complete approved shell and Tracker sections rendered without a browser
  error or framework error overlay;
- a manual execution draft opened the new dialog before review completion;
- `Keep reviewing` closed the dialog, preserved the draft and left the day
  unreviewed; and
- the same draft still triggered the ordinary leave-page warning.

The previously deferred responsive pass then completed at a 390 by 844 phone
viewport against the already-loaded page. The compact dashboard header,
description, `Ask about this day`, manual execution card and input grid remained
readable with no horizontal overflow (`clientWidth` and `scrollWidth` were both
390). The new dialog fit the viewport, used full-width actions, preserved the
draft when `Keep reviewing` was chosen and produced no browser console error.

No `Mark reviewed anyway`, Save, rule-result, tag, execution or other
Journal-writing action was clicked. Focused ESLint and `git diff --check`
passed. Per the repository instruction, no Vitest, other test suite,
TypeScript-wide check or build was run.

The temporary browser viewport was reset and its tab closed. The exact
worker-disabled port 3010 process tree was stopped and verified absent. Port
3010 is closed and free memory recovered to about 3.9 GB.

## Owner-authorized real Journal save acceptance

The first real `Mark reviewed anyway` attempt found a functional defect that
the earlier non-mutating passes could not expose. The current date had no
execution, so it was visible in the Tracker but did not yet have a durable
Journal trading-day record. Daily Notes therefore returned a conflict before
the review status could be saved. A day-level custom-rule result had the same
first-write dependency, which explains how a valid-looking rule save could
previously fail on an otherwise empty date.

An intentional day-level write now creates the account's trading-day record in
the account's configured trading timezone when one does not already exist.
This applies to Daily Notes, day-level custom-rule results and Day review. It
does not require the trader to enter a trade or complete an unrelated draft.
Existing days and revision-conflict protection remain unchanged.

The repaired real-save browser flow passed:

- a temporary Daily Note and unfinished manual ticker draft opened the
  `Unsaved changes` dialog;
- `Mark reviewed anyway` saved the Daily Note and marked the day `Reviewed`;
- the unrelated ticker draft remained unfinished and unsaved;
- a full reload preserved both the saved note and `Reviewed` status;
- the ticker draft was cleared before the reload; and
- the original Daily Note value was restored and `Notes saved` was confirmed.

The temporary note text is no longer stored. The owner-authorized test leaves
the date's new Journal day and review status as `Reviewed`; those are test-data
facts. Focused ESLint passed for the first-write helper, annotation service and
repository, review service, and affected day-rule/notes routes. No Vitest,
other test suite, TypeScript-wide check or build was run.

The QA tab was closed. A separate worker-disabled canonical dashboard process
started on port 3010 during the final run. It was not part of the verified QA
process tree and was preserved rather than terminated as concurrent work.

## 2026-08-16 final desktop and responsive repeat QA

The empty-day first-write finding remained fixed in the fresh browser run.
The current empty test date loaded with its durable `Reviewed` status, its
saved day-rule result and the restored Daily Notes. No temporary QA note or
manual execution was left behind.

Fresh desktop acceptance at 1280 by 720 passed:

- the complete Daily Trade Tracker rendered with Enter trades, This week,
  Daily Trading Rules, Daily Notes and Day review;
- there was no framework error overlay, browser warning or console error;
- the page had no horizontal overflow (`scrollWidth` 1265 within a 1280-pixel
  viewport);
- an unfinished ticker opened the `Unsaved changes` review dialog;
- `Keep reviewing` closed the dialog, kept the ticker draft and left the
  existing `Reviewed` status unchanged; and
- a day-rule result saved from `Followed` to `Not selected`, saved back to
  `Followed`, and remained `Followed` after reload with no rule-save error.

Fresh responsive acceptance at 390 by 844 also passed:

- the compact header, Tracker description, `Ask about this day`, manual entry,
  day controls, rules, notes and review remained available;
- the document stayed within the viewport (`scrollWidth` 375 within a
  390-pixel viewport);
- the `Unsaved changes` dialog fit completely within the viewport and both
  choices remained available;
- `Keep reviewing` preserved the temporary ticker draft;
- after that draft was deliberately cleared, `Mark day reviewed` completed
  directly without the dialog; and
- a clean reload showed a blank execution ticker, `Followed` rule result and
  `Reviewed` day status with no leave-page warning or console error.

No additional product defect was reproduced, so no further code correction was
needed in this pass. The temporary test rule state was restored. The responsive
viewport was reset and the fresh QA tab was closed. The separate canonical,
worker-disabled port 3010 process was preserved. Per repository instructions,
no Vitest, other test suite, TypeScript-wide check or build was run. The Daily
Trade Tracker Help guide was also reviewed; it already describes the review
dialog and saved-note behavior accurately, so no Help update was needed.

## Fresh worker-disabled end-to-end acceptance and shutdown

At the owner's request, the existing canonical port 3010 process tree was
identified by command line, stopped selectively and confirmed absent. A new
server was then started from this repository with
`npm run dev:review -- --port 3010`. Its startup log confirmed
`workersEnabled: false`, so Daily Trade Analyzer and import workers remained
off during QA.

The fresh desktop route passed at 1280 by 720:

- the complete Daily Trade Tracker shell and all root sections rendered;
- the page stayed within the viewport (`scrollWidth` 1265 within 1280);
- no Next.js error overlay, blank state, browser warning or page-specific
  console error appeared; and
- the server returned `200` for the fresh `/trade-tracker` request.

The original empty-day defect was exercised end to end on a previously empty
test date:

- the first Daily Note write returned `200` and displayed `Notes saved`;
- the custom day-rule result write returned `200` and rendered `Followed`;
- an unfinished rule-note draft opened the `Unsaved changes` review dialog;
- cancelling the dialog kept the unfinished rule-note draft;
- clearing that separate draft allowed the day-review write, which returned
  `200` and rendered `Reviewed`; and
- reload preserved the saved note, rule result and review status with no
  framework or console error.

The browser leave guard also passed. Browser Back on the unfinished rule-note
draft remained on the same Tracker date until the native warning was cancelled
with Escape, and the draft remained intact. After clearing the draft and
reloading, clean navigation proceeded without the warning.

The root Tracker then passed again at 390 by 844:

- Daily Trade Tracker, Enter trades, This week, Daily Trading Rules, Daily
  Notes and Day review all remained present;
- there was no horizontal overflow (`scrollWidth` 375 within 390);
- a temporary ticker draft opened the `Unsaved changes` dialog;
- the dialog fit fully within the viewport, with both actions available;
- `Keep reviewing` preserved the ticker; and
- after clearing the ticker, a clean reload showed a blank ticker and no
  warning or console error.

All temporary note and rule-note text was removed. The test day-rule result was
restored to `Not selected`. The new test date remains `Reviewed` as authorized
test data and has no saved QA text or execution. The Help guide still matches
the verified behavior, so no Help change was needed.

The browser viewport was reset and the QA tab closed. The fresh six-process QA
server tree was then stopped, port 3010 was confirmed closed and available
memory recovered to about 3.0 GB. A full Node command-line audit found no other
project runtime that could be stopped safely without risking Codex tooling,
another active session or the existing Chrome helper.

The Press Release runtime was not running. Its controller and watchdog were
both enabled and `Ready`, with their next scheduled run at 3:55 AM on
2026-08-17 and successful prior task results. Their schedule was preserved.

No additional Daily Trade Tracker product defect was reproduced, so no new
code change was needed in this pass. Per repository instructions, no Vitest,
other test suite, TypeScript-wide check or build was run.
