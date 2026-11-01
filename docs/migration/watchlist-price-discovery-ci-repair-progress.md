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

The coherent four-file fixture correction now explicitly selects enforcement for the tested policies and updates those rows for off/shadow scenarios. Notification fixtures enforce only the product/category under test, leaving unrelated notification policies unset. All 125 existing assertion statements are byte-for-byte unchanged by AST comparison; test labels no longer misdescribe opt-in enforcement as the product default. The 16 original manifest-listed Platform files retain every frozen hash, and the seventeenth handoff retains SHA256 `058f47df1963b444e0d4d4b6331172d0714b093b5ed5235e5e7f7aca3ca92ccf`. Focused post-fix verification is pending a separately admitted slot.
