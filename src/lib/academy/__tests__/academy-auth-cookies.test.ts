import { describe, expect, it } from "vitest";

import { getAcademyCookieDomain } from "../academy-auth-cookies";

describe("Academy auth cookie helpers", () => {
  it("shares login cookies across the apex and www TradersLink hosts", () => {
    expect(getAcademyCookieDomain("traderslink.pro")).toBe(".traderslink.pro");
    expect(getAcademyCookieDomain("www.traderslink.pro")).toBe(
      ".traderslink.pro",
    );
  });

  it("keeps preview and local cookies host scoped", () => {
    expect(getAcademyCookieDomain("localhost")).toBeUndefined();
    expect(
      getAcademyCookieDomain("vercel-landing-example.vercel.app"),
    ).toBeUndefined();
  });
});
