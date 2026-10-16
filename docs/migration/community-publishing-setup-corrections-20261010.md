# Community publishing and setup corrections — October 10

Owner-approved in Custom plans chat. In progress; not released or fully QA accepted.
Scope: publication feedback/errors, per-ticker Notes/DD/source links, no-copy-ID
Discord setup, reported multiline alert error, exact synthetic QA content cleanup.
No real notifications, payments or paid AI calls.

## Shared checkout ownership notice

This slice owns community-publication-* modules, community-watchlist-research*,
community-watchlist-editor, community-connect-form, community-setup-feedback-actions,
the alert/watchlist composers and detail pages, onboarding page, and the narrow
role/channel form-wrapper changes in community-dashboard. Help changes are confined
to Discord Communities joining/publishing blocks in traderslink-app-guides.
Core community-actions and platform repository are not being replaced. Preserve
the concurrent coaching deletion/archives work and0164 reservation.

Migration0163/execution176 is proposed for ticker research and publication receipts;
coordinator notified. No hosted migration or deployment has been authorized by this
record. Final integration must reconcile migration ledger/order and exact source.

## Verified source and reported failure

- Staging deployment957306ce-052d-4ae9-bcd7-ee276da82c79, source
  d4cc8b7ed6f60609b4fafbbfcb1fa82f8fb214d6, branch staging, SUCCESS.
- At21:24:12Z October10, createAlert threw storage validation for body, digest4121451946.
  That deployed source rejects line breaks in body; current feature checkout includes
  body in the multiline allowlist. Preserve that existing correction.
- Browser confirms the displayed ALERT_FULL_BODY_1002 belongs to the exact old
  QA20261002 full-alert record. It is stored test content, not UI copy. Cleanup must
  target known QA records only, preserve genuine content, and never resend Discord.
- Owner's new test watchlist d7aae5b9-b3e5-43d7-940d-c5ac118f9e51 is not cleanup data.

## Verification

- New in-memory publication check PASS: multiline body, repeat-save receipt,
  one queued delivery, research persistence/removal, wrong-community denial,
  invalid source-link denial, rollback and foreign keys. Network calls0,
  real notifications0, paid AI calls0.
- Focused JSDOM form QA PASS: pending/disabled controls, duplicate-click suppression,
  preserved input on transport failure, same-request retry, success link and research hydration.
- Existing Discord-resource and launch-foundation checks PASS. Targeted ESLint has
  zero errors (seven pre-existing unused warnings in the shared dashboard).
- Live GET-only Discord discovery PASS: bot matches installation client, 26 roles,
  61 text/announcement channels and 9 publishable channels. No messages sent.
- Additional regressions PASS: 140-character and Unicode alert titles, missing
  research-field rejection without data loss, and credentialed-source URL denial.
- The exact full-alert QA record archive action navigated to the alerts list;
  browser debugger disconnected before content verification. Do not repeat blindly
  or claim cleanup verified. The owner's genuine test watchlist remains untouched.
- Integrated semantic/build and final hosted UI/role checks remain pending. The
  coordinator's repeated empty replies do not constitute release clearance.
  Preserve current deployed migration prefixes; do not publish the old feature
  manifest over the production or staging ledger. No release has been made.

Controlling plan: [Communities launch](traderlink-communities-coaching-launch-plan.md).
