# Watchlist analysis production integration handoff

Status: source integration handoff, not deployment evidence.

## Runtime

Recorded live archive base: `9bc3124b7114171d0c617016e8093137fad52c98`.
Candidate: `4ae37e9c54a87afd0284e3365c486600381eada4`.
Use the net diff between these exact revisions; this is not the remote-main diff.
No package, build configuration, database migration, stock-levels generator or
recap files change against this base. Coordinator must verify running identity
before archive release; retain current service/volume/topology and one writer.

Complete runtime changed-file allowlist (60 files):

- `src/lib/ai/traderslink-ai-read-audit.ts`
- `src/lib/ai/traderslink-ai-read-breakout-selection.ts`
- `src/lib/ai/traderslink-ai-read-checkpoint-dependencies.ts`
- `src/lib/ai/traderslink-ai-read-code-identity.ts`
- `src/lib/ai/traderslink-ai-read-core-evidence.ts`
- `src/lib/ai/traderslink-ai-read-observations.ts`
- `src/lib/ai/traderslink-ai-read-owner-edit.ts`
- `src/lib/ai/traderslink-ai-read-price-action.ts`
- `src/lib/ai/traderslink-ai-read-publication-preview.ts`
- `src/lib/ai/traderslink-ai-read-review-export.ts`
- `src/lib/ai/traderslink-ai-read-review-omissions.ts`
- `src/lib/ai/traderslink-ai-read-review-policy.ts`
- `src/lib/ai/traderslink-ai-read-review-store.ts`
- `src/lib/ai/traderslink-ai-read-section-validation.ts`
- `src/lib/ai/traderslink-ai-read-service.ts`
- `src/lib/ai/traderslink-ai-read-settings.ts`
- `src/lib/alerts/alert-router.ts`
- `src/lib/alerts/discord-audited-thread-gateway.ts`
- `src/lib/alerts/discord-confirmed-rejection.ts`
- `src/lib/alerts/discord-rest-thread-gateway.ts`
- `src/lib/live-watchlist/live-watchlist-publish-outbox.ts`
- `src/lib/live-watchlist/live-watchlist-publisher.ts`
- `src/lib/live-watchlist/live-watchlist-types.ts`
- `src/lib/live-watchlist/official-watchlist-article-source.ts`
- `src/lib/live-watchlist/recent-website-articles.ts`
- `src/lib/live-watchlist/stocktitan-catalyst-feed.ts`
- `src/lib/live-watchlist/website-publishing-discord-gateway.ts`
- `src/lib/monitoring/manual-watchlist-runtime-manager.ts`
- `src/lib/monitoring/monitoring-types.ts`
- `src/lib/monitoring/watchlist-state-persistence.ts`
- `src/lib/monitoring/watchlist-store.ts`
- `src/runtime/manual-watchlist-analysis-review-api.ts`
- `src/runtime/manual-watchlist-analysis-review-panel.ts`
- `src/runtime/manual-watchlist-page.ts`
- `src/runtime/manual-watchlist-server.ts`
- `src/tests/approved-analysis-discord-delivery.test.ts`
- `src/tests/discord-rest-thread-gateway.test.ts`
- `src/tests/discord-watchlist-review-gate.test.ts`
- `src/tests/live-watchlist-publication-gate.test.ts`
- `src/tests/manual-watchlist-analysis-review-api.test.ts`
- `src/tests/manual-watchlist-analysis-review-panel.test.ts`
- `src/tests/manual-watchlist-operation-grouping.test.ts`
- `src/tests/manual-watchlist-runtime-manager.test.ts`
- `src/tests/official-watchlist-article-source.test.ts`
- `src/tests/stocktitan-catalyst-feed.test.ts`
- `src/tests/traderslink-ai-read-audit.test.ts`
- `src/tests/traderslink-ai-read-breakout-selection.test.ts`
- `src/tests/traderslink-ai-read-checkpoint-dependencies.test.ts`
- `src/tests/traderslink-ai-read-code-identity.test.ts`
- `src/tests/traderslink-ai-read-core-evidence.test.ts`
- `src/tests/traderslink-ai-read-owner-edit.test.ts`
- `src/tests/traderslink-ai-read-price-action.test.ts`
- `src/tests/traderslink-ai-read-publication-preview.test.ts`
- `src/tests/traderslink-ai-read-review-export.test.ts`
- `src/tests/traderslink-ai-read-review-omissions.test.ts`
- `src/tests/traderslink-ai-read-review-policy.test.ts`
- `src/tests/traderslink-ai-read-review-store.test.ts`
- `src/tests/traderslink-ai-read-section-validation.test.ts`
- `src/tests/traderslink-ai-read-service.test.ts`
- `src/tests/traderslink-ai-read-settings.test.ts`

## Durable state and authenticated reads

New directories beneath the existing resolved durable data directory:
`ai-read-owner-reviews` (append-only owner versions/delivery evidence),
`ai-read-diagnostics` (bounded request/response diagnostic retention).
Preserve existing manual-watchlist-state.json, traderslink-ai-read-settings.json,
traderslink-ai-read-run-events.jsonl, cost ledger, outbox and receipt state.
Back up the existing durable directory consistently before release; no SQL
migration is authorized or needed by this runtime net diff. Rollback must not
replay delivered approvals or discard newer receipt state.

Authenticated GET /api/runtime/status uses existing
MANUAL_WATCHLIST_RUNTIME_ACCESS_TOKEN as a Bearer token. Read it only inside the
hosted process/secret context, never print it. GET /api/runtime/ai-read-audit is
an existing read-only attempts endpoint. Full original September10 packets may
not exist: new capture code does not retroactively create historical evidence.

## Platform selective integration

Source candidate: `308470ff9f62b3ffc2b4e18c21f898340b156bbd`.
Production base supplied by Coordinator:
`f264c04f446b1b8620ff1fe8f024e9f2bbc43698`.
Never replace the entire source tree or migration manifest from the candidate.
Port these implementation commits preserving current main behavior:
3d17d4c48, c2645938e, 1a92e3169, b7e017de8, 8ce27e015,
894ebf42e, 571ba1689, 63a23e93e, e48abe086.
Owner review preview, optional section visibility, proxy allowlists and runtime
request method support are required together. Source/date display commits
6672a8630 and 7c7cf61b9 require comparison with current main to avoid reverting
existing source filtering/notices. Preserve current company layout, disclaimer,
TradersLink Analysis title, visibility toggle and recap implementation.
Help source: src/modules/help/watchlist-guides.ts; port only analysis/review
instructions from candidate, preserving current main's unrelated guide content.
This section is a hunk-selection instruction, not a finished Platform manifest.
Coordinator must record final exact integrated SHA and file list.

## Verification already recorded

Six focused manager orchestration cases; 20 owner edit/store/preview checks;
25 deterministic candidate/section/dependency checks; 43 service checks; seven
member component checks. Details and limitations are in
[closeout](watchlist-analysis-quality-closeout.md). These checks are not real
Moomoo/model-quality, browser or real Discord acceptance. No local server or
broad retesting is requested. Require remote build/startup/health and exact
source proof before declaring live.

## Owner's latest priority

Release usable analysis/edit/approval before 07:00 Eastern September11.
Private historical replay is not yet implemented and must not delay the core
release. Initially at most three representative saved cases, one request each;
September10 first, older saved additions only if useful. No public test posts,
Discord test delivery, infrastructure relocation or unrelated Press recovery.
