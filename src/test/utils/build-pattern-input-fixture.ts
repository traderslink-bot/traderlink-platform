import type {
  PatternInput,
  PatternInputCore,
} from "../../lib/pattern-input/types/pattern-input";

export interface PatternInputOverrides {
  symbol?: PatternInputCore["symbol"];
  tradeDirection?: PatternInputCore["tradeDirection"];
  sessionBucket?: PatternInputCore["sessionBucket"];
  tradeStructure?: Partial<PatternInputCore["tradeStructure"]>;
  entryContext?: Partial<PatternInputCore["entryContext"]>;
  exitContext?: Partial<PatternInputCore["exitContext"]>;
  scalingContext?: Partial<PatternInputCore["scalingContext"]>;
  timingContext?: Partial<PatternInputCore["timingContext"]>;
  supportResistanceContext?: Partial<PatternInputCore["supportResistanceContext"]>;
  recoveryContext?: Partial<PatternInputCore["recoveryContext"]>;
}

export function buildPatternInputFixture(
  base: PatternInputCore,
  overrides: PatternInputOverrides = {},
): PatternInput {
  return {
    ...base,
    ...("symbol" in overrides ? { symbol: overrides.symbol! } : {}),
    ...("tradeDirection" in overrides
      ? { tradeDirection: overrides.tradeDirection! }
      : {}),
    ...("sessionBucket" in overrides
      ? { sessionBucket: overrides.sessionBucket! }
      : {}),
    tradeStructure: {
      ...base.tradeStructure,
      ...overrides.tradeStructure,
    },
    entryContext: {
      ...base.entryContext,
      ...overrides.entryContext,
    },
    exitContext: {
      ...base.exitContext,
      ...overrides.exitContext,
    },
    scalingContext: {
      ...base.scalingContext,
      ...overrides.scalingContext,
    },
    timingContext: {
      ...base.timingContext,
      ...overrides.timingContext,
    },
    supportResistanceContext: {
      ...base.supportResistanceContext,
      ...overrides.supportResistanceContext,
    },
    recoveryContext: {
      ...base.recoveryContext,
      ...overrides.recoveryContext,
    },
  };
}
