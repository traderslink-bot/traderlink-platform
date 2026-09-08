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

type StoredHaltEvent = Readonly<{
  first_seen_at_utc: string;
  halt_date_et: string;
  halt_id: string;
  halt_time_et: string;
  reason_code: string;
  reason_description: string;
  resumption_quote_time_et: string | null;
  resumption_trade_time_et: string | null;
  source: "nasdaq" | "nyse";
  ticker: string;
}>;

type TickerDayAlertSequence = Readonly<{
  ended_at_utc: string | null;
  first_halt_id: string;
  initial_notified_at_utc: string;
  last_notified_quote_time_et: string | null;
  last_notified_trade_time_et: string | null;
  quote_time_revision: number;
  trade_time_revision: number;
}>;

type HaltAlertStage = "initial" | "quote_time" | "trade_time";

function easternTimeSeconds(value: string): number | null {
  const matched = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/u.exec(value);
  if (!matched) return null;
  const hours = Number(matched[1]);
  const minutes = Number(matched[2]);
  const seconds = Number(matched[3]);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return (hours * 60 * 60) + (minutes * 60) + seconds;
}

function easternTradingDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (iso) return value;
  const monthFirst = /^(\d{2})\/(\d{2})\/(\d{4})$/u.exec(value);
  return monthFirst ? `${monthFirst[3]}-${monthFirst[1]}-${monthFirst[2]}` : null;
}

function observedEasternDateTime(value: string): Readonly<{ date: string; seconds: number }> | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(value));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const date = `${values.year}-${values.month}-${values.day}`;
    const seconds = easternTimeSeconds(`${values.hour}:${values.minute}:${values.second}`);
    return seconds === null ? null : Object.freeze({ date, seconds });
  } catch {
    return null;
  }
}

function expectedTradeTimeReached(event: StoredHaltEvent, observedAtUtc: string): boolean {
  if (!event.resumption_trade_time_et) return false;
  const eventDate = easternTradingDate(event.halt_date_et);
  const observed = observedEasternDateTime(observedAtUtc);
  const tradeSeconds = easternTimeSeconds(event.resumption_trade_time_et);
  if (!eventDate || !observed || tradeSeconds === null) return false;
  return observed.date > eventDate || (observed.date === eventDate && observed.seconds >= tradeSeconds);
}

function exchangeName(source: "nasdaq" | "nyse"): string {
  return source === "nyse" ? "NYSE" : "Nasdaq";
}

