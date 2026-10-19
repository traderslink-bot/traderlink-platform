import type Database from "better-sqlite3";
import { normalizeProfileName, PlatformProfileNameError, profileNameKey } from "../../contracts/platform-profile-name";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, platformFailure } from "../database/platform-migration-contract";

/** Names are presentation only. Provider subjects and stable user IDs own access. */
export class PlatformProfileNameRepository {
  constructor(private readonly database: Database.Database) {}

  private takenNames(userId: string): Set<string> {
    const users = this.database.prepare<[string], { display_name: string }>(
      "SELECT display_name FROM platform_users WHERE user_id <> ?",
    ).all(userId);
    const saved = this.database.prepare<[string], { normalized_name: string }>(
      "SELECT normalized_name FROM platform_user_profile_names WHERE user_id <> ?",
    ).all(userId);
    return new Set([...users.map(row => profileNameKey(row.display_name)), ...saved.map(row => row.normalized_name)]);
  }

  /** Call inside the same write transaction as creating the new user. */
  availableInitialName(userId: string, value: string): string {
    const suggestion = value.normalize("NFKC").replace(/[\p{Cc}\p{Cf}]/gu, "").trim().slice(0, 120);
    const name = normalizeProfileName(suggestion || "Member");
    const taken = this.takenNames(userId);
    if (!taken.has(profileNameKey(name))) return name;
    // A provider-name collision must never prevent a new member from signing in.
    // Only new accounts receive an available suggestion; existing names stay put.
    for (let number = 2; number <= taken.size + 2; number += 1) {
      const suffix = ` (${number})`;
      const candidate = name.slice(0, 120 - suffix.length).trimEnd() + suffix;
      if (!taken.has(profileNameKey(candidate))) return candidate;
    }
    throw new PlatformProfileNameError("taken");
  }

  save(userId: string, value: unknown, timestamp: string): string {
    assertCanonicalUuidV4(userId, "userId");
    assertCanonicalUtcTimestamp(timestamp, "timestamp");
    const name = normalizeProfileName(value);
    const key = profileNameKey(name);
    return this.database.transaction(() => {
      const user = this.database.prepare("SELECT 1 FROM platform_users WHERE user_id=? AND status='active'").get(userId);
      if (!user) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      if (this.takenNames(userId).has(key)) throw new PlatformProfileNameError("taken");
      this.database.prepare(`INSERT INTO platform_user_profile_names(user_id,normalized_name,saved_at_utc)
        VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET
        normalized_name=excluded.normalized_name,saved_at_utc=excluded.saved_at_utc`).run(userId, key, timestamp);
      this.database.prepare("UPDATE platform_users SET display_name=?,updated_at_utc=? WHERE user_id=? AND status='active'")
        .run(name, timestamp, userId);
      return name;
    }).immediate();
  }

  private connectedName(userId: string, provider: "discord" | "google"): string | null {
    const profile = this.database.prepare<[string, string], { display_name: string; profile_display_name: string | null }>(`SELECT
      profile.display_name,profile.profile_display_name FROM platform_login_identity_profiles profile
      JOIN platform_auth_identities identity ON identity.auth_provider=profile.auth_provider
      AND identity.auth_subject=profile.auth_subject
      WHERE identity.user_id=? AND identity.auth_provider=? AND identity.status='active'
      ORDER BY profile.updated_at_utc DESC LIMIT 1`).get(userId, provider);
    if (!profile) return null;
    if (profile.profile_display_name) return profile.profile_display_name;
    if (provider === "discord") {
      // Legacy membership labels are usable only when they match this active
      // identity's recorded username; never borrow a disconnected identity's name.
      const membership = this.database.prepare<[string, string], { name: string }>(`SELECT
        COALESCE(NULLIF(global_display_name,''),username) AS name FROM platform_discord_memberships
        WHERE user_id=? AND username=? ORDER BY last_verified_at_utc DESC LIMIT 1`).get(userId, profile.display_name);
      if (membership?.name) return membership.name;
    }
    return profile.display_name;
  }

  /** Run within the provider's existing transaction. Never overwrites a saved name. */
  updateProviderDefault(userId: string, value: string | null, provider: string | undefined, timestamp: string): void {
    if (!this.database.inTransaction) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "profileNameTransaction" });
    if (this.database.prepare("SELECT 1 FROM platform_user_profile_names WHERE user_id=?").get(userId)) return;
    const preferred = provider === "discord" ? value
      : this.connectedName(userId, "discord") ?? (provider === "google" ? value : this.connectedName(userId, "google") ?? value);
    if (!preferred) return;
    let name: string;
    try { name = normalizeProfileName(preferred); } catch (error) {
      if (error instanceof PlatformProfileNameError) return;
      throw error;
    }
    // Preserve both accounts and their access if legacy/provider suggestions collide.
    if (this.takenNames(userId).has(profileNameKey(name))) return;
    this.database.prepare("UPDATE platform_users SET display_name=?,updated_at_utc=? WHERE user_id=? AND status='active' AND updated_at_utc<=?")
      .run(name, timestamp, userId, timestamp);
  }
}
