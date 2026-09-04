import type Database from "better-sqlite3";

import type { SharedAnalyzerAvailability, SharedAnalyzerSettings } from "../contracts/shared-analyzer-beta-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

const DEFAULT_DAILY = 10;
const DEFAULT_PERIOD = 100;
const DEFAULT_GLOBAL = 120;
const DEFAULT_SPACING = 2;

type SettingsRow = Readonly<{
  enabled: number;
  default_daily_limit: number;
  default_period_limit: number;
  global_rolling_24h_limit: number;
  request_spacing_seconds: number;
  designated_user_id: string | null;
  designated_workspace_id: string | null;
  designated_account_id: string | null;
  revision: number;
}>;

type Cycle = Readonly<{
  allowance_cycle_id: string;
  starts_on_new_york_date: string;
  ends_on_new_york_date: string;
}>;

function newYorkDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  return Math.max(0, Math.round((Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86_400_000));
}

export class SharedAnalyzerAllowanceRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  private settingsRow(): SettingsRow | null {
    const row = this.database.prepare(`SELECT enabled, default_daily_limit,
 default_period_limit, global_rolling_24h_limit, request_spacing_seconds,
 designated_user_id, designated_workspace_id, designated_account_id, revision
FROM level_analysis_shared_analyzer_settings WHERE settings_key = 'beta'`).get() as SettingsRow | undefined;
    return row ?? null;
  }

  settings(): SharedAnalyzerSettings {
    const row = this.settingsRow();
    return Object.freeze({
      enabled: row?.enabled !== 0,
      dailyLimit: row?.default_daily_limit ?? DEFAULT_DAILY,
      periodLimit: row?.default_period_limit ?? DEFAULT_PERIOD,
      globalRolling24HourLimit: row?.global_rolling_24h_limit ?? DEFAULT_GLOBAL,
      requestSpacingSeconds: row?.request_spacing_seconds ?? DEFAULT_SPACING,
      revision: row?.revision ?? 0,
      designatedConnectionConfigured: Boolean(row?.designated_user_id && row.designated_workspace_id && row.designated_account_id),
    });
  }

  designatedScope(): AccountScope | null {
    const row = this.settingsRow();
    if (!row?.designated_user_id || !row.designated_workspace_id || !row.designated_account_id) return null;
    return Object.freeze({
      userId: row.designated_user_id,
      workspaceId: row.designated_workspace_id,
      accountId: row.designated_account_id,
      workspaceRole: "owner",
    });
  }

  isDemo(scope: AccountScope): boolean {
    return Boolean(this.database.prepare(`SELECT 1 FROM journal_demo_accounts
WHERE workspace_id = ? AND account_id = ?`).get(scope.workspaceId, scope.accountId));
  }

  private currentCycle(userId: string, date: string): Cycle | null {
    return this.database.prepare(`SELECT allowance_cycle_id, starts_on_new_york_date,
 ends_on_new_york_date FROM level_analysis_user_allowance_cycles
WHERE user_id = ? AND starts_on_new_york_date <= ? AND ends_on_new_york_date >= ?
ORDER BY starts_on_new_york_date DESC LIMIT 1`).get(userId, date, date) as Cycle | undefined ?? null;
  }

  activeCycle(userId: string, now: Date): Cycle | null {
    return this.currentCycle(userId, newYorkDate(now));
  }

  ensureCycle(userId: string, now: Date): Cycle {
    const date = newYorkDate(now);
    const current = this.currentCycle(userId, date);
    if (current) return current;
    const first = this.database.prepare(`SELECT starts_on_new_york_date
FROM level_analysis_user_allowance_cycles
WHERE user_id = ? ORDER BY starts_on_new_york_date LIMIT 1`).get(userId) as
      | { starts_on_new_york_date: string }
      | undefined;
    const cycleStart = first
      ? addDays(first.starts_on_new_york_date,
          Math.floor(daysBetween(first.starts_on_new_york_date, date) / 30) * 30)
      : date;
    const cycle = Object.freeze({
      allowance_cycle_id: createCanonicalUuidV4(),
      starts_on_new_york_date: cycleStart,
      ends_on_new_york_date: addDays(cycleStart, 29),
    });
    this.database.prepare(`INSERT INTO level_analysis_user_allowance_cycles (
 allowance_cycle_id, user_id, starts_on_new_york_date, ends_on_new_york_date, created_at_utc
) VALUES (?, ?, ?, ?, ?)`)
      .run(cycle.allowance_cycle_id, userId, cycle.starts_on_new_york_date,
        cycle.ends_on_new_york_date, createCanonicalUtcTimestamp(now));
    return cycle;
  }

  availability(userId: string, now: Date = new Date()): SharedAnalyzerAvailability {
    const date = newYorkDate(now);
    const settings = this.settings();
    const override = this.database.prepare(`SELECT daily_limit, period_limit
FROM level_analysis_user_allowance_overrides WHERE user_id = ?`).get(userId) as
      | { daily_limit: number | null; period_limit: number | null }
      | undefined;
    const dailyLimit = override?.daily_limit ?? settings.dailyLimit;
    const periodLimit = override?.period_limit ?? settings.periodLimit;
    const cycle = this.currentCycle(userId, date);
    if (!cycle) {
      const first = this.database.prepare(`SELECT starts_on_new_york_date
FROM level_analysis_user_allowance_cycles
WHERE user_id = ? ORDER BY starts_on_new_york_date LIMIT 1`).get(userId) as
        | { starts_on_new_york_date: string }
        | undefined;
      const virtualStart = first
        ? addDays(first.starts_on_new_york_date,
            Math.floor(daysBetween(first.starts_on_new_york_date, date) / 30) * 30)
        : null;
      return Object.freeze({ enabled: settings.enabled, dailyAvailable: dailyLimit,
        periodAvailable: periodLimit, selectableAvailable: Math.min(dailyLimit, periodLimit),
        daysUntilReset: virtualStart ? daysBetween(date, addDays(virtualStart, 30)) : 30 });
    }
    const resets = this.database.prepare(`SELECT reset_kind, max(created_at_utc) AS reset_at
FROM level_analysis_user_allowance_resets
WHERE user_id = ? AND (allowance_cycle_id = ? OR reset_kind = 'daily')
GROUP BY reset_kind`).all(userId, cycle.allowance_cycle_id) as
      readonly { reset_kind: "daily" | "period"; reset_at: string }[];
    const dailyReset = resets.find((item) => item.reset_kind === "daily")?.reset_at ?? "0000-01-01T00:00:00.000Z";
    const periodReset = resets.find((item) => item.reset_kind === "period")?.reset_at ?? "0000-01-01T00:00:00.000Z";
    const charged = this.database.prepare(`SELECT
 sum(CASE WHEN reservation.daily_new_york_date = ? AND acquisition.started_at_utc > ? THEN 1 ELSE 0 END) AS daily_used,
 sum(CASE WHEN acquisition.started_at_utc > ? THEN 1 ELSE 0 END) AS period_used
FROM level_analysis_analyzer_acquisitions acquisition
JOIN level_analysis_analyzer_reservations reservation
 ON reservation.reservation_id = acquisition.reservation_id
WHERE acquisition.charged_user_id = ? AND acquisition.charge_kind = 'user_charged'
 AND reservation.allowance_cycle_id = ?`).get(date, dailyReset, periodReset, userId, cycle.allowance_cycle_id) as
      { daily_used: number | null; period_used: number | null };
    const active = this.database.prepare(`SELECT
 sum(CASE WHEN daily_new_york_date = ? THEN 1 ELSE 0 END) AS daily_used,
 count(*) AS period_used
FROM level_analysis_analyzer_reservations
WHERE user_id = ? AND allowance_cycle_id = ? AND status = 'active'
 AND expires_at_utc >= ?`).get(
      date, userId, cycle.allowance_cycle_id, createCanonicalUtcTimestamp(now),
    ) as { daily_used: number | null; period_used: number };
    const dailyAvailable = Math.max(0, dailyLimit - (charged.daily_used ?? 0) - (active.daily_used ?? 0));
    const periodAvailable = Math.max(0, periodLimit - (charged.period_used ?? 0) - active.period_used);
    return Object.freeze({
      enabled: settings.enabled,
      dailyAvailable,
      periodAvailable,
      selectableAvailable: Math.min(dailyAvailable, periodAvailable),
      daysUntilReset: daysBetween(date, addDays(cycle.ends_on_new_york_date, 1)),
    });
  }

  reserve(input: Readonly<{ userId: string; jobId: string; now: Date; correctionWaiver?: boolean }>): string | null {
    return this.immediate(() => {
      const availability = this.availability(input.userId, input.now);
      if (!input.correctionWaiver && (!availability.enabled || availability.selectableAvailable <= 0)) return null;
      const cycle = this.ensureCycle(input.userId, input.now);
      const timestamp = createCanonicalUtcTimestamp(input.now);
      const reservationId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO level_analysis_analyzer_reservations (
 reservation_id, user_id, logical_trade_job_id, allowance_cycle_id,
 daily_new_york_date, status, correction_waiver, expires_at_utc,
 created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`)
        .run(reservationId, input.userId, input.jobId, cycle.allowance_cycle_id,
          newYorkDate(input.now), input.correctionWaiver ? 1 : 0,
          new Date(input.now.getTime() + 24 * 60 * 60 * 1000).toISOString(), timestamp, timestamp);
      return reservationId;
    });
  }

  reservation(jobId: string, now: Date = new Date()): Readonly<{
    correctionWaiver: boolean;
    reservationId: string;
    userId: string;
  }> | null {
    const row = this.database.prepare(`SELECT reservation_id, user_id, correction_waiver
FROM level_analysis_analyzer_reservations
WHERE logical_trade_job_id = ? AND status = 'active' AND expires_at_utc >= ?`).get(
      jobId, createCanonicalUtcTimestamp(now),
    ) as
      | { reservation_id: string; user_id: string; correction_waiver: number }
      | undefined;
    return row ? Object.freeze({ reservationId: row.reservation_id,
      userId: row.user_id, correctionWaiver: row.correction_waiver === 1 }) : null;
  }

  release(jobId: string, now: Date): void {
    const timestamp = createCanonicalUtcTimestamp(now);
    this.database.prepare(`UPDATE level_analysis_analyzer_reservations
SET status = 'released', updated_at_utc = ?
WHERE logical_trade_job_id = ? AND status = 'active'`).run(timestamp, jobId);
  }

  beginAcquisition(input: Readonly<{
    jobId: string;
    marketSessionSetId: string;
    now: Date;
  }>): Readonly<{ acquisitionId: string; chargeKind: "user_charged" | "correction_waived" }> | null {
    return this.immediate(() => {
      const reservation = this.reservation(input.jobId, input.now);
      if (!reservation) return null;
      const settings = this.settings();
      if (!settings.enabled || !settings.designatedConnectionConfigured) return null;
      const expiredLeaseBefore = new Date(input.now.getTime() - 5 * 60 * 1000).toISOString();
      this.database.prepare(`UPDATE level_analysis_analyzer_acquisitions
SET completed_at_utc = ?, outcome = 'provider_unavailable'
WHERE completed_at_utc IS NULL AND started_at_utc < ?`).run(
        createCanonicalUtcTimestamp(input.now), expiredLeaseBefore,
      );
      const active = this.database.prepare(`SELECT 1 FROM level_analysis_analyzer_acquisitions
WHERE completed_at_utc IS NULL LIMIT 1`).get();
      if (active) return null;
      const since = new Date(input.now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const globalUsed = this.database.prepare(`SELECT count(*) AS count
FROM level_analysis_analyzer_acquisitions WHERE started_at_utc >= ?`).get(since) as { count: number };
      if (globalUsed.count >= settings.globalRolling24HourLimit) return null;
      const prior = this.database.prepare(`SELECT started_at_utc
FROM level_analysis_analyzer_acquisitions ORDER BY started_at_utc DESC LIMIT 1`).get() as
        | { started_at_utc: string }
        | undefined;
      if (prior && Date.parse(prior.started_at_utc) + settings.requestSpacingSeconds * 1000 > input.now.getTime()) {
        return null;
      }
      const chargeKind = reservation.correctionWaiver ? "correction_waived" as const : "user_charged" as const;
      const acquisitionId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO level_analysis_analyzer_acquisitions (
 acquisition_id, market_session_set_id, charged_user_id, reservation_id,
 charge_kind, started_at_utc, completed_at_utc, outcome
) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`).run(
        acquisitionId, input.marketSessionSetId, reservation.userId,
        reservation.reservationId, chargeKind, createCanonicalUtcTimestamp(input.now),
      );
      this.database.prepare(`UPDATE level_analysis_analyzer_reservations
SET status = 'consumed', updated_at_utc = ?
WHERE reservation_id = ? AND status = 'active'`).run(
        createCanonicalUtcTimestamp(input.now), reservation.reservationId,
      );
      return Object.freeze({ acquisitionId, chargeKind });
    });
  }

  completeAcquisition(input: Readonly<{
    acquisitionId: string;
    now: Date;
    outcome: "ready" | "no_coverage" | "provider_unavailable";
  }>): void {
    this.database.prepare(`UPDATE level_analysis_analyzer_acquisitions
SET completed_at_utc = ?, outcome = ?
WHERE acquisition_id = ? AND completed_at_utc IS NULL`).run(
      createCanonicalUtcTimestamp(input.now), input.outcome, input.acquisitionId,
    );
  }

  grantCorrection(input: Readonly<{
    acquisitionId: string;
    logicalTradeId: string;
    logicalTradeVersionId: string;
    now: Date;
  }>): void {
    this.database.prepare(`INSERT INTO level_analysis_analyzer_correction_opportunities (
 correction_opportunity_id, acquisition_id, logical_trade_id,
 source_logical_trade_version_id, status, claimed_logical_trade_job_id,
 created_at_utc, claimed_at_utc
) VALUES (?, ?, ?, ?, 'available', NULL, ?, NULL)
ON CONFLICT(acquisition_id) DO NOTHING`).run(
      createCanonicalUuidV4(), input.acquisitionId, input.logicalTradeId,
      input.logicalTradeVersionId, createCanonicalUtcTimestamp(input.now),
    );
  }

  hasAvailableCorrection(logicalTradeId: string): boolean {
    return Boolean(this.database.prepare(`SELECT 1
FROM level_analysis_analyzer_correction_opportunities
WHERE logical_trade_id = ? AND status = 'available' LIMIT 1`).get(logicalTradeId));
  }

  claimCorrection(input: Readonly<{
    logicalTradeId: string;
    jobId: string;
    userId: string;
    now: Date;
  }>): boolean {
    return this.immediate(() => {
      const opportunity = this.database.prepare(`SELECT correction_opportunity_id
FROM level_analysis_analyzer_correction_opportunities
WHERE logical_trade_id = ? AND status = 'available'
ORDER BY created_at_utc, correction_opportunity_id LIMIT 1`).get(input.logicalTradeId) as
        | { correction_opportunity_id: string }
        | undefined;
      if (!opportunity) return false;
      const reservationId = this.reserve({
        userId: input.userId,
        jobId: input.jobId,
        now: input.now,
        correctionWaiver: true,
      });
      if (!reservationId) return false;
      const timestamp = createCanonicalUtcTimestamp(input.now);
      const changed = this.database.prepare(`UPDATE level_analysis_analyzer_correction_opportunities
SET status = 'claimed', claimed_logical_trade_job_id = ?, claimed_at_utc = ?
WHERE correction_opportunity_id = ? AND status = 'available'`).run(
        input.jobId, timestamp, opportunity.correction_opportunity_id,
      );
      if (changed.changes !== 1) {
        this.release(input.jobId, input.now);
        return false;
      }
      return true;
    });
  }
}
