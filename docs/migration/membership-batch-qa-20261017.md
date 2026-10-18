# Membership, Login and Stripe consolidated staging QA

Status: executable browser checkpoint complete; source batch reviewed; Coordinator audit and credential cleanup COMPLETE. Remaining cases are explicitly untested/blocked below. Owner's later instruction overrides the earlier staging-release authorization: NO DEPLOYMENT UNTIL OWNER REVIEWS AND EXPLICITLY APPROVES THE COMPLETE BATCH. Do not ask to deploy while required evidence/cleanup remains unresolved.

Owner authorized 2026-10-17: inventory all remaining checks, execute on existing staging, collect corrections, deploy one complete batch and retest. Production excluded. No local suites/build/server. Coordinator reserves the single staging lane. No individual fixes deploy before the batch checkpoint.

Baseline source `428e644acdee5ce7713be00a81de9502f20cec40`; deployment `21bf9d77-645b-418c-9a89-ab45a79f076b`; schema166. Earlier acceptance retained only for named cases in the linked records; historical local tests are not fresh staging passes.

Controlling sources: [remaining staging evidence](membership-login-remaining-staging-qa-20261017.md), [complete original inventory](membership-staging-qa-20261016.md), [acceptance matrix](membership-acceptance-matrix.md), [login acceptance](platform-multi-provider-login-acceptance.md), [add-on contract](membership-plan-addons-plan.md), [feature restrictions](membership-feature-restrictions-progress.md), [latest corrections](membership-addon-entry-disconnect-corrections-20261017.md).

## Complete target list and remaining execution

Each semicolon-separated case remains in scope. PENDING is not a pass. BLOCKED requires its exact missing fixture/provider/handoff in the evidence column. Preserve prior passes without repeating payments or owner setup needlessly.

| ID | Area and complete remaining cases | Initial status / dependency |
| --- | --- | --- |
| Q01 | Release source/image/health/schema/single writer; rollback; preserve Coaching/prod | Coordinator baseline confirmed; final successor pending |
| Q02 | Anonymous and normal-member admin denial; fresh owner authority; member picker | Prior PASS; fresh member check pending session |
| Q03 | Plan/custom feature registration, search/status/filter/order/descriptions, duplicate/save/reopen/preview | Prior sampled PASS; custom runtime connection distinct from registration |
| Q04 | Published immutability, grandfathering, stale save, draft discard, archive, unused delete and paid history preservation | Immutability/stale save PASS; discard/archive/delete pending normal UI |
| Q05 | Free/$0, initial/renewal decimal currency, intervals, one-time/lifetime, duration, eligibility/display-only vs purchasable | Configuration PASS; non-monthly provider fulfillment pending dedicated test offers |
| Q06 | Trial free/paid/card-required, arbitrary durations, app snapshot, repeat rejection, enrollment/capacity/expiry | Existing7day/repeat PASS; remaining sandbox fixture/enrollment pending |
| Q07 | Timed/lifetime/recurring owner grants, revoke, actual expiry, additive/unlimited, no payment | Timed expiry/additive PASS; recurring/revoke pending synthetic UI |
| Q08 | Version migration immediate, renewal-queued, cancel queued; retained grants/usage/history | Pending isolated member/admin fixture |
| Q09 | Private page empty/edit/stable URL, offer selection, expiry, cap, revoke, public exclusion, noindex/referrer | Expiry/cap/private exclusion PASS; revoke pending UI |
| Q10 | Discord program multiple guilds/arbitrary roles, automatic vs purchase eligibility, sponsorship, edit/failure/removal/rejoin | BLOCKED real controlled guild/role accounts; no server mutation |
| Q11 | Billing no-plan/active/expired; no Discord/paid prerequisite; independent grants; useful errors | Prior PASS; fresh persona navigation pending sessions |
| Q12 | Add-on cards/feature/ticker filtering and compatible base context; private selected entry survives auth | Private entry PASS; public bundle selection/filter edge cases pending public-safe fixture |
| Q13 | Bundle multiple/deduplicated packages, exact totals/currency/reset compatibility, summed/unlimited allowances, buyer binding | Pending disposable bundle fixtures; no new payment inferred |
| Q14 | Existing amendment proration, one sub/date, abandon/requote/retry/consumption/history | Paid success/abandon/one claim PASS; stale/expired/concurrent/incompatible quotes pending isolated scenario |
| Q15 | Stripe checkout/portal success/back/return URLs and sandbox isolation | Prior PASS; no needless paid replay |
| Q16 | Pending/auth/3DS/failure/abandon/expired checkout; no premature access | Pending dedicated Stripe sandbox fixtures and owner final payment handoff |
| Q17 | Signed webhook duplicate/replay/order/bad signature/malformed invoice/amount/currency/user binding | Pending safe isolated provider-event fixture; no forged live entitlement or real endpoint mutation |
| Q18 | Renewal success/failure/recovery, refund, terminal cancellation and paid-period expiry; independent grants retained | BLOCKED real-time November17 or separate Stripe test-clock sandbox; don't advance shared clock |
| Q19 | Google login/link/reconnect/conflict, no email auto merge, last-method guard, session revocation, retained ownership | Owner connect/login/disconnect/mobile notice PASS; grouped QA-account handoff pending |
| Q20 | Email signup/receipt/verify/login/reset and stable user | Owner + independent audit PASS |
| Q21 | Email resend, expired/invalid/reused tokens; reset old-password rejection/no autologin/active-session invalidation | Invalid/missing PASS; grouped QA-account password/link handoff pending |
| Q22 | Email addition/change ownership/conflict/single use; no unintended merge | Pending separate QA account handoff; no existing owner credential changes |
| Q23 | Discord login/link/unlink/reconnect; last method; connection versus guild join; retained account data | Real login/admin denial PASS; separate provider account handoff needed |
| Q24 | Logout this-device/all-devices, revoked replay, cookie security, expiry; same-origin accepted/cross-origin denied | FAIL Account-menu403; root cause capture pending; prior exact revocation replay PASS |
| Q25 | Safe local return targets, CSRF/state/cancel/error paths, bounded input/rate errors; privacy/generic login | Prior sampled PASS; remaining current anonymous checks pending |
| Q26 | Workspace welcome/admission/return, optional/required Discord notices; post-OAuth Security offline recovery and PWA update | Prior offline recovery failure unresolved; fresh normal navigation pending sessions |
| Q27 | Journal manual/import/account/tag/rule quotas, presets/retention and preserved data after downgrade | BLOCKED negative policy while Journal enforcement OFF; populated disposable fixture needed; no global activation |
| Q28 | Analyzer generation vs Analysis, limits/reset/additive/unlimited/expiry, saved reads, provider fences/synthetic preview | Allowance/isolation/static preview PASS; populated generation/reset/provider fixture missing |
| Q29 | Analytics parent/Trade Explorer/shared Journal read, denied data/export/history | Pending signed policies and populated disposable records |
| Q30 | Calendar month/week, Compare and Reports independent access, export/API denial | Pending signed feature configurations/populated fixture |
| Q31 | Session Tracker selected-product allow/deny/locked presentation | Positive empty page prior PASS; negative signed fixture pending |
| Q32 | News/Week Ahead/Halts delay/options/data payload/notifications | BLOCKED destination-free dedicated fixture; no sends |
| Q33 | Shared Watchlist parent/children, ticker/bundle, lists/streams access | Pending signed feature fixture; preserve unrelated levels project |
| Q34 | Private Watchlist slots/additions/archive/isolation, generation/downgrade/upgrade/retention | Slots/archive/A-B isolation PASS; remaining populated/provider fixture pending |
| Q35 | Broker slots/OAuth/refresh/import/disconnect/status retention | BLOCKED dedicated broker sandbox; never use owner's broker |
| Q36 | AI Reviews plan/legacy eligibility, saved reads, provider/worker fence; inactive AI Chat | BLOCKED targetless populated provider fixture; no charged generation |
| Q37 | Public Academy/unfinished products, private/admin/no-index metadata, route access | Pending anonymous + signed routes; never change Academy progress |
| Q38 | Notifications associated defaults/optout/access/queue isolation | Read-only audit pending; no real outbound target |
| Q39 | Desktop/mobile Light/Navy, keyboard/focus/labels, validation/errors/overflow, mobile disconnect | Mobile disconnect owner PASS; complete sampled current states pending browser |
| Q40 | Ownership A/B/anonymous at pages/APIs, retained Journal/usage/plan records on downgrade/link/unlink | Private watchlist A-B PASS; remaining populated checks pending fixtures |
| Q41 | Help agreement and useful errors/no secret IDs; public header links | Stage-to-public Help links owner deprioritized; remaining functional guidance pending |

