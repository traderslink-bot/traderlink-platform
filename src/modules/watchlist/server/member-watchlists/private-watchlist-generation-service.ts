import { z } from "zod";
import type { PrivateWatchlistRepository } from "./private-watchlist-repository";
import type { PrivateGenerationInput, PrivateGenerationRequest, PrivateWatchlistGenerationProvider } from "./private-watchlist-generation-contract";
import { privateCards } from "./private-watchlist-cards";

const identity = z.uuidv4();
const amount = z.number().int().safe().nonnegative();
const receiptSchema = z.object({ protocolVersion: z.literal(1), userId: identity, requestId: identity,
  requestHash: z.string().regex(/^[a-f0-9]{64}$/), state: z.enum(["pending", "unresolved", "completed", "not_executed", "failed"]),
  maximumCostMicrousd: amount, actualCostMicrousd: amount.nullable(), cards: privateCards.optional() }).strict();
type WithRepository = <T>(read: (repository: PrivateWatchlistRepository) => T) => T;
export type PrivateGenerationOutcome = "completed" | "not_executed" | "pending" | "failed";

/** No database transaction spans network work. Only the reservation winner can
 * dispatch; all duplicate submissions use read-only receipt reconciliation.
 */
export class PrivateWatchlistGenerationService {
  constructor(private readonly withRepository: WithRepository, private readonly provider: PrivateWatchlistGenerationProvider) {}

  async generate(input: PrivateGenerationInput): Promise<PrivateGenerationOutcome> {
    identity.parse(input.userId); identity.parse(input.requestId);
    z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/).parse(input.symbol);
    z.object({ analysis: z.boolean(), indicators: z.boolean(), levels: z.boolean() }).strict().parse(input.selection);
    const existing = this.withRepository(repository => repository.operation(input.userId, input.requestId));
    if (existing) {
      if (existing.operation !== "generation" || existing.symbol !== input.symbol ||
        (["analysis", "indicators", "levels"] as const).some(card => Boolean(existing[`selected_${card}`]) !== input.selection[card])) throw new Error("Watchlist request identity conflict.");
      return this.reconcile(input.userId, input.requestId);
    }
    this.withRepository(repository => repository.assertGenerationAllowed(input.userId, input.symbol, input.selection, new Date().toISOString()));
    const maximum = amount.parse(await this.provider.quote(input));
    const reserved = this.withRepository(repository => repository.reserveGeneration(input.userId, input.symbol, input.requestId,
      input.selection, maximum, new Date().toISOString()));
    if (!reserved.dispatch) return this.reconcile(input.userId, input.requestId);
    return this.obtainReceipt({ ...input, requestHash: reserved.operation.request_hash, maximumCostMicrousd: maximum }, true);
  }

  async reconcile(userId: string, requestId: string): Promise<PrivateGenerationOutcome> {
    identity.parse(userId); identity.parse(requestId);
    const operation = this.withRepository(repository => repository.operation(userId, requestId));
    if (!operation || operation.operation !== "generation") throw new Error("Private Watchlist request unavailable.");
    if (operation.state === "completed") return "completed";
    if (operation.state === "released") return "not_executed";
    if (operation.state === "failed") return "failed";
    return this.obtainReceipt({ userId, requestId, symbol: operation.symbol,
      selection: { analysis: Boolean(operation.selected_analysis), indicators: Boolean(operation.selected_indicators), levels: Boolean(operation.selected_levels) },
      requestHash: operation.request_hash, maximumCostMicrousd: operation.maximum_cost_microusd }, false);
  }

  private async obtainReceipt(request: PrivateGenerationRequest, dispatch: boolean): Promise<PrivateGenerationOutcome> {
    try {
      const receipt = receiptSchema.parse(await (dispatch ? this.provider.generate(request) : this.provider.receipt(request)));
      if (receipt.userId !== request.userId || receipt.requestId !== request.requestId || receipt.requestHash !== request.requestHash ||
        receipt.maximumCostMicrousd !== request.maximumCostMicrousd ||
        (receipt.actualCostMicrousd !== null && receipt.actualCostMicrousd > request.maximumCostMicrousd)) throw new Error("Invalid private receipt.");
      if (receipt.state === "completed") {
        if (receipt.actualCostMicrousd === null || !receipt.cards) throw new Error("Incomplete private receipt.");
        this.withRepository(repository => repository.complete(request.userId, request.requestId, request.requestHash,
          receipt.actualCostMicrousd!, receipt.cards!, new Date().toISOString()));
        return "completed";
      }
      if (receipt.state === "not_executed") {
        if (receipt.actualCostMicrousd !== 0 || receipt.cards) throw new Error("Invalid non-execution receipt.");
        this.withRepository(repository => repository.releaseNotExecuted(request.userId, request.requestId, request.requestHash, new Date().toISOString()));
        return "not_executed";
      }
      if (receipt.state === "failed") {
        if (receipt.actualCostMicrousd === null || receipt.cards) throw new Error("Invalid failed receipt.");
        this.withRepository(repository => repository.settleFailed(request.userId, request.requestId, request.requestHash,
          receipt.actualCostMicrousd!, new Date().toISOString()));
        return "failed";
      }
    } catch { /* Uncertain work retains its reservation; never retry automatically. */ }
    this.withRepository(repository => repository.markUnresolved(request.userId, request.requestId, new Date().toISOString()));
    return "pending";
  }
}
