export type Samples = readonly (number | null)[];

export function combine(inputs: readonly Samples[], calculate: (...values: number[]) => number | null) {
  return inputs[0].map((_, index) => {
    const values = inputs.map(input => input[index]);
    return values.some(value => value == null) ? null : calculate(...values as number[]);
  });
}

export function rollingSum(values: Samples, length: number) {
  let sum = 0;
  let count = 0;
  let nonzero = 0;
  return values.map((value, index) => {
    if (value !== null) {
      sum += value;
      count++;
      if (value !== 0) nonzero++;
    }
    const expired = values[index - length];
    if (expired != null) {
      sum -= expired;
      count--;
      if (expired !== 0) nonzero--;
    }
    // A window of exact zeros must not retain residue from expired prices or volume.
    if (nonzero === 0) sum = 0;
    return count === length ? sum : null;
  });
}

export function sma(values: Samples, length: number) {
  return rollingSum(values, length).map(value => value === null ? null : value / length);
}

export function smooth(values: Samples, length: number, wilders = false) {
  let seed = 0;
  let count = 0;
  let state: number | null = null;
  const alpha = wilders ? 1 / length : 2 / (length + 1);
  return values.map(value => {
    if (value === null) { seed = 0; count = 0; state = null; return null; }
    if (state !== null) { state += alpha * (value - state); return state; }
    seed += value;
    count++;
    if (count < length) return null;
    state = seed / length;
    return state;
  });
}

export function wma(values: Samples, length: number) {
  let sum = 0;
  let weighted = 0;
  let count = 0;
  const divisor = length * (length + 1) / 2;
  return values.map((value, index) => {
    const added = value ?? 0;
    const expired = values[index - length];
    weighted += Math.min(index + 1, length) * added - (index >= length ? sum : 0);
    sum += added - (expired ?? 0);
    count += Number(value !== null) - Number(expired != null);
    return count === length ? weighted / divisor : null;
  });
}

export function extremeIndexes(values: Samples, length: number, high: boolean) {
  const queue: number[] = [];
  let head = 0;
  let present = 0;
  return values.map((value, index) => {
    while (head < queue.length && queue[head] <= index - length) head++;
    if (value !== null) {
      while (head < queue.length && (high ? values[queue.at(-1)!]! <= value : values[queue.at(-1)!]! >= value)) queue.pop();
      queue.push(index);
      present++;
    }
    if (values[index - length] != null) present--;
    return present === length ? queue[head] : null;
  });
}

export function extremes(values: Samples, length: number, high: boolean) {
  return extremeIndexes(values, length, high).map(index => index === null ? null : values[index]);
}

export function lag(values: Samples, length: number) {
  return values.map((_, index) => values[index - length] ?? null);
}

export function rateOfChange(values: Samples, length: number) {
  return combine([values, lag(values, length)], (value, before) => before ? 100 * (value - before) / before : null);
}

export function relativeStrength(values: Samples, length: number) {
  const changes = combine([values, lag(values, 1)], (value, previous) => value - previous);
  const gains = smooth(changes.map(value => value === null ? null : Math.max(0, value)), length, true);
  const losses = smooth(changes.map(value => value === null ? null : Math.max(0, -value)), length, true);
  let previous: number | null = null;
  return changes.map((change, index) => {
    const gain = gains[index], loss = losses[index];
    if (gain === null || loss === null) return previous = null;
    // The gain/loss ratio stays constant when both averages decay on an unchanged bar.
    if (change === 0 && previous !== null) return previous;
    return previous = gain + loss ? 100 * (gain / (gain + loss)) : 50;
  });
}

export const ratioPercent = (positive: number, negative: number) =>
  positive + negative ? 100 * positive / (positive + negative) : 50;

export function stochastic(values: Samples, highs: Samples, lows: Samples, length: number) {
  return combine([values, extremes(highs, length, true), extremes(lows, length, false)],
    (value, high, low) => high !== low ? 100 * (value - low) / (high - low) : null);
}

export function cumulative(values: Samples) {
  let running = 0;
  return values.map(value => value === null ? null : (running += value));
}
