import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import {
  authorizeDevelopmentOwnerSeed,
  type DevelopmentOwnerSeedAuthorization,
} from "./development-owner-seed-authorization";
import { createDevelopmentOwnerSeedConfirmationAuthority } from "./development-owner-seed-confirmation";
import {
  confirmDevelopmentOwnerSeed,
  DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION,
  type DevelopmentOwnerSeedFacts,
  previewDevelopmentOwnerSeed,
  verifyDevelopmentOwnerSeed,
} from "./seed-development-owner";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function setup(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-development-owner-seed-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "seed.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, {
    now: () => new Date("2026-08-01T13:00:00.000Z"),
  });
  return database;
}

const facts: DevelopmentOwnerSeedFacts = Object.freeze({
  userDisplayName: "TraderLink Owner",
  workspaceDisplayName: "My Workspace",
  defaultTradingTimezone: "America/New_York",
  baseCurrency: "USD",
  journalAccountDisplayName: "Primary Trading Account",
});

const authorization = authorizeDevelopmentOwnerSeed({
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED: "1",
  NODE_ENV: "development",
});

function authority(now = () => new Date("2026-08-01T14:00:00.000Z")) {
  return createDevelopmentOwnerSeedConfirmationAuthority({
    key: Buffer.alloc(32, 3),
    now,
    tokenTtlMs: 60_000,
    nonce: () => Buffer.alloc(24, 8),
  });
}

function counts(database: Database.Database): Record<string, number> {
  return Object.fromEntries(
    [
      "platform_users",
      "platform_workspaces",
      "platform_workspace_memberships",
      "journal_accounts",
      "journal_account_source_identities",
    ].map((tableName) => [
      tableName,
      database
        .prepare<[], { count: number }>(
          `SELECT COUNT(*) AS count FROM ${tableName}`,
        )
        .get()?.count ?? -1,
    ]),
  );
}

const ids = Object.freeze([
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
]);

function confirm(
  database: Database.Database,
  options: Readonly<{
    seedFacts?: DevelopmentOwnerSeedFacts;
    action?: string;
    confirmationAuthority?: ReturnType<typeof authority>;
    token?: string;
    createId?: () => string;
  }> = {},
) {
  const confirmationAuthority = options.confirmationAuthority ?? authority();
  const preview = previewDevelopmentOwnerSeed({
    database,
    authorization,
    confirmationAuthority,
    facts,
    now: () => new Date("2026-08-01T14:00:00.000Z"),
  });
  let index = 0;
  return confirmDevelopmentOwnerSeed({
    database,
    authorization,
    confirmationAuthority,
    facts: options.seedFacts ?? facts,
    confirmationAction: options.action ?? DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION,
    confirmationToken: options.token ?? preview.confirmation.token,
    now: () => new Date("2026-08-01T14:00:01.000Z"),
    createId: options.createId ?? (() => ids[index++]),
  });
}

