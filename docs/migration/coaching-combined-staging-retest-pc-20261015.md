# Remaining Coaching acceptance — self-contained PC retest

**Release gate BLOCKED for lesson-submit testing:** staging currently runs
`e2da9c38c8c0be2efa968e7026db3e4f2d281e8f`, deployment
`7c975e9e-a30d-445a-a3b5-69b1c7442191`. New inline-error/cooldown/key-order fixes
are local only. Wait for a separately authorized corrected release and Codespaces
release receipt before submitting the lesson tests. Read-only fixture inspection
is safe now. Do not repeat passed existing-connection/channel/review-count/
timezone/update-notice checks.

## Paste into PC Codex

Read applicable AGENTS.md. Test in my existing signed-in staging browsers only:
https://traderlink-platform-staging-staging.up.railway.app . Community test-community
is the normal TradersLink Discord server. Coach TradersLink; student moonmafia.
Codespaces release/build proof is supplied evidence, not browser SHA proof.

Owner approved only these new synthetic fixtures for mutation. All names start
`QA ONLY — Lesson publication validation`:

- Plan A `8cf418a8-2374-4a73-a60f-09f477e9f1bf`; $0, active, one lesson, no Journal scope.
- Plan B `620b72e7-47e8-4b73-aae5-ad7811c46b44`; $0, active, no matching student relationship.
- NEW relationship `d96396a0-f6fe-40f2-bf0a-4788ac88eab7`: Plan A, active but archived.
- Selected draft `f1f6f333-63d0-48b7-a072-9345ad3cef90`: Draft, selected_students, exactly one
  assigned recipient (the NEW relationship). Title ends “— selected draft”.
  Saved content: `QA ONLY saved content — keep this exact text after rejected publication.`
- Mismatch draft `27a399cb-a2e7-468a-9485-81e35500506e`: Draft, Plan-B audience, exactly one
  intended assignment to the Plan-A relationship, deliberately seeded only for
  this fixture. Title ends “— plan mismatch draft”. Saved content:
  `QA ONLY plan-B draft; plan-A student is not an eligible recipient.`
- Corrected reuse `6d130d19-cd76-44f9-9e49-d66435521688`: Published, Plan-A audience, exactly the
  NEW relationship. Title ends “— corrected plan A”; same content as mismatch.
- No agreement, review, Journal grant, account or trade was created for this test.
  Both commissions remain disabled. Links/times blank; delivery kind Live.

Teacher lessons: `/communities/test-community/workspace/teaching`.
Students/Archived: `/communities/test-community/workspace/students`.
New student workspace:
`/communities/test-community/workspace/students/d96396a0-f6fe-40f2-bf0a-4788ac88eab7`.
Student view: `/communities/test-community/coaching`; choose Coach and plan
“TradersLink · QA ONLY — Lesson publication validation — A”. Confirm its selector
value is the NEW relationship before any fixture-specific interaction.

Allowed after corrected release gate:

1. Attach sanitized failed-request capture BEFORE new lesson tests (rules below).
   In the teacher lessons page locate the selected draft by exact title and
   verify its edit form's hidden teachingId equals `f1f6f333-63d0-48b7-a072-9345ad3cef90`.
   While the NEW relationship is archived, try Status Published → Save lesson.
   You may append a clearly synthetic unsaved marker to the Title/Content first.
   Expect inline “Choose active students before publishing this lesson. Restore
   an archived student or create a lesson for the correct students or plan.”
   Expect input text retained and retry enabled. Record actual error wording.
   Reload and verify the saved Draft/title/body are unchanged. No draft save of
   the temporary marker. Check Light/Navy desktop/mobile only on this new error.
2. Students → Archived: locate Plan A and verify the Restore form's relationshipId
   is EXACTLY `d96396a0-f6fe-40f2-bf0a-4788ac88eab7`. Restore ONLY it. Verify active/unarchived.
3. With the relationship now active/unarchived, try publishing the MISMATCH draft,
   hidden teachingId `27a399cb-a2e7-468a-9485-81e35500506e`. It must still reject and remain Draft,
   with content/intended assignment preserved: Plan A does not satisfy Plan B.
   Do not change either plan or create a Plan-B relationship to bypass the test.
