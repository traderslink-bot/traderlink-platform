import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "./local-development-configuration";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("local development configuration", () => {
  it("loads external database and recovery authority without a Discord login", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-local-config-"));
    roots.push(root);
    const repositoryRoot = join(root, "TraderLink", "traderlink-platform");
    const privateRoot = join(root, "TraderLink", "private-data");
    const databaseRoot = join(privateRoot, "traderlink-platform");
    const vaultRoot = join(privateRoot, "traderlink-platform-import-artifacts");
    const configRoot = join(privateRoot, "traderlink-platform-config");
    const databasePath = join(databaseRoot, "development.sqlite");
    mkdirSync(repositoryRoot, { recursive: true });
    mkdirSync(databaseRoot, { recursive: true });
    mkdirSync(vaultRoot, { recursive: true });
    mkdirSync(configRoot, { recursive: true });
    mkdirSync(join(privateRoot, "v3-dashboard"), { recursive: true });
    mkdirSync(join(privateRoot, "legacy-app"), { recursive: true });
    writeFileSync(databasePath, "sqlite-placeholder");
    const key = Buffer.alloc(32, 7).toString("base64");
    writeFileSync(join(configRoot, "journal-authority-v1.json"), JSON.stringify({
      accountIdentity: { activeKeyVersion: "key1", keysBase64: { key1: key } },
      journalPrivacy: { activeKeyVersion: "key2", keysBase64: { key2: key } },
    }));
    const environment: NodeJS.ProcessEnv = { NODE_ENV: "test" };
    const result = loadTraderLinkPlatformLocalDevelopmentConfiguration({
      repositoryRoot,
      environment,
    });
    expect(result.databasePath).toBe(databasePath);
    expect(result.protectedStorageRoots).toHaveLength(2);
    expect(environment.TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION)
      .toBe("key1");
    expect(environment.TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION)
      .toBe("key2");
    expect(result.uploadStagingRoot).toContain("traderlink-platform-upload-staging");
  });
});
