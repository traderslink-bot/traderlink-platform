import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";
import { membershipPlanEditorSchema, duplicateMembershipPlan, type MembershipPlanEditor } from "../../contracts/membership-plan-editor";
import { createCanonicalUuidV4, assertCanonicalUtcTimestamp, assertCanonicalUuidV4 } from "../database/platform-migration-contract";
import { readMembershipPlanEditor } from "./membership-plan-editor-read";

export class MembershipEditorConflict extends Error {}
export type MembershipEditorDraft = { draftId: string; revision: number; document: MembershipPlanEditor };
export type MembershipEditorOpened = { draftId: string | null; revision: number | null; document: MembershipPlanEditor };

/** Caller must hold the existing Journal Administration scope. No network work. */
export class MembershipPlanEditorDrafts {
  constructor(private readonly db: Database.Database) {}

  private audit(actor: string, action: string, target: string, at: string) {
    this.db.prepare(`INSERT INTO platform_membership_audit_events
      (audit_event_id,actor_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
      VALUES (?,?,?,'plan_editor',?,'{}',?)`).run(createCanonicalUuidV4(), actor, action, target, at);
  }

  read(draftId: string): MembershipEditorDraft {
    assertCanonicalUuidV4(draftId, "draftId");
    const row = this.db.prepare("SELECT document_json,revision FROM platform_membership_editor_drafts WHERE draft_id=? AND status='editing'").get(draftId) as
      { document_json: string; revision: number } | undefined;
    if (!row) throw new MembershipEditorConflict("This draft is no longer available. Reopen the plan.");
    return { draftId, revision: row.revision, document: membershipPlanEditorSchema.parse(JSON.parse(row.document_json)) };
  }

  /** Opening a plan does not save changes or create an empty draft. */
  open(actor: string, planId: string, at: string): MembershipEditorOpened {
    assertCanonicalUuidV4(actor, "actor"); assertCanonicalUuidV4(planId, "planId"); assertCanonicalUtcTimestamp(at, "at");
    return this.db.transaction(() => {
      const current = this.db.prepare("SELECT draft_id FROM platform_membership_editor_drafts WHERE plan_id=? AND status='editing'").get(planId) as { draft_id: string } | undefined;
      if (current) return this.read(current.draft_id);
      return { draftId: null, revision: null, document: readMembershipPlanEditor(this.db, planId) };
    }).immediate();
  }

  private insert(actor: string, document: MembershipPlanEditor, at: string): MembershipEditorDraft {
    const draftId = createCanonicalUuidV4();
    this.db.prepare(`INSERT INTO platform_membership_editor_drafts
      (draft_id,plan_id,document_json,revision,status,created_by_user_id,created_at_utc,updated_at_utc)
      VALUES (?,?,?,1,'editing',?,?,?)`).run(draftId, document.planId, JSON.stringify(document), actor, at, at);
    this.audit(actor, "plan_editor.created", draftId, at);
    return { draftId, revision: 1, document };
  }

  /** Transactional receipt prevents duplicate new drafts on response-loss retry. */
  save(actor: string, requestId: string, documentInput: unknown, draftId: string | null, expectedRevision: number | null, at: string): MembershipEditorDraft {
    assertCanonicalUuidV4(actor, "actor"); assertCanonicalUuidV4(requestId, "requestId"); assertCanonicalUtcTimestamp(at, "at");
    const document = membershipPlanEditorSchema.parse(documentInput);
    const payload = createHash("sha256").update(JSON.stringify({ operation: "save", document, draftId, expectedRevision })).digest("hex");
    return this.db.transaction(() => {
      const receipt = this.db.prepare("SELECT payload_sha256,result_json FROM platform_membership_editor_receipts WHERE actor_user_id=? AND request_id=?").get(actor, requestId) as
        { payload_sha256: string; result_json: string } | undefined;
      if (receipt) {
        if (receipt.payload_sha256 !== payload) throw new MembershipEditorConflict("This request has changed. Reopen the plan before saving.");
        return JSON.parse(receipt.result_json) as MembershipEditorDraft;
      }
      let result: MembershipEditorDraft;
      if (draftId) {
        assertCanonicalUuidV4(draftId, "draftId");
        z.number().int().positive().parse(expectedRevision);
        const current = this.read(draftId);
        if (current.document.planId !== document.planId || current.document.baseRevision !== document.baseRevision) throw new MembershipEditorConflict("The plan identity changed. Reopen the plan.");
        const saved = this.db.prepare(`UPDATE platform_membership_editor_drafts SET document_json=?,revision=revision+1,updated_at_utc=?
          WHERE draft_id=? AND revision=? AND status='editing'`).run(JSON.stringify(document), at, draftId, expectedRevision);
        if (saved.changes !== 1) throw new MembershipEditorConflict("Another save changed this plan. Reopen it before saving your changes.");
        this.audit(actor, "plan_editor.saved", draftId, at);
        result = { draftId, revision: expectedRevision! + 1, document };
      } else {
        if (expectedRevision !== null) throw new MembershipEditorConflict("The draft identity changed. Reopen the plan.");
        if (document.planId) {
          if (this.db.prepare("SELECT 1 FROM platform_membership_editor_drafts WHERE plan_id=? AND status='editing'").get(document.planId)) {
            throw new MembershipEditorConflict("Another save created draft changes for this plan. Reopen it before saving.");
          }
          if (readMembershipPlanEditor(this.db, document.planId).baseRevision !== document.baseRevision) {
            throw new MembershipEditorConflict("The plan changed after you opened it. Reopen it before saving.");
          }
        } else if (document.baseRevision) throw new MembershipEditorConflict("The new plan contains an existing revision. Reopen it before saving.");
        result = this.insert(actor, document, at);
      }
      this.db.prepare("INSERT INTO platform_membership_editor_receipts VALUES (?,?,?,?,?)").run(actor, requestId, payload, JSON.stringify(result), at);
      return result;
    }).immediate();
  }

