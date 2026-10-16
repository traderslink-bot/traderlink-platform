# Coaching required-trade acceptance handoff — 2026-10-15

## Scope and protected state

No deployment, source publication, migrations, hosted configuration, Discord changes or hosted fixture writes were performed for this acceptance follow-up. Production application code is unchanged. The target supplied by PC QA is staging release `fdfca103cabe11d965d2feec55fe3d1facc8d33e`, deployment `55bde668-caf3-4fc7-8565-69510eecabcf`, `test-community`, TradersLink coach and moonmafia student, relationship `5d7956a4-a4f2-4e65-92b7-af8feadfbf29`.

Keep completed review `31ea4d91-dcae-4e88-96f6-d1505f2f3644` unchanged. Keep review `dedebb39-c1a1-4f5f-a128-18ea5a3f4b76` as its existing saved, undelivered draft, without further feedback changes. Leave Bullrun, every other relationship, accepted agreement and Journal grant untouched. Do not create staging trades, grant access or force staging states without the separate approval described below.

## Browser proof supplied by PC QA — reused, not rerun

PC QA reports PASS on the agreement-generated `dedebb39…` draft with one required trade, zero trades and Journal sharing off:

- Saved synthetic overall feedback survives refresh.
- Workspace shows `0 of 1` and `Final review: Not ready`.
- Final preview shows `0 / 1`, disables Send, and explains required trade work/student-controlled Journal access.
- Moonmafia cannot see the undelivered draft feedback.
- Final-preview desktop/mobile Light/Navy matrix passed. Screenshots showed the app-update notice covering part of the lower viewport; important-control occlusion was not established.

These observations come from the owner's PC QA handoff, not a new Codespaces browser session. They are not marked untested again.

## Existing focused regression proof reused

