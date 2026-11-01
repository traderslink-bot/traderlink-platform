# Watchlist price discovery CI repair progress

## Status and scope

November 1, 2026, Eastern. Failed CI run 40809409387 tested candidate `3a5e401f5eb3156e6bb06cb69be31d9b6ea8dae4`, parent `923b7ba1c13836aa6aab1b325b7061c409f611fe`. The saved log contains exactly 255 failure headings across 69 files; 441 files and 3,527 tests passed. The release gate remains failed.

The owner authorized technical investigation and repairs without changing approved behavior. Coordinator allocated the existing `watchlist-gain-card` lane at HEAD `52982c5f1261675a8f14a3cb6c5e14eab94967b8`: only four named membership test files and this new progress record. Original frozen Platform 17 / Runtime 16 files, index, source, setup audit, provider settings and notifications remain untouched. This checkout is not a complete current-main app.

## Consolidated discovery

The log groups failures into timing, policy fixtures, missing/static-source fixtures, source-string/route expectations, and Coach/schema/assertion failures. Interleaved GitHub error annotations prevent naive block splitting from conclusively attributing every downstream error; the per-file counts below use explicit FAIL headings only. Preliminary extraction finds 152 five-second and two ninety-second timeout blocks. Resource pressure is a hypothesis until representative isolated reproduction, not a waived baseline failure.

Concrete policy mismatch: `membershipFeatureDefaultEnforcement()` returns `off`, preserving owner-controlled rollout. The four allocated tests assume enforcement with an empty policy table or missing policy mock. Their enforcement scenarios must explicitly opt in. Production defaults and denial assertions must stay unchanged; absent-policy and off/shadow behavior need their own coverage.

Three feature-page tests reference absent `static-landing-site/*/index.html` paths. Dashboard tests expect the former direct DashboardTemplate import and route inventory despite the candidate's DashboardFrame and externally composed routes. These need ownership/contract tracing, not wholesale assertion deletion. Coach failures include generation-contract/cache-usage triggers, 503 routes and old provider expectations. They remain unresolved; no blanket obsolete-test classification is made.

All 39 recursively resolved local static imports of the four allocated test files match candidate bytes, including their production membership and allowance dependencies. Package/lock/Vitest config equivalence was qualified by Coordinator. This supports focused candidate-input tests only; local Node 24 versus CI Node 22 remains an environment difference.

## Complete failed file inventory

