import { buildSupportResistanceContext, } from "./build-support-resistance-context.js";
export class CandleFetchService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
}
export async function buildSupportResistanceContextForSymbol(request) {
    return {
        ...buildSupportResistanceContext({
            symbol: request.symbol,
            candlesByTimeframe: {},
        }),
        mode: "symbol",
        candleFetchingOwnedBy: "levels-system",
        requestedTimeframes: ["daily", "4h", "5m"],
        fetches: [],
        diagnostics: [],
    };
}
