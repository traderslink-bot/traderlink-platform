// @vitest-environment node
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import { SHARED_CHART_REPLAY as fixture } from "@/src/modules/market-data/chart-evidence/replay-fixture";
import { AcceptedSeriesPublisher } from "@/src/modules/market-data/accepted-series/publisher";
import { projectChartOverlay } from "@/src/modules/market-data/chart-evidence/overlay";
import { browserDataSession } from "@/src/modules/market-data/server/browser-data-session";
import { ChartSessionCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET } from "@/src/modules/scanner/alpaca/rest-data";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import ScannersPage from "@/app/(dashboard)/scanners/page";
import MarketChartsPage from "@/app/(dashboard)/charts/page";
import { GET } from "@/app/api/scanners/evidence/route";

import { acceptFourHourCandle } from "./accepted-four-hour-candle";
import { evaluateAcceptedRegularFourHourMatch, evaluateLiveFourHourLevelMatch, evaluateScannerFourHourLevelMatch } from "./evaluate-four-hour-level-match";
import { attachScannerEvidenceReferences, invalidateScannerChartEvidence, matchCompletedLevelBreak, readScannerLevelBreaks, resolveScannerChartEvidence } from "./scanner-chart-evidence";
import { refreshAcceptedScannerLevelBreaks } from "./refresh-accepted-level-breaks";
import type { ScanResult, ScanRule } from "../definition";

const state = vi.hoisted(() => ({ revision: 0, allowed: true, map: vi.fn(), gateway: vi.fn(), user: "alice" }));
vi.mock("@/src/modules/scanner/alpaca/client", () => ({ requestAlpacaGateway: state.gateway }));
vi.mock("@/src/modules/market-data/server/provider-settings", () => ({ marketDataSelection: () => ({ provider: "alpaca", revision: state.revision }) }));
vi.mock("@/src/modules/market-data/server/market-tools-dashboard-access", () => ({ hasScannerDashboardAccess: () => state.allowed }));
vi.mock("@/src/modules/market-data/server/chart-dashboard-access", () => ({ hasChartsDashboardAccess: () => true }));
vi.mock("@/src/modules/market-data/server/chart-evidence-levels-read", () => ({
  readOwnedChartLevelMap: state.map,
  listRecentOwnedChartLevelMaps: (request: TraderLinkPlatformRequestIdentity) =>
    request.scope.userId === "alice" ? [state.map()] : [],
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => identity(state.user),
  requireTraderLinkPlatformPageIdentity: async () => identity(state.user),
}));

vi.mock("@/app/dashboard-template", () => ({
  DashboardPage: ({ children }: {children: ReactNode}) => createElement("main", null, children),
  DashboardPanel: ({ children, title, action }: {children: ReactNode; title: string; action: ReactNode}) =>
    createElement("section", null, title, action, children),
  DashboardSecondaryAction: ({ children, href }: {children: ReactNode; href: string}) => createElement("a", { href }, children),
}));
vi.mock("@/app/(dashboard)/screeners/live-screeners-client", () => ({
  LiveScreenersClient: () => createElement("div", null, "Live scanner"),
}));
vi.mock("@/app/(dashboard)/charts/market-chart", () => ({
  MarketChart: ({ evidence, timeframe }: { evidence: { basis: { symbol: string } }; timeframe: string }) =>
    createElement("div", { "data-evidence-chart": evidence.basis.symbol, "data-frame": timeframe }),
}));
vi.mock("@/app/(dashboard)/charts/market-chart-workspace", () => ({
  MarketChartWorkspace: ({ evidenceHandoff }: { evidenceHandoff?: { evidence: { basis: { symbol: string } }; timeframe: string } }) =>
    createElement("div", { "data-evidence-chart": evidenceHandoff?.evidence.basis.symbol, "data-frame": evidenceHandoff?.timeframe }),
}));

