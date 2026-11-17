import { describe, expect, it } from "vitest";

import { parsePartnerAlertContentPolicy, parsePartnerAlertRequestedContentPolicy } from "../contracts/partner-alert-validation";
import { partnerAlertCommandFingerprint, partnerAlertDraftCommandPayload } from "./partner-alert-command-fingerprint";

const communityId = "11111111-1111-4111-8111-111111111111";
const requested = Object.freeze({ blockedServerNames: Object.freeze(["Synthetic community"]),
  blockedPhrases: Object.freeze([]), authorMode: "all_humans" as const, allowedAuthorIds: Object.freeze([]) });
const input = Object.freeze({ expectedRevision: 0, displayName: "Neutral community", contentPolicy: requested,
  outputBotUserId: "100000000000000001", outputConfigurationRef: "partner_output_v1" });

describe("Partner Channel server-owned output policy", () => {
  it("keeps browser and persisted policy shapes separate", () => {
    expect(parsePartnerAlertRequestedContentPolicy(requested)).toEqual(requested);
    expect(() => parsePartnerAlertRequestedContentPolicy({ ...requested,
      mirrorBotUserId: input.outputBotUserId })).toThrow();
    expect(() => parsePartnerAlertRequestedContentPolicy({ ...requested,
      outputConfigurationRef: input.outputConfigurationRef })).toThrow();
    expect(() => parsePartnerAlertContentPolicy(requested)).toThrow();
  });

  it("constructs the full persisted payload only from trusted output configuration", () => {
    expect(partnerAlertDraftCommandPayload(input)).toEqual({ expected: 0, displayName: "Neutral community",
      policy: { ...requested, mirrorBotUserId: input.outputBotUserId },
      outputConfigurationRef: input.outputConfigurationRef });
  });

  it("keeps exact replay stable and changes the fingerprint when output configuration changes", () => {
    const original = partnerAlertCommandFingerprint("partner.draft_saved", communityId,
      partnerAlertDraftCommandPayload(input));
    const replay = partnerAlertCommandFingerprint("partner.draft_saved", communityId,
      partnerAlertDraftCommandPayload({ ...input }));
    const changedRef = partnerAlertCommandFingerprint("partner.draft_saved", communityId,
      partnerAlertDraftCommandPayload({ ...input, outputConfigurationRef: "partner_output_v2" }));
    const changedBot = partnerAlertCommandFingerprint("partner.draft_saved", communityId,
      partnerAlertDraftCommandPayload({ ...input, outputBotUserId: "100000000000000002" }));
    expect(replay).toBe(original);
    expect(changedRef).not.toBe(original);
    expect(changedBot).not.toBe(original);
  });
});
