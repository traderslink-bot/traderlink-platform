import { describe, expect, it } from "vitest";

import { buildDailyWatchlistRecapComposition } from "./daily-recap-composition";

const candidateA = "11111111-1111-4111-8111-111111111111";
const candidateB = "22222222-2222-4222-8222-222222222222";
const draftA = "33333333-3333-4333-8333-333333333333";
const draftB = "44444444-4444-4444-8444-444444444444";

describe("buildDailyWatchlistRecapComposition", () => {
  it("preserves selected ticker order in the exact editable post body", () => {
    expect(buildDailyWatchlistRecapComposition([
      { candidateId: candidateA, draftRevisionId: draftA, position: 1, recapText: "Second recap." },
      { candidateId: candidateB, draftRevisionId: draftB, position: 0, recapText: "First recap." },
    ])).toBe("First recap.\n\nSecond recap.");
  });

  it("keeps Discord mentions out of the editable body", () => {
    expect(() => buildDailyWatchlistRecapComposition([
      { candidateId: candidateA, draftRevisionId: draftA, position: 0, recapText: "@everyone recap" },
    ])).toThrow("watchlist_daily_recap_recap_text_contains_mention");
  });

  it("rejects a duplicate or gapped selection order", () => {
    expect(() => buildDailyWatchlistRecapComposition([
      { candidateId: candidateA, draftRevisionId: draftA, position: 0, recapText: "One." },
      { candidateId: candidateB, draftRevisionId: draftB, position: 2, recapText: "Two." },
    ])).toThrow("watchlist_daily_recap_non_contiguous_composition_order");
  });
});
