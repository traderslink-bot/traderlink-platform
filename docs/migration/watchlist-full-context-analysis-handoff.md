# Watchlist full-context analysis — local handoff

September 11, 2026. Local revision verified; not deployed or a production
acceptance claim. Do not send or release until the owner authorizes the gate.

## Source identity

- Runtime: `ac5fdaa1cbf60fd4cc52f406378c6383281858d0`.
- Runtime parent: `f9b0355dd2a774c9b68f446375a14111c97d831f`.
- Runtime checkout: canonical `levels-system-post-mtf-handoff-stability`;
  existing branch `codex/watchlist-ai-provider-corrections-20260826` preserved.
- Platform parent: `cf1b7d87467a38bf5d679868ca9b425b91993f8a` in assigned
  `e70f/traderlink-platform`. The Platform commit containing this handoff is
  identified by its parent and the exact allowlist below; record its full SHA
  from Git before integration. Do not deploy this historical checkout wholesale.

## Product result

- Current/prior-session five-minute context, latest 120 one-minute bars,
  at least six months requested daily history, three months four-hour history,
  dated previous close and available Levels provenance enter the packet.
- Brief one-minute pauses remain momentum context, not principal dip-buy
  candidates. Five-minute bases require overlapping consecutive bodies;
  unrelated high-volume impulse bodies cannot form one broad volume shelf.
  Historical Levels areas require corroborating supplied observations.
- Structure-based pullback, deeper reset, breakout, failure and recovery roles;
  no new fixed minimum pullback percentage. Missing optional sections remain
  local omissions when a coherent independent setup survives.
- One canonical breakout candidate plus optional backup in the same request.
  A bad optional must-clear level no longer erases an independently supported
  candidate. Independently validated approach resistance can precede breakout
  in Where the trade could go next, followed by higher conditional checkpoints.
- Existing public payload identities and owner edit/review storage stay intact.
  A lone deeper plan displays as Pullback; two plans display as Pullback and
  Deeper pullback. Owner-written explanations without prices remain visible.
  Empty generated levels are cleared in generation-only normalization.
- Default output ceiling is 12,000; explicit configured overrides are preserved.
  No automatic second request, model switch, live setting or publisher change.

## Verification and evidence

- Real private first responses: revised TNON, TRUG and SURG each completed in
  one Luna/high request and survived local service processing. TNON now selects
  7.141-7.471 instead of the tiny 7.90-7.96 pause. TRUG retains both pullbacks;
  SURG covers the faded-spike/rebound tape and pre-breakout resistance.
- Six private paid calls across two rounds: conservative total **$0.09261407**.
  No request is running; no Terra call. Private ledger and all raw requests and
  responses remain under runtime `data/analysis-replay` and the earlier private
  artifact location, never in these commits. The private runner is retained
  under `data/analysis-replay`, not shipped as runtime source.
- Enriched historical trials are not exact reconstructions: only 60 original
  raw one-minute bars survived, prior-day extended hours were unavailable,
  and original Levels output was not retained. The daily/four-hour tails end
  September 10, before each September 11 reference. No invented missing bars.
- FTFT, FEIM refresh and BDRX captured-subset rebuilds were inspected without
  additional model calls. They expose broader five-minute candidates but do
  not establish new first-response quality for those symbols. AENT's owner-
  confirmed high remains unaltered. September 10 missing packets stay missing.
- 61 focused service/price-action/publication-preview/review-policy checks pass.
- Final committed-source service/review-store/owner-edit checkpoint: 63 pass,
  including one-call failure handling, stored originals/edits, stale approvals,
  pinned previews, uncertain delivery and restart retention. Counts overlap;
  do not add these checkpoint totals as unique test coverage.
- 23 section/breakout, 11 market-context and four checkpoint-dependency checks
  pass; nine Platform member-card/preview checks pass using an element-tree
  harness, not a browser. Six direct/queued private-admission cases pass across
  premarket/regular/postmarket, with external transports mocked.