4. Publish only the SELECTED new draft using its unchanged saved title/body;
   this in-app publication solely to the new moonmafia relationship is approved.
   Codespaces guarded this exact workflow and observed no delivery/notification
   writes. If UI adds a send/notify/Discord confirmation, stop before that action
   and report it. No Discord sends or real-recipient notifications are authorized.
   Reopen/reload and check Published persists. Student may read this synthetic
   lesson and the existing corrected reuse; must not see the mismatch draft.
   Do not mark progress/complete, grant Journal access or touch other lessons.
5. Restore the bounded fixture end-state using normal UI: selected lesson back
   to Draft (same title/body), then Archive ONLY the NEW relationship. Retain
   mismatch Draft with1 intended recipient and corrected reuse Published. Delete
   nothing. Record any variation from this requested final state.
6. Ended-recipient rejection/reactivation was already checked against staging
   services/actions by Codespaces. Do not end the relationship in this browser
   run unless its supported reactivation route is clearly available; avoid
   manufacturing an unrecoverable UI state or adding duplicate relationships.

Network evidence:

- Capture HTTP>=400 and failed requests during these tests only. Record UTC
  timestamp, method, coarse origin, redacted path template, status OR safe
  network error code, resource type. Never record headers/cookies/auth/state
  values, bodies, response payloads, query strings or HAR exports.
- Keep only these literal route segments; replace every other segment with
  `:redacted`: api, communities, test-community, workspace, teaching, students,
  onboarding, manage, channels, coaching, _next, static, auth, discord, login,
  callback, platform, health. Origin can be the staging origin or
  https://discord.com; represent other origins as `external`.
- Failure reason: only a `net::ERR_[A-Z_]+` code, otherwise `request_failed`.
  If using connected Playwright, attach response/requestfailed listeners with
  this filtering before navigation; if using browser network-list tools, apply
  the same filtering before storing/reporting. Do not fetch request details
  containing credentials/payloads. If the tool cannot capture safely, report
  NOT TESTED and the limitation rather than exporting raw logs.
- Validated action errors may return HTTP200; record UI/action result separately.
  “0 captured failures” is valid only if capture was active throughout.

Unconnected-server/first-install boundaries:

- You may inspect already-discovered server choices without installation,
  connection submission, login consent or saving. If an approved unconnected
  server already exists in the selector, check its first-time presentation by
  selection only. No such option means NOT TESTED, not permission to add it.
- Genuine bot install/consent/return/connection submission is NOT AUTHORIZED.
  Return the exact next authorization needed: specific owned server and identity,
  staging allowlist change if required, displayed bot permissions/new consent,
  new app connection creation and agreed preservation/recovery boundary.
  No role/channel creation or Discord delivery is included. After future
  authorization, observe actual install completion and tab/app return/Connect;
  do not assume an automatic callback already exists.

Protected — never modify, archive/end, reuse or delete:
relationship5d7956a4-a4f2-4e65-92b7-af8feadfbf29;
review31ea4d91-dcae-4e88-96f6-d1505f2f3644;
saved draftdedebb39-c1a1-4f5f-a128-18ea5a3f4b76;
relationship1771072c-46e4-44e5-b3cb-abaef90366ed;
reviews1c8c4176-e82b-4032-bd57-5ac6d3d79af9 and
398b8eb7-4d2c-4d54-8dd6-e748218df1e1;
Bullrun and ALL other accounts, trades, plans, agreements, Journal grants and
lesson drafts. No code edits/deployments, new records, roles/bot removal, outages,
cron triggers, hosted schedule/configuration changes or storage resets. Do not
claim page access proves worker fairness. Do not manufacture Discord errors.

Return PASS/FAIL/BLOCKED/NOT TESTED per item, screenshots of new lesson/error
states, sanitized failed-request records (or documented0), exact routes/fixture
initial/final states and all allowed actions actually performed. Keep browser
results separate from Codespaces operator-action, isolated, build and hosted
worker evidence. Do not certify the whole feature for launch.
