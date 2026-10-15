# Coaching completion audit — consolidated implementation and evidence

## Current result

All13 Coaching areas have implementation and recorded verification; that does
not mean every scenario has signed-in browser or operating-readiness acceptance.
Most historical “known product gaps” have already been implemented. This audit
has now found **two reproduced implementation defects**, both corrected locally:
lesson publication with only inactive recipients, and background participant
refresh starvation after persistent failures/suspension. Attachment backup/restore
and readonly reopening additionally have new populated-synthetic proof.
No other confirmed coding defect emerged from this reconciliation. Remaining
browser/operations evidence must not be turned into speculative feature changes.

Audit source: `/workspaces/traderlink-coaching-completion-audit`, branch
`codex/coaching-completion-audit-20261015`, base
`798f757a5` (accepted UI/PC evidence checkpoint). Base runtime matches the reviewed
UI release; the new lesson publication correction is LOCAL and NOT deployed.
No hosted records, protected fixtures, Discord resources, permissions or release
configuration were changed. No push/deployment is authorized by this work.

## Evidence rules

- **Recorded live:** prior dated signed-in observations, reused as supplied
  evidence, not a new browser run or independently verified current deployment.
- **Isolated:** real-schema service/action fixtures or synthetic component checks.
  These do not become live acceptance because a release build passed.
- **Source:** implementation exists and was traced; source alone is not a passed
  user journey. Nothing in this matrix promotes source inspection to browser QA.
- **Deferred:** an owner decision, not an unresolved defect.
- The old October10 report points to absent
  `traderlink-coaching-complete-qa-20261001.md`. It was not found in this candidate
  or the inspected main/development docs. This report restores an accessible
  consolidated inventory from the surviving dated records; it does not invent
  the missing report's results.
- Legacy `src/modules/coach` AI-chat/AI-review QA is a separate surface and is not
  reused as evidence for the `/communities` coach/student feature.

## All13 Coaching areas

