# Watchlist analysis section removal

## Owner-approved scope

- Remove Invalidation and First objective from pullback sections.
- Remove If momentum fails and Thesis invalidation sections.
- Stop requesting these parts in the AI prompt and response schema.
- Keep pullback zones, confirmation, upside levels and unrelated analysis behavior.

## Implementation contract

Remove matching display and editor fields from full/brief cards, restricted previews and generated images. Preserve compatibility with saved historical analyses. New analyses must not fail or lose a valid pullback merely because retired fields are absent. Do not invent replacement invalidation prices. Preserve publication, notification, model and access settings.

## Source boundary

- Platform candidate parent: `6eb555e1f2e3060b0ad721df17129e09b76073ef` (unpublished).
- Runtime parent: `d37876388babc4a0f833798d75051f6dafdc506e`.
- Use exact-parent candidate changes; preserve unrelated dirty working files and membership work.
- No paid generation, deployment, migration or live actions authorized by this change.

## Progress

- [x] Trace full and brief card, prompt, schema, editor and image consumers.
- [x] Confirm generation and member parsers currently require retired invalidation fields.
- [x] Complete narrowly scoped compatibility changes and presentation removal.
- [x] Focused source/contract verification; no broad test suite.
- [x] Update Help and controlling plan.
- [ ] Deliver exact allowlist and local commits.
- [ ] Coordinated deployment and hosted acceptance (separate authorization).

## Dependency found during trace

The Runtime manager's stored pullback check and lifecycle consumer also read invalidationPrice. The Platform read parser requires it too. Exact-hunk ownership was granted and those consumers now tolerate missing retired fields. Retained fields are not replaced by invented prices. The full-analysis Momentum failure level and separate recovery plan remain unchanged; only the requested If momentum fails display branch and its new downside-checkpoint generation are removed.

## Verification

Focused in-memory candidate checks passed: TypeScript/TSX syntax, old and new brief payload parsing, strict-schema property/required alignment, full/brief display omissions, and owner editing without retired pullback fields. No network/provider requests, live changes, local server, full build or broad suite ran. Full integrated typecheck, release build and hosted acceptance remain coordinator checkpoints. Previously generated image attachments are immutable; newly rendered images use the updated presentation.

## Owner-selected label — October 8

Support to watch is renamed Structure Weakens across the analysis card, restricted preview, editors and newly rendered images. The needsToHold field, price, prompt and calculation logic are unchanged. Exact string-only diff checks passed; no tests, provider calls or deployment ran for this label-only slice. Hosted acceptance remains pending.