## Batch gates

1. Reconcile every row with executable checks or exact blocker; capture all defects before packaging.
2. Explain proposed correction scope to owner; obtain required UI review during work. Batch source edits only, preserving unrelated files/data.
3. Coordinator reviews immutable explicit allowlist and runs checkpoint CI; one staging deployment only when the accumulated batch is ready.
4. Retest all corrected cases and affected full flows, record source/deployment/image/health/rollback and failures honestly. Any post-release finding is recorded for a subsequent planned batch, not an automatic tiny deployment.
5. Revoke only approved synthetic sessions, delete encrypted transfer, clear isolated cookies and prove replay denial. No production action.

## Current evidence and defects

- Historical start-of-batch observation: logout403 was unresolved. Subsequent evidence below establishes Origin:null and the prepared correction; no deployment occurred.
- Existing owner-authorized admin session opens Memberships on the exact staging host. Header says Production despite staging host; environment label observation recorded separately from functional Membership correctness.
- Owner approved exactly three fresh2hour synthetic limited/other/Stripe-buyer sessions with encrypted transfer and cleanup; Coordinator owns issuance. Owner agrees grouped separate QA email/Google handoff later.
- Fresh anonymous checks PASS: protocol-relative return target becomes Workspace for both Google and Discord; missing reset/change-email token gives useful warning; invalid verification token rejected and fragment cleared; cancelled Google returns useful sign-in error; cancelled Discord shows safe retry; admin locked screen exposes no member data.
- Q04 archive PASS after owner accepted the browser confirmation: normal Chrome UI reports plan archived/new signups stopped/existing access unchanged. Coordinator exact plan `bf8f45b1-6b50-449b-8704-b66249ded381` is retired at22:33:12.947Z, both published versions and prior grant preserved, offers paused, quick_check ok/FK0. Browser automation's confirmation control is a tooling blocker, not an archive product failure. Proof: ignored data/membership-staging-qa-20261017/batch-archive-pass.png.
- Current three synthetic sessions issued with original expiry00:33:40Z October18; ciphertext decrypted in memory only, limited persona loaded into isolated IAB cookie. Owner explicitly directed use of their logged-in Chrome admin browser; original owner credentials/methods/provider records remain unchanged.
- Q11 limited billing fresh PASS: only limited no-end plan shown, expired lifecycle grant excluded, no linked Stripe subscription, useful ineligible amendment guidance. Admin raw member list still labels time-expired persisted grants active; effective-member billing correctly excludes them. Record admin presentation observation for batch review.
- Q24 FAIL reproduced with approved limited session from normal billing Account menu: form POST /api/auth/logout sends Content-Type application/x-www-form-urlencoded and Origin:null; response403. Captured only safe request headers, never Cookie/Authorization. Billing no-referrer metadata is the relevant browser context. Planned correction must preserve strict server-origin validation and private-link referrer privacy.
- Q26 Security page loads for limited persona and shows its one current session; no offline failure reproduced in that navigation. Q24/Q41 Security wording incorrectly says Discord is required to sign back in; Google/email are supported.
- Q07/Q08 PASS: created a disposable recurring owner grant for OTHER, addon-v1/every2months/no charge. Missing renewal count is rejected usefully. Member billing showed recurrence and original limited grant. Immediate migration to archived lifecycle-v2 retained recurrence and independent access. Renewal-queued migration for owner-only grant correctly rejected because no confirmed subscription period exists. Revoke removed only the disposable grant from effective billing; original limited remains.
- Q08 PASS: queued unlimited-v2 access change for existing synthetic Stripe subscription at next confirmed November17 renewal; current paid bundle and independent grants retained. Cancel pending plan change removed pending target in admin. No processor price/cancellation/payment operation occurred.
- Q34 PASS: temporarily migrated original LIMITED entitlement limited-v1 -> zero-v2 -> limited-v1 using normal admin controls. Active AAPL and archived MSFT remained before/during/after, denied NVDA addition created no ticker, member received useful allowance/upgrade guidance. Restored allowance API returns remaining2/reset5days with same reset anchor2026-10-22T02:12:39.829Z; no analysis generated or quota consumed.
- Zero-v2 Analysis/Compare empty pages rendered and Week Ahead ultimately redirected to Plans; without independently confirmed effective features/policy modes these are route observations, not blanket negative-enforcement acceptance. Calendar/Explorer/Session Tracker initial Loading states are not passes.
- Owner instructed worker to stop contacting Coordinator while Levels deployment is underway; worker continues browser/source QA and holds this batch's deployment. Pending independent audits will wait.
- Q24 PASS: OTHER synthetic account sign-out-everywhere confirmation Cancel preserved its session; confirmed sign-out reached signed-out page and exact token replay redirected login. Stripe buyer Security single-device sign-out also reached signed-out page and exact replay was denied. Other account's logout did not revoke the buyer. Only LIMITED synthetic session remains needed for menu-logout retest; all three exact IDs remain due for final Coordinator cleanup/readback.
- Correction to policy observation: Features list renders `policies.get(key) ?? "off"`, while runtime uses `membershipFeatureDefaultEnforcement(key)`. Therefore the all-off list is NOT evidence that every policy is off. Current read-only Check member access for original ZERO/Analysis returns `Policy: enforced. Request allowed.` That fixture includes access; it is unsuitable for a missing-Analysis denial assertion. Actual per-feature decisions and fixture contents must govern blocked/pass classification.
- Owner approved three UI corrections: menu logout request, neutral connected-login-method Security wording, and effective Expired grant labels. Source changes prepared in dashboard-shell.tsx, account-session-controls.tsx and management-panels.tsx; no server authorization/schema/policy change. Whitespace/diff review passes; runtime verification awaits the single batch release.
- Features fallback-display mismatch was confirmed by source/runtime diagnostic; owner subsequently approved the display-only correction. No policy activation is included.
- Historical QA email handoff completed; subsequent login/reset/Google evidence below supersedes the initial pending state.
- Superseding login investigation: owner entered valid email/password; normal sign-in POST returned200/application-json, accepted host-only Secure/HttpOnly/Lax cookie, then Document navigation /account/security redirected307 back to /login. Same signed-in browser could open billing with no active plan and Login methods. Profile and Delete Account reproduced the same login bounce. Root cause: those pages inherit Dashboard layout and dashboard admission rather than stable authenticated account admission. No password or token was printed, stored or read from the form.
- Batch source correction prepared: move Security/Profile/Privacy pages to existing member route group and use authenticated identity; keep the same shared shell/settings components and URLs. Match self-erasure API identity to authenticated account while retaining mutation-origin checks, exact confirmation, current selection and ownership/service safeguards. No actual erasure was attempted. Related product pages retain dashboard admission.
- Owner repeated reset using the SAME password. Owner-observed reset and reused-token POST rejection PASS; reused GET may render the form and owner accepts that behavior. Original active Login methods tab reloaded to login after reset, confirming active-session revocation and no reset auto-login. Old-password rejection NOT TESTED because old and replacement passwords were identical; do not claim a pass or demand another reset.
- Owner signed in and reconnected Google; browser independently shows Google Connected plus Email/password Connected on /account/login?connected=google. Email remains connected. Existing owner account untouched.
- Features fallback correction approved and prepared; display now uses the same default resolver as runtime and preserves explicit stored off/shadow/enforced modes. Actual diagnostics for a temporary Session-Tracker-only synthetic grant: Analysis/Analytics/Week Ahead enforced+blocked; Session Tracker enforced+allowed; Trading Journal off+allowed. Original ZERO fixture allowed Analysis; its name alone is not a negative fixture contract.
- Fixture recovery: one attempted LIMITED restoration selected the synthetic paid entitlement instead. Caught in admin readback; original paid entitlement `1d340611-2a8e-4d23-ac6b-0c821ec5d992` restored to exact combined version `66937edc-ea9f-4dc3-be48-edf86225df52`, endNov17 unchanged. LIMITED entitlement `4b639fc9-3a3e-45d5-a574-64396267db28` restored to limited-v1, confirmed by normal admin row. No processor operation occurred. Subsequent mutations verify selected grant/target before submission; independent audit pending Coordinator availability.
- Shared shell source reconciled onto exact current staging428e644 before adding logout hunks; reversal check proves all other staging shell code including Communities/Coaching retained. A wholesale old-worker shell replacement is forbidden. Source/Help review and whitespace checks pass; no local suites/build/server, commit, push or deployment by worker.