describe("development owner seed", () => {
  it("previews without writing and atomically creates exactly the ownership rows", () => {
    const database = setup();
    try {
      const confirmationAuthority = authority();
      const preview = previewDevelopmentOwnerSeed({
        database,
        authorization,
        confirmationAuthority,
        facts,
        now: () => new Date("2026-08-01T14:00:00.000Z"),
      });
      expect(preview.proposedValues).toEqual(facts);
      expect(preview.internalIdentity).toEqual({
        authProvider: "development_local",
        authSubjectRedacted: true,
        temporaryUntilPublicAuthentication: true,
      });
      expect(counts(database)).toEqual({
        platform_users: 0,
        platform_workspaces: 0,
        platform_workspace_memberships: 0,
        journal_accounts: 0,
        journal_account_source_identities: 0,
      });
      let index = 0;
      const evidence = confirmDevelopmentOwnerSeed({
        database,
        authorization,
        confirmationAuthority,
        facts,
        confirmationAction: preview.confirmation.action,
        confirmationToken: preview.confirmation.token,
        now: () => new Date("2026-08-01T14:00:01.000Z"),
        createId: () => ids[index++],
      });
      expect(evidence.rowCounts).toEqual({
        platform_users: 1,
        platform_workspaces: 1,
        platform_workspace_memberships: 1,
        journal_accounts: 1,
        journal_account_source_identities: 0,
      });
      expect(JSON.stringify(evidence)).not.toContain(ids[0]);
      expect(JSON.stringify(evidence)).not.toContain("initial_owner");
    } finally {
      database.close();
    }
  });

  it("rejects a different action or changed facts without writing", () => {
    for (const variant of ["action", "facts"] as const) {
      const database = setup();
      try {
        expect(() =>
          confirm(database, {
            action: variant === "action" ? "wrong_action" : undefined,
            seedFacts:
              variant === "facts"
                ? { ...facts, workspaceDisplayName: "Changed Workspace" }
                : undefined,
          }),
        ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIRMATION_INVALID");
        expect(Object.values(counts(database))).toEqual([0, 0, 0, 0, 0]);
      } finally {
        database.close();
      }
    }
  });

  it("rejects expired confirmation and an unauthorized provider guard", () => {
    const database = setup();
    try {
      let nowMs = Date.parse("2026-08-01T14:00:00.000Z");
      const confirmationAuthority = authority(() => new Date(nowMs));
      const preview = previewDevelopmentOwnerSeed({
        database,
        authorization,
        confirmationAuthority,
        facts,
      });
      nowMs += 60_001;
      expect(() =>
        confirmDevelopmentOwnerSeed({
          database,
          authorization,
          confirmationAuthority,
          facts,
          confirmationAction: preview.confirmation.action,
          confirmationToken: preview.confirmation.token,
        }),
      ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIRMATION_INVALID");
      expect(() =>
        previewDevelopmentOwnerSeed({
          database,
          authorization: {
            mode: "discord",
            authorized: true,
          } as unknown as DevelopmentOwnerSeedAuthorization,
          confirmationAuthority: authority(),
          facts,
        }),
      ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED");
      expect(Object.values(counts(database))).toEqual([0, 0, 0, 0, 0]);
    } finally {
      database.close();
    }
  });

  it("rejects schema drift and rolls back a late storage failure", () => {
    const drifted = setup();
    try {
      drifted.exec("CREATE VIEW unexpected_owner_seed_view AS SELECT 1 AS value");
      expect(() =>
        previewDevelopmentOwnerSeed({
          database: drifted,
          authorization,
          confirmationAuthority: authority(),
          facts,
        }),
      ).toThrowError("TRADERLINK_PLATFORM_SCHEMA_MISMATCH");
    } finally {
      drifted.close();
    }

    const rollback = setup();
    try {
      let index = 0;
      expect(() =>
        confirm(rollback, {
          createId: () => (index++ < 2 ? ids[index - 1] : "not-a-uuid"),
        }),
      ).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(Object.values(counts(rollback))).toEqual([0, 0, 0, 0, 0]);
    } finally {
      rollback.close();
    }
  });

  it("rejects reruns and emits no operational or private-value logs", () => {
    const database = setup();
    const spies = [
      vi.spyOn(console, "error").mockImplementation(() => undefined),
      vi.spyOn(console, "info").mockImplementation(() => undefined),
      vi.spyOn(console, "log").mockImplementation(() => undefined),
      vi.spyOn(console, "warn").mockImplementation(() => undefined),
    ];
    try {
      confirm(database);
      expect(() =>
        previewDevelopmentOwnerSeed({
          database,
          authorization,
          confirmationAuthority: authority(),
          facts,
        }),
      ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_ALREADY_COMPLETED");
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      database.close();
    }
  });

  it("independently verifies the exact ownership relationships", () => {
    const database = setup();
    try {
      confirm(database);
      expect(
        verifyDevelopmentOwnerSeed({
          database,
          facts,
          now: () => new Date("2026-08-01T14:01:00.000Z"),
        }),
      ).toMatchObject({
        status: "development_owner_seed_verified",
        identifiersRedacted: true,
        rowCounts: {
          platform_users: 1,
          platform_workspaces: 1,
          platform_workspace_memberships: 1,
          journal_accounts: 1,
          journal_account_source_identities: 0,
        },
      });
      database.prepare("UPDATE platform_users SET display_name = ?").run("Wrong");
      expect(() => verifyDevelopmentOwnerSeed({ database, facts })).toThrowError(
        "TRADERLINK_DEVELOPMENT_OWNER_SEED_FAILED",
      );
    } finally {
      database.close();
    }
  });
});
