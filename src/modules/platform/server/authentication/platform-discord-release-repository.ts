import type Database from "better-sqlite3";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";

/** Called only within the authenticated disconnect / provider-link transaction. */
export class PlatformDiscordReleaseRepository {
  constructor(private readonly db: Database.Database) {}

  hasReleasedOriginalOwner(userId: string, subject: string): boolean {
    return Boolean(this.db.prepare(`SELECT 1 FROM platform_discord_released_origins
      WHERE user_id=? AND auth_subject=?`).get(userId, subject));
  }

  isDisconnected(subject: string): boolean {
    return Boolean(this.db.prepare(`SELECT 1 FROM platform_auth_identities
      WHERE auth_provider='discord' AND auth_subject=? AND status='revoked'`).get(subject));
  }

  record(userId: string): void {
    if (!this.db.inTransaction) throw new Error("Discord release requires a transaction");
    const result = this.db.prepare(`INSERT INTO platform_discord_identity_releases
      (release_id,user_id,auth_subject,released_at_utc,prior_linked_by_user_id,
       prior_created_at_utc,prior_last_authenticated_at_utc)
      SELECT ?,user_id,auth_subject,updated_at_utc,linked_by_user_id,
        created_at_utc,last_authenticated_at_utc FROM platform_auth_identities
      WHERE user_id=? AND auth_provider='discord' AND status='revoked'
        AND NOT EXISTS(SELECT 1 FROM platform_discord_identity_releases r
          WHERE r.auth_subject=platform_auth_identities.auth_subject AND r.claimed_at_utc IS NULL)`)
      .run(createCanonicalUuidV4(), userId);
    if (result.changes !== 1) throw new Error("Discord release was not recorded");
    this.db.prepare(`INSERT OR IGNORE INTO platform_discord_released_origins
      (user_id,auth_subject,released_at_utc)
      SELECT r.user_id,r.auth_subject,r.released_at_utc
      FROM platform_discord_identity_releases r JOIN platform_users u ON u.user_id=r.user_id
        AND u.auth_provider='discord' AND u.auth_subject=r.auth_subject
      WHERE r.user_id=? AND r.claimed_at_utc IS NULL`).run(userId);
  }

  claim(previousUserId: string, userId: string, subject: string, timestamp: string): boolean {
    if (!this.db.inTransaction) throw new Error("Discord claim requires a transaction");
    // The old account must still have a verified alternative. No account or data moves.
    const usable = this.db.prepare(`SELECT 1 FROM platform_users u
      JOIN platform_auth_identities a ON a.user_id=u.user_id
      WHERE u.user_id=? AND u.status='active' AND a.status='active'
        AND a.auth_provider<>'discord' AND (a.auth_provider<>'email'
          OR EXISTS(SELECT 1 FROM platform_login_credentials c
            WHERE c.user_id=u.user_id AND c.verified_at_utc IS NOT NULL))`).get(previousUserId);
    if (!usable) return false;
    const claimed = this.db.prepare(`UPDATE platform_discord_identity_releases
      SET claimed_by_user_id=?,claimed_at_utc=?
      WHERE user_id=? AND auth_subject=? AND claimed_at_utc IS NULL
        AND released_at_utc=(SELECT updated_at_utc FROM platform_auth_identities
          WHERE auth_provider='discord' AND auth_subject=? AND user_id=? AND status='revoked')`)
      .run(userId, timestamp, previousUserId, subject, subject, previousUserId);
    if (claimed.changes !== 1) return false;
    const changed = this.db.prepare(`UPDATE platform_auth_identities
      SET user_id=?,linked_by_user_id=?,status='active',updated_at_utc=?,last_authenticated_at_utc=NULL
      WHERE auth_provider='discord' AND auth_subject=? AND user_id=? AND status='revoked'`)
      .run(userId, userId, timestamp, subject, previousUserId);
    if (changed.changes !== 1) throw new Error("Discord release claim was not applied");
    return true;
  }
}