const identity = (userId: string) => ({ mode: "platform_session", scope: { userId, workspaceId: "qa" } } as TraderLinkPlatformRequestIdentity);

afterEach(() => {
  state.revision = 0;
  state.allowed = true;
  state.user = "alice";
  state.map.mockReset();
  state.gateway.mockReset();
  vi.useRealTimers();
});

it("requires the accepted gateway revision at registration and again when opening a live match", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(fixture.acceptedAt * 1_000);
  const accepted = acceptFourHourCandle(input());
  if (accepted.state !== "ready") throw Error("fixture candle did not complete");
  const trigger = accepted.candle;
  const zone = fixture.fourHourZone;
  const basis = fixture.basis;
  const interval = { start: trigger.interval.start - 86_400, end: trigger.interval.end - 86_400 };
  const previous = { ...trigger, interval, plotTime: interval.start, acceptedAt: interval.end,
    revision: "previous-accepted", bar: { ...trigger.bar, time: interval.start, close: fixture.priorEligibleClose } };
  const inputEnd = interval.end * 1_000;
  const clock = zone.inputThrough * 1_000;
  let acceptedAtMs = clock;
  const publisher = new AcceptedSeriesPublisher(() => acceptedAtMs);
  const source = {
    instrumentId: basis.instrumentId, symbol: basis.symbol, venue: basis.venue, frame: "4h" as const,
    datasetId: ALPACA_REGULAR_FOUR_HOUR_DATASET, priceBasisId: basis.priceBasisId, calendarRevision: basis.calendarRevision,
    sessionMode: basis.sessionMode, completedThroughMs: inputEnd + 9_000_000, acceptedCutoffMs: clock, availableAtMs: clock,
    rows: [[interval.start * 1_000, inputEnd, 9.95, 10.05, 9.90, previous.bar.close, 1000],
      [inputEnd, inputEnd + 9_000_000, 9.95, 10.05, 9.90, 10.02, 1000]] as const,
  };
  const receipt = publisher.publish(source);
  if (!receipt) throw Error("fixture input was not accepted");
  const daily = publisher.publish({ ...source, frame: "daily", datasetId: ALPACA_NATIVE_DAILY_DATASET, sessionMode: "extended",
    rows: [[source.rows[0][0], source.completedThroughMs, 9.95, 10.05, 9.90, 10.02, 2000]],
  });
  if (!daily) throw Error("fixture Daily input was not accepted");
  const { instrumentId, symbol, venue, ...inputReceipt } = receipt;
  const dailyReceipt = Object.fromEntries(Object.entries(daily).filter(([field]) =>
    field !== "instrumentId" && field !== "symbol" && field !== "venue"));
  const map = { mapId: zone.mapId, revision: "f".repeat(64) };
  state.map.mockReturnValue({
    reference: map, publishedAt: zone.firstAvailableAt, expiresAt: zone.expiresAt,
    saved: { savedMapId: map.mapId, map: {
      symbol, calculatedAt: zone.calculatedAt * 1_000,
      chartEvidenceProvenance: {
        version: 1, instrument: { id: instrumentId, symbol, venue }, calculatedAtMs: zone.calculatedAt * 1_000,
        inputs: [inputReceipt, dailyReceipt], zones: [0, 1, 2, 3, 4].map(index => ({ side: "resistance", index, inputIds: [receipt.id] })),
      },
      levelMap: { supportLevels: [], resistanceLevels: [
        [zone.lower, zone.upper, "fresh"], [10.5, 10.55, "fresh"], [10.52, 10.6, "fresh"],
        [10.8, 10.85, "aging"], [10.35, 10.4, "stale"],
      ].map(([lower, upper, freshness]) => ({
        side: "resistance", price: lower, lowPrice: lower, highPrice: upper,
        evidenceStatus: "historically_tested", freshness,
      })) },
    } },
  });
  const selection = { provider: "alpaca", revision: 0 } as const;
  let currentDatasetId: string = source.datasetId;
  const args = {
    identity: identity("alice"), trigger, previous, direction: "up" as const, cutoff: fixture.acceptedAt, map,
    triggerDatasetId: source.datasetId,
    generations: { scannerGeneration: browserDataSession("scanners", selection).generation,
      chartGeneration: browserDataSession("charts", selection).generation },
    readCurrentTrigger: () => ({ candle: trigger, datasetId: currentDatasetId }),
  };
  expect(await evaluateLiveFourHourLevelMatch(args)).toEqual({ state: "unavailable" });
  state.gateway.mockImplementation(async (path: string, query: URLSearchParams) => {
    if (path === "accepted-regular-opportunities") {
      return publisher.readRegularOpportunities(query.get("dailyId") ?? "", query.get("regularId") ?? "", {
        mapId: query.get("mapId") ?? "", mapRevision: query.get("mapRevision") ?? "",
      });
    }
    const id = query.get("id") ?? "";
    return path === "accepted-input" ? publisher.read(id) : publisher.latestFullCandle(id);
  });
  expect(await evaluateLiveFourHourLevelMatch({ ...args, triggerDatasetId: "different-4h-dataset" }))
    .toEqual({ state: "unavailable" });
  const result = await evaluateLiveFourHourLevelMatch(args);
  const reference = result.state === "ready" ? result.matches[0]?.reference : undefined;
  if (!reference) throw Error("fixture match was not registered");
  let receiptReference: string | undefined;
  try {
    expect(await resolveScannerChartEvidence(args.identity, reference)).toMatchObject({
      state: "ready", evidence: { match: { zones: { facts: [{ mapRevision: map.revision, lower: zone.lower, upper: zone.upper }] } } },
    });
    const triggerEnd = trigger.interval.end * 1_000;
    acceptedAtMs = fixture.acceptedAt * 1_000;
    const triggerReceipt = publisher.publish({
      ...source, completedThroughMs: triggerEnd, acceptedCutoffMs: triggerEnd, availableAtMs: acceptedAtMs,
      rows: [[trigger.interval.start * 1_000, triggerEnd, trigger.bar.open, trigger.bar.high,
        trigger.bar.low, trigger.bar.close, trigger.bar.volume]],
    });
    if (!triggerReceipt) throw Error("fixture trigger was not accepted");
    const calendar = input().calendar;
    calendar.merge({ available: true, start: "2026-11-17", end: "2026-11-17",
      sessions: [{ date: "2026-11-17", open: "09:30", close: "16:00" }] });
    const acceptedArgs = {
      ...args, calendar, triggerId: triggerReceipt.id, previousId: receipt.id, direction: "either" as const,
    };
    const startMs = trigger.interval.start * 1_000;
    expect(await evaluateAcceptedRegularFourHourMatch({
      ...acceptedArgs, prospective: { savedAfterMs: startMs },
    })).toEqual({ state: "unavailable" });
    expect(await evaluateAcceptedRegularFourHourMatch({
      ...acceptedArgs, prospective: { savedAfterMs: startMs - 1, triggerStartMs: startMs - 1 },
    })).toEqual({ state: "unavailable" });
    expect(await evaluateAcceptedRegularFourHourMatch({
      ...acceptedArgs, prospective: { savedAfterMs: previous.interval.start * 1_000 - 1 },
    })).toEqual({ state: "unavailable" });
    expect(await evaluateAcceptedRegularFourHourMatch({
      ...acceptedArgs, prospective: { savedAfterMs: previous.interval.start * 1_000 - 1, previousObservation: {
        state: "no_break", map, triggerId: "different-receipt", startMs: previous.interval.start * 1_000,
      } },
    })).toEqual({ state: "unavailable" });
    const binding = { mapId: map.mapId, mapRevision: map.revision };
    publisher.recordRegularOpportunity({
      ...binding,
      dailyId: daily.id, regularId: receipt.id, previousId: receipt.id, triggerId: triggerReceipt.id,
      savedAfterMs: startMs - 1, startMs,
      calendars: [{ available: true, start: "2026-11-17", end: "2026-11-18", sessions: calendar.knownSessions() }],
    });
    const rule: ScanRule = { metric: "confirmed4hBreak", minimum: null, maximum: 24, direction: "up" };
    const automatic = await refreshAcceptedScannerLevelBreaks(args.identity);
    receiptReference = automatic(symbol, rule, Date.now())?.reference;
    if (!receiptReference) throw Error("independently accepted trigger failed to match");
    expect(receiptReference).not.toBe(reference);
    expect((await refreshAcceptedScannerLevelBreaks(identity("bob")))(symbol, rule, Date.now())).toBeUndefined();
    expect(publisher.latestFullCandle(receipt.id)?.row[1]).toBe(inputEnd);
    const shared: ScanResult = { status: "open", eligible: 1, incomplete: 0, total: 1, updatedAt: Date.now(), rows: [{
      symbol, exchange: "NASDAQ", price: 10.2, volume: 100, dollarVolume: 1_020,
      marketCap: null, float: null, dayChange: null, belowHigh: null, sortValue: 10.2, matches: [],
    }] };
    expect(attachScannerEvidenceReferences(args.identity, shared).rows[0].evidenceReference).toBe(receiptReference);
    expect(attachScannerEvidenceReferences(identity("bob"), shared)).toBe(shared);
    expect(shared.rows[0]).not.toHaveProperty("evidenceReference");
    const resolvedMatch = await resolveScannerChartEvidence(args.identity, receiptReference);
    expect(resolvedMatch).toMatchObject({
      state: "ready", evidence: { match: { candles: { facts: [{ bar: trigger.bar, revision: triggerReceipt.id + ":" + triggerReceipt.digest }] } } },
      nearbyLevels: [
        { lower: 10.5, upper: 10.55, side: "resistance", frame: "4h" },
        { lower: 10.8, upper: 10.85, side: "resistance", frame: "4h" },
      ],
    });
    if (resolvedMatch.state === "ready") {
      expect(resolvedMatch.nearbyLevels[0]?.distance).toBeCloseTo(0.3);
      expect(resolvedMatch.nearbyLevels[1]?.distance).toBeCloseTo(0.6);
    }
    const confirmed = await readScannerLevelBreaks(args.identity);
    expect(confirmed(symbol, rule, fixture.acceptedAt * 1_000)).toEqual(expect.objectContaining({ reference: receiptReference }));
    expect(confirmed(symbol, rule, fixture.acceptedAt * 1_000 - 1)).toBeUndefined();
    expect((await readScannerLevelBreaks(identity("bob")))(symbol, rule, Date.now())).toBeUndefined();
    const earlierStart = previous.interval.start * 1_000 - 86_400_000;
    const earlierEnd = earlierStart + 14_400_000;
    const earlierSource = {
      ...source, completedThroughMs: earlierEnd, acceptedCutoffMs: earlierEnd, availableAtMs: earlierEnd,
      rows: [[earlierStart, earlierEnd, 9.95, 10.05, 9.90, 10, 1000]] as const,
    };
    acceptedAtMs = clock;
    const earlier = publisher.publish(earlierSource);
    acceptedAtMs = fixture.acceptedAt * 1_000;
    if (!earlier) throw Error("earlier fixture receipt is unavailable");
    calendar.merge({ available: true, start: "2026-11-16", end: "2026-11-16",
      sessions: [{ date: "2026-11-16", open: "09:30", close: "16:00" }] });
    const sparseArgs = { ...acceptedArgs, previousId: earlier.id };
    const quietStart = previous.interval.start * 1_000;
    for (const verifiedEmptyStarts of [[], [quietStart + 60_000], [quietStart, quietStart]]) {
      expect(await evaluateAcceptedRegularFourHourMatch({
        ...sparseArgs, prospective: { savedAfterMs: startMs - 1, verifiedEmptyStarts },
      })).toEqual({ state: "unavailable" });
    }
    const sparse = await evaluateAcceptedRegularFourHourMatch({
      ...sparseArgs, prospective: { savedAfterMs: startMs - 1, verifiedEmptyStarts: [quietStart] },
    });
    expect(sparse).toMatchObject({ state: "ready", observation: { state: "matched", previousId: earlier.id } });
    if (sparse.state === "ready") for (const match of sparse.matches) invalidateScannerChartEvidence(match.reference);
    const prospective = {
      savedAfterMs: previous.interval.start * 1_000 - 1,
      previousObservation: { state: "no_break" as const, map, triggerId: receipt.id, startMs: previous.interval.start * 1_000 },
      earlierReceipts: [earlier, receipt].map(input => ({ id: input.id, revision: input.id + ":" + input.digest })),
    };
    const withLineage = await evaluateAcceptedRegularFourHourMatch({ ...acceptedArgs, prospective });
    const lineageReference = withLineage.state === "ready" ? withLineage.matches[0]?.reference : undefined;
    if (!lineageReference) throw Error("fixture did not retain the earlier receipts");
    try {
      expect(await resolveScannerChartEvidence(args.identity, lineageReference)).toMatchObject({ state: "ready" });
      publisher.publish({ ...earlierSource, upstreamRevision: "earlier-candle-correction" });
      expect(publisher.latestFullCandle(receipt.id)).toBeDefined();
      expect(publisher.latestFullCandle(triggerReceipt.id)).toBeDefined();
      expect(await resolveScannerChartEvidence(args.identity, lineageReference)).toEqual({ state: "unavailable" });
      expect(await evaluateAcceptedRegularFourHourMatch({ ...acceptedArgs, prospective })).toEqual({ state: "unavailable" });
    } finally {
      invalidateScannerChartEvidence(lineageReference);
    }
    currentDatasetId = "different-4h-dataset";
    expect(await resolveScannerChartEvidence(args.identity, reference)).toMatchObject({ state: "unavailable" });
    currentDatasetId = source.datasetId;
    const noBreak = publisher.publish({
      ...source, upstreamRevision: "no-crossing-correction", completedThroughMs: triggerEnd,
      acceptedCutoffMs: triggerEnd, availableAtMs: acceptedAtMs,
      rows: [[startMs, triggerEnd, trigger.bar.open, trigger.bar.high, trigger.bar.low, 10.05, trigger.bar.volume]],
    });
    if (!noBreak) throw Error("fixture no-break correction was not accepted");
    expect(publisher.readRegularOpportunities(daily.id, receipt.id, binding)).toEqual([]);
    expect(await resolveScannerChartEvidence(args.identity, receiptReference)).toMatchObject({ state: "unavailable" });
    invalidateScannerChartEvidence(reference);
    expect((await refreshAcceptedScannerLevelBreaks(args.identity))(symbol, rule, Date.now())).toBeUndefined();
    expect(await evaluateAcceptedRegularFourHourMatch({
      ...acceptedArgs, triggerId: noBreak.id, prospective: { savedAfterMs: startMs - 1 },
    })).toMatchObject({ state: "ready", matches: [], observation: { state: "no_break", triggerId: noBreak.id } });
    expect(publisher.publish({ ...source, upstreamRevision: "corrected" })?.id).not.toBe(receipt.id);
    expect(publisher.latestFullCandle(receipt.id)).toBeUndefined();
    expect(await resolveScannerChartEvidence(args.identity, reference)).toMatchObject({ state: "unavailable" });
    expect(await resolveScannerChartEvidence(args.identity, receiptReference)).toMatchObject({ state: "unavailable" });
    expect((await readScannerLevelBreaks(args.identity))(symbol, rule, Date.now())).toBeUndefined();
  } finally {
    invalidateScannerChartEvidence(reference);
    if (receiptReference) invalidateScannerChartEvidence(receiptReference);
  }
});

