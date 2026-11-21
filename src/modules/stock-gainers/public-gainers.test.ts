import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

const archive = { sessions: { "2026-11-18": { compared: 3159, provider: "Alpaca", feed: "sip",
  rows: [{ symbol: "SHFS", security: "SHFS", close: .029, sessionHigh: .035, gain: 57.65, dollarVolume: 1234567, provider: "Moomoo" }] } }, aliases: { SHFS: ["SHFS"] } };
for (const path of ["", "2026-11-18", "month/2026-11", "sitemap.xml"]) {
  it(`renders neutral public ${path || "hub"} without losing rankings or navigation`, () => {
    const html = execFileSync("python3", ["src/scripts/render-public-gainers-request.py", path], { input: JSON.stringify(archive), encoding: "utf8" });
    expect(html).not.toMatch(/Alpaca|Moomoo|Finnhub|EODHD|token=/i);
    expect(html).toContain("https://traderslink.pro/stock-gainers/");
    if (path === "2026-11-18") {
      expect(html).toContain("3,159 stocks compared");
      expect(html).toContain("SHFS"); expect(html).toContain("57.65%");
      expect(html).toContain("Split-adjusted max gain");
    }
    if (path === "") expect(html).toContain('id="gainers-pilot-data"');
  });
}