  duplicate(actor: string, source: MembershipPlanEditor, requestId: string, at: string) {
    // Stable derived IDs make duplicate requests identical on network retries.
    let sequence = 0;
    const makeId = () => {
      const hex = createHash("sha256").update(`${requestId}:${sequence++}`).digest("hex");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    };
    return this.save(actor, requestId, duplicateMembershipPlan(membershipPlanEditorSchema.parse(source), makeId), null, null, at);
  }

  discard(actor: string, draftId: string, revision: number, at: string) {
    assertCanonicalUuidV4(actor, "actor"); assertCanonicalUuidV4(draftId, "draftId"); assertCanonicalUtcTimestamp(at, "at");
    z.number().int().positive().parse(revision);
    return this.db.transaction(() => {
      const row = this.db.prepare("SELECT status,revision,plan_id FROM platform_membership_editor_drafts WHERE draft_id=?").get(draftId) as { status: string; revision: number; plan_id: string | null } | undefined;
      if (row?.status === "discarded" && row.revision === revision + 1) return;
      const result = this.db.prepare("UPDATE platform_membership_editor_drafts SET status='discarded',revision=revision+1,updated_at_utc=? WHERE draft_id=? AND revision=? AND status='editing'").run(at, draftId, revision);
      if (result.changes !== 1) throw new MembershipEditorConflict("This draft has changed. Reopen the plan before deleting it.");
      if (row?.plan_id && !this.db.prepare("SELECT 1 FROM platform_membership_plan_versions WHERE plan_id=? AND published_at_utc IS NOT NULL").get(row.plan_id)) {
        this.retireUnpublishedPlan(actor, row.plan_id, at);
      }
      this.audit(actor, "plan_editor.discarded", draftId, at);
    }).immediate();
  }

  /** Old UI drafts remain deletable without deleting their historical records. */
  discardLegacy(actor: string, planId: string, baseRevision: string, at: string) {
    assertCanonicalUuidV4(actor, "actor"); assertCanonicalUuidV4(planId, "planId"); assertCanonicalUtcTimestamp(at, "at");
    return this.db.transaction(() => {
      if (this.db.prepare("SELECT 1 FROM platform_membership_audit_events WHERE action='plan_editor.legacy_draft_deleted' AND target_type='plan_editor' AND target_id=?").get(planId)) return;
      if (this.db.prepare("SELECT 1 FROM platform_membership_editor_drafts WHERE plan_id=? AND status='editing'").get(planId)
        || readMembershipPlanEditor(this.db, planId).baseRevision !== baseRevision) {
        throw new MembershipEditorConflict("This draft has changed. Refresh the list before deleting it.");
      }
      this.retireUnpublishedPlan(actor, planId, at);
    }).immediate();
  }

  private retireUnpublishedPlan(actor: string, planId: string, at: string) {
    if (this.db.prepare("SELECT 1 FROM platform_membership_plan_versions WHERE plan_id=? AND published_at_utc IS NOT NULL").get(planId)
      || this.db.prepare(`SELECT 1 FROM platform_membership_entitlements e JOIN platform_membership_plan_versions v
        ON v.plan_version_id=e.plan_version_id WHERE v.plan_id=?`).get(planId)) {
      throw new MembershipEditorConflict("This plan has published history or member access. Delete only its saved draft changes.");
    }
    this.db.prepare("UPDATE platform_membership_plans SET status='retired',updated_at_utc=? WHERE plan_id=?").run(at, planId);
    this.audit(actor, "plan_editor.legacy_draft_deleted", planId, at);
  }
}