[Actions run38793234549](https://github.com/traderslink-bot/traderlink-platform/actions/runs/38793234549) completed SUCCESS on `58a91d60e57a15eba5207af3cf3f8d80d19215b2`; runtime is identical to released fix `fdfca103c` (only CI workflow differs). Existing full build/TypeScript and focused checks remain valid for the unchanged runtime; no broad suites or production build were rerun for test-only additions.

Exact source references:

- `src/modules/communities/contracts/coaching-review-readiness.test.ts`, describe `agreed Coaching review work`: 11 passed. Matrix rows include required0/null with no trades allowed when summary exists; required1 with no trades rejected; required2 with `[saved, queued]` remains1/2 and not ready; required2 with two saved ready; removed required evidence `[removed]` remains0/1 and not ready. Named cases also cover empty/cancelled-action content and actionable sharing guidance.
- `src/scripts/verify-coaching-remediation.ts`: generated occurrence under original frozen agreement, summary cannot fulfill one required trade, saved draft/event preservation, already-delivered legacy0/1 completion rejection, partial1/2 rejection, fulfilled work, extra queued work, removed extras and legitimate custom summary-only delivery/completion. Original positive persisted-row fixtures alone did not establish real select/save action traversal; the new test below closes that distinction.
- `src/scripts/verify-coaching-review-required-work-ui.cjs`: original actual route rendering established0/1 counts, Not ready and disabled controls. It uses inert surrounding controls and synthetic loader data; it is not CSS/browser proof.

## Newly executed action/service proof

Files: `src/scripts/coaching-review-action-acceptance.cjs`, expanded `verify-coaching-remediation.ts`, expanded route-render harness. No production handlers/services were edited.

The harness transpiles and invokes the **actual exported functions** from `app/(dashboard)/communities/community-actions.ts`, including its unchanged `reviewWorkflow` function, against the actual Coaching service and a real-schema in-memory SQLite fixture. Only request identity/access acquisition, database acquisition, viewer resolution and Next cache/navigation APIs are substituted. Real service relationship/role/ownership validation and required-work guard remain active. Unexpected fetch calls fail locally; no cookies/tokens, live Discord request, hosted session or hosted database is used. This proves the exported action-function chain, not authenticated serialized Next action HTTP transport.

Exact new passing case labels from `action-acceptance.log`:

| Case label | Disposable fixture / assertion |
| --- | --- |
| `actual delivery action rejects 1 required / 0 saved with summary` | Generated occurrence, frozen accepted quantity1, saved summary, Journal off. Rejects specifically with `requiredTradeReviews`; exact review fields, selections, lifecycle events, student snapshot and notification/outbox/delivery table counts unchanged; no delivery timestamp or successful Next refresh/revalidation. |
| `actual Complete action rejects legacy delivered 1 required / 0 saved` | A legacy delivered state is constructed only inside an in-memory savepoint. Actual Complete rejects with unchanged status/content/side effects. No staging state was forced. |
| `actual delivery action rejects selected but unsaved required feedback` | Actual select action creates queued work. It does not count as saved; actual delivery rejects with the same no-side-effect assertions. |
| `actual remove of required saved feedback invalidates readiness and delivery` | Real remove action removes required saved feedback, returning counts to0/1 and readiness false; actual delivery rejects. |
| `actual select/save/deliver/Complete accepts 1 required / 1 valid saved with isolated Journal grant` | In-memory student-owned account and explicit trades-only grant; actual select/save actions persist nonempty feedback, `saved` state and saved timestamp; restored valid evidence allows actual delivery and Complete. Journal trade/story facts come from a scoped synthetic adapter; real Journal relationship/account/grant checks run. This is not broker ingestion/full Journal fact-query integration or a staging grant. The adapter is restored in finally and all fixture changes rolled back. |
| `actual delivery action rejects 2 required / 1 saved plus 1 unfinished trade draft` | Disposable original terms require2, one saved plus a queued row containing incomplete draft feedback. Incomplete text does not count as saved. Actual delivery rejects without modifying either trade row. |
| `removing required saved feedback blocks actual delivery again` | Persisted synthetic saved evidence is removed via the actual action, then actual delivery rejects and retains resulting draft state. |
| `actual delivery/Complete accepts fulfilled persisted trade evidence` | One required/one saved; both actual lifecycle handlers succeed. |
| `actual delivery/Complete preserves legitimate summary-only compatibility` | No occurrence-linked trade minimum, zero trades, saved summary. Actual delivery and Complete succeed. |

The ordinary focused real-schema service regression also passes after these additions. Expanded actual route rendering passes1 of2 /1 /2 with one saved/one queued;1 of1 /1 /1 fulfilled; required evidence removed returning0/1; summary-only controls; and exact Return-link href. New CJS syntax/lint, targeted test TypeScript and diff whitespace checks pass. Logs: `artifacts/coaching-review-required-work/action-acceptance.log`, `acceptance-route-render.log`, `acceptance-lint.log`, `acceptance-types.log` in `/workspaces/traderlink-coaching-review-required-work`.

No new production defect was reproduced by these isolated checks. No claim is made that the update toast or the previously unsuccessful Return click is resolved.

## Actual new signed-in staging observations

**None from Codespaces.** Available tools expose no browser controller for the PC sessions. Codex Document Control returned no connected sessions. Browser login sessions were not extracted or synthesized. This is an access limitation, not failed feature behavior.

Source inspection confirms the Return href points to the expected review workspace; the render harness checks that exact href. It does not prove a click navigates. `app/pwa/pwa-update-notice.tsx` uses a fixed bottom16/right16 alert, width `calc(100vw - 32px)`, max-width420, near-modal z-index. This explains why overlap needs measurement, but does not alone establish which staging controls are obscured. No speculative toast/layout patch was made.

## Narrow PC continuation — existing draft only

Use existing coach session and `dedebb39-c1a1-4f5f-a128-18ea5a3f4b76`; do not change content or send/complete it. Record original appearance and viewport first.

1. Review workspace URL:
   `/communities/test-community/workspace/students/5d7956a4-a4f2-4e65-92b7-af8feadfbf29/reviews/dedebb39-c1a1-4f5f-a128-18ea5a3f4b76`
2. Complete **workspace only** matrix: desktop1440x900 Light/Navy, mobile390x844 Light/Navy. Check required-work guidance,0 of1,Not ready, saved synthetic feedback, wrapping and horizontal overflow. Measure document scrollWidth against viewport width and save screenshots. Do not repeat the already passed final-preview matrix as a new gap.
3. From this draft's `/final` route, record current URL, the Return-link href and click outcome. Wait for the target URL and workspace content, rather than classifying from a single click or arbitrary delay. If it remains on final, record browser/console/network evidence and whether an overlay intercepted the click.
4. While the update notice is visible, measure its rectangle against Return, Send and other important controls, especially390x844. Use hit-testing at overlapping control centers and screenshots to distinguish actual interception from merely occupying lower viewport space. Do not dismiss the notice first and silently count an unobstructed state as the toast test. Do not force a service-worker update or change app settings to manufacture a toast.
5. Restore original appearance/viewport in finally. Return PASS/FAIL/BLOCKED/UNTESTED per case, screenshots and sanitized evidence. Do not alter agreements/grants, create trades, force states or touch either protected review/Bullrun.

## New staging fixtures — owner approved for PC Codex

On2026-10-15, the owner explicitly answered **“Approve isolated staging QA fixtures for PC Codex.”** This authorizes PC Codex to create and test exactly the new records below through normal signed-in app flows. It does not authorize Codespaces hosted writes, deployment, credential extraction, capacity/permission bypass, or alterations to protected existing records. Inspect for already-created identical QA fixtures first and reuse them to avoid duplicates. Execution has not yet been reported; record all resulting IDs and observations.

- **One new student-owned Journal account**, moonmafia, named `QA ONLY — Coaching acceptance 2026-10-15`, USD/UTC, isolated from existing accounts.
- **Two synthetic manual executions**, symbol `QAONLY`, quantity1: buy at10.00 on2026-10-15 14:00UTC; sell at10.10 at14:01UTC, zero charges, Day intent. They produce one derived closed round trip through normal app services; label all content synthetic. No real trade imports or existing Journal changes.
- **One new coaching test plan** owned by TradersLink, `QA ONLY — One-trade acceptance`, zero dollars, one once-only trade-review item, quantity1 measured in trades, existing `test-community` role requirement and existing approved audience. No Discord role/channel changes or automatic Discord publication. Verify normal capacity/entitlement controls; if blocked, stop rather than changing them.
- **One new moonmafia/TradersLink relationship** on that new plan and **one newly accepted once-only agreement**. Do not revise, supersede or edit the current relationship's agreements.
- **One explicit trades-only Journal grant**, from the new QA account to the new QA relationship only. No grant for the current relationship or other accounts.
- **One agreement-generated required-trade review** and **one separate unlinked custom summary-only review** on the new QA relationship. Permit synthetic select/save/deliver/acknowledge/Complete only for these new reviews. Check one valid saved trade allows required delivery/completion, and zero-trade summary-only delivery/completion remains allowed. No Discord sends.

All new records are staging QA data, visibly synthetic and retained for evidence; no automatic cleanup/deletion. Normal derived IDs/projection rows may be created by existing app services. The owner approved this bounded expansion of the earlier no-new-data/no-grant scope. No live Discord messages or changes to existing grants/agreements are permitted. If normal UI, browser/account access, capacity or entitlement prevents the new fixture, report BLOCKED without bypassing it. These two signed-in browser cases remain pending until PC execution evidence returns; isolated action proof remains passed. Codespaces has not created or changed any hosted fixture.


## PC results returned — 2026-10-15

Supersedes the preceding pending-new-fixture wording: PC QA reports required1/1
and legitimate custom summary-only0/0 delivery, acknowledgement, completion and
refresh persistence passed. QA relationship1771072c-46e4-44e5-b3cb-abaef90366ed,
required review1c8c4176-e82b-4032-bd57-5ac6d3d79af9, summary review
398b8eb7-4d2c-4d54-8dd6-e748218df1e1 are now protected evidence.
The follow-on [two-defect UI correction](coaching-ui-timezone-qa-20261015.md)
records update-notice interception and inaccurate timezone presentation. This
Codespaces task does not alter any of those fixtures or repeat hosted writes.
