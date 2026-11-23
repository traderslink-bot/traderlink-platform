import { readFileSync } from "node:fs";
import vm from "node:vm";
import { LiveWatchlistArchiveDetailClient } from "@/app/watchlist/live-watchlist-client";
import type { LiveWatchlistArchiveSnapshot } from "./live-watchlist-types";
import { PremiumAnalysisCard } from "@/app/watchlist/premium-analysis-card";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WatchlistIndicatorsCard, WatchlistIndicatorsSample, WatchlistIndicatorsView } from "@/app/watchlist/watchlist-indicators-card";
import { SAMPLE_INDICATORS, SAMPLE_INDICATOR_PRICE } from "@/app/watchlist/watchlist-indicator-sample";
import { WatchlistV2PotentialPathCard } from "@/app/watchlist/potential-path-levels-card";
import { WatchlistPlanUpgrade } from "@/app/watchlist/watchlist-plan-upgrade";
import { PremiumTickerLock } from "@/app/watchlist/premium-ticker-lock";
import { WATCHLIST_PREMIUM_URL } from "@/app/watchlist/watchlist-upgrade-destination";
import { buildPremiumLevelsPreview } from "./premium-level-preview";
import { watchlistDetailProjection } from "./watchlist-member-projection";
import type { LiveWatchlistSymbolState, LiveWatchlistLevelMapLevel } from "./live-watchlist-types";

const level = (side: "support" | "resistance", price: number): LiveWatchlistLevelMapLevel => ({
  side, price, label: `PRIVATE ${price}`, distancePct: 0.123456789, strengthLabel: "major", sourceLabel: "daily confluence",
  marketDataProvenance: { formedAt: Date.parse("2026-10-20T14:30:00Z"), sourceLastSeenAt: 1795192200000, lastConfirmedAt: Date.parse("2026-11-20T14:30:00Z") },
});
const support = level("support", 3.43219), resistance = level("resistance", 5.67891);
const state = {
  symbol: "TEST", latestPrice: 4, updatedAt: 1700000000000, indicatorCardVisible: true,
  levelMap: { currentPrice: 4, rangeState: "normal", nearestSupport: support, nearestResistance: resistance,
    nextStrongSupport: support, nextStrongResistance: resistance, supportLevels: [support], resistanceLevels: [resistance] },
  cards: { nearestSupportResistance: { body: "PRIVATE levels" }, fullLadder: { body: "PRIVATE ladder" },
    technicalContext: { body: "PRIVATE indicators" }, companyInfo: { body: "Public company" }, tradersLinkAiRead: { body: "PRIVATE analysis" } },
} as unknown as LiveWatchlistSymbolState;

function element(html: string) { const div = document.createElement("div"); div.innerHTML = html; return div; }
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

describe("Watchlist locked-card destinations", () => {
  for (const feature of ["Ticker", "Trade analysis", "Support and Resistance", "Indicator card"]) {
    it(`${feature}: legacy Whop opens separately, selected public plans and private offers retain their contract`, () => {
      const premium = element(renderToStaticMarkup(createElement(WatchlistPlanUpgrade, { feature, premium: true, href: undefined })));
      const link = premium.querySelector("a")!;
      expect(link.getAttribute("href")).toBe(WATCHLIST_PREMIUM_URL);
      expect(link.target).toBe("_blank"); expect(link.rel).toContain("noopener"); expect(link.rel).toContain("noreferrer");
      const custom = element(renderToStaticMarkup(createElement(WatchlistPlanUpgrade, { feature, premium: true, href: "/plans?feature=watchlist.levels&watchlistTicker=TEST&watchlistControl=levels" })));
      expect(custom.querySelector("a")!.target).toBe(""); expect(custom.innerHTML).not.toContain("whop.com");
      const privateOffer = renderToStaticMarkup(createElement(WatchlistPlanUpgrade, { feature, premium: true, href: null }));
      expect(privateOffer).toContain("Contact the owner"); expect(privateOffer).not.toContain("href=");
    });
  }
  it("keeps the whole-ticker legacy upgrade and the separate sign-in navigation", () => {
    const card = element(renderToStaticMarkup(createElement(PremiumTickerLock, {})));
    expect(card.querySelector('a[href^="https://whop.com"]')!.getAttribute("target")).toBe("_blank");
    expect(card.querySelector('a[href^="/login"]')!.getAttribute("target")).toBeNull();
  });
  it("retains global Membership feature routing rather than granting legacy Premium access", () => {
    const card = element(renderToStaticMarkup(createElement(WatchlistIndicatorsSample, {})));
    expect(card.querySelector("a")!.getAttribute("href")).toBe("/plans?feature=watchlist.indicators");
    expect(card.querySelector("a")!.target).toBe("");
  });
});