| # / area | Implementation and existing proof | Remaining boundary / disposition |
| --- | --- | --- |
| 1. Profile and plans | Profile/service builder, prices/quotes/currency/cadence, per-plan capacity, explicit roles and save/publish/pause/archive implemented. October10 fresh UI: structured weekly plan saved/reopened, role-choice/publish/capacity/navigation corrections passed. `verify-coaching-plan-role-selection.cjs`, `verify-coaching-plan-presentation.cjs`, `verify-coaching-plan-save-feedback.cjs`, `verify-coaching-enrollment-ui.cjs` supply focused proof. | No new missing editor identified. The records do not establish a fresh signed-in permutation run of every service editor; do not describe them as such. Keep existing passes. |
| 2. Enrollment and agreements | Real zero-dollar proposal/student acceptance recorded Sept28. October15 new synthetic relationship/agreement and required1/1 journey accepted by PC. `coaching-agreement-service.ts` plus remediation fixture cover frozen terms, revisions, unsigned denial, weekly/month-end generation, idempotence, question renewal and extra-request coach acceptance. | Hosted recurrence/worker operating evidence is an operational gate, not an absent agreement implementation. Paid platform checkout/commissions are excluded by owner policy. |
| 3. Coaching Work | Days/custom range/week/month/search/filter/sort/count/progress implemented; `verify-coaching-work-filters.cjs` covers bounds and counts. October10 live1/2-day filtering and task completion, responsive metrics and desktop/mobile layout recorded. | Historical custom-date automation did not stick; no defect proven and no new correction justified. Exact range has isolated proof. No fresh whole-page browser permutation claim. |
| 4. Students | Lists, workspaces, tasks, shared/private records, messaging/media, archive/restore and retained former-student reads implemented. Sept28/Oct10 message/task/history/image observations passed. Current remediation verifies archived/ended history, no new requests/images/Journal reads, restoration and outsider denial. | Former-student browser/operations coverage remains scoped; do not relabel the already implemented history path a product TODO. |
| 5. Review types/context | Trade/day/performance/strategy/risk/custom, optional sections, prior focus and comparisons implemented. October10 recorded correct synthetic period statistics, per-day notes, saved strategy feedback, blank custom dates and restored optional editors. Reminder/context scripts supply chronology, scope and currency proof. | Reader-context collaborators are mocked in their focused script; not a substitute for every hosted rules/analytics population. Existing actual period/notes observations stay passed. |
| 6. Trade workflow | Find/To review/Saved, student/coach selection/removal, per-trade feedback/images, save/edit and persistence implemented. October10 AAPL lifecycle and October15 required1/1 signed-in acceptance passed; action acceptance harness exercises real exported select/save/remove handlers with real services/schema. | No new implementation gap found. Protected evidence and Journal grants remain untouched; no repeated mutation requested. |
| 7. Shared Journal tools | Scoped read service and trade-details/analysis routes exist. Existing notes/executions/drawer observations, context script and scoped Journal fixtures cover factual reads, revoked/unshared scope and no ledger writes. Coach bulk student exports explicitly excluded. | Do not claim live acceptance of every Analyzer/report variant from mocked context checks. Optional unavailable tools must retain truthful states; no speculative new integration or export work. |
| 8. Final review lifecycle | Required-work guards now use original accepted agreement in UI and direct server delivery/completion; custom0/0 preserved. October15 PC accepted required1/1 and summary-only0/0 delivery/acknowledgement/completion/persistence. Earlier follow-up/reply/due/completion observations passed. Nine action cases and11 readiness cases provide negative/positive isolated proof. | CLOSED original zero-trade defect. Keep passed lifecycle cases closed; no reset of completed test reviews. |
| 9. Sessions | Schedule/timezone/duration/external link, per-student agenda/shared/private notes, attendance/completion/history implemented. October10 live30-minute UTC session and completion/history passed; remediation verifies private notes omitted and validated links/duration. | No native conferencing promised. No missing session implementation identified from current evidence. |
| 10. Teaching | Live/recorded/resource/assignment, audiences, reuse, scheduling/due/progress implemented. Sept28/Oct10 selected-student delivery/completion and recording/deadline updates passed; reuse correction and creation-time archived exclusion already verified. | **One newly reproduced publication-time stale-audience defect; corrected locally below.** Hosted acceptance of this new correction awaits an authorized release; previous teaching passes stay passed. |
| 11. Student dashboard | Normal dashboard shell, own relationships/agreements/work/reviews/messages/media, student requests, sharing, acknowledgement/follow-up/lessons implemented. Sept28/Oct10/Oct15 participant observations passed; private/draft canaries absent; coach-only pages denied in student browser. | No replacement student UI needed. This audit does not certify all prior visual states on a newly deployed build. |
| 12. Isolation and access lifecycle | Scoped services/actions/files, grants/revoke, role pause/restore, stale verification, archive/end/history and deleted-owner continuation implemented. Recorded two-coach isolation and explicit sharing from prior QA; current remediation includes membership/provider failure, role restoration, deletion archive expiry/rollback and other-user Journal preservation. | Independent-server install/ownership-transfer and hosted deletion/admin/backup exercises are separate controlled acceptance, not permission to change roles or customer data. |
| 13. Presentation and reliability | Existing rendering/navigation tests and October10 responsive/error retests retained. October15 PC notice-visible Light/Navy1440x900/390x844, correct hit targets/Return, no overflow, saved draft across Update app, UTC/NY labels and cancelled forms all PASS. | Both UI defects CLOSED. Optional winter/cross-date/nonempty-offline staging extensions are owner-deferred. Local storage/DST/outbox proof stays isolated. No reopening these checks. |

## The confirmed gap and correction

**Trigger:** save a draft lesson with a current assigned student; archive or end
that student's relationship before publishing. `createTeaching` correctly
excludes inactive students at creation. `updateTeachingDetails` expanded current
all/plan recipients but then accepted ANY stored recipient row, including the
now-inactive historical assignment.

