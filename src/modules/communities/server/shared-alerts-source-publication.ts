import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { SHARED_ALERT_BODY_MAX_LENGTH } from "../contracts/shared-alerts-contracts";
import { SharedAlertError } from "./shared-alerts-errors";
import { captureSharedAlertChange } from "./shared-alerts-publication-changes";
import { captureSharedAlertPublication } from "./shared-alerts-read";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePolicy, type SharedSourceSelection } from "./shared-alerts-source-policy";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

export type SharedSourceAlert = Readonly<{
  alertId: string; communityId: string; slug: string; authorUserId: string;
  title: string; symbol: string | null; body: string; audienceId: string;
  status: "draft" | "published" | "archived"; publishingMode: "tracked_page" | "discord_post";
  publishedAtUtc: string | null; updatedAtUtc: string;
}>;
export type SharedSourceAlertSave = Readonly<{
  communityId: string; actorUserId: string; alertId?: string; expectedUpdatedAtUtc?: string;
  title: string; symbol?: string | null; body: string; audienceId: string;
  status: SharedSourceAlert["status"]; publishingMode: SharedSourceAlert["publishingMode"];
  selection: SharedSourceSelection; atUtc: string;
}>;

const projection = `alert_id alertId,community_id communityId,slug,author_user_id authorUserId,title,symbol,body,
  audience_id audienceId,status,publishing_mode publishingMode,published_at_utc publishedAtUtc,updated_at_utc updatedAtUtc`;

/** Alert-only source transactions. Registration, request auth, provider verification and workers are external boundaries. */
export class SharedAlertsSourcePublication {
  private readonly policy: SharedAlertsSourcePolicy;
  constructor(private readonly database: Database.Database) { this.policy = new SharedAlertsSourcePolicy(database); }

  private editable(communityId: string, actorUserId: string, alert: SharedSourceAlert): void {
    const access = new TraderLinkCommunityRepository(this.database).resolveAccess(communityId, actorUserId);
    if (alert.communityId !== communityId || (alert.authorUserId !== actorUserId && !access.capabilities.includes("community.alerts.manage_all"))) throw new SharedAlertError("not_owner");
  }

  readForPublisher(communityId: string, actorUserId: string, alertId: string, atUtc: string): SharedSourceAlert {
    this.policy.requirePublisher(communityId, actorUserId, atUtc);
    assertCanonicalUuidV4(alertId, "alertId");
    const alert = this.database.prepare(`SELECT ${projection} FROM traderlink_community_alerts WHERE community_id=? AND alert_id=?`).get(communityId, alertId) as SharedSourceAlert | undefined;
    if (!alert) throw new SharedAlertError("not_found");
    this.editable(communityId, actorUserId, alert);
    return Object.freeze(alert);
  }

