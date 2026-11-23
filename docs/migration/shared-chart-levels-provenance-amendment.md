# Saved Levels provenance for Shared Charts and Scanner

Proposed source amendment for the Levels runtime owner, Scanner, Charts and the Release Coordinator. The Coordinator verified that runtime source `ca04dcf7b6d9b254d54720887a500e63bc828d2d` and the current Platform saved-map contract lack enough provenance for a strict 4H match. The [shared chart progress record](shared-lightweight-chart-progress.md) covers the separate renderer, lookup and replay work.

## Required producer record

Attach an optional versioned provenance record to each future map returned by the authenticated Levels generator. Populate it from the accepted inputs actually delivered to the engine. Keep the fields on the private runtime and Platform server boundary.

| Field | Source and validation |
| --- | --- |
| Instrument and market source | Bind the stable listing identifier, symbol and venue to the actual data request. Include the provider/feed dataset identity used for each input class. |
| Price and session basis | Record the actual adjustment mode and effective corporate-action basis for those prices. Use the same market-data identity definition as the accepted-candle producer. Record exchange-calendar revision, session mode and source frame for each qualifying set of inputs. |
| Accepted input revision | Record a canonical digest of the ordered accepted source inputs including exact UTC intervals, OHLCV and source revisions. Cover calculation inputs and any session reference used to produce the zone. Use the same canonical encoding on retries. Unqualified partial inputs may remain usable by the existing Levels UI under its current rules. |
| Input interval and clock | Capture the actual completed-through and accepted input cutoff for each contributing frame, and the time the calculation completed. A map may confirm evidence only when its qualifying inputs and the persisted map were available before the triggering 4H interval started. |
| Per-zone origins | Carry each eligible zone's true source frame and originating input fact set. Keep Daily and 4H distinct. A mixed-frame cluster requires explicit input attribution before it can qualify as a 4H zone. |
| Publication and revision | The Platform owner-scoped saved-map row establishes the publication time for that saved revision. The read-only projection binds its revision to the row identity, exact stored contents, publication and expiry. |

Use Unix milliseconds on the existing Levels runtime and persistence boundary. Convert to Unix seconds once at the shared chart evidence boundary. The authenticated runtime response establishes origin, and the stored revision binds the exact map bytes and metadata. The producer must return unavailable provenance if the upstream input cannot qualify. Legacy maps keep their existing Levels behavior and remain unavailable for strict pairing.

### Proposed wire example for producer review

This synthetic fragment illustrates the candidate private `chartEvidenceProvenance` field. The IDs and digest below are fixture values. Production values must come from the registered accepted market-data source and preserved zone lineage.

```json
{
  "chartEvidenceProvenance": {
    "version": 1,
    "instrument": { "id": "fixture-instrument-4h", "symbol": "QA", "venue": "XNAS" },
    "calculatedAtMs": 1795012140000,
    "inputs": [
      {
        "id": "regular-4h-1",
        "frame": "4h",
        "datasetId": "fixture-alpaca-sip-series",
        "priceBasisId": "fixture-split-basis-1",
        "calendarRevision": "fixture-calendar-1",
        "sessionMode": "regular",
        "completedThroughMs": 1795011600000,
        "availableAtMs": 1795011900000,
        "acceptedAtMs": 1795011960000,
        "acceptedCutoffMs": 1795011880000,
        "digest": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
      }
    ],
    "zones": [{ "side": "resistance", "index": 0, "inputIds": ["regular-4h-1"] }]
  }
}
```

A zone index refers to the final saved side list after clustering, sorting and projection. Carry the originating input IDs through those stages. The first version supports actual generator frames `daily` and `4h`. `completedThroughMs` is the exclusive verified contiguous market coverage boundary. `availableAtMs` is the actual observation of the exact input revision. `acceptedAtMs` is actual acceptance of that input revision. `acceptedCutoffMs` is the immutable as-of boundary applied to select the inputs. Require both `completedThroughMs ≤ acceptedCutoffMs ≤ acceptedAtMs` and `completedThroughMs ≤ availableAtMs ≤ acceptedAtMs ≤ calculatedAtMs`. Availability and cutoff can occur in either order. For example, a cached revision can already be available at the selected cutoff.

