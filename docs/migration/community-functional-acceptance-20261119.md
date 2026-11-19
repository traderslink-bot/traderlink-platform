# Community functional acceptance — 2026-11-19

Status: exact finite delivery controller implemented and locally verified in the Coordinator-assigned clean lane at base `0111dfdb58c22ba7149f5a499a15682505aba797`; current-image admission, browser workflows and real Discord cases remain pending Coordinator integration.

## Owner-approved outcome

Complete Community functional acceptance covers Alerts, Watchlists, Content, Coaching, Shared Alerts, Paid sandbox behavior and Stats. Discord effects are finite and limited to TradersLink Tests plus the three designated Community test channels in the main TradersLink server. Ordinary member channels, real charges, queue-wide flushes and unrelated data remain excluded.

## Controller correction

The inherited native runner was unreachable for common delivery because `/__private/community-staging-qa/[nonce]` served only the Shared synthetic fixture. Its worker also used `runAvailable(limit: 1)`, which did not bind the selected queue row and could run global pre-loop reconciliation.

The new fixed route `/__private/community-delivery-qa/[nonce]` opens only fixed private files, issues the existing opaque current-source capability and runs the native pipeline with:

- exact queue tuples with table, ID, creation time and a digest of the selected row plus routing/content dependencies;
- an opaque capability bound to the exact native database;
- a sealed guild and channel allowlist;
- per-run request/write/deadline budgets;
- exact common-delivery, publication-action and Shared-delivery ID lists;
- a digest of all excluded nonterminal jobs and Shared parts, rechecked throughout the run and at completion; and
- no dependency on Community Stats settings for delivery-only runs.

Stats and Shared-fixture pipelines retain their Tests-only guild and Stats-setting rules. Normal hosted/background `runAvailable` behavior remains unchanged. Exact mode skips global lifecycle and stale-job recovery and scopes Shared interrupted-part reconciliation, stopped-part cancellation and original-not-confirmed cancellation to selected IDs. Canonical Shared delivery IDs are 32 lowercase hex characters; the old UUID-only admission defect is corrected.

Fresh Discord target verification now reads the channel inventory, roles, bot identity and bot guild member, computes effective View Channel and Send Messages permission from overwrites, and rechecks the stored destination after provider I/O. The main test guild allowance exists only behind the opaque finite capability; ordinary production workers keep the TradersLink Tests-only guard.

## Verification

- `scripts/qa/community-review-delivery.cjs`: 22/22 pass. Covers originals, full Alert text, Watchlists, multipart delivery, revisions, withdrawals/delete parts, definite retry, uncertain no-resend, role/publisher revocation races, destination retargeting, cutoff and exact-job exclusion.
- `community-exact-delivery-selection.test.ts`: 1/1 pass. An unselected stale Shared delivery and sending part remain byte-for-byte unchanged across pre-loop and post-loop processing.
- Shared-owned native migrated-SQLite acceptance in its isolated lane: 8/8 pass; the Shared owner returns that test and evidence separately to the Coordinator.
- Focused ESLint, esbuild parse, whitespace/diff check and full repository TypeScript pass.
- Combined route-containment and exact-selection batch: 29/29 pass after composing the owner-provided Coaching classification and Paid's pinned Whop connect correction. Paid separately verified all eight exact Whop guard cases plus the existing landing tests. No assertion was removed or waived.

No real Discord write, hosted mutation, migration, deployment or preview change occurred in this source checkpoint.

## Fresh destination evidence

Coordinator read-only provider evidence confirms:

- TradersLink Tests `1559172784813514803`, General `1559172786176401410`: bot has View, Send, Embed Links and Read Message History.
- TradersLink `1433570740430573642`: Alerts `1546033958448529508`, Watchlist `1546034056725008385`, Coaching `1546033844468187156`: bot has View, Send and Read Message History; Embed Links was absent at discovery.

Plain content delivery and clickable URLs do not require Embed Links, but link previews do. The Coordinator was asked to use an authorized provider-control lane to add only Embed Links in those three designated test channels, preserve every other overwrite and prove readback with zero unrelated channel changes. Tests General cases are independent of that repair.

## Remaining acceptance sequence

1. Coordinator integrates this allowlisted source batch, which now includes the isolated Coaching containment classification and Paid Whop correction, plus Shared's separately reported native-test evidence.
2. Build and admit the exact current image/database with fresh source, schema, build, artifact, owner session and job-state digests.
3. Run normal UI creation and permission workflows with both approved accounts; seal the resulting exact jobs.
4. Execute finite original, revision, withdrawal, retry and idempotency cases in the approved channels, retaining provider receipts and excluded-queue proof.
5. Complete member/owner browser flows, Stats observation, Paid sandbox and Shared source/receiver acceptance.
6. Fix discovered defects as one consolidated batch and repeat the full applicable acceptance inventory.

Help Center review: this slice changes only private QA admission and delivery safety. It does not change user-facing Community behavior or instructions, so no Help Center update is required.