| File | Failed tests |
| --- | ---: |
| `src/lib/academy/__tests__/discord-auth-routes.test.ts` | 5 |
| `src/lib/trader-intelligence-v3/__tests__/dashboard-template-enforcement.test.ts` | 4 |
| `src/lib/trader-intelligence-v3/__tests__/route-containment.test.ts` | 3 |
| `src/modules/coach/server/coach-ai-chat-action-draft-service.test.ts` | 15 |
| `src/modules/coach/server/coach-ai-chat-administration-repository.test.ts` | 2 |
| `src/modules/coach/server/coach-ai-chat-annotation-context-service.test.ts` | 1 |
| `src/modules/coach/server/coach-ai-chat-generation-recovery-service.test.ts` | 1 |
| `src/modules/coach/server/coach-ai-chat-generation-service.test.ts` | 10 |
| `src/modules/coach/server/coach-ai-chat-page-context.test.ts` | 1 |
| `src/modules/coach/server/coach-ai-chat-provider-controls-repository.test.ts` | 4 |
| `src/modules/coach/server/coach-ai-chat-repository.test.ts` | 1 |
| `src/modules/coach/server/coach-ai-chat-routes.test.ts` | 9 |
| `src/modules/coach/server/coach-ai-daily-companion-command-service.test.ts` | 3 |
| `src/modules/coach/server/coach-ai-manual-entry-command-service.test.ts` | 1 |
| `src/modules/coach/server/coach-ai-review-administration-repository.test.ts` | 1 |
| `src/modules/coach/server/coach-ai-review-delivery-change-command-service.test.ts` | 3 |
| `src/modules/coach/server/coach-ai-review-provider-controls-repository.test.ts` | 4 |
| `src/modules/coach/server/coach-monthly-ai-review-issuance-service.test.ts` | 3 |
| `src/modules/coach/server/coach-monthly-ai-review-runner.test.ts` | 3 |
| `src/modules/coach/server/coach-weekly-ai-review-issuance-service.test.ts` | 2 |
| `src/modules/coach/server/coach-weekly-ai-review-runner.test.ts` | 3 |
| `src/modules/coach/server/coach-weekly-review-schedule-repository.test.ts` | 2 |
| `src/modules/journal/server/journal-integrity-command-service.test.ts` | 34 |
| `src/modules/journal-analytics/presentation/trade-explorer-ordering.test.ts` | 1 |
| `src/modules/journal-analytics/presentation/trade-explorer-review-ui-contract.test.ts` | 4 |
| `src/modules/journal-analytics/presentation/trade-explorer-ui-contract.test.ts` | 1 |
| `src/modules/journal-analytics/server/analytics-lab-saved-view-service.test.ts` | 3 |
| `src/modules/level-analysis/server/candle-review-service.test.ts` | 3 |
| `src/modules/level-analysis/server/daily-trade-analyzer-chart-theme-contract.test.ts` | 1 |
| `src/modules/level-analysis/server/journal-level-analysis-link-service.test.ts` | 2 |
| `src/modules/level-analysis/server/level-analysis-delivery-service.test.ts` | 2 |
| `src/modules/academy/server/progress/academy-progress-service.test.ts` | 2 |
| `src/modules/journal/server/analytics/journal-analytics-fact-set-repository.test.ts` | 4 |
| `src/modules/journal/server/annotations/journal-annotation-service.test.ts` | 7 |
| `src/modules/journal/server/annotations/journal-preset-rule-evaluator.test.ts` | 1 |
| `src/modules/journal/server/database/journal-integrity-migrations.test.ts` | 2 |
| `src/modules/journal/server/demo/demo-data-callout-appearance-contract.test.ts` | 1 |
| `src/modules/journal/server/imports/journal-private-source-automation.test.ts` | 2 |
| `src/modules/journal/server/manual-trades/journal-manual-trade-command-service.test.ts` | 3 |
| `src/modules/journal/server/product/journal-import-product-service.test.ts` | 1 |
| `src/modules/journal/server/accounts/journal-account-authorization.test.ts` | 4 |
| `src/modules/journal/server/accounts/journal-account-boundary.test.ts` | 1 |
| `src/modules/journal/server/accounts/journal-account-fingerprint-rotation.test.ts` | 7 |
| `src/modules/journal/server/accounts/journal-development-owner-scope.test.ts` | 1 |
| `src/modules/journal/server/administration/journal-import-attempt-recovery.test.ts` | 1 |
| `src/modules/journal/server/administration/journal-import-attempt-repository.test.ts` | 2 |
| `src/modules/journal/server/administration/journal-import-attempt-service.test.ts` | 1 |
| `src/modules/journal/server/administration/journal-statement-format-command-service.test.ts` | 3 |
| `src/modules/journal/server/administration/journal-statement-format-repository.test.ts` | 2 |
| `src/modules/journal/server/administration/journal-support-consent-repository.test.ts` | 1 |
| `src/modules/platform/server/administration/platform-admin-authorization.test.ts` | 3 |
| `src/modules/platform/server/authentication/platform-authentication-repository.test.ts` | 2 |
| `src/modules/platform/server/authentication/platform-discord-sign-in-service.test.ts` | 2 |
| `src/modules/platform/server/authentication/platform-identity-provisioning.test.ts` | 2 |
| `src/modules/platform/server/authentication/platform-session-service.test.ts` | 1 |
| `src/modules/platform/server/authentication/require-platform-request-scope.test.ts` | 1 |
| `src/modules/platform/server/authorization/workspace-access-scope.test.ts` | 3 |
| `src/modules/platform/server/database/platform-migrations.test.ts` | 3 |
| `src/modules/platform/server/database/platform-schema-digest.test.ts` | 5 |
| `src/modules/platform/server/database/platform-storage-validation.test.ts` | 6 |
| `src/modules/platform/server/identity/platform-account-profile-read-service.test.ts` | 1 |
| `src/modules/platform/server/membership/feature-page-embed-host.test.ts` | 3 |
| `src/modules/platform/server/membership/membership-custom-tags.test.ts` | 9 |
| `src/modules/platform/server/membership/membership-news-delay.test.ts` | 1 |
| `src/modules/platform/server/membership/membership-plan-catalog-lifecycle.test.ts` | 1 |
| `src/modules/platform/server/membership/platform-membership-access.test.ts` | 18 |
| `src/modules/platform/server/membership/platform-membership-generation-allowance.test.ts` | 13 |
| `src/modules/coach/server/database/migrations/0029_coach_ai_chat_foundation.test.ts` | 1 |
| `src/modules/coach/server/database/migrations/0032_coach_ai_review_provider_controls.test.ts` | 2 |

