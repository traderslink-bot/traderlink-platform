import type { PriceFormat } from "lightweight-charts";
import { additionalIndicator } from "./chart-indicator-catalog";
import { isPriceOverlayIndicator, type ChartIndicator } from "./chart-preferences";

export type IndicatorNumberFormat = {
  precision: number;
  axis: PriceFormat;
  readout: (value: number) => string;
};

export function formatIndicatorDecimal(value: number, precision: number): string {
  const text = value.toFixed(precision);
  return text.startsWith("-") && Number(text) === 0 ? text.slice(1) : text;
}

function formatPriceTick(value: number, precision: number): string {
  // Round the magnitude in ticks, as the candle series does. toFixed on the
  // original binary fraction can land on the opposite side of a half tick.
  const ticks = Math.round(Math.abs(value) * 10 ** precision);
  if (!Number.isSafeInteger(ticks)) return formatIndicatorDecimal(value, precision);
  const digits = String(ticks).padStart(precision + 1, "0");
  const sign = value < 0 && ticks > 0 ? "-" : "";
  return sign + (precision ? digits.slice(0, -precision) + "." + digits.slice(-precision) : digits);
}

export function indicatorNumberFormat(
  indicator: Pick<ChartIndicator, "type" | "output">,
  candlePrecision: number,
): IndicatorNumberFormat {
  const definition = additionalIndicator(indicator.type);
  const savedPrecision = indicator.output?.precision;
  if (definition?.scale === "volume" && savedPrecision === undefined) {
    return {
      precision: 0,
      axis: { type: "volume", precision: 2, minMove: 0.01 },
      readout: value => formatIndicatorDecimal(value, 0),
    };
  }

  const followsPrice = definition?.scale === "price" || isPriceOverlayIndicator(indicator.type) || indicator.type === "MACD";
  const precision = savedPrecision ?? (followsPrice ? candlePrecision : definition?.defaultPrecision ?? 2);
  const suffix = definition?.scale === "percent" ? "%" : "";
  // A price-derived value can be below $1 even when every candle is above it.
  const adaptivePrice = followsPrice && savedPrecision === undefined;
  const decimal = followsPrice ? formatPriceTick : formatIndicatorDecimal;
  const readout = (value: number) => {
    const places = adaptivePrice && Math.abs(value) < 1 ? 4 : precision;
    return decimal(value, places) + suffix;
  };
  const minMove = adaptivePrice ? 0.0001 : 10 ** -precision;
  const axis: PriceFormat = { type: "custom", formatter: readout, minMove };
  if (adaptivePrice) {
    axis.tickmarksFormatter = values => {
      const labels = values.map(readout);
      return new Set(labels).size === labels.length ? labels : values.map(value => formatPriceTick(value, 4));
    };
  }
  return { precision, axis, readout };
}
