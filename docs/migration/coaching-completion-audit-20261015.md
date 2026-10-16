# Coaching completion audit — consolidated implementation and evidence

## Current result

Current release: correction7bf3906a7 is deployed and verified on staging. See the
[latest receipt](#staging-correction-release-verified--october15-toronto); earlier
local-only and release-authorization statements describe prior checkpoints.
Signed-in lesson functional acceptance now passes. Navy desktop error capture,
and sanitized request capture remain open; the scoped post-browser backend audit
now passes. Missing TradersLink Tests is traced to staging admission configuration;
its owned candidate is present. Owner-approved staging admission is now active;
both servers pass backend discovery. Supplied PC first installation/connection
now PASS; both communities exist. Pre-connection installed-status UX correction
is local only. Integrated production build now PASS; release and approved
unconnected-fixture acceptance remain open. See the
[latest PC reconciliation](#signed-in-pc-lesson-acceptance-reconciled--october15-toronto).

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


## Combined staging release verified — October 15, evening Toronto

Owner explicitly directed combined verification/build and staging deployment of
lesson validation, Discord refresh scheduling and onboarding/guidance. This chat
acted as the previously owner-assigned Coordinator. This supersedes earlier
build-deferral/no-deployment wording for this exact correction batch only.

- Configured staging source **staging**; exact remote/release parent
  `a9c119625f1ecb13d81e65bd9148159a03da57ec`; published **e2da9c38c8c0be2efa968e7026db3e4f2d281e8f**.
  Clean isolated release worktree `/workspaces/traderlink-coaching-combined-release`.
  Complete17-path allowlist and recovery image/deployment recorded in
  `/workspaces/traderslink-coordinator/preservation/coaching-combined-batch-20261015/release.json`.
  Unrelated source/docs/CI history and dirty shared worktrees were preserved.
- [CI38821841169](https://github.com/traderslink-bot/traderlink-platform/actions/runs/38821841169)
  **SUCCESS** on `d4534545701841c65d98c3289f9dc9f3d188fe2e`; only verification
  workflow differs from release, runtime identical. Full production build,
  TypeScript and all281 pages pass. Disposable migration rehearsal, draft/review
  checks, lesson six inactive/three restoration cases with preserved drafts,
  refresh failure/suspension/wrap retry and all focused onboarding checks pass.
  This closes the deferred combined-build gate; no duplicate local build run.
- Railway **7c975e9e-a30d-445a-a3b5-69b1c7442191 SUCCESS**, image
  `sha256:dd54d85fa76c5c25d387ea822e23e151a4d7f89ead1da90eb2c276581e185a35`.
  One RUNNING instance `ec31cc9f-fb21-421a-96f3-e7c91fa12f0b`; original isolated
  volume retained, overlap0/drain30, no staged configuration. Previous deployment
  `b1bd4046-cfa9-41ae-9cca-1186b9ac742a` REMOVED; prior compatible image retained
  as recovery reference. No schema/dependency/configuration change.
- Health **HTTP200/ready/sqlite_single_node**. Before/after exact160 migration
  IDs/orders/checksums match. No database content scan/hash or migration executed
  on staging. Compiled server/client checks find all six correction markers.
  Signed-out onboarding, channel settings and student coaching redirect307.
- Natural hosted worker startup logs show60-second schedule, batch5 and Discord
  refresh configured; first maintenance pass observed. No maintenance exception
  in the filtered startup/pass logs. This proves scheduling/execution, not live
  provider failure fairness, rate-limit/load capacity or every participant refresh.
- Production configured source remains **main**, remote
  `78bf4421b815e079a31b1135d771572a0e979a13` unchanged. No production/static/
  Watchlist Runtime release, manual hosted-data/settings/role/channel/grant change,
  test message or new fixture. Existing workers continue normal behavior.

Coordinator slot handed back after these checks. [PC retest prompt](coaching-combined-staging-retest-pc-20261015.md)
is ready for actual signed-in existing-server presentation/guidance. Lesson
rejection/restoration needs an approved disposable fixture; no real relationship
may be archived/ended to manufacture it. Do not force hosted failures or claim
page stability proves refresh fairness. Independent-server install/consent/return
and production readiness remain separate acceptance. No whole-feature launch
certification or signed-in browser pass follows from this release.


## Remaining acceptance — approved synthetic staging fixtures, October 15 Toronto

Owner authorized isolated fixture creation and testing, preserving all pre-existing
records and prohibiting production deployment. Staging source verified unchanged
at `e2da9c38c8c0be2efa968e7026db3e4f2d281e8f`, deployment
`7c975e9e-a30d-445a-a3b5-69b1c7442191`. This section supersedes the earlier
fixture-authorization blocker; it does not authorize another staging release.

### Acceptance matrix

| Item | Status | Exact evidence / remaining boundary |
| --- | --- | --- |
| Inspect/reuse suitable disposable fixtures | PASS | Prefix-specific read-only inventory found none; only the records below were created. No duplicate retries. |
| Saved draft with exactly one intended recipient | PASS | Selected-student draft has precisely the new relationship; initial full content/recipient state retained. |
| Archived and ended recipient rejection | PASS | Deployed exported action source with real services/staging DB rejects both; full draft/recipient snapshots unchanged. Request identity and Next cache adapters isolated, not signed-in HTTP proof. |
| Retained wrong-plan recipient rejection | PASS | New Plan-B draft deliberately seeded with exactly one new assignment to the Plan-A relationship; relationship restored active/unarchived through actual archive action before rejection. Exact intended row and draft preserved. |
| Eligibility restoration | PASS | Actual restore/archive actions and relationship status service; corrected reuse publishes through actual lesson-save action only to the new moonmafia relationship. No ad hoc relationship/plan repair. |
| No notifications/Discord/unrelated writes | PASS | Connection-local TEMP write guards prohibit every non-fixture table mutation, including delivery/notification/Journal/grant tables. Successful action runs attempted none; network disabled. Scoped protected-record metadata unchanged. Natural pre-existing workers were not stopped/frozen. |
| Clear visible hosted error | BLOCKED | Deployed editor lacks inline feedback handling; new safe-feedback action/editor fix passes locally, including four actual-component browser views. Separately authorized staging release and signed-in PC retest still required. |
| Natural 60-second/batch-5 worker startup/execution | PASS | Existing sanitized startup/first natural pass on this exact deployment remains valid; current fixture inventory also observes natural membership refresh. No jobs forced. |
| Eligible batch coverage, normal wrap, suspensions/ineligible cases and recovery | PASS | Seven eligible participants with limit5; all covered without starvation. Suspended members have no provider I/O/freshness change; archived/ended/pending relationships and paused communities excluded; fresh evidence skipped. Failure/timeout recovery preserves relationship lifecycle, verified roles, Journal and operator grants. Isolated evidence only. |
| Cross-guild wrap under persistent failure | BLOCKED | New regression reproduced prefix-guild key-order mismatch: only2 of4 targets visited. Local fix uses the same composite key for ordering/comparison; all4 targets visited over two wraps. Deployed source still requires correction release. |
| Provider Retry-After handling | BLOCKED | Deployed code retried at60s despite synthetic120s delay (4 requests versus expected2). Local fix retains cooldown across service instances; header/body maximum, decimals, malformed/oversized fallback and recovery pass. No real failures/rate limits manufactured. |
| Shared maintenance overlap/retry guard | PASS | Existing isolated overlap prevention and guard release after exceptions retained in remediation suite. No hosted overlap/load/crash experiment. |
| Sanitized failed-request metadata during next staging retest | NOT TESTED | Privacy-tested collector prepared; isolated browser captures0 failures but that is not staging proof. PC must attach it for the new lesson checks. |
| Unconnected-server presentation on staging | NOT TESTED | Inspect an already discovered unconnected approved server only if present; do not install/connect or grant scopes. Earlier isolated presentation proof retained. |
| Genuine first install/consent/return/connection submission | BLOCKED | No new Discord installation/server connection authority; exact safe plan and additional authority below/in PC prompt. |

**Feature not complete.** The three reproduced code defects below are fixed and
verified locally, but release/full-build verification for this new correction
batch and signed-in acceptance remain open. Earlier review-count/timezone/update-
notice/existing-connection/channel-presentation passes remain closed.

### Every persistent new fixture identifier

All titles/names start `QA ONLY — Lesson publication validation`. No account,
trade, Journal grant, agreement, review or existing plan was created/modified.
Lessons do not require an accepted agreement for this service path; no acceptance
or frozen terms were invented. New plans are $0/custom, capacity1, lesson-only,
no Journal scope, using the already-mapped required role1546028813106941952.
No Discord role assignment was made.

| Record | Identifier | Final state |
| --- | --- | --- |
| Plan A | `8cf418a8-2374-4a73-a60f-09f477e9f1bf` | active; new relationship belongs here |
| Plan B mismatch | `620b72e7-47e8-4b73-aae5-ad7811c46b44` | active; no matching relationship |
| Plan-A lesson item | `bbe5e337-f1c2-4544-9ebc-cc579b06ed77` | one unscheduled lesson item; no recurring work |
| Plan-B lesson item | `55ca84a5-b9fa-4109-bdd6-eaa351d66b77` | one unscheduled lesson item; no recurring work |
| Relationship | `d96396a0-f6fe-40f2-bf0a-4788ac88eab7` | active, archived `2026-10-16T00:03:57.606Z`; original coach/student only |
| Selected draft | `f1f6f333-63d0-48b7-a072-9345ad3cef90` | draft; selected_students; plan NULL; one assigned recipient |
| Plan-mismatch draft | `27a399cb-a2e7-468a-9485-81e35500506e` | draft; plan audience B; one intentionally wrong-plan assigned recipient |
| Corrected reuse | `6d130d19-cd76-44f9-9e49-d66435521688` | published; plan audience A; one assigned recipient |

Three new recipient rows have composite identifiers:
`f1f6f333-63d0-48b7-a072-9345ad3cef90 / d96396a0-f6fe-40f2-bf0a-4788ac88eab7`,
`27a399cb-a2e7-468a-9485-81e35500506e / d96396a0-f6fe-40f2-bf0a-4788ac88eab7` and
`6d130d19-cd76-44f9-9e49-d66435521688 / d96396a0-f6fe-40f2-bf0a-4788ac88eab7`.
These eight UUID entities and three composite rows are retained; nothing deleted.

Content is unchanged after rejection:

- Selected: title `QA ONLY — Lesson publication validation — selected draft`;
  body `QA ONLY saved content — keep this exact text after rejected publication.`
- Mismatch: title `QA ONLY — Lesson publication validation — plan mismatch draft`;
  body `QA ONLY plan-B draft; plan-A student is not an eligible recipient.`
- Corrected: title `QA ONLY — Lesson publication validation — corrected plan A`;
  same body as mismatch source. All links/times blank, delivery kind live.

Routes: coach lessons `/communities/test-community/workspace/teaching`, new
student workspace `/communities/test-community/workspace/students/d96396a0-f6fe-40f2-bf0a-4788ac88eab7`,
Students `/communities/test-community/workspace/students` (Archived tab), student
`/communities/test-community/coaching` (Coach and plan: the new Plan A).

### Actions, restoration, write boundaries and retained failed attempts

1. Initial guarded run refused stale membership before any write. Natural worker
   later refreshed both accounts; no manual refresh, role change or fabricated
   verification. Evidence `execute-fixture-first-no-writes.result.json`.
2. Creating a plan as published would queue its normal coaching Discord delivery.
   TEMP guard rejected that insert; the product transaction rolled back, leaving
   no new plan/item/delivery. Inventory confirmed zero prefix records before retry.
   Rolled-back attempted IDs (not persistent fixtures): plan
   `9d6008c8-44c9-48ee-bc01-3ebb58cba7c6`, item
   `6b44fb4d-5691-442e-a8ce-0c1558b3632c`. Evidence
   `execute-fixture-delivery-guard-rollback.result.json`. No message queued/sent.
3. Successful fixture run used supported draft-plan creation then plan activation,
   which does not enqueue that announcement. Student request and coach acceptance
   services created only the new relationship. Existing plan requirements and
   agreements remained untouched.
4. Actual exported `archiveCoachingStudentAction` archived/restored the new
   relationship; actual `saveCoachingTeachingDetailsAction` rejected publication
   with `Choose students before publishing this lesson.` The supported relationship
   service also ended/reactivated only the new relationship; ended rejection and
   successful publication after restoration both recorded. Selected lesson then
   returned to draft through its normal save action.
5. Plan-B draft initially had0 recipients because supported creation correctly
   excluded the Plan-A student. To exercise retained wrong-plan state, the second
   approved fixture phase inserted exactly one new assigned row for this new
   draft/relationship. This was fixture construction, not relationship/plan repair.
   With the relationship restored active/unarchived, actual publication rejected
   and preserved all draft/recipient columns exactly. Corrected Plan-A reuse was
   saved draft/published using the normal lesson action, then the relationship was
   archived again using its actual action. Final mismatch draft/assignment retained.
6. TEMP guards existed only on each operator connection, denying unrelated writes
   and all notifications/outboxes/grants/agreements/Journal writes. No persistent
   triggers/settings/migrations added. Fixture source uses actual deployed action
   code/services with approved operator request identity/cache adapters; it does
   not mint sessions, add runtime bypasses or prove signed-in browser behavior.
   Unused Journal-reader dependency was fail-closed in the operator bundle.
7. Final scoped read-only verification confirms two plans, one relationship, three
   lessons, zero agreements/grants and zero content deliveries for either new plan.
   Both commission feature flags remain false; partner program disabled and no
   target coach fee rule created. Bullrun and all protected records are outside
   the write allowlist. No data contents were hashed or broadly scanned.

All code/probes/JSON/mutation attempt logs and final screenshots retained under
`/workspaces/traderslink-coordinator/preservation/coaching-acceptance-20261015/`.
Key files: `execute-fixture.cjs.result.json`, `execute-mismatch.cjs.result.json`,
`verify-fixture.cjs.result.json`, `browser-lesson-feedback/`. Framework adapters,
source commit and exact initial/final states are explicit in the evidence.

### Three reproduced defects, intended corrections and verification

- **Missing lesson feedback:** editor directly submitted a throwing action. New
  allowlisted validation response via existing CommunityPublicationForm displays
  actionable text, preserves draft inputs, hides unexpected internal error text
  and preserves Next redirect/control exceptions. Underlying service checks stay.
  Regression failed first (no feedback action), then passed; real-schema action
  tests preserve stored drafts/recipients, including retained wrong-plan case.
- **Rate delay lost between ticks:** old worker stopped the current batch only.
  New optional process-local cooldown shares the existing cursor across per-pass
  connections, takes the longer valid header/body retry delay, supports decimals
  and uses60s fallback for malformed/oversized values. No busy wait/retry loop,
  no auth freshness/role alteration. [Discord's official rate-limit contract](https://github.com/discord/discord-api-docs/blob/main/developers/topics/rate-limits.mdx)
  requires honoring Retry-After/retry_after. The isolated first failing check was
  4 requests instead of2; corrected test skips early calls and resumes normally.
- **Guild prefix ordering:** cursor compared a composite key while query ordered
  separate columns. Prefix-like snowflakes make these orderings differ. Now both
  use the identical key; four guild/user pairs each visited twice despite all
  attempts failing. Query runs in real SQLite with isolated provider adapter.

Focused checks pass: remediation/service/action tests, four actual React/MUI
Light/Navy desktop/mobile feedback cases, cross-guild SQL regression, metadata
privacy regression, targeted lint with0 warnings/errors, strict semantic
TypeScript5 files/0 diagnostics. UI screenshots inspected; shared theme preserved,
Help guide aligned. Browser fixture omits full app shell/font pipeline and real
server/session transport. No new full build or staging release performed in this
acceptance task; owner requested release coordination separately.

### Exact remaining boundaries

- New correction batch: separately authorize Coordinator staging release and its
  combined full-build gate, then PC signed-in error/retry/preservation acceptance.
- Hosted timer startup/pass evidence belongs to deployed e2da9c38c; new cooldown
  and cross-guild corrections currently have isolated proof only. Process-local
  cursor/cooldown reset on process restart; cross-process/global-token coordination,
  restart/failure injection and load capacity are not certified by these tests.
- PC must capture sanitized failures during the next lesson retest. Do not export
  HAR, headers, cookies, bodies, query strings or raw failure URLs. A returned
  validation error may use HTTP200; record UI result separately from HTTP failures.
- Unconnected server: inspect an existing discovered option without clicking
  Install/Connect or consenting to new OAuth scopes. If absent, report unavailable;
  do not create a server/connection or alter allowlist to manufacture the view.
- First install: owner must separately approve the exact owned server, staging
  admission/allowlist change if needed, dedicated bot installation with the
  displayed minimum permissions, any login consent, and creation of that new app
  community connection. Agree preservation/recovery before action. Test consent,
  actual Discord completion and app return/Connect behavior as observed; do not
  assume automatic callback. Channel/role creation or delivery tests require
  their own exact authority; no Discord message is implied. Use only named
  discovered resources; members never supply bot credentials/raw IDs.

[Self-contained PC prompt](coaching-combined-staging-retest-pc-20261015.md).

## Staging correction release verified — October15 Toronto

Owner approved the prepared correction release. Published exact12-file allowlist
`7bf3906a78905ec424bf03a7fe76687db848780b`, parent
`e2da9c38c8c0be2efa968e7026db3e4f2d281e8f`, to configured branch `staging`.
CI38829848863 SUCCESS on22d1e6913d1274fc27c43cd4ad3ec6ad535cc53f; only the CI
workflow differs from the release. All focused lesson/action/refresh/guild/privacy/
onboarding regressions and full build/TypeScript/281 pages pass. Broader lint has
seven existing warnings, zero errors; correction-only lint previously clean.

Railway `b00617c9-fbb7-42a9-a4b0-b8fb605732de` SUCCESS; predecessor removed.
Image `sha256:6e0cdfff9985796f606274e9b13a9508f789ce7ed7dc331e15b1b9a298cffd50`.
One RUNNING instance59c6fde0-3815-40cb-a4a2-5fd66cd318ed; original isolated volume,
overlap0/drain30 and no staged configuration. Health200 ready/sqlite_single_node;
all160 migration IDs/orders/checksums unchanged. Four new compiled markers present.
Natural maintenance startup60s/batch5/configured and first pass observed at
2026-10-16T00:38:54.919Z; no maintenance failure in filtered logs. This does not
prove hosted fairness, every provider result, failure recovery or load capacity.
Scoped read-only fixture snapshot matches the retained pre-release snapshot in
all reported fields except capture time: two active plans, archived active NEW
relationship, two drafts/one published lesson, three assignments, no agreement/
Journal grant or plan delivery. No fixture action repeated for deployment.

Evidence and full allowlist:
`/workspaces/traderslink-coordinator/preservation/coaching-acceptance-correction-release-20261015/`.
No production/configuration/Discord/protected-record mutation by this release.
Production main82784f53c was already independently deployed before this operation.
Coordinator slot handed back after verification. PC lesson feedback/preservation,
restoration/publication and sanitized network evidence remain NOT TESTED in the
signed-in browser; first installation remains separately authorization BLOCKED.
[Ready PC prompt](coaching-combined-staging-retest-pc-20261015.md). No whole-feature
launch certification. Earlier local-only/pending-release statements are history;
this receipt is the current correction release state.

## Signed-in PC lesson acceptance reconciled — October15 Toronto

Source: owner-supplied PC signed-in staging browser report, TradersLink coach and
moonmafia student, normal `test-community`. Supplied release
`7bf3906a78905ec424bf03a7fe76687db848780b`, deployment
`b00617c9-fbb7-42a9-a4b0-b8fb605732de`. PC did not independently verify the deployed
SHA; build, health, ledger and hosted worker evidence remain Codespaces evidence.
Owner approved exact unique fixture titles/content as identity checks because
browser privacy filtering redacted hidden IDs. No code change or release follows.

| Acceptance item | Status | Evidence and limit |
| --- | --- | --- |
| Archived-recipient publication rejection | PASS | Exact actionable inline error; unsaved synthetic marker retained; retry enabled. Reload preserved original saved title/content, Draft and one recipient; marker never saved. |
| Disposable relationship restoration | PASS | Only d96396a0-f6fe-40f2-bf0a-4788ac88eab7 restored, listed Active with Journal not shared. |
| Plan-audience mismatch rejection | PASS | Rejected after relationship restoration; reload preserved Draft, original content and one intended recipient. No plan or audience mapping changed. |
| Eligible lesson publication | PASS | Selected lesson published with original title/content and persisted after reload; no extra send/notify/Discord confirmation appeared. |
| Student visibility and isolation | PASS | Selector exposed exact disposable relationship; selected and corrected published lessons readable; mismatch Draft absent. No completion/progress/Journal grant action. |
| Fixture restoration | PASS | Subsequent normal save confirmed “Lesson saved.” and verified selected lesson Draft. Only disposable relationship archived again. Mismatch Draft/corrected Published preserved. |
| Inline error: Light mobile, Navy mobile, Light desktop | PASS | Signed-in visual inspection; original Navy appearance and viewport restored afterward. |
| Inline error: Navy desktop | NOT TESTED | Screenshot did not adequately capture the error; no passed assertion. One bounded rejection against existing fixtures is sufficient; no new fixture required. |
| Sanitized failed-request capture | NOT TESTED | Available browser API lacked required safe filtered listener. Empty console warning/error logs do not mean zero failed requests. |
| Browser-run backend publication side effects | PASS — scoped read-only audit | Subsequent post-browser retained-row audit found0 attributable deliveries/attempts/notifications/remote/push rows and verified final fixture states. Not provider-side or full transaction-history proof; see audit below. |
| Ended-recipient rejection/restoration | PASS — Codespaces only | Existing action/service evidence retained; deliberately not repeated in browser. |
| Refresh coverage, fairness, wrap/retry/failure/recovery | PASS — isolated tests | Existing real-schema/provider-isolated regressions retained. Hosted evidence covers natural60s/batch5 startup/first pass only; no browser or live failure/fairness proof claimed. |
| Existing-server recognition | PASS — prior browser evidence | Already closed; not reopened by this report. |
| Unconnected-server presentation | NOT TESTED | No new observation supplied in this lesson run; existing read-only inspection boundary remains. |
| Genuine first-install consent/return/connection | BLOCKED | Separate exact-server installation/permission/connection authorization absent; not tested. |

### Browser-reported final fixture states

- Selected lesson `f1f6f333-63d0-48b7-a072-9345ad3cef90`: Draft, original title/body,
  one recipient. Saved body: `QA ONLY saved content — keep this exact text after rejected publication.`
- Mismatch lesson `27a399cb-a2e7-468a-9485-81e35500506e`: Draft, original title/body,
  one intended recipient. Saved body: `QA ONLY plan-B draft; plan-A student is not an eligible recipient.`
- Corrected lesson `6d130d19-cd76-44f9-9e49-d66435521688`: Published, unchanged.
- Relationship `d96396a0-f6fe-40f2-bf0a-4788ac88eab7`: archived again; Journal not shared.

These are supplied browser observations, not a new Codespaces database read.
Both previously retained plans and all fixture IDs remain unchanged; no duplicate
records are needed. An initial Draft-restoration attempt had not persisted when
checked; its cause is unknown. Only the subsequent confirmed normal save is a
PASS. Do not infer a defect or claim the first attempt succeeded.

PC reports Bullrun and protected relationships/reviews/agreements/grants untouched;
no new records, code changes, deployments, Discord messages, roles/channels or
hosted configuration changes. Browser observations do not independently prove
absence of backend side effects. Any later backend audit must use authorized,
scoped read-only evidence for these exact fixture actions, without scanning or
hashing customer records; no such audit was performed in this documentation task.

Remaining work: bounded Navy desktop error capture; safe network-failure capture
when tooling supports it; reconcile actual browser-run publication side effects
with scoped read-only evidence if required. First installation remains separately
authorization-gated. Do not repeat passed lesson journeys or closed review-count,
timezone, update-notice, existing-connection/channel checks. No confirmed new
application defect and no whole-feature launch certification.

## Browser-run backend side-effect audit — October15 Toronto

**PASS — scoped retained-record audit**, performed read-only at
2026-10-16T01:01:51.553Z (October15,21:01 Toronto). Live staging source verified
`7bf3906a78905ec424bf03a7fe76687db848780b`, deployment
`b00617c9-fbb7-42a9-a4b0-b8fb605732de` SUCCESS. No deployment, worker trigger,
provider call, configuration change, fixture action or hosted write performed.
SQLite was opened readonly/fileMustExist with query_only enabled; reads used one
snapshot transaction. Production and protected records were not audited or changed.

Actual post-browser fixture rows confirm:

- Selected lesson `f1f6f333-63d0-48b7-a072-9345ad3cef90`: Draft, original title/body,
  selected-students audience, one assigned recipient with no completion. Its
  updated timestamp is2026-10-16T00:48:52.433Z, after the pre-browser snapshot.
- Mismatch `27a399cb-a2e7-468a-9485-81e35500506e`: Draft, original title/body,
  Plan-B audience and the retained Plan-A assignment; unchanged stored timestamp.
- Corrected `6d130d19-cd76-44f9-9e49-d66435521688`: Published, original title/body,
  Plan-A audience, one assigned recipient; unchanged stored timestamp.
- Relationship `d96396a0-f6fe-40f2-bf0a-4788ac88eab7`: active status but archived at
  2026-10-16T00:49:22.527Z; both new plans active. Zero agreements and Journal grants
  for this relationship; partner disabled and no active target coach fee rule.

| Scoped retained-record check | Result |
| --- | --- |
| Community deliveries, each exact3 lesson/2 plan/1 relationship IDs | PASS:0 rows across all statuses |
| Delivery attempt history joined through those exact fixture objects | PASS:0 rows |
| Post-snapshot notifications attributable by fixture ID/path or exact community Coaching destination, limited to the coach/student actors | PASS:0 rows |
| Remote email/Discord-DM deliveries linked to those notifications | PASS:0 rows |
| Web-push deliveries linked to those notifications | PASS:0 rows |
| Synthetic lesson fields/assignments and reported final states | PASS: match saved baseline content/audience and PC final states |

Notification metadata window begins2026-10-16T00:38:04.884Z, the independently
retained pre-browser snapshot, and ends at audit time. No notification bodies,
recipient identities, headers, credentials or real-record payloads were returned.
Queries were scoped to the known fixture IDs, two actors and relevant routes;
no broad database content scan or content hashing. Live schema metadata reports
no triggers on the three fixture teaching/assignment/relationship tables. The
reviewed action/service source matches release7bf3906a7 and contains no lesson
notification/delivery enqueue path. This source evidence remains separate from
actual database results and the supplied browser actions.

Limits: this is a point-in-time audit of retained attributable rows, not a full
transaction trace or Discord/provider-side history. It cannot prove absence of
out-of-band sends, deleted historical rows or notifications with unrelated
correlation metadata. Within the supported lesson path and stated scope, no
unexpected publication notification/delivery evidence was found. This closes
the previously unverified scoped backend side-effect acceptance item; no new
application defect was reproduced. Initial unconfirmed Draft-restoration attempt
remains unexplained; audit verifies final Draft only.

Probe, exact results and local assertions retained at
`/workspaces/traderslink-coordinator/preservation/coaching-browser-side-effect-audit-20261015/`
(`audit.cjs`, `audit.cjs.result.json`, `summary.json`). No new synthetic record or
Journal grant was created; all existing fixture evidence retained.

Still open: Navy desktop inline-error browser visual and safe filtered request
capture. Genuine first-install acceptance requires separate specific-server/
installation/permissions/new-connection authorization. Existing-server recognition
and passed lesson journeys remain closed. Worker fairness/retry/failure proof is
still isolated evidence plus the existing natural hosted startup/pass evidence;
no manufactured Discord failures or new operational proof. No whole-feature
launch certification.

## TradersLink Tests discovery omission — October15 Toronto

**Root cause CONFIRMED: staging operator admission configuration, not missing
Discord discovery or ownership. Correction BLOCKED pending separate configuration
approval; no hosted changes or deployment performed.**

Live staging is7bf3906a78905ec424bf03a7fe76687db848780b, deployment
b00617c9-fbb7-42a9-a4b0-b8fb605732de SUCCESS. Relevant callback, OAuth adapter,
onboarding page and launch policy have no source diff from that deployed commit;
compiled deployed server markers confirm candidate query/owner filter/approval
configuration are present. Targeted readonly snapshot at2026-10-16T01:19:45.695Z
(October15,21:19 Toronto) verifies:

| Stage | TradersLink Tests1559172784813514803 | Normal TradersLink1433570740430573642 |
| --- | --- | --- |
| Persisted candidate under normal community owner's stable Platform user | Present, exact name TradersLink Tests | Present, exact name TradersLink |
| Discord owner / manage flags |1 /1 |1 /1 |
| Candidate verified timestamp |2026-10-16T01:15:11.258Z |2026-10-16T01:15:11.258Z |
| Active linked Discord identity | Same correct user's active identity; last authentication2026-10-16T01:15:11.235Z | Same identity |
| Actual onboarding SQL before admission filter | Included | Included |
| isApprovedCommunityGuild / configured allowlist | FALSE | TRUE |
| Final selector eligibility | Excluded | Included, connectedSlug test-community |
| Existing app connection | None | Active test-community |

Configured approved-guild count is1; target approval boolean false, normal true.
No secret variable values were printed or saved. User display name and cached
Discord username matched the supplied TradersLink/thisguytradealerts identity;
no user UUID, Discord subject, credentials or provider payload was returned.
The owner-scoped candidate update23ms after the latest linked authentication
confirms successful current persistence for this target. The decisive loss occurs
in onboarding/page.tsx after the owner SQL, at `.filter(isApprovedCommunityGuild)`.

### Request, persistence and failure-path reconciliation

- OAuth callback fetches `/users/@me/guilds` with a request-local token. The
  adapter makes one guild-list request, checks response.ok and parses JSON;
  it has no explicit pagination loop. Historical raw response/page metadata is
  not retained, so no past HTTP status/full payload claim or token replay is made.
  Target's freshly updated owned candidate proves pagination/omission did not
  prevent this specific target from reaching persistence in the reported refresh.
- Callback saves owner/manage candidates under signInResult.userId using UPSERT.
  That loop is not restricted by approved guilds, existing app connections or bot
  installation. The visibleGuilds.slice(0,50) limit belongs to subsequent membership
  refresh, not the candidate UPSERT loop. Matching target row and timestamps rule
  out wrong-user insertion, swallowed failure before target save or rollback as
  the cause of this omission. Do not infer every other server refreshed correctly.
- Onboarding SQL requires current stable user and guild_owner=1; its community
  join is LEFT JOIN, scoped to that same owner. A connection is optional. Then
  operator admission filters the owned candidates. Bot detection is downstream
  of choosing a candidate; an installed bot is not a prerequisite for discovery.
- Guild-list fetch errors are caught as an empty list; later community-refresh
  exceptions are caught with a generic warning while account sign-in can finish.
  Successful login alone therefore does not certify discovery. This source-level
  failure behavior is not the proven failure in this run: both expected candidates
  were saved during the refreshed authentication. No speculative OAuth rewrite.

### Exact correction prerequisite

Coordinator must obtain separate approval to update ONLY the staging Platform
service's `TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS`, preserving existing entries and
adding1559172784813514803. Observed current approved set contains only the normal
server. Proposed complete value for this observed state:

`1433570740430573642,1559172784813514803`

Re-read live configuration before applying; never overwrite any newly approved
entries. Target project49fc9197-07c9-45c7-b528-57d0393c2cca, staging environment
9e079dd4-f3f3-4872-9b00-adbd3000c485, Platform service
4d264aca-510c-4f5e-bc28-e89e526b8008. Applying environment configuration may require
or cause a staging restart/redeployment; that operation is excluded from this
no-deploy task and requires its own approval/release coordination. No bot install,
new connection, roles/channels/messages or production change is implied.
Do not remove/bypass the admission filter or fabricate candidates/ownership.
No runtime code correction is required to resolve the established cause.

### Regression coverage and evidence

Enhanced existing verify-community-onboarding-presentation.cjs to load the actual
launch policy rather than a stub. Real SQLite/page/component assertions cover:
new owned unconnected candidate, denied candidate present but unapproved,
approval-only reveal without inserts/connection creation, normal connected server
preservation, non-owner/other-user exclusion even when approved, cross-owner
management-link isolation and malformed configuration failing closed. Existing
channel empty/provider-failure presentation checks retained. In-memory tests only;
no fixture or database mutation on staging. Existing launch-foundation regression
also checks approved/unapproved onboarding, fresh ownership, provider403/missing
name failures, rollback, reconnect preservation and no automatic operator grants.
Focused results: PASS `node src/scripts/verify-community-onboarding-presentation.cjs`;
PASS existing `verify-community-launch-foundation.ts` with the established
server-only test adapter; PASS targeted ESLint for the changed CJS script;
PASS git diff --check. No shared TypeScript/runtime change, so no full build or
new runtime TypeScript gate required. No UI/help behavior changed; existing Help
needs no content change. No release performed.

Readonly probe/evidence retained at
`/workspaces/traderslink-coordinator/preservation/discord-server-discovery-20261015/`
(`discovery.cjs`, `discovery.cjs.result.json`). One initial compiled-marker check
expected an unminified function name and failed before returning results; probe
was corrected to use stable SQL/config literals. No hosted writes in either run.
All Coaching/Bullrun/moonmafia records, commissions and normal connection unchanged
by this operation; only the exact owner/two-guild discovery metadata was queried.

### PC browser retest — after separately approved configuration activation

Read AGENTS.md. Use existing TradersLink signed-in staging session at
https://traderlink-platform-staging-staging.up.railway.app/communities/onboarding.
Do not start until Coordinator confirms the approved staging admission addition
is active. No bot installation, new connection or Discord changes authorized.

1. Click Refresh Discord servers through normal UI. Existing authorization covers
   server-list refresh only; if consent asks for unexpected new scopes, stop.
   Keep OAuth codes/state/cookies/headers/payloads out of evidence.
2. After returning, verify TradersLink Tests appears and matches server
   ID1559172784813514803 using safe exposed option metadata. If privacy redacts
   the ID, report that limitation; do not guess or request raw provider data.
3. Select it read-only. Observe unconnected/first-install presentation. Do NOT
   click Install, Connect, authorize bot permissions or submit/save a community.
4. Select normal TradersLink1433570740430573642 again. Verify its existing connected
   presentation still links to /communities/test-community management. Do not
   edit its settings, installation, roles, channels or coaching records.
5. Reload and verify both options remain available; normal connection unchanged.
   Capture safely sanitized failures only if supported; otherwise NOT TESTED.

Return PASS/FAIL/BLOCKED/NOT TESTED, observed names/IDs where available, refresh
result, target read-only presentation and normal connected route. This closes
server discovery only; first install/consent/connection remains separate acceptance.

## Staging test-server admission activated — October15 Toronto

Owner authorized the diagnosed staging correction. Updated ONLY staging Platform
`TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS` to retain1433570740430573642 and
add1559172784813514803. Preflight found no pending environment patch, conflicting
release or other live release agent. Coordinator owned the activation slot.
No source publication, runtime code change or new local build was needed.

Railway configuration activation19905d01-a643-4b94-8efc-09926b865e80 SUCCESS;
previousb00617c9 removed. Source remains7bf3906a78905ec424bf03a7fe76687db848780b,
configured branch staging; image unchanged:
sha256:6e0cdfff9985796f606274e9b13a9508f789ce7ed7dc331e15b1b9a298cffd50.
One RUNNING instance365e44db-14cc-4f5d-b759-0550325224fb, original isolated volume,
unchanged overlap0/drain30, no staged configuration. Health200 ready; all160
migration IDs/orders/checksums unchanged. Hosted worker startup60s/batch5/configured
and natural first pass observed at2026-10-16T01:26:08.799Z; no maintenance
failure in filtered logs. This is startup/pass evidence, not failure/fairness proof.

Post-activation readonly probe at2026-10-16T01:25:38.652Z confirms BOTH owned
candidates pass the actual onboarding owner query AND configured admission filter:
TradersLink Tests1559172784813514803 has no connection, normal
TradersLink1433570740430573642 remains active/connected at test-community.
Both candidate rows, normal connection metadata and linked identity match the
pre-activation snapshot; no candidate was fabricated or refreshed by the operator.
Target admission changed false→true; all prior approved entries retained.

Configuration/health/ledger/backend query verification PASS. Signed-in selector
rendering and normal-UI refresh/select-only acceptance remain NOT TESTED after
activation; PC may now perform the bounded discovery handoff. No Install/Connect
or new bot/community/permission/role/channel/message action authorized.
No protected Coaching/Bullrun/moonmafia records were manually changed; no production
mutation. Production release remains separate and was not performed by this task.

Evidence/only-variable allowlist/before-after snapshots:
`/workspaces/traderslink-coordinator/preservation/discord-server-admission-staging-20261015/`.
Coordinator slot handed back after activation checks. Historical configuration
approval-blocked text describes the earlier checkpoint and is superseded here;
first installation remains separately authorization-gated. No whole-feature
launch certification.

## First install and connection PASS; pre-connection status correction local — October15 Toronto

Owner-supplied signed-in staging report confirms first installation of **TradersLink
Communities**, application1554300060483715162, into owned **TradersLink Tests**,
guild1559172784813514803. Discord requested View Channels and Send Messages with
bot/application-command scopes; owner completed authorization. Discord displayed
successful addition and instructed that the tab/window could be closed. Returning
to staging and Connect server succeeded, creating /communities/traderslink-tests/manage.
This is observed manual-tab-return success, not proof of an automatic callback.

| Acceptance item | Status and proof boundary |
| --- | --- |
| Genuine first installation/owner consent | PASS — supplied actual browser observations, specific server/app/permissions above |
| Manual return and connection submission | PASS — returned to staging, Connect server succeeded; automatic return/callback not established |
| New connection persistence | PASS — Server connected persisted on returning to onboarding |
| New-server named discovery | PASS — channels page Discord app detected; #general and @everyone/TradersLink Communities roles discovered |
| Existing normal connection preservation | PASS — TradersLink1433570740430573642 still /communities/test-community/manage |
| Connected onboarding Light/Navy1440x900 and390x844 | PASS — supplied browser checks; mobile document/viewport both390; original appearance/viewport restored |
| Pre-connection installation confirmation | FAIL in reported release — installation completed, but unconnected form still showed Install/Connect with no verified installed status; corrected locally, not deployed |
| New status/error/return/recheck UI | PASS — isolated component/browser tests only; staging acceptance BLOCKED on corrected release and separately approved unconnected fixture |
| Role/channel mapping persistence for new server | NOT TESTED — no mappings saved; additional write authorization needed |
| New-server Discord delivery | NOT TESTED — no messages sent; separately authorized mapping/message needed |
| Role/channel pages complete theme/mobile visual coverage | NOT TESTED — desktop functional discovery only in supplied run |
| Sanitized request-failure capture | NOT TESTED — no network capture; captured console warning/error list empty |

Both connections now exist. Do not uninstall/disconnect/recreate either to obtain
an unconnected fixture. Preserve both communities, Bullrun, moonmafia, all Coaching
agreements/reviews/Journal data/grants and disabled commissions. No further hosted
mutation or deployment authorized by this handoff.

### Proven cause and narrow local correction

community-connect-form.tsx had only connectedSlug vs unconnected branches. Every
unconnected candidate rendered the installation link and Connect server without
any installation-state query. Post-connection channel detection is a different
existing resource-discovery path and worked in the observed run. No global bot
failure or failed installation is inferred.

Added manual **Recheck installation** with explicit guidance to return to the
original tab after Discord authorization. The initial state is unverified; opening
or cancelling the link does not set installation status. Fresh server-side check
shows not installed, installed and ready to connect, owner verification required,
or unable to verify. Connect is disabled until ready; installed state hides the
installation link. Keyed selected-server state discards old results and feedback;
pending controls prevent duplicate checks. Existing connected servers keep their
management path; a connection discovered concurrently returns Manage community.
Existing connect action still independently verifies current ownership and safely
reuses existing connections; the new status endpoint never creates a connection.

The new server action authenticates the session and checks approved guild + the
same stable user's owned candidate and active linked Discord identity through a
readonly query. Cross-owner existing connections are denied. No unapproved/user-
supplied arbitrary server can invoke provider checks. Only safe status/message/
management URL return to the client; tokens/Discord subjects/inventory remain
server-side. No credentials, manual-ID input, database write or provider mutation.

The provider check uses bot-authenticated Get Current User Guilds, bounded to
3 pages of200, with8s per-request timeout/no-store. Only a complete valid inventory
establishes absence; partial/capped/error/rate-limited responses mean unable to
verify. A match then uses existing verifyCommunityOwner integration for fresh
ownership/member evidence. Inventory is request-local and never logged/stored.
See [Discord's official endpoint/pagination contract](https://github.com/discord/discord-api-docs/blob/main/developers/resources/user.mdx#get-current-user-guilds).
The bound is deliberately fail-closed; no claim of large/sharded-bot coverage.
Ready means installation/current ownership, not channel publishing permission;
channel settings retain their own role/overwrite/timeout checks and guidance.

Changed runtime/Help files:
- app/(dashboard)/communities/community-connect-form.tsx
- app/(dashboard)/communities/community-installation-actions.ts (new readonly action)
- src/modules/communities/contracts/community-installation-status.ts (safe DTO/copy)
- src/modules/communities/server/community-installation-status.ts (provider check)
- src/modules/help/traderslink-app-guides.ts (return/recheck and permission limits)

Checks: actual status action/SQL/provider service covers installed/absent, changed
owner, missing/revoked identity, non-owner/other-user/admission/cross-owner denial,
existing connection reuse, pagination/nonadvancing/capped lists, malformed JSON,
transport failure/403/429/500, missing configuration and zero writes. Existing
presentation/bot-onboarding/reentry/dedicated-app checks retained. Focused semantic
TypeScript on5 runtime/contract/Help files and targeted lint pass. Four isolated
actual React/MUI Light/Navy1440/390 cases cover all status states, cancelled
simulated external tab, retry/pending/focus/disabled, connect gating, network error,
selection-race isolation and existing connection preservation. Simulated Discord
and action adapters are intercepted; no hosted/browser-session evidence claimed.
One initial browser run used button role for an anchor and timed out; corrected
harness uses link role. Screenshots inspected; native disabled Connect also has
explicit MUI disabled styling. Shared tokens preserved. Isolated harness omits
full dashboard shell/production font pipeline.

Full build NOT RUN: shared Codespace MemAvailable2652MiB, no swap at checkpoint;
chosen4GiB headroom preflight deferred the full build. No workload stopped or build
started. Full integrated build remains a release gate; no push/CI publication or
deployment performed. No live Discord calls or hosted state changed by this task.
Local isolated browser artifacts retained under
/workspaces/traderslink-coordinator/preservation/discord-installation-status-local-20261015/browser/.
This is a local correction, not an updated staging release or whole-feature
launch certification. No new fixture, role/channel mapping or message authorized.

## Installation-status full build PASS — October15 Toronto

After Codespaces recovery, clean candidateac52b5a67010958e13fc9e65879b6ab1271122fe
had about5.4GiB available and no conflicting build/worktree server. The initial
normal build failed in the compiler worker near the default2GiB Node heap limit
(SIGABRT, JavaScript heap out of memory), not a source/type error. A second build
used process-only NODE_OPTIONS=--max-old-space-size=4096, preserving other inherited
Node flags. No persistent shell, repository, Next or hosted configuration changed.

**PASS:** Academy registry validation, production webpack compilation3.8min,
full integrated TypeScript91s,281/281 static pages, optimization/traces; exit0.
Command: NEXT_TELEMETRY_DISABLED=1 npm run build with the4GiB process heap override.
Node24.14.0, Next16.2.6. Registry reports26 unregistered markdown files as existing
archive/non-Academy-ready warnings; validation passed. This supersedes the earlier
resource-deferred build boundary. No additional code or test behavior changed.

Build log/exit code/verification summary retained under
/workspaces/traderslink-coordinator/preservation/discord-installation-status-local-20261015/.
Serwist regenerated public/sw.js; generated copy retained there and only this
known build output was restored byte-for-byte to its pre-build tracked version.
No unrelated work discarded. No app server started, no Discord/hosted data changes,
no Git publication or deployment. No repeat full build needed for these doc updates.

Remaining: separately authorized staging correction release; real signed-in
installed-but-unconnected/recheck acceptance on another explicitly approved
unconnected fixture. Both existing community connections must remain intact.
Mapping persistence, new-server delivery, resource-page visual coverage and safe
network capture retain their documented independent authorization/proof gaps.