## Consolidated checkpoint (23:16 UTC, October 17)

This section supersedes initial/pending observations above. Source fixes are prepared, not deployed. No commit/push/build/test suite was run. The owner has not approved deployment of this batch.

### Additional completed browser checks

- Temporary LIMITED entitlement changed to known Session-Tracker-only private add-on v1 using normal owner controls. Exact grant and target verified before submission.
- Missing Analysis: Day Analysis renders explicitly noninteractive Demo preview; analyzed-trades API returns membership_required and no records.
- Missing Trade Explorer, Compare, Calendar and Shared Watchlist: each renders feature-specific unlock guidance. Week Ahead redirects to Plans. No private records exposed.
- Included Session Tracker: usable manual execution form renders; no execution submitted or provider invoked.
- Cross-account amendment read: LIMITED requesting the existing buyer's fulfilled amendment returns unavailable without invoice/customer data.
- LIMITED restored to original limited-v1; exact admin row confirms it. Paid combined entitlement remains displayed with original November17 end. Proof: data/membership-staging-qa-20261017/batch-fixture-restored.png.
- Final LIMITED synthetic session signed out through Security; exact token replay denied at Billing. OTHER all-device and buyer single-device replay denials were already verified. All three synthetic tokens are now revoked through normal product flows; isolated cookie deleted and decrypted payload cleared. Independent database readback and encrypted-file cleanup remain pending Coordinator availability.

### Complete coverage disposition

PASS below is case-specific, not blanket acceptance of the entire row. Every unexecuted case remains listed in the controlling inventory.