## Authorized correction batch

Explicit test policies only in:
- `src/modules/platform/server/membership/platform-membership-access.test.ts`
- `src/modules/platform/server/membership/membership-custom-tags.test.ts`
- `src/modules/platform/server/membership/platform-membership-generation-allowance.test.ts`
- `src/modules/platform/server/membership/membership-news-delay.test.ts`

No production enforcement default, assertion weakening, skipped tests, global timeout increase or provider invocation is authorized. The generation fixture also appears to omit `level_analysis_user_allowance_resets`, required by its beta fallback path; schema-fixture correction needs exact-hunk allocation and reproduction first.

## Verification

Focused command requested for a finite shared-resource slot, before and after the coherent fixture batch:

```bash
timeout 180s node_modules/.bin/vitest run src/modules/platform/server/membership/{platform-membership-access,membership-custom-tags,platform-membership-generation-allowance,membership-news-delay}.test.ts --maxWorkers=1 --no-file-parallelism --reporter=dot
```

Fixtures use isolated in-memory SQLite and mocked membership/Discord grants. No server, preview, real credentials, provider calls, migration database, delivery or hosted effects. Test-only corrections do not require member Help changes.

The first admitted baseline launcher failed before Vitest loaded: its sanitized PATH omitted the installed Node directory, so the executable shebang returned `node: No such file or directory` (exit 127). The service took 42 ms, was inactive with an empty cgroup, and its exact inode/device lock was released. Zero tests ran and no source changed. An infrastructure-only replacement slot was requested using the explicit installed Node executable; no blind retry or limit increase occurred. Full CI and deployment remain unrun.

The separately admitted corrected baseline used the explicit Node 24.22.0 executable, sanitized environment, 768 MiB service cap, 256 MiB Node heap, CPU quota 100%, one worker and no file parallelism. It completed in 2.50 seconds (service 2.947 seconds): **41 failed, 22 passed, 63 total**, all four files failed, no timeout. This matches the failed-count total for these four files in the saved CI. The inactive failed service had an empty cgroup and its same-inode lock was released immediately.

The coherent four-file fixture correction explicitly selects enforcement for the tested policies and updates those rows for off/shadow scenarios. Notification fixtures enforce only the product/category under test, leaving unrelated notification policies unset. All 125 existing assertion statements are byte-for-byte unchanged by AST comparison; test labels no longer misdescribe opt-in enforcement as the product default. The 16 original manifest-listed Platform files retain every frozen hash, and the seventeenth handoff retains SHA256 `058f47df1963b444e0d4d4b6331172d0714b093b5ed5235e5e7f7aca3ca92ccf`.

