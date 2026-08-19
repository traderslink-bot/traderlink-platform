import { createHash } from "node:crypto";

type CanonicalValue = null | boolean | number | string |
  readonly CanonicalValue[] | { readonly [key: string]: CanonicalValue };

function canonicalize(value: unknown, seen: WeakSet<object>): CanonicalValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new Error("TRADERLINK_COACH_INSIGHT_CANONICAL_VALUE_INVALID");
    }
    return value;
  }
  if (typeof value !== "object" || value === undefined) {
    throw new Error("TRADERLINK_COACH_INSIGHT_CANONICAL_VALUE_INVALID");
  }
  if (seen.has(value)) {
    throw new Error("TRADERLINK_COACH_INSIGHT_CANONICAL_VALUE_CYCLIC");
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => canonicalize(item, seen));
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("TRADERLINK_COACH_INSIGHT_CANONICAL_VALUE_INVALID");
    }
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => [key, canonicalize(item, seen)]));
  } finally {
    seen.delete(value);
  }
}

export function canonicalCoachAiReviewInsightBytes(value: unknown): Buffer {
  return Buffer.from(JSON.stringify(canonicalize(value, new WeakSet())), "utf8");
}

export function digestCanonicalCoachAiReviewInsight(value: unknown): Readonly<{
  byteLength: number;
  digestSha256: string;
}> {
  const bytes = canonicalCoachAiReviewInsightBytes(value);
  return Object.freeze({
    byteLength: bytes.byteLength,
    digestSha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

export function deepFreezeCoachAiReviewInsight<T>(value: T): Readonly<T> {
  const seen = new WeakSet<object>();
  const freeze = (candidate: unknown): void => {
    if (!candidate || typeof candidate !== "object" || seen.has(candidate)) return;
    seen.add(candidate);
    for (const child of Array.isArray(candidate)
      ? candidate
      : Object.values(candidate as Record<string, unknown>)) {
      freeze(child);
    }
    Object.freeze(candidate);
  };
  freeze(value);
  return value as Readonly<T>;
}
