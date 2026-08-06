import "server-only";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { platformFailure } from "../database/platform-migration-contract";
import {
  decryptMoomooCredentials,
  encryptMoomooCredentials,
  loadMoomooCredentialKeyConfiguration,
} from "./moomoo-connection-credentials";
import { MoomooConnectionRepository } from "./moomoo-connection-repository";
import { getMoomooOAuthConfig, refreshMoomooAccessToken } from "./moomoo-oauth";

const REFRESH_BEFORE_EXPIRY_MILLISECONDS = 60_000;

export class MoomooConnectionAccessService {
  constructor(
    private readonly repository: MoomooConnectionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async accessToken(scope: WorkspaceAccessScope): Promise<string> {
    const connection = this.repository.find(scope);
    if (!connection || connection.state !== "active") {
      platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
    }
    const credentials = decryptMoomooCredentials({
      configuration: loadMoomooCredentialKeyConfiguration(),
      encrypted: connection.encrypted,
    });
    const now = this.now();
    const expiresAt = Date.parse(connection.accessTokenExpiresAtUtc);
    if (Number.isFinite(expiresAt) && expiresAt - now.getTime() > REFRESH_BEFORE_EXPIRY_MILLISECONDS) {
      return credentials.accessToken;
    }
    const refreshed = await refreshMoomooAccessToken({
      clientId: getMoomooOAuthConfig("http://127.0.0.1:3010").clientId,
      refreshToken: credentials.refreshToken,
    });
    if (!refreshed) {
      this.repository.markReauthorizationRequired(scope, now.toISOString());
      platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID");
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
      accessTokenExpiresAtUtc: expiresAtUtc,
      authorizedScopes: refreshed.scopes,
      timestamp: now.toISOString(),
    });
    return refreshed.accessToken;
  }
}