function notificationCopy(event: StoredHaltEvent, stage: HaltAlertStage): Readonly<{ body: string; title: string }> {
  const exchange = exchangeName(event.source);
  if (stage === "initial") {
    const timing = event.resumption_trade_time_et
      ? `Quotes expected at ${event.resumption_quote_time_et ?? "an unposted time"} ET. Trading expected at ${event.resumption_trade_time_et} ET.`
      : event.resumption_quote_time_et
        ? `Quotes expected at ${event.resumption_quote_time_et} ET. Expected trading time has not been posted.`
        : "Expected quote and trading times have not been posted.";
    return Object.freeze({
      body: `${exchange} reports ${event.reason_description} (${event.reason_code}). ${timing}`,
      title: `${event.ticker} halted at ${event.halt_time_et} ET`,
    });
  }
  if (stage === "quote_time") {
    return Object.freeze({
      body: `${exchange} now expects quotes at ${event.resumption_quote_time_et} ET.${event.resumption_trade_time_et ? ` Trading expected at ${event.resumption_trade_time_et} ET.` : " Expected trading time has not been posted."}`,
      title: `${event.ticker} quote time updated`,
    });
  }
  return Object.freeze({
    body: `${exchange} now expects trading at ${event.resumption_trade_time_et} ET.${event.resumption_quote_time_et ? ` Quotes are expected at ${event.resumption_quote_time_et} ET.` : ""}`,
    title: `${event.ticker} trade time updated`,
  });
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

  reconcileDeliveryLifecycle(input: Readonly<{ haltId: string; observedAtUtc: string }>): number {
    assertCanonicalUtcTimestamp(input.observedAtUtc, "marketHaltAlertLifecycleObservedAt");
    const event = this.database.prepare<[string], StoredHaltEvent>(`SELECT
  halt_id, ticker, halt_date_et, halt_time_et, source, reason_code, reason_description,
  resumption_quote_time_et, resumption_trade_time_et, first_seen_at_utc
FROM news_market_halt_events WHERE halt_id = ?`).get(input.haltId);
    if (!event) return 0;
    const first = this.database.prepare<[string, string], StoredHaltEvent>(`SELECT
  halt_id, ticker, halt_date_et, halt_time_et, source, reason_code, reason_description,
  resumption_quote_time_et, resumption_trade_time_et, first_seen_at_utc
FROM news_market_halt_events
WHERE ticker = ? AND halt_date_et = ?
ORDER BY halt_time_et ASC, first_seen_at_utc ASC, halt_id ASC
LIMIT 1`).get(event.ticker, event.halt_date_et);
    if (!first || first.halt_id !== event.halt_id) return 0;
    const sequence = this.database.prepare<[string, string], TickerDayAlertSequence>(`SELECT
  first_halt_id, initial_notified_at_utc, last_notified_quote_time_et,
  last_notified_trade_time_et, quote_time_revision, trade_time_revision, ended_at_utc
FROM news_market_halt_ticker_day_alert_sequences
WHERE ticker = ? AND halt_date_et = ?`).get(event.ticker, event.halt_date_et);
    if (!sequence) {
      const count = this.enqueueStage({
        event,
        occurredAtUtc: input.observedAtUtc,
        revision: 0,
        stage: "initial",
      });
      this.database.prepare(`INSERT INTO news_market_halt_ticker_day_alert_sequences (
  ticker, halt_date_et, first_halt_id, initial_notified_at_utc,
  last_notified_quote_time_et, last_notified_trade_time_et,
  quote_time_revision, trade_time_revision, ended_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 0, 0, NULL)`).run(
        event.ticker,
        event.halt_date_et,
        event.halt_id,
        input.observedAtUtc,
        event.resumption_quote_time_et,
        event.resumption_trade_time_et,
      );
      return count;
    }
    if (sequence.first_halt_id !== event.halt_id || sequence.ended_at_utc) return 0;

    if (expectedTradeTimeReached(event, input.observedAtUtc)) {
      this.database.prepare(`UPDATE news_market_halt_ticker_day_alert_sequences
SET ended_at_utc = ?
WHERE ticker = ? AND halt_date_et = ? AND first_halt_id = ? AND ended_at_utc IS NULL`).run(
        input.observedAtUtc,
        event.ticker,
        event.halt_date_et,
        event.halt_id,
      );
      return 0;
    }
    const quoteChanged = event.resumption_quote_time_et !== null &&
      event.resumption_quote_time_et !== sequence.last_notified_quote_time_et;
    const tradeChanged = event.resumption_trade_time_et !== null &&
      event.resumption_trade_time_et !== sequence.last_notified_trade_time_et;
    if (quoteChanged || tradeChanged) {
      const stage: HaltAlertStage = tradeChanged ? "trade_time" : "quote_time";
      const revision = stage === "trade_time"
        ? sequence.trade_time_revision + 1
        : sequence.quote_time_revision + 1;
      const count = this.enqueueStage({ event, occurredAtUtc: input.observedAtUtc, revision, stage });
      this.database.prepare(`UPDATE news_market_halt_ticker_day_alert_sequences SET
  last_notified_quote_time_et = ?, last_notified_trade_time_et = ?,
  quote_time_revision = quote_time_revision + ?, trade_time_revision = trade_time_revision + ?
WHERE ticker = ? AND halt_date_et = ? AND first_halt_id = ? AND ended_at_utc IS NULL`).run(
        event.resumption_quote_time_et,
        event.resumption_trade_time_et,
        stage === "quote_time" ? 1 : 0,
        stage === "trade_time" ? 1 : 0,
        event.ticker,
        event.halt_date_et,
        event.halt_id,
      );
      return count;
    }
    return 0;
  }

  private enqueueStage(input: Readonly<{
    event: StoredHaltEvent;
    occurredAtUtc: string;
    revision: number;
    stage: HaltAlertStage;
  }>): number {
    const copy = notificationCopy(input.event, input.stage);
    const subscriptions = this.database.prepare<[string, string], { subscription_id: string }>(`SELECT subscription.subscription_id
FROM platform_web_push_subscriptions subscription
JOIN news_market_halt_preferences preference
  ON preference.user_id = subscription.user_id AND preference.enabled = 1
WHERE subscription.state = 'active' AND NOT EXISTS (
  SELECT 1 FROM news_market_halt_muted_tickers muted
  WHERE muted.user_id = subscription.user_id AND muted.ticker = ?
    AND muted.expires_at_utc > ?
)`).all(input.event.ticker, input.occurredAtUtc);
    const insert = this.database.prepare(`INSERT OR IGNORE INTO news_market_halt_push_deliveries (
delivery_id, halt_id, subscription_id, notification_stage, notification_revision,
notification_title, notification_body, state, attempt_count,
available_at_utc, last_attempt_at_utc, delivered_at_utc, failure_code, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, NULL, NULL, ?, ?)`);
    let count = 0;
    this.database.transaction(() => subscriptions.forEach((subscription) => {
      count += insert.run(
        createCanonicalUuidV4(),
        input.event.halt_id,
        subscription.subscription_id,
        input.stage,
        input.revision,
        copy.title,
        copy.body,
        input.occurredAtUtc,
        input.occurredAtUtc,
        input.occurredAtUtc,
      ).changes;
    })).immediate();
    return count;
  }
}
