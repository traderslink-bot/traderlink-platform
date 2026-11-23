import type { Candle } from "./candles";

export type EffectiveDailySplit = Readonly<{ exDate: string; oldRate: number; newRate: number }>;
type Ratio = readonly [numerator: bigint, denominator: bigint];

const one = BigInt(1);
const two = BigInt(2);
const ten = BigInt(10);

const powerOfTen = (exponent: number): Ratio =>
  exponent >= 0 ? [ten ** BigInt(exponent), one] : [one, ten ** BigInt(-exponent)];

function decimal(value: number): Ratio {
  const [coefficient, exponent = "0"] = value.toString().split("e");
  const [whole, fraction = ""] = coefficient.split(".");
  const [numerator, denominator] = powerOfTen(Number(exponent) - fraction.length);
  return [BigInt(whole + fraction) * numerator, denominator];
}

function sameRatio([numerator, denominator]: Ratio, [otherNumerator, otherDenominator]: Ratio): boolean {
  return numerator * otherDenominator === otherNumerator * denominator;
}

/** Check Alpaca's observed native precision. The returned provider price remains authoritative and untouched. */
function matchesAdjustedPrice(raw: number, split: number, factor: Ratio): boolean {
  const [price, scale] = decimal(raw);
  const adjusted: Ratio = [price * factor[0], scale * factor[1]];
  const observed = decimal(split);
  if (sameRatio(adjusted, observed)) return true;

  let magnitude = adjusted[0].toString().length - adjusted[1].toString().length;
  const [threshold, thresholdScale] = powerOfTen(magnitude);
  if (adjusted[0] * thresholdScale < adjusted[1] * threshold) magnitude--;
  const [tick, tickScale] = powerOfTen(Math.min(-2, magnitude - 3));
  const units = adjusted[0] * tickScale;
  const unitScale = adjusted[1] * tick;
  const lower = units / unitScale;
  const twiceRemainder = (units % unitScale) * two;
  return (twiceRemainder <= unitScale && sameRatio(observed, [lower * tick, tickScale])) ||
    (twiceRemainder >= unitScale && sameRatio(observed, [(lower + one) * tick, tickScale]));
}

/** The caller proves the listing lineage and repeats the exact split response independently. */
export function verifyDailySplitAdjustment(raw: Candle, split: Candle, date: string,
  actions: readonly EffectiveDailySplit[]): boolean {
  if (raw.time !== split.time) return false;
  let factor: Ratio = [one, one];
  for (const event of actions) {
    if (event.exDate <= date) continue;
    if (!Number.isFinite(event.oldRate) || !Number.isFinite(event.newRate) || event.oldRate <= 0 || event.newRate <= 0) return false;
    const [oldShares, oldScale] = decimal(event.oldRate);
    const [newShares, newScale] = decimal(event.newRate);
    factor = [factor[0] * oldShares * newScale, factor[1] * oldScale * newShares];
  }
  if (factor[0] === factor[1]) return raw.open === split.open && raw.high === split.high &&
    raw.low === split.low && raw.close === split.close && raw.volume === split.volume;
  if (!Number.isSafeInteger(raw.volume) || !Number.isSafeInteger(split.volume) ||
    BigInt(split.volume) !== BigInt(raw.volume) * factor[1] / factor[0]) return false;
  return matchesAdjustedPrice(raw.open, split.open, factor) && matchesAdjustedPrice(raw.high, split.high, factor) &&
    matchesAdjustedPrice(raw.low, split.low, factor) && matchesAdjustedPrice(raw.close, split.close, factor);
}
