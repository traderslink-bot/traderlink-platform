# Demo version 10 release handoff

Status: implementation complete and source reviewed; ready for Coordinator release preparation. Production acceptance remains pending. Owner approved the proposal and asked to send when ready. No local tests, build, server, staging, provider requests, or production mutations were performed for this slice.

## Approved result

- Add YXT August 5, WETO August 14, FTFT August 28 from the approved saved-candle proposal. Each has exactly one buy and one full losing sell, no profit-taking.
- Expected total 170 trades / 817 executions / 15 green days / 5 red days.
- Gross $16,721.01; modeled fee costs $408.50; net $16,312.51; +32.63% on the proposed $50,000 start. No starting balance is written.
- New day net: August 5 -$509.29; August 14 -$509.68; August 28 -$431.33. Existing red dates August 11 and 31 remain.
- Correct only known synthetic Demo $0.50 fees from positive cash credits to negative cash costs. Append new execution versions; preserve original versions, prices, quantities, timestamps, provenance, existing notes and rules.
- Regenerate saved Analyzer results from existing verified candles. No provider, queue, or usage request. Preserve normal shared Moomoo connection and owner-only Market Data boundaries.
- Both owner opt-outs and all real accounts remain unchanged.

## Exact integration allowlist

Repository: C:\Users\jerac\Documents\TraderLink\traderlink-platform. Local HEAD 5018066fbeca3c88500bec4bcdac762b4936c875 is a mixed working tree, not the release parent. Coordinator owns narrow Git integration.

Production base: 32ff885c52174598dd0a745a8194082dd2b102d6, main; previous Railway 953b3385-b59e-4bdd-b149-188ba2fcbf4b SUCCESS, strict health ready, 117 migrations. Reconfirm parent before publication.

1. src/modules/journal/server/demo/packs/august-2026-red-additions.json — new complete file.
2. src/modules/journal/server/demo/journal-demo-fee-correction.ts — new complete file.
3. src/modules/journal/server/demo/journal-demo-august-pack.ts — updated complete file, version 10, missing-trade append plus fee repair and saved Analyzer regeneration.
4. src/modules/journal/server/demo/journal-demo-current-version.ts — version 10 UUID d4944b87-5098-4754-a1c2-39c638c9d77c.
5. src/modules/journal/server/demo/journal-demo-canonical-fact-materializer.ts — ONLY pin mapping 9 to d65a9ce3-7b4d-4a36-92a8-80e961c6a909 and add 10: JOURNAL_DEMO_CURRENT_VERSION_ID. Preserve production Session Tracker wording; do not copy local Daily Trade Tracker wording.
6. src/modules/journal/server/database/migrations/0132_journal_demo_v10_provenance_guard.ts — new complete migration; reserved by Coordinator.
7. src/modules/platform/server/database/platform-migration-manifest.ts — integration-only delta: import journalDemoV10ProvenanceGuardMigration from the new migration and append { fileName: "0132_journal_demo_v10_provenance_guard.ts", migration: journalDemoV10ProvenanceGuardMigration } in the production migration list. Do not copy the mixed local manifest or Communities migrations 0123–0131. Trigger-only migration needs no managed-table registration.
8. This handoff and docs/migration/demo-additional-red-days-proposal-20260909.md. Relevant status/link paragraphs only from demo-trade-data-plan.md and demo-trade-data-progress.md.

Do not take any unrelated staged deletion or untracked file. Existing August additions JSON, activation service, authentication, materializer transaction, Analyzer engine, market data, and UI require no new change.

## Migration and correction sequencing

0132 executionOrder 132 follows production 0122, going from 117 to 118 applied migrations. Numeric gap does not import Communities. Preserve 0122 immutable. New triggers retain legacy and version 9 exceptions and add only registered version 10 synthetic batches: 6 rows August 5–28 for version 9 upgrades; 193–817 rows August 3–31 for earlier packs. Cleared lifecycle remains excluded.

Coordinator must use guarded migration-first carrier, fresh backup and restore proof, exact predecessor verification, then strict application release after migration success. Do not push a normal application requiring 118 before the migration. Recovery image must support the actual applied schema.

Fee correction executes inside the existing immediate Demo transaction and checks owner/account Demo provenance. Existing execution IDs are deliberately NOT returned as new pack-application provenance because those IDs are unique across applications. Their new versions form the immutable correction audit. New application records only the new six executions for a version 9 account. The full version 10 manifest describes corrected fees. Any failure rolls back the upgrade.

## Evidence and production acceptance

Source review confirms appendVersion preserves original facts and audit, scoped provenance selects only Demo executions, transaction/cleared gates stay in the existing materializer, missing keys prevent duplicate additions, and current version 10 makes repeat activation a no-op. Proposal arithmetic and candle inspection are recorded in the linked proposal; this is not a runtime test pass.

After release verify Bullrun upgrade: 170 active trades, 817 accepted executions, one version 10 application with six new mappings, 811 prior execution fee versions corrected to -0.50, all 817 current fees -0.50, old prices/quantities/times unchanged. Verify repeat activation leaves execution/version/application counts unchanged. Verify 5 red days and exact gross/net totals, all three charts show two executions and full losing exit, prior Analyzer results use current fee versions with saved candles and zero provider/usage. Confirm new-account seed and cleared-owner exclusion. Feature task owns browser/product QA; Coordinator owns migration/deployment/health evidence. No new Help Center interaction or instruction changes are needed for this data-only update.
