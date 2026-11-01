# Existing Cloud findings — correction and QA record

Owner authorized completing all patches before combined QA on 2026-10-31. Goal is active. No new scan, source-system closure, publication or deployment is authorized. Coordinator owns Git writes and resource admission.

Workspace: /home/traderlink/projects/security-journal-admin, branch codex/security-journal-admin-20261031, source base 923b7ba1c13836aa6aab1b325b7061c409f611fe. Production status remains unverified.

## Observations and scope

All 23 source observations remain individually traceable; overlaps share correction code.

| Finding ID | Supplied claim | Status |
| --- | --- | --- |
| csf_06cb27cb36c204bf3a3c6b60 | A revoked configured-owner Discord identity still satisfies the owner check | Local correction verified; deployment pending |
| csf_c2af68837e3567b6599a8fb5 | Stale or superseded Discord evidence still authorizes Journal administration | Local correction verified; deployment pending |
| csf_12770cf2fb0a257f51e5ce69 | Ordinary dashboard members can publish tenant-global Level Analysis facts | Local correction verified; deployment pending |
| csf_21449c0d11e426a41c3f4559 | Untrusted Watchlist runtime HTML executes in the authenticated dashboard origin | Local correction verified; deployment pending |
| csf_917564841ccc720edb138c9e | Workspace members inherit every active Journal account | Local correction verified; deployment pending |
| csf_c9705b65961e51f19e0db53a | Journal upload routes materialize multipart files before size enforcement | Local correction verified; deployment pending |
| csf_247aa9a85ff782e70a4fc421 | Mapping-support CSV parser allows extreme allocation and quadratic profiling | Local correction verified; deployment pending |
| csf_a48c00a35d5dba834fd4ef51 | Journal Administration accepts alternative and stale owner evidence | Local correction verified; deployment pending |
| csf_0efd923559d70b1cd1482bd1 | Member-supplied web-push endpoints create a server-side HTTPS request primitive | Local correction verified; deployment pending |
| csf_c51640d7960e8d1e1ca429b4 | Statement mapping inspection permits memory and CPU amplification within the upload limit | Local correction verified; deployment pending |
| csf_e0ec8a7bb7f4fb9f2ec6d046 | Production recovery links can fall back to a request-derived origin | Local correction verified; deployment pending |
| csf_02cb46257ad8b6cfb2f7bdd4 | Request bodies are fully materialized before authentication or effective size enforcement | Local correction verified; deployment pending |
| csf_c397f9ae9c38f0fc8cb168f1 | Public webhook routes buffer the entire body before enforcing one megabyte | Local correction verified; deployment pending |
| csf_c8c7862ae4d754dd87aa2aa9 | Hosted transfer commits modules independently and can leave partial identity state | Local correction verified; deployment pending |
| csf_f9ea73c41b883b18baa37941 | Scanner parses and expands an unbounded request before authentication | Local correction verified; deployment pending |
| csf_300fd1772783b442bc261f57 | Raw Level Analysis admin diagnostics are readable by ordinary members when enabled | Local correction verified; deployment pending |
| csf_dcd4280397c635a665d7fd34 | Hosted transfer uses target-backup time as proof of source freshness | Local correction verified; deployment pending |
| csf_b550e4e9583a20ff382f5646 | User-supplied Web Push endpoints enable authenticated blind SSRF | Local correction verified; deployment pending |
| csf_f17dde0ad36cf8e0a60e7248 | Revoked Discord membership can remain effective for dashboard authorization | Local correction verified; deployment pending |
| csf_0651bd868f15d46a0de0a46b | Dashboard bearer and OAuth cookies are exposed to every traderslink.pro sibling | Local correction verified; deployment pending |
| csf_2feca09c4196904f147da6b6 | Replayed consented-source downloads return private bytes without a new disclosure audit | Local correction verified; deployment pending |
| csf_72d8940d3cb3d5e0f8b69888 | Developer-package idempotency reuse suppresses audits for changed package revisions | Local correction verified; deployment pending |
| csf_562d5edfa4ce5fc907c8764c | Community watchlist titles are published as unescaped Discord Markdown | Local correction verified; deployment pending |

