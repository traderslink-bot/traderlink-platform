import { PartnerAlertValidationError } from "../contracts/partner-alert-contracts";
import { parsePartnerAlertContentPolicy, parsePartnerAlertRequestedContentPolicy,
  partnerAlertId, partnerAlertInteger, partnerAlertRef, partnerAlertSnowflake,
  partnerAlertText } from "../contracts/partner-alert-validation";

export function partnerAlertDraftCommandPayload(input: Readonly<{
  expectedRevision: number; displayName: string; contentPolicy: unknown;
  outputBotUserId: string; outputConfigurationRef: string;
}>) {
  const requested = parsePartnerAlertRequestedContentPolicy(input.contentPolicy);
  return Object.freeze({
    expected: partnerAlertInteger(input.expectedRevision, "expectedRevision"),
    displayName: partnerAlertText(input.displayName, "displayName"),
    policy: parsePartnerAlertContentPolicy({ ...requested,
      mirrorBotUserId: partnerAlertSnowflake(input.outputBotUserId, "outputBotUserId") }),
    outputConfigurationRef: partnerAlertRef(input.outputConfigurationRef, "outputConfigurationRef"),
  });
}

/** One canonical stored/replay fingerprint serializer. Payload construction
 * remains explicit per command; this function supplies no defaults or authority. */
export function partnerAlertCommandFingerprint(action: string, communityId: string, payload: unknown): string {
  if (typeof action !== "string" || !/^[a-z]+(?:\.[a-z_]+)+$/u.test(action)) {
    throw new PartnerAlertValidationError("commandFingerprint");
  }
  const fingerprint = JSON.stringify({ action, communityId: partnerAlertId(communityId, "communityId"), payload });
  if (fingerprint.length > 64_000) throw new PartnerAlertValidationError("request");
  return fingerprint;
}
