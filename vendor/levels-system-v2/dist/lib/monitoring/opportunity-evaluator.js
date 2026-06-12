const DEFAULT_EVALUATION_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_SUMMARY_INTERVAL = 10;
const DEFAULT_SUCCESS_THRESHOLD_PCT = 0.3;
const DEFAULT_EARLY_EXIT_THRESHOLD_PCT = 0.3;
const DEFAULT_ROLLING_WINDOW_SIZE = 20;
function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
}
function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function resolveOpportunityEventType(opportunity) {
    return opportunity.eventType ?? opportunity.type;
}
function isBullishType(type) {
    return type === "breakout" || type === "reclaim" || type === "fake_breakdown";
}
function isBearishType(type) {
    return type === "breakdown" || type === "rejection" || type === "fake_breakout";
}
function buildTrackedId(opportunity) {
    return `${opportunity.symbol}|${resolveOpportunityEventType(opportunity)}|${opportunity.timestamp}|${opportunity.level}`;
}
function computeReturnPct(entryPrice, outcomePrice) {
    if (entryPrice <= 0) {
        return 0;
    }
    return ((outcomePrice - entryPrice) / entryPrice) * 100;
}
function determineSuccessWithThreshold(opportunity, returnPct, successThresholdPct) {
    const eventType = resolveOpportunityEventType(opportunity);
    if (isBullishType(eventType)) {
        return returnPct >= successThresholdPct;
    }
    if (isBearishType(eventType)) {
        return returnPct <= -successThresholdPct;
    }
    return Math.abs(returnPct) >= successThresholdPct;
}
function shouldExitEarly(opportunity, returnPct, exitThresholdPct) {
    const eventType = resolveOpportunityEventType(opportunity);
    if (isBullishType(eventType)) {
        return returnPct >= exitThresholdPct || returnPct <= -exitThresholdPct;
    }
    if (isBearishType(eventType)) {
        return returnPct <= -exitThresholdPct || returnPct >= exitThresholdPct;
    }
    return Math.abs(returnPct) >= exitThresholdPct;
}
function approximateDrawdownPct(pending) {
    if (pending.entryPrice <= 0) {
        return 0;
    }
    const eventType = resolveOpportunityEventType(pending.opportunity);
    if (isBullishType(eventType)) {
        return ((pending.troughPrice - pending.entryPrice) / pending.entryPrice) * 100;
    }
    if (isBearishType(eventType)) {
        return ((pending.entryPrice - pending.peakPrice) / pending.entryPrice) * 100;
    }
    const worstDistance = Math.max(Math.abs(pending.peakPrice - pending.entryPrice), Math.abs(pending.troughPrice - pending.entryPrice));
    return -(worstDistance / pending.entryPrice) * 100;
}
function computeAverageReturn(evaluated, predicate) {
    const filtered = predicate ? evaluated.filter(predicate) : evaluated;
    if (filtered.length === 0) {
        return 0;
    }
    return round(filtered.reduce((sum, item) => sum + item.returnPct, 0) / filtered.length);
}
function computeExpectancy(evaluated) {
    if (evaluated.length === 0) {
        return 0;
    }
    const wins = evaluated.filter((item) => item.success);
    const losses = evaluated.filter((item) => !item.success);
    const winRate = wins.length / evaluated.length;
    const lossRate = losses.length / evaluated.length;
    const averageWinPct = computeAverageReturn(wins);
    const averageLossPct = computeAverageReturn(losses);
    return round(winRate * averageWinPct + lossRate * averageLossPct);
}
function buildEventTypeExpectancySummary(evaluated) {
    const summaries = new Map();
    for (const item of evaluated) {
        const bucket = summaries.get(item.eventType) ?? [];
        bucket.push(item);
        summaries.set(item.eventType, bucket);
    }
    return Object.fromEntries([...summaries.entries()].map(([eventType, items]) => {
        const wins = items.filter((item) => item.success);
        const losses = items.filter((item) => !item.success);
        const totalEvaluated = items.length;
        const winRate = totalEvaluated === 0 ? 0 : wins.length / totalEvaluated;
        const lossRate = totalEvaluated === 0 ? 0 : losses.length / totalEvaluated;
        return [
            eventType,
            {
                totalEvaluated,
                wins: wins.length,
                losses: losses.length,
                winRate: round(winRate, 4),
                lossRate: round(lossRate, 4),
                averageWinPct: computeAverageReturn(wins),
                averageLossPct: computeAverageReturn(losses),
                expectancy: computeExpectancy(items),
            },
        ];
    }));
}
function buildRollingExpectancySummary(evaluated, rollingWindowSize) {
    const recent = evaluated.slice(-rollingWindowSize);
    return {
        windowSize: rollingWindowSize,
        sampleSize: recent.length,
        expectancy: computeExpectancy(recent),
    };
}
function buildPerformanceDriftSummary(evaluated, rollingWindowSize) {
    const currentWindow = evaluated.slice(-rollingWindowSize);
    const previousWindow = evaluated.length > rollingWindowSize
        ? evaluated.slice(-rollingWindowSize * 2, -rollingWindowSize)
        : [];
    const currentExpectancy = computeExpectancy(currentWindow);
    const previousExpectancy = computeExpectancy(previousWindow);
    const delta = round(currentExpectancy - previousExpectancy);
    return {
        declining: previousWindow.length > 0 && delta < 0,
        currentExpectancy,
        previousExpectancy,
        delta,
    };
}
export class OpportunityEvaluator {
    evaluationWindowMs;
    debug;
    summaryInterval;
    successThresholdPct;
    earlyExitThresholdPct;
    rollingWindowSize;
    pending = new Map();
    evaluated = [];
    drawdowns = [];
    constructor(evaluationWindowMs = DEFAULT_EVALUATION_WINDOW_MS, debug = false, summaryInterval = DEFAULT_SUMMARY_INTERVAL, successThresholdPct = DEFAULT_SUCCESS_THRESHOLD_PCT, earlyExitThresholdPct = DEFAULT_EARLY_EXIT_THRESHOLD_PCT, rollingWindowSize = DEFAULT_ROLLING_WINDOW_SIZE) {
        this.evaluationWindowMs = evaluationWindowMs;
        this.debug = debug;
        this.summaryInterval = summaryInterval;
        this.successThresholdPct = successThresholdPct;
        this.earlyExitThresholdPct = earlyExitThresholdPct;
        this.rollingWindowSize = rollingWindowSize;
    }
    track(opportunity, entryPrice) {
        const normalizedEntry = round(entryPrice);
        this.pending.set(buildTrackedId(opportunity), {
            id: buildTrackedId(opportunity),
            opportunity,
            entryPrice: normalizedEntry,
            trackedAt: opportunity.timestamp,
            evaluateAt: opportunity.timestamp + this.evaluationWindowMs,
            peakPrice: normalizedEntry,
            troughPrice: normalizedEntry,
        });
    }
    updatePrice(symbol, price, timestamp) {
        const normalizedPrice = round(price);
        const completed = [];
        for (const [id, pending] of this.pending) {
            if (pending.opportunity.symbol !== symbol) {
                continue;
            }
            pending.peakPrice = Math.max(pending.peakPrice, normalizedPrice);
            pending.troughPrice = Math.min(pending.troughPrice, normalizedPrice);
            const returnPct = round(computeReturnPct(pending.entryPrice, normalizedPrice));
            const reachedMaxWindow = timestamp >= pending.evaluateAt;
            const reachedEarlyExit = shouldExitEarly(pending.opportunity, returnPct, this.earlyExitThresholdPct);
            if (!reachedMaxWindow && !reachedEarlyExit) {
                continue;
            }
            const evaluatedOpportunity = {
                symbol: pending.opportunity.symbol,
                timestamp: pending.opportunity.timestamp,
                entryPrice: pending.entryPrice,
                outcomePrice: normalizedPrice,
                returnPct,
                success: determineSuccessWithThreshold(pending.opportunity, returnPct, this.successThresholdPct),
                eventType: resolveOpportunityEventType(pending.opportunity),
            };
            this.evaluated.push(evaluatedOpportunity);
            this.drawdowns.push(round(approximateDrawdownPct(pending)));
            this.pending.delete(id);
            completed.push(evaluatedOpportunity);
        }
        if (this.debug &&
            completed.length > 0 &&
            this.summaryInterval > 0 &&
            this.evaluated.length % this.summaryInterval === 0) {
            this.logSummary();
        }
        return completed;
    }
    getPendingCount() {
        return this.pending.size;
    }
    getEvaluated() {
        return [...this.evaluated];
    }
    getSummary() {
        const totalEvaluated = this.evaluated.length;
        const wins = this.evaluated.filter((item) => item.success).length;
        const losses = totalEvaluated - wins;
        const winRate = totalEvaluated === 0 ? 0 : wins / totalEvaluated;
        const lossRate = totalEvaluated === 0 ? 0 : losses / totalEvaluated;
        const averageWinPct = computeAverageReturn(this.evaluated, (item) => item.success);
        const averageLossPct = computeAverageReturn(this.evaluated, (item) => !item.success);
        const expectancy = computeExpectancy(this.evaluated);
        const worstDrawdown = this.drawdowns.length === 0 ? 0 : Math.min(...this.drawdowns);
        const signalAccuracy = totalEvaluated === 0 ? 0 : round(winRate, 4);
        return {
            totalEvaluated,
            wins,
            losses,
            winRate: round(clamp(winRate) * 100, 2),
            lossRate: round(clamp(lossRate) * 100, 2),
            expectancy,
            averageReturnPct: expectancy,
            averageWinPct,
            averageLossPct,
            maxDrawdownPct: round(Math.abs(worstDrawdown), 4),
            signalAccuracy,
            expectancyByEventType: buildEventTypeExpectancySummary(this.evaluated),
            rollingExpectancy: buildRollingExpectancySummary(this.evaluated, this.rollingWindowSize),
            performanceDrift: buildPerformanceDriftSummary(this.evaluated, this.rollingWindowSize),
        };
    }
    logSummary() {
        const summary = this.getSummary();
        console.log("[OpportunityEvaluator]", JSON.stringify(summary));
    }
}