  save(input: SharedSourceAlertSave): SharedSourceAlert {
    assertCanonicalUtcTimestamp(input.atUtc, "atUtc");
    assertCanonicalUuidV4(input.audienceId, "audienceId");
    const title = input.title.trim(), body = input.body.replace(/\r\n?/gu, "\n").trim(), symbol = input.symbol?.trim().toUpperCase() || null;
    if (!title || title.length > 140 || !body || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(title + body) || /[\r\n\t]/u.test(title) || (symbol && !/^[A-Z0-9][A-Z0-9.\-/:^]{0,31}$/u.test(symbol)) || !["draft", "published", "archived"].includes(input.status) || !["tracked_page", "discord_post"].includes(input.publishingMode)) throw new SharedAlertError("invalid");
    return this.database.transaction(() => {
      this.policy.requirePublisher(input.communityId, input.actorUserId, input.atUtc);
      const previous = input.alertId ? this.readForPublisher(input.communityId, input.actorUserId, input.alertId, input.atUtc) : undefined;
      if (previous) {
        assertCanonicalUtcTimestamp(input.expectedUpdatedAtUtc ?? "", "expectedUpdatedAtUtc");
        if (previous.updatedAtUtc !== input.expectedUpdatedAtUtc || previous.updatedAtUtc > input.atUtc) throw new SharedAlertError("changed");
        // Published facts are corrected or withdrawn; they never silently become unpublished drafts.
        if (previous.publishedAtUtc && input.status === "draft") throw new SharedAlertError("invalid");
        if (previous.status === "archived" && input.status !== "archived") throw new SharedAlertError("changed");
      } else if (input.status === "archived") throw new SharedAlertError("invalid");
      if (body.length > SHARED_ALERT_BODY_MAX_LENGTH
        && !(input.status === "archived" && previous?.body.replace(/\r\n?/gu, "\n").trim() === body)) {
        throw new SharedAlertError("body_too_long");
      }
      if (!this.database.prepare("SELECT 1 FROM traderlink_community_audiences WHERE community_id=? AND audience_id=? AND status='active'").get(input.communityId, input.audienceId)) throw new SharedAlertError("invalid");
      const alertId = previous?.alertId ?? createCanonicalUuidV4();
      if (previous?.publishedAtUtc) this.recordRevision(previous, input.actorUserId, input.atUtc, false);
      if (previous) {
        this.database.prepare(`UPDATE traderlink_community_alerts SET title=?,symbol=?,body=?,audience_id=?,publishing_mode=?,status=?,
          published_at_utc=CASE WHEN ?='published' THEN coalesce(published_at_utc,?) ELSE published_at_utc END,updated_at_utc=? WHERE community_id=? AND alert_id=? AND updated_at_utc=?`)
          .run(title, symbol, body, input.audienceId, input.publishingMode, input.status, input.status, input.atUtc, input.atUtc, input.communityId, alertId, previous.updatedAtUtc);
      } else {
        const base = title.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 80).replace(/-$/u, "") || "alert";
        // UUID suffix avoids collisions without deriving or changing author identity.
        const slug = `${base}-${alertId}`;
        this.database.prepare(`INSERT INTO traderlink_community_alerts(alert_id,community_id,slug,author_user_id,title,symbol,body,status,audience_id,published_at_utc,created_at_utc,updated_at_utc,publishing_mode)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(alertId, input.communityId, slug, input.actorUserId, title, symbol, body, input.status, input.audienceId, input.status === "published" ? input.atUtc : null, input.atUtc, input.atUtc, input.publishingMode);
      }
      // Withdrawal uses the captured original intent; saving an archive must not rewrite it.
      if (input.status !== "archived") this.policy.saveIntent({ communityId: input.communityId, publisherUserId: input.actorUserId, alertId, selection: input.selection, publishingMode: input.publishingMode, publish: input.status === "published", atUtc: input.atUtc });
      const current = this.database.prepare(`SELECT ${projection} FROM traderlink_community_alerts WHERE community_id=? AND alert_id=?`).get(input.communityId, alertId) as SharedSourceAlert;
      const firstPublication = current.status === "published" && !previous?.publishedAtUtc;
      if (firstPublication) {
        // Source original revision and immutable Discord author capture precede either queue.
        this.recordRevision(current, input.actorUserId, input.atUtc, true);
        captureSharedAlertPublication(new SharedAlertsRepository(this.database, () => input.atUtc), alertId, input.atUtc);
        this.queueOriginal(current, input.actorUserId, input.atUtc);
      } else if (previous?.status === "published" && previous.publishedAtUtc) {
        // Source presentation changes need a revision too, without reposting an
        // unchanged full alert to partners. Status also preserves withdrawal actor.
        this.recordRevision(current, input.actorUserId, input.atUtc, false);
        const changed = previous.title !== title || previous.symbol !== symbol || previous.body !== body;
        if (input.status === "archived" || changed) {
          if (input.status === "archived") this.database.prepare(`UPDATE traderlink_community_content_deliveries SET status='cancelled',last_error='Source alert withdrawn.',updated_at_utc=?
            WHERE community_id=? AND object_type='alert' AND object_id=? AND status IN ('pending','failed')`).run(input.atUtc, input.communityId, alertId);
          captureSharedAlertChange(new SharedAlertsRepository(this.database, () => input.atUtc), { alertId, kind: input.status === "archived" ? "withdrawal" : "correction", actorUserId: input.actorUserId, atUtc: input.atUtc });
        }
      }
      return Object.freeze(current);
    }).immediate();
  }

  private recordRevision(alert: SharedSourceAlert, actorUserId: string, atUtc: string, original: boolean): void {
    if (!alert.publishedAtUtc) return;
    const content = JSON.stringify({ title: alert.title, symbol: alert.symbol, body: alert.body, slug: alert.slug, publishingMode: alert.publishingMode, publishedAtUtc: alert.publishedAtUtc, status: alert.status });
    const hash = createHash("sha256").update(content).digest("hex");
    const last = this.database.prepare(`SELECT content_hash FROM traderlink_community_publication_revisions WHERE community_id=? AND object_type='alert' AND object_id=? ORDER BY rowid DESC LIMIT 1`).get(alert.communityId, alert.alertId) as { content_hash: string } | undefined;
    if (last?.content_hash === hash) return;
    this.database.prepare(`INSERT INTO traderlink_community_publication_revisions(revision_id,community_id,object_type,object_id,evidence_kind,actor_user_id,content_json,content_hash,original_published_at_utc,recorded_at_utc,change_summary)
      VALUES(?,?,'alert',?,?,?,?,?,?,?,'')`).run(createCanonicalUuidV4(), alert.communityId, alert.alertId, last ? "revision" : original ? "original" : "legacy_baseline", actorUserId, content, hash, alert.publishedAtUtc, atUtc);
  }

  private queueOriginal(alert: SharedSourceAlert, publisherUserId: string, atUtc: string): void {
    const intent = this.policy.intent(alert.communityId, "alert", alert.alertId);
    if (intent?.distribution !== "discord") return;
    for (const destinationId of intent.destinationIds) {
      this.policy.assertDelivery(alert.communityId, publisherUserId, destinationId, "alerts", atUtc);
      this.database.prepare(`INSERT INTO traderlink_community_content_deliveries(delivery_id,community_id,object_type,object_id,destination_id,status,attempt_count,requested_at_utc,updated_at_utc,publisher_user_id)
        VALUES(?,?,'alert',?,?,'pending',0,?,?,?) ON CONFLICT DO NOTHING`)
        .run(createCanonicalUuidV4(), alert.communityId, alert.alertId, destinationId, atUtc, atUtc, publisherUserId);
    }
  }
}
