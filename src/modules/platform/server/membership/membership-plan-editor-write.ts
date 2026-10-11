import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";
import { membershipPlanEditorSchema, type MembershipPlanSaveRequest, type MembershipPlanSaveResult } from "../../contracts/membership-plan-editor";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { MembershipEditorConflict, MembershipPlanEditorDrafts } from "./membership-plan-editor-drafts";
import { prepareMembershipPlanPublication } from "./membership-plan-editor-projection";
import { insertMembershipPlanCommercialTerms } from "./membership-plan-editor-commercial-write";
import { snapshotMembershipPlanMembers, applyMembershipPlanMembers } from "./membership-plan-member-write";
import { membershipUsageAnchor } from "./membership-plan-usage";
import { PlatformMembershipRepository } from "./platform-membership-repository";

const requestSchema = z.object({ requestId: z.uuid(), draftId: z.uuid().nullable(), revision: z.number().int().positive().nullable(),
  document: membershipPlanEditorSchema, intent: z.enum(["save", "publish"]), applyToMembers: z.boolean() }).strict();

/** Owner authorization is required at the server action. This entire command is a
 * single SQLite transaction; no provider, email, Discord or AI call is made. */
export function writeMembershipPlanEditor(db: Database.Database, actor: string, request: MembershipPlanSaveRequest, at: string): MembershipPlanSaveResult {
  assertCanonicalUuidV4(actor, "actor"); assertCanonicalUtcTimestamp(at, "at");
  const input = requestSchema.parse(request);
  const drafts = new MembershipPlanEditorDrafts(db);
  if (input.intent === "save") {
    const saved = drafts.save(actor, input.requestId, input.document, input.draftId, input.revision, at);
    return { draftId: saved.draftId, revision: saved.revision, message: "Draft saved. The published plan and existing members are unchanged." };
  }
  const payload = createHash("sha256").update(JSON.stringify({ operation: "publish", ...input })).digest("hex");
  return db.transaction(() => {
    const receipt = db.prepare("SELECT payload_sha256,result_json FROM platform_membership_editor_receipts WHERE actor_user_id=? AND request_id=?")
      .get(actor, input.requestId) as { payload_sha256: string; result_json: string } | undefined;
    if (receipt) {
      if (receipt.payload_sha256 !== payload) throw new MembershipEditorConflict("This request has changed. Reopen the plan before publishing.");
      return JSON.parse(receipt.result_json) as MembershipPlanSaveResult;
    }
    if (input.draftId) {
      const draft = drafts.read(input.draftId);
      if (draft.revision !== input.revision || draft.document.planId !== input.document.planId || draft.document.baseRevision !== input.document.baseRevision) {
        throw new MembershipEditorConflict("Another save changed this draft. Reopen the plan before publishing.");
      }
    } else if (input.revision !== null || (input.document.planId && db.prepare("SELECT 1 FROM platform_membership_editor_drafts WHERE plan_id=? AND status='editing'").get(input.document.planId))) {
      throw new MembershipEditorConflict("Another save created draft changes. Reopen the plan before publishing.");
    }
    new PlatformMembershipRepository(db).synchronizeBuiltInFeatures(actor, at);
    // Free access is always available; it needs no external provider connection.
    db.prepare(`INSERT OR IGNORE INTO platform_membership_provider_definitions
      (provider_key,label,integration_mode,configuration_state,created_by_user_id,created_at_utc,updated_at_utc)
      VALUES ('free','Free','free','ready',?,?,?)`).run(actor, at, at);
    const projection = prepareMembershipPlanPublication(db, input.document);
    const previous = input.document.planId ? db.prepare(`SELECT plan_version_id,published_at_utc FROM platform_membership_plan_versions
      WHERE plan_id=? AND lifecycle_state='published' ORDER BY version_number DESC LIMIT 1`).get(projection.planId) as
        { plan_version_id: string; published_at_utc: string } | undefined : undefined;
    const members = input.document.planId ? snapshotMembershipPlanMembers(db, projection.planId, at) : { direct: [], discord: [] };
    if (!input.document.planId) db.prepare(`INSERT INTO platform_membership_plans
      (plan_id,plan_key,name,internal_note,status,visibility,created_by_user_id,created_at_utc,updated_at_utc)
      VALUES (?,?,?,?,'active',?,?,?,?)`).run(projection.planId, `plan_${projection.planId.replaceAll("-", "")}`, projection.document.name,
        projection.document.internalNote, projection.document.visibility, actor, at, at);
    else db.prepare("UPDATE platform_membership_plans SET name=?,internal_note=?,visibility=?,status='active',updated_at_utc=? WHERE plan_id=?")
      .run(projection.document.name, projection.document.internalNote, projection.document.visibility, at, projection.planId);
    db.prepare(`INSERT INTO platform_membership_plan_versions
      (plan_version_id,plan_id,version_number,public_description,lifecycle_state,published_at_utc,created_by_user_id,created_at_utc)
      SELECT ?,?,COALESCE(MAX(version_number),0)+1,?,'draft',NULL,?,? FROM platform_membership_plan_versions WHERE plan_id=?`)
      .run(projection.versionId, projection.planId, projection.document.description, actor, at, projection.planId);
    for (const feature of projection.features) {
      db.prepare(`INSERT INTO platform_membership_plan_features(plan_version_id,feature_key,feature_kind,limit_value,reset_days)
        VALUES (?,?,?,?,?)`).run(projection.versionId, feature.key, feature.kind, feature.limit, feature.resetDays);
      const anchor = previous ? membershipUsageAnchor(db, previous.plan_version_id, feature.key, previous.published_at_utc) : at;
      db.prepare("INSERT INTO platform_membership_feature_usage_anchors VALUES (?,?,?)").run(projection.versionId, feature.key, anchor);
      if (feature.period && feature.key.startsWith("private_watchlist.")) db.prepare(`INSERT INTO platform_private_watchlist_plan_periods
        (plan_version_id,meter,period_kind,period_days) VALUES (?,?,?,?)`).run(projection.versionId,
          feature.key.slice("private_watchlist.".length), feature.period.kind, feature.period.kind === "days" ? feature.period.days : null);
    }
    // Period guards intentionally require a draft. Publish only after the entire
    // feature configuration has been written, within this same transaction.
    db.prepare("UPDATE platform_membership_plan_versions SET lifecycle_state='published',published_at_utc=? WHERE plan_version_id=?")
      .run(at, projection.versionId);
    insertMembershipPlanCommercialTerms(db, projection, actor, at);
    const updated = applyMembershipPlanMembers(db, projection.planId, projection.versionId, input.applyToMembers, members, at);
    // Historical terms remain immutable for renewals and in-flight confirmations.
    // Pausing only removes the old options from new enrollment.
    db.prepare(`UPDATE platform_membership_offers SET status='paused',updated_at_utc=? WHERE status='active'
      AND plan_version_id IN (SELECT plan_version_id FROM platform_membership_plan_versions WHERE plan_id=? AND plan_version_id<>?)`)
      .run(at, projection.planId, projection.versionId);
    db.prepare(`DELETE FROM platform_membership_share_link_offers WHERE offer_id IN
      (SELECT o.offer_id FROM platform_membership_offers o JOIN platform_membership_plan_versions v USING(plan_version_id) WHERE v.plan_id=?)`).run(projection.planId);
    db.prepare("DELETE FROM platform_membership_page_plans WHERE plan_id=?").run(projection.planId);
    for (const page of projection.document.privatePageIds) {
      db.prepare("INSERT INTO platform_membership_page_plans VALUES (?,?)").run(page, projection.planId);
      for (const price of projection.prices) db.prepare("INSERT INTO platform_membership_share_link_offers(share_link_id,offer_id) VALUES (?,?)").run(page, price.id);
    }
    db.prepare("INSERT INTO platform_membership_plan_presentations VALUES (?,?,?)")
      .run(projection.versionId, JSON.stringify(projection.document), projection.document.displayOnly ? 1 : 0);
    if (input.draftId) db.prepare("UPDATE platform_membership_editor_drafts SET status='published',plan_id=?,revision=revision+1,updated_at_utc=? WHERE draft_id=?")
      .run(projection.planId, at, input.draftId);
    db.prepare(`INSERT INTO platform_membership_audit_events
      (audit_event_id,actor_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
      VALUES (?,?,'plan_editor.published','plan',?,?,?)`).run(createCanonicalUuidV4(), actor, projection.planId,
        JSON.stringify({ versionId: projection.versionId, applyToMembers: input.applyToMembers, updatedMembers: updated }), at);
    const result: MembershipPlanSaveResult = { message: input.applyToMembers ? `Plan published. Updated access for ${updated} existing members; billing and expiry dates are unchanged.` : "Plan published. Existing members keep their current access." };
    db.prepare("INSERT INTO platform_membership_editor_receipts VALUES (?,?,?,?,?)").run(actor, input.requestId, payload, JSON.stringify(result), at);
    return result;
  }).immediate();
}
