import type Database from "better-sqlite3";
import { PartnerAlertErasureRecovery } from "../../../partner-alerts/server/partner-alert-erasure-recovery";
import { currentPartnerAlertErasureRuntime } from "../../../partner-alerts/server/partner-alert-erasure-runtime";
import { currentPlatformErasureAdmission, erasureHold, hasPlatformErasureModules } from "./platform-erasure-admission";

/** Fixed actual participant composition. Table presence only selects legacy vs
 * required admission. A partial installation always fails closed. */
export function platformErasureParticipants(database: Database.Database) {
  if (!hasPlatformErasureModules(database)) return null;
  const core = currentPlatformErasureAdmission(database);
  if (!core) return erasureHold();
  const partner = new PartnerAlertErasureRecovery(database, core,currentPartnerAlertErasureRuntime(database));
  return Object.freeze({ core, partner });
}

/** Recovery aggregation is independent of Journal file cleanup. Old installations
 * without module operations keep their existing Journal/demo behavior. */
export function platformModuleErasurePending(database: Database.Database, operationRef: string): boolean {
  if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_erasure_module_operations'").get()) return false;
  return Boolean(database.prepare("SELECT 1 FROM platform_erasure_module_operations WHERE operation_ref=? AND phase!='complete'").get(operationRef));
}

export function completePlatformModuleErasure(database: Database.Database, operationRef: string): void {
  if (!database.inTransaction) return erasureHold();
  if (!platformModuleErasurePending(database, operationRef)) return;
  const operation = database.prepare(`SELECT lifecycle_ref,phase FROM platform_erasure_module_operations WHERE operation_ref=?`)
    .get(operationRef) as { lifecycle_ref: string; phase: string } | undefined;
  if (operation?.phase !== "logical_deleted") return erasureHold();
  const participants=platformErasureParticipants(database);
  if(!participants)return erasureHold();
  participants.partner.afterLogicalDelete(operationRef);
  if(database.prepare("SELECT 1 FROM platform_erasure_operation_claims WHERE operation_ref=? LIMIT 1").get(operationRef))return erasureHold();
  const now = new Date().toISOString();
  database.prepare(`UPDATE platform_erasure_lifecycles SET phase='complete',generation=generation+1 WHERE lifecycle_ref=? AND phase='logical_deleted'`)
    .run(operation.lifecycle_ref);
  database.prepare("UPDATE platform_erasure_module_operations SET phase='complete',completed_at_utc=? WHERE operation_ref=?")
    .run(now, operationRef);
  database.prepare(`INSERT INTO platform_erasure_lifecycle_events
    SELECT lower(hex(randomblob(16))),lifecycle_ref,generation,'complete',operation_ref,? FROM platform_erasure_lifecycles WHERE lifecycle_ref=?`)
    .run(now, operation.lifecycle_ref);
}