| Areas | Completed acceptance | Remaining evidence or blocker |
| --- | --- | --- |
| Q01 | Recorded staging baseline/health/rollback | Successor CI, source/image/health and retest require owner-approved deployment and Coordinator lane |
| Q02 | Anonymous admin denial; owner administration usable | Final fresh signed-member admin replay not repeated |
| Q03 | Prior sampled editor/preview/custom feature configuration | Full custom runtime integration is separate implementation; exhaustive search/order matrix not executed |
| Q04 | Archive, preserved versions/grants, stopped offers; prior immutability/stale-save | Draft discard and unused permanent delete not executed; browser native confirmation control unavailable |
| Q05-Q06 | Prior configured prices/durations; seven-day trial/repeat guard | Nonmonthly/one-time/paid/card-required trials need dedicated Stripe sandbox cases |
| Q07-Q08 | Recurring grant validation/no-charge/revoke; immediate/renewal-queued/cancel-pending migration; retained independent grant | Actual future renewal application not elapsed; independent exact fixture audit pending |
| Q09 | Empty private page, metadata, revoke ->404; prior cap/expiry/private exclusion | Full edit matrix not repeated |
| Q10 | No real guild changes | Controlled multiple guilds/roles/provider accounts missing |
| Q11 | No-plan/limited billing and independent grants | No-plan Security/Profile/Delete Account FAIL on live staging; source fix prepared |
| Q12-Q15 | Prior private entry/payment: one subscription/date, prorated0.99, full2/month, one claim/invoice; portal and cancellation restored | Public multi-add-on bundles, incompatible/stale/concurrent quote scenarios need separate disposable offer/buyer fixtures |
| Q16-Q18 | Retained confirmed payment/abandon cases only | Dedicated 3DS/failure/refund/webhook adversarial/test-clock fixtures missing; real renewal November17 not elapsed |
| Q19-Q21 | Google reconnect alongside password independently visible; prior mobile disconnect; email signup/verify/reset; reused reset rejected, active session revoked, no auto-login | Old-password rejection untested because owner reused same password; owner accepts consumed-link rejection on submit. Conflict/last-method/expired/resend matrices not fully executed |
| Q22-Q23 | Login methods keep password and Google; Discord connection distinct from joining | Email-change and Discord conflict/link/unlink require separate controlled provider accounts and owner handoff; owner credentials untouched |
| Q24 | Three synthetic logout/replay cases; cookie attributes; real QA Workspace logout | Billing menu Origin:null logout FAIL live; source fix prepared. Independent revocation audit/transfer-file deletion pending |
| Q25-Q26 | Safe return/cancel/invalid-token checks; no-plan Workspace; planned synthetic Security works | No-plan Security redirect FAIL confirmed, source prepared. Full CSRF/rate/PWA/offline matrix not executed |
| Q27 | Existing stored private ticker preservation only | Journal negative policy is actually off; no global activation. Populated Journal/history/import/export fixture missing |
| Q28 | Analysis preview/API denial; allowances/reset anchor retained; private ticker isolation | Provider generation and clock/reset boundaries need targetless populated sandbox |
| Q29-Q30 | Trade Explorer/Compare/Calendar locked pages | Populated reads/exports, Calendar week and Reports independent denial not proven |
| Q31 | Included Session Tracker form | Excluded Tracker and populated-data matrix not proven |
| Q32-Q33 | Week Ahead redirect; Shared Watchlist locked page | News/Halts delays/notifications and child/list/stream matrices require controlled destination-free fixtures |
| Q34 | AAPL active/MSFT archived retention across downgrade/restore; denied addition; OTHER isolation; same allowance/reset | Generation/provider/full slot transitions need fixtures |
| Q35-Q36 | No owner broker or charged AI used | Dedicated broker and targetless populated AI fixtures missing |
| Q37-Q38 | Private metadata; public Plans available; notifications untouched | Exhaustive Academy/public/admin routes and notification queue/default/optout audit not executed |
| Q39-Q41 | Owner mobile Google notice PASS; useful locked-page messages; Help source aligned | Full Light/Navy/keyboard/mobile matrix and populated A/B privacy matrix not complete; public Help links owner deprioritized |

### Prepared correction batch (explicit release allowlist)

1. app/dashboard-shell.tsx: secure same-origin menu logout, preserve private referrer protection, pending/error feedback; retains exact staging Communities/Coaching shell. Use diff against428e644, not the worker HEAD.
2. app/(dashboard)/account/account-session-controls.tsx: connected-method-neutral Security wording.
3. app/admin/journal/memberships/management-panels.tsx: show effective Expired labels and real default enforcement mode, without changing policies/entitlements.
4. Move only Security/Profile/Privacy pages from app/(dashboard)/account to app/(member)/account at unchanged public URLs; authenticate independently of a paid plan/Discord; preserve visible components.
5. app/api/platform/account-erasure/route.ts: authenticated account identity, retaining all existing confirmation/origin/selection/ownership safeguards. No account deletion tested.
6. src/modules/help/account-guides.ts: align account and sign-in guidance with supported methods.
7. This QA report and plan link: document proof boundaries and hold.

New moved files are currently untracked and must be included explicitly with the three old-route deletions. Earlier feature files/ignored data/AGENTS changes are not part of this successor allowlist. Never stage the whole mixed tree or release the worker's older full tree.

### Release hold / next executable checkpoint

- Do not contact Coordinator during owner's Levels deployment hold. When available, request exact synthetic entitlement/session audit and encrypted-transfer cleanup, then immutable batch integration/CI without deployment.
- Review narrow diff against live staging source, include moved files, and run permitted hosted checkpoint validation. No local expensive suite, build or server.
- Show owner the completed batch, CI result, remaining blocked cases and proposed single staging retest before requesting deployment approval.
- Owner-approved single staging deployment must retest no-plan account access, logout from billing/private-referrer context, expired labels/default-mode display, and preserved Google/billing/add-on flows. No new payment needed solely for these corrections.
- Production remains excluded. This checkpoint is not a claim that all41 areas passed or the feature is release-ready.

## Final Coordinator closeout and batch review — October 17, 2026

Coordinator confirmation received in completed turn 01a14c26-2300-75b2-af6a-3084446026e3:

- All three exact QA sessions revoked; zero active target sessions. Browser token replay denied for each.
- Exact remote plaintext and local 3,692-byte CurrentUser-DPAPI handoff deleted and proven absent. Browser cookie and decrypted payload were already cleared.
- LIMITED restored to version fc25c28f-c1ea-4eec-abc5-a5051b153f69; paid entitlement restored to combined66937edc-ea9f-4dc3-be48-edf86225df52 through November17,18:12UTC. Independent trial/free grants retained.
- Disposable private link8e4f36d7-f06d-433c-bd27-50ad2ce173a2 revoked/claims0. Lifecycle plan retired/unlisted with both published versions and grant history retained.
- Original39 unrelated session identities remain. Eleven later browser sessions and mutable activity/revocation timestamps mean full-row hash equality is not claimed.
- Database quick_check ok/FK0. Staging still428e644 / deployment21bf9d77 / image99f57bc7 / HTTP200 ready/sqlite_single_node/schema166.
- Coordinator source review confirms the exact13-path allowlist (8 current source files,3 old route deletions,2 progress documents), preserving Coaching/Communities and existing account mutation safeguards. Focused diff/whitespace/dependency checks pass; no new build, automated suite, commit, push or deployment.

Source-review checkpoint COMPLETE. Credential cleanup COMPLETE. Prepared fixes are ready for owner review and the next authorized staging validation step; they are NOT yet runtime-verified fixes. All coverage gaps in the disposition table remain. No Membership deployment or production change authorized/performed.

## Additional browser-only continuation — October 17

Owner clarified no Vitest/automated tests: functional QA in existing browser only. No suite/install/build/server/deployment was run. Initial dependency discovery was stopped; disk19GiB/free, no installation performed.