Before editing service code, new real-schema assertions failed with:
`Missing expected exception: Cannot publish a all_students draft to only archived students`.

Correction: publication now joins recipient rows to relationships and requires
at least one active, unarchived relationship owned by the lesson's coach in the
same community. Plan audiences additionally require the current matching plan.
The ownership lookup is checked before expanding recipients. Existing published
error wording is reused. All checks and expansion remain inside the existing
transaction, before saved lesson fields change. Recipient history, prior
completion and delivered records are not deleted or rewritten.

New regression coverage exercises all_students, plan and selected_students:
archived-only and ended-only publication rejection (six combinations), unchanged
saved draft/recipient rows on rejection, and restored current-student publication
(three positive cases). Existing lesson reuse/progress and other Coaching
regressions remain intact. This is a minimum-current-audience gate, not a change
to historical lesson retention or a new entitlement/grant policy.

Changed runtime file:
`src/modules/communities/server/traderlink-community-coaching-program-service.ts`.
Regression: `src/scripts/verify-coaching-remediation.ts`.
Help Center Coaching guidance was inspected: the existing active-access/history
contract remains accurate; no new workflow or visible wording requires a guide
change. No dashboard UI, dependencies, database migration or data contract added.

## Verification in this run

- Before-fix reproduction: FAIL as expected, actual publication incorrectly succeeds.
- After-fix real-schema remediation: PASS, including the nine actual review action
  cases it invokes, recurrence/idempotence, draft/session privacy, lesson reuse,
  role/archive/deletion history and foreign-key checks. Only standalone Next
  `server-only` resolution is substituted; no provider/hosted session is used.
- Targeted strict TypeScript semantic checks: two changed files, zero diagnostics.
- Targeted ESLint: PASS, zero warnings/errors.
- Diff whitespace and report links: PASS.
- Full new-candidate build: **NOT VERIFIED**. Available memory fluctuated from
  about3.4GiB to2.7GiB before startup, below the3GiB checkpoint guard, with no swap
  and other owner workloads active. The shell mistakenly continued after the
  guard failed. Academy validation passed and compilation began; the agent then
  deliberately stopped only the exact Next build process in this worktree
  (PID292001), exit143. This is an agent-stopped attempt, not a compiler failure
  or unexplained external termination. No other workload was stopped. Earlier
  full CI/build proof applies to the unchanged baseline, not this new server
  correction. A final correctly guarded recheck found3411MiB available against
  a3584MiB safety threshold and did not start any build process. A completed full
  build remains a release verification gate.

## Continued worker and attachment readiness — local follow-up

The owner's instruction is to batch full builds rather than stop development for
small corrections. No new full build, Git publication, deployment, Discord call
or hosted-data operation was performed in this follow-up.

### Confirmed worker defect: failed participant starvation

The refresh query selected the oldest stale membership rows on every bounded
pass. Provider failure and suspension correctly left evidence stale, but that
also kept selecting the same failed prefix. With a small batch, later valid
participants could never be refreshed, which can prevent their recurring work
from becoming eligible.

A real-schema fixture with batch size1 reproduced the issue before the fix:
`provider failure must not starve the next participant`, actual refreshed0 versus
expected1 on the second pass. The first fixture attempt violated the existing
monotonic-evidence trigger while arranging stale timestamps; corrected synthetic
timestamps reproduced the actual scheduling defect without changing that trigger.

Correction: refresh selection rotates by stable guild/user key using an explicit
process-local scheduling cursor. The hosted timer and cron route already share
one overlap-guarded runner; that runner now retains the cursor across per-pass
connections and service instances. Failure/suspension advances only scheduling.
It does not update membership freshness, roles, eligibility or identity evidence.
The cursor wraps, so failed targets are retried rather than permanently skipped.
Restart resets scheduling position only; authorization still reads the existing
verified evidence. Batch bounds and stop-on429 behavior remain unchanged.

