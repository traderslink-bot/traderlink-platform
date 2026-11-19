import {openPristinePlatformTestDatabase,setPlatformTestFixtureMigrationTime} from '@/src/test/pristine-platform-test-database';
import { removePlatformDatabaseTestFixture } from "@/src/test/platform-database-fixture";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

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
const foundationBaselines = new WeakMap<Database.Database, Record<string, number>>();

afterEach(async () => {
  for (const root of roots.splice(0)) await removePlatformDatabaseTestFixture(root);
  vi.restoreAllMocks();
}, 20_000);

function setup(): Database.Database {
  const root = mkdtempSync(join(tmpdir(), "traderlink-development-owner-seed-"));
  roots.push(root);
  const database = openPristinePlatformTestDatabase({
    mode: "initializer",
    databasePath: join(root, "seed.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  setPlatformTestFixtureMigrationTime(database, () => new Date("2026-08-01T13:00:00.000Z"));
  foundationBaselines.set(database, counts(database));
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

describe("development owner seed", { timeout: 30_000 }, () => {
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
      expect(counts(database)).toEqual(foundationBaselines.get(database));
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
      expect(counts(database).platform_users).toBe(foundationBaselines.get(database)!.platform_users + 1);
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
        expect(counts(database)).toEqual(foundationBaselines.get(database));
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
      expect(counts(database)).toEqual(foundationBaselines.get(database));
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
      expect(counts(rollback)).toEqual(foundationBaselines.get(rollback));
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


function ensureRetainedFixture(database:Database.Database) {
  const inserted=database.prepare("INSERT OR IGNORE INTO platform_users VALUES('00000000-0000-4000-8000-000000000195','erasure','paid-partner-retained-principal-v1','Removed Partner owner','disabled','2026-11-02T00:00:00.000Z','2026-11-02T00:00:00.000Z')").run();
  if(inserted.changes) database.prepare("DELETE FROM platform_user_preferences WHERE user_id='00000000-0000-4000-8000-000000000195'").run();
}

describe("reserved retained principal is never a human foundation bypass", { timeout: 30_000 }, () => {
  it("preserves the exact internal row while creating one genuine owner",()=>{
    const database=setup();try{
      ensureRetainedFixture(database);
      const read=()=>database.prepare("SELECT * FROM platform_users WHERE user_id='00000000-0000-4000-8000-000000000195'").get();const before=read();
      expect(before).toEqual({user_id:'00000000-0000-4000-8000-000000000195',auth_provider:'erasure',auth_subject:'paid-partner-retained-principal-v1',display_name:'Removed Partner owner',status:'disabled',created_at_utc:'2026-11-02T00:00:00.000Z',updated_at_utc:'2026-11-02T00:00:00.000Z'});
      confirm(database);expect(read()).toEqual(before);expect(counts(database).platform_users).toBe(2);
      expect(database.prepare("SELECT count(*) FROM platform_auth_identities WHERE user_id='00000000-0000-4000-8000-000000000195'").pluck().get()).toBe(0);
    }finally{database.close();}
  });
  it("refuses other mutated fields, human preferences and unknown disabled actors",()=>{
    const database=setup();try{
      ensureRetainedFixture(database);
      const mutations=[
        "UPDATE platform_users SET auth_provider='unknown' WHERE user_id='00000000-0000-4000-8000-000000000195'",
        "UPDATE platform_users SET auth_subject='unknown' WHERE user_id='00000000-0000-4000-8000-000000000195'",
        "UPDATE platform_users SET created_at_utc='2026-11-01T00:00:00.000Z' WHERE user_id='00000000-0000-4000-8000-000000000195'",
        "UPDATE platform_users SET updated_at_utc='2026-11-03T00:00:00.000Z' WHERE user_id='00000000-0000-4000-8000-000000000195'",
        "INSERT INTO platform_user_preferences(user_id,reporting_currency,updated_at_utc) VALUES('00000000-0000-4000-8000-000000000195','USD','2026-11-02T00:00:00.000Z')",
        "INSERT INTO platform_users VALUES('00000000-0000-4000-8000-000000000196','erasure','unknown','Removed Partner owner','disabled','2026-11-02T00:00:00.000Z','2026-11-02T00:00:00.000Z')",
      ];
      for(const sql of mutations){
        database.exec('SAVEPOINT reserved_negative');
        try {database.exec(sql);expect(()=>previewDevelopmentOwnerSeed({database,authorization,confirmationAuthority:authority(),facts})).toThrowError('TRADERLINK_DEVELOPMENT_OWNER_SEED_ALREADY_COMPLETED');}
        finally {database.exec('ROLLBACK TO reserved_negative; RELEASE reserved_negative');}
      }
    }finally{database.close();}
  });
  it.each([
    ["active reserved principal", "UPDATE platform_users SET status='active' WHERE user_id='00000000-0000-4000-8000-000000000195'"],
    ["renamed reserved principal", "UPDATE platform_users SET display_name='Unknown actor' WHERE user_id='00000000-0000-4000-8000-000000000195'"],
    ["human authentication on reserved principal", "INSERT INTO platform_auth_identities(user_id,auth_provider,auth_subject,status,linked_by_user_id,created_at_utc,updated_at_utc) VALUES('00000000-0000-4000-8000-000000000195','discord','999999999999999991','active','00000000-0000-4000-8000-000000000195','2026-11-02T00:00:00.000Z','2026-11-02T00:00:00.000Z')"],
  ])("refuses %s", (_label, sql) => {
    const database=setup();
    try {
      ensureRetainedFixture(database);
      database.exec(sql);
      expect(()=>previewDevelopmentOwnerSeed({database,authorization,confirmationAuthority:authority(),facts})).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_ALREADY_COMPLETED");
    } finally {database.close();}
  });
});
