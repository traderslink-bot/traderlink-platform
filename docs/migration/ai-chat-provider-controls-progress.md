# AI Chat provider controls progress

## Implemented locally: provider-control foundation

- Migration `0030_coach_ai_chat_provider_controls` adds a separate singleton Chat provider setting seeded from the existing review setting, four disabled feature controls, and immutable Chat generation-attempt reservations.
- Chat remains unavailable until an owner saves paired verified Chat prices, platform caps, and matching account caps. No default limits or prices were invented.
- Reservations use the complete serialized provider input (system instruction, bounded conversation/context, tools/results, and user message) without retaining it, then use its UTF-8 byte length as the conservative input-token bound. A bounded output limit, exact decimal cost snapshots, and atomic Eastern-calendar-day account/platform checks apply.
- The reservation result returns its immutable provider, model, and price snapshot so later settings changes cannot alter the provider call or receipt associated with that attempt.
- An idempotency replay is accepted only for the same conversation and assistant message. Account controls belong to the account across authorized workspace members, not the person who first configured them.
- Completed and failed-with-usage attempt records read the immutable Chat receipt and fail closed if its usage or cost exceeds the immutable reservation; provider-started failures without usage retain their conservative reservation. No prompt, answer, factual package, credential, or Journal fact is written by this slice.
- The existing server cost repository now exposes feature/model/account aggregation including Chat receipts. There is no route, UI, provider adapter, credential lookup, or provider call in this slice.

## Owner-only administration slice

- Journal Administration's existing `/admin/journal/ai-reviews` page now has a separate AI Chat section. It reports only whether the server credential is configured, keeps Chat model/prices separate from AI Review settings, exposes the platform enablement and required daily request/token/estimated-spend caps, and supports account controls through opaque Journal account references.
- Chat administration mutations use the established `JournalAdminScope` directly. They do not construct or impersonate a trader `WorkspaceAccessScope`; account control rows retain the account owner's existing identity/workspace values only because the accepted 0030 table contract requires those foreign keys.
- The page uses the existing Chat-inclusive cost aggregation repository for request, token, estimated-cost, failed and blocked totals. When the database is still at the pre-0029/0030 checkpoint, the Chat section stays honestly unavailable and the existing AI Review settings remain readable.
- No credential value, prompt, answer, private Journal fact, raw account identifier or environment-file value is accepted, displayed, persisted or logged by this slice.

## Verification boundary

- Focused migration and repository tests cover defaults, enablement guards, complete provider-envelope byte bounds, cap blocking, Eastern DST rollover, exact-message idempotency, shared-workspace account controls, configuration snapshots, over-reservation receipt rejection, started failures, scope denial, safe errors, and Chat aggregation.
- Applying migration `0030` to the private development database remains intentionally deferred to the coordinating migration checkpoint.
