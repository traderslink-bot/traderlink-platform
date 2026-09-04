import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "../../platform/server/database/platform-migration-contract";
import type { MarketHalt } from "./market-halt-feed";
import { marketHaltMuteExpiresAtUtc } from "./market-halt-mute-expiry";

function assertActive(database: Database.Database, scope: WorkspaceAccessScope): void {
  const found = database.prepare<[string, string], { found: number }>(`SELECT 1 AS found
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
WHERE membership.user_id = ? AND membership.workspace_id = ?
  AND membership.status = 'active' AND user.status = 'active' AND workspace.status = 'active'`).get(
    scope.userId,
    scope.workspaceId,
  );
  if (!found) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
}

function normalizeTicker(value: string): string {
  const ticker = value.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,24}$/u.test(ticker)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
  return ticker;
}

const sparseHaltLifecycleToleranceSeconds = 2 * 60;

type ExistingHaltLifecycle = Readonly<{
  halt_id: string;
  halt_time_et: string;
  resumption_quote_time_et: string | null;
  resumption_trade_time_et: string | null;
}>;

function easternTimeSeconds(value: string): number | null {
  const matched = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/u.exec(value);
  if (!matched) return null;
  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  const seconds = Number(matched[3]);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return (hours * 60 * 60) + (minutes * 60) + seconds;
}

function isSameHaltLifecycle(existing: ExistingHaltLifecycle, halt: MarketHalt): boolean {
  if (existing.halt_time_et === halt.haltTimeEt) return true;
  const existingHaltSeconds = easternTimeSeconds(existing.halt_time_et);
  const incomingHaltSeconds = easternTimeSeconds(halt.haltTimeEt);
  if (existingHaltSeconds === null || incomingHaltSeconds === null) return false;

  const expectedResumptionSeconds = easternTimeSeconds(
    existing.resumption_trade_time_et ?? existing.resumption_quote_time_et ?? "",
  );
  if (expectedResumptionSeconds !== null && incomingHaltSeconds <= expectedResumptionSeconds) return true;

  return Math.abs(incomingHaltSeconds - existingHaltSeconds) <= sparseHaltLifecycleToleranceSeconds;
}

export class MarketHaltAlertRepository {
  constructor(private readonly database: Database.Database) {}

  read(scope: WorkspaceAccessScope): Readonly<{ enabled: boolean }> {
    assertActive(this.database, scope);
    const enabled = this.database.prepare<[string], { enabled: number }>(
      `SELECT enabled FROM news_market_halt_preferences WHERE user_id = ?`,
    ).get(scope.userId)?.enabled === 1;
    return Object.freeze({ enabled });
  }

  listMutedTickers(input: Readonly<{
    scope: WorkspaceAccessScope;
    readAtUtc: string;
  }>): readonly string[] {
    assertActive(this.database, input.scope);
    assertCanonicalUtcTimestamp(input.readAtUtc, "marketHaltMuteReadAt");
    return Object.freeze(this.database.prepare<[string, string], { ticker: string }>(`SELECT ticker
FROM news_market_halt_muted_tickers
WHERE user_id = ? AND expires_at_utc > ?
ORDER BY ticker ASC`).all(
      input.scope.userId,
      input.readAtUtc,
    ).map((row) => row.ticker));
  }

