import {describe, expect, it} from "vitest";
import {coachingDayTradeCapProblem as problem} from "./coaching-day-trade-cap";
const trades = [{roundTripId:"a",tradingDate:"2026-10-15"},{roundTripId:"b",tradingDate:"2026-10-15"},{roundTripId:"c",tradingDate:"2026-10-16"}];
describe("accepted day review trade caps", () => {
  it("counts the union across days without charging an already-selected ID twice", () => {
    expect(problem({basis:"per_review",quantity:2},["a"],["a","c"],trades)).toBeNull();
    expect(problem({basis:"per_review",quantity:2},["a","b"],["c"],trades)).toContain("2 individual trade reviews across the whole review");
  });
  it("allows the next day but rejects another trade on a full day", () => {
    expect(problem({basis:"per_day",quantity:1},["a"],["c"],trades)).toBeNull();
    expect(problem({basis:"per_day",quantity:1},["a"],["b","c"],trades)).toContain("per trading day");
    expect(problem(null,["a","b"],["c"],trades)).toBeNull();
  });
});
