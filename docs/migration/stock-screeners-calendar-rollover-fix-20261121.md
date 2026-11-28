# Screeners calendar rollover correction

The owner requested fixing the calendar bug, verifying updates through the normal
8 p.m. Eastern close and retention of the final post-market snapshot, and sending
the fix to the Coordinator. This is a source handoff; deployment and worker
installation remain Coordinator operations.

## Source and change

The Coordinator assigned the existing `stock-screeners-production` checkout on
`codex/scanner-calendar-current4783-20261121`, base
`4783edd994cb23c1d57447df19bddf7b6fe1765a`. The assigned four production files
are the live entry, standalone collector, snapshot collector and market-pack
collector. Supporting parser, publisher, store and service files are read-only.
The older mixed Admin workspace and frozen provider packets were not edited.

The worker caches a calendar by Eastern date but formerly recomputed its
validation range from the current UTC date. At midnight UTC (7 p.m. Eastern in
winter), the lower bound advanced while the saved calendar could still contain
its original first day. The unchanged strict parser then rejected that day.

Both collectors now retain the original `{start, end}` with the fetched calendar.
The live-session parser, market-pack collector and Moomoo initial quote pack use
that same range. The market-pack function accepts it as an optional internal
argument; direct callers without a saved calendar keep their existing behavior.
Provider request dates, polling intervals, cache cadence, budgets, stock universe,
session times, strict calendar validation and private neutral transports are
unchanged. No schema migration, new service or extra UTC-rollover request is
needed. The final five-minute bar still respects the existing one-minute settling
period; the tests distinguish 8:00:59 p.m. from 8:01 p.m.

## Verification

One coordinated cohort ran on November 21, 2026 from 18:59:40 to 18:59:54 UTC,
after actual Shared case closure. The canonical common and QA guards were held
through all children. Initial available memory was 7,982,342,144 bytes with zero
current memory pressure. No live provider, hosted account, production database,
configuration, browser, worker or service was changed.

- Eight focused Vitest files: **47 tests passed** in 7.595 seconds.
- ESLint on the four changed production files and new test: **zero errors or
  warnings**, 2.274 seconds.
- TypeScript over five roots and 409 reachable source files: **zero diagnostics**.
- Both current collector entries compiled offline; neither bundle was executed.
  Types and compilation took 4.126 seconds.

The eight new regression cases cover winter and summer UTC rollover with one
calendar/listing fetch, strict reproduction of the former parser failure,
continued price/cutoff advancement, closing-bar settlement, isolated real
publisher/store/service reads for both fixture owners overnight and through the
weekend, selection of the next premarket session, early close, Moomoo calendar
reuse during ordinary roster refresh, and rejection of out-of-range, duplicate
or malformed calendar rows. Existing adjacent tests cover filters, provider
switching, cache behavior and Moomoo cadence. Test identities and data are local
fixtures; no accounts were created.

The configured test cache lives inside this checkout's operational artifact
directory. Borrowed dependencies were read-only. The isolated focused test
configuration does not run the unrelated global migration snapshot setup.

Controller 999348 and its direct children 999353, 999540 and 999555 exited. Their
three process groups were empty. The owned QA marker was removed; the canonical
common lock was independently observed free and immediately released. The
manager received the actual handback. Operational reports and exact command
logs are in `data/screeners-calendar-rollover-20261121/`; the independent closure
report hashes to
`46a65eb4ebce8d3850c8ce4a6c6410949f70a498816ea7c1b6ca2fdb5ecb497b`.

## Handoff and remaining runtime check

The immutable patch and manifest in that directory bind every original and
result file to SHA-256 hashes on the assigned base. The patch contains four
production files plus the new regression test; this record is a separate
documentation artifact. Root owns Git integration and any later worker build,
installation or deployment. Applying this source change does not itself update
the installed VPS worker.

The Monday November 23, 9:30 a.m. Eastern follow-up remains scheduled. That is
the separate live-market freshness and Scanner/Chart performance check. The
passing simulated-clock regressions are not represented as market-hours runtime
or installed-worker acceptance.
