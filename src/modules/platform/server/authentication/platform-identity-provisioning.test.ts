import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openPlatformDatabase } from "../database/open-platform-database";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformAuthenticationRepository } from "./platform-authentication-repository";
import { provisionVerifiedPlatformIdentity } from "./platform-identity-provisioning";
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "platform-identity-provisioning-")); roots.push(root);
  const db = openPlatformDatabase({ mode: "initializer", databasePath: join(root, "qa.sqlite"), forbiddenRepositoryRoots: [] });
  runPlatformMigrations(db, { manifest: platformMigrationManifest });
  return db;
}
const timestamp = "2026-10-14T12:00:00.000Z";
describe("verified provider provisioning", () => {
  it("keeps a Google user's ownership stable through another explicitly linked method", () => {
    const db = fixture(); try {
      const provision = (authProvider: "google" | "email", authSubject: string) => db.transaction(() => provisionVerifiedPlatformIdentity(db, { authProvider, authSubject, displayName: "Trader", timestamp })).immediate();
      const first = provision("google", "google-subject");
      const again = provision("google", "google-subject");
      expect(again).toEqual({ ...first, provisioned: false });
      new PlatformAuthenticationRepository(db).linkIdentity({ userId: first.userId, authProvider: "email", authSubject: "credential-id", linkedByUserId: first.userId, timestamp });
      expect(provision("email", "credential-id")).toEqual({ ...first, provisioned: false });
      expect(db.prepare("SELECT count(*) AS n FROM platform_users").get()).toEqual({ n: 1 });
    } finally { db.close(); }
  });
  it("does not equate subjects from different providers or display names", () => {
    const db = fixture(); try {
      const a = db.transaction(() => provisionVerifiedPlatformIdentity(db, { authProvider: "google", authSubject: "same", displayName: "Same", timestamp })).immediate();
      const b = db.transaction(() => provisionVerifiedPlatformIdentity(db, { authProvider: "email", authSubject: "same", displayName: "Same", timestamp })).immediate();
      expect(a.userId).not.toBe(b.userId); expect(a.workspaceId).not.toBe(b.workspaceId);
      db.prepare("UPDATE platform_users SET status='disabled' WHERE user_id=?").run(a.userId);
      expect(() => db.transaction(() => provisionVerifiedPlatformIdentity(db, { authProvider: "google", authSubject: "same", displayName: "Same", timestamp })).immediate()).toThrow("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    } finally { db.close(); }
  });
});