- Strict scoped TypeScript passes for runtime manager, service, edit/preview,
  replay scripts and selected changed tests. Platform client/Help transpile
  without syntax errors. Both allowlists pass `git diff --check`.
- No Vitest, broad regression, build, local server, real Discord test,
  migration, push or deployment was performed.

## Runtime allowlist — 22 files

```
src/lib/ai/traderslink-ai-read-breakout-selection.ts
src/lib/ai/traderslink-ai-read-checkpoint-dependencies.ts
src/lib/ai/traderslink-ai-read-code-identity.ts
src/lib/ai/traderslink-ai-read-market-context.ts
src/lib/ai/traderslink-ai-read-owner-edit.ts
src/lib/ai/traderslink-ai-read-price-action.ts
src/lib/ai/traderslink-ai-read-publication-preview.ts
src/lib/ai/traderslink-ai-read-section-validation.ts
src/lib/ai/traderslink-ai-read-service.ts
src/lib/monitoring/manual-watchlist-runtime-manager.ts
src/scripts/audit-ai-packet-context.ts
src/scripts/prepare-ai-context-replay.ts
src/scripts/validate-ai-context-replay.ts
src/tests/traderslink-ai-read-breakout-selection.test.ts
src/tests/traderslink-ai-read-checkpoint-dependencies.test.ts
src/tests/traderslink-ai-read-code-identity.test.ts
src/tests/traderslink-ai-read-market-context.test.ts
src/tests/traderslink-ai-read-owner-edit.test.ts
src/tests/traderslink-ai-read-price-action.test.ts
src/tests/traderslink-ai-read-publication-preview.test.ts
src/tests/traderslink-ai-read-section-validation.test.ts
src/tests/traderslink-ai-read-service.test.ts
```

## Platform allowlist — nine files

```
app/watchlist/live-watchlist-client.tsx
src/lib/live-watchlist/__tests__/analysis-card-visibility.node-test.cjs
src/modules/help/watchlist-guides.ts
docs/migration/watchlist-analysis-quality-plan.md
docs/migration/watchlist-analysis-quality-closeout.md
docs/migration/watchlist-analysis-quality-acceptance-checkpoint.md
docs/migration/watchlist-full-context-analysis-progress.md
docs/migration/watchlist-microcap-analysis-research.md
docs/migration/watchlist-full-context-analysis-handoff.md
```

Client scope is exactly three pullback-heading changes. Exclude older title,
notice, Company Info/Potential Gain layout, CSS and unrelated admin-plan edits.
No shared public type, database schema, entitlement or recap logic was changed;
`shallow`, `deep`, `failureRecovery` and `targets` keep their saved identities.

## Retained release gates / risks

1. Reconcile both commits onto the then-current release parents under the
   single-writer coordinator lane. Verify actual Railway branch/service/commit
   metadata; this local work did not recheck the remote release tip.
2. No migration is required by this revision. Preserve existing persistent data,
   review/audit history, ingest/publisher and host topology. Do not relocate the
   production-used runtime merely because its environment is named staging.
3. Confirm any explicit `TRADERSLINK_AI_READ_MAX_OUTPUT_TOKENS` override: 8,000
   would retain the demonstrated truncation risk despite the new code default.
   Keep owner-selected model, review and session/follow-up settings unchanged
   unless separately authorized. No secret values belong in the handoff.
4. Remote build, health, actual desktop/mobile card/preview, and initial plus
   replacement review acceptance remain hosted release checks. Element-tree
   tests do not prove CSS layout or actual browser/Discord transport behavior.
5. Back up the release's persistent data under its existing guarded procedure;
   retain preceding exact SHAs for rollback. Verify health before resuming
   additions. Never overwrite or downgrade already approved draft/version data.
6. Three historical cases establish bounded model-quality evidence, not a
   guarantee for every ticker or market condition. Missing provider coverage
   stays explicit. No further speculative model testing is required to spend
   the remaining allowance; the owner retains the $5 stopping condition.

See the [progress record](watchlist-full-context-analysis-progress.md) and
[research](watchlist-microcap-analysis-research.md) for rationale and limitations.
