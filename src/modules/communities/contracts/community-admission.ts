/** Community admission facts are separate from connection and commercial entitlements. */
export type CommunityAdmissionStatus = 'legacy_unreviewed' | 'pending' | 'approved' | 'declined';
export type CommunityAdmissionRequirement = Readonly<{
    signal: 'server_member_count';
    minimum: number;
}>;
export type CommunityAdmissionPolicy = Readonly<{
    revision: number;
    mode: 'manual' | 'automatic';
    requirements: readonly CommunityAdmissionRequirement[];
}>;
export type CommunityAdmissionEvidence = Readonly<{
    revision: number;
    guildId: string;
    connectionVerifiedAtUtc: string | null;
    serverOwnerVerified: boolean;
    memberCount?: CommunityMemberCountReceipt | null;
}>;
export type CommunityAdmissionEvaluation = Readonly<{
    status: 'pending' | 'approved';
    reason: 'manual_review' | 'requirements_not_configured' | 'unsupported_evidence' | 'connection_unverified' | 'stale_evidence' | 'below_minimum' | 'requirements_met';
    policyRevision: number;
    evidenceRevision: number;
}>;
export type CommunityAdmissionFacts = Readonly<{
    version: 1;
    guildId: string;
    connection: Readonly<{
        state: 'verified' | 'unverified';
        verifiedAtUtc: string | null;
    }>;
    admission: Readonly<{
        status: CommunityAdmissionStatus;
        decisionSource: 'owner' | 'automatic' | 'legacy_allowlist' | null;
        decisionRevision: number | null;
        policyRevision: number | null;
        decidedAtUtc: string | null;
    }>;
    /** No inference from linking, launch allowlist, active status or admission. */
    coachingExemption: Readonly<{
        state: 'unassessed' | 'eligible' | 'ineligible';
    }>;
}>;
export const DEFAULT_COMMUNITY_ADMISSION_POLICY: CommunityAdmissionPolicy = Object.freeze({
    revision: 0, mode: 'manual', requirements: Object.freeze([]),
});
export type CommunityOwnerDecision = Readonly<{
    revision: number;
    kind: 'admission' | 'coaching_exemption';
    status: 'pending' | 'approved' | 'declined';
    reason: string;
    actorUserId: string;
    decidedAtUtc: string;
    admissionRevision: number | null;
    source: 'owner' | 'automatic';
}>;
export type CommunityAdmissionEntry = Readonly<{
    guildId: string;
    displayName: string;
    invitedAtUtc: string;
    invitationReason: string;
    invitedByUserId: string;
    admission: CommunityOwnerDecision | null;
    exemption: CommunityOwnerDecision | null;
    memberCount: CommunityMemberCountReceipt | null;
    newConnectionAllowed: boolean;
}>;
export type CommunityAdmissionAdminSnapshot = Readonly<{
    available: boolean;
    entries: readonly CommunityAdmissionEntry[];
    hasMore: boolean;
    policy: CommunityAdmissionPolicy;
}>;
export type CommunityAdmissionCommand = {
    action: 'invite';
    guildId: string;
    displayName: string;
    reason: string;
} | {
    action: 'decide';
    guildId: string;
    kind: 'admission' | 'coaching_exemption';
    status: 'pending' | 'approved' | 'declined';
    expectedRevision: number;
    expectedAdmissionRevision?: number | null;
    reason: string;
} | {
    action: 'policy';
    expectedRevision: number;
    mode: 'manual' | 'automatic';
    minimumMembers: number | null;
    reason: string;
};
/** Consumer fact for new business only. No notes, grants, roles or payment policy. */
export type CommunityCoachingExemptionFact = Readonly<{
    version: 1;
    available: boolean;
    state: 'unassessed' | 'eligible' | 'ineligible';
    admissionRevision: number | null;
    exemptionRevision: number | null;
}>;
/** Discord's approximate TOTAL includes bots; it is not human/activity/quality evidence. */
export type CommunityMemberCountReceipt = Readonly<{
    receiptId: string;
    guildId: string;
    source: 'discord_bot_guild_with_counts';
    approximateTotalMembers: number;
    observedAtUtc: string;
}>;
export type CommunityCountCollectionCommand = Readonly<{
    action: 'collect_count';
    guildId: string;
    expectedPolicyRevision: number;
    expectedAdmissionRevision: number;
}>;
