# Screeners canonical correction follow-up

This follows the owner-directed requirement to use the same confirmed corrections in Moomoo, even when its historical candle differs or omits a corrected minute. It supersedes the earlier exact-native-equivalence admission for this consumer. Shared Charts owns the pure canonical projection, authoritative ledger and provenance contract; Screeners owns the history hook and existing raw broker normalization. Release owns integration and deployment.

The prior POM packet `82f43ead` and 25-path durable consumer packet `f5648dcf` remain frozen, with their original 53/93-test receipts. Continue in the assigned `/home/traderlink/projects/stock-screeners-corrected-sip-20261127` checkout, base `785eb5aff`; this is another incremental source handoff. New artifacts and captured six owned preimages are in `data/screeners-canonical-corrections-20261127/`. No shared files are edited by this author.

## Complete affected-path inventory

- Existing Moomoo history hook maps over emitted native intervals, so it cannot insert a positive corrected minute or a missing corrected interval. It also requires exact native OHLCV equality, contrary to the clarified canonical rule.
- Corrected Daily needs a completed authoritative SIP day witness. An affected native day without that witness stays unavailable. Unrelated native days stay native.
- The hook currently writes `turnover: 0` for reconstructed rows. That represents unknown weighted input as a numeric fact. New canonical positive minutes cannot inherit superseded native turnover. A removal may retain enough authentic unaffected minute turnover to compute the remaining interval's exact turnover.
- Moomoo normalization currently requires turnover for every valid OHLCV row, so simply omitting unknown turnover would discard useful corrected prices and volume.
- The private linked-history codec is a closed projection; it must carry the reviewed correction provenance explicitly and preserve unavailable turnover without leaking arbitrary native diagnostics.
- Existing before/after evidence generation guards, end-labelled native timestamps, raw comparison before broker split conversion, correction hints, bounded background requests/proof caching, owner-scoped cached-result refresh and all source-selection guards remain applicable.

The correction batch will consume the new shared canonical helpers and test minute/interval insertions, differing native observations, removals, unrelated row preservation, Daily witness coverage, provenance, true versus unavailable turnover, split projection, cache progress, and real legacy/neutral private HTTP paths. Ordinary unhinted reads must keep their existing request count. No provider calls, accounts, hosted-data or service changes, deployment or blanket test rerun is authorized by this authoring work.


## Reviewed implementation and compatibility

The consumer now calls Shared Charts' `projectConfirmedRawMinutes`, `projectConfirmedRawDaily`, and `projectConfirmedRawInterval` from frozen Charts `7b9c29ee2b8a24fb1c6984f95cde0e932c1625cd`; Gateway remains `c230a588594c06fc7f0e1c467dadf79184be8e17`. All six supplied shared dependency files match that Charts commit byte-for-byte. Screeners-only changes can apply directly after the installed prior consumer packet; all 25 previous packet postimages match the Charts base.

Confirmed native minute differences are replaced, missing positive minutes/intervals inserted, canceled candles removed, and unrelated native bars retained. Daily uses the stored complete authoritative witness; affected days without it are withheld. Incomplete interval qualification is scoped to that ticker, with explicit pending provenance and preservation of usable peers. Existing raw-to-split projection remains after canonical replacement.

True unaffected minute turnover can be summed after a removal. Positive canonical overrides lack corrected trade-weighted notional in this contract, so their turnover is unavailable, never fabricated as zero, HLC3 or close times volume. The normalizer keeps valid OHLCV usable without turnover. An affected session's later native aggregate cannot overwrite that unavailable/corrected VWAP; fresh live prices and unrelated sessions/tickers continue normally. Initial quote packs with known corrections omit only the affected unqualified aggregate fields.

Linked history carries closed correction provenance through both legacy and neutral paths. Full stored packs retain internal `{source: "alpaca-sip", symbols}` provenance, validated against the actual population; neutral transport uses opaque aliases and restores the internal source before validation. Ordinary Run results retain their existing public contract. No supplier source relabeling, arbitrary diagnostics, new requests on ordinary unhinted reads, roster/interval/budget changes, migration, credentials or config changes are introduced. The established 24 new corrected-bucket native qualifications per request and 2048-entry bounded cache remain.

## Completed source qualification

The coordinated cohort ended `2026-11-28T03:17:57.285724+00:00`: **87 tests / 9 files passed**, ESLint zero errors/warnings, TypeScript nine roots / 778 reachable source files / zero diagnostics. Both collector entries compiled offline; neither was executed. Test time was 6.432 s, lint 3.625 s, types and offline bundling 14.359 s. Child PIDs 589158/589275/589290 exited and owned guards were released. No provider calls, real accounts, hosted mutations or runtime effects.

Cases cover native-divergent corrections; missing 1m/5m/15m insertion; superseding revisions; tombstones and authentic remaining turnover; Daily witness insertion/replacement; partial per-symbol isolation and budget progress; native split basis; legacy/neutral actual loopback HTTP authorization and generation-race behavior; full pack sync/async neutral round-trip, atomic publication and both fixture-owner reads; live quote VWAP guards; and the preserved calendar/8 p.m. closing-snapshot cases. Full native lifecycle, signed-in browser acceptance, installed runtime and live-market freshness/performance are separate Coordinator checks, not claimed here.

The immutable handoff is `data/screeners-canonical-corrections-20261127/screeners-canonical.patch` with its exact allowlist and per-file pre/post manifest. It is Screeners-only against Charts `7b9c29ee`, after the already-installed prior `82f43ead` and `f5648dcf` packets; do not reapply those earlier packets to production. The standalone calendar follow-up document is excluded from this correction packet. Earlier receipts remain unchanged. Coordinator retains commit, installation and release authority. No concrete source-check blocker remains; the corrected weighted-value limitation above is explicit. Help remains deferred under the owner's instruction.