New case evidence (not repeats of prior payment/reset):
- Q37 public Academy catalogue -> Trading Foundations course -> first lesson loads anonymously. Coming-soon course cards have no active course links. Lesson progress Sign in preserves the exact lesson return target. Owner completed normal QA sign-in through that return; this explains landing on Academy. No progress changed.
- Q22 malformed new email rejected, login methods unchanged. Generic invalid/expired error copy is observed; successful change/conflict still needs a separate verified address and owner link handoff. Field cleared.
- Q26/Q38 additional FAIL: valid no-plan QA session opens Login methods but General, Preferences and inactive AI redirect to Sign in. Owner explicitly approved adding those three route moves to batch. Source prepared: same URLs/components, member layout, authenticated identity. AI authenticates before coming-soon branch. Existing broker/product/notification checks/actions untouched. This adds six paths to the previous13, now19. Saves for no-plan appearance/notification settings are not runtime-proven and existing action admission needs separate review; route availability alone is not complete preference acceptance.
- Q38 notification dropdown opens with empty state; View all notifications redirects the same no-plan signed user to login rather than history. Record remaining admission failure; no notifications sent.
- Q02 admin check did NOT establish ordinary-member admin denial. /admin/journal automatically started Discord OAuth with prompt=none and the browser subsequently showed Discord-only login methods instead of QA Google+email. No link/unlink/payment/settings writes performed. Stop signed account mutations because persona changed. Source cause: admin boundary requests dashboard identity and layout redirects workspace denial to Discord sign-in. Proposed narrow stable-auth boundary correction is pending owner approval and Coordinator ownership check; owner authorization itself must remain unchanged.
- Responsive override did not yield requested390px viewport (reported479px), so no390px acceptance claimed. It was reset. Public lesson snapshot visually readable; full keyboard/theme/mobile matrix remains incomplete.

Previously passed cases remain retained. Earlier3synthetic credentials remain revoked/deleted. This normal owner-performed QA login is not one of those temporary credentials. Browser continuation still needs restoration to the separate QA persona following the unexpected admin reauthentication; don't mutate the Discord-only account or request another synthetic credential automatically.

### Owner-approved additional source checkpoint

- Owner approved General/Preferences/AI route admission correction and separately admin-entry account-switch correction.
- Three route moves prepared, with relative imports statically resolved and original routes absent. Existing page UI, broker checks, notification eligibility and settings actions unchanged. AI authenticates before disabled branch. These need staging retest; no runtime-fix pass claimed.
- Coordinator confirmed no conflicting ownership for shared admin boundary. Reconstructed that file from exact428 staging source, then changed ONLY the imported/called identity helper to authenticated-account identity. Reverse substitution reproduces baseline exactly; parent-relative diff is2lines replaced. Five-minute owner-evidence freshness, configured/Discord-owner evidence, operator grant, rate limit and auditing remain intact. Layout/explicit Refresh owner access unchanged.
- Expanded source batch is20paths: prior13 +6three-page move paths +1admin boundary. New source changes require renewed Coordinator review; prior13path acceptance does not cover the expansion.
- No Vitest, local tests, install, build, preview, commit/push or deployment. Browser passed only the named new cases; new fixes remain unverified in the app until approved staging deployment.
- Remaining confirmed failures: no-plan View all notifications login bounce; no-plan appearance/notification/settings saves still rely on dashboard-scoped action guards. No-plan preference/action acceptance is blocked until this additional behavior is reviewed; don't claim route moves fix saves. These were not changed under the page-only approval.
- Current browser account switched via admin automatic Discord reauthentication; no subsequent account mutations performed. The UI last-method disconnect control is disabled for that Discord-only session (UI observation only, not server bypass acceptance). No owner credentials/methods changed. Separate QA sign-in must be restored for further signed synthetic-member checks.

Coordinator read-only review of approved expansion: PASS. Trading/Preferences are equivalent to exact428 source after only approved import/auth substitutions; AI adds authentication before disabled branch. Removed the extra non-semantic blank line noted by reviewer. Shared admin diff is exactly2approved identifier replacements, all owner/freshness/grant/rate/audit/options guards preserved. No hidden entitlement/settings/provider changes found. New-file whitespace/import and parent-relative diff checks passed. Expanded20path batch remains undeployed and requires browser retest after explicit deployment approval. Notification-history admission remains a confirmed unresolved failure; settings-action admission remains a source-observed gap not yet browser-executed because the Preferences page is blocked on live staging.

## Notification history / preference-saving correction and QA-login restoration

Owner explicitly requested these fixes in the same batch and no deployment. Coordinator confirmed the supporting files clean/exact428 and without conflicting ownership.

Prepared (source only):
- Move /notifications from dashboard route group to member group, same URL/UI/offline saved-view capture; keep NotificationList and its components shared.
- Notifications page plus markRead/markAllRead actions use stable authenticated identity; repository current-user/workspace receipt ownership and active-scope checks retained.
- Appearance, notification preferences, reporting currency and P/L preference actions use stable authenticated identity. All existing parsing, repository operations, timestamps, revalidation paths, notification eligibility, email/provider handling and delivery-test implementation unchanged. No broker/account-management/AI/offline-action changes.
- Exact428 expected-transformation comparison passes for all5 action files and moved Notifications page; only auth helper/scope destructuring plus moved-page shared import differ. Batch now27paths: prior20 +2Notifications route paths +5action files. Coordinator final read-only expansion review requested. No tests/build/install/commit/push/deploy.

Browser continuation:
- Signed out only the unexpected Discord session in the isolated QA browser via normal Workspace menu. Normal QA email sign-in handoff completed by owner; independent browser readback confirms Google+email/password connected, Discord not connected. No new synthetic sessions or credentials issued; prior3 remain revoked/deleted.
- Email disconnect confirmation -> Cancel PASS: prompt removed, both login methods remain connected; no unlink command submitted.
- Signed no-plan QA Academy course shows Incomplete progress state instead of anonymous Log in to track progress; no lesson/progress mutation performed. This is read access only, not progress-save/ownership acceptance.
- Ignored screenshot: data/membership-staging-qa-20261017/batch-qa-login-restored.png.

Superseded blockers: QA identity is restored. Notification history and preference-action defects now have prepared corrections; they are NOT live or browser-verified fixes. Their empty/populated history, mark-read ownership and appearance/preferences save/reload tests require the single owner-approved staging batch. External/provider/time/populated-data blockers in the full41area disposition remain; no previously passed payment/signup/reset was repeated.

