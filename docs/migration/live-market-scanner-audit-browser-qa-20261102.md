# Scanner audit browser QA continuation — 2026-11-02

Current result: final visual correction batch verified; 12 browser cases and all
96 scanner tests pass. Production and real-account acceptance remain separate.

Candidate: `codex/scanner-audit-qa-complete-20261102` at
`10fe08449b446ef5beae684e2ef52d0a8e9e4418`.

Related source acceptance: [Candidate QA](live-market-scanner-audit-qa-20261102.md).
Controlling scope: [Audit system plan](live-market-scanner-audit-system-plan.md),
Slices 0–2 only. Production remains unchanged.

## Dependency repair verification

The assigned `/home/traderlink/projects/admin-watchlist` directory remains on
`migration/admin-watchlist-20261019`, HEAD
`c613c1b83a126948c3ee10b3ff7cd41c1a5d5b8e`, with 770 pre-existing dirty/untracked
entries and an empty staging index. It is not the candidate checkout. No branch
switch, reset, stash, dependency install or application-tree copy was performed.

The dependency repair changed installed packages, not the working manifests.
Both existing working manifest mtimes are September 29, before the November 2
repair. Existing diffs include unrelated `twitter-text` work and lockfile
changes; they have not been reverted, committed into the candidate, or otherwise
absorbed. Their hashes were unchanged on repeated checks:

| Manifest | Preserved working SHA-256 | Exact candidate SHA-256 |
| --- | --- | --- |
| package.json | c39dca3cee644c482a1acdb2c089982f5f6c1843cfe99fc2d11b7235c81d61fc | 8702b00d8eeb8e422144c33e028b364a13a6c9fcc4cede962f89c8fcfa83fbb1 |
| package-lock.json | 76e6b8885a2c36eb147fc4a509e4371dfe1d54ed03d48174b2d314bea82d0f0d | 18e69b8c0dcf520321f4e80e39bbc14be8986b6945c72cb82277129b8d28cf59 |

The candidate's build-result commit changes only two documentation files;
neither manifest differs from its parent. Its manifests already declare the
repaired packages. Installed `argon2@0.45.1` and `openid-client@6.8.8` match the
candidate lockfile. Installed `caniuse-lite@1.0.30001820` is newer than locked
`1.0.30001809`; working manifests were not changed to conceal that installed-tree
drift. A pre-repair full dependency-tree hash was not available, so no broader
claim about every installed package is made.

## Initial runtime gate — subsequently resolved

The owner reports the exact candidate production build passed Academy
validation, webpack, TypeScript, 284 static pages and route generation. That
build is also recorded in the candidate QA document. This continuation has not
repeated or independently reconstructed it.

No exact candidate Next runtime/build path is qualified yet. The audit client
does not exist in the mixed directory's working tree; it is available from the
candidate Git object. Coordinator confirmed the other Scanner source owner is
providing the exact build/BuildID/source and isolation handoff. Do not copy a
different build or start this mixed checkout and call it candidate acceptance.

Coach remains listening on port 3011 and was not stopped or changed. Port 3010
being free is not sufficient authorization to run an unqualified source/data
combination. Coordinator also has a previously queued serialized QA operation;
admit this browser run only after that lane is released.

## Pre-browser correction batch

Source review confirmed and corrected three cases before starting the isolated
browser runtime:

1. An empty latest timeline page can still have `nextBeforeUtc` when the selected
   ticker appears only in older cycles. The UI now exposes **Load earlier
   observations** independently of the current page's point count.
2. Rejection cursors now bind the cycle ID and last symbol. Every later page
   reads the same immutable cycle even when a newer scan is recorded between
   requests.
3. Date, ticker, scanner, session and reason changes now invalidate their
   pending request sequence, clear prior results/cursors and discard late
   responses from the old query.

Focused UI/store tests cover all three corrections. The complete live-scanner
suite passes 96 tests across eight files with one worker and no file
parallelism; targeted ESLint and full repository TypeScript also pass. The
post-correction production build passes Academy validation, webpack, TypeScript,
all 284 static pages and route generation with build ID
`v11FdBJK6xoBBqxKpvo0a`.

Complete the full applicable browser inventory in one discovery batch: real
isolated owner access, non-owner and missing-session denial, all four read-only
APIs, empty/loading/error/partial/degraded states, timeline and rejection
pagination, desktop/mobile layout, keyboard/focus/scroll, and repeated polling.
Use synthetic local evidence only, disabled workers, no broker/provider calls,
no Discord/email/push, and no production or Coach data. Consolidate findings
before one correction batch and one full retest.

The initial gate above is superseded by the browser verification below. No
production activation or owner visual acceptance is implied.


## Completed isolated browser QA and visual correction batch

The original Scanner task supplied an exact-source archive of `d2f06993b` at
`/dev/shm/scanner-audit-browser-runtime` and handed further corrections to this
Watchlist task. The active development runner used isolated synthetic data at
`/home/traderlink/preview-runtime/scanner-audit-qa`, disabled workers/providers
and loopback port 3010. The client SHA-256 matched the candidate before testing:
`6cc14cb8da809cf5533c6cf2bffe461bff8b69dc794e2de54820c78134d6079f`.
The earlier passing production-build artifact was not retained; this was a
qualified exact-source development runtime, not that saved production image.

