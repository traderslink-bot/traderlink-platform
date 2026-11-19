# Account-backed press-release views and filtered alerts

Owner requested on November 18, 2026 (Toronto): remember sort/filter selections in the account across devices; allow multiple filtered sections to have notifications, including custom market-cap ranges. This extends the earlier unified-feed work. Premium enforcement remains OFF. Coordinator verified the later direct combined-release approval supersedes the older narrow publication hold. Coordinator owns Git/release operations; the latest owner schedule is non-migration batches first and migrations8:15pm–4am Toronto. No worker runs a hosted migration.

## User workflow

- Applying a valid sort/filter selection remembers it against the authenticated Platform user. Another signed-in browser/device opens the same view. The account is authoritative; browser storage is not the cross-device store.
- A Saved views control beside Filters lets the user name, apply, update and delete several views. An explicit Notify about new matching releases option controls each view independently. Names and filter/range summaries identify what each alert covers.
- Settings lists the same filtered alerts and links to Press Releases to edit or create a custom market-cap range. Existing channel choices are preserved and clearly separate. Matching overlapping views/channel choices queue at most one notification per article/device.
- Search, exact tickers, inclusive minimum/exclusive maximum cap, known/unknown cap, news type, summary status and published-date criteria define matches. Read/unread and sort are display choices, not new-article alert criteria. Relative Today/7-day/30-day date choices remain relative after the saved view is reopened; explicit dates remain explicit.
- Saving is visible and recoverable on failure. Empty/invalid ranges do not save. Deleting or disabling a rule stops its queued custom alerts. Enabling a rule does not replay old articles. Device browser permission and subscriptions remain the existing notification prerequisites; no real test delivery is permitted.

## Storage and delivery contract

Use new additive News-owned tables for account current-view preferences and named saved views with alert enable/start timestamp, revisions, owner UUID, validated bounded filter JSON and timestamps. Do not repurpose unrelated preference fields or alter applied migrations. Coordinator must allocate the migration identity/order and coordinate the central manifest/privacy integration before that slice is finalized.

All reads/writes bind to the authenticated active Platform user; client-supplied owner IDs cannot select another account. Use revisions for saved-view edit/delete conflicts. Keep user preferences independent of the selected Journal account.

Reuse the existing press-release push queue and its article/subscription uniqueness. Eligibility is an enabled legacy channel OR a matching enabled custom view, subject to existing notification access and delay controls. Custom matches also honor the future news.filters_sorting policy; it remains OFF now. Revalidate current opt-in/match at claim time, respect an opt-in's activation time, preserve the existing delay/lifecycle/encryption contracts, and use the unified dashboard article destination. Do not change live grants, prices, policies, providers or worker configuration.

Register the two user-owned News tables with the current account-erasure disposition and schema inventory rather than leaving private preferences unmanaged. Preserve the single-writer migration/backup/recovery contract.

## Verification

Focused tests: ownership/isolation, account preference restore, view CRUD/revision conflicts, range/date normalization, relative-date reopen and pagination snapshot, first-enable no replay, pause/delete/edit cancellation, overlap deduplication, notification-delay/entitlement enforcement and existing channel compatibility. No provider sends.

At the final coherent checkpoint: affected type/lint checks; disposable additive migration plus full manifest/readiness checks; one coordinated production build using the documented private memory-only build settings; native actual-session desktop/mobile Light/Navy Dark QA, cross-browser account restore, multiple saved ranges, Settings integration, real private queue/claim matching with delivery disabled, and complete prior native inventory. Coordinator reviews the new exact allowlist, migration requirement/timing, selected migration prefix and release evidence.

## Preserved previous checkpoint

The earlier combined candidate 5f0145ec03c7b2cf921861cbafee3e339a9af106 passed full Next build/type validation and all 24 native application checks (desktop/mobile, themes, native sessions, Membership editor, both scanner sidecards and General Market News) on November 18 at 23:38 UTC. Build-only memory overlay is recorded separately; no provider/production operation occurred. This checkpoint does not cover this new account-view/alert scope.


## Completed local acceptance

Implementation and all28 native cases pass; see [final QA](press-release-account-views-and-alerts-qa-20261119.md) and [current progress](press-release-account-views-and-alerts-progress-20261119.md). Additive0221/order296 is allocated and privately verified, not applied in production. Premium enforcement remains OFF. Coordinator may publish the independently qualified migration-free5f014 baseline first; full account preferences/custom alerts require the coherent extension plus migration in the scheduled second batch.
