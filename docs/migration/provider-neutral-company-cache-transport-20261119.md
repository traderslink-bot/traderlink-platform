# Company and shared-cache neutral transport

Owner resumed the previously authorized provider-leak/VPS→Railway work after Root's explicit recovery closeout. DO NOT DEPLOY. Recovery and release authority remain separate. Original8d99, QA3,13Scanner, narrowHelp and firstmarket-wire packets remain immutable; these are new source additions/hunks only. No new production/staging/provider/configuration/worker effect is authorized by this source checkpoint.

## Authoritative source boundaries

Root copied only the exact public Company entry script into this assigned worktree: scripts/run-company-data-gateway.mjs,5107B SHA65541ed26e94ba3420c8d0e1a2589dc5af358210dc4f81eedbddb797a18bdeda. Original source remains preserved at5a5c41a7f392a9b1d6b15e7b2363bd6f4a342645; source/runtime/private config were not edited. Receipt: Root operations/company-gateway-public-source-assignment-20261119.json. The entry is new relative to this feature's8d99 HEAD, but its authoritative BEFORE bytes are the supplied5107B source, not an invented replacement.

Root separately assigned the current3067cache producer public source:9ee03701f63bf2b2de30b8f44fb3fc14fdfb20b6 gateway blob5d833ee8030a3feb42b0c334de21d7aae2eba47a/SHA3351d7fcda07b8b0e08e1b350cceed5f037b9af056d4e06eb018b4ace91a8c5e. Read only that and the three explicitly named supporting Git blobs (shared-candle-cache253e22..., scanner-candle-prewarm3be667..., candle-history-budget9f6b0...). Do not copy this older full gateway over the newer ecb3041 gateway or read/copy the private wrapper, roster or keys. The3067 producer update is a separate tiny source hunk against its exact authorized input, retained outside Git for its owning chat/Root to integrate.

## Company behavior

New portable company-data-wire.mjs defines five app-owned routes/resources under traderslink/v1/company and a versioned JSON envelope. Profile facts use semantic fields such as legalName, equityValueMillions, tradableSharesMillions and industry. Supplier-specific field names, unused logos and transport/credential extras are absent. All useful current profile values and financial units remain unchanged.

SEC directory IDs, official accounting namespaces/concepts, units, exact reported amounts and filing references remain facts. Filing rows preserve aligned columns; current issuer submissions and archive submission shards carry distinct envelope tags so Load more does not lose prior filings. Dates are preserved, never guessed. Dynamic financial dictionaries retain valid numbers, dates, missing values and series while excluding transport metadata/diagnostic objects; ordinary Company snapshot projection also applies this protection to existing warm legacy cache entries. Real issuer websites and official filing citations remain available.

The actual existing gateway script retains its private-token authentication, PC profile-only scope, /company-data request/response compatibility, same upstream-keyed cache/in-flight promises,128entry/64MiB cache bounds,16MiB source response bound, existing TTLs/negative cache,2100ms supplier pacing and429pause. Alias requests reach the SAME cache and provider operation; no extra RPC, retry or independent cache is introduced. Next's Company cache key is intentionally unchanged after domain decoding. TRADERLINK_COMPANY_GATEWAY_CONTRACT=traderslink.company.1 is an explicit future consumer rollout gate; default stays legacy. No flag/config was changed.

## Shared candle cache behavior

New portable candle-cache-wire.ts defines /traderslink/v1/market/screening-candles and a typed envelope. Columns are at/first/peak/trough/last/shares/weighted, with numeric rows to avoid repeating field names for every candle. Column order and row width are validated. Optional VWAP stays omitted when absent; zero is never invented. Actual completion status and boundary are preserved, including partial/null coverage.

The separate9ee producer hunk only adds the alias, restores original query names before the unchanged authoritative parser, and encodes its existing cached/read result. It retains the cache fast path, one-miss latch, priority, admission,50symbol/1m/single verified day/completed-minute/history960 semantics. It does not add a cache, provider request, prewarm, timer or subscription. The current3067 runtime and3041gateway remain unchanged.

The own-lane candle-cache-reader consumes the alias only under the existing future market contract gate; default legacy behavior remains. The actual Screeners worker entry also needs to carry that gate into its explicitly constructed environment; its owner was asked for the current authoritative source and other worker-to-Railway publication contracts before editing. Cache request aliases alone do not prove every direct publisher has migrated.

## Applicable qualification

33focused tests/7files PASS. This includes pure profile/metrics/SEC/current+archive filing round trips, ordinary cached Company metadata containment, actual Company entry script native HTTP tests (dummy keys, all provider fetches mocked, ephemeral loopback port), PC/full-token authorization, old/new cache sharing, failed/negative-cache behavior, Company consumer modes/cache reuse, cache codec/worker reads and existing cache-reader regressions. Types14changed/support paths and lint0errors/0warnings PASS.

The exact authorized3067 producer branch was exercised with an injected fake cache/parser: legacy/wire results match, cache fast path performs zero source reads, one miss preserves priority=screeners and its busy latch, requests restore exactly, partial/missingVWAP remain unchanged. This is source-branch qualification, not a full private-wrapper build or a live3067 cutover. Supporting parse/priority code was not modified. No actual provider connection or publication was initiated by these tests.

Native Company fixture children used strict test environments, temporary0600dummy configs and actual source-script execution. Their listeners were forced to ephemeral127.0.0.1ports only; the real3043 service was not opened/replaced. All owned children were stopped/reaped and exact owned temporary directories removed. No real config, broker credential, production DB or owner login was copied into these fixtures.

A maximum synthetic50×960cache batch exposed100–160ms conversion overhead in the first object-based draft. Switched the new unreleased cache resource to explicit columns/numeric rows. Final payload3,753,285B versus legacy6,201,723B (~39.5% smaller); three local serialize/parse/convert samples77.54/75.75/46.76ms versus legacy85.92/42.76/44.19ms. Peak processRSS229.5MiB versus288.8MiB in the first draft. These are bounded local synthetic conversion observations, not claims about real phone rendering, network speed, concurrent users or whole-universe performance. Source values deep-match throughout.

Retained failures: initial new Company schema punctuation error blocked three suites before native execution; corrected and all applicable cases passed. The compact cache's first type gate flagged a captured unknown-property narrowing; changed to a local constant without runtime behavior change, then types/lint passed. No source error was worked around by relaxing provider/access guards. Earlier327tests and real-market replay receipts remain preserved and were not blanket repeated.

## Outstanding completion boundaries

Options authoritative public source/ownership reply is pending. Screeners owner was asked to confirm current cache consumer/entry preimages, gate propagation and any direct worker→Railway publish DTOs; Watchlist owner was asked to inventory its corresponding private publisher hops, without runtime/test effects. Do not strip source/revision/provenance fields blindly: real names must remain internally/Admin while opaque transport context still rejects stale/cross-provider data.

Root owns source preservation and reviewed integration. Current packets are source-only and held. No deployment, service restart, environment change, migration, provider switch, new account, hosted publication or arbitrary cleanup. Do not claim all VPS traffic is neutral before the outstanding current-source integrations and final applicable qualification are complete.
