# Coach review browser-history correction — October 18, 2026

## Owner-approved scope

Correct the staging QA finding where browser Back leaves an unsaved coach review without prompting and Forward returns with the draft text lost. Preserve accepted plans and coaching history. Do not deploy or alter production. The separate Bullrun Journal-sharing grant remains subject to the student's explicit staging permission decision.

## Evidence and source work

- Signed-in staging QA on source `9bd1143692a372ba0f188af5793dff8d61d3daca` and deployment `95c8921f-9d95-4867-852f-5615b768858e`: typed into Review summary; the Student workspace link showed the unsaved-feedback dialog, while browser Back left with no dialog and Forward returned with the text gone.
- Student Journal-sharing Back/Forward prompt and discard behavior passed in the same browser QA.
- Local source correction in `app/(dashboard)/communities/coaching-review-draft-guard.tsx`: cancel a dirty browser traversal in the Navigation API's pre-navigation event, keep the review mounted while showing the existing dialog, and replay the exact destination only after Discard. Retain the existing `popstate` fallback for browsers without a cancellable navigation event.
- No Vitest, other tests, build, local server, commit, push or deployment was run. Browser verification of the correction requires a new staging build and is pending.

## Remaining acceptance

- Stage the exact source change through the release coordinator only when authorized, then verify coach Back and Forward with Keep editing and Discard in the signed-in browser.
- The owner completed the Bullrun student Journal-sharing grant on staging. The coach review now shows Analytics, Trade Explorer, Compare Trades and Rules analytics as available resources. No grant was changed by this task.
- Staging Analytics → Overview, Ticker, Timing and Trade Breakdown, plus Rules analytics, each reproducibly crash the full coach review page with a webpack module-load error. Overview still failed after the app update. Local correction: expose each existing Analytics report model, return serializable Analytics and Rules data through the review action, and render their existing views directly in the client drawer. The action retains coach authorization, Journal grant and review-period checks. This correction has not been deployed or browser-verified.
- Trade Explorer returned the in-page resource-unavailable message for the current fixture; the only shared synthetic AAPL trade is outside the review period. No review dates or accepted agreements were changed. Other resources, saved goals and delivery remain unverified.
- Student Journal sharing displayed "Sharing saved" with all scopes checked, yet navigating to Reviews prompted to discard unsaved changes. Local correction: clear the sharing editor's changed state only after a successful server save, and reset the student navigation guard's form baseline at that success. A failed save keeps the form dirty. This correction also awaits staging verification.
- A separate fixture problem remains after any grant: the signed-in coach can see one shared synthetic AAPL trade dated September 29, while active review `aeb81128-852f-45aa-9da1-621a86d1ad22` covers October 10–16 and review `054c4e1e-f7e4-47e3-8273-82868f4c25df` covers November 14–20. Neither period includes that trade, so the grant alone cannot prove the trade-selection/review path. No review dates or accepted agreements were changed.
- Staging student Reviews reproduced an unexplained no-op after "Choose trades for this review" returned an empty eligible list. Local correction adds a clear empty state after that action completes. No selection, review date, or agreement was changed.
- Local syntax parsing of the twelve touched TSX files reported zero diagnostics; targeted `git diff --check` reported no whitespace errors. No test suite or build was run under the owner's low-resource instructions. The resource and navigation fixes remain unverified in a deployed browser build.
- Preserve the accepted agreement and previously delivered review; report the exact source SHA, deployment, migration count, health, and rollback identity for any future staging release.

## Local QA follow-up

- Static source review covered the coach review draft guard, Journal sharing save rebase, trade-picker empty state, Analytics/Rules resource actions and four report views. The five reported report resources now return models rather than server-rendered component trees; authorization and review-period rechecks remain in the action. This is source-level evidence only, not browser acceptance.
- Three new client report views were adjusted to import `DashboardPage` directly from `app/dashboard-ui`, avoiding the broader dashboard template import. No visible design changed.
- Targeted syntax parsing covered thirteen TSX files with zero diagnostics. Targeted `git diff --check` showed no whitespace errors. No Vitest, broad tests, typecheck, build, local server, commit, push or deployment was run.
- Open UI concern for owner review: the read-only coach resource drawer disables date fields because the review period is fixed, but the common Analytics range control still presents an enabled Update button. The server action forces the review period, so this is confusing rather than evidence of access outside the period. No UI change was made without owner design review.
- Staging cannot verify this local correction batch until a separate approved deployment. The current fixture has no eligible shared trade in the review period, so trade review save/send and delivery remain unverified.
