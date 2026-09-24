# Optional Watchlist model fallback

Owner approved model and effort selectors, default Off, and at most one fallback when the primary cannot produce a draft. Progress: [record](watchlist-fallback-progress.md).

## Complete scope

- Add Fallback model (Off or the four supported models) and Fallback effort (the six supported efforts) under AI Controls; keep primary selection unchanged. Apply Model saves both selections. Status names the actual fallback or says Off. Explain one extra paid request only on failure.
- Persist optional settings, preserve them on unrelated settings saves, default old files to Off. Do not activate the old unused environment fallback implicitly.
- Freeze model/effort per generation, keep one generation identity with unique primary/fallback request identities. Primary success or a retained owner-review draft never triggers fallback. Missing market data and local audit/persistence failure do not trigger fallback.
- Transport/API failures, incomplete output and unusable output qualify after the primary attempt has been recorded. At most two total provider calls. No recursion or additional correction calls.
- Recheck existing generation switch, active ticker/cycle and configured budget before starting a fallback. These existing generation controls never affect approval of a saved draft.
- Record both attempt models, efforts, outcomes and costs using existing ledgers. Successful payload identifies its actual generating model; its usage remains that response's usage, while daily totals count both attempts.
- Preserve prompts, market packet, formats, review/edit/approval, web-search selection, notifications, defaults and existing saved data. No database migration.
- Update Help. Coordinator handles any separately authorized release.

## QA

Review settings omission/null semantics, successful drafts, no-data errors, failed observer callbacks, frozen settings, distinct request IDs, failed fallback cap and generation/budget recheck. Focused offline mocked requests only; no paid call or notification. Verify primary success=1 request, fallback Off failure=1, fallback success/failure=2, and separate audit/usage records. Hosted save/reload and real API acceptance remain explicit release checks.