Coordinator preserved the initial five-file correction locally at `46ae10fe47a7f9a08fc413c126958463dfc105b3`, parented to the exact candidate. The first post-fix gate verified its frozen hashes and completed in 2.36 seconds (service 2.781 seconds): **62 passed, one failed, 63 total**. Three files passed completely. The remaining custom-tag override fixture appended an `off` policy after the newly seeded `enforced` policy; its unconstrained synthetic table allowed duplicate keys and the reader selected the first row. The assertion correctly exposed this fixture defect. Its single policy statement now updates the existing row rather than inserting a duplicate. All assertions remain unchanged. No schema addition was required: all 18 generation tests passed with explicit policy setup. The post-fix service was inactive with an empty cgroup and the matching lock released.

Coordinator preserved the final policy-fixture correction at `42a39454a815621401cc9aedeecd6bec49e699d2`, parent `46ae10fe47a7f9a08fc413c126958463dfc105b3`. The separately admitted final four-file gate passed **all 63 tests, four files, zero failures or skips** in 2.82 seconds (service 3.278 seconds, wall 3.311 seconds). Before Vitest loaded, the service read its own unified cgroup and proved `memory.max=805306368` and `cpu.max=100000 100000`; limits were not inferred from a dead unit. Node heap was capped at 256 MiB. Unit `watchlist-ci-final-1960886` exited zero, became inactive, had no populated cgroup and released its exact inode/device lock. All five frozen input hashes were verified before execution. No source changed during testing.

This resolves the original 41 failures in these four files with all 125 assertions retained. The other **214 saved CI failures remain unresolved**, not waived or attributed to baseline by this result. No full CI pass or production deployment is claimed. Member Help content is unchanged because this correction changes test fixtures only.

## Coach migration fixture correction

The next bounded group is the allocated `0029_coach_ai_chat_foundation.test.ts` and `0032_coach_ai_review_provider_controls.test.ts`. Exact saved CI before-evidence records one cache-usage constraint failure in 0029, and an inactive review contract plus a timeout in 0032. The fixture corrections retain the full current migration manifest and all production triggers. Known usage now supplies zero cached/write tokens and their explicit test rates. The review fixture performs the legitimate one-way contract activation with a timestamp later than its stored transition, then supplies all four required Chat prices. The negative-price fixture clears all four prices so the unchanged expected enabled-price guard remains the behavior under test. No historical-prefix truncation or product activation occurs outside the in-memory fixture.

Frozen test hashes are `567ded222a047dae96714dc8924855c6ac77651a8298b6c58ad4bf7e9ffb2f00` (0029) and `74f30d6deed020ce3679747a3216133e5df3de246855db50f162dd6ebfabfe6d` (0032). Coordinator preserved this two-file delta at `e77cffd77929eec818987f0d02421f29023c165c`, parent `41638c6b29a9f2e86324725df55d4e008f07239a`.

The older feature lane differs from the candidate in the migration runner and manifest. Therefore these tests must use the existing read-only exact-candidate export as both root and config source, not mixed product-module aliases. All 162 static source inputs, including News0185, plus five setup/config/package inputs match candidate bytes: 167 inputs, sorted path/content manifest SHA256 `04e82b5048103bcdb344a8b0973b8678e3df4555788a9e23a4972be5d0140eae`. Installed dependency view and Node 24 versus CI Node 22 remain explicit environment qualifications.

The prepared in-memory Vitest API harness inherits candidate aliases/setup, uses runner config loading, places cache only in a fresh temporary directory, and disables watch/coverage/result caching. Only the two exact candidate test module IDs may receive the frozen edited fixture text via pre-transform. Product code and import identities remain in the candidate root. Existing CI supplies before-evidence; one separately scheduled post-fix gate is pending. No test invocation is authorized merely by harness preparation.

The first attempted Coach admission was safely refused by the required exclusive lock with `EEXIST` before creating a service, importing test/application modules or creating caches. Coordinator withdrew that slot after discovering active Coaching browser work. The occupied lock was not inspected, altered or removed. This is an unrun test gate, not a test failure or permission to retry. Frozen Coach inputs remain unchanged while a new finite slot is scheduled.

