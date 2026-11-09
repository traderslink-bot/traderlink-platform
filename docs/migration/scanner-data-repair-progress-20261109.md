# Scanner data correction batch — November 9, 2026

Owner authorized fixing identified scanner issues; scanners/charts remain account-restricted testing, Watchlist live path preserved. No new deployment authorized by this checkpoint.

- GPUS absent from all retained production daily universes. Read-only source requests show it only in AMEX category, market cap $49,699,568. Add NYSE American through collection, validation, persistence, audit, chart/PR types and manual resolution, retaining older two-venue uploads.
- Baseline loader formerly discarded all 200 symbols when any symbol had malformed/conflicting bars. Isolate invalid symbol history while still withholding all results on pagination/transport failure. Never use raw/unadjusted price fallback. Fresh production ADGM/ARAY baselines now valid; original intermittent null cause not proven from saved payloads.
- Carry unchanged reviewed chart bootstrap optimization 4c367658; frozen halt candidate bf204 is parent. No schema/flags/service operations.
- Initial 23 tests passed. Added persistence regression fixture initially used an older collection time; corrected fixture and 15 import cases passed. Other 12 tests passed. Focused changed-source lint passed. Immutable final graph tests/types/build and hosted verification remain pending; no final readiness claim.
- Existing halt Help guide correction retained from bf204. Venue documentation: NYSE American is supported alongside Nasdaq and NYSE; market-cap/liquidity thresholds remain unchanged.
