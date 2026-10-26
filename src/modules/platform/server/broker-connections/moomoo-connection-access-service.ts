import "server-only";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { platformFailure } from "../database/platform-migration-contract";
import {
  decryptMoomooCredentials,
  encryptMoomooCredentials,
  loadMoomooCredentialKeyConfiguration,
} from "./moomoo-connection-credentials";
import { MoomooConnectionRepository, type MoomooConnectionRecord } from "./moomoo-connection-repository";
import { getMoomooOAuthConfig, refreshMoomooAccessToken } from "./moomoo-oauth";

const REFRESH_BEFORE_EXPIRY_MILLISECONDS = 60_000;
// One hosted writer/process. Share concurrent refreshes across request/service
// instances, while ciphertext revision separates an explicit reconnect.
const refreshes = new Map<string, Promise<string>>();
const retryAfter = new Map<string, number>();
const TRANSIENT_RETRY_MILLISECONDS = 60_000;

export class MoomooConnectionAccessService {
  constructor(
    private readonly repository: MoomooConnectionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async accessToken(scope: WorkspaceAccessScope): Promise<string> {
    this.repository.assertAccessAllowed(scope);
    const connection = this.repository.find(scope);
    if (!connection || connection.state !== "active") {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
    }
    const key = `${connection.connectionId}:${connection.encrypted.ciphertext}`;
    const existing = refreshes.get(key);
    if (existing) return existing;
    const pending = this.readOrRefresh(scope, connection);
    refreshes.set(key, pending);
    try { return await pending; }
    finally { if (refreshes.get(key) === pending) refreshes.delete(key); }
  }

  private async readOrRefresh(scope: WorkspaceAccessScope, connection: MoomooConnectionRecord): Promise<string> {
    const credentials = decryptMoomooCredentials({
      configuration: loadMoomooCredentialKeyConfiguration(),
      encrypted: connection.encrypted,
    });
    const now = this.now();
    const expiresAt = Date.parse(connection.accessTokenExpiresAtUtc);
    if (Number.isFinite(expiresAt) && expiresAt - now.getTime() > REFRESH_BEFORE_EXPIRY_MILLISECONDS) {
      return credentials.accessToken;
    }
    const retryKey = `${connection.connectionId}:${connection.encrypted.ciphertext}`;
    for (const [key, until] of retryAfter) if (until <= now.getTime()) retryAfter.delete(key);
    if ((retryAfter.get(retryKey) ?? 0) > now.getTime()) {
      if (expiresAt > now.getTime()) return credentials.accessToken;
      throw new Error("Moomoo is temporarily unavailable. Please try again.");
    }
    const refreshed = await refreshMoomooAccessToken({
      clientId: getMoomooOAuthConfig("http://127.0.0.1:3010").clientId,
      refreshToken: credentials.refreshToken,
    });
    // The request can consume the token's remaining lifetime. Re-read the
    // clock after await before considering fallback or setting retry deadlines.
    const completedAt = this.now();
    if (refreshed.status === "reauthorization_required") {
      this.repository.markReauthorizationRequired(scope, completedAt.toISOString(), connection.encrypted.ciphertext);
      platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID");
    }
    if (refreshed.status === "unavailable") {
      // Bound both scheduled and sequential on-demand retries during outages.
      if (retryAfter.size >= 1000) retryAfter.delete(retryAfter.keys().next().value!);
      retryAfter.set(retryKey, completedAt.getTime() + TRANSIENT_RETRY_MILLISECONDS);
      // A temporary outage is not evidence of revoked consent. Keep credentials
      // and connection state; a later request/monitor pass can retry safely.
      if (expiresAt > completedAt.getTime()) return credentials.accessToken;
      throw new Error("Moomoo is temporarily unavailable. Please try again.");
    }
    const expiresAtUtc = new Date(now.getTime() + refreshed.expiresInSeconds * 1000).toISOString();
    this.repository.saveAuthorized(scope, {
      encrypted: encryptMoomooCredentials({
        configuration: loadMoomooCredentialKeyConfiguration(),
        credentials: Object.freeze({
          accessToken: refreshed.accessToken,
          refreshToken: credentials.refreshToken,
        }),
      }),
      expectedCredentialCiphertext: connection.encrypted.ciphertext,
      accessTokenExpiresAtUtc: expiresAtUtc,
      authorizedScopes: refreshed.scopes,
      timestamp: completedAt.toISOString(),
    });
    return refreshed.accessToken;
  }

  async executionAccessToken(scope: WorkspaceAccessScope): Promise<string> {
    const connection = this.repository.find(scope);
    if (
      !connection || connection.state !== "active" ||
      !connection.authorizedScopes.includes("trade:read")
    ) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
        stage: "trade_scope",
      });
    }
    const accessToken = await this.accessToken(scope);
    const refreshed = this.repository.find(scope);
    if (!refreshed?.authorizedScopes.includes("trade:read")) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
        stage: "trade_scope_after_refresh",
      });
    }
    return accessToken;
  }
}