## Additional lifecycle policy fixture

The original lifecycle failure at `membership-plan-catalog-lifecycle.test.ts:121` is the same explicit-policy omission: a fixture expects a finite Analyzer allowance while its policy is unset and defaults off. Coordinator allocated this exact test file. Its setup now inserts the tested Analyzer enforcement policy using its synthetic actor and time, satisfying the real foreign keys. All 55 existing assertion statements are unchanged, as are the mocked Stripe/fetch boundaries. Test SHA256 is `1cd515a7391dbcf64413e3c265fa988de40f2d2aa7ed7cc0c2ea388c7b4f5b52`.

A combined three-test-file candidate-root input graph contains 216 static/config/package inputs, all matching candidate bytes, with sorted path/content manifest SHA256 `e54325c3a89835dfa0241bb85d83730d7831fd56c6be67eb85833614276a3d4f`. No combined test has run. Combining the already pending Coach cases with these six lifecycle cases would require an explicitly updated three-test-only transform allowance and a new finite resource slot. The existing 63-test result remains the only completed passing repair batch; all other original failures remain unresolved until verified.

Coordinator preserved the lifecycle/doc delta at `fb316989e873d27f5df7e0e8111c524c20f747ce` and allocated the three-test-only overlay extension. The in-memory nine-case harness is prepared against the 216-input graph; execution is still pending a genuine resource-slot release. It does not poll, alter or inspect another task's lock.

## Four additional test corrections

The owner authorized these four small test-only corrections, and Coordinator allocated their exact paths after verifying each was clean and byte-identical to candidate `3a5e401f`. All four corrections are implemented. The diff check passes, and the separate four-file gate passed all 58 cases with no failures, skips or unhandled errors.

| Test path | Recorded mismatch | Implemented test-only correction |
| --- | --- | --- |
| `src/modules/coach/server/coach-ai-chat-annotation-context-service.test.ts` | Its alleged oversized January–August 2026 interval is about 217 days, below the actual 1,500-day limit, so reading the dashboard is legitimate. | Use a genuinely oversized 2020–2026 fixture; keep both rejection and no-Journal-read assertions. No account-isolation defect is established by this failure. |
| `src/modules/coach/server/coach-ai-chat-page-context.test.ts` | The expected Daily Trade Tracker label differs from Session Tracker in both the current page-context implementation and dashboard navigation. | Update the exact label expectation without changing path/date/privacy assertions. |
| `src/modules/journal/server/annotations/journal-preset-rule-evaluator.test.ts` | Its substring starts with lowercase `trade P/L`; the actual sentence starts with `Trade P/L`. The n/a and missing-source-fact assertions agree. | Correct only expected capitalization, preserving the strict status/reason checks. |
| `src/modules/journal-analytics/presentation/trade-explorer-ordering.test.ts` | It expects 12 sort choices while the current module has 18, including maximum position, execution count and trading costs; all three fields exist in the server query contract. | Update the strict expected mapping to all 18 choices and current shares-entered labels, retaining equality, uniqueness and invalid-input checks. |

The 154 timeout blocks still require representative isolated timing evidence before a scheduling change can be justified. No global timeout or worker-count configuration has changed.

Frozen edited SHA256 values, in table order: `2bd6c1bd8a6b19efd661f352f2b9e6964b8a60570a8ded0a5285130d41e8ee39`, `59efdb65a77cdda69a2ae3ca16e198a87d38fdd6f74dcec89a250b0e270b5506`, `46eaab829cbe093428e046c051cdbeae87c126ba0bb4bd3ece3c51a0e3d68300`, `89894bd9cf947db96d407f65f316372519db74f0c232b3512f49db2984264e88`.

