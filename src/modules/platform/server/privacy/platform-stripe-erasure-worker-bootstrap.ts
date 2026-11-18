import { assertCommunityReviewDiscordGuild } from "../../../communities/server/community-review-discord-guild";
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
  const v5 = "releaseFormat" in input && input.releaseFormat === "v5";
  if (v5 && (!("erasureProfileRef" in input) || typeof input.erasureProfileRef !== "string" ||
    !("effectMode" in input) || !["discord_roles", "no_discord_effects"].includes(String(input.effectMode)))) {
    return platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
  }
  const readCurrentConfiguration = () => {
    const configuration = input.readCurrentConfiguration();
    if (v5 && "effectMode" in input &&
      (input.effectMode === "no_discord_effects" ? configuration !== null : configuration === null)) {
      return platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
    }
    if (!configuration) return null;
    for (const binding of configuration.outputBindings) {
      assertCommunityReviewDiscordGuild(binding.sourceGuildId);
      assertCommunityReviewDiscordGuild(binding.destinationGuildId);
    }
    return configuration;
  };
  readCurrentConfiguration();
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
      input.assertCurrentRelease();
      readCurrentConfiguration();
      if ("erasureProfileRef" in input) {
        if (typeof input.erasureProfileRef !== "string") return platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
        // Pending operations retain their existing admission and retry protocol.
        if (!core.pendingFor(command.scope.userId, command.scope.workspaceId)) {
          core.admitRootErasureCommand(command, input.erasureProfileRef);
        } else if (core.lifecycle(command.scope.userId).profile_ref !== input.erasureProfileRef) {
          return platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
        }
      }
      return await executeStripePreparedErasureCommand(db,store,command,async (ref,fence)=>{
        input.assertCurrentRelease();
        const life=core.lifecycle(command.scope.userId);
        const scope:Extract<StripeErasureRoleProofScope,{mode:"root"}>={mode:"root",operationRef:ref,userId:command.scope.userId,
          workspaceId:command.scope.workspaceId,lifecycleRef:life.lifecycle_ref,erasureGeneration:life.erasure_generation,
          schemaSha256:input.schemaSha256,catalogSha256:input.profileCatalogSha256,
          appliedLedgerSha256:createHash("sha256").update(JSON.stringify(readAppliedPlatformMigrations(db))).digest("hex"),
          writerFenceRef:fence.fenceRef,writerFenceGeneration:fence.generation};
        const runtime=createPartnerAlertStripeErasureRuntime(db,{...input,readCurrentConfiguration,
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
