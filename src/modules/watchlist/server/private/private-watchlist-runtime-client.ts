import "server-only";
import { z } from "zod";
import type { PrivateGenerationInput, PrivateGenerationRequest, PrivateWatchlistGenerationProvider } from "./private-watchlist-generation-contract";

/** Dedicated private endpoints only. Never fall back to shared Watchlist activation. */
export class PrivateWatchlistRuntimeClient implements PrivateWatchlistGenerationProvider {
  private async request(action: "quote" | "generate" | "receipt", body: PrivateGenerationInput | PrivateGenerationRequest): Promise<unknown> {
    const base = process.env.TRADERLINK_STOCK_LEVELS_RUNTIME_URL?.trim();
    const token = process.env.TRADERLINK_STOCK_LEVELS_RUNTIME_ACCESS_TOKEN?.trim();
    if (!base || !token) throw new Error("Private generation is not configured.");
    const url = new URL(`/api/runtime/private-watchlist/${action}`, base);
    if (url.username || url.password || (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)))) {
      throw new Error("Private generation requires a secure runtime connection.");
    }
    const response = await fetch(url, { method: "POST", cache: "no-store", redirect: "error",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ protocolVersion: 1, ...body }), signal: AbortSignal.timeout(action === "generate" ? 120_000 : 15_000) });
    if (!response.ok) throw new Error("Private generation runtime unavailable.");
    return response.json();
  }

  async quote(input: PrivateGenerationInput): Promise<number> {
    const quote = z.object({ protocolVersion: z.literal(1), bounded: z.literal(true),
      maximumCostMicrousd: z.number().int().safe().nonnegative() }).strict().parse(await this.request("quote", input));
    return quote.maximumCostMicrousd;
  }
  generate(input: PrivateGenerationRequest) { return this.request("generate", input); }
  receipt(input: PrivateGenerationRequest) { return this.request("receipt", input); }
}
