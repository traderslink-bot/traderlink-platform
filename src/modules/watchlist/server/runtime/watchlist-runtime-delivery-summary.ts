import type Database from "better-sqlite3";

type Counts = { label: string; available: boolean; pending: number; sending: number; failed: number; uncertain: number };
type Source = { table: string; state?: string; channel?: string; value?: string; where?: string };
const sources: ReadonlyArray<{ label: string; sources: readonly Source[] }> = [
  { label: "Free Chat", sources: [{ table: "platform_watchlist_free_chat_posts" }] },
  { label: "Member push", sources: ["platform_watchlist_notification_deliveries", "platform_watchlist_category_move_deliveries", "platform_watchlist_notes_deliveries"].map(table => ({ table, channel: "channel", value: "web_push" })) },
  { label: "Member email", sources: ["platform_watchlist_notification_deliveries", "platform_watchlist_category_move_deliveries", "platform_watchlist_notes_deliveries"].map(table => ({ table, channel: "channel", value: "email" })) },
  { label: "Owner Discord alerts", sources: [{ table: "platform_watchlist_owner_review_deliveries", state: "discord_state" }] },
  { label: "Notes Discord", sources: [{ table: "platform_watchlist_notes_notifications", state: "discord_state", where: "state IN ('pending','accepted')" }] },
  { label: "Gain posts", sources: [{ table: "platform_watchlist_potential_gain_posts" }] },
  { label: "Recap posts", sources: [{ table: "platform_watchlist_recap_post_attempts", state: "attempt_state" }] },
  { label: "X / Buffer", sources: [{ table: "platform_watchlist_x_posts" }] },
];
const pending = new Set(["pending", "retry", "waiting", "preparing", "ready"]);
const finished = new Set(["sent", "accepted", "delivered", "expired", "opted_out", "inaccessible", "cancelled", "skipped", "posted", "disabled"]);

/** SELECT-only, fixed allowlist. Does not initialize stores, run workers or recover
 * interrupted sends. Missing schema is unavailable, never a fabricated zero. */
export function readWatchlistRuntimeDeliverySummary(database: Database.Database, now = Date.now()) {
  const read = () => ({
    refreshedAt: now,
    deliveries: sources.map(group => {
      const counts: Counts = { label: group.label, available: true, pending: 0, sending: 0, failed: 0, uncertain: 0 };
      for (const source of group.sources) {
        try {
          const state = source.state ?? "state";
          const filter = source.channel ? `${source.channel}=?` : source.where;
          const rows = database.prepare(`SELECT ${state} AS state,COUNT(*) AS count FROM ${source.table}${filter ? ` WHERE ${filter}` : ""} GROUP BY ${state}`)
            .all(...(source.channel ? [source.value!] : [])) as { state: string; count: number }[];
          for (const row of rows) {
            if (pending.has(row.state)) counts.pending += row.count;
            else if (row.state === "sending") counts.sending += row.count;
            else if (row.state === "failed") counts.failed += row.count;
            else if (row.state === "uncertain") counts.uncertain += row.count;
            else if (!finished.has(row.state)) counts.available = false;
          }
        } catch { counts.available = false; }
      }
      return counts;
    }),
  });
  return database.inTransaction ? read() : database.transaction(read).deferred();
}
