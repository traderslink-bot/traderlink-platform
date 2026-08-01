import {
  assertCanonicalJournalDecimal,
  assertJournalCurrency,
  assertJournalSha256,
  assertJournalTimezone,
  assertJournalToken,
  assertJournalTradingDate,
  assertJournalUtcTimestamp,
} from "./journal-storage-values";

describe("Journal storage values", () => {
  it.each(["0", "10", "-10", "0.125", "-0.125", "100.000001"])(
    "accepts canonical decimal %s",
    (value) => expect(() => assertCanonicalJournalDecimal(value, "value")).not.toThrow(),
  );

  it.each([
    "",
    "+1",
    "-0",
    "00",
    "01",
    "1.0",
    "1.",
    ".1",
    "1e2",
    "1.2.3",
    "--1",
  ])("rejects non-canonical decimal %s", (value) => {
    expect(() => assertCanonicalJournalDecimal(value, "value")).toThrowError(
      "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",
    );
  });

  it("enforces positive and non-negative decimal roles", () => {
    expect(() =>
      assertCanonicalJournalDecimal("0", "quantity", { positive: true }),
    ).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() =>
      assertCanonicalJournalDecimal("-1", "price", { nonNegative: true }),
    ).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    expect(() =>
      assertCanonicalJournalDecimal("0.01", "quantity", { positive: true }),
    ).not.toThrow();
  });

  it("validates currency, timezone, date, UTC, digests, and tokens", () => {
    expect(() => assertJournalCurrency("USD", "currency")).not.toThrow();
    expect(() => assertJournalTimezone("America/New_York", "timezone")).not.toThrow();
    expect(() => assertJournalTradingDate("2026-02-28", "date")).not.toThrow();
    expect(() =>
      assertJournalUtcTimestamp("2026-08-01T12:00:00.000Z", "timestamp"),
    ).not.toThrow();
    expect(() => assertJournalSha256("a".repeat(64), "digest")).not.toThrow();
    expect(() => assertJournalToken("ibkr_statement_v1", "token")).not.toThrow();

    for (const invalid of [
      () => assertJournalCurrency("usd", "currency"),
      () => assertJournalTimezone("Not/AZone", "timezone"),
      () => assertJournalTradingDate("2026-02-29", "date"),
      () => assertJournalUtcTimestamp("2026-08-01", "timestamp"),
      () => assertJournalSha256("A".repeat(64), "digest"),
      () => assertJournalToken("IBKR", "token"),
    ]) {
      expect(invalid).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    }
  });
});
