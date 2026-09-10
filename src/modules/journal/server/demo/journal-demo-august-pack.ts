import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import Decimal from "decimal.js";
import additions from "./packs/august-2026-additions.json";
import redAdditions from "./packs/august-2026-red-additions.json";
import redRevision from "./packs/august-2026-red-revision-v11.json";
import { reviseJournalDemoRedTrades } from "./journal-demo-red-revision";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import { JOURNAL_DEMO_CURRENT_VERSION_ID } from "./journal-demo-current-version";
import { correctJournalDemoFeeVersions } from "./journal-demo-fee-correction";
import { materializeJournalDemoAnalyzerFacts } from "./journal-demo-analyzer-materializer";
import { createJournalDemoFinancialPack } from "./journal-demo-canonical-fact-materializer";
import type { JournalDemoDerivedTradeFact, JournalDemoFinancialPackSource, JournalDemoVerifiedMarketDaysInput, JournalDemoVerifiedMarketSessionInput } from "./journal-demo-financial-pack-source";
import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";

const hash = (value: unknown) => createHash("sha256").update(`${JSON.stringify(value)}\n`).digest("hex");

function readSavedBars(database: Database.Database, date: string, symbol: string, checksum: string): readonly NormalizedMarketCandle[] {
  // Immutable checksum selection survives a later owner refresh. No provider access.
  return database.prepare<[string, string, string], NormalizedMarketCandle>(`SELECT
    candle.candle_time_utc_seconds AS time, candle.open_decimal AS openDecimal,
    candle.high_decimal AS highDecimal, candle.low_decimal AS lowDecimal,
    candle.close_decimal AS closeDecimal, candle.volume_decimal AS volumeDecimal,
    candle.turnover_decimal AS turnoverDecimal
    FROM level_analysis_market_session_candles candle
    WHERE candle.market_session_set_version_id = (
      SELECT version.market_session_set_version_id FROM level_analysis_market_session_set_versions version
      JOIN level_analysis_market_session_sets session ON session.market_session_set_id = version.market_session_set_id
      WHERE session.trading_date_new_york = ? AND session.provider_symbol = ?
        AND version.candle_sha256 = ? AND session.provider_key = 'moomoo_history_kline'
      ORDER BY version.retrieved_at_utc ASC, version.market_session_set_version_id ASC LIMIT 1
    ) ORDER BY candle.candle_time_utc_seconds`).all(date, symbol, checksum);
}

