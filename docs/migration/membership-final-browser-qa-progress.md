# Membership final browser QA

Status: Fresh non-payment local acceptance completed, 2026-09-28.
Earlier failed attempts below are historical, not current blockers.

## Completed fresh checkpoint

- Restarted the canonical main development launcher without its optional
  `--webpack` argument, using the same isolated single-workspace fixture,
  loopback port 3018, disabled workers and 1 GiB heap. New plan returned 200;
  draft creation and publication succeeded. No product-code change was needed.
  The exact cause of the earlier runtime 404 was not established.
- Created and published a private coaching-only plan. Created and activated its
  free offer, assigned it to the previously empty invitation page, and verified
  that the same URL displayed coaching while public Plans excluded it.
- Invitation DOM supplied noindex, nofollow, noarchive, nocache and no-referrer.
  Created and activated an unlimited-repeat three-day free trial. Enrollment
  redirected to Plan & billing with the exact three-day access end date.
- Loaded the member picker, granted the synthetic member a timed public-plan
  entitlement and verified its exact end date in billing. Revoking that grant
  removed it from billing while the independent coaching trial remained active.
- Saved a sponsored automatic-grant Discord rule for an arbitrary synthetic
  server and two role IDs; the existing-rule editor rendered the saved rule.
  This is local configuration evidence, not real Discord verification.
- Saved a near-future private-page expiry. After that time the URL returned 404.
  Clearing expiry restored the same URL. Revoking the link then returned 404
  again and changed the active-link count to zero. Past expiry input was rejected
  with a specific validation message; immediate shutdown uses Revoke link.
- Switched to the retained selected-route production build and separate signed
  synthetic-member fixture. Journal-only Workspace rendered the saved QATEST
  trade review and omitted Analytics. Revocation redirected Workspace to Plans;
  Plan & billing remained accessible and showed no active plans. Free enrollment
  then succeeded and billing displayed QA Public Plan with no end date.
- The signed-member harness omits only Railway startup maintenance/workers and
  uses actual session and authorization services. Its retained build predates
  the Discord partial-outage source correction; that correction was independently
  rerun through the actual OAuth callback with mocked Discord responses.
- Fresh foundation, signed-request, Discord callback and migration verifiers
  passed. Migration rehearsal covered 131 entries with zero foreign-key
  violations. Expected fixture warnings do not represent live provider failures.
- Focused TypeScript passed all 115 entrypoints with zero diagnostics; scoped
  documentation whitespace checks passed. No generated runtime artifacts were
  changed. Temporary QA tabs and synthetic session cookie were removed and both
  sequential QA servers stopped. Fixtures were retained for reproducibility.

No new product defect was reproduced in this fresh pass. No live payments,
external Discord login, production data changes or publication occurred. Earlier
lifetime/recurring/custom-provider/paid-trial/offline evidence remains explicitly
historical in the complete acceptance matrix; those flows were not all repeated
in this pass. The membership Help terms remain unchanged by this QA-only slice.
Browser verification and investigation skills guided tracing rendered actions
through persisted member results and distinguishing setup failures from defects.

## Required scope

Fresh end-to-end acceptance covers owner customization in Journal Administration,
public versus unlisted plans, trials, individual grants, Discord rules, expiry,
revocation and member-facing results. The complete controlling inventory remains
in [the acceptance matrix](membership-acceptance-matrix.md). Live payments remain
a separate goal.

## Attempt and evidence

- Canonical `traderlink-platform` checkout on `main`; existing synthetic QA
  database only, loopback port 3018, workers disabled, 1 GiB Node heap.
- The retained production build does not contain the admin route. Started the
  existing development launcher for owner-control checks rather than treating
  that build as coverage of administration. Development owner preview would not
  establish normal signed-member authorization.
- Server reported ready. Browser discovery initially timed out; tab attachment
  failed, and recovery discovery returned no tabs. A second attachment attempt
  against the ready server also failed before any page could be observed.
- The Full-Story Verification skill requires stopping at a blocked boundary.
  No browser interactions, new member/plan changes, or fresh rendered acceptance
  were completed. This is a tool availability blocker, not a reproduced app bug.
- Stopped the temporary server; terminal exited and no TCP 3018 entry remained.
  No changes to `next-env.d.ts`, `public/sw.js`, or `next.config.ts` were detected.

## Resume boundary

Latest authorized retry: prepared a new synthetic single-workspace fixture with
the existing preparation script (temporary directory suffix `Phbmoh`). Started
canonical main on loopback 3018 with workers disabled. Removed the old synthetic
`traderlink_journal_account` cookie for the loopback origin after it selected an
account from the previous fixture. Admin then returned 200 and rendered the
existing Journal Administration shell and all membership sections.

Browser submitted an empty private page named `QA September 28 coaching`. The
action returned 200, active-link count changed from 0 to 1, and the generated
invitation rendered the chosen title and No plans are available. This confirms
the UI-to-action-to-database-to-render flow for empty private pages.

Clicking the visible New plan button then navigated to
`/admin/journal/memberships/plans/new` and returned 404. Reload reproduced it.
The source page and `.next/dev/server/app-paths-manifest.json` entry both exist;
proxy matching does not cover this route. Do not assume a missing source page or
claim a root cause without additional diagnosis. The Full-Story Verification
skill stopped the walkthrough at this failed boundary. Other planned browser
flows and fresh normal signed-member checks remain unfinished. Temporary tabs
were closed and the QA server interrupted; no real account or payment was used.

Next: diagnose the New plan 404 in the local runtime, correct it as authorized,
and resume the complete browser scope. The following notes describe earlier
attempts and are historical.

Retry on 2026-09-28: browser attachment succeeded. The canonical main QA server
reported ready on loopback 3018 with workers disabled. Admin navigation rendered
a server error; terminal correlated HTTP 500 with
`TRADERLINK_JOURNAL_SOURCE_IDENTITY_PRECONDITION_FAILED`, safe check
`active_workspace_cardinality`. The retained fixture was previously expanded for
normal signed-member checks; the development owner-preview resolver requires
exactly one active workspace. This setup cannot establish admin acceptance.
The Full-Story Verification skill stopped this pass at the failed boundary.
Use a newly prepared single-workspace synthetic admin fixture for the admin
walkthrough, and keep normal signed-member acceptance in its separate runtime.
Do not weaken the authentication precondition or modify real user data to proceed.
No membership form was submitted during this retry. The temporary QA server was
interrupted and the rendered error tab closed.

Correct the disposable fixture/runtime pairing, then run the full scope above. Existing
focused QA remains valid as recorded in [follow-up QA](membership-follow-up-qa-2026-09-27.md),
but does not replace this requested fresh browser pass. Do not describe final
end-to-end acceptance as complete until it is performed.
