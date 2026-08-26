import "server-only";

import { isStockLevelsMap, type StockLevelsMap } from "../stock-levels-contract";

const RUNTIME_URL_ENV = "TRADERLINK_STOCK_LEVELS_RUNTIME_URL";
const RUNTIME_TOKEN_ENV = "TRADERLINK_STOCK_LEVELS_RUNTIME_ACCESS_TOKEN";

type RuntimeUnavailableCode =
  | "invalid_symbol"
  | "unsupported_equity"
  | "reference_price_unavailable"
  | "market_data_unavailable";

export type StockLevelsRuntimeReply =
  | Readonly<{ map: StockLevelsMap }>
  | Readonly<{
      code: RuntimeUnavailableCode;
      message: string;
    }>;

function isRuntimeUnavailableCode(value: unknown): value is RuntimeUnavailableCode {
  return value === "invalid_symbol" ||
    value === "unsupported_equity" ||
    value === "reference_price_unavailable" ||
    value === "market_data_unavailable";
}

export async function requestStockLevels(symbol: string): Promise<StockLevelsRuntimeReply | null> {
  const baseUrl = process.env[RUNTIME_URL_ENV]?.trim();
  const token = process.env[RUNTIME_TOKEN_ENV]?.trim();
  if (!baseUrl || !token) return null;
  let response: Response;
  try {
    response = await fetch(new URL("/api/runtime/stock-levels", baseUrl), {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ symbol }),
      cache: "no-store",
    });
  } catch { return null; }
  try {
    const body = await response.json() as { map?: unknown; code?: unknown; message?: unknown };
    if (response.ok && isStockLevelsMap(body.map)) return { map: body.map };
    if (isRuntimeUnavailableCode(body.code) && typeof body.message === "string") {
      return { code: body.code, message: body.message };
    }
    return null;
  } catch { return null; }
}
