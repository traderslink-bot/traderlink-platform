import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { assertCanonicalUuidV4, assertCanonicalUtcTimestamp } from "../../../platform/server/database/platform-migration-contract";
import { assertMembershipFeature, evaluateMembershipFeature } from "../../../platform/server/membership/platform-membership-access";
import { privateWatchlistRemaining, requirePrivateWatchlistAllowance } from "./private-watchlist-allowance";
import { privateCards, privateTextCard, privateLevelsCard, type PrivateWatchlistCards } from "./private-watchlist-cards";

type Operation = { request_id: string; symbol: string; request_hash: string; operation: "addition" | "generation"; state: "reserved" | "completed" | "released" | "unresolved" | "failed"; maximum_cost_microusd: number; selected_analysis: number; selected_indicators: number; selected_levels: number };
export type PrivateGenerationSelection = Readonly<{ analysis: boolean; indicators: boolean; levels: boolean }>;

/** Never accepts a client-selected owner: callers supply their authenticated user.
 * No shared Watchlist, publisher, Discord or Journal table is written here.
 */
export class PrivateWatchlistRepository {
  constructor(private readonly database: Database.Database) {}

  private assertUser(userId: string, at: string): void {
    assertCanonicalUuidV4(userId, "userId"); assertCanonicalUtcTimestamp(at, "atUtc");
    if (!this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId)) throw new Error("Private Watchlist account unavailable.");
  }

  private symbol(value: string): string {
    const symbol = value.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) throw new Error("Enter a valid ticker.");
    return symbol;
  }

  list(userId: string, at: string) {
    this.assertUser(userId, at);
    assertMembershipFeature(this.database, userId, "private_watchlist.access");
    return this.database.prepare(`SELECT symbol,state,created_at_utc,updated_at_utc
FROM platform_private_watchlist_entries WHERE user_id=? ORDER BY updated_at_utc DESC,symbol`).all(userId) as
      { symbol: string; state: "active" | "archived"; created_at_utc: string; updated_at_utc: string }[];
  }

  usage(userId: string, at: string) {
    this.assertUser(userId, at);
    assertMembershipFeature(this.database, userId, "private_watchlist.access");
    return this.database.transaction(() => ({
      tickerAdditionsRemaining: privateWatchlistRemaining(this.database, userId, "ticker_additions", at),
      activeTickerSlotsRemaining: privateWatchlistRemaining(this.database, userId, "active_tickers", at),
      generationsRemaining: privateWatchlistRemaining(this.database, userId, "generations", at),
      budgetRemainingMicrousd: privateWatchlistRemaining(this.database, userId, "cost_microusd", at),
      pending: this.database.prepare(`SELECT count(*) count FROM platform_private_watchlist_operations
WHERE user_id=? AND operation='generation' AND state IN ('reserved','unresolved')`).get(userId) as { count: number },
    }))();
  }

  add(userId: string, value: string, requestId: string, at: string): void {
    this.assertUser(userId, at); assertCanonicalUuidV4(requestId, "requestId");
    const symbol = this.symbol(value);
    const hash = createHash("sha256").update(`addition:${symbol}`).digest("hex");
    this.database.transaction(() => {
      assertMembershipFeature(this.database, userId, "private_watchlist.access");
      const existing = this.operation(userId, requestId);
      if (existing) { if (existing.request_hash !== hash) throw new Error("Watchlist request identity conflict."); return; }
      if (this.database.prepare("SELECT 1 FROM platform_private_watchlist_entries WHERE user_id=? AND symbol=? AND state='active'").get(userId, symbol)) {
        this.database.prepare(`INSERT INTO platform_private_watchlist_operations
(user_id,request_id,symbol,operation,state,request_hash,maximum_cost_microusd,actual_cost_microusd,created_at_utc,updated_at_utc)
VALUES (?,?,?,'addition','released',?,0,0,?,?)`).run(userId, requestId, symbol, hash, at, at);
        return;
      }
      requirePrivateWatchlistAllowance(this.database, userId, "ticker_additions", 1, at);
      requirePrivateWatchlistAllowance(this.database, userId, "active_tickers", 1, at);
      this.database.prepare(`INSERT INTO platform_private_watchlist_entries VALUES (?,?,'active',?,?)
ON CONFLICT(user_id,symbol) DO UPDATE SET state='active',updated_at_utc=excluded.updated_at_utc`).run(userId, symbol, at, at);
      this.database.prepare(`INSERT INTO platform_private_watchlist_operations
(user_id,request_id,symbol,operation,state,request_hash,maximum_cost_microusd,actual_cost_microusd,created_at_utc,updated_at_utc)
VALUES (?,?,?,'addition','completed',?,0,0,?,?)`).run(userId, requestId, symbol, hash, at, at);
    }).immediate();
  }

  archive(userId: string, value: string, at: string): void {
    this.assertUser(userId, at);
    // Removing an active ticker remains possible after a downgrade; data is retained.
    this.database.prepare("UPDATE platform_private_watchlist_entries SET state='archived',updated_at_utc=? WHERE user_id=? AND symbol=?")
      .run(at, userId, this.symbol(value));
  }

  operation(userId: string, requestId: string): Operation | undefined {
    return this.database.prepare(`SELECT request_id,symbol,request_hash,operation,state,maximum_cost_microusd,selected_analysis,selected_indicators,selected_levels
FROM platform_private_watchlist_operations WHERE user_id=? AND request_id=?`).get(userId, requestId) as Operation | undefined;
  }

  assertGenerationAllowed(userId: string, value: string, selection: PrivateGenerationSelection, at: string): void {
    this.assertUser(userId, at);
    const symbol = this.symbol(value);
    const cards = [selection.analysis, selection.indicators, selection.levels];
    if (!cards.every(value => typeof value === "boolean") || !cards.some(Boolean)) throw new Error("Choose a card to generate.");
    assertMembershipFeature(this.database, userId, "private_watchlist.access");
    for (const card of ["analysis", "indicators", "levels"] as const) if (selection[card]) assertMembershipFeature(this.database, userId, `private_watchlist.${card}`);
    if (!this.database.prepare("SELECT 1 FROM platform_private_watchlist_entries WHERE user_id=? AND symbol=? AND state='active'").get(userId, symbol)) throw new Error("Choose an active private ticker.");
    requirePrivateWatchlistAllowance(this.database, userId, "generations", 1, at);
  }

  generationHistory(userId: string, symbol: string, at: string) {
    this.assertUser(userId, at);
    assertMembershipFeature(this.database, userId, "private_watchlist.access");
    return this.database.prepare(`SELECT request_id,state,maximum_cost_microusd,actual_cost_microusd,created_at_utc
FROM platform_private_watchlist_operations WHERE user_id=? AND symbol=? AND operation='generation'
ORDER BY created_at_utc DESC,request_id DESC`).all(userId, this.symbol(symbol)) as {
      request_id: string; state: Operation["state"]; maximum_cost_microusd: number; actual_cost_microusd: number | null; created_at_utc: string;
    }[];
  }

  reserveGeneration(userId: string, value: string, requestId: string, selection: PrivateGenerationSelection,
    maximumCostMicrousd: number, at: string): { dispatch: boolean; operation: Operation } {
    this.assertUser(userId, at); assertCanonicalUuidV4(requestId, "requestId");
    const symbol = this.symbol(value);
    if (!Number.isSafeInteger(maximumCostMicrousd) || maximumCostMicrousd < 0) throw new Error("Generation requires a verified maximum cost.");
    const selected = [selection.analysis, selection.indicators, selection.levels];
    if (!selected.every(value => typeof value === "boolean") || !selected.some(Boolean)) throw new Error("Choose a card to generate.");
    const hash = createHash("sha256").update(JSON.stringify([symbol, selection.analysis, selection.indicators, selection.levels, maximumCostMicrousd])).digest("hex");
    return this.database.transaction(() => {
      assertMembershipFeature(this.database, userId, "private_watchlist.access");
      for (const card of ["analysis", "indicators", "levels"] as const) if (selection[card]) assertMembershipFeature(this.database, userId, `private_watchlist.${card}`);
      const existing = this.operation(userId, requestId);
      if (existing) {
        if (existing.request_hash !== hash) throw new Error("Watchlist request identity conflict.");
        return { dispatch: false, operation: existing };
      }
      if (!this.database.prepare("SELECT 1 FROM platform_private_watchlist_entries WHERE user_id=? AND symbol=? AND state='active'").get(userId, symbol)) throw new Error("Choose an active private ticker.");
      requirePrivateWatchlistAllowance(this.database, userId, "generations", 1, at);
      requirePrivateWatchlistAllowance(this.database, userId, "cost_microusd", maximumCostMicrousd, at);
      this.database.prepare(`INSERT INTO platform_private_watchlist_operations
(user_id,request_id,symbol,operation,state,request_hash,maximum_cost_microusd,selected_analysis,selected_indicators,selected_levels,created_at_utc,updated_at_utc)
VALUES (?,?,?,'generation','reserved',?,?,?,?,?,?,?)`).run(userId, requestId, symbol, hash, maximumCostMicrousd,
        Number(selection.analysis), Number(selection.indicators), Number(selection.levels), at, at);
      return { dispatch: true, operation: this.operation(userId, requestId)! };
    }).immediate();
  }

  markUnresolved(userId: string, requestId: string, at: string): void {
    this.assertUser(userId, at);
    this.database.prepare("UPDATE platform_private_watchlist_operations SET state='unresolved',updated_at_utc=? WHERE user_id=? AND request_id=? AND state='reserved'")
      .run(at, userId, requestId);
  }

  /** Called only with a verified provider receipt, never client-supplied cost/cards. */
  complete(userId: string, requestId: string, requestHash: string, actualCost: number,
    rawCards: Readonly<{ levels?: unknown; analysis?: unknown; indicators?: unknown }>, at: string): void {
    this.assertUser(userId, at);
    const cards = privateCards.parse(rawCards);
    this.database.transaction(() => {
      const operation = this.operation(userId, requestId);
      if (!operation || operation.operation !== "generation" || operation.request_hash !== requestHash) throw new Error("Watchlist receipt identity conflict.");
      if (cards.levels && cards.levels.symbol !== operation.symbol) throw new Error("Wrong ticker in private Watchlist receipt.");
      if (!Number.isSafeInteger(actualCost) || actualCost < 0 || actualCost > operation.maximum_cost_microusd) throw new Error("Watchlist cost reconciliation failed.");
      if (operation.state === "completed") return;
      if (operation.state === "released" || operation.state === "failed") throw new Error("Watchlist reservation already settled.");
      for (const card of ["levels", "analysis", "indicators"] as const) {
        if (cards[card] !== undefined && !operation[`selected_${card}`]) throw new Error("Unexpected private Watchlist card.");
        if (operation[`selected_${card}`] && (cards[card] === undefined || cards[card] === null)) throw new Error("Incomplete private Watchlist receipt.");
      }
      this.database.prepare(`UPDATE platform_private_watchlist_operations SET state='completed',actual_cost_microusd=?,
levels_json=?,analysis_json=?,indicators_json=?,updated_at_utc=? WHERE user_id=? AND request_id=?`)
        .run(actualCost, cards.levels === undefined ? null : JSON.stringify(cards.levels),
          cards.analysis === undefined ? null : JSON.stringify(cards.analysis), cards.indicators === undefined ? null : JSON.stringify(cards.indicators), at, userId, requestId);
    }).immediate();
  }

  /** Only a trusted provider's durable non-execution receipt may release a hold.
   * A timeout, absent receipt or failed response is never proof of non-execution.
   */
  releaseNotExecuted(userId: string, requestId: string, requestHash: string, at: string): void {
    this.assertUser(userId, at); assertCanonicalUuidV4(requestId, "requestId");
    this.database.transaction(() => {
      const operation = this.operation(userId, requestId);
      if (!operation || operation.operation !== "generation" || operation.request_hash !== requestHash) throw new Error("Watchlist receipt identity conflict.");
      if (operation.state === "completed" || operation.state === "failed") throw new Error("Settled Watchlist work cannot be released.");
      this.database.prepare(`UPDATE platform_private_watchlist_operations SET state='released',actual_cost_microusd=0,updated_at_utc=?
WHERE user_id=? AND request_id=? AND state IN ('reserved','unresolved')`).run(at, userId, requestId);
    }).immediate();
  }

  readCards(userId: string, value: string, at: string): PrivateWatchlistCards {
    this.assertUser(userId, at); assertMembershipFeature(this.database, userId, "private_watchlist.access");
    const result: PrivateWatchlistCards = {};
    for (const card of ["levels", "analysis", "indicators"] as const) {
      if (!evaluateMembershipFeature(this.database, userId, `private_watchlist.${card}`, undefined, at).allowed) continue;
      const row = this.database.prepare(`SELECT ${card}_json payload FROM platform_private_watchlist_operations
WHERE user_id=? AND symbol=? AND operation='generation' AND state='completed' AND ${card}_json IS NOT NULL
ORDER BY created_at_utc DESC,request_id DESC LIMIT 1`).get(userId, this.symbol(value)) as { payload: string } | undefined;
      if (row) {
        if (card === "levels") result.levels = privateLevelsCard.parse(JSON.parse(row.payload));
        else result[card] = privateTextCard.parse(JSON.parse(row.payload));
      }
    }
    return result;
  }

  settleFailed(userId: string, requestId: string, requestHash: string, actualCost: number, at: string): void {
    this.assertUser(userId, at);
    this.database.transaction(() => {
      const operation = this.operation(userId, requestId);
      if (!operation || operation.operation !== "generation" || operation.request_hash !== requestHash ||
        !Number.isSafeInteger(actualCost) || actualCost < 0 || actualCost > operation.maximum_cost_microusd) throw new Error("Invalid failed generation receipt.");
      if (operation.state === "failed") return;
      if (operation.state === "completed" || operation.state === "released") throw new Error("Watchlist request already settled.");
      this.database.prepare("UPDATE platform_private_watchlist_operations SET state='failed',actual_cost_microusd=?,updated_at_utc=? WHERE user_id=? AND request_id=?")
        .run(actualCost, at, userId, requestId);
    }).immediate();
  }
}
