import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import {
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
} from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";
import {
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
  DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
} from "@/src/modules/platform/server/bootstrap/development-owner-seed-authorization";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";

const LOCAL_TOKEN = "a".repeat(43);
const TIMESTAMP = "2026-08-02T12:00:00.000Z";

export type PlatformRouteTestFoundation = Readonly<{
  root: string;
  databasePath: string;
  userId: string;
  workspaceId: string;
  accountId: string;
  accountSelectionRef: string;
}>;

export function createPlatformRouteTestFoundation(
  prefix: string,
): PlatformRouteTestFoundation {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const databasePath = join(root, "platform.sqlite");
  const userId = "10000000-0000-4000-8000-000000000001";
  const workspaceId = "10000000-0000-4000-8000-000000000002";
  const accountId = "10000000-0000-4000-8000-000000000003";
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    runPlatformMigrations(database, { now: () => new Date(TIMESTAMP) });
    new PlatformUserRepository(database, {
      allowedAuthProviders: [DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER],
    }).createUser({
      userId,
      authProvider: DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
      authSubject: DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
      displayName: "Development owner",
      createdAtUtc: TIMESTAMP,
      updatedAtUtc: TIMESTAMP,
    });
    new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
      workspaceId,
      ownerUserId: userId,
      displayName: "Development workspace",
      defaultTradingTimezone: "America/New_York",
      createdAtUtc: TIMESTAMP,
    });
    new JournalAccountRepository(database).createAccount({
      accountId,
      workspaceId,
      displayName: "Primary Journal",
      baseCurrency: "USD",
      tradingTimezone: "America/New_York",
      status: "active",
      createdByUserId: userId,
      createdAtUtc: TIMESTAMP,
      updatedAtUtc: TIMESTAMP,
    });
  } finally {
    database.close();
  }
  return Object.freeze({
    root,
    databasePath,
    userId,
    workspaceId,
    accountId,
    accountSelectionRef: deriveJournalAccountSelectionRef(
      workspaceId,
      accountId,
    ),
  });
}

export function installPlatformRouteTestEnvironment(
  databasePath: string,
  overrides: Readonly<Record<string, string | undefined>> = {},
): () => void {
  const values: Readonly<Record<string, string | undefined>> = {
    NODE_ENV: "development",
    VERCEL_ENV: undefined,
    TRADERLINK_PLATFORM_DB_PATH: databasePath,
    [TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV]: "true",
    [TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV]: "1",
    [TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV]: LOCAL_TOKEN,
    ...overrides,
  };
  const original = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

export function createPlatformRouteTestRequest(
  path: string,
  init: RequestInit = {},
): Request {
  const url = new URL(path, "http://127.0.0.1:3010");
  const headers = new Headers(init.headers);
  headers.set("host", "127.0.0.1:3010");
  headers.set(TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER, LOCAL_TOKEN);
  headers.set("x-forwarded-host", "127.0.0.1:3010");
  headers.set("x-forwarded-for", "127.0.0.1");
  headers.set("x-forwarded-proto", "http");
  headers.set("x-forwarded-port", "3010");
  if (!["GET", "HEAD", "OPTIONS"].includes((init.method ?? "GET").toUpperCase())) {
    headers.set("origin", url.origin);
  }
  return new Request(url, { ...init, headers });
}
