import { candleCloseTimestamp, filterCandlesByCloseAsOf, } from "../market-data/candle-as-of-filter.js";
import { classifyCandleSessions } from "../market-data/candle-session-classifier.js";
const NEW_YORK_TIMEZONE = "America/New_York";
const sessionDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: NEW_YORK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function sessionDateFromTimestamp(timestamp) {
    return sessionDateFormatter.format(new Date(timestamp));
}
function convertFilterDiagnostic(diagnostic) {
    return {
        code: diagnostic.code,
        severity: "info",
        message: diagnostic.message,
        excludedCount: diagnostic.excludedCount,
    };
}
function marketSessionCandles(annotated, sessionDate) {
    return annotated.filter((item) => item.sessionDate === sessionDate &&
        (item.session === "premarket" || item.session === "opening_range" || item.session === "regular"));
}
function candlesForSession(annotated, session) {
    return annotated.filter((item) => item.session === session).map((item) => item.candle);
}
function highPoint(candles) {
    return candles.reduce((best, candle) => {
        if (!best || candle.high > best.price) {
            return {
                price: candle.high,
                timestamp: candle.timestamp,
            };
        }
        return best;
    }, undefined);
}
function lowPoint(candles) {
    return candles.reduce((best, candle) => {
        if (!best || candle.low < best.price) {
            return {
                price: candle.low,
                timestamp: candle.timestamp,
            };
        }
        return best;
    }, undefined);
}
function computeVWAP(candles) {
    let weightedPriceVolume = 0;
    let totalVolume = 0;
    for (const candle of candles) {
        if (candle.volume <= 0) {
            continue;
        }
        const typicalPrice = (candle.high + candle.low + candle.close) / 3;
        weightedPriceVolume += typicalPrice * candle.volume;
        totalVolume += candle.volume;
    }
    if (totalVolume === 0) {
        return undefined;
    }
    return weightedPriceVolume / totalVolume;
}
function firstBreakoutHigh(regularCandles, openingRangeHigh) {
    if (openingRangeHigh === undefined) {
        return undefined;
    }
    const breakout = regularCandles.find((candle) => candle.high > openingRangeHigh);
    if (!breakout) {
        return undefined;
    }
    return {
        price: breakout.high,
        timestamp: breakout.timestamp,
    };
}
function firstPullbackLowAfter(regularCandles, breakoutTimestamp) {
    if (breakoutTimestamp === undefined) {
        return undefined;
    }
    const pullbackCandles = regularCandles.filter((candle) => candle.timestamp > breakoutTimestamp);
    return lowPoint(pullbackCandles.slice(0, 3));
}
function firstConsolidationRange(regularCandles) {
    if (regularCandles.length < 3) {
        return undefined;
    }
    for (let index = 0; index <= regularCandles.length - 3; index += 1) {
        const window = regularCandles.slice(index, index + 3);
        const high = Math.max(...window.map((candle) => candle.high));
        const low = Math.min(...window.map((candle) => candle.low));
        const base = Math.max(0.01, window[0].open);
        const rangePct = ((high - low) / base) * 100;
        if (rangePct <= 4) {
            return {
                low,
                high,
                startTimestamp: window[0].timestamp,
                endTimestamp: candleCloseTimestamp(window.at(-1), "5m"),
            };
        }
    }
    return undefined;
}
export function buildSessionMarketFacts(request) {
    const filtered = filterCandlesByCloseAsOf({
        candles: request.candles5m,
        timeframe: "5m",
        asOfTimestamp: request.asOfTimestamp,
    });
    const diagnostics = filtered.diagnostics.map(convertFilterDiagnostic);
    const sessionDate = sessionDateFromTimestamp(request.asOfTimestamp);
    const annotated = marketSessionCandles(classifyCandleSessions(filtered.candles, "5m"), sessionDate);
    const sessionCandles = annotated.map((item) => item.candle);
    const premarketCandles = candlesForSession(annotated, "premarket");
    const openingRangeCandles = candlesForSession(annotated, "opening_range");
    const regularCandles = [
        ...openingRangeCandles,
        ...candlesForSession(annotated, "regular"),
    ];
    const premarketHigh = highPoint(premarketCandles);
    const premarketLow = lowPoint(premarketCandles);
    const openingRangeHigh = highPoint(openingRangeCandles);
    const openingRangeLow = lowPoint(openingRangeCandles);
    const highOfDay = highPoint(sessionCandles);
    const lowOfDay = lowPoint(sessionCandles);
    const vwapRaw = computeVWAP(sessionCandles);
    const currentPrice = request.currentPrice ?? sessionCandles.at(-1)?.close;
    const breakoutHigh = firstBreakoutHigh(candlesForSession(annotated, "regular"), openingRangeHigh?.price);
    const pullbackLow = firstPullbackLowAfter(candlesForSession(annotated, "regular"), breakoutHigh?.timestamp);
    const consolidationRange = firstConsolidationRange(candlesForSession(annotated, "regular"));
    if (sessionCandles.length === 0) {
        diagnostics.push({
            code: "no_closed_session_candles",
            severity: "warning",
            message: "No closed 5m market-session candles were available as of the requested timestamp.",
        });
    }
    if (premarketCandles.length === 0) {
        diagnostics.push({
            code: "no_premarket_candles",
            severity: "info",
            message: "No closed premarket candles were available for the requested session date.",
        });
    }
    if (regularCandles.length === 0) {
        diagnostics.push({
            code: "no_regular_session_candles",
            severity: "info",
            message: "No closed regular-session candles were available for the requested session date.",
        });
    }
    if (vwapRaw === undefined && sessionCandles.length > 0) {
        diagnostics.push({
            code: "zero_volume_for_vwap",
            severity: "warning",
            message: "VWAP could not be computed because closed session candles had no positive volume.",
        });
    }
    const vwap = vwapRaw === undefined ? undefined : round(vwapRaw);
    return {
        symbol: request.symbol.toUpperCase(),
        asOfTimestamp: request.asOfTimestamp,
        sessionDate,
        previousClose: request.previousClose,
        regularSessionOpen: regularCandles[0]?.open,
        currentPrice,
        premarketHigh: premarketHigh?.price,
        premarketLow: premarketLow?.price,
        premarketHighTimestamp: premarketHigh?.timestamp,
        premarketLowTimestamp: premarketLow?.timestamp,
        openingRangeHigh: openingRangeHigh?.price,
        openingRangeLow: openingRangeLow?.price,
        openingRangeStartTimestamp: openingRangeCandles[0]?.timestamp,
        openingRangeEndTimestamp: openingRangeCandles.length === 0 ? undefined : candleCloseTimestamp(openingRangeCandles.at(-1), "5m"),
        highOfDay: highOfDay?.price,
        lowOfDay: lowOfDay?.price,
        highOfDayTimestamp: highOfDay?.timestamp,
        lowOfDayTimestamp: lowOfDay?.timestamp,
        vwap,
        aboveVWAP: vwap === undefined || currentPrice === undefined ? undefined : currentPrice > vwap,
        percentFromVWAP: vwap === undefined || currentPrice === undefined || vwap === 0
            ? undefined
            : round(((currentPrice - vwap) / vwap) * 100),
        firstPullbackLow: pullbackLow?.price,
        firstPullbackLowTimestamp: pullbackLow?.timestamp,
        firstBreakoutHigh: breakoutHigh?.price,
        firstBreakoutHighTimestamp: breakoutHigh?.timestamp,
        firstConsolidationRange: consolidationRange,
        diagnostics,
    };
}
