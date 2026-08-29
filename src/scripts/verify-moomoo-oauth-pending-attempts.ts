import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooOAuthPendingAttemptService } from "@/src/modules/platform/server/broker-connections/moomoo-oauth-pending-attempt-service";
import { platformMoomooOAuthPendingAttemptsMigration } from "@/src/modules/platform/server/database/migrations/0094_platform_moomoo_oauth_pending_attempts";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const WORKSPACE_A = "33333333-3333-4333-8333-333333333333";
const WORKSPACE_B = "44444444-4444-4444-8444-444444444444";
const SESSION_A = "55555555-5555-4555-8555-555555555555";
const SESSION_B = "66666666-6666-4666-8666-666666666666";

function scope(userId: string, workspaceId: string): WorkspaceAccessScope {
  return Object.freeze({
    userId,
    workspaceId,
    workspaceRole: "owner" as const,
    allowedAccountIds: Object.freeze([]),
    activeAccountId: null,
  });
}

function assertContract(condition: boolean, code: string): void {
  if (!condition) throw new Error(code);
}

const database = new Database(":memory:");
try {
  database.pragma("foreign_keys = ON");
  database.exec(`CREATE TABLE platform_users (user_id TEXT PRIMARY KEY) STRICT;
CREATE TABLE platform_workspaces (workspace_id TEXT PRIMARY KEY) STRICT;
CREATE TABLE platform_auth_sessions (session_id TEXT PRIMARY KEY) STRICT;`);
  database.prepare("INSERT INTO platform_users (user_id) VALUES (?), (?)").run(USER_A, USER_B);
  database.prepare("INSERT INTO platform_workspaces (workspace_id) VALUES (?), (?)").run(WORKSPACE_A, WORKSPACE_B);
  database.prepare("INSERT INTO platform_auth_sessions (session_id) VALUES (?), (?)").run(SESSION_A, SESSION_B);
  for (const statement of platformMoomooOAuthPendingAttemptsMigration.statements) {
    database.exec(statement);
  }

  let now = new Date("2026-08-29T16:00:00.000Z");
  const service = new MoomooOAuthPendingAttemptService(database, () => now);
  const scopeA = scope(USER_A, WORKSPACE_A);
  const first = service.prepare({
    scope: scopeA,
    platformSessionId: SESSION_A,
    cookieState: null,
    cookieVerifier: null,
  });
  const repeated = service.prepare({
    scope: scopeA,
    platformSessionId: SESSION_A,
    cookieState: first.state,
    cookieVerifier: first.verifier,
  });
  assertContract(first.outcome === "oauth_start_created", "oauth_pending_first_start_not_created");
  assertContract(repeated.outcome === "oauth_start_reused", "oauth_pending_repeat_not_reused");
  assertContract(
    repeated.state === first.state && repeated.verifier === first.verifier && repeated.challenge === first.challenge,
    "oauth_pending_repeat_material_changed",
  );
  const storedColumns = database.prepare("PRAGMA table_info(platform_moomoo_oauth_pending_attempts)").all() as
    ReadonlyArray<Readonly<{ name: string }>>;
  const storedAttempts = JSON.stringify(database.prepare("SELECT * FROM platform_moomoo_oauth_pending_attempts").all());
  assertContract(
    !storedColumns.some(({ name }) => name === "state" || name === "verifier") &&
      !storedAttempts.includes(first.state) && !storedAttempts.includes(first.verifier),
    "oauth_pending_private_material_persisted",
  );

  const differentSession = service.prepare({
    scope: scopeA,
    platformSessionId: SESSION_B,
    cookieState: first.state,
    cookieVerifier: first.verifier,
  });
  assertContract(differentSession.outcome === "oauth_start_created", "oauth_pending_cross_session_reused");
  assertContract(differentSession.state !== first.state, "oauth_pending_cross_session_state_reused");
  assertContract(!service.consume({
    scope: scope(USER_B, WORKSPACE_B),
    platformSessionId: SESSION_A,
    state: first.state,
  }), "oauth_pending_cross_identity_consumed");
  assertContract(service.consume({
    scope: scopeA,
    platformSessionId: SESSION_A,
    state: first.state,
  }), "oauth_pending_bound_callback_not_consumed");
  assertContract(!service.consume({
    scope: scopeA,
    platformSessionId: SESSION_A,
    state: first.state,
  }), "oauth_pending_callback_replay_consumed");

  now = new Date("2026-08-29T16:11:00.000Z");
  const afterExpiry = service.prepare({
    scope: scopeA,
    platformSessionId: SESSION_B,
    cookieState: differentSession.state,
    cookieVerifier: differentSession.verifier,
  });
  assertContract(afterExpiry.outcome === "oauth_start_created", "oauth_pending_expired_start_reused");
  const row = database.prepare(`SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN attempt_state = 'pending' THEN 1 ELSE 0 END) AS pending
FROM platform_moomoo_oauth_pending_attempts`).get() as Readonly<{ total: number; pending: number }>;
  assertContract(row.total === 1 && row.pending === 1, "oauth_pending_expired_cleanup_invalid");

  console.info(JSON.stringify({
    atomicSingleUseConsume: true,
    expiredAttemptsReplaced: true,
    privateOAuthMaterialPersisted: false,
    sameSessionStartReused: true,
    sessionAndIdentityIsolation: true,
  }));
} finally {
  database.close();
}
