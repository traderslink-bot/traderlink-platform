# AI Chat provider controls progress

## Implemented locally: provider-control foundation

- Migration `0030_coach_ai_chat_provider_controls` adds a separate singleton Chat provider setting seeded from the existing review setting, four disabled feature controls, and immutable Chat generation-attempt reservations.
- Chat remains unavailable until an owner saves paired verified Chat prices, platform caps, and matching account caps. No default limits or prices were invented.
- Reservations use a UTF-8 input-byte bound, a bounded output limit, exact decimal cost snapshots, atomic Eastern-calendar-day account/platform checks, and safe blocked/idempotent outcomes.
- Completed and failed-with-usage attempt records read the immutable Chat receipt; provider-started failures without usage retain their conservative reservation. No prompt, answer, factual package, credential, or Journal fact is written by this slice.
- The existing server cost repository now exposes feature/model/account aggregation including Chat receipts. There is no route, UI, provider adapter, credential lookup, or provider call in this slice.

## Verification boundary

- Focused migration and repository tests cover defaults, enablement guards, cap blocking, Eastern DST rollover, idempotency, configuration snapshots, actual-usage reconciliation, started failures, scope denial, safe errors, and Chat aggregation.
- Applying migration `0030` to the private development database remains intentionally deferred to the coordinating migration checkpoint.