function input() {
  const calendar = new ChartSessionCalendar();
  calendar.merge({
    available: true, start: "2026-11-18", end: "2026-11-18",
    sessions: [{ date: "2026-11-18", open: "09:30", close: "16:00" }],
  });
  const symbol = fixture.basis.symbol;
  const end = fixture.triggerInterval.end * 1_000;
  return {
    basis: fixture.basis, window: fixture.triggerInterval, calendar,
    receivedAt: fixture.receivedAt, acceptedAt: fixture.acceptedAt, cutoff: fixture.acceptedAt,
    reply: { feed: "sip", adjustment: "split", frame: "1m", basisDate: "2026-11-18", end,
      bars: { [symbol]: [...fixture.minutes] },
      coverage: { [symbol]: { status: "complete", completedThroughMs: end } } },
  };
}

it("accepts the joint completed bar with stable OHLCV and rejects misleading coverage", () => {
  const args = input();
  const accepted = acceptFourHourCandle(args);
  expect(accepted).toMatchObject({ state: "ready", candle: { bar: fixture.expectedTriggerBar } });
  expect(acceptFourHourCandle({ ...args, cutoff: fixture.triggerInterval.end - 1 }).state).toBe("unavailable");
  expect(acceptFourHourCandle({ ...args, calendar: new ChartSessionCalendar() }).state).toBe("unavailable");
  const completion = args.reply.coverage[fixture.basis.symbol];
  completion.completedThroughMs -= 60_000;
  expect(acceptFourHourCandle(args).state).toBe("unavailable");
  completion.completedThroughMs += 60_000;
  args.reply.bars[fixture.basis.symbol].push(fixture.minutes[0]);
  expect(acceptFourHourCandle(args).state).toBe("unavailable");
});

