export type CoachingCommissionDurationUnit = "days" | "weeks" | "months";
export type CoachingCommissionCurrency = "USD" | "CAD";

/** Parse displayed hundredths without silently rounding the owner's input. */
export function parseCommissionHundredths(value: string, maximum = Number.MAX_SAFE_INTEGER): number {
  const text = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/u.test(text)) throw new Error("Enter a number with up to two decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (minor > BigInt(maximum)) throw new Error("Amount is outside the supported range.");
  return Number(minor);
}

export function validateDormantCoachingCommission(input: {
  feeBasisPoints: number; minimumCommissionMinor?: number | null; currency?: string;
  durationCount?: number | null; durationUnit?: string | null;
}) {
  if (!Number.isInteger(input.feeBasisPoints) || input.feeBasisPoints < 0 || input.feeBasisPoints > 10000) throw new Error("Choose a commission between 0 and 100 percent.");
  const minimumCommissionMinor = input.minimumCommissionMinor ?? null;
  if (minimumCommissionMinor !== null && (!Number.isSafeInteger(minimumCommissionMinor) || minimumCommissionMinor < 0)) throw new Error("Choose a valid minimum commission.");
  const currency = input.currency ?? "USD";
  if (currency !== "USD" && currency !== "CAD") throw new Error("Choose USD or CAD.");
  const durationCount = input.durationCount ?? null;
  const durationUnit = input.durationUnit ?? null;
  if ((durationCount === null) !== (durationUnit === null)
    || (durationCount !== null && (!Number.isInteger(durationCount) || durationCount < 1 || durationCount > 36500))
    || (durationUnit !== null && !["days", "weeks", "months"].includes(durationUnit))) throw new Error("Choose a valid commission duration.");
  return { minimumCommissionMinor, currency, durationCount, durationUnit };
}
