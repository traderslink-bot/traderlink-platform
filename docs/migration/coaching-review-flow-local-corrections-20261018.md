# Coaching review flow local corrections — 2026-10-18

Owner authorized local fixes after the six staging browser QA passes. This record tracks the observed defects in the staging QA report in the canonical checkout. The accepted plan terms and coaching history must remain unchanged. No production deployment is authorized. The source corrections below address the documented local defects; staging acceptance remains separate.

## Local source corrections complete

- [x] Do not mark delivered, viewed, completed or cancelled review workspaces dirty merely because disabled form controls differ from their defaults. Disabled controls are ignored in editable reviews too.
- [x] Track editable coach feedback against saved form values and signal the navigation guard until the save action succeeds. Browser Back/Forward still requires staged confirmation.
- [x] Disable Remove selected and Remove all in a read-only review.
- [x] Show N/A for Largest loss when the selected period has zero losing trades; retain the existing metric for periods with losses.
- [x] Distinguish same-symbol manual review choices by trading date.
- [x] Use singular trade/share wording where the QA found one-item copy defects.
- [x] Give mobile resource-sheet headings an explicit theme text color.
- [x] Route coach Ticker rows into period-locked Trade Breakdown filtered to that ticker; its trade rows now open the review-authorized Details card. The ordinary user's membership-gated drawer remains for ordinary analytics.
- [x] Diagnose the staging Trade Explorer and Compare Trades load failure: the deployed source checks the student's paid report entitlement before coach review authorization. The local continuation already removes that premature check; this correction restores the separate Compare Trades entitlement for ordinary users while retaining coach review scope validation.
- [x] Avoid revoking and regranting Journal sharing when the submitted scopes and fields have not changed; retain the Journal sharing fragment after successful save.
- [x] For changed Journal sharing, revoke only deselected scopes and update only changed grants in one transaction. Skip cache revalidation for unchanged submissions and avoid a forced page refresh for in-place saves. Retry once on a classified SQLite write lock.
- [x] Retry a per-trade save once from the client after a failed response; an identical persisted draft save returns without writing a duplicate review event. QA removed a second server retry to prevent up to four attempts on a single click.
- [x] Use retained server progress and final delivery state for read-only review workspaces, with a historical-service explanation when an old record has no explicit binding.
- [x] Show selected historical trades even when the same logical trade is now reserved or reviewed elsewhere; draft selection still excludes them.
- [x] Remove Find trades from read-only historical reviews, including a Viewed Strategy review without selected trades.
- [x] Show proposed agreement terms when present, otherwise current plan services, price and required Journal access beside enrollment Accept/Decline.
- [x] Use “1 trade” in the accepted-service selector.
- [x] Source QA found the review page passed `readOnly` to a guard that did not accept it. The guard now ignores read-only/disabled controls, updates when review status changes, and the trade workspace does not report unsaved feedback for read-only reviews.
- [x] Historical reviews without a binding now receive a historical resource explanation rather than a draft-only instruction to identify the accepted service.
- [x] Enrollment QA now disables Accept when neither current plan terms nor a proposed agreement is available, with the same check enforced by the relationship action. Proposed agreement names are shown consistently.
- [x] A subsequent source QA found the guard file had reverted to its pre-fix signature while the review page still passed `readOnly`. Restored the guard contract. Pending requests keep the guard active because the coach can edit Accepted scope before accepting; their disabled review controls are ignored. Recheck this file before any staging handoff.
- [x] Staging QA found an untouched draft coach review immediately warned about unsaved feedback. The feedback form now marks itself as a controlled draft, so the page guard relies on its saved-versus-current state instead of comparing the form's rendered controls with DOM defaults.
- [x] Staging QA found Trade Explorer and Compare Trades crashed the review route when opened as resources. Their authorized server action now returns a serializable page model; the review layout loads and renders the corresponding client component locally in its resource drawer. The existing review-period and sharing recheck stays in the server action.
- [x] Post-deployment authenticated browser QA found the untouched-draft warning still fired. A hidden, read-only MUI textarea in the Student actions form has an internal sizing value of `x` despite an empty default and was counted as an edit. The guard now excludes `aria-hidden` and read-only controls from the DOM fallback; actual coach feedback continues to use the explicit saved-state tracker.

## Staging acceptance still open

- [ ] Confirm first-save and changed-sharing behavior on staging after a release. The old generic UI messages did not expose a database error code, so the SQLite contention mitigation is source-level, not proof of the original transient cause.
- [ ] Verify the draft Browser Back/Forward warning with an authenticated browser after a staging build. Local form-state tracking is not browser acceptance.
- [ ] Verify Trade Explorer and Compare Trades opening and querying through an authorized coach review after a staging build. The generic staging error hid its exact exception, so source correction is not runtime acceptance.
- [ ] Confirm that an untouched draft review leaves without an unsaved warning, while edited feedback still warns until successfully saved.
- [ ] Restage and verify the hidden-textarea correction. On the current staging image the untouched draft still warns; an actual Review summary edit raised the discard dialog and was absent when the workspace was reopened.
- [ ] Verify sharing saves and fragment behavior in an authenticated student browser.
- [ ] Verify the corrected mobile Light and Navy presentation, coach review controls and financial metrics in staging.
- [ ] Finish the broader plan/review lifecycle acceptance with fixtures for Trading-day, Performance, goals, rules, tags, and applicable saved Analyzer work. Existing accepted plans/history remain intact.

This local correction slice is complete. No Vitest, other tests, local server, build, migration, commit, push or deployment was run under the owner’s current instructions. Targeted source inspection and whitespace checks are not staging acceptance.
