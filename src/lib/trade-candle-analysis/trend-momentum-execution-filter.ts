import type { TradeExecutionIndicatorResult } from "./trend-momentum-executions";
import { TRADE_INDICATOR_CALCULATION_VERSION } from "./trend-momentum-version";

const alignments = ["above", "below", "close"] as const;
const rsiBands = ["below_30", "30_to_below_50", "50_to_70", "above_70"] as const;
type Frame = Readonly<{ observedAt: number; alignment: typeof alignments[number] | null; rsiBand: typeof rsiBands[number] | null }>;
export type ExecutionIndicatorFilterContext = Readonly<{ calculationVersion: typeof TRADE_INDICATOR_CALCULATION_VERSION; oneMinute: Frame | null; fiveMinute: Frame | null }>;
export type SavedExecutionIndicatorFilterContext = ExecutionIndicatorFilterContext & Readonly<{ eventId: string; executedAtUtc: string }>;

export function saveExecutionIndicatorFilterContext(event: TradeExecutionIndicatorResult["executions"][number]): SavedExecutionIndicatorFilterContext {
  const frame = (context: typeof event.oneMinute): Frame | null => context ? {
    observedAt: context.observedAt, alignment: context.alignment, rsiBand: context.rsiBand,
  } : null;
  return { calculationVersion: TRADE_INDICATOR_CALCULATION_VERSION, eventId: event.eventId, executedAtUtc: event.executedAtUtc,
    oneMinute: frame(event.oneMinute), fiveMinute: frame(event.fiveMinute) };
}

/** Validate the binding before exposing categorization; omit private execution IDs. */
export function readExecutionIndicatorFilterContext(value: unknown, event: { eventId: string; executedAtUtc: string }): ExecutionIndicatorFilterContext | null {
  const object = (v: unknown): Record<string, unknown> | null => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null;
  const saved = object(value);
  const at = Date.parse(event.executedAtUtc) / 1000;
  if (!saved || saved.calculationVersion !== TRADE_INDICATOR_CALCULATION_VERSION || saved.eventId !== event.eventId ||
    saved.executedAtUtc !== event.executedAtUtc || !Number.isFinite(at)) return null;
  const frame = (raw: unknown): Frame | null => {
    const data = object(raw);
    if (!data || typeof data.observedAt !== "number" || !Number.isFinite(data.observedAt) || data.observedAt > at) return null;
    const alignment = (alignments as readonly unknown[]).includes(data.alignment) ? data.alignment as Frame["alignment"] : null;
    const rsiBand = (rsiBands as readonly unknown[]).includes(data.rsiBand) ? data.rsiBand as Frame["rsiBand"] : null;
    return { observedAt: data.observedAt, alignment, rsiBand };
  };
  return { calculationVersion: TRADE_INDICATOR_CALCULATION_VERSION, oneMinute: frame(saved.oneMinute), fiveMinute: frame(saved.fiveMinute) };
}

export type ExecutionIndicatorFilters = Readonly<{ interval: "1m" | "5m"; alignment: "any" | NonNullable<Frame["alignment"]>; rsiBand: "any" | NonNullable<Frame["rsiBand"]> }>;
export function matchesExecutionIndicatorFilter(context: ExecutionIndicatorFilterContext | null | undefined, filters: ExecutionIndicatorFilters): boolean | null {
  const frame = context?.[filters.interval === "1m" ? "oneMinute" : "fiveMinute"];
  if ((filters.alignment !== "any" && frame?.alignment == null) || (filters.rsiBand !== "any" && frame?.rsiBand == null)) return null;
  return (filters.alignment === "any" || frame?.alignment === filters.alignment) && (filters.rsiBand === "any" || frame?.rsiBand === filters.rsiBand);
}
