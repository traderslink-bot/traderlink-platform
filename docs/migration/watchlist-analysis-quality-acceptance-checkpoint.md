# Watchlist analysis quality acceptance checkpoint

Status: incomplete; not a release approval.

Controlling local plan: [Analysis Quality Plan](watchlist-analysis-quality-plan.md).
Chronological evidence: [Progress](watchlist-analysis-quality-progress.md).

## Current evidence boundary

Latest narrow runtime correction: `e0801cc` holds legacy public ticker
replacements for review. Ten selected manager/policy checks passed with mocked
providers; scoped review-policy/store and Platform Help TypeScript checks passed.
Follow-up `5f0f8a2` separates automatic request eligibility from live-data
permission; pending/failed replacement requests cannot automatically repeat.
This does not close the broader acceptance gaps below.

Runtime `379d422` persists original validation decisions and makes them available
to the owner inspector without temporary diagnostics. Checkpoint: 45 service/store
tests, eight inspector/export tests and strict service/store TypeScript passed;
the selected manager provenance case passed separately. Mocks only, no live calls.

Runtime checkpoint inspected: `e2caba5`, canonical
`levels-system-post-mtf-handoff-stability`. Platform checkpoint: `d79b6a575`
in the assigned `e70f` worktree. Preserve unrelated Platform working changes.
No live setting, migration, provider request, Discord post, server, push or
deployment was performed for this checkpoint.

Current-run checks, one worker, mocked external services:

- `traderslink-ai-read-service.test.ts`: 31 passed.
- `traderslink-ai-read-audit.test.ts`,
  `traderslink-ai-read-owner-edit.test.ts`,
  `traderslink-ai-read-review-export.test.ts`: 13 passed together.
- Earlier checkpoints in Progress contain the exact smaller policy, panel,
  candidate and multipart-delivery checks. Do not count those as fresh full
  integration or browser proof.

The service test's `Audit capture unavailable: storage_error` messages are
intentional mocked storage-failure cases, not production storage observations.

## Requirement inventory and remaining proof

| Requirement | Evidence now | Remaining acceptance |
| --- | --- | --- |
| One request per generation, no automatic correction/fallback | Service tests cover success, omitted sections, invalid output, unavailable tape, model-access failure and capture failure | Confirm all orchestration/restart/deferred call paths and attempt-versus-generation counts |
| Independent optional sections | Pullback/objective/breakout selection and optional overview/outer-level paths implemented and tested; downside words alone cannot bypass supplied-price validation; candle matcher excludes future/malformed/conflicting observations (34 service checks pass) | Complete upside/core scenario-language and cross-section dependency coverage; remaining evidence sources/claim semantics require review |
| Preserve coherent core and prices | Invalid core ordering still rejects; omitted overview does not change levels | Complete malformed/truncated/refusal fixture inventory and full final-assembly review |
| Micro/nano-cap analysis | Observed candidate selection, precision matching, shared recent-range context, corrected shallow/retest wording | Frozen-fixture calibration for volatility, failure/base joint selection and broader coverage; no live model-quality claim |
| Primary/backup breakout in one response | Candidate and service checks; one selected branch; original response retained | Integrated owner rendering and complete dependent-text coverage |
| TradersLink-first research | Existing service/source behavior retained; unsupported context normalization tests pass | Confirm runtime article-selection and fallback contract end to end; historical missing packets cannot be reconstructed |
| Exact request/response audit | Capture round-trip, bounded artifacts, visible capacity/oversize/corruption results pass | Review complete metadata/hash/cost capture and operational capacity/index behavior |
| Permanent original/edit/approval records | Separate append-only review storage; edit/export checks pass; original validation decisions now persist independently of temporary diagnostics and remain inspectable after diagnostic loss | Complete storage-failure/concurrency and large-history acceptance; diagnostic expiry must never delete revisions |
| Review/edit/preview/approve | Owner editing preserves provenance and corrections; stale/version checks recorded in Progress | Integrated complete editor inventory, unsaved-error handling and website/Discord parity |
| Initial private admission | Real manager methods with fake providers: direct/queued ON/ON private workflow passes all three sessions; 18 Main/Top Regular direct OFF combinations publish normally with zero AI calls; HTTP guard blocks pending card and quote/data transport | Live listing/detail/API and existing-cache/re-add concealment, queued OFF cases, full process startup and switch/session transition races |
| Replacement review | Existing approved revision remains independently stored during later draft; legacy public manual refresh now creates a durable replacement-only review before dispatch, without historical approval fabrication; focused policy/restart and manager checks pass | Full replacement publication and re-enabled automation acceptance; actual public-render retention proof |
| Automatic updates default OFF | Persisted control and trigger guards exist; eight automatic trigger names cannot regenerate a pending legacy replacement; failed attempt stays held, manual remains available, approval restores ON eligibility and OFF preserves boundary settings | Full process restart/deferred/scheduler integration matrix and actual re-enabled replacement publication |
| Delivery durability | Verified multipart method/store flow: confirmed part skipped, uncertain part held, receipt verified, remaining part only sent | Full process startup, publisher integration, audience mentions/links, removal/re-add races and hosted acceptance |
| Owner history and operation results | Request/version history, inspection, export, readable omissions and distinct recorded attempt/cost summaries exist (`748ec14`); newer failed/preparing replacements now supersede older published labels while preserving prior-version access | Required Published-with-omissions outcome with revision-aligned evidence, completeness reporting for partial diagnostic capture and integrated operation detail display |
| Public rendering and Help | Existing parse/display work and Help checkpoints recorded | Integrated desktop/mobile rendering, older payloads, no empty/dangling sections and mixed Platform edit reconciliation |
| Recap compatibility | Not established by analysis tests | Reconcile separate recap ownership and prove deep/shallow/recovery/omitted-section compatibility without restricting owner edits |
| Release preparation | Separate local cutover plan exists; no live changes | Exact reconciled parent/allowlists, source topology, rollback/backup, after-market owner authorization and release-owner handoff |

## Gates retained

- No local preview server or broad build/test suite on this computer.
- No real model-quality experiment or Discord publication inferred from mocks.
- No new migration is assumed necessary or authorized.
- Live default changes, runtime cutover and production publication require
  separate explicit owner approval after the relevant trading sessions close.
- Browser/live acceptance is outstanding; source-only evidence cannot close it.
- This inventory organizes the whole objective; it does not redefine completion
  around the already-tested subset or authorize a release handoff.