Runtime changes: `coaching-discord-refresh-service.ts`,
`coaching-maintenance-service.ts`, `coaching-maintenance-runtime.ts` under
`src/modules/communities/server/`. No migration or durable member-state field.

Targeted real-schema regressions PASS for provider403 and suspended participant,
progress across recreated service instances sharing the cursor, wrap/retry and
unchanged stale timestamp. Existing429 stop, ownership/membership/role guards,
recurrence and overlap/failure-release checks remain passing. This is isolated
worker proof, not hosted timing/capacity or real-provider acceptance.

### Added attachment persistence evidence

The populated synthetic remediation database now uses the actual SQLite backup
primitive, copies the resulting backup to a separate restore file, and reopens
it read-only. Actual Coaching `readImage` returns exact original PNG bytes and
media type for both original participants; an unrelated user remains denied.
Only the test's generated temporary directory is removed afterward.

This proves populated attachment serialization, backup/restore/reopen and retained
participant authorization locally. It does not certify the complete Platform
backup validator, a Railway live-volume restore, encryption/key recovery, recovery
time, storage quotas or the larger operating envelope. Those remain separate
launch-operation evidence. Existing signed-in image upload/decoding passes remain
passed; no new participant browser test is requested.

The Help Center contract is unchanged: these are background scheduling/storage
corrections with no new controls, copy or permissions. Existing role/privacy/help
guidance was reviewed and needs no wording change for this slice.

Verification: real-schema remediation and actual review-action regressions PASS;
new media storage and refresh fairness cases PASS. Targeted ESLint passes with
zero warnings/errors; strict semantic TypeScript checks on all four changed
TS files report zero diagnostics. Diff checks pass. Full build is explicitly
owner-deferred to the combined checkpoint. No accepted UI check was reopened.

## What is done / what remains

**Done:** a single accessible13-area inventory, reconciliation of dated live versus
isolated proof, removal of the missing-report dependency, closure of already
accepted defects, and the two demonstrated implementation corrections with focused
regression. No new code defect is inferred from a missing browser observation.

**No additional confirmed Coaching implementation TODO is established by the current audit.**
That is bounded audit evidence, not a security certification or exhaustive
statement about all possible software defects.

Remaining work is separately classified:

1. **The local correction batch:** owner defers a standalone full build to the
   next combined verification/release checkpoint; this does not block ongoing
   development. After separate release authority, verify lesson publication and
   worker behavior on the released candidate.
   No deployment or new hosted QA fixture is authorized here.
2. **Community/bot acceptance:** independent owner/server installation and recovery
   evidence still needs reconciliation under the Communities inventory. Existing
   normal TradersLink setup/private-channel delivery remains prior evidence;
   this Coaching run neither replaces it nor asks members for raw server IDs.
3. **Launch operations:** production source/migration reconciliation, operating
   envelope/workers/rate limits, media/backup/restore and final owner release
   verdict are L07-L09 work. The current evidence does not certify them complete.
   No live customer deletion, load test, Discord send or production promotion
   follows from this report. Commissions remain disabled; student bulk export
   remains excluded.
4. **Owner-deferred optional browser cases:** retain the existing local proof;
   no further winter/date-boundary/nonempty-offline staging work is requested.

## Evidence sources

- [Controlling launch inventory](traderlink-communities-coaching-launch-plan.md)
- [Dated launch progress](traderlink-communities-coaching-launch-progress.md)
- [September27 full inventory](traderlink-coaching-full-qa-20260927.md)
- [September28 live participant results](traderlink-coaching-live-qa-20260928.md)
- [October10 final QA and correction-build observations](coaching-final-qa-20261010.md)
- [Required-work action and PC evidence](coaching-required-trade-acceptance-handoff-20261015.md)
- [Accepted UI and latest PC results](coaching-ui-timezone-qa-20261015.md)
- [Deletion/archive implementation boundaries](traderlink-coaching-deletion-archive-progress.md)
- [Offer builder progress](traderlink-coach-plan-offers-redesign-progress.md)


