# Watchlist price discovery production handoff

The owner approved production deployment after implementation and QA on
October 28, 2026. The additional owner-requested final QA is complete.
Coordinator is authorized to cleanly integrate, build and deploy this bounded
feature. No worker Git mutation, hosted change, live AI regeneration, notification
resend, replay, backfill or test post has occurred.

## Source and release ownership

Runtime input: `/home/traderlink/projects/watchlist-gain-runtime`,
branch `codex/watchlist-gain-card-runtime-20261027`, HEAD
`c2892b45e4e3f2003ef1118a9ab93a558b83eed2`.

Platform input: `/home/traderlink/projects/watchlist-gain-card`,
branch `codex/watchlist-gain-card-20261027`, HEAD
`52982c5f1261675a8f14a3cb6c5e14eab94967b8`.

These are preserved feature inputs, not declarations of the current release
parents. Last confirmed live versions were Platform
`a5ead4e35a846ac0d82cd365688b831d36ece8ee` and Runtime
`c2892b45e4e3f2003ef1118a9ab93a558b83eed2`. Refresh actual hosted/source
state and other release ownership before integration. Port only tracked-file
deltas against each input HEAD and the allowlisted new files; do not replace a
current production file wholesale with an older feature-lane copy. Retain
concurrent News work and all prior accepted Watchlist corrections.

Deploy Platform support first, verify health, then Runtime, under the existing
single-writer/original-volume procedure. No migration or variable change is
needed. No extra ticker-specific audit or paid generation is a prerequisite.
The worker did not run a dirty Platform production build because Serwist would
overwrite the separately dirty service worker; Coordinator must build the
immutable clean candidate.

## Behavior

- Versioned observed/owner coverage is persisted with the read and boundary state.
- Confirmed absence of higher supplied-history resistance renders a code-owned
  Potential Targets message, not a numeric frontier or invented percentage target.
- Missing/stale/malformed/absent intraday history is distinct from exhausted
  history. Genuine prior-session and confirmed intraday overhead is preserved.
- All automatic upper paths, including target, breakout, must-clear, internal
  forced-automatic and the 15 percent fallback, honor the pause.
- Manual refresh and independent lower crossings retain their existing controls.
- Shared existing candles, not duplicate provider requests, may establish a
  real new boundary. Its stable event identity is persisted as consumed before
  paid preparation; repeated quotes/restart/failure cannot purchase it again.
- Owner targets remain authoritative. Unrelated edits do not reset the pause.
- Current context is activation/generation-bound and separate from the immutable
  saved analysis. Historical screenshots and old frozen notification images stay
  unchanged. Restricted projections strip the new context.
- No notification/destination/tag behavior or approval restriction is added.

## Verification receipts

Runtime coverage, actual mocked generation in both formats, identity and actual
image tests: **23 passed, zero failed**. The actual manager test confirms that
repeated callbacks pause before candle preparation or the request budget.

Platform focused editor/store/access/context/historical resistance/Gain/Loss
regressions: **31 passed, zero failed**. Actual simple and detailed browser cards
pass desktop/mobile Light/Navy Dark, current versus historical/editor context,
owner targets, hidden/unavailable sections and restricted presentation with no
network effects.

Both full TypeScript checks passed. Targeted Platform lint has zero errors and
one pre-existing unused `cleanLevelMapCardBody` warning. Both diff checks pass.

Existing Runtime refresh/automatic-publication/access checks pass 32 cases; one
unrelated listing-only fixture fails identically against unchanged HEAD. Six
other legacy expectations also fail identically against HEAD source overlays.
Do not alter accepted unrelated product behavior to make these old expectations
pass. Exact attribution and reproducible commands are in
[progress](watchlist-price-discovery-boundary-progress.md).

The owner's additional final QA passes eight targeted Runtime tests and five
Platform tests, with clean diff checks. No remaining feature finding.

## Complete Runtime allowlist and SHA256

