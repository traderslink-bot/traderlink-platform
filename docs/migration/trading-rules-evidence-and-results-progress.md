# Trading Rules Evidence And Results Progress

**Status:** Complete and owner approved on 2026-08-10.

**Plan:** [Trading Rules Evidence And Results Plan](trading-rules-evidence-and-results-plan.md)

## Approved decisions

- Presets remain fully automatic after selection/configuration.
- Preset results and Rule Results use facts only and never recommend whether a
  trader should keep, remove or change a rule.
- Broken/N/A evidence expands inline in Daily Trade Tracker.
- Manual reviews default automatically to Not selected and notes are optional.
- `/rules/results` separates current and earlier rule versions.
- Chart evidence reuses the existing information box and custom annotation
  primitive.
- Rule markers use reserved gold `#9A6700`, a longer leader line and one grouped
  marker when several broken rules share a candle.

## Implementation checklist

- [x] Record and link the owner-approved controlling plan.
- [x] Add exact rule lifecycle/version applicability reads.
- [x] Return complete preset trigger/violation evidence.
- [x] Add versioned optional manual-rule notes and Not selected presentation.
- [x] Add Daily Tracker inline evidence and daily timelines.
- [x] Add grouped Rule chart markers and information-box content.
- [x] Add factual `/rules/results` reads and UI.
- [x] Complete owner desktop/mobile visual review.
- [x] Run focused technical and browser verification before owner review.
- [x] Create the narrow local feature commit without unrelated files.

## Verification record

- The focused preset evaluator, annotation service and dashboard read-model
  suite passes: 3 files and 31 tests with one worker and no file parallelism.
- Disposable migration initialization passes through migration 0052.
- The private development database was backed up and restore-verified before
  applying migration 0052.
- Desktop and narrow-mobile browser checks pass for Trading Rules, Daily Trade
  Tracker and Rule Results. The grouped gold chart marker displays multiple
  broken rules in the existing chart information box.
- Focused ESLint passes for all changed TypeScript and TSX files.
- Repository-wide TypeScript remains red on existing preview-data and unrelated
  baseline errors; the only new evaluator type error found by that pass was
  corrected. The dashboard-template guard remains red solely on pre-existing
  Drawer imports in AI Chat and AI Reviews, outside this feature.
- Existing unrelated working-tree changes remain outside this feature and its
  commit allowlist.

## Current boundary

Technical implementation, final pages and design are owner approved. The
narrow local feature commit records the completed repository checkpoint.

## Owner-directed page introduction follow-up — 2026-08-27

- [x] Add the owner's exact rule-type explanation directly beneath the
  `Trading Rules` title with approximately one line of spacing.
- [x] Present the explanation as an introductory sentence and numbered list
  without adding a card or subtitle label.
- [x] Preserve the existing Rules layout, interactions, account boundaries,
  and data behavior.
- [x] Review the Trading Rules Help collection for alignment.
- [x] Run focused static verification and record the narrow local commit.

Focused ESLint for `app/(dashboard)/rules/rules-client.tsx` and
`git diff --check` both pass. The Trading Rules Help collection already covers
the preset/custom distinction and automatic preset checks, so this page-only
introduction does not require a Help copy change.
