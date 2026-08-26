import "server-only";

import { isStockLevelsMap, type StockLevelsMap } from "../stock-levels-contract";

const RUNTIME_URL_ENV = "TRADERLINK_STOCK_LEVELS_RUNTIME_URL";
const RUNTIME_TOKEN_ENV = "TRADERLINK_STOCK_LEVELS_RUNTIME_ACCESS_TOKEN";

export async function requestStockLevels(symbol: string): Promise<StockLevelsMap | null> {
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
  if (!response.ok) return null;
  try {
    const body = await response.json() as { map?: unknown };
    return isStockLevelsMap(body.map) ? body.map : null;
  } catch { return null; }
}