Coordinator final27path expansion review PASS: all5action files and new Notifications page match exact428 after only approved auth/scope/import substitutions; old route removed; offline capture, repositories, eligibility, ownership, email/provider/delivery and validation unchanged. No tests/build/deploy. Restored QA browser left on Login methods for continuation. Next executable checkpoint for these fixes is owner-approved staging deployment plus browser retest; no approval inferred from this review.

## Owner-authorized single staging batch deployment and browser retest

Owner explicitly authorized deploying the complete reviewed27path batch ONCE to staging, then browser retesting every fix; no Vitest and no production changes. Prior deployment hold is superseded only for this complete staging batch. Coordinator owns packaging, immutable exact-parent integration, required hosted TypeScript/build/release checks and one deployment; do not publish the older mixed worker tree.

Retest controlling list:
- R01 six no-plan account routes Security/Profile/Privacy/General/Preferences/AI open; same signed-in account and stable URLs; AI remains disabled; no erasure or broker authorization.
- R02 preferences: appearance save/reload/revert, reporting currency and P/L save/reload/revert; available notification preference controls save without bypassing plan eligibility; no sends/delivery tests/provider changes.
- R03 notification dropdown -> history, empty state and settings return; mark-read/mark-all ownership using existing safe records if available (no fabricated provider event/outbound notification).
- R04 ordinary signed QA admin request shows locked page, no automatic Discord OAuth or identity switch; explicit refresh button remains. Owner-admin read display may require normal owner refresh; no grants changed.
- R05 Security wording uses connected login methods; cancel sign-out-everywhere retains session. Final billing-context menu logout succeeds and protected navigation denies after logout; no reset/payment replay.
- R06 admin member list time-expired fixture labels Expired while original history/grants retained; Features default mode matches unchanged runtime diagnostics and saved explicit modes.
- R07 Help account guidance matches supported sign-in methods and no-plan account management. Confirm prior paid add-on/subscription retained by read-only evidence; do not repeat successful payment.
- R08 mobile/desktop and theme sample on corrected account/preferences/history/error states; restore original QA preferences and temporary viewport.

Record every result as PASS/FAIL/BLOCKED against exact successor source/deployment/image/health/schema/rollback. A build pass is not browser acceptance. Post-release failures are recorded for another approved batch; do not deploy extra tiny fixes automatically. All outstanding provider/time/populated-data cases remain in full41area inventory.

## Post-release focused Membership/Login/Stripe checkpoint — Preferences correction held

Owner narrowed QA to Membership/Login/Stripe and authorized fixing Preferences without permission changes; no deployment until explicit approval.

Live retest target: source23e0abf10c0a6a43d06764431257c6e090c81a55, deployment8acd3ac9-4ed4-48b5-8972-37a6b1a0779e, image sha256:982ec8dad2fc77ee99a0401d9897b4dd6ee769d2dba66090ab1df8be9bf29442, health200 ready/sqlite_single_node/schema166 (Coordinator verified). Production untouched.

PASS: no-plan Security/Profile/Delete Account/General/AI entry, connected-login wording, sign-out-everywhere Cancel; broker remains gated and AI disabled. Currency save/reload persisted and original USD restored. Notification dropdown reaches empty /notifications. Ordinary member admin entry remains locked without automatic Discord OAuth; returning Login methods subsequently proves Google+email/password retained. Owner Members shows Expired for expired grants, preserves active/revoked states; Features shows runtime enforced/off defaults without policy writes. No-plan billing shows no linked subscription and explains monthly subscription prerequisite. Billing menu logout reaches /signed-out, then direct /account/membership redirects to login. Screenshot: data/membership-staging-qa-20261017/billing-logout-23e.png. IAB offline fallback recovered via normal Try again; no cache/data clearing, credentials or restart.

FAIL on deployed source: /account/preferences page error3568859903, logs WORKSPACE_ACCESS_DENIED. Source tracing identifies nested ReverseSplitNotificationPanel unconditionally invoking dashboard/Discord identity before its owner-only visibility guard. This independently reproduces the rejection path for the valid email/Google no-plan persona; hosted logs alone do not identify the stack call. Other Preferences repository workspace guards remain intact.

Prepared two-file source correction: Preferences retains its authenticated identity and passes it server-to-server to ReverseSplitNotificationPanel. Panel uses supplied identity or its existing dashboard helper for other callers, then retains the identical hasReverseSplitReviewAccess owner check before any settings reads. Existing reverse-splits page caller and all repository ownership, paid notification/provider/action guards unchanged. No UI changes, permission grants, fallback workspace or catch-and-ignore access errors. Help guidance unchanged because supported behavior is unchanged. Narrow whitespace/diff/source review only; no Vitest/test/build/install/server. Next.js bundled docs unavailable locally; no dependencies installed. React review: server-only identity flow, no client serialization, hooks or shared mutable request state.

Correction SHA256: Preferences D5D1523471A4AC1C1A92B1C32C63049759FBE65EFF8C787B07E5641200EFD6B1; panel5C2F7E781A922F547FEEEF11BC223863D891E22A6DE9252C722CA1C6FE064AE7. These source files remain uncommitted under owner no-commit instruction. Coordinator review requested; no deploy authorized.

Pending staging acceptance after approved release: Preferences render, permitted preference save/reload/revert, owner-only panel hidden for ordinary QA and unchanged for owner. Populated notification mark-read/ownership lacks records. Stripe3DS/declines/refunds/nonmonthly/paid-trial/adversarial webhook cases require controlled sandbox fixtures; future renewal/expiry requires time/isolated clock. Provider-conflict/email-change/Discord matrices require controlled accounts; old-password rejection untested because reset reused same password. Prior successful signup/email/reset/Google/mobile disconnect and prorated Stripe payment remain retained passes, not repeated. No broad app QA expansion.

## Owner-authorized Stripe sandbox lifecycle execution

Owner explicitly requested access verification, isolated test setup and all executable Membership/Stripe scenarios before batching corrections. No deployment/production action. Coordinator executes provider requests in exact staging container, retaining secrets there.

Verified capability: TEST secret family present; genuine API reads balance/customers/card methods/refunds/events/test-clocks/webhook endpoints HTTP200 with livemode:false. Exact enabled endpoint targets staging /api/webhooks/membership-stripe. CLI absent, not a blocker. No new login sessions required for reviewed service-level fixture bridge; full interactive 3DS completion still needs browser handoff if reached.

Live endpoint behavioral PASS: missing Stripe signature HTTP400; invalid stale signature HTTP400; >1,000,000-byte body HTTP413. Requests were untrusted invalid synthetic payloads; no valid provider event or entitlement mutation.

