# August demo update and existing-session activation

Status: local implementation complete; runtime acceptance and release remain pending. Owner explicitly prohibited publication/production changes.

## Owner-authorized scope

- Append the approved 63 long-only trades across 21 ticker/date pairs and 11 days.
- Exclude MBAI/PFSA Aug 6 and PFSA Aug 11; no replacements.
- Make the separate demo available and current when an already-authenticated user opens the dashboard, without another Discord login.
- Never recreate a demo for a user whose lifecycle is `cleared`.
- Preserve the selected real account, unrelated facts and all prior immutable demo executions.

## Implementation

- Added version 9 with 187 exact, whole-share executions. Prices are actual saved candle closes; modeled fees are $0.50 per execution. Trades have varied entries/adds/partial exits, scenario-specific notes, tags, custom rule outcomes and preset rules effective before the new August dates.
- The addition contains 16 embedded normalized market sessions. Five sessions (RITR/HYFM Aug 3, QNME Aug 4, SCKT/JWEL Aug 10) use the already-saved server candle versions selected by date, symbol and immutable checksum. There is no provider request or Analyzer usage reservation. Missing or altered required evidence aborts the transaction; source receipts are not fabricated.
- The normal Journal materializer and normal Analyzer create isolated demo facts and analysis revisions. Existing accounts append only complete missing trades, using both original and upgrade provenance. Mixed partial prior trades are refused. Already-applied version 9 is a cheap no-op.
- Added authenticated same-origin POST `/api/platform/journal/demo/ensure` and a nonvisual dashboard session component. It refreshes the router after a change, retries unavailable attempts on reconnect/focus, and does not change account-selection cookies. Existing Workspace invitation/explicit activation remains responsible for selecting Demo.
- Deletion lifecycle is checked in dashboard eligibility, the endpoint, the activation service and inside the materialization transaction. The existing explicit activation endpoint also retains its deletion refusal.

## Exact local source totals

| Dataset | Trades | Executions | Gross P/L | Modeled fees | Net P/L |
|---|---:|---:|---:|---:|---:|
| Preserved current source | 104 | 624 | $12,944.25 | $312.00 | $12,632.25 |
| New additions | 63 | 187 | $9,176.62 | $93.50 | $9,083.12 |
| Combined current source | 167 | 811 | $22,120.87 | $405.50 | $21,715.37 |

The older progress record's $12,292.54 is stale relative to this checkout's actual source. The combined net result is 43.43% of the owner's proposed $50,000 starting balance. This is a source calculation, not a live-account balance or production verification. Existing older demo accounts retain their actual historic facts, so reconcile their real baseline separately. No account balance was written.

## Validation performed

- Constructed all 63 trades with exact decimal arithmetic; every trade returns to flat, quantities are positive whole shares, and no execution quantity exceeds its recorded candle volume.
- Calculated gross/net/fees from the actual execution facts, including the preserved source pack.
- Targeted TypeScript syntactic and semantic diagnostics: zero errors across the nine changed/new TS/TSX files.
- No Vitest, other test suite, build, app server, production write or deployment was run.

## Remaining acceptance and preservation

- Database materialization/idempotent replay, runtime Analyzer results, existing-session browser flow and cleared-demo browser flow have not been executed. Local source preparation is not end-to-end acceptance.
- The five server-resident candle versions must remain available with the recorded checksums for eventual materialization. The owner’s candle inventory was read previously; no new hosted operation was performed for this implementation.
- Canonical checkout started at `5018066fbeca3c88500bec4bcdac762b4936c875` on `main`, with substantial unrelated staged/unstaged changes. Coordinator reports production lane at rollback `d313c065`; local HEAD is not a future release parent.
- Preserve the existing dashboard-layout-frame changes. Only the demo imports, eligibility query/property and nonvisual activation component belong to this slice.
- No Help guide in the inspected Help source describes a login-only demo requirement; the existing clear-demo behavior is unchanged. No Help UI copy change was made.
- Release remains on HOLD until the owner explicitly authorizes it and the Coordinator reconciles the exact source parent and allowlist.

## Allowlist

1. `app/api/platform/journal/demo/ensure/route.ts`
2. `app/demo-session-activation.tsx`
3. `app/dashboard-layout-frame.tsx` — demo-only hunks
4. `src/modules/journal/server/demo/journal-demo-current-version.ts`
5. `src/modules/journal/server/demo/journal-demo-august-pack.ts`
6. `src/modules/journal/server/demo/packs/august-2026-additions.json`
7. `src/modules/journal/server/demo/journal-demo-financial-pack-source.ts`
8. `src/modules/journal/server/demo/journal-demo-pack-contract.ts`
9. `src/modules/journal/server/demo/journal-demo-materializer.ts`
10. `src/modules/journal/server/demo/journal-demo-canonical-fact-materializer.ts`
11. This progress record and the demo plan/progress links.

The `.local-logs` generation/analysis scripts are local artifacts and are not part of the release allowlist.
