// @vitest-environment node
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformMembershipRepository } from "../membership/platform-membership-repository";
import { MoomooConnectionRepository } from "./moomoo-connection-repository";
import { PlatformNotificationRepository } from "../notifications/platform-notification-repository";
import { PlatformWebPushRepository } from "../notifications/platform-web-push-repository";
import { readMoomooAlertReadiness, resolveMoomooAlertRecipients } from "./moomoo-connection-alerts";
import { runMoomooConnectionMonitor } from "./moomoo-connection-monitor";

let schema: Buffer;
beforeAll(() => { const db = new Database(":memory:"); db.pragma("foreign_keys=ON"); runPlatformMigrations(db); schema = db.serialize(); db.close(); }, 30000);
afterEach(() => vi.unstubAllEnvs());
const at = "2026-10-26T00:00:00.000Z";
function fixture() {
  const db = new Database(schema); db.pragma("foreign_keys=ON");
  const scopes = ["111", "222", "333"].map(subject => {
    const userId = randomUUID(), workspaceId = randomUUID();
    db.prepare("INSERT INTO platform_users VALUES (?,'test',?,'Synthetic','active',?,?)").run(userId, userId, at, at);
    db.prepare("INSERT INTO platform_auth_identities VALUES (?,'discord',?,'active',?,?,?,NULL)").run(userId, subject, userId, at, at);
    db.prepare("INSERT INTO platform_workspaces VALUES (?,'QA','UTC','active',?,?)").run(workspaceId, at, at);
    db.prepare("INSERT INTO platform_workspace_memberships VALUES (?,?,'owner','active',?,?,?)").run(workspaceId, userId, userId, at, at);
    db.prepare("INSERT INTO platform_notification_delivery_preferences VALUES (?,'broker_connection',0,1,1,?)").run(userId, at);
    // Explicit off rollout retains normal existing access; no test bypass in product.
    return { userId, workspaceId, workspaceRole: "owner" as const, allowedAccountIds: [], activeAccountId: null };
  });
  new PlatformMembershipRepository(db).synchronizeBuiltInFeatures(scopes[0]!.userId, at);
  for (const key of ["broker.connections", "notifications.access", "notifications.broker_connection"]) {
    db.prepare("INSERT INTO platform_membership_feature_policies VALUES (?,'off',?,?)").run(key, scopes[0]!.userId, at);
  }
  const repo = new MoomooConnectionRepository(db);
  const encrypted = { keyVersion: "qa", initializationVector: "a".repeat(16), ciphertext: "b".repeat(32), authenticationTag: "c".repeat(16) };
  const authorize = (index=0, timestamp=at, ciphertext=encrypted.ciphertext) => repo.saveAuthorized(scopes[index]!, {
    encrypted: { ...encrypted, ciphertext }, accessTokenExpiresAtUtc: timestamp,
    authorizedScopes: ["quote:read"], timestamp,
  });
  vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT", "111,222");
  return { db, scopes, repo, authorize };
}
function count(db: Database.Database, table: string) { return (db.prepare(`SELECT COUNT(*) n FROM ${table}`).get() as { n:number }).n; }
describe("durable Moomoo attention episodes", () => {
  it("fans out once per episode; reconnect rearms; replay and duplicate transitions do not spam", () => {
    const f = fixture(); try {
      const connection = f.authorize(); f.repo.markReauthorizationRequired(f.scopes[0]!, at);
      f.repo.markReauthorizationRequired(f.scopes[0]!, at); f.repo.reconcileAttentionAlert(f.scopes[0]!);
      expect(count(f.db,"platform_notifications")).toBe(2);
      expect(count(f.db,"platform_notification_receipts")).toBe(2);
      expect(f.db.prepare("SELECT DISTINCT journal_account_id FROM platform_notifications").all()).toEqual([{ journal_account_id:null }]);
      expect(f.db.prepare("SELECT destination_path FROM platform_notifications WHERE recipient_user_id=?").get(f.scopes[1]!.userId)).toEqual({destination_path:"/notifications"});
      expect(count(f.db,"platform_notification_remote_deliveries")).toBe(0); // No confirmed email, not delivered/queued.
      const later = "2026-10-26T01:00:00.000Z";
      expect(f.authorize(0,later).connectionId).toBe(connection.connectionId);
      f.repo.markReauthorizationRequired(f.scopes[0]!,later); f.repo.reconcileAttentionAlert(f.scopes[0]!);
      expect(count(f.db,"platform_notifications")).toBe(4);
      expect(count(f.db,"platform_broker_connection_attempts")).toBe(4);
    } finally {f.db.close();}
  });
  it("never fans ordinary members out to configured owners", () => {
    const f=fixture();try {f.authorize();f.authorize(2);f.repo.markReauthorizationRequired(f.scopes[2]!,at);
      expect(f.db.prepare("SELECT recipient_user_id FROM platform_notifications").all()).toEqual([{recipient_user_id:f.scopes[2]!.userId}]);
    } finally {f.db.close();}
  });
  it("fails closed on ambiguous owner source or malformed configuration", () => {
    const f=fixture();try {const c=f.authorize();f.authorize(1);
      expect(resolveMoomooAlertRecipients(f.db,f.scopes[0]!,c.connectionId).ownerFanout).toBe(false);
      vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT","111,111");
      expect(resolveMoomooAlertRecipients(f.db,f.scopes[0]!,c.connectionId).scopes).toHaveLength(1);
    } finally {f.db.close();}
  });
  it("rejects stale refresh results after reconnect and does not revoke the new connection", () => {
    const f=fixture();try {f.authorize();f.authorize(0,at,"d".repeat(32));
      expect(()=>f.repo.markReauthorizationRequired(f.scopes[0]!,at,"b".repeat(32))).toThrow();
      expect(()=>f.repo.saveAuthorized(f.scopes[0]!,{encrypted:{keyVersion:"qa",initializationVector:"a".repeat(16),ciphertext:"b".repeat(32),authenticationTag:"c".repeat(16)},accessTokenExpiresAtUtc:at,authorizedScopes:["quote:read"],timestamp:at,expectedCredentialCiphertext:"b".repeat(32)})).toThrow();
      expect(f.repo.find(f.scopes[0]!)!.state).toBe("active");expect(count(f.db,"platform_notifications")).toBe(0);
    } finally {f.db.close();}
  });
  it("rolls back transition and episode if notification creation fails", () => {
    const f=fixture();try {f.authorize();f.db.exec(`CREATE TRIGGER qa_reject_notification BEFORE INSERT ON platform_notifications WHEN NEW.recipient_user_id='${f.scopes[1]!.userId}' BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;`);
      expect(()=>f.repo.markReauthorizationRequired(f.scopes[0]!,at)).toThrow("synthetic failure");
      expect(f.repo.find(f.scopes[0]!)!.state).toBe("active");expect(count(f.db,"platform_broker_connection_attempts")).toBe(1);expect(count(f.db,"platform_notifications")).toBe(0);
    } finally {f.db.close();}
  });
  it("proactively checks due connections and advances cursor through temporary failures", async () => {
    const f=fixture();try {f.authorize();f.authorize(2);const access=vi.fn().mockRejectedValue(new Error("outage"));
      const first=await runMoomooConnectionMonitor(f.db,{after:"",now:new Date(at),limit:1,accessToken:access});
      const second=await runMoomooConnectionMonitor(f.db,{after:first.after,now:new Date(at),limit:1,accessToken:access});
      expect(first.unavailable).toBe(1);expect(second.unavailable).toBe(1);expect(access).toHaveBeenCalledTimes(2);
      expect(access.mock.calls[0][0].userId).not.toBe(access.mock.calls[1][0].userId);
      expect(count(f.db,"platform_notifications")).toBe(0);
    } finally {f.db.close();}
  });
  it("queues email and push per recipient exactly once, respects opt-out, and reports missing readiness", () => {
    const f=fixture();try {
      const key=Buffer.alloc(32,7).toString("base64");
      vi.stubEnv("TRADERLINK_WEB_PUSH_ACTIVE_KEY_VERSION","qa");
      vi.stubEnv("TRADERLINK_WEB_PUSH_KEYS_BASE64",JSON.stringify({qa:key}));
      f.authorize();
      for(const [index,scope] of f.scopes.slice(0,2).entries()) {
        f.db.prepare(`INSERT INTO platform_notification_email_addresses VALUES (?,?,?,'qa',?,?,?,'confirmed',NULL,NULL,?,?,?)`)
          .run(randomUUID(),scope.userId,String(index+1).repeat(64),"a".repeat(16),"b".repeat(32),"c".repeat(16),at,at,at);
        new PlatformWebPushRepository(f.db,{activeKeyVersion:"qa",keysBase64:{qa:key}}).subscribe({scope,updatedAtUtc:at,
          subscription:{expirationTime:null,endpoint:`https://push.example.test/device-${index}`,keys:{p256dh:Buffer.concat([Buffer.from([4]),Buffer.alloc(64,1)]).toString("base64url"),auth:Buffer.alloc(16,1).toString("base64url")}}});
      }
      f.repo.markReauthorizationRequired(f.scopes[0]!,at);f.repo.reconcileAttentionAlert(f.scopes[0]!);
      expect(count(f.db,"platform_notification_remote_deliveries")).toBe(2);
      expect(count(f.db,"platform_web_push_deliveries")).toBe(2);
      f.db.prepare("UPDATE platform_notification_delivery_preferences SET email_enabled=0,web_push_enabled=0 WHERE user_id=?").run(f.scopes[1]!.userId);
      f.authorize(0,"2026-10-26T02:00:00.000Z");f.repo.markReauthorizationRequired(f.scopes[0]!,"2026-10-26T02:00:00.000Z");
      expect(count(f.db,"platform_notification_remote_deliveries")).toBe(3);
      expect(count(f.db,"platform_web_push_deliveries")).toBe(3);
      const readiness=readMoomooAlertReadiness(f.db,f.scopes[1]!,{});
      expect(readiness).toMatchObject({emailEnabled:false,emailConfirmed:true,emailConfigured:false,pushEnabled:false,pushRegistered:true,pushConfigured:false,providerDelivery:"unverified",phoneDisplay:"unknown"});
      expect(readMoomooAlertReadiness(f.db,f.scopes[2]!,{})).toMatchObject({emailConfirmed:false,pushRegistered:false});
    } finally {f.db.close();}
  });
  it("reconciles an existing attention episode without duplicating its legacy source alert", () => {
    const f=fixture();try {const c=f.authorize();
      new PlatformNotificationRepository(f.db).create({category:"broker_connection",kind:"broker_connection_reauthorization_required",
        scope:f.scopes[0]!,journalAccountId:null,occurredAtUtc:at,sourceEventKey:`broker_connection_reauthorization_${c.connectionId}`,
        title:"Reconnect Moomoo",summary:"Existing legacy alert",destinationPath:"/account/trading",webPushDelivery:false,remoteDelivery:false});
      f.repo.markReauthorizationRequired(f.scopes[0]!,at);
      f.repo.reconcileAttentionAlert(f.scopes[0]!);f.repo.reconcileAttentionAlert(f.scopes[0]!);
      expect(count(f.db,"platform_notifications")).toBe(2);
      expect(f.db.prepare("SELECT summary FROM platform_notifications WHERE recipient_user_id=?").get(f.scopes[0]!.userId)).toEqual({summary:"Existing legacy alert"});
      // Identical timestamps must not conflate a second, distinct episode.
      f.authorize();f.repo.markReauthorizationRequired(f.scopes[0]!,at);
      expect(count(f.db,"platform_notifications")).toBe(4);
    } finally {f.db.close();}
  });

  it("does not refresh a healthy future token or an intentionally revoked connection", async () => {
    const f=fixture();try {f.authorize(0,"2026-10-27T00:00:00.000Z");f.authorize(2);
      f.repo.revoke(f.scopes[2]!,{encrypted:{keyVersion:"qa",initializationVector:"a".repeat(16),ciphertext:"b".repeat(32),authenticationTag:"c".repeat(16)},timestamp:at});
      const access=vi.fn();expect(await runMoomooConnectionMonitor(f.db,{after:"",now:new Date(at),accessToken:access})).toMatchObject({checked:0});
      expect(access).not.toHaveBeenCalled();expect(count(f.db,"platform_notifications")).toBe(0);
    } finally {f.db.close();}
  });

});
