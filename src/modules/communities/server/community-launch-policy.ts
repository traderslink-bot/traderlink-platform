/** Admission is an operator-configured guild allowlist, never a client field. */
export function approvedCommunityGuildIds(
  configured = process.env.TRADERLINK_COMMUNITY_APPROVED_GUILD_IDS ?? "",
): readonly string[] {
  return [...new Set(configured.split(/[\s,]+/u).filter((id) => /^\d{1,32}$/u.test(id)))];
}

export function isApprovedCommunityGuild(guildId: string): boolean {
  return approvedCommunityGuildIds().includes(guildId);
}

export const COMMUNITY_EVIDENCE_MAX_AGE_MS = 5 * 60 * 1000;

export function isFreshCommunityEvidence(verifiedAtUtc: string | null | undefined, atUtc: string): boolean {
  const verified = Date.parse(verifiedAtUtc ?? "");
  const now = Date.parse(atUtc);
  return Number.isFinite(verified) && Number.isFinite(now)
    && verified <= now && now - verified <= COMMUNITY_EVIDENCE_MAX_AGE_MS;
}
