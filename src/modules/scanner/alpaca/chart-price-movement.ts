export type PriceMovementKind = "renko" | "range";

/** Times are provider UTC timestamps. Equally timed trades retain provider order. */
export type OrderedChartTrade = Readonly<{ time: string; price: number }>;
export type PriceMovementBar = Readonly<{
  position: number; time: string; open: number; high: number; low: number; close: number; complete: boolean;
}>;

const precision = 100_000_000;
const maxBars = 20_000;

function priceUnits(price: number) {
  const units = Math.round(price * precision);
  if (!Number.isSafeInteger(units) || units < 1 || Math.abs(price - units / precision) > Number.EPSILON * price * 2) {
    throw Error("invalid_price_movement_price");
  }
  return units;
}

function orderedTime(time: string) {
  const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/.exec(time);
  if (!parts || !Number.isFinite(Date.parse(parts[1] + "Z"))) throw Error("invalid_price_movement_time");
  return parts[1] + "." + (parts[2] ?? "").padEnd(9, "0") + "Z";
}

type UnitBar = Omit<PriceMovementBar, "position" | "complete">;

export function createPriceMovementSeries(kind: PriceMovementKind, priceStep: number) {
  const step = priceUnits(priceStep);
  const output: PriceMovementBar[] = [];
  let anchor = 0;
  let direction: -1 | 0 | 1 = 0;
  let active: UnitBar | undefined;
  let lastTime: string | undefined;

  function atNextPosition(bar: UnitBar, complete: boolean) {
    if (output.length >= maxBars) throw Error("price_movement_bar_limit");
    const { time, open, high, low, close } = bar;
    return {
      position: output.length, time, open: open / precision, high: high / precision,
      low: low / precision, close: close / precision, complete,
    };
  }

  function append(trade: OrderedChartTrade) {
    const key = orderedTime(trade.time);
    if (lastTime && key < lastTime) throw Error("unordered_price_movement_trades");
    lastTime = key;
    const price = priceUnits(trade.price);
    const time = trade.time;
    if (kind === "renko") {
      if (anchor === 0) anchor = price;
      while (Math.abs(price - anchor) >= step) {
        const nextDirection: -1 | 1 = price > anchor ? 1 : -1;
        const reversal: boolean = direction !== 0 && direction !== nextDirection;
        if (reversal && Math.abs(price - anchor) < 2 * step) break;
        const open: number = reversal ? anchor + nextDirection * step : anchor;
        const close: number = open + nextDirection * step;
        output.push(atNextPosition({ time, open, high: Math.max(open, close), low: Math.min(open, close), close }, true));
        anchor = close;
        direction = nextDirection;
      }
      return;
    }

    active ??= { time, open: price, high: price, low: price, close: price };
    while (price - active.low >= step || active.high - price >= step) {
      const close: number = price > active.high ? active.low + step : active.high - step;
      output.push(atNextPosition({ ...active, time, high: Math.max(active.high, close), low: Math.min(active.low, close), close }, true));
      active = { time, open: close, high: close, low: close, close };
    }
    active = { ...active, time, high: Math.max(active.high, price), low: Math.min(active.low, price), close: price };
  }
  function bars(): readonly PriceMovementBar[] {
    if (kind === "range" && active && (active.high !== active.low || !output.length)) {
      return [...output, atNextPosition(active, false)];
    }
    return output.slice();
  }
  return { append, bars };
}

/** A series can contain several completed bars at a single trade time. */
export function buildPriceMovementBars(
  kind: PriceMovementKind, orderedTrades: Iterable<OrderedChartTrade>, priceStep: number,
): readonly PriceMovementBar[] {
  const series = createPriceMovementSeries(kind, priceStep);
  for (const trade of orderedTrades) series.append(trade);
  return series.bars();
}
