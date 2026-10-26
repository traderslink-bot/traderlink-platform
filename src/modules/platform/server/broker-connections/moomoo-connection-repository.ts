import "server-only";
import { assertMembershipFeature } from "../membership/platform-membership-access";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";
import { reconcileMoomooConnectionAlert } from "./moomoo-connection-alerts";
import type { EncryptedMoomooCredentials } from "./moomoo-connection-credentials";

export type MoomooConnectionRecord = Readonly<{
  connectionId: string;
  state: "active" | "reauthorization_required" | "revoked";
  encrypted: EncryptedMoomooCredentials;
  accessTokenExpiresAtUtc: string;
  authorizedScopes: readonly string[];
  connectedAtUtc: string;
  updatedAtUtc: string;
}>;

type Row = Readonly<{
  connection_id: string; connection_state: MoomooConnectionRecord["state"];
  credential_key_version: string; credential_initialization_vector: string;
  credential_ciphertext: string; credential_authentication_tag: string;
  access_token_expires_at_utc: string; authorized_scopes: string;
  connected_at_utc: string; updated_at_utc: string;
}>;

function map(row: Row): MoomooConnectionRecord {
  let scopes: unknown;
  try { scopes = JSON.parse(row.authorized_scopes); } catch { platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID"); }
  if (!Array.isArray(scopes) || scopes.some((scope) => typeof scope !== "string")) platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
  return Object.freeze({
    connectionId: row.connection_id, state: row.connection_state,
    encrypted: Object.freeze({ keyVersion: row.credential_key_version, initializationVector: row.credential_initialization_vector, ciphertext: row.credential_ciphertext, authenticationTag: row.credential_authentication_tag }),
    accessTokenExpiresAtUtc: row.access_token_expires_at_utc,
    authorizedScopes: Object.freeze([...scopes]), connectedAtUtc: row.connected_at_utc, updatedAtUtc: row.updated_at_utc,
  });
}

export class MoomooConnectionRepository {
  constructor(private readonly database: Database.Database) {}

  private recordAttempt(scope: WorkspaceAccessScope, input: Readonly<{
    connectionId: string | null;
    channel: "authorization" | "reauthorization";
    outcome: "connected" | "failed" | "cancelled";
    safeReasonCategory: string | null;
    timestamp: string;
  }>): string {
    assertCanonicalUuidV4(scope.userId, "userId");
    assertCanonicalUuidV4(scope.workspaceId, "workspaceId");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    if (input.connectionId !== null) assertCanonicalUuidV4(input.connectionId, "connectionId");
    if ((input.outcome === "failed") !== (input.safeReasonCategory !== null)
      || (input.safeReasonCategory !== null && !/^[a-z][a-z0-9_-]{0,63}$/u.test(input.safeReasonCategory))) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
    }
    const attemptId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO platform_broker_connection_attempts (
      connection_attempt_id, user_id, workspace_id, provider, connection_id,
      attempt_channel, outcome, safe_reason_category, occurred_at_utc
    ) VALUES (?, ?, ?, 'moomoo', ?, ?, ?, ?, ?)`).run(
      attemptId, scope.userId, scope.workspaceId, input.connectionId,
      input.channel, input.outcome, input.safeReasonCategory, input.timestamp,
    );
    return attemptId;
  }

  find(scope: WorkspaceAccessScope): MoomooConnectionRecord | null {
    const row = this.database.prepare<[string, string], Row>(`SELECT connection_id, connection_state, credential_key_version, credential_initialization_vector, credential_ciphertext, credential_authentication_tag, access_token_expires_at_utc, authorized_scopes, connected_at_utc, updated_at_utc FROM platform_broker_connections WHERE user_id = ? AND workspace_id = ? AND provider = 'moomoo'`).get(scope.userId, scope.workspaceId);
    return row ? map(row) : null;
  }

  /** Preserve saved connections on downgrade. The oldest connected rows occupy
   * the available slots; a revoked row no longer occupies one. */
  assertAuthorizationAllowed(scope: Pick<WorkspaceAccessScope,"userId"|"workspaceId">): void {
    assertCanonicalUuidV4(scope.userId, "userId");
    assertCanonicalUuidV4(scope.workspaceId, "workspaceId");
    const rows = this.database.prepare("SELECT connection_id,workspace_id,provider FROM platform_broker_connections WHERE user_id=? AND connection_state<>'revoked' ORDER BY connected_at_utc,connection_id")
      .all(scope.userId) as {connection_id:string;workspace_id:string;provider:string}[];
    const position=rows.findIndex(row=>row.workspace_id===scope.workspaceId && row.provider==='moomoo');
    assertMembershipFeature(this.database,scope.userId,"broker.connections",position<0?rows.length+1:position+1);
  }

  assertAccessAllowed(scope: WorkspaceAccessScope): void {
    this.assertAuthorizationAllowed(scope);
    const connection=this.find(scope);
    if (!connection || connection.state!=='active') platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
  }

  saveAuthorized(scope: WorkspaceAccessScope, input: Readonly<{
    encrypted: EncryptedMoomooCredentials; accessTokenExpiresAtUtc: string;
    authorizedScopes: readonly string[]; timestamp: string; expectedCredentialCiphertext?: string;
  }>): MoomooConnectionRecord {
    if (!this.database.inTransaction) return this.database.transaction(() => this.saveAuthorized(scope, input)).immediate();
    assertCanonicalUuidV4(scope.userId, "userId"); assertCanonicalUuidV4(scope.workspaceId, "workspaceId");
    assertCanonicalUtcTimestamp(input.accessTokenExpiresAtUtc, "accessTokenExpiresAtUtc"); assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    if (input.authorizedScopes.length === 0 || input.authorizedScopes.some((scope) => !/^[a-z][a-z0-9:_*-]{0,127}$/u.test(scope))) platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
    const current = this.find(scope);
    if (input.expectedCredentialCiphertext !== undefined &&
      (!current || current.state !== "active" || current.encrypted.ciphertext !== input.expectedCredentialCiphertext)) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
    }
    this.assertAuthorizationAllowed(scope);
    const connectionId = current?.connectionId ?? createCanonicalUuidV4();
    const connectedAtUtc = current?.connectedAtUtc ?? input.timestamp;
    this.database.prepare(`INSERT INTO platform_broker_connections (connection_id, user_id, workspace_id, provider, connection_state, credential_key_version, credential_initialization_vector, credential_ciphertext, credential_authentication_tag, access_token_expires_at_utc, authorized_scopes, connected_at_utc, updated_at_utc, revoked_at_utc) VALUES (?, ?, ?, 'moomoo', 'active', ?, ?, ?, ?, ?, ?, ?, ?, NULL) ON CONFLICT(user_id, workspace_id, provider) DO UPDATE SET connection_state = 'active', credential_key_version = excluded.credential_key_version, credential_initialization_vector = excluded.credential_initialization_vector, credential_ciphertext = excluded.credential_ciphertext, credential_authentication_tag = excluded.credential_authentication_tag, access_token_expires_at_utc = excluded.access_token_expires_at_utc, authorized_scopes = excluded.authorized_scopes, updated_at_utc = excluded.updated_at_utc, revoked_at_utc = NULL`).run(connectionId, scope.userId, scope.workspaceId, input.encrypted.keyVersion, input.encrypted.initializationVector, input.encrypted.ciphertext, input.encrypted.authenticationTag, input.accessTokenExpiresAtUtc, JSON.stringify([...new Set(input.authorizedScopes)].sort()), connectedAtUtc, input.timestamp);
    const saved = this.find(scope);
    if (!saved) platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
    if (input.expectedCredentialCiphertext === undefined) this.recordAttempt(scope, {
      connectionId: saved.connectionId,
      channel: current ? "reauthorization" : "authorization",
      outcome: "connected",
      safeReasonCategory: null,
      timestamp: input.timestamp,
    });
    return saved;
  }

  markReauthorizationRequired(scope: WorkspaceAccessScope, timestamp: string, expectedCredentialCiphertext?: string): void {
    assertCanonicalUtcTimestamp(timestamp, "timestamp");
    const transition = () => {
      const current = this.find(scope);
      if (current?.state === "reauthorization_required") return;
      if (!current || current.state !== "active" ||
        (expectedCredentialCiphertext !== undefined && current.encrypted.ciphertext !== expectedCredentialCiphertext)) {
        platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
      }
      const result = this.database.prepare(`UPDATE platform_broker_connections
SET connection_state = 'reauthorization_required', updated_at_utc = ?
WHERE user_id = ? AND workspace_id = ? AND provider = 'moomoo'
  AND connection_state = 'active'`).run(timestamp, scope.userId, scope.workspaceId);
      if (result.changes !== 1) {
        platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
      }
      const episodeId = this.recordAttempt(scope, {
        connectionId: current.connectionId,
        channel: "reauthorization",
        outcome: "failed",
        safeReasonCategory: "refresh_required",
        timestamp,
      });
      reconcileMoomooConnectionAlert(this.database, {
        scope, connectionId: current.connectionId, episodeId, occurredAtUtc: timestamp,
      });
    };
    if (this.database.inTransaction) {
      transition();
    } else {
      this.database.transaction(transition).immediate();
    }
  }

  reconcileAttentionAlert(scope: WorkspaceAccessScope): void {
    const current = this.find(scope);
    if (current?.state !== "reauthorization_required") return;
    const attempt = this.database.prepare(`SELECT connection_attempt_id,occurred_at_utc
      FROM platform_broker_connection_attempts WHERE connection_id=? AND user_id=? AND workspace_id=?
      AND outcome='failed' AND safe_reason_category='refresh_required'
      ORDER BY rowid DESC LIMIT 1`)
      .get(current.connectionId, scope.userId, scope.workspaceId) as { connection_attempt_id: string; occurred_at_utc: string } | undefined;
    if (attempt) this.database.transaction(() => reconcileMoomooConnectionAlert(this.database, { scope,
      connectionId: current.connectionId, episodeId: attempt.connection_attempt_id,
      occurredAtUtc: attempt.occurred_at_utc })).immediate();
  }

  recordAuthorizationFailure(scope: WorkspaceAccessScope, input: Readonly<{
    safeReasonCategory: "authorization_denied" | "authorization_unavailable";
    timestamp: string;
  }>): void {
    this.recordAttempt(scope, {
      connectionId: null,
      channel: "authorization",
      outcome: "failed",
      safeReasonCategory: input.safeReasonCategory,
      timestamp: input.timestamp,
    });
  }

  revoke(scope: WorkspaceAccessScope, input: Readonly<{
    encrypted: EncryptedMoomooCredentials;
    timestamp: string;
  }>): void {
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    const result = this.database.prepare(`UPDATE platform_broker_connections
SET connection_state = 'revoked', credential_key_version = ?,
  credential_initialization_vector = ?, credential_ciphertext = ?,
  credential_authentication_tag = ?, access_token_expires_at_utc = ?,
  authorized_scopes = '[]', updated_at_utc = ?, revoked_at_utc = ?
WHERE user_id = ? AND workspace_id = ? AND provider = 'moomoo'
  AND connection_state <> 'revoked'`).run(
      input.encrypted.keyVersion,
      input.encrypted.initializationVector,
      input.encrypted.ciphertext,
      input.encrypted.authenticationTag,
      input.timestamp,
      input.timestamp,
      input.timestamp,
      scope.userId,
      scope.workspaceId,
    );
    if (result.changes !== 1) platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
  }
}