it("hands Charts the exact qualifying candle and level only for the owner and current revisions", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(fixture.acceptedAt * 1_000);
  const accepted = acceptFourHourCandle(input());
  if (accepted.state !== "ready") throw Error("fixture candle did not complete");
  const trigger = accepted.candle;
  const interval = { start: trigger.interval.start - 86_400, end: trigger.interval.end - 86_400 };
  const previous = { ...trigger, interval, plotTime: interval.start, acceptedAt: interval.end,
    revision: "previous-accepted", bar: { ...trigger.bar, time: interval.start, close: fixture.priorEligibleClose } };
  const zone = fixture.fourHourZone;
  expect(matchCompletedLevelBreak(trigger, previous, { ...zone, firstAvailableAt: trigger.interval.start + 1 }, fixture.acceptedAt)).toBeNull();
  expect(matchCompletedLevelBreak(trigger, previous, fixture.dailyZone, fixture.acceptedAt)).toBeNull();
  const matched = matchCompletedLevelBreak(trigger, previous, zone, fixture.acceptedAt);
  if (!matched) throw Error("fixture event did not match");
  const mapReference = { mapId: zone.mapId, revision: zone.mapRevision };
  const provenance = {
    instrumentId: trigger.basis.instrumentId, priceBasisId: trigger.basis.priceBasisId,
    calendarRevision: trigger.basis.calendarRevision, intradaySessionMode: "regular" as const,
    mapRevision: zone.mapRevision, inputThrough: zone.inputThrough,
    firstAvailableAt: zone.firstAvailableAt, expiresAt: zone.expiresAt,
  };
  const level = (bounds: typeof fixture.fourHourZone | typeof fixture.dailyZone) => ({
    side: "resistance", price: bounds.lower, lowPrice: bounds.lower, highPrice: bounds.upper,
    evidenceStatus: "historically_tested", timeframes: [bounds.sourceFrame === "1D" ? "daily" : "4h"],
    freshness: "fresh", marketDataProvenance: {
      formedAt: (zone.inputThrough - 60) * 1_000, sourceLastSeenAt: zone.inputThrough * 1_000,
    },
  });
  state.map.mockReturnValue({
    reference: mapReference, publishedAt: zone.firstAvailableAt, expiresAt: zone.expiresAt,
    saved: { savedMapId: zone.mapId, map: {
      symbol: trigger.basis.symbol, calculatedAt: zone.calculatedAt * 1_000,
      levelMap: { supportLevels: [], resistanceLevels: [level(zone), level(fixture.dailyZone)] },
    } },
  });
  const selection = { provider: "alpaca", revision: 0 } as const;
  const chartGeneration = browserDataSession("charts", selection).generation;
  let current = trigger;
  const evaluated = evaluateScannerFourHourLevelMatch({
    identity: identity("alice"), trigger, previous, direction: "up", cutoff: fixture.acceptedAt,
    map: { reference: mapReference, provenance },
    generations: { scannerGeneration: browserDataSession("scanners", selection).generation, chartGeneration },
    readCurrentCandle: () => current,
  });
  const reference = evaluated.state === "ready" ? evaluated.matches[0]?.reference : undefined;
  if (!reference) throw Error("fixture match was not registered");
  const matchRow = evaluated.state === "ready" ? evaluated.matches[0] : undefined;
  expect(matchRow?.evidenceHref).toBe("/scanners?evidence=" + reference);

  try {
    const request = new Request("https://test.invalid/api/scanners/evidence?reference=" + reference);
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect((await response.json()).priorCandle).toEqual({
      closedAt: previous.interval.end,
      range: previous.bar.high - previous.bar.low,
      volume: previous.bar.volume,
    });
    const result = await resolveScannerChartEvidence(identity("alice"), reference);
    if (result.state !== "ready") throw Error("fixture result did not resolve");
    expect(result.priorCandle).toBeUndefined();
    const overlay = projectChartOverlay({ evidence: result.evidence, context: "match", symbol: trigger.basis.symbol,
      generation: chartGeneration, frame: "4h", sessionMode: "regular",
      candleAt: () => ({ ...trigger.bar, carried: false }) });
    expect(overlay.events).toMatchObject([{
      id: matchRow?.eventId, trigger: { interval: trigger.interval, revision: trigger.revision },
      reference: { kind: "zone", zoneId: "resistance:0", mapId: zone.mapId, mapRevision: zone.mapRevision },
    }]);
    expect(overlay.zones).toMatchObject([
      { sourceFrame: "4h", lower: zone.lower, upper: zone.upper },
      { sourceFrame: "1D", lower: fixture.dailyZone.lower, upper: fixture.dailyZone.upper },
    ]);
    expect(state.map).toHaveBeenCalledWith(identity("alice"), trigger.basis.symbol, { mapId: zone.mapId, revision: zone.mapRevision }, fixture.acceptedAt * 1_000);

    const params = { searchParams: Promise.resolve({ evidence: reference }) };
    const scanner = renderToStaticMarkup(await ScannersPage(params));
    const chart = renderToStaticMarkup(await MarketChartsPage(params));
    for (const html of [scanner, chart]) {
      expect(html).toContain('data-evidence-chart="QA"');
      expect(html).toContain('data-frame="4h"');
    }
    expect(scanner).toContain("/charts?evidence=" + reference);
    state.user = "bob";
    expect((await GET(request)).status).toBe(404);
    expect(renderToStaticMarkup(await ScannersPage(params))).toContain("Matched chart evidence is unavailable.");
    expect(renderToStaticMarkup(await MarketChartsPage(params))).not.toContain("data-evidence-chart");
    state.user = "alice";
    state.revision++;
    expect((await GET(request)).status).toBe(404);
    state.revision--;
    current = { ...trigger, revision: "corrected" };
    expect((await GET(request)).status).toBe(404);
    current = trigger;
    state.map.mockReturnValue(undefined);
    expect((await GET(request)).status).toBe(404);
  } finally {
    invalidateScannerChartEvidence(reference);
  }
});
