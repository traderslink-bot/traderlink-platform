import { createHmac } from "node:crypto";
import type Database from "better-sqlite3";
import { partnerAlertId, partnerAlertRef, partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";

type Key = Readonly<{ keyRef: string; key: Uint8Array }>;
type Message = Readonly<{ communityId: string; sourceChannelId: string; messageId: string }>;
export type PartnerAlertRetentionHoldKind = "dispute" | "refund_review" | "external_operation" | "recovery";

function validateKey(input: Key): Key {
  const keyRef = partnerAlertRef(input.keyRef, "holdBindingKeyRef");
  if (!(input.key instanceof Uint8Array) || input.key.byteLength < 32 || input.key.byteLength > 128) return erasureHold();
  return Object.freeze({ keyRef, key: input.key });
}

function digest(key: Uint8Array, domain: string, value: string): string {
  return createHmac("sha256", key).update(`${domain}\u0000${value}`, "utf8").digest("hex");
}

function bindings(input: Message, key: Key) {
  const communityId = partnerAlertId(input.communityId, "communityId");
  const sourceChannelId = partnerAlertSnowflake(input.sourceChannelId, "sourceChannelId");
  const messageId = partnerAlertSnowflake(input.messageId, "messageId");
  return Object.freeze({ community: digest(key.key, "community", communityId),
    message: digest(key.key, "message", `${communityId}\u0000${sourceChannelId}\u0000${messageId}`) });
}

/** Keyed hold registry. Raw community/channel/message/provider references never
 * enter the durable table. All keys needed by active holds must remain loaded. */
export class PartnerAlertRetentionHoldRepository {
  private readonly keys: readonly Key[];
  constructor(private readonly database: Database.Database, keys: readonly Key[]) {
    if (!keys.length || keys.length > 32) erasureHold();
    this.keys = Object.freeze(keys.map(validateKey));
    if (new Set(this.keys.map(key => key.keyRef)).size !== this.keys.length) return erasureHold();
  }

  hasActive(input: Message): boolean {
    return this.keys.some(key => {
      const refs = bindings(input, key);
      return Boolean(this.database.prepare(`SELECT 1 FROM partner_alert_retention_holds
        WHERE state='active' AND binding_key_ref=? AND community_binding_hmac_sha256=?
          AND source_message_binding_hmac_sha256=? LIMIT 1`).get(key.keyRef, refs.community, refs.message));
    });
  }

  create(input: Message & Readonly<{ holdRef: string; kind: PartnerAlertRetentionHoldKind;
    evidence: string; createdAtUtc: string; keyRef: string }>): void {
    const key = this.keys.find(candidate => candidate.keyRef === input.keyRef);
    if (!key || !["dispute","refund_review","external_operation","recovery"].includes(input.kind)
      || typeof input.evidence !== "string" || !input.evidence.length || input.evidence.length > 64_000) return erasureHold();
    const refs = bindings(input, key);
    this.database.prepare(`INSERT INTO partner_alert_retention_holds
      (hold_ref,community_binding_hmac_sha256,source_message_binding_hmac_sha256,binding_key_ref,
       hold_kind,state,evidence_hmac_sha256,created_at_utc,released_at_utc)
      VALUES(?,?,?,?,?,'active',?,?,NULL)`).run(partnerAlertId(input.holdRef,"holdRef"), refs.community, refs.message,
      key.keyRef, input.kind, digest(key.key,"evidence",input.evidence), partnerAlertUtc(input.createdAtUtc,"createdAtUtc"));
  }

  release(holdRef: string, releasedAtUtc: string): void {
    const result = this.database.prepare(`UPDATE partner_alert_retention_holds
      SET state='released',released_at_utc=? WHERE hold_ref=? AND state='active'`)
      .run(partnerAlertUtc(releasedAtUtc,"releasedAtUtc"),partnerAlertId(holdRef,"holdRef"));
    if (result.changes !== 1) return erasureHold();
  }
}
