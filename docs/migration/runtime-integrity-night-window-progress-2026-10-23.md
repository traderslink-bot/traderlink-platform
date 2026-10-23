# Runtime integrity night window — October 23, 2026

Status: source candidate prepared against production `e49bc3d3`; not yet published or deployed.

## Owner approval and intent

The owner approved a speed fix that does not recreate last month's high Railway bill. The current 6.3 GB live SQLite database's background whole-file check has timed out at 120 seconds; overlapping requests have taken 47–51 seconds. Repeated retries roughly every 22–25 minutes can create both latency and compute/I/O charges. The separate Watchlist navigation improvement is already live; this is the remaining app-wide stall.

## Narrow change

- Keep connection pragmas, manifest/registry/checksum/schema verification, SQLite foreign-key enforcement on normal connections, fail-closed observed corruption, migration verification and identity-change recovery unchanged.
- Allow one combined full `foreign_key_check` plus `quick_check` attempt per running process in each 03:00–07:00 UTC window. This is 22:00–02:00 Eastern Standard Time or 23:00–03:00 Eastern Daylight Time. A missed window waits until the next one. Timed-out attempts do not retry during market hours.
- Use the same application process, child reader and mounted volume. Add no always-on service, database copy, hosted variable, backup or migration. A successful or failed scan still uses the existing completion, timeout, and corruption-latch semantics.
- Treat nonfinite scheduling deadlines as pending, never as immediate timers. Actual failed-reader exit releases its infinite retry sentinel even if a valid structure refresh advanced the generation; subsequent finite state can reschedule, while corruption and full-verification latches remain authoritative.
- Explicit tradeoff: deep corruption introduced after the last scan may remain undiscovered until a later nightly check. If checks repeatedly time out, no completed deep verification is guaranteed; this must be monitored, not described as a successful integrity check.

## Release gate and acceptance

Before any push, verify exact remote parent, no competing Railway writer, the complete candidate allowlist, production's applied migration identities/order/checksums, active deployment, public health and source-compatible rollback. The patch changes no schema. Use the existing single-writer release procedure. After deployment require Active/running on the intended SHA, `/api/platform/health` HTTP 200 and unchanged migration ledger, no daytime scan launch or market-hours request stall, next scheduled scan in the nightly window, and monitored outcome of its first attempt. Do not claim full success merely from a green build or daytime speed sample. If the first nightly check still times out, revise its bounded phase limit or run a separate review; do not enable frequent daytime retries.

## Checks completed so far

- Source patch applied to a temporary Git index based on exact remote main; working checkout/index unchanged.
- `git diff --check` passed; focused TypeScript transpile syntax check reported zero errors.
- No test suite, full build, database access, Railway mutation or deployment yet.