## Prepared behavior

1. Journal Admin requires active configured Discord identity, configured-guild ownership, fresh evidence, no superseding absence, and the active grant together. Existing refresh UI is retained.
2. Request bodies are bounded by actual streamed bytes before decoding/parsing. Multipart statement bytes retain the 25 MiB file limit with bounded framing allowance. Scanner and Candle Review authenticate before body parsing. Webhook signatures still cover the exact decoded raw UTF-8 body; no provider effects occur during QA.
3. Ordinary workspace members receive no Journal account authority until explicit per-account grants exist, matching the older role-aware contract. Owner/admin account behavior remains.
4. Global Level Analysis ingestion and raw diagnostics require the existing owner-admin gate; the debug flag alone is insufficient.
5. Mapping inspection caps bytes, records, fields, field size and total cells; sections are indexed once and column shapes accumulated without transient whole-column arrays. Failed bounded inspection returns an explicit failure package, never partial profile facts.
6. Push registration and persisted delivery accept only recognized browser-provider HTTPS hosts on default ports. Arbitrary hosts, IP literals and suffix tricks are rejected. No real push requests run during QA. Provider host references: [Google](https://firebase.google.com/docs/cloud-messaging/network-configuration), [Mozilla](https://mozilla-services.github.io/autopush-rs/http.html), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).
7. Production Platform bearer/OAuth cookies use host-only Secure __Host- names. Legacy unprefixed production bearer cookies are not accepted. Login entrypoints redirect to configured canonical auth origin before minting host-bound transactions. Existing users must sign in again after rollout; saved data is preserved. Local HTTP development names remain.
8. Production recovery URLs require trusted configured origin or a validated HTTPS Discord callback. Request authority is never the production fallback.
9. Hosted transfer modules and reconciliation run within one outer transaction. Web execution requires a signed source-backup manifest binding module digests, actual capture times and source identities; target backup time never supplies source freshness. Manifest uses domain-separated HMAC with existing protected Journal key configuration. Missing, unsigned or stale source evidence fails before target backup/write; existing exports need trusted capture evidence. No manifest is synthesized from current time or file mtime.
10. Every source/package disclosure appends its own audit despite reused correlation. Source downloads also update consent events/counts per disclosure. Replay flags remain informational.
11. Confirmed Discord absence suppresses historical snapshots for ordinary access immediately. Snapshot age cannot exceed the established 30-day Platform session lifetime; the separate five-minute admin and configured commercial freshness policies remain distinct. Paid features continue through their own entitlement rules.
12. Community titles are escaped as text before trusted Discord webhook publication; mention pings remain disabled.
13. Owner selected iframe isolation and trusted confirmations. Console responses and iframe attributes enforce an opaque script sandbox; direct network is denied. Trusted parent relays only existing Watchlist API method/path pairs, bounds bodies/responses, blocks redirects and requires confirmation of the immutable rendered request before mutation. Parent DOM access is removed, height is relayed, and pending work is cancelled when a new document initializes. Non-console Runtime proxy responses accept only JSON/plain text. The Help Center guide describes confirmation/cancellation. No separate Runtime repository or hosting configuration is changed.

## Verification contract

All patches must be prepared before any test/build. QA uses only isolated synthetic fixtures, mocked providers and disposable databases. Current state: 107 unique focused cases across 22 files, including actual Chromium sandbox verification, passed across the recorded capped runs. Changed-file ESLint is clean across 77 TypeScript/TSX files after the one affected-file lint correction. Full repository TypeScript and the clean production build subsequently passed on the corrected source; see the final checkpoint below. These results are local verification, not a claim that production is fixed.

After remaining patch choices and frozen file manifest, request Coordinator admission for one-worker/no-file-parallelism focused Vitest, changed-file lint and isolated no-emit TypeScript. Dependencies must be qualified/reused without copying or installing blindly; all caches/output must remain isolated. Build/browser checks occur only if relevant and admitted, one heavy operation at a time. Do not start or alter a preview or hosted environment.

Tests cover the owner gate, body streaming/byte boundaries, endpoint rejection, cookie scoping, source manifest authenticity/freshness, transfer failure rollback, repeated disclosure audits, membership revocation/account roles, mapping limits, and plain Discord rendering. Remaining Watchlist test plan must cover malicious iframe scripts, disallowed relays, parent confirmation/cancellation, direct console navigation and legitimate controls.


## Initial focused QA checkpoint (superseded by final gate results below)

- Six pure suites: 36 passed, 2.28 seconds.
- Fifteen focused/authentication files: all 70 unique cases passed across recorded runs. Admin cases were verified as 18 original passing cases plus two corrected fixture cases; Discord callback cases were verified in targeted groups after secured cookie fixture updates.
- One actual Chromium fixture: passed; parent DOM/storage access denied, direct network denied, unrelated API relay denied, bounded permitted read succeeds, and mutation waits for trusted confirmation. No live application or provider request was made.
- ESLint: all 77 changed/new TypeScript/TSX files checked. One local variable name violated a Next rule; renamed, then only that affected file rechecked successfully. No remaining lint warnings/errors.
- Native SQLite loaded successfully in the capped integration tests. Transfer tests now require the exact injected later-module/reconciliation failures and prove full rollback plus valid completion.
- Initial failures were retained, not hidden: atomicity fixture used invalid status; two admin fixture states violated immutable membership rules; production auth fixtures used legacy cookie names; first browser attempt lost the HOME required by installed library wrapper. These were corrected without weakening security checks.
- Full TypeScript: **not run; waiting for resource admission**. Coordinator calculated that a 2 GiB check alongside the preview's permitted growth would breach the preview's existing host-headroom stop guard. No undersized forced run or preview interruption is authorized.
- Production build: not selected or run. No deployment, push, commit, migration, provider configuration or Cloud finding closure occurred.

Detailed raw logs/resources and previous manifests are preserved in the Coordinator-owned private QA directory. They contain synthetic fixtures only. Maximum process-family RSS from time(1) is distinct from the enforced combined cgroup hard cap; do not describe it as cgroup peak. All execution used one capped operation at a time, fresh resource guards, the assigned source aliases and isolated caches.

At this initial checkpoint, completion remained pending the full TypeScript gate. That gate and the subsequent build are now recorded below.

## Owner-directed further QA rounds

The owner authorized up to four further complete QA rounds, fixing findings after each and stopping at the first clean complete round. Resource waits and partial static checks do not consume a round. Prior 107-case focused/browser and 77-file lint results remain the baseline; no redundant reruns are required for unchanged code.

Round 1 is in progress and awaits Coordinator admission of full repository TypeScript. The preliminary diff whitespace check found one surplus end-of-file blank line in Community Watchlist actions; removed without changing behavior. The repeated diff whitespace check passed. Existing preview/resource/release boundaries remain in effect. Further complete rounds consumed: 0/4.

Round 1 full TypeScript gate ran under Coordinator admission and failed with one TS2352 in the new hosted-transfer atomicity fixture: Object.fromEntries did not preserve the four required module keys. Replaced the unchecked cast with an explicitly typed object containing academy, watchlist, news and affiliate snapshots. Runtime code is unchanged. Initial command: node ./node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false, provider-free environment and 3072 MiB Node heap within a 4 GiB cgroup. Elapsed 65.36s; actual combined cgroup peak 3,229,540,352 bytes; zero high/max/OOM events. Log SHA-256 165073595de6068df1707bd1cdef6b34e0df15a6790398d3719fb5f655708592. Service terminal/cgroup empty and own resource-lock release verified; source/index/Scanner identity unchanged by check. Affected test/lint and full TypeScript rerun await resource admission. Complete rounds remain 0/4 until required gates finish.

## Final local verification checkpoint — 2026-11-01

One further complete QA round is complete, stopping at the first fully clean result as authorized (1/4 complete rounds; no redundant rounds required). Its first TypeScript attempt found the test-fixture typing error above; the correction passed its three affected integration tests and single-file lint, then full TypeScript and the real production build. No surviving security or regression finding was established by the final completion audit. Existing 107 unique focused/browser cases and 77-file lint evidence remain applicable because runtime source is unchanged from that baseline. The only later source change was the explicitly typed test fixture.

- Corrected source preserved by Coordinator at local commit `ce5d6f78d288ef4b037b58529ff1e5ee3c41b8b8`; parent `72e55ee2099e2547098e574591774a7dfdd21dfb` preserves the full security packet on live base `923b7ba1c13836aa6aab1b325b7061c409f611fe`. These are Coordinator preservation commits, not changes to this worker's branch/HEAD/index. Final documentation changes are separate from tested runtime/test bytes.
- Affected atomicity suite: **3/3 passed**, 9.897s; single-file lint **passed**, 2.202s. Cgroup peak 365,297,664 bytes with no high/max/OOM events. Test log SHA-256 `25c68c187516a9d9068b2952f52bda3d146414f96ea9acdf051c33bbf3cac707`.
- Full repository TypeScript: **passed**, 62.394s, `node ./node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`. Cgroup hard cap 4 GiB; actual peak 3,155,795,968 bytes, no high/max/OOM events. Empty diagnostic log SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- Clean production build: **passed**, 238.938s, Academy registry validation followed by `next build --webpack`, including normal Next TypeScript, 282/282 static pages and 425 app-route manifest entries. Build ID `wPLWb9i95B5YB6cjHaIv4`; log SHA-256 `337d267b94b84a8da0dc2e83b43060f6def2feda3bc2b1c1a2c5a3524451b881`. Actual cgroup peak 5,517,090,816 bytes within hard cap 5,905,580,032 bytes; 61,487 soft-high events, zero hard-max/OOM events. Existing 26 Academy archive-markdown warning and Serwist registration notice remain; no build error.
- Build used Coordinator's exact-source export, a minimal bwrap filesystem, cleared environment, read-only installed dependencies/vendor, private tmpfs, and existing public Google font GET/HEAD allowlist preload. This is Node network instrumentation, not a kernel egress firewall. No production database, provider credentials, appserver, workers or migrations were started. Installed Next skips instrumentation registration during `phase-production-build`.
- All tracked export source bytes remained unchanged except intentionally generated `public/sw.js`. `.next` and other generated build output stayed in the export; original working HEAD/index/payload and Scanner preview identity/caps remained unchanged. Each check proved active cgroup caps, reached terminal state, verified an empty cgroup and released only its own inode-identified common lock.
- Final review maps all 23 original observations to the 13 correction groups and their malicious-input plus legitimate-control tests. Relevant compiled admin, console, authentication and upload routes are present. Help Center Watchlist guidance was updated; Journal Admin enforcement already matched its approved plan. No new scan or Cloud finding closure was performed.

Technical implementation/QA handoff is complete; Git integration, exact selected release-tree verification, Railway build/deployment and health checks remain Coordinator-owned. The paused Watchlist feature commit must not enter this security-only runtime tree. Host-only cookie rollout requires signing in again; unsigned or stale source-export evidence intentionally fails closed. No claim is made about resolving unspecified Git errors or production deployment state. No push, deployment or production mutation was performed by this worker.

Private operational evidence: `/tmp/traderlink-security-round1-tsc-20261101.uortpimx` (retained failure), `/tmp/traderlink-security-round1-affected-20261101.cgja9nid`, `/tmp/traderlink-security-round1-tsc-v2-20261101.hfa7m0_b`, `/tmp/traderlink-security-round1-build-20261101.i03g2p0w`. Earlier focused/browser evidence remains in the original private QA directory.
