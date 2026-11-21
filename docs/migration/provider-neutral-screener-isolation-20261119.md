# Screeners optional-field and peer isolation — held follow-up

The second authoritative Screeners handoff clarifies that seed validation intentionally ignores OHLC: valid time, volume and positive-volume VWAP can form a seed without OHLC. Earlier neutral-codec checks were stricter across the batch. This source-only overlay removes that accidental restriction without changing the seed reader or live worker.

## Boundary behavior

Finite actual OHLC values still round-trip exactly. Missing or unusable OHLC uses null wire slots and decodes as absent facts; it never becomes zero or a guessed price. Invalid time/volume stays unusable so the original consumer makes that symbol partial. A malformed row/series or completion is isolated to its symbol. Null series means unusable history; an empty array remains a complete quiet history only when the actual completion proof says so. Optional weighted price remains actual per-bar VWAP, with missing/invalid values absent and explicit null preserved. Schema/resource/column order and exact source feed validation remain global; a non-SIP source is never relabelled as SIP.

The row/coverage adapter does not decide market eligibility, time ordering, basis, completed-through or seed/live joins. Existing reader checks still enforce those. No additional request, fallback, poll, timer, cache, retry, priority or coverage invention. Valid numerical-row payloads are unchanged. OHLC omission applies only to unusable facts, and this resource is consumed by the existing VWAP seed reader, not chart history.

## Applicable qualification and limits

28 tests/4 files pass: existing wire and seed-reader tests, existing LiveVwapWorker tests, and added authoritative compatibility scenarios. Direct legacy-versus-neutral reads deep-match for one mixed batch containing complete healthy seeds, absent/invalid OHLC, invalid time/volume, malformed rows and malformed per-symbol completion. Healthy OHLC-free seeds remain complete; invalid peer seeds remain partial; quiet complete histories stay usable. Earlier sequential50-symbol/busy/error/reconnect cases also pass. Types7 paths and lint0errors/0warnings pass.

The separate exact9ee producer handler branch replays successfully with injected fake parser/cache, retaining cache fast path, busy latch, screeners priority and partial/missingVWAP. That is limited branch evidence, **not full owned3067 producer build/parser/runtime equivalence acceptance**. Producer patch70a5ebd5eb54e1c25292921850f41a9086ed4b0b408fc0231981410acfa94f35 and resultaff17691ebb28d2d3f1239b9b730c8c9e1fa942f3aaa72a36b143e317e296b05 remain byte-identical and PREPARED for that further qualification. Root was asked to assign its missing public scanner-signal-bars parser dependency; no private wrapper/config requested or copied.

First new check batch had one fixture ticker using an invalid underscore, so the request failed before transport, plus one TypeScript narrowing error after the row type changed. Corrected the fixture symbols and added an explicit optional-number type predicate. Initial failed receipts remain alongside passing receipts. No runtime or eligibility constraint was weakened to accommodate a fixture.

## Preservation and rollout

This four-file overlay follows immutable compatibility packet9dfcb69d72ffa9c7428be18232b9e9d60856eba5b2c7715e365cb3f506e254cd, which itself follows immutable Company/cache packet41550bfca6e0d74956f974af2bef28cac6ae2ee147b39bc44ca5fd7efe5fe420. Per-file before/after vectors and reverse-apply check are retained externally in /tmp/traderlink-provider-screener-isolation-20261119. Earlier packets are unchanged. Root owns Git preservation and additive integration.

Entry environment propagation remains intentionally absent; default/omitted flag stays legacy on active3067. Any future gateway-first rollout/configuration belongs to Root. No sibling source, provider request, hosted write, private credential, service/config/runtime change, migration, deployment, Git index/ref change or active preview. Finite source checks used shared guards and released them normally. DO NOT DEPLOY.
