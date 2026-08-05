import type Database from "better-sqlite3";

import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

export type JournalManualLedgerPosition = Readonly<{
  roundTripId: string;
  currentVersionId: string;
  version: number;
  instrumentId: string;
  symbol: string;
  currency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  finalPositionDecimal: string;
  projectionState: "legitimate_open" | "needs_decision";
}>;

export class JournalManualTradePreviewRepository {
  constructor(private readonly database: Database.Database) {}

  listCurrentNonClosedPositions(
    scope: AccountScope,
  ): readonly JournalManualLedgerPosition[] {
    return Object.freeze(this.database.prepare<[string, string], {
      round_trip_id: string;
      current_version_id: string;
      version_number: number;
      instrument_id: string;
      normalized_symbol: string;
      trade_currency: string;
      direction: "long" | "short";
      opened_at_utc: string;
      final_position_decimal: string;
      projection_state: "legitimate_open" | "needs_decision";
    }>(`SELECT round_trip.round_trip_id, round_trip.current_version_id,
 version.version_number, version.instrument_id, instrument.normalized_symbol,
 version.trade_currency, version.direction, version.opened_at_utc,
 version.final_position_decimal, version.projection_state
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_version_id = round_trip.current_version_id
JOIN journal_instruments instrument
  ON instrument.workspace_id = version.workspace_id
 AND instrument.instrument_id = version.instrument_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND version.projection_state IN ('legitimate_open', 'needs_decision')
ORDER BY instrument.normalized_symbol, version.trade_currency,
         version.opened_at_utc, round_trip.round_trip_id`)
      .all(scope.workspaceId, scope.accountId)
      .map((row) => Object.freeze({
        roundTripId: row.round_trip_id,
        currentVersionId: row.current_version_id,
        version: row.version_number,
        instrumentId: row.instrument_id,
        symbol: row.normalized_symbol,
        currency: row.trade_currency,
        direction: row.direction,
        openedAtUtc: row.opened_at_utc,
        finalPositionDecimal: row.final_position_decimal,
        projectionState: row.projection_state,
      })));
  }
}