The first complete functional browser pass passed 12 cases. Screenshot review
then identified three visual issues, corrected together without changing any
API, authorization, audit store, scanner formula, polling or provider behavior:

1. Desktop Session selector could shrink until its label was unreadable. Scanner,
   Session and Reason code now have desktop minimum widths; mobile stays stacked.
2. Mobile table cells wrapped long rejection text into excessively tall rows.
   Audit tables now keep cells on one line inside their existing horizontal
   scrolling container, with a 680px table minimum width.
3. Large storage figures could use compact billion `B` plus byte `B`, producing
   `176BB`. Evidence, control-database and projection figures now explicitly use
   decimal B/KB/MB/GB/TB units. Regression checks include 2.7 KB, 176.1 KB and 6.6 GB.

### Final results

- **96/96 scanner tests passed across eight files**, one worker/no file parallelism.
- **Targeted ESLint passed** for the changed client and its regression test.
- **12/12 isolated browser cases passed again after the UI corrections**, with
  zero uncaught page exceptions. All four real audit API families returned 200
  and private/no-store caching. Daily review displayed the 262 synthetic cycles.
- Sparse AAA history loaded an older observation after a zero-point initial page.
- Rejection pagination displayed all 120 unique rows over three pages.
- Desktop (1365px) and mobile (390px) had no page-level horizontal overflow.
  Final checks also require a readable Session selector, mobile rows no taller
  than 55px, and successful horizontal table scrolling to the Decision column.
- Three successive five-second health polls preserved the entered ticker.
- Initial loading, complete/partial/degraded/missing health, all four API error
  states, and empty data rendered without inventing records. Failure/health
  variants used browser-local response interception, not changes to saved data.
- Delayed nonempty old timeline/rejection responses were discarded after ticker
  or filter changes. A date change discarded its pending daily review.
- Keyboard focus and document scrolling worked. Panels are not expandable, so
  panel expand/collapse is not an applicable control in this version.

The existing cookie-choice dialog initially covered a lower button; the harness
now rejects optional cookies through the real visible control before testing.
No application correction was needed for that dialog. Initial browser-launch
attempts could not find the newer Playwright browser and then encountered a
missing full-Chromium library; qualification reused installed headless shell
1217 without installing anything. The new byte regression initially matched
`KB` adjacent to the next `Bytes` label as `BB`; the assertion was narrowed to
numeric malformed byte units and the full suite then passed. These harness
recoveries are not counted as application passes.

Receipts and reviewed desktop/mobile screenshots:
`/tmp/scanner-audit-browser-8Bfo42/receipt.json`, `desktop.png`, `mobile.png`.
Final browser unit `scanner-audit-browser-qa-20261102e` completed all 12 browser
cases; its overall process exit remained failed because of the overly broad
native assertion described above. Final native unit
`scanner-audit-source-final-20261102` subsequently exited successfully with
96 passes and clean lint. Application code did not change between that browser
pass and the successful native rerun; only the assertion was corrected.

Both units were bounded to 1536 MiB, no swap and one CPU, with all descendants
closed before releasing the common QA lock. The isolated Scanner preview was
then stopped after testing; its synthetic data and source archive were retained.
Coach remains listening on port 3011, untouched. No deployment, push, production
mutation, generation, approval, publication or notification occurred.

After the completed QA, only the ended preview's regenerable
`/dev/shm/scanner-audit-browser-runtime/.next/dev/cache` was removed for shared
resource headroom: 122 files, 300,929,900 bytes, exact non-symlink identity and
zero matching open descriptors verified first. Source, compiled page output,
test evidence and isolated data remain preserved. Next dev can regenerate it.

### Explicit remaining boundaries

The development runner injects its isolated owner identity. Therefore actual
non-owner/missing-session **browser** denial was not exercised in this instance.
The passing route tests cover non-owner and expired/missing-session 404 behavior;
that is not represented as real signed-in account/browser acceptance. No access
rule was weakened to manufacture that result. Owner visual approval remains
separate. Light appearance was not independently browser-tested in this pass;
the screenshots and measurements are Navy Dark.

The full production build and full TypeScript pass cited earlier belong to
`d2f06993b`, before these three small UI changes. The final UI compiled through
the isolated development runtime and passed the updated tests and lint; a new
production build was deliberately not repeated here. Final clean-source build
qualification remains part of any later Coordinator integration/release.

Preservation verification: all **770 original dirty entries** independently
rehashed to their original combined digest
`f92b64fe7e96d4969e3c3731f764d49267a632ef6a27720ab5b39f0b294b961c` before the final
documentation update. The normal staging index remained empty. Both working
manifest hashes in the table above remain unchanged. No dependency install ran
in this continuation. Existing Help scanner-audit guidance was reviewed; these
presentation corrections change no workflow or guide meaning, so no Help edit
was required. The React review retained the existing hooks, request invalidation
and polling behavior; no new fetching dependency or effect was introduced.
