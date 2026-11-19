# Account-erasure production repair — November 19, 2026

Coordinator-assigned workspace: `/home/traderlink/projects/community-erasure-production-repair-20261119`, branch `codex/community-erasure-production-repair-20261119`, base `509573dc7f59c35336aae570ca4b7f1583b777d4`. Root owns Git, integration and any release decision. Preserve the old Core checkout and all frozen evidence. No production actions, retries, TTL changes, grants, migration registration, Whop or preview changes by this worker.

## Actual finding

Root read-only receipt `community210-actual-ordinary-erasure-outcome-readonly-20261119.json`, SHA-256 `dd42b101bfca874553653e4d1618ad4177220f1c1cbdde87512d4fe6aa445b20`, confirms the attempted ordinary deletion did not commit. History remains accepted, module operation ready, lifecycle settling with the user attached. The account remains active; the recovery operation and object obligations are absent. Both protected accounts remain active. No mutator or retry was used to establish this outcome.

The worker phase lasted 32.496 seconds, exceeding the existing admission deadline. The code checks this deadline before marking logical deletion. The logs do not include the following global foreign-key phase. Existing phase logs print finished from finally even on failure, and worker exceptions are reduced to a generic code: exact failing operation and the remaining time attribution are not yet proven.

## Discovery and next step

- Rooted closure capture took 6.089 seconds. Inspect root scans, foreign-key expansion, deletion work, guard restoration and module erasure hooks before choosing one coherent repair.
- Watchlist ticker writes already use zero synchronous busy wait and asynchronous retry. Their SQLITE_BUSY alone does not explain the event-loop stall.
- Login-mail and notification jobs use synchronous 5-second SQLite waits on the main thread; concurrent claims during the long erasure transaction are a separate responsiveness concern. Preserve delivery receipts and uncertain-outcome rules when correcting contention.
- Obtain existing full-verifier table-count metadata and source/index query evidence without copying or scanning production business data.
- No native suite or build while the Community browser batch owns the shared resource slot. Meaningful synthetic regression tests will be authored with the repair and run once the Coordinator clears the slot.

No application source has changed yet. No source/catalog approval is claimed for a future correction. Help Center impact will be checked against the final behavior.

## Verified source correction checkpoint

Seven runtime files now contain the bounded correction: authenticated pending-command readmission before Stripe preflight; safe stage outcome/category diagnostics; new timer-pass deferral through the existing actual-exit worker slot. Login-mail and remote notification loops check before each additional claim, while allowing the previously started delivery to complete its receipt. Scanners, ingestion, market data, configured worker flags, ordinary SQLite pragmas, admission TTL, signatures, profile generation and migrations are unchanged. In-flight finalizers and arbitrary concurrent user mutations are not converted into nonblocking SQLite operations by this slice.

Four focused files pass eight tests. The new source-aware native control confirms the original509 sequencing defect, and five corrected-source native cases pass: normal authenticated expired-operation recovery with the original receipt; revoked-session refusal; changed-profile-generation refusal; paid-obligation hold; original synthetic effect-claim bytes/deadline/epoch preservation under the existing native readmission primitive. Both native runs use SQLite3.53.0/better-sqlite3 12.9.0 and 437 pinned current source inputs, new ephemeral fixture keys/catalog/database, and zero network calls. These establish local synthetic behavior, not production admission or a resolved real-request performance result.

Initial native harness failures are preserved: a relative evidence output path after fixture chdir, and an invalid assertion that the paid-hold setup necessarily captures Core claims. Neither failure was labeled a source pass. The corrected producer uses an absolute output path and a separate explicit synthetic original-effect claim for preservation verification.

Native canonical-schema FK plans also prove that execution deletion scans the analysis-pattern and event-snapshot child tables without leading execution indexes. The exact production counts supplied by Root are 817 target executions and global child populations36,542/29,750. The generic empty-composite-delete scan hypothesis was tested and rejected. A finite synthetic comparison is running to separate cache effects from two candidate indexes; no migration descriptor, registration or production cache change has been authored.

The existing Account help guide explicitly tells members to contact support before retrying an unconfirmed outcome. This repair preserves that guidance and visible behavior; no Help Center wording change is needed.

## Final local checkpoint and open integration gates

The eleven owned runtime/test files pass targeted ESLint with no errors or warnings and strict TypeScript across1,468 source/declaration files with zero diagnostics. The first narrow TypeScript harness omitted existing repository ambient declarations; that failed result is preserved, and the corrected harness includes `src/types/*.d.ts` without changing dependencies or source. No new full application build or actual worker-package launch was run; Root owns the combined integration checkpoint.

The finite benchmark retains native FK enforcement and validates the resulting FK state and unrelated child counts for every variant. It reproduces roughly15-second execution deletion with explicit2,000KiB cache, roughly14-second deletion with65,536KiB cache, and about1ms with two leading execution indexes. Candidate index build took48.5ms and added5,300,224 B-tree bytes in the174,907,392-byte synthetic database. These are local fixture measurements with uncontrolled OS storage cache, exact canonical child DDL/indexes, minimal parent keys, and1KiB artificial snapshot JSON; they are not production timing or migration-capacity acceptance. Dynamic VM-step counts are not exposed by the locked native API; only actual static EXPLAIN instructions/plans are recorded.

A necessary correction was made before drawing a cache conclusion: the qualified native driver's default is16,000KiB, not upstream SQLite's2,000KiB. The additional isolated default-cache measurement asserts this real native default and takes17.22/16.06 seconds on fresh/same handles. Initial hosted compile metadata also reports DEFAULT_CACHE_SIZE=-16000; Root must confirm the current image separately. Larger cache tuning is not proposed. No source cache policy changed. The index proposal is concrete documentation only, with no migration identifier, execution order, schema registration or hosted DDL. A new index schema would require genuine new canonical descriptor/profile/catalog/native applicability/release review; existing strict210 evidence cannot be relabeled211.

Local repair slice is ready for independent technical review and Root integration. The actual production erasure-performance incident is still OPEN. No actual post-repair HTTP deletion, deployed-worker result, new catalog admission or performance success is claimed. Frozen handoff provides exact source preimages/postimages and tests; Root retains the unresolved structural decision and every release/live follow-up step.

## Coordinator scope correction — frozen review v2

Root identified one unapproved guard in the first review packet: the reverse-split worker was also deferred during erasure. The current source restores its exact original `if (reverseSplitRunning) return` condition. All approved mail, notification and analyzer changes remain. The affected background-timer regression now runs reverse splits and proves that their normal10-second cadence continues while the erasure slot blocks new approved timer passes, including after a completion message and before actual worker exit. This one affected case passes; the two affected files pass lint. Untouched tests/native suites were not rerun. All437 source inputs actually consumed by the successful native regression remain byte-identical, as recorded in the v2 input-equivalence receipt. Previous strict transitive type validation remains prior-slice evidence; the Coordinator owns the final combined checkpoint.

Root's current immutable image12be native-only probe at10:37:27UTC confirms SQLite3.53.0 and defaultcache_size=-16000/DEFAULT_CACHE_SIZE=-16000 without opening the production database. Root evidence SHA-256 `504846499d1ca8e6961f73c337f10845d0e1102991a22aad0772d3eaa755f74c` closes the previously pending current-image cache confirmation. Synthetic default-cache benchmark figures remain17.22/16.06 seconds; no cache policy change is proposed.

Frozen review v1 and all pinned evidence are preserved unchanged and are superseded by v2 for source review; the v1 scope finding was never production acceptance. No migration, production request, Git publication or deployment was performed by Core.
