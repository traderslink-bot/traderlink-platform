# Watchlist AI candle provenance — immutable runtime handoff

Owner requested Alpaca QA before the scanner release. Coordinator delegated this bounded exact-runtime compatibility repair. This handoff authorizes no independent hosted action by the feature worker. Canonical runtime worktree and index were not modified.

## Exact source boundary

Runtime parent: `14748d4fd18a55623ad6cbe9c378afeee3ba5139`.

Patch: [three-source runtime patch](alpaca-watchlist-ai-provenance-runtime.patch).

Patch SHA-256: `591b4e13bf77519695811eac804a614f3ad1d6c7d4d5ae7ce43389f8032ea01a`.

| Runtime path | Exact parent SHA-256 | Patched SHA-256 |
| --- | --- | --- |
| `src/lib/market-data/platform-moomoo-ai-read-candle-loader.ts` | `bfb7df824e2e7845319cbb459a5931c8716a930b5de05f10628fa66e0eb51024` | `09077c409e47d9878393337ecb29a930f7ff7e444ffa4dc95013ef5f511473af` |
| `src/lib/market-data/selectable-same-day-candle-service.ts` | `795a201e526d302aeda0bb419be259697f21325b0edc6e9f9a56172df45bb6f0` | `f55f4548dfd1505e8a4230cc876e99c8fa400c93d4ee42d544fe693c3a9e9e90` |
| `src/lib/monitoring/manual-watchlist-runtime-manager.ts` | `ea268160bcd9a1837837a82f3c72f063632715a351b87e30b15717d3e03ed13c` | `24831718c470001d17131d84840344300fcdcb373cc3f97ef7e4dbf41f219822` |

## Demonstrated failure and correction

The live Platform candle bridge already fetches Alpaca data but reports `moomoo_open_api`. Correcting only that field would break the exact installed runtime's strict raw loader. The raw loader also feeds the AI manager directly, independently of the selected same-day service, and the manager labels its returned candles as Moomoo. Selecting Alpaca therefore does not remove this dependency.

The patch adds an additive `provider?: "moomoo" | "alpaca"` to the existing candle-window contract. Real bridge results always include it, derived only from the two explicitly accepted response identities. Unrecognized or absent wire identities still fail closed. Existing injected Moomoo loaders that omit the new additive field retain their established semantics.

The AI manager uses the returned identity for current-session provenance and the existing combined current/completed-session description. It leaves candle values, aggregation, levels and AI calculations unchanged. Bridge errors use neutral Platform wording while retaining their existing typed failure class/codes.

The selected Moomoo service explicitly refuses an Alpaca window before returning a Moomoo response. Its existing Yahoo fallback and diagnostics remain intact. An Alpaca payload is never relabeled Moomoo. No provider selector, environment flag or scheduler change is included.

## Reproducible offline verification

From the assigned Platform workspace:

```sh
node src/scripts/verify-alpaca-watchlist-ai-provenance.cjs
```

The verifier reads the three exact parent blobs through Git, asserts every patch hunk against those bytes in memory, and executes the actual patched loader/service and the actual full extracted AI context method with unrelated transports/calculations stubbed. **56 assertions pass**. It first reproduces the baseline Alpaca rejection and incorrect AI context label. It then checks truthful Alpaca and preserved Moomoo identities, values/millisecond timestamps, completed five-minute aggregation, truthful early-session provenance before a five-minute candle exists, combined historical provenance, rejected unknown identities/invalid OHLC/future/conflicting bars/empty coverage, typed unavailable coverage, strict Moomoo mismatch/fallback and matching-source diagnostics.

No network, real AI generation, Discord/notification send, source-checkout write, provider selection change, service restart, deployment or hosted data mutation occurs. Focused verifier lint passes after correcting a local helper variable name. This is contract verification, not a full canonical runtime build or hosted acceptance.

## Coordinator integration and release sequence

1. Verify these exact parent fingerprints and reconcile rather than overwriting newer canonical source.
2. Apply the three runtime changes to the Coordinator's disposable exact-parent candidate; integrate or run the accompanying synthetic proof and applicable canonical tests/type/build. Preserve unrelated runtime work and data.
3. Verify both raw-loader wiring paths, strict Moomoo selection and AI source metadata. Existing production selection remains Alpaca.
4. Deploy and qualify compatible runtime first under the existing single-writer release procedure. Do not generate real AI or notifications for verification.
5. Only then include the Platform candle-route metadata correction from feature checkpoint `69cbddb3cdc596113be13610df5897c37516ff6c` in the scanner release candidate.
6. Recheck authenticated runtime status, provider identity, real read-only Platform candle bridge and both health endpoints. A rollback of the compatible runtime must preserve support for the Platform wire identity currently deployed.

Unfinished chart work remains excluded. The scanner integration must preserve the live High Drops source; stale feature copies are not the release base. See [overall QA ledger](alpaca-scanner-release-qa-20261108.md).
