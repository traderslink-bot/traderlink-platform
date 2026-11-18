import "server-only";
import { createHash } from "node:crypto";
import type { CommunityStagingQaTargetPins } from "../../communities/server/community-staging-qa-target";
import { readPartnerAlertIsolatedStaging } from "./partner-alert-isolated-staging";

export type PartnerAlertRequestPremiumConfiguration = Readonly<{
  pins: CommunityStagingQaTargetPins;
  readToken: string;
  fingerprint: string;
}>;

/** Secret parsing only: no native policy, payer, entitlement or effect authority.
 * Merchant and offer IDs deliberately have no environment fallback. */
export function readPartnerAlertRequestPremiumConfiguration(environment: NodeJS.ProcessEnv)
  : PartnerAlertRequestPremiumConfiguration | null {
  const stage = readPartnerAlertIsolatedStaging(environment);
  if (!stage) return null;
  const readToken = environment.PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN;
  if (!readToken || readToken.length > 8192 || /[\u0000-\u0020\u007f]/u.test(readToken)) return null;
  const prefix = "TRADERLINK_PLATFORM_ISOLATED_STAGING_";
  const sourceCommit = environment[prefix + "SOURCE_COMMIT"];
  const sourceVectorSha256 = environment[prefix + "SOURCE_VECTOR_SHA256"];
  const schemaSha256 = environment[prefix + "SCHEMA_SHA256"];
  const buildId = environment[prefix + "BUILD_ID"];
  const artifactSha256 = environment[prefix + "ARTIFACT_SHA256"];
  if (!sourceCommit || !/^[a-f0-9]{40}$/u.test(sourceCommit)
    || [sourceVectorSha256, schemaSha256, artifactSha256].some(value => !value || !/^[a-f0-9]{64}$/u.test(value))
    || !buildId || !/^[A-Za-z0-9_-]{1,200}$/u.test(buildId)) return null;
  const pins: CommunityStagingQaTargetPins = Object.freeze({ origin: stage.origin,sourceCommit,
    sourceVectorSha256: sourceVectorSha256!,schemaSha256: schemaSha256!,buildId,artifactSha256: artifactSha256! });
  return Object.freeze({ pins,readToken,
    fingerprint: createHash("sha256").update(JSON.stringify([stage.fingerprint,pins,readToken])).digest("hex") });
}