describe("Real level descriptors with private prices and dates removed", () => {
  it("retains exact strength/confluence and provenance labels, excludes every protected input even in serialized props", () => {
    const before = JSON.stringify(state);
    const projected = watchlistDetailProjection(state, true, true, false);
    expect(projected.premiumLevelsPreview!.support).toEqual([{ strength: "major", source: "daily confluence", nearest: true, provenance: ["Formed", "Confirmed"] }]);
    const html = renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard, { symbol: projected }));
    const card = element(html);
    expect(card.querySelectorAll(".watchlist-v2-level-row")).toHaveLength(2);
    expect(card.querySelectorAll(".watchlist-v2-nearest-item")).toHaveLength(2);
    expect(card.querySelectorAll(".watchlist-v2-level-section")).toHaveLength(2);
    expect(card.textContent).toContain("major / daily confluence"); expect(card.textContent).toContain("Formed"); expect(card.textContent).toContain("Confirmed");
    expect(card.querySelectorAll('[aria-label="Date requires feature access"]')).toHaveLength(8);
    for (const secret of ["3.43219", "5.67891", "0.123456789", "Oct 20", "Nov 20", "PRIVATE", String(support.marketDataProvenance!.formedAt), String(support.marketDataProvenance!.lastConfirmedAt)]) {
      expect(html).not.toContain(secret); expect(JSON.stringify(projected)).not.toContain(secret === "PRIVATE" ? "PRIVATE levels" : secret);
    }
    expect(projected.cards.fullLadder).toBeUndefined(); expect(projected.levelMap!.supportLevels).toEqual([]);
    expect(JSON.stringify(state)).toBe(before);
    expect(watchlistDetailProjection(projected, true).premiumLevelsPreview).toEqual(projected.premiumLevelsPreview);
    expect(watchlistDetailProjection(projected, true, true, true).premiumLevelsPreview).toBeNull();
  });
  it("matches the permitted card row structure and keeps all normal values when allowed", () => {
    const allowed = watchlistDetailProjection(state, true);
    const normal = element(renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard, { symbol: allowed })));
    const locked = element(renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard, { symbol: watchlistDetailProjection(state, true, true, false) })));
    for (const selector of [".watchlist-v2-level-row", ".watchlist-v2-level-price", ".watchlist-v2-level-distance", ".watchlist-v2-level-meta", ".watchlist-v2-nearest-item"]) expect(locked.querySelectorAll(selector).length).toBe(normal.querySelectorAll(selector).length);
    expect(normal.textContent).toContain("3.43"); expect(normal.textContent).toContain("Oct 20");
    expect(allowed.levelMap).toBe(state.levelMap);
  });
  for (const format of ["current", "simple"] as const) it(`reuses the same safe ${format} Analysis card for legacy and Membership denial, without passing the raw analysis`, () => {
    const fixture = readFileSync("src/lib/live-watchlist/__tests__/traderslink-ai-read.test.ts", "utf8").match(/function validBody\(\) \{[\s\S]*?\n\}/)![0];
    const raw = JSON.parse(vm.runInNewContext(fixture + ";validBody()"));
    if (format === "simple") Object.assign(raw, { version: 3, analysisFormat: "simple", pullbackPlans: { shallow: null, deep: null }, failureRecovery: null,
      simpleAnalysis: { setup: "Momentum near $1.36.", pullbacks: [{ low: 1.25, high: 1.3, explanation: "Retest $1.30", confirmation: "Reclaim $1.30", invalidation: null }],
        upside: [{ low: 1.8, high: 1.8, explanation: "Prior high $1.80" }], invalidation: null } });
    const value = { ...state, cards: { ...state.cards, tradersLinkAiRead: { body: JSON.stringify(raw) } } } as LiveWatchlistSymbolState;
    const legacy = watchlistDetailProjection(value, true, false);
    const membership = watchlistDetailProjection(value, false, true);
    expect(legacy.premiumAnalysisPreview).not.toBeNull();
    expect(membership.premiumAnalysisPreview).toEqual(legacy.premiumAnalysisPreview);
    expect(membership.cards.tradersLinkAiRead).toBeUndefined();
    const original = element(renderToStaticMarkup(createElement(PremiumAnalysisCard, { preview: legacy.premiumAnalysisPreview!, symbol: value.symbol })));
    const plans = element(renderToStaticMarkup(createElement(PremiumAnalysisCard, { preview: membership.premiumAnalysisPreview!, symbol: value.symbol, premium: false })));
    expect([...plans.querySelectorAll("h3")].map(n => n.textContent)).toEqual([...original.querySelectorAll("h3")].map(n => n.textContent));
    expect(plans.querySelector("a")!.getAttribute("href")).toBe("/plans?feature=watchlist.trade_analysis");
    expect(original.querySelector("a")!.getAttribute("href")).toBe(WATCHLIST_PREMIUM_URL);
  });
  it("distinguishes the global Levels feature denial from a legacy Premium lock without changing permissions", () => {
    const denied = watchlistDetailProjection(state, true, true, false, undefined, true, true, false);
    const markup = element(renderToStaticMarkup(createElement(WatchlistV2PotentialPathCard, { symbol: denied })));
    expect(markup.querySelector("a")!.getAttribute("href")).toBe("/plans?feature=watchlist.levels");
    expect(denied.premiumLevelsAllowed).toBe(false);
    const allowedOverride = watchlistDetailProjection(state, true, true, true, undefined, true, true, false);
    expect(allowedOverride.levelMap).toBe(state.levelMap);
    expect(allowedOverride.premiumLevelsAllowed).toBe(true);
    expect(watchlistDetailProjection(denied, true).membershipLevelsAllowed).toBe(false);
  });
  it("drops future private/free-text fields instead of accidentally exposing them as descriptors", () => {
    const bad = { ...support, sourceLabel: "PRIVATE $3.43219 Oct 20", timeframes: ["daily" as const], futureEvidence: "PRIVATE" };
    const preview = buildPremiumLevelsPreview({ ...state.levelMap!, supportLevels: [bad] });
    expect(preview!.support[0].source).toBe("daily");
    expect(JSON.stringify(preview)).not.toMatch(/PRIVATE|3\.43219|Oct 20|futureEvidence/);
  });
  for (const analysis of [false, true]) for (const levels of [false, true]) for (const indicators of [false, true]) for (const premiumIndicators of [false, true]) {
    it(`independent decisions analysis=${analysis}, levels=${levels}, membershipIndicators=${indicators}, premiumIndicators=${premiumIndicators}`, () => {
      const out = watchlistDetailProjection(state, analysis, true, levels, undefined, indicators, premiumIndicators);
      expect(Boolean(out.cards.tradersLinkAiRead)).toBe(analysis);
      expect(Boolean(out.cards.fullLadder)).toBe(levels);
      expect(Boolean(out.cards.technicalContext)).toBe(indicators && premiumIndicators);
      expect(out.membershipIndicatorsAllowed).toBe(indicators && premiumIndicators);
      expect(out.cards.companyInfo).toEqual(state.cards.companyInfo);
    });
  }
});

