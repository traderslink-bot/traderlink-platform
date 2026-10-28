// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hasGeneralMarketNewsAccess } from "../general-market-news-access";
const first = "11111111-1111-4111-8111-111111111111", second = "22222222-2222-4222-8222-222222222222";
describe("general news personal-test access", () => {
  const environment = { TRADERLINK_GENERAL_NEWS_USER_IDS: `${first},${second}` };
  const identity = (userId: string) => ({ scope: { userId, workspaceId: first, workspaceRole: "owner" as const, allowedAccountIds: [], activeAccountId: null } });
  it("admits both exact stable identities independently of Journal selection", () => {
    expect(hasGeneralMarketNewsAccess(identity(first), environment)).toBe(true);
    expect(hasGeneralMarketNewsAccess(identity(second), environment)).toBe(true);
  });
  it("fails closed for missing, duplicate, malformed and third identities", () => {
    expect(hasGeneralMarketNewsAccess(null, environment)).toBe(false);
    expect(hasGeneralMarketNewsAccess(identity("33333333-3333-4333-8333-333333333333"), environment)).toBe(false);
    for (const config of [undefined, first, `${first},${first}`, "This Guy,TradersLink", `${first},${second},${first}`]) {
      expect(hasGeneralMarketNewsAccess(identity(first), { TRADERLINK_GENERAL_NEWS_USER_IDS: config })).toBe(false);
    }
  });
});