## Owner direction — batch full-build verification

The owner explicitly directed that the small lesson-publication correction does
not need a standalone full build now. Its focused regression, lint and targeted
TypeScript checks are sufficient to continue development. Defer the full build
to the next combined implementation/release-verification checkpoint. Do not
retry it for this correction or treat it as a blocker to further Coaching work.
No build pass, push or deployment is implied. Next local work: reconcile worker/
recurrence and attachment operating-readiness evidence; implement only
demonstrated gaps, retaining existing accepted browser results and deferrals.


## Discord bot onboarding — local verification, October 15

Owner requested continuation while PC Codex performs signed-in staging QA.
Reviewed the discovered-server form, both connect actions, verified-owner setup
service and Discord resource/permission discovery. No new runtime defect was
reproduced; no speculative code or visible wording changes were made.

Five focused verification scripts passed on this candidate:

- `verify-community-bot-onboarding.cjs`: named server selection, bot install
  URL, automatic verified names, forged browser-name rejection, denied setup.
- `verify-community-onboarding-reentry.cjs`: fresh-owner verification for
  reconnect and creation; identity/allowlist/link denial before verification.
- `verify-community-install-identity.cjs`: ten dedicated Communities application
  ID cases; no fallback to the separate login OAuth application.
- `verify-community-discord-resources.ts`: private-channel permission precedence,
  unavailable channels, unsupported types, foreign guild/malformed resource
  rejection and provider 403/404/429/500 failures. All HTTP responses synthetic.
- `verify-community-launch-foundation.ts`: real in-memory schema creation,
  approved/fresh ownership, automatic unique URLs, reconnect preservation,
  transfer denial, no operator/test grants or destinations, rollback/retention.

The app already keeps bot credentials server-side and uses named Discord choices;
this pass introduces no raw-ID input. Reconnect preservation is local fixture
proof, not a fresh staging observation. Existing TradersLink installation and
channel delivery remain earlier evidence. PC's existing-server read-only QA is
pending; first-time independent-server installation, Discord permission consent
and automatic return/setup continuity remain unproven by these fixtures. The
onboarding form opens installation in a separate tab and then offers Connect
server; do not describe it as a verified automatic callback flow.

Reviewed the Discord communities Help guide in
`src/modules/help/traderslink-app-guides.ts`; its named-resource and permission
instructions match this implementation. No Help update required without a
behavior change. No full build (owner deferred), deployment, hosted writes,
Discord sends or role/channel changes occurred. Existing protected records remain
untouched. This is bounded onboarding evidence, not whole-feature certification.


## PC onboarding findings received — October 15

Supplied signed-in staging evidence confirms two presentation gaps. Existing
TradersLink server selection still offers Install/Connect without connected status
or management navigation, despite an active existing community and successful
named-channel discovery. Connection submission/reentry was not browser-tested.
Source confirms onboarding reads only OAuth candidates; it does not load an
existing owned community for presentation, and the form always renders the
install/connect controls. This is a presentation omission, not evidence of failed
backend recognition. Earlier local reentry tests remain valid bounded proof.

Channel choices disable unavailable destinations with “Bot access required” but
provide no actionable permission guidance there. The resource contract exposes
only canPublish, so exact missing permissions are not currently available to the
UI. Do not invent a specific missing permission from that boolean.

Proposed correction, awaiting owner authorization for code/visible wording:

- For the selected server, resolve an existing community owned by the current
  Platform user. Show “Server connected” and “Manage community” linking to its
  existing settings instead of presenting first-time Install/Connect actions.
  This means saved app connection, not a new live bot-health assertion. Preserve
  separate first-time setup for unconnected servers and existing reconnect checks.
- Beside channel selection, show: “For channels marked ‘Bot access required’, ask
  the server owner or someone who manages channel permissions to give the
  TraderLink bot View Channel and Send Messages access. Check channel-specific
  overrides and any bot timeout, then refresh this page.” Keep unavailable
  options disabled and server-side permission verification intact.