describe("Owner-hidden cards stay hidden for allowed and locked viewers", () => {
  for (const allowed of [false, true]) it(`respects saved card visibility with membership allowed=${allowed}`, () => {
    const raw = { ...state, cards: {}, firstPostedAt: 1700000000000, status: "live", indicatorCardVisible: false, tradersLinkAiReadCardVisible: false } as LiveWatchlistSymbolState;
    const projected = watchlistDetailProjection(raw, allowed, allowed, true, undefined, allowed, allowed);
    expect(projected.indicatorCardOwnerVisible).toBe(false);
    expect(watchlistDetailProjection(projected, allowed).indicatorCardOwnerVisible).toBe(false);
    expect(projected.premiumAnalysisPreview).toBeNull();
    const archive = { archiveId: "isolated-fixture", symbol: "TEST", archivedAt: 1700000000000, firstPostedAt: 1700000000000, lastActiveUpdatedAt: 1700000000000, state: projected } as LiveWatchlistArchiveSnapshot;
    const markup = element(renderToStaticMarkup(createElement(LiveWatchlistArchiveDetailClient, { archive })));
    expect(markup.querySelector('[data-card-label="Indicators"]')).toBeNull();
    expect(markup.querySelector('[data-card-label="TradersLink Analysis"]')).toBeNull();
  });
  it("keeps an owner-enabled locked Indicator sample visible through safe re-projection", () => {
    const projected = watchlistDetailProjection({ ...state, cards: {}, tradersLinkAiReadCardVisible: false }, false, false, true, undefined, false, false);
    expect(projected.indicatorCardVisible).toBe(false);
    expect(projected.indicatorCardOwnerVisible).toBe(true);
    const archive = { archiveId: "isolated-fixture", symbol: "TEST", archivedAt: 1700000000000, firstPostedAt: 1700000000000, lastActiveUpdatedAt: 1700000000000, state: watchlistDetailProjection(projected, false) } as LiveWatchlistArchiveSnapshot;
    const markup = element(renderToStaticMarkup(createElement(LiveWatchlistArchiveDetailClient, { archive })));
    expect(markup.querySelector('[data-card-label="Indicators"][data-sample="true"]')).not.toBeNull();
  });
});