Execution target matrix (pending actual fixture evidence, not pass):
- Initial decline: incomplete/unpaid invoice and no active paid entitlement; retry may recover once.
- Authentication required: pending payment, no premature entitlement; complete/fail/cancel 3DS only with genuine Stripe challenge evidence.
- Renewal success: paid invoice extends coverage exactly; duplicate/reordered delivery cannot duplicate grant or regress coverage.
- Renewal failure: no unpaid coverage extension; provider past_due represented; successful recovery extends coverage once.
- Scheduled cancellation: paid access retained until covered boundary; terminal canceled subscription revokes only its own source; independent grant remains.
- Full/partial refund: record actual provider refund and application behavior; source has no explicit refund branch, intended access policy not inferred.
- Clock: dedicated new customer/subscription/clock only; no shared app clock changes, existing buyer or real account mutation.
- Receipt security: invalid/stale/tampered signature rejection; genuine replay idempotency/conflicting event handling only where controlled authentic delivery is available.

Discovered configuration gap: current TEST webhook lacks invoice.payment_action_required, charge.refunded and refund event subscriptions. Preserve existing events; any test-only subscription expansion must be exact and recorded. Source handler absence may mean additional events are acknowledged ignored; never equate delivery with correct membership behavior.

### Sandbox execution checkpoint

Coordinator verified exact staging TEST webhook additive expansion from11 to15 events: invoice.payment_action_required, charge.refunded, refund.created, refund.updated. All original events preserved; livemode false, enabled exact stagingURL; no secret/URL/production change.

No lifecycle payment PASS yet. Coordinator fixture runner first lacked source-only zod in standalone image; revised runner then hit STORAGE_VALIDATION_FAILED after creating private catalog but before identities/claims/payment objects. Exact partial catalog and its empty/failed checkpoint were removed by Coordinator; verified quick_check ok, foreign keys0, rootAbsent true. Existing buyer unaffected. Do not rerun original fixture blindly.

Coordinator switched to owner's Levels coordination before completing this request. Worker requested explicit Membership-only runner handoff into assigned scripts/staging-qa and fixture execution ownership, without reading Coordinator private files. Until provided, hosted fixture mutations remain paused to avoid overlapping an owned staging operation. This is a coordination/execution prerequisite, not missing Stripe credentials or owner-supplied fixtures. 3DS/decline/refund/renewal/cancellation outcomes remain UNTESTED, not passed or a proven technical impossibility. Preferences correction remains source-reviewed and undeployed. No further application fixes or deployment undertaken.

## Completed Stripe sandbox lifecycle QA — owner-requested execution

This supersedes the earlier setup/coordination blocker: runner handoff completed and tests actually executed against source23e0abf10c0a6a43d06764431257c6e090c81a55 / deployment8acd3ac9-4ed4-48b5-8972-37a6b1a0779e, TEST key retained inside exact staging container. No app deployment, production change, login-session issuance, Vitest, build or local server.

| Scenario | Result | Actual evidence |
| --- | --- | --- |
| Initial declined payment | PASS | Subscription incomplete; invoice open, amount_paid0/amount_due100; claim reserved; zero entitlement/access. |
| Authentication-required pending payment | PASS | PaymentIntent requires_action/use_stripe_sdk; invoice unpaid; invoice.payment_action_required received; no grant. |
| 3DS success | PASS | Owner completed hosted Sandbox invoice; PaymentIntent succeeded; charge three_d_secure.result authenticated and authentication_flow challenge; invoice paid100; app claim fulfilled and exactly1subscription entitlement. |
| 3DS processing/authentication failure | PASS for no-charge/no-access | Owner clicked failure fixture card1280; PaymentIntent requires_payment_method, card_declined/generic_decline; invoice unpaid0; claim reserved/no grant. Browser returned to staging login because fixture-specified returnURL was protected membership and browser was signed out. No app-generated Checkout failure-copy acceptance claimed from this fixture. |
| Successful monthly renewal | PASS | Isolated clock advanced; new invoice paid100; same entitlement extended Oct28->Nov28 with no duplicate source. |
| Failed renewal | PASS | Stripe past_due, invoice open/unpaid0; app projection past_due; paid grant end stayedNov28 despite provider next-period endDec28. At isolated clock time afterNov28, only independent owner grant was effective. |
| Renewal recovery | PASS | Original successful method paid failed invoice; same entitlement extended toDec28 and lifecycle returnedactive. |
| Scheduled cancellation | PASS | cancel_at_period_end true, local matching state; paid grant stayedactive through paid boundary; independent grant remained. |
| Terminal period-end expiry | PASS | Separate Stripe clock advanced beyondDec28 boundary; genuine subscription.deleted applied; subscription projectioninactive and own grantrevoked; independent owner_grant retained. Shared app clock was never changed. |
| Full refund | FAIL against owner-confirmed access policy | Refund100/100 succeeded. Genuine charge.refunded/refund.created/refund.updated reached app but were recordedignored. Subscription grant/access remainedactive until explicit test cleanup cancellation. Owner approved removing ONLY refunded purchase access while preserving other sources. Application correction is required; NOT implemented or claimedfixed by this QA run. |
| Exact duplicate delivery | PASS | Genuine cancellation body reconstructed only after exact receipt SHA256 match; QA re-signed exactbody twice, both HTTP200 duplicate; no extra grants. This is route-level QA re-signing, not Stripe Dashboard resend. |
| Signature rejection | PASS | Missing/invalid/stale/future/tampered signatures HTTP400; oversizedbody HTTP413. |
| Late paid event after cancellation | PASS controlled fault injection | QA-signed copied own Stripe invoice payload with new QA eventid after cancellation: HTTP200 applied, exact grant rows unchanged, no resurrection. Not a claim of a complete genuine-provider ordering matrix. |
| Conflicting same event ID/body | PASS controlled fault injection | Valid-QA-signed conflicting payload HTTP503; no access mutation; exact intentionally-created processing-failure audit row removed after verification. |

Proof boundaries: credential-free disposable identities and actual claim services; standalone image cannot import source-only zod, so private-link persistence and Checkout request were narrowly mirrored. Genuine Stripe subscriptions/invoices/refunds/clocks and webhook projections were exercised; owner used genuine hosted invoice UI for3DS. This does not repeat or replace prior app-originated successful standalone/add-on checkout acceptance. User-cancelled3DS, exhaustive card/network failures, partial/failed refunds, nonmonthly/paid-trial combinations and exhaustive event ordering were not executed in this bounded lifecycle run; they are not described as blocked by missing credentials or fixtures. Required full-refund correction must address exact purchase/source mapping, historical paid periods, duplicate/reordered delivery and combined add-on preservation before readyforrelease.

