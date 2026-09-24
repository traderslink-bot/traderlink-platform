# Watchlist model options progress

Controlling [plan](watchlist-model-options-plan.md).

- Owner approved scope and visible option labels.
- Official model IDs, reasoning efforts and standard prices verified.
- Implementation complete; release and hosted acceptance pending.
- All 24 model/effort settings round trips passed, including actual temporary-file persistence and unchanged unrelated flags/defaults.
- All 48 simple/current request combinations passed; original request builder is byte-identical, with no prompt, packet, tool or token-limit change.
- Standard, cached, long-context and explicit override cost checks passed. Historical recorded costs remain untouched.
- UI options/status labels, both route validators and changed-file syntax passed.
- Exact-parent semantic comparison introduces no diagnostics. Existing local missing `sharp` dependency remains in both parent and candidate; this is not a clean full-build claim.
- Runtime adds a focused persistent regression test at `src/tests/watchlist-model-options.test.ts`.
- No hosted selection change, paid generation or deployment performed.

## Handoff boundary

- Runtime parent: `fbe30d7be1fe8125f82c348f488353c7063ccaae`.
- Platform parent: `a5f74b49076e82b2c9a7a45ef871df8f1574adbb`.
- Coordinator confirmed immutable local commit lane; another release may advance Platform main. Reconcile only this exact delta onto its then-current parent.
- No database migration or environment change required. Current model/effort remain selected.
- Hosted acceptance after separately authorized release: inspect all labels, save/reload an owner-selected choice, verify request audit model/effort during an approved generation, preserve approval and notification controls. No paid API compatibility/quality result is claimed from offline tests.
- If rolling back to the old runtime after selecting GPT-6 or None/Max, first restore a model/effort understood by the old runtime.
- Reproducible local candidate/check tools: `data/prepare-watchlist-model-options.cjs`, `data/verify-watchlist-model-options.cjs`, `data/typecheck-watchlist-model-options.cjs` in assigned e70f workspace. These operate on immutable parent blobs and do not publish or mutate hosted settings.
