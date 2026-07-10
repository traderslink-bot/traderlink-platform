import { describe, expect, it } from "vitest";

import {
  buildWatchlistPreviewMetadata,
  isWatchlistPath,
  isWatchlistPreviewCrawlerUserAgent,
  renderWatchlistPreviewHtml,
} from "../watchlist-preview";

describe("watchlist preview helpers", () => {
  it("recognizes Discord preview crawler user agents without matching normal browsers", () => {
    expect(isWatchlistPreviewCrawlerUserAgent("Discordbot/2.0")).toBe(true);
    expect(
      isWatchlistPreviewCrawlerUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      ),
    ).toBe(false);
  });

  it("recognizes watchlist paths only", () => {
    expect(isWatchlistPath("/watchlist")).toBe(true);
    expect(isWatchlistPath("/watchlist/VRAX")).toBe(true);
    expect(isWatchlistPath("/academy")).toBe(false);
  });

  it("builds ticker-specific metadata", () => {
    const metadata = buildWatchlistPreviewMetadata("/watchlist/vrax");

    expect(metadata.title).toBe("VRAX Live Watchlist | TradersLink");
    expect(metadata.description).toContain("VRAX");
    expect(metadata.openGraph).toMatchObject({
      title: "VRAX Live Watchlist | TradersLink",
      url: "/watchlist/VRAX",
      siteName: "TradersLink",
    });
  });

  it("renders TradersLink Open Graph HTML for OAuth preview crawlers", () => {
    const html = renderWatchlistPreviewHtml({
      origin: "https://traderslink.pro",
      path: "/watchlist/VRAX",
    });

    expect(html).toContain("<title>VRAX Live Watchlist | TradersLink</title>");
    expect(html).toContain('property="og:site_name" content="TradersLink"');
    expect(html).toContain('property="og:url" content="https://traderslink.pro/watchlist/VRAX"');
    expect(html).not.toContain("discord.com/oauth2");
  });
});
