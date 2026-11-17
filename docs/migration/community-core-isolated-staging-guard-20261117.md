# Core isolated staging worker guard — 2026-11-17

Coordinator requested and confirmed a dedicated compiled staging role. This
source checkpoint grants no hosted changes or production authority.

`disabled_isolated_staging` requires production Node mode, `/app` working
directory, Railway project `49fc9197-07c9-45c7-b528-57d0393c2cca`, environment
`9e079dd4-f3f3-4872-9b00-adbd3000c485`, service
`4d264aca-510c-4f5e-bc28-e89e526b8008`, deployment UUID and exact synthetic path
`/data/community-combined-review-20261117/platform.sqlite`. Production service,
other Runtime service, wrong/missing identity, private-acceptance variables and
production maintenance requests refuse before application side effects.

The staging build controller creates `/app/isolated-staging-artifact.json` as a
regular, non-symlink, single-link, root/current-user owned 0444 file. It includes
kind `traderlink-isolated-staging-artifact-v1`, role `community-combined-review`,
projectId/environmentId/serviceId/databasePath, sourceCommit,
sourceVectorSha256/schemaSha256/buildId. Build ID must match `/app/.next/BUILD_ID`.
All source/schema/build values and SHA-256 of exact artifact bytes must match
`TRADERLINK_PLATFORM_ISOLATED_STAGING_` variables `SOURCE_COMMIT`,
`SOURCE_VECTOR_SHA256`, `SCHEMA_SHA256`, `BUILD_ID`, `ARTIFACT_SHA256`.
Source-vector production excludes generated/self-referential artifacts; the
Coordinator owns that exact vector and deployed metadata comparison.

This guard reads files only. Coordinator's staging entrypoint must run the
actual official initializer only for a fresh absent synthetic database, then
validate complete schema/ledger against the immutable release plan on every
startup before loading the application. Existing databases must never receive
implicit upgrades. The guard does not assert that schema or catalog review
passed and never substitutes environment pins for actual database verification.

Qualified staging instrumentation returns before importing production
maintenance, readiness, erasure recovery or background workers. It relies on the
staging-only entrypoint for database readiness; the normal production Dockerfile
and existing production/private-acceptance instrumentation behavior are
preserved. Direct worker entry guards still resolve to disabled. Explicit
account deletion request workers are a separate reviewed workflow and are not
authorized by this disposition. Paid sandbox/provider selection is separately
owned by Paid and must match the signed v5 review and exact staging target.

Verification: focused mode/startup suite covers exact receipt, each identity and
pin mismatch, altered/rehashed/wrong-role receipts, missing/malformed artifacts,
permissions/symlinks, wrong cwd/build, conflicting maintenance/private mode,
startup refusal, enabled production and private acceptance sequencing. Hosted
startup and combined staging end-to-end remain UNRUN pending release handoff.
No UI changed; Help Center updates are unnecessary.

Local checkpoint: two focused Vitest files, 32/32 tests passed with one worker;
scoped strict TypeScript check for guard and boundary tests passed; ESLint for
both source files and both test files passed; diff whitespace check passed.
Startup test also verifies maintenance/readiness/recovery/background module
factories are not evaluated in qualified staging. No build or hosted action ran.
