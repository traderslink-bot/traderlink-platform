import type Database from "better-sqlite3";
import { z } from "zod";
import { parseWatchlistBudgetUsd } from "../../../platform/contracts/membership-watchlist-budget";

const read = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const meter = z.enum(["ticker_additions", "generations", "cost_microusd", "active_tickers"]);

/** Existing owner-only membership action supplies the actor; never a member route. */
export function managePrivateWatchlistAllowance(database: Database.Database, actor: string, form: FormData, at: string): string {
  const selectedMeter = meter.parse(read(form, "meter"));
  if (read(form, "operation") === "private_watchlist_override_remove") {
    const user = z.uuid().parse(read(form, "userId"));
    database.prepare("DELETE FROM platform_private_watchlist_member_overrides WHERE user_id=? AND meter=?").run(user, selectedMeter);
    return user;
  }
  const kind = z.enum(["calendar_month", "days", "lifetime"]).parse(read(form, "periodKind"));
  const days = kind === "days" ? z.coerce.number().int().safe().positive().parse(read(form, "periodDays")) : null;
  if (read(form, "operation") === "private_watchlist_period") {
    if (selectedMeter === "active_tickers") throw new Error("Choose a usage allowance; active ticker slots do not reset.");
    const version = z.uuid().parse(read(form, "planVersionId"));
    if (!database.prepare("SELECT 1 FROM platform_membership_plan_versions WHERE plan_version_id=? AND lifecycle_state='draft'").get(version)) throw new Error("Choose a draft plan version.");
    database.prepare(`INSERT INTO platform_private_watchlist_plan_periods VALUES (?,?,?,?)
ON CONFLICT(plan_version_id,meter) DO UPDATE SET period_kind=excluded.period_kind,period_days=excluded.period_days`)
      .run(version, selectedMeter, kind, days);
    return version;
  }
  const user = z.uuid().parse(read(form, "userId"));
  const amount = read(form, "limitValue");
  const limit = selectedMeter === "cost_microusd" && read(form, "budgetUnit") === "USD"
    ? parseWatchlistBudgetUsd(amount)
    : amount === "" ? null : z.coerce.number().int().safe().nonnegative().parse(amount);
  const start = read(form, "startsAtUtc") ? z.iso.datetime({ precision: 3 }).parse(read(form, "startsAtUtc")) : at;
  const end = read(form, "endsAtUtc") ? z.iso.datetime({ precision: 3 }).parse(read(form, "endsAtUtc")) : null;
  if (end !== null && end <= start) throw new Error("Enter an end after the start.");
  database.prepare(`INSERT INTO platform_private_watchlist_member_overrides
(user_id,meter,limit_value,period_kind,period_days,starts_at_utc,ends_at_utc,updated_by_user_id,updated_at_utc)
VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,meter) DO UPDATE SET limit_value=excluded.limit_value,
period_kind=excluded.period_kind,period_days=excluded.period_days,starts_at_utc=excluded.starts_at_utc,
ends_at_utc=excluded.ends_at_utc,updated_by_user_id=excluded.updated_by_user_id,updated_at_utc=excluded.updated_at_utc`)
    .run(user, selectedMeter, limit, kind, days, start, end, actor, at);
  return user;
}
