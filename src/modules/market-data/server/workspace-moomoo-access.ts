import "server-only";

import { createHash } from "node:crypto";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { requireTraderLinkPlatformRequestIdentity, type TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { isMoomooMarketDataReady } from "@/src/modules/level-analysis/server/moomoo-market-data-access";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { canOpenBrokerWorkspace } from "./market-tools-dashboard-access";
import { requestAuthorizedMoomooMarketData, type MoomooDataRequest } from "./moomoo-bridge";
import { readWorkspaceMarketSettings } from "./workspace-market-settings-store";
import type { WorkspaceMarketSettings } from "../workspace-market-settings";

function activeConnectionGeneration(repository: MoomooConnectionRepository, scope: WorkspaceAccessScope): string | null {
  const saved = repository.find(scope);
  if (!saved || !isMoomooMarketDataReady(saved)) return null;
  const authorization = repository.latestAuthorizationId(scope, saved.connectionId);
  return createHash("sha256").update(JSON.stringify([scope.userId, scope.workspaceId, saved.connectionId, authorization])).digest("hex");
}

function readConnectionGeneration(scope: WorkspaceAccessScope, environment: NodeJS.ProcessEnv): string | null {
  return withReadonlyPlatformDatabase({ environment }, database => activeConnectionGeneration(new MoomooConnectionRepository(database), scope));
}

const processState = globalThis as typeof globalThis & { traderlinkWorkspaceMoomooCredentialReads?: Map<string, Promise<string>> };
const tokenReads = processState.traderlinkWorkspaceMoomooCredentialReads ??= new Map();

function scopedAccessToken(scope: WorkspaceAccessScope, generation: string, environment: NodeJS.ProcessEnv): Promise<string> {
  const path = resolvePlatformDatabaseConfig({ environment }).databasePath;
  const key = JSON.stringify([path, scope.userId, scope.workspaceId, generation]);
  const inProgress = tokenReads.get(key);
  if (inProgress) return inProgress;
  const pending = (async () => {
    const database = openPlatformDatabase({ mode: "runtime", environment });
    try {
      const repository = new MoomooConnectionRepository(database);
      if (activeConnectionGeneration(repository, scope) !== generation) throw Error("broker_connection_changed");
      const token = await new MoomooConnectionAccessService(repository).accessToken(scope);
      if (activeConnectionGeneration(repository, scope) !== generation) throw Error("broker_connection_changed");
      return token;
    } finally {
      database.close();
    }
  })().finally(() => tokenReads.delete(key));
  tokenReads.set(key, pending);
  return pending;
}

export type WorkspaceMoomooConnection = Readonly<{
  generation: string;
  current(force?: boolean): boolean;
  accessToken(): Promise<string>;
  request(input: MoomooDataRequest, signal?: AbortSignal): Promise<Record<string, unknown>>;
}>;

export function workspaceMoomooAccessForIdentity(identity: TraderLinkPlatformRequestIdentity, environment: NodeJS.ProcessEnv = process.env,
  stillSignedIn: () => boolean = () => true): { identity: TraderLinkPlatformRequestIdentity; settings: WorkspaceMarketSettings; connection: WorkspaceMoomooConnection | null } | null {
  const settings = readWorkspaceMarketSettings(environment);
  if (!canOpenBrokerWorkspace(identity, settings, environment)) return null;
  const generation = readConnectionGeneration(identity.scope, environment);
  if (!generation) return { identity, settings, connection: null };
  let lastChecked = 0;
  let lastResult = false;
  const current = (force = false) => {
    const now = Date.now();
    if (!force && now >= lastChecked && now - lastChecked < 1000) return lastResult;
    lastChecked = now;
    try {
      const latestSettings = readWorkspaceMarketSettings(environment);
      const connection = stillSignedIn() && canOpenBrokerWorkspace(identity, latestSettings, environment)
        ? readConnectionGeneration(identity.scope, environment) : null;
      lastResult = connection === generation;
    } catch {
      lastResult = false;
    }
    return lastResult;
  };
  const accessToken = async () => {
    if (!current()) throw Error("broker_connection_changed");
    return scopedAccessToken(identity.scope, generation, environment);
  };
  return { identity, settings, connection: { generation, current, accessToken, async request(input, signal) {
    signal?.throwIfAborted();
    const token = await accessToken();
    const value = await requestAuthorizedMoomooMarketData(input, token, environment, signal);
    if (!current()) throw Error("broker_connection_changed");
    return value;
  } } };
}

export function readWorkspaceMoomooAccess(request: Request, environment: NodeJS.ProcessEnv = process.env) {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    return workspaceMoomooAccessForIdentity(identity, environment, () => {
      const current = requireTraderLinkPlatformRequestIdentity(request.headers);
      return current.scope.userId === identity.scope.userId && current.scope.workspaceId === identity.scope.workspaceId;
    });
  } catch {
    return null;
  }
}
