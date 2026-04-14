# Trader Improvement System

Trader Improvement System is a layered trade-analysis project that turns raw
executions and candle data into structured trader feedback.

The current system focuses on:
- Layer 1 raw timeline and structural fact building
- Layer 2 pattern detection
- Layer 3 pattern normalization and prioritization
- support/resistance-aware trade analysis

## Current Status

The repo already supports:
- trade reconstruction from normalized executions and candles
- entry, management, scaling, recovery, and exit pattern detection
- support/resistance-aware entry, breakout, add, and exit signals
- normalized primary/supporting/contextual trade-story outputs

Roadmap and handoff docs live in:
- [src/docs/codex-project-log.md](src/docs/codex-project-log.md)
- [src/docs/behavior-coverage-audit.md](src/docs/behavior-coverage-audit.md)
- [src/docs/trader-feedback-capabilities.md](src/docs/trader-feedback-capabilities.md)
- [src/docs/support-resistance-plan.md](src/docs/support-resistance-plan.md)

## Scripts

Install dependencies:

```bash
npm install
```

Use the pinned Node version if you use `nvm`:

```bash
nvm use
```

Run the test suite:

```bash
npm test
```

Run Layer 2 verification:

```bash
npm run verify:layer2
```

Run Layer 3 verification:

```bash
npm run verify:layer3
```

Run the full verification checkpoint:

```bash
npm run verify:all
```

Run the sample raw timeline debug script:

```bash
npm exec tsx src/lib/raw-trade-timeline/debug/run-sample-timeline.ts
```

## GitHub Automation

This repo includes GitHub Actions CI for:
- `npm test`
- `npm run verify:layer2`
- `npm run verify:layer3`

Dependabot is also configured for:
- npm dependencies
- GitHub Actions updates

## Notes

- The repo is designed so market-data providers can be swapped at the adapter
  boundary without rewriting Layers 1-3.
- Support/resistance logic is intentionally built as a factual structural engine
  first, with trader-facing setup labels added on top of it later.