Cleanup PASS: all4genuine Checkout Sessions expired; synthetic paid subscriptionscancelled; incomplete failed-auth subscriptionterminal incomplete_expired/invoicevoid; fixture4usersdisabled/authidentitiesrevoked; zero synthetic authsessions created or retained; all effectiveaccesszero; independent controlgrant revoked only after retention test; own privateofferpaused, planretired and linksrevoked; own Stripeprice/productinactive. Test clock is retained as inert evidence with no active subscriptions; one17.8MB protectedremote DB backup retained for acceptance. Historical provider objects/receipts retained.

Existing data preservation PASS: each pre-existing row byte-equivalent to backup in users13, authidentities14, workspaces13, workspace memberships13, preferences13, plans10, versions13, offers12, sharelinks4, entitlements13, providersubscriptions1, providerdefinitions2, operatorgrants1. DBquick_checkok/FK0. No existing buyer grants, policies or owner credentials changed.

Evidence: ignored data/membership-staging-qa-20261017/stripe-lifecycle-results.json (14sanitized observations at export; no credentials/payment links), stripe-3ds-paid.png. Four exact synthetic-user fixtures only. Root scripts/staging-qa/stripe-lifecycle-20261017.cjs and continuation runner are QA-only source, not app release files. Staging source remains23e; Preferences2file correction is prepared/reviewed locally. Full-refund access correction remains pending in the SAME held batch; do not call complete batch release-ready or deploy until owner approval and correction review.

## Owner-authorized held Preferences + exact-purchase refund correction

Owner requested implementation after lifecycle QA: full refund removes ONLY the refunded purchase's access; other paid plans, trials and manual grants preserved. No deployment until owner approves. Preferences remains the previously-reviewed2file identity-reuse correction; it does not change permissions.

Prepared source behavior:
- Hydrate charge/refund events using authoritative Stripe charge, successful refund settlement sum, exact invoice-payment/checkout linkage, customer/currency/fullamount checks. No customer-wide entitlement lookup or email matching. Partial/unsettled/failed refunds without a prior full refund do not change access.
- Match exact claim and subscription/one-time/trial source. Record hashed purchase/charge/invoice audit evidence atomically with provider receipt and access projection. Existing schema only; no migration.
- Full subscription/one-time/paid-trial refunds remove that exact source. Older-period refunds preserve newer paid coverage. Paid-trial entry refund uses original trial_end rather than instantaneous entry-fee invoice period.
- Prorated add-on refunds remove only amendment's purchased components. Preserve base/later add-ons using immutable published component snapshots and existing quota carryover. Residual internal access snapshots are unlisted/retired, offerspaused, not enrollable; no Stripe price/subscription/cancellation mutation. Independently modified bundle features require reconciliation rather than stale reconstruction.
- Suppress old checkout/paid-invoice receipts for refunded source coverage before any add-on fulfillment. Genuine later paid coverage may restore the packages it pays for, preserving owner-published versions and planned renewal changes.
- A full refund later reported unsuccessful may restore ONLY exact handler-owned access removal. Providerstate must be active/trialing/past_due and corresponding localstate active/trialing/past_due/cancel_at_period_end. Terminal/disabled/expired/newercoverage withholding retains replay protection. Missing/manualchanged/overlappingfailedrefund/neverprojected initialpayment/pending-add-on reversal requires explicit reconciliation, not guessed restoration.
- Existing billing Help paragraph updated to owner policy. Editor writer comment clarifies trusted buyer-bound refund preservation; no editor runtime permissions changed.

Review: Coordinator firstread identified two high correctness issues in reversal: suppression removed when access notrestored and noncanceled-only statuscheck. Both corrected in sameheldbatch. Secondreview requested on finalfrozenfiles. No runtimePASS claimed for these corrections until approved stagingret est.

Allowed narrow verification only: Node --experimental-strip-types --check on the3refund-related sourcefiles passed (syntax-only, no imports executed); gitdiffwhitespace checks passed. No Vitest, test suite, build, install, localserver or hostedcode execution. FullTypeScript/build remains future release gate. No commits/push/deploy/production changes.

Final source allowlist7paths (plus this report and existingplanlink/hold update):
1. app/(member)/account/preferences/page.tsx
2. app/(dashboard)/reverse-splits/notification-panel.tsx
3. src/modules/platform/server/membership/platform-membership-stripe.ts
4. src/modules/platform/server/membership/membership-stripe-refund-hydration.ts
5. src/modules/platform/server/membership/membership-stripe-refund-access.ts
6. src/modules/platform/server/membership/membership-plan-editor-write.ts (commentonly)
7. src/modules/help/paid-plan-guides.ts

Sourcehashmanifest: ignored data/membership-staging-qa-20261017/preferences-refund-source-manifest.json; refresh after reviewrepairs. Do not package mixed worker tree. Exact staging parent remains23e0abf10c0a6a43d06764431257c6e090c81a55; no release slot requested or assigned by worker.

Future approved staging acceptance: Preferences render/save/reload/revert; full refund with separatepaid/trial/manualcontrolgrants; fulladdon refund preservesbase/lateraddons; historicalrefundpreservesnewpaidperiod; partial/pending/failedrefund no revoke; refundreversalstatelist and replayprotection; exactduplicate/lateinvoice; laterpaidcoverage; cleanup/data-preservation. Corrected reversal also needs additive refund.failed event subscription on exact TEST staging webhook (current15events); this is a release/config gate, NOT performed now. Production endpoint remains outside authorization.

Final source review acceptance: Coordinator secondread PASS on hydrationB754B92E548C0285CD00E3F4E95AE733CC686FD7B62CA436710333ED0C03BBEC, access8E54B4B65499EA98896EA918A830A87A964F74FAA1196947AB39E94C4AAB7EEE, Stripe16B9CD858CC060B503019BCD274483E41F26DDBAB6B1818B6BE8C5BC6A9E4F27 and commenteditorA63BFF23A1E6121E1F40E135BC681F52BF0BB71113DF923F48EDCD9392E755AD. No further correctness finding. Preferences previous2file review remainsaccepted, Helpguide singleparagraph policyreviewedlocally. Source7filemanifest matches currentfiles. Review is source acceptance only; no TypeScript/build/browser/fullrefundcorrected-flow acceptance claimed.

Ready: one7sourcefile Preferences+refund correction batch plus2progress/plan docs. Not deployed, not committed/pushed. Existing Stripe billing/cancellation configuration unchanged; a genuinely later paid renewal grants its newly paid period. Mandatory post-approval gates remain: exact-parent packaging, hostedTypeScript/build, additive refund.failed TEST event subscription, one stagingdeployment, groupedPreferences/fullrefund/add-on/independentgrants/reversal/replay/terminal-lifecycle retest and cleanup. Production excluded. Owner has not approved that deployment in this turn.