  setEnabled(input: Readonly<{
    enabled: boolean;
    scope: WorkspaceAccessScope;
    updatedAtUtc: string;
  }>): boolean {
    assertActive(this.database, input.scope);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "marketHaltPreferenceUpdatedAt");
    this.database.prepare(`INSERT INTO news_market_halt_preferences (user_id, enabled, updated_at_utc)
VALUES (?, ?, ?)
ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled, updated_at_utc = excluded.updated_at_utc`).run(
      input.scope.userId,
      input.enabled ? 1 : 0,
      input.updatedAtUtc,
    );
    return input.enabled;
  }

  muteForCurrentTradingDay(input: Readonly<{
    scope: WorkspaceAccessScope;
    ticker: string;
    updatedAtUtc: string;
  }>): string {
    assertActive(this.database, input.scope);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "marketHaltMuteUpdatedAt");
    const ticker = normalizeTicker(input.ticker);
    const expiresAtUtc = marketHaltMuteExpiresAtUtc(new Date(input.updatedAtUtc));
    this.database.prepare(`INSERT INTO news_market_halt_muted_tickers
  (user_id, ticker, muted_at_utc, expires_at_utc)
VALUES (?, ?, ?, ?)
ON CONFLICT(user_id, ticker) DO UPDATE SET
  muted_at_utc = excluded.muted_at_utc,
  expires_at_utc = excluded.expires_at_utc`).run(
      input.scope.userId,
      ticker,
      input.updatedAtUtc,
      expiresAtUtc,
    );
    return ticker;
  }

  unmute(input: Readonly<{
    scope: WorkspaceAccessScope;
    ticker: string;
  }>): string {
    assertActive(this.database, input.scope);
    const ticker = normalizeTicker(input.ticker);
    this.database.prepare(`DELETE FROM news_market_halt_muted_tickers
WHERE user_id = ? AND ticker = ?`).run(input.scope.userId, ticker);
    return ticker;
  }

  upsert(input: Readonly<{
    halt: MarketHalt;
    observedAtUtc: string;
    sourceUrl: string;
  }>): Readonly<{ haltId: string; inserted: boolean }> {
    assertCanonicalUtcTimestamp(input.observedAtUtc, "marketHaltObservedAt");
    const existing = this.database.prepare<[string, string, string, string], ExistingHaltLifecycle>(`SELECT
  halt_id, halt_time_et, resumption_quote_time_et, resumption_trade_time_et
FROM news_market_halt_events
WHERE source = ? AND halt_date_et = ? AND ticker = ? AND reason_code = ?
ORDER BY halt_time_et DESC, updated_at_utc DESC`).all(
      input.halt.source,
      input.halt.haltDateEt,
      input.halt.ticker,
      input.halt.reasonCode,
    ).find((candidate) => isSameHaltLifecycle(candidate, input.halt));
    if (existing) {
      this.database.prepare(`UPDATE news_market_halt_events SET
reason_description = ?, resumption_quote_time_et = COALESCE(?, resumption_quote_time_et),
resumption_trade_time_et = COALESCE(?, resumption_trade_time_et), updated_at_utc = ? WHERE halt_id = ?`).run(
        input.halt.reasonDescription,
        input.halt.resumptionQuoteTimeEt,
        input.halt.resumptionTradeTimeEt,
        input.observedAtUtc,
        existing.halt_id,
      );
      return Object.freeze({ haltId: existing.halt_id, inserted: false });
    }
    const haltId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO news_market_halt_events (
halt_id, source, halt_date_et, halt_time_et, ticker, issue_name, market, reason_code,
reason_description, resumption_quote_time_et, resumption_trade_time_et, source_url,
first_seen_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      haltId,
      input.halt.source,
      input.halt.haltDateEt,
      input.halt.haltTimeEt,
      input.halt.ticker,
      input.halt.issueName,
      input.halt.market,
      input.halt.reasonCode,
      input.halt.reasonDescription,
      input.halt.resumptionQuoteTimeEt,
      input.halt.resumptionTradeTimeEt,
      input.sourceUrl,
      input.observedAtUtc,
      input.observedAtUtc,
    );
    return Object.freeze({ haltId, inserted: true });
  }

  enqueue(input: Readonly<{ halt: MarketHalt; haltId: string; occurredAtUtc: string }>): number {
    const title = `${input.halt.ticker} halted — ${input.halt.haltTimeEt} ET`;
    const exchange = input.halt.source === "nyse" ? "NYSE" : "Nasdaq";
    const timing = input.halt.resumptionQuoteTimeEt || input.halt.resumptionTradeTimeEt
      ? `${exchange} expects quotes at ${input.halt.resumptionQuoteTimeEt ?? "an unposted time"} ET; trading at ${input.halt.resumptionTradeTimeEt ?? "an unposted time"} ET.`
      : "The exchange has not posted quote or trading resumption times yet.";
    const body = `${input.halt.reasonDescription} (${input.halt.reasonCode}). ${timing}`;
    const subscriptions = this.database.prepare<[string, string], { subscription_id: string }>(`SELECT subscription.subscription_id
FROM platform_web_push_subscriptions subscription
JOIN news_market_halt_preferences preference
  ON preference.user_id = subscription.user_id AND preference.enabled = 1
WHERE subscription.state = 'active' AND NOT EXISTS (
  SELECT 1 FROM news_market_halt_muted_tickers muted
  WHERE muted.user_id = subscription.user_id AND muted.ticker = ?
    AND muted.expires_at_utc > ?
)`).all(input.halt.ticker, input.occurredAtUtc);
    const insert = this.database.prepare(`INSERT OR IGNORE INTO news_market_halt_push_deliveries (
delivery_id, halt_id, subscription_id, notification_title, notification_body, state, attempt_count,
available_at_utc, last_attempt_at_utc, delivered_at_utc, failure_code, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, NULL, NULL, NULL, ?, ?)`);
    let count = 0;
    this.database.transaction(() => subscriptions.forEach((subscription) => {
      count += insert.run(
        createCanonicalUuidV4(),
        input.haltId,
        subscription.subscription_id,
        title,
        body,
        input.occurredAtUtc,
        input.occurredAtUtc,
        input.occurredAtUtc,
      ).changes;
    })).immediate();
    return count;
  }
}
