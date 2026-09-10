# Demo version 11 approved reversal revision

Status: implementation complete, source reviewed, ready for Coordinator integration. Owner approved the exact pair and said "yes send it". Runtime acceptance remains pending. No local tests/build/server/staging, provider request, or browser operation performed. Owner retains browser control.

## Result

YXT Aug5:301shares,14:48NY buy21.43,peak32.13(+49.93%),16:57sell15.45,net-1800.98. WETO Aug14:1440shares,08:06buy10.17,peak12.95(+27.34%),10:22sell8.92,net-1801.00. FTFT unchanged at23.83% peak. Both revised trades retain one buy and one full losing sell, no profits; no completed close recovers to entry after the final profitable peak's first red point before exit. Earlier pre-peak fluctuations are possible.

Expected170trades/817executions/five red days. Monthly net16312.36;gross16720.86;fees408.50. Aug5net-508.89;Aug14net-510.23;Aug28unchanged-431.33. Exact source prices and prior approved proposal are recorded in demo-above-20-percent-revision-proposal-20260909.md.

## Integration

Canonical repository C:\Users\jerac\Documents\TraderLink\traderlink-platform, localmain5018066fbeca3c88500bec4bcdac762b4936c875 remains mixed. Coordinator reports current productionmainc92b189ce4095a3b2a00049cc5cb400ab0e94dcb,healthy119through0133. Reconfirm parent at release. Do not take unrelated local edits.

Exact source allowlist:

1. src/modules/journal/server/demo/packs/august-2026-red-revision-v11.json — new file, two revised trades, same four execution keys.
2. src/modules/journal/server/demo/journal-demo-red-revision.ts — new append-only correction and note revision helper.
3. src/modules/journal/server/demo/journal-demo-august-pack.ts — whole updated file: preserve inner immutablev10 manifest/batch, wrap withv11manifest, materialize missing originals only, append corrections, regenerate saved Analyzer. Existingv10 refresh regenerates onlytwo changed Analyzer trades; older upgrades regenerate all fee-corrected Analyzer facts.
4. src/modules/journal/server/demo/journal-demo-current-version.ts — v11UUID a2703b8c-41a7-48ac-8a1c-62f7695ed6f1.
5. src/modules/journal/server/demo/journal-demo-canonical-fact-materializer.ts — ONLY pin10 to d4944b87-5098-4754-a1c2-39c638c9d77c and add11:CURRENT. Keep production Session Tracker wording, not local Daily Trade Tracker drift.
6. src/modules/journal/server/demo/journal-demo-materializer.ts — ONLY allowEmpty for packVersion11 AND its exact current UUID in upgrade application validation; retain existingversion3exception and initial-seed nonempty validation.
7. This handoff, approved proposal, and new relevant status paragraphs in demo-trade-data-plan.md/demo-trade-data-progress.md only.

No migration/manifest/schema/0132 change is required. Existingv10 account adds zero executions and zero new batch, appends four execution versions and two note revisions, rebuilds derived chains, records onev11application with zero new mappings. Previous immutable application mappings and versions remain. Its expected version count is1632 from1628. Older/new accounts use unchanged v10 batch of missing originals under0132 and then corrections atomically; v10manifest registration uses originalfullsource. Initialv11 provenance maps correctedcurrentversions and all817executionkeys. No v10JSON is edited or republished under changed contents.

Previous four facts must exactly match known original time/price/quantity/side before correction. Feehelper supplies scoped Demo-only mappings and checks lifecycle; new-account scope is created inside the same transaction. All four corrections share the outer immediate transaction, so any failure rolls back versions, notes, analyses and application marker. Updated sourceTimestampText follows actual new NY execution time. Instrument, fees, order key, rules/tags and unrelated notes stay unchanged. Both owner opt-outs preserved. Existingv11application skips repeat processing.

## Source review and pending live acceptance

Saved-candle arithmetic and interval search confirmed prices are real stored closes, nonoverlap with other same-ticker trades, volumes support share counts, both new positions under18000initialcost, zero residual shares, zero profitable exits. Source review followed currentVersion/appendVersion and round-trip maintenance APIs, annotation revision API, application zero-mapping contract, and cached Analyzer path. No runtime pass claimed.

After deploy, read-only evidence should verify817accepted/170active/1632versions,exactlyfourv11corrections,onev11application/zero mappings,all817fees-.5 and unchanged FTFT. Verify exact new current time/price/quantity, net/gross/day totals, preserved original versions and owner cleared scopes. Compare a later passive snapshot for duplicate growth. Owner is reviewing in Chrome: do not force reload or control browser until invited. Initialnewv11 runtime and providerusage-before-baseline proof remain separate unavailable cases unless naturally observed. No new Help Center behavior changed.

Coordinator owns Git/push/Railway/health and schema-compatible recovery. Feature task owns source and acceptance. Send final SHA/deployment/health after success; no independent deploy from this task.
