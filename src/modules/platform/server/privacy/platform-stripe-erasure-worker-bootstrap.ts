import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { readPartnerAlertStripeErasureWorkerInputs } from "../../../partner-alerts/server/partner-alert-stripe-erasure-worker-input";
import { bindPartnerAlertErasureRuntime } from "../../../partner-alerts/server/partner-alert-erasure-runtime";
import { createPartnerAlertStripeErasureRuntime } from "../../../partner-alerts/server/partner-alert-stripe-erasure-runtime";
import type { StripeErasureRoleProofScope } from "../../../partner-alerts/server/partner-alert-stripe-erasure-role-proof";
import { readAppliedPlatformMigrations } from "../database/platform-migration-registry";
import { PlatformErasureAdmission } from "./platform-erasure-admission";
import { bindStripeErasureRuntime, hasStripeErasureSchema } from "./platform-stripe-erasure-runtime-binding";
import { executeStripePreparedErasureCommand, type ErasureCommand } from "./platform-erasure-command";
import type { ErasureObjectStore } from "./platform-erasure-recovery";
import { platformFailure } from "../database/platform-migration-contract";

export function bootstrapStripeErasureWorker(db:Database.Database) {
  if (!hasStripeErasureSchema(db)) return null;
  const input=readPartnerAlertStripeErasureWorkerInputs(db);
  if (!input) return platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
  const core=PlatformErasureAdmission.bind(db,{nowUtc:input.nowUtc,maximumAdmissionMs:30000,
    profileCatalogSha256:input.profileCatalogSha256,participantStatements:[]});
  bindPartnerAlertErasureRuntime(db,input.erasureRuntime);
  let dispatch: ReturnType<Parameters<typeof bindStripeErasureRuntime>[1]["readDispatch"]> = null;
  bindStripeErasureRuntime(db,{...input,readDispatch:(ref,userId)=>{
    const scope=dispatch?.verification.expectedScope;
    return scope?.operationRef===ref&&scope.userId===userId?dispatch:null;
  }});
  return async (store:ErasureObjectStore,command:ErasureCommand)=>{
    try {
      return await executeStripePreparedErasureCommand(db,store,command,async (ref,fence)=>{
        input.assertCurrentRelease();
        const life=core.lifecycle(command.scope.userId);
        const scope:Extract<StripeErasureRoleProofScope,{mode:"root"}>={mode:"root",operationRef:ref,userId:command.scope.userId,
          workspaceId:command.scope.workspaceId,lifecycleRef:life.lifecycle_ref,erasureGeneration:life.erasure_generation,
          schemaSha256:input.schemaSha256,catalogSha256:input.profileCatalogSha256,
          appliedLedgerSha256:createHash("sha256").update(JSON.stringify(readAppliedPlatformMigrations(db))).digest("hex"),
          writerFenceRef:fence.fenceRef,writerFenceGeneration:fence.generation};
        const runtime=createPartnerAlertStripeErasureRuntime(db,{...input,
          inRootWriter:operation=>core.runStripeRootPreflight(ref,command,fence,operation)});
        const attested=await runtime.prepareRoot(scope,input.roleKeys);
        if (!attested) return false;
        dispatch={verification:{...attested,expectedScope:scope,publicKey:input.roleKeys.publicKey,
          keyId:input.roleKeys.keyId,maximumLifetimeMs:input.roleKeys.maximumLifetimeMs},
          readCurrentEvidence:(facts,now)=>runtime.readRootEvidence(scope,facts,now),
          successorBinding:input.erasureRuntime.binding};
        return true;
      });
    } finally { dispatch=null; }
  };
}
