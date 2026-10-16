# PC Codex — signed-in staging retest of update notice and manual timezone

## Completed — retained instructions, do not rerun

PC results received: both original UI fixes passed signed-in staging retesting.
The owner declines further work on the optional winter/date-boundary/queued-data
extensions. Those rows remain untested in the staging browser, with isolated
proof recorded separately. The instructions below are historical scope, not an
active request to repeat tests or create fixtures. No new defect was reproduced.
[Accepted results and exact evidence boundary](coaching-ui-timezone-qa-20261015.md).

Verified staging release: `a9c119625f1ecb13d81e65bd9148159a03da57ec`.
Railway deployment `b1bd4046-cfa9-41ae-9cca-1186b9ac742a` SUCCESS; health200/ready,
one running instance and unchanged160-entry migration ledger verified by
Codespaces on2026-10-15. Full build/TypeScript and focused CI checks pass.
This browser handoff is ready; it does not authorize another release.

Copy the following into PC Codex:

---

Retest the two corrected UI defects using the existing signed-in staging browsers.

Staging: https://traderlink-platform-staging-staging.up.railway.app
Expected release: a9c119625f1ecb13d81e65bd9148159a03da57ec
Community: test-community. Coach: TradersLink. Student: moonmafia.

Use the existing browser sessions without extracting cookies, tokens or credentials.
Read applicable local AGENTS.md. Do not deploy, edit source/configuration, create
accounts/plans/relationships/trades/grants, change roles, send Discord messages,
or save/deliver/acknowledge/complete any review. Leave Bullrun and all existing
agreements and Journal grants untouched. Account selection and appearance changes
are permitted only through normal controls; restore the initial selections and
appearance afterward.

## 1. Update notice and coaching controls

Coach final route:
/communities/test-community/workspace/students/5d7956a4-a4f2-4e65-92b7-af8feadfbf29/reviews/dedebb39-c1a1-4f5f-a128-18ea5a3f4b76/final

This is a protected SAVED, UNDELIVERED draft. Read it without saving or sending.
Record the saved content/status before and after navigation/update. Do not edit it.

At1440x900 and390x844, in Light and Navy, keep the update notice visible while
checking guidance, progress, draft controls and Return to workspace. The notice
should occupy its own space above the page, without covering content. Scroll
controls into view, record notice/control rectangles, and hit-test each tested
action center. Confirm Return works by normal pointer click and by focus+Enter,
waiting for the exact workspace URL and content. Measure horizontal overflow.
Inspect the update button's keyboard focus and accessibility.

Use a fresh online page load after deployment so the page runs the corrected
client code. Keep a second older staging tab open if available; it can retain the
previous active worker while the new worker waits. With no unsaved edits, normal
online navigation/reload is permitted; this app fetches authenticated navigation
from the network. An old tab that has never reloaded can still run the old UI:
do not label that old client as a failure of the new release.

Test all notice-visible combinations before pressing Update app/Reload app. If
no notice is naturally available with the corrected page code, report that
portion BLOCKED. Do not manufacture a worker state, clear storage, unregister
workers, deploy another version, or count notice-absent checks as notice-visible
passes. Do not dismiss the notice first.

Once those checks finish, and only with no unsaved edits, use the notice's normal
Update app/Reload app action. Verify the protected saved draft's content/status
is unchanged after reload. If existing saved offline entries are visible, compare
their state without syncing or editing them. Do not create new offline data to
fill a fixture gap. Record unavailable offline evidence as UNTESTED; Codespaces
already proved actual outbox retention in isolated browser contexts.

## 2. Manual trade timezone — preview then cancel; never confirm/save trades

As moonmafia, select existing account
QA ONLY — Coaching acceptance 2026-10-15 (USD, UTC).
Open /quick-trade-entry, which resolves to /workspace?tradeDrawer=add.
Confirm the form explicitly names UTC. Using synthetic QATZCHECK data only in the unsaved form, request a
preview (use the form action that opens confirmation; never Confirm trades)
for2026-10-15 14:00/14:01, quantity1, buy10.00/sell10.10. Inspect the
confirmation: full dates, UTC account timezone,14:00/14:01 (2:00/2:01PM), zero
UTC offset. CANCEL confirmation and discard the unsaved form; do not confirm.
The existing saved QAONLY trade must remain untouched.

If an already-existing, authorized America/New_York account is available, select
it normally and repeat with2026-10-15 10:00/10:01. Guidance must name
America/New_York; confirmation must show10:00/10:01AM with GMT-4 offset, the same
instant as UTC14:00. Cancel without committing. Verify switching back to the UTC
account restores UTC guidance/interpretation and leaves no old-account preview.
Do not create/change an account timezone or use an unauthorized account to obtain
this comparison. If no suitable account exists, mark this subcase BLOCKED.

Winter and date-boundary checks may also use preview-only entries and must be
cancelled:2026-01-15 UTC15:00 equals New York10:00 GMT-5;2026-10-15 UTC00:30 equals
New York2026-10-14 20:30 GMT-4. Never save these historical synthetic entries.
Server preview/persistence and invalid/ambiguous DST cases already passed five
local disposable-database regressions; do not create hosted executions to repeat
that storage proof.

## Preserve completed acceptance

The required1/1 and legitimate custom0/0 workflows already passed signed-in
delivery/acknowledgement/completion/refresh. Do not repeat their mutations.
Protected old completed review31ea4d91-dcae-4e88-96f6-d1505f2f3644 and relationship
5d7956a4-a4f2-4e65-92b7-af8feadfbf29 remain untouched. New QA relationship
1771072c-46e4-44e5-b3cb-abaef90366ed, required review
1c8c4176-e82b-4032-bd57-5ac6d3d79af9 and summary-only review
398b8eb7-4d2c-4d54-8dd6-e748218df1e1 are also protected.

Return PASS/FAIL/BLOCKED/UNTESTED per case, screenshots, exact routes/viewports,
notice/action hit-test results, timezone labels and displayed preview times,
page/network errors, saved-content before/after comparison, and confirmation that
no new trades/reviews/grants or other protected records were changed. Clearly
separate observed browser evidence from release/version information supplied by
Codespaces. Restore original UI appearance, viewport and selected account.

---
