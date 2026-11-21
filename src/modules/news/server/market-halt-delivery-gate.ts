import type Database from "better-sqlite3";
import { readMarketHaltDetectionSettings } from "./market-halt-detection-settings";
import { marketHaltDeliveryAllowed, marketHaltWindowOpen } from "./market-halt-session-gate";

export function marketHaltDeliveryWindowOpen(at: number): boolean {
  try { return marketHaltWindowOpen(readMarketHaltDetectionSettings(), at); }
  catch { return false; }
}
/** Read fresh settings and actual saved event at the last synchronous send boundary. */
export function storedMarketHaltDeliveryAllowed(
  database: Database.Database, channel: "discord" | "push", deliveryId: string, now: number,
): boolean {
  const table = channel === "discord" ? "news_market_halt_discord_deliveries" : "news_market_halt_push_deliveries";
  const row = database.prepare<[string], { halt_date_et: string; halt_time_et: string; created_at_utc: string }>(`SELECT
    halt.halt_date_et, halt.halt_time_et, delivery.created_at_utc
    FROM ${table} delivery JOIN news_market_halt_events halt ON halt.halt_id = delivery.halt_id
    WHERE delivery.delivery_id = ? AND delivery.state = 'sending'
      AND NOT EXISTS (SELECT 1 FROM news_market_halt_ticker_day_alert_sequences sequence
        WHERE sequence.first_halt_id=halt.halt_id AND sequence.ended_at_utc IS NOT NULL)`).get(deliveryId);
  if (!row) return false;
  try {
    return marketHaltDeliveryAllowed({ haltDateEt: row.halt_date_et, haltTimeEt: row.halt_time_et }, row.created_at_utc,
      readMarketHaltDetectionSettings(), now);
  } catch { return false; }
}