The four-file candidate-root gate has 83 static/config/package inputs, all checked against candidate bytes; sorted path/content manifest SHA256 is `908572ca344a746cf9a36d48e033208aa6a430efac26d55c18f84198d31fcd50`. Its prepared in-memory transform substitutes only these four frozen test modules, never product modules. The tests are pure or mocked units, with no provider, server, delivery or real database. Strict sort equality now enumerates all 18 choices; invalid-input, date, privacy, account-isolation and missing-data checks remain. The oversized date fixture now exceeds the actual 1,500-day limit rather than triggering a legitimate dashboard read. No member Help update is needed for test-only changes.

Coordinator preserved the four test corrections and progress locally at `7fb2b646668be64ced74c1c5cb0f6136e2485d93`, parent `fb316989e873d27f5df7e0e8111c524c20f747ce`. The owner then explicitly authorized running the focused gates concurrently with Scanner's mobile check. This was a two-gate exception, not a general parallel-testing policy. Each gate used its own exclusive Watchlist lock without inspecting or changing Scanner's common lock, a 768 MiB hard cap, one CPU core, 256 MiB Node heap and 180-second ceiling. Both services proved `memory.max=805306368` and `cpu.max=100000 100000` from their active cgroups before imports.

The three-file gate ran all nine cases: **two passed and seven failed**, no skips or unhandled errors, all three frozen test transforms applied, and the 216-input graph matched. The 0029 test passed. Six lifecycle cases failed at the added policy fixture's foreign key; the feature definition is not present at that insertion point. One 0032 case still failed the current feature-control transition guard. These fixture corrections are not accepted as complete. Vitest took 12.61 seconds; service `watchlist-ci-nine-1974278` took 13.535 seconds, exited one, became inactive with an empty cgroup and released its matching Watchlist lock. No timeout occurred.

The separate four-file gate passed **58 of 58**, with zero failures/skips/unhandled errors, all four frozen transforms and the 83-input graph verified. Vitest took 3.78 seconds; service `watchlist-ci-four-1974381` took 4.587 seconds, exited zero, became inactive with an empty cgroup and released its matching lock. This resolves the four original expectation/fixture failures in that group. The earlier 63-case passing result was not rerun. The two completed groups resolve 45 of the original CI failures; this does not waive the remaining failures or claim a full CI pass.

No broader cleanup, product behavior change, CI waiver, push, preview update or deployment is included.

## Remaining fixture prerequisites

The seven failures reduce to two fixture setup omissions. The lifecycle policy references `platform_membership_feature_definitions`, not just its synthetic actor; `writeMembershipPlanEditor()` seeds those definitions on the initial publish. The fixture now inserts its explicit policy immediately after that publish, with foreign keys still enabled and every assertion unchanged. Edited lifecycle SHA256 is `a49935d3ff68a0c341c3bcbe5eefb13c532fb238db61bffff0d8320c4e7110a1`.

The 0032 fixture supplied Chat cache prices but still omitted the Review cache and cache-write rates. The current 0051 migration requires cache-write pricing before enabling platform Review controls. The fixture now supplies all four Review rates, retaining the guarded activation, negative assertions and current full manifest. Edited 0032 SHA256 is `e78a64443446c36ccd92a18e35277dd252ce1ba540fe9ce81fe60b44c39b9a90`. The 0029 source and the already passing 58-case group are unchanged. One further focused nine-case retest awaits separate resource admission; no additional test has run yet.

That separately admitted nine-case retest completed with **eight passing and one failing**, no skips or unhandled errors. All six lifecycle cases and 0029 now pass. The remaining 0032 case reaches the additional rolling-budget guard from migration 0049: its full-schema fixture has not selected a rolling Review budget. Unit `watchlist-ci-nine-1975505` exited one after 14.441 seconds (Vitest 13.58 seconds), with the same proven caps, 216-input graph and exact three transforms; its cgroup was empty and matching common lock released. No automatic rerun occurred.