describe("Full illustrative Indicator card", () => {
  it("uses the same groups, tabs and summaries as the normal card and labels all sample content", () => {
    const locked = element(renderToStaticMarkup(createElement(WatchlistIndicatorsSample, { premium: true })));
    const normal = element(renderToStaticMarkup(createElement(WatchlistIndicatorsView, { current: SAMPLE_INDICATORS, livePrice: SAMPLE_INDICATOR_PRICE })));
    expect([...locked.querySelectorAll("dt")].map(n => n.textContent)).toEqual([...normal.querySelectorAll("dt")].map(n => n.textContent));
    expect(locked.querySelectorAll('[role="tab"]')).toHaveLength(4); expect(locked.querySelectorAll("dt")).toHaveLength(5);
    expect(locked.querySelector('[data-sample="true"]')).not.toBeNull();
    expect(locked.textContent).toContain("not this ticker’s data");
    expect(locked.querySelectorAll('[aria-hidden="true"] span').length).toBeGreaterThanOrEqual(3);
    expect(locked.textContent).toContain("SAMPLE"); expect(normal.textContent).not.toContain("SAMPLE");
  });
  it("switches frames and opens/closes real help without requesting or persisting ticker data", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
    try {
      await act(async () => root.render(createElement(WatchlistIndicatorsSample, { premium: true })));
      const first = host.querySelector('[role="tab"]') as HTMLButtonElement;
      await act(async () => first.click()); expect(first.getAttribute("aria-selected")).toBe("true"); expect(host.textContent).toContain("Overbought");
      const help = host.querySelector('[aria-label="About VWAP"]') as HTMLButtonElement;
      await act(async () => help.click()); expect(help.getAttribute("aria-expanded")).toBe("true");
      await act(async () => help.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
      expect(help.getAttribute("aria-expanded")).toBe("false");
      expect(fetch).not.toHaveBeenCalled(); expect(localStorage.length).toBe(0);
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
  it("restores the normal card timeframe preference without changing sample preferences", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    localStorage.setItem("traderslink.watchlist.indicators.timeframe:v1", "1d");
    const host = document.createElement("div"); const root = createRoot(host);
    try {
      await act(async () => root.render(createElement(WatchlistIndicatorsView, { current: SAMPLE_INDICATORS, livePrice: 2.4 })));
      expect(host.querySelector('[aria-selected="true"]')!.textContent).toBe("Daily");
      await act(async () => (host.querySelector('[role="tab"]') as HTMLButtonElement).click());
      expect(localStorage.getItem("traderslink.watchlist.indicators.timeframe:v1")).toBe("1m");
      await act(async () => root.render(createElement(WatchlistIndicatorsSample, { premium: true })));
      expect(host.querySelector('[aria-selected="true"]')!.textContent).toBe("5m");
      expect(localStorage.getItem("traderslink.watchlist.indicators.timeframe:v1")).toBe("1m");
    } finally { await act(async () => root.unmount()); }
  });
  it("still fetches normally for an allowed active publication", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const fetch = vi.fn(async (url: string) => ({ ok: true, status: 200, json: async () => ({ snapshot: url ? { ...SAMPLE_INDICATORS, symbol: "TEST", activationId: "test-publication" } : null }) }));
    vi.stubGlobal("fetch", fetch);
    const host = document.createElement("div"); const root = createRoot(host);
    try {
      await act(async () => root.render(createElement(WatchlistIndicatorsCard, { symbol: "TEST", firstPostedAt: 1700000000000, publicationIdentity: "test-publication", livePrice: 2.4 })));
      expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][0]).toBe("/api/live-watchlist/symbols/TEST/indicators");
      expect(host.querySelector('[data-sample="true"]')).toBeNull();
    } finally { await act(async () => root.unmount()); }
  });
});