```text
b844adeee657fe04d5dddc509898772a2bab4be296a147dbee778b3ad3ac9f2a  src/lib/ai/traderslink-ai-read-code-identity.ts
6b0ec0af78d3df34181c45704ae97c24ff7f80c7902516c90bf5ceb6d2e5f3e7  src/lib/ai/traderslink-ai-read-owner-edit.ts
3bdf318e88436140c3bdb73647843dc7d1164c96867e6842234932b9494a61c3  src/lib/ai/traderslink-ai-read-service.ts
ca3016e9718718d0f3d03931cd59ebd7f97074e8a9f38a09012f7764fbedf045  src/lib/ai/watchlist-analysis-image-cache.ts
d9e5727f323c31ecd9ac1478e0e8d60b94bcd752652400ea7738cc1a63e37ea8  src/lib/ai/watchlist-analysis-image.ts
7dbced3e4fed26de87f91c69e31edbe4a1fdb36d2fad57f48065af660a7f5168  src/lib/ai/watchlist-simple-analysis.ts
f888daad44e3744524427cb1441e70ca7202ffcad467c1e1f8557be94b314e94  src/lib/ai/watchlist-simple-input.ts
e3fc9390e77bf990fdd963bd1a9c3e07462eed3c8777f7655b09a2e626db3f8b  src/lib/ai/watchlist-simple-preview.ts
31719415e06497d8538a1ee1121f5cd877da0d272db66c78cf411772f1e14ae3  src/lib/ai/watchlist-upside-coverage.ts
b5bff40c7043d6b7e51a089579715c3e2be88a34ba3de6244cd8118c2f2bc030  src/lib/live-watchlist/live-watchlist-types.ts
bf3d3e57b355f46c9397a4e880457e8aa289b3c9a7058974bdd4d17128ec34c5  src/lib/monitoring/manual-watchlist-runtime-manager.ts
6c513a357c9516af3f194a05dffa45b195da9e673ea374b611fc3f918b26f546  src/lib/monitoring/monitoring-types.ts
db85b6d8dcdc933bb3cc980a6c5d11253b5439598dea11425b22754dd83e7b2b  src/lib/monitoring/watchlist-state-persistence.ts
556b7b71094643ee7bdd39e7a80fe156e01edb9b1cf23c6692892e419fb305da  src/lib/monitoring/watchlist-store.ts
6941d132d1fa778e4003077722b769475fabb6964eccbdc64bc4100006f1c9ae  src/tests/traderslink-ai-read-code-identity.test.ts
f214699d38229147edcd492fa8080750917f3de431a44c02cde13072d1adab97  src/tests/watchlist-upside-coverage.test.ts
```

## Complete Platform allowlist and SHA256

```text
575b4cc2770f9665ec734f52f3dcf89babf282fcf2a3ddca68e8c90b00caf7b1  app/watchlist/live-watchlist-client.tsx
0d04a97f143e08021ccae522050d63cc96da83e26d56763a6e70362e67a29596  app/watchlist/simple-analysis-card.tsx
960fbacbc416cd278c267bbf55e5536989d6efc202a1adbdbe509ad3dbeed35a  docs/migration/watchlist-price-discovery-boundary-plan.md
386d72d7b1b18ff42eb05c78c3127bb226bb3bbd4d8968a84aa7e69ca2dddedb  docs/migration/watchlist-price-discovery-boundary-progress.md
37c385496c551f6b9dd3b8b16a1071d6863dd10a429987b53f5a1ca27570ec7f  docs/migration/watchlist-resistance-evidence-progress.md
df0b258d03ffedbb0640a6ca08f913c22a8b0e7ea9ffa99c72c9829d49934807  src/lib/live-watchlist/__tests__/analysis-inline-edit.node-test.cjs
75a56860ea6a1cbdcd2861c1c4b74b813f966d48a1af7a35c8ccd04a18288997  src/lib/live-watchlist/__tests__/historical-resistance.node-test.cjs
7e2cccbb542a44dd0569d88d96ebff9e3aae97d1542c45d88582c3f8d105be18  src/lib/live-watchlist/__tests__/upside-coverage.node-test.cjs
ff4210156d6a72022b1be739f77cb09f7fac6dd228ba2426dd5a2c3d2ee3bbc8  src/lib/live-watchlist/analysis-inline-edit.ts
4b369ef757a25f08376c5484c77be924f3dc58d351a84ab8b87ceb729875042c  src/lib/live-watchlist/live-watchlist-reconciliation.ts
3de97d9aff11e531fc542fd758d6d2af54dc8a35f8fb66809df5319af92d6f79  src/lib/live-watchlist/live-watchlist-store.ts
850921f16596a68acfd8c67ee1eeebf03822e177dec5cfea67cd05e96bcc20ec  src/lib/live-watchlist/live-watchlist-types.ts
7fd52e107fe2699404f6de50fd247bb228303617da1162d8f56b3c2784022724  src/lib/live-watchlist/watchlist-member-projection.ts
31719415e06497d8538a1ee1121f5cd877da0d272db66c78cf411772f1e14ae3  src/lib/live-watchlist/watchlist-upside-coverage.ts
ac3211faad61eeb808c08eeb72dc58b7a8cdfdf0053e6cc30f57b47fe4a91066  src/modules/help/watchlist-guides.ts
97a59f1c0a138660bef436aa1e2de449a4c98283517d36be0cbf317c1a06d1e9  src/scripts/verify-watchlist-upside-coverage-view.cjs
```

Also include this handoff document:
`docs/migration/watchlist-price-discovery-release-handoff.md`.
Its own hash is supplied separately to avoid a self-referential manifest.

## Exclusions and acceptance

Exclude `public/sw.js` (preserved SHA256
`b723716434862953454d6886db8cb158c884691f266b76899005fd6ea499ad4e`),
`docs/migration/standalone-end-of-day-ticker-recap-plan.md`,
`src/scripts/inspect-brai-notification-provenance.mjs`,
`src/scripts/inspect-brai-notification-timing.cjs`, generated artifacts,
private data and every other unlisted path. No package, lockfile, schema,
provider cadence, model, token, global setting or delivery-channel change.

Return the exact clean published SHAs/parents and complete changed-file lists,
Railway deployment IDs/status, Platform/Runtime health, configured source
branches, original-volume readiness and single-writer checks. Verify installed
coverage helper and generation prompt/source identity. Existing worker
notifications must not be replayed or resent as part of acceptance. Handoff or
push alone is not evidence that the feature is live.

