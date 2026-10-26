import "server-only";
import type Database from "better-sqlite3";
import type { WorkspaceAccessScope, WorkspaceRole } from "../../contracts/workspace-access-scope";
import { MoomooConnectionAccessService } from "./moomoo-connection-access-service";
import { MoomooConnectionRepository } from "./moomoo-connection-repository";

type Due = { connection_id: string; user_id: string; workspace_id: string; role: WorkspaceRole; connection_state: string };
/** Cursor makes repeated transient failures unable to starve later connections.
 * Expiry/state predicates bound reads to attention candidates, never trade history.
 * No DB transaction is held across the provider request. */
export async function runMoomooConnectionMonitor(db: Database.Database, input: {
  after: string; now: Date; limit?: number;
  accessToken?: (scope: WorkspaceAccessScope) => Promise<string>;
}): Promise<{ after: string; checked: number; unavailable: number }> {
  const limit = input.limit ?? 5;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10) throw new Error("Invalid Moomoo monitor limit.");
  const rows = db.prepare(`SELECT c.connection_id,c.user_id,c.workspace_id,m.role,c.connection_state
    FROM platform_broker_connections c
    JOIN platform_users u ON u.user_id=c.user_id AND u.status='active'
    JOIN platform_workspaces w ON w.workspace_id=c.workspace_id AND w.status='active'
    JOIN platform_workspace_memberships m ON m.user_id=c.user_id AND m.workspace_id=c.workspace_id AND m.status='active'
    WHERE c.provider='moomoo' AND c.connection_id>?
      AND (c.connection_state='reauthorization_required' OR
        (c.connection_state='active' AND c.access_token_expires_at_utc<=?))
    ORDER BY c.connection_id LIMIT ?`).all(input.after,
      new Date(input.now.getTime() + 60_000).toISOString(), limit) as Due[];
  const repository = new MoomooConnectionRepository(db);
  // input.now is only a due-selection snapshot. Token validity must continue
  // advancing during provider awaits and across sequential rows in this batch.
  const access = input.accessToken ?? (scope => new MoomooConnectionAccessService(repository).accessToken(scope));
  let unavailable = 0;
  for (const row of rows) {
    const scope: WorkspaceAccessScope = { userId: row.user_id, workspaceId: row.workspace_id,
      workspaceRole: row.role, allowedAccountIds: [], activeAccountId: null };
    try {
      if (row.connection_state === "active") await access(scope);
      repository.reconcileAttentionAlert(scope);
    } catch { unavailable++; }
  }
  return { after: rows.length === limit ? rows.at(-1)!.connection_id : "", checked: rows.length, unavailable };
}
