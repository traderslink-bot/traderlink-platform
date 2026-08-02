import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";

import {
  type AccountIdentityConfiguration,
  calculateSourceAccountFingerprint,
  JournalAccountService,
} from "./journal-account-service";
import {
  type JournalAccountSourceIdentityRecord,
  JournalAccountRepository,
  type SourceIdentityFingerprintTuple,
} from "./journal-account-repository";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const oldKey = Buffer.alloc(32, 1);
const newKey = Buffer.alloc(32, 2);
const canonicalizers = { "ibkr-source-account-v1": (value: string) => value.trim().toUpperCase() };
const rotatedCanonicalizers = {
  ...canonicalizers,
  "ibkr-source-account-v2": (value: string) =>
    value.trim().replace(/\s+/gu, "").toUpperCase(),
};

function identityConfig(active: "old-key" | "new-key", includeOld = true): AccountIdentityConfiguration {
  return {
    activeKeyVersion: active,
    keysBase64: {
      ...(includeOld ? { "old-key": oldKey.toString("base64") } : {}),
      "new-key": newKey.toString("base64"),
    },
    activeCanonicalizationVersion: "ibkr-source-account-v1",
    canonicalizers,
  };
}

function setup(): {
  database: Database.Database;
  repository: JournalAccountRepository;
  scope: WorkspaceAccessScope;
  accountId: string;
} {
  const root = mkdtempSync(join(tmpdir(), "traderlink-fingerprint-rotation-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "identities.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  const users = new PlatformUserRepository(database, { allowedAuthProviders: ["test"] });
  const workspaces = new PlatformWorkspaceRepository(database);
  const repository = new JournalAccountRepository(database);
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const now = "2026-08-01T12:00:00.000Z";
  users.createUser({
    userId,
    authProvider: "test",
    authSubject: "owner",
    displayName: "Owner",
    createdAtUtc: now,
    updatedAtUtc: now,
  });
  workspaces.createWorkspaceWithOwner({
    workspaceId,
    ownerUserId: userId,
    displayName: "Workspace",
    defaultTradingTimezone: "America/Toronto",
    createdAtUtc: now,
  });
  const baseScope: WorkspaceAccessScope = {
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: [],
    activeAccountId: null,
  };
  const account = new JournalAccountService(repository).createAccount(baseScope, {
    workspaceId,
    displayName: "Journal",
    baseCurrency: "USD",
    tradingTimezone: "America/Toronto",
  });
  return {
    database,
    repository,
    scope: { ...baseScope, allowedAccountIds: [account.accountId] },
    accountId: account.accountId,
  };
}

class HideFirstIdentityMatchRepository extends JournalAccountRepository {
  private hideNextMatch = true;

  override findSourceIdentityMatches(
    workspaceId: string,
    sourceSystem: string,
    tuples: readonly SourceIdentityFingerprintTuple[],
  ): readonly JournalAccountSourceIdentityRecord[] {
    if (this.hideNextMatch) {
      this.hideNextMatch = false;
      return Object.freeze([]);
    }
    return super.findSourceIdentityMatches(workspaceId, sourceSystem, tuples);
  }
}

describe("Journal account fingerprint rotation", () => {
  it("does not promote an identity through a different workspace/account scope", () => {
    const context = setup();
    try {
      const service = new JournalAccountService(
        context.repository,
        identityConfig("new-key"),
      );
      service.confirmSourceIdentityLink(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "private-account",
        privacySafeDisplay: "[redacted-account]",
      });
      const identity = context.database.prepare(`SELECT source_identity_id, last_seen_at_utc
FROM journal_account_source_identities
WHERE workspace_id = ? AND account_id = ?`).get(
        context.scope.workspaceId,
        context.accountId,
      ) as { source_identity_id: string; last_seen_at_utc: string };
      expect(() => context.repository.promoteAndTouchIdentity({
        workspaceId: createCanonicalUuidV4(),
        accountId: context.accountId,
        sourceIdentityId: identity.source_identity_id,
        updatedAtUtc: "2026-08-01T15:00:00.000Z",
      })).toThrowError("TRADERLINK_ACCOUNT_NOT_FOUND");
      expect(context.database.prepare(`SELECT last_seen_at_utc
FROM journal_account_source_identities
WHERE source_identity_id = ?`).get(identity.source_identity_id)).toEqual({
        last_seen_at_utc: identity.last_seen_at_utc,
      });
    } finally {
      context.database.close();
    }
  });

  it("matches with the retained key and additively rotates to the same stable account", () => {
    const context = setup();
    try {
      const oldService = new JournalAccountService(context.repository, {
        ...identityConfig("old-key"),
        keysBase64: { "old-key": oldKey.toString("base64") },
      });
      oldService.confirmSourceIdentityLink(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: " private-account ",
        privacySafeDisplay: "[redacted-account]",
      });
      const rotated = new JournalAccountService(context.repository, identityConfig("new-key"));
      expect(
        rotated.resolveSourceAccountIdentity(context.scope, {
          sourceSystem: "ibkr",
          rawSourceAccountId: " private-account ",
          privacySafeDisplay: "[redacted-account]",
        }).accountId,
      ).toBe(context.accountId);
      const identities = context.repository.listNonSupersededSourceIdentities(
        context.scope.workspaceId,
        "ibkr",
      );
      expect(identities).toHaveLength(2);
      expect(identities.find((identity) => identity.hmacKeyVersion === "new-key")?.status).toBe(
        "active_current",
      );
      expect(identities.find((identity) => identity.hmacKeyVersion === "old-key")?.status).toBe(
        "retained_previous",
      );
    } finally {
      context.database.close();
    }
  });

  it("fails closed when a referenced retained key is unavailable", () => {
    const context = setup();
    try {
      const oldService = new JournalAccountService(context.repository, {
        ...identityConfig("old-key"),
        keysBase64: { "old-key": oldKey.toString("base64") },
      });
      oldService.confirmSourceIdentityLink(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "private-account",
        privacySafeDisplay: "[redacted-account]",
      });
      const missingOld = new JournalAccountService(
        context.repository,
        identityConfig("new-key", false),
      );
      expect(() =>
        missingOld.resolveSourceAccountIdentity(context.scope, {
          sourceSystem: "ibkr",
          rawSourceAccountId: "private-account",
          privacySafeDisplay: "[redacted-account]",
        }),
      ).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
    } finally {
      context.database.close();
    }
  });

  it("matches a retained canonicalization version and additively rotates the current version", () => {
    const context = setup();
    try {
      const original = new JournalAccountService(context.repository, {
        activeKeyVersion: "old-key",
        keysBase64: { "old-key": oldKey.toString("base64") },
        activeCanonicalizationVersion: "ibkr-source-account-v1",
        canonicalizers,
      });
      original.confirmSourceIdentityLink(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: " private account ",
        privacySafeDisplay: "[redacted-account]",
      });

      const rotated = new JournalAccountService(context.repository, {
        activeKeyVersion: "old-key",
        keysBase64: { "old-key": oldKey.toString("base64") },
        activeCanonicalizationVersion: "ibkr-source-account-v2",
        canonicalizers: rotatedCanonicalizers,
      });
      expect(
        rotated.resolveSourceAccountIdentity(context.scope, {
          sourceSystem: "ibkr",
          rawSourceAccountId: " private account ",
          privacySafeDisplay: "[redacted-account]",
        }).accountId,
      ).toBe(context.accountId);

      const identities = context.repository.listNonSupersededSourceIdentities(
        context.scope.workspaceId,
        "ibkr",
      );
      expect(identities).toHaveLength(2);
      expect(
        identities.find(
          (identity) =>
            identity.sourceAccountCanonicalizationVersion ===
            "ibkr-source-account-v2",
        )?.status,
      ).toBe("active_current");
      expect(
        identities.find(
          (identity) =>
            identity.sourceAccountCanonicalizationVersion ===
            "ibkr-source-account-v1",
        )?.status,
      ).toBe("retained_previous");
    } finally {
      context.database.close();
    }
  });

  it("fails closed when a referenced retained canonicalizer is unavailable", () => {
    const context = setup();
    try {
      const original = new JournalAccountService(context.repository, {
        activeKeyVersion: "old-key",
        keysBase64: { "old-key": oldKey.toString("base64") },
        activeCanonicalizationVersion: "ibkr-source-account-v1",
        canonicalizers,
      });
      original.confirmSourceIdentityLink(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "private account",
        privacySafeDisplay: "[redacted-account]",
      });

      const missingRetainedCanonicalizer = new JournalAccountService(
        context.repository,
        {
          activeKeyVersion: "old-key",
          keysBase64: { "old-key": oldKey.toString("base64") },
          activeCanonicalizationVersion: "ibkr-source-account-v2",
          canonicalizers: {
            "ibkr-source-account-v2":
              rotatedCanonicalizers["ibkr-source-account-v2"],
          },
        },
      );
      expect(() =>
        missingRetainedCanonicalizer.resolveSourceAccountIdentity(context.scope, {
          sourceSystem: "ibkr",
          rawSourceAccountId: "private account",
          privacySafeDisplay: "[redacted-account]",
        }),
      ).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
    } finally {
      context.database.close();
    }
  });

  it("detects conflicting fingerprints without merging or creating an account", () => {
    const context = setup();
    try {
      const secondAccount = new JournalAccountService(context.repository).createAccount(
        context.scope,
        {
          workspaceId: context.scope.workspaceId,
          displayName: "Second",
          baseCurrency: "USD",
          tradingTimezone: "America/Toronto",
        },
      );
      const timestamp = "2026-08-01T12:00:00.000Z";
      const canonical = "CONFLICT";
      for (const [accountId, version, key] of [
        [context.accountId, "old-key", oldKey],
        [secondAccount.accountId, "new-key", newKey],
      ] as const) {
        context.repository.createSourceIdentity({
          sourceIdentityId: createCanonicalUuidV4(),
          workspaceId: context.scope.workspaceId,
          accountId,
          sourceSystem: "conflictbroker",
          fingerprintSchemeVersion: "hmac-sha256-v1",
          sourceAccountCanonicalizationVersion: "ibkr-source-account-v1",
          hmacKeyVersion: version,
          sourceAccountFingerprint: calculateSourceAccountFingerprint({
            sourceSystem: "conflictbroker",
            canonicalizationVersion: "ibkr-source-account-v1",
            hmacKeyVersion: version,
            canonicalSourceAccountId: canonical,
            key,
          }),
          privacySafeDisplay: "[redacted-account]",
          status: "retained_previous",
          firstSeenAtUtc: timestamp,
          lastSeenAtUtc: timestamp,
        });
      }
      const service = new JournalAccountService(context.repository, identityConfig("new-key"));
      expect(() =>
        service.resolveSourceAccountIdentity(context.scope, {
          sourceSystem: "conflictbroker",
          rawSourceAccountId: "conflict",
          privacySafeDisplay: "[redacted-account]",
        }),
      ).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
      expect(context.repository.listActiveAccounts(context.scope.workspaceId)).toHaveLength(2);
    } finally {
      context.database.close();
    }
  });

  it("re-resolves source identity matches after taking the immediate write lock", () => {
    const context = setup();
    try {
      const originalService = new JournalAccountService(
        context.repository,
        identityConfig("new-key"),
      );
      originalService.confirmSourceIdentityLinkRecord(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "private-account",
        privacySafeDisplay: "[redacted-account]",
      });
      const secondAccount = originalService.createAccount(context.scope, {
        workspaceId: context.scope.workspaceId,
        displayName: "Second",
        baseCurrency: "USD",
        tradingTimezone: "America/Toronto",
      });
      const twoAccountScope: WorkspaceAccessScope = {
        ...context.scope,
        allowedAccountIds: [context.accountId, secondAccount.accountId],
      };
      const racingService = new JournalAccountService(
        new HideFirstIdentityMatchRepository(context.database),
        identityConfig("new-key"),
      );
      expect(() => racingService.confirmSourceIdentityLinkRecord(twoAccountScope, {
        accountId: secondAccount.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "private-account",
        privacySafeDisplay: "[redacted-account]",
      })).toThrowError("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
      const identities = context.repository.listNonSupersededSourceIdentities(
        context.scope.workspaceId,
        "ibkr",
      );
      expect(identities).toHaveLength(1);
      expect(identities[0]?.accountId).toBe(context.accountId);
    } finally {
      context.database.close();
    }
  });

  it("returns only privacy-safe source-identity resolution fields", () => {
    const context = setup();
    try {
      const service = new JournalAccountService(
        context.repository,
        identityConfig("new-key"),
      );
      const resolved = service.confirmSourceIdentityLinkRecord(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "SYNTH-PRIVATE-ACCOUNT",
        privacySafeDisplay: "Synthetic brokerage account",
      });
      expect(Object.keys(resolved).sort()).toEqual([
        "accountId",
        "sourceIdentityId",
        "tradingTimezone",
        "workspaceId",
      ]);
      expect(JSON.stringify(resolved)).not.toContain("SYNTH-PRIVATE-ACCOUNT");
      expect(JSON.stringify(resolved)).not.toContain("sourceAccountFingerprint");
      expect(JSON.stringify(resolved)).not.toContain("hmacKeyVersion");
    } finally {
      context.database.close();
    }
  });

  it("rejects mixed valid and malformed percent escapes without rejecting safe labels", () => {
    const context = setup();
    try {
      const service = new JournalAccountService(
        context.repository,
        identityConfig("new-key"),
      );
      const accepted = service.confirmSourceIdentityLinkRecord(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "SYNTH-ACCOUNT",
        privacySafeDisplay: "Synthetic account",
      });
      expect(accepted.accountId).toBe(context.accountId);
      expect(() => service.confirmSourceIdentityLinkRecord(context.scope, {
        accountId: context.accountId,
        sourceSystem: "ibkr",
        rawSourceAccountId: "SYNTH-ACCOUNT",
        privacySafeDisplay: "SYNTH%2DACCOUNT%ZZ",
      })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(context.repository.listNonSupersededSourceIdentities(
        context.scope.workspaceId,
        "ibkr",
      )).toHaveLength(1);
    } finally {
      context.database.close();
    }
  });
});