The remaining 0032 fixture now supplies a synthetic rolling budget of `10` and advances its stored budget timestamp by one second, satisfying rather than disabling the real update guard. Review enablement prerequisites were reviewed together across migrations 0046, 0049, 0051, 0058 and 0065: current contract activation, complete Review/Chat pricing, daily caps and rolling budget are present; no provider-call block is altered. Every negative assertion remains. A further test requires a fresh finite admission and should cover only the two 0032 cases, not repeat the passing groups.

The admitted two-case gate ran both 0032 cases: one passed; the pricing-separation case reached its negative assertion and found Chat pricing already seeded by the current manifest. The old test's assumption that Chat starts unpriced was incorrect. Unit `watchlist-ci-nine-1975904` exited one after 8.621 seconds (Vitest 7.74 seconds), with no skips, unhandled errors or timeout; the active caps and 166-input graph were verified, the cgroup emptied and matching lock released. The fixture now explicitly clears all four Chat prices before the unchanged negative enable assertion, then restores all four rates before the positive enable and final price-removal guard assertion. No product default or guard is changed. No automatic rerun has occurred.

### Complete pricing test phases

Migration 0069 seeds Chat's four rates (`0.20`, `0.02`, `0.25`, `1.20`) when the earlier unset Sol defaults remain. The synthetic fixture must therefore select the intended unpriced phase explicitly, rather than assuming historical defaults. Migration 0058 permits all four rates to be NULL while Chat features are disabled, forbids partial price sets and prohibits removing prices while either Chat feature is enabled. The fixture clears all four rates atomically; it does not disable an active feature or bypass any guard.

| Phase | Selected fixture state and unchanged check |
| --- | --- |
| Review enable | v3 contract active, provider calls unblocked by the existing default, all four Review rates set, rolling budget set with a later timestamp, daily request/token/spend caps supplied. Weekly enable must succeed. |
| Unpriced Chat | Both Chat controls remain disabled. Clear all four Chat rates, leaving Review enabled and its pricing untouched. Daily Companion enable must throw `coach_ai_feature_control_transition_invalid`. |
| Protected Review pricing | Clearing Review input/output while Weekly is enabled must still throw `coach_ai_review_provider_prices_required`; the failed statement preserves its rates. |
| Priced Chat | Restore all four Chat rates atomically. Daily Companion enable with its daily caps must succeed independently of Review. |
| Protected Chat pricing | Clearing all four Chat rates while Daily Companion is enabled must throw `coach_ai_chat_provider_prices_required`; this is not the partial-price-set guard. |
| Independent reservation lifecycle | The second case uses a fresh in-memory fixture and retains every scope, state-transition, delete-protection and blocked-without-pricing assertion; it passed both preceding runs. |

Final source-only phase review covers both positive and negative transitions. The one-file, two-case harness qualifies 166 exact candidate inputs, manifest SHA256 `cb094bb0a4279aa47a4643bc0c6440c30eaa96a43affaa68ff9f0bd69621b7fb`. Frozen final test SHA256 is `58b9612c7e82337f85ffc65918e8f48c802c72a4445bc177bda3e0c5a24a5578`. No product schema, provider settings, real budget or production values change.

## Final focused repair result

The separately admitted final 0032 gate passed both cases, zero failures/skips/unhandled errors. Vitest took 7.60 seconds; unit `watchlist-ci-nine-1976757` took 8.427 seconds, exited zero and became inactive. The active cgroup proved the same 768 MiB / one-core caps before imports, all 166 candidate inputs and the single frozen transform matched, the cgroup emptied, and its matching common lock was released. No further run is needed for this file.

All 11 allocated test files now have passing focused results: 63 membership cases, 58 expectation/fixture cases, and nine migration/lifecycle cases verified across the final per-file runs. The clean 63/58 groups were not rerun. All allocated corrections are test-only; product code, owner approvals, settings, guards and frozen original Watchlist feature inputs are unchanged. This bounded work resolves 49 original failures; the remaining 206 saved CI failures are outside this correction batch and are not waived. No full-suite pass, push or deployment is claimed.
