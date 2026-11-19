import type Database from "better-sqlite3";
import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

export type SharedAlertDatabaseAccess = <T>(operation: (database: Database.Database) => T) => T;
type RateLimit = Readonly<{ seconds: number; global: boolean }>;

export async function sharedAlertRateLimit(response: Response): Promise<RateLimit> {
  const header = Number(response.headers.get("Retry-After"));
  let seconds = Number.isFinite(header) && header > 0 ? header : 0;
  let global = response.headers.get("X-RateLimit-Global") === "true" || response.headers.get("X-RateLimit-Scope") === "global";
  try {
    const body = await response.json() as { retry_after?: unknown; global?: unknown };
    if (typeof body.retry_after === "number" && Number.isFinite(body.retry_after) && body.retry_after > 0) seconds = Math.max(seconds, body.retry_after);
    global ||= body.global === true;
  } catch { /* A response-header deadline remains authoritative. */ }
  return { seconds: seconds || 60, global };
}

export class SharedAlertRateLimits {
  constructor(private readonly database: Database.Database, private readonly now: () => string = createCanonicalUtcTimestamp) {}

  current(channelId?: string): RateLimit | null {
    const at = this.now();
    const row = this.database.prepare(`SELECT scope,retry_at_utc FROM community_shared_alert_rate_limits WHERE retry_at_utc>@now
      AND ((scope='global' AND scope_id='*') OR (scope='channel' AND scope_id=@channel)) ORDER BY retry_at_utc DESC LIMIT 1`)
      .get({ now: at, channel: channelId ?? "" }) as { scope: string; retry_at_utc: string } | undefined;
    return row ? { seconds: Math.max(0.001, (Date.parse(row.retry_at_utc) - Date.parse(at)) / 1000), global: row.scope === "global" } : null;
  }

  record(limit: RateLimit, channelId?: string): string {
    const retryAt = limit.seconds <= 7 * 86400 ? new Date(Date.parse(this.now()) + limit.seconds * 1000).toISOString() : "9999-12-31T23:59:59.999Z";
    // An unclassified guild/member route is held conservatively across this
    // bot, matching the existing worker's conservative verification cooldown.
    const global = limit.global || !channelId;
    this.database.prepare(`INSERT INTO community_shared_alert_rate_limits(scope,scope_id,retry_at_utc) VALUES(?,?,?)
      ON CONFLICT(scope,scope_id) DO UPDATE SET retry_at_utc=max(retry_at_utc,excluded.retry_at_utc)`)
      .run(global ? "global" : "channel", global ? "*" : channelId, retryAt);
    return retryAt;
  }
}

/** Wrap the existing request function; never replace its transport or clock. */
export function sharedAlertAwareDiscordRequest(request: typeof fetch, access: SharedAlertDatabaseAccess, now: () => string = createCanonicalUtcTimestamp): typeof fetch {
  return async (input, init) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw);
    if (url.origin !== "https://discord.com" || !url.pathname.startsWith("/api/")) return request(input, init);
    const channelId = /^\/api\/(?:v\d+\/)?channels\/(\d+)(?:\/|$)/u.exec(url.pathname)?.[1];
    const current = access(database => new SharedAlertRateLimits(database, now).current(channelId));
    if (current) return Response.json({ retry_after: current.seconds, global: current.global }, { status: 429, headers: { "Retry-After": String(current.seconds), "X-RateLimit-Scope": current.global ? "global" : "user" } });
    const response = await request(input, init);
    if (response.status === 429) {
      const limit = await sharedAlertRateLimit(response.clone());
      access(database => new SharedAlertRateLimits(database, now).record(limit, channelId));
    } else if (channelId && response.headers.get("X-RateLimit-Remaining") === "0") {
      const seconds = Number(response.headers.get("X-RateLimit-Reset-After"));
      if (Number.isFinite(seconds) && seconds > 0) access(database => new SharedAlertRateLimits(database, now).record({ seconds, global: false }, channelId));
    }
    return response;
  };
}
