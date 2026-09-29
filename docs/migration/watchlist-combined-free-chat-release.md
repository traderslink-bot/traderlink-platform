# Combined Watchlist source checkpoint

The Coordinator requested one combined release, not a merge of divergent feature histories.

- Platform parent: `daaeb615a64cfa796a74f8038b94bc53696ffb96` (Free Chat).
- Runtime parent: `127f87df001df3228cbc1e0d841be690e3540d77` (Free Chat plus test expectation correction).
- Platform additions: exact `54bd93322452ffdadcfbe9132421c3da88f9d1ce` display-copy helper and parser wrapper. Sanitization affects displayed prose only; saved evidence, prices, source URLs and dedicated evidence IDs remain intact.
- Runtime additions: exact candle-ID prompt rules from `54bd93322452ffdadcfbe9132421c3da88f9d1ce`, plus exact timeout patch from `58af2830ad4cc0321b51dfcbd7c5231757b76dce`. Extra-high receives 600 seconds when no explicit timeout is configured; other efforts retain 180 seconds. Explicit timeout overrides remain respected. Each request snapshots its deadline for consistent timing/audit reporting.
- Free Chat code, migration0149 and its registration remain unchanged from the parent commits.

Focused verification: patch application against exact parents, TypeScript syntax diagnostics for the four added/changed source files, display-copy examples and evidence/price preservation, extra-high/high/explicit timeout contracts and per-request deadline snapshot. No paid AI, webhook calls, browser/server, broad suite, hosted migration or deployment.

Release boundaries: coordinator owns final integration/build and any owner-authorized release. Migration0149 remains unapplied by this task. Preserve its receipt tables/manifest identity on rollback. These source checks do not prove live AI completion or Discord receipt.
