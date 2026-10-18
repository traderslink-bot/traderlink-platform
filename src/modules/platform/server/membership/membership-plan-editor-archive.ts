import type Database from "better-sqlite3";
import { assertCanonicalUuidV4, assertCanonicalUtcTimestamp, createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { readMembershipPlanEditor } from "./membership-plan-editor-read";
import { MembershipEditorConflict } from "./membership-plan-editor-drafts";
import { applyMembershipPlanMembers, snapshotMembershipPlanMembers } from "./membership-plan-member-write";

/** Stop enrollment without revoking independent or grandfathered memberships. */
export function archiveMembershipPlan(db: Database.Database, actor: string, plan: string, at: string): void {
  assertCanonicalUuidV4(actor, "actor"); assertCanonicalUuidV4(plan, "plan"); assertCanonicalUtcTimestamp(at, "at");
  db.transaction(() => {
    const row = db.prepare("SELECT status FROM platform_membership_plans WHERE plan_id=?").get(plan) as { status: string } | undefined;
    if (!row) throw new MembershipEditorConflict("This plan no longer exists.");
    if (row.status === "retired") return;
    if (!db.prepare("SELECT 1 FROM platform_membership_plan_versions WHERE plan_id=? AND lifecycle_state='published'").get(plan)) {
      throw new MembershipEditorConflict("Use Delete draft to remove an unpublished plan.");
    }
    readMembershipPlanEditor(db, plan);
    const members = snapshotMembershipPlanMembers(db, plan, at);
    applyMembershipPlanMembers(db, plan, "", false, members, at);
    db.prepare("UPDATE platform_membership_plans SET status='retired',updated_at_utc=? WHERE plan_id=?").run(at, plan);
    db.prepare(`UPDATE platform_membership_offers SET status='paused',updated_at_utc=? WHERE status='active'
      AND plan_version_id IN (SELECT plan_version_id FROM platform_membership_plan_versions WHERE plan_id=?)`).run(at, plan);
    db.prepare(`INSERT INTO platform_membership_audit_events
      (audit_event_id,actor_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
      VALUES (?,?,'plan_editor.archived','plan',?,'{"existingAccessPreserved":true}',?)`).run(createCanonicalUuidV4(), actor, plan, at);
  }).immediate();
}

/** Delete from the owner's catalog while retaining immutable billing/member history. */
export function deleteMembershipPlan(db: Database.Database, actor: string, plan: string, at: string): void {
  assertCanonicalUuidV4(actor, "actor"); assertCanonicalUuidV4(plan, "plan"); assertCanonicalUtcTimestamp(at, "at");
  db.transaction(() => {
    if (db.prepare("SELECT 1 FROM platform_membership_audit_events WHERE action='plan_editor.deleted' AND target_type='plan' AND target_id=?").get(plan)) return;
    archiveMembershipPlan(db, actor, plan, at);
    db.prepare("UPDATE platform_membership_editor_drafts SET status='discarded',revision=revision+1,updated_at_utc=? WHERE plan_id=? AND status='editing'").run(at, plan);
    db.prepare(`INSERT INTO platform_membership_audit_events
      (audit_event_id,actor_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
      VALUES (?,?,'plan_editor.deleted','plan',?,'{"existingAccessPreserved":true,"historyPreserved":true}',?)`).run(createCanonicalUuidV4(), actor, plan, at);
  }).immediate();
}
