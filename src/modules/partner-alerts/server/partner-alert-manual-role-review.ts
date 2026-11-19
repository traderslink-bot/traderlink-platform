import { PartnerAlertValidationError, type PartnerAlertOffer } from "../contracts/partner-alert-contracts";
import { partnerAlertExactKeys, partnerAlertId, partnerAlertRecord, partnerAlertText } from "../contracts/partner-alert-validation";
import type { PartnerAlertRoleTransport } from "./partner-alert-role-worker";

export function parsePartnerAlertRoleReview(value: unknown) {
  const row = partnerAlertRecord(value, "roleReview");
  partnerAlertExactKeys(row, ["communityId", "eventId", "mappingId", "membershipId", "decision", "evidenceNote"], "roleReview");
  if (typeof row.eventId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/u.test(row.eventId)
    || typeof row.membershipId !== "string" || !/^mem_[A-Za-z0-9_]{1,124}$/u.test(row.membershipId)
    || (row.decision !== "retain" && row.decision !== "needs_evidence" && row.decision !== "remove")) {
    throw new PartnerAlertValidationError("roleReview");
  }
  return { communityId: partnerAlertId(row.communityId, "communityId"), eventId: row.eventId,
    mappingId: partnerAlertId(row.mappingId, "mappingId"), membershipId: row.membershipId,
    decision: row.decision, evidenceNote: partnerAlertText(row.evidenceNote, "evidenceNote", 500) } as const;
}

export type PartnerAlertRoleReview = ReturnType<typeof parsePartnerAlertRoleReview>;
export type PartnerAlertReviewAssignment = Readonly<{
  environment: "live" | "sandbox"; accountId: string; eventId: string; eventHash: string; resourceKind: string; resourceId: string;
  communityId: string; mappingId: string; sourceGuildId: string; sourceChannelId: string;
  guildId: string; channelId: string; roleId: string; discordUserId: string;
  userId: string; assignmentRef: string; revision: number; authorityKey: string;
  offerId: string; offerVersion: number; offer: PartnerAlertOffer;
}>;

export async function removeReviewedPartnerAlertRole(input: Readonly<{
  assignment: PartnerAlertReviewAssignment;
  operationId: string;
  transport: PartnerAlertRoleTransport;
  stillCurrent: () => boolean;
}>) {
  const { mappingId, guildId, roleId, discordUserId, authorityKey } = input.assignment;
  if (!await input.transport.verifyManagedRole({ mappingId, guildId, roleId, adding: false })) return false;
  const result = await input.transport.setRole({ mappingId, guildId, roleId, discordUserId, authorityKey,
    operationId: input.operationId, present: false, stillCurrent: input.stillCurrent });
  return result.kind === "confirmed" && !result.present && result.guildId === guildId
    && result.discordUserId === discordUserId && result.roleId === roleId;
}
