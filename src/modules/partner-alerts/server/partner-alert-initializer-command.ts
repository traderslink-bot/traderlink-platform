import type Database from "better-sqlite3";
import { requirePlatformMutationRequest } from "../../platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from
  "../../platform/server/authentication/require-platform-request-scope";
import { currentPlatformErasureAdmission, type PlatformErasureAdmission } from
  "../../platform/server/privacy/platform-erasure-admission";
import { assertPaidPartnerPreparedCurrent, type PaidPartnerPreparedInitializer } from "./partner-alert-initializer-request";
import { requirePaidPartnerInitializerQualification } from "./partner-alert-initializer-qualification";

export function executePaidPartnerInitializer(input: Readonly<{ request: Request; database: Database.Database;
  core: PlatformErasureAdmission; environment: NodeJS.ProcessEnv; prepared: PaidPartnerPreparedInitializer;
  now: () => Date }>): void {
  requirePlatformMutationRequest(input.request);
  assertPaidPartnerPreparedCurrent(input.request, input.prepared, input.now().getTime());
  if (!input.database.open || input.database.readonly || input.database.inTransaction
    || currentPlatformErasureAdmission(input.database) !== input.core) throw new Error("partner_initializer_unavailable");
  const qualify = () => requirePaidPartnerInitializerQualification({ database: input.database, core: input.core,
    expectedSchemaSha256: input.prepared.configuration.expectedSchemaSha256,
    expectedProfileCatalogSha256: input.prepared.configuration.profileCatalogSha256 });
  qualify();
  const resolve = () => requireTraderLinkPlatformAuthenticatedRequestIdentity(input.request.headers, {
    databasePath: input.database.name, environment: input.environment, now: input.now });
  const identity = resolve(); if (identity.mode !== "platform_session" || !identity.sessionId) throw new Error("partner_initializer_unauthorized");
  const identityBinding = JSON.stringify(identity);
  input.core.withRequestAuditFrame(input.request, input.environment, () => {
    input.core.attachRequestPrincipal(identity, () => {
      assertPaidPartnerPreparedCurrent(input.request, input.prepared, input.now().getTime());
      if (JSON.stringify(resolve()) !== identityBinding) throw new Error("partner_initializer_unauthorized");
      qualify();
    });
    if (input.prepared.command.kind === "configure_global") {
      input.core.requirePlatformOwner();
      input.core.installProfile({ ...input.prepared.configuration.profile,
        expectedGeneration: input.prepared.command.expectedProfileGeneration });
      input.core.memberRepository().savePolicy(input.prepared.configuration.policy,
        input.prepared.command.expectedPolicyGeneration);
    } else if (input.prepared.command.mode === "onboard") {
      input.core.onboardMember(input.prepared.configuration.policy.policyRef,
        input.prepared.configuration.profile.profileRef);
    } else input.core.readmitMember(input.prepared.configuration.profile.profileRef);
  });
}
