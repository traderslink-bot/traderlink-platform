// =========================
// 2026-04-12 06:28 PM America/Toronto
// PATTERN REGISTRY
// =========================
//
// PURPOSE:
// Central registry of all pattern definitions used by the detection engine.
//
// CURRENT DESIGN:
// The engine remains simple.
// Each family owns its own pattern logic.
// Registry only assembles them in one place.
//
// FUTURE EXPANSION MAY INCLUDE:
// - family-level ordering rules
// - composite-first display ordering
// - suppression rules for redundant lower-level patterns
//

import type { PatternDefinition } from "../types/pattern-detection-types";
import { EXECUTION_FREQUENCY_PATTERNS } from "../patterns/execution-frequency-patterns";
import { POSITION_BUILDING_PATTERNS } from "../patterns/position-building-patterns";
import { POSITION_REDUCTION_PATTERNS } from "../patterns/position-reduction-patterns";
import { POSITION_STRUCTURE_PATTERNS } from "../patterns/position-structure-patterns";
import { TRADE_DURATION_PATTERNS } from "../patterns/trade-duration-patterns";
import { TRADE_EXCURSION_PATTERNS } from "../patterns/trade-excursion-patterns";
import { TRADE_CLOSURE_PATTERNS } from "../patterns/trade-closure-patterns";
import { ENTRY_CONTEXT_PATTERNS } from "../patterns/entry-context-patterns";
import { ENTRY_QUALITY_PATTERNS } from "../patterns/entry-quality-patterns";
import { EXIT_QUALITY_PATTERNS } from "../patterns/exit-quality-patterns";
import { SCALING_QUALITY_PATTERNS } from "../patterns/scaling-quality-patterns";

export const PATTERN_DEFINITIONS: PatternDefinition[] = [
  ...EXECUTION_FREQUENCY_PATTERNS,
  ...POSITION_BUILDING_PATTERNS,
  ...POSITION_REDUCTION_PATTERNS,
  ...POSITION_STRUCTURE_PATTERNS,
  ...TRADE_DURATION_PATTERNS,
  ...TRADE_EXCURSION_PATTERNS,
  ...TRADE_CLOSURE_PATTERNS,
  ...ENTRY_CONTEXT_PATTERNS,
  ...ENTRY_QUALITY_PATTERNS,
  ...EXIT_QUALITY_PATTERNS,
  ...SCALING_QUALITY_PATTERNS,
];