export function resolveJournalDemoAugustPack(input: Readonly<{
  database: Database.Database;
  base: JournalDemoFinancialPackSource;
  verifiedMarketDays: JournalDemoVerifiedMarketDaysInput;
  existing?: Readonly<{ accountId: string; workspaceId: string }>;
}>) {
  const trades = [...additions.trades, ...redAdditions.trades] as unknown as readonly JournalDemoDerivedTradeFact[];
  if (trades.length !== 66 || redAdditions.trades.some(t => t.executions.length !== 2 || t.executions[0]!.side !== "buy" || t.executions[1]!.side !== "sell") || additions.sessions.length !== 21) throw new Error("demo_august_inventory_invalid");
  const sessions: JournalDemoVerifiedMarketSessionInput[] = additions.sessions.map((entry) => {
    const candidate = entry as unknown as { date: string; symbol: string; normalizedBarsSha256: string; bars?: readonly NormalizedMarketCandle[] };
    const bars = candidate.bars ?? readSavedBars(input.database, candidate.date, candidate.symbol, candidate.normalizedBarsSha256);
    const normalized = bars.map(b => ({ time: b.time, openDecimal: b.openDecimal, highDecimal: b.highDecimal,
      lowDecimal: b.lowDecimal, closeDecimal: b.closeDecimal, volumeDecimal: b.volumeDecimal, turnoverDecimal: b.turnoverDecimal }));
    if (!bars.length || hash(normalized) !== candidate.normalizedBarsSha256 ||
      bars.some((b, i) => !Number.isSafeInteger(b.time) || (i > 0 && b.time <= bars[i - 1]!.time))) {
      throw new Error("demo_august_saved_candles_unavailable");
    }
    return { date: candidate.date, symbol: candidate.symbol, bars, normalizedBarsSha256: candidate.normalizedBarsSha256 };
  });
  const keys = new Set<string>();
  const revisions = redRevision.trades as unknown as readonly JournalDemoDerivedTradeFact[];
  for (const trade of [...trades.filter(t => !revisions.some(r => r.packTradeKey === t.packTradeKey)), ...revisions]) {
    const session = sessions.find(s => s.date === trade.tradingDateNewYork && s.symbol === trade.symbol);
    let position = new Decimal(0), previousTime = 0;
    for (const [index, execution] of trade.executions.entries()) {
      const candle = session?.bars.find(b => b.time === execution.marketCandleTimeUtcSeconds);
      const quantity = new Decimal(execution.quantityDecimal);
      if (!candle || keys.has(execution.packExecutionKey) || execution.priceDecimal !== candle.closeDecimal ||
        candle.time <= previousTime || new Date(candle.time * 1000).toISOString() !== execution.executedAtUtc ||
        !quantity.isInteger() || !quantity.isPositive() || quantity.gt(candle.volumeDecimal) ||
        !new Decimal(candle.highDecimal).gt(candle.lowDecimal)) throw new Error("demo_august_execution_invalid");
      keys.add(execution.packExecutionKey); previousTime = candle.time;
      position = position.plus(execution.side === "buy" ? quantity : quantity.neg());
      if (position.isNegative() || (position.isZero() && index < trade.executions.length - 1)) throw new Error("demo_august_boundary_invalid");
    }
    if (!position.isZero()) throw new Error("demo_august_position_open");
  }
  const allTrades = [...input.base.trades, ...trades].map(trade => ({...trade,
    executions: trade.executions.map(execution => ({...execution,
      executionFeeDecimal: new Decimal(execution.executionFeeDecimal).abs().neg().toString()}))}));
  const manifest = (selected: readonly JournalDemoDerivedTradeFact[]): JournalDemoFinancialPackSource => {
    const marketDataManifestSha256 = hash([input.base.marketDataManifestSha256, additions.sessions.map(s => [s.date, s.symbol, s.normalizedBarsSha256])]);
    const sourceEvidenceManifestSha256 = hash([input.base.sourceEvidenceManifestSha256, additions.trades, redAdditions.trades, "modeled_fees_are_costs_v10"]);
    return { corporateActionReview: "required_before_materialization", packKey: "daily_tracker_demo", packVersion: 10,
      marketDataManifestSha256, sourceEvidenceManifestSha256, trades: selected,
      derivedFactManifestSha256: hash({ packVersion: 10, marketDataManifestSha256, sourceEvidenceManifestSha256, trades: selected }) };
  };
  let missing = allTrades;
  if (input.existing) {
    const { workspaceId, accountId } = input.existing;
    const recorded = input.database.prepare<[string, string, string, string], { pack_execution_key: string }>(`
      SELECT pack_execution_key FROM journal_demo_execution_provenance WHERE workspace_id = ? AND account_id = ?
      UNION SELECT pack_execution_key FROM journal_demo_pack_application_execution_provenance WHERE workspace_id = ? AND account_id = ?
    `).all(workspaceId, accountId, workspaceId, accountId);
    const present = new Set(recorded.map(r => r.pack_execution_key));
    missing = allTrades.filter(trade => {
      const count = trade.executions.filter(e => present.has(e.packExecutionKey)).length;
      if (count > 0 && count !== trade.executions.length) throw new Error("demo_august_partial_prior_trade");
      return count === 0;
    });
  }
  const full = manifest(allTrades), source = manifest(missing);
  const revisedTrades = allTrades.map(trade => revisions.find(revised => revised.packTradeKey === trade.packTradeKey) ?? trade);
  const revisedSource = { ...full, packVersion: 11, trades: revisedTrades,
    sourceEvidenceManifestSha256: hash([full.sourceEvidenceManifestSha256, revisions, "demo_v11_above_twenty_percent_revision"]),
    derivedFactManifestSha256: hash([full.derivedFactManifestSha256, revisions, 11]) };
  const analyzer = { ...revisedSource, trades: (missing.length ? revisedTrades : revisions)
    .filter(t => t.executions.every(e => e.analysisPolicy === "analyzer_backed")) };
  const verified = {
    sourceEvidenceManifestSha256: full.sourceEvidenceManifestSha256,
    sessions: [...input.verifiedMarketDays.sessions, ...sessions],
  };
  // Trade annotations are created for missing facts only; do not overwrite prior daily notes.
  const pack = createJournalDemoFinancialPack(source, verified, null, full, manifest([]));
  return {...pack, manifest: { ...pack.manifest, demoPackVersionId: JOURNAL_DEMO_CURRENT_VERSION_ID,
    packVersion: 11, materializerVersion: "demo_canonical_journal_v11", manifestSha256: revisedSource.derivedFactManifestSha256 },
    materializeCanonicalFacts: (context: Parameters<typeof pack.materializeCanonicalFacts>[0]) => {
    const existingProvenance = input.existing ? correctJournalDemoFeeVersions(context.database, {
      workspaceId: context.workspaceId, accountId: context.accountId,
      userId: context.createdForUserId, workspaceRole: "owner",
    }, full) : [];
    // Retain the immutable v10 batch contract for missing original facts. A v10
    // account needs only corrections and must not create an empty import batch.
    if (missing.length) new JournalDemoAccountRepository(context.database).ensurePackVersion({
      createdAtUtc: new Date().toISOString(), manifest: pack.manifest,
    });
    const result = missing.length ? pack.materializeCanonicalFacts(context) : { executionProvenance: [] };
    const correctedProvenance = reviseJournalDemoRedTrades({ database: context.database,
      scope: { workspaceId: context.workspaceId, accountId: context.accountId, userId: context.createdForUserId, workspaceRole: "owner" },
      original: redAdditions.trades as unknown as readonly JournalDemoDerivedTradeFact[], revised: revisions,
      provenance: [...existingProvenance, ...result.executionProvenance] });
    if (analyzer.trades.length) materializeJournalDemoAnalyzerFacts({...context,
      executionProvenance: correctedProvenance,
      source: analyzer, verifiedMarketDays: verified});
    return { executionProvenance: result.executionProvenance.map(fact =>
      correctedProvenance.find(current => current.packExecutionKey === fact.packExecutionKey) ?? fact),
      materializedFactManifestSha256: revisedSource.derivedFactManifestSha256,
      materializedMarketDataManifestSha256: full.marketDataManifestSha256 };
  }};
}
