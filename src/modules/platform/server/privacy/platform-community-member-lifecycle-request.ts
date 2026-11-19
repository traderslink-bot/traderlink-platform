import "server-only";
import type Database from "better-sqlite3";
import { requirePlatformMutationRequest } from "../authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "../authentication/require-platform-request-scope";
import { resolveTraderLinkDiscordGuildId } from "../authentication/platform-discord-configuration";
import { currentPlatformErasureAdmission, type PlatformErasureAdmission } from "./platform-erasure-admission";
import { bootstrapStripeErasureWorker } from "./platform-stripe-erasure-worker-bootstrap";
import { readPartnerAlertStripeErasureWorkerInputs } from "../../../partner-alerts/server/partner-alert-stripe-erasure-worker-input";

const held = (): never => { throw new Error("community_member_lifecycle_unavailable"); };
const reference = /^[A-Za-z0-9_:-]{1,160}$/u;

/** Server-owned, existing ACTIVE policy only. A request never chooses a policy,
 * creates an offer, grants Premium, installs a profile or resolves ambiguity. */
function selectedPolicyRef(database: Database.Database, environment: NodeJS.ProcessEnv): string {
  const configured = environment.TRADERLINK_COMMUNITY_PREMIUM_POLICY_REF?.trim();
  if (configured && !reference.test(configured)) return held();
  const policies = database.prepare(`SELECT policy_ref FROM platform_premium_authority_policies
    WHERE state='active' AND guild_id=?`).all(resolveTraderLinkDiscordGuildId(environment)) as { policy_ref: string }[];
  const selected = configured ? policies.filter(row => row.policy_ref === configured) : policies;
  if (selected.length !== 1 || !reference.test(selected[0]!.policy_ref)) return held();
  return selected[0]!.policy_ref;
}
export function resolveCommunityMemberLifecycleConfiguration(database: Database.Database,
  environment: NodeJS.ProcessEnv = process.env): Readonly<{ policyRef: string; profileRef: string }> {
  const input = readPartnerAlertStripeErasureWorkerInputs(database, environment);
  if (!input || !("releaseFormat" in input) || input.releaseFormat !== "v5"
    || !("erasureProfileRef" in input) || typeof input.erasureProfileRef !== "string") return held();
  input.assertCurrentRelease();
  return Object.freeze({ policyRef: selectedPolicyRef(database, environment), profileRef: input.erasureProfileRef });
}

/** NEW request adapter proposal, outside frozen fc6. Caller fetches genuine bot
 * observations before entry; operation is synchronous on this exact connection.
 * OAuth sign-in succeeds independently; first normal session POST admits self. */
export function withAdmittedCommunityMemberRequest<T>(input: Readonly<{
  database: Database.Database; request: Request; environment: NodeJS.ProcessEnv;
  policyRef: string; profileRef: string; mode: "ensure" | "readmit";
  operation: (context: Readonly<{ userId: string; database: Database.Database; core: PlatformErasureAdmission }>) => T;
}>): T {
  requirePlatformMutationRequest(input.request);
  const { database, environment, request } = input;
  if (request.method !== "POST" || !database.open || database.readonly || database.inTransaction
    || !["ensure", "readmit"].includes(input.mode)) return held();
  const config = resolveCommunityMemberLifecycleConfiguration(database, environment);
  const reviewed = readPartnerAlertStripeErasureWorkerInputs(database, environment);
  if (!reviewed) return held();
  if (input.policyRef !== config.policyRef || input.profileRef !== config.profileRef) return held();
  if (!currentPlatformErasureAdmission(database)) bootstrapStripeErasureWorker(database);
  const core = currentPlatformErasureAdmission(database);
  if (!core || core.qualificationReceipt().profileCatalogSha256 !== environment.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256) return held();
  const resolve = () => requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers, {
    databasePath: database.name, environment,
  });
  const identity = resolve();
  if (identity.mode !== "platform_session" || !identity.sessionId) return held();
  const binding = JSON.stringify(identity);
  return core.withRequestAuditFrame(request, environment, () => {
    core.attachRequestPrincipal(identity, () => {
      if (request.signal.aborted || JSON.stringify(resolve()) !== binding) return held();
    });
    return database.transaction(() => {
      core.profile(config.profileRef);
      const life = database.prepare(`SELECT phase,operation_ref FROM platform_erasure_lifecycles WHERE user_id=?`)
        .get(identity.scope.userId) as { phase: string; operation_ref: string | null } | undefined;
      if (!life) {
        if (input.mode !== "ensure") return held();
        core.onboardMember(config.policyRef, config.profileRef);
      } else {
        if (life.phase !== "live" || life.operation_ref !== null) return held();
        if (input.mode === "readmit") core.readmitMember(config.profileRef);
      }
      core.assertLivePrincipal(identity.scope.userId);
      return core.runForUsers([identity.scope.userId], () => {
        // The canonical reader refuses an inTransaction construction. Capture
        // it before the writer, then use its existing current-release validator
        // and pure same-handle policy/profile reads inside the transaction.
        reviewed.assertCurrentRelease();
        if (selectedPolicyRef(database, environment) !== config.policyRef) return held();
        core.profile(config.profileRef);
        const result = input.operation({ userId: identity.scope.userId, database, core });
        if (result !== null && (typeof result === "object" || typeof result === "function") && "then" in result) return held();
        return result;
      });
    }).immediate();
  });
}