Use UTF-8 encoding of compact JavaScript `JSON.stringify` on the fixed tuple `["traderlink.levels-input.v1", [instrument.id, instrument.symbol, instrument.venue], frame, datasetId, priceBasisId, calendarRevision, sessionMode, completedThroughMs, acceptedCutoffMs, rows]`. Each row is `[startMs, endMs, open, high, low, close, volume]` from the exact normalized input used by calculation. Require ascending input times and reject duplicates, reordered rows and unsupported inputs. Use integer UTC milliseconds, finite OHLCV without decimal rounding and normalize negative zero to zero. Use SHA-256 lowercase hex. Keep observation and acceptance clocks outside the digest. The same accepted tuple and cutoff produce the same digest on retry. The Levels owner verified timestamp and OHLCV are the only current per-bar inputs to this path.

Bind each `input.id` to an immutable revision issued by the authoritative accepted-series publisher and propagated to both consumers. Reuse the ID on retry and supersede it when that publisher accepts a correction. Match both ID and digest. A correction that leaves the tuple unchanged can preserve the digest while changing the accepted revision. A Levels-local request ID or a hash of the displayed zone cannot establish this identity. If the source already provides a genuine equivalent immutable revision, the publisher can preserve it. Use unavailable when the source cannot establish accepted identity.

The stored row supplies publication and expiry for the saved revision. Require the input IDs referenced by a zone to exist. Preserve mixed-source attribution and withhold 4H rule eligibility if a zone lacks one unambiguous qualified 4H origin. Omit the optional envelope if the source cannot establish its facts. The Platform validator accepts only this version for chart consumption and keeps the normal Levels map available when the private evidence is unavailable.

## Bounded source ownership

| Owner | Candidate spans |
| --- | --- |
| Levels runtime owner | At `ca04dcf7`, trace accepted input metadata through `src/lib/market-data/{candle-types,alpaca-runtime-providers,traderslink-gateway-wire}.ts`. Bind provenance at the existing map construction in `src/runtime/stock-levels-generator.ts`. In `src/lib/levels/{level-types,level-engine}.ts`, preserve per-zone source identity where required to distinguish actual Daily and 4H inputs. Keep calculation rules and existing generator access. Confirm exact spans against the assigned source before applying changes. |
| Release Coordinator and Levels Platform editor | Register the optional field in `src/modules/stock-levels/stock-levels-contract.ts` and its authenticated runtime response validation in `src/modules/stock-levels/server/stock-levels-runtime-client.ts`. Preserve the private record inside the existing `map_json` and retain the existing browser Levels projection allowlist, quota, generation, refresh and expiry behavior. The initial contract uses the existing JSON envelope. |
| Charts | Consume qualified metadata through the existing new `src/modules/market-data/server/chart-evidence-levels-read.ts` and `src/modules/market-data/chart-evidence/levels.ts` seams. Keep exact owner/symbol/map/revision selection and zero generation, quota, prune or touch on chart reads. Do not synthesize identity or clocks from display labels. |
| Scanner | Compare source basis against the authoritative completed Alpaca series, require exact qualified 4H input and a zone known by trigger start, then register the owner/workspace-scoped reference. Resolve the same scope and exact map/candle revisions for both UI consumers. |

An accepted source correction creates a new input digest and calculation revision where it changes the map. Refresh under a saved map ID changes its stored revision. Existing references may continue to resolve only while the exact prior authorized candle and map revisions remain available under the approved retention contract. The initial saved-map store can replace a revision in place. When that happens, references to the superseded revision become unavailable and the current chart continues showing authorized base data. Access or generation changes also invalidate affected matches.

## Acceptance order

1. Compose one isolated candidate from the exact Charts and Scanner source receipts. Seed a verified regular-only 4H fixture and an owner-scoped saved map with separately attributed Daily and 4H zones. Drive Scanner evaluation, inline chart and the standalone handoff with the same inputs. Compare the full UTC interval and OHLCV, candle and event revisions, map and zone revisions, exact bounds and source labels. Confirm zero early confirmation, zero generation or Levels writes for chart inspection, no cross-owner reuse, and correct behavior for corrected, expired, missing and incompatible inputs.
2. On the Levels owner’s future source, qualify the authoritative provenance from the actual generator and accepted candle path. Check active and thin symbols, early close, split correction, late accepted inputs, same-ID refresh and missing provenance. Record the accepted source revisions and the receipt for the combined producer/consumer contract. Runtime activation and release use the Coordinator’s separate lane.
3. After the identical-candle-and-level browser replay is clean, run the master plan’s physical iPhone Safari and Android Chrome flow with Scanner leading. Charts verifies marker and zone agreement, timeframe switching, chart handoff latency and usability on that same candidate.
