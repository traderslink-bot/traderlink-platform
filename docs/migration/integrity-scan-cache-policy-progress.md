# Integrity scan cache policy

Status: owner-approved implementation candidate; production release not authorized.

Control parent: `f2cc0deb56b700a7595281503dd524ad10955e8d`.

## Corrections

- Preserve full FK and quick-check coverage, phase deadlines, corruption latches,
  schema/identity verification, ordinary-write snapshot completion and cadences.
- After a successful reader result and actual process exit, invoke only the
  fixed Linux helper `/app/bin/traderlink-integrity-cache-release` asynchronously.
- Open the exact database read-only with no symlink following; require regular
  file and captured device/inode match. Advise only complete file pages with
  POSIX_FADV_DONTNEED. No WAL access, checkpoint, explicit sync, truncation,
  database mutation, global cache clearing or constrained container memory.
- Helper has a two-second native alarm, parent-death signal and parent-side
  two-second kill deadline. Scan slot remains occupied until actual helper close.
  Missing/unsupported/failed advice does not invalidate verified integrity.
- Docker compiles the tiny helper using the existing native dependency stage,
  preserving npm dependency caching; copies only the executable into runtime.

Cache advice is shared-inode-wide, not scan-private. Baseline residency capture
cannot reliably identify application-hot pages among retained previous scan
cache; it is not included. This candidate can evict useful clean pages and must
pass authenticated navigation latency acceptance. Kernel success alone is not
proof of reclaimed bytes, sustained savings, or safety under real workload.

## Verification

-13 focused Node lifecycle/WAL checks passed under one second. Covers helper
  success after reader exit, no overlap, deadline/actual close, unavailable and
  failed helper fallback, corruption rejection and schema-change cancellation.
- Native Linux disposable16MiB proof passed under non-root UID1001: residency
  fell16777216 to0 bytes, content hash/identity/size unchanged; wrong inode/device,
  symlink, directory and malformed arguments rejected. Deployment
  `e86f8d03-2ed1-4063-9e2d-6764058b1a89`, image
  `sha256:7c6d9c3a7b18426d85d0339ddcd7e11f2a418e7b7ce12ab4d70f804fa8f0c254`.
  Exact no-volume/no-secret/no-domain proof service was deleted and absence
  verified. Only this disposable fixture was removed; no database/history deleted.
- First proof iteration exposed a PID1-parent guard mistake during review;
  container PID1 is valid and is now allowed. No production deployment occurred.

## Release gates

- [x] Native proof passes; exact temporary helper service removed.
- [ ] Immutable six-path diff/parent/manifest reviewed and preserved.
- [ ] Owner explicitly authorizes production deployment.
- [ ] Hosted build, exact running source and public health/schema140 pass.
- [ ] Full scan and cache-helper exit succeed; exact-file residency and RAM fall
  beyond a restart-only effect; subsequent normal request workload stays healthy.
- [ ] Authenticated representative navigation latency and fresh Moomoo quote
  path pass. Closed-market overnight access does not prove live-session streaming.
- [ ] Revert exact candidate on availability, integrity, quote or latency failure.

Codespaces, Watchlist/provider source, stored history, migrations, configuration
and24GB effective ceiling are outside this patch and remain unchanged.