PC passes: named server/role/channel discovery, no credential/manual-ID request,
Light/Navy desktop/mobile after settling, empty captured console warnings/errors.
Network failures were not independently captured. Existing-install presentation
needs retest after an approved correction; new-server install/consent/return,
connection submission and verification-error recovery remain separate controlled
acceptance. No runtime change, deployment or hosted mutation authorized by this
handoff. Earlier five local script passes do not close these browser UX findings.


## Onboarding correction batch complete locally — October 15

Owner clarified Codespaces owns implementation and authorized finishing the
related corrections together. This supersedes the preceding pending-code
boundary; deployment remains separate. Reviewed server selection, saved
connection presentation, reconnect/backend checks, installation identity,
channel discovery/permissions, empty/failure states and Help alignment.

Implemented:

- Onboarding page left-joins existing community by selected guild AND current
  Platform owner; no other owner's slug is exposed. Existing saved connections
  show “Server connected” and “Manage community”, opening the original settings
  route without Install/Connect submission. This is saved app state, not a live
  assertion about bot permissions. Existing paused state is not changed.
- Unconnected servers keep named discovery and first-time installation/connect.
  Selected guild is a hidden field in that server's form; keying by guild resets
  prior server feedback on switching. Existing server-side verification unchanged.
- Channel settings no longer offer installation after successful resource/bot
  discovery; show “Discord app detected”. Failed discovery keeps the existing
  install/recovery path. Detection does not promise every channel is writable.
- Unavailable channel options stay disabled. Adjacent guidance directs the owner
  or permissions manager to View Channel/Send Messages, channel overrides and
  timeout recovery, then refresh. Empty supported-channel results also explain
  whom to contact. No permissions, roles or access checks were weakened.
- Discord communities Help guide updated with status/manage and recovery wording.

Verification:

- New `verify-community-onboarding-presentation.cjs` fails against pre-fix HEAD
  at missing `connectedSlug`, then passes current source. Actual page SQL runs
  against isolated SQLite fixtures; component branches verify owner isolation,
  server switching, hidden submission identity, feedback reset, blocked/allowed,
  empty and failed channel states, detection/install presentation.
- All five prior onboarding/reentry/install-identity/resources/foundation scripts
  pass with the updated recursive component-tree inspection. Fixtures only;
  no real Discord requests or app database writes.
- New `community-onboarding-browser-acceptance.cjs` bundles actual React/MUI
  components and shared Light/Navy theme in intercepted `.invalid` pages. Four
  cases pass: Light/Navy at 1440x900 and 390x900. Server switching, management
  link/focus, disabled-channel selection, allowed-channel selection and recovery
  text pass; zero horizontal overflow, page errors or external requests.
  Server actions are intentionally disabled. This proves components, not a
  signed-in full application or staging installation. Final screenshots at
  `/tmp/community-onboarding-qa-kkHBJN` were visually inspected (Light mobile and
  Navy desktop); fixture does not load the application font pipeline/shell.
- Scoped strict TypeScript passes all four changed runtime/Help files with zero
  diagnostics. Targeted lint has zero errors; seven existing unused-declaration
  warnings in the monolithic dashboard match pre-change HEAD exactly. No new
  lint warnings. `git diff --check` passes. React skill review keeps shared MUI
  theme tokens, serializable props and no new client network waterfall.

No further confirmed onboarding code defect found in this bounded pass. Combined
local batch now includes lesson-publication eligibility, refresh scheduling and
these onboarding UX corrections. Owner-deferred full build stays deferred to the
combined release-verification checkpoint; none was attempted here. No deployment,
Discord actions or hosted mutation. After a separately authorized corrected
release, PC must retest connected-state/manage navigation and channel guidance.
First-time independent-server install/consent/return and actual submission/failure
recovery remain separate acceptance, not a reason to repeat passed discovery or
Coaching journeys. Local component evidence does not certify those live flows.